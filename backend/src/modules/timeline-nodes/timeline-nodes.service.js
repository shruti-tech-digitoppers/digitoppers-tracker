const TimelineNodeStatic = require('./timeline-node.model');
const timelineConfig = require('../../config/timeline');

class TimelineNodesService {
  /**
   * Check if a stage has substages
   * @param {string} stageId
   * @returns {Promise<boolean>}
   */
  async hasSubstages(stageId) {
    return await TimelineNodeStatic.hasSubstages(stageId);
  }

  /**
   * Get all static timeline nodes with optional filtering
   * @param {Object} filter
   */
  async getAllNodes(filter = {}) {
    const query = {};
    if (filter.title) {
      const titleLower = filter.title.toLowerCase();
      query.title = titleLower === 'task' ? 'tasks' : titleLower;
    }
    if (filter.parent_id !== undefined) {
      query.parent_id = filter.parent_id === 'null' ? null : filter.parent_id;
    }
    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { id: { $regex: filter.search, $options: 'i' } }
      ];
    }
    return await TimelineNodeStatic.find(query).sort({ order: 1, createdAt: 1 }).lean();
  }

  /**
   * Get single node by id (string key) or _id
   * @param {string} id
   */
  async getNodeById(id) {
    if (!id) return null;
    return await TimelineNodeStatic.findOne({
      $or: [{ id: id }, { id: id.toUpperCase() }, { id: id.toLowerCase() }]
    }).lean();
  }

  /**
   * Get complete hierarchical tree:
   * Stages -> (Substages -> Tasks) OR (Direct Tasks)
   */
  async getHierarchyTree() {
    // 1. Fetch all stages
    const stages = await TimelineNodeStatic.find({ title: 'stage' }).sort({ order: 1 }).lean();

    // 2. Build tree for each stage
    const tree = await Promise.all(stages.map(async (stage) => {
      // Check if this stage has substages
      const stageHasSubstages = stage.has_substages || (await this.hasSubstages(stage.id));

      if (stageHasSubstages) {
        // Fetch substages for this stage
        const substages = await TimelineNodeStatic.find({
          parent_id: stage.id,
          title: 'substage'
        }).sort({ order: 1 }).lean();

        // For each substage, fetch its tasks
        const substagesWithTasks = await Promise.all(substages.map(async (sub) => {
          const tasks = await TimelineNodeStatic.find({
            parent_id: sub.id,
            title: { $in: ['tasks', 'task'] }
          }).sort({ order: 1 }).lean();

          return {
            ...sub,
            tasks
          };
        }));

        return {
          ...stage,
          has_substages: true,
          substages: substagesWithTasks
        };
      } else {
        // Stage has NO substages: tasks directly attach to stage.id
        const tasks = await TimelineNodeStatic.find({
          parent_id: stage.id,
          title: { $in: ['tasks', 'task'] }
        }).sort({ order: 1 }).lean();

        return {
          ...stage,
          has_substages: false,
          substages: [],
          tasks
        };
      }
    }));

    return tree;
  }

  /**
   * Create a new static node applying the required parent_id resolution rule:
   * - If title === 'stage' -> parent_id = null
   * - If title === 'substage' -> parent_id = stageId
   * - If title === 'tasks' / 'task':
   *     - If stage has substages -> parent_id = substageId
   *     - If stage has NO substages -> parent_id = stageId
   *
   * @param {Object} nodeData
   */
  async createNode(nodeData) {
    const { id, name, title, order = 1, parent_id, stageId, substageId, formSchema, metadata } = nodeData;

    if (!id || !name || !title) {
      throw new Error("Fields 'id', 'name', and 'title' (stage/substage/tasks) are required.");
    }

    const titleLower = title.toLowerCase() === 'task' ? 'tasks' : title.toLowerCase();
    let finalParentId = parent_id || null;
    let hasSubstagesFlag = false;

    if (titleLower === 'stage') {
      finalParentId = null;
      hasSubstagesFlag = Boolean(nodeData.has_substages);
    } else if (titleLower === 'substage') {
      const targetStageId = stageId || parent_id;
      if (!targetStageId) {
        throw new Error("A substage must have a parent stage ('stageId' or 'parent_id').");
      }
      finalParentId = targetStageId;

      // Update parent stage flag has_substages = true
      await TimelineNodeStatic.updateOne({ id: targetStageId }, { $set: { has_substages: true } });
    } else if (titleLower === 'tasks') {
      // User's specific rule:
      // "ek function substages? if yes then task uski parent_id mein aaega substage ki id
      //  and substage ke parent mein aaegi stage.....
      //  if not has substage then task ki parent mein aaega stageid."
      const effectiveStageId = stageId || (substageId ? null : parent_id);

      if (effectiveStageId) {
        const stageHasSub = await this.hasSubstages(effectiveStageId);
        if (stageHasSub) {
          if (!substageId && (!parent_id || parent_id === effectiveStageId)) {
            throw new Error(`Stage '${effectiveStageId}' has substages. Task parent_id must be the substage ID.`);
          }
          finalParentId = substageId || parent_id;
        } else {
          // No substages: task belongs directly to stage
          finalParentId = effectiveStageId;
        }
      } else if (substageId) {
        finalParentId = substageId;
      }
    }

    const newNode = await TimelineNodeStatic.create({
      id,
      name,
      title: titleLower,
      type: titleLower,
      order: Number(order) || 1,
      parent_id: finalParentId,
      has_substages: hasSubstagesFlag,
      formSchema: formSchema || null,
      metadata: metadata || {}
    });

    return newNode;
  }

  /**
   * Update an existing static node
   */
  async updateNode(id, updateData) {
    const node = await TimelineNodeStatic.findOne({ id });
    if (!node) {
      throw new Error(`Node with id '${id}' not found.`);
    }

    if (updateData.name) node.name = updateData.name;
    if (updateData.order !== undefined) node.order = Number(updateData.order);
    if (updateData.formSchema !== undefined) node.formSchema = updateData.formSchema;
    if (updateData.metadata !== undefined) node.metadata = { ...node.metadata, ...updateData.metadata };
    if (updateData.parent_id !== undefined) node.parent_id = updateData.parent_id;
    if (updateData.has_substages !== undefined) node.has_substages = Boolean(updateData.has_substages);

    await node.save();
    return node;
  }

  /**
   * Delete node and optionally its descendants
   */
  async deleteNode(id) {
    const node = await TimelineNodeStatic.findOne({ id });
    if (!node) {
      throw new Error(`Node with id '${id}' not found.`);
    }

    // Delete node
    await TimelineNodeStatic.deleteOne({ id });

    // Delete direct children whose parent_id was this node
    const deletedChildren = await TimelineNodeStatic.deleteMany({ parent_id: id });

    return {
      success: true,
      deletedId: id,
      deletedChildrenCount: deletedChildren.deletedCount
    };
  }

  /**
   * Seed static timeline nodes from timelineConfig
   * Populates 8 master stages, substages, and tasks into 'timeline_nodes' collection
   * following the exact parent_id rule:
   * - If stage has substages:
   *     substage.parent_id = stage.id
   *     task.parent_id = substage.id
   * - If stage has NO substages:
   *     task.parent_id = stage.id
   *
   * @param {boolean} forceReset
   */
  async seedStaticTimelineNodes(forceReset = false) {
    const existingCount = await TimelineNodeStatic.countDocuments();
    if (existingCount > 0 && !forceReset) {
      return { message: 'Static timeline nodes already initialized.', count: existingCount };
    }

    if (forceReset) {
      await TimelineNodeStatic.deleteMany({});
    }

    const stagesDef = timelineConfig.stages || [];
    let createdStages = 0;
    let createdSubstages = 0;
    let createdTasks = 0;

    for (const stageDef of stagesDef) {
      const stageId = stageDef.key;
      const stageName = stageDef.name;
      const stageOrder = stageDef.order || 1;
      const hasSub = Array.isArray(stageDef.substages) && stageDef.substages.length > 0;

      // 1. Create Stage Node
      await TimelineNodeStatic.findOneAndUpdate(
        { id: stageId },
        {
          id: stageId,
          name: stageName,
          title: 'stage',
          type: 'stage',
          order: stageOrder,
          parent_id: null,
          has_substages: hasSub,
          formSchema: stageDef.formSchema || null,
          metadata: stageDef.metadata || {}
        },
        { upsert: true, new: true }
      );
      createdStages++;

      if (hasSub) {
        // Stage HAS substages
        for (const subDef of stageDef.substages) {
          const substageId = subDef.key;
          const substageName = subDef.name;
          const substageOrder = subDef.order || 1;

          // 2. Create Substage Node: parent_id = stageId
          await TimelineNodeStatic.findOneAndUpdate(
            { id: substageId },
            {
              id: substageId,
              name: substageName,
              title: 'substage',
              type: 'substage',
              order: substageOrder,
              parent_id: stageId,
              has_substages: false,
              formSchema: subDef.formSchema || null,
              metadata: subDef.metadata || {}
            },
            { upsert: true, new: true }
          );
          createdSubstages++;

          // 3. Check for nested tasks under this substage
          if (Array.isArray(subDef.nested) && subDef.nested.length > 0) {
            for (const taskDef of subDef.nested) {
              const taskId = taskDef.key;
              const taskName = taskDef.name;
              const taskOrder = taskDef.order || 1;

              // Task parent_id = substageId
              await TimelineNodeStatic.findOneAndUpdate(
                { id: taskId },
                {
                  id: taskId,
                  name: taskName,
                  title: 'tasks',
                  type: 'tasks',
                  order: taskOrder,
                  parent_id: substageId,
                  formSchema: taskDef.formSchema || null,
                  metadata: taskDef.metadata || {}
                },
                { upsert: true, new: true }
              );
              createdTasks++;
            }
          } else {
            // Even if no subDef.nested, the substage itself acts as the actionable task
            // or we add a primary execution task under it
            const defaultTaskId = `TASK_${substageId}`;
            await TimelineNodeStatic.findOneAndUpdate(
              { id: defaultTaskId },
              {
                id: defaultTaskId,
                name: `${substageName} Execution`,
                title: 'tasks',
                type: 'tasks',
                order: 1,
                parent_id: substageId,
                formSchema: subDef.formSchema || null,
                metadata: subDef.metadata || {}
              },
              { upsert: true, new: true }
            );
            createdTasks++;
          }
        }
      } else {
        // Stage has NO substages:
        // Rule: "i not has stage then task ki parent mein aaega stageid."
        // Task parent_id = stageId directly!
        const directTaskId = `TASK_${stageId}`;
        await TimelineNodeStatic.findOneAndUpdate(
          { id: directTaskId },
          {
            id: directTaskId,
            name: `${stageName} Execution & Sign-off`,
            title: 'tasks',
            type: 'tasks',
            order: 1,
            parent_id: stageId,
            formSchema: stageDef.formSchema || null,
            metadata: stageDef.metadata || {}
          },
          { upsert: true, new: true }
        );
        createdTasks++;
      }
    }

    const total = await TimelineNodeStatic.countDocuments();
    return {
      message: 'Static timeline nodes seeded successfully in timeline_nodes collection.',
      summary: {
        createdStages,
        createdSubstages,
        createdTasks,
        totalInDb: total
      }
    };
  }
}

module.exports = new TimelineNodesService();


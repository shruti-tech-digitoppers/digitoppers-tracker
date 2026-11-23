const mongoose = require('mongoose');
const TimelineNodeStatic = require('./timeline-node.model');
const timelineConfig = require('../../config/timeline');

class TimelineNodesService {
  /**
   * Check if a stage has substages
   * @param {string|ObjectId} stageId
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
    if (filter.type) {
      const typeLower = filter.type.toLowerCase();
      query.type = typeLower === 'task' ? 'tasks' : typeLower;
    }
    if (filter.parentId !== undefined) {
      if (filter.parentId === 'null' || filter.parentId === null) {
        query.parentId = null;
      } else if (mongoose.isValidObjectId(filter.parentId)) {
        query.parentId = filter.parentId;
      }
    }
    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { timelineNodeId: { $regex: filter.search, $options: 'i' } }
      ];
    }
    return await TimelineNodeStatic.find(query).sort({ order: 1, createdAt: 1 }).lean();
  }

  /**
   * Get single node by timelineNodeId (string key) or _id (MongoDB ObjectId)
   * @param {string|ObjectId} id
   */
  async getNodeById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const query = mongoose.isValidObjectId(cleanId)
      ? { $or: [{ _id: cleanId }, { timelineNodeId: cleanId }, { timelineNodeId: cleanId.toUpperCase() }] }
      : { $or: [{ timelineNodeId: cleanId }, { timelineNodeId: cleanId.toUpperCase() }, { timelineNodeId: cleanId.toLowerCase() }] };
    return await TimelineNodeStatic.findOne(query).lean();
  }

  /**
   * Get complete hierarchical tree:
   * Stages -> (Substages -> Tasks) OR (Direct Tasks)
   * Strictly referencing children by parentId (MongoDB ObjectId)
   */
  async getHierarchyTree() {
    // 1. Fetch all stages
    const stages = await TimelineNodeStatic.find({ type: 'stage' }).sort({ order: 1 }).lean();

    // 2. Build tree for each stage
    const tree = await Promise.all(stages.map(async (stage) => {
      const stageHasSubstages = stage.has_substages || (await this.hasSubstages(stage._id));

      if (stageHasSubstages) {
        // Fetch substages for this stage referencing parentId (ObjectId)
        const substages = await TimelineNodeStatic.find({
          parentId: stage._id,
          type: 'substage'
        }).sort({ order: 1 }).lean();

        // For each substage, fetch its tasks referencing parentId (ObjectId)
        const substagesWithTasks = await Promise.all(substages.map(async (sub) => {
          const tasks = await TimelineNodeStatic.find({
            parentId: sub._id,
            type: { $in: ['tasks', 'task'] }
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
        // Stage has NO substages: tasks directly attach to stage._id
        const tasks = await TimelineNodeStatic.find({
          parentId: stage._id,
          type: { $in: ['tasks', 'task'] }
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
   * Create a new static node with parentId referencing MongoDB ObjectId
   * @param {Object} nodeData
   */
  async createNode(nodeData) {
    const rawId = nodeData.timelineNodeId || nodeData.id;
    const { name, type, order = 1, parentId, stageId, substageId, dueDate, completionDate } = nodeData;

    const nodeType = (type || 'tasks').toLowerCase();
    const cleanType = nodeType === 'task' ? 'tasks' : nodeType;

    if (!rawId || !name) {
      throw new Error("Fields 'timelineNodeId' and 'name' are required.");
    }

    let finalParentMongoId = null;
    let hasSubstagesFlag = false;

    if (cleanType === 'stage') {
      finalParentMongoId = null;
      hasSubstagesFlag = Boolean(nodeData.has_substages);
    } else if (cleanType === 'substage') {
      const targetStageRef = parentId || stageId;
      if (!targetStageRef) {
        throw new Error("A substage must have a parent stage ('stageId' or 'parentId').");
      }
      const stageDoc = await this.getNodeById(targetStageRef);
      if (!stageDoc) {
        throw new Error(`Parent stage '${targetStageRef}' not found.`);
      }
      finalParentMongoId = stageDoc._id;

      // Update parent stage flag has_substages = true
      await TimelineNodeStatic.updateOne({ _id: stageDoc._id }, { $set: { has_substages: true } });
    } else if (cleanType === 'tasks') {
      const targetRef = parentId || substageId || stageId;
      if (targetRef) {
        const parentDoc = await this.getNodeById(targetRef);
        if (parentDoc) {
          finalParentMongoId = parentDoc._id;
        }
      }
    }

    const newNode = await TimelineNodeStatic.create({
      timelineNodeId: String(rawId).trim(),
      name: String(name).trim(),
      type: cleanType,
      order: Number(order) || 1,
      parentId: finalParentMongoId,
      has_substages: hasSubstagesFlag
    });

    return newNode;
  }

  /**
   * Update an existing static node
   */
  async updateNode(id, updateData) {
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { timelineNodeId: id }] }
      : { timelineNodeId: id };

    const node = await TimelineNodeStatic.findOne(query);
    if (!node) {
      throw new Error(`Node with id '${id}' not found.`);
    }

    if (updateData.name) node.name = updateData.name;
    if (updateData.order !== undefined) node.order = Number(updateData.order);
    if (updateData.type) {
      const t = updateData.type.toLowerCase();
      node.type = t === 'task' ? 'tasks' : t;
    }
    if (updateData.has_substages !== undefined) node.has_substages = Boolean(updateData.has_substages);

    if (updateData.parentId !== undefined) {
      if (updateData.parentId === null) {
        node.parentId = null;
      } else {
        const parentDoc = await this.getNodeById(updateData.parentId);
        if (parentDoc) {
          node.parentId = parentDoc._id;
        }
      }
    }

    await node.save();
    return node;
  }

  /**
   * Delete node and its direct children
   */
  async deleteNode(id) {
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { timelineNodeId: id }] }
      : { timelineNodeId: id };

    const node = await TimelineNodeStatic.findOne(query);
    if (!node) {
      throw new Error(`Node with id '${id}' not found.`);
    }

    // Delete node
    await TimelineNodeStatic.deleteOne({ _id: node._id });

    // Delete direct children whose parentId was this node's _id
    const deletedChildren = await TimelineNodeStatic.deleteMany({ parentId: node._id });

    return {
      success: true,
      deletedId: node.timelineNodeId,
      deletedMongoId: node._id,
      deletedChildrenCount: deletedChildren.deletedCount
    };
  }

  /**
   * Seed static timeline nodes from timelineConfig
   * Populates 8 master stages, substages, and tasks into 'timeline_nodes' collection
   * Referencing parent nodes strictly by MongoDB ObjectId (parentId)
   *
   * @param {boolean} forceReset
   */
  async seedStaticTimelineNodes(forceReset = false) {
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
      
      const hasSub = stageDef.has_substages !== undefined
        ? Boolean(stageDef.has_substages)
        : (stageId === 'EXECUTION');

      // 1. Create Stage Node (parentId = null)
      const stageDoc = await TimelineNodeStatic.findOneAndUpdate(
        { timelineNodeId: stageId },
        {
          $set: {
            timelineNodeId: stageId,
            name: stageName,
            type: 'stage',
            order: stageOrder,
            parentId: null,
            has_substages: hasSub
          }
        },
        { upsert: true, new: true }
      );
      createdStages++;

      if (hasSub) {
        // Stage -> Substages -> Tasks
        const substages = stageDef.substages || [];
        for (const subDef of substages) {
          const substageId = subDef.key;
          const substageName = subDef.name;
          const substageOrder = subDef.order || 1;

          // 2. Create Substage Node: parentId = stageDoc._id (MongoDB ObjectId!)
          const substageDoc = await TimelineNodeStatic.findOneAndUpdate(
            { timelineNodeId: substageId },
            {
              $set: {
                timelineNodeId: substageId,
                name: substageName,
                type: 'substage',
                order: substageOrder,
                parentId: stageDoc._id, // Mongo _id reference!
                has_substages: false
              }
            },
            { upsert: true, new: true }
          );
          createdSubstages++;

          // 3. Create Tasks under this Substage: parentId = substageDoc._id (MongoDB ObjectId!)
          const nestedTasks = subDef.nested || subDef.tasks || [];
          for (const taskDef of nestedTasks) {
            const taskId = taskDef.key;
            const taskName = taskDef.name;
            const taskOrder = taskDef.order || 1;

            await TimelineNodeStatic.findOneAndUpdate(
              { timelineNodeId: taskId },
              {
                $set: {
                  timelineNodeId: taskId,
                  name: taskName,
                  type: 'tasks',
                  order: taskOrder,
                  parentId: substageDoc._id // Mongo _id reference!
                }
              },
              { upsert: true, new: true }
            );
            createdTasks++;
          }
        }
      } else {
        // Stage -> Tasks directly: parentId = stageDoc._id (MongoDB ObjectId!)
        const directTasks = stageDef.tasks || stageDef.substages || [];
        if (directTasks.length > 0) {
          for (const taskDef of directTasks) {
            const taskId = taskDef.key;
            const taskName = taskDef.name;
            const taskOrder = taskDef.order || 1;

            await TimelineNodeStatic.findOneAndUpdate(
              { timelineNodeId: taskId },
              {
                $set: {
                  timelineNodeId: taskId,
                  name: taskName,
                  type: 'tasks',
                  order: taskOrder,
                  parentId: stageDoc._id // Mongo _id reference!
                }
              },
              { upsert: true, new: true }
            );
            createdTasks++;
          }
        } else {
          const directTaskId = `TASK_${stageId}`;
          await TimelineNodeStatic.findOneAndUpdate(
            { timelineNodeId: directTaskId },
            {
              $set: {
                timelineNodeId: directTaskId,
                name: `${stageName} Execution & Sign-off`,
                type: 'tasks',
                order: 1,
                parentId: stageDoc._id // Mongo _id reference!
              }
            },
            { upsert: true, new: true }
          );
          createdTasks++;
        }
      }
    }

    const total = await TimelineNodeStatic.countDocuments();
    return {
      message: 'Normalized static timeline nodes seeded successfully in timeline_nodes collection.',
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

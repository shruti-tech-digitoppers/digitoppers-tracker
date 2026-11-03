const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Phase = require('../modules/phases/phase.model');
const Task = require('../modules/tasks/task.model');
const TaskFormData = require('../modules/tasks/task-form-data.model');
const TimelineNode = require('../modules/timeline/timeline-node.model');
const phasesService = require('../modules/phases/phases.service');

async function migratePhasesAndTasks() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digi-ops';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully!\n');

  // 1. Get all unique project codes from TimelineNodes or Projects
  const uniqueProjectIds = await TimelineNode.distinct('projectId');
  console.log(`Found ${uniqueProjectIds.length} projects with timeline nodes:`, uniqueProjectIds);

  let totalPhasesCreated = 0;
  let totalTasksCreated = 0;
  let totalFormsCreated = 0;

  for (const targetProjectId of uniqueProjectIds) {
    if (!targetProjectId) continue;
    console.log(`\n======================================================`);
    console.log(`🚀 Migrating Project: ${targetProjectId}`);
    console.log(`======================================================`);

    // Fetch all nodes for this project sorted by order
    const nodes = await TimelineNode.find({
      $or: [
        { projectId: targetProjectId },
        { projectId: targetProjectId.toLowerCase() },
        { projectId: targetProjectId.toUpperCase() }
      ]
    }).sort({ order: 1 });

    if (!nodes || nodes.length === 0) {
      console.log(`No nodes found for ${targetProjectId}. Skipping.`);
      continue;
    }

    // Resolve mongo project reference
    const rawProject = nodes.find(n => n.project)?.project;

    // Separate Stages (parent nodes) and Tasks
    const stageNodes = nodes.filter(n => n.type === 'STAGE' || !n.parentNode);
    const subTaskNodes = nodes.filter(n => n.type === 'TASK' && n.parentNode);

    console.log(`Found ${stageNodes.length} Stage nodes and ${subTaskNodes.length} Task nodes.`);

    // Map to hold created Phase documents: stageNodeId -> PhaseDoc
    const stageToPhaseMap = new Map();
    const nodeKeyToPhaseMap = new Map();

    // 1. Create/Update Phases
    for (const sNode of stageNodes) {
      const phaseDoc = await Phase.findOneAndUpdate(
        {
          projectId: targetProjectId.toUpperCase(),
          phaseKey: sNode.key.toUpperCase()
        },
        {
          project: rawProject || sNode.project,
          projectId: targetProjectId.toUpperCase(),
          phaseKey: sNode.key.toUpperCase(),
          title: sNode.name,
          order: sNode.order,
          status: sNode.status || 'PENDING',
          assignedTo: sNode.assignedTo || null,
          dependencies: sNode.dependencies || [],
          metadata: sNode.metadata || {}
        },
        { upsert: true, new: true }
      );

      stageToPhaseMap.set(String(sNode._id), phaseDoc);
      nodeKeyToPhaseMap.set(sNode.key.toUpperCase(), phaseDoc);
      totalPhasesCreated++;
    }

    // Map to hold created Task documents: taskNodeId -> TaskDoc
    const nodeToTaskMap = new Map();

    // Helper to find Phase for any node (walk up parentNode chain)
    const findPhaseForNode = (node) => {
      let curr = node;
      while (curr && curr.parentNode) {
        const parent = nodes.find(n => String(n._id) === String(curr.parentNode));
        if (!parent) break;
        if (stageToPhaseMap.has(String(parent._id))) {
          return stageToPhaseMap.get(String(parent._id));
        }
        curr = parent;
      }
      return null;
    };

    // 2. Create Level-1 Tasks (direct children of Stage)
    const level1Tasks = subTaskNodes.filter(n => stageToPhaseMap.has(String(n.parentNode)));
    for (const tNode of level1Tasks) {
      const phaseDoc = stageToPhaseMap.get(String(tNode.parentNode));

      const isHardware = tNode.key.toUpperCase().includes('HARDWARE') || tNode.name.toLowerCase().includes('hardware');
      const isTech = tNode.key.toUpperCase().includes('TECH') || tNode.name.toLowerCase().includes('tech');
      const isContent = tNode.key.toUpperCase().includes('CONTENT') || tNode.name.toLowerCase().includes('content');

      let streamType = null;
      if (isHardware) streamType = 'HARDWARE';
      else if (isTech) streamType = 'TECH';
      else if (isContent) streamType = 'CONTENT';

      const taskDoc = await Task.findOneAndUpdate(
        {
          projectId: targetProjectId.toUpperCase(),
          taskKey: tNode.key.toUpperCase()
        },
        {
          project: rawProject || tNode.project,
          projectId: targetProjectId.toUpperCase(),
          phase: phaseDoc._id,
          parentTask: null,
          taskKey: tNode.key.toUpperCase(),
          title: tNode.name,
          order: tNode.order,
          status: tNode.status || 'PENDING',
          assignedTo: tNode.assignedTo || null,
          streamType: streamType,
          isStreamRoot: Boolean(streamType && (tNode.children && tNode.children.length > 0)),
          formKey: tNode.key,
          formSchema: tNode.formSchema || null,
          dependencies: tNode.dependencies || [],
          timelineNodeId: tNode._id,
          metadata: tNode.metadata || {}
        },
        { upsert: true, new: true }
      );

      nodeToTaskMap.set(String(tNode._id), taskDoc);
      totalTasksCreated++;

      // Save form data if available
      if (tNode.formData && Object.keys(tNode.formData).length > 0) {
        await TaskFormData.findOneAndUpdate(
          { task: taskDoc._id },
          {
            project: rawProject || tNode.project,
            projectId: targetProjectId.toUpperCase(),
            phase: phaseDoc._id,
            task: taskDoc._id,
            taskKey: taskDoc.taskKey,
            submittedBy: tNode.assignedTo || null,
            inputs: tNode.formData,
            version: 1
          },
          { upsert: true, new: true }
        );
        totalFormsCreated++;
      }
    }

    // 3. Create Nested Tasks (children of Level-1 tasks, e.g. stream sub-tasks)
    const nestedTasks = subTaskNodes.filter(n => !stageToPhaseMap.has(String(n.parentNode)));
    for (const nNode of nestedTasks) {
      const parentTaskDoc = nodeToTaskMap.get(String(nNode.parentNode));
      const phaseDoc = findPhaseForNode(nNode) || (parentTaskDoc ? parentTaskDoc.phase : null);

      if (!phaseDoc) {
        console.warn(`Could not determine phase for nested task: ${nNode.key}. Skipping.`);
        continue;
      }

      const streamType = parentTaskDoc ? parentTaskDoc.streamType : null;

      const taskDoc = await Task.findOneAndUpdate(
        {
          projectId: targetProjectId.toUpperCase(),
          taskKey: nNode.key.toUpperCase()
        },
        {
          project: rawProject || nNode.project,
          projectId: targetProjectId.toUpperCase(),
          phase: phaseDoc._id || phaseDoc,
          parentTask: parentTaskDoc ? parentTaskDoc._id : null,
          taskKey: nNode.key.toUpperCase(),
          title: nNode.name,
          order: nNode.order,
          status: nNode.status || 'PENDING',
          assignedTo: nNode.assignedTo || null,
          streamType: streamType,
          isStreamRoot: false,
          formKey: nNode.key,
          formSchema: nNode.formSchema || null,
          dependencies: nNode.dependencies || [],
          timelineNodeId: nNode._id,
          metadata: nNode.metadata || {}
        },
        { upsert: true, new: true }
      );

      nodeToTaskMap.set(String(nNode._id), taskDoc);
      totalTasksCreated++;

      // Save form data if available
      if (nNode.formData && Object.keys(nNode.formData).length > 0) {
        await TaskFormData.findOneAndUpdate(
          { task: taskDoc._id },
          {
            project: rawProject || nNode.project,
            projectId: targetProjectId.toUpperCase(),
            phase: phaseDoc._id || phaseDoc,
            task: taskDoc._id,
            taskKey: taskDoc.taskKey,
            submittedBy: nNode.assignedTo || null,
            inputs: nNode.formData,
            version: 1
          },
          { upsert: true, new: true }
        );
        totalFormsCreated++;
      }
    }

    // 4. Recalculate progress for all Phases in this project
    const projectPhases = await Phase.find({ projectId: targetProjectId.toUpperCase() });
    for (const ph of projectPhases) {
      await phasesService.recalculatePhaseProgress(ph._id);
    }

    console.log(`Completed migration for ${targetProjectId}:`);
    console.log(`  - Phases: ${projectPhases.length}`);
    console.log(`  - Tasks: ${nodeToTaskMap.size}`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!`);
  console.log(`Total Phases stored: ${totalPhasesCreated}`);
  console.log(`Total Tasks stored: ${totalTasksCreated}`);
  console.log(`Total Task Form Data records stored: ${totalFormsCreated}`);
  console.log(`======================================================\n`);

  process.exit(0);
}

migratePhasesAndTasks().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

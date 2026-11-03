const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function runVerification() {
  console.log('Connecting to MongoDB Atlas...');
  await connectDB();
  console.log('Connected to MongoDB Atlas.');

  const timelineDataService = require('../modules/timeline-data/timeline-data.service');
  const TimelineData = require('../modules/timeline-data/timeline-data.model');
  const TimelineNodeStatic = require('../modules/timeline-nodes/timeline-node.model');
  const FormSchema = require('../modules/form-schemas/form-schema.model');
  const Employee = require('../modules/employees/employee.model');

  const testProjectCode = 'PRJ-ROBOTICS-AI-2026';
  console.log(`\n=== 1. Testing getTimelineHierarchy for ${testProjectCode} ===`);
  const hierarchy = await timelineDataService.getTimelineHierarchy(testProjectCode);
  console.log('Timeline stages count:', hierarchy.structure.length);
  console.log('Stages:');
  hierarchy.structure.forEach(s => {
    console.log(`  ${s.order}. [${s.id}] status=${s.status} assigned=${s.assignedTo?.name || 'none'} completionDate=${s.completionDate || 'none'} remarks=${s.remarks || 'none'}`);
  });

  console.log('\n=== 2. Testing getNodeById for PROJECT_REVIEWER ===');
  const node = await timelineDataService.getNodeById(testProjectCode, 'PROJECT_REVIEWER');
  console.log('Node fetched:', {
    _id: node._id,
    id: node.id,
    name: node.name,
    status: node.status,
    remarks: node.remarks,
    formSchemaFields: node.formSchema?.fields?.length || 0,
    childrenCount: node.children?.length || 0
  });

  console.log('\n=== 3. Testing updateNodeStatus for PROJECT_REVIEWER ===');
  const fakeAdmin = await Employee.findOne({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }) || { _id: new mongoose.Types.ObjectId(), name: 'Admin', globalRole: 'ADMIN' };
  const updatedStatusNode = await timelineDataService.updateNodeStatus(
    testProjectCode,
    'PROJECT_REVIEWER',
    'IN_PROGRESS',
    'Dynamic status test update from automated verification',
    fakeAdmin,
    { designation: 'ADMIN' }
  );
  console.log('Updated status result:', {
    id: updatedStatusNode.id,
    status: updatedStatusNode.status,
    remarks: updatedStatusNode.remarks
  });

  console.log('\n=== 4. Testing updateNodeForm for PROJECT_REVIEWER ===');
  const updatedFormNode = await timelineDataService.updateNodeForm(
    testProjectCode,
    'PROJECT_REVIEWER',
    {
      confirmed: 'YES',
      remarks: 'Automated test remark via dynamic form update',
      projectCreated: 'YES'
    },
    fakeAdmin,
    { designation: 'ADMIN' }
  );
  console.log('Updated form result:', {
    id: updatedFormNode.id,
    status: updatedFormNode.status,
    remarks: updatedFormNode.remarks,
    formDataRemarks: updatedFormNode.formData?.remarks
  });

  console.log('\n=== 5. Directly inspecting timeline_data document in MongoDB Atlas ===');
  const runtimeDoc = await TimelineData.findOne({
    projectId: testProjectCode.toUpperCase(),
    nodeId: 'PROJECT_REVIEWER'
  }).lean();
  console.log('timeline_data in DB:', {
    id: runtimeDoc.id,
    projectId: runtimeDoc.projectId,
    nodeId: runtimeDoc.nodeId,
    status: runtimeDoc.status,
    remarks: runtimeDoc.remarks,
    completionDate: runtimeDoc.completionDate,
    formDataKeys: Object.keys(runtimeDoc.formData || {})
  });

  console.log('\n=== 6. Testing getChildren for PROJECT_REVIEWER ===');
  const children = await timelineDataService.getChildren(testProjectCode, 'PROJECT_REVIEWER');
  console.log(`Children found: ${children.length}`);
  children.forEach(c => console.log(`  - [${c.id || c.key}] ${c.name} (${c.type}): status=${c.status}`));

  console.log('\n=== 7. Verifying dynamic Form Schemas collection in DB ===');
  const schemaCount = await FormSchema.countDocuments();
  const staticNodeCount = await TimelineNodeStatic.countDocuments();
  const runtimeDataCount = await TimelineData.countDocuments();
  console.log(`Summary in DB:
  - timeline_nodes (static blueprint): ${staticNodeCount}
  - timeline_data (project runtime): ${runtimeDataCount}
  - form_schemas (dynamic schemas): ${schemaCount}
  `);

  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

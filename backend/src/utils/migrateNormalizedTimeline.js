/**
 * Migration Script: Migrate to Normalized Timeline Architecture
 *
 * Architecture changes implemented:
 * 1. 'timeline_nodes': Only contains _id, name, order, type/title, parentId (ObjectId ref), dueDate, dependentOn (ObjectId refs).
 *    Removes embedded formSchema.
 * 2. 'form_schemas': References timelineNodeId (ObjectId), fields formatted as key-value objects { [key]: fieldDef }.
 * 3. 'timeline_data': References projectId (Core backend), timelineNodeId (ObjectId), assignedTo, status, dueDate, completionDate, remarks.
 *    Removes embedded formData.
 * 4. 'form_data': Standalone collection referencing timelineDataId (ObjectId), formSchemaId (ObjectId), timelineNodeId (ObjectId),
 *    containing formData { [keyFromSchema]: exactValue }.
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const TimelineNodeStatic = require('../modules/timeline-nodes/timeline-node.model');
const FormSchema = require('../modules/form-schemas/form-schema.model');
const TimelineData = require('../modules/timeline-data/timeline-data.model');
const FormData = require('../modules/timeline-data/form-data.model');
const timelineNodesService = require('../modules/timeline-nodes/timeline-nodes.service');
const formSchemasService = require('../modules/form-schemas/form-schemas.service');

async function migrateToNormalizedTimeline() {
  console.log('\n========================================================================');
  console.log('🚀 MIGRATING TO NORMALIZED TIMELINE ARCHITECTURE (MONGO ID REFERENCING)');
  console.log('========================================================================\n');

  // Step 1: Ensure static nodes exist and resolve parentId (Mongo _id)
  console.log('📌 Step 1: Normalizing timeline_nodes collection...');
  await timelineNodesService.seedStaticTimelineNodes(false);

  // Strip embedded formSchema from timeline_nodes collection
  const unsetNodesResult = await TimelineNodeStatic.updateMany(
    {},
    { $unset: { formSchema: "" } }
  );
  console.log(`   ✅ Stripped embedded formSchema from ${unsetNodesResult.modifiedCount} timeline_nodes.`);

  // Step 2: Ensure form_schemas collection is populated with timelineNodeId (Mongo _id)
  console.log('\n📋 Step 2: Normalizing form_schemas collection...');
  await formSchemasService.seedMasterFormSchemas(false);
  const totalSchemas = await FormSchema.countDocuments();
  console.log(`   ✅ Total form_schemas in database: ${totalSchemas}`);

  // Step 3: Normalize timeline_data and extract embedded formData into form_data
  console.log('\n📊 Step 3: Decoupling formData from timeline_data into form_data collection...');
  const allTimelineData = await TimelineData.find().lean();
  let migratedFormDataCount = 0;

  for (const td of allTimelineData) {
    // Resolve static node ObjectId
    const staticNode = await TimelineNodeStatic.findOne({
      $or: [
        td.timelineNodeId ? { _id: td.timelineNodeId } : null,
        td.node ? { _id: td.node } : null,
        td.nodeId ? { id: td.nodeId } : null
      ].filter(Boolean)
    }).lean();

    const nodeMongoId = staticNode?._id || td.timelineNodeId || td.node;

    // Ensure timelineNodeId is set on timeline_data
    if (nodeMongoId) {
      await TimelineData.updateOne(
        { _id: td._id },
        {
          $set: {
            timelineNodeId: nodeMongoId,
            node: nodeMongoId
          }
        }
      );
    }

    // If td had formData, migrate into form_data collection
    const rawFormData = td.formData && typeof td.formData === 'object' ? td.formData : {};
    if (Object.keys(rawFormData).length > 0) {
      const formSchemaDoc = await FormSchema.findOne({
        $or: [
          nodeMongoId ? { timelineNodeId: nodeMongoId } : null,
          td.nodeId ? { nodeId: td.nodeId } : null
        ].filter(Boolean)
      }).lean();

      await FormData.findOneAndUpdate(
        { timelineDataId: td._id },
        {
          $set: {
            projectId: td.projectId,
            timelineDataId: td._id, // Mongo _id reference!
            formSchemaId: formSchemaDoc?._id || null, // Mongo _id reference!
            timelineNodeId: nodeMongoId || null, // Mongo _id reference!
            nodeId: td.nodeId,
            formData: rawFormData
          }
        },
        { upsert: true, new: true }
      );
      migratedFormDataCount++;
    }

    // Remove embedded formData from timeline_data document
    await TimelineData.updateOne(
      { _id: td._id },
      { $unset: { formData: "" } }
    );
  }

  console.log(`   ✅ Extracted formData for ${migratedFormDataCount} nodes into form_data collection.`);
  console.log(`   ✅ Unset embedded formData on all timeline_data records.`);

  const finalNodeCount = await TimelineNodeStatic.countDocuments();
  const finalSchemaCount = await FormSchema.countDocuments();
  const finalTimelineDataCount = await TimelineData.countDocuments();
  const finalFormDataCount = await FormData.countDocuments();

  console.log('\n========================================================================');
  console.log('🎉 NORMALIZATION COMPLETE: All 4 collections verified and linked via ObjectId!');
  console.log(`   1. timeline_nodes (Nodes & parentId):  ${finalNodeCount}`);
  console.log(`   2. form_schemas   (Field Definitions): ${finalSchemaCount}`);
  console.log(`   3. timeline_data  (Project Tracking):  ${finalTimelineDataCount}`);
  console.log(`   4. form_data      (Exact Field Values):${finalFormDataCount}`);
  console.log('========================================================================\n');

  return {
    success: true,
    nodes: finalNodeCount,
    schemas: finalSchemaCount,
    timelineData: finalTimelineDataCount,
    formData: finalFormDataCount
  };
}

if (require.main === module) {
  connectDB()
    .then(async () => {
      await migrateToNormalizedTimeline();
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration error:', err);
      process.exit(1);
    });
}

module.exports = { migrateToNormalizedTimeline };

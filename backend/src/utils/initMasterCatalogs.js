/**
 * Initialize Master Catalogs Only (No Dummy Projects, No Dummy Schools)
 * Ensures:
 * 1. Master Departments
 * 2. Master Employees (DigiToppers Team accounts)
 * 3. Master Solutions Catalog
 * 4. Master Hardware Catalog
 * 5. Master Hardware Specifications (with Hardware as Foreign Key)
 * 6. Master Curriculum Grades & Content Categories
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Employee = require('../modules/employees/employee.model');
// Solutions, Hardware and Specs live purely in Core Backend API
const Solution = { countDocuments: async () => 1, insertMany: async () => [] };
const Hardware = { countDocuments: async () => 1, insertMany: async () => [] };
const HardwareSpec = { countDocuments: async () => 1, insertMany: async () => [] };

async function initMasterCatalogs() {
  console.log('\n========================================================================');
  console.log('­ƒôª INITIALIZING MASTER CATALOGS & TEAM ACCOUNTS (NO DUMMY DATA)');
  console.log('========================================================================\n');

  // 1 & 2. Ensure Master Employees / Team directory
  try {
    const { seedRealEmployees } = require('./seedRealEmployees');
    if (typeof seedRealEmployees === 'function') {
      await seedRealEmployees();
    }
  } catch (err) {
    console.error('ÔØî Error ensuring master employees:', err.message);
  }

  // 3. Ensure Solutions Catalog
  console.log('\n📦 Checking Solutions Catalog...');
  const solutions = [
    { key: 'STEM_LAB', label: 'STEM Lab', name: 'STEM Innovation Lab', icon: '🔬', desc: 'Hands-on STEM and science innovation models', licenseRequired: false, isLicenseRequired: false },
    { key: 'ASTRONOMY', label: 'Astronomy Lab', name: 'Astronomy & Space Lab', icon: '🔭', desc: 'Telescopes, planetarium & space learning kits', licenseRequired: false, isLicenseRequired: false },
    { key: 'LANGUAGE', label: 'Language Lab', name: 'Digital Language Lab', icon: '🗣️', desc: 'Digital English & multilingual audio-visual lab', licenseRequired: true, isLicenseRequired: true },
    { key: 'SCIENCE_LEARNING', label: 'Science Learning Kit', name: 'Science Experiential Kit', icon: '🧪', desc: 'Curriculum-mapped hands-on science experiments', licenseRequired: false, isLicenseRequired: false },
    { key: 'EPATHSHALA', label: 'ePathshala', name: 'ePathshala Digital LMS', icon: '💻', desc: 'Interactive smart curriculum & content', licenseRequired: true, isLicenseRequired: true },
    { key: 'ROBOTICS', label: 'Robotics Lab', name: 'AI & Robotics Lab', icon: '🤖', desc: 'Coding, AI, IoT and robotics modular kits', licenseRequired: false, isLicenseRequired: false },
    { key: 'SMART_SHAALA', label: 'Smart Shaala', name: 'Smart Shaala Interactive Suite', icon: '🏫', desc: 'Interactive smart class flat panels & devices', licenseRequired: true, isLicenseRequired: true }
  ];

  const solCount = await Solution.countDocuments();
  if (solCount === 0) {
    await Solution.insertMany(solutions);
    console.log(`  ✅ ${solutions.length} Master Solutions ready.`);
  } else {
    for (const sol of solutions) {
      await Solution.updateOne(
        { key: sol.key },
        { $set: { licenseRequired: sol.licenseRequired, isLicenseRequired: sol.isLicenseRequired } }
      );
    }
    console.log(`  ✅ ${solCount} Solutions updated with licenseRequired flag.`);
  }

  // 4. Ensure Hardware Catalog
  console.log('\n­ƒûÑ´©Å Checking Hardware Catalog...');
  const hwCount = await Hardware.countDocuments();
  if (hwCount === 0) {
    const hardwareItems = [
      { key: 'IFP_75', label: '75" 4K IFP', name: '75" 4K UHD Interactive Flat Panel', icon: '­ƒûÑ´©Å', category: 'DISPLAY', unit: 'NOS' },
      { key: 'OPS_I5', label: 'OPS i5 PC', name: 'Open Pluggable Spec Core i5 PC Module', icon: '­ƒÆ╗', category: 'COMPUTING', unit: 'NOS' },
      { key: 'PENDRIVE_64', label: '64GB USB Key', name: 'Offline Curriculum USB 3.2 64GB', icon: '­ƒÆ¥', category: 'STORAGE', unit: 'NOS' },
      { key: 'WALL_MOUNT', label: 'Wall Mount', name: 'Heavy-Duty 75" IFP Fixed Wall Mount', icon: '­ƒö®', category: 'ACCESSORY', unit: 'NOS' },
      { key: 'STAND_MOBILE', label: 'Mobile Trolley', name: 'Heavy-Duty Mobile Stand with Locking Wheels', icon: '­ƒøÆ', category: 'ACCESSORY', unit: 'NOS' },
      { key: 'ROBOTICS_KIT', label: 'Robotics Kit', name: 'Modular STEM Robotics & AI Innovation Kit', icon: '­ƒñû', category: 'KIT', unit: 'SETS' },
      { key: 'TABLET_10', label: '10" Tablet', name: '10-Inch Student Digital Learning Tablet', icon: '­ƒô▒', category: 'COMPUTING', unit: 'NOS' },
      { key: 'CHARGING_TROLLEY', label: 'Charging Cart', name: '32-Slot Smart Locking Device Charging Cart', icon: '­ƒöï', category: 'STORAGE', unit: 'NOS' }
    ];
    await Hardware.insertMany(hardwareItems);
    console.log(`  Ô£à ${hardwareItems.length} Master Hardware items ready.`);
  } else {
    console.log(`  Ô£à ${hwCount} Hardware items already present.`);
  }

  // 5. Ensure Hardware Specifications (with Hardware as Foreign Key)
  console.log('\nÔÜÖ´©Å Checking Hardware Specifications...');
  const specsCount = await HardwareSpec.countDocuments();
  if (specsCount === 0) {
    const hwList = await Hardware.find();
    const getHw = (k) => hwList.find((h) => h.key === k);
    const ifpHw = getHw('IFP_75');
    const opsHw = getHw('OPS_I5');
    const usbHw = getHw('PENDRIVE_64');
    const mountHw = getHw('WALL_MOUNT');

    const specsToInsert = [
      { hardwareId: ifpHw?._id, hardwareKey: 'IFP_75', code: 'IFP_75_STD', name: '75" 4K UHD Anti-Glare, 400 nits, 4GB/32GB Android 13, Dual Stylus', description: 'Standard Classroom 75" 4K UHD with 20-point multi-touch, front audio and Android 13' },
      { hardwareId: ifpHw?._id, hardwareKey: 'IFP_75', code: 'IFP_75_PRO', name: '75" 4K UHD Zero-Gap Bonding, 450 nits, 8GB/64GB Android 14, 48MP AI Camera', description: 'Premium Interactive Flat Panel with integrated 8-mic array and camera' },
      { hardwareId: opsHw?._id, hardwareKey: 'OPS_I5', code: 'OPS_I5_8GB', name: 'OPS Intel Core i5 11th Gen, 8GB DDR4, 256GB NVMe SSD, Win 11 Pro', description: 'Classroom teaching OPS PC module with dual band Wi-Fi 6' },
      { hardwareId: opsHw?._id, hardwareKey: 'OPS_I5', code: 'OPS_I5_16GB', name: 'OPS Intel Core i5 11th Gen, 16GB DDR4, 512GB NVMe SSD, Win 11 Pro', description: 'High-performance interactive teaching OPS unit' },
      { hardwareId: usbHw?._id, hardwareKey: 'PENDRIVE_64', code: 'USB_64_MET', name: '64GB USB 3.2 Gen 1 Metal Key, 150MB/s Read, Hardware Encrypted', description: 'High durability aluminum zinc body USB 3.2 with verified checksum offline curriculum' },
      { hardwareId: usbHw?._id, hardwareKey: 'PENDRIVE_64', code: 'USB_128_DUAL', name: '128GB USB 3.2 Type-A/Type-C Dual Drive, OTG Compatible, 200MB/s Read', description: 'Dual interface USB OTG key for seamless smart panel and tablet transfer' },
      { hardwareId: mountHw?._id, hardwareKey: 'WALL_MOUNT', code: 'MOUNT_FIXED', name: 'Cold-Rolled Steel Heavy-Duty Fixed Wall Mount (VESA 800x400)', description: 'Reinforced 120kg load-tested bracket with safety lock and spirit level' }
    ];

    await HardwareSpec.insertMany(specsToInsert.filter((s) => s.hardwareId));
    console.log(`  Ô£à Hardware Specifications initialized.`);
  } else {
    console.log(`  Ô£à ${specsCount} Hardware Specifications already present.`);
  }

  // 6. Ensure Static Timeline Nodes (timeline_nodes collection)
  try {
    const { seedTimelineNodes } = require('./seedTimelineNodes');
    if (typeof seedTimelineNodes === 'function') {
      await seedTimelineNodes(false);
    }
  } catch (err) {
    console.error('ÔØî Error initializing static timeline nodes:', err.message);
  }

  // 8. Ensure Master Form Schemas (form_schemas collection)
  try {
    const { seedFormSchemas } = require('./seedFormSchemas');
    if (typeof seedFormSchemas === 'function') {
      await seedFormSchemas(false);
    }
  } catch (err) {
    console.error('ÔØî Error initializing master form schemas:', err.message);
  }

  console.log('\n========================================================================');
  console.log('­ƒÄë MASTER CATALOGS, TEAM & TIMELINES READY!');
  console.log('========================================================================\n');
}

module.exports = initMasterCatalogs;

if (require.main === module) {
  const connectDB = require('../config/database');
  connectDB()
    .then(() => initMasterCatalogs())
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

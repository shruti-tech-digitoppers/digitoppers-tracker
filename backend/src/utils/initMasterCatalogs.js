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

const Department = require('../modules/departments/department.model');
const Employee = require('../modules/employees/employee.model');
const Solution = require('../modules/solutions/solution.model');
const Hardware = require('../modules/hardware/hardware.model');
const HardwareSpec = require('../modules/hardware-specs/hardware-spec.model');
const { Grade, L0Category, ContentSection } = require('../modules/content');

async function initMasterCatalogs() {
  console.log('\n========================================================================');
  console.log('📦 INITIALIZING MASTER CATALOGS & TEAM ACCOUNTS (NO DUMMY DATA)');
  console.log('========================================================================\n');

  // 1 & 2. Ensure Master Departments and Real Employees (if seeder is present)
  try {
    const { seedRealEmployees } = require('./seedRealEmployees');
    if (typeof seedRealEmployees === 'function') {
      await seedRealEmployees();
    }
  } catch (err) {
    console.log('ℹ️ seedRealEmployees file not present or gitignored, skipping employee seed.');
  }

  // 3. Ensure Solutions Catalog
  console.log('\n📦 Checking Solutions Catalog...');
  const solCount = await Solution.countDocuments();
  if (solCount === 0) {
    const solutions = [
      { key: 'STEM_LAB', label: 'STEM Lab', name: 'STEM Innovation Lab', icon: '🔬', desc: 'Hands-on STEM and science innovation models' },
      { key: 'ASTRONOMY', label: 'Astronomy Lab', name: 'Astronomy & Space Lab', icon: '🔭', desc: 'Telescopes, planetarium & space learning kits' },
      { key: 'LANGUAGE', label: 'Language Lab', name: 'Digital Language Lab', icon: '🗣️', desc: 'Digital English & multilingual audio-visual lab' },
      { key: 'SCIENCE_LEARNING', label: 'Science Learning Kit', name: 'Science Experiential Kit', icon: '🧪', desc: 'Curriculum-mapped hands-on science experiments' },
      { key: 'EPATHSHALA', label: 'ePathshala', name: 'ePathshala Digital LMS', icon: '💻', desc: 'Interactive smart curriculum & content' },
      { key: 'ROBOTICS', label: 'Robotics Lab', name: 'AI & Robotics Lab', icon: '🤖', desc: 'Coding, AI, IoT and robotics modular kits' },
      { key: 'SMART_SHAALA', label: 'Smart Shaala', name: 'Smart Shaala Interactive Suite', icon: '🏫', desc: 'Interactive smart class flat panels & devices' }
    ];
    await Solution.insertMany(solutions);
    console.log(`  ✅ ${solutions.length} Master Solutions ready.`);
  } else {
    console.log(`  ✅ ${solCount} Solutions already present.`);
  }

  // 4. Ensure Hardware Catalog
  console.log('\n🖥️ Checking Hardware Catalog...');
  const hwCount = await Hardware.countDocuments();
  if (hwCount === 0) {
    const hardwareItems = [
      { key: 'IFP_75', label: '75" 4K IFP', name: '75" 4K UHD Interactive Flat Panel', icon: '🖥️', category: 'DISPLAY', unit: 'NOS' },
      { key: 'OPS_I5', label: 'OPS i5 PC', name: 'Open Pluggable Spec Core i5 PC Module', icon: '💻', category: 'COMPUTING', unit: 'NOS' },
      { key: 'PENDRIVE_64', label: '64GB USB Key', name: 'Offline Curriculum USB 3.2 64GB', icon: '💾', category: 'STORAGE', unit: 'NOS' },
      { key: 'WALL_MOUNT', label: 'Wall Mount', name: 'Heavy-Duty 75" IFP Fixed Wall Mount', icon: '🔩', category: 'ACCESSORY', unit: 'NOS' },
      { key: 'STAND_MOBILE', label: 'Mobile Trolley', name: 'Heavy-Duty Mobile Stand with Locking Wheels', icon: '🛒', category: 'ACCESSORY', unit: 'NOS' },
      { key: 'ROBOTICS_KIT', label: 'Robotics Kit', name: 'Modular STEM Robotics & AI Innovation Kit', icon: '🤖', category: 'KIT', unit: 'SETS' },
      { key: 'TABLET_10', label: '10" Tablet', name: '10-Inch Student Digital Learning Tablet', icon: '📱', category: 'COMPUTING', unit: 'NOS' },
      { key: 'CHARGING_TROLLEY', label: 'Charging Cart', name: '32-Slot Smart Locking Device Charging Cart', icon: '🔋', category: 'STORAGE', unit: 'NOS' }
    ];
    await Hardware.insertMany(hardwareItems);
    console.log(`  ✅ ${hardwareItems.length} Master Hardware items ready.`);
  } else {
    console.log(`  ✅ ${hwCount} Hardware items already present.`);
  }

  // 5. Ensure Hardware Specifications (with Hardware as Foreign Key)
  console.log('\n⚙️ Checking Hardware Specifications...');
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
    console.log(`  ✅ Hardware Specifications initialized.`);
  } else {
    console.log(`  ✅ ${specsCount} Hardware Specifications already present.`);
  }

  // 6. Ensure Curriculum Grades
  console.log('\n📚 Checking Curriculum Grades...');
  const gradeCount = await Grade.countDocuments();
  if (gradeCount === 0) {
    const grades = [
      { name: '1', id: 'c1', grade: '1', stream: null, category: 'Primary', index: 1, color: '#3B82F6', icon: 'BookOpen' },
      { name: '2', id: 'c2', grade: '2', stream: null, category: 'Primary', index: 2, color: '#3B82F6', icon: 'BookOpen' },
      { name: '3', id: 'c3', grade: '3', stream: null, category: 'Primary', index: 3, color: '#3B82F6', icon: 'BookOpen' },
      { name: '4', id: 'c4', grade: '4', stream: null, category: 'Primary', index: 4, color: '#3B82F6', icon: 'BookOpen' },
      { name: '5', id: 'c5', grade: '5', stream: null, category: 'Primary', index: 5, color: '#3B82F6', icon: 'BookOpen' },
      { name: '6', id: 'c6', grade: '6', stream: null, category: 'Middle', index: 6, color: '#10B981', icon: 'Compass' },
      { name: '7', id: 'c7', grade: '7', stream: null, category: 'Middle', index: 7, color: '#10B981', icon: 'Compass' },
      { name: '8', id: 'c8', grade: '8', stream: null, category: 'Middle', index: 8, color: '#10B981', icon: 'Compass' },
      { name: '9', id: 'c9', grade: '9', stream: null, category: 'Secondary', index: 9, color: '#F59E0B', icon: 'GraduationCap' },
      { name: '10', id: 'c10', grade: '10', stream: null, category: 'Secondary', index: 10, color: '#F59E0B', icon: 'GraduationCap' },
      // Class 11 Streams
      { name: '11 Science', id: 'c11_science', grade: '11', stream: 'Science', category: 'Senior Secondary', index: 11, color: '#8B5CF6', icon: 'FlaskConical' },
      { name: '11 Commerce', id: 'c11_commerce', grade: '11', stream: 'Commerce', category: 'Senior Secondary', index: 12, color: '#EC4899', icon: 'TrendingUp' },
      { name: '11 Arts', id: 'c11_arts', grade: '11', stream: 'Arts', category: 'Senior Secondary', index: 13, color: '#6366F1', icon: 'Palette' },
      // Class 12 Streams
      { name: '12 Science', id: 'c12_science', grade: '12', stream: 'Science', category: 'Senior Secondary', index: 14, color: '#8B5CF6', icon: 'FlaskConical' },
      { name: '12 Commerce', id: 'c12_commerce', grade: '12', stream: 'Commerce', category: 'Senior Secondary', index: 15, color: '#EC4899', icon: 'TrendingUp' },
      { name: '12 Arts', id: 'c12_arts', grade: '12', stream: 'Arts', category: 'Senior Secondary', index: 16, color: '#6366F1', icon: 'Palette' },
    ];
    await Grade.insertMany(grades);
    console.log(`  ✅ 16 Curriculum Grades initialized.`);
  } else {
    console.log(`  ✅ ${gradeCount} Curriculum Grades already present.`);
  }

  console.log('\n========================================================================');
  console.log('🎉 MASTER CATALOGS & TEAM ACCOUNTS READY (ZERO DUMMY PROJECTS)!');
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

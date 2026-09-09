export const DEFAULT_SOLUTIONS = [
  { key: 'STEM_LAB', label: 'STEM Lab', icon: '🔬', desc: 'Hands-on STEM and science innovation models' },
  { key: 'ASTRONOMY', label: 'Astronomy Lab', icon: '🔭', desc: 'Telescopes, planetarium & space learning kits' },
  { key: 'LANGUAGE', label: 'Language Lab', icon: '🗣️', desc: 'Digital English & multilingual audio-visual lab' },
  { key: 'SCIENCE_LEARNING', label: 'Science Learning Kit', icon: '🧪', desc: 'Curriculum-mapped hands-on science experiments' },
  { key: 'EPATHSHALA', label: 'ePathshala', icon: '💻', desc: 'Digital LMS, interactive smart curriculum & content' },
  { key: 'ROBOTICS', label: 'Robotics Lab', icon: '🤖', desc: 'Coding, AI, IoT and robotics modular kits' },
  { key: 'SMART_SHAALA', label: 'Smart Shaala', icon: '🏫', desc: 'Interactive smart class flat panels & devices' },
];

export const DEFAULT_HARDWARE_ITEMS = [
  { key: 'IFP_PANEL', label: 'Interactive Flat Panel (65"/75")', icon: '🖥️', desc: '4K Touch Screen IFP Display with Android/OPS' },
  { key: 'STUDENT_TABLETS', label: 'Student Learning Tablets (10")', icon: '📱', desc: 'Ruggedized Android Tablets for classroom learning' },
  { key: 'CHARGING_CART', label: 'Smart Device Charging Cart', icon: '🔋', desc: '30-Slot lockable smart charging station' },
  { key: 'SERVER_MINI_PC', label: 'Mini PC / Central Lab Server', icon: '🖳', desc: 'Core i5 / 16GB RAM local content offline server' },
  { key: 'STEM_INNOVATION_KIT', label: 'STEM Lab Innovation Kits', icon: '🔬', desc: 'Hands-on mechanical & electrical DIY kits' },
  { key: 'ROBOTICS_IOT_KIT', label: 'Robotics & IoT Modular Kits', icon: '🤖', desc: 'Microcontrollers, sensors, motors & coding boards' },
  { key: 'ASTRONOMY_TELESCOPE', label: 'Astronomy Telescope & Space Kit', icon: '🔭', desc: 'Optical telescope with solar filter & starmaps' },
  { key: 'DIGITAL_SOUNDBAR', label: 'Digital Soundbar & Wireless Mic', icon: '🔊', desc: 'High-clarity classroom audio system' },
  { key: 'UPS_POWER_BACKUP', label: 'Online UPS / Power Backup', icon: '⚡', desc: 'Dedicated surge-protected UPS battery backup' },
  { key: 'NETWORKING_ROUTER', label: 'Gigabit Switch & Wi-Fi 6 Router', icon: '📶', desc: 'High-speed local networking hub' },
];

export function normalizeOption(opt: any): { value: string; label: string } {
  if (typeof opt === 'string') return { value: opt, label: opt };
  if (typeof opt === 'object' && opt !== null) {
    return { 
      value: String(opt.value ?? opt.key ?? opt), 
      label: String(opt.label ?? opt.name ?? opt.value ?? opt) 
    };
  }
  return { value: String(opt), label: String(opt) };
}

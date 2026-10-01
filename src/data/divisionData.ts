import { DivisionId, DivisionInfo } from '../types';

export interface WorkCategory {
  key: string;
  title: string;
  sub: string;
  icon: string;
  dept: string;
  division: DivisionId;
  tags: string[];
}

export const DIVISIONS: Record<DivisionId, DivisionInfo> = {
  '84': {
    id: '84',
    code: '84',
    name: 'ซ่อมบำรุง 84',
    shortName: 'ซ่อมบำรุง',
    icon: 'build',
    color: '#2563eb',
    badgeClass: 'bg-blue-100 text-blue-900 border border-blue-300',
    accentBg: 'bg-blue-600',
    description: 'ไฟฟ้า แอร์ ประปา เครื่องจักร ยานพาหนะ ไอที และงานซ่อมทั่วไป'
  },
  '85': {
    id: '85',
    code: '85',
    name: 'งานก่อสร้าง 85',
    shortName: 'งานก่อสร้าง',
    icon: 'construction',
    color: '#ea580c',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    accentBg: 'bg-amber-600',
    description: 'โครงสร้างอาคาร งานปูน เทพื้น รั้วคอกสัตว์ หลังคา และงานต่อเติม'
  },
  '86': {
    id: '86',
    code: '86',
    name: 'งานศิลป์ 86',
    shortName: 'งานศิลป์',
    icon: 'palette',
    color: '#9333ea',
    badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300',
    accentBg: 'bg-purple-600',
    description: 'ป้ายสื่อสาร งานเพ้นท์/สี พร็อพถ่ายรูป ฉากกิจกรรม และงานตกแต่งฟาร์ม'
  }
};

export const DIVISION_LIST: DivisionInfo[] = [
  DIVISIONS['84'],
  DIVISIONS['85'],
  DIVISIONS['86']
];

export const ALL_WORK_CATEGORIES: WorkCategory[] = [
  // ================= 84 ซ่อมบำรุง =================
  {
    key: 'electric',
    title: 'ระบบไฟฟ้า & แสงสว่าง',
    sub: 'ไฟดับ ปลั๊กไหม้ สปอตไลท์ เบรกเกอร์',
    icon: 'bolt',
    dept: 'ไฟฟ้า & แอร์',
    division: '84',
    tags: ['ไฟดับทั้งโซน', 'เบรกเกอร์ทริป', 'ปลั๊กไฟช็อต/ไหม้', 'หลอดไฟขาด', 'สปอตไลท์ดับ']
  },
  {
    key: 'hvac',
    title: 'ระบบแอร์ & เครื่องเย็น',
    sub: 'แอร์ไม่เย็น น้ำแอร์หยด ตู้แช่เสีย',
    icon: 'ac_unit',
    dept: 'ไฟฟ้า & แอร์',
    division: '84',
    tags: ['แอร์ไม่เย็น/มีแต่ลม', 'น้ำแอร์หยดนอง', 'ตู้แช่วัตถุดิบไม่เย็น', 'คอมเพรสเซอร์เสียงดัง', 'แอร์ไม่ติด']
  },
  {
    key: 'plumbing',
    title: 'ระบบประปา & สุขาภิบาล',
    sub: 'ท่อแตก น้ำไม่ไหล ปั๊มน้ำ ชักโครกตัน',
    icon: 'water_drop',
    dept: 'ประปา & สุขาภิบาล',
    division: '84',
    tags: ['ท่อประปาแตกน้ำรั่ว', 'น้ำไม่ไหล/ไหลค่อย', 'ปั๊มน้ำไม่ตัด', 'ชักโครก/ท่อตัน', 'ก๊อกน้ำหัก']
  },
  {
    key: 'farm_machinery',
    title: 'เครื่องจักร & ยานพาหนะ',
    sub: 'รถแทรกเตอร์ รถกอล์ฟ รถราง เครื่องตัดหญ้า',
    icon: 'agriculture',
    dept: 'รถบริการ & ยานพาหนะ',
    division: '84',
    tags: ['สตาร์ทไม่ติด', 'เครื่องยนต์ดับ', 'ระบบไฮดรอลิกรั่ว', 'ยางแบน/โซ่หลุด', 'เบรกไม่อยู่']
  },
  {
    key: 'it_system',
    title: 'ไอที POS & กล้องวงจรปิด',
    sub: 'เครื่อง POS ปริ้นเตอร์บิล Wi-Fi กล้อง',
    icon: 'router',
    dept: 'ไอที & ระบบสื่อสาร',
    division: '84',
    tags: ['เครื่อง POS ดับ', 'ปริ้นเตอร์ใบเสร็จไม่ออก', 'อินเทอร์เน็ต Wi-Fi หลุด', 'กล้อง CCTV ใช้งานไม่ได้']
  },
  {
    key: 'general_repair',
    title: 'งานซ่อมบำรุงทั่วไป & เบ็ดเตล็ด',
    sub: 'โต๊ะเก้าอี้ชำรุด เปลี่ยนกุญแจ อุปกรณ์บริการ',
    icon: 'handyman',
    dept: 'คาเฟ่ & F&B',
    division: '84',
    tags: ['โต๊ะเก้าอี้ชำรุด', 'ลูกบิด/กุญแจเสีย', 'พัดลมไม่หมุน', 'อุปกรณ์บริการแขกชำรุด']
  },

  // ================= 85 งานก่อสร้าง =================
  {
    key: 'bldg_structure',
    title: 'โครงสร้างอาคาร & งานปูน',
    sub: 'เสา คาน ผนังแตกร้าว ก่ออิฐฉาบปูน',
    icon: 'foundation',
    dept: 'ซ่อมบำรุงอาคาร & สี',
    division: '85',
    tags: ['ผนังแตกร้าวอันตราย', 'งานก่ออิฐฉาบปูน', 'เสา/คานชำรุด', 'โครงสร้างทรุดตัว']
  },
  {
    key: 'concrete_floor',
    title: 'งานเทพื้น & ทางเดินเท้า',
    sub: 'พื้นทรุด ผิวทางเดินแตกร้าว ลานคอนกรีต',
    icon: 'stairs',
    dept: 'ซ่อมบำรุงอาคาร & สี',
    division: '85',
    tags: ['พื้นทางเดินแตกร้าว', 'ทางลาดชำรุด', 'ฝาท่อระบายน้ำแตก', 'เทพื้นคอนกรีตเสริม']
  },
  {
    key: 'roof_leak',
    title: 'หลังคา รางน้ำ & งานรั่วซึม',
    sub: 'กระเบื้องแตก หลังคารั่ว รางน้ำหลุด',
    icon: 'roofing',
    dept: 'ซ่อมบำรุงอาคาร & สี',
    division: '85',
    tags: ['หลังคารั่วหยด', 'รางน้ำฝนอุดตัน/หลุด', 'กระเบื้องหลังคาแตก', 'แผ่นฝ้าเพดานบวมร่วง']
  },
  {
    key: 'welding_fence',
    title: 'งานเชื่อมเหล็ก & รั้วคอกแกะ',
    sub: 'รั้วฟาร์ม ประตูเหล็ก โครงหลังคาเชื่อม',
    icon: 'fence',
    dept: 'ฟาร์มสัตว์ & กิจกรรม',
    division: '85',
    tags: ['รั้วคอกแกะหลุดชำรุด', 'งานเชื่อมเหล็กด่วน', 'ประตูรั้วตกราง', 'ราวกันตกชำรุด']
  },
  {
    key: 'door_window',
    title: 'งานประตู หน้าต่าง & ไม้โครงสร้าง',
    sub: 'วงกบ ประตูตก กระจกแตกร้าว งานไม้',
    icon: 'sensor_door',
    dept: 'ซ่อมบำรุงอาคาร & สี',
    division: '85',
    tags: ['ประตูปิดไม่ได้/ตกราง', 'กระจกแตกร้าว', 'ไม้โครงสร้างผุ', 'วงกบหน้าต่างชำรุด']
  },
  {
    key: 'renovation',
    title: 'งานต่อเติม & ปรับปรุงพื้นที่',
    sub: 'กั้นห้อง ขยายพื้นที่ ซุ้มบริการใหม่',
    icon: 'domain_add',
    dept: 'ซ่อมบำรุงอาคาร & สี',
    division: '85',
    tags: ['ต่อเติมโครงสร้าง', 'กั้นห้อง/รื้อถอน', 'ปรับระดับดิน/พื้นที่', 'งานขยายซุ้มบริการ']
  },

  // ================= 86 งานศิลป์ =================
  {
    key: 'farm_signage',
    title: 'ป้ายบอกทาง & สื่อสารในฟาร์ม',
    sub: 'ป้ายชื่อโซน ป้ายบอกทาง ป้ายกฎระเบียบ',
    icon: 'signpost',
    dept: 'ฟาร์มสัตว์ & กิจกรรม',
    division: '86',
    tags: ['ป้ายบอกทางหลุด/หัก', 'ตัวหนังสือลอกซีด', 'ทำป้ายข้อความใหม่', 'ป้ายชื่อเมนู/ราคา']
  },
  {
    key: 'wall_painting',
    title: 'งานเพ้นท์ผนัง & ภาพวาดศิลป์',
    sub: 'ภาพวาดฝาผนัง ลวดลายธีมฟาร์ม เพ้นท์ลาย',
    icon: 'imagesmode',
    dept: 'งานสวน & ภูมิทัศน์',
    division: '86',
    tags: ['ภาพวาดผนังสีลอก', 'เติมสีลวดลายฟาร์ม', 'เพ้นท์ฉากถ่ายรูปใหม่', 'ลบรอยขีดเขียน']
  },
  {
    key: 'photo_props',
    title: 'พร็อพถ่ายรูป & จุดเช็คอิน',
    sub: 'หุ่นแกะ ป้ายถ่ายรูป ซุ้มดอกไม้ พร็อพโชว์',
    icon: 'photo_camera',
    dept: 'ฟาร์มสัตว์ & กิจกรรม',
    division: '86',
    tags: ['หุ่นโชว์/แกะหักชำรุด', 'ซุ้มถ่ายรูปชำรุด', 'พร็อพเช็คอินสีซีด', 'จัดมุมถ่ายรูปใหม่']
  },
  {
    key: 'event_decor',
    title: 'งานตกแต่งซุ้ม & ฉากกิจกรรม',
    sub: 'ฉากเวที งานธีมเทศกาล ซุ้มอีเวนต์',
    icon: 'celebration',
    dept: 'ฟาร์มสัตว์ & กิจกรรม',
    division: '86',
    tags: ['ฉากเวทีกิจกรรมชำรุด', 'ตกแต่งเทศกาลประจำฤดู', 'ติดตั้งไฟประดับศิลป์', 'ซุ้มต้อนรับนักท่องเที่ยว']
  },
  {
    key: 'color_coating',
    title: 'งานทำสี & เคลือบเงาตกแต่ง',
    sub: 'ทาสีตกแต่ง เคลือบเงาไม้ พ่นสีเฟอร์นิเจอร์',
    icon: 'format_paint',
    dept: 'ซ่อมบำรุงอาคาร & สี',
    division: '86',
    tags: ['ทาสีตกแต่งใหม่', 'เคลือบเงาเฟอร์นิเจอร์โชว์', 'พ่นสีกันสนิมศิลป์', 'ขัดเคลือบเงาป้ายไม้']
  },
  {
    key: 'landscape_art',
    title: 'งานจัดแสดง & ภูมิทัศน์ศิลป์',
    sub: 'กระถางต้นไม้ศิลป์ งานหินตกแต่ง น้ำพุ',
    icon: 'park',
    dept: 'งานสวน & ภูมิทัศน์',
    division: '86',
    tags: ['กระถางปูนปั้นแตก', 'จัดแนวดอกไม้ถ่ายรูป', 'บ่อน้ำพุตกแต่ง', 'ประติมากรรมตกแต่งฟาร์ม']
  }
];

export function getDivisionInfo(divisionId?: string): DivisionInfo {
  if (divisionId === '85') return DIVISIONS['85'];
  if (divisionId === '86') return DIVISIONS['86'];
  return DIVISIONS['84'];
}

export function getCategoriesByDivision(divisionId: DivisionId): WorkCategory[] {
  return ALL_WORK_CATEGORIES.filter(c => c.division === divisionId);
}

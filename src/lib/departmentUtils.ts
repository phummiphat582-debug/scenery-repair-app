/**
 * Department Formatting and Matching Utilities
 * Removes raw department codes from display names (e.g. "0 ฟร้อน" -> "ฟร้อน", "24 แม่บ้าน" -> "แม่บ้าน")
 * while preserving full compatibility with legacy stored tickets and database queries.
 */

/**
 * Checks if a string contains Mojibake (corrupted double-encoded UTF-8 characters like à¸, à¹, â˜, â€, etc.)
 */
export function isMojibake(str?: string): boolean {
  if (!str) return false;
  return /[à¸à¹â˜â€ÃÂ]/.test(str);
}

/**
 * Strips code prefix from department name (e.g. "0 ฟร้อน" -> "ฟร้อน", "H13 หอพักพนักงาน" -> "หอพักพนักงาน", "all" -> "ทุกแผนก")
 */
export function formatDepartmentName(name?: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.toLowerCase() === 'all') return 'ทุกแผนก';

  // Strip code prefixes like "24 แม่บ้าน", "24-แม่บ้าน", "24. แม่บ้าน", "24: แม่บ้าน", "[24] แม่บ้าน", "dept-24 แม่บ้าน", "H0 บ้านพัก"
  let clean = trimmed
    .replace(/^dept-[a-zA-Z0-9_-]+\s*/i, '')
    .replace(/^\[(?:H\d+|\d+)\]\s*/i, '')
    .replace(/^(?:H\d+|\d+)[\s.:-]+\s*/i, '')
    .replace(/^(?:H\d+|\d+)(?=[^\d\s])/i, '')
    .trim();

  // If starts or ends with known division prefixes/suffixes
  if (/^84\s*ซ่อมบำรุง/.test(trimmed) || /ซ่อมบำรุง\s*84$/.test(clean) || clean === '84') return 'ซ่อมบำรุง';
  if (/^85\s*ก่อสร้าง/.test(trimmed) || /(?:งาน)?ก่อสร้าง\s*85$/.test(clean) || clean === '85') return 'ก่อสร้าง';
  if (/^86\s*ศิลป์/.test(trimmed) || /(?:งาน)?ศิลป์\s*86$/.test(clean) || clean === '86') return 'ศิลป์';

  return clean || trimmed;
}

/**
 * Strips division code prefixes and trailing codes from ticket titles
 * (e.g. "ซ่อมบำรุง 84: หน้าเกมส์" -> "หน้าเกมส์", "ซ่อมบำรุง: หน้าเกมส์" -> "หน้าเกมส์", "[DIV:84] แอร์เสีย" -> "แอร์เสีย")
 */
export function formatTicketTitle(title?: string): string {
  if (!title) return '';
  let clean = title
    .replace(/^(?:ซ่อมบำรุง|งานก่อสร้าง|งานศิลป์)\s*(?:84|85|86)?:?\s*/i, '')
    .replace(/^\[DIV:(?:84|85|86)\]\s*/i, '')
    .replace(/\s*(?:84|85|86)\s*$/i, '')
    .trim();

  if (!clean) {
    if (title.includes('ก่อสร้าง')) return 'งานก่อสร้าง';
    if (title.includes('ศิลป์')) return 'งานศิลป์';
    if (title.includes('ซ่อมบำรุง')) return 'งานซ่อมบำรุง';
    return title;
  }
  return clean;
}

/**
 * Extracts department code from name or provided code (e.g. "0 ฟร้อน" -> "0", "H12 สวนผึ้ง" -> "H12")
 */
export function getDepartmentCode(name?: string, explicitCode?: string): string {
  if (explicitCode) return explicitCode;
  if (!name) return '';
  const match = name.match(/^(H\d+|\d+)\s+/);
  return match ? match[1] : '';
}

/**
 * Checks if two department names are the same, regardless of whether one has the code prefix or not.
 * E.g. isSameDepartment("0 ฟร้อน", "ฟร้อน") -> true
 *      isSameDepartment("24 แม่บ้าน", "แม่บ้าน") -> true
 */
export function isSameDepartment(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return formatDepartmentName(a).toLowerCase() === formatDepartmentName(b).toLowerCase();
}

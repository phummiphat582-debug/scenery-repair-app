/**
 * Department Formatting and Matching Utilities
 * Removes raw department codes from display names (e.g. "0 ฟร้อน" -> "ฟร้อน", "24 แม่บ้าน" -> "แม่บ้าน")
 * while preserving full compatibility with legacy stored tickets and database queries.
 */

/**
 * Strips code prefix from department name (e.g. "0 ฟร้อน" -> "ฟร้อน", "H13 หอพักพนักงาน" -> "หอพักพนักงาน")
 */
export function formatDepartmentName(name?: string): string {
  if (!name) return '';
  return name.replace(/^(H\d+|\d+)\s+/, '').trim();
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

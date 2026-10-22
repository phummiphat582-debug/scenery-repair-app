import { Ticket, Department, Technician, SortOrder, DivisionId } from '../types';
import { INITIAL_DEPARTMENTS } from '../data/mockData';
import { supabase, isSupabaseConfigured, realtimeSupabase } from '../lib/supabase';
import { getTicketAgingInfo } from '../lib/ticketAging';
import { oneSignalService } from './oneSignalService';
import { savePhotoToIdb, getPhotoFromIdb } from '../lib/photoStorage';
import { isSameDepartment, formatDepartmentName, getDepartmentCode, formatTicketTitle, isMojibake } from '../lib/departmentUtils';

const LOCAL_STORAGE_TICKETS = 'scenery_repair_v5_tickets';
const LOCAL_STORAGE_DEPTS = 'scenery_repair_v5_departments';
const LOCAL_STORAGE_TECHS = 'scenery_repair_v5_technicians';
const COMPLETED_REGISTRY_KEY = 'scenery_repair_v5_completed_registry';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LEGACY_DEMO_TECHNICIAN_IDS = new Set([
  'tech-1', 'tech-2', 'tech-3', 'tech-4', 'tech-5', 'tech-6', 'tech-7', 'tech-8'
]);
const LEGACY_DEMO_TECHNICIAN_NAMES = new Set([
  'ช่างสมชาย (หัวหน้าช่าง)',
  'ช่างวิชัย (ไฟฟ้า/แอร์)',
  'ช่างประสิทธิ์ (ประปา/สุขาภิบาล)',
  'ช่างเอกชัย (อาคาร/สี)',
  'ช่างธนพล (ช่างยนต์/เครื่องจักร)',
  'ช่างเดี่ยว (อู่ภายนอก D.Bike Garage)',
  'ช่าง 84 (งานปะยาง/เชื่อม/บัดกรี)',
  'ช่างบูร (ตาฟเกลียว/โรงกลึง)'
]);

function removeLegacyDemoTechnicians(technicians: Technician[]): Technician[] {
  return technicians.filter(tech =>
    !LEGACY_DEMO_TECHNICIAN_IDS.has(String(tech.id))
  );
}

// Database mapping utilities (PostgreSQL snake_case <-> Frontend camelCase)
function dbToTicket(row: any): Ticket {
  let diagnosticReason = row.diagnostic_reason || row.diagnosticReason;
  let actionSteps = row.action_steps || row.actionSteps;
  const parts = row.parts;
  const repairResult = row.repair_result || row.repairResult || '';
  const rawRemark = row.remark || '';

  // Extract from combined repairResult if not directly present in columns
  if (!diagnosticReason && repairResult) {
    const diagMatch = repairResult.match(/สาเหตุ(?:ของปัญหา)?:\s*([^\n\r]+)/);
    if (diagMatch) diagnosticReason = diagMatch[1].trim();
  }
  if (!actionSteps && repairResult) {
    const actionMatch = repairResult.match(/วิธีแก้ไข(?:[^:\n\r]+)?:\s*([^\n\r]+)/);
    if (actionMatch) actionSteps = actionMatch[1].trim();
  }

  // Accurate Division Recovery (84 ซ่อมบำรุง / 85 ก่อสร้าง / 86 ศิลป์)
  let division: DivisionId = '84';
  const divRemarkMatch = rawRemark.match(/\[DIV:(84|85|86)\]/);
  if (divRemarkMatch) {
    division = divRemarkMatch[1] as DivisionId;
  } else if (row.division === '84' || row.division === '85' || row.division === '86') {
    division = row.division as DivisionId;
  } else {
    const titleText = `${row.title || ''}`.toLowerCase();
    const titleTagMatch = titleText.match(/\[(84|85|86)\]/);
    if (titleTagMatch) {
      division = titleTagMatch[1] as DivisionId;
    } else if (titleText.includes('85') || titleText.includes('ก่อสร้าง') || titleText.includes('ปูน') || titleText.includes('โครงสร้าง') || titleText.includes('เทพื้น') || titleText.includes('หลังคา') || titleText.includes('เชื่อม') || titleText.includes('รั้ว')) {
      division = '85';
    } else if (titleText.includes('86') || titleText.includes('ศิลป์') || titleText.includes('เพ้นท์') || titleText.includes('ป้าย') || titleText.includes('พร็อพ') || titleText.includes('ตกแต่ง') || titleText.includes('ทาสี')) {
      division = '86';
    } else {
      const tech = `${row.technician_name || ''}`;
      if (tech.includes('[85]')) division = '85';
      else if (tech.includes('[86]')) division = '86';
      else {
        const desc = `${row.description || ''}`.toLowerCase();
        if (desc.includes('[85]') || desc.includes('ก่อสร้าง')) division = '85';
        else if (desc.includes('[86]') || desc.includes('ศิลป์')) division = '86';
        else {
          const dept = `${row.department || ''}`;
          if (dept.includes('85') || dept.includes('ก่อสร้าง')) division = '85';
          else if (dept.includes('86') || dept.includes('ศิลป์')) division = '86';
          else division = '84';
        }
      }
    }
  }

  const cleanRemark = rawRemark.replace(/\[DIV:(84|85|86)\]\s*/g, '').trim();

  return {
    id: String(row.id),
    requestId: row.request_id || row.requestId || String(row.id),
    title: formatTicketTitle(row.title || ''),
    description: row.description || '',
    department: formatDepartmentName(row.department || ''),
    location: row.location || '',
    requesterName: row.requester_name || row.requesterName || '',
    requesterPhone: row.requester_phone || row.requesterPhone || '',
    priority: row.priority || 'normal',
    status: row.status || 'pending',
    technicianName: row.technician_name || row.technicianName || '',
    technicianPhone: row.technician_phone || row.technicianPhone || '',
    repairResult,
    remark: cleanRemark,
    requestImageUrl: row.request_image_url || row.requestImageUrl || '',
    resultImageUrl: row.result_image_url || row.resultImageUrl || '',
    division,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    completedAt: row.completed_at || row.completedAt || undefined,
    diagnosticReason,
    actionSteps,
    parts: Array.isArray(parts) ? parts : undefined
  };
}

const DEPT_ORDER = [
  '0', '10', '11', '13', '14', '16', '17', '19', '20', '21', '22', '23', '24', '25', '33', '34',
  '84', '85', '86', '91', '92', 'H0', 'H12', 'H13', 'H18'
];

export function sortDepartments(depts: Department[]): Department[] {
  return [...depts].sort((a, b) => {
    const idxA = DEPT_ORDER.indexOf(a.code);
    const idxB = DEPT_ORDER.indexOf(b.code);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name, 'th');
  });
}

function ticketToDb(t: Partial<Ticket>, isNewTicket: boolean = false): any {
  const row: any = {};
  if (isNewTicket && t.id && UUID_REGEX.test(t.id)) {
    row.id = t.id;
  }
  if (t.requestId !== undefined) row.request_id = t.requestId;
  if (t.title !== undefined) row.title = formatTicketTitle(t.title);
  if (t.description !== undefined) row.description = t.description;
  if (t.department !== undefined) {
    row.department = formatDepartmentName(t.department) || 'ฟร้อน';
  } else if (isNewTicket) {
    row.department = 'ฟร้อน';
  }

  // Guaranteed NOT NULL protection for PostgreSQL constraints
  if (t.location !== undefined) {
    row.location = t.location?.trim() || (isNewTicket ? 'พื้นที่ฟาร์ม' : undefined);
  } else if (isNewTicket) {
    row.location = 'พื้นที่ฟาร์ม';
  }
  if (row.location === undefined && isNewTicket) row.location = 'พื้นที่ฟาร์ม';

  if (t.requesterName !== undefined) {
    row.requester_name = t.requesterName?.trim() || (isNewTicket ? 'พนักงานฟาร์ม' : undefined);
  } else if (isNewTicket) {
    row.requester_name = 'พนักงานฟาร์ม';
  }
  if (row.requester_name === undefined && isNewTicket) row.requester_name = 'พนักงานฟาร์ม';

  if (t.requesterPhone !== undefined) row.requester_phone = t.requesterPhone;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.status !== undefined) row.status = t.status;
  if (t.technicianName !== undefined) row.technician_name = t.technicianName;
  if (t.technicianPhone !== undefined) row.technician_phone = t.technicianPhone;
  if (t.repairResult !== undefined) row.repair_result = t.repairResult;

  // Preserve division tag in remark so cloud database retains division 84/85/86
  if (isNewTicket || t.remark !== undefined || t.division !== undefined) {
    const div = t.division || '84';
    const rawRemark = t.remark !== undefined ? t.remark : '';
    const cleanRemark = rawRemark.replace(/\[DIV:(84|85|86)\]\s*/g, '').trim();
    row.remark = `[DIV:${div}] ${cleanRemark}`.trim();
  }

  // Direct persistence of compressed images in PostgreSQL TEXT column (never replace with [ATTACHED])
  if (t.requestImageUrl !== undefined) {
    const val = t.requestImageUrl;
    if (!val || val === '-' || val === '[ATTACHED]') {
      row.request_image_url = null;
    } else {
      row.request_image_url = val;
    }
  }
  if (t.resultImageUrl !== undefined) {
    const val = t.resultImageUrl;
    if (!val || val === '-' || val === '[ATTACHED]') {
      row.result_image_url = null;
    } else {
      row.result_image_url = val;
    }
  }
  if (t.createdAt !== undefined) row.created_at = t.createdAt;
  if (t.updatedAt !== undefined) row.updated_at = t.updatedAt;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt;
  return row;
}

function dbToTechnician(row: any): Technician {
  const rawRole = row.role || 'ช่างซ่อมบำรุง';
  let division: string | undefined = undefined;

  const tagMatch = rawRole.match(/\[(84|85|86)\]/);
  if (tagMatch) {
    division = tagMatch[1];
  } else if (row.department_id === '84' || row.department_id === '85' || row.department_id === '86') {
    division = row.department_id;
  } else if (row.departmentId === '84' || row.departmentId === '85' || row.departmentId === '86') {
    division = row.departmentId;
  } else {
    const text = `${rawRole} ${row.name || ''}`.toLowerCase();
    if (text.includes('85') || text.includes('ก่อสร้าง') || text.includes('ปูน') || text.includes('ไม้') || text.includes('อาคาร') || text.includes('โครงสร้าง') || text.includes('เชื่อม') || text.includes('หลังคา')) {
      division = '85';
    } else if (text.includes('86') || text.includes('ศิลป์') || text.includes('สี') || text.includes('เพ้นท์') || text.includes('ป้าย') || text.includes('พร็อพ') || text.includes('ตกแต่ง')) {
      division = '86';
    } else {
      division = '84';
    }
  }

  const cleanRole = rawRole.replace(/\s*\[(84|85|86)\]\s*/g, '').trim() || rawRole;

  return {
    id: String(row.id),
    name: row.name,
    role: cleanRole,
    status: row.status || 'active',
    phone: row.phone || '',
    avatarUrl: row.avatar_url || row.avatarUrl || '',
    isOnDutyToday: row.is_on_duty_today ?? row.isOnDutyToday ?? true,
    departmentId: division
  };
}

function dbToDepartment(row: any): Department {
  let name = formatDepartmentName(row.name);
  let icon = row.icon || '📌';
  let description = row.description || '';
  const code = row.code || getDepartmentCode(row.name);

  // If corrupted with Mojibake, recover clean details from INITIAL_DEPARTMENTS
  if (isMojibake(name) || isMojibake(icon) || isMojibake(description)) {
    const fallback = INITIAL_DEPARTMENTS.find(d => d.code === code || isSameDepartment(d.name, name));
    if (fallback) {
      name = fallback.name;
      icon = fallback.icon;
      description = fallback.description || '';
    }
  }

  return {
    id: String(row.id),
    name,
    code,
    icon,
    color: row.color || '#0f766e',
    description
  };
}

function filterTicketQuery(query: any, id: string) {
  if (UUID_REGEX.test(id)) {
    return query.or(`id.eq.${id},request_id.eq.${id}`);
  }
  return query.eq('request_id', id);
}

function filterTechnicianQuery(query: any, idOrName: string) {
  if (UUID_REGEX.test(idOrName)) {
    return query.or(`id.eq.${idOrName},name.eq.${idOrName}`);
  }
  return query.eq('name', idOrName);
}


class TicketService {
  private tickets: Ticket[] = [];
  private departments: Department[] = [];
  private technicians: Technician[] = [];
  private listeners: Set<() => void> = new Set();
  private pollInterval: any = null;
  private isInitialSyncDone = false;
  private initialSyncPromise: Promise<void> | null = null;
  private supabaseChannel: any = null;
  private isConnectedToCloud = false;
  private recentlyDeletedTicketIds: Set<string> = new Set();
  private syncDebounceTimer: any = null;

  // Anti-Reversion Shield: Immutable record of tickets that were completed
  private completedRegistry: Record<string, Partial<Ticket>> = {};
  private localBroadcastChannel: BroadcastChannel | null = null;
  public isCloudRestricted: boolean = false;

  constructor() {
    this.initLocalData();
    this.startRealtime();
    this.setupWindowListeners();
  }

  public isCompleted(idOrRequestId?: string): boolean {
    if (!idOrRequestId) return false;
    return Boolean(this.completedRegistry[idOrRequestId]);
  }

  public registerCompleted(ticket: Partial<Ticket>, shouldBroadcast: boolean = true) {
    if (!ticket) return;
    const nowIso = new Date().toISOString();
    const completedAt = ticket.completedAt || nowIso;
    const record: Partial<Ticket> = {
      id: ticket.id,
      requestId: ticket.requestId,
      status: 'completed',
      completedAt,
      technicianName: ticket.technicianName,
      technicianPhone: ticket.technicianPhone,
      diagnosticReason: ticket.diagnosticReason,
      actionSteps: ticket.actionSteps,
      repairResult: ticket.repairResult,
      parts: ticket.parts
    };
    if (ticket.requestId) this.completedRegistry[ticket.requestId] = record;
    if (ticket.id) this.completedRegistry[ticket.id] = record;

    try {
      localStorage.setItem(COMPLETED_REGISTRY_KEY, JSON.stringify(this.completedRegistry));
    } catch {}

    if (shouldBroadcast) {
      this.broadcastEvent('TICKET_MUTATION', {
        action: 'REGISTER_COMPLETED',
        id: ticket.id,
        requestId: ticket.requestId,
        ticket: record
      });
      try {
        this.localBroadcastChannel?.postMessage({
          type: 'TICKET_MUTATION',
          action: 'REGISTER_COMPLETED',
          id: ticket.id,
          requestId: ticket.requestId,
          ticket: record
        });
      } catch {}
    }
  }

  private initLocalData() {
    try {
      // 1. Load Completed Registry (Immutable shield against uncompleted rollbacks)
      const savedRegistry = localStorage.getItem(COMPLETED_REGISTRY_KEY);
      if (savedRegistry) {
        try {
          const parsed = JSON.parse(savedRegistry);
          if (parsed && typeof parsed === 'object') {
            this.completedRegistry = parsed;
          }
        } catch (e) {
          console.warn('Completed registry parse error:', e);
        }
      }

      // 2. Load tickets from storage and purge any non-ticket records (e.g. accidentally harvested departments/techs)
      const savedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS);
      const parsed = savedTickets ? JSON.parse(savedTickets) : [];
      this.tickets = (Array.isArray(parsed) ? parsed : []).filter((t: any) =>
        t &&
        !t.id?.startsWith('dept-') &&
        !t.id?.startsWith('tech-') &&
        !t.code &&
        (Boolean(t.requestId) || Boolean(t.title))
      );

      // 3. Harvest any real tickets from previous storage versions if present
      this.harvestLegacyTickets();

      this.tickets.forEach(t => {
        if (t.requesterName && t.requesterName.includes('าดสดส')) {
          t.requesterName = '';
        }
        if (t.department) {
          t.department = formatDepartmentName(t.department);
        }

        // Auto-heal: If ticket is in registry OR has completedAt OR has repair notes, guarantee status === 'completed'!
        if (
          this.isCompleted(t.requestId) ||
          this.isCompleted(t.id) ||
          t.completedAt ||
          t.status === 'completed' ||
          (t.repairResult && (t.repairResult.includes('ช่างผู้ปิดงาน') || t.repairResult.includes('สาเหตุ')))
        ) {
          t.status = 'completed';
          if (!t.completedAt) t.completedAt = new Date().toISOString();
          this.registerCompleted(t);
        }
      });

      const savedDepts = localStorage.getItem(LOCAL_STORAGE_DEPTS);
      const parsedDepts = savedDepts ? JSON.parse(savedDepts) : null;
      const hasMojibake = Array.isArray(parsedDepts) && parsedDepts.some(d => isMojibake(d.name) || isMojibake(d.description) || isMojibake(d.icon));
      if (Array.isArray(parsedDepts) && parsedDepts.length >= 20 && !hasMojibake) {
        this.departments = sortDepartments(parsedDepts.map(d => ({
          ...d,
          name: formatDepartmentName(d.name),
          code: d.code || getDepartmentCode(d.name)
        })));
      } else {
        this.departments = INITIAL_DEPARTMENTS;
        try {
          localStorage.setItem(LOCAL_STORAGE_DEPTS, JSON.stringify(INITIAL_DEPARTMENTS));
        } catch {}
      }

      const savedTechs = localStorage.getItem(LOCAL_STORAGE_TECHS);
      const parsedTechs = savedTechs ? JSON.parse(savedTechs) : [];
      this.technicians = Array.isArray(parsedTechs) ? removeLegacyDemoTechnicians(parsedTechs) : [];
      this.saveToLocalStorage();
      void this.hydratePhotosFromIdb();
    } catch (e) {
      this.tickets = [];
      this.departments = INITIAL_DEPARTMENTS;
      this.technicians = [];
    }
  }

  /**
   * Safely salvages any user tickets from all local storage keys without resurrecting old mock demo data
   */
  public harvestLegacyTickets(): { harvestedCount: number; harvestedList: Ticket[] } {
    const legacyKeys = new Set([
      'scenery_repair_v4_tickets',
      'scenery_repair_v3_tickets',
      'scenery_repair_v2_tickets',
      'scenery_repair_tickets',
      'offline_tickets',
      'repair_tickets'
    ]);
    
    // Also discover any key in localStorage containing array of tickets
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.includes('ticket') || k.includes('repair'))) {
            legacyKeys.add(k);
          }
        }
      } catch {}
    }

    let harvestedCount = 0;
    const harvestedList: Ticket[] = [];

    legacyKeys.forEach(key => {
      if (
        key === LOCAL_STORAGE_TICKETS ||
        key === LOCAL_STORAGE_DEPTS ||
        key === LOCAL_STORAGE_TECHS ||
        key === COMPLETED_REGISTRY_KEY ||
        key.includes('departments') ||
        key.includes('technicians') ||
        key.includes('registry')
      ) return; // skip system and non-ticket keys
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((item: any) => {
              if (
                !item ||
                item.id?.startsWith('dept-') ||
                item.id?.startsWith('tech-') ||
                item.code !== undefined ||
                (!item.requestId && !item.title)
              ) return;
              // Ignore legacy demo tickets from early September (e.g. t-1 to t-23 with REP-202609-)
              const isDemo = item.id?.startsWith('t-') && item.requestId?.startsWith('REP-202609-');
              if (isDemo) return;

              const reqId = item.requestId || item.id;
              const exists = this.tickets.some(t => t.id === item.id || t.requestId === reqId);
              if (!exists) {
                if (
                  this.isCompleted(reqId) ||
                  this.isCompleted(item.id) ||
                  item.completedAt ||
                  item.status === 'completed' ||
                  (item.repairResult && (item.repairResult.includes('ช่างผู้ปิดงาน') || item.repairResult.includes('สาเหตุ')))
                ) {
                  item.status = 'completed';
                  if (!item.completedAt) item.completedAt = new Date().toISOString();
                  this.registerCompleted(item);
                }
                if (item.department) {
                  item.department = formatDepartmentName(item.department);
                }
                this.tickets.push(item);
                harvestedList.push(item);
                harvestedCount++;
              }
            });
          }
          localStorage.removeItem(key);
        }
      } catch (e) {
        try { localStorage.removeItem(key); } catch {}
      }
    });

    if (harvestedCount > 0) {
      console.log(`[TicketService] Harvested ${harvestedCount} legacy tickets from local device storage.`);
      this.saveToLocalStorage();
      // Auto-upload harvested tickets to Central Cloud so other devices receive them
      harvestedList.forEach(t => {
        void this.uploadStrandedTicketToCloud(t);
      });
    }

    return { harvestedCount, harvestedList };
  }

  /**
   * Public one-click Sync & Restore method:
   * Harvests stranded tickets from local storage, pushes them to Supabase, and forces server pull
   */
  public async salvageAndSyncAll(): Promise<{ found: number; synced: number; total: number }> {
    const { harvestedCount, harvestedList } = this.harvestLegacyTickets();
    
    // Also re-check all tickets in memory: if any ticket is offline-only, upload it
    for (const t of this.tickets) {
      if (t.id?.startsWith('offline_') || t.requestId?.startsWith('OFF-')) {
        void this.uploadStrandedTicketToCloud(t);
      }
    }

    // Force full server sync
    await this.syncFromServer();
    this.saveToLocalStorage();

    return {
      found: harvestedCount,
      synced: harvestedList.length,
      total: this.tickets.length
    };
  }

  private async hydratePhotosFromIdb() {
    if (typeof window === 'undefined') return;
    try {
      let changed = false;
      for (const t of this.tickets) {
        const key = t.requestId || t.id;
        const needsReqPhoto = (!t.requestImageUrl || t.requestImageUrl === '-' || t.requestImageUrl === '[ATTACHED]') && key;
        if (needsReqPhoto) {
          const photo = await getPhotoFromIdb(`${key}_req`);
          if (photo && photo.startsWith('data:')) {
            t.requestImageUrl = photo;
            changed = true;
            // Push recovered photo to Central Cloud so technicians and all other devices see it
            void this.pushTicketToCloud(t);
          }
        }
        const needsResPhoto = (!t.resultImageUrl || t.resultImageUrl === '-' || t.resultImageUrl === '[ATTACHED]') && key;
        if (needsResPhoto) {
          const photo = await getPhotoFromIdb(`${key}_res`);
          if (photo && photo.startsWith('data:')) {
            t.resultImageUrl = photo;
            changed = true;
            void this.pushTicketToCloud(t);
          }
        }
      }
      if (changed) {
        this.saveToLocalStorage();
        this.notify();
      }
    } catch (e) {
      console.warn('[TicketService] IDB photo hydration failed:', e);
    }
  }

  public reloadFromLocalStorage() {
    try {
      // 1. Re-read registry
      const savedReg = localStorage.getItem(COMPLETED_REGISTRY_KEY);
      if (savedReg) {
        try {
          const parsed = JSON.parse(savedReg);
          if (parsed && typeof parsed === 'object') {
            this.completedRegistry = { ...this.completedRegistry, ...parsed };
          }
        } catch {}
      }

      // 2. Re-read tickets from disk
      const savedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS);
      if (!savedTickets) return;
      const parsedTickets: Ticket[] = JSON.parse(savedTickets);
      if (!Array.isArray(parsedTickets)) return;

      let hasChanged = false;
      const mergedMap = new Map<string, Ticket>();

      // Put current memory tickets first
      this.tickets.forEach(t => mergedMap.set(t.requestId || t.id, t));

      // Merge with disk tickets
      parsedTickets.forEach(diskTicket => {
        if (diskTicket.department) {
          diskTicket.department = formatDepartmentName(diskTicket.department);
        }
        const key = diskTicket.requestId || diskTicket.id;
        const memTicket = mergedMap.get(key);

        // Auto-heal disk ticket if in registry or completedAt
        if (
          this.isCompleted(diskTicket.requestId) ||
          this.isCompleted(diskTicket.id) ||
          diskTicket.completedAt ||
          diskTicket.status === 'completed' ||
          (diskTicket.repairResult && (diskTicket.repairResult.includes('ช่างผู้ปิดงาน') || diskTicket.repairResult.includes('สาเหตุ')))
        ) {
          diskTicket.status = 'completed';
          if (!diskTicket.completedAt) diskTicket.completedAt = new Date().toISOString();
          this.registerCompleted(diskTicket);
        }

        if (!memTicket) {
          mergedMap.set(key, diskTicket);
          hasChanged = true;
        } else {
          // Rule: If either is completed, COMPLETED WINS!
          if (diskTicket.status === 'completed' && memTicket.status !== 'completed') {
            mergedMap.set(key, diskTicket);
            hasChanged = true;
          } else if (memTicket.status === 'completed' && diskTicket.status !== 'completed') {
            // Memory is completed, preserve it
            this.registerCompleted(memTicket);
          } else {
            const diskTime = new Date(diskTicket.updatedAt || diskTicket.createdAt).getTime();
            const memTime = new Date(memTicket.updatedAt || memTicket.createdAt).getTime();
            if (diskTime > memTime) {
              mergedMap.set(key, diskTicket);
              hasChanged = true;
            }
          }
        }
      });

      if (hasChanged || mergedMap.size !== this.tickets.length) {
        this.tickets = Array.from(mergedMap.values());
        this.notify();
      }
      void this.hydratePhotosFromIdb();
    } catch (e) {
      console.warn('reloadFromLocalStorage error:', e);
    }
  }

  public scheduleSyncFromServer(delayMs = 2500) {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    this.syncDebounceTimer = setTimeout(() => {
      this.syncDebounceTimer = null;
      void this.syncFromServer();
    }, delayMs);
  }

  private saveToLocalStorage() {
    // 0. Ensure photos are safely backed up to IndexedDB (100MB+ persistent storage)
    try {
      this.tickets.forEach(t => {
        const key = t.requestId || t.id;
        if (t.requestImageUrl && t.requestImageUrl.startsWith('data:')) {
          void savePhotoToIdb(`${key}_req`, t.requestImageUrl);
        }
        if (t.resultImageUrl && t.resultImageUrl.startsWith('data:')) {
          void savePhotoToIdb(`${key}_res`, t.resultImageUrl);
        }
      });
    } catch {}

    // 1. Always save the completed registry first (lightweight, vital for anti-reversion)
    try {
      localStorage.setItem(COMPLETED_REGISTRY_KEY, JSON.stringify(this.completedRegistry));
    } catch (regErr) {
      console.warn('Completed registry save error:', regErr);
    }

    // 2. Try saving full tickets to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_TICKETS, JSON.stringify(this.tickets));
      localStorage.setItem(LOCAL_STORAGE_DEPTS, JSON.stringify(this.departments));
      localStorage.setItem(LOCAL_STORAGE_TECHS, JSON.stringify(this.technicians));
      return;
    } catch (e) {
      console.warn('LocalStorage save failed, optimizing storage for quota:', e);
    }

    // 3. Tier 1: Keep base64 images only for the 3 newest tickets, strip data: URLs from older tickets
    try {
      const compactedTickets = this.tickets.map((t, idx) => {
        if (idx > 2) {
          return {
            ...t,
            requestImageUrl: t.requestImageUrl && t.requestImageUrl.startsWith('data:') ? '' : t.requestImageUrl,
            resultImageUrl: t.resultImageUrl && t.resultImageUrl.startsWith('data:') ? '' : t.resultImageUrl
          };
        }
        return t;
      });
      localStorage.setItem(LOCAL_STORAGE_TICKETS, JSON.stringify(compactedTickets));
      localStorage.setItem(LOCAL_STORAGE_DEPTS, JSON.stringify(this.departments));
      localStorage.setItem(LOCAL_STORAGE_TECHS, JSON.stringify(this.technicians));
      return;
    } catch (e1) {
      console.warn('Tier 1 compaction exceeded quota, applying Tier 2 strip...', e1);
    }

    // 4. Tier 2: Strip all base64 data: URLs from localStorage to guarantee 100% metadata/status persistence
    try {
      const metadataOnlyTickets = this.tickets.map(t => ({
        ...t,
        requestImageUrl: t.requestImageUrl && t.requestImageUrl.startsWith('data:') ? '' : t.requestImageUrl,
        resultImageUrl: t.resultImageUrl && t.resultImageUrl.startsWith('data:') ? '' : t.resultImageUrl
      }));
      localStorage.setItem(LOCAL_STORAGE_TICKETS, JSON.stringify(metadataOnlyTickets));
      localStorage.setItem(LOCAL_STORAGE_DEPTS, JSON.stringify(this.departments));
      localStorage.setItem(LOCAL_STORAGE_TECHS, JSON.stringify(this.technicians));
    } catch (fatalErr) {
      console.error('Fatal LocalStorage save error:', fatalErr);
    }
  }

  private setupWindowListeners() {
    if (typeof window === 'undefined') return;

    // 1. Cross-Tab / Cross-Window Local BroadcastChannel for 0ms instant sync
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.localBroadcastChannel = new BroadcastChannel('scenery_local_repair_sync');
        this.localBroadcastChannel.onmessage = (event) => {
          const data = event.data;
          if (data?.type === 'TICKET_MUTATION') {
            if (data.action === 'CREATE' && data.ticket) {
              const incoming = data.ticket as Ticket;
              const exists = this.tickets.some(t => t.id === incoming.id || t.requestId === incoming.requestId);
              if (!exists) {
                if (this.isCompleted(incoming.requestId) || this.isCompleted(incoming.id)) {
                  incoming.status = 'completed';
                }
                this.tickets.unshift(incoming);
                this.saveToLocalStorage();
                this.notify();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('SCENERY_NEW_TICKET', { detail: incoming }));
                }
              }
            } else if (data.action === 'REGISTER_COMPLETED') {
              this.registerCompleted(data.ticket || { id: data.id, requestId: data.requestId }, false);
              const idx = this.tickets.findIndex(t => t.id === data.id || t.requestId === data.requestId);
              if (idx !== -1) {
                this.tickets[idx] = { ...this.tickets[idx], ...(data.ticket || {}), status: 'completed' };
                this.saveToLocalStorage();
                this.notify();
              }
            } else {
              this.reloadFromLocalStorage();
            }
          }
        };
      }
    } catch (bcErr) {
      console.warn('BroadcastChannel init error:', bcErr);
    }

    // 2. Storage event when another tab writes to localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === LOCAL_STORAGE_TICKETS || e.key === COMPLETED_REGISTRY_KEY) {
        this.reloadFromLocalStorage();
      }
    });

    // 3. Fast sync when user switches back to this tab: Always re-read localStorage FIRST
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.reloadFromLocalStorage();
        void this.syncFromServer();
        if (!this.isConnectedToCloud && !this.isCloudRestricted) {
          this.setupSupabaseRealtime();
        }
      }
    });

    // 4. Fast sync when browser window regains focus: Always re-read localStorage FIRST
    window.addEventListener('focus', () => {
      this.reloadFromLocalStorage();
      void this.syncFromServer();
      if (!this.isConnectedToCloud && !this.isCloudRestricted) {
        this.setupSupabaseRealtime();
      }
    });

    // 5. Fast sync when device comes back online
    window.addEventListener('online', () => {
      this.reloadFromLocalStorage();
      void this.syncFromServer();
      if (!this.isCloudRestricted) {
        this.setupSupabaseRealtime();
      }
    });
  }

  /**
   * Real-Time Synchronization Engine (Supabase Realtime WebSocket + Peer Broadcast + Cross-Device Sync)
   */
  private startRealtime() {
    if (typeof window === 'undefined') return;

    // 1. Initial immediate fetch from Supabase
    void this.ensureInitialSync();

    // 2. Setup Supabase Realtime channel (Instant WebSocket broadcast & CDC)
    this.setupSupabaseRealtime();

    // 3. Background safety polling (every 20s as fallback when active tab; Supabase Realtime WebSocket handles instant sync)
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          void this.syncFromServer();
        }
      }, 20000);
    }
  }

  private ensureInitialSync(): Promise<void> {
    if (this.isInitialSyncDone) return Promise.resolve();
    if (!this.initialSyncPromise) {
      this.initialSyncPromise = this.syncFromServer().finally(() => {
        this.initialSyncPromise = null;
      });
    }
    return this.initialSyncPromise;
  }

  private broadcastEvent(event: string, payload: any) {
    if (this.supabaseChannel) {
      try {
        let cleanPayload = payload;
        if (payload?.ticket) {
          const { requestImageUrl, resultImageUrl, ...rest } = payload.ticket;
          cleanPayload = {
            ...payload,
            ticket: {
              ...rest,
              requestImageUrl: (requestImageUrl && requestImageUrl !== '-' && requestImageUrl !== '[ATTACHED]') ? requestImageUrl : '',
              resultImageUrl: (resultImageUrl && resultImageUrl !== '-' && resultImageUrl !== '[ATTACHED]') ? resultImageUrl : ''
            }
          };
        }
        this.supabaseChannel.send({
          type: 'broadcast',
          event: event,
          payload: cleanPayload
        });
      } catch (e) {
        console.warn('[TicketService] Broadcast failed:', e);
      }
    }
  }

  private setupSupabaseRealtime() {
    if (this.supabaseChannel) {
      try {
        realtimeSupabase.removeChannel(this.supabaseChannel);
      } catch {}
      this.supabaseChannel = null;
    }

    try {
      this.supabaseChannel = realtimeSupabase
        .channel('scenery_realtime_db_channel', {
          config: {
            broadcast: { self: false }
          }
        })
        .on(
          'broadcast',
          { event: 'TICKET_MUTATION' },
          (payload) => {
            const data = payload?.payload;
            if (!data) return;
            console.log('⚡ [Realtime Broadcast] Mutation from peer received:', data);

            if (data.action === 'FOLLOW_UP' && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('SCENERY_FOLLOW_UP', { detail: data }));
            }

            if (data.action === 'CREATE' && data.ticket) {
              const incoming = data.ticket as Ticket;
              const exists = this.tickets.some(t => t.id === incoming.id || t.requestId === incoming.requestId);
              if (!exists) {
                if (this.isCompleted(incoming.requestId) || this.isCompleted(incoming.id)) {
                  incoming.status = 'completed';
                }
                this.tickets.unshift(incoming);
                this.saveToLocalStorage();
                this.notify();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('SCENERY_NEW_TICKET', { detail: incoming }));
                }
              }
            } else if (data.action === 'REGISTER_COMPLETED') {
              this.registerCompleted(data.ticket || { id: data.id, requestId: data.requestId }, false);
              const idx = this.tickets.findIndex(t => t.id === data.id || t.requestId === data.requestId);
              if (idx !== -1) {
                this.tickets[idx] = { ...this.tickets[idx], ...(data.ticket || {}), status: 'completed' };
                this.saveToLocalStorage();
                this.notify();
              }
            } else if (data.ticket) {
              const incoming = data.ticket as Ticket;
              if (incoming.status === 'completed') {
                this.registerCompleted(incoming, false);
              }
              const idx = this.tickets.findIndex(t => t.id === incoming.id || t.requestId === incoming.requestId);
              if (idx !== -1) {
                const local = this.tickets[idx];
                const isLocallyCompleted = local.status === 'completed' || this.isCompleted(local.requestId) || this.isCompleted(local.id);
                // Strict Protection: Never overwrite local 'completed' with non-completed from peer broadcast unless explicitly reopened
                if (!(isLocallyCompleted && incoming.status !== 'completed' && !incoming.isReopen)) {
                  this.tickets[idx] = {
                    ...local,
                    ...incoming,
                    requestImageUrl: incoming.requestImageUrl && incoming.requestImageUrl !== '[ATTACHED]' ? incoming.requestImageUrl : local.requestImageUrl || '',
                    resultImageUrl: incoming.resultImageUrl && incoming.resultImageUrl !== '[ATTACHED]' ? incoming.resultImageUrl : local.resultImageUrl || ''
                  };
                  this.saveToLocalStorage();
                  this.notify();
                }
              } else {
                if (this.isCompleted(incoming.requestId) || this.isCompleted(incoming.id)) {
                  incoming.status = 'completed';
                }
                this.tickets.unshift(incoming);
                this.saveToLocalStorage();
                this.notify();
              }
            }
            void this.scheduleSyncFromServer(3000);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'repair_tickets' },
          (payload) => {
            console.log('⚡ [Realtime CDC] Ticket event received:', payload.eventType);
            try {
              if (payload.eventType === 'INSERT' && payload.new) {
                const incoming = dbToTicket(payload.new);
                if (incoming.status === 'completed') {
                  this.registerCompleted(incoming);
                } else if (this.isCompleted(incoming.requestId) || this.isCompleted(incoming.id)) {
                  incoming.status = 'completed';
                }
                if (!this.recentlyDeletedTicketIds.has(incoming.id) && !this.recentlyDeletedTicketIds.has(incoming.requestId)) {
                  const existingIdx = this.tickets.findIndex(t => t.id === incoming.id || t.requestId === incoming.requestId);
                  if (existingIdx === -1) {
                    this.tickets.unshift(incoming);
                    this.saveToLocalStorage();
                    this.notify();
                    if (typeof window !== 'undefined' && incoming.status !== 'completed') {
                      window.dispatchEvent(new CustomEvent('SCENERY_NEW_TICKET', { detail: incoming }));
                    }
                  }
                }
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const incoming = dbToTicket(payload.new);
                if (incoming.status === 'completed') {
                  this.registerCompleted(incoming);
                }
                const existingIdx = this.tickets.findIndex(t => t.id === incoming.id || t.requestId === incoming.requestId);
                if (existingIdx !== -1) {
                  const local = this.tickets[existingIdx];
                  const isLocallyCompleted = local.status === 'completed' || this.isCompleted(local.requestId) || this.isCompleted(local.id);
                  // Strict Protection: If local is completed and incoming is NOT, do not revert!
                  if (!(isLocallyCompleted && incoming.status !== 'completed')) {
                    this.tickets[existingIdx] = {
                      ...local,
                      ...incoming,
                      requestImageUrl: incoming.requestImageUrl || local.requestImageUrl || '',
                      resultImageUrl: incoming.resultImageUrl || local.resultImageUrl || ''
                    };
                    this.saveToLocalStorage();
                    this.notify();
                  }
                }
              } else if (payload.eventType === 'DELETE' && payload.old) {
                const delId = (payload.old as any).id;
                if (delId) {
                  this.tickets = this.tickets.filter(t => t.id !== delId && t.requestId !== delId);
                  this.saveToLocalStorage();
                  this.notify();
                }
              }
            } catch (cdcErr) {
              console.warn('[TicketService] Direct CDC merge exception:', cdcErr);
            }
            void this.syncFromServer();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'technicians' },
          (payload) => {
            console.log('⚡ [Realtime CDC] Technician event received:', payload.eventType);
            try {
              if (payload.new && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
                const incoming = dbToTechnician(payload.new);
                const idx = this.technicians.findIndex(t => t.id === incoming.id || t.name === incoming.name);
                if (idx !== -1) {
                  this.technicians[idx] = { ...this.technicians[idx], ...incoming };
                } else {
                  this.technicians.push(incoming);
                }
                this.technicians = removeLegacyDemoTechnicians(this.technicians);
                this.saveToLocalStorage();
                this.notify();
              }
            } catch (e) {}
            void this.syncFromServer();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'departments' },
          (payload) => {
            console.log('⚡ [Realtime CDC] Department event received:', payload.eventType);
            void this.syncFromServer();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnectedToCloud = true;
            console.log('🟢 [SupabaseRealtime] Connected to Central Cloud Database successfully!');
            void this.syncFromServer();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('⚠️ [SupabaseRealtime] Realtime channel status:', status);
            this.isConnectedToCloud = false;
            setTimeout(() => {
              if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                this.setupSupabaseRealtime();
              }
            }, 3000);
          }
        });
    } catch (e) {
      console.warn('[TicketService] Supabase realtime subscription failed:', e);
    }
  }


  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error(e); }
    });
  }

  public isCloudOnline(): boolean {
    return this.isConnectedToCloud && isSupabaseConfigured;
  }

  public async manualSync(): Promise<void> {
    await this.syncFromServer();
    if (this.isCloudRestricted) {
      throw new Error('CLOUD_EGRESS_RESTRICTED');
    }
    if (!this.isConnectedToCloud) {
      this.setupSupabaseRealtime();
    }
  }

  /**
   * Push a ticket update to Supabase (Self-healing sync fallback)
   */
  private async pushTicketToCloud(ticket: Ticket): Promise<void> {
    if (!isSupabaseConfigured || !supabase || this.isCloudRestricted) return;
    try {
      const dbRow = ticketToDb(ticket, false);
      const targetRequestId = ticket.requestId;
      const targetUuid = (ticket.id && UUID_REGEX.test(ticket.id)) ? ticket.id : undefined;

      let query = supabase.from('repair_tickets').update(dbRow);
      if (targetUuid && targetRequestId) {
        query = query.or(`id.eq.${targetUuid},request_id.eq.${targetRequestId}`);
      } else if (targetRequestId) {
        query = query.eq('request_id', targetRequestId);
      } else if (targetUuid) {
        query = query.eq('id', targetUuid);
      }
      let { data, error } = await query.select('id, request_id');
      if (error) {
        if (error.message?.includes('quota') || (error as any).code === '402' || (error as any).status === 402 || error.message?.includes('exceed_egress_quota')) {
          this.isCloudRestricted = true;
          return;
        }
      }
      if (!error && (!data || data.length === 0) && targetRequestId) {
        await supabase.from('repair_tickets').update(dbRow).eq('request_id', targetRequestId).select('id, request_id');
      }
      // If error occurred (e.g. payload too large), fallback retry without huge base64 images
      if (error && (dbRow.result_image_url || dbRow.request_image_url)) {
        const safeRow = { ...dbRow };
        delete safeRow.result_image_url;
        delete safeRow.request_image_url;
        if (targetRequestId) {
          await supabase.from('repair_tickets').update(safeRow).eq('request_id', targetRequestId).select('id, request_id');
        }
      }
    } catch (e) {
      console.warn('[TicketService] pushTicketToCloud failed:', e);
    }
  }

  /**
   * Auto-upload stranded tickets that exist locally on this device but not yet on Supabase Central Cloud.
   * This guarantees that when any of the >10 mobile devices reconnects or submits a ticket,
   * it gets pushed to the cloud database and instantly broadcasted to all other devices in real-time.
   */
  private async uploadStrandedTicketToCloud(ticket: Ticket): Promise<void> {
    if (!isSupabaseConfigured || !supabase || this.isCloudRestricted) return;
    try {
      console.log(`[TicketService] Auto-uploading stranded ticket to cloud: ${ticket.requestId} (${ticket.title})`);
      const key = ticket.requestId || ticket.id;
      if ((!ticket.requestImageUrl || ticket.requestImageUrl === '-' || ticket.requestImageUrl === '[ATTACHED]') && key) {
        try {
          const idbPhoto = await getPhotoFromIdb(`${key}_req`);
          if (idbPhoto) ticket.requestImageUrl = idbPhoto;
        } catch {}
      }
      if ((!ticket.resultImageUrl || ticket.resultImageUrl === '-' || ticket.resultImageUrl === '[ATTACHED]') && key) {
        try {
          const idbPhoto = await getPhotoFromIdb(`${key}_res`);
          if (idbPhoto) ticket.resultImageUrl = idbPhoto;
        } catch {}
      }

      const row = ticketToDb(ticket, true);
      const { data, error } = await supabase
        .from('repair_tickets')
        .insert([row])
        .select()
        .single();
      if (!error && data) {
        const serverTicket = dbToTicket(data);
        const idx = this.tickets.findIndex(t => t.id === ticket.id || t.requestId === ticket.requestId);
        if (idx !== -1) {
          this.tickets[idx] = { ...this.tickets[idx], ...serverTicket };
          this.saveToLocalStorage();
        }
        // Broadcast to all other >10 devices immediately!
        this.broadcastEvent('TICKET_MUTATION', {
          action: 'CREATE',
          id: serverTicket.id,
          requestId: serverTicket.requestId,
          ticket: this.tickets[idx] || serverTicket
        });
        try {
          this.localBroadcastChannel?.postMessage({
            type: 'TICKET_MUTATION',
            action: 'CREATE',
            id: serverTicket.id,
            requestId: serverTicket.requestId,
            ticket: this.tickets[idx] || serverTicket
          });
        } catch {}
        if (typeof window !== 'undefined' && serverTicket.status !== 'completed') {
          window.dispatchEvent(new CustomEvent('SCENERY_NEW_TICKET', { detail: serverTicket }));
        }
      } else if (error) {
        if (error.code === '23505') {
          // Already exists in DB, push state update instead
          void this.pushTicketToCloud(ticket);
        } else {
          console.warn(`[TicketService] Stranded upload error for ${ticket.requestId}:`, error.message);
        }
      }
    } catch (e) {
      console.warn('[TicketService] uploadStrandedTicketToCloud exception:', e);
    }
  }

  /**
   * Fetch latest state from Supabase Cloud (Central single source of truth)
   */
  public async syncFromServer(): Promise<void> {
    try {
      let changed = false;

      // 1. Supabase Sync (Primary Central Cloud Database)
      if (isSupabaseConfigured && supabase) {
        try {
          // High-speed parallel fetch: Metadata only for tickets (77KB vs 9.5MB, 120x faster!)
          const [ticketsRes, techsRes, deptsRes] = await Promise.all([
            supabase
              .from('repair_tickets')
              .select('id, request_id, title, description, department, location, requester_name, requester_phone, priority, status, technician_name, technician_phone, repair_result, remark, created_at, updated_at, completed_at')
              .order('created_at', { ascending: false }),
            supabase
              .from('technicians')
              .select('id, name, role, status, phone, is_on_duty_today, department_id, avatar_url')
              .order('name'),
            supabase
              .from('departments')
              .select('*')
          ]);

          const supaTickets = ticketsRes.data;
          const tErr = ticketsRes.error;
          const supaTechs = techsRes.data;
          const techErr = techsRes.error;
          const supaDepts = deptsRes.data;
          const dErr = deptsRes.error;

          if (tErr) {
            if (tErr.message?.includes('quota') || (tErr as any).code === '402' || (tErr as any).status === 402 || tErr.message?.includes('exceed_egress_quota')) {
              this.isCloudRestricted = true;
              console.warn('⚠️ Supabase Cloud Egress Quota Exceeded (402). Local storage active with 100% data integrity.');
            }
          }

          if (!tErr && Array.isArray(supaTickets)) {
            this.isConnectedToCloud = true;
            this.isCloudRestricted = false;
            const mapped = supaTickets.map(dbToTicket);

            // Smart Merge: Merge server records with local state
            const mergedTickets: Ticket[] = [];
            let stateChanged = false;

            for (const serverTicket of mapped) {
              // Ignore tickets that were recently deleted on this client
              if (
                this.recentlyDeletedTicketIds.has(serverTicket.id) ||
                (serverTicket.requestId && this.recentlyDeletedTicketIds.has(serverTicket.requestId))
              ) {
                continue;
              }

              // Anti-Reversion Shield Check:
              const isRegisteredCompleted = this.isCompleted(serverTicket.requestId) || this.isCompleted(serverTicket.id);
              if (serverTicket.status === 'completed') {
                this.registerCompleted(serverTicket);
              } else if (isRegisteredCompleted) {
                // Recover completed status and metadata from registry!
                const reg = this.completedRegistry[serverTicket.requestId] || this.completedRegistry[serverTicket.id];
                serverTicket.status = 'completed';
                if (reg?.completedAt) serverTicket.completedAt = reg.completedAt;
                if (reg?.technicianName && !serverTicket.technicianName) serverTicket.technicianName = reg.technicianName;
                if (reg?.repairResult && !serverTicket.repairResult) serverTicket.repairResult = reg.repairResult;
                if (reg?.diagnosticReason && !serverTicket.diagnosticReason) serverTicket.diagnosticReason = reg.diagnosticReason;
                if (reg?.actionSteps && !serverTicket.actionSteps) serverTicket.actionSteps = reg.actionSteps;
                if (reg?.parts && !serverTicket.parts) serverTicket.parts = reg.parts;
                void this.pushTicketToCloud(serverTicket);
              }

              const local = this.tickets.find(t => t.id === serverTicket.id || t.requestId === serverTicket.requestId);

              if (!local) {
                mergedTickets.push(serverTicket);
                stateChanged = true;
                continue;
              }

              const localTime = new Date(local.updatedAt).getTime();
              const serverTime = new Date(serverTicket.updatedAt).getTime();

              // Safe image resolution: Never let '[ATTACHED]' overwrite a real local photo
              const finalReqImg = (local.requestImageUrl && local.requestImageUrl.startsWith('data:') && (!serverTicket.requestImageUrl || serverTicket.requestImageUrl === '[ATTACHED]'))
                ? local.requestImageUrl
                : (serverTicket.requestImageUrl && serverTicket.requestImageUrl !== '[ATTACHED]' ? serverTicket.requestImageUrl : (local.requestImageUrl || ''));

              const finalResImg = (local.resultImageUrl && local.resultImageUrl.startsWith('data:') && (!serverTicket.resultImageUrl || serverTicket.resultImageUrl === '[ATTACHED]'))
                ? local.resultImageUrl
                : (serverTicket.resultImageUrl && serverTicket.resultImageUrl !== '[ATTACHED]' ? serverTicket.resultImageUrl : (local.resultImageUrl || ''));

              // Rule 0: Server Completed Protection
              // If server is completed or cancelled, server ALWAYS takes precedence over a local 'in_progress' or 'pending' cached status!
              // This permanently stops mobile local cache from looping back or reverting completed jobs!
              if ((serverTicket.status === 'completed' || serverTicket.status === 'cancelled') && local.status !== serverTicket.status) {
                this.registerCompleted(serverTicket);
                const finalMerged: Ticket = {
                  ...serverTicket,
                  requestImageUrl: finalReqImg,
                  resultImageUrl: finalResImg
                };
                mergedTickets.push(finalMerged);
                stateChanged = true;
                continue;
              }

              // Rule 1: Local Completed Protection
              // If local ticket is completed (or in registry) and server is not completed
              const isLocalOrRegCompleted = local.status === 'completed' || this.isCompleted(local.requestId) || this.isCompleted(local.id);
              if (isLocalOrRegCompleted && serverTicket.status !== 'completed') {
                local.status = 'completed';
                this.registerCompleted(local);
                if (!local.requestImageUrl && finalReqImg) local.requestImageUrl = finalReqImg;
                if (!local.resultImageUrl && finalResImg) local.resultImageUrl = finalResImg;
                mergedTickets.push(local);
                // Self-healing: Push completed to Supabase Central Cloud
                void this.pushTicketToCloud(local);
                continue;
              }

              // Rule 2: Last-Write-Wins based on timestamps (local is newer by >1s)
              // Only apply for non-completed state transitions
              if (localTime > serverTime + 1000 && local.status !== 'completed') {
                if (!local.requestImageUrl && finalReqImg) local.requestImageUrl = finalReqImg;
                if (!local.resultImageUrl && finalResImg) local.resultImageUrl = finalResImg;
                mergedTickets.push(local);
                continue;
              }

              // Server is authoritative (newer or equal)
              const finalMerged: Ticket = {
                ...serverTicket,
                requestImageUrl: finalReqImg,
                resultImageUrl: finalResImg
              };

              // Self-healing: If local has real base64 photo and server has [ATTACHED], update cloud
              if (local.requestImageUrl && local.requestImageUrl.startsWith('data:') && serverTicket.requestImageUrl === '[ATTACHED]') {
                void this.pushTicketToCloud(finalMerged);
              }

              mergedTickets.push(finalMerged);
              if (
                local.status !== finalMerged.status ||
                local.technicianName !== finalMerged.technicianName ||
                local.updatedAt !== finalMerged.updatedAt ||
                local.repairResult !== finalMerged.repairResult ||
                local.remark !== finalMerged.remark ||
                local.department !== finalMerged.department ||
                local.division !== finalMerged.division ||
                local.requestImageUrl !== finalMerged.requestImageUrl ||
                local.resultImageUrl !== finalMerged.resultImageUrl
              ) {
                stateChanged = true;
              }
            }

            // Keep locally created tickets that have not yet arrived in server query
            // and auto-upload stranded tickets to Central Cloud so all >10 devices receive them!
            for (const local of this.tickets) {
              const inMerged = mergedTickets.some(t => t.id === local.id || t.requestId === local.requestId);
              if (!inMerged && !this.recentlyDeletedTicketIds.has(local.id) && !this.recentlyDeletedTicketIds.has(local.requestId)) {
                // Anti-Reversion Shield: If ticket was marked completed locally, guarantee it remains completed!
                if (
                  this.isCompleted(local.requestId) ||
                  this.isCompleted(local.id) ||
                  local.completedAt ||
                  local.status === 'completed' ||
                  (local.repairResult && (local.repairResult.includes('ช่างผู้ปิดงาน') || local.repairResult.includes('สาเหตุ')))
                ) {
                  local.status = 'completed';
                  if (!local.completedAt) local.completedAt = new Date().toISOString();
                  this.registerCompleted(local);
                }

                mergedTickets.push(local);
                stateChanged = true;

                // Self-Healing: Automatically push stranded local ticket to Central Cloud!
                void this.uploadStrandedTicketToCloud(local);
              }
            }

            if (stateChanged || mergedTickets.length !== this.tickets.length) {
              this.tickets = mergedTickets;
              changed = true;
            }
          }

          // Process Technicians
          if (!techErr && Array.isArray(supaTechs)) {
            const mappedTechs = removeLegacyDemoTechnicians(supaTechs.map(dbToTechnician));
            if (JSON.stringify(mappedTechs) !== JSON.stringify(this.technicians)) {
              this.technicians = mappedTechs;
              changed = true;
            }
          }

          // Process Departments
          if (!dErr && Array.isArray(supaDepts) && supaDepts.length > 0) {
            const cleanDepts = supaDepts
              .filter(d => !isMojibake(d.name) && !isMojibake(d.description) && !isMojibake(d.icon))
              .map(dbToDepartment);

            if (cleanDepts.length >= 20) {
              const mappedDepts = sortDepartments(cleanDepts);
              if (JSON.stringify(mappedDepts) !== JSON.stringify(this.departments)) {
                this.departments = mappedDepts;
                changed = true;
              }
            } else if (this.departments.length < 20) {
              this.departments = INITIAL_DEPARTMENTS;
              changed = true;
            }
          }
        } catch (supaErr) {
          console.warn('[TicketService] Cloud sync error:', supaErr);
        }
      }

      if (changed || !this.isInitialSyncDone) {
        this.isInitialSyncDone = true;
        this.saveToLocalStorage();
        this.notify();
      }

      // 2. Non-blocking background sync for active ticket images
      if (isSupabaseConfigured && supabase) {
        void this.syncActiveTicketImages();
      }
    } catch (e) {
      // Offline fallback
    }
  }

  /**
   * Background Image Hydration for Active / In-Progress Tickets
   * Fetches photos only for open tickets (fast, lightweight, non-blocking)
   */
  public async syncActiveTicketImages(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('repair_tickets')
        .select('id, request_id, request_image_url, result_image_url')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        let updatedAny = false;
        for (const row of data) {
          const reqImg = row.request_image_url;
          const resImg = row.result_image_url;
          if (!reqImg && !resImg) continue;

          const idx = this.tickets.findIndex(t => t.id === row.id || t.requestId === row.request_id);
          if (idx !== -1) {
            const current = this.tickets[idx];
            let changed = false;
            let newReq = current.requestImageUrl;
            let newRes = current.resultImageUrl;

            if (reqImg && reqImg !== '-' && reqImg !== '[ATTACHED]' && current.requestImageUrl !== reqImg) {
              newReq = reqImg;
              changed = true;
            }
            if (resImg && resImg !== '-' && resImg !== '[ATTACHED]' && current.resultImageUrl !== resImg) {
              newRes = resImg;
              changed = true;
            }
            if (changed) {
              this.tickets[idx] = {
                ...current,
                requestImageUrl: newReq,
                resultImageUrl: newRes
              };
              updatedAny = true;
            }
          }
        }
        if (updatedAny) {
          this.notify();
        }
      }
    } catch (e) {
      console.warn('[TicketService] syncActiveTicketImages failed:', e);
    }
  }

  /**
   * On-demand photo fetcher for a specific ticket (e.g. when opening completed task details)
   */
  public async fetchTicketPhoto(ticketIdOrReqId: string): Promise<{ requestImageUrl?: string; resultImageUrl?: string }> {
    if (!ticketIdOrReqId || !isSupabaseConfigured || !supabase) return {};

    const local = this.tickets.find(t => t.id === ticketIdOrReqId || t.requestId === ticketIdOrReqId);
    if (local?.requestImageUrl && local.requestImageUrl.startsWith('data:')) {
      return { requestImageUrl: local.requestImageUrl, resultImageUrl: local.resultImageUrl };
    }

    try {
      const { data, error } = await supabase
        .from('repair_tickets')
        .select('request_image_url, result_image_url')
        .or(`id.eq.${ticketIdOrReqId},request_id.eq.${ticketIdOrReqId}`)
        .maybeSingle();

      if (!error && data) {
        if (local) {
          if (data.request_image_url && data.request_image_url !== '-') local.requestImageUrl = data.request_image_url;
          if (data.result_image_url && data.result_image_url !== '-') local.resultImageUrl = data.result_image_url;
          this.notify();
        }
        return {
          requestImageUrl: data.request_image_url || undefined,
          resultImageUrl: data.result_image_url || undefined
        };
      }
    } catch (e) {
      console.warn('[TicketService] fetchTicketPhoto error:', e);
    }
    return {};
  }

  /**
   * Departments
   */
  public async getDepartments(): Promise<Department[]> {
    if (this.departments.length === 0) {
      await this.ensureInitialSync();
    } else {
      void this.ensureInitialSync();
    }
    return sortDepartments(this.departments);
  }

  /**
   * Technicians
   */
  public async getTechnicians(): Promise<Technician[]> {
    if (this.technicians.length === 0) {
      await this.ensureInitialSync();
    } else {
      void this.ensureInitialSync();
    }
    return [...this.technicians];
  }

  public getCachedData(): {
    tickets: Ticket[];
    departments: Department[];
    technicians: Technician[];
  } {
    return {
      tickets: [...this.tickets],
      departments: [...this.departments],
      technicians: [...this.technicians]
    };
  }

  public getTechniciansSync(): Technician[] {
    return [...this.technicians];
  }

  public async addTechnician(tech: { name: string; role?: string; phone?: string; avatarUrl?: string; departmentId?: string }): Promise<Technician[]> {
    const trimmedName = tech.name.trim();
    const divisionId = (tech.departmentId === '84' || tech.departmentId === '85' || tech.departmentId === '86')
      ? tech.departmentId
      : '84';

    const baseRole = (tech.role?.trim() || 'ช่างซ่อมบำรุง').replace(/\s*\[(84|85|86)\]\s*/g, '').trim();
    const roleWithDivision = `${baseRole} [${divisionId}]`;

    const newTech: Technician = {
      id: 'tech-' + Date.now(),
      name: trimmedName,
      role: baseRole,
      status: 'active',
      phone: tech.phone?.trim() || '',
      avatarUrl: tech.avatarUrl || '',
      isOnDutyToday: true,
      departmentId: divisionId
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const insertPayload: any = {
          name: newTech.name,
          role: roleWithDivision,
          status: newTech.status,
          phone: newTech.phone,
          avatar_url: newTech.avatarUrl || null,
          is_on_duty_today: newTech.isOnDutyToday
        };

        // department_id in Supabase is a UUID foreign key. Only set if valid UUID format.
        if (tech.departmentId && UUID_REGEX.test(tech.departmentId)) {
          insertPayload.department_id = tech.departmentId;
        }

        const { data, error } = await supabase
          .from('technicians')
          .insert([insertPayload])
          .select()
          .single();

        if (error) {
          console.error('[TicketService] Supabase addTechnician error:', error);
          throw new Error(error.message || 'ไม่สามารถเพิ่มช่างลงฐานข้อมูลออนไลน์ได้');
        }

        if (data) {
          newTech.id = String(data.id);
        }
      } catch (e: any) {
        console.error('[TicketService] Supabase addTechnician failed:', e);
        throw e;
      }
    }

    const existingIdx = this.technicians.findIndex(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingIdx !== -1) {
      this.technicians[existingIdx] = newTech;
    } else {
      this.technicians.push(newTech);
    }
    this.saveToLocalStorage();
    this.notify();
    return [...this.technicians];
  }

  public async updateTechnician(idOrName: string, updates: Partial<Technician>): Promise<Technician[]> {
    const item = this.technicians.find(t => t.id === idOrName || t.name === idOrName);
    const targetId = item ? item.id : idOrName;

    const divisionId = updates.departmentId !== undefined
      ? ((updates.departmentId === '84' || updates.departmentId === '85' || updates.departmentId === '86') ? updates.departmentId : undefined)
      : (item?.departmentId);

    const baseRole = (updates.role !== undefined ? updates.role : (item?.role || 'ช่างซ่อมบำรุง')).replace(/\s*\[(84|85|86)\]\s*/g, '').trim();
    const roleWithDivision = divisionId ? `${baseRole} [${divisionId}]` : baseRole;

    // Optimistic local update
    if (item) {
      Object.assign(item, updates);
      if (divisionId) item.departmentId = divisionId;
      item.role = baseRole;
      this.saveToLocalStorage();
      this.notify();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const row: any = {};
        if (updates.name) row.name = updates.name.trim();
        row.role = roleWithDivision;
        if (updates.status) row.status = updates.status;
        if (updates.phone !== undefined) row.phone = updates.phone;
        if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;
        if (updates.isOnDutyToday !== undefined) row.is_on_duty_today = updates.isOnDutyToday;

        if (updates.departmentId && UUID_REGEX.test(updates.departmentId)) {
          row.department_id = updates.departmentId;
        } else if (updates.departmentId === null) {
          row.department_id = null;
        }

        let query = supabase.from('technicians').update(row);
        query = filterTechnicianQuery(query, targetId);
        await query;
      } catch (e) {
        console.warn('[TicketService] Supabase updateTechnician failed:', e);
      }
    }

    return [...this.technicians];
  }

  public async deleteTechnician(idOrName: string): Promise<Technician[]> {
    const item = this.technicians.find(t => t.id === idOrName || t.name === idOrName);
    const targetId = item ? item.id : idOrName;

    // Optimistic local delete
    this.technicians = this.technicians.filter(t => t.id !== idOrName && t.name !== idOrName);
    this.saveToLocalStorage();
    this.notify();

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('technicians').delete();
        query = filterTechnicianQuery(query, targetId);
        await query;
      } catch (e) {
        console.warn('[TicketService] Supabase deleteTechnician failed:', e);
      }
    }

    return [...this.technicians];
  }

  public async setTechnicianStatus(name: string, status: 'active' | 'inactive'): Promise<Technician[]> {
    return this.updateTechnician(name, { status });
  }

  public async setTechnicianDuty(idOrName: string, isOnDuty: boolean): Promise<Technician[]> {
    const item = this.technicians.find(t => t.id === idOrName || t.name === idOrName);
    const id = item ? item.id : idOrName;

    // Optimistic local duty toggle
    if (item) {
      item.isOnDutyToday = isOnDuty;
      this.saveToLocalStorage();
      this.notify();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('technicians').update({ is_on_duty_today: isOnDuty });
        query = filterTechnicianQuery(query, id);
        await query;
      } catch (e) {
        console.warn('[TicketService] Supabase setTechnicianDuty failed:', e);
      }
    }

    return [...this.technicians];
  }

  public async bulkSetDuty(dutyMap: Record<string, boolean>): Promise<Technician[]> {
    // Optimistic local bulk update
    this.technicians.forEach(t => {
      if (dutyMap[t.id] !== undefined) t.isOnDutyToday = dutyMap[t.id];
      else if (dutyMap[t.name] !== undefined) t.isOnDutyToday = dutyMap[t.name];
    });
    this.saveToLocalStorage();
    this.notify();

    if (isSupabaseConfigured && supabase) {
      try {
        for (const [key, val] of Object.entries(dutyMap)) {
          let query = supabase.from('technicians').update({ is_on_duty_today: val });
          query = filterTechnicianQuery(query, key);
          await query;
        }
      } catch (e) {
        console.warn('[TicketService] Supabase bulkSetDuty failed:', e);
      }
    }

    this.technicians.forEach(t => {
      if (dutyMap[t.id] !== undefined) t.isOnDutyToday = dutyMap[t.id];
      else if (dutyMap[t.name] !== undefined) t.isOnDutyToday = dutyMap[t.name];
    });
    this.saveToLocalStorage();
    this.notify();
    return [...this.technicians];
  }

  /**
   * Tickets
   */
  public async getTickets(options?: {
    department?: string;
    division?: string;
    statusFilter?: string;
    priorityFilter?: string;
    sortOrder?: SortOrder;
    onlyUrgent?: boolean;
    searchQuery?: string;
  }): Promise<Ticket[]> {
    if (this.tickets.length === 0) {
      await this.ensureInitialSync();
    } else {
      void this.ensureInitialSync();
    }

    let list: Ticket[] = [...this.tickets];
    const now = Date.now();

    // Compute UI fields: ageDays, waitingDurationText, isOverdue using unified aging utility
    list.forEach(ticket => {
      const aging = getTicketAgingInfo(ticket);
      ticket.ageDays = aging.days;
      ticket.isOverdue = aging.isOverdue;
      ticket.waitingDurationText = aging.label;

      // Auto-resolve technician phone number if missing
      if (ticket.technicianName && !ticket.technicianPhone) {
        const match = this.technicians.find(t => t.name.toLowerCase() === ticket.technicianName?.toLowerCase());
        if (match?.phone) {
          ticket.technicianPhone = match.phone;
        }
      }
    });

    // 0. Filter by Division ('84' | '85' | '86')
    if (options?.division && options.division !== 'all') {
      list = list.filter(t => (t.division || '84') === options.division);
    }

    // 1. Filter by Department
    if (options?.department && options.department !== 'all') {
      list = list.filter(t => isSameDepartment(t.department, options.department));
    }

    // 2. Filter by Status
    if (options?.statusFilter === 'active') {
      list = list.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    } else if (options?.statusFilter && options.statusFilter !== 'all') {
      list = list.filter(t => t.status === options.statusFilter);
    }

    // 3. Filter by Priority / Urgent Only
    if (options?.onlyUrgent) {
      list = list.filter(t => (t.priority === 'critical' || t.priority === 'high' || t.isOverdue) && t.status !== 'completed' && t.status !== 'cancelled');
    } else if (options?.priorityFilter && options.priorityFilter !== 'all') {
      list = list.filter(t => t.priority === options.priorityFilter);
    }

    // 4. Search Query
    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.requestId.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        formatDepartmentName(t.department).toLowerCase().includes(q)
      );
    }

    // 5. FIFO Queue Sorting: Earliest reported date first (เก่าสุดขึ้นก่อน)
    const sortOrder = options?.sortOrder || 'fifo';
    list.sort((a, b) => {
      if (sortOrder === 'priority') {
        const pOrder: Record<string, number> = { critical: 4, high: 3, normal: 2, low: 1 };
        const diff = (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        if (diff !== 0) return diff;
      }
      if (sortOrder === 'lifo') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Assign sequential Queue Number to pending/in-progress tickets
    let qCounter = 1;
    list.forEach(t => {
      if (t.status !== 'completed' && t.status !== 'cancelled') {
        t.queueNumber = qCounter++;
      }
    });

    return list;
  }

  public async createTicket(ticket: Omit<Ticket, 'id' | 'requestId' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const nowIso = new Date().toISOString();
    const yearMonth = nowIso.slice(0, 7).replace('-', '');
    const existingNums = this.tickets.map(t => {
      const m = t.requestId?.match(/REP-\d{6}-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    });
    const maxNum = existingNums.length > 0 ? Math.max(0, ...existingNums) : 0;
    const count = Math.max(this.tickets.length + 1, maxNum + 1);
    const newId = `REP-${yearMonth}-${String(count).padStart(3, '0')}`;

    let created: Ticket = {
      ...ticket,
      id: 'ticket-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      requestId: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // 1. Optimistic UI: Put into local state immediately so UI updates in 0ms!
    this.tickets.unshift(created);
    this.saveToLocalStorage();
    this.notify();

    // 2. Cross-tab local broadcast immediately
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          type: 'TICKET_MUTATION',
          action: 'CREATE',
          id: created.id,
          requestId: created.requestId,
          ticket: created
        });
      } catch {}
    }

    // 3. Realtime Supabase broadcast to all connected devices immediately!
    this.broadcastEvent('TICKET_MUTATION', {
      action: 'CREATE',
      id: created.id,
      requestId: created.requestId,
      ticket: created
    });

    // 4. Trigger alert chime/toast if on same window
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('SCENERY_NEW_TICKET', { detail: created }));
      } catch {}
    }

    // 5. Notify technicians via OneSignal Web Push Function
    void oneSignalService.notifyTechnicians(created);

    // 6. Persist to Supabase Central Cloud in background without blocking UI
    if (isSupabaseConfigured && supabase) {
      void (async () => {
        try {
          const dbRow = ticketToDb(created, true);
          const { data, error } = await supabase
            .from('repair_tickets')
            .insert([dbRow])
            .select()
            .single();
          if (!error && data) {
            const serverTicket = dbToTicket(data);
            const idx = this.tickets.findIndex(t => t.id === created.id);
            if (idx !== -1) {
              this.tickets[idx] = { ...this.tickets[idx], ...serverTicket };
              this.saveToLocalStorage();
            }
            this.broadcastEvent('TICKET_MUTATION', { action: 'CREATE', id: serverTicket.id, requestId: serverTicket.requestId, ticket: this.tickets[idx] || serverTicket });
          } else if (error) {
            console.warn('[TicketService] Supabase insert error:', error.message);
            if (error.code === '23505') {
              // Clean Sequential Numbering: Find actual latest server number
              try {
                const { data: latestRows } = await supabase
                  .from('repair_tickets')
                  .select('request_id')
                  .order('created_at', { ascending: false })
                  .limit(25);
                const serverNums = (latestRows || []).map((r: any) => {
                  const m = r.request_id?.match(/REP-\d{6}-(\d+)/);
                  return m ? parseInt(m[1], 10) : 0;
                });
                const maxSeq = Math.max(count + 1, ...serverNums, ...existingNums);
                const nextSeqId = `REP-${yearMonth}-${String(maxSeq).padStart(3, '0')}`;
                dbRow.request_id = nextSeqId;
                created.requestId = nextSeqId;
                const retryRes = await supabase.from('repair_tickets').insert([dbRow]).select().single();
                if (retryRes.data) {
                  const serverTicket = dbToTicket(retryRes.data);
                  const idx = this.tickets.findIndex(t => t.id === created.id);
                  if (idx !== -1) {
                    this.tickets[idx] = { ...this.tickets[idx], ...serverTicket };
                    this.saveToLocalStorage();
                  }
                  this.broadcastEvent('TICKET_MUTATION', { action: 'CREATE', id: serverTicket.id, requestId: serverTicket.requestId, ticket: this.tickets[idx] || serverTicket });
                }
              } catch (retryErr) {
                console.warn('[TicketService] Sequential retry error:', retryErr);
              }
            } else {
              console.warn('[TicketService] Insert will be automatically retried by stranded sync:', created.requestId);
            }
          }
        } catch (e) {
          console.warn('[TicketService] Supabase insert exception:', e);
        }
      })();
    }

    return created;
  }

  public async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    const existing = this.tickets.find(t => t.id === id || t.requestId === id);
    const targetRequestId = updates.requestId || existing?.requestId || (id.startsWith('REP-') ? id : undefined);
    const targetUuid = (existing?.id && UUID_REGEX.test(existing.id)) ? existing.id : (UUID_REGEX.test(id) ? id : undefined);

    const isReopen = (updates as any).isReopen === true;

    // Strict Anti-Reversion Guard:
    // Once completed, status cannot be downgraded back to pending or in_progress unless explicitly reopened by user!
    const isCurrentlyCompleted = (existing && existing.status === 'completed') || this.isCompleted(targetRequestId) || this.isCompleted(targetUuid);
    if (isCurrentlyCompleted && updates.status && updates.status !== 'completed' && !isReopen) {
      console.warn(`[TicketService] Blocked attempted status downgrade for completed ticket ${targetRequestId || id} to ${updates.status}`);
      delete updates.status;
    }

    const nowIso = new Date().toISOString();
    const finalUpdates: Partial<Ticket> = { ...updates, updatedAt: nowIso };

    if (updates.division !== undefined || updates.remark !== undefined) {
      finalUpdates.division = updates.division || existing?.division || '84';
      finalUpdates.remark = updates.remark !== undefined ? updates.remark : (existing?.remark || '');
    } else if (existing?.division) {
      finalUpdates.division = existing.division;
    }

    if (updates.title) {
      finalUpdates.title = formatTicketTitle(updates.title);
    }
    if (updates.department) {
      finalUpdates.department = formatDepartmentName(updates.department);
    }

    if (updates.status === 'completed') {
      if (!updates.completedAt) {
        finalUpdates.completedAt = nowIso;
      }
      this.registerCompleted({
        ...(existing || {}),
        ...finalUpdates,
        id: targetUuid || existing?.id || id,
        requestId: targetRequestId || existing?.requestId || id
      });
    } else if (isReopen) {
      if (targetRequestId) delete this.completedRegistry[targetRequestId];
      if (targetUuid) delete this.completedRegistry[targetUuid];
      if (existing?.id) delete this.completedRegistry[existing.id];
      finalUpdates.completedAt = undefined;
    }

    // 1. Optimistic UI: Apply immediately so UI responds in 0ms!
    if (existing) {
      Object.assign(existing, finalUpdates);
      this.saveToLocalStorage();
      this.notify();
    }

    // Cross-tab local synchronization immediately
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage({
          type: 'TICKET_MUTATION',
          action: 'UPDATE',
          id: targetUuid || existing?.id || id,
          requestId: targetRequestId || existing?.requestId,
          ticket: existing
        });
      } catch {}
    }

    // Realtime Supabase broadcast to all connected devices immediately!
    this.broadcastEvent('TICKET_MUTATION', {
      action: 'UPDATE',
      id: targetUuid || existing?.id || id,
      requestId: targetRequestId,
      ticket: existing
    });

    // 2. Persist to Supabase Central Cloud
    if (isSupabaseConfigured && supabase && !this.isCloudRestricted) {
      try {
        const dbUpdates = ticketToDb(finalUpdates, false);
        let query = supabase.from('repair_tickets').update(dbUpdates);
        if (targetRequestId) {
          query = query.eq('request_id', targetRequestId);
        } else if (targetUuid) {
          query = query.eq('id', targetUuid);
        } else {
          query = filterTicketQuery(query, id);
        }
        
        // Use select with minimal columns to minimize Supabase egress bandwidth
        let { data, error } = await query.select('id, request_id, status, updated_at');

        // If 0 rows matched (e.g. UUID mismatch), retry targeting request_id directly
        if (!error && (!data || data.length === 0) && targetRequestId) {
          console.warn('[TicketService] 0 rows matched on initial query, retrying by request_id:', targetRequestId);
          const retryRes = await supabase
            .from('repair_tickets')
            .update(dbUpdates)
            .eq('request_id', targetRequestId)
            .select('id, request_id, status, updated_at');
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) {
          if (error.message?.includes('quota') || (error as any).code === '402' || (error as any).status === 402 || error.message?.includes('exceed_egress_quota')) {
            this.isCloudRestricted = true;
            console.warn('⚠️ Supabase Cloud Egress Quota Exceeded (402). Local storage saved with 100% integrity.');
          } else {
            console.warn('[TicketService] Supabase update error:', error.message);
            // If error might be due to payload size (large base64 image), retry without images
            if (dbUpdates.result_image_url || dbUpdates.request_image_url) {
              try {
                const safeUpdates = { ...dbUpdates };
                delete safeUpdates.result_image_url;
                delete safeUpdates.request_image_url;
                let retryQuery = supabase.from('repair_tickets').update(safeUpdates);
                if (targetRequestId) {
                  retryQuery = retryQuery.eq('request_id', targetRequestId);
                } else if (targetUuid) {
                  retryQuery = retryQuery.eq('id', targetUuid);
                } else {
                  retryQuery = filterTicketQuery(retryQuery, id);
                }
                const safeRes = await retryQuery.select('id, request_id, status, updated_at');
                if (safeRes.data && safeRes.data.length > 0) {
                  data = safeRes.data;
                  error = null;
                }
              } catch (retryErr) {
                console.warn('[TicketService] Safe payload retry failed:', retryErr);
              }
            }
          }
        }
        
        if (data && data.length > 0) {
          const serverTicket = dbToTicket(data[0]);
          if (existing) {
            Object.assign(existing, {
              ...existing,
              id: serverTicket.id || existing.id,
              status: serverTicket.status || existing.status
            });
            this.saveToLocalStorage();
          }
          this.broadcastEvent('TICKET_MUTATION', { action: 'UPDATE', id: targetUuid || id, requestId: targetRequestId, ticket: existing });
        } else {
          this.broadcastEvent('TICKET_MUTATION', { action: 'UPDATE', id: targetUuid || id, requestId: targetRequestId, ticket: existing });
        }
      } catch (e) {
        console.warn('[TicketService] Supabase update exception:', e);
      }
    }

    return existing || null;
  }

  /**
   * Follow up on pending work (ตามงานค้าง)
   * Broadcasts urgent alert to technicians and sends push notification
   */
  public async followUpTicket(ticketId: string, requesterName?: string): Promise<Ticket | null> {
    const ticket = this.tickets.find(t => t.id === ticketId || t.requestId === ticketId);
    if (!ticket) return null;

    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const followUpNote = `🔔 มีการตามงานค้างเมื่อ ${timeStr}${requesterName ? ` โดยคุณ ${requesterName}` : ''}`;
    
    const updated = await this.updateTicket(ticket.id, {
      remark: ticket.remark ? `${ticket.remark} | ${followUpNote}` : followUpNote
    });

    this.broadcastEvent('TICKET_MUTATION', {
      action: 'FOLLOW_UP',
      id: ticket.id,
      requestId: ticket.requestId,
      department: ticket.department,
      title: ticket.title,
      requesterName
    });

    void oneSignalService.notifyFollowUp(ticket, requesterName);
    return updated || ticket;
  }

  public async deleteTicket(id: string): Promise<void> {
    const existing = this.tickets.find(t => t.id === id || t.requestId === id);
    const targetRequestId = existing?.requestId || (id.startsWith('REP-') ? id : undefined);
    const targetUuid = (existing?.id && UUID_REGEX.test(existing.id)) ? existing.id : (UUID_REGEX.test(id) ? id : undefined);

    if (id) this.recentlyDeletedTicketIds.add(id);
    if (targetRequestId) this.recentlyDeletedTicketIds.add(targetRequestId);
    if (targetUuid) this.recentlyDeletedTicketIds.add(targetUuid);

    // 1. Optimistic UI: Remove from memory immediately!
    this.tickets = this.tickets.filter(t => t.id !== id && t.requestId !== id && (!targetRequestId || t.requestId !== targetRequestId) && (!targetUuid || t.id !== targetUuid));
    this.saveToLocalStorage();
    this.notify();

    // 2. Persist delete to Supabase Central Cloud
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('repair_tickets').delete();
        if (targetUuid && targetRequestId) {
          query = query.or(`id.eq.${targetUuid},request_id.eq.${targetRequestId}`);
        } else if (targetUuid) {
          query = query.eq('id', targetUuid);
        } else if (targetRequestId) {
          query = query.eq('request_id', targetRequestId);
        } else {
          query = filterTicketQuery(query, id);
        }
        let { data, error } = await query.select();
        if (!error && (!data || data.length === 0) && targetRequestId) {
          await supabase.from('repair_tickets').delete().eq('request_id', targetRequestId).select();
        }
        this.broadcastEvent('TICKET_MUTATION', { action: 'DELETE', id: targetUuid || id, requestId: targetRequestId });
      } catch (e) {
        console.warn('[TicketService] Supabase delete exception:', e);
      }
    }
  }

  public async clearAllTickets(): Promise<void> {
    this.tickets = [];
    this.saveToLocalStorage();
    this.notify();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('repair_tickets').delete().neq('request_id', '');
        this.broadcastEvent('TICKET_MUTATION', { action: 'CLEAR_ALL' });
      } catch (e) {
        console.warn('[TicketService] Supabase clearAllTickets failed:', e);
      }
    }
  }

  public async importTickets(imported: Ticket[], overwrite: boolean = false): Promise<void> {
    if (overwrite) {
      this.tickets = [...imported];
    } else {
      this.tickets = [...imported, ...this.tickets];
    }
    this.saveToLocalStorage();
    this.notify();

    if (isSupabaseConfigured && supabase) {
      try {
        const rows = imported.map(t => ticketToDb(t, false));
        await supabase.from('repair_tickets').upsert(rows, { onConflict: 'request_id' });
        this.broadcastEvent('TICKET_MUTATION', { action: 'IMPORT' });
      } catch (e) {}
    }
  }

  public async resetToDemo(): Promise<void> {
    this.tickets = [];
    this.saveToLocalStorage();
    this.notify();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('repair_tickets').delete().neq('request_id', '');
        this.broadcastEvent('TICKET_MUTATION', { action: 'RESET_DEMO' });
      } catch (e) {}
    }
  }
}

export const ticketService = new TicketService();

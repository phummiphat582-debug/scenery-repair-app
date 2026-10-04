import { Ticket, Department, Technician, SortOrder, DivisionId } from '../types';
import { INITIAL_DEPARTMENTS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getTicketAgingInfo } from '../lib/ticketAging';

const LOCAL_STORAGE_TICKETS = 'scenery_repair_v5_tickets';
const LOCAL_STORAGE_DEPTS = 'scenery_repair_v5_departments';
const LOCAL_STORAGE_TECHS = 'scenery_repair_v5_technicians';

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

  // Extract from combined repairResult if not directly present in columns
  if (!diagnosticReason && repairResult) {
    const diagMatch = repairResult.match(/สาเหตุ(?:ของปัญหา)?:\s*([^\n\r]+)/);
    if (diagMatch) diagnosticReason = diagMatch[1].trim();
  }
  if (!actionSteps && repairResult) {
    const actionMatch = repairResult.match(/วิธีแก้ไข(?:[^:\n\r]+)?:\s*([^\n\r]+)/);
    if (actionMatch) actionSteps = actionMatch[1].trim();
  }

  return {
    id: String(row.id),
    requestId: row.request_id || row.requestId || String(row.id),
    title: row.title || '',
    description: row.description || '',
    department: row.department || '',
    location: row.location || '',
    requesterName: row.requester_name || row.requesterName || '',
    requesterPhone: row.requester_phone || row.requesterPhone || '',
    priority: row.priority || 'normal',
    status: row.status || 'pending',
    technicianName: row.technician_name || row.technicianName || '',
    technicianPhone: row.technician_phone || row.technicianPhone || '',
    repairResult,
    remark: row.remark || '',
    requestImageUrl: row.request_image_url || row.requestImageUrl || '',
    resultImageUrl: row.result_image_url || row.resultImageUrl || '',
    division: (row.division as DivisionId) || '84',
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
  if (t.division !== undefined) {
    row.division = t.division;
  } else if (isNewTicket) {
    row.division = '84';
  }
  if (t.title !== undefined) row.title = t.title;
  if (t.description !== undefined) row.description = t.description;
  if (t.department !== undefined) {
    row.department = t.department || '0 ฟร้อน';
  } else if (isNewTicket) {
    row.department = '0 ฟร้อน';
  }
  if (t.location !== undefined) row.location = t.location;
  if (t.requesterName !== undefined) row.requester_name = t.requesterName;
  if (t.requesterPhone !== undefined) row.requester_phone = t.requesterPhone;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.status !== undefined) row.status = t.status;
  if (t.technicianName !== undefined) row.technician_name = t.technicianName;
  if (t.technicianPhone !== undefined) row.technician_phone = t.technicianPhone;
  if (t.repairResult !== undefined) row.repair_result = t.repairResult;
  if (t.remark !== undefined) row.remark = t.remark;
  if (t.requestImageUrl !== undefined) row.request_image_url = t.requestImageUrl;
  if (t.resultImageUrl !== undefined) row.result_image_url = t.resultImageUrl;
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
  return {
    id: String(row.id),
    name: row.name,
    code: row.code,
    icon: row.icon || '📌',
    color: row.color || '#0f766e',
    description: row.description || ''
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

  constructor() {
    this.initLocalData();
    this.startRealtime();
    this.setupWindowListeners();
  }

  private initLocalData() {
    try {
      ['scenery_repair_tickets', 'scenery_repair_v2_tickets', 'scenery_repair_v3_tickets', 'scenery_repair_v4_tickets'].forEach(key => {
        localStorage.removeItem(key);
      });

      const savedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS);
      this.tickets = savedTickets ? JSON.parse(savedTickets) : [];
      this.tickets.forEach(t => {
        if (t.requesterName && t.requesterName.includes('าดสดส')) {
          t.requesterName = '';
        }
      });

      const savedDepts = localStorage.getItem(LOCAL_STORAGE_DEPTS);
      const parsedDepts = savedDepts ? JSON.parse(savedDepts) : null;
      if (Array.isArray(parsedDepts) && parsedDepts.some(d => d.code === '0' || d.name?.includes('ฟร้อน'))) {
        this.departments = sortDepartments(parsedDepts);
      } else {
        this.departments = INITIAL_DEPARTMENTS;
      }

      const savedTechs = localStorage.getItem(LOCAL_STORAGE_TECHS);
      const parsedTechs = savedTechs ? JSON.parse(savedTechs) : [];
      this.technicians = Array.isArray(parsedTechs) ? removeLegacyDemoTechnicians(parsedTechs) : [];
      this.saveToLocalStorage();
    } catch (e) {
      this.tickets = [];
      this.departments = INITIAL_DEPARTMENTS;
      this.technicians = [];
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_TICKETS, JSON.stringify(this.tickets));
      localStorage.setItem(LOCAL_STORAGE_DEPTS, JSON.stringify(this.departments));
      localStorage.setItem(LOCAL_STORAGE_TECHS, JSON.stringify(this.technicians));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private setupWindowListeners() {
    if (typeof window === 'undefined') return;

    // Fast sync when user switches back to this tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.syncFromServer();
        if (!this.isConnectedToCloud) {
          this.setupSupabaseRealtime();
        }
      }
    });

    // Fast sync when browser window regains focus
    window.addEventListener('focus', () => {
      void this.syncFromServer();
      if (!this.isConnectedToCloud) {
        this.setupSupabaseRealtime();
      }
    });

    // Fast sync when device comes back online
    window.addEventListener('online', () => {
      void this.syncFromServer();
      this.setupSupabaseRealtime();
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
    if (this.supabaseChannel && this.isConnectedToCloud) {
      try {
        let cleanPayload = payload;
        if (payload?.ticket) {
          const { requestImageUrl, resultImageUrl, ...rest } = payload.ticket;
          cleanPayload = {
            ...payload,
            ticket: {
              ...rest,
              requestImageUrl: requestImageUrl && requestImageUrl.length > 200 ? '[ATTACHED]' : requestImageUrl,
              resultImageUrl: resultImageUrl && resultImageUrl.length > 200 ? '[ATTACHED]' : resultImageUrl
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
    if (!isSupabaseConfigured || !supabase) return;

    if (this.supabaseChannel) {
      try {
        supabase.removeChannel(this.supabaseChannel);
      } catch {}
      this.supabaseChannel = null;
    }

    try {
      this.supabaseChannel = supabase
        .channel('scenery_realtime_db_channel', {
          config: {
            broadcast: { self: false }
          }
        })
        .on(
          'broadcast',
          { event: 'TICKET_MUTATION' },
          (payload) => {
            console.log('⚡ [Realtime Broadcast] Mutation from peer received:', payload);
            void this.syncFromServer();
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
                if (!this.recentlyDeletedTicketIds.has(incoming.id) && !this.recentlyDeletedTicketIds.has(incoming.requestId)) {
                  const existingIdx = this.tickets.findIndex(t => t.id === incoming.id || t.requestId === incoming.requestId);
                  if (existingIdx === -1) {
                    this.tickets.unshift(incoming);
                    this.saveToLocalStorage();
                    this.notify();
                  }
                }
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const incoming = dbToTicket(payload.new);
                const existingIdx = this.tickets.findIndex(t => t.id === incoming.id || t.requestId === incoming.requestId);
                if (existingIdx !== -1) {
                  const local = this.tickets[existingIdx];
                  if (!(local.status === 'completed' && incoming.status !== 'completed')) {
                    this.tickets[existingIdx] = { ...local, ...incoming };
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
    if (!this.isConnectedToCloud) {
      this.setupSupabaseRealtime();
    }
  }

  /**
   * Push a ticket update to Supabase (Self-healing sync fallback)
   */
  private async pushTicketToCloud(ticket: Ticket): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
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
      let { data, error } = await query.select();
      if (!error && (!data || data.length === 0) && targetRequestId) {
        await supabase.from('repair_tickets').update(dbRow).eq('request_id', targetRequestId).select();
      }
    } catch (e) {
      console.warn('[TicketService] pushTicketToCloud failed:', e);
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
          // Parallel fetch of Tickets, Technicians, and Departments for high speed
          const [ticketsRes, techsRes, deptsRes] = await Promise.all([
            supabase
              .from('repair_tickets')
              .select('*')
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

          if (!tErr && Array.isArray(supaTickets)) {
            this.isConnectedToCloud = true;
            const mapped = supaTickets.map(dbToTicket);

            // Smart Merge: Merge server records with local state
            // Crucial: NEVER overwrite a local 'completed' status with an older server 'in_progress' status!
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

              const local = this.tickets.find(t => t.id === serverTicket.id || t.requestId === serverTicket.requestId);

              if (!local) {
                mergedTickets.push(serverTicket);
                stateChanged = true;
                continue;
              }

              const localTime = new Date(local.updatedAt).getTime();
              const serverTime = new Date(serverTicket.updatedAt).getTime();

              // Rule 1: Completed protection - If local ticket is completed and server is not completed
              if (local.status === 'completed' && serverTicket.status !== 'completed') {
                // If local completion is newer or happened recently (within 10 minutes), preserve completed!
                if (localTime >= serverTime || (Date.now() - localTime) < 10 * 60 * 1000) {
                  mergedTickets.push(local);
                  // Self-healing: If server is older by more than 2 seconds, re-push to Supabase in background
                  if (serverTime < localTime - 2000) {
                    void this.pushTicketToCloud(local);
                  }
                  continue;
                }
              }

              // Rule 2: Last-Write-Wins based on timestamps (local is newer by >1s)
              if (localTime > serverTime + 1000) {
                mergedTickets.push(local);
                continue;
              }

              // Server is authoritative (newer or equal)
              mergedTickets.push(serverTicket);
              if (
                local.status !== serverTicket.status ||
                local.technicianName !== serverTicket.technicianName ||
                local.updatedAt !== serverTicket.updatedAt ||
                local.repairResult !== serverTicket.repairResult ||
                local.remark !== serverTicket.remark ||
                local.department !== serverTicket.department ||
                local.division !== serverTicket.division
              ) {
                stateChanged = true;
              }
            }

            // Keep locally created tickets that have not yet arrived in server query
            for (const local of this.tickets) {
              const inMerged = mergedTickets.some(t => t.id === local.id || t.requestId === local.requestId);
              if (!inMerged && !this.recentlyDeletedTicketIds.has(local.id) && !this.recentlyDeletedTicketIds.has(local.requestId)) {
                const localCreatedTime = new Date(local.createdAt).getTime();
                if (Date.now() - localCreatedTime < 5 * 60 * 1000) {
                  mergedTickets.push(local);
                  stateChanged = true;
                }
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
            const mappedDepts = sortDepartments(supaDepts.map(dbToDepartment));
            if (JSON.stringify(mappedDepts) !== JSON.stringify(this.departments)) {
              this.departments = mappedDepts;
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
    } catch (e) {
      // Offline fallback
    }
  }

  /**
   * Departments
   */
  public async getDepartments(): Promise<Department[]> {
    await this.ensureInitialSync();
    return sortDepartments(this.departments);
  }

  /**
   * Technicians
   */
  public async getTechnicians(): Promise<Technician[]> {
    await this.ensureInitialSync();
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
    await this.ensureInitialSync();

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
      list = list.filter(t => t.department === options.department);
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
        t.department.toLowerCase().includes(q)
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
    const count = this.tickets.length + 1;
    const yearMonth = nowIso.slice(0, 7).replace('-', '');
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

    // 2. Persist to Supabase Central Cloud in background without blocking UI
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
            this.broadcastEvent('TICKET_MUTATION', { action: 'CREATE', id: serverTicket.id, requestId: serverTicket.requestId });
          } else if (error) {
            console.warn('[TicketService] Supabase insert error:', error.message);
            if (error.code === '23505') {
              const fallbackId = `REP-${yearMonth}-${Date.now().toString().slice(-4)}`;
              dbRow.request_id = fallbackId;
              created.requestId = fallbackId;
              const retryRes = await supabase.from('repair_tickets').insert([dbRow]).select().single();
              if (retryRes.data) {
                const serverTicket = dbToTicket(retryRes.data);
                const idx = this.tickets.findIndex(t => t.id === created.id);
                if (idx !== -1) {
                  this.tickets[idx] = { ...this.tickets[idx], ...serverTicket };
                  this.saveToLocalStorage();
                }
                this.broadcastEvent('TICKET_MUTATION', { action: 'CREATE', id: serverTicket.id, requestId: serverTicket.requestId });
              }
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

    const nowIso = new Date().toISOString();
    const finalUpdates: Partial<Ticket> = { ...updates, updatedAt: nowIso };
    if (updates.status === 'completed' && !updates.completedAt) {
      finalUpdates.completedAt = nowIso;
    }

    // 1. Optimistic UI: Apply immediately so UI responds in 0ms!
    if (existing) {
      Object.assign(existing, finalUpdates);
      this.saveToLocalStorage();
      this.notify();
    }

    // 2. Persist to Supabase Central Cloud
    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdates = ticketToDb(finalUpdates, false);
        let query = supabase.from('repair_tickets').update(dbUpdates);
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

        // If 0 rows matched (e.g. UUID mismatch), retry targeting request_id directly
        if (!error && (!data || data.length === 0) && targetRequestId) {
          console.warn('[TicketService] 0 rows matched on initial query, retrying by request_id:', targetRequestId);
          const retryRes = await supabase
            .from('repair_tickets')
            .update(dbUpdates)
            .eq('request_id', targetRequestId)
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) {
          console.warn('[TicketService] Supabase update error:', error.message);
        } else if (data && data.length > 0) {
          const serverTicket = dbToTicket(data[0]);
          if (existing) {
            Object.assign(existing, serverTicket);
            this.saveToLocalStorage();
          }
          this.broadcastEvent('TICKET_MUTATION', { action: 'UPDATE', id: serverTicket.id, requestId: serverTicket.requestId });
        } else {
          this.broadcastEvent('TICKET_MUTATION', { action: 'UPDATE', id: targetUuid || id, requestId: targetRequestId });
        }
      } catch (e) {
        console.warn('[TicketService] Supabase update exception:', e);
      }
    }

    return existing || null;
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

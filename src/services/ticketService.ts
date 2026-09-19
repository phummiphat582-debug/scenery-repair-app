import { Ticket, Department, Technician, SortOrder } from '../types';
import { INITIAL_DEPARTMENTS, INITIAL_TECHNICIANS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_TICKETS = 'scenery_repair_v5_tickets';
const LOCAL_STORAGE_DEPTS = 'scenery_repair_v5_departments';
const LOCAL_STORAGE_TECHS = 'scenery_repair_v5_technicians';

// Database mapping utilities (PostgreSQL snake_case <-> Frontend camelCase)
function dbToTicket(row: any): Ticket {
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
    repairResult: row.repair_result || row.repairResult || '',
    remark: row.remark || '',
    requestImageUrl: row.request_image_url || row.requestImageUrl || '',
    resultImageUrl: row.result_image_url || row.resultImageUrl || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    completedAt: row.completed_at || row.completedAt || undefined
  };
}

function ticketToDb(t: Partial<Ticket>): any {
  const row: any = {};
  if (t.id && !t.id.startsWith('ticket-')) row.id = t.id;
  if (t.requestId) row.request_id = t.requestId;
  if (t.title !== undefined) row.title = t.title;
  if (t.description !== undefined) row.description = t.description;
  if (t.department !== undefined) row.department = t.department;
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
  if (t.createdAt) row.created_at = t.createdAt;
  if (t.updatedAt) row.updated_at = t.updatedAt;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt;
  return row;
}

function dbToTechnician(row: any): Technician {
  return {
    id: String(row.id),
    name: row.name,
    role: row.role || 'ช่างซ่อมบำรุง',
    status: row.status || 'active',
    phone: row.phone || '',
    avatarUrl: row.avatar_url || row.avatarUrl || '',
    isOnDutyToday: row.is_on_duty_today ?? row.isOnDutyToday ?? true
  };
}

class TicketService {
  private tickets: Ticket[] = [];
  private departments: Department[] = [];
  private technicians: Technician[] = [];
  private listeners: Set<() => void> = new Set();
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private isInitialSyncDone = false;
  private initialSyncPromise: Promise<void> | null = null;
  private supabaseChannel: any = null;

  constructor() {
    this.initLocalData();
    this.startRealtime();
  }

  private initLocalData() {
    try {
      // Clear legacy storage keys with demo data
      ['scenery_repair_tickets', 'scenery_repair_v2_tickets', 'scenery_repair_v3_tickets', 'scenery_repair_v4_tickets'].forEach(key => {
        localStorage.removeItem(key);
      });

      // Strictly empty tickets by default — ZERO DEMO TICKETS
      const savedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS);
      this.tickets = savedTickets ? JSON.parse(savedTickets) : [];

      const savedDepts = localStorage.getItem(LOCAL_STORAGE_DEPTS);
      this.departments = savedDepts ? JSON.parse(savedDepts) : INITIAL_DEPARTMENTS;

      const savedTechs = localStorage.getItem(LOCAL_STORAGE_TECHS);
      this.technicians = savedTechs ? JSON.parse(savedTechs) : INITIAL_TECHNICIANS;

      // Merge initial technicians if missing photo or phone
      const techMap = new Map(this.technicians.map(t => [t.name, t]));
      INITIAL_TECHNICIANS.forEach(initTech => {
        if (!techMap.has(initTech.name)) {
          this.technicians.push({ ...initTech });
        } else {
          const current = techMap.get(initTech.name)!;
          if (current.isOnDutyToday === undefined) current.isOnDutyToday = initTech.isOnDutyToday ?? true;
          if (!current.phone && initTech.phone) current.phone = initTech.phone;
          if (!current.avatarUrl && initTech.avatarUrl) current.avatarUrl = initTech.avatarUrl;
        }
      });
      this.saveToLocalStorage();
    } catch (e) {
      this.tickets = [];
      this.departments = INITIAL_DEPARTMENTS;
      this.technicians = INITIAL_TECHNICIANS;
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

  /**
   * Real-Time Synchronization Engine (Supabase Realtime + Cross-device SSE + Polling Fallback)
   */
  private startRealtime() {
    if (typeof window === 'undefined') return;

    // 1. Initial fetch from server / Supabase
    void this.ensureInitialSync();

    // 2. Setup Supabase Realtime channel
    this.setupSupabaseRealtime();

    // 3. Connect Server-Sent Events (SSE) for local server or tunnel
    this.connectSSE();

    // 4. Fallback poll every 3.5 seconds
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        this.syncFromServer();
      }, 3500);
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

  private setupSupabaseRealtime() {
    if (!isSupabaseConfigured || !supabase || this.supabaseChannel) return;
    try {
      this.supabaseChannel = supabase
        .channel('scenery_realtime_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'repair_tickets' },
          () => {
            this.syncFromServer();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'technicians' },
          () => {
            this.syncFromServer();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('⚡ [SupabaseRealtime] Connected and listening for database updates');
          }
        });
    } catch (e) {
      console.warn('[TicketService] Supabase realtime subscription failed:', e);
    }
  }

  private connectSSE() {
    if (typeof window === 'undefined' || this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/realtime');

      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (
            data.type === 'TICKET_CREATED' ||
            data.type === 'TICKET_UPDATED' ||
            data.type === 'TICKET_DELETED' ||
            data.type === 'ALL_TICKETS_CLEARED' ||
            data.type === 'TECHNICIANS_UPDATED' ||
            data.type === 'SYNC_REQUIRED'
          ) {
            this.syncFromServer();
          }
        } catch {}
      };

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect after 3 seconds
        setTimeout(() => this.connectSSE(), 3000);
      };
    } catch (e) {
      // Offline or static host without local backend
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

  /**
   * Fetch latest state from Supabase / central server (cross-device sync)
   */
  public async syncFromServer(): Promise<void> {
    try {
      let changed = false;

      // 1. Supabase Sync (if configured & online)
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: supaTickets, error: tErr } = await supabase
            .from('repair_tickets')
            .select('*')
            .order('created_at', { ascending: false });

          if (!tErr && Array.isArray(supaTickets)) {
            const mapped = supaTickets.map(dbToTicket);
            if (JSON.stringify(mapped) !== JSON.stringify(this.tickets)) {
              this.tickets = mapped;
              changed = true;
            }
          }

          const { data: supaTechs, error: techErr } = await supabase
            .from('technicians')
            .select('*');

          if (!techErr && Array.isArray(supaTechs) && supaTechs.length > 0) {
            const mappedTechs = supaTechs.map(dbToTechnician);
            if (JSON.stringify(mappedTechs) !== JSON.stringify(this.technicians)) {
              this.technicians = mappedTechs;
              changed = true;
            }
          }
        } catch (supaErr) {
          // Supabase table may not exist yet or connection error
        }
      }

      // 2. Local REST API Sync (when running Vite dev server or local backend tunnel)
      try {
        const [ticketsRes, techsRes, deptsRes] = await Promise.allSettled([
          fetch('/api/tickets', { cache: 'no-store' }),
          fetch('/api/technicians', { cache: 'no-store' }),
          fetch('/api/departments', { cache: 'no-store' })
        ]);

        if (ticketsRes.status === 'fulfilled' && ticketsRes.value.ok) {
          const serverTickets: Ticket[] = await ticketsRes.value.json();
          if (Array.isArray(serverTickets)) {
            if (JSON.stringify(serverTickets) !== JSON.stringify(this.tickets)) {
              this.tickets = serverTickets;
              changed = true;
            }
          }
        }

        if (techsRes.status === 'fulfilled' && techsRes.value.ok) {
          const serverTechs: Technician[] = await techsRes.value.json();
          if (Array.isArray(serverTechs) && serverTechs.length > 0) {
            if (JSON.stringify(serverTechs) !== JSON.stringify(this.technicians)) {
              this.technicians = serverTechs;
              changed = true;
            }
          }
        }

        if (deptsRes.status === 'fulfilled' && deptsRes.value.ok) {
          const serverDepts: Department[] = await deptsRes.value.json();
          if (Array.isArray(serverDepts) && serverDepts.length > 0) {
            if (JSON.stringify(serverDepts) !== JSON.stringify(this.departments)) {
              this.departments = serverDepts;
              changed = true;
            }
          }
        }
      } catch {}

      if (changed || !this.isInitialSyncDone) {
        this.isInitialSyncDone = true;
        this.saveToLocalStorage();
        this.notify();
      }
    } catch (e) {
      // Offline mode - keep local storage
    }
  }

  /**
   * Departments
   */
  public async getDepartments(): Promise<Department[]> {
    await this.ensureInitialSync();
    return [...this.departments];
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

  public async addTechnician(tech: { name: string; role?: string; phone?: string; avatarUrl?: string }): Promise<Technician[]> {
    const newTech: Technician = {
      id: 'tech-' + Date.now(),
      name: tech.name.trim(),
      role: tech.role?.trim() || 'ช่างซ่อมบำรุง',
      status: 'active',
      phone: tech.phone?.trim() || '',
      avatarUrl: tech.avatarUrl || '',
      isOnDutyToday: true
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('technicians').insert([{
          name: newTech.name,
          role: newTech.role,
          status: newTech.status,
          phone: newTech.phone,
          avatar_url: newTech.avatarUrl,
          is_on_duty_today: newTech.isOnDutyToday
        }]);
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tech)
      });
      if (res.ok) {
        const updatedTechs = await res.json();
        if (Array.isArray(updatedTechs)) {
          this.technicians = updatedTechs;
          this.saveToLocalStorage();
          this.notify();
          return [...this.technicians];
        }
      }
    } catch (e) {}

    this.technicians.push(newTech);
    this.saveToLocalStorage();
    this.notify();
    return [...this.technicians];
  }

  public async updateTechnician(idOrName: string, updates: Partial<Technician>): Promise<Technician[]> {
    const item = this.technicians.find(t => t.id === idOrName || t.name === idOrName);
    const targetId = item ? item.id : idOrName;

    if (isSupabaseConfigured && supabase) {
      try {
        const row: any = {};
        if (updates.name) row.name = updates.name;
        if (updates.role) row.role = updates.role;
        if (updates.status) row.status = updates.status;
        if (updates.phone !== undefined) row.phone = updates.phone;
        if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;
        if (updates.isOnDutyToday !== undefined) row.is_on_duty_today = updates.isOnDutyToday;
        await supabase.from('technicians').update(row).or(`id.eq.${targetId},name.eq.${targetId}`);
      } catch (e) {}
    }

    try {
      const res = await fetch(`/api/technicians/${encodeURIComponent(targetId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        if (item) Object.assign(item, updated);
        this.saveToLocalStorage();
        this.notify();
        return [...this.technicians];
      }
    } catch (e) {}

    if (item) {
      Object.assign(item, updates);
      this.saveToLocalStorage();
      this.notify();
    }
    return [...this.technicians];
  }

  public async deleteTechnician(idOrName: string): Promise<Technician[]> {
    const item = this.technicians.find(t => t.id === idOrName || t.name === idOrName);
    const targetId = item ? item.id : idOrName;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('technicians').delete().or(`id.eq.${targetId},name.eq.${targetId}`);
      } catch (e) {}
    }

    try {
      await fetch(`/api/technicians/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
    } catch (e) {}

    this.technicians = this.technicians.filter(t => t.id !== idOrName && t.name !== idOrName);
    this.saveToLocalStorage();
    this.notify();
    return [...this.technicians];
  }

  public async setTechnicianStatus(name: string, status: 'active' | 'inactive'): Promise<Technician[]> {
    return this.updateTechnician(name, { status });
  }

  public async setTechnicianDuty(idOrName: string, isOnDuty: boolean): Promise<Technician[]> {
    const item = this.technicians.find(t => t.id === idOrName || t.name === idOrName);
    const id = item ? item.id : idOrName;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('technicians')
          .update({ is_on_duty_today: isOnDuty })
          .or(`id.eq.${id},name.eq.${id}`);
      } catch (e) {}
    }

    try {
      await fetch('/api/technicians/duty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [id]: isOnDuty })
      });
    } catch (e) {}

    if (item) {
      item.isOnDutyToday = isOnDuty;
      this.saveToLocalStorage();
      this.notify();
    }
    return [...this.technicians];
  }

  public async bulkSetDuty(dutyMap: Record<string, boolean>): Promise<Technician[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        for (const [key, val] of Object.entries(dutyMap)) {
          await supabase.from('technicians').update({ is_on_duty_today: val }).or(`id.eq.${key},name.eq.${key}`);
        }
      } catch (e) {}
    }

    try {
      await fetch('/api/technicians/duty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dutyMap)
      });
    } catch (e) {}

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
    statusFilter?: string;
    priorityFilter?: string;
    sortOrder?: SortOrder;
    onlyUrgent?: boolean;
    searchQuery?: string;
  }): Promise<Ticket[]> {
    await this.ensureInitialSync();

    let list: Ticket[] = [...this.tickets];
    const now = Date.now();

    // Compute UI fields: ageDays, waitingDurationText, isOverdue
    list.forEach(ticket => {
      const createdMs = new Date(ticket.createdAt).getTime();
      const diffMs = Math.max(0, now - createdMs);
      const ageDays = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);

      ticket.ageDays = ageDays;
      ticket.isOverdue = ageDays >= 3 && ticket.status !== 'completed' && ticket.status !== 'cancelled';

      if (ageDays > 0) {
        ticket.waitingDurationText = `รอมาแล้ว ${ageDays} วัน ${hours > 0 ? hours + ' ชม.' : ''}`.trim();
      } else if (hours > 0) {
        ticket.waitingDurationText = `รอมาแล้ว ${hours} ชม.`;
      } else {
        ticket.waitingDurationText = 'เพิ่งแจ้งเมื่อสักครู่';
      }

      // Auto-resolve technician phone number if missing
      if (ticket.technicianName && !ticket.technicianPhone) {
        const match = this.technicians.find(t => t.name.toLowerCase() === ticket.technicianName?.toLowerCase());
        if (match?.phone) {
          ticket.technicianPhone = match.phone;
        }
      }
    });

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
      // Default FIFO: Oldest created_at first
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
    const newId = 'REP-' + yearMonth + '-' + String(count).padStart(3, '0');

    let created: Ticket = {
      ...ticket,
      id: 'ticket-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      requestId: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // 1. Try Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const dbRow = ticketToDb(created);
        const { data, error } = await supabase
          .from('repair_tickets')
          .insert([dbRow])
          .select()
          .single();
        if (!error && data) {
          created = dbToTicket(data);
        }
      } catch (e) {
        console.warn('[TicketService] Supabase insert fallback:', e);
      }
    }

    // 2. Try REST API
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created)
      });
      if (res.ok) {
        const serverTicket: Ticket = await res.json();
        created = serverTicket;
      }
    } catch (e) {
      // Offline fallback
    }

    this.tickets.unshift(created);
    this.saveToLocalStorage();
    this.notify();
    return created;
  }

  public async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    // 1. Try Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdates = ticketToDb(updates);
        await supabase
          .from('repair_tickets')
          .update(dbUpdates)
          .or(`id.eq.${id},request_id.eq.${id}`);
      } catch (e) {
        console.warn('[TicketService] Supabase update fallback:', e);
      }
    }

    // 2. Try REST API
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated: Ticket = await res.json();
        const idx = this.tickets.findIndex(t => t.id === id || t.requestId === id);
        if (idx !== -1) {
          this.tickets[idx] = updated;
        }
        this.saveToLocalStorage();
        this.notify();
        return updated;
      }
    } catch (e) {}

    const item = this.tickets.find(t => t.id === id || t.requestId === id);
    if (!item) return null;

    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    if (updates.status === 'completed' && !item.completedAt) {
      item.completedAt = new Date().toISOString();
    }

    this.saveToLocalStorage();
    this.notify();
    return item;
  }

  public async deleteTicket(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('repair_tickets')
          .delete()
          .or(`id.eq.${id},request_id.eq.${id}`);
      } catch (e) {}
    }

    try {
      await fetch(`/api/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    this.tickets = this.tickets.filter(t => t.id !== id && t.requestId !== id);
    this.saveToLocalStorage();
    this.notify();
  }

  public async clearAllTickets(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('repair_tickets').delete().neq('request_id', '');
      } catch (e) {}
    }

    try {
      await fetch('/api/tickets/clear-all', { method: 'POST' });
    } catch (e) {}

    this.tickets = [];
    this.saveToLocalStorage();
    this.notify();
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
        const rows = imported.map(ticketToDb);
        await supabase.from('repair_tickets').upsert(rows, { onConflict: 'request_id' });
      } catch (e) {}
    }

    for (const t of imported) {
      try {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t)
        });
      } catch {}
    }
  }

  public async resetToDemo(): Promise<void> {
    this.tickets = [];
    this.saveToLocalStorage();
    this.notify();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('repair_tickets').delete().neq('request_id', '');
      } catch (e) {}
    }
    try {
      await fetch('/api/tickets/clear-all', { method: 'POST' });
    } catch {}
  }
}

export const ticketService = new TicketService();

import { Ticket, Department, Technician, SortOrder } from '../types';
import { INITIAL_DEPARTMENTS, INITIAL_TECHNICIANS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_TICKETS = 'scenery_repair_v5_tickets';
const LOCAL_STORAGE_DEPTS = 'scenery_repair_v5_departments';
const LOCAL_STORAGE_TECHS = 'scenery_repair_v5_technicians';

class TicketService {
  private tickets: Ticket[] = [];
  private departments: Department[] = [];
  private technicians: Technician[] = [];
  private listeners: Set<() => void> = new Set();
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private isInitialSyncDone = false;

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
   * Real-Time Synchronization Engine (Cross-device SSE + Polling Fallback)
   */
  private startRealtime() {
    if (typeof window === 'undefined') return;

    // 1. Trigger initial fetch from server
    this.syncFromServer();

    // 2. Connect Server-Sent Events for instant cross-device push
    this.connectSSE();

    // 3. Fallback poll every 3.5 seconds (in case mobile sleeps or network switches)
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        this.syncFromServer();
      }, 3500);
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
      console.warn('[TicketService] SSE connection failed, using fallback polling:', e);
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
   * Fetch latest state from central server (cross-device sync)
   */
  public async syncFromServer(): Promise<void> {
    try {
      const [ticketsRes, techsRes, deptsRes] = await Promise.allSettled([
        fetch('/api/tickets', { cache: 'no-store' }),
        fetch('/api/technicians', { cache: 'no-store' }),
        fetch('/api/departments', { cache: 'no-store' })
      ]);

      let changed = false;

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
    if (!this.isInitialSyncDone) {
      await this.syncFromServer();
    }
    return [...this.departments];
  }

  /**
   * Technicians
   */
  public async getTechnicians(): Promise<Technician[]> {
    if (!this.isInitialSyncDone) {
      await this.syncFromServer();
    }
    return [...this.technicians];
  }

  public getTechniciansSync(): Technician[] {
    return [...this.technicians];
  }

  public async addTechnician(tech: { name: string; role?: string; phone?: string; avatarUrl?: string }): Promise<Technician[]> {
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
    } catch (e) {
      console.warn('[TicketService] API addTechnician error, updating local:', e);
    }

    const newTech: Technician = {
      id: 'tech-' + Date.now(),
      name: tech.name.trim(),
      role: tech.role?.trim() || 'ช่างซ่อมบำรุง',
      status: 'active',
      phone: tech.phone?.trim() || '',
      avatarUrl: tech.avatarUrl || '',
      isOnDutyToday: true
    };
    this.technicians.push(newTech);
    this.saveToLocalStorage();
    this.notify();
    return [...this.technicians];
  }

  public async updateTechnician(idOrName: string, updates: Partial<Technician>): Promise<Technician[]> {
    const item = this.technicians.find(t => t.id === idOrName || t.name === idOrName);
    const targetId = item ? item.id : idOrName;

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
    } catch (e) {
      console.warn('[TicketService] API updateTechnician error, updating local:', e);
    }

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
    if (!this.isInitialSyncDone) {
      await this.syncFromServer();
    }

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
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });
      if (res.ok) {
        const created: Ticket = await res.json();
        this.tickets.unshift(created);
        this.saveToLocalStorage();
        this.notify();
        return created;
      }
    } catch (e) {
      console.warn('[TicketService] API create failed, using local:', e);
    }

    // Fallback if server unreachable
    const nowIso = new Date().toISOString();
    const count = this.tickets.length + 1;
    const yearMonth = nowIso.slice(0, 7).replace('-', '');
    const newId = 'REP-' + yearMonth + '-' + String(count).padStart(3, '0');

    const created: Ticket = {
      ...ticket,
      id: 'ticket-' + Date.now(),
      requestId: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.tickets.unshift(created);
    this.saveToLocalStorage();
    this.notify();
    return created;
  }

  public async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
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
    } catch (e) {
      console.warn('[TicketService] API update failed, using local:', e);
    }

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
    try {
      await fetch(`/api/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    this.tickets = this.tickets.filter(t => t.id !== id && t.requestId !== id);
    this.saveToLocalStorage();
    this.notify();
  }

  public async clearAllTickets(): Promise<void> {
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
    try {
      await fetch('/api/tickets/clear-all', { method: 'POST' });
    } catch {}
  }
}

export const ticketService = new TicketService();

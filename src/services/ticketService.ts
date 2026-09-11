import { Ticket, Department, Technician, SortOrder } from '../types';
import { INITIAL_TICKETS, INITIAL_DEPARTMENTS, INITIAL_TECHNICIANS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_TICKETS = 'scenery_repair_v2_tickets';
const LOCAL_STORAGE_DEPTS = 'scenery_repair_v2_departments';
const LOCAL_STORAGE_TECHS = 'scenery_repair_v2_technicians';

class TicketService {
  private tickets: Ticket[] = [];
  private departments: Department[] = [];
  private technicians: Technician[] = [];

  constructor() {
    this.initLocalData();
  }

  private initLocalData() {
    try {
      const savedTickets = localStorage.getItem(LOCAL_STORAGE_TICKETS);
      this.tickets = savedTickets ? JSON.parse(savedTickets) : INITIAL_TICKETS;

      const savedDepts = localStorage.getItem(LOCAL_STORAGE_DEPTS);
      this.departments = savedDepts ? JSON.parse(savedDepts) : INITIAL_DEPARTMENTS;

      const savedTechs = localStorage.getItem(LOCAL_STORAGE_TECHS);
      this.technicians = savedTechs ? JSON.parse(savedTechs) : INITIAL_TECHNICIANS;
    } catch (e) {
      this.tickets = INITIAL_TICKETS;
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

  public async getDepartments(): Promise<Department[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('departments').select('*');
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            icon: d.icon || '📌',
            color: d.color || '#0f766e',
            description: d.description || ''
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch departments failed, using fallback:', e);
      }
    }
    return [...this.departments];
  }

  public async getTechnicians(): Promise<Technician[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('technicians').select('*');
        if (!error && data && data.length > 0) {
          return data.map((t: any) => ({
            id: t.id,
            name: t.name,
            role: t.role || 'ช่างซ่อมบำรุง',
            status: t.status || 'active',
            phone: t.phone || ''
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch technicians failed, using fallback:', e);
      }
    }
    return [...this.technicians];
  }

  public async getTickets(options?: {
    department?: string;
    statusFilter?: string;
    priorityFilter?: string;
    sortOrder?: SortOrder;
    onlyUrgent?: boolean;
    searchQuery?: string;
  }): Promise<Ticket[]> {
    let list: Ticket[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('repair_tickets').select('*');
        if (!error && data && data.length > 0) {
          list = data.map((r: any) => ({
            id: r.id,
            requestId: r.request_id,
            title: r.title,
            description: r.description || '',
            department: r.department,
            location: r.location,
            requesterName: r.requester_name,
            requesterPhone: r.requester_phone || '',
            priority: r.priority || 'normal',
            status: r.status || 'pending',
            technicianName: r.technician_name || '',
            repairResult: r.repair_result || '',
            remark: r.remark || '',
            requestImageUrl: r.request_image_url || '',
            resultImageUrl: r.result_image_url || '',
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            completedAt: r.completed_at
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch tickets failed, using fallback:', e);
      }
    }

    if (!list.length) {
      list = [...this.tickets];
    }

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
    const count = this.tickets.length + 1;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const newId = 'REP-' + yearMonth + '-' + String(count).padStart(3, '0');
    const nowIso = new Date().toISOString();

    const created: Ticket = {
      ...ticket,
      id: 'ticket-' + Date.now(),
      requestId: newId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('repair_tickets').insert([{
          request_id: created.requestId,
          title: created.title,
          description: created.description,
          department: created.department,
          location: created.location,
          requester_name: created.requesterName,
          requester_phone: created.requesterPhone,
          priority: created.priority,
          status: created.status,
          technician_name: created.technicianName,
          remark: created.remark,
          request_image_url: created.requestImageUrl
        }]);
      } catch (e) {
        console.warn('Supabase create failed, persisted locally:', e);
      }
    }

    this.tickets.unshift(created);
    this.saveToLocalStorage();
    return created;
  }

  public async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const idx = this.tickets.findIndex(t => t.id === id || t.requestId === id);
    if (idx === -1) throw new Error('ไม่พบรายการงาน');

    const updated: Ticket = {
      ...this.tickets[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.status === 'completed' && !updated.completedAt) {
      updated.completedAt = new Date().toISOString();
    }

    this.tickets[idx] = updated;
    this.saveToLocalStorage();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('repair_tickets').update({
          status: updated.status,
          technician_name: updated.technicianName,
          repair_result: updated.repairResult,
          remark: updated.remark,
          result_image_url: updated.resultImageUrl,
          priority: updated.priority,
          completed_at: updated.completedAt
        }).eq('request_id', updated.requestId);
      } catch (e) {
        console.warn('Supabase update failed:', e);
      }
    }

    return updated;
  }

  public async importTickets(incomingTickets: Ticket[], overwrite: boolean = false): Promise<number> {
    if (overwrite) {
      this.tickets = incomingTickets;
    } else {
      const existingIds = new Set(this.tickets.map(t => t.requestId));
      const newOnes = incomingTickets.filter(t => !existingIds.has(t.requestId));
      this.tickets = [...newOnes, ...this.tickets];
    }
    this.saveToLocalStorage();
    return this.tickets.length;
  }

  public async resetToDemo(): Promise<void> {
    this.tickets = [...INITIAL_TICKETS];
    this.departments = [...INITIAL_DEPARTMENTS];
    this.technicians = [...INITIAL_TECHNICIANS];
    this.saveToLocalStorage();
  }

  public async setTechnicianStatus(name: string, status: 'active' | 'inactive'): Promise<Technician[]> {
    const item = this.technicians.find(t => t.name === name);
    if (item) {
      item.status = status;
    } else {
      this.technicians.push({
        id: 'tech-' + Date.now(),
        name,
        role: 'ช่างซ่อมบำรุง',
        status
      });
    }
    this.saveToLocalStorage();
    return [...this.technicians];
  }
}

export const ticketService = new TicketService();

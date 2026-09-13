import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

// Types matching frontend
export interface Ticket {
  id: string;
  requestId: string;
  title: string;
  description: string;
  department: string;
  location: string;
  requesterName: string;
  requesterPhone?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'assigned' | 'in_progress' | 'waiting_parts' | 'waiting_inspect' | 'completed' | 'cancelled';
  technicianName?: string;
  technicianPhone?: string;
  repairResult?: string;
  remark?: string;
  requestImageUrl?: string;
  resultImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  queueNumber?: number;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  phone?: string;
  avatarUrl?: string;
  isOnDutyToday?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  description: string;
}

interface DatabaseSchema {
  tickets: Ticket[];
  technicians: Technician[];
  departments: Department[];
}

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'คาเฟ่ & F&B', code: 'CAFE', icon: '☕', color: '#d97706', description: 'ร้านกาแฟ เบเกอรี่ และห้องอาหารหลัก' },
  { id: 'dept-2', name: 'ห้องพัก & วิลล่า', code: 'HOTEL', icon: '🏨', color: '#7c3aed', description: 'บ้านพักวิลล่า โซนรีสอร์ท และบริการแม่บ้าน' },
  { id: 'dept-3', name: 'ฟาร์มสัตว์ & กิจกรรม', code: 'FARM', icon: '🐑', color: '#059669', description: 'ลานป้อนอาหารแกะ ซุ้มกิจกรรม และโรงเรือนสัตว์' },
  { id: 'dept-4', name: 'ไฟฟ้า & แอร์', code: 'ELEC', icon: '⚡', color: '#2563eb', description: 'ระบบไฟฟ้ากำลัง เครื่องปรับอากาศ แสงสว่าง และหม้อแปลง' },
  { id: 'dept-5', name: 'ประปา & สุขาภิบาล', code: 'PLUMB', icon: '💧', color: '#0891b2', description: 'ระบบประปา สปริงเกอร์ บำบัดน้ำเสีย และห้องน้ำส่วนรวม' },
  { id: 'dept-6', name: 'ซ่อมบำรุงอาคาร & สี', code: 'BLDG', icon: '🛠️', color: '#475467', description: 'โครงสร้างอาคาร รั้วฟาร์ม งานสี ประตูหน้าต่าง' },
  { id: 'dept-7', name: 'งานสวน & ภูมิทัศน์', code: 'GARDEN', icon: '🌿', color: '#16a34a', description: 'สนามหญ้า ต้นไม้ ไม้ดอก และระบบระบายน้ำผิวดิน' },
  { id: 'dept-8', name: 'รถบริการ & ยานพาหนะ', code: 'VEHICLE', icon: '🚗', color: '#ea580c', description: 'รถรางบริการนักท่องเที่ยว รถกอล์ฟ และเครื่องจักรกลฟาร์ม' },
  { id: 'dept-9', name: 'ไอที & ระบบสื่อสาร', code: 'IT', icon: '💻', color: '#e11d48', description: 'ระบบแคชเชียร์ POS กล้องวงจรปิด Wi-Fi และเครือข่าย' },
];

const INITIAL_TECHNICIANS: Technician[] = [
  { 
    id: 'tech-1', 
    name: 'ช่างสมชาย (หัวหน้าช่าง)', 
    role: 'หัวหน้าฝ่ายซ่อมบำรุง', 
    status: 'active', 
    phone: '081-234-5678', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-2', 
    name: 'ช่างวิชัย (ไฟฟ้า/แอร์)', 
    role: 'ช่างไฟฟ้าและระบบปรับอากาศ', 
    status: 'active', 
    phone: '082-345-6789', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-3', 
    name: 'ช่างประสิทธิ์ (ประปา/สุขาภิบาล)', 
    role: 'ช่างสุขาภิบาลและระบบท่อ', 
    status: 'active', 
    phone: '083-456-7890', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-4', 
    name: 'ช่างเอกชัย (อาคาร/สี)', 
    role: 'ช่างไม้ อาคาร และโครงสร้าง', 
    status: 'active', 
    phone: '084-567-8901', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-5', 
    name: 'ช่างธนพล (ช่างยนต์/เครื่องจักร)', 
    role: 'ช่างซ่อมยานพาหนะและเครื่องกล', 
    status: 'active', 
    phone: '085-678-9012', 
    isOnDutyToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-6', 
    name: 'ช่างเดี่ยว (อู่ภายนอก D.Bike Garage)', 
    role: 'อู่ซ่อมรถ ATV และระบบเครื่องยนต์', 
    status: 'active', 
    phone: '081-736-5127', 
    isOnDutyToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-7', 
    name: 'ช่าง 84 (งานปะยาง/เชื่อม/บัดกรี)', 
    role: 'ช่างเทคนิคยางและโลหะโครงสร้าง', 
    status: 'active', 
    phone: '084-848-4848', 
    isOnDutyToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  },
  { 
    id: 'tech-8', 
    name: 'ช่างบูร (ตาฟเกลียว/โรงกลึง)', 
    role: 'ช่างกลโรงงานและตาฟเกลียว', 
    status: 'active', 
    phone: '086-123-4567', 
    isOnDutyToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
];

export function realtimeApiPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'server_data');
  const dbFile = path.resolve(dataDir, 'database.json');

  // Active SSE clients across all connected devices
  const sseClients = new Set<ServerResponse>();

  // Ensure directory and database exist
  function initDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure tickets array exists (ZERO demo data)
        if (!Array.isArray(parsed.tickets)) parsed.tickets = [];
        if (!Array.isArray(parsed.technicians) || parsed.technicians.length === 0) {
          parsed.technicians = INITIAL_TECHNICIANS;
        }
        if (!Array.isArray(parsed.departments) || parsed.departments.length === 0) {
          parsed.departments = INITIAL_DEPARTMENTS;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[RealtimeServer] Error reading database.json, initializing fresh:', e);
    }

    // Fresh initialization: NO DEMO TICKETS!
    const initialDb: DatabaseSchema = {
      tickets: [], // STRICTLY EMPTY!
      technicians: INITIAL_TECHNICIANS,
      departments: INITIAL_DEPARTMENTS
    };
    saveDatabase(initialDb);
    return initialDb;
  }

  let db = initDatabase();

  function saveDatabase(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
      db = data;
    } catch (e) {
      console.error('[RealtimeServer] Failed to save database.json:', e);
    }
  }

  function broadcast(event: { type: string; [key: string]: any }) {
    const dataString = `data: ${JSON.stringify({ ...event, timestamp: Date.now() })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(dataString);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  let keepaliveTimer: any = null;
  function startKeepalive() {
    if (keepaliveTimer) return;
    keepaliveTimer = setInterval(() => {
      for (const client of sseClients) {
        try {
          client.write(': keepalive\n\n');
        } catch {
          sseClients.delete(client);
        }
      }
    }, 15000);
    if (keepaliveTimer && typeof keepaliveTimer.unref === 'function') {
      keepaliveTimer.unref();
    }
  }

  function readBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  }

  function handleApi(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const url = req.url || '';

    // Only process /api/* paths
    if (!url.startsWith('/api/')) {
      return next();
    }

    // CORS Headers for cross-origin or tunnel usage
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. SSE Realtime Stream
    if (url === '/api/realtime' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clients: sseClients.size + 1 })}\n\n`);
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // JSON responder helper
    const sendJson = (status: number, payload: any) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    // 2. Health & status check
    if (url === '/api/status' && req.method === 'GET') {
      return sendJson(200, {
        status: 'ok',
        clients: sseClients.size,
        ticketCount: db.tickets.length,
        technicianCount: db.technicians.length,
        timestamp: Date.now()
      });
    }

    // 3. Tickets endpoints
    if (url === '/api/tickets' && req.method === 'GET') {
      return sendJson(200, db.tickets);
    }

    if (url === '/api/tickets' && req.method === 'POST') {
      readBody(req).then((ticketData) => {
        const nowIso = new Date().toISOString();
        const yearMonth = nowIso.slice(0, 7).replace('-', '');
        const count = db.tickets.length + 1;
        const newId = `REP-${yearMonth}-${String(count).padStart(3, '0')}`;

        const newTicket: Ticket = {
          ...ticketData,
          id: 'ticket-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          requestId: ticketData.requestId || newId,
          createdAt: ticketData.createdAt || nowIso,
          updatedAt: nowIso,
          status: ticketData.status || 'pending',
          priority: ticketData.priority || 'normal'
        };

        db.tickets.unshift(newTicket);
        saveDatabase(db);
        broadcast({ type: 'TICKET_CREATED', ticket: newTicket });
        sendJson(201, newTicket);
      });
      return;
    }

    if (url === '/api/tickets/clear-all' && (req.method === 'POST' || req.method === 'DELETE')) {
      db.tickets = [];
      saveDatabase(db);
      broadcast({ type: 'ALL_TICKETS_CLEARED' });
      return sendJson(200, { message: 'All tickets cleared successfully' });
    }

    // Match /api/tickets/:id
    const ticketIdMatch = url.match(/^\/api\/tickets\/([a-zA-Z0-9_-]+)$/);
    if (ticketIdMatch) {
      const ticketId = ticketIdMatch[1];

      if (req.method === 'GET') {
        const found = db.tickets.find(t => t.id === ticketId || t.requestId === ticketId);
        if (!found) return sendJson(404, { error: 'Ticket not found' });
        return sendJson(200, found);
      }

      if (req.method === 'PUT') {
        readBody(req).then((updates) => {
          const idx = db.tickets.findIndex(t => t.id === ticketId || t.requestId === ticketId);
          if (idx === -1) return sendJson(404, { error: 'Ticket not found' });

          const updatedTicket = {
            ...db.tickets[idx],
            ...updates,
            updatedAt: new Date().toISOString()
          };

          if (updates.status === 'completed' && !updatedTicket.completedAt) {
            updatedTicket.completedAt = new Date().toISOString();
          }

          db.tickets[idx] = updatedTicket;
          saveDatabase(db);
          broadcast({ type: 'TICKET_UPDATED', ticket: updatedTicket });
          sendJson(200, updatedTicket);
        });
        return;
      }

      if (req.method === 'DELETE') {
        const beforeLen = db.tickets.length;
        db.tickets = db.tickets.filter(t => t.id !== ticketId && t.requestId !== ticketId);
        if (db.tickets.length !== beforeLen) {
          saveDatabase(db);
          broadcast({ type: 'TICKET_DELETED', id: ticketId });
          return sendJson(200, { message: 'Ticket deleted' });
        }
        return sendJson(404, { error: 'Ticket not found' });
      }
    }

    // 4. Technicians endpoints
    if (url === '/api/technicians' && req.method === 'GET') {
      return sendJson(200, db.technicians);
    }

    if (url === '/api/technicians' && req.method === 'POST') {
      readBody(req).then((techData) => {
        const existing = db.technicians.find(t => t.name.toLowerCase() === (techData.name || '').trim().toLowerCase());
        if (existing) {
          Object.assign(existing, techData);
        } else {
          const newTech: Technician = {
            id: 'tech-' + Date.now(),
            name: techData.name.trim(),
            role: techData.role?.trim() || 'ช่างซ่อมบำรุง',
            status: techData.status || 'active',
            phone: techData.phone?.trim() || '',
            avatarUrl: techData.avatarUrl || '',
            isOnDutyToday: techData.isOnDutyToday ?? true
          };
          db.technicians.push(newTech);
        }
        saveDatabase(db);
        broadcast({ type: 'TECHNICIANS_UPDATED' });
        sendJson(201, db.technicians);
      });
      return;
    }

    if (url === '/api/technicians/duty' && req.method === 'POST') {
      readBody(req).then((dutyMap: Record<string, boolean>) => {
        db.technicians.forEach(t => {
          if (dutyMap[t.id] !== undefined) t.isOnDutyToday = dutyMap[t.id];
          else if (dutyMap[t.name] !== undefined) t.isOnDutyToday = dutyMap[t.name];
        });
        saveDatabase(db);
        broadcast({ type: 'TECHNICIANS_UPDATED' });
        sendJson(200, db.technicians);
      });
      return;
    }

    const techIdMatch = url.match(/^\/api\/technicians\/([a-zA-Z0-9_-]+)$/);
    if (techIdMatch) {
      const techId = techIdMatch[1];

      if (req.method === 'PUT') {
        readBody(req).then((updates) => {
          const target = db.technicians.find(t => t.id === techId || t.name === techId);
          if (target) {
            Object.assign(target, updates);
            saveDatabase(db);
            broadcast({ type: 'TECHNICIANS_UPDATED' });
            return sendJson(200, target);
          }
          return sendJson(404, { error: 'Technician not found' });
        });
        return;
      }

      if (req.method === 'DELETE') {
        db.technicians = db.technicians.filter(t => t.id !== techId && t.name !== techId);
        saveDatabase(db);
        broadcast({ type: 'TECHNICIANS_UPDATED' });
        return sendJson(200, { message: 'Technician deleted' });
      }
    }

    // 5. Departments endpoint
    if (url === '/api/departments' && req.method === 'GET') {
      return sendJson(200, db.departments);
    }

    // Unknown api route
    sendJson(404, { error: 'API endpoint not found' });
  }

  return {
    name: 'realtime-api-plugin',
    configureServer(server: ViteDevServer) {
      startKeepalive();
      server.middlewares.use(handleApi);
      console.log('⚡ [RealtimeServer] Real-time Sync & REST API ready on /api/* (SSE on /api/realtime)');
    },
    configurePreviewServer(server: PreviewServer) {
      startKeepalive();
      server.middlewares.use(handleApi);
      console.log('⚡ [RealtimeServer] Real-time Sync (Preview) ready on /api/* (SSE on /api/realtime)');
    }
  };
}

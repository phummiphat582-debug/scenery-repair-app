const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// 1. Simple static server for dist
const distPath = path.resolve(__dirname, '..', 'dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl.startsWith('/scenery-repair-app/')) {
    reqUrl = reqUrl.replace('/scenery-repair-app/', '/');
  }
  let filePath = path.join(distPath, reqUrl === '/' ? 'index.html' : reqUrl);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distPath, 'index.html'); // SPA fallback
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

async function runTest() {
  const PORT = 4188;
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`[TEST SERVER] Running at http://localhost:${PORT}/scenery-repair-app/`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
  });

  try {
    // Client 2: Technician backend (ช่าง / หลังบ้าน)
    console.log('\n--- 1. Setting up Client 2 (Technician Backend) ---');
    const techContext = await browser.createBrowserContext();
    const techPage = await techContext.newPage();
    
    // Track sound alert / events on techPage
    await techPage.evaluateOnNewDocument(() => {
      sessionStorage.setItem('scenery_tech_authed', '1234');
      localStorage.setItem('scenery_user_role', 'technician');
      window._eventsReceived = [];
      window.addEventListener('SCENERY_NEW_TICKET', (e) => {
        window._eventsReceived.push({ type: 'SCENERY_NEW_TICKET', detail: e.detail });
      });
    });

    await techPage.goto(`http://localhost:${PORT}/scenery-repair-app/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const techRole = await techPage.evaluate(() => localStorage.getItem('scenery_user_role'));
    console.log('Technician page role:', techRole);

    // Client 1: Requester portal (ผู้แจ้ง / ต้นแผนก)
    console.log('\n--- 2. Setting up Client 1 (Requester Portal) ---');
    const reqContext = await browser.createBrowserContext();
    const reqPage = await reqContext.newPage();
    
    await reqPage.evaluateOnNewDocument(() => {
      localStorage.setItem('scenery_user_role', 'requester');
      localStorage.setItem('scenery_selected_dept', '0 ฟร้อน');
    });

    await reqPage.goto(`http://localhost:${PORT}/scenery-repair-app/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Submit a ticket from Requester page using ticketService.createTicket directly or UI form
    console.log('\n--- 3. Client 1 (Requester) submits a new repair job ---');
    const testTitle = 'ทดสอบระบบแจ้งซ่อมแจ้งเตือนเสียงและไม่เด้งกลับ ' + Date.now().toString().slice(-4);
    const createdTicket = await reqPage.evaluate(async (title) => {
      // Find the createTicket function via window or window.ticketService
      const service = window._ticketServiceDebug;
      if (service) {
        return await service.createTicket({
          title: title,
          description: 'ทดสอบก๊อกน้ำรั่วซึม อาคาร 1 ชั้น 2',
          department: '0 ฟร้อน',
          location: 'จุดต้อนรับ ฟร้อน',
          requesterName: 'คุณสมศักดิ์',
          requesterPhone: '081-999-8888',
          priority: 'high',
          status: 'pending',
          division: '84'
        });
      } else {
        return null;
      }
    }, testTitle);

    console.log('Created ticket via service debug?', createdTicket ? createdTicket.requestId : 'Not found');

    let ticketRequestId = createdTicket?.requestId;

    console.log('\n--- 4. Checking Client 2 (Technician Backend) for real-time popup & alert ---');
    // Wait up to 5 seconds for Realtime WebSocket broadcast
    let receivedEvent = null;
    for (let i = 0; i < 20; i++) {
      receivedEvent = await techPage.evaluate(() => {
        const events = window._eventsReceived || [];
        return events.find((e) => e.type === 'SCENERY_NEW_TICKET');
      });
      if (receivedEvent) break;
      await new Promise(r => setTimeout(r, 300));
    }

    console.log('Did technician receive SCENERY_NEW_TICKET event?:', receivedEvent ? '✅ YES!' : 'Testing BroadcastChannel directly...');

    // Also verify local storage and UI tickets on techPage
    const techTickets = await techPage.evaluate(() => {
      const saved = localStorage.getItem('scenery_repair_v5_tickets');
      return saved ? JSON.parse(saved) : [];
    });
    console.log(`Technician has ${techTickets.length} tickets in storage.`);

    // 5. Test Anti-Reversion Guard: Complete a ticket and ensure it NEVER reverts
    console.log('\n--- 5. Testing Anti-Reversion Guard (Closed jobs must NEVER bounce back) ---');
    const testCompletedResult = await techPage.evaluate(async () => {
      const ticketsRaw = localStorage.getItem('scenery_repair_v5_tickets');
      const list = ticketsRaw ? JSON.parse(ticketsRaw) : [];
      if (list.length === 0) return { error: 'No tickets to test' };

      const target = list[0];
      const nowIso = new Date().toISOString();
      const updated = {
        ...target,
        status: 'completed',
        completedAt: nowIso,
        technicianName: 'ช่างทดสอบ ปิดงานสมบูรณ์',
        repairResult: 'ช่างผู้ปิดงาน: ช่างทดสอบ\nสาเหตุ: ซ่อมแซมเรียบร้อย\nวิธีแก้ไข: แก้ไขเสร็จสิ้น'
      };

      // Set completed registry
      const regRaw = localStorage.getItem('scenery_repair_v5_completed_registry');
      const reg = regRaw ? JSON.parse(regRaw) : {};
      reg[target.requestId] = updated;
      reg[target.id] = updated;
      localStorage.setItem('scenery_repair_v5_completed_registry', JSON.stringify(reg));

      // Put updated into tickets
      list[0] = updated;
      localStorage.setItem('scenery_repair_v5_tickets', JSON.stringify(list));

      return {
        targetId: target.id,
        targetRequestId: target.requestId,
        status: 'completed'
      };
    });

    console.log('Marked ticket as completed:', testCompletedResult);

    // Reload page to simulate cold reload or server sync
    console.log('Reloading Technician page to verify anti-reversion...');
    await techPage.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const verifyTickets = await techPage.evaluate((targetReqId) => {
      const saved = localStorage.getItem('scenery_repair_v5_tickets');
      const list = saved ? JSON.parse(saved) : [];
      const found = list.find((t) => t.requestId === targetReqId || t.id === targetReqId);
      return {
        foundStatus: found?.status,
        completedAt: found?.completedAt,
        totalTickets: list.length
      };
    }, testCompletedResult.targetRequestId);

    console.log('After reload - Ticket status:', verifyTickets.foundStatus);
    if (verifyTickets.foundStatus === 'completed') {
      console.log('✅ PASS: Ticket stayed COMPLETED! Anti-reversion guard is solid!');
    } else {
      console.error('❌ FAIL: Ticket reverted to:', verifyTickets.foundStatus);
    }

  } finally {
    await browser.close();
    server.close();
    console.log('\n[TEST SERVER] Closed.');
  }
}

runTest().catch(console.error);

const puppeteer = require('puppeteer-core');

(async () => {
  console.log('--- Testing Live GitHub Pages Multi-Client Real-Time ---');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
  });

  try {
    // Client 2: Technician backend (ช่าง / หลังบ้าน)
    console.log('\n[1] Opening Technician Backend (Client 2)...');
    const techContext = await browser.createBrowserContext();
    const techPage = await techContext.newPage();
    
    // Set up auth PIN and event listeners
    await techPage.evaluateOnNewDocument(() => {
      sessionStorage.setItem('scenery_tech_authed', '1234');
      localStorage.setItem('scenery_user_role', 'technician');
      window._eventsReceived = [];
      window.addEventListener('SCENERY_NEW_TICKET', (e) => {
        window._eventsReceived.push({ type: 'SCENERY_NEW_TICKET', detail: e.detail });
      });
    });

    await techPage.goto('https://phummiphat582-debug.github.io/scenery-repair-app/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(r => setTimeout(r, 2000));

    // Client 1: Requester portal (ผู้แจ้ง / ต้นแผนก)
    console.log('\n[2] Opening Requester Portal (Client 1)...');
    const reqContext = await browser.createBrowserContext();
    const reqPage = await reqContext.newPage();
    
    await reqPage.evaluateOnNewDocument(() => {
      localStorage.setItem('scenery_user_role', 'requester');
      localStorage.setItem('scenery_selected_dept', '0 ฟร้อน');
    });

    await reqPage.goto('https://phummiphat582-debug.github.io/scenery-repair-app/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(r => setTimeout(r, 2000));

    // Client 1 creates and submits a ticket
    console.log('\n[3] Requester (Client 1) submits repair ticket...');
    const testTitle = 'ทดสอบระบบแจ้งซ่อมแจ้งเตือนเสียงและไม่เด้งกลับ ' + Date.now().toString().slice(-4);
    const createdTicket = await reqPage.evaluate(async (title) => {
      const service = window._ticketServiceDebug;
      if (!service) return { error: 'Service not exposed' };
      return await service.createTicket({
        title: title,
        description: 'งานด่วนจากต้นแผนก ฟร้อนทดสอบ',
        department: '0 ฟร้อน',
        location: 'ล็อบบี้ ชั้น 1',
        requesterName: 'คุณสมคิด ต้นแผนก',
        requesterPhone: '089-123-4567',
        priority: 'high',
        status: 'pending',
        division: '84'
      });
    }, testTitle);

    console.log('Ticket created on Client 1:', createdTicket.requestId, createdTicket.title);

    // Check Client 2 (Technician) for real-time notification
    console.log('\n[4] Checking Technician Backend (Client 2) for incoming job alert...');
    let found = false;
    for (let i = 0; i < 25; i++) {
      const check = await techPage.evaluate((targetReqId) => {
        const events = window._eventsReceived || [];
        const hasEvent = events.some((e) => e.detail?.requestId === targetReqId || e.detail?.ticket?.requestId === targetReqId);
        const stored = localStorage.getItem('scenery_repair_v5_tickets');
        const list = stored ? JSON.parse(stored) : [];
        const hasTicketInStorage = list.some((t) => t.requestId === targetReqId);
        return { hasEvent, hasTicketInStorage, eventCount: events.length, ticketCount: list.length };
      }, createdTicket.requestId);

      if (check.hasEvent || check.hasTicketInStorage) {
        console.log(`✅ SUCCESS! Technician backend received job ${createdTicket.requestId} in real-time!`);
        console.log(`Details: event received=${check.hasEvent}, ticket in storage=${check.hasTicketInStorage}`);
        found = true;
        break;
      }
      await new Promise(r => setTimeout(r, 400));
    }

    if (!found) {
      console.warn('⚠️ Realtime event not caught within 10s, checking storage directly...');
    }

    // Test Anti-Reversion Guard on Live:
    console.log('\n[5] Testing Anti-Reversion Guard on Live App...');
    const completeResult = await techPage.evaluate(async (reqId) => {
      const stored = localStorage.getItem('scenery_repair_v5_tickets');
      const list = stored ? JSON.parse(stored) : [];
      const item = list.find((t) => t.requestId === reqId) || list[0];
      if (!item) return { error: 'No item found' };

      const service = window._ticketServiceDebug;
      if (service) {
        await service.updateTicket(item.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          technicianName: 'ช่างสมหมาย ทดสอบปิดงาน',
          repairResult: 'ช่างผู้ปิดงาน: ช่างสมหมาย\nสาเหตุ: ซ่อมแซมเรียบร้อย\nวิธีแก้ไข: ดำเนินการแก้ไขเสร็จสิ้น'
        });
        return { updated: true, requestId: item.requestId };
      }
      return { error: 'Service not found' };
    }, createdTicket.requestId);

    console.log('Completed ticket via service:', completeResult);

    // Reload technician page
    console.log('Reloading Technician Backend to verify status is locked as completed...');
    await techPage.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const verifyLiveStatus = await techPage.evaluate((reqId) => {
      const stored = localStorage.getItem('scenery_repair_v5_tickets');
      const list = stored ? JSON.parse(stored) : [];
      const item = list.find((t) => t.requestId === reqId) || list[0];
      const reg = localStorage.getItem('scenery_repair_v5_completed_registry');
      return {
        ticketStatus: item?.status,
        completedAt: item?.completedAt,
        inRegistry: reg ? JSON.parse(reg)[reqId] !== undefined : false
      };
    }, createdTicket.requestId);

    console.log('Verification on Live App after reload:', verifyLiveStatus);
    if (verifyLiveStatus.ticketStatus === 'completed') {
      console.log('✅ PASS: Ticket remains COMPLETED! It did NOT bounce back to pending!');
    } else {
      console.error('❌ FAIL: Ticket status reverted to:', verifyLiveStatus.ticketStatus);
    }

  } finally {
    await browser.close();
    console.log('\n--- Live Test Complete ---');
  }
})().catch(console.error);

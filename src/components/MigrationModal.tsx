import React, { useState } from 'react';
import { X, Database, Download, Upload, RefreshCw, CheckCircle, Copy, FileText } from 'lucide-react';
import { Ticket } from '../types';
import { ticketService } from '../services/ticketService';
import { isSupabaseConfigured } from '../lib/supabase';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  onDataChanged: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  tickets,
  onDataChanged
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'supabase'>('export');
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Export JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(tickets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenery-repair-tickets-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['วันที่แจ้ง', 'รหัสแจ้งซ่อม', 'เรื่องที่แจ้ง', 'แผนก', 'สถานที่', 'ชื่อผู้แจ้ง', 'เบอร์โทร', 'ความเร่งด่วน', 'สถานะ', 'ช่างผู้รับผิดชอบ', 'ผลการซ่อม', 'หมายเหตุ'];
    const rows = tickets.map(t => [
      `"${new Date(t.createdAt).toLocaleString('th-TH')}"`,
      `"${t.requestId}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.department}"`,
      `"${(t.location || '').replace(/"/g, '""')}"`,
      `"${(t.requesterName || '').replace(/"/g, '""')}"`,
      `"${t.requesterPhone || '-'}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${(t.technicianName || '-').replace(/"/g, '""')}"`,
      `"${(t.repairResult || '-').replace(/"/g, '""')}"`,
      `"${(t.remark || '-').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenery-repair-tickets-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON / CSV
  const handleImport = async () => {
    if (!importText.trim()) {
      alert('กรุณากรอกหรือวางข้อมูล JSON / CSV ที่ต้องการนำเข้า');
      return;
    }

    try {
      let parsed: Ticket[] = [];
      const trimmed = importText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const raw = JSON.parse(trimmed);
        parsed = Array.isArray(raw) ? raw : [raw];
      } else {
        // Parse CSV lines
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) throw new Error('ข้อมูล CSV ว่างเปล่าหรือมีเพียงแถวหัวตาราง');
        
        parsed = lines.slice(1).map((line, idx) => {
          const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
          return {
            id: 'imp-' + Date.now() + '-' + idx,
            requestId: parts[1] || ('IMP-' + (idx + 1)),
            title: parts[2] || 'งานซ่อมนำเข้า',
            department: parts[3] || 'คาเฟ่ & F&B',
            location: parts[4] || '-',
            requesterName: parts[5] || 'ระบบนำเข้า',
            requesterPhone: parts[6] || '-',
            description: parts[2] || '-',
            priority: (parts[7] as any) || 'normal',
            status: (parts[8] as any) || 'pending',
            technicianName: parts[9] || '',
            repairResult: parts[10] || '',
            remark: parts[11] || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      }

      await ticketService.importTickets(parsed, false);
      setImportResult(`✅ นำเข้ารายการสำเร็จ ${parsed.length} รายการ!`);
      onDataChanged();
    } catch (err: any) {
      setImportResult(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="scenery-gradient text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-300" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">ศูนย์จัดการและย้ายข้อมูลซ่อม (Data Migration & Sync)</h3>
              <p className="text-xs text-teal-100/90">นำเข้ารายการซ่อมจาก Google Sheet / สำรองข้อมูล / เชื่อม Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-100 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'export' ? 'bg-white border-t-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📤 ส่งออกข้อมูล (Backup)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'import' ? 'bg-white border-t-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📥 นำเข้าจาก Sheet / CSV
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3.5 py-2 rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'supabase' ? 'bg-white border-t-2 border-teal-600 text-teal-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ☁️ เชื่อมต่อ Supabase
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 leading-relaxed">
                <h4 className="font-bold mb-1 flex items-center gap-1.5 text-sm">
                  <span>💾 สำรองข้อมูลรายการซ่อมทั้งหมด ({tickets.length} รายการ)</span>
                </h4>
                สามารถส่งออกรายการซ่อมทั้งหมดในระบบเป็นไฟล์ JSON หรือ CSV เพื่อนำไปเปิดใน Excel, Google Sheet หรือสำรองข้อมูลไว้ได้ทุกเมื่อ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">ดาวน์โหลดไฟล์ CSV (Excel / Sheet)</h5>
                    <p className="text-xs text-slate-500 mt-0.5">เปิดใน Excel ภาษาไทยไม่เพี้ยน (UTF-8 with BOM)</p>
                  </div>
                  <button
                    onClick={handleExportCsv}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    ดาวน์โหลด CSV
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">ดาวน์โหลดไฟล์ JSON (Full Backup)</h5>
                    <p className="text-xs text-slate-500 mt-0.5">สำรองข้อมูลโครงสร้างครบถ้วน นำกลับเข้ามาได้ 100%</p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    ดาวน์โหลด JSON
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
                <h4 className="font-bold mb-1 flex items-center gap-1.5 text-sm">
                  <span>📥 วางข้อมูล JSON หรือเนื้อหา CSV จาก Google Sheet</span>
                </h4>
                คัดลอกข้อมูลรายการซ่อมเดิมมาวางในช่องด้านล่าง แล้วกด <strong>"นำเข้าข้อมูล"</strong> เพื่อดึงรายการซ่อมเข้ามายังระบบใหม่ทันที
              </div>

              <textarea
                rows={7}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='วาง JSON Array หรือข้อมูล CSV ที่นี่...&#10;ตัวอย่าง:&#10;[{"requestId":"REP-202609-001","title":"แอร์มีน้ำหยด","department":"ห้องพัก & วิลล่า","location":"วิลล่า 104","requesterName":"แม่บ้าน","priority":"critical","status":"pending"}]'
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-teal-600"
              />

              {importResult && (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800">
                  {importResult}
                </div>
              )}

              <button
                onClick={handleImport}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
              >
                📥 เริ่มต้นนำเข้าข้อมูล
              </button>
            </div>
          )}

          {/* TAB 3: SUPABASE */}
          {activeTab === 'supabase' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>สถานะการเชื่อมต่อ Supabase:</span>
                    {isSupabaseConfigured ? (
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-bold">
                        🟢 เชื่อมต่อสดแล้ว
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-bold">
                        🟡 ใช้งาน Local Mode (ยังไม่ได้ใส่ API Key)
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-600">
                  ระบบเตรียมโครงสร้าง Database PostgreSQL สำหรับ Supabase ไว้ให้ครบถ้วนในโฟลเดอร์ <code>supabase/schema.sql</code> และ <code>supabase/seed.sql</code>
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-white">
                <h4 className="font-bold text-slate-800 text-sm">ขั้นตอนเชื่อมต่อ Supabase จริง:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                  <li>เปิด Dashboard ของ <strong>Supabase</strong> ➔ สร้างโปรเจกต์ใหม่</li>
                  <li>ไปที่ <strong>SQL Editor</strong> ➔ รันสคริปต์จากไฟล์ <code>supabase/schema.sql</code> และ <code>supabase/seed.sql</code></li>
                  <li>ไปที่ <strong>Project Settings ➔ API</strong> ➔ คัดลอก <code>Project URL</code> และ <code>anon public key</code></li>
                  <li>นำมากรอกในไฟล์ <code>.env</code> ของโปรเจกต์นี้:
                    <div className="bg-slate-900 text-teal-300 p-2.5 rounded-xl font-mono text-[11px] my-1">
                      VITE_SUPABASE_URL=https://your-project.supabase.co<br/>
                      VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
                    </div>
                  </li>
                  <li>ระบบจะเปลี่ยนเป็นโหมดออนไลน์และบันทึกข้อมูลลงฐานข้อมูลคลาวด์แบบ Real-time ทันที!</li>
                </ol>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

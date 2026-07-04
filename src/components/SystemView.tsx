import React, { useState } from 'react';
import { Product, Category, Customer, Supplier, ActivityLog, StoreConfig } from '../types';
import { ClipboardList, Database, Save, Check, RefreshCw, Eye, Download, Info, Trash2, Store } from 'lucide-react';
import { motion } from 'motion/react';

const BANK_OPTIONS = [
  { code: 'vietcombank', name: 'Vietcombank (VCB)' },
  { code: 'bidv', name: 'BIDV' },
  { code: 'mb', name: 'MBBank (MB)' },
  { code: 'vietinbank', name: 'VietinBank' },
  { code: 'techcombank', name: 'Techcombank' },
  { code: 'agribank', name: 'Agribank' },
  { code: 'acb', name: 'ACB' },
  { code: 'tpbank', name: 'TPBank' },
  { code: 'vpbank', name: 'VPBank' },
  { code: 'sacombank', name: 'Sacombank' },
  { code: 'vib', name: 'VIB' },
  { code: 'shb', name: 'SHB' },
  { code: 'msb', name: 'MSB' },
  { code: 'hdb', name: 'HDBank' },
  { code: 'seabank', name: 'SeABank' },
];

interface SystemViewProps {
  logs: ActivityLog[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  storeConfig: StoreConfig;
  onUpdateStoreConfig: (config: StoreConfig) => void;
  onClearLogs: () => void;
  onWipeAllData: () => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function SystemView({
  logs,
  products,
  categories,
  customers,
  suppliers,
  storeConfig,
  onUpdateStoreConfig,
  onClearLogs,
  onWipeAllData,
  onShowConfirm,
  onShowAlert
}: SystemViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'LOGS' | 'BACKUP' | 'STORE_CONFIG'>('LOGS');

  // Store config states
  const [storeName, setStoreName] = useState(storeConfig.name);
  const [storeAddress, setStoreAddress] = useState(storeConfig.address);
  const [storePhone, setStorePhone] = useState(storeConfig.phone);
  const [storeWebsite, setStoreWebsite] = useState(storeConfig.website);
  const [storeEmail, setStoreEmail] = useState(storeConfig.email);
  const [storeFooterNote, setStoreFooterNote] = useState(storeConfig.footerNote);
  const [bankName, setBankName] = useState(storeConfig.bankName || 'vietcombank');
  const [bankAccount, setBankAccount] = useState(storeConfig.bankAccount || '');
  const [bankAccountName, setBankAccountName] = useState(storeConfig.bankAccountName || '');

  const handleSaveStoreConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreConfig({
      name: storeName,
      address: storeAddress,
      phone: storePhone,
      website: storeWebsite,
      email: storeEmail,
      footerNote: storeFooterNote,
      bankName,
      bankAccount,
      bankAccountName
    });
    if (onShowAlert) {
      onShowAlert('Cập nhật thông tin cửa hàng & cấu hình chuyển khoản thành công!', 'success');
    }
  };


  // Backup logic: Generate dynamic MySQL dump script using current state data!
  const generateSqlDump = () => {
    let sql = `-- ====================================================\n`;
    sql += `-- SALESFLOW - REAL-TIME AUTOMATIC SQL DUMP EXPORTER\n`;
    sql += `-- NGÀY SAO LƯU: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n`;
    sql += `-- Tương thích: MySQL 8.0+, PHP 8.3 PDO Connection\n`;
    sql += `-- ====================================================\n\n`;

    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 1. Categories Dump
    sql += `-- ----------------------------------------------------\n`;
    sql += `-- DUMP DATA TABLE: categories\n`;
    sql += `-- ----------------------------------------------------\n`;
    categories.forEach(c => {
      sql += `INSERT INTO \`categories\` (\`id\`, \`name\`, \`description\`) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.description.replace(/'/g, "''")}');\n`;
    });
    sql += `\n`;

    // 2. Products Dump
    sql += `-- ----------------------------------------------------\n`;
    sql += `-- DUMP DATA TABLE: products\n`;
    sql += `-- ----------------------------------------------------\n`;
    products.forEach(p => {
      sql += `INSERT INTO \`products\` (\`id\`, \`code\`, \`name\`, \`category_id\`, \`import_price\`, \`price\`, \`stock\`, \`min_stock\`, \`unit\`, \`status\`) VALUES ('${p.id}', '${p.code}', '${p.name.replace(/'/g, "''")}', '${p.categoryId}', ${p.importPrice}, ${p.price}, ${p.stock}, ${p.minStock}, '${p.unit}', 1);\n`;
    });
    sql += `\n`;

    // 3. Customers Dump
    sql += `-- ----------------------------------------------------\n`;
    sql += `-- DUMP DATA TABLE: customers\n`;
    sql += `-- ----------------------------------------------------\n`;
    customers.forEach(c => {
      sql += `INSERT INTO \`customers\` (\`id\`, \`name\`, \`phone\`, \`email\`, \`address\`, \`debt\`, \`max_debt_limit\`) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.phone}', '${c.email}', '${c.address.replace(/'/g, "''")}', ${c.debt}, ${c.maxDebtLimit});\n`;
    });
    sql += `\n`;

    // 4. Suppliers Dump
    sql += `-- ----------------------------------------------------\n`;
    sql += `-- DUMP DATA TABLE: suppliers\n`;
    sql += `-- ----------------------------------------------------\n`;
    suppliers.forEach(s => {
      sql += `INSERT INTO \`suppliers\` (\`id\`, \`name\`, \`phone\`, \`email\`, \`address\`, \`debt_to\`) VALUES ('${s.id}', '${s.name.replace(/'/g, "''")}', '${s.phone}', '${s.email}', '${s.address.replace(/'/g, "''")}', ${s.debtToSupplier});\n`;
    });
    sql += `\n`;

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sql += `-- ======================= END DUMP ===================\n`;

    return sql;
  };

  const downloadSqlBackup = () => {
    const dumpContent = generateSqlDump();
    const blob = new Blob([dumpContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salesflow_local_backup_${Date.now()}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Selection */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveSettingsTab('LOGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSettingsTab === 'LOGS'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Nhật Ký Hoạt Động</span>
        </button>
        <button
          onClick={() => setActiveSettingsTab('BACKUP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSettingsTab === 'BACKUP'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sao Lưu & Bảo Mật</span>
        </button>
        <button
          onClick={() => setActiveSettingsTab('STORE_CONFIG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSettingsTab === 'STORE_CONFIG'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Thông Tin Cửa Hàng & Hóa Đơn</span>
        </button>
      </div>

      {/* VIEW: LOGS VIEWER */}
      {activeSettingsTab === 'LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Nhật ký truy cập hệ thống</h4>
              <p className="text-slate-400 text-xs">Theo dõi chi tiết thời gian và địa điểm thao tác của nhân sự</p>
            </div>
            <button
              onClick={onClearLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg transition"
            >
              Làm trống log
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Thời gian thực hiện</th>
                  <th className="py-3 px-5">Tài khoản</th>
                  <th className="py-3 px-5">Quyền hạn</th>
                  <th className="py-3 px-5">Hành động</th>
                  <th className="py-3 px-5">Mô tả chi tiết giao dịch</th>
                  <th className="py-3 px-5">Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-5 font-mono text-slate-400">{log.createdAt}</td>
                    <td className="py-3 px-5 font-bold text-slate-800">@{log.username}</td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{log.role}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-semibold text-sky-600">[{log.action}]</span>
                    </td>
                    <td className="py-3 px-5 text-slate-600 font-medium leading-relaxed max-w-xs truncate">{log.details}</td>
                    <td className="py-3 px-5 font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: BACKUP & DATABASE MANAGEMENT */}
      {activeSettingsTab === 'BACKUP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Action Card Exporter */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
                  <Database className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-1">Sao Lưu Dữ Liệu SQL</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Hệ thống nén toàn bộ dữ liệu hiện hành (Sản phẩm, Khách hàng, NCC, Dư nợ) thành một file mã nguồn <code>.sql</code> tiêu chuẩn. File này sẵn sàng nạp trực tiếp vào hệ thống MySQL database backend.
                </p>
              </div>

              <button
                onClick={downloadSqlBackup}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/10 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã tải thành công!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>TẢI VỀ FILE BACKUP (.SQL)</span>
                  </>
                )}
              </button>
            </div>

            {/* Danger Zone: Wipe all data card */}
            <div className="bg-white rounded-2xl border border-rose-150 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-rose-800 text-base mb-1">Xóa Sạch Dữ Liệu</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Hành động này sẽ <strong>xóa vĩnh viễn</strong> toàn bộ dữ liệu trong phiên làm việc hiện tại: Sản phẩm, Đơn hàng, Ngành hàng, Khách hàng, Nhà cung cấp và Công nợ. Nhật ký hệ thống sẽ được đặt lại.
                </p>
              </div>

              <button
                onClick={() => {
                  const confirmMsg = 'CẢNH BÁO: Bạn có chắc chắn muốn XÓA SẠCH toàn bộ dữ liệu hiện tại không? Thao tác này sẽ xóa toàn bộ Sản phẩm, Đơn hàng, Khách hàng, Công nợ và KHÔNG THỂ HOÀN TÁC!';
                  const handleWipe = () => {
                    onWipeAllData();
                    if (onShowAlert) {
                      onShowAlert('Hệ thống đã được xóa sạch dữ liệu hoàn toàn về trạng thái trống!', 'success');
                    } else {
                      alert('Hệ thống đã được xóa sạch dữ liệu hoàn toàn về trạng thái trống!');
                    }
                  };

                  if (onShowConfirm) {
                    onShowConfirm(confirmMsg, handleWipe);
                  } else if (window.confirm(confirmMsg)) {
                    handleWipe();
                  }
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-lg shadow-rose-600/10 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>XÓA SẠCH DỮ LIỆU</span>
              </button>
            </div>
          </div>

          {/* Backup Live Preview View code */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 font-mono">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Xem Trước Cú Pháp SQL Backup</span>
              </span>
              <span className="text-[10px] text-slate-500 italic">Mã hoá UTF-8mb4</span>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl max-h-72 whitespace-pre select-text">
              {generateSqlDump()}
            </div>
            
            <div className="mt-3.5 flex items-start gap-2.5 text-[10px] text-slate-400 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-800/60">
              <Info className="w-4.5 h-4.5 text-sky-400 shrink-0" />
              <p>Mã SQL này chứa tất cả dữ liệu bạn đã tạo, nhập, bán hoặc ghi nợ trong phiên làm việc này. Bạn có thể sử dụng mã SQL này để chuyển tiếp dữ liệu lên bất kỳ hệ thống SQL Hosting trực tiếp nào.</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: STORE & INVOICE CONFIGURATION */}
      {activeSettingsTab === 'STORE_CONFIG' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Thông tin Cửa hàng & Cấu hình Hóa đơn</h4>
              <p className="text-slate-400 text-xs">Cấu hình thông tin hiển thị trên tiêu đề và chân trang của hóa đơn bán hàng POS và xuất file PDF</p>
            </div>

            <form onSubmit={handleSaveStoreConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Tên cửa hàng / thương hiệu</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Ví dụ: CỬA HÀNG TIỆN LỢI SALESFLOW"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Địa chỉ</label>
                  <input
                    type="text"
                    required
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Ví dụ: 45 Lê Lợi, Bến Nghé, Quận 1, TP. HCM"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    required
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Ví dụ: 0988.123.456"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Website</label>
                  <input
                    type="text"
                    value={storeWebsite}
                    onChange={(e) => setStoreWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Ví dụ: salesflow.vn"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Email</label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Ví dụ: contact@salesflow.vn"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Ghi chú chân hóa đơn (Lời chào)</label>
                  <textarea
                    value={storeFooterNote}
                    onChange={(e) => setStoreFooterNote(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold resize-none"
                    placeholder="Ví dụ: Cảm ơn quý khách. Hẹn gặp lại!"
                  />
                </div>

                {/* Bank transfer config */}
                <div className="space-y-1 md:col-span-2 border-t border-slate-150 pt-4 mt-2">
                  <h5 className="font-bold text-slate-800 text-xs">Cấu hình thanh toán chuyển khoản (VietQR)</h5>
                  <p className="text-slate-400 text-[11px]">Thông tin tài khoản ngân hàng để tự động tạo mã QR chuyển khoản khi thu ngân bán hàng POS</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Chọn ngân hàng</label>
                  <select
                    value={BANK_OPTIONS.some(b => b.code === bankName) ? bankName : 'other'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'other') {
                        setBankName(val);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                    <option value="other">-- Khác / Nhập mã thủ công --</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Mã Ngân hàng (nếu khác)</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value.toLowerCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Ví dụ: acb, tpbank, techcombank..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Số tài khoản</label>
                  <input
                    type="text"
                    required
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value.replace(/\s/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Nhập số tài khoản ngân hàng"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold text-[10px] uppercase">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    required
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition text-xs font-semibold"
                    placeholder="Nhập tên viết hoa không dấu"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/10 text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>LƯU CẤU HÌNH CỬA HÀNG</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Invoice Preview */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-sky-500 animate-pulse" />
              <span>Xem Trước Hóa Đơn Mẫu</span>
            </h4>

            {/* Receipt Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-slate-700 font-sans leading-relaxed text-xs">
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-extrabold text-slate-950 uppercase text-[13px] tracking-tight">{storeName || 'TÊN CỬA HÀNG'}</h3>
                <p className="text-[10px] text-slate-500 mt-1">ĐC: {storeAddress || 'Địa chỉ chưa cấu hình'}</p>
                <p className="text-[10px] text-slate-500">
                  SĐT: {storePhone || 'Chưa cấu hình'} 
                  {storeWebsite ? ` - Website: ${storeWebsite}` : ''}
                </p>

                <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900 mt-4">HÓA ĐƠN BÁN HÀNG</h4>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Mã HĐ: HD99999 | Ngày: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</p>
              </div>

              {/* Sample Items Table */}
              <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1 text-[10px]">
                  <span>Sản phẩm</span>
                  <div className="flex gap-4">
                    <span className="w-8 text-right">SL</span>
                    <span className="w-16 text-right">T.Tiền</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">Sữa tươi Ba Vì 1L</span>
                  <div className="flex gap-4">
                    <span className="w-8 text-right text-slate-500 font-mono">2</span>
                    <span className="w-16 text-right font-bold font-mono">60.000đ</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">Bánh mì tươi Kinh Đô</span>
                  <div className="flex gap-4">
                    <span className="w-8 text-right text-slate-500 font-mono">1</span>
                    <span className="w-16 text-right font-bold font-mono">15.000đ</span>
                  </div>
                </div>
              </div>

              {/* Sample Payment summary */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="font-mono text-rose-600 font-black text-xs">75.000đ</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Phương thức:</span>
                  <span className="font-bold text-slate-800">Tiền mặt</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-1 text-[10px] text-slate-500 italic">
                <p>{storeFooterNote || 'Cảm ơn quý khách. Hẹn gặp lại!'}</p>
                <p className="text-[8px] text-slate-400 font-mono mt-1 mt-2">Powered by SalesFlow System</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


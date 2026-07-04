import React, { useState } from 'react';
import { Customer, DebtTransaction } from '../types';
import { Users, HandCoins, UserPlus, FileClock, Phone, MapPin, X, CheckCircle, Info, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerViewProps {
  customers: Customer[];
  debtTransactions: DebtTransaction[];
  onAddCustomer: (name: string, phone: string, address: string, maxDebt: number) => Customer;
  onCollectDebt: (customerId: string, amount: number, note: string) => void;
  onDeleteCustomer?: (id: string) => void;
  onDeleteDebtTransaction?: (id: string) => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function CustomerView({
  customers,
  debtTransactions,
  onAddCustomer,
  onCollectDebt,
  onDeleteCustomer,
  onDeleteDebtTransaction,
  onShowConfirm,
  onShowAlert
}: CustomerViewProps) {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'DEBT_HISTORY'>('DIRECTORY');

  // Customer Add States
  const [showAddModal, setShowAddModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cMaxDebt, setCMaxDebt] = useState<number>(5000000);

  // Debt Collect States
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectNote, setCollectNote] = useState('Thu tiền mặt nợ khách tại quầy');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cPhone) {
      if (onShowAlert) {
        onShowAlert('Vui lòng bổ sung đầy đủ tên và số điện thoại!', 'error');
      } else {
        alert('Vui lòng bổ sung đầy đủ tên và số điện thoại!');
      }
      return;
    }
    onAddCustomer(cName, cPhone, cAddress, cMaxDebt);
    setCName('');
    setCPhone('');
    setCEmail('');
    setCAddress('');
    setCMaxDebt(5000000);
    setShowAddModal(false);
  };

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || collectAmount <= 0) return;
    if (collectAmount > selectedCustomer.debt) {
      if (onShowAlert) {
        onShowAlert('Số tiền thu nợ vượt quá dư nợ thực tế!', 'error');
      } else {
        alert('Số tiền thu nợ vượt quá dư nợ thực tế!');
      }
      return;
    }
    onCollectDebt(selectedCustomer.id, collectAmount, collectNote);
    setCollectAmount(0);
    setCollectNote('Thu tiền mặt nợ khách tại quầy');
    setShowCollectModal(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'DIRECTORY'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Sách Khách Hàng ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DEBT_HISTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'DEBT_HISTORY'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileClock className="w-4 h-4" />
            <span>Lịch Sử Giao Dịch Nợ ({debtTransactions.length})</span>
          </button>
        </div>

        {activeTab === 'DIRECTORY' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/10"
          >
            <UserPlus className="w-4 h-4" />
            <span>Đăng Ký Khách Hàng</span>
          </button>
        )}
      </div>

      {/* RENDER TAB: CUSTOMERS DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Tên đối tác khách hàng</th>
                  <th className="py-3 px-5">Thông tin liên hệ</th>
                  <th className="py-3 px-5">Địa chỉ nhận hàng</th>
                  <th className="py-3 px-5 text-right">Hạn mức nợ tối đa</th>
                  <th className="py-3 px-5 text-right">Dư nợ hiện hành</th>
                  <th className="py-3 px-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-800">{cust.name}</div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">ID: {cust.id}</span>
                    </td>
                    <td className="py-3 px-5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-slate-500 max-w-xs truncate">
                      {cust.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Khách vãng lai mua quầy</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right font-semibold text-slate-500">
                      {cust.maxDebtLimit > 0 ? `${new Intl.NumberFormat('vi-VN').format(cust.maxDebtLimit)}đ` : 'Không'}
                    </td>
                    <td className="py-3 px-5 text-right font-extrabold text-sm">
                      <span className={cust.debt > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {new Intl.NumberFormat('vi-VN').format(cust.debt)}đ
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {cust.debt > 0 ? (
                          <button
                            onClick={() => { setSelectedCustomer(cust); setCollectAmount(cust.debt); setShowCollectModal(true); }}
                            className="px-2.5 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            <span>Thu nợ</span>
                          </button>
                        ) : null}

                        {cust.id !== 'CUST001' ? (
                          <button
                            onClick={() => {
                              const hasDebt = cust.debt > 0;
                              const confirmMsg = hasDebt
                                ? `CẢNH BÁO: Khách hàng '${cust.name}' hiện đang có dư nợ ${new Intl.NumberFormat('vi-VN').format(cust.debt)}đ! Nếu bạn xóa khách hàng này, số nợ hiện tại sẽ bị xóa sạch khỏi hệ thống. Bạn có chắc chắn muốn xóa không?`
                                : `Bạn có chắc chắn muốn xóa khách hàng '${cust.name}' không?`;

                              if (onShowConfirm) {
                                onShowConfirm(confirmMsg, () => onDeleteCustomer?.(cust.id));
                              } else if (window.confirm(confirmMsg)) {
                                onDeleteCustomer?.(cust.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Xóa khách hàng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">Mặc định</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB: DEBT HISTORY */}
      {activeTab === 'DEBT_HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Thời gian ghi nhận</th>
                  <th className="py-3 px-5">Tên đối tác</th>
                  <th className="py-3 px-5">Loại đối tác</th>
                  <th className="py-3 px-5">Nội dung / Ghi chú phát sinh</th>
                  <th className="py-3 px-5 text-right">Số tiền biến động</th>
                  <th className="py-3 px-5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {debtTransactions.map((dt) => (
                  <tr key={dt.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-5 text-slate-400 font-mono">{dt.createdAt}</td>
                    <td className="py-3 px-5 font-bold text-slate-800">{dt.partnerName}</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dt.partnerType === 'CUSTOMER' 
                          ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        {dt.partnerType === 'CUSTOMER' ? 'Khách hàng' : 'Nhà cung cấp'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-600 max-w-sm truncate">{dt.note}</td>
                    <td className="py-3 px-5 text-right font-extrabold text-sm">
                      <span className={dt.type === 'INCREASE' ? 'text-rose-600' : 'text-emerald-600'}>
                        {dt.type === 'INCREASE' ? '+' : '-'}
                        {new Intl.NumberFormat('vi-VN').format(Math.abs(dt.amount))}đ
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <button
                        onClick={() => {
                          const formattedAmt = new Intl.NumberFormat('vi-VN').format(Math.abs(dt.amount));
                          const confirmMsg = `Bạn có chắc chắn muốn xóa giao dịch công nợ '${dt.note || 'Không có tiêu đề'}' trị giá ${formattedAmt}đ này không?\nThao tác này sẽ tự động khôi phục/hoàn trả số dư nợ tương ứng cho đối tác.`;
                          
                          if (onShowConfirm) {
                            onShowConfirm(confirmMsg, () => onDeleteDebtTransaction?.(dt.id));
                          } else if (window.confirm(confirmMsg)) {
                            onDeleteDebtTransaction?.(dt.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa giao dịch công nợ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Đăng Ký Khách Hàng Thành Viên</span>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tên khách hàng *</label>
                  <input
                    type="text"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    required
                    placeholder="vd: Nguyễn Văn Hải"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    required
                    placeholder="Nhập SĐT..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email chính</label>
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Địa chỉ giao nhận hàng</label>
                  <input
                    type="text"
                    value={cAddress}
                    onChange={(e) => setCAddress(e.target.value)}
                    placeholder="Nhập số nhà, tên đường..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Hạn mức nợ tối đa (đ)</label>
                  <input
                    type="number"
                    value={cMaxDebt}
                    onChange={(e) => setCMaxDebt(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Mặc định: 5,000,000 VNĐ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-semibold text-rose-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/10 text-xs"
                >
                  Đăng Ký Thành Viên
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: COLLECT CUSTOMER DEBT */}
      <AnimatePresence>
        {showCollectModal && selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Ghi Nhận Thu Nợ Đối Tác</span>
                </span>
                <button onClick={() => setShowCollectModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCollectSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Khách nộp tiền</label>
                  <input
                    type="text"
                    value={selectedCustomer.name}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Dư nợ hiện tại (đ)</label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('vi-VN').format(selectedCustomer.debt) + ' VNĐ'}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-rose-600 font-extrabold focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Số tiền thu nộp (đ) *</label>
                  <input
                    type="number"
                    value={collectAmount === 0 ? '' : collectAmount}
                    onChange={(e) => setCollectAmount(Math.min(selectedCustomer.debt, Math.max(1, parseInt(e.target.value) || 0)))}
                    required
                    placeholder="Nhập số tiền..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-extrabold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Ghi chú giao dịch</label>
                  <input
                    type="text"
                    value={collectNote}
                    onChange={(e) => setCollectNote(e.target.value)}
                    placeholder="Nhập ghi chú thu nợ..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/10 text-xs"
                >
                  Xác nhận nộp quỹ
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { Order, Product, StoreConfig } from '../types';
import { 
  Search, 
  Filter, 
  Receipt, 
  Trash2, 
  Eye, 
  Printer, 
  Coins, 
  Wallet, 
  ShieldAlert,
  ArrowDownLeft, 
  X, 
  ChevronRight,
  FileSpreadsheet,
  Download,
  Calendar,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderManagementProps {
  orders: Order[];
  products: Product[];
  storeConfig?: StoreConfig;
  onDeleteOrder: (id: string) => void;
  onNavigateToPOS?: () => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function OrderManagementView({
  orders,
  products,
  storeConfig,
  onDeleteOrder,
  onNavigateToPOS,
  onShowConfirm,
  onShowAlert
}: OrderManagementProps) {

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL'); // ALL, TODAY, THIS_WEEK, THIS_MONTH
  const [valueFilter, setValueFilter] = useState<string>('ALL'); // ALL, UNDER_500, 500_TO_2000, OVER_2000
  
  // Selected order for detailed modal / printable invoice
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Helper: Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      order.code.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      (order.customerPhone && order.customerPhone.includes(searchLower)) ||
      order.sellerName.toLowerCase().includes(searchLower);

    // 2. Payment Method Filter
    const matchPayment = paymentFilter === 'ALL' || order.paymentMethod === paymentFilter;

    // 3. Date Filter
    let matchDate = true;
    if (dateFilter !== 'ALL') {
      const orderDate = new Date(order.createdAt.replace(' ', 'T'));
      const now = new Date();
      
      if (dateFilter === 'TODAY') {
        matchDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'THIS_WEEK') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        matchDate = orderDate >= oneWeekAgo;
      } else if (dateFilter === 'THIS_MONTH') {
        matchDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
    }

    // 4. Value Filter
    let matchValue = true;
    if (valueFilter !== 'ALL') {
      if (valueFilter === 'UNDER_500') {
        matchValue = order.finalAmount < 500000;
      } else if (valueFilter === '500_TO_2000') {
        matchValue = order.finalAmount >= 500000 && order.finalAmount <= 2000000;
      } else if (valueFilter === 'OVER_2000') {
        matchValue = order.finalAmount > 2000000;
      }
    }

    return matchSearch && matchPayment && matchDate && matchValue;
  });

  // Calculation statistics based on the FILTERED orders
  const totalFilteredCount = filteredOrders.length;
  const totalFilteredRevenue = filteredOrders.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalDiscountApplied = filteredOrders.reduce((sum, o) => sum + o.discount, 0);
  
  // Total of each payment method
  const cashTotal = filteredOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.finalAmount, 0);
  const bankTotal = filteredOrders.filter(o => o.paymentMethod === 'BANK_TRANSFER').reduce((sum, o) => sum + o.finalAmount, 0);
  const debtTotal = filteredOrders.filter(o => o.paymentMethod === 'DEBT').reduce((sum, o) => sum + o.finalAmount, 0);

  // Export to simple CSV format
  const exportToCSV = () => {
    const headers = ['Mã Đơn', 'Ngày Tạo', 'Khách Hàng', 'Số Điện Thoại', 'Thu Ngân', 'Phương Thức', 'Tổng Tiền (VND)', 'Giảm Giá (VND)', 'Thành Tiền (VND)'];
    const rows = filteredOrders.map(o => [
      o.code,
      o.createdAt,
      o.customerName,
      o.customerPhone || 'N/A',
      o.sellerName,
      o.paymentMethod === 'CASH' ? 'Tiền Mặt' : o.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển Khoản' : 'Ghi Nợ',
      o.totalAmount,
      o.discount,
      o.finalAmount
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_Cao_Don_Hang_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print invoice function
  const handlePrint = () => {
    if (!selectedOrder) return;

    const element = document.getElementById('printable-invoice-area');
    if (!element) return;

    // Create a temporary container at the root level of body
    const printContainer = document.createElement('div');
    printContainer.id = 'direct-print-container';

    // Clone the printable element and preserve its original ID and classes
    const printClone = element.cloneNode(true) as HTMLElement;
    printContainer.appendChild(printClone);
    document.body.appendChild(printContainer);

    // Create and inject custom print-specific stylesheet to isolate the printing area
    const style = document.createElement('style');
    style.id = 'direct-print-style';
    style.innerHTML = `
      @media print {
        /* Hide all existing elements inside body during print */
        body > *:not(#direct-print-container) {
          display: none !important;
        }
        /* Display print container at full width */
        #direct-print-container {
          display: block !important;
          width: 100% !important;
          background: white !important;
          color: black !important;
        }
        /* Target and style the cloned invoice specifically to match A5 dimensions */
        #printable-invoice-area {
          display: block !important;
          width: 148mm !important;
          min-height: 210mm !important;
          margin: 0 auto !important;
          padding: 10mm 8mm !important;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          border: none !important;
        }
        @page {
          size: A5;
          margin: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Call browser's native print modal
    window.print();

    // Clean up injected style and temporary container after printing is initiated
    document.head.removeChild(style);
    document.body.removeChild(printContainer);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Quản Lý Đơn Hàng</h1>
              <p className="text-slate-400 text-xs font-semibold">Tra cứu, xem hoá đơn và theo dõi lịch sử giao dịch bán hàng tại quầy</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition border border-emerald-200/50 flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất file Excel CSV</span>
          </button>
          
          {onNavigateToPOS && (
            <button 
              onClick={onNavigateToPOS}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-600/15"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tạo đơn mới (POS)</span>
            </button>
          )}
        </div>
      </div>

      {/* DASHBOARD SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Tổng Số Đơn Hàng</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{totalFilteredCount} đơn</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Được lọc theo các điều kiện</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Doanh Thu Đơn Hàng</span>
            <h3 className="text-lg font-black text-emerald-600 mt-0.5">{formatCurrency(totalFilteredRevenue)}</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Giảm giá đã trừ: {formatCurrency(totalDiscountApplied)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Tiền Mặt / CK</span>
            <h3 className="text-lg font-black text-indigo-600 mt-0.5">{formatCurrency(cashTotal + bankTotal)}</h3>
            <p className="text-[10px] text-slate-400 font-semibold">TM: {formatCurrency(cashTotal)} | CK: {formatCurrency(bankTotal)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Ghi Nợ Khách Hàng</span>
            <h3 className="text-lg font-black text-rose-600 mt-0.5">{formatCurrency(debtTotal)}</h3>
            <p className="text-[10px] text-rose-400 font-semibold">Ghi nợ tự động vào hồ sơ</p>
          </div>
        </div>

      </div>

      {/* FILTER PANEL */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã đơn, tên khách hàng, số điện thoại, thu ngân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Clear Button */}
          {(paymentFilter !== 'ALL' || dateFilter !== 'ALL' || valueFilter !== 'ALL') && (
            <button
              onClick={() => {
                setPaymentFilter('ALL');
                setDateFilter('ALL');
                setValueFilter('ALL');
              }}
              className="w-full lg:w-auto px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-100 font-bold text-xs rounded-xl transition"
            >
              Đặt lại bộ lọc
            </button>
          )}

        </div>

        {/* Multi filter columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-50">
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Phương Thức Thanh Toán</label>
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
              {['ALL', 'CASH', 'BANK_TRANSFER', 'DEBT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPaymentFilter(type)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition ${
                    paymentFilter === type
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type === 'ALL' && 'Tất cả'}
                  {type === 'CASH' && 'Tiền mặt'}
                  {type === 'BANK_TRANSFER' && 'CK'}
                  {type === 'DEBT' && 'Ghi nợ'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Thời Gian Giao Dịch</label>
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
              {['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'].map((time) => (
                <button
                  key={time}
                  onClick={() => setDateFilter(time)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition ${
                    dateFilter === time
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {time === 'ALL' && 'Tất cả'}
                  {time === 'TODAY' && 'Hôm nay'}
                  {time === 'THIS_WEEK' && '7 ngày'}
                  {time === 'THIS_MONTH' && 'Tháng này'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Giá Trị Đơn Hàng</label>
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
              {['ALL', 'UNDER_500', '500_TO_2000', 'OVER_2000'].map((val) => (
                <button
                  key={val}
                  onClick={() => setValueFilter(val)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition ${
                    valueFilter === val
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {val === 'ALL' && 'Tất cả'}
                  {val === 'UNDER_500' && '< 500k'}
                  {val === '500_TO_2000' && '500k - 2M'}
                  {val === 'OVER_2000' && '> 2M'}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ORDERS LIST & TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span>
            <span className="font-bold text-slate-800 text-xs">Danh Sách Hoá Đơn ({filteredOrders.length})</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-bold">Kéo ngang nếu màn hình nhỏ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-wider bg-slate-50/30">
                <th className="py-3.5 px-5">Mã Đơn</th>
                <th className="py-3.5 px-5">Ngày Bán</th>
                <th className="py-3.5 px-5">Khách Hàng</th>
                <th className="py-3.5 px-5">Tổng Sản Phẩm</th>
                <th className="py-3.5 px-5">Thành Tiền</th>
                <th className="py-3.5 px-5">Thanh Toán</th>
                <th className="py-3.5 px-5">Người Bán</th>
                <th className="py-3.5 px-5 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold">Không tìm thấy đơn hàng nào khớp với bộ lọc</p>
                      <p className="text-[10px] text-slate-400">Hãy thử nhập từ khóa khác hoặc điều chỉnh các lựa chọn lọc phía trên.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalItemsQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/40 transition group">
                      
                      <td className="py-3 px-5">
                        <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md">
                          {order.code}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-slate-500 font-medium">
                        {order.createdAt}
                      </td>

                      <td className="py-3 px-5">
                        <div>
                          <div className="font-bold text-slate-800">{order.customerName}</div>
                          {order.customerPhone && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.customerPhone}</div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-5 text-slate-600 font-semibold font-mono">
                        {totalItemsQty} sản phẩm
                      </td>

                      <td className="py-3 px-5 font-bold text-slate-800">
                        {formatCurrency(order.finalAmount)}
                      </td>

                      <td className="py-3 px-5">
                        {order.paymentMethod === 'CASH' && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-bold text-[10px] uppercase">
                            Tiền Mặt
                          </span>
                        )}
                        {order.paymentMethod === 'BANK_TRANSFER' && (
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-full font-bold text-[10px] uppercase">
                            Chuyển Khoản
                          </span>
                        )}
                        {order.paymentMethod === 'DEBT' && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-bold text-[10px] uppercase">
                            Ghi Nợ
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-5 text-slate-500 font-medium">
                        {order.sellerName}
                      </td>

                      <td className="py-3 px-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="Xem chi tiết hóa đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              const confirmMsg = `Bạn có chắc chắn muốn hủy đơn hàng ${order.code}? Thao tác này sẽ hoàn trả số lượng hàng vào kho và thu hồi công nợ tự động!`;
                              if (onShowConfirm) {
                                onShowConfirm(confirmMsg, () => onDeleteOrder(order.id));
                              } else if (window.confirm(confirmMsg)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hủy đơn hàng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* DETAIL MODAL / INVOICE RENDER */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-sky-600" />
                  <span className="font-extrabold text-slate-800 text-sm">Chi Tiết Hoá Đơn {selectedOrder.code}</span>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-xl transition"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Printable Area Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6" id="printable-invoice-area">
                
                {/* Store Header */}
                <div className="text-center pb-4 border-b border-dashed border-slate-200">
                  <h2 className="text-base font-black text-slate-900 tracking-wide uppercase">{storeConfig?.name || 'SALESFLOW SYSTEM POS'}</h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Địa chỉ: {storeConfig?.address || '180 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Điện thoại: {storeConfig?.phone || '1900 6000'}{storeConfig?.email ? ` | Email: ${storeConfig.email}` : ''}{storeConfig?.website ? ` | Web: ${storeConfig.website}` : ''}</p>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400 font-semibold">Số hóa đơn: </span>
                      <span className="font-mono font-bold text-slate-800">{selectedOrder.code}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Thời gian: </span>
                      <span className="text-slate-700 font-semibold">{selectedOrder.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Thu ngân: </span>
                      <span className="text-slate-700 font-bold">{selectedOrder.sellerName}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400 font-semibold">Khách hàng: </span>
                      <span className="text-slate-700 font-bold">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Điện thoại: </span>
                      <span className="text-slate-700 font-semibold font-mono">{selectedOrder.customerPhone || 'Không có'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Thanh toán: </span>
                      <span className="font-bold text-slate-800">
                        {selectedOrder.paymentMethod === 'CASH' && 'Tiền Mặt'}
                        {selectedOrder.paymentMethod === 'BANK_TRANSFER' && 'Chuyển Khoản'}
                        {selectedOrder.paymentMethod === 'DEBT' && 'Ghi Nợ Trừ Công Nợ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Purchased table */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Danh Sách Sản Phẩm Mua</div>
                  
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-2 px-3">Sản phẩm</th>
                          <th className="py-2 px-3 text-center">SL</th>
                          <th className="py-2 px-3 text-right">Đơn giá</th>
                          <th className="py-2 px-3 text-right">Tổng cộng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="text-slate-700">
                            <td className="py-2 px-3 font-semibold text-slate-800">{item.productName}</td>
                            <td className="py-2 px-3 text-center font-semibold font-mono">{item.quantity}</td>
                            <td className="py-2 px-3 text-right font-semibold font-mono">{formatCurrency(item.price)}</td>
                            <td className="py-2 px-3 text-right font-bold font-mono text-slate-800">{formatCurrency(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="space-y-2 pt-3 border-t border-dashed border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Tổng tiền hàng:</span>
                    <span className="font-semibold font-mono text-slate-700">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span className="font-semibold">Chiết khấu giảm giá:</span>
                      <span className="font-semibold font-mono">-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {selectedOrder.vatRate !== undefined && selectedOrder.vatRate > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold">Thuế VAT ({selectedOrder.vatRate}%):</span>
                      <span className="font-semibold font-mono text-slate-700">+{formatCurrency(selectedOrder.vatAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                    <span className="font-black text-slate-850">Khách phải trả (Thành tiền):</span>
                    <span className="font-black text-sky-600 font-mono">{formatCurrency(selectedOrder.finalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-slate-400 font-semibold">Khách đưa / Thanh toán:</span>
                    <span className="font-semibold font-mono text-slate-700">{formatCurrency(selectedOrder.paidAmount)}</span>
                  </div>

                  {selectedOrder.changeAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Trả lại tiền thừa:</span>
                      <span className="font-mono">{formatCurrency(selectedOrder.changeAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Thanks greeting */}
                <div className="text-center pt-4 border-t border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold italic">{storeConfig?.footerNote || 'Cảm ơn Quý khách đã mua sắm tại SalesFlow!'}</p>
                  <p className="text-[9px] text-slate-300 font-semibold mt-0.5">Hóa đơn điện tử khởi tạo tự động từ hệ thống.</p>
                </div>

              </div>

              {/* Action bar inside modal */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 no-print">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200"
                >
                  Đóng cửa sổ
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-600/10"
                >
                  <Printer className="w-4 h-4" />
                  <span>In hoá đơn</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

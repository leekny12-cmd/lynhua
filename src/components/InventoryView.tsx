import React, { useState, useMemo } from 'react';
import { Product, Supplier, PurchaseOrder, Category } from '../types';
import { 
  Plus, 
  HelpCircle, 
  Truck, 
  FileCheck, 
  ArrowDownToLine, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  ChevronRight, 
  X,
  Search,
  AlertTriangle,
  Boxes,
  Layers,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryViewProps {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  categories?: Category[];
  onAddSupplier: (name: string, phone: string, email: string, address: string) => void;
  onPaySupplierDebt: (supplierId: string, amount: number) => void;
  onImportGoods: (order: Omit<PurchaseOrder, 'id' | 'code' | 'createdAt'>) => void;
  onDeleteSupplier: (id: string) => void;
  onDeletePurchaseOrder: (id: string) => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function InventoryView({
  products,
  suppliers,
  purchaseOrders,
  categories = [],
  onAddSupplier,
  onPaySupplierDebt,
  onImportGoods,
  onDeleteSupplier,
  onDeletePurchaseOrder,
  onShowConfirm,
  onShowAlert
}: InventoryViewProps) {
  const [activeTab, setActiveTab] = useState<'STOCK_LEVELS' | 'SUPPLIERS' | 'IMPORT_HISTORY' | 'CREATE_IMPORT'>('STOCK_LEVELS');

  // Stock levels search & filter states
  const [stockSearch, setStockSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NORMAL_STOCK'>('ALL');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string>('ALL');

  // Supplier Add states
  const [showAddModal, setShowAddModal] = useState(false);
  const [sName, setSName] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sAddress, setSAddress] = useState('');

  // Supplier Debt settlement state
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Import Goods Wizard state
  const [selectedImportSupplier, setSelectedImportSupplier] = useState<Supplier>(suppliers[0] || null);
  const [importCart, setImportCart] = useState<{ product: Product; quantity: number; importPrice: number }[]>([]);
  const [selectedImportProduct, setSelectedImportProduct] = useState<string>('');
  const [tempQty, setTempQty] = useState<number>(10);
  const [tempPrice, setTempPrice] = useState<number>(10000);
  const [importPaymentMethod, setImportPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'DEBT'>('CASH');

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sPhone) {
      if (onShowAlert) {
        onShowAlert('Họ tên và Số điện thoại nhà cung cấp không được bỏ trống!', 'error');
      } else {
        alert('Họ tên và Số điện thoại nhà cung cấp không được bỏ trống!');
      }
      return;
    }
    onAddSupplier(sName, sPhone, sEmail, sAddress);
    setSName('');
    setSPhone('');
    setSEmail('');
    setSAddress('');
    setShowAddModal(false);
  };

  const handlePaySupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount <= 0) return;
    if (payAmount > selectedSupplier.debtToSupplier) {
      if (onShowAlert) {
        onShowAlert('Số tiền trả vượt quá dư nợ thực tế!', 'error');
      } else {
        alert('Số tiền trả vượt quá dư nợ thực tế!');
      }
      return;
    }
    onPaySupplierDebt(selectedSupplier.id, payAmount);
    setPayAmount(0);
    setShowPayModal(false);
    setSelectedSupplier(null);
  };

  const addProductToImportCart = () => {
    if (!selectedImportProduct) return;
    const prod = products.find(p => p.id === selectedImportProduct);
    if (!prod) return;

    const existingIndex = importCart.findIndex(item => item.product.id === prod.id);
    if (existingIndex > -1) {
      const updated = [...importCart];
      updated[existingIndex].quantity += tempQty;
      setImportCart(updated);
    } else {
      setImportCart([...importCart, { product: prod, quantity: tempQty, importPrice: tempPrice }]);
    }
    // Reset product selection
    setSelectedImportProduct('');
  };

  const handleRemoveImportItem = (productId: string) => {
    setImportCart(importCart.filter(item => item.product.id !== productId));
  };

  const importTotal = importCart.reduce((sum, item) => sum + (item.importPrice * item.quantity), 0);

  const handleImportSubmit = () => {
    if (!selectedImportSupplier) {
      if (onShowAlert) {
        onShowAlert('Vui lòng bổ sung hoặc chọn một nhà cung cấp đối tác!', 'error');
      } else {
        alert('Vui lòng bổ sung hoặc chọn một nhà cung cấp đối tác!');
      }
      return;
    }
    if (importCart.length === 0) {
      if (onShowAlert) {
        onShowAlert('Đơn nhập rỗng! Hãy thêm sản phẩm cần nhập kho.', 'error');
      } else {
        alert('Đơn nhập rỗng! Hãy thêm sản phẩm cần nhập kho.');
      }
      return;
    }

    const items = importCart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      importPrice: item.importPrice
    }));

    onImportGoods({
      supplierId: selectedImportSupplier.id,
      supplierName: selectedImportSupplier.name,
      items,
      totalAmount: importTotal,
      paidAmount: importPaymentMethod === 'DEBT' ? 0 : importTotal,
      paymentMethod: importPaymentMethod
    });

    if (onShowAlert) {
      onShowAlert('Ghi nhận nhập hàng vào kho thành công! Sản phẩm đã tăng số lượng tương ứng.', 'success');
    } else {
      alert('Ghi nhận nhập hàng vào kho thành công! Sản phẩm đã tăng số lượng tương ứng.');
    }
    setImportCart([]);
    setActiveTab('IMPORT_HISTORY');
  };

  return (
    <div className="space-y-6">
      {/* Tab Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('STOCK_LEVELS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'STOCK_LEVELS'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Tồn Kho Thực Tế ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'SUPPLIERS'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Nhà Cung Cấp ({suppliers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('IMPORT_HISTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'IMPORT_HISTORY'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Lịch Sử Nhập Hàng ({purchaseOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('CREATE_IMPORT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'CREATE_IMPORT'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Nhập Kho Trực Tiếp</span>
          </button>
        </div>

        {activeTab === 'SUPPLIERS' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        )}
      </div>

      {/* STOCK LEVEL CALCULATIONS */}
      {(() => {
        // We use an IIFE to calculate stock statistics and filtered products
        const filteredStockProducts = products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase()) || 
                                p.code.toLowerCase().includes(stockSearch.toLowerCase());
          
          let matchesStatus = true;
          const minStockThreshold = parseInt(p.minStock) || 10;
          if (stockStatusFilter === 'OUT_OF_STOCK') {
            matchesStatus = p.stock === 0;
          } else if (stockStatusFilter === 'LOW_STOCK') {
            matchesStatus = p.stock > 0 && p.stock <= minStockThreshold;
          } else if (stockStatusFilter === 'NORMAL_STOCK') {
            matchesStatus = p.stock > minStockThreshold;
          }

          let matchesCategory = true;
          if (stockCategoryFilter !== 'ALL') {
            matchesCategory = p.categoryId === stockCategoryFilter;
          }

          return matchesSearch && matchesStatus && matchesCategory;
        });

        const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.stock * p.importPrice), 0);
        const outOfStockCount = products.filter(p => p.stock === 0).length;
        const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (parseInt(p.minStock) || 10)).length;

        return activeTab === 'STOCK_LEVELS' && (
          <div className="space-y-6" id="stock-levels-tab-content">
            {/* Stock KPI Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng chủng loại</span>
                  <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{products.length} sản phẩm</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Có trong danh mục bán hàng</p>
                </div>
                <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                  <Boxes className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng SL hàng tồn kho</span>
                  <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">{new Intl.NumberFormat('vi-VN').format(totalItems)}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Đơn vị sản phẩm lưu giữ</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng giá trị tồn kho</span>
                  <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight text-sky-600">{new Intl.NumberFormat('vi-VN').format(totalValue)}đ</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Tính theo giá nhập hàng (vốn)</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cảnh báo tồn kho</span>
                  <h3 className="text-xl font-black text-rose-600 font-mono tracking-tight">{outOfStockCount + lowStockCount} mặt hàng</h3>
                  <p className="text-[10px] text-slate-400 font-semibold text-rose-500">
                    {outOfStockCount} hết hàng | {lowStockCount} sắp hết
                  </p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm hoặc mã vạch..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/15 focus:bg-white transition"
                />
              </div>

              {/* Select filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto text-xs">
                {/* Category Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 w-full sm:w-48">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={stockCategoryFilter}
                    onChange={(e) => setStockCategoryFilter(e.target.value)}
                    className="w-full bg-transparent focus:outline-none border-0 text-slate-700 font-semibold p-0 cursor-pointer"
                  >
                    <option value="ALL">Tất cả ngành hàng</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 w-full sm:w-44">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value as any)}
                    className="w-full bg-transparent focus:outline-none border-0 text-slate-700 font-semibold p-0 cursor-pointer"
                  >
                    <option value="ALL">Mọi trạng thái tồn</option>
                    <option value="OUT_OF_STOCK">⚠️ Đã hết hàng (0)</option>
                    <option value="LOW_STOCK">⚠️ Sắp hết hàng (Yếu kho)</option>
                    <option value="NORMAL_STOCK">✅ Tồn kho dồi dào</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clear stock levels table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50">
                      <th className="py-3 px-5">Mã Vạch</th>
                      <th className="py-3 px-5">Tên Sản Phẩm</th>
                      <th className="py-3 px-5">Ngành Hàng</th>
                      <th className="py-3 px-5 text-center">Số Lượng Tồn</th>
                      <th className="py-3 px-5 text-center">ĐVT</th>
                      <th className="py-3 px-5 text-right">Giá Vốn (Nhập)</th>
                      <th className="py-3 px-5 text-right">Tổng Giá Trị Tồn</th>
                      <th className="py-3 px-5 text-center">Cảnh Báo Tối Thiểu</th>
                      <th className="py-3 px-5 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                    {filteredStockProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-slate-400 font-bold italic">
                          Không tìm thấy mặt hàng nào phù hợp với bộ lọc tìm kiếm!
                        </td>
                      </tr>
                    ) : (
                      filteredStockProducts.map((p) => {
                        const minStockVal = parseInt(p.minStock) || 10;
                        const isOutOfStock = p.stock === 0;
                        const isLowStock = p.stock > 0 && p.stock <= minStockVal;
                        const categoryName = categories.find(c => c.id === p.categoryId)?.name || 'Chưa phân loại';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-5 font-mono text-slate-400 text-[10px] font-bold">{p.code}</td>
                            <td className="py-3.5 px-5 font-bold text-slate-800">{p.name}</td>
                            <td className="py-3.5 px-5 text-slate-500 text-[11px] font-semibold">{categoryName}</td>
                            <td className="py-3.5 px-5 text-center">
                              <span className={`text-sm font-black font-mono px-2.5 py-1 rounded-lg ${
                                isOutOfStock ? 'bg-rose-50 text-rose-600' :
                                isLowStock ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-center text-slate-400 text-[11px]">{p.unit}</td>
                            <td className="py-3.5 px-5 text-right font-mono text-slate-500">{new Intl.NumberFormat('vi-VN').format(p.importPrice)}đ</td>
                            <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">{new Intl.NumberFormat('vi-VN').format(p.stock * p.importPrice)}đ</td>
                            <td className="py-3.5 px-5 text-center font-mono text-slate-400">{minStockVal} {p.unit}</td>
                            <td className="py-3.5 px-5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                isOutOfStock ? 'bg-rose-100 text-rose-700' :
                                isLowStock ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isOutOfStock ? '⚠️ Đã Hết Hàng' :
                                 isLowStock ? '⚠️ Sắp Hết Hàng' :
                                 '✅ An Toàn'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RENDER TAB: SUPPLIERS DIRECTORY */}
      {activeTab === 'SUPPLIERS' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-5">Tên đối tác nhà cung cấp</th>
                  <th className="py-3 px-5">SĐT liên hệ</th>
                  <th className="py-3 px-5">Email chính</th>
                  <th className="py-3 px-5">Địa chỉ trụ sở kho</th>
                  <th className="py-3 px-5 text-right">Dư nợ phải trả họ</th>
                  <th className="py-3 px-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-5 font-bold text-slate-800">{sup.name}</td>
                    <td className="py-3 px-5 font-medium text-slate-600">{sup.phone}</td>
                    <td className="py-3 px-5 text-slate-500">{sup.email || 'N/A'}</td>
                    <td className="py-3 px-5 text-slate-400 max-w-xs truncate">{sup.address}</td>
                    <td className="py-3 px-5 text-right font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(sup.debtToSupplier)}đ</td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {sup.debtToSupplier > 0 ? (
                          <button
                            onClick={() => { setSelectedSupplier(sup); setPayAmount(sup.debtToSupplier); setShowPayModal(true); }}
                            className="px-2.5 py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-bold transition cursor-pointer"
                          >
                            Trả tiền nợ
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Không nợ</span>
                        )}
                        <button
                          onClick={() => {
                            const hasDebt = sup.debtToSupplier > 0;
                            const warningMsg = hasDebt 
                              ? `CẢNH BÁO: Nhà cung cấp '${sup.name}' vẫn đang có dư nợ ${new Intl.NumberFormat('vi-VN').format(sup.debtToSupplier)}đ chưa thanh toán! Bạn vẫn chắc chắn muốn xóa chứ?`
                              : `Bạn có chắc chắn muốn xóa nhà cung cấp '${sup.name}' khỏi danh sách?`;
                            if (onShowConfirm) {
                              onShowConfirm(warningMsg, () => onDeleteSupplier(sup.id));
                            } else if (window.confirm(warningMsg)) {
                              onDeleteSupplier(sup.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Xóa nhà cung cấp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB: PURCHASE HISTORY */}
      {activeTab === 'IMPORT_HISTORY' && (
        <div className="space-y-4">
          {purchaseOrders.map((po) => (
            <div key={po.id} className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
                <div>
                  <span className="text-xs text-slate-400 font-mono">Mã nhập kho: <strong className="text-slate-800">{po.code}</strong></span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Nhà cung cấp: {po.supplierName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{po.createdAt}</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] mt-1 ${
                    po.paymentMethod === 'DEBT' 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {po.paymentMethod === 'CASH' && 'Đã chi tiền mặt'}
                    {po.paymentMethod === 'BANK_TRANSFER' && 'Đã chuyển khoản'}
                    {po.paymentMethod === 'DEBT' && 'Ghi nợ NCC'}
                  </span>
                </div>
              </div>

              {/* Items List details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {po.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-slate-700">{item.productName}</h5>
                      <span className="text-slate-400 text-[10px] block mt-0.5">Giá nhập: {new Intl.NumberFormat('vi-VN').format(item.importPrice)}đ</span>
                    </div>
                    <span className="px-2 py-1 bg-white border rounded font-extrabold text-slate-800 shrink-0">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    const confirmMsg = `Bạn có chắc chắn muốn XÓA phiếu nhập kho '${po.code}' không? Thao tác này sẽ GIẢM số lượng tồn kho của các sản phẩm tương ứng và thu hồi công nợ liên quan!`;
                    if (onShowConfirm) {
                      onShowConfirm(confirmMsg, () => onDeletePurchaseOrder(po.id));
                    } else if (window.confirm(confirmMsg)) {
                      onDeletePurchaseOrder(po.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                  title="Xóa phiếu nhập hàng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa phiếu nhập</span>
                </button>
                <span className="text-xs font-semibold text-slate-500">Tổng giá trị phiếu nhập: <span className="font-extrabold text-slate-900 text-base">{new Intl.NumberFormat('vi-VN').format(po.totalAmount)}đ</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RENDER TAB: INTERACTIVE WIZARD IMPORT */}
      {activeTab === 'CREATE_IMPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pick Products & Qty */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
            <h4 className="font-bold text-slate-800 text-base">Thêm hàng hoá vào phiếu nhập</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-1">
                <label className="block text-slate-500 font-semibold mb-1">Chọn sản phẩm cần nhập</label>
                <select
                  value={selectedImportProduct}
                  onChange={(e) => {
                    setSelectedImportProduct(e.target.value);
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) {
                      setTempPrice(prod.importPrice);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-700"
                >
                  <option value="">-- Chọn mặt hàng --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Số lượng nhập</label>
                <input
                  type="number"
                  value={tempQty}
                  onChange={(e) => setTempQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Giá nhập mỗi đơn vị (VNĐ)</label>
                <input
                  type="number"
                  step="any"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-800 font-bold text-sky-600"
                />
              </div>
            </div>

            <button
              onClick={addProductToImportCart}
              disabled={!selectedImportProduct}
              className={`w-full py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition ${
                !selectedImportProduct
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Thêm vào danh sách nhập</span>
            </button>

            {/* Selected Import cart */}
            <div className="border-t border-slate-100 pt-4">
              <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Sản phẩm trong phiếu chờ ({importCart.length})</h5>
              {importCart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-150 rounded-xl">
                  Phiếu nhập chưa có sản phẩm nào được thiết lập.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {importCart.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                      <div className="min-w-0">
                        <h6 className="font-bold text-slate-800 truncate">{item.product.name}</h6>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Giá vốn nhập: {new Intl.NumberFormat('vi-VN').format(item.importPrice)}đ</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-slate-700">SL: {item.quantity} {item.product.unit}</span>
                        <span className="font-bold text-sky-600">{new Intl.NumberFormat('vi-VN').format(item.importPrice * item.quantity)}đ</span>
                        <button
                          onClick={() => handleRemoveImportItem(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Supplier select & Checkout Import PO */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-base">Tổng hợp hoá đơn nhập</h4>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nhà cung cấp đối tác</label>
                <select
                  value={selectedImportSupplier?.id || ''}
                  onChange={(e) => {
                    const match = suppliers.find(s => s.id === e.target.value);
                    if (match) setSelectedImportSupplier(match);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-700 font-semibold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Giá trị nhập kho:</span>
                  <span className="font-extrabold text-slate-800">{new Intl.NumberFormat('vi-VN').format(importTotal)}đ</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-800">
                  <span>Cần chi thực tế:</span>
                  <span className="text-sky-600 text-base">{new Intl.NumberFormat('vi-VN').format(importTotal)}đ</span>
                </div>
              </div>

              {/* Import Payment Type */}
              <div className="space-y-1.5">
                <span className="text-slate-500 font-semibold">Phương thức chi trả:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setImportPaymentMethod('CASH')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                      importPaymentMethod === 'CASH'
                        ? 'border-sky-500 bg-sky-50 text-sky-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Tiền mặt
                  </button>
                  <button
                    onClick={() => setImportPaymentMethod('BANK_TRANSFER')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                      importPaymentMethod === 'BANK_TRANSFER'
                        ? 'border-sky-500 bg-sky-50 text-sky-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Chuyển khoản
                  </button>
                  <button
                    onClick={() => setImportPaymentMethod('DEBT')}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                      importPaymentMethod === 'DEBT'
                        ? 'border-sky-500 bg-sky-50 text-sky-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Ghi nợ NCC
                  </button>
                </div>
              </div>

              <button
                onClick={handleImportSubmit}
                disabled={importCart.length === 0}
                className={`w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg transition ${
                  importCart.length === 0
                    ? 'bg-slate-300 shadow-none cursor-not-allowed'
                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/10'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>HOÀN THÀNH PHIẾU NHẬP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
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
                <span className="font-bold text-slate-800">Thêm Nhà Cung Cấp Mới</span>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddSupplierSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tên nhà cung cấp *</label>
                  <input
                    type="text"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    required
                    placeholder="vd: Tổng kho Unilever Việt Nam"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Số điện thoại liên hệ *</label>
                  <input
                    type="text"
                    value={sPhone}
                    onChange={(e) => setSPhone(e.target.value)}
                    required
                    placeholder="Nhập SĐT..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email chính</label>
                  <input
                    type="email"
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    placeholder="partner@company.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Địa chỉ trụ sở kho</label>
                  <input
                    type="text"
                    value={sAddress}
                    onChange={(e) => setSAddress(e.target.value)}
                    placeholder="Nhập địa chỉ nhận xuất hàng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/10 text-xs"
                >
                  Lưu Nhà Cung Cấp
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PAY SUPPLIER DEBT */}
      <AnimatePresence>
        {showPayModal && selectedSupplier && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Trả tiền nợ Nhà Cung Cấp</span>
                <button onClick={() => setShowPayModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handlePaySupplierSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nhà cung cấp đối tác</label>
                  <input
                    type="text"
                    value={selectedSupplier.name}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Dư nợ hiện hành (đ)</label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('vi-VN').format(selectedSupplier.debtToSupplier) + ' VNĐ'}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-rose-600 font-extrabold focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Số tiền chi nộp trả (đ) *</label>
                  <input
                    type="number"
                    value={payAmount === 0 ? '' : payAmount}
                    onChange={(e) => setPayAmount(Math.min(selectedSupplier.debtToSupplier, Math.max(1, parseInt(e.target.value) || 0)))}
                    required
                    placeholder="Nhập số tiền..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-extrabold text-emerald-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/10 text-xs"
                >
                  Xác nhận chi trả
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

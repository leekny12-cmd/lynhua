import React, { useState } from 'react';
import { Product, Category } from '../types';
import { 
  Plus, Edit2, FolderPlus, Tag, Package, Barcode, Save, Check, X, 
  AlertCircle, Search, AlertTriangle, Trash2, TrendingUp, BarChart3, 
  Layers, ChevronDown, ChevronUp, Boxes, Activity, Eye, Info, Copy
} from 'lucide-react';
import { motion } from 'motion/react';

interface DirectoryViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onAddCategory: (name: string, description: string) => void;
  onUpdateCategory: (id: string, name: string, description: string) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function DirectoryView({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteProduct,
  onDeleteCategory,
  onShowConfirm,
  onShowAlert
}: DirectoryViewProps) {
  // Navigation tabs inside directory
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Product Add/Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Form Fields
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pCategoryId, setPCategoryId] = useState('');
  const [pImportPrice, setPImportPrice] = useState<number>(0);
  const [pPrice, setPPrice] = useState<number>(0);
  const [pWholesalePrice, setPWholesalePrice] = useState<number>(0);
  const [pStock, setPStock] = useState<number>(0);
  const [pMinStock, setPMinStock] = useState<string>('10');
  const [pUnit, setPUnit] = useState('Gói');
  const [pImage, setPImage] = useState('');

  // Category Form Fields
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');

  const generateBarcode = () => {
    // Standard Vietnamese GS1 Prefix 893 + random numbers
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    setPCode(`893${randomSuffix}`);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pCode || !pName || !pCategoryId || pPrice <= 0) {
      if (onShowAlert) {
        onShowAlert('Vui lòng điền đầy đủ Mã vạch, Tên hàng hoá, Danh mục và Giá bán lẻ!', 'error');
      } else {
        alert('Vui lòng điền đầy đủ Mã vạch, Tên hàng hoá, Danh mục và Giá bán lẻ!');
      }
      return;
    }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        code: pCode,
        name: pName,
        categoryId: pCategoryId,
        importPrice: pImportPrice,
        price: pPrice,
        wholesalePrice: pWholesalePrice || pPrice,
        stock: pStock,
        minStock: pMinStock,
        unit: pUnit,
        image: pImage
      };
      onUpdateProduct(updated);
      setEditingProduct(null);
    } else {
      onAddProduct({
        code: pCode,
        name: pName,
        categoryId: pCategoryId,
        importPrice: pImportPrice,
        price: pPrice,
        wholesalePrice: pWholesalePrice || pPrice,
        stock: pStock,
        minStock: pMinStock,
        unit: pUnit,
        image: pImage,
        active: true
      });
      setIsAddingProduct(false);
    }

    // Reset Form
    resetProductForm();
  };

  const resetProductForm = () => {
    setPCode('');
    setPName('');
    setPCategoryId('');
    setPImportPrice(0);
    setPPrice(0);
    setPWholesalePrice(0);
    setPStock(0);
    setPMinStock('10');
    setPUnit('Gói');
    setPImage('');
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setPCode(p.code);
    setPName(p.name);
    setPCategoryId(p.categoryId);
    setPImportPrice(p.importPrice);
    setPPrice(p.price);
    setPWholesalePrice(p.wholesalePrice || p.price);
    setPStock(p.stock);
    setPMinStock(p.minStock);
    setPUnit(p.unit);
    setPImage(p.image || '');
    setIsAddingProduct(false);
  };

  const startCloneProduct = (p: Product) => {
    // Generate a unique new barcode using GS1 prefix or suffix based on original barcode
    let newCode = '';
    if (p.code && p.code.length > 4) {
      // Keep most of the original, replace/append some random digits
      const randVal = Math.floor(1000 + Math.random() * 9000);
      newCode = `${p.code.substring(0, p.code.length - 4)}${randVal}`;
    } else {
      const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
      newCode = `893${randomSuffix}`;
    }

    setPCode(newCode);
    setPName(`${p.name} (Sao chép)`);
    setPCategoryId(p.categoryId);
    setPImportPrice(p.importPrice);
    setPPrice(p.price);
    setPWholesalePrice(p.wholesalePrice || p.price);
    setPStock(p.stock);
    setPMinStock(p.minStock);
    setPUnit(p.unit);
    setPImage(p.image || '');
    setEditingProduct(null);
    setIsAddingProduct(true);

    if (onShowAlert) {
      onShowAlert(`Đã sao chép nhanh sản phẩm '${p.name}'. Hãy chỉnh sửa các trường cần thiết (ví dụ: mã vạch) rồi bấm Lưu!`, 'success');
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) {
      if (onShowAlert) {
        onShowAlert('Tên danh mục hàng hoá không được để trống!', 'error');
      } else {
        alert('Tên danh mục hàng hoá không được để trống!');
      }
      return;
    }
    if (editingCategory) {
      onUpdateCategory(editingCategory.id, cName, cDesc);
      setEditingCategory(null);
    } else {
      onAddCategory(cName, cDesc);
    }
    setCName('');
    setCDesc('');
    setIsAddingCategory(false);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCName(cat.name);
    setCDesc(cat.description || '');
    setIsAddingCategory(false);
    setActiveTab('CATEGORIES');
  };

  // Filter products based on search term, low stock and selected category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const isLowStock = p.stock <= parseInt(p.minStock);
    const matchesLowStock = !filterLowStock || isLowStock;
    const matchesCategory = selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesLowStock && matchesCategory;
  });

  const lowStockProductsCount = products.filter(p => p.stock <= parseInt(p.minStock)).length;

  // Product stats calculation
  const totalUniqueProducts = products.length;
  const totalStockQuantity = products.reduce((acc, p) => acc + p.stock, 0);
  const totalStockValuation = products.reduce((acc, p) => acc + (p.stock * p.importPrice), 0);

  return (
    <div className="space-y-6">
      {/* Directory Tab Selection Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setActiveTab('PRODUCTS'); setEditingProduct(null); setIsAddingProduct(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'PRODUCTS'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Kho Hàng Hoá ({products.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('CATEGORIES'); setIsAddingCategory(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'CATEGORIES'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Nhóm Danh Mục ({categories.length})</span>
          </button>
        </div>

        {activeTab === 'PRODUCTS' && !isAddingProduct && !editingProduct && (
          <button
            onClick={() => { resetProductForm(); setIsAddingProduct(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Khai Báo Sản Phẩm Mới</span>
          </button>
        )}

        {activeTab === 'CATEGORIES' && !isAddingCategory && (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/10"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Thêm Danh Mục Mới</span>
          </button>
        )}
      </div>

      {/* RENDER PRODUCTS PANEL */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-6 w-full">
          {/* KPI Stats Row for Products */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Mã độc bản</p>
                <h4 className="text-xs font-black text-slate-800 truncate">{totalUniqueProducts} mặt hàng</h4>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Tổng tồn kho</p>
                <h4 className="text-xs font-black text-slate-800 truncate">{new Intl.NumberFormat('vi-VN').format(totalStockQuantity)} cái</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-xl shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Trị giá vốn</p>
                <h4 className="text-xs font-black text-slate-800 truncate">{new Intl.NumberFormat('vi-VN').format(totalStockValuation)}đ</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Cảnh báo tồn</p>
                <h4 className="text-xs font-black text-rose-600 truncate">{lowStockProductsCount} mặt hàng</h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main List Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* System stock limit warnings banner */}
              {lowStockProductsCount > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 rounded-xl text-rose-600 animate-pulse shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-rose-900">Cảnh Báo Tồn Kho Hệ Thống</h5>
                      <p className="text-xs text-rose-600 mt-0.5">
                        Có <span className="font-extrabold text-rose-800">{lowStockProductsCount}</span> mặt hàng đang có mức tồn kho thấp hơn định mức tối thiểu quy định.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFilterLowStock(!filterLowStock)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap self-stretch sm:self-auto text-center ${
                      filterLowStock 
                        ? 'bg-rose-700 hover:bg-rose-800 text-white'
                        : 'bg-white hover:bg-rose-100/50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {filterLowStock ? 'Hiện tất cả sản phẩm' : 'Lọc sản phẩm sắp hết'}
                  </button>
                </div>
              )}

              {/* Search and interactive filter controls */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã hàng hóa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-semibold"
                  />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/40 border border-slate-200/60 px-4 py-2 rounded-xl w-full sm:w-auto shrink-0 transition">
                  <input
                    type="checkbox"
                    checked={filterLowStock}
                    onChange={(e) => setFilterLowStock(e.target.checked)}
                    className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500/20 cursor-pointer accent-rose-600"
                  />
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Chỉ hiện sản phẩm dưới định mức tồn kho
                  </span>
                </label>
              </div>

              {/* Sliding Category Badges Filter */}
              <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-500" />
                  <span>Bộ lọc nhanh nhóm danh mục</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedCategoryFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategoryFilter === 'ALL'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    Tất cả ({products.length})
                  </button>
                  {categories.map(cat => {
                    const count = products.filter(p => p.categoryId === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          selectedCategoryFilter === cat.id
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-extrabold ${
                          selectedCategoryFilter === cat.id ? 'bg-sky-700 text-sky-100' : 'bg-slate-200 text-slate-500'
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                      <th className="py-3 px-4">Thông tin sản phẩm</th>
                      <th className="py-3 px-4">Nhóm danh mục</th>
                      <th className="py-3 px-4 text-right">Giá nhập</th>
                      <th className="py-3 px-4 text-right">Giá sỉ</th>
                      <th className="py-3 px-4 text-right">Giá lẻ</th>
                      <th className="py-3 px-4 text-center">Tồn kho</th>
                      <th className="py-3 px-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <span>Không tìm thấy mặt hàng nào khớp bộ lọc.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const catName = categories.find(c => c.id === p.categoryId)?.name || 'Chưa phân nhóm';
                        const isLowStock = p.stock <= parseInt(p.minStock);
                        const isOutOfStock = p.stock === 0;
                        const isExpanded = expandedProductId === p.id;
                        return (
                          <React.Fragment key={p.id}>
                            <tr 
                              className={`transition cursor-pointer ${
                                isExpanded 
                                  ? 'bg-sky-50/50 hover:bg-sky-50' 
                                  : isLowStock 
                                    ? 'bg-rose-50/40 hover:bg-rose-100/30' 
                                    : 'hover:bg-slate-50/50'
                              }`}
                              onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                            >
                              <td className="py-3 px-4 flex items-center gap-3">
                                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <img
                                    src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=200'}
                                    alt={p.name}
                                    className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0"
                                  />
                                  {isLowStock && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-white font-black text-[9px] border-2 border-white shadow animate-bounce">
                                      !
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className={`font-bold text-xs truncate ${isLowStock ? 'text-rose-900 font-extrabold' : 'text-slate-800'}`}>{p.name}</h5>
                                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block flex items-center gap-1">
                                    <Barcode className="w-3.5 h-3.5 text-sky-500 inline animate-pulse" />
                                    <span>{p.code}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold">{catName}</span>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-500">{new Intl.NumberFormat('vi-VN').format(p.importPrice)}đ</td>
                              <td className="py-3 px-4 text-right font-bold text-amber-600">{new Intl.NumberFormat('vi-VN').format(p.wholesalePrice || p.price)}đ</td>
                              <td className="py-3 px-4 text-right font-extrabold text-sky-600">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                                  isOutOfStock
                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                    : isLowStock 
                                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                  {isLowStock && <AlertCircle className="w-3.5 h-3.5 animate-bounce shrink-0" />}
                                  <span>{p.stock} {p.unit}</span>
                                </span>
                                {isLowStock && (
                                  <div className="text-[9px] text-rose-600 font-extrabold mt-1">
                                    {isOutOfStock ? 'Hết hàng!' : `Dưới tối thiểu (${p.minStock})`}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                                    className={`p-1.5 rounded-lg transition ${
                                      isExpanded 
                                        ? 'text-sky-600 bg-sky-50' 
                                        : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'
                                    }`}
                                    title="Xem chi tiết phân tích"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => startEditProduct(p)}
                                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                    title="Chỉnh sửa sản phẩm"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => startCloneProduct(p)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                    title="Sao chép nhanh sản phẩm"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const confirmMsg = `Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm '${p.name}' không?`;
                                      if (onShowConfirm) {
                                        onShowConfirm(confirmMsg, () => onDeleteProduct(p.id));
                                      } else if (window.confirm(confirmMsg)) {
                                        onDeleteProduct(p.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Xóa sản phẩm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr className="bg-slate-50/65">
                                <td colSpan={7} className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    {/* Financial analysis */}
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm space-y-2">
                                      <h6 className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
                                        <span>Hiệu Suất Sinh Lời</span>
                                      </h6>
                                      <div className="space-y-1.5 text-slate-600">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Giá nhập vốn:</span>
                                          <span className="font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(p.importPrice)}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Lợi nhuận gộp lẻ:</span>
                                          <span className="font-extrabold text-emerald-600">+{new Intl.NumberFormat('vi-VN').format(p.price - p.importPrice)}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Tỷ suất lợi nhuận lẻ:</span>
                                          <span className="font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px]">
                                            {p.price > 0 ? (((p.price - p.importPrice) / p.price) * 100).toFixed(1) : 0}%
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Lợi nhuận sỉ:</span>
                                          <span className="font-extrabold text-amber-600">+{new Intl.NumberFormat('vi-VN').format((p.wholesalePrice || p.price) - p.importPrice)}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Tỷ suất lợi nhuận sỉ:</span>
                                          <span className="font-extrabold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px]">
                                            {(p.wholesalePrice || p.price) > 0 ? ((((p.wholesalePrice || p.price) - p.importPrice) / (p.wholesalePrice || p.price)) * 100).toFixed(1) : 0}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Stock analysis */}
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm space-y-2">
                                      <h6 className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <Activity className="w-4 h-4 text-sky-500 animate-pulse" />
                                        <span>Định Lượng &amp; Giá Trị Tồn</span>
                                      </h6>
                                      <div className="space-y-1.5 text-slate-600">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Giá trị tổng tài sản vốn:</span>
                                          <span className="font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(p.stock * p.importPrice)}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Doanh số lẻ dự tính:</span>
                                          <span className="font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(p.stock * p.price)}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">LN dự tính tối đa:</span>
                                          <span className="font-extrabold text-emerald-600">+{new Intl.NumberFormat('vi-VN').format(p.stock * (p.price - p.importPrice))}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-400">Định mức tối thiểu:</span>
                                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px]">{p.minStock} {p.unit}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Barcode representation */}
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                                      <div>
                                        <h6 className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                          <Barcode className="w-4 h-4 text-slate-500" />
                                          <span>Mã Vạch Cửa Hàng (POS)</span>
                                        </h6>
                                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Nhãn chuẩn dán bao bì sản phẩm phục vụ quét POS thanh toán cực nhanh:</p>
                                      </div>
                                      
                                      {/* Barcode visual generator lines */}
                                      <div className="my-1.5 flex flex-col items-center">
                                        <div className="flex items-end h-7 gap-[1.2px] bg-white px-3 py-1 border border-slate-150 rounded">
                                          {Array.from({ length: 30 }).map((_, idx) => (
                                            <div 
                                              key={idx} 
                                              className="bg-slate-900" 
                                              style={{ 
                                                width: idx % 4 === 0 ? '2px' : idx % 6 === 0 ? '3px' : '1px',
                                                height: idx % 9 === 0 ? '70%' : '100%' 
                                              }} 
                                            />
                                          ))}
                                        </div>
                                        <span className="font-mono text-[9px] tracking-widest text-slate-600 mt-1">{p.code}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Form Input Columns (Floating/Static on Right) */}
          <div className="lg:col-span-1">
            {(isAddingProduct || editingProduct) ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <span className="font-bold text-slate-800">{editingProduct ? 'Cập Nhật Hàng Hoá' : 'Khai Báo Mặt Hàng'}</span>
                  <button 
                    onClick={() => { setEditingProduct(null); setIsAddingProduct(false); resetProductForm(); }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mã vạch / Barcode *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pCode}
                        onChange={(e) => setPCode(e.target.value)}
                        required
                        placeholder="Quét mã hoặc bấm tạo ngẫu nhiên..."
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={generateBarcode}
                        className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition font-bold"
                      >
                        Tự sinh
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Tên sản phẩm *</label>
                    <input
                      type="text"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      required
                      placeholder="vd: Cà phê sữa đá pha phin..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Danh mục nhóm *</label>
                      <select
                        value={pCategoryId}
                        onChange={(e) => setPCategoryId(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-medium"
                      >
                        <option value="">-- Chọn --</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Đơn vị tính *</label>
                      <input
                        type="text"
                        value={pUnit}
                        onChange={(e) => setPUnit(e.target.value)}
                        required
                        placeholder="Ly, Lon, Gói..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1 text-[10px]">Giá nhập *</label>
                      <input
                        type="number"
                        step="any"
                        value={pImportPrice === 0 ? '' : pImportPrice}
                        onChange={(e) => setPImportPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        required
                        placeholder="0đ"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1 text-[10px]">Giá sỉ *</label>
                      <input
                        type="number"
                        step="any"
                        value={pWholesalePrice === 0 ? '' : pWholesalePrice}
                        onChange={(e) => setPWholesalePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        required
                        placeholder="0đ"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-amber-600 font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1 text-[10px]">Giá lẻ *</label>
                      <input
                        type="number"
                        step="any"
                        value={pPrice === 0 ? '' : pPrice}
                        onChange={(e) => setPPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        required
                        placeholder="0đ"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sky-600 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Số lượng ban đầu</label>
                      <input
                        type="number"
                        value={pStock}
                        onChange={(e) => setPStock(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Cảnh báo tối thiểu</label>
                      <input
                        type="number"
                        value={pMinStock}
                        onChange={(e) => setPMinStock(e.target.value)}
                        placeholder="Mặc định: 10"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">URL Hình ảnh (unsplash/tùy chọn)</label>
                    <input
                      type="text"
                      value={pImage}
                      onChange={(e) => setPImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/15 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Hàng Hoá</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Bảng Chỉnh Sửa</p>
                <p className="mt-1">Chọn nút chỉnh sửa (<Edit2 className="w-3.5 h-3.5 inline mx-0.5" />) kế bên sản phẩm để cập nhật nhanh đơn giá, tồn kho hoặc mã vạch mặt hàng.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* RENDER CATEGORIES PANEL */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List Column */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                    <th className="py-3 px-5">Tên nhóm ngành danh mục</th>
                    <th className="py-3 px-5">Mô tả đặc điểm</th>
                    <th className="py-3 px-5 text-center">Số lượng hàng liên kết</th>
                    <th className="py-3 px-5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categories.map((cat) => {
                    const linkedProductsCount = products.filter(p => p.categoryId === cat.id).length;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-5 font-bold text-slate-800">{cat.name}</td>
                        <td className="py-3 px-5 text-slate-500 leading-relaxed max-w-sm">{cat.description || 'Chưa cung cấp mô tả đặc thù.'}</td>
                        <td className="py-3 px-5 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold">{linkedProductsCount} sản phẩm</span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => startEditCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              title="Chỉnh sửa danh mục"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const warningMsg = linkedProductsCount > 0 
                                  ? `CẢNH BÁO: Danh mục '${cat.name}' đang có ${linkedProductsCount} sản phẩm liên kết! Các sản phẩm này sẽ bị gỡ liên kết danh mục. Bạn vẫn muốn xóa chứ?`
                                  : `Bạn có chắc chắn muốn xóa danh mục '${cat.name}' không?`;
                                if (onShowConfirm) {
                                  onShowConfirm(warningMsg, () => onDeleteCategory(cat.id));
                                } else if (window.confirm(warningMsg)) {
                                  onDeleteCategory(cat.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Create Section */}
          <div className="lg:col-span-1">
            {(isAddingCategory || editingCategory) ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <span className="font-bold text-slate-800">{editingCategory ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}</span>
                  <button 
                    onClick={() => { setIsAddingCategory(false); setEditingCategory(null); setCName(''); setCDesc(''); }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Tên nhóm danh mục *</label>
                    <input
                      type="text"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      required
                      placeholder="vd: Hóa mỹ phẩm, Gia vị..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mô tả đặc điểm</label>
                    <textarea
                      value={cDesc}
                      onChange={(e) => setCDesc(e.target.value)}
                      rows={3}
                      placeholder="Nhập ghi chú hoặc mô tả phân loại ngắn..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/15 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingCategory ? 'Cập Nhật Danh Mục' : 'Tạo Danh Mục'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
                <FolderPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Khởi Tạo Nhóm Ngành</p>
                <p className="mt-1">Nhấp vào nút <span className="font-bold text-sky-600">Thêm Danh Mục Mới</span> ở thanh công cụ phía trên để thiết lập thêm nhóm ngành mới cho cửa hàng.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

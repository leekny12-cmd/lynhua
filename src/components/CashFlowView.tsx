import React, { useState, useMemo } from 'react';
import { CashTransaction, User } from '../types';
import {
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Trash2,
  Calendar,
  Filter,
  Search,
  Wallet,
  PieChart as PieIcon,
  BarChart3,
  FileText,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

interface CashFlowViewProps {
  transactions: CashTransaction[];
  currentUser: User;
  onAddTransaction: (tx: Omit<CashTransaction, 'id' | 'code' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
  onShowConfirm: (message: string, onConfirmAction: () => void) => void;
  onShowAlert: (message: string, type: 'success' | 'warning' | 'error') => void;
}

export default function CashFlowView({
  transactions,
  currentUser,
  onAddTransaction,
  onDeleteTransaction,
  onShowConfirm,
  onShowAlert
}: CashFlowViewProps) {
  // Tabs: 'ledger' (Sổ Quỹ) | 'reports' (Báo Cáo Thu Chi)
  const [activeTab, setActiveTab] = useState<'ledger' | 'reports'>('ledger');

  // Search & Filter state for Ledger
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'CASH' | 'BANK_TRANSFER'>('ALL');

  // Report Period Selection: 'TIMELINE' (Khoảng thời gian) | 'MONTH' (Tháng) | 'YEAR' (Năm)
  const [reportPeriodType, setReportPeriodType] = useState<'TIMELINE' | 'MONTH' | 'YEAR'>('MONTH');
  
  // Timeline states
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Selected Month/Year for Report
  const currentYearVal = new Date().getFullYear();
  const currentMonthVal = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const [selectedMonth, setSelectedMonth] = useState(`${currentYearVal}-${currentMonthVal}`); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(String(currentYearVal)); // YYYY

  // Form states for creating transaction
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPartner, setFormPartner] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [formNote, setFormNote] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));

  // Category Options
  const INCOME_CATEGORIES = ['Doanh thu bán hàng', 'Thu nợ khách hàng', 'Thanh lý tài sản', 'Khác'];
  const EXPENSE_CATEGORIES = ['Nhập hàng hóa', 'Chi phí mặt bằng', 'Lương nhân viên', 'Tiền điện nước', 'Marketing / Quảng cáo', 'Chi phí tiếp khách', 'Khác'];

  // Currency helper
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  };

  // Auto-set category when changing type in form
  const handleFormTypeChange = (type: 'INCOME' | 'EXPENSE') => {
    setFormType(type);
    setFormCategory(type === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  // Open modal helper
  const handleOpenForm = (type: 'INCOME' | 'EXPENSE') => {
    setFormType(type);
    setFormAmount('');
    setFormCategory(type === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setFormPartner('');
    setFormPaymentMethod('BANK_TRANSFER');
    setFormNote('');
    setFormDate(new Date().toISOString().substring(0, 10));
    setShowFormModal(true);
  };

  // Submit new transaction
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount.replace(/\D/g, ''));
    if (!amountNum || amountNum <= 0) {
      onShowAlert('Số tiền không hợp lệ, vui lòng nhập lại!', 'warning');
      return;
    }
    if (!formCategory) {
      onShowAlert('Vui lòng chọn phân loại giao dịch!', 'warning');
      return;
    }
    if (!formNote.trim()) {
      onShowAlert('Vui lòng nhập ghi chú nội dung!', 'warning');
      return;
    }

    onAddTransaction({
      type: formType,
      amount: amountNum,
      category: formCategory,
      partnerName: formPartner.trim() || 'Vãng lai',
      paymentMethod: formPaymentMethod,
      note: formNote.trim(),
      date: formDate
    });

    onShowAlert(`Đã lập phiếu ${formType === 'INCOME' ? 'Thu' : 'Chi'} thành công!`, 'success');
    setShowFormModal(false);
  };

  // Filtering ledger transactions
  const filteredLedgerTransactions = useMemo(() => {
    return transactions.filter(t => {
      // search
      const matchesSearch = 
        t.code.toLowerCase().includes(searchText.toLowerCase()) ||
        t.note.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.partnerName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        t.category.toLowerCase().includes(searchText.toLowerCase());
      
      // type
      const matchesType = filterType === 'ALL' || t.type === filterType;

      // category
      const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;

      // payment
      const matchesPayment = filterPayment === 'ALL' || t.paymentMethod === filterPayment;

      return matchesSearch && matchesType && matchesCategory && matchesPayment;
    });
  }, [transactions, searchText, filterType, filterCategory, filterPayment]);

  // General Filtered Transactions for Reports based on selection period (TIME, MONTH, YEAR)
  const reportTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [y, m, d] = t.date.split('-').map(Number);
      const txDate = new Date(y, m - 1, d);
      
      if (reportPeriodType === 'TIMELINE') {
        let matches = true;
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0,0,0,0);
          matches = matches && txDate >= start;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23,59,59,999);
          matches = matches && txDate <= end;
        }
        return matches;
      } 
      
      if (reportPeriodType === 'MONTH') {
        // format is YYYY-MM (e.g. 2026-07)
        const [year, month] = selectedMonth.split('-');
        const txYear = String(y);
        const txMonth = String(m).padStart(2, '0');
        return txYear === year && txMonth === month;
      }
      
      if (reportPeriodType === 'YEAR') {
        // format is YYYY (e.g. 2026)
        return String(y) === selectedYear;
      }

      return true;
    });
  }, [transactions, reportPeriodType, customStartDate, customEndDate, selectedMonth, selectedYear]);

  // Report KPIs
  const reportKPIs = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cashCount = 0;
    let bankCount = 0;

    reportTransactions.forEach(t => {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
      }

      if (t.paymentMethod === 'CASH') {
        cashCount += t.type === 'INCOME' ? t.amount : -t.amount;
      } else {
        bankCount += t.type === 'INCOME' ? t.amount : -t.amount;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      surplus: income - expense,
      cashBalance: cashCount,
      bankBalance: bankCount
    };
  }, [reportTransactions]);

  // Report Charts data: Grouped by Timeline Units
  const timelineChartData = useMemo(() => {
    const grouped: Record<string, { label: string; income: number; expense: number }> = {};

    if (reportPeriodType === 'TIMELINE') {
      // Group by specific Date
      reportTransactions.forEach(t => {
        const key = t.date;
        if (!grouped[key]) {
          // Format label as DD/MM
          const parts = t.date.split('-');
          const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.date;
          grouped[key] = { label, income: 0, expense: 0 };
        }
        if (t.type === 'INCOME') grouped[key].income += t.amount;
        else grouped[key].expense += t.amount;
      });
    } else if (reportPeriodType === 'MONTH') {
      // Group by Date in Month
      reportTransactions.forEach(t => {
        const key = t.date;
        if (!grouped[key]) {
          const parts = t.date.split('-');
          const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.date;
          grouped[key] = { label, income: 0, expense: 0 };
        }
        if (t.type === 'INCOME') grouped[key].income += t.amount;
        else grouped[key].expense += t.amount;
      });
    } else {
      // Group by Month in Year (1 to 12)
      for (let m = 1; m <= 12; m++) {
        const key = `Tháng ${m}`;
        grouped[key] = { label: key, income: 0, expense: 0 };
      }
      reportTransactions.forEach(t => {
        const [, m] = t.date.split('-').map(Number);
        const key = `Tháng ${m}`;
        if (grouped[key]) {
          if (t.type === 'INCOME') grouped[key].income += t.amount;
          else grouped[key].expense += t.amount;
        }
      });
    }

    // Convert object to sorted array
    return Object.entries(grouped)
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [reportTransactions, reportPeriodType]);

  // Pie chart categories distribution
  const incomePieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    reportTransactions.filter(t => t.type === 'INCOME').forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [reportTransactions]);

  const expensePieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    reportTransactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [reportTransactions]);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const handleDeleteClick = (id: string, code: string) => {
    onShowConfirm(`Bạn có chắc chắn muốn xóa chứng từ thu chi "${code}"? Dữ liệu tồn quỹ sẽ được tính toán lại tương ứng.`, () => {
      onDeleteTransaction(id);
      onShowAlert('Đã xóa chứng từ thu chi thành công.', 'success');
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-600">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">SỔ QUỸ &amp; THU CHI</h2>
            <p className="text-xs text-slate-400 font-semibold">
              Quản lý chi tiết dòng tiền mặt/chuyển khoản, chi phí vận hành và báo cáo lãi lỗ theo thời gian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenForm('INCOME')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Thu</span>
          </button>
          <button
            onClick={() => handleOpenForm('EXPENSE')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Chi</span>
          </button>
        </div>
      </div>

      {/* QUICK VIEW CASH BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng thu kỳ này</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono block leading-none mt-1">
              {formatVND(reportKPIs.totalIncome)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng chi kỳ này</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono block leading-none mt-1">
              {formatVND(reportKPIs.totalExpense)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dòng tiền thặng dư (Lãi dòng)</span>
            <span className={`text-xl font-extrabold font-mono block leading-none mt-1 ${
              reportKPIs.surplus >= 0 ? 'text-sky-600' : 'text-rose-600'
            }`}>
              {reportKPIs.surplus >= 0 ? '+' : ''}{formatVND(reportKPIs.surplus)}
            </span>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-sky-500 text-sky-600 bg-sky-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sổ Quỹ Thu Chi</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-sky-500 text-sky-600 bg-sky-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Báo Cáo Phân Tích Dòng Tiền</span>
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* LEDGER FILTER BAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search input */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mã phiếu, nội dung, đối tác..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/15"
                />
              </div>

              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none"
              >
                <option value="ALL">Tất cả Loại</option>
                <option value="INCOME">Chỉ Thu (Income)</option>
                <option value="EXPENSE">Chỉ Chi (Expense)</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none"
              >
                <option value="ALL">Tất cả Danh mục</option>
                {[...new Set(transactions.map(t => t.category))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Payment method Filter */}
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none"
              >
                <option value="ALL">Tất cả HTTT</option>
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-bold shrink-0">
              Tìm thấy <span className="text-slate-800">{filteredLedgerTransactions.length}</span> chứng từ
            </div>
          </div>

          {/* LEDGER LIST TABLE */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-28">Mã Phiếu</th>
                    <th className="py-3.5 px-4 w-32">Ngày lập</th>
                    <th className="py-3.5 px-4 w-28">Phân loại</th>
                    <th className="py-3.5 px-4 w-44">Hạng mục</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Nội dung / Ghi chú</th>
                    <th className="py-3.5 px-4 w-44 text-right">Giá trị giao dịch</th>
                    <th className="py-3.5 px-4 w-16 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLedgerTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                          <HelpCircle className="w-8 h-8 text-slate-300" />
                          <span className="text-xs font-semibold">Không tìm thấy phiếu thu chi nào phù hợp!</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLedgerTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-extrabold text-slate-800">
                            {t.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-500">
                          {t.createdAt.substring(0, 16)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            t.type === 'INCOME'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {t.type === 'INCOME' ? 'Thu' : 'Chi'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-bold text-slate-700">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-semibold text-slate-800">{t.note}</div>
                          {t.partnerName && (
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                              <span className="font-bold">Đối tác:</span> {t.partnerName}
                              <span className="text-slate-200">|</span>
                              <span className="font-bold">HTTT:</span> {t.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-mono text-sm font-extrabold ${
                            t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {t.type === 'INCOME' ? '+' : '-'}{formatVND(t.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteClick(t.id, t.code)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Xóa chứng từ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          
          {/* TIMELINE FILTERS BLOCK */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">CẤU HÌNH THỜI GIAN BÁO CÁO</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Lựa chọn chế độ gom nhóm báo cáo theo thời gian để so sánh biến động dòng tiền.</p>
              </div>

              {/* Time Group Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setReportPeriodType('TIMELINE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    reportPeriodType === 'TIMELINE'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Khoảng Thời Gian
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriodType('MONTH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    reportPeriodType === 'MONTH'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Theo Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriodType('YEAR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    reportPeriodType === 'YEAR'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Theo Năm
                </button>
              </div>
            </div>

            {/* Time Controls Input Form */}
            <div className="flex flex-wrap gap-4 items-center">
              {reportPeriodType === 'TIMELINE' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Từ ngày:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500/15"
                  />
                  <span className="text-xs text-slate-500 font-bold">Đến ngày:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500/15"
                  />
                </div>
              )}

              {reportPeriodType === 'MONTH' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Chọn tháng:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              )}

              {reportPeriodType === 'YEAR' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Chọn năm báo cáo:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="2024">Năm 2024</option>
                    <option value="2025">Năm 2025</option>
                    <option value="2026">Năm 2026</option>
                    <option value="2027">Năm 2027</option>
                  </select>
                </div>
              )}

              <div className="text-xs text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Đã nạp {reportTransactions.length} giao dịch trong kỳ tuyển chọn</span>
              </div>
            </div>
          </div>

          {/* MAIN CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Bar Chart showing Income vs Expense timeline */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-500" />
                  <span>Sự biến thiên Thu &amp; Chi thực tế</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Đơn vị tính: VNĐ (đ)</span>
              </div>

              <div className="h-[320px] w-full">
                {timelineChartData.length === 0 || (reportPeriodType !== 'YEAR' && reportTransactions.length === 0) ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Không có dữ liệu thu chi cho khoảng thời gian này
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timelineChartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatVND(value), '']}
                        contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar name="Tổng thu" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar name="Tổng chi" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Column 3: Stats Details List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  <span>Chi tiết quỹ quỹ</span>
                </h3>
                
                <div className="space-y-3.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Quỹ Tiền mặt (CASH)</span>
                      <span className="text-xs text-slate-500 font-semibold">Tồn ngân quỹ mặt tại quầy bán</span>
                    </div>
                    <span className={`text-sm font-mono font-extrabold ${reportKPIs.cashBalance >= 0 ? 'text-slate-850' : 'text-rose-600'}`}>
                      {formatVND(reportKPIs.cashBalance)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chuyển khoản (BANK)</span>
                      <span className="text-xs text-slate-500 font-semibold">Tài khoản ngân hàng liên kết</span>
                    </div>
                    <span className={`text-sm font-mono font-extrabold ${reportKPIs.bankBalance >= 0 ? 'text-slate-850' : 'text-rose-600'}`}>
                      {formatVND(reportKPIs.bankBalance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 text-xs text-sky-700 font-medium space-y-1.5 mt-4">
                <span className="font-extrabold uppercase block tracking-wider text-[10px] text-sky-800">Nhận xét dòng tiền:</span>
                {reportKPIs.surplus > 0 ? (
                  <p>Kỳ báo cáo có dòng tiền Dương. Doanh nghiệp đang thặng dư dồi dào, có thể dùng quỹ tái đầu tư hàng hoá.</p>
                ) : reportKPIs.surplus < 0 ? (
                  <p className="text-rose-700">Cảnh báo: Thặng dư quỹ Âm. Các khoản chi lớn hơn thu, vui lòng tối ưu chi phí vận hành.</p>
                ) : (
                  <p>Quỹ tiền cân bằng hoàn hảo giữa thu và chi.</p>
                )}
              </div>
            </div>
          </div>

          {/* PIE CHARTS BREAKDOWNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income breakdown by category */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                <span>Cấu trúc nguồn Thu</span>
              </h3>

              <div className="h-[220px] flex items-center justify-center relative">
                {incomePieData.length === 0 ? (
                  <span className="text-xs text-slate-400 font-semibold">Chưa có giao dịch Thu</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {incomePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatVND(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend details */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 text-[11px]">
                {incomePieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate text-slate-500 font-semibold">{entry.name}:</span>
                    <span className="font-mono font-bold text-slate-800 ml-auto">{formatVND(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense breakdown by category */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                <span>Cơ cấu các khoản Chi</span>
              </h3>

              <div className="h-[220px] flex items-center justify-center relative">
                {expensePieData.length === 0 ? (
                  <span className="text-xs text-slate-400 font-semibold">Chưa có giao dịch Chi</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatVND(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend details */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50 text-[11px]">
                {expensePieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate text-slate-500 font-semibold">{entry.name}:</span>
                    <span className="font-mono font-bold text-slate-800 ml-auto">{formatVND(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* FORM MODAL FOR NEW INCOME/EXPENSE */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className={`p-5 text-white flex items-center justify-between ${
              formType === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  LẬP CHỨNG TỪ {formType === 'INCOME' ? 'PHIẾU THU (INCOME)' : 'PHIẾU CHI (EXPENSE)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-white hover:text-slate-200 text-sm font-black p-1"
              >
                ✕
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={handleSubmitTransaction} className="p-6 space-y-4">
              
              {/* Income / Expense switcher inside form */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleFormTypeChange('INCOME')}
                  className={`py-2 text-xs font-extrabold rounded-lg transition ${
                    formType === 'INCOME' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'
                  }`}
                >
                  Phiếu Thu (+)
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange('EXPENSE')}
                  className={`py-2 text-xs font-extrabold rounded-lg transition ${
                    formType === 'EXPENSE' ? 'bg-rose-500 text-white shadow' : 'text-slate-500'
                  }`}
                >
                  Phiếu Chi (-)
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Số tiền (VNĐ) *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formAmount ? new Intl.NumberFormat('vi-VN').format(parseInt(formAmount.replace(/\D/g, '')) || 0) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setFormAmount(raw);
                    }}
                    placeholder="Nhập số tiền..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-extrabold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/15"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Phân loại hạng mục *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2"
                >
                  {formType === 'INCOME' 
                    ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>

              {/* Partner Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tên đối tác vãng lai / liên đới</label>
                <input
                  type="text"
                  value={formPartner}
                  onChange={(e) => setFormPartner(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A, Unilever, Chủ nhà..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hình thức TT *</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ngày chứng từ *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nội dung ghi chú *</label>
                <textarea
                  required
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Nhập lý do thu/chi cụ thể..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/15"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-500 hover:bg-slate-50 transition"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-extrabold transition shadow-lg ${
                    formType === 'INCOME' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                  }`}
                >
                  Xác nhận lập phiếu
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

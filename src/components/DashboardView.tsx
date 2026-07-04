import React, { useState } from 'react';
import { Product, Order, Customer, Supplier, ActivityLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Wallet, 
  PackageOpen, 
  ClipboardList, 
  ArrowUpRight, 
  Coins, 
  Percent, 
  Search, 
  CircleDollarSign, 
  BarChart3, 
  Receipt,
  Calendar,
  FileSpreadsheet,
  FileDown,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from '../lib/html2canvas-patch';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  logs: ActivityLog[];
  onNavigate: (view: string) => void;
  onDeleteOrder: (id: string) => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function DashboardView({
  products,
  orders,
  customers,
  suppliers,
  logs,
  onNavigate,
  onDeleteOrder,
  onShowConfirm,
  onShowAlert
}: DashboardProps) {
  // Navigation states inside profit reports
  const [reportTab, setReportTab] = useState<'PRODUCTS' | 'ORDERS' | 'CATEGORIES' | 'PERIODS'>('PRODUCTS');
  const [periodTab, setPeriodTab] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Calculations
  const totalRevenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.debt, 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.debtToSupplier, 0);
  
  const lowStockProducts = products.filter(p => p.stock <= parseInt(p.minStock) && p.active !== false);
  const lowStockCount = lowStockProducts.length;

  // Gross profit calculation
  const totalCostOfGoods = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      const importPrice = product ? product.importPrice : (item.price * 0.6);
      return itemSum + (importPrice * item.quantity);
    }, 0);
  }, 0);

  const totalProfit = totalRevenue - totalCostOfGoods;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Process data for charts
  // Group orders by date for the chart
  const revenueByDate: Record<string, number> = {};
  const profitByDate: Record<string, number> = {};
  
  orders.forEach(o => {
    const dateStr = o.createdAt.split(' ')[0]; // YYYY-MM-DD
    revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + o.finalAmount;

    const orderCost = o.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      const importPrice = product ? product.importPrice : (item.price * 0.6);
      return sum + (importPrice * item.quantity);
    }, 0);
    const orderProfit = o.finalAmount - orderCost;
    profitByDate[dateStr] = (profitByDate[dateStr] || 0) + orderProfit;
  });

  // Create an array for the last 7 days of sales & profit
  const chartData = Object.keys(revenueByDate)
    .map(date => ({
      name: date.split('-').slice(1, 3).reverse().join('/'), // format as DD/MM
      'Doanh thu': revenueByDate[date],
      'Lợi nhuận': profitByDate[date] || 0,
    }))
    .slice(-7);

  // Top Selling products logic with individual profit
  const productSalesMap: Record<string, { name: string; unit: string; qty: number; revenue: number; profit: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const importPrice = product ? product.importPrice : (item.price * 0.6);
      const profitPerItem = item.price - importPrice;

      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          unit: item.unit,
          qty: 0,
          revenue: 0,
          profit: 0
        };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.price * item.quantity;
      productSalesMap[item.productId].profit += profitPerItem * item.quantity;
    });
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // 1. Product profitability list
  const productPerformanceList = products.map(product => {
    let qtySold = 0;
    let totalRev = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId === product.id) {
          qtySold += item.quantity;
          totalRev += item.price * item.quantity;
        }
      });
    });
    const totalCost = qtySold * product.importPrice;
    const profit = totalRev - totalCost;
    const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;
    return {
      ...product,
      qtySold,
      totalRev,
      totalCost,
      profit,
      margin
    };
  }).filter(p => {
    const code = p.code || '';
    const name = p.name || '';
    const matchesSearch = name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          code.toLowerCase().includes(productSearch.toLowerCase());
    return matchesSearch && (p.qtySold > 0 || p.active !== false);
  });

  // 2. Order profitability list
  const orderPerformanceList = orders.map(order => {
    const cost = order.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      const importPrice = product ? product.importPrice : (item.price * 0.6);
      return sum + (importPrice * item.quantity);
    }, 0);
    const profit = order.finalAmount - cost;
    const margin = order.finalAmount > 0 ? (profit / order.finalAmount) * 100 : 0;
    return {
      ...order,
      cost,
      profit,
      margin
    };
  }).filter(o => {
    return o.code.toLowerCase().includes(orderSearch.toLowerCase()) || 
           o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
  });

  // 3. Category profitability list
  // Re-map categories using product lists
  const categoriesList = Array.from(new Set(products.map(p => p.categoryId))).map(catId => {
    const sampleProduct = products.find(p => p.categoryId === catId);
    return {
      id: catId,
      name: catId === 'CAT001' ? 'Đồ uống & Cà phê' : 
            catId === 'CAT002' ? 'Gia vị & Thực phẩm khô' :
            catId === 'CAT003' ? 'Sữa & Bánh kẹo' :
            catId === 'CAT004' ? 'Hóa mỹ phẩm & Đồ gia dụng' : 'Khác'
    };
  });

  const categoryPerformanceList = categoriesList.map(cat => {
    const catProducts = products.filter(p => p.categoryId === cat.id);
    let qtySold = 0;
    let totalRev = 0;
    let totalCost = 0;
    
    catProducts.forEach(product => {
      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.productId === product.id) {
            qtySold += item.quantity;
            totalRev += item.price * item.quantity;
            totalCost += item.quantity * product.importPrice;
          }
        });
      });
    });
    
    const profit = totalRev - totalCost;
    const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;
    
    return {
      ...cat,
      qtySold,
      totalRev,
      totalCost,
      profit,
      margin
    };
  });

  // Grouping helpers for profit report by day, week, month, year
  const getStartOfWeek = (dateStr: string): string => {
    const cleanDate = dateStr.split(' ')[0]; // YYYY-MM-DD
    const date = new Date(cleanDate + 'T00:00:00');
    if (isNaN(date.getTime())) return cleanDate;
    const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(date.setDate(diff));
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatWeekRange = (mondayStr: string): string => {
    try {
      const parts = mondayStr.split('-');
      if (parts.length < 3) return mondayStr;
      const monday = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const format = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `Tuần ${format(monday)} - ${format(sunday)} (${parts[0]})`;
    } catch (e) {
      return mondayStr;
    }
  };

  // Grouped performances
  const dailyPerformance: Record<string, { orderCount: number; revenue: number; cost: number; profit: number }> = {};
  const weeklyPerformance: Record<string, { orderCount: number; revenue: number; cost: number; profit: number }> = {};
  const monthlyPerformance: Record<string, { orderCount: number; revenue: number; cost: number; profit: number }> = {};
  const yearlyPerformance: Record<string, { orderCount: number; revenue: number; cost: number; profit: number }> = {};

  orders.forEach(order => {
    const rawDate = order.createdAt; // 'YYYY-MM-DD HH:mm:ss'
    const dayKey = rawDate.split(' ')[0]; // YYYY-MM-DD
    const weekKey = getStartOfWeek(rawDate);
    const monthKey = dayKey.slice(0, 7); // YYYY-MM
    const yearKey = dayKey.slice(0, 4); // YYYY

    const orderCost = order.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      const importPrice = product ? product.importPrice : (item.price * 0.6);
      return sum + (importPrice * item.quantity);
    }, 0);
    const orderProfit = order.finalAmount - orderCost;

    // Daily
    if (!dailyPerformance[dayKey]) {
      dailyPerformance[dayKey] = { orderCount: 0, revenue: 0, cost: 0, profit: 0 };
    }
    dailyPerformance[dayKey].orderCount += 1;
    dailyPerformance[dayKey].revenue += order.finalAmount;
    dailyPerformance[dayKey].cost += orderCost;
    dailyPerformance[dayKey].profit += orderProfit;

    // Weekly
    if (!weeklyPerformance[weekKey]) {
      weeklyPerformance[weekKey] = { orderCount: 0, revenue: 0, cost: 0, profit: 0 };
    }
    weeklyPerformance[weekKey].orderCount += 1;
    weeklyPerformance[weekKey].revenue += order.finalAmount;
    weeklyPerformance[weekKey].cost += orderCost;
    weeklyPerformance[weekKey].profit += orderProfit;

    // Monthly
    if (!monthlyPerformance[monthKey]) {
      monthlyPerformance[monthKey] = { orderCount: 0, revenue: 0, cost: 0, profit: 0 };
    }
    monthlyPerformance[monthKey].orderCount += 1;
    monthlyPerformance[monthKey].revenue += order.finalAmount;
    monthlyPerformance[monthKey].cost += orderCost;
    monthlyPerformance[monthKey].profit += orderProfit;

    // Yearly
    if (!yearlyPerformance[yearKey]) {
      yearlyPerformance[yearKey] = { orderCount: 0, revenue: 0, cost: 0, profit: 0 };
    }
    yearlyPerformance[yearKey].orderCount += 1;
    yearlyPerformance[yearKey].revenue += order.finalAmount;
    yearlyPerformance[yearKey].cost += orderCost;
    yearlyPerformance[yearKey].profit += orderProfit;
  });

  const dailyList = Object.entries(dailyPerformance)
    .map(([date, metrics]) => {
      const parts = date.split('-');
      const label = `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
      const margin = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0;
      return { key: date, label, ...metrics, margin };
    })
    .sort((a, b) => b.key.localeCompare(a.key));

  const weeklyList = Object.entries(weeklyPerformance)
    .map(([mondayStr, metrics]) => {
      const label = formatWeekRange(mondayStr);
      const margin = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0;
      return { key: mondayStr, label, ...metrics, margin };
    })
    .sort((a, b) => b.key.localeCompare(a.key));

  const monthlyList = Object.entries(monthlyPerformance)
    .map(([monthStr, metrics]) => {
      const parts = monthStr.split('-');
      const label = `Tháng ${parts[1]}/${parts[0]}`;
      const margin = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0;
      return { key: monthStr, label, ...metrics, margin };
    })
    .sort((a, b) => b.key.localeCompare(a.key));

  const yearlyList = Object.entries(yearlyPerformance)
    .map(([yearStr, metrics]) => {
      const label = `Năm ${yearStr}`;
      const margin = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0;
      return { key: yearStr, label, ...metrics, margin };
    })
    .sort((a, b) => b.key.localeCompare(a.key));

  // Exporting status states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingChart, setIsExportingChart] = useState(false);

  // 1. Export to Excel (via CSV with UTF-8 BOM)
  const exportToExcel = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (reportTab === 'PRODUCTS') {
      filename = `Bao_cao_loi_nhuan_san_pham_${new Date().toISOString().slice(0, 10)}`;
      headers = [
        'Tên hàng hóa',
        'Mã vạch/Barcode',
        'Đơn vị tính',
        'Giá nhập (đ)',
        'Giá bán lẻ (đ)',
        'Đã bán (SL)',
        'Doanh thu (đ)',
        'Tổng giá vốn (đ)',
        'Lợi nhuận gộp (đ)',
        'Tỷ suất ROI (%)'
      ];
      rows = productPerformanceList.map(p => [
        p.name,
        p.code,
        p.unit,
        p.importPrice,
        p.price,
        p.qtySold,
        p.totalRev,
        p.totalCost,
        p.profit,
        p.margin.toFixed(2)
      ]);
    } else if (reportTab === 'ORDERS') {
      filename = `Bao_cao_loi_nhuan_don_hang_${new Date().toISOString().slice(0, 10)}`;
      headers = [
        'Mã hóa đơn',
        'Thời gian',
        'Khách hàng',
        'Doanh thu (đ)',
        'Tổng giá vốn (đ)',
        'Lợi nhuận gộp (đ)',
        'Tỷ suất (%)'
      ];
      rows = orderPerformanceList.map(o => [
        o.code,
        o.createdAt,
        o.customerName,
        o.finalAmount,
        o.cost,
        o.profit,
        o.margin.toFixed(2)
      ]);
    } else if (reportTab === 'CATEGORIES') {
      filename = `Bao_cao_loi_nhuan_nganh_hang_${new Date().toISOString().slice(0, 10)}`;
      headers = [
        'Tên ngành hàng/Danh mục',
        'Số lượng bán (SL)',
        'Doanh thu (đ)',
        'Tổng giá vốn (đ)',
        'Lợi nhuận gộp (đ)',
        'Tỷ suất (%)'
      ];
      rows = categoryPerformanceList.map(c => [
        c.name,
        c.qtySold,
        c.totalRev,
        c.totalCost,
        c.profit,
        c.margin.toFixed(2)
      ]);
    } else if (reportTab === 'PERIODS') {
      const activeList = periodTab === 'DAY' ? dailyList :
                         periodTab === 'WEEK' ? weeklyList :
                         periodTab === 'MONTH' ? monthlyList : yearlyList;
      const periodLabel = periodTab === 'DAY' ? 'Ngày' :
                          periodTab === 'WEEK' ? 'Tuần' :
                          periodTab === 'MONTH' ? 'Tháng' : 'Năm';
      filename = `Bao_cao_loi_nhuan_theo_${periodTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;
      headers = [
        `Kỳ báo cáo (${periodLabel})`,
        'Số lượng đơn',
        'Doanh thu (đ)',
        'Tổng giá vốn (đ)',
        'Lợi nhuận gộp (đ)',
        'Tỷ suất lợi nhuận (%)'
      ];
      rows = activeList.map(item => [
        item.label,
        item.orderCount,
        item.revenue,
        item.cost,
        item.profit,
        item.margin.toFixed(2)
      ]);
    }

    // Generate CSV content with UTF-8 BOM to support Vietnamese accents in Excel
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export active Profit Report tab table as PDF via html2canvas & jsPDF
  const exportToPDF = async () => {
    const element = document.getElementById('profit-report-card');
    if (!element) return;
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // high quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297; // A4 width landscape
      const pageHeight = 210; // A4 height landscape
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Bao_cao_loi_nhuan_${reportTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      if (onShowAlert) {
        onShowAlert('Có lỗi khi xuất file PDF. Vui lòng thử lại!', 'error');
      } else {
        alert('Có lỗi khi xuất file PDF. Vui lòng thử lại!');
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  // 3. Export main financial Area Chart card as PDF
  const exportChartToPDF = async () => {
    const element = document.getElementById('main-sales-chart-card');
    if (!element) return;
    setIsExportingChart(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 0;
      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
      pdf.save(`Bieu_do_tai_chinh_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      if (onShowAlert) {
        onShowAlert('Có lỗi khi xuất PDF biểu đồ!', 'error');
      } else {
        alert('Có lỗi khi xuất PDF biểu đồ!');
      }
    } finally {
      setIsExportingChart(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Low stock general alert banner */}
      {lowStockCount > 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600 animate-pulse shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-rose-800 text-sm">Cảnh báo tồn kho: Có {lowStockCount} mặt hàng dưới mức tối thiểu!</p>
              <p className="text-rose-600 text-xs mt-0.5">Vui lòng kiểm tra lại số lượng tồn kho và nhanh chóng nhập thêm hàng để duy trì bán hàng liên tục.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('PRODUCTS')}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Đến kho hàng hóa</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Metric Grid - Responsive with Profit Addition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Doanh thu */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
        >
          <div className="space-y-1.5">
            <span className="text-slate-500 text-xs font-medium">Doanh Thu Hệ Thống</span>
            <h3 className="text-xl font-extrabold text-slate-850">{new Intl.NumberFormat('vi-VN').format(totalRevenue)}đ</h3>
            <span className="text-[10px] text-slate-400 block">{orders.length} hóa đơn bán lẻ</span>
          </div>
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Lợi nhuận gộp */}
        <motion.div 
          variants={itemVariants}
          className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
        >
          <div className="space-y-1.5">
            <span className="text-emerald-800 text-xs font-medium">Lợi Nhuận Thực Tế</span>
            <h3 className="text-xl font-extrabold text-emerald-700">{new Intl.NumberFormat('vi-VN').format(totalProfit)}đ</h3>
            <span className="text-[10px] bg-emerald-100/70 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md">
              Tỷ suất: {overallMargin.toFixed(1)}%
            </span>
          </div>
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-sm shadow-emerald-500/10">
            <Coins className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Cảnh báo tồn */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
        >
          <div className="space-y-1.5">
            <span className="text-slate-500 text-xs font-medium">Hàng Hết / Cảnh Báo</span>
            <h3 className={`text-xl font-extrabold ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-850'}`}>{lowStockCount} sản phẩm</h3>
            <span className="text-[10px] text-slate-400 block">Cần nhập thêm để duy trì</span>
          </div>
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Công nợ phải thu */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
        >
          <div className="space-y-1.5">
            <span className="text-slate-500 text-xs font-medium">Khách Nợ Phải Thu</span>
            <h3 className="text-xl font-extrabold text-amber-600">{new Intl.NumberFormat('vi-VN').format(totalCustomerDebt)}đ</h3>
            <span className="text-[10px] text-slate-400 block">Tiền hàng trả chậm</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Công nợ phải trả */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
        >
          <div className="space-y-1.5">
            <span className="text-slate-500 text-xs font-medium">Nợ Phải Trả NCC</span>
            <h3 className="text-xl font-extrabold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(totalSupplierDebt)}đ</h3>
            <span className="text-[10px] text-slate-400 block">Nợ gối đầu nhập kho</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Wallet className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Main Content Sections: Chart with Revenue + Profit Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Area Chart */}
        <motion.div 
          id="main-sales-chart-card"
          variants={itemVariants}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Biểu Đồ Doanh Thu & Lợi Nhuận</h4>
              <p className="text-slate-400 text-xs">Biến động tài chính trong 7 ngày giao dịch gần đây</p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="flex gap-2 text-xs font-bold font-mono">
                <span className="flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-600 rounded text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Doanh thu
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Lợi nhuận
                </span>
              </div>
              <button
                onClick={exportChartToPDF}
                disabled={isExportingChart}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm hover:shadow cursor-pointer border border-slate-200"
                title="Xuất PDF biểu đồ doanh thu và lợi nhuận gộp"
              >
                {isExportingChart ? (
                  <>
                    <span className="w-3 h-3 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></span>
                    <span>Đang xuất...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xuất PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <TrendingUp className="w-8 h-8 text-slate-300" />
                <span>Chưa ghi nhận đủ dữ liệu biểu đồ.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                    formatter={(value, name) => [`${new Intl.NumberFormat('vi-VN').format(value as number)}đ`, name]}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="Doanh thu" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="Lợi nhuận" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Low stock alerts panel */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Cảnh Báo Hết Hàng</h4>
              <p className="text-slate-400 text-xs">Sản phẩm có tồn kho bằng hoặc thấp hơn hạn mức tối thiểu</p>
            </div>
            {lowStockCount > 0 && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[11px] font-bold">Mức Đỏ</span>}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-72">
            {lowStockProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2 py-10">
                <PackageOpen className="w-10 h-10 text-emerald-400" />
                <span className="font-medium text-slate-700">Mọi thứ đều hoàn hảo!</span>
                <span className="text-xs text-slate-400">Không có sản phẩm nào thiếu hụt.</span>
              </div>
            ) : (
              lowStockProducts.map(p => {
                const isOutOfStock = p.stock === 0;
                return (
                  <div 
                    key={p.id} 
                    className={`flex items-center gap-3.5 p-3 rounded-xl transition border ${
                      isOutOfStock 
                        ? 'bg-rose-50/40 border-rose-200 shadow-sm shadow-rose-500/5' 
                        : 'bg-amber-50/30 border-amber-200'
                    }`}
                  >
                    <img 
                      src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=200'} 
                      alt={p.name} 
                      className="w-11 h-11 rounded-lg object-cover bg-slate-200 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-bold text-slate-800 text-sm truncate">{p.name}</h5>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isOutOfStock ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isOutOfStock ? 'Hết' : 'Tồn thấp'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-500 text-xs font-mono">Tồn: <span className={`${isOutOfStock ? 'text-rose-600 font-extrabold' : 'text-amber-600 font-bold'}`}>{p.stock}</span> {p.unit}</span>
                        <span className="text-slate-400 text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded">Min: {p.minStock}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* DETAILED PROFIT REPORT SYSTEM CARD (NEW MODULE) */}
      <motion.div 
        id="profit-report-card"
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-150 pb-4">
          <div>
            <h4 className="font-extrabold text-slate-850 text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Phân Tích Doanh Thu & Lợi Nhuận Chi Tiết</span>
            </h4>
            <p className="text-slate-400 text-xs">Phục hồi cấu trúc biên lợi nhuận kinh doanh, quản lý giá vốn và hiệu suất đầu tư ROI</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            {/* Interactive Report Tab Swapper */}
            <div className="flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto shrink-0 overflow-x-auto">
              <button
                onClick={() => setReportTab('PRODUCTS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  reportTab === 'PRODUCTS'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <PackageOpen className="w-3.5 h-3.5" />
                <span>Hiệu Suất Sản Phẩm</span>
              </button>
              <button
                onClick={() => setReportTab('ORDERS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  reportTab === 'ORDERS'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Theo Đơn POS</span>
              </button>
              <button
                onClick={() => setReportTab('CATEGORIES')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  reportTab === 'CATEGORIES'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <CircleDollarSign className="w-3.5 h-3.5" />
                <span>Theo Ngành Hàng</span>
              </button>
              <button
                onClick={() => setReportTab('PERIODS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  reportTab === 'PERIODS'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Theo Thời Gian</span>
              </button>
            </div>

            {/* Offline Export Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={exportToExcel}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm hover:shadow active:scale-95 cursor-pointer border border-emerald-700 whitespace-nowrap"
                title="Xuất báo cáo dữ liệu dạng bảng Excel (.csv)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
              <button
                onClick={exportToPDF}
                disabled={isExportingPDF}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm hover:shadow active:scale-95 cursor-pointer border border-rose-700 whitespace-nowrap"
                title="Xuất báo cáo hiện tại ra file PDF"
              >
                {isExportingPDF ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Đang xuất...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Xuất PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TAB content 1: PRODUCT PROFITABILITY */}
        {reportTab === 'PRODUCTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, mã sản phẩm..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <span className="text-[11px] text-slate-400 italic">
                Hiển thị {productPerformanceList.length} mặt hàng kinh doanh
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] bg-slate-50/50">
                    <th className="py-3 px-4">Tên hàng hóa & Mã vạch</th>
                    <th className="py-3 px-3 text-right">Giá nhập</th>
                    <th className="py-3 px-3 text-right">Giá bán</th>
                    <th className="py-3 px-3 text-center">Đã bán</th>
                    <th className="py-3 px-3 text-right">Doanh thu</th>
                    <th className="py-3 px-3 text-right">Tổng giá vốn</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Lợi nhuận gộp</th>
                    <th className="py-3 px-4 text-center">Tỷ suất ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {productPerformanceList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Không tìm thấy sản phẩm nào có lịch sử giao dịch.
                      </td>
                    </tr>
                  ) : (
                    productPerformanceList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="font-bold text-slate-800">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.code} ({p.unit})</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {new Intl.NumberFormat('vi-VN').format(p.importPrice)}đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 font-semibold">
                          {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {p.qtySold}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 font-semibold">
                          {new Intl.NumberFormat('vi-VN').format(p.totalRev)}đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {new Intl.NumberFormat('vi-VN').format(p.totalCost)}đ
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 bg-emerald-50/20">
                          {new Intl.NumberFormat('vi-VN').format(p.profit)}đ
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            p.margin > 30 ? 'bg-emerald-100 text-emerald-800' :
                            p.margin > 15 ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB content 2: ORDER P&L */}
        {reportTab === 'ORDERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã đơn, khách hàng..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <span className="text-[11px] text-slate-400 italic">
                Hiển thị {orderPerformanceList.length} đơn bán lẻ tại POS
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] bg-slate-50/50">
                    <th className="py-3 px-4">Đơn hàng</th>
                    <th className="py-3 px-3">Khách hàng</th>
                    <th className="py-3 px-3 text-right">Tổng tiền</th>
                    <th className="py-3 px-3 text-right">Chiết khấu</th>
                    <th className="py-3 px-3 text-right">Thu thực tế</th>
                    <th className="py-3 px-3 text-right">Giá vốn đơn</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Lợi nhuận gộp</th>
                    <th className="py-3 px-4 text-center">Tỷ suất</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orderPerformanceList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Không tìm thấy đơn hàng nào khớp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    orderPerformanceList.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="font-bold text-sky-600">{o.code}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{o.createdAt}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-medium">{o.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Bán bởi: {o.sellerName}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {new Intl.NumberFormat('vi-VN').format(o.totalAmount)}đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-600 font-medium">
                          -{new Intl.NumberFormat('vi-VN').format(o.discount)}đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-800 font-extrabold">
                          {new Intl.NumberFormat('vi-VN').format(o.finalAmount)}đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {new Intl.NumberFormat('vi-VN').format(o.cost)}đ
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 bg-emerald-50/20">
                          {new Intl.NumberFormat('vi-VN').format(o.profit)}đ
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            o.margin > 25 ? 'bg-emerald-100 text-emerald-800' :
                            o.margin > 12 ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              const deleteMsg = `Bạn có chắc chắn muốn HỦY/XÓA đơn hàng '${o.code}' trị giá ${new Intl.NumberFormat('vi-VN').format(o.finalAmount)}đ không? Hành động này sẽ HOÀN TRẢ lại tồn kho của các mặt hàng tương ứng và thu hồi công nợ liên quan!`;
                              if (onShowConfirm) {
                                onShowConfirm(deleteMsg, () => onDeleteOrder(o.id));
                              } else if (window.confirm(deleteMsg)) {
                                onDeleteOrder(o.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Xóa/Hủy đơn hàng"
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
        )}

        {/* TAB content 3: CATEGORY PROFITABILITY */}
        {reportTab === 'CATEGORIES' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] bg-slate-50/50">
                    <th className="py-3 px-4">Tên danh mục mặt hàng</th>
                    <th className="py-3 px-3 text-center">Lượng bán ra</th>
                    <th className="py-3 px-3 text-right">Doanh thu đạt</th>
                    <th className="py-3 px-3 text-right">Tổng giá vốn</th>
                    <th className="py-3 px-4 text-right text-emerald-700 font-extrabold">Tổng lợi nhuận</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ lợi suất gộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categoryPerformanceList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {c.name}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {c.qtySold} sản phẩm
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                        {new Intl.NumberFormat('vi-VN').format(c.totalRev)}đ
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {new Intl.NumberFormat('vi-VN').format(c.totalCost)}đ
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 bg-emerald-50/20">
                        {new Intl.NumberFormat('vi-VN').format(c.profit)}đ
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800`}>
                          {c.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportTab === 'PERIODS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex p-1 bg-slate-100 rounded-xl self-start">
                <button
                  onClick={() => setPeriodTab('DAY')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    periodTab === 'DAY'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span>Theo Ngày</span>
                </button>
                <button
                  onClick={() => setPeriodTab('WEEK')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    periodTab === 'WEEK'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span>Theo Tuần</span>
                </button>
                <button
                  onClick={() => setPeriodTab('MONTH')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    periodTab === 'MONTH'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span>Theo Tháng</span>
                </button>
                <button
                  onClick={() => setPeriodTab('YEAR')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    periodTab === 'YEAR'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span>Theo Năm</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400 italic">
                Thời gian: {periodTab === 'DAY' ? 'Báo cáo chi tiết từng ngày có phát sinh giao dịch' :
                            periodTab === 'WEEK' ? 'Báo cáo chi tiết theo các tuần trong năm' :
                            periodTab === 'MONTH' ? 'Báo cáo chi tiết theo từng tháng kinh doanh' :
                                                    'Báo cáo tổng kết theo năm tài chính'}
              </span>
            </div>

            {/* Quick Summary Metrics for Selected Period Type */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-150">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Tổng doanh thu kỳ</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {new Intl.NumberFormat('vi-VN').format(
                    (periodTab === 'DAY' ? dailyList :
                     periodTab === 'WEEK' ? weeklyList :
                     periodTab === 'MONTH' ? monthlyList : yearlyList).reduce((sum, i) => sum + i.revenue, 0)
                  )}đ
                </span>
              </div>
              <div className="space-y-1 border-l border-slate-200/80 pl-3.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Tổng giá vốn kỳ</span>
                <span className="text-sm font-bold text-slate-500">
                  {new Intl.NumberFormat('vi-VN').format(
                    (periodTab === 'DAY' ? dailyList :
                     periodTab === 'WEEK' ? weeklyList :
                     periodTab === 'MONTH' ? monthlyList : yearlyList).reduce((sum, i) => sum + i.cost, 0)
                  )}đ
                </span>
              </div>
              <div className="space-y-1 border-l border-slate-200/80 pl-3.5">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider block">Tổng lợi nhuận kỳ</span>
                <span className="text-sm font-extrabold text-emerald-600">
                  {new Intl.NumberFormat('vi-VN').format(
                    (periodTab === 'DAY' ? dailyList :
                     periodTab === 'WEEK' ? weeklyList :
                     periodTab === 'MONTH' ? monthlyList : yearlyList).reduce((sum, i) => sum + i.profit, 0)
                  )}đ
                </span>
              </div>
              <div className="space-y-1 border-l border-slate-200/80 pl-3.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Số đơn / Tỷ suất gộp</span>
                <span className="text-sm font-extrabold text-slate-850">
                  {(periodTab === 'DAY' ? dailyList :
                    periodTab === 'WEEK' ? weeklyList :
                    periodTab === 'MONTH' ? monthlyList : yearlyList).reduce((sum, i) => sum + i.orderCount, 0)} đơn | {
                    (() => {
                      const list = periodTab === 'DAY' ? dailyList :
                                   periodTab === 'WEEK' ? weeklyList :
                                   periodTab === 'MONTH' ? monthlyList : yearlyList;
                      const rev = list.reduce((sum, i) => sum + i.revenue, 0);
                      const prof = list.reduce((sum, i) => sum + i.profit, 0);
                      return rev > 0 ? ((prof / rev) * 100).toFixed(1) : '0';
                    })()
                  }%
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-50 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] bg-slate-50/50">
                    <th className="py-3 px-4">Kỳ báo cáo</th>
                    <th className="py-3 px-3 text-center">Số lượng đơn</th>
                    <th className="py-3 px-3 text-right">Doanh thu</th>
                    <th className="py-3 px-3 text-right">Tổng giá vốn</th>
                    <th className="py-3 px-4 text-right text-emerald-700 font-extrabold bg-emerald-50/10">Lợi nhuận gộp</th>
                    <th className="py-3 px-4 text-center">Tỷ suất lợi nhuận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(periodTab === 'DAY' ? dailyList :
                    periodTab === 'WEEK' ? weeklyList :
                    periodTab === 'MONTH' ? monthlyList : yearlyList).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa ghi nhận dữ liệu kinh doanh trong chu kỳ thời gian này.
                      </td>
                    </tr>
                  ) : (
                    (periodTab === 'DAY' ? dailyList :
                     periodTab === 'WEEK' ? weeklyList :
                     periodTab === 'MONTH' ? monthlyList : yearlyList).map((item) => (
                      <tr key={item.key} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.label}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-bold">
                            {item.orderCount} đơn hàng
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-800 font-bold">
                          {new Intl.NumberFormat('vi-VN').format(item.revenue)}đ
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {new Intl.NumberFormat('vi-VN').format(item.cost)}đ
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 bg-emerald-50/20">
                          {new Intl.NumberFormat('vi-VN').format(item.profit)}đ
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            item.margin > 30 ? 'bg-emerald-100 text-emerald-800' :
                            item.margin > 15 ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Grid: Top products & System action logs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top Products */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <div className="mb-4">
            <h4 className="font-bold text-slate-800 text-lg">Sản Phẩm Bán Chạy Nhất</h4>
            <p className="text-slate-400 text-xs">Mặt hàng được tiêu thụ nhiều nhất trong tháng</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs">
                  <th className="pb-3">Sản phẩm</th>
                  <th className="pb-3 text-center">ĐVT</th>
                  <th className="pb-3 text-center">Đã bán</th>
                  <th className="pb-3 text-right">Doanh số</th>
                  <th className="pb-3 text-right text-emerald-600 font-bold">Lợi nhuận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topSellingProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa ghi nhận sản phẩm bán chạy nào trong thời gian này.
                    </td>
                  </tr>
                ) : (
                  topSellingProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-semibold text-slate-700 text-xs">{p.name}</td>
                      <td className="py-3 text-center"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{p.unit}</span></td>
                      <td className="py-3 text-center font-bold text-slate-800 text-xs">{p.qty}</td>
                      <td className="py-3 text-right font-bold text-slate-700 text-xs">{new Intl.NumberFormat('vi-VN').format(p.revenue)}đ</td>
                      <td className="py-3 text-right font-bold text-emerald-600 text-xs">{new Intl.NumberFormat('vi-VN').format(p.profit)}đ</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* System Activity log */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Nhật Ký Hoạt Động</h4>
              <p className="text-slate-400 text-xs">Tiến trình hoạt động của nhân viên trong ngày</p>
            </div>
            <ClipboardList className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-72">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs leading-relaxed border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="text-sky-600 font-bold">[{log.action}]</span>
                  <span className="text-slate-400 font-mono">{log.createdAt.split(' ')[1]}</span>
                </div>
                <p className="text-slate-500 mt-0.5">{log.details}</p>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Tác nhân: <span className="font-semibold text-slate-600">{log.username} ({log.role})</span> | IP: {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

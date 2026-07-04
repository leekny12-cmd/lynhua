import React, { useState, useMemo } from 'react';
import { Product, Order, Category } from '../types';
import {
  AreaChart,
  Area,
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
import {
  TrendingUp,
  Calendar,
  ShoppingBag,
  CircleDollarSign,
  Boxes,
  PieChart as PieIcon,
  Filter,
  BarChart3,
  Coins,
  ArrowUpRight,
  Bookmark,
  Activity,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportViewProps {
  products: Product[];
  orders: Order[];
  categories: Category[];
}

export default function ReportView({ products, orders, categories }: ReportViewProps) {
  // Date filter state
  const [filterPeriod, setFilterPeriod] = useState<'7_DAYS' | '15_DAYS' | '30_DAYS' | 'ALL'>('30_DAYS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<'BOTH' | 'REVENUE' | 'PROFIT'>('BOTH');

  // Currency helper
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  };

  // Safe Date parsing
  const parseOrderDate = (dateStr: string): Date => {
    // Expected formats: YYYY-MM-DD HH:mm:ss or similar
    const cleanStr = dateStr.replace(' - ', ' ');
    return new Date(cleanStr);
  };

  // Filter orders based on selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let thresholdDate = new Date();

    if (filterPeriod === '7_DAYS') {
      thresholdDate.setDate(now.getDate() - 7);
    } else if (filterPeriod === '15_DAYS') {
      thresholdDate.setDate(now.getDate() - 15);
    } else if (filterPeriod === '30_DAYS') {
      thresholdDate.setDate(now.getDate() - 30);
    } else {
      thresholdDate = new Date(0); // Epoch
    }

    return orders.filter(order => {
      const orderDate = parseOrderDate(order.createdAt);
      
      // If custom date ranges are typed
      if (startDate || endDate) {
        let matches = true;
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          matches = matches && orderDate >= start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matches = matches && orderDate <= end;
        }
        return matches;
      }

      return orderDate >= thresholdDate;
    });
  }, [orders, filterPeriod, startDate, endDate]);

  // Calculations for KPI summaries
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    const totalOrdersCount = filteredOrders.length;

    filteredOrders.forEach(order => {
      totalRevenue += order.finalAmount;

      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        // Fallback to 60% of price if importPrice is undefined or 0
        const importPrice = product && product.importPrice ? product.importPrice : (item.price * 0.6);
        totalCostOfGoods += importPrice * item.quantity;
      });
    });

    const totalProfit = totalRevenue - totalCostOfGoods;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      totalOrdersCount,
      averageOrderValue
    };
  }, [filteredOrders, products]);

  // Group revenue & profit by date for daily chart
  const dailyChartData = useMemo(() => {
    const grouped: Record<string, { revenue: number; profit: number }> = {};

    filteredOrders.forEach(order => {
      // Split order date YYYY-MM-DD
      const dateKey = order.createdAt.split(' ')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { revenue: 0, profit: 0 };
      }

      grouped[dateKey].revenue += order.finalAmount;

      // Calculate cost for profit
      let orderCost = 0;
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const importPrice = product && product.importPrice ? product.importPrice : (item.price * 0.6);
        orderCost += importPrice * item.quantity;
      });

      // Profit contribution for this order
      const orderProfit = order.finalAmount - orderCost;
      grouped[dateKey].profit += orderProfit;
    });

    // Sort dates chronologically
    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => {
        const dateParts = date.split('-');
        const nameFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : date;
        return {
          rawDate: date,
          name: nameFormatted,
          'Doanh thu': grouped[date].revenue,
          'Lợi nhuận': grouped[date].profit
        };
      });
  }, [filteredOrders, products]);

  // Calculate best-selling products ranking
  const bestSellers = useMemo(() => {
    const productSalesMap: Record<string, { 
      productId: string; 
      productName: string; 
      productCode: string;
      quantitySold: number; 
      revenue: number; 
      profit: number; 
      unit: string;
    }> = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const productCode = product?.code || 'N/A';
        const unit = product?.unit || item.unit || 'Cái';
        const importPrice = product && product.importPrice ? product.importPrice : (item.price * 0.6);

        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            productCode,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
            unit
          };
        }

        const statsRef = productSalesMap[item.productId];
        statsRef.quantitySold += item.quantity;
        statsRef.revenue += item.price * item.quantity;
        
        const itemProfit = (item.price - importPrice) * item.quantity;
        statsRef.profit += itemProfit;
      });
    });

    // Convert to array and sort by quantity sold descending
    return Object.values(productSalesMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10); // Take top 10
  }, [filteredOrders, products]);

  // Best sellers chart formatted data
  const bestSellersChartData = useMemo(() => {
    return [...bestSellers]
      .reverse() // Reverse for horizontal bar chart ordering (top on top)
      .map(item => ({
        name: item.productName.length > 15 ? `${item.productName.substring(0, 15)}...` : item.productName,
        fullName: item.productName,
        'Số lượng bán': item.quantitySold,
        'Doanh thu': item.revenue,
        'Lợi nhuận': item.profit
      }));
  }, [bestSellers]);

  // Category sales statistics
  const categoryStats = useMemo(() => {
    const map: Record<string, { categoryId: string; categoryName: string; revenue: number; quantity: number }> = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const catId = product?.categoryId || 'UNCATEGORIZED';
        const categoryMatch = categories.find(c => c.id === catId);
        const categoryName = categoryMatch?.name || 'Chưa phân loại';

        if (!map[catId]) {
          map[catId] = {
            categoryId: catId,
            categoryName,
            revenue: 0,
            quantity: 0
          };
        }

        map[catId].revenue += item.price * item.quantity;
        map[catId].quantity += item.quantity;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, idx) => ({
        ...item,
        percentage: stats.totalRevenue > 0 ? (item.revenue / stats.totalRevenue) * 100 : 0
      }));
  }, [filteredOrders, products, categories, stats.totalRevenue]);

  // Color palette for charts
  const COLOR_PALETTE = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7', '#0369a1', '#075985'];

  return (
    <div className="space-y-6" id="report-view-container">
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-150">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Báo Cáo & Thống Kê Doanh Thu</h2>
          </div>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Phân tích chuyên sâu doanh số, lợi nhuận ròng, và các chỉ số kinh doanh cốt lõi.
          </p>
        </div>

        {/* Dynamic Period Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            {[
              { id: '7_DAYS', label: '7 ngày qua' },
              { id: '15_DAYS', label: '15 ngày qua' },
              { id: '30_DAYS', label: '30 ngày qua' },
              { id: 'ALL', label: 'Toàn bộ' }
            ].map(period => (
              <button
                key={period.id}
                onClick={() => {
                  setFilterPeriod(period.id as any);
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  filterPeriod === period.id && !startDate && !endDate
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFilterPeriod('ALL');
              }}
              className="text-[11px] font-bold text-slate-700 bg-transparent focus:outline-none border-0 p-0"
              placeholder="Từ ngày"
            />
            <span className="text-slate-300 text-xs font-semibold">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFilterPeriod('ALL');
              }}
              className="text-[11px] font-bold text-slate-700 bg-transparent focus:outline-none border-0 p-0"
              placeholder="Đến ngày"
            />
          </div>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doanh Thu Thuần</span>
            <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">
              {formatVND(stats.totalRevenue)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <ArrowUpRight className="w-3 h-3" />
              <span>Phát sinh từ {stats.totalOrdersCount} đơn</span>
            </div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lợi Nhuận Gộp</span>
            <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">
              {formatVND(stats.totalProfit)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-sky-600 font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Biên lợi nhuận: {stats.profitMargin.toFixed(1)}%</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lượng Giao Dịch</span>
            <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">
              {stats.totalOrdersCount} đơn hàng
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold">
              <Activity className="w-3 h-3" />
              <span>Lưu lượng khách chốt đơn</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Average ticket price */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Giá Trị Đơn Trung Bình</span>
            <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">
              {formatVND(stats.averageOrderValue)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
              <Award className="w-3 h-3" />
              <span>Doanh thu / đơn bán ra</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. DAILY REVENUE & PROFIT AREA CHART */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Biểu đồ Xu Hướng Doanh Thu và Lợi Nhuận</h3>
            <p className="text-slate-400 text-[10px] font-semibold">Biểu diễn theo dòng thời gian ngày đã chọn.</p>
          </div>

          {/* Metric display togglers */}
          <div className="flex items-center bg-slate-50 border rounded-xl p-1 text-slate-600">
            <button
              type="button"
              onClick={() => setChartMetric('BOTH')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                chartMetric === 'BOTH' ? 'bg-sky-600 text-white shadow-xs' : 'hover:bg-slate-100'
              }`}
            >
              Cả hai
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('REVENUE')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                chartMetric === 'REVENUE' ? 'bg-sky-600 text-white shadow-xs' : 'hover:bg-slate-100'
              }`}
            >
              Chỉ doanh thu
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('PROFIT')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                chartMetric === 'PROFIT' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:bg-slate-100'
              }`}
            >
              Chỉ lợi nhuận
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-72 w-full pt-2">
          {dailyChartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <TrendingUp className="w-10 h-10 text-slate-200" />
              <p className="text-xs font-bold">Không tìm thấy dữ liệu hóa đơn nào trong khoảng thời gian đã chọn</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val / 1000}k`}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip 
                  formatter={(value: any) => [formatVND(Number(value)), '']}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#bae6fd' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                />
                {(chartMetric === 'BOTH' || chartMetric === 'REVENUE') && (
                  <Area
                    type="monotone"
                    dataKey="Doanh thu"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                )}
                {(chartMetric === 'BOTH' || chartMetric === 'PROFIT') && (
                  <Area
                    type="monotone"
                    dataKey="Lợi nhuận"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. BEST-SELLING PRODUCTS & CATEGORY DISTRIBUTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Best sellers Bar Chart (Recharts) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-500" />
                <span>Top 10 Sản Phẩm Bán Chạy Nhất</span>
              </h3>
              <p className="text-slate-400 text-[10px] font-semibold">Theo tổng lượng số lượng bán ra.</p>
            </div>
          </div>

          <div className="h-72 w-full pt-1">
            {bestSellersChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Boxes className="w-10 h-10 text-slate-200" />
                <p className="text-xs font-bold">Không có dữ liệu hàng hóa bán ra</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bestSellersChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tickLine={false} 
                    axisLine={false} 
                    width={100}
                    tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === 'Số lượng bán' ? `${value} sản phẩm` : formatVND(Number(value)),
                      name
                    ]}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                  <Bar dataKey="Số lượng bán" fill="#0284c7" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="Doanh thu" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category breakdown (Pie Chart Recharts) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-5 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-indigo-500" />
              <span>Phân Bố Doanh Thu Theo Danh Mục</span>
            </h3>
            <p className="text-slate-400 text-[10px] font-semibold">Tỷ trọng đóng góp vào tổng doanh số.</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {categoryStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Bookmark className="w-10 h-10 text-slate-200" />
                <p className="text-xs font-bold">Chưa phân loại ngành hàng</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="revenue"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Custom Category Legend details */}
          <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-xs font-semibold">
            {categoryStats.slice(0, 5).map((cat, idx) => (
              <div key={cat.categoryId} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-2.5 h-2.5 rounded-full block shrink-0"
                    style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                  />
                  <span className="text-slate-600 truncate max-w-44">{cat.categoryName}</span>
                </div>
                <div className="text-slate-500 text-[10px] font-bold space-x-1">
                  <span>{cat.percentage.toFixed(1)}%</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-slate-700">{formatVND(cat.revenue)}</span>
                </div>
              </div>
            ))}
            {categoryStats.length > 5 && (
              <p className="text-[10px] text-slate-400 text-center font-bold">Và {categoryStats.length - 5} danh mục khác...</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. BEST SELLERS LIST & DATA DETAIL TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Bảng chi tiết doanh số Top 10 Sản Phẩm</h3>
            <p className="text-slate-400 text-[10px] font-semibold">Dữ liệu phân tích chi tiết lượng bán, doanh số, và ước tính lợi nhuận.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Mã Hàng</th>
                <th className="px-5 py-3">Tên sản phẩm</th>
                <th className="px-5 py-3 text-center">Đơn vị</th>
                <th className="px-5 py-3 text-center">Số lượng bán</th>
                <th className="px-5 py-3 text-right">Tổng Doanh Thu</th>
                <th className="px-5 py-3 text-right">Lợi Nhuận Ước Tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {bestSellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                    Không có dữ liệu sản phẩm trong thời gian này
                  </td>
                </tr>
              ) : (
                bestSellers.map((item, index) => (
                  <tr key={item.productId} className="hover:bg-slate-50/40 transition">
                    <td className="px-5 py-3.5">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-extrabold ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 font-bold">{item.productCode}</td>
                    <td className="px-5 py-3.5 text-slate-800 font-bold">{item.productName}</td>
                    <td className="px-5 py-3.5 text-center text-slate-500">{item.unit}</td>
                    <td className="px-5 py-3.5 text-center text-slate-800 font-black font-mono">
                      {item.quantitySold}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-900 font-extrabold">
                      {formatVND(item.revenue)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-emerald-600 font-extrabold">
                      {formatVND(item.profit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

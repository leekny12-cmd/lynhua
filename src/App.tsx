import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Category,
  Product,
  Customer,
  Supplier,
  Order,
  PurchaseOrder,
  DebtTransaction,
  ActivityLog,
  StoreConfig
} from './types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_ORDERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_DEBT_TRANSACTIONS,
  INITIAL_LOGS
} from './data/initialData';

// Modular Components
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import OrderManagementView from './components/OrderManagementView';
import DirectoryView from './components/DirectoryView';
import InventoryView from './components/InventoryView';
import CustomerView from './components/CustomerView';
import StaffView from './components/StaffView';
import SystemView from './components/SystemView';
import PHPCodeExplorer from './components/PHPCodeExplorer';
import ReportView from './components/ReportView';

// Icons
import {
  LayoutDashboard,
  MonitorPlay,
  PackageCheck,
  Forklift,
  UserCheck2,
  Lock,
  Compass,
  FileCode2,
  Menu,
  X,
  UserMinus2,
  CalendarDays,
  Activity,
  Receipt,
  Check,
  AlertCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'CỬA HÀNG TIỆN LỢI SALESFLOW',
  address: '45 Lê Lợi, Bến Nghé, Quận 1, TP. HCM',
  phone: '0988.123.456',
  website: 'salesflow.vn',
  email: 'contact@salesflow.vn',
  footerNote: 'Cảm ơn quý khách đã ủng hộ cửa hàng!',
  bankName: 'vietcombank',
  bankAccount: '1024345678',
  bankAccountName: 'SalesFlow'
};

export default function App() {
  // LocalStorage Sync Helpers
  const getStored = <T,>(key: string, fallback: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  };

  const setStored = <T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Global Core State
  const [currentUser, setCurrentUser] = useState<User>(() => getStored<User>('sf_user', INITIAL_USERS[0]));
  const [users, setUsers] = useState<User[]>(() => getStored<User[]>('sf_users', INITIAL_USERS));
  const [products, setProducts] = useState<Product[]>(() => getStored<Product[]>('sf_products', INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => getStored<Category[]>('sf_categories', INITIAL_CATEGORIES));
  const [customers, setCustomers] = useState<Customer[]>(() => getStored<Customer[]>('sf_customers', INITIAL_CUSTOMERS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStored<Supplier[]>('sf_suppliers', INITIAL_SUPPLIERS));
  const [orders, setOrders] = useState<Order[]>(() => getStored<Order[]>('sf_orders', INITIAL_ORDERS));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => getStored<PurchaseOrder[]>('sf_purchase_orders', INITIAL_PURCHASE_ORDERS));
  const [debtTransactions, setDebtTransactions] = useState<DebtTransaction[]>(() => getStored<DebtTransaction[]>('sf_debt_transactions', INITIAL_DEBT_TRANSACTIONS));
  const [logs, setLogs] = useState<ActivityLog[]>(() => getStored<ActivityLog[]>('sf_logs', INITIAL_LOGS));
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => getStored<StoreConfig>('sf_store_config', DEFAULT_STORE_CONFIG));


  // Visual/Routing states
  const [currentView, setCurrentView] = useState<string>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Custom confirmation and alert states
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const showConfirm = (message: string, onConfirmAction: () => void) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showAlert = (message: string, type: 'success' | 'warning' | 'error' = 'warning') => {
    setAlertState({
      isOpen: true,
      message,
      type
    });
  };

  useEffect(() => {
    if (alertState.isOpen) {
      const timer = setTimeout(() => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertState.isOpen]);

  // Save states to local storage on changes
  useEffect(() => {
    setStored('sf_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStored('sf_users', users);
  }, [users]);

  useEffect(() => {
    setStored('sf_products', products);
  }, [products]);

  useEffect(() => {
    setStored('sf_categories', categories);
  }, [categories]);

  useEffect(() => {
    setStored('sf_customers', customers);
  }, [customers]);

  useEffect(() => {
    setStored('sf_suppliers', suppliers);
  }, [suppliers]);

  useEffect(() => {
    setStored('sf_orders', orders);
  }, [orders]);

  useEffect(() => {
    setStored('sf_purchase_orders', purchaseOrders);
  }, [purchaseOrders]);

  useEffect(() => {
    setStored('sf_debt_transactions', debtTransactions);
  }, [debtTransactions]);

  useEffect(() => {
    setStored('sf_logs', logs);
  }, [logs]);

  useEffect(() => {
    setStored('sf_store_config', storeConfig);
  }, [storeConfig]);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const format = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      setCurrentTime(`${format} - ${dateStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // System Logging Utility
  const logAction = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: `LOG_${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      action,
      details,
      ipAddress: '192.168.1.100', // Mock container local client
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // State Mutators
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const created: Product = {
      ...newProd,
      id: `PROD_${Date.now()}`
    };
    setProducts(prev => [created, ...prev]);
    logAction('Thêm sản phẩm', `Khai báo sản phẩm mới: ${created.name} (${created.code})`);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    logAction('Cập nhật sản phẩm', `Sửa thông tin hàng hoá: ${updated.name}`);
  };

  const handleAddCategory = (name: string, description: string) => {
    const created: Category = {
      id: `CAT_${Date.now()}`,
      name,
      description,
      productCount: 0
    };
    setCategories(prev => [...prev, created]);
    logAction('Thêm danh mục', `Tạo thêm nhóm ngành danh mục sản phẩm: ${name}`);
  };

  const handleUpdateCategory = (id: string, name: string, description: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, description } : c));
    logAction('Cập nhật danh mục', `Chỉnh sửa thông tin nhóm danh mục: ${name}`);
  };

  const handleAddCustomer = (name: string, phone: string, address: string, maxDebt: number) => {
    const created: Customer = {
      id: `CUST_${Date.now()}`,
      name,
      phone,
      email: `${phone}@salesflow.vn`,
      address,
      debt: 0,
      maxDebtLimit: maxDebt,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setCustomers(prev => [...prev, created]);
    logAction('Thêm khách hàng', `Đăng ký nhanh thành viên POS: ${name} (${phone})`);
    return created;
  };

  const handleCollectDebt = (customerId: string, amount: number, note: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const nextDebt = Math.max(0, c.debt - amount);
        
        // Add debt log
        const transaction: DebtTransaction = {
          id: `DT_${Date.now()}`,
          partnerId: c.id,
          partnerType: 'CUSTOMER',
          partnerName: c.name,
          amount: -amount,
          type: 'DEASE' as any, // decrease
          note,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        setDebtTransactions(tx => [transaction, ...tx]);
        logAction('Thu nợ khách', `Thu bớt ${new Intl.NumberFormat('vi-VN').format(amount)}đ nợ của khách hàng '${c.name}'`);
        
        return { ...c, debt: nextDebt };
      }
      return c;
    }));
  };

  const handlePaySupplierDebt = (supplierId: string, amount: number) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const nextDebt = Math.max(0, s.debtToSupplier - amount);

        // Add debt log
        const transaction: DebtTransaction = {
          id: `DT_${Date.now()}`,
          partnerId: s.id,
          partnerType: 'SUPPLIER',
          partnerName: s.name,
          amount: -amount,
          type: 'DEASE' as any,
          note: 'Thanh toán chi trả nợ nhà cung cấp',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        setDebtTransactions(tx => [transaction, ...tx]);
        logAction('Trả nợ NCC', `Chi trả bớt ${new Intl.NumberFormat('vi-VN').format(amount)}đ nợ cho nhà cung cấp '${s.name}'`);

        return { ...s, debtToSupplier: nextDebt };
      }
      return s;
    }));
  };

  const handleAddSupplier = (name: string, phone: string, email: string, address: string) => {
    const created: Supplier = {
      id: `SUP_${Date.now()}`,
      name,
      phone,
      email,
      address,
      debtToSupplier: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setSuppliers(prev => [...prev, created]);
    logAction('Thêm NCC', `Bổ sung nhà cung cấp: ${name}`);
  };

  const handleImportGoods = (newPo: Omit<PurchaseOrder, 'id' | 'code' | 'createdAt'>) => {
    const importCode = `NK${Math.floor(1000 + Math.random() * 9000)}`;
    const created: PurchaseOrder = {
      ...newPo,
      id: `PO_${Date.now()}`,
      code: importCode,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // Increment stocks
    setProducts(prev => prev.map(p => {
      const matchItem = newPo.items.find(item => item.productId === p.id);
      if (matchItem) {
        return { ...p, stock: p.stock + matchItem.quantity, importPrice: matchItem.importPrice };
      }
      return p;
    }));

    // Process Supplier Debt if DEBT payment
    if (newPo.paymentMethod === 'DEBT') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === newPo.supplierId) {
          const nextDebt = s.debtToSupplier + newPo.totalAmount;

          const transaction: DebtTransaction = {
            id: `DT_${Date.now()}`,
            partnerId: s.id,
            partnerType: 'SUPPLIER',
            partnerName: s.name,
            amount: newPo.totalAmount,
            type: 'INCREASE',
            note: `Ghi nợ từ đơn nhập kho ${importCode}`,
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
          setDebtTransactions(tx => [transaction, ...tx]);

          return { ...s, debtToSupplier: nextDebt };
        }
        return s;
      }));
    }

    setPurchaseOrders(prev => [created, ...prev]);
    logAction('Nhập hàng kho', `Xác nhận nhập kho phiếu ${importCode} trị giá ${new Intl.NumberFormat('vi-VN').format(newPo.totalAmount)}đ`);
  };

  const handleCreateOrder = (newOrder: Order) => {
    // Save order
    setOrders(prev => [newOrder, ...prev]);

    // Decrement stocks
    setProducts(prev => prev.map(p => {
      const matchItem = newOrder.items.find(item => item.productId === p.id);
      if (matchItem) {
        return { ...p, stock: Math.max(0, p.stock - matchItem.quantity) };
      }
      return p;
    }));

    // Handle Customer Debt if DEBT mode
    if (newOrder.paymentMethod === 'DEBT' && newOrder.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === newOrder.customerId) {
          const nextDebt = c.debt + newOrder.finalAmount;

          const transaction: DebtTransaction = {
            id: `DT_${Date.now()}`,
            partnerId: c.id,
            partnerType: 'CUSTOMER',
            partnerName: c.name,
            amount: newOrder.finalAmount,
            type: 'INCREASE',
            note: `Ghi nợ tự động từ Hoá đơn POS ${newOrder.code}`,
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
          setDebtTransactions(tx => [transaction, ...tx]);

          return { ...c, debt: nextDebt };
        }
        return c;
      }));
    }

    logAction('Bán hàng POS', `Xuất thành công Hoá đơn ${newOrder.code}, trị giá ${new Intl.NumberFormat('vi-VN').format(newOrder.finalAmount)}đ`);
  };

  const handleSwitchUser = (userId: string) => {
    const match = users.find(u => u.id === userId);
    if (match) {
      setCurrentUser(match);
      logAction('Đăng nhập (Test)', `Chuyển sang tài khoản nhân viên: ${match.fullName} (${match.role})`);
    }
  };

  const handleAddStaff = (fullName: string, username: string, phone: string, email: string, role: UserRole, avatar?: string): User => {
    const newStaff: User = {
      id: `U${String(users.length + 1).padStart(3, '0')}_${Date.now()}`,
      fullName,
      username,
      phone,
      email,
      role,
      active: true,
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
    };
    setUsers(prev => [...prev, newStaff]);
    logAction('Thêm nhân viên', `Tạo tài khoản nhân viên mới: ${fullName} (${role})`);
    return newStaff;
  };

  const handleUpdateStaff = (userId: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextUser = { ...u, ...updatedData };
        if (currentUser.id === userId) {
          setCurrentUser(nextUser);
        }
        return nextUser;
      }
      return u;
    }));
    logAction('Cập nhật nhân viên', `Cập nhật thông tin tài khoản nhân viên ID: ${userId}`);
  };

  const handleDeleteStaff = (userId: string) => {
    if (userId === currentUser.id) {
      showAlert('Không thể tự xóa tài khoản của chính mình đang đăng nhập!', 'error');
      return;
    }
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.role === UserRole.ADMIN) {
      const otherAdmins = users.filter(u => u.role === UserRole.ADMIN && u.id !== userId);
      if (otherAdmins.length === 0) {
        showAlert('Hệ thống phải có ít nhất 1 tài khoản Quản trị viên (ADMIN)!', 'error');
        return;
      }
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    logAction('Xóa nhân viên', `Xóa vĩnh viễn tài khoản nhân viên: ${userToDelete.fullName}`);
    showAlert('Xóa tài khoản nhân viên thành công!', 'success');
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setProducts(prev => prev.filter(p => p.id !== productId));
    logAction('Xóa sản phẩm', `Xóa vĩnh viễn sản phẩm: ${product.name} (${product.code})`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Set linked products categoryId to empty string
    setProducts(prev => prev.map(p => p.categoryId === categoryId ? { ...p, categoryId: '' } : p));
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    logAction('Xóa danh mục', `Xóa ngành hàng/danh mục: ${category.name}`);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    logAction('Xóa nhà cung cấp', `Xóa đối tác cung cấp hàng: ${supplier.name}`);
  };

  const handleDeletePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    // 1. Revert stocks (decrement products stock by imported quantity)
    setProducts(prev => prev.map(p => {
      const matchItem = po.items.find(item => item.productId === p.id);
      if (matchItem) {
        return { ...p, stock: Math.max(0, p.stock - matchItem.quantity) };
      }
      return p;
    }));

    // 2. If paymentMethod is DEBT, revert Supplier debt
    if (po.paymentMethod === 'DEBT') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === po.supplierId) {
          const nextDebt = Math.max(0, s.debtToSupplier - po.totalAmount);
          return { ...s, debtToSupplier: nextDebt };
        }
        return s;
      }));
      // Remove corresponding debt transactions
      setDebtTransactions(prev => prev.filter(tx => !(tx.partnerId === po.supplierId && tx.note.includes(po.code))));
    }

    setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
    logAction('Xóa phiếu nhập kho', `Xóa phiếu nhập hàng ${po.code} trị giá ${new Intl.NumberFormat('vi-VN').format(po.totalAmount)}đ (đã khôi phục số lượng tồn kho)`);
  };

  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 1. Revert stocks (increment product stock by sold quantity)
    setProducts(prev => prev.map(p => {
      const matchItem = order.items.find(item => item.productId === p.id);
      if (matchItem) {
        return { ...p, stock: p.stock + matchItem.quantity };
      }
      return p;
    }));

    // 2. If paymentMethod is DEBT and customer exists, revert Customer debt
    if (order.paymentMethod === 'DEBT' && order.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === order.customerId) {
          const nextDebt = Math.max(0, c.debt - order.finalAmount);
          return { ...c, debt: nextDebt };
        }
        return c;
      }));
      // Remove corresponding debt transactions
      setDebtTransactions(prev => prev.filter(tx => !(tx.partnerId === order.customerId && tx.note.includes(order.code))));
    }

    setOrders(prev => prev.filter(o => o.id !== orderId));
    logAction('Hủy đơn hàng POS', `Xóa đơn hàng bán POS ${order.code} trị giá ${new Intl.NumberFormat('vi-VN').format(order.finalAmount)}đ (đã hoàn trả tồn kho và thu hồi công nợ nếu có)`);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    if (customerId === 'CUST001') {
      if (showAlert) {
        showAlert('Không thể xóa khách hàng mặc định "Khách lẻ vãng lai"!', 'error');
      } else {
        alert('Không thể xóa khách hàng mặc định "Khách lẻ vãng lai"!');
      }
      return;
    }
    
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    // Also remove their debt transactions
    setDebtTransactions(prev => prev.filter(tx => tx.partnerId !== customerId));
    logAction('Xóa khách hàng', `Xóa khách hàng '${customer.name}' cùng toàn bộ lịch sử nợ liên quan`);
  };

  const handleDeleteDebtTransaction = (transactionId: string) => {
    const tx = debtTransactions.find(t => t.id === transactionId);
    if (!tx) return;

    // Revert the partner's debt!
    if (tx.partnerType === 'CUSTOMER') {
      setCustomers(prev => prev.map(c => {
        if (c.id === tx.partnerId) {
          const nextDebt = Math.max(0, c.debt - tx.amount);
          return { ...c, debt: nextDebt };
        }
        return c;
      }));
    } else if (tx.partnerType === 'SUPPLIER') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === tx.partnerId) {
          const nextDebt = Math.max(0, s.debtToSupplier - tx.amount);
          return { ...s, debtToSupplier: nextDebt };
        }
        return s;
      }));
    }

    setDebtTransactions(prev => prev.filter(t => t.id !== transactionId));
    logAction('Xóa giao dịch nợ', `Xóa giao dịch công nợ '${tx.note}' của ${tx.partnerType === 'CUSTOMER' ? 'khách hàng' : 'nhà cung cấp'} ${tx.partnerName} trị giá ${new Intl.NumberFormat('vi-VN').format(Math.abs(tx.amount))}đ (đã hoàn trả số dư nợ tương ứng)`);
  };

  const handleUpdateStoreConfig = (newConfig: StoreConfig) => {
    setStoreConfig(newConfig);
    logAction('Cập nhật cửa hàng', `Thay đổi thông tin cửa hàng thành '${newConfig.name}' và cấu hình hóa đơn`);
  };

  const handleClearLogs = () => {
    const initialLog: ActivityLog = {
      id: 'LOG_INIT',
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      action: 'Dọn dẹp log',
      details: 'Làm trống nhật ký hành vi hệ thống thành công',
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs([initialLog]);
  };

  const handleWipeAllData = () => {
    setProducts([]);
    setCategories([]);
    setCustomers([]);
    setSuppliers([]);
    setOrders([]);
    setPurchaseOrders([]);
    setDebtTransactions([]);
    
    const wipeLog: ActivityLog = {
      id: `LOG_${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      action: 'Xóa sạch dữ liệu',
      details: 'Thực hiện xóa sạch toàn bộ dữ liệu hệ thống bao gồm sản phẩm, ngành hàng, đơn hàng, khách hàng, nhà cung cấp và công nợ',
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs([wipeLog]);
  };

  // Nav definitions
  const NAV_ITEMS = [
    { id: 'DASHBOARD', name: 'Dashboard Overview', icon: LayoutDashboard, roles: ['ADMIN', 'SELLER', 'STOCKKEEPER'] },
    { id: 'POS', name: 'Màn Hình POS Bán Hàng', icon: MonitorPlay, roles: ['ADMIN', 'SELLER'] },
    { id: 'ORDERS', name: 'Quản Lý Đơn Hàng', icon: Receipt, roles: ['ADMIN', 'SELLER'] },
    { id: 'PRODUCTS', name: 'Sản Phẩm & Danh Mục', icon: PackageCheck, roles: ['ADMIN', 'STOCKKEEPER'] },
    { id: 'INVENTORY', name: 'Kho & Nhập Hàng', icon: Forklift, roles: ['ADMIN', 'STOCKKEEPER'] },
    { id: 'CUSTOMERS', name: 'Quản Lý Khách Hàng', icon: UserCheck2, roles: ['ADMIN', 'SELLER', 'STOCKKEEPER'] },
    { id: 'REPORT', name: 'Báo Cáo Thống Kê', icon: TrendingUp, roles: ['ADMIN', 'SELLER', 'STOCKKEEPER'] },
    { id: 'STAFF', name: 'Nhân Viên & Quyền', icon: Lock, roles: ['ADMIN'] },
    { id: 'SYSTEM', name: 'Nhật Ký & Sao Lưu', icon: Activity, roles: ['ADMIN'] },
    { id: 'PHP_CODE', name: 'IDE Mã Nguồn PHP 8.3', icon: FileCode2, roles: ['ADMIN', 'SELLER', 'STOCKKEEPER'] }
  ];

  const visibleNavs = NAV_ITEMS.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 text-slate-300">
        {/* Brand Banner logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-950">
          <Compass className="w-6 h-6 text-sky-400" />
          <h1 className="font-extrabold text-base tracking-wider text-white">SALESFLOW POS</h1>
        </div>

        {/* User simple info card */}
        <div className="p-4 mx-4 my-3 bg-slate-800/40 rounded-2xl border border-slate-800/50 flex items-center gap-3">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={currentUser.fullName}
            className="w-9 h-9 rounded-full object-cover bg-slate-700"
          />
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-white truncate">{currentUser.fullName}</h5>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block mt-0.5 w-fit">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Links section */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {visibleNavs.map((item) => {
            const Icon = item.icon;
            const isSelected = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10'
                    : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer simple mark */}
        <div className="p-4 text-[10px] text-slate-500 border-t border-slate-850 text-center font-mono">
          SalesFlow PHP POS v2.0
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER CONTROLS */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-semibold font-mono bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
              <CalendarDays className="w-4 h-4 text-sky-500" />
              <span>{currentTime || 'Đang tải lịch...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>Online Terminal</span>
            </span>

            {/* Simple Account Status summary */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-extrabold text-slate-800 block leading-tight">{currentUser.fullName}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{currentUser.role}</span>
              </div>
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-full object-cover bg-slate-100"
              />
            </div>
          </div>
        </header>

        {/* CONTAINER SCROLL VIEW */}
        <main className="flex-1 overflow-y-auto p-6 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {currentView === 'DASHBOARD' && (
                <DashboardView
                  products={products}
                  orders={orders}
                  customers={customers}
                  suppliers={suppliers}
                  logs={logs}
                  onNavigate={(view) => setCurrentView(view)}
                  onDeleteOrder={handleDeleteOrder}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'POS' && (
                <POSView
                  products={products}
                  categories={categories}
                  customers={customers}
                  currentUser={currentUser}
                  storeConfig={storeConfig}
                  onAddCustomer={handleAddCustomer}
                  onCreateOrder={handleCreateOrder}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'ORDERS' && (
                <OrderManagementView
                  orders={orders}
                  products={products}
                  storeConfig={storeConfig}
                  onDeleteOrder={handleDeleteOrder}
                  onNavigateToPOS={() => setCurrentView('POS')}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'PRODUCTS' && (
                <DirectoryView
                  products={products}
                  categories={categories}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteProduct={handleDeleteProduct}
                  onDeleteCategory={handleDeleteCategory}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'INVENTORY' && (
                <InventoryView
                  products={products}
                  suppliers={suppliers}
                  purchaseOrders={purchaseOrders}
                  categories={categories}
                  onAddSupplier={handleAddSupplier}
                  onPaySupplierDebt={handlePaySupplierDebt}
                  onImportGoods={handleImportGoods}
                  onDeleteSupplier={handleDeleteSupplier}
                  onDeletePurchaseOrder={handleDeletePurchaseOrder}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'CUSTOMERS' && (
                <CustomerView
                  customers={customers}
                  debtTransactions={debtTransactions}
                  onAddCustomer={handleAddCustomer}
                  onCollectDebt={handleCollectDebt}
                  onDeleteCustomer={handleDeleteCustomer}
                  onDeleteDebtTransaction={handleDeleteDebtTransaction}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'STAFF' && (
                <StaffView
                  users={users}
                  currentUser={currentUser}
                  onSwitchUser={handleSwitchUser}
                  onAddStaff={handleAddStaff}
                  onUpdateStaff={handleUpdateStaff}
                  onDeleteStaff={handleDeleteStaff}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'SYSTEM' && (
                <SystemView
                  logs={logs}
                  products={products}
                  categories={categories}
                  customers={customers}
                  suppliers={suppliers}
                  storeConfig={storeConfig}
                  onUpdateStoreConfig={handleUpdateStoreConfig}
                  onClearLogs={handleClearLogs}
                  onWipeAllData={handleWipeAllData}
                  onShowConfirm={showConfirm}
                  onShowAlert={showAlert}
                />
              )}

              {currentView === 'REPORT' && (
                <ReportView
                  products={products}
                  orders={orders}
                  categories={categories}
                />
              )}

              {currentView === 'PHP_CODE' && <PHPCodeExplorer />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. MOBILE MENU SIDEBAR DRAWER OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-full max-w-xs bg-slate-900 text-slate-300 shadow-xl"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 text-white">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-sky-400" />
                  <span className="font-extrabold tracking-wider">SALESFLOW POS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 mx-4 my-3 bg-slate-800/40 rounded-xl border border-slate-800/50 flex items-center gap-3 text-xs">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={currentUser.fullName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h5 className="font-bold text-white">{currentUser.fullName}</h5>
                  <span className="text-[9px] bg-sky-500/10 text-sky-400 font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <nav className="flex-1 px-4 py-2 space-y-1">
                {visibleNavs.map((item) => {
                  const Icon = item.icon;
                  const isSelected = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                        isSelected
                          ? 'bg-sky-600 text-white'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 text-[10px] text-slate-500 text-center font-mono">
                SalesFlow PHP POS v2.0
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CUSTOM CONFIRM MODAL */}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Xác nhận yêu cầu</h3>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">{confirmState.message}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    confirmState.onConfirm();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-600/15 cursor-pointer"
                >
                  Đồng ý thực hiện
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CUSTOM TOAST/ALERT ALERT */}
      <AnimatePresence>
        {alertState.isOpen && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] p-4 w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`rounded-2xl shadow-xl border p-4 flex items-start gap-3 ${
                alertState.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : alertState.type === 'error'
                    ? 'bg-rose-50 border-rose-100 text-rose-800'
                    : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}
            >
              <div className="shrink-0">
                {alertState.type === 'success' && <Check className="w-5 h-5 text-emerald-500" />}
                {alertState.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 animate-bounce" />}
                {alertState.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-relaxed">{alertState.message}</p>
              </div>
              <button 
                onClick={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

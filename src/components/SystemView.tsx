import React, { useState, useRef } from 'react';
import { Product, Category, Customer, Supplier, ActivityLog, StoreConfig, Order, PurchaseOrder, DebtTransaction } from '../types';
import { ClipboardList, Database, Save, Check, RefreshCw, Eye, Download, Info, Trash2, Store, Upload, Smartphone, Monitor, Cloud, Link, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { uploadToFirebaseSync, downloadFromFirebaseSync } from '../lib/firebase';

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
  orders: Order[];
  purchaseOrders: PurchaseOrder[];
  debtTransactions: DebtTransaction[];
  onUpdateStoreConfig: (config: StoreConfig) => void;
  onClearLogs: () => void;
  onWipeAllData: () => void;
  onImportSqlData?: (data: {
    categories?: Category[];
    products?: Product[];
    customers?: Customer[];
    suppliers?: Supplier[];
    append?: boolean;
  }) => void;
  onApplyCloudSync?: (payload: {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    suppliers: Supplier[];
    orders: Order[];
    purchaseOrders: PurchaseOrder[];
    debtTransactions: DebtTransaction[];
    logs: ActivityLog[];
    storeConfig: StoreConfig;
  }) => void;
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
  orders,
  purchaseOrders,
  debtTransactions,
  onUpdateStoreConfig,
  onClearLogs,
  onWipeAllData,
  onImportSqlData,
  onApplyCloudSync,
  onShowConfirm,
  onShowAlert
}: SystemViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'LOGS' | 'BACKUP' | 'STORE_CONFIG' | 'SYNC'>('LOGS');

  // Cloud Sync States
  const [syncCode, setSyncCode] = useState<string>(() => localStorage.getItem('sf_sync_code') || '');
  const [inputSyncCode, setInputSyncCode] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => localStorage.getItem('sf_last_synced_time') || '');
  const [autoSync, setAutoSync] = useState<boolean>(() => localStorage.getItem('sf_auto_sync') === 'true');
  const [syncProvider, setSyncProvider] = useState<'API' | 'FIREBASE'>(() => (localStorage.getItem('sf_sync_provider') as any) || 'FIREBASE');

  // SQL Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sqlFileName, setSqlFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<{
    categories: Category[];
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
  } | null>(null);

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

  const parseSqlValueList = (valuesStr: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inString = false;
    let quoteChar = '';
    let i = 0;
    while (i < valuesStr.length) {
      const char = valuesStr[i];
      if (inString) {
        if (char === quoteChar) {
          if (valuesStr[i + 1] === quoteChar) {
            current += quoteChar;
            i += 2;
          } else {
            inString = false;
            quoteChar = '';
            i++;
          }
        } else if (char === '\\' && (valuesStr[i + 1] === "'" || valuesStr[i + 1] === '"')) {
          current += valuesStr[i + 1];
          i += 2;
        } else {
          current += char;
          i++;
        }
      } else {
        if (char === "'" || char === '"') {
          inString = true;
          quoteChar = char;
          i++;
        } else if (char === ',') {
          values.push(current.trim());
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
    }
    values.push(current.trim());
    return values;
  };

  const handleSqlFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSqlFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          if (onShowAlert) onShowAlert('File SQL trống rỗng!', 'warning');
          return;
        }

        const lines = text.split('\n');
        const importedCategories: Category[] = [];
        const importedProducts: Product[] = [];
        const importedCustomers: Customer[] = [];
        const importedSuppliers: Supplier[] = [];

        for (let rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith('--') || line.startsWith('/*')) continue;

          const valuesIndex = line.toUpperCase().indexOf('VALUES');
          if (valuesIndex === -1) continue;

          const tableAndCols = line.substring(0, valuesIndex).trim();
          const valuesPart = line.substring(valuesIndex + 6).trim();

          const tableMatch = tableAndCols.match(/INSERT\s+INTO\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)/i);
          if (!tableMatch) continue;

          const tableName = tableMatch[1].toLowerCase();
          const columns = tableMatch[2].split(',').map(c => c.trim().replace(/[`"']/g, ''));

          let valStr = valuesPart;
          if (valStr.startsWith('(')) {
            valStr = valStr.substring(1);
          }
          if (valStr.endsWith(');')) {
            valStr = valStr.substring(0, valStr.length - 2);
          } else if (valStr.endsWith(')')) {
            valStr = valStr.substring(0, valStr.length - 1);
          }

          const values = parseSqlValueList(valStr);
          const rowData: Record<string, string> = {};
          columns.forEach((col, idx) => {
            rowData[col] = values[idx] !== undefined ? values[idx] : '';
          });

          // Unescape doubled single quotes
          const unescapeValue = (val: string): string => {
            if (!val) return '';
            return val.replace(/''/g, "'");
          };

          if (tableName === 'categories') {
            const id = unescapeValue(rowData['id']) || `CAT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            const name = unescapeValue(rowData['name']);
            const description = unescapeValue(rowData['description']);
            if (name) {
              importedCategories.push({ id, name, description, productCount: 0 });
            }
          } else if (tableName === 'products') {
            const id = unescapeValue(rowData['id']) || `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            const code = unescapeValue(rowData['code']);
            const name = unescapeValue(rowData['name']);
            const categoryId = unescapeValue(rowData['category_id']);
            const importPrice = parseFloat(rowData['import_price']) || 0;
            const price = parseFloat(rowData['price']) || 0;
            const wholesalePrice = parseFloat(rowData['wholesale_price'] || rowData['price']) || price;
            const stock = parseInt(rowData['stock']) || 0;
            const minStock = unescapeValue(rowData['min_stock']) || '10';
            const unit = unescapeValue(rowData['unit']) || 'Gói';
            const image = unescapeValue(rowData['image']) || '';
            const active = rowData['status'] !== '0';

            if (name) {
              importedProducts.push({
                id,
                code,
                name,
                categoryId,
                importPrice,
                price,
                wholesalePrice,
                stock,
                minStock,
                unit,
                image,
                active
              });
            }
          } else if (tableName === 'customers') {
            const id = unescapeValue(rowData['id']) || `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            const name = unescapeValue(rowData['name']);
            const phone = unescapeValue(rowData['phone']);
            const email = unescapeValue(rowData['email']);
            const address = unescapeValue(rowData['address']);
            const debt = parseFloat(rowData['debt']) || 0;
            const maxDebtLimit = parseFloat(rowData['max_debt_limit']) || 5000000;
            const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

            if (name) {
              importedCustomers.push({
                id,
                name,
                phone,
                email,
                address,
                debt,
                maxDebtLimit,
                createdAt
              });
            }
          } else if (tableName === 'suppliers') {
            const id = unescapeValue(rowData['id']) || `SUP_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            const name = unescapeValue(rowData['name']);
            const phone = unescapeValue(rowData['phone']);
            const email = unescapeValue(rowData['email']);
            const address = unescapeValue(rowData['address']);
            const debtToSupplier = parseFloat(rowData['debt_to']) || 0;
            const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

            if (name) {
              importedSuppliers.push({
                id,
                name,
                phone,
                email,
                address,
                debtToSupplier,
                createdAt
              });
            }
          }
        }

        if (
          importedCategories.length === 0 &&
          importedProducts.length === 0 &&
          importedCustomers.length === 0 &&
          importedSuppliers.length === 0
        ) {
          if (onShowAlert) {
            onShowAlert('Không tìm thấy bản ghi INSERT hợp lệ cho categories, products, customers hoặc suppliers trong file SQL!', 'warning');
          }
          setParsedData(null);
          setSqlFileName('');
          return;
        }

        setParsedData({
          categories: importedCategories,
          products: importedProducts,
          customers: importedCustomers,
          suppliers: importedSuppliers
        });

        if (onShowAlert) {
          onShowAlert(`Phân tích thành công! Tìm thấy: ${importedCategories.length} ngành hàng, ${importedProducts.length} hàng hóa, ${importedCustomers.length} khách hàng, ${importedSuppliers.length} nhà cung cấp.`, 'success');
        }
      } catch (err) {
        console.error(err);
        if (onShowAlert) onShowAlert('Có lỗi xảy ra khi đọc file SQL!', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = (append: boolean) => {
    if (!parsedData) return;
    if (onImportSqlData) {
      onImportSqlData({
        ...parsedData,
        append
      });
    }
    // Clear state
    setParsedData(null);
    setSqlFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelImport = () => {
    setParsedData(null);
    setSqlFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSync = async (silent = false) => {
    setIsSyncing(true);
    try {
      const payload = {
        products,
        categories,
        customers,
        suppliers,
        orders,
        purchaseOrders,
        debtTransactions,
        logs,
        storeConfig
      };

      if (syncProvider === 'FIREBASE') {
        const result = await uploadToFirebaseSync(syncCode || null, payload);
        if (result.success) {
          setSyncCode(result.code);
          localStorage.setItem('sf_sync_code', result.code);
          const timeStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
          setLastSyncedTime(timeStr);
          localStorage.setItem('sf_last_synced_time', timeStr);
          if (!silent && onShowAlert) {
            onShowAlert(`Đồng bộ dữ liệu lên Firebase Cloud thành công! Mã kết nối của bạn là: ${result.code}`, 'success');
          }
        } else {
          if (!silent && onShowAlert) {
            onShowAlert(result.message || 'Lỗi đồng bộ dữ liệu qua Firebase!', 'error');
          }
        }
      } else {
        const res = await fetch('/api/sync/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: syncCode || null,
            data: payload
          })
        });

        const result = await res.json();
        if (result.success) {
          setSyncCode(result.code);
          localStorage.setItem('sf_sync_code', result.code);
          const timeStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
          setLastSyncedTime(timeStr);
          localStorage.setItem('sf_last_synced_time', timeStr);
          if (!silent && onShowAlert) {
            onShowAlert(`Đồng bộ dữ liệu lên máy chủ SalesFlow thành công! Mã kết nối của bạn là: ${result.code}`, 'success');
          }
        } else {
          if (!silent && onShowAlert) {
            onShowAlert(result.message || 'Lỗi đồng bộ dữ liệu!', 'error');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (!silent && onShowAlert) {
        onShowAlert('Không thể kết nối đến máy chủ đồng bộ!', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadSync = async (codeToDownload: string) => {
    const targetCode = codeToDownload.trim();
    if (!targetCode) {
      if (onShowAlert) onShowAlert('Vui lòng nhập mã đồng bộ gồm 6 chữ số!', 'warning');
      return;
    }

    setIsSyncing(true);
    try {
      let result: any;
      if (syncProvider === 'FIREBASE') {
        result = await downloadFromFirebaseSync(targetCode);
      } else {
        const res = await fetch(`/api/sync/download/${targetCode}`);
        const parsed = await res.json();
        result = parsed;
      }

      if (result.success) {
        const proceed = () => {
          if (onApplyCloudSync && result.data) {
            onApplyCloudSync(result.data);
            setSyncCode(targetCode);
            localStorage.setItem('sf_sync_code', targetCode);
            const timeStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
            setLastSyncedTime(timeStr);
            localStorage.setItem('sf_last_synced_time', timeStr);
            if (onShowAlert) {
              onShowAlert(`Tải và đồng bộ dữ liệu thành công từ ${syncProvider === 'FIREBASE' ? 'Firebase Cloud' : 'máy chủ SalesFlow'}! Thiết bị đã được kết nối.`, 'success');
            }
          }
        };

        const confirmMsg = `Bạn có chắc chắn muốn TẢI và ĐÈ dữ liệu từ mã ${targetCode}? Dữ liệu hiện tại trên thiết bị này sẽ bị thay thế hoàn toàn!`;
        if (onShowConfirm) {
          onShowConfirm(confirmMsg, proceed);
        } else if (window.confirm(confirmMsg)) {
          proceed();
        }
      } else {
        if (onShowAlert) {
          onShowAlert(result.message || 'Lỗi tải dữ liệu!', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (onShowAlert) {
        onShowAlert('Không thể kết nối đến máy chủ đồng bộ!', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectSync = () => {
    const proceed = () => {
      setSyncCode('');
      setInputSyncCode('');
      setLastSyncedTime('');
      localStorage.removeItem('sf_sync_code');
      localStorage.removeItem('sf_last_synced_time');
      if (onShowAlert) onShowAlert('Đã hủy kết nối đồng bộ thiết bị!', 'success');
    };

    const confirmMsg = "Bạn có chắc chắn muốn ngắt kết nối đồng bộ đám mây trên thiết bị này?";
    if (onShowConfirm) {
      onShowConfirm(confirmMsg, proceed);
    } else if (window.confirm(confirmMsg)) {
      proceed();
    }
  };

  const handleSetSyncProvider = (provider: 'API' | 'FIREBASE') => {
    setSyncProvider(provider);
    localStorage.setItem('sf_sync_provider', provider);
    setSyncCode('');
    setInputSyncCode('');
    setLastSyncedTime('');
    localStorage.removeItem('sf_sync_code');
    localStorage.removeItem('sf_last_synced_time');
    if (onShowAlert) {
      onShowAlert(`Đã chuyển sang đồng bộ qua ${provider === 'FIREBASE' ? 'Firebase Firestore Cloud' : 'Máy chủ SalesFlow'}. Vui lòng bấm kích hoạt để tạo mã mới cho phương thức này!`, 'success');
    }
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('sf_auto_sync', checked ? 'true' : 'false');
    if (onShowAlert) {
      onShowAlert(checked ? 'Đã bật chế độ tự động đồng bộ!' : 'Đã tắt chế độ tự động đồng bộ!', 'success');
    }
  };

  // Auto Sync loop when state changes or periodically
  React.useEffect(() => {
    if (!autoSync || !syncCode) return;
    const interval = setInterval(() => {
      handleUploadSync(true); // silent sync
    }, 25000);

    return () => clearInterval(interval);
  }, [autoSync, syncCode, syncProvider, products, categories, customers, suppliers, orders, purchaseOrders, debtTransactions, logs, storeConfig]);

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
        <button
          onClick={() => setActiveSettingsTab('SYNC')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSettingsTab === 'SYNC'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-emerald-600" />
          <span>Đồng Bộ Thiết Bị (Máy Tính & Điện Thoại)</span>
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

            {/* Action Card Importer */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div>
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl w-fit mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-1 font-sans">Nạp Dữ Liệu từ File SQL</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Nhập dữ liệu nhanh bằng cách chọn file <code>.sql</code> đã sao lưu. Hệ thống hỗ trợ nạp Ngành hàng, Sản phẩm, Khách hàng, và Nhà cung cấp.
                </p>
              </div>

              {!parsedData ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSqlFileImport}
                    accept=".sql"
                    className="hidden"
                    id="sql-import-input"
                  />
                  <label
                    htmlFor="sql-import-input"
                    className="w-full py-3 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer border border-dashed border-slate-300"
                  >
                    <Upload className="w-4 h-4" />
                    <span>CHỌN FILE BACKUP (.SQL)</span>
                  </label>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-700 text-xs truncate max-w-[150px]">{sqlFileName}</span>
                    <button
                      onClick={handleCancelImport}
                      className="text-slate-400 hover:text-slate-600 font-semibold text-[10px] uppercase cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex justify-between p-1.5 bg-white rounded border border-slate-100">
                      <span>Ngành hàng:</span>
                      <strong className="text-slate-800">{parsedData.categories.length}</strong>
                    </div>
                    <div className="flex justify-between p-1.5 bg-white rounded border border-slate-100">
                      <span>Sản phẩm:</span>
                      <strong className="text-slate-800">{parsedData.products.length}</strong>
                    </div>
                    <div className="flex justify-between p-1.5 bg-white rounded border border-slate-100">
                      <span>Khách hàng:</span>
                      <strong className="text-slate-800">{parsedData.customers.length}</strong>
                    </div>
                    <div className="flex justify-between p-1.5 bg-white rounded border border-slate-100">
                      <span>NCC:</span>
                      <strong className="text-slate-800">{parsedData.suppliers.length}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApplyImport(true)}
                      className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow transition cursor-pointer"
                      title="Chỉ thêm bản ghi mới, không xóa bản ghi hiện tại"
                    >
                      Trộn thêm
                    </button>
                    <button
                      onClick={() => {
                        const confirmMsg = "Bạn có chắc chắn muốn GHI ĐÈ toàn bộ dữ liệu? Toàn bộ danh mục, sản phẩm, khách hàng, nhà cung cấp cũ sẽ bị xóa sạch!";
                        const proceed = () => handleApplyImport(false);
                        if (onShowConfirm) {
                          onShowConfirm(confirmMsg, proceed);
                        } else if (window.confirm(confirmMsg)) {
                          proceed();
                        }
                      }}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg shadow transition cursor-pointer"
                      title="Xóa toàn bộ dữ liệu cũ và ghi đè"
                    >
                      Ghi đè tất cả
                    </button>
                  </div>
                </div>
              )}
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

      {/* VIEW: DEVICE & CLOUD SYNCHRONIZATION */}
      {activeSettingsTab === 'SYNC' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-100 p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Cloud className="w-5 h-5" />
                </span>
                <h4 className="font-bold text-slate-800 text-base">Đồng bộ Cloud (Máy tính & Điện thoại)</h4>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-3xl">
                Lưu trữ và đồng bộ hóa tức thì toàn bộ hàng hóa, khách hàng, nhà cung cấp, hóa đơn và doanh thu giữa máy tính, laptop, máy tính bảng và điện thoại di động của bạn hoàn toàn miễn phí.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span>{syncProvider === 'FIREBASE' ? 'Firebase Realtime Sync' : 'SalesFlow Sync API'}</span>
            </div>
          </div>

          {/* PROVIDER SELECTION */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="space-y-0.5">
              <h5 className="font-bold text-slate-800 text-xs">Phương thức kết nối lưu trữ</h5>
              <p className="text-slate-400 text-[10px]">Chọn nền tảng đám mây bạn muốn dùng để chuyển dữ liệu</p>
            </div>
            <div className="flex gap-2 bg-slate-200 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => handleSetSyncProvider('FIREBASE')}
                className={`flex-1 md:flex-initial px-4 py-2 text-[11px] font-bold rounded-lg transition ${
                  syncProvider === 'FIREBASE'
                    ? 'bg-white text-emerald-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                🔥 Firebase Firestore
              </button>
              <button
                onClick={() => handleSetSyncProvider('API')}
                className={`flex-1 md:flex-initial px-4 py-2 text-[11px] font-bold rounded-lg transition ${
                  syncProvider === 'API'
                    ? 'bg-white text-sky-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                💻 SalesFlow API
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: CURRENT DEVICE CONNECTION */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm mb-1">Thiết bị hiện tại</h5>
                  <p className="text-slate-400 text-[11px]">Trạng thái liên kết đám mây của thiết bị này</p>
                </div>
                {syncCode ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-100 flex items-center gap-1">
                    <Check className="w-3 h-3" /> ĐÃ LIÊN KẾT
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-full">
                    ĐỘC LẬP (OFFLINE)
                  </span>
                )}
              </div>

              {syncCode ? (
                <div className="space-y-5">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center space-y-3">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">MÃ ĐỒNG BỘ THIẾT BỊ</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-3xl font-black text-slate-800 tracking-wider bg-white px-5 py-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                        {syncCode.slice(0, 3)} {syncCode.slice(3)}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(syncCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-3 bg-white text-slate-500 hover:text-sky-600 border border-slate-200 rounded-xl hover:shadow transition"
                        title="Sao chép mã đồng bộ"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed max-w-xs mx-auto">
                      Nhập mã này trên điện thoại hoặc thiết bị khác để kéo dữ liệu của cửa hàng này về.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Đồng bộ tự động:</span>
                      <button
                        onClick={() => handleToggleAutoSync(!autoSync)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          autoSync ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            autoSync ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Lần đồng bộ cuối:</span>
                      <strong className="text-slate-700 font-mono">{lastSyncedTime || 'Chưa thực hiện'}</strong>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUploadSync(false)}
                      disabled={isSyncing}
                      className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ lên Cloud'}</span>
                    </button>
                    <button
                      onClick={handleDisconnectSync}
                      className="px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-xl transition"
                    >
                      Hủy liên kết
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-center space-y-3">
                    <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <h6 className="font-bold text-slate-800 text-xs">Kích hoạt kết nối và tạo mã đồng bộ mới</h6>
                    <p className="text-slate-500 text-[10px] leading-relaxed">
                      Thiết bị này đang hoạt động offline cục bộ. Nhấp nút bên dưới để tải dữ liệu của bạn lên máy chủ đồng bộ bảo mật và tạo mã kết nối gồm 6 số.
                    </p>
                  </div>
                  <button
                    onClick={() => handleUploadSync(false)}
                    disabled={isSyncing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                  >
                    <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang kích hoạt...' : 'Bắt đầu đồng bộ & Tạo mã'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: LINK OTHER DEVICES */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm mb-1 font-sans">Liên kết thiết bị còn lại (Máy tính / Điện thoại khác)</h5>
                  <p className="text-slate-400 text-[11px]">Nhập mã kết nối từ thiết bị khác để gộp hoặc tải dữ liệu về máy này</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">MÃ ĐỒNG BỘ 6 SỐ</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Nhập 6 chữ số (Ví dụ: 123456)"
                      value={inputSyncCode}
                      onChange={(e) => setInputSyncCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-500 focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-bold tracking-widest text-center"
                    />
                  </div>
                  <button
                    onClick={() => handleDownloadSync(inputSyncCode)}
                    disabled={isSyncing || inputSyncCode.length < 6}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    <span>{isSyncing ? 'Đang kết nối...' : 'Liên kết & Tải dữ liệu về'}</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                  <div className="flex gap-2 items-start text-[10px] text-slate-400">
                    <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 leading-relaxed text-slate-500">
                      <span className="font-bold text-slate-700">Hướng dẫn liên kết nhanh:</span>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Trên máy có sẵn dữ liệu của bạn, bấm <strong className="text-slate-700">"Bắt đầu đồng bộ"</strong> ở ô bên trái để lấy mã 6 số.</li>
                        <li>Trên điện thoại hoặc máy tính mới, truy cập mục này, nhập mã 6 số đó vào ô phía trên.</li>
                        <li>Bấm <strong className="text-slate-700">"Liên kết & Tải dữ liệu về"</strong> để kéo dữ liệu về máy này.</li>
                        <li>Bật công tắc <strong className="text-slate-700">"Đồng bộ tự động"</strong> để bất kỳ thao tác bán hàng, nhập kho nào ở cả 2 thiết bị đều tự động cập nhật cho nhau.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 text-slate-400 text-[10px] pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Máy tính (PC/Laptop)</span>
                </div>
                <div className="text-slate-200">|</div>
                <div className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Điện thoại (iOS/Android)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


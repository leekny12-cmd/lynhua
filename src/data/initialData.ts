import { User, UserRole, Category, Product, Customer, Supplier, Order, PurchaseOrder, DebtTransaction, ActivityLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'U001',
    username: 'admin',
    fullName: 'Lê Hoàng Minh',
    role: UserRole.ADMIN,
    phone: '0988123456',
    email: 'minhlh.admin@salesflow.vn',
    active: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'U002',
    username: 'seller_thuy',
    fullName: 'Nguyễn Thị Thuỷ',
    role: UserRole.SELLER,
    phone: '0977234567',
    email: 'thuynnt.seller@salesflow.vn',
    active: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'U003',
    username: 'keeper_dung',
    fullName: 'Trần Anh Dũng',
    role: UserRole.STOCKKEEPER,
    phone: '0966345678',
    email: 'dungta.keeper@salesflow.vn',
    active: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'CAT001', name: 'Đồ uống & Cà phê', description: 'Các loại hạt cà phê nguyên chất, đồ uống đóng chai và pha chế', productCount: 4 },
  { id: 'CAT002', name: 'Gia vị & Thực phẩm khô', description: 'Dầu ăn, hạt nêm, mỳ gói, nước tương chất lượng cao', productCount: 3 },
  { id: 'CAT003', name: 'Sữa & Bánh kẹo', description: 'Sữa đặc, sữa tươi, bánh ngọt các loại nhập khẩu', productCount: 2 },
  { id: 'CAT004', name: 'Hóa mỹ phẩm & Đồ gia dụng', description: 'Nước giặt, nước rửa chén, khăn giấy và đồ dùng vệ sinh', productCount: 2 }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PROD001',
    code: '8934563138012',
    name: 'Cà phê Robusta Đắk Lắk (Gói 500g)',
    categoryId: 'CAT001',
    importPrice: 85000,
    price: 135000,
    wholesalePrice: 110000,
    stock: 45,
    minStock: '10',
    unit: 'Gói',
    active: true,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'PROD002',
    code: '8934673510023',
    name: 'Sữa đặc Ông Thọ Đỏ (Hộp 380g)',
    categoryId: 'CAT003',
    importPrice: 19500,
    price: 26000,
    wholesalePrice: 22000,
    stock: 120,
    minStock: '20',
    unit: 'Hộp',
    active: true,
    image: 'https://images.unsplash.com/photo-1528498033373-38d7a8ffd1a4?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'PROD003',
    code: '8934822011234',
    name: 'Trà Xanh Thái Nguyên Thượng Hạng',
    categoryId: 'CAT001',
    importPrice: 90000,
    price: 150000,
    wholesalePrice: 120000,
    stock: 28,
    minStock: '8',
    unit: 'Gói',
    active: true,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'PROD004',
    code: '8936011400215',
    name: 'Mỳ tôm Hảo Hảo Tôm Chua Cay',
    categoryId: 'CAT002',
    importPrice: 3100,
    price: 4500,
    wholesalePrice: 3800,
    stock: 350,
    minStock: '50',
    unit: 'Thùng',
    active: true,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'PROD005',
    code: '8934561210292',
    name: 'Dầu ăn Simply Đậu Nành 1L',
    categoryId: 'CAT002',
    importPrice: 42000,
    price: 54000,
    wholesalePrice: 48000,
    stock: 65,
    minStock: '15',
    unit: 'Chai',
    active: true,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'PROD006',
    code: '8935049100344',
    name: 'Nước rửa chén Sunlight Chanh 1.5kg',
    categoryId: 'CAT004',
    importPrice: 32000,
    price: 43500,
    wholesalePrice: 38000,
    stock: 8, // Trigger low stock!
    minStock: '15',
    unit: 'Túi',
    active: true,
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=200'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST001',
    name: 'Khách lẻ vãng lai',
    phone: '0999999999',
    email: 'khachle@salesflow.vn',
    address: 'Mua trực tiếp tại quầy',
    debt: 0,
    maxDebtLimit: 0,
    createdAt: '2026-05-15 08:30:00'
  },
  {
    id: 'CUST002',
    name: 'Nguyễn Văn Hải (Cà phê Góc Phố)',
    phone: '0912345678',
    email: 'haicafe@gmail.com',
    address: '45 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    debt: 3450000, // Dynamic debt
    maxDebtLimit: 10000000,
    createdAt: '2026-05-20 10:15:00'
  },
  {
    id: 'CUST003',
    name: 'Trần Thị Thu Hương',
    phone: '0905987654',
    email: 'huongtran@yahoo.com',
    address: '112 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    debt: 0,
    maxDebtLimit: 5000000,
    createdAt: '2026-06-01 14:22:00'
  },
  {
    id: 'CUST004',
    name: 'Phạm Hồng Thái (Đại lý Thái Minh)',
    phone: '0935112233',
    email: 'thaiminh.distrib@gmail.com',
    address: '789 Trường Chinh, Tân Bình, TP. Hồ Chí Minh',
    debt: 12400000, // Exceeds limit maybe? Or normal big buyer
    maxDebtLimit: 20000000,
    createdAt: '2026-06-10 09:00:00'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Tổng Kho Unilever Miền Nam',
    phone: '19001234',
    email: 'info@unilever-distributor.vn',
    address: 'KCN Tây Bắc Củ Chi, TP. Hồ Chí Minh',
    debtToSupplier: 15400000,
    createdAt: '2026-04-10 08:00:00'
  },
  {
    id: 'SUP002',
    name: 'Công ty Cổ phần sữa Vinamilk Việt Nam',
    phone: '02854155555',
    email: 'vinamilk@vinamilk.com.vn',
    address: '10 Tân Trào, Tân Phú, Quận 7, TP. HCM',
    debtToSupplier: 0,
    createdAt: '2026-04-12 09:30:00'
  },
  {
    id: 'SUP003',
    name: 'Nhà Phân Phối Masan Consumer',
    phone: '02862563862',
    email: 'masan.sales@masangroup.com',
    address: 'Tòa nhà Central Plaza, Lê Duẩn, Quận 1, TP. HCM',
    debtToSupplier: 8200000,
    createdAt: '2026-04-20 11:00:00'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD001',
    code: 'HD0001',
    customerId: 'CUST002',
    customerName: 'Nguyễn Văn Hải (Cà phê Góc Phố)',
    customerPhone: '0912345678',
    sellerId: 'U002',
    sellerName: 'Nguyễn Thị Thuỷ',
    items: [
      { productId: 'PROD001', productName: 'Cà phê Robusta Đắk Lắk (Gói 500g)', price: 135000, quantity: 10, unit: 'Gói' },
      { productId: 'PROD002', productName: 'Sữa đặc Ông Thọ Đỏ (Hộp 380g)', price: 26000, quantity: 24, unit: 'Hộp' }
    ],
    totalAmount: 1974000,
    discount: 50000,
    finalAmount: 1924000,
    paidAmount: 1924000,
    changeAmount: 0,
    paymentMethod: 'BANK_TRANSFER',
    createdAt: '2026-06-28 10:45:12'
  },
  {
    id: 'ORD002',
    code: 'HD0002',
    customerId: 'CUST001',
    customerName: 'Khách lẻ vãng lai',
    sellerId: 'U002',
    sellerName: 'Nguyễn Thị Thuỷ',
    items: [
      { productId: 'PROD005', productName: 'Dầu ăn Simply Đậu Nành 1L', price: 54000, quantity: 2, unit: 'Chai' },
      { productId: 'PROD006', productName: 'Nước rửa chén Sunlight Chanh 1.5kg', price: 43500, quantity: 1, unit: 'Túi' }
    ],
    totalAmount: 151500,
    discount: 0,
    finalAmount: 151500,
    paidAmount: 200000,
    changeAmount: 48500,
    paymentMethod: 'CASH',
    createdAt: '2026-06-29 16:20:05'
  },
  {
    id: 'ORD003',
    code: 'HD0003',
    customerId: 'CUST004',
    customerName: 'Phạm Hồng Thái (Đại lý Thái Minh)',
    customerPhone: '0935112233',
    sellerId: 'U001',
    sellerName: 'Lê Hoàng Minh',
    items: [
      { productId: 'PROD001', productName: 'Cà phê Robusta Đắk Lắk (Gói 500g)', price: 135000, quantity: 20, unit: 'Gói' },
      { productId: 'PROD003', productName: 'Trà Xanh Thái Nguyên Thượng Hạng', price: 150000, quantity: 15, unit: 'Gói' },
      { productId: 'PROD004', productName: 'Mỳ tôm Hảo Hảo Tôm Chua Cay', price: 4500, quantity: 100, unit: 'Thùng' }
    ],
    totalAmount: 5400000,
    discount: 200000,
    finalAmount: 5200000,
    paidAmount: 0, // Recorded as Debt
    changeAmount: 0,
    paymentMethod: 'DEBT',
    createdAt: '2026-06-30 11:15:30'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO001',
    code: 'NH0001',
    supplierId: 'SUP002',
    supplierName: 'Công ty Cổ phần sữa Vinamilk Việt Nam',
    items: [
      { productId: 'PROD002', productName: 'Sữa đặc Ông Thọ Đỏ (Hộp 380g)', quantity: 120, importPrice: 19500 }
    ],
    totalAmount: 2340000,
    paidAmount: 2340000,
    paymentMethod: 'BANK_TRANSFER',
    createdAt: '2026-06-25 09:00:00'
  },
  {
    id: 'PO002',
    code: 'NH0002',
    supplierId: 'SUP001',
    supplierName: 'Tổng Kho Unilever Miền Nam',
    items: [
      { productId: 'PROD006', productName: 'Nước rửa chén Sunlight Chanh 1.5kg', quantity: 50, importPrice: 32000 }
    ],
    totalAmount: 1600000,
    paidAmount: 1000000, // Remaining 600k added to debt
    paymentMethod: 'DEBT',
    createdAt: '2026-06-26 14:10:00'
  }
];

export const INITIAL_DEBT_TRANSACTIONS: DebtTransaction[] = [
  {
    id: 'DT001',
    partnerId: 'CUST002',
    partnerType: 'CUSTOMER',
    partnerName: 'Nguyễn Văn Hải (Cà phê Góc Phố)',
    amount: 3450000,
    type: 'INCREASE',
    note: 'Dư nợ đầu kỳ chuyển sang',
    createdAt: '2026-06-01 00:00:00'
  },
  {
    id: 'DT002',
    partnerId: 'CUST004',
    partnerType: 'CUSTOMER',
    partnerName: 'Phạm Hồng Thái (Đại lý Thái Minh)',
    amount: 5200000,
    type: 'INCREASE',
    note: 'Nợ ghi nhận từ hóa đơn HD0003',
    createdAt: '2026-06-30 11:15:30'
  },
  {
    id: 'DT003',
    partnerId: 'SUP001',
    partnerType: 'SUPPLIER',
    partnerName: 'Tổng Kho Unilever Miền Nam',
    amount: 600000,
    type: 'INCREASE',
    note: 'Nợ ghi nhận từ đơn nhập hàng NH0002',
    createdAt: '2026-06-26 14:10:00'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'LOG001',
    userId: 'U001',
    username: 'admin',
    role: 'ADMIN',
    action: 'Đăng nhập',
    details: 'Đăng nhập hệ thống thành công',
    ipAddress: '192.168.1.15',
    createdAt: '2026-07-01 08:00:05'
  },
  {
    id: 'LOG002',
    userId: 'U001',
    username: 'admin',
    role: 'ADMIN',
    action: 'Xem báo cáo',
    details: 'Truy cập trang báo cáo doanh thu tháng 6/2026',
    ipAddress: '192.168.1.15',
    createdAt: '2026-07-01 08:05:22'
  },
  {
    id: 'LOG003',
    userId: 'U002',
    username: 'seller_thuy',
    role: 'SELLER',
    action: 'Đăng nhập',
    details: 'Đăng nhập hệ thống bán hàng thành công',
    ipAddress: '192.168.1.22',
    createdAt: '2026-07-01 08:12:10'
  }
];

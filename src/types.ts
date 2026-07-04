export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  STOCKKEEPER = 'STOCKKEEPER'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone: string;
  email: string;
  active: boolean;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
}

export interface Product {
  id: string;
  code: string; // Barcode
  name: string;
  categoryId: string;
  importPrice: number;
  price: number; // Retail Price
  wholesalePrice: number; // Wholesale Price
  stock: number;
  minStock: string; // Min stock trigger
  unit: string;
  image?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  debt: number; // Current debt
  maxDebtLimit: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  debtToSupplier: number; // Our debt to them
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  code: string; // Invoice number (e.g., HD0001)
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  vatRate?: number;
  vatAmount?: number;
  finalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'DEBT';
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  code: string; // Import code (e.g., NH0001)
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    importPrice: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'DEBT';
  createdAt: string;
}

export interface DebtTransaction {
  id: string;
  partnerId: string; // customerId or supplierId
  partnerType: 'CUSTOMER' | 'SUPPLIER';
  partnerName: string;
  amount: number; // positive is increase, negative is payment/decrease
  type: 'INCREASE' | 'DECREASE';
  note: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface PHPFile {
  name: string;
  path: string;
  description: string;
  content: string;
}

export interface StoreConfig {
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  footerNote: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
}


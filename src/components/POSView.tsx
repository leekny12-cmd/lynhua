import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Customer, Order, OrderItem, User, StoreConfig } from '../types';
import { Search, Barcode, Trash2, UserPlus, CreditCard, Banknote, QrCode, Ticket, CheckCircle, Printer, X, FileDown, Eye, FolderOpen, Save, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from '../lib/html2canvas-patch';
import { jsPDF } from 'jspdf';

interface POSDraft {
  id: string;
  customerName: string;
  customerId: string;
  items: { product: Product; quantity: number; price: number; priceType: 'RETAIL' | 'WHOLESALE' | 'IMPORT' | 'CUSTOM' }[];
  discount: number;
  vatRate?: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'DEBT';
  createdAt: string;
  totalAmount: number;
}

interface POSViewProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  currentUser: User;
  storeConfig?: StoreConfig;
  onAddCustomer: (name: string, phone: string, address: string, maxDebt: number) => Customer;
  onCreateOrder: (order: Order) => void;
  onShowConfirm?: (message: string, onConfirm: () => void) => void;
  onShowAlert?: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function POSView({
  products,
  categories,
  customers,
  currentUser,
  storeConfig,
  onAddCustomer,
  onCreateOrder,
  onShowConfirm,
  onShowAlert
}: POSViewProps) {

  // POS States
  const [cart, setCart] = useState<{ product: Product; quantity: number; price: number; priceType: 'RETAIL' | 'WHOLESALE' | 'IMPORT' | 'CUSTOM' }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || 'CUST001');
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0] || {
    id: 'CUST001',
    name: 'Khách lẻ vãng lai',
    phone: '0999999999',
    email: 'khachle@salesflow.vn',
    address: 'Mua trực tiếp tại quầy',
    debt: 0,
    maxDebtLimit: 0,
    createdAt: ''
  };
  const [discount, setDiscount] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'DEBT'>('CASH');
  
  // Received Cash logic
  const [cashReceived, setCashReceived] = useState<number>(0);

  // Quick Customer Add modal state
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustMaxDebt, setNewCustMaxDebt] = useState<number>(5000000);

  // Barcode scanning simulation input
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Success Modal for invoice printing
  const [printedOrder, setPrintedOrder] = useState<Order | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Preview and Draft state managers
  const [previewingOrder, setPreviewingOrder] = useState<Order | null>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [drafts, setDrafts] = useState<POSDraft[]>(() => {
    const saved = localStorage.getItem('sf_pos_drafts');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync drafts list with localStorage
  useEffect(() => {
    localStorage.setItem('sf_pos_drafts', JSON.stringify(drafts));
  }, [drafts]);

  const handleExportPDF = async () => {
    const element = document.getElementById('a5-printable-invoice');
    if (!element || !printedOrder) return;

    setIsExportingPDF(true);
    try {
      // Create high-resolution screenshot using html2canvas
      const canvas = await html2canvas(element, {
        scale: 2, // crisp high-definition text rendering
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A5 size: 148mm x 210mm
      const pdf = new jsPDF('p', 'mm', 'a5');

      const pdfWidth = 148;
      const pdfHeight = 210;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Save PDF file
      pdf.save(`HoaDon_${printedOrder.code}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      if (onShowAlert) {
        onShowAlert('Đã xảy ra lỗi khi xuất file PDF. Vui lòng thử lại.', 'error');
      } else {
        alert('Đã xảy ra lỗi khi xuất file PDF. Vui lòng thử lại.');
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printedOrder) return;

    const element = document.getElementById('a5-printable-invoice');
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
        #a5-printable-invoice {
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

  const handlePrintPreview = () => {
    if (!previewingOrder) return;

    const element = document.getElementById('a5-printable-invoice-preview');
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
        #a5-printable-invoice-preview {
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

  const handleExportPDFPreview = async () => {
    const element = document.getElementById('a5-printable-invoice-preview');
    if (!element || !previewingOrder) return;

    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const pdfWidth = 148;
      const pdfHeight = 210;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`HoaDon_XEM_TRUOC_${previewingOrder.code}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      if (onShowAlert) {
        onShowAlert('Đã xảy ra lỗi khi xuất file PDF. Vui lòng thử lại.', 'error');
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePreviewInvoice = () => {
    if (cart.length === 0) {
      if (onShowAlert) {
        onShowAlert('Giỏ hàng trống! Hãy chọn sản phẩm trước khi xem trước.', 'warning');
      } else {
        alert('Giỏ hàng trống! Hãy chọn sản phẩm trước khi xem trước.');
      }
      return;
    }

    const tempCode = `PREV${Math.floor(10000 + Math.random() * 90000)}`;
    const itemsList: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.product.unit
    }));

    const previewOrderData: Order = {
      id: `PREV_${Date.now()}`,
      code: tempCode,
      customerId: selectedCustomer.id === 'CUST001' ? undefined : selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.id === 'CUST001' ? undefined : selectedCustomer.phone,
      sellerId: currentUser.id,
      sellerName: currentUser.fullName,
      items: itemsList,
      totalAmount: subtotal,
      discount,
      vatRate,
      vatAmount,
      finalAmount,
      paidAmount: paymentMethod === 'DEBT' ? 0 : (paymentMethod === 'CASH' ? (cashReceived || finalAmount) : finalAmount),
      changeAmount: paymentMethod === 'CASH' ? (cashReceived > 0 ? changeAmount : 0) : 0,
      paymentMethod,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setPreviewingOrder(previewOrderData);
  };

  const handleSaveDraft = () => {
    if (cart.length === 0) {
      if (onShowAlert) {
        onShowAlert('Giỏ hàng trống! Không thể lưu nháp.', 'warning');
      } else {
        alert('Giỏ hàng trống! Không thể lưu nháp.');
      }
      return;
    }

    const newDraft: POSDraft = {
      id: `DRAFT_${Date.now()}`,
      customerName: selectedCustomer.name,
      customerId: selectedCustomer.id,
      items: [...cart],
      discount,
      vatRate,
      paymentMethod,
      createdAt: new Date().toLocaleString('vi-VN'),
      totalAmount: finalAmount
    };

    setDrafts([newDraft, ...drafts]);
    if (onShowAlert) {
      onShowAlert(`Đã lưu hóa đơn nháp thành công cho khách ${selectedCustomer.name}!`, 'success');
    } else {
      alert(`Đã lưu hóa đơn nháp thành công cho khách ${selectedCustomer.name}!`);
    }

    // Clear cart and state
    setCart([]);
    setDiscount(0);
    setVatRate(0);
    setCashReceived(0);
    setPaymentMethod('CASH');
  };

  const handleLoadDraft = (draft: POSDraft) => {
    const loadAction = () => {
      setSelectedCustomerId(draft.customerId);
      setCart(draft.items);
      setDiscount(draft.discount);
      setVatRate(draft.vatRate || 0);
      setPaymentMethod(draft.paymentMethod);
      setCashReceived(0);

      // Remove loaded draft
      setDrafts(drafts.filter(d => d.id !== draft.id));
      setShowDraftsModal(false);

      if (onShowAlert) {
        onShowAlert(`Đã nạp hóa đơn nháp của khách ${draft.customerName} vào giỏ hàng!`, 'success');
      }
    };

    if (cart.length > 0) {
      if (onShowConfirm) {
        onShowConfirm('Giỏ hàng hiện tại đang có sản phẩm. Nạp đơn nháp này sẽ ghi đè lên giỏ hàng hiện tại. Bạn có chắc chắn muốn tiếp tục?', loadAction);
      } else if (window.confirm('Giỏ hàng hiện tại đang có sản phẩm. Nạp đơn nháp này sẽ ghi đè lên giỏ hàng hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
        loadAction();
      }
    } else {
      loadAction();
    }
  };

  const handleDeleteDraft = (draftId: string, customerName: string) => {
    const deleteAction = () => {
      setDrafts(drafts.filter(d => d.id !== draftId));
      if (onShowAlert) {
        onShowAlert(`Đã xóa hóa đơn nháp của khách ${customerName}!`, 'success');
      }
    };

    if (onShowConfirm) {
      onShowConfirm(`Bạn có chắc chắn muốn xóa hóa đơn nháp của khách ${customerName}?`, deleteAction);
    } else if (window.confirm(`Bạn có chắc chắn muốn xóa hóa đơn nháp của khách ${customerName}?`)) {
      deleteAction();
    }
  };

  // Auto focus the barcode scanner input
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Filter products based on search query and selected category
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    if (p.active === false || String(p.active) === 'false') return false;
    const name = p.name || '';
    const code = p.code || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product: Product, preferredPriceType: 'RETAIL' | 'WHOLESALE' = 'RETAIL') => {
    if (product.stock <= 0) {
      if (onShowAlert) {
        onShowAlert(`Sản phẩm '${product.name}' đã hết hàng trong kho!`, 'warning');
      } else {
        alert(`Sản phẩm '${product.name}' đã hết hàng trong kho!`);
      }
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const chosenPrice = preferredPriceType === 'WHOLESALE'
      ? (product.wholesalePrice || product.price)
      : product.price;

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        if (onShowAlert) {
          onShowAlert(`Số lượng chọn vượt quá hàng tồn hiện có (${product.stock} ${product.unit})!`, 'warning');
        } else {
          alert(`Số lượng chọn vượt quá hàng tồn hiện có (${product.stock} ${product.unit})!`);
        }
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      // Update price type preference to the newly clicked one
      updated[existingIndex].price = chosenPrice;
      updated[existingIndex].priceType = preferredPriceType;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1, price: chosenPrice, priceType: preferredPriceType }]);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex === -1) return;

    const currentItem = cart[existingIndex];
    const newQty = currentItem.quantity + delta;

    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > currentItem.product.stock) {
      if (onShowAlert) {
        onShowAlert(`Không thể vượt quá số lượng hàng tồn (${currentItem.product.stock})!`, 'warning');
      } else {
        alert(`Không thể vượt quá số lượng hàng tồn (${currentItem.product.stock})!`);
      }
      return;
    }

    const updated = [...cart];
    updated[existingIndex].quantity = newQty;
    setCart(updated);
  };

  const handleDirectQuantityChange = (productId: string, val: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex === -1) return;

    const currentItem = cart[existingIndex];
    
    if (isNaN(val) || val <= 0) {
      // Set to 1
      const updated = [...cart];
      updated[existingIndex].quantity = 1;
      setCart(updated);
      return;
    }

    if (val > currentItem.product.stock) {
      if (onShowAlert) {
        onShowAlert(`Không thể vượt quá số lượng hàng tồn (${currentItem.product.stock})!`, 'warning');
      } else {
        alert(`Không thể vượt quá số lượng hàng tồn (${currentItem.product.stock})!`);
      }
      const updated = [...cart];
      updated[existingIndex].quantity = currentItem.product.stock;
      setCart(updated);
      return;
    }

    const updated = [...cart];
    updated[existingIndex].quantity = val;
    setCart(updated);
  };

  const handleRemoveItem = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handlePriceTypeChange = (productId: string, type: 'RETAIL' | 'WHOLESALE' | 'IMPORT') => {
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex === -1) return;

    const updated = [...cart];
    const item = updated[existingIndex];
    item.priceType = type;
    if (type === 'RETAIL') {
      item.price = item.product.price;
    } else if (type === 'WHOLESALE') {
      item.price = item.product.wholesalePrice || item.product.price;
    } else if (type === 'IMPORT') {
      item.price = item.product.importPrice;
    }
    setCart(updated);
  };

  const handlePriceValueChange = (productId: string, newPrice: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex === -1) return;

    const updated = [...cart];
    updated[existingIndex].price = newPrice;
    updated[existingIndex].priceType = 'CUSTOM';
    setCart(updated);
  };

  // Math totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const amountBeforeVat = Math.max(0, subtotal - discount);
  const vatAmount = amountBeforeVat * (vatRate / 100);
  const finalAmount = amountBeforeVat + vatAmount;
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, cashReceived - finalAmount) : 0;

  // VietQR generation path
  const qrBankName = storeConfig?.bankName || 'vietcombank';
  const qrBankAccount = storeConfig?.bankAccount || '1024345678';
  const qrAccountName = storeConfig?.bankAccountName || 'SalesFlow';
  const orderMemo = `FLOW${Math.floor(1000 + Math.random() * 9000)}`;
  const vietQrUrl = `https://img.vietqr.io/image/${qrBankName}-${qrBankAccount}-compact.png?amount=${finalAmount}&addInfo=${encodeURIComponent(orderMemo)}&accountName=${encodeURIComponent(qrAccountName)}`;

  // Handle barcode simulation scan submit (on Enter key)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = barcodeInput.trim();
    if (!cleanCode) return;

    const match = products.find(p => p.code === cleanCode && p.active !== false);
    if (match) {
      handleProductClick(match);
      setBarcodeInput('');
    } else {
      if (onShowAlert) {
        onShowAlert(`Không tìm thấy hàng hoá nào trùng khớp mã vạch: ${cleanCode}`, 'warning');
      } else {
        alert(`Không tìm thấy hàng hoá nào trùng khớp mã vạch: ${cleanCode}`);
      }
      setBarcodeInput('');
    }
  };

  const handleQuickCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      if (onShowAlert) {
        onShowAlert('Vui lòng điền đầy đủ Họ tên và Số điện thoại!', 'error');
      } else {
        alert('Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
      }
      return;
    }
    const newCust = onAddCustomer(newCustName, newCustPhone, newCustAddress, newCustMaxDebt);
    setSelectedCustomerId(newCust.id);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setShowCustModal(false);
  };

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) {
      if (onShowAlert) {
        onShowAlert('Giỏ hàng trống! Hãy chọn sản phẩm trước khi thanh toán.', 'warning');
      } else {
        alert('Giỏ hàng trống! Hãy chọn sản phẩm trước khi thanh toán.');
      }
      return;
    }

    if (paymentMethod === 'DEBT') {
      if (selectedCustomer.id === 'CUST001') {
        if (onShowAlert) {
          onShowAlert('Khách lẻ vãng lai không được phép mua ghi nợ! Hãy chọn hoặc thêm mới một đối tác khách hàng cụ thể.', 'error');
        } else {
          alert('Khách lẻ vãng lai không được phép mua ghi nợ! Hãy chọn hoặc thêm mới một đối tác khách hàng cụ thể.');
        }
        return;
      }
      if (selectedCustomer.debt + finalAmount > selectedCustomer.maxDebtLimit) {
        if (onShowAlert) {
          onShowAlert(`Giao dịch thất bại! Hóa đơn này trị giá ${new Intl.NumberFormat('vi-VN').format(finalAmount)}đ, nếu ghi nợ sẽ vượt quá Hạn mức tối đa cho phép của khách hàng (${new Intl.NumberFormat('vi-VN').format(selectedCustomer.maxDebtLimit)}đ)!`, 'error');
        } else {
          alert(`Giao dịch thất bại! Hóa đơn này trị giá ${new Intl.NumberFormat('vi-VN').format(finalAmount)}đ, nếu ghi nợ sẽ vượt quá Hạn mức tối đa cho phép của khách hàng (${new Intl.NumberFormat('vi-VN').format(selectedCustomer.maxDebtLimit)}đ)!`);
        }
        return;
      }
    }

    if (paymentMethod === 'CASH' && cashReceived > 0 && cashReceived < finalAmount) {
      if (onShowAlert) {
        onShowAlert('Số tiền mặt khách đưa chưa đủ để hoàn thành hóa đơn!', 'warning');
      } else {
        alert('Số tiền mặt khách đưa chưa đủ để hoàn thành hóa đơn!');
      }
      return;
    }

    // Create invoice record
    const invoiceCode = `HD${Math.floor(10000 + Math.random() * 90000)}`;
    const itemsList: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.product.unit
    }));

    const newOrder: Order = {
      id: `ORD_${Date.now()}`,
      code: invoiceCode,
      customerId: selectedCustomer.id === 'CUST001' ? undefined : selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.id === 'CUST001' ? undefined : selectedCustomer.phone,
      sellerId: currentUser.id,
      sellerName: currentUser.fullName,
      items: itemsList,
      totalAmount: subtotal,
      discount,
      vatRate,
      vatAmount,
      finalAmount,
      paidAmount: paymentMethod === 'DEBT' ? 0 : (paymentMethod === 'CASH' ? (cashReceived || finalAmount) : finalAmount),
      changeAmount: paymentMethod === 'CASH' ? (cashReceived > 0 ? changeAmount : 0) : 0,
      paymentMethod,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    onCreateOrder(newOrder);
    setPrintedOrder(newOrder); // Open invoice view modal
    setCart([]); // Clear cart
    setDiscount(0);
    setVatRate(0);
    setCashReceived(0);
    setPaymentMethod('CASH');
  };

  // Keep barcode input focused on screen clicks
  const keepFocus = () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-140px)] lg:min-h-[760px] min-h-0 select-none">
      {/* LEFT: Product Grid & Category Filters */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col h-[550px] lg:h-full overflow-hidden" onClick={keepFocus}>
        {/* Search & Barcode scanning panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm hoặc mã vạch..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-slate-100 focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-sm transition"
            />
          </div>

          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Barcode className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-sky-500" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Đặt chuột tại đây để Quét Mã Vạch tự động..."
              className="w-full pl-11 pr-4 py-3 bg-sky-50/50 border border-sky-100 rounded-xl text-slate-800 placeholder-sky-600/50 focus:bg-sky-50 focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-sm font-semibold transition"
              autoComplete="off"
            />
          </form>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin shrink-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition ${
              selectedCategory === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả sản phẩm
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product List Render */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2.5 py-20">
              <Barcode className="w-12 h-12 text-slate-300 stroke-1" />
              <p className="text-sm">Không tìm thấy sản phẩm phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const outOfStock = p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !outOfStock && handleProductClick(p, 'RETAIL')}
                    className={`group bg-white border rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition select-none ${
                      outOfStock 
                        ? 'opacity-55 border-slate-100 bg-slate-50' 
                        : 'border-slate-150 hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/5'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=200'}
                        alt={p.name}
                        className="w-full h-24 object-cover rounded-lg bg-slate-100 mb-2.5 group-hover:scale-[1.02] transition duration-200"
                        referrerPolicy="no-referrer"
                      />
                      {p.stock <= parseInt(p.minStock) && !outOfStock && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded">Gần hết</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-sky-600 transition">{p.name}</h4>
                      <p className="text-slate-400 text-[10px] font-mono mt-0.5">Mã: {p.code}</p>
                      
                      {/* Interactive Price selectors to choose immediately */}
                      <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!outOfStock) handleProductClick(p, 'RETAIL');
                          }}
                          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg border border-sky-100 hover:border-sky-500 hover:bg-sky-50/50 active:bg-sky-50 transition cursor-pointer"
                          title="Chọn Bán Lẻ"
                        >
                          <span className="text-[9px] text-sky-600 font-bold uppercase tracking-wider">Giá lẻ</span>
                          <span className="text-[11px] font-black text-slate-800 font-mono">{new Intl.NumberFormat('vi-VN').format(Number(p.price) || 0)}đ</span>
                        </button>

                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!outOfStock) handleProductClick(p, 'WHOLESALE');
                          }}
                          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg border border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50/50 active:bg-indigo-50 transition cursor-pointer"
                          title="Chọn Bán Sỉ"
                        >
                          <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">Giá sỉ</span>
                          <span className="text-[11px] font-black text-slate-800 font-mono">{new Intl.NumberFormat('vi-VN').format(Number(p.wholesalePrice || p.price) || 0)}đ</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-50 text-[10px]">
                        <span className="text-slate-400 font-semibold">Tồn kho</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                          outOfStock 
                            ? 'bg-rose-50 text-rose-600' 
                            : p.stock <= parseInt(p.minStock) ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {outOfStock ? 'Hết hàng' : `${p.stock} ${p.unit}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cashier Checkout Dashboard */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between h-[600px] lg:h-full overflow-hidden">
        {/* Cart Title */}
        <div className="flex flex-col gap-2 pb-3 border-b border-slate-100 mb-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-sm">Hóa đơn xuất quầy</h4>
              <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[11px] font-bold rounded-full">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <button 
              onClick={() => {
                if (cart.length > 0) {
                  if (onShowConfirm) {
                    onShowConfirm('Bạn có chắc chắn muốn làm trống giỏ hàng hiện tại?', () => setCart([]));
                  } else if (window.confirm('Bạn có chắc chắn muốn làm trống giỏ hàng hiện tại?')) {
                    setCart([]);
                  }
                }
              }}
              className="text-slate-400 hover:text-rose-500 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Làm trống</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Danh sách lưu nháp:</span>
            <button
              onClick={() => setShowDraftsModal(true)}
              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 transition"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Đơn nháp ({drafts.length})</span>
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 text-center">
              <Trash2 className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
              <p className="text-xs">Chưa chọn hàng hoá nào!</p>
              <p className="text-[10px] text-slate-400 mt-1">Sử dụng súng mã vạch hoặc bấm nhanh sản phẩm bên trái.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-800 truncate">{item.product.name}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">Kho: {item.product.stock} {item.product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleQuantityChange(item.product.id, -1)}
                      className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded flex items-center justify-center text-[11px] transition"
                    >
                      -
                    </button>
                    <input
                      id={`cart-item-qty-${item.product.id}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.quantity === ('' as any) ? '' : item.quantity}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/\D/g, '');
                        if (cleanVal === '') {
                          const updated = [...cart];
                          const idx = updated.findIndex(x => x.product.id === item.product.id);
                          if (idx > -1) {
                            updated[idx].quantity = '' as any;
                            setCart(updated);
                          }
                        } else {
                          const val = parseInt(cleanVal, 10);
                          handleDirectQuantityChange(item.product.id, val);
                        }
                      }}
                      onBlur={() => {
                        if (item.quantity === ('' as any) || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
                          handleDirectQuantityChange(item.product.id, 1);
                        }
                      }}
                      className="w-9 h-5.5 text-center font-bold text-slate-800 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 py-0"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.product.id, 1)}
                      className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded flex items-center justify-center text-[11px] transition"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Pricing Level Selectors & Manual Pricing input */}
                <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Mức giá bán:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePriceTypeChange(item.product.id, 'RETAIL')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                          item.priceType === 'RETAIL'
                            ? 'bg-sky-50 text-sky-600 border-sky-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Giá lẻ niêm yết"
                      >
                        Lẻ ({new Intl.NumberFormat('vi-VN').format(Number(item.product.price) || 0)}đ)
                      </button>
                      <button
                        onClick={() => handlePriceTypeChange(item.product.id, 'WHOLESALE')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                          item.priceType === 'WHOLESALE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Giá sỉ chiết khấu"
                      >
                        Sỉ ({new Intl.NumberFormat('vi-VN').format(Number(item.product.wholesalePrice || item.product.price) || 0)}đ)
                      </button>
                    </div>
                  </div>

                  {/* Manual price input */}
                  <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-sky-500/15 transition">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chỉnh giá bán:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={new Intl.NumberFormat('vi-VN').format(Number(item.price) || 0)}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/\D/g, '');
                          handlePriceValueChange(item.product.id, Math.max(0, parseInt(rawVal) || 0));
                        }}
                        className="w-24 text-right font-black text-slate-800 focus:outline-none p-0 text-xs border-0"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">đ</span>
                    </div>
                  </div>

                  {/* Item Total Price Indicator */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-semibold">
                    <span>Thành tiền:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-xs">
                      {new Intl.NumberFormat('vi-VN').format((Number(item.price) || 0) * (Number(item.quantity) || 0))}đ
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer Select Option & Quick Add */}
        <div className="border-t border-slate-100 pt-3.5 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 text-xs font-semibold">Khách hàng thành viên:</span>
            <button
              onClick={() => setShowCustModal(true)}
              className="text-sky-600 hover:text-sky-700 text-xs font-bold flex items-center gap-1 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm nhanh</span>
            </button>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              setSelectedCustomerId(e.target.value);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone !== '0999999999' ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>

          {/* Money Totals section */}
          <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Tổng giá trị hàng:</span>
              <span className="font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Chiết khấu / Giảm giá:</span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                <Ticket className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0đ"
                  className="w-16 text-right font-bold text-slate-800 focus:outline-none border-0 p-0 text-xs"
                />
              </div>
            </div>
            
            {/* VAT config section */}
            <div className="flex justify-between items-center text-slate-500 pt-0.5">
              <span>Thuế giá trị gia tăng (VAT):</span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
                  <input
                    type="number"
                    value={vatRate === 0 ? '' : vatRate}
                    onChange={(e) => setVatRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-8 text-right font-bold text-slate-800 focus:outline-none border-0 p-0 text-xs"
                    min="0"
                    max="100"
                  />
                  <span className="text-slate-400 font-bold text-[10px]">%</span>
                </div>
                <div className="flex gap-1">
                  {[0, 8, 10].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setVatRate(rate)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                        vatRate === rate
                          ? 'bg-sky-600 text-white'
                          : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {vatRate > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px] pl-2 border-l-2 border-slate-300">
                <span>Tiền thuế VAT ({vatRate}%):</span>
                <span className="font-semibold text-slate-700">+{new Intl.NumberFormat('vi-VN').format(vatAmount)}đ</span>
              </div>
            )}

            <div className="flex justify-between text-slate-700 font-bold border-t border-slate-100 pt-2 text-sm">
              <span className="text-slate-800">Thanh toán thực tế:</span>
              <span className="text-sky-600 text-base">{new Intl.NumberFormat('vi-VN').format(finalAmount)}đ</span>
            </div>
          </div>

          {/* Payment Method Option */}
          <div className="space-y-1.5">
            <span className="text-slate-500 text-xs font-semibold">Hình thức thanh toán:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition ${
                  paymentMethod === 'CASH'
                    ? 'border-sky-500 bg-sky-50/50 text-sky-600'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tiền mặt</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-sky-500 bg-sky-50/50 text-sky-600'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR Banking</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('DEBT')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition ${
                  paymentMethod === 'DEBT'
                    ? 'border-sky-500 bg-sky-50/50 text-sky-600'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Ghi nợ</span>
              </button>
            </div>
          </div>

          {/* Context Panels depending on Payment Method */}
          {paymentMethod === 'CASH' && (
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-semibold">Khách đưa:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cashReceived === 0 ? '' : cashReceived}
                  onChange={(e) => setCashReceived(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Nhập số tiền..."
                  className="w-24 text-right font-extrabold text-emerald-800 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-slate-400 font-semibold">Thối: <span className="text-slate-800 font-bold">{new Intl.NumberFormat('vi-VN').format(changeAmount)}đ</span></span>
              </div>
            </div>
          )}

          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="bg-sky-50/30 border border-sky-100 p-3 rounded-xl flex flex-col items-center gap-2">
              <div className="text-[10px] text-sky-700 font-semibold text-center leading-relaxed">
                Quét mã VietQR chuyển khoản nhanh của cửa hàng
              </div>
              <div className="bg-white p-1 rounded border border-slate-200/60 shadow-sm">
                <img
                  src={vietQrUrl}
                  alt="VietQR Vietcombank"
                  className="w-24 h-24 object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">{qrBankName} STK: {qrBankAccount} ({qrAccountName})</span>
            </div>
          )}

          {paymentMethod === 'DEBT' && (
            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-amber-800 font-semibold">
                <span>Dư nợ khách hiện tại:</span>
                <span>{new Intl.NumberFormat('vi-VN').format(selectedCustomer.debt)}đ</span>
              </div>
              <div className="flex justify-between text-amber-800 font-semibold">
                <span>Dư nợ sau giao dịch này:</span>
                <span className="font-bold text-rose-600">{new Intl.NumberFormat('vi-VN').format(selectedCustomer.debt + finalAmount)}đ</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Hạn mức ghi nợ tối đa của đối tác này: <strong>{new Intl.NumberFormat('vi-VN').format(selectedCustomer.maxDebtLimit)}đ</strong>
              </div>
            </div>
          )}

          {/* Checkout action row */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePreviewInvoice}
                disabled={cart.length === 0}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  cart.length === 0
                    ? 'bg-slate-50 border-slate-105 text-slate-300 cursor-not-allowed'
                    : 'bg-amber-50/55 border-amber-200 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trước</span>
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={cart.length === 0}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  cart.length === 0
                    ? 'bg-slate-50 border-slate-105 text-slate-300 cursor-not-allowed'
                    : 'bg-emerald-50/55 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu nháp</span>
              </button>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              disabled={cart.length === 0}
              className={`w-full py-3 text-sm font-bold text-white rounded-xl shadow-lg flex items-center justify-center gap-2 transition ${
                cart.length === 0
                  ? 'bg-slate-300 shadow-none cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/10'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>XUẤT HOÁ ĐƠN (F12)</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK CUSTOMER ADD DIALOG */}
      <AnimatePresence>
        {showCustModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Thêm Nhanh Thành Viên POS</span>
                <button 
                  onClick={() => setShowCustModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleQuickCustomerSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tên khách hàng *</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    required
                    placeholder="Nhập tên đối tác (vd: Trần Thị Hoa)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    required
                    placeholder="Nhập SĐT..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Địa chỉ nhận hàng</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Địa chỉ giao nhận hàng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Hạn mức ghi nợ (VNĐ)</label>
                  <input
                    type="number"
                    value={newCustMaxDebt}
                    onChange={(e) => setNewCustMaxDebt(parseInt(e.target.value) || 0)}
                    placeholder="Mặc định: 5,000,000đ"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/10 text-xs"
                >
                  Thêm & Chọn Ngay
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUNNING A5 RECEIPT MODAL OVERLAY */}
      <AnimatePresence>
        {printedOrder && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col my-10"
            >
              {/* Header block with trigger actions */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between no-print-section">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-slate-800">Thanh toán & Giao dịch Thành công!</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In phiếu A5</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{isExportingPDF ? 'Đang xuất...' : 'Xuất PDF'}</span>
                  </button>
                  <button 
                    onClick={() => setPrintedOrder(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Slip inside layout */}
              <div ref={invoiceRef} className="p-6 bg-white overflow-y-auto text-slate-800 font-sans leading-relaxed text-sm select-text" id="a5-printable-invoice">
                <div className="text-center pb-4 mb-4 border-b-2 border-dashed border-slate-300">
                  <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">{storeConfig?.name || 'CỬA HÀNG TIỆN LỢI SALESFLOW'}</h3>
                  <p className="text-xs text-slate-500 mt-1">ĐC: {storeConfig?.address || '45 Lê Lợi, Bến Nghé, Quận 1, TP. HCM'}</p>
                  <p className="text-xs text-slate-500">
                    SĐT: {storeConfig?.phone || '0988.123.456'}
                    {storeConfig?.website ? ` - Website: ${storeConfig.website}` : ''}
                    {storeConfig?.email ? ` - Email: ${storeConfig.email}` : ''}
                  </p>
                  
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900 mt-4">HÓA ĐƠN BÁN HÀNG</h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">Mã HĐ: <span className="font-bold text-slate-800">{printedOrder.code}</span> | Ngày: {printedOrder.createdAt}</p>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs pb-4 mb-4 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đối tác:</span>
                    <span className="font-bold text-slate-800">{printedOrder.customerName}</span>
                  </div>
                  {printedOrder.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-medium text-slate-800">{printedOrder.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thu ngân phụ trách:</span>
                    <span className="font-semibold text-slate-700">{printedOrder.sellerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hình thức:</span>
                    <span className="font-bold text-sky-600">
                      {printedOrder.paymentMethod === 'CASH' && 'Tiền mặt'}
                      {printedOrder.paymentMethod === 'BANK_TRANSFER' && 'Chuyển khoản (VietQR)'}
                      {printedOrder.paymentMethod === 'DEBT' && 'Ghi nhận công nợ'}
                    </span>
                  </div>
                </div>

                {/* Items Table details */}
                <table className="w-full text-xs text-left mb-4 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-dashed border-slate-300 text-slate-700 font-bold bg-slate-50/50">
                      <th className="py-2">Hàng hoá</th>
                      <th className="py-2 text-center">SL</th>
                      <th className="py-2 text-right">Đơn giá</th>
                      <th className="py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2 font-semibold text-slate-800">{item.productName}</td>
                        <td className="py-2 text-center text-slate-700">{item.quantity}</td>
                        <td className="py-2 text-right text-slate-600">{new Intl.NumberFormat('vi-VN').format(item.price)}đ</td>
                        <td className="py-2 text-right font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals computation */}
                <div className="w-60 ml-auto space-y-1.5 text-xs font-semibold pb-4">
                  <div className="flex justify-between text-slate-500">
                    <span>Tổng cộng:</span>
                    <span>{new Intl.NumberFormat('vi-VN').format(printedOrder.totalAmount)}đ</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Chiết khấu giảm giá:</span>
                    <span>-{new Intl.NumberFormat('vi-VN').format(printedOrder.discount)}đ</span>
                  </div>
                  {printedOrder.vatRate !== undefined && printedOrder.vatRate > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Thuế VAT ({printedOrder.vatRate}%):</span>
                      <span>+{new Intl.NumberFormat('vi-VN').format(printedOrder.vatAmount || 0)}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-extrabold text-slate-900">
                    <span>Tổng thanh toán:</span>
                    <span className="text-sky-600">{new Intl.NumberFormat('vi-VN').format(printedOrder.finalAmount)}đ</span>
                  </div>
                  {printedOrder.paymentMethod === 'CASH' && (
                    <>
                      <div className="flex justify-between text-slate-400 text-[11px] mt-1.5 font-normal">
                        <span>Tiền mặt nhận:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(printedOrder.paidAmount)}đ</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px] font-normal">
                        <span>Tiền trả lại:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(printedOrder.changeAmount)}đ</span>
                      </div>
                    </>
                  )}
                </div>

                {printedOrder.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5 bg-slate-50/50 p-2.5 rounded-xl">
                    <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider">Mã VietQR Chuyển Khoản</span>
                    <div className="bg-white p-1 rounded border border-slate-200/60 shadow-sm">
                      <img
                        src={`https://img.vietqr.io/image/${storeConfig?.bankName || 'vietcombank'}-${storeConfig?.bankAccount || '1024345678'}-compact.png?amount=${printedOrder.finalAmount}&addInfo=${encodeURIComponent(printedOrder.code)}&accountName=${encodeURIComponent(storeConfig?.bankAccountName || 'SalesFlow')}`}
                        alt="VietQR Chuyển khoản"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase text-center font-semibold">
                      {storeConfig?.bankName || 'vietcombank'} STK: {storeConfig?.bankAccount || '1024345678'} <br /> ({storeConfig?.bankAccountName || 'SalesFlow'})
                    </span>
                  </div>
                )}

                <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-slate-300 text-xs text-slate-400 italic space-y-1">
                  <p>{storeConfig?.footerNote || 'Cảm ơn quý khách đã ủng hộ cửa hàng!'}</p>
                  <p>Hóa đơn chỉ được đổi trả trong ngày kèm phiếu xuất kho.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POS DRAFTS MANAGEMENT MODAL */}
      <AnimatePresence>
        {showDraftsModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600">
                  <FolderOpen className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-slate-800">Danh sách Hóa đơn nháp ({drafts.length})</span>
                </div>
                <button 
                  onClick={() => setShowDraftsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {drafts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto stroke-1" />
                    <p className="text-sm">Hiện tại chưa có hóa đơn nháp nào được lưu.</p>
                    <p className="text-xs text-slate-400">Bạn có thể xếp tạm một giao dịch bằng cách bấm nút "Lưu nháp" ở chân giỏ hàng.</p>
                  </div>
                ) : (
                  drafts.map((d) => {
                    const totalQty = d.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <div key={d.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-4 hover:border-amber-400 transition">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm truncate">{d.customerName}</span>
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded-full">{totalQty} hàng</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">Lưu vào lúc: {d.createdAt}</p>
                          <div className="text-sky-600 font-extrabold text-xs">
                            Trị giá: {new Intl.NumberFormat('vi-VN').format(d.totalAmount)}đ
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleLoadDraft(d)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition"
                          >
                            Nạp đơn
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(d.id, d.customerName)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa nháp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUNNING A5 RECEIPT MODAL OVERLAY FOR PREVIEW */}
      <AnimatePresence>
        {previewingOrder && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col my-10"
            >
              {/* Header block with trigger actions */}
              <div className="px-5 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between no-print-section">
                <div className="flex items-center gap-2 text-amber-700">
                  <Eye className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-amber-800">Bản Xem Trước Hóa Đơn (Nháp)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrintPreview}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In nháp</span>
                  </button>
                  <button
                    onClick={handleExportPDFPreview}
                    disabled={isExportingPDF}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{isExportingPDF ? 'Đang xuất...' : 'Xuất PDF'}</span>
                  </button>
                  <button 
                    onClick={() => setPreviewingOrder(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Slip inside layout */}
              <div className="p-6 bg-white overflow-y-auto text-slate-800 font-sans leading-relaxed text-sm select-text relative" id="a5-printable-invoice-preview">
                {/* Diagonal watermark overlay for Preview */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none z-10 overflow-hidden">
                  <div className="text-slate-900 font-black text-6xl uppercase tracking-widest rotate-12">
                    BẢN NHÁP XEM TRƯỚC
                  </div>
                </div>

                <div className="text-center pb-4 mb-4 border-b-2 border-dashed border-slate-300 relative z-20">
                  <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">{storeConfig?.name || 'CỬA HÀNG TIỆN LỢI SALESFLOW'}</h3>
                  <p className="text-xs text-slate-500 mt-1">ĐC: {storeConfig?.address || '45 Lê Lợi, Bến Nghé, Quận 1, TP. HCM'}</p>
                  <p className="text-xs text-slate-500">
                    SĐT: {storeConfig?.phone || '0988.123.456'}
                    {storeConfig?.website ? ` - Website: ${storeConfig.website}` : ''}
                    {storeConfig?.email ? ` - Email: ${storeConfig.email}` : ''}
                  </p>
                  
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-955 mt-4">XEM TRƯỚC HÓA ĐƠN</h4>
                  <p className="text-xs text-amber-600 font-mono mt-1 font-bold">Mã Nháp: {previewingOrder.code} | Ngày: {previewingOrder.createdAt}</p>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs pb-4 mb-4 border-b border-slate-100 relative z-20">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đối tác:</span>
                    <span className="font-bold text-slate-800">{previewingOrder.customerName}</span>
                  </div>
                  {previewingOrder.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-medium text-slate-800">{previewingOrder.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thu ngân phụ trách:</span>
                    <span className="font-semibold text-slate-700">{previewingOrder.sellerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hình thức:</span>
                    <span className="font-bold text-sky-600">
                      {previewingOrder.paymentMethod === 'CASH' && 'Tiền mặt'}
                      {previewingOrder.paymentMethod === 'BANK_TRANSFER' && 'Chuyển khoản (VietQR)'}
                      {previewingOrder.paymentMethod === 'DEBT' && 'Ghi nhận công nợ'}
                    </span>
                  </div>
                </div>

                {/* Items Table details */}
                <table className="w-full text-xs text-left mb-4 border-collapse relative z-20">
                  <thead>
                    <tr className="border-b-2 border-dashed border-slate-300 text-slate-700 font-bold bg-slate-50/50">
                      <th className="py-2">Hàng hoá</th>
                      <th className="py-2 text-center">SL</th>
                      <th className="py-2 text-right">Đơn giá</th>
                      <th className="py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewingOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2 font-semibold text-slate-800">{item.productName}</td>
                        <td className="py-2 text-center text-slate-700">{item.quantity}</td>
                        <td className="py-2 text-right text-slate-600">{new Intl.NumberFormat('vi-VN').format(item.price)}đ</td>
                        <td className="py-2 text-right font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals computation */}
                <div className="w-60 ml-auto space-y-1.5 text-xs font-semibold pb-4 relative z-20">
                  <div className="flex justify-between text-slate-500">
                    <span>Tổng cộng:</span>
                    <span>{new Intl.NumberFormat('vi-VN').format(previewingOrder.totalAmount)}đ</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Chiết khấu giảm giá:</span>
                    <span>-{new Intl.NumberFormat('vi-VN').format(previewingOrder.discount)}đ</span>
                  </div>
                  {previewingOrder.vatRate !== undefined && previewingOrder.vatRate > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Thuế VAT ({previewingOrder.vatRate}%):</span>
                      <span>+{new Intl.NumberFormat('vi-VN').format(previewingOrder.vatAmount || 0)}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-extrabold text-slate-900">
                    <span>Tổng thanh toán:</span>
                    <span className="text-sky-600">{new Intl.NumberFormat('vi-VN').format(previewingOrder.finalAmount)}đ</span>
                  </div>
                  {previewingOrder.paymentMethod === 'CASH' && (
                    <>
                      <div className="flex justify-between text-slate-400 text-[11px] mt-1.5 font-normal">
                        <span>Tiền mặt nhận:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(previewingOrder.paidAmount)}đ</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px] font-normal">
                        <span>Tiền trả lại:</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(previewingOrder.changeAmount)}đ</span>
                      </div>
                    </>
                  )}
                </div>

                {previewingOrder.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5 bg-slate-50/50 p-2.5 rounded-xl relative z-20">
                    <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider">Mã VietQR Chuyển Khoản</span>
                    <div className="bg-white p-1 rounded border border-slate-200/60 shadow-sm">
                      <img
                        src={`https://img.vietqr.io/image/${storeConfig?.bankName || 'vietcombank'}-${storeConfig?.bankAccount || '1024345678'}-compact.png?amount=${previewingOrder.finalAmount}&addInfo=${encodeURIComponent(previewingOrder.code)}&accountName=${encodeURIComponent(storeConfig?.bankAccountName || 'SalesFlow')}`}
                        alt="VietQR Chuyển khoản"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase text-center font-semibold">
                      {storeConfig?.bankName || 'vietcombank'} STK: {storeConfig?.bankAccount || '1024345678'} <br /> ({storeConfig?.bankAccountName || 'SalesFlow'})
                    </span>
                  </div>
                )}

                <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-slate-300 text-xs text-slate-400 italic space-y-1 relative z-20">
                  <p>{storeConfig?.footerNote || 'Cảm ơn quý khách đã ủng hộ cửa hàng!'}</p>
                  <p>Bản in xem trước không dùng làm phiếu thanh toán chính thức.</p>
                </div>
              </div>

              {/* Action area at footer of preview modal */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewingOrder(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition"
                >
                  Đóng xem trước
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewingOrder(null);
                    handleCheckoutSubmit();
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/10 transition flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Xác nhận & Xuất hóa đơn</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

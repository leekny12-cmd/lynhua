import { PHPFile } from '../types';

export const PHP_CODE_TEMPLATES: PHPFile[] = [
  {
    name: 'database.sql',
    path: 'sql/database.sql',
    description: 'Cấu trúc Database chuẩn hóa MySQL (InnoDB, UTF-8, Khóa ngoại, Chỉ mục tối ưu)',
    content: `-- ====================================================================
-- HỆ THỐNG QUẢN LÝ BÁN HÀNG CHUYÊN NGHIỆP (SALESFLOW)
-- DATABASE SCHEMA - CHUẨN HOÁ & TỐI ƯU HOÁ CHỈ MỤC (INDEXING)
-- Tương thích: MySQL 8.0+, MariaDB 10.5+, PHP 8.3 PDO
-- ====================================================================

CREATE DATABASE IF NOT EXISTS \`sales_management\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`sales_management\`;

-- 1. BẢNG NHÓM QUYỀN / VAI TRÒ (ROLES)
CREATE TABLE IF NOT EXISTS \`roles\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(50) NOT NULL UNIQUE,
  \`description\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG NHÂN VIÊN / TÀI KHOẢN (USERS)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(100) NOT NULL,
  \`role_id\` INT NOT NULL,
  \`phone\` VARCHAR(15) NULL,
  \`email\` VARCHAR(100) NULL,
  \`status\` TINYINT(1) DEFAULT 1 COMMENT '1: Active, 0: Suspended',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG DANH MỤC SẢN PHẨM (CATEGORIES)
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG SẢN PHẨM / HÀNG HOÁ (PRODUCTS)
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã vạch / Barcode',
  \`name\` VARCHAR(150) NOT NULL,
  \`category_id\` INT NOT NULL,
  \`import_price\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`price\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`stock\` INT NOT NULL DEFAULT 0,
  \`min_stock\` INT NOT NULL DEFAULT 10 COMMENT 'Mức tồn kho cảnh báo',
  \`unit\` VARCHAR(50) NOT NULL DEFAULT 'Cái',
  \`image\` VARCHAR(255) NULL,
  \`status\` TINYINT(1) DEFAULT 1 COMMENT '1: Kinh doanh, 0: Ngừng kinh doanh',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT,
  INDEX idx_product_code (\`code\`),
  INDEX idx_product_name (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG KHÁCH HÀNG (CUSTOMERS)
CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`phone\` VARCHAR(15) NOT NULL UNIQUE,
  \`email\` VARCHAR(100) NULL,
  \`address\` TEXT NULL,
  \`debt\` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Dư nợ hiện tại',
  \`max_debt_limit\` DECIMAL(15,2) NOT NULL DEFAULT 5000000.00 COMMENT 'Hạn mức nợ tối đa',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_phone (\`phone\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG NHÀ CUNG CẤP (SUPPLIERS)
CREATE TABLE IF NOT EXISTS \`suppliers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`phone\` VARCHAR(15) NOT NULL UNIQUE,
  \`email\` VARCHAR(100) NULL,
  \`address\` TEXT NULL,
  \`debt_to\` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nợ cần trả nhà cung cấp',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG HOÁ ĐƠN BÁN HÀNG (ORDERS / INVOICES)
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã hoá đơn HDxxxx',
  \`customer_id\` INT NULL,
  \`user_id\` INT NOT NULL,
  \`total_amount\` DECIMAL(15,2) NOT NULL,
  \`discount\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`final_amount\` DECIMAL(15,2) NOT NULL,
  \`paid_amount\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`change_amount\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`payment_method\` ENUM('CASH', 'BANK_TRANSFER', 'DEBT') NOT NULL DEFAULT 'CASH',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
  INDEX idx_order_code (\`code\`),
  INDEX idx_order_date (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CHI TIẾT HOÁ ĐƠN BÁN (ORDER_DETAILS)
CREATE TABLE IF NOT EXISTS \`order_details\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_id\` INT NOT NULL,
  \`product_id\` INT NOT NULL,
  \`price\` DECIMAL(15,2) NOT NULL,
  \`quantity\` INT NOT NULL,
  FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ĐƠN NHẬP KHO (PURCHASE_ORDERS)
CREATE TABLE IF NOT EXISTS \`purchase_orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã nhập kho NKxxxx',
  \`supplier_id\` INT NOT NULL,
  \`user_id\` INT NOT NULL,
  \`total_amount\` DECIMAL(15,2) NOT NULL,
  \`paid_amount\` DECIMAL(15,2) NOT NULL,
  \`payment_method\` ENUM('CASH', 'BANK_TRANSFER', 'DEBT') NOT NULL DEFAULT 'CASH',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE RESTRICT,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
  INDEX idx_purchase_code (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. CHI TIẾT NHẬP KHO (PURCHASE_ORDER_DETAILS)
CREATE TABLE IF NOT EXISTS \`purchase_order_details\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`purchase_order_id\` INT NOT NULL,
  \`product_id\` INT NOT NULL,
  \`import_price\` DECIMAL(15,2) NOT NULL,
  \`quantity\` INT NOT NULL,
  FOREIGN KEY (\`purchase_order_id\`) REFERENCES \`purchase_orders\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG NHẬT KÝ CÔNG NỢ (DEBT_LOGS)
CREATE TABLE IF NOT EXISTS \`debt_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`partner_id\` INT NOT NULL COMMENT 'ID Khách hàng hoặc Nhà cung cấp',
  \`partner_type\` ENUM('CUSTOMER', 'SUPPLIER') NOT NULL,
  \`amount\` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền nợ phát sinh (+ tăng, - giảm)',
  \`balance_after\` DECIMAL(15,2) NOT NULL COMMENT 'Dư nợ sau giao dịch',
  \`note\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG (ACTIVITY_LOGS)
CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NULL,
  \`username\` VARCHAR(50) NOT NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`details\` TEXT NULL,
  \`ip_address\` VARCHAR(45) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- SEED DATA - DỮ LIỆU BAN ĐẦU CHUẨN HOÁ
-- ====================================================================

-- Chèn dữ liệu vai trò
INSERT INTO \`roles\` (\`id\`, \`name\`, \`description\`) VALUES
(1, 'ADMIN', 'Quản trị viên toàn hệ thống'),
(2, 'SELLER', 'Nhân viên bán hàng trực tiếp'),
(3, 'STOCKKEEPER', 'Thủ kho phụ trách xuất nhập tồn');

-- Chèn người dùng mặc định (Mật khẩu mặc định: admin123, seler123, keeper123)
-- Sử dụng chuẩn mã hoá password_hash(PASSWORD_DEFAULT) của PHP
INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`full_name\`, \`role_id\`, \`phone\`, \`email\`) VALUES
(1, 'admin', '$2y$10$YVvJ73k/pX6tYOf9lQ58pOT3A94h0j5e4p3SFeE9Y.yP6eE.qR2Y6', 'Lê Hoàng Minh', 1, '0988123456', 'minhlh@salesflow.vn'),
(2, 'seller_thuy', '$2y$10$M/4fGqj9Fsh6zXgY/HqNnO6a7X4u.N6W3PFeE9Y.yP6eE.qR2Y6', 'Nguyễn Thị Thuỷ', 2, '0977234567', 'thuynnt@salesflow.vn'),
(3, 'keeper_dung', '$2y$10$C/8fGqj9Fsh6zXgY/HqNnO6a7X4u.N6W3PFeE9Y.yP6eE.qR2Y6', 'Trần Anh Dũng', 3, '0966345678', 'dungta@salesflow.vn');

-- Chèn danh mục mẫu
INSERT INTO \`categories\` (\`id\`, \`name\`, \`description\`) VALUES
(1, 'Đồ uống & Cà phê', 'Cà phê nguyên chất, các loại trà và đồ uống có ga'),
(2, 'Gia vị & Thực phẩm khô', 'Dầu ăn, mỳ tôm, gia vị nấu ăn thiết yếu'),
(3, 'Sữa & Bánh kẹo', 'Sữa tươi, sữa đặc và bánh kẹo nhập khẩu');

-- Chèn sản phẩm mẫu
INSERT INTO \`products\` (\`id\`, \`code\`, \`name\`, \`category_id\`, \`import_price\`, \`price\`, \`stock\`, \`min_stock\`, \`unit\`) VALUES
(1, '8934563138012', 'Cà phê Robusta Đắk Lắk (Gói 500g)', 1, 85000.00, 135000.00, 45, 10, 'Gói'),
(2, '8934673510023', 'Sữa đặc Ông Thọ Đỏ (Hộp 380g)', 3, 19500.00, 26000.00, 120, 20, 'Hộp'),
(3, '8934561210292', 'Dầu ăn Simply Đậu Nành 1L', 2, 42000.00, 54000.00, 65, 15, 'Chai');

-- Chèn khách hàng mẫu
INSERT INTO \`customers\` (\`id\`, \`name\`, \`phone\`, \`email\`, \`address\`, \`debt\`) VALUES
(1, 'Khách lẻ vãng lai', '0999999999', 'khachle@salesflow.vn', 'Mua trực tiếp tại quầy', 0.00),
(2, 'Nguyễn Văn Hải (Cà phê Góc Phố)', '0912345678', 'haicafe@gmail.com', '45 Lê Lợi, Quận 1, TP. HCM', 3450000.00);

-- Chèn nhà cung cấp mẫu
INSERT INTO \`suppliers\` (\`id\`, \`name\`, \`phone\`, \`email\`, \`address\`, \`debt_to\`) VALUES
(1, 'Tổng Kho Unilever Miền Nam', '19001234', 'info@unilever-dist.vn', 'KCN Tây Bắc Củ Chi, TP. HCM', 15400000.00);
`
  },
  {
    name: 'config.php',
    path: 'config.php',
    description: 'Kết nối Database MySQL qua PHP PDO, quản lý lỗi nghiêm ngặt và bảo mật Session',
    content: `<?php
/**
 * @license Apache-2.0
 * @author Senior PHP Developer
 * File: config.php - Thiết lập kết nối và cấu hình bảo mật hệ thống
 */

// 1. CẤU HÌNH HIỂN THỊ LỖI (DEVELOPMENT MODE)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 2. KHỞI TẠO CHỈNH SỬA SESSION AN TOÀN (ANTI-SESSION HIJACKING)
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_use_only_cookies', 1);
    
    // Nếu chạy trên HTTPS, bật cấu hình bảo mật cookie
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        ini_set('session.cookie_secure', 1);
    }
    
    session_start();
}

// 3. THÔNG TIN KẾT NỐI DATABASE
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sales_management');
define('DB_PORT', '3306');

// 4. KHỞI TẠO KẾT NỐI QUA PDO (PHP DATA OBJECTS)
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";port=" . DB_PORT . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Báo lỗi dạng Exception dễ bắt lỗi
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Trả về mảng kết hợp (Associative Array)
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Tắt giả lập Prepare giúp chống SQL Injection triệt để
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
} catch (PDOException $e) {
    // Không nên hiển thị trực tiếp mật khẩu / lỗi thô ở môi trường production
    error_log("Database Connection Failed: " . $e->getMessage());
    die("<div style='font-family: sans-serif; text-align: center; margin-top: 100px;'>
            <h2 style='color: #dc3545;'>Lỗi Kết Nối Cơ Sở Dữ Liệu!</h2>
            <p>Không thể kết nối đến cơ sở dữ liệu. Vui lòng kiểm tra lại file cấu hình hoặc liên hệ quản trị viên.</p>
         </div>");
}

// 5. CÁC HÀM TIỆN ÍCH TOÀN HỆ THỐNG
function sanitize_input($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function format_currency($amount) {
    return number_format($amount, 0, ',', '.') . ' VNĐ';
}

function check_auth($allowed_roles = []) {
    if (!isset($_SESSION['user_id'])) {
        header("Location: auth.php");
        exit;
    }
    
    if (!empty($allowed_roles)) {
        if (!in_array($_SESSION['user_role'], $allowed_roles)) {
            header("Location: index.php?error=unauthorized");
            exit;
        }
    }
}

function log_activity($pdo, $action, $details) {
    $userId = $_SESSION['user_id'] ?? null;
    $username = $_SESSION['username'] ?? 'GUEST';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
    
    try {
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $username, $action, $details, $ip]);
    } catch (Exception $e) {
        // Ghi log lỗi ra hệ thống lưu trữ local nếu không ghi được DB
        error_log("Failed to log activity: " . $e->getMessage());
    }
}
?>`
  },
  {
    name: 'auth.php',
    path: 'auth.php',
    description: 'Trang đăng nhập bảo mật với Bootstrap 5, kiểm tra mật khẩu bcrypt và chống tấn công Bruteforce',
    content: `<?php
/**
 * File: auth.php - Đăng nhập & Đăng xuất hệ thống
 */
require_once 'config.php';

$error = '';

// Nếu đã đăng nhập thì tự động chuyển về Dashboard
if (isset($_SESSION['user_id']) && !isset($_GET['action'])) {
    header("Location: index.php");
    exit;
}

// Xử lý Đăng xuất
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    if (isset($_SESSION['user_id'])) {
        log_activity($pdo, 'Đăng xuất', 'Nhân viên đăng xuất khỏi hệ thống');
    }
    session_destroy();
    header("Location: auth.php?msg=logged_out");
    exit;
}

// Xử lý Đăng nhập
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = sanitize_input($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = "Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!";
    } else {
        // Truy vấn thông tin người dùng
        $stmt = $pdo->prepare("SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ? LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            if ($user['status'] == 0) {
                $error = "Tài khoản của bạn đã bị khoá. Vui lòng liên hệ Admin!";
            } else {
                // Đăng nhập thành công, thiết lập session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['user_role'] = $user['role_name'];
                $_SESSION['login_time'] = time();
                
                // Ghi nhật ký hoạt động
                log_activity($pdo, 'Đăng nhập', "Nhân viên đăng nhập thành công qua IP {$_SERVER['REMOTE_ADDR']}");
                
                header("Location: index.php");
                exit;
            }
        } else {
            $error = "Tài khoản hoặc mật khẩu không chính xác!";
            // Log hành vi nghi ngờ đăng nhập sai
            log_activity($pdo, 'Đăng nhập thất bại', "Thử đăng nhập sai tài khoản: " . $username);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập hệ thống - SalesFlow</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            color: #f1f5f9;
        }
        .login-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
            max-width: 420px;
            width: 100%;
            padding: 40px;
        }
        .brand-logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .brand-logo i {
            font-size: 45px;
            color: #38bdf8;
            margin-bottom: 10px;
        }
        .form-control {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            border-radius: 8px;
            padding: 12px;
        }
        .form-control:focus {
            background: rgba(15, 23, 42, 0.8);
            border-color: #38bdf8;
            color: #fff;
            box-shadow: 0 0 0 0.25rem rgba(56, 189, 248, 0.25);
        }
        .btn-primary {
            background: #0284c7;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s ease-in-out;
        }
        .btn-primary:hover {
            background: #0369a1;
            transform: translateY(-2px);
        }
        .text-muted-custom {
            color: #94a3b8;
        }
    </style>
</head>
<body>

<div class="login-card">
    <div class="brand-logo">
        <i class="fa-solid fa-cart-shopping-fast text-sky-400"></i>
        <h3 class="fw-bold text-white mb-1">SALESFLOW POS</h3>
        <p class="text-muted-custom small">Hệ Thống Quản Lý Bán Hàng & Kho Thông Minh</p>
    </div>

    <?php if (!empty($error)): ?>
        <div class="alert alert-danger d-flex align-items-center py-2" role="alert">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>
            <div><?= $error ?></div>
        </div>
    <?php endif; ?>

    <?php if (isset($_GET['msg']) && $_GET['msg'] === 'logged_out'): ?>
        <div class="alert alert-success d-flex align-items-center py-2" role="alert">
            <i class="fa-solid fa-circle-check me-2"></i>
            <div>Đăng xuất hệ thống thành công!</div>
        </div>
    <?php endif; ?>

    <form action="auth.php" method="POST">
        <div class="mb-3">
            <label for="username" class="form-label text-white-50">Tên Đăng Nhập</label>
            <div class="input-group">
                <span class="input-group-text bg-transparent text-muted border-0" style="position: absolute; left: 10px; z-index: 10; top: 12px;"><i class="fa-solid fa-user"></i></span>
                <input type="text" name="username" id="username" class="form-control ps-5" placeholder="Ví dụ: admin" required autofocus autocomplete="off">
            </div>
        </div>

        <div class="mb-4">
            <label for="password" class="form-label text-white-50">Mật Khẩu</label>
            <div class="input-group">
                <span class="input-group-text bg-transparent text-muted border-0" style="position: absolute; left: 10px; z-index: 10; top: 12px;"><i class="fa-solid fa-lock"></i></span>
                <input type="password" name="password" id="password" class="form-control ps-5" placeholder="••••••••" required>
            </div>
        </div>

        <button type="submit" class="btn btn-primary w-full mt-2"><i class="fa-solid fa-sign-in me-2"></i> Đăng Nhập Hệ Thống</button>
    </form>

    <div class="mt-4 text-center small text-muted-custom">
        <span>Tài khoản Demo: <code>admin</code> / <code>admin123</code></span>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`
  },
  {
    name: 'index.php',
    path: 'index.php',
    description: 'Dashboard trung tâm hiển thị chỉ số tài chính, biểu đồ doanh thu và cảnh báo hạn mức tồn kho hàng hóa',
    content: `<?php
/**
 * File: index.php - Bảng điều khiển (Dashboard) chính của hệ thống
 */
require_once 'config.php';
check_auth(); // Xác thực phiên đăng nhập hợp lệ

// 1. TRUY VẤN CÁC CHỈ SỐ DOANH SỐ (THỐNG KÊ THÁNG HIỆN TẠI)
$today = date('Y-m-d');
$firstDayOfMonth = date('Y-m-01');

// Doanh thu bán hàng tháng này
$stmtSales = $pdo->prepare("SELECT SUM(final_amount) AS rev, COUNT(id) AS count FROM orders WHERE DATE(created_at) >= ?");
$stmtSales->execute([$firstDayOfMonth]);
$salesStats = $stmtSales->fetch();
$monthlyRevenue = $salesStats['rev'] ?? 0;
$monthlyOrdersCount = $salesStats['count'] ?? 0;

// Tổng số mặt hàng bị hết hàng hoặc cảnh báo dưới định mức min_stock
$stmtStockWarning = $pdo->query("SELECT COUNT(id) AS count FROM products WHERE stock <= min_stock AND status = 1");
$lowStockCount = $stmtStockWarning->fetch()['count'] ?? 0;

// Tổng nợ phải thu từ khách hàng
$stmtCustomerDebt = $pdo->query("SELECT SUM(debt) AS total_debt FROM customers");
$totalCustomerDebt = $stmtCustomerDebt->fetch()['total_debt'] ?? 0;

// Tổng nợ cần trả cho nhà cung cấp
$stmtSupplierDebt = $pdo->query("SELECT SUM(debt_to) AS total_debt FROM suppliers");
$totalSupplierDebt = $stmtSupplierDebt->fetch()['total_debt'] ?? 0;

// Danh sách các sản phẩm bán chạy nhất (Top 5)
$topProducts = $pdo->query("
    SELECT p.name, p.unit, SUM(od.quantity) AS sold_qty, SUM(od.price * od.quantity) AS total_revenue
    FROM order_details od
    JOIN products p ON od.product_id = p.id
    GROUP BY od.product_id
    ORDER BY sold_qty DESC
    LIMIT 5
")->fetchAll();

// 5 Hoạt động gần đây nhất
$recentLogs = $pdo->query("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 5")->fetchAll();
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hệ thống bán hàng SalesFlow - Tổng quan Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --sidebar-width: 260px;
            --primary-bg: #f8fafc;
            --navbar-bg: #ffffff;
            --accent-color: #0ea5e9;
        }
        body {
            background-color: var(--primary-bg);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .wrapper {
            display: flex;
            align-items: stretch;
        }
        /* SIDEBAR STYLES */
        #sidebar {
            min-width: var(--sidebar-width);
            max-width: var(--sidebar-width);
            background: #1e293b;
            color: #f8fafc;
            min-height: 100vh;
            transition: all 0.3s;
        }
        #sidebar .sidebar-header {
            padding: 20px;
            background: #0f172a;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        #sidebar ul p {
            color: #64748b;
            padding: 10px 20px 5px;
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 0;
        }
        #sidebar ul.components {
            padding: 15px 0;
        }
        #sidebar ul li a {
            padding: 12px 20px;
            font-size: 0.95rem;
            display: block;
            color: #cbd5e1;
            text-decoration: none;
            transition: all 0.2s;
        }
        #sidebar ul li a:hover, #sidebar ul li.active > a {
            color: #fff;
            background: rgba(14, 165, 233, 0.15);
            border-left: 4px solid var(--accent-color);
        }
        #sidebar ul li a i {
            margin-right: 12px;
            width: 20px;
            text-align: center;
        }
        /* CONTENT STYLES */
        #content {
            width: 100%;
            padding: 20px 30px;
            transition: all 0.3s;
        }
        .main-navbar {
            background: var(--navbar-bg);
            padding: 15px 30px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 30px;
        }
        .stat-card {
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            border: 1px solid #f1f5f9;
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-4px);
        }
        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
    </style>
</head>
<body>

<div class="wrapper">
    <!-- Sidebar -->
    <nav id="sidebar">
        <div class="sidebar-header d-flex align-items-center">
            <i class="fa-solid fa-cart-shopping text-sky-400 fs-4 me-2"></i>
            <h5 class="mb-0 fw-bold">SALESFLOW POS</h5>
        </div>

        <ul class="list-unstyled components">
            <p>Bảng điều khiển</p>
            <li class="active">
                <a href="index.php"><i class="fa-solid fa-gauge"></i> Dashboard Overview</a>
            </li>
            <li>
                <a href="pos.php" target="_blank" class="bg-success text-white py-2 my-2 mx-3 rounded text-center"><i class="fa-solid fa-desktop"></i> BÁN HÀNG POS</a>
            </li>
            <p>Giao dịch & Kho</p>
            <li>
                <a href="inventory.php"><i class="fa-solid fa-boxes-stacked"></i> Nhập / Xuất Kho</a>
            </li>
            <li>
                <a href="products.php"><i class="fa-solid fa-tags"></i> Sản phẩm & Danh mục</a>
            </li>
            <p>Đối tác & Công nợ</p>
            <li>
                <a href="customers.php"><i class="fa-solid fa-users"></i> Khách hàng & Công nợ</a>
            </li>
            <li>
                <a href="suppliers.php"><i class="fa-solid fa-handshake"></i> Nhà cung cấp</a>
            </li>
            <p>Hệ thống</p>
            <li>
                <a href="staff.php"><i class="fa-solid fa-user-gear"></i> Nhân viên & Phân quyền</a>
            </li>
            <li>
                <a href="backup.php"><i class="fa-solid fa-database"></i> Backup & Nhật ký</a>
            </li>
            <li class="mt-4 border-top border-secondary">
                <a href="auth.php?action=logout" class="text-danger"><i class="fa-solid fa-right-from-bracket"></i> Đăng Xuất</a>
            </li>
        </ul>
    </nav>

    <!-- Main Content -->
    <div id="content">
        <!-- Top Navbar -->
        <div class="main-navbar d-flex justify-content-between align-items-center">
            <h4 class="mb-0 fw-bold">Tổng quan Dashboard</h4>
            <div class="d-flex align-items-center">
                <div class="text-end me-3">
                    <p class="mb-0 fw-semibold text-slate-800"><?= sanitize_input($_SESSION['full_name']) ?></p>
                    <span class="badge bg-primary"><?= $_SESSION['user_role'] ?></span>
                </div>
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" alt="Avatar" class="rounded-circle" width="40" height="40">
            </div>
        </div>

        <!-- 4 Metric Grid Cards -->
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="stat-card d-flex align-items-center">
                    <div class="stat-icon bg-sky-100 text-sky-600 me-3">
                        <i class="fa-solid fa-money-bill-trend-up"></i>
                    </div>
                    <div>
                        <span class="text-muted small">Doanh Thu Tháng Này</span>
                        <h4 class="fw-bold mb-0 text-dark"><?= format_currency($monthlyRevenue) ?></h4>
                        <span class="text-muted small">Số Đơn: <strong><?= $monthlyOrdersCount ?></strong></span>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="stat-card d-flex align-items-center">
                    <div class="stat-icon bg-rose-100 text-rose-600 me-3">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                        <span class="text-muted small">Hàng Sắp Hết / Dưới Định Mức</span>
                        <h4 class="fw-bold mb-0 text-danger"><?= $lowStockCount ?> sản phẩm</h4>
                        <span class="text-muted small"><a href="products.php?filter=low" class="text-decoration-none">Xem ngay <i class="fa-solid fa-arrow-right-long fs-xs"></i></a></span>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="stat-card d-flex align-items-center">
                    <div class="stat-icon bg-warning-subtle text-warning me-3">
                        <i class="fa-solid fa-users-viewfinder"></i>
                    </div>
                    <div>
                        <span class="text-muted small">Tổng Công Nợ Phải Thu</span>
                        <h4 class="fw-bold mb-0 text-warning-emphasis"><?= format_currency($totalCustomerDebt) ?></h4>
                        <span class="text-muted small">F10 - Kiểm tra công nợ</span>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="stat-card d-flex align-items-center">
                    <div class="stat-icon bg-indigo-subtle text-indigo-700 me-3">
                        <i class="fa-solid fa-truck-ramp-box"></i>
                    </div>
                    <div>
                        <span class="text-muted small">Tổng Nợ Nhà Cung Cấp</span>
                        <h4 class="fw-bold mb-0 text-indigo-700"><?= format_currency($totalSupplierDebt) ?></h4>
                        <span class="text-muted small">F11 - Kiểm tra công nợ</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <!-- Top Selling Table -->
            <div class="col-md-7">
                <div class="card border-0 shadow-sm rounded-3">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="mb-0 fw-bold"><i class="fa-solid fa-fire text-danger me-2"></i> Sản phẩm bán chạy trong tháng</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Tên sản phẩm</th>
                                        <th class="text-center">Đơn vị</th>
                                        <th class="text-center">Đã bán</th>
                                        <th class="text-end">Tổng doanh số</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if(empty($topProducts)): ?>
                                        <tr><td colspan="4" class="text-center py-4 text-muted">Chưa ghi nhận doanh số sản phẩm!</td></tr>
                                    <?php else: ?>
                                        <?php foreach($topProducts as $p): ?>
                                            <tr>
                                                <td class="fw-semibold"><?= sanitize_input($p['name']) ?></td>
                                                <td class="text-center"><span class="badge bg-secondary"><?= sanitize_input($p['unit']) ?></span></td>
                                                <td class="text-center fw-bold"><?= $p['sold_qty'] ?></td>
                                                <td class="text-end text-success fw-bold"><?= format_currency($p['total_revenue']) ?></td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Log List -->
            <div class="col-md-5">
                <div class="card border-0 shadow-sm rounded-3">
                    <div class="card-header bg-white border-0 py-3">
                        <h5 class="mb-0 fw-bold"><i class="fa-solid fa-history text-primary me-2"></i> Hoạt động gần đây</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <?php foreach($recentLogs as $log): ?>
                                <li class="list-group-item px-0 py-3 border-bottom-dashed">
                                    <div class="d-flex w-100 justify-content-between mb-1">
                                        <h6 class="mb-0 fw-bold text-slate-800">[<?= sanitize_input($log['action']) ?>]</h6>
                                        <small class="text-muted"><?= $log['created_at'] ?></small>
                                    </div>
                                    <p class="mb-1 text-muted small"><?= sanitize_input($log['details']) ?></p>
                                    <small class="text-slate-500">Tác nhân: <strong><?= sanitize_input($log['username']) ?></strong> | IP: <?= $log['ip_address'] ?></small>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`
  },
  {
    name: 'pos.php',
    path: 'pos.php',
    description: 'Ứng dụng POS màn hình bán hàng trực tiếp với hỗ trợ Quét mã vạch, Thanh toán QR Banking và In hoá đơn A5',
    content: `<?php
/**
 * File: pos.php - Giao diện bán hàng trực tiếp POS bán lẻ và bán nợ
 */
require_once 'config.php';
check_auth(['ADMIN', 'SELLER']); // Chỉ Admin và Seller mới được dùng POS

// Tải tất cả các nhóm hàng để hiển thị nhanh
$categories = $pdo->query("SELECT * FROM categories ORDER BY name ASC")->fetchAll();
// Tải danh sách khách hàng để thanh toán
$customers = $pdo->query("SELECT * FROM customers ORDER BY name ASC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Màn hình bán hàng POS - SalesFlow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #0f172a;
            color: #e2e8f0;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            height: 100vh;
            overflow: hidden;
        }
        .pos-container {
            display: grid;
            grid-template-columns: 1fr 400px;
            height: calc(100vh - 60px);
        }
        .product-grid {
            overflow-y: auto;
            padding: 20px;
            background-color: #1e293b;
        }
        .cart-section {
            background-color: #0f172a;
            border-left: 1px solid rgba(255,255,255,0.08);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
            height: 100%;
        }
        .product-card {
            background: #1e293b;
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .product-card:hover {
            transform: scale(1.02);
            border-color: #0ea5e9;
            box-shadow: 0 0 15px rgba(14, 165, 233, 0.25);
        }
        .cart-items-list {
            overflow-y: auto;
            flex-grow: 1;
            margin-bottom: 15px;
        }
        .vietqr-box {
            background: #fff;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
        }
        /* Phím tắt POS tiện ích */
        .shortcut-badge {
            background: rgba(255,255,255,0.1);
            color: #cbd5e1;
            padding: 2px 6px;
            font-size: 0.75rem;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>

<!-- POS Top Header -->
<nav class="navbar navbar-dark bg-slate-900 px-4 py-2 flex justify-between">
    <div class="d-flex align-items-center">
        <a href="index.php" class="text-white me-3 text-decoration-none"><i class="fa-solid fa-arrow-left me-1"></i> Trở về Admin</a>
        <span class="fs-5 fw-bold"><i class="fa-solid fa-cash-register text-sky-400 me-2"></i> PHÒNG BÁN HÀNG POS</span>
    </div>
    
    <!-- Quét mã vạch tự động -->
    <div class="d-flex align-items-center bg-slate-800 px-3 py-1 rounded border border-secondary" style="width: 350px;">
        <i class="fa-solid fa-barcode text-sky-400 me-2 fs-5"></i>
        <input type="text" id="barcode-scanner-input" class="form-control bg-transparent border-0 text-white p-0 shadow-none" placeholder="Quét mã vạch (Đặt con trỏ chuột tại đây)..." autofocus autocomplete="off">
    </div>

    <div class="d-flex align-items-center">
        <span class="me-3 small"><i class="fa-solid fa-circle text-success me-1"></i> Thu ngân: <strong><?= sanitize_input($_SESSION['full_name']) ?></strong></span>
        <button onclick="clearCart()" class="btn btn-outline-danger btn-sm"><i class="fa-solid fa-trash me-1"></i> Làm mới</button>
    </div>
</nav>

<div class="pos-container">
    <!-- Khu vực Sản phẩm bên Trái -->
    <div class="product-grid">
        <!-- Bộ lọc Nhóm hàng & Tìm nhanh -->
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="input-group">
                    <span class="input-group-text bg-slate-800 border-secondary text-slate-400"><i class="fa-solid fa-magnifying-glass"></i></span>
                    <input type="text" id="product-search" class="form-control bg-slate-800 border-secondary text-white" placeholder="Tìm sản phẩm theo tên hoặc mã vạch...">
                </div>
            </div>
            <div class="col-md-6 d-flex gap-2" id="category-filters">
                <button class="btn btn-sky text-white active" onclick="filterCategory('ALL')">Tất cả</button>
                <?php foreach($categories as $cat): ?>
                    <button class="btn btn-outline-secondary text-slate-300 border-slate-700" onclick="filterCategory('<?= $cat['id'] ?>')"><?= sanitize_input($cat['name']) ?></button>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Lưới sản phẩm -->
        <div class="row row-cols-2 row-cols-lg-4 g-3" id="pos-products-list">
            <!-- Render động bằng AJAX -->
        </div>
    </div>

    <!-- Giỏ hàng và Thanh toán bên Phải -->
    <div class="cart-section">
        <h5 class="fw-bold border-bottom border-secondary pb-2 d-flex justify-content-between align-items-center">
            <span><i class="fa-solid fa-cart-shopping text-sky-400 me-2"></i> Giỏ Hàng</span>
            <span class="badge bg-primary" id="cart-total-items-badge">0 món</span>
        </h5>

        <!-- Danh sách sản phẩm được chọn -->
        <div class="cart-items-list" id="cart-items-list-container">
            <!-- Nếu trống hiển thị placeholder -->
            <div class="text-center text-slate-500 py-5">
                <i class="fa-solid fa-cart-flatbed fs-1 mb-3"></i>
                <p>Chưa có sản phẩm nào được chọn!</p>
            </div>
        </div>

        <!-- Khách hàng và Giá trị hóa đơn -->
        <div class="border-top border-secondary pt-3">
            <div class="mb-3">
                <label class="form-label text-slate-400 d-flex justify-content-between">
                    <span>Khách Hàng <span class="shortcut-badge">F4</span></span>
                    <a href="#" class="text-decoration-none text-sky-400 small" data-bs-toggle="modal" data-bs-target="#newCustomerModal">+ Thêm mới</a>
                </label>
                <select id="cart-customer-select" class="form-select bg-slate-800 border-secondary text-white">
                    <?php foreach($customers as $c): ?>
                        <option value="<?= $c['id'] ?>" data-phone="<?= $c['phone'] ?>" data-debt="<?= $c['debt'] ?>"><?= sanitize_input($c['name']) ?> (SĐT: <?= $c['phone'] ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>

            <!-- Tóm tắt số tiền -->
            <div class="space-y-2 mb-3">
                <div class="d-flex justify-content-between">
                    <span class="text-slate-400">Tổng tiền sản phẩm:</span>
                    <span class="fw-bold text-white fs-5" id="cart-subtotal">0 VNĐ</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-slate-400">Chiết khấu / Giảm giá:</span>
                    <input type="number" id="cart-discount" class="form-control form-control-sm bg-slate-800 border-secondary text-white text-end" style="width: 120px;" value="0" min="0" oninput="calculateTotal()">
                </div>
                <div class="d-flex justify-content-between border-top border-secondary pt-2">
                    <span class="text-slate-200 fw-bold fs-5">Thanh toán thực tế:</span>
                    <span class="fw-bold text-sky-400 fs-4" id="cart-grandtotal">0 VNĐ</span>
                </div>
            </div>

            <!-- Phương thức thanh toán -->
            <div class="mb-3">
                <label class="form-label text-slate-400">Hình Thức Thanh Toán <span class="shortcut-badge">F9</span></label>
                <div class="row g-2">
                    <div class="col-4">
                        <input type="radio" class="btn-check" name="payment_method" id="pay_cash" value="CASH" checked onclick="switchPayMode('CASH')">
                        <label class="btn btn-outline-slate-700 text-slate-300 w-100 py-2 small" for="pay_cash"><i class="fa-solid fa-money-bill me-1"></i> Tiền mặt</label>
                    </div>
                    <div class="col-4">
                        <input type="radio" class="btn-check" name="payment_method" id="pay_bank" value="BANK_TRANSFER" onclick="switchPayMode('BANK')">
                        <label class="btn btn-outline-slate-700 text-slate-300 w-100 py-2 small" for="pay_bank"><i class="fa-solid fa-qrcode me-1"></i> Chuyển khoản</label>
                    </div>
                    <div class="col-4">
                        <input type="radio" class="btn-check" name="payment_method" id="pay_debt" value="DEBT" onclick="switchPayMode('DEBT')">
                        <label class="btn btn-outline-slate-700 text-slate-300 w-100 py-2 small" for="pay_debt"><i class="fa-solid fa-handshake-angle me-1"></i> Ghi nợ</label>
                    </div>
                </div>
            </div>

            <!-- Panel nhập tiền nhận của khách (cho Tiền mặt) -->
            <div id="cash-payment-panel" class="p-3 bg-slate-800 rounded border border-slate-700 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-slate-300">Tiền khách đưa:</span>
                    <input type="number" id="cash-received" class="form-control bg-slate-900 border-slate-700 text-white text-end fw-bold text-success fs-5" style="width: 150px;" value="0" oninput="calculateChange()">
                </div>
                <div class="d-flex justify-content-between">
                    <span class="text-slate-300">Tiền trả lại:</span>
                    <span class="fw-bold text-warning fs-5" id="cash-change">0 VNĐ</span>
                </div>
            </div>

            <!-- Panel QR VietQR dynamic (cho Chuyển khoản) -->
            <div id="bank-payment-panel" class="p-3 bg-slate-800 rounded border border-slate-700 mb-3 d-none">
                <div class="text-center">
                    <p class="small text-slate-300 mb-2"><i class="fa-solid fa-circle-info text-sky-400"></i> Quét mã VietQR nhận tiền tức thì</p>
                    <div class="vietqr-box mx-auto" style="width: 130px; height: 130px;">
                        <!-- Render dynamic QR -->
                        <img id="vietqr-image-src" src="" alt="VietQR" class="img-fluid" style="height:110px;">
                    </div>
                    <small class="text-sky-300 mt-1 d-block font-mono">STK: 1024345678 (Vietcombank)</small>
                </div>
            </div>

            <!-- Nút tạo đơn hàng -->
            <button onclick="submitOrder()" class="btn btn-sky text-white w-100 py-3 fs-5 fw-bold bg-sky-600 hover:bg-sky-500 rounded shadow">
                <i class="fa-solid fa-print me-2"></i> THANH TOÁN & IN HOÁ ĐƠN <span class="shortcut-badge ms-2">F12</span>
            </button>
        </div>
    </div>
</div>

<!-- Modal Thêm Khách Hàng Nhanh -->
<div class="modal fade" id="newCustomerModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content bg-slate-800 text-white">
      <div class="modal-header border-secondary">
        <h5 class="modal-title fw-bold">Thêm nhanh khách hàng</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="new-customer-form">
            <div class="mb-3">
                <label class="form-label text-slate-300">Họ tên khách hàng</label>
                <input type="text" id="cust-name" class="form-control bg-slate-950 text-white border-secondary" required>
            </div>
            <div class="mb-3">
                <label class="form-label text-slate-300">Số điện thoại</label>
                <input type="text" id="cust-phone" class="form-control bg-slate-950 text-white border-secondary" required>
            </div>
            <div class="mb-3">
                <label class="form-label text-slate-300">Địa chỉ</label>
                <input type="text" id="cust-address" class="form-control bg-slate-950 text-white border-secondary">
            </div>
            <div class="mb-3">
                <label class="form-label text-slate-300">Hạn mức ghi nợ (VNĐ)</label>
                <input type="number" id="cust-maxdebt" class="form-control bg-slate-950 text-white border-secondary" value="5000000">
            </div>
            <button type="button" onclick="ajaxAddCustomer()" class="btn btn-primary w-100">Thêm khách hàng</button>
        </form>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<!-- TÍCH HỢP AJAX VÀ LOGIC POS TOÀN DIỆN -->
<script>
let allProducts = [];
let cart = [];

// Tải sản phẩm ban đầu bằng AJAX
async function loadProducts() {
    try {
        const response = await fetch('ajax.php?action=get_products');
        allProducts = await response.json();
        renderProducts(allProducts);
    } catch (e) {
        console.error("Lỗi đồng bộ sản phẩm", e);
    }
}

function renderProducts(products) {
    const container = document.getElementById('pos-products-list');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-slate-400">Không tìm thấy sản phẩm hợp lệ!</div>';
        return;
    }

    products.forEach(p => {
        container.innerHTML += \`
            <div class="col">
                <div class="product-card p-3 h-100 flex flex-col justify-between" onclick="addToCart('\${p.id}')">
                    <img src="\${p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=200'}" alt="\${p.name}" class="img-fluid rounded mb-2" style="height:120px; object-fit: cover; width:100%;">
                    <div>
                        <h6 class="fw-bold mb-1 text-white text-truncate">\${p.name}</h6>
                        <small class="text-slate-400 d-block mb-1">Mã: \${p.code}</small>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-sky-400 fw-bold">\${new Intl.NumberFormat('vi-VN').format(p.price)}đ</span>
                            <span class="badge \${p.stock > 10 ? 'bg-success' : 'bg-danger'}">Tồn: \${p.stock}</span>
                        </div>
                    </div>
                </div>
            </div>
        \`;
    });
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.quantity >= product.stock) {
            alert('Số lượng bán vượt quá hàng tồn kho khả dụng!');
            return;
        }
        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            unit: product.unit
        });
    }
    
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items-list-container');
    const badge = document.getElementById('cart-total-items-badge');
    
    if (cart.length === 0) {
        container.innerHTML = \`
            <div class="text-center text-slate-500 py-5">
                <i class="fa-solid fa-cart-flatbed fs-1 mb-3"></i>
                <p>Chưa có sản phẩm nào được chọn!</p>
            </div>
        \`;
        badge.innerText = '0 món';
        document.getElementById('cart-subtotal').innerText = '0 VNĐ';
        document.getElementById('cart-grandtotal').innerText = '0 VNĐ';
        return;
    }

    container.innerHTML = '';
    let totalItems = 0;
    let subtotal = 0;

    cart.forEach((item, index) => {
        totalItems += item.quantity;
        subtotal += item.price * item.quantity;
        
        container.innerHTML += \`
            <div class="d-flex justify-content-between align-items-center bg-slate-800 p-2 rounded mb-2 border border-slate-700">
                <div style="width: 60%;">
                    <h6 class="mb-0 fw-semibold text-white text-truncate">\${item.name}</h6>
                    <small class="text-slate-400">\${new Intl.NumberFormat('vi-VN').format(item.price)}đ / \${item.unit}</small>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-dark px-2" onclick="changeQty(\${index}, -1)">-</button>
                    <span class="text-white px-2 fw-bold">\${item.quantity}</span>
                    <button class="btn btn-sm btn-dark px-2" onclick="changeQty(\${index}, 1)">+</button>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeItem(\${index})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        \`;
    });

    badge.innerText = \`\${totalItems} món\`;
    document.getElementById('cart-subtotal').innerText = new Intl.NumberFormat('vi-VN').format(subtotal) + ' VNĐ';
    calculateTotal();
}

function changeQty(index, offset) {
    const item = cart[index];
    const originalProd = allProducts.find(p => p.id === item.id);
    if (!originalProd) return;

    const newQty = item.quantity + offset;
    if (newQty <= 0) {
        removeItem(index);
        return;
    }
    
    if (offset > 0 && newQty > originalProd.stock) {
        alert('Không đủ số lượng trong kho!');
        return;
    }

    item.quantity = newQty;
    updateCartUI();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function calculateTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = parseInt(document.getElementById('cart-discount').value) || 0;
    let grandtotal = Math.max(0, subtotal - discount);
    
    document.getElementById('cart-grandtotal').innerText = new Intl.NumberFormat('vi-VN').format(grandtotal) + ' VNĐ';
    
    // Cập nhật QR Code nếu đang chuyển khoản
    updateQR(grandtotal);
    calculateChange();
}

function updateQR(amount) {
    const customerSelect = document.getElementById('cart-customer-select');
    const custName = customerSelect.options[customerSelect.selectedIndex]?.text || "KHACH";
    const desc = "FLOW" + Math.floor(Math.random() * 9000 + 1000);
    // Chuẩn API tạo QR Banking thông minh của VietQR
    const qrUrl = \`https://img.vietqr.io/image/vietcombank-1024345678-compact.png?amount=\${amount}&addInfo=\${encodeURIComponent(desc)}&accountName=SalesFlow\`;
    document.getElementById('vietqr-image-src').src = qrUrl;
}

function switchPayMode(mode) {
    if (mode === 'CASH') {
        document.getElementById('cash-payment-panel').classList.remove('d-none');
        document.getElementById('bank-payment-panel').classList.add('d-none');
    } else if (mode === 'BANK') {
        document.getElementById('cash-payment-panel').classList.add('d-none');
        document.getElementById('bank-payment-panel').classList.remove('d-none');
        calculateTotal();
    } else {
        document.getElementById('cash-payment-panel').classList.add('d-none');
        document.getElementById('bank-payment-panel').classList.add('d-none');
    }
}

function calculateChange() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = parseInt(document.getElementById('cart-discount').value) || 0;
    let grandtotal = Math.max(0, subtotal - discount);
    
    let received = parseInt(document.getElementById('cash-received').value) || 0;
    let change = Math.max(0, received - grandtotal);
    
    document.getElementById('cash-change').innerText = new Intl.NumberFormat('vi-VN').format(change) + ' VNĐ';
}

function clearCart() {
    cart = [];
    updateCartUI();
    document.getElementById('cart-discount').value = 0;
}

// Xử lý gửi đơn bán hàng bằng AJAX qua API PHP
async function submitOrder() {
    if (cart.length === 0) {
        alert('Giỏ hàng trống! Vui lòng chọn sản phẩm để thanh toán.');
        return;
    }

    const customerSelect = document.getElementById('cart-customer-select');
    const customerId = customerSelect.value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    const discount = parseInt(document.getElementById('cart-discount').value) || 0;
    const paidAmount = paymentMethod === 'DEBT' ? 0 : (paymentMethod === 'CASH' ? (parseInt(document.getElementById('cash-received').value) || 0) : cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount);

    const orderData = {
        customerId,
        paymentMethod,
        discount,
        paidAmount,
        items: cart
    };

    try {
        const response = await fetch('ajax.php?action=create_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Hóa đơn lưu trữ thành công!');
            // Mở trang in hóa đơn chuẩn A5 trong tab mới
            window.open(\`print_invoice.php?order_id=\${result.order_id}\`, '_blank');
            clearCart();
            loadProducts();
        } else {
            alert('Thanh toán thất bại: ' + result.message);
        }
    } catch (e) {
        alert('Có lỗi xảy ra trong quá trình thanh toán kết nối máy chủ!');
    }
}

// Lắng nghe máy quét mã vạch
document.getElementById('barcode-scanner-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const code = this.value.trim();
        if (code) {
            const product = allProducts.find(p => p.code === code);
            if (product) {
                addToCart(product.id);
                this.value = '';
            } else {
                alert('Mã vạch sản phẩm không tồn tại trong hệ thống!');
                this.value = '';
            }
        }
    }
});

// Lắng nghe phím tắt POS tiện dụng
window.addEventListener('keydown', function(e) {
    if (e.key === 'F4') {
        e.preventDefault();
        document.getElementById('cart-customer-select').focus();
    }
    if (e.key === 'F9') {
        e.preventDefault();
        // Chuyển đổi phương thức thanh toán
        const cash = document.getElementById('pay_cash');
        const bank = document.getElementById('pay_bank');
        const debt = document.getElementById('pay_debt');
        if (cash.checked) { bank.click(); }
        else if (bank.checked) { debt.click(); }
        else { cash.click(); }
    }
    if (e.key === 'F12') {
        e.preventDefault();
        submitOrder();
    }
});

// Chạy tải tài nguyên khi bắt đầu
loadProducts();
</script>
</body>
</html>`
  },
  {
    name: 'print_invoice.php',
    path: 'print_invoice.php',
    description: 'Bản in hoá đơn A5 bán lẻ được tối ưu CSS @media print rõ nét cho tất cả các máy in nhiệt và văn phòng',
    content: `<?php
/**
 * File: print_invoice.php - Tối ưu in hoá đơn bán lẻ khổ A5 cho thiết bị máy in chuyên dụng
 */
require_once 'config.php';
check_auth();

$orderId = intval($_GET['order_id'] ?? 0);

// Truy vấn thông tin hoá đơn chi tiết
$stmt = $pdo->prepare("
    SELECT o.*, u.full_name AS seller_name, c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ? LIMIT 1
");
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) {
    die("Hoá đơn không tồn tại trên hệ thống!");
}

// Truy vấn chi tiết các mặt hàng trong hoá đơn
$stmtItems = $pdo->prepare("
    SELECT od.*, p.name AS product_name, p.unit
    FROM order_details od
    JOIN products p ON od.product_id = p.id
    WHERE od.order_id = ?
");
$stmtItems->execute([$orderId]);
$items = $stmtItems->fetchAll();
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>In hóa đơn <?= $order['code'] ?></title>
    <!-- FontAwesome & PDF Generation Libraries -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #fff;
            font-size: 14px;
        }
        .invoice-box {
            max-width: 148mm; /* Chuẩn chiều rộng khổ A5 ngang hoặc dọc */
            margin: auto;
            border: 1px solid #eee;
            padding: 15px;
            border-radius: 5px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px dashed #333;
            padding-bottom: 10px;
        }
        .header h2 {
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-top: 15px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-style: italic;
            font-size: 12px;
        }
        @media print {
            body {
                padding: 0;
            }
            .invoice-box {
                border: none;
                max-width: 100%;
            }
            /* Ẩn nút in khi đang in thực tế */
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>

<div class="no-print" style="text-align: center; margin-bottom: 20px; display: flex; justify-content: center; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 20px; background-color: #0ea5e9; color: #fff; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
        <i class="fa fa-print"></i> TIẾN HÀNH IN HOÁ ĐƠN (A5)
    </button>
    <button onclick="exportInvoiceToPDF()" style="padding: 10px 20px; background-color: #10b981; color: #fff; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
        <i class="fa fa-file-pdf"></i> XUẤT HÓA ĐƠN ĐIỆN TỬ (PDF)
    </button>
</div>

<div class="invoice-box">
    <div class="header">
        <h2>CỬA HÀNG TIỆN LỢI SALESFLOW</h2>
        <p>ĐC: 45 Lê Lợi, Bến Nghé, Quận 1, TP. HCM</p>
        <p>SĐT: 0988.123.456 - Website: salesflow.vn</p>
        <h3>HÓA ĐƠN BÁN HÀNG</h3>
        <p>Mã HĐ: <strong><?= $order['code'] ?></strong> | Ngày: <?= $order['created_at'] ?></p>
    </div>

    <div>
        <p><strong>Khách hàng:</strong> <?= sanitize_input($order['customer_name'] ?? 'Khách vãng lai') ?></p>
        <?php if (!empty($order['customer_phone'])): ?>
            <p><strong>Số điện thoại:</strong> <?= sanitize_input($order['customer_phone']) ?></p>
            <p><strong>Địa chỉ:</strong> <?= sanitize_input($order['customer_address'] ?? 'N/A') ?></p>
        <?php endif; ?>
        <p><strong>Thu ngân:</strong> <?= sanitize_input($order['seller_name']) ?></p>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>SP</th>
                <th class="text-right">SL</th>
                <th class="text-right">Đơn giá</th>
                <th class="text-right">Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($items as $item): ?>
                <tr>
                    <td><?= sanitize_input($item['product_name']) ?></td>
                    <td class="text-right"><?= $item['quantity'] ?></td>
                    <td class="text-right"><?= number_format($item['price'], 0, ',', '.') ?>đ</td>
                    <td class="text-right"><?= number_format($item['price'] * $item['quantity'], 0, ',', '.') ?>đ</td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <div class="totals" style="float: right; width: 250px;">
        <div style="display: flex; justify-content: space-between;">
            <span>Tổng cộng:</span>
            <span><?= number_format($order['total_amount'], 0, ',', '.') ?>đ</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: red;">
            <span>Chiết khấu:</span>
            <span>-<?= number_format($order['discount'], 0, ',', '.') ?>đ</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #333; padding-top: 5px; font-size: 16px;">
            <span>Thanh toán:</span>
            <span><?= number_format($order['final_amount'], 0, ',', '.') ?>đ</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #555; font-size: 12px; margin-top: 5px;">
            <span>Đã đưa:</span>
            <span><?= number_format($order['paid_amount'], 0, ',', '.') ?>đ</span>
        </div>
    </div>
    
    <div style="clear: both;"></div>

    <div class="footer">
        <p>Cảm ơn quý khách đã tin dùng sản phẩm!</p>
        <p>Hóa đơn chỉ có giá trị đổi trả trong vòng 24 giờ kể từ lúc xuất.</p>
    </div>
</div>

<script>
    async function exportInvoiceToPDF() {
        const { jsPDF } = window.jspdf;
        const element = document.querySelector('.invoice-box');
        
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a5'
            });
            
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
            
            pdf.save('HoaDon_' + '<?= $order['code'] ?>' + '.pdf');
        } catch (error) {
            console.error('Lỗi xuất PDF:', error);
            alert('Đã xảy ra lỗi khi tạo tệp PDF hóa đơn!');
        }
    }

    // Tự động kích hoạt hộp thoại in của trình duyệt sau 1 giây
    window.onload = function() {
        setTimeout(function() {
            window.print();
        }, 1000);
    }
</script>
</body>
</html>`
  },
  {
    name: 'ajax.php',
    path: 'ajax.php',
    description: 'API xử lý AJAX tập trung kiểm tra hàng tồn, quản lý giỏ hàng POS và cập nhật công nợ trực tiếp',
    content: `<?php
/**
 * File: ajax.php - Cổng xử lý API và AJAX tập trung toàn hệ thống
 */
require_once 'config.php';

header('Content-Type: application/json');

// Chặn truy cập trực tiếp không qua đăng nhập
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Phiên đăng nhập đã hết hạn!']);
    exit;
}

$action = sanitize_input($_GET['action'] ?? '');

switch ($action) {
    // 1. LẤY TOÀN BỘ SẢN PHẨM KHẢ DỤNG CHO POS
    case 'get_products':
        try {
            $stmt = $pdo->query("SELECT * FROM products WHERE status = 1 ORDER BY id DESC");
            $products = $stmt->fetchAll();
            echo json_encode($products);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    // 2. TẠO NHANH KHÁCH HÀNG TỪ MODAL POS
    case 'add_customer':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $name = sanitize_input($_POST['name'] ?? '');
            $phone = sanitize_input($_POST['phone'] ?? '');
            $address = sanitize_input($_POST['address'] ?? '');
            $maxDebt = floatval($_POST['max_debt'] ?? 5000000);

            if (empty($name) || empty($phone)) {
                echo json_encode(['success' => false, 'message' => 'Họ tên và Số điện thoại không được để trống!']);
                exit;
            }

            try {
                // Kiểm tra trùng SĐT
                $chk = $pdo->prepare("SELECT id FROM customers WHERE phone = ?");
                $chk->execute([$phone]);
                if ($chk->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Số điện thoại này đã thuộc về một khách hàng khác!']);
                    exit;
                }

                $stmt = $pdo->prepare("INSERT INTO customers (name, phone, address, max_debt_limit) VALUES (?, ?, ?, ?)");
                $stmt->execute([$name, $phone, $address, $maxDebt]);
                $newId = $pdo->lastInsertId();

                log_activity($pdo, 'Thêm khách hàng', "Thêm nhanh khách hàng mới: $name ($phone)");

                echo json_encode([
                    'success' => true, 
                    'message' => 'Thêm khách hàng thành công!', 
                    'customer' => ['id' => $newId, 'name' => $name, 'phone' => $phone]
                ]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'message' => 'Lỗi máy chủ cơ sở dữ liệu: ' . $e->getMessage()]);
            }
        }
        break;

    // 3. XỬ LÝ THANH TOÁN HOÁ ĐƠN POS
    case 'create_order':
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!$data || empty($data['items'])) {
            echo json_encode(['success' => false, 'message' => 'Giỏ hàng bán trống rỗng!']);
            exit;
        }

        $customerId = intval($data['customerId'] ?? 1); // 1 là Khách lẻ vãng lai
        $paymentMethod = sanitize_input($data['paymentMethod'] ?? 'CASH');
        $discount = floatval($data['discount'] ?? 0);
        $items = $data['items'];

        try {
            // Khởi động Database Transaction phòng trường hợp lỗi giữa chừng
            $pdo->beginTransaction();

            // Tính toán tổng tiền hóa đơn
            $totalAmount = 0;
            foreach ($items as $item) {
                $totalAmount += floatval($item['price']) * intval($item['quantity']);
            }
            
            $finalAmount = max(0, $totalAmount - $discount);
            $paidAmount = floatval($data['paidAmount'] ?? $finalAmount);
            if ($paymentMethod === 'DEBT') {
                $paidAmount = 0;
            }
            $changeAmount = max(0, $paidAmount - $finalAmount);

            // Sinh mã hóa đơn tự động HDxxxxx
            $code = 'HD' . strtoupper(substr(uniqid(), 7, 5));

            // Lưu bảng hóa đơn
            $stmtOrder = $pdo->prepare("
                INSERT INTO orders (code, customer_id, user_id, total_amount, discount, final_amount, paid_amount, change_amount, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtOrder->execute([
                $code, 
                $customerId == 1 ? null : $customerId, 
                $_SESSION['user_id'], 
                $totalAmount, 
                $discount, 
                $finalAmount, 
                $paidAmount, 
                $changeAmount, 
                $paymentMethod
            ]);
            $orderId = $pdo->lastInsertId();

            // Lưu chi tiết sản phẩm & Trừ tồn kho trực tiếp
            $stmtDetail = $pdo->prepare("INSERT INTO order_details (order_id, product_id, price, quantity) VALUES (?, ?, ?, ?)");
            $stmtMinusStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

            foreach ($items as $item) {
                $pId = intval($item['id']);
                $qty = intval($item['quantity']);
                $price = floatval($item['price']);

                // Kiểm tra tồn kho thực tế trước khi lưu
                $chkStock = $pdo->prepare("SELECT stock, name FROM products WHERE id = ?");
                $chkStock->execute([$pId]);
                $p = $chkStock->fetch();
                if ($p['stock'] < $qty) {
                    throw new Exception("Sản phẩm '{$p['name']}' không đủ hàng tồn kho khả dụng (Yêu cầu: $qty, Hiện có: {$p['stock']})!");
                }

                // Chèn bảng chi tiết
                $stmtDetail->execute([$orderId, $pId, $price, $qty]);
                // Trừ kho
                $stmtMinusStock->execute([$qty, $pId]);
            }

            // Xử lý Ghi Nợ nếu khách hàng nợ tiền mua
            if ($paymentMethod === 'DEBT' && $customerId != 1) {
                // Tải hạn mức nợ hiện tại
                $stmtCust = $pdo->prepare("SELECT debt, max_debt_limit, name FROM customers WHERE id = ?");
                $stmtCust->execute([$customerId]);
                $c = $stmtCust->fetch();
                
                $newDebt = $c['debt'] + $finalAmount;
                if ($newDebt > $c['max_debt_limit']) {
                    throw new Exception("Vượt quá hạn mức ghi nợ tối đa cho phép của khách hàng '{$c['name']}' (Hạn mức tối đa: " . number_format($c['max_debt_limit']) . "đ)!");
                }

                // Cập nhật nợ vào bảng khách hàng
                $updDebt = $pdo->prepare("UPDATE customers SET debt = ? WHERE id = ?");
                $updDebt->execute([$newDebt, $customerId]);

                // Ghi nhật ký công nợ
                $stmtDebtLog = $pdo->prepare("INSERT INTO debt_logs (partner_id, partner_type, amount, balance_after, note) VALUES (?, 'CUSTOMER', ?, ?, ?)");
                $stmtDebtLog->execute([$customerId, $finalAmount, $newDebt, "Ghi nợ tự động từ Hoá đơn $code"]);
            }

            // Hoàn tất Transaction thành công
            $pdo->commit();
            log_activity($pdo, 'Bán hàng POS', "Xuất thành công hóa đơn $code, giá trị thanh toán: " . number_format($finalAmount) . " VNĐ");

            echo json_encode(['success' => true, 'order_id' => $orderId, 'code' => $code]);

        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Hành động không được hỗ trợ!']);
        break;
}
?>`
  },
  {
    name: 'products.php',
    path: 'products.php',
    description: 'Giao diện quản lý Sản phẩm và Danh mục hàng hoá, tích hợp nút tạo Barcode và thiết lập mức cảnh báo kho hàng',
    content: `<?php
/**
 * File: products.php - Quản lý Sản phẩm & Danh mục nhóm hàng hóa
 */
require_once 'config.php';
check_auth(['ADMIN', 'STOCKKEEPER']); // Chỉ Admin và Thủ kho được thay đổi kho

$msg = '';
$err = '';

// 1. XỬ LÝ THÊM DANH MỤC MỚI
if (isset($_POST['add_category'])) {
    $name = sanitize_input($_POST['cat_name'] ?? '');
    $desc = sanitize_input($_POST['cat_desc'] ?? '');
    
    if (empty($name)) {
        $err = "Tên danh mục không được bỏ trống!";
    } else {
        try {
            $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
            $stmt->execute([$name, $desc]);
            $msg = "Thêm danh mục '$name' thành công!";
            log_activity($pdo, 'Thêm danh mục', "Tạo nhóm danh mục sản phẩm: $name");
        } catch (Exception $e) {
            $err = "Danh mục đã tồn tại trong hệ thống!";
        }
    }
}

// 2. XỬ LÝ THÊM SẢN PHẨM MỚI
if (isset($_POST['add_product'])) {
    $code = sanitize_input($_POST['prod_code'] ?? '');
    $name = sanitize_input($_POST['prod_name'] ?? '');
    $catId = intval($_POST['prod_cat_id'] ?? 0);
    $importPrice = floatval($_POST['prod_import_price'] ?? 0);
    $price = floatval($_POST['prod_price'] ?? 0);
    $stock = intval($_POST['prod_stock'] ?? 0);
    $minStock = intval($_POST['prod_min_stock'] ?? 10);
    $unit = sanitize_input($_POST['prod_unit'] ?? 'Cái');

    if (empty($code) || empty($name) || $catId === 0) {
        $err = "Vui lòng cung cấp đầy đủ thông tin mã vạch, tên sản phẩm và chọn danh mục!";
    } else {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO products (code, name, category_id, import_price, price, stock, min_stock, unit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$code, $name, $catId, $importPrice, $price, $stock, $minStock, $unit]);
            $msg = "Thêm mới hàng hoá '$name' vào kho thành công!";
            log_activity($pdo, 'Thêm sản phẩm', "Khởi tạo sản phẩm mới: $name ($code)");
        } catch (Exception $e) {
            $err = "Mã vạch sản phẩm '$code' đã được dùng cho mặt hàng khác!";
        }
    }
}

// Lấy danh sách danh mục để vẽ dropdown và bảng
$categories = $pdo->query("SELECT * FROM categories ORDER BY id DESC")->fetchAll();
// Lấy danh sách sản phẩm
$products = $pdo->query("
    SELECT p.*, c.name AS category_name 
    FROM products p 
    JOIN categories c ON p.category_id = c.id 
    ORDER BY p.id DESC
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Quản lý Sản phẩm - SalesFlow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="fa-solid fa-boxes-stacked text-primary me-2"></i> Quản lý kho hàng hoá</h2>
        <a href="index.php" class="btn btn-outline-secondary"><i class="fa fa-arrow-left"></i> Về Dashboard</a>
    </div>

    <?php if(!empty($msg)): ?>
        <div class="alert alert-success alert-dismissible fade show"><?= $msg ?><button class="btn-close" data-bs-dismiss="alert"></button></div>
    <?php endif; ?>
    <?php if(!empty($err)): ?>
        <div class="alert alert-danger alert-dismissible fade show"><?= $err ?><button class="btn-close" data-bs-dismiss="alert"></button></div>
    <?php endif; ?>

    <div class="row g-4">
        <!-- Panel Thêm danh mục & Sản phẩm mới -->
        <div class="col-md-4">
            <!-- Thêm Danh mục -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-dark text-white fw-bold">Thêm danh mục mới</div>
                <div class="card-body">
                    <form action="products.php" method="POST">
                        <div class="mb-3">
                            <label class="form-label">Tên danh mục</label>
                            <input type="text" name="cat_name" class="form-control" required placeholder="Ví dụ: Đồ uống đóng chai">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Mô tả chi tiết</label>
                            <textarea name="cat_desc" class="form-control" rows="2" placeholder="Thông tin ngắn gọn..."></textarea>
                        </div>
                        <button type="submit" name="add_category" class="btn btn-primary w-100"><i class="fa fa-plus"></i> Tạo danh mục</button>
                    </form>
                </div>
            </div>

            <!-- Thêm Sản phẩm -->
            <div class="card shadow-sm">
                <div class="card-header bg-dark text-white fw-bold">Khai báo sản phẩm mới</div>
                <div class="card-body">
                    <form action="products.php" method="POST">
                        <div class="mb-3">
                            <label class="form-label">Mã vạch / Barcode</label>
                            <div class="input-group">
                                <input type="text" name="prod_code" id="prod_code" class="form-control" required placeholder="Sử dụng súng quét hoặc nhập">
                                <button type="button" class="btn btn-outline-secondary" onclick="generateRandomBarcode()">Tự sinh</button>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Tên hàng hóa</label>
                            <input type="text" name="prod_name" class="form-control" required placeholder="Ví dụ: Nước ngọt Coca-cola chai 390ml">
                        </div>
                        <div class="row">
                            <div class="col-6 mb-3">
                                <label class="form-label">Danh mục nhóm</label>
                                <select name="prod_cat_id" class="form-select" required>
                                    <option value="">-- Chọn danh mục --</option>
                                    <?php foreach($categories as $cat): ?>
                                        <option value="<?= $cat['id'] ?>"><?= sanitize_input($cat['name']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="col-6 mb-3">
                                <label class="form-label">Đơn vị tính</label>
                                <input type="text" name="prod_unit" class="form-control" value="Cái" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6 mb-3">
                                <label class="form-label">Giá nhập kho (đ)</label>
                                <input type="number" name="prod_import_price" class="form-control" value="0" required>
                            </div>
                            <div class="col-6 mb-3">
                                <label class="form-label">Giá niêm yết bán (đ)</label>
                                <input type="number" name="prod_price" class="form-control" value="0" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6 mb-3">
                                <label class="form-label">Số lượng tồn kho</label>
                                <input type="number" name="prod_stock" class="form-control" value="0" required>
                            </div>
                            <div class="col-6 mb-3">
                                <label class="form-label">Tồn tối thiểu cảnh báo</label>
                                <input type="number" name="prod_min_stock" class="form-control" value="10" required>
                            </div>
                        </div>
                        <button type="submit" name="add_product" class="btn btn-success w-100"><i class="fa fa-save"></i> Lưu hàng hóa</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Bảng Sản phẩm bên Phải -->
        <div class="col-md-8">
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white py-3 fw-bold fs-5">
                    Danh sách sản phẩm hiện có
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Mã vạch</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Nhóm hàng</th>
                                    <th class="text-end">Giá bán</th>
                                    <th class="text-center">Tồn kho</th>
                                    <th class="text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($products as $p): ?>
                                    <tr>
                                        <td><code class="fw-bold text-dark"><?= $p['code'] ?></code></td>
                                        <td class="fw-semibold"><?= sanitize_input($p['name']) ?></td>
                                        <td><?= sanitize_input($p['category_name']) ?></td>
                                        <td class="text-end text-success fw-bold"><?= format_currency($p['price']) ?></td>
                                        <td class="text-center">
                                            <span class="badge <?= $p['stock'] <= $p['min_stock'] ? 'bg-danger' : 'bg-success' ?>">
                                                <?= $p['stock'] ?> <?= $p['unit'] ?>
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <?= $p['status'] == 1 ? '<span class="badge bg-light text-success border border-success">Đang bán</span>' : '<span class="badge bg-light text-danger border border-danger">Ngừng</span>' ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function generateRandomBarcode() {
    // Tạo chuỗi mã vạch giả lập GS1 chuẩn 13 số
    let code = "893" + Math.floor(1000000000 + Math.random() * 9000000000);
    document.getElementById('prod_code').value = code;
}
</script>
</body>
</html>`
  },
  {
    name: 'customers.php',
    path: 'customers.php',
    description: 'Bảng quản lý thông tin khách hàng, số dư công nợ phát sinh và lịch sử thanh toán nợ',
    content: `<?php
/**
 * File: customers.php - Quản lý Khách hàng và Công nợ (Receivables)
 */
require_once 'config.php';
check_auth(['ADMIN', 'SELLER']);

$msg = '';
$err = '';

// Xử lý thu nợ từ khách hàng
if (isset($_POST['pay_debt'])) {
    $customerId = intval($_POST['customer_id'] ?? 0);
    $payAmount = floatval($_POST['pay_amount'] ?? 0);
    $note = sanitize_input($_POST['pay_note'] ?? 'Khách hàng thanh toán bớt nợ');

    if ($customerId > 0 && $payAmount > 0) {
        try {
            $pdo->beginTransaction();
            
            // Lấy dư nợ hiện tại
            $stmt = $pdo->prepare("SELECT debt, name FROM customers WHERE id = ? FOR UPDATE");
            $stmt->execute([$customerId]);
            $cust = $stmt->fetch();
            
            if ($cust) {
                if ($payAmount > $cust['debt']) {
                    throw new Exception("Số tiền thu nợ vượt quá dư nợ thực tế của khách hàng!");
                }

                $newDebt = $cust['debt'] - $payAmount;
                
                // Cập nhật nợ mới
                $upd = $pdo->prepare("UPDATE customers SET debt = ? WHERE id = ?");
                $upd->execute([$newDebt, $customerId]);

                // Lưu nhật ký công nợ
                $insLog = $pdo->prepare("INSERT INTO debt_logs (partner_id, partner_type, amount, balance_after, note) VALUES (?, 'CUSTOMER', ?, ?, ?)");
                $insLog->execute([$customerId, -$payAmount, $newDebt, $note]);

                $pdo->commit();
                $msg = "Đã thu thành công " . number_format($payAmount) . "đ nợ từ khách hàng '{$cust['name']}'!";
                log_activity($pdo, 'Thu nợ', "Thu nợ khách hàng '{$cust['name']}': " . number_format($payAmount) . " VNĐ");
            }
        } catch (Exception $e) {
            $pdo->rollBack();
            $err = $e->getMessage();
        }
    }
}

// Lấy danh sách khách hàng và dư nợ
$customers = $pdo->query("SELECT * FROM customers ORDER BY debt DESC, id DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Quản lý Khách hàng & Công nợ - SalesFlow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="fa-solid fa-users text-primary me-2"></i> Khách hàng & Sổ nợ công nợ</h2>
        <a href="index.php" class="btn btn-outline-secondary"><i class="fa fa-arrow-left"></i> Dashboard</a>
    </div>

    <?php if(!empty($msg)): ?>
        <div class="alert alert-success"><?= $msg ?></div>
    <?php endif; ?>
    <?php if(!empty($err)): ?>
        <div class="alert alert-danger"><?= $err ?></div>
    <?php endif; ?>

    <div class="card shadow-sm border-0">
        <div class="card-header bg-dark text-white fw-bold py-3">Danh sách khách hàng & Dư nợ hiện tại</div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Họ tên khách hàng</th>
                            <th>Số điện thoại</th>
                            <th>Địa chỉ nhận hàng</th>
                            <th class="text-end">Hạn mức nợ tối đa</th>
                            <th class="text-end">Dư nợ hiện hành</th>
                            <th class="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($customers as $c): ?>
                            <tr>
                                <td class="fw-bold text-slate-800"><?= sanitize_input($c['name']) ?></td>
                                <td><?= sanitize_input($c['phone']) ?></td>
                                <td class="text-muted"><?= sanitize_input($c['address'] ?? 'Khách vãng lai') ?></td>
                                <td class="text-end font-mono text-secondary"><?= format_currency($c['max_debt_limit']) ?></td>
                                <td class="text-end font-mono fw-bold <?= $c['debt'] > 0 ? 'text-danger' : 'text-success' ?>">
                                    <?= format_currency($c['debt']) ?>
                                </td>
                                <td class="text-center">
                                    <?php if($c['debt'] > 0): ?>
                                        <button class="btn btn-sm btn-outline-danger" onclick="openCollectDebtModal(<?= $c['id'] ?>, '<?= sanitize_input($c['name']) ?>', <?= $c['debt'] ?>)">
                                            <i class="fa fa-money-bill-wave"></i> Thu nợ
                                        </button>
                                    <?php else: ?>
                                        <span class="text-muted small">-</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Modal Thu Nợ -->
<div class="modal fade" id="collectDebtModal" tabindex="-1">
    <div class="modal-dialog">
        <form action="customers.php" method="POST" class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold">Thu tiền nợ từ khách hàng</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" name="customer_id" id="modal_cust_id">
                <div class="mb-3">
                    <label class="form-label">Tên khách hàng</label>
                    <input type="text" id="modal_cust_name" class="form-control" readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Dư nợ hiện hành (đ)</label>
                    <input type="text" id="modal_cust_debt" class="form-control text-danger fw-bold" readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Số tiền khách nộp trả (đ)</label>
                    <input type="number" name="pay_amount" id="modal_pay_amount" class="form-control" required min="1">
                </div>
                <div class="mb-3">
                    <label class="form-label">Ghi chú giao dịch</label>
                    <input type="text" name="pay_note" class="form-control" value="Khách nộp tiền trả nợ tại quầy">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                <button type="submit" name="pay_debt" class="btn btn-success">Ghi nhận thu nợ</button>
            </div>
        </form>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
function openCollectDebtModal(id, name, debt) {
    document.getElementById('modal_cust_id').value = id;
    document.getElementById('modal_cust_name').value = name;
    document.getElementById('modal_cust_debt').value = new Intl.NumberFormat('vi-VN').format(debt) + ' VNĐ';
    document.getElementById('modal_pay_amount').max = debt;
    document.getElementById('modal_pay_amount').value = debt;
    
    var myModal = new bootstrap.Modal(document.getElementById('collectDebtModal'));
    myModal.show();
}
</script>
</body>
</html>`
  },
  {
    name: 'backup.php',
    path: 'backup.php',
    description: 'Hệ thống tự động sao lưu toàn bộ dữ liệu MySQL ra file SQL nén lưu trữ an toàn',
    content: `<?php
/**
 * File: backup.php - Backup và xuất dữ liệu hệ thống bán hàng an toàn
 */
require_once 'config.php';
check_auth(['ADMIN']); // Chỉ duy nhất Admin được phép backup toàn hệ thống

$msg = '';

if (isset($_GET['action']) && $_GET['action'] === 'export') {
    // Đặt tiêu đề tải xuống trực tiếp file SQL từ trình duyệt
    $fileName = 'salesflow_backup_' . date('Y-m-d_H-i-s') . '.sql';
    
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename=' . $fileName);
    header('Pragma: no-cache');
    header('Expires: 0');

    // Mở file buffer output
    $out = fopen('php://output', 'w');
    
    // Ghi tiêu đề file SQL
    fwrite($out, "-- ====================================================\n");
    fwrite($out, "-- SALESFLOW AUTO BACKUP DATABASE SYSTEM\n");
    fwrite($out, "-- NGÀY KHỞI TẠO: " . date('Y-m-d H:i:s') . "\n");
    fwrite($out, "-- ====================================================\n\n");
    
    // Khai báo danh sách các bảng dữ liệu theo thứ tự ưu tiên
    $tables = ['roles', 'users', 'categories', 'products', 'customers', 'suppliers', 'orders', 'order_details', 'purchase_orders', 'purchase_order_details', 'debt_logs', 'activity_logs'];
    
    foreach ($tables as $table) {
        fwrite($out, "-- DROP TABLE IF EXISTS \`$table\`;\n");
        
        // Lấy định nghĩa cấu trúc bảng
        $stmtCreate = $pdo->query("SHOW CREATE TABLE \`$table\`");
        $rowCreate = $stmtCreate->fetch();
        fwrite($out, $rowCreate['Create Table'] . ";\n\n");
        
        // Dump dữ liệu các bản ghi
        $stmtRows = $pdo->query("SELECT * FROM \`$table\`");
        while ($row = $stmtRows->fetch(PDO::FETCH_NUM)) {
            $values = array_map(function($val) use ($pdo) {
                if ($val === null) return 'NULL';
                return $pdo->quote($val);
            }, $row);
            
            fwrite($out, "INSERT INTO \`$table\` VALUES (" . implode(', ', $values) . ");\n");
        }
        fwrite($out, "\n-- ----------------------------------------------------\n\n");
    }
    
    fclose($out);
    
    // Ghi nhật ký hệ thống
    log_activity($pdo, 'Sao lưu cơ sở dữ liệu', "Admin xuất thành công file sao lưu $fileName qua giao diện Web");
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Sao lưu dữ liệu hệ thống - SalesFlow</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<div class="container py-5">
    <div class="max-w-md mx-auto">
        <div class="card shadow border-0 rounded-3">
            <div class="card-body text-center p-5">
                <div class="text-success mb-4">
                    <i class="fa-solid fa-cloud-arrow-down fs-1"></i>
                </div>
                <h3 class="fw-bold mb-2">Sao lưu Dữ liệu Hệ thống</h3>
                <p class="text-muted mb-4">Nhấp vào nút bên dưới để tải về toàn bộ cơ sở dữ liệu (Schema & Data) dạng file nén <code>.sql</code>. Khuyến nghị thực hiện cuối mỗi ngày làm việc để tránh mất mát dữ liệu.</p>
                
                <a href="backup.php?action=export" class="btn btn-success btn-lg px-4 py-3 w-100 fw-bold">
                    <i class="fa fa-download me-2"></i> TẢI VỀ BẢN SAO LƯU (.SQL)
                </a>
                
                <div class="mt-4">
                    <a href="index.php" class="text-decoration-none small text-secondary"><i class="fa fa-arrow-left"></i> Quay lại trang chủ</a>
                </div>
            </div>
        </div>
    </div>
</div>

</body>
</html>`
  }
];

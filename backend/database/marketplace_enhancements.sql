-- ====================================================
-- MARKETPLACE ENHANCEMENTS - Database Migrations
-- Run this SQL file to add all new features
-- All changes are non-breaking and preserve existing data
-- ====================================================

USE themehub_db;

-- ====================================================
-- 1. SELLER (AUTHOR) MANAGEMENT SYSTEM
-- ====================================================

-- Sellers Table
CREATE TABLE IF NOT EXISTS sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    profile_image VARCHAR(500) DEFAULT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verification_documents JSON DEFAULT NULL,
    commission_rate DECIMAL(5, 2) DEFAULT 70.00 COMMENT 'Percentage seller receives (default 70%)',
    total_earnings DECIMAL(12, 2) DEFAULT 0.00,
    pending_earnings DECIMAL(12, 2) DEFAULT 0.00,
    badge ENUM('new_author', 'rising_star', 'elite', 'none') DEFAULT 'none',
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_verification (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seller Earnings History
CREATE TABLE IF NOT EXISTS seller_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_seller (seller_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================
-- 2. PRODUCT APPROVAL & VERSIONING
-- ====================================================

-- Add product lifecycle fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_id INT NULL AFTER framework_id,
ADD COLUMN IF NOT EXISTS status ENUM('draft', 'pending_review', 'approved', 'rejected', 'needs_changes') DEFAULT 'draft' AFTER offer_price,
ADD COLUMN IF NOT EXISTS admin_feedback TEXT NULL AFTER status,
ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0' AFTER admin_feedback,
ADD COLUMN IF NOT EXISTS changelog TEXT NULL AFTER version,
ADD COLUMN IF NOT EXISTS reviewed_by INT NULL AFTER changelog,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL DEFAULT NULL AFTER reviewed_by,
ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0 AFTER reviewed_at,
ADD COLUMN IF NOT EXISTS is_trending TINYINT(1) DEFAULT 0 AFTER is_featured;

-- Add foreign keys
ALTER TABLE products 
ADD CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_product_reviewer FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL;

-- Product Versions Archive
CREATE TABLE IF NOT EXISTS product_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    version VARCHAR(20) NOT NULL,
    file_url VARCHAR(500) DEFAULT NULL,
    file_name VARCHAR(255) DEFAULT NULL,
    changelog TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================
-- 3. REVIEWS & TRUST SYSTEM
-- ====================================================

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    seller_id INT NULL COMMENT 'Seller who can reply',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) DEFAULT NULL,
    review_text TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    admin_notes TEXT DEFAULT NULL,
    seller_reply TEXT DEFAULT NULL,
    seller_reply_at TIMESTAMP NULL DEFAULT NULL,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seller Reputation (calculated from reviews)
CREATE TABLE IF NOT EXISTS seller_reputation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL UNIQUE,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    five_star_count INT DEFAULT 0,
    four_star_count INT DEFAULT 0,
    three_star_count INT DEFAULT 0,
    two_star_count INT DEFAULT 0,
    one_star_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================
-- 4. MARKETING & PROMOTIONS
-- ====================================================

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0.00,
    max_discount DECIMAL(10, 2) DEFAULT NULL,
    usage_limit INT DEFAULT NULL COMMENT 'Total usage limit',
    usage_count INT DEFAULT 0,
    user_limit INT DEFAULT 1 COMMENT 'Per user usage limit',
    seller_id INT NULL COMMENT 'NULL = global coupon, else seller-specific',
    category_id INT NULL COMMENT 'NULL = all categories, else category-specific',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    created_by INT NULL COMMENT 'Admin who created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Coupon Usage Tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_coupon (coupon_id),
    INDEX idx_user (user_id),
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================
-- 5. ROLE-BASED ACCESS CONTROL (RBAC)
-- ====================================================

-- Admin Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default roles
INSERT INTO admin_roles (name, description) VALUES
('super_admin', 'Full system access'),
('admin', 'General administration'),
('moderator', 'Content moderation and reviews'),
('finance', 'Financial operations and payouts'),
('support', 'Customer support')
ON DUPLICATE KEY UPDATE name=name;

-- Admin Permissions Table
CREATE TABLE IF NOT EXISTS admin_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL COMMENT 'Resource name (products, orders, sellers, etc.)',
    action VARCHAR(50) NOT NULL COMMENT 'Action (read, write, approve, payout, etc.)',
    description TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default permissions
INSERT INTO admin_permissions (name, resource, action, description) VALUES
('products.read', 'products', 'read', 'View products'),
('products.write', 'products', 'write', 'Create/edit products'),
('products.approve', 'products', 'approve', 'Approve/reject products'),
('products.delete', 'products', 'delete', 'Delete products'),
('orders.read', 'orders', 'read', 'View orders'),
('orders.write', 'orders', 'write', 'Update orders'),
('sellers.read', 'sellers', 'read', 'View sellers'),
('sellers.write', 'sellers', 'write', 'Create/edit sellers'),
('sellers.approve', 'sellers', 'approve', 'Approve/verify sellers'),
('sellers.suspend', 'sellers', 'suspend', 'Suspend sellers'),
('sellers.payout', 'sellers', 'payout', 'Process seller payouts'),
('reviews.read', 'reviews', 'read', 'View reviews'),
('reviews.moderate', 'reviews', 'moderate', 'Approve/reject reviews'),
('users.read', 'users', 'read', 'View users'),
('users.write', 'users', 'write', 'Create/edit users'),
('coupons.read', 'coupons', 'read', 'View coupons'),
('coupons.write', 'coupons', 'write', 'Create/edit coupons'),
('analytics.read', 'analytics', 'read', 'View analytics'),
('reports.export', 'reports', 'export', 'Export reports')
ON DUPLICATE KEY UPDATE name=name;

-- Role-Permission Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assign permissions to roles
-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM admin_permissions
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Admin: Most permissions except payouts
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM admin_permissions WHERE name != 'sellers.payout'
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Moderator: Content moderation
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM admin_permissions 
WHERE resource IN ('products', 'reviews') AND action IN ('read', 'approve', 'moderate')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Finance: Financial operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM admin_permissions 
WHERE resource IN ('orders', 'sellers', 'analytics', 'reports') AND action IN ('read', 'payout', 'export')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Support: Customer support
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM admin_permissions 
WHERE resource IN ('users', 'orders', 'reviews') AND action IN ('read', 'write')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Add role_id to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS role_id INT DEFAULT 2 COMMENT 'Default: admin' AFTER password,
ADD CONSTRAINT fk_admin_role FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE SET NULL;

-- Update existing admin to super_admin
UPDATE admins SET role_id = 1 WHERE username = 'admin' AND role_id IS NULL;

-- ====================================================
-- 6. EMAIL NOTIFICATIONS LOG
-- ====================================================

CREATE TABLE IF NOT EXISTS email_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_type ENUM('user', 'seller', 'admin') NOT NULL,
    recipient_id INT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type ENUM('product_approval', 'order_confirmation', 'low_rating', 'payout', 'verification', 'other') DEFAULT 'other',
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_recipient (recipient_type, recipient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON product_reviews(product_id, status);

-- ====================================================
-- MIGRATION COMPLETE
-- ====================================================

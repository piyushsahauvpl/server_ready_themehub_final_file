-- Seller payout system schema additions
-- Run this once to create the new wallet/payout/notification tables.

CREATE TABLE IF NOT EXISTS admin_wallet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert initial admin wallet record
INSERT INTO admin_wallet (balance) VALUES (0.00) ON DUPLICATE KEY UPDATE balance = balance;

CREATE TABLE IF NOT EXISTS admin_wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    reference_type VARCHAR(60) NOT NULL,
    reference_id VARCHAR(100) DEFAULT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_admin_wallet_transactions_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seller_wallet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_seller_wallet (seller_id),
    KEY idx_seller_wallet_seller_id (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    reference_type VARCHAR(60) NOT NULL,
    reference_id VARCHAR(100) DEFAULT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_wallet_transactions_seller_id (seller_id),
    KEY idx_wallet_transactions_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS withdraw_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('pending', 'approved', 'rejected', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    admin_id INT DEFAULT NULL,
    reason TEXT DEFAULT NULL,
    payout_id VARCHAR(100) DEFAULT NULL,
    failure_reason TEXT DEFAULT NULL,
    bank_details JSON DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    KEY idx_withdraw_requests_seller_id (seller_id),
    KEY idx_withdraw_requests_status (status),
    KEY idx_withdraw_requests_payout_id (payout_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seller_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    withdraw_request_id INT DEFAULT NULL,
    razorpay_payout_id VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'approved', 'transferred', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    amount DECIMAL(12, 2) NOT NULL,
    failure_reason TEXT DEFAULT NULL,
    response JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_seller_payouts_seller_id (seller_id),
    KEY idx_seller_payouts_status (status),
    KEY idx_seller_payouts_withdraw_id (withdraw_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seller_kyc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    details JSON DEFAULT NULL,
    verified_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_seller_kyc (seller_id),
    KEY idx_seller_kyc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    seller_id INT DEFAULT NULL,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
    title VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    status ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,
    KEY idx_notifications_seller_id (seller_id),
    KEY idx_notifications_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

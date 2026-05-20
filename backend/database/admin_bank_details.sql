-- Admin Bank Details Table for Commission Payouts
CREATE TABLE IF NOT EXISTS admin_bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL DEFAULT 1 COMMENT 'Default admin user ID',
    account_holder VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL COMMENT 'Encrypted',
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(255) DEFAULT NULL,
    account_type ENUM('savings', 'current') DEFAULT 'savings',
    upi_id VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_admin_bank (admin_id, is_active),
    KEY idx_admin_bank_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin bank details (you should update these with real details)
INSERT INTO admin_bank_details (
    admin_id, account_holder, bank_name, account_number,
    ifsc_code, branch_name, account_type, upi_id
) VALUES (
    1,
    'ThemeHub Admin',
    'State Bank of India',
    '123456789012',
    'SBIN0001234',
    'Main Branch',
    'current',
    'admin@themehub'
) ON DUPLICATE KEY UPDATE
    account_holder = VALUES(account_holder),
    bank_name = VALUES(bank_name),
    account_number = VALUES(account_number),
    ifsc_code = VALUES(ifsc_code),
    branch_name = VALUES(branch_name),
    account_type = VALUES(account_type),
    upi_id = VALUES(upi_id),
    is_active = VALUES(is_active);
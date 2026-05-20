-- Create refunds table (improved schema)
CREATE TABLE IF NOT EXISTS refunds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    seller_id INT,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    detailed_reason TEXT,
    proof_file_path VARCHAR(500),
    proof_file_original_name VARCHAR(255),
    status ENUM('requested', 'approved', 'rejected', 'refunded') DEFAULT 'requested',
    rejection_reason TEXT,
    seller_support_required BOOLEAN DEFAULT TRUE,
    seller_support_contacted BOOLEAN DEFAULT FALSE,
    seller_support_resolved BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    razorpay_refund_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    seller_earnings_deducted DECIMAL(10,2) DEFAULT 0,
    processed_by_admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES sellers(user_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Create buyer_seller_messages table
CREATE TABLE IF NOT EXISTS buyer_seller_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    sender_type ENUM('buyer', 'seller') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create seller earnings tracking table for refund deductions
CREATE TABLE IF NOT EXISTS seller_earnings_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    refund_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type ENUM('deduction', 'adjustment') DEFAULT 'deduction',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(user_id) ON DELETE CASCADE,
    FOREIGN KEY (refund_id) REFERENCES refunds(id) ON DELETE CASCADE
);

-- Create admin refund approvals audit table
CREATE TABLE IF NOT EXISTS refund_approvals_audit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    refund_id INT NOT NULL,
    admin_id INT NOT NULL,
    action ENUM('approved', 'rejected', 'processed') DEFAULT 'approved',
    notes TEXT,
    razorpay_refund_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (refund_id) REFERENCES refunds(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_user_id ON refunds(user_id);
CREATE INDEX idx_refunds_seller_id ON refunds(seller_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created_at ON refunds(created_at);
CREATE INDEX idx_buyer_seller_messages_order_id ON buyer_seller_messages(order_id);
CREATE INDEX idx_buyer_seller_messages_sender_id ON buyer_seller_messages(sender_id);
CREATE INDEX idx_buyer_seller_messages_receiver_id ON buyer_seller_messages(receiver_id);
CREATE INDEX idx_seller_earnings_seller_id ON seller_earnings_transactions(seller_id);
CREATE INDEX idx_seller_earnings_refund_id ON seller_earnings_transactions(refund_id);
CREATE INDEX idx_refund_approvals_refund_id ON refund_approvals_audit(refund_id);
CREATE INDEX idx_refund_approvals_admin_id ON refund_approvals_audit(admin_id);
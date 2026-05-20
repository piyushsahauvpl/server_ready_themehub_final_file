<?php
require_once __DIR__ . '/../config/database.php';

try {
    $conn = getDBConnection();

    // Create refunds table
    $sql1 = "CREATE TABLE IF NOT EXISTS refunds (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        seller_id INT,
        amount DECIMAL(10,2) NOT NULL,
        reason TEXT,
        status ENUM('requested', 'approved', 'rejected', 'refunded') DEFAULT 'requested',
        admin_notes TEXT,
        razorpay_refund_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES sellers(user_id) ON DELETE CASCADE
    )";

    // Create buyer_seller_messages table
    $sql2 = "CREATE TABLE IF NOT EXISTS buyer_seller_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        sender_type ENUM('buyer', 'seller') NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )";

    // Add indexes
    $sql3 = "CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id)";
    $sql4 = "CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id)";
    $sql5 = "CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status)";
    $sql6 = "CREATE INDEX IF NOT EXISTS idx_buyer_seller_messages_order_id ON buyer_seller_messages(order_id)";
    $sql7 = "CREATE INDEX IF NOT EXISTS idx_buyer_seller_messages_sender_id ON buyer_seller_messages(sender_id)";
    $sql8 = "CREATE INDEX IF NOT EXISTS idx_buyer_seller_messages_receiver_id ON buyer_seller_messages(receiver_id)";

    $conn->query($sql1);
    $conn->query($sql2);
    $conn->query($sql3);
    $conn->query($sql4);
    $conn->query($sql5);
    $conn->query($sql6);
    $conn->query($sql7);
    $conn->query($sql8);

    closeDBConnection($conn);

    echo json_encode(['success' => true, 'message' => 'Database tables created successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
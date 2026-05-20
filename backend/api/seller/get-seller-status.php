<?php
require_once "../config/db.php";
require_once "check-auth.php";

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("
  SELECT 
    s.status AS seller_status,
    s.payment_status,
    m.message
  FROM sellers s
  LEFT JOIN seller_messages m 
    ON m.seller_id = s.id
    AND m.message_type = 'payment_approval'
    AND m.is_read = 0
  WHERE s.user_id = ?
  LIMIT 1
");

$stmt->execute([$userId]);
$data = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$data) {
  echo json_encode([
    "success" => true,
    "seller_status" => "not_applied"
  ]);
  exit;
}

echo json_encode([
  "success" => true,
  "seller_status" => $data['seller_status'],   // pending | approved | rejected
  "payment_status" => $data['payment_status'], // unpaid | paid
  "admin_message" => $data['message']
]);

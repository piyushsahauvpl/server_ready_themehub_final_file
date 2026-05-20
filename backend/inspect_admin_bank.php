<?php
require_once 'config/database.php';
$conn = getDBConnection();
$res = $conn->query("SELECT admin_id, is_active, LENGTH(account_number) AS len, HEX(account_number) AS hex_account FROM admin_bank_details WHERE id=1");
if (!$res) {
    echo 'error: ' . $conn->error;
    exit(1);
}
$row = $res->fetch_assoc();
echo json_encode($row);

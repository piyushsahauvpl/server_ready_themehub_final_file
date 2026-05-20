<?php
require 'backend/config/database.php';
$c = getDBConnection();
$tables = ['wallet_transactions', 'admin_wallet_transactions', 'seller_wallet', 'admin_wallet'];
foreach ($tables as $t) {
    $r = $c->query('SHOW CREATE TABLE ' . $t);
    if (!$r) {
        echo "ERROR {$t}: " . $c->error . "\n\n";
        continue;
    }
    $row = $r->fetch_assoc();
    echo "TABLE={$t}\n";
    echo $row['Create Table'] . "\n\n";
}

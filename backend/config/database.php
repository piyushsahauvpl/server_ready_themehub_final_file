<?php
/**
 * Database Configuration
 * Core PHP - No Framework
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_USER', 'bmcjatrn_uptula_theme_hub');
define('DB_PASS', 'q_Z*}OwLI=r??dZT');
define('DB_NAME', 'bmcjatrn_uptula_theme_hub');

/**
 * Get database connection
 * @return mysqli
 */
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        die(json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]));
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

/**
 * Close database connection
 * @param mysqli $conn
 */
function closeDBConnection($conn) {
    if ($conn) {
        $conn->close();
    }
}

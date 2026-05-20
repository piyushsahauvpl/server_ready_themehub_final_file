<?php
/**
 * Role-Based Access Control (RBAC) Middleware
 * Use this to check permissions before allowing access to resources
 */

/**
 * Check if admin has permission for a resource/action
 * @param mysqli $conn Database connection
 * @param int $adminId Admin ID
 * @param string $resource Resource name (products, orders, sellers, etc.)
 * @param string $action Action name (read, write, approve, etc.)
 * @return bool True if has permission, false otherwise
 */
function hasPermission($conn, $adminId, $resource, $action) {
    // Super admin has all permissions
    $adminCheck = $conn->prepare("SELECT role_id FROM admins WHERE id = ?");
    $adminCheck->bind_param("i", $adminId);
    $adminCheck->execute();
    $result = $adminCheck->get_result();
    if ($result->num_rows === 0) {
        $adminCheck->close();
        return false;
    }
    
    $admin = $result->fetch_assoc();
    $roleId = $admin['role_id'];
    $adminCheck->close();
    
    // Role ID 1 is super_admin - has all permissions
    if ($roleId == 1) {
        return true;
    }
    
    // Check permission
    $permissionQuery = "SELECT COUNT(*) as has_permission
                       FROM role_permissions rp
                       JOIN admin_permissions ap ON rp.permission_id = ap.id
                       WHERE rp.role_id = ? AND ap.resource = ? AND ap.action = ?";
    
    $stmt = $conn->prepare($permissionQuery);
    $stmt->bind_param("iss", $roleId, $resource, $action);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    return ($row['has_permission'] > 0);
}

/**
 * Require permission - throws 403 if permission denied
 * @param mysqli $conn Database connection
 * @param int $adminId Admin ID
 * @param string $resource Resource name
 * @param string $action Action name
 */
function requirePermission($conn, $adminId, $resource, $action) {
    if (!hasPermission($conn, $adminId, $resource, $action)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Permission denied. You do not have access to perform this action.'
        ]);
        exit;
    }
}

#!/usr/bin/env php
<?php
/**
 * MASTER PRODUCTION UPDATE SCRIPT
 * Comprehensive update for entire ThemeHub project
 * Updates: Backend API files, Frontend files, Database credentials, Image URLs
 */

set_time_limit(300);
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration
$projectRoot = __DIR__;
$changes = [
    // CORS & Frontend Origins
    'http://localhost:3000' => 'https://uptulathemehub.com',
    
    // Backend URLs - Theme_hub_local_dipu path
    'http://localhost/Theme_hub_local_dipu/Frontend' => 'https://uptulathemehub.com',
    
    // Backend URLs - Frontend path
    'http://localhost/Frontend' => 'https://uptulathemehub.com',
    
    // WebSocket URLs
    'ws://localhost:8081' => 'wss://uptulathemehub.com:8081',
    
    // Database credentials - OLD
    "'localhost', 'root', '', 'themehub_db'" => "'localhost', 'bmcjatrn_uptula_theme_hub', 'q_Z*}OwLI=r??dZT', 'bmcjatrn_uptula_theme_hub'",
    
    // Cookie domain
    "'domain' => 'localhost'" => "'domain' => 'uptulathemehub.com'",
];

// Colors for CLI output
$colors = [
    'green' => "\033[92m",
    'red' => "\033[91m",
    'yellow' => "\033[93m",
    'cyan' => "\033[96m",
    'reset' => "\033[0m",
];

function log_message($type, $message) {
    global $colors;
    $typeColor = $colors[$type] ?? $colors['reset'];
    echo "{$typeColor}[$type]{$colors['reset']} $message\n";
}

function update_file($filePath, $changes) {
    global $colors;
    
    if (!file_exists($filePath)) {
        return ['status' => 'not_found', 'changes' => 0];
    }
    
    // Skip vendor and node_modules
    if (strpos($filePath, '/vendor/') !== false || 
        strpos($filePath, '/node_modules/') !== false ||
        strpos($filePath, '\\vendor\\') !== false ||
        strpos($filePath, '\\node_modules\\') !== false) {
        return ['status' => 'skipped', 'changes' => 0];
    }
    
    $content = file_get_contents($filePath);
    $originalContent = $content;
    $changesCount = 0;
    
    foreach ($changes as $old => $new) {
        $count = substr_count($content, $old);
        if ($count > 0) {
            $content = str_replace($old, $new, $content);
            $changesCount += $count;
        }
    }
    
    if ($changesCount === 0) {
        return ['status' => 'no_changes', 'changes' => 0];
    }
    
    if ($content === $originalContent) {
        return ['status' => 'no_changes', 'changes' => 0];
    }
    
    if (file_put_contents($filePath, $content) === false) {
        return ['status' => 'error', 'changes' => 0];
    }
    
    return ['status' => 'updated', 'changes' => $changesCount];
}

// Main execution
echo "\n";
echo $colors['cyan'] . "╔════════════════════════════════════════════════════════════════╗\n";
echo "║     THEMEHUB - MASTER PRODUCTION UPDATE SCRIPT                  ║\n";
echo "║     Updating entire project to: https://uptulathemehub.com      ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n" . $colors['reset'];

log_message('info', 'Starting comprehensive production update...');
log_message('info', 'Project root: ' . $projectRoot);

// Get all PHP files
$phpFiles = [];
$jsxFiles = [];
$jsFiles = [];

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($projectRoot, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);

foreach ($iterator as $file) {
    if ($file->isFile()) {
        $ext = $file->getExtension();
        $filePath = $file->getRealPath();
        
        if ($ext === 'php') {
            $phpFiles[] = $filePath;
        } elseif ($ext === 'jsx') {
            $jsxFiles[] = $filePath;
        } elseif ($ext === 'js' && strpos($filePath, 'src/') !== false && strpos($filePath, 'vendor/') === false && strpos($filePath, 'node_modules/') === false) {
            $jsFiles[] = $filePath;
        }
    }
}

// Sort for consistency
sort($phpFiles);
sort($jsxFiles);
sort($jsFiles);

log_message('info', "Found " . count($phpFiles) . " PHP files");
log_message('info', "Found " . count($jsxFiles) . " JSX files");
log_message('info', "Found " . count($jsFiles) . " JS files");

// Process PHP files
echo "\n" . $colors['cyan'] . "=== Processing PHP Files ===\n" . $colors['reset'];
$phpStats = ['updated' => 0, 'no_changes' => 0, 'error' => 0, 'skipped' => 0];
$phpTotalChanges = 0;

foreach ($phpFiles as $file) {
    $result = update_file($file, $changes);
    $phpStats[$result['status']]++;
    $phpTotalChanges += $result['changes'];
    
    if ($result['changes'] > 0) {
        $relativePath = str_replace($projectRoot, '', $file);
        log_message('success', "$relativePath ({$result['changes']} changes)");
    }
}

// Process JSX files
echo "\n" . $colors['cyan'] . "=== Processing JSX Files ===\n" . $colors['reset'];
$jsxStats = ['updated' => 0, 'no_changes' => 0, 'error' => 0, 'skipped' => 0];
$jsxTotalChanges = 0;

foreach ($jsxFiles as $file) {
    $result = update_file($file, $changes);
    $jsxStats[$result['status']]++;
    $jsxTotalChanges += $result['changes'];
    
    if ($result['changes'] > 0) {
        $relativePath = str_replace($projectRoot, '', $file);
        log_message('success', "$relativePath ({$result['changes']} changes)");
    }
}

// Process JS files
echo "\n" . $colors['cyan'] . "=== Processing JS Files ===\n" . $colors['reset'];
$jsStats = ['updated' => 0, 'no_changes' => 0, 'error' => 0, 'skipped' => 0];
$jsTotalChanges = 0;

foreach ($jsFiles as $file) {
    $result = update_file($file, $changes);
    $jsStats[$result['status']]++;
    $jsTotalChanges += $result['changes'];
    
    if ($result['changes'] > 0) {
        $relativePath = str_replace($projectRoot, '', $file);
        log_message('success', "$relativePath ({$result['changes']} changes)");
    }
}

// Summary
echo "\n" . $colors['cyan'] . "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                    UPDATE SUMMARY                               ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n" . $colors['reset'];

echo "\n" . $colors['yellow'] . "PHP FILES:\n" . $colors['reset'];
echo "  Updated: " . $colors['green'] . $phpStats['updated'] . $colors['reset'] . "\n";
echo "  No changes: " . $colors['yellow'] . $phpStats['no_changes'] . $colors['reset'] . "\n";
echo "  Errors: " . $colors['red'] . $phpStats['error'] . $colors['reset'] . "\n";
echo "  Skipped: " . $colors['yellow'] . $phpStats['skipped'] . $colors['reset'] . "\n";
echo "  Total replacements: " . $colors['green'] . $phpTotalChanges . $colors['reset'] . "\n";

echo "\n" . $colors['yellow'] . "JSX FILES:\n" . $colors['reset'];
echo "  Updated: " . $colors['green'] . $jsxStats['updated'] . $colors['reset'] . "\n";
echo "  No changes: " . $colors['yellow'] . $jsxStats['no_changes'] . $colors['reset'] . "\n";
echo "  Errors: " . $colors['red'] . $jsxStats['error'] . $colors['reset'] . "\n";
echo "  Skipped: " . $colors['yellow'] . $jsxStats['skipped'] . $colors['reset'] . "\n";
echo "  Total replacements: " . $colors['green'] . $jsxTotalChanges . $colors['reset'] . "\n";

echo "\n" . $colors['yellow'] . "JS FILES:\n" . $colors['reset'];
echo "  Updated: " . $colors['green'] . $jsStats['updated'] . $colors['reset'] . "\n";
echo "  No changes: " . $colors['yellow'] . $jsStats['no_changes'] . $colors['reset'] . "\n";
echo "  Errors: " . $colors['red'] . $jsStats['error'] . $colors['reset'] . "\n";
echo "  Skipped: " . $colors['yellow'] . $jsStats['skipped'] . $colors['reset'] . "\n";
echo "  Total replacements: " . $colors['green'] . $jsTotalChanges . $colors['reset'] . "\n";

$totalUpdated = $phpStats['updated'] + $jsxStats['updated'] + $jsStats['updated'];
$totalChanges = $phpTotalChanges + $jsxTotalChanges + $jsTotalChanges;

echo "\n" . $colors['cyan'] . "OVERALL:\n" . $colors['reset'];
echo "  Total files updated: " . $colors['green'] . $totalUpdated . $colors['reset'] . "\n";
echo "  Total replacements: " . $colors['green'] . $totalChanges . $colors['reset'] . "\n";

echo "\n";
if ($totalUpdated > 0) {
    echo $colors['green'] . "✓ Production update completed successfully!\n" . $colors['reset'];
} else {
    echo $colors['yellow'] . "⊘ No files were updated. All may already be in production format.\n" . $colors['reset'];
}

echo "\n" . $colors['cyan'] . "Changes Made:\n" . $colors['reset'];
echo "  1. CORS origins: http://localhost:3000 → https://uptulathemehub.com\n";
echo "  2. Backend URLs: http://localhost/* → https://uptulathemehub.com\n";
echo "  3. WebSocket URLs: ws://localhost:8081 → wss://uptulathemehub.com:8081\n";
echo "  4. Database credentials: Updated to production values\n";
echo "  5. Cookie domain: localhost → uptulathemehub.com\n";

echo "\n" . $colors['green'] . "Next Steps:\n" . $colors['reset'];
echo "  1. npm run build (build React for production)\n";
echo "  2. Upload build/ to server\n";
echo "  3. Upload backend/ to server\n";
echo "  4. Set file permissions to 755\n";
echo "  5. Test all API endpoints\n";

echo "\n✓ All done! Your project is now ready for production deployment.\n\n";
?>

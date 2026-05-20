#!/usr/bin/env php
<?php
/**
 * POST-UPDATE VERIFICATION SCRIPT
 * Verifies that Master Update script ran successfully
 */

set_time_limit(120);

// Configuration
$projectRoot = __DIR__;

// Colors
$green = "\033[92m";
$red = "\033[91m";
$yellow = "\033[93m";
$cyan = "\033[96m";
$reset = "\033[0m";

function check_file($filePath, $shouldContain, $shouldNotContain = []) {
    if (!file_exists($filePath)) {
        return ['status' => 'not_found'];
    }
    
    $content = file_get_contents($filePath);
    
    // Check for things that should exist
    foreach ((array)$shouldContain as $pattern) {
        if (strpos($content, $pattern) === false) {
            return ['status' => 'missing', 'pattern' => $pattern];
        }
    }
    
    // Check for things that shouldn't exist
    foreach ((array)$shouldNotContain as $pattern) {
        if (strpos($content, $pattern) !== false) {
            return ['status' => 'found_bad', 'pattern' => $pattern];
        }
    }
    
    return ['status' => 'ok'];
}

function scan_for_pattern($dir, $pattern, $extensions = ['php', 'jsx', 'js']) {
    $count = 0;
    $files = [];
    
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $ext = $file->getExtension();
            if (in_array($ext, $extensions)) {
                // Skip vendor and node_modules
                if (strpos($file->getRealPath(), 'vendor') !== false ||
                    strpos($file->getRealPath(), 'node_modules') !== false) {
                    continue;
                }
                
                $content = file_get_contents($file->getRealPath());
                $occurrences = substr_count($content, $pattern);
                if ($occurrences > 0) {
                    $count += $occurrences;
                    $files[] = [
                        'file' => str_replace($projectRoot, '', $file->getRealPath()),
                        'occurrences' => $occurrences
                    ];
                }
            }
        }
    }
    
    return ['count' => $count, 'files' => $files];
}

// Main verification
echo "\n${cyan}╔════════════════════════════════════════════════════════════════╗${reset}\n";
echo "${cyan}║        POST-UPDATE VERIFICATION SCRIPT                          ║${reset}\n";
echo "${cyan}║        Checking if Master Update ran successfully                ║${reset}\n";
echo "${cyan}╚════════════════════════════════════════════════════════════════╝${reset}\n\n";

$allPassed = true;

// Test 1: Check specific files for production URLs
echo "${yellow}═ TEST 1: Checking Critical Files${reset}\n\n";

$checks = [
    'backend/api/blogs.php' => [
        'should_have' => ['https://uptulathemehub.com', 'header(\'Access-Control-Allow-Origin:'],
        'should_not_have' => ['http://localhost:3000']
    ],
    'backend/config/database.php' => [
        'should_have' => ['bmcjatrn_uptula_theme_hub'],
        'should_not_have' => ['root']
    ],
    '.env.production' => [
        'should_have' => ['https://uptulathemehub.com'],
        'should_not_have' => ['localhost']
    ],
];

foreach ($checks as $file => $requirements) {
    $filePath = "$projectRoot/$file";
    $result = check_file($filePath, $requirements['should_have'], $requirements['should_not_have'] ?? []);
    
    if ($result['status'] === 'not_found') {
        echo "${red}✗${reset} $file - NOT FOUND\n";
        $allPassed = false;
    } elseif ($result['status'] === 'missing') {
        echo "${red}✗${reset} $file - Missing pattern: {$result['pattern']}\n";
        $allPassed = false;
    } elseif ($result['status'] === 'found_bad') {
        echo "${red}✗${reset} $file - Found unwanted pattern: {$result['pattern']}\n";
        $allPassed = false;
    } else {
        echo "${green}✓${reset} $file - OK\n";
    }
}

// Test 2: Scan for remaining localhost references
echo "\n${yellow}═ TEST 2: Scanning for Remaining Localhost References${reset}\n\n";

$patterns_to_check = [
    'http://localhost:3000' => 'CORS Headers',
    'http://localhost/Theme_hub_local_dipu/Frontend' => 'Backend URLs',
    'http://localhost/Frontend' => 'Frontend Path URLs',
    'ws://localhost:8081' => 'WebSocket URLs',
];

$found_bad = false;
foreach ($patterns_to_check as $pattern => $name) {
    $result = scan_for_pattern($projectRoot, $pattern);
    if ($result['count'] > 0) {
        echo "${red}✗${reset} Found $name: {$result['count']} occurrences\n";
        foreach (array_slice($result['files'], 0, 3) as $file) {
            echo "    - {$file['file']}: {$file['occurrences']} times\n";
        }
        $found_bad = true;
        $allPassed = false;
    } else {
        echo "${green}✓${reset} No $name found - Good!\n";
    }
}

// Test 3: Check for production URLs
echo "\n${yellow}═ TEST 3: Verifying Production URLs Present${reset}\n\n";

$should_be_present = [
    'https://uptulathemehub.com' => 'Production Domain',
];

$found_good = false;
foreach ($should_be_present as $pattern => $name) {
    $result = scan_for_pattern($projectRoot, $pattern);
    if ($result['count'] > 0) {
        echo "${green}✓${reset} Found production $name in {$result['count']} locations\n";
        $found_good = true;
    }
}

if (!$found_good) {
    echo "${red}✗${reset} No production URLs found!\n";
    $allPassed = false;
}

// Test 4: Check database credentials
echo "\n${yellow}═ TEST 4: Checking Database Credentials${reset}\n\n";

$result = scan_for_pattern($projectRoot, "'root', '', 'themehub_db'", ['php']);
if ($result['count'] > 0) {
    echo "${red}✗${reset} Found old database credentials: {$result['count']} occurrences\n";
    echo "    These files still need manual attention:\n";
    foreach ($result['files'] as $file) {
        echo "    - {$file['file']}\n";
    }
    // Don't fail on this one - some files might be for reference
} else {
    echo "${green}✓${reset} No old database credentials found\n";
}

// Summary
echo "\n${cyan}╔════════════════════════════════════════════════════════════════╗${reset}\n";
echo "${cyan}║                    VERIFICATION SUMMARY                         ║${reset}\n";
echo "${cyan}╚════════════════════════════════════════════════════════════════╝${reset}\n\n";

if ($allPassed) {
    echo "${green}✓ ALL TESTS PASSED!${reset}\n\n";
    echo "Your project has been successfully updated to production URLs!\n\n";
    echo "${yellow}Next Steps:${reset}\n";
    echo "  1. Run: ${cyan}npm run build${reset}\n";
    echo "  2. Upload ${cyan}build/${reset} to server\n";
    echo "  3. Upload ${cyan}backend/${reset} to server\n";
    echo "  4. Test API endpoints on production server\n";
} else {
    echo "${red}✗ SOME TESTS FAILED${reset}\n\n";
    echo "Please review the errors above and run Master Update again if needed.\n";
    echo "\nCommand: ${cyan}php MASTER_UPDATE.php${reset}\n";
}

echo "\n";
?>

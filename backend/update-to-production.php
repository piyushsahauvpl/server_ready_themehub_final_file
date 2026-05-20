#!/usr/bin/env php
<?php
/**
 * Batch Production Update Script
 * Updates all API files with production CORS origins
 * Run this from the backend directory: php update-to-production.php
 */

$apiDir = __DIR__ . '/api';
$productionUrl = 'https://uptulathemehub.com';
$localUrl = 'http://localhost:3000';

// Colors for CLI output
$colors = [
    'green' => "\033[92m",
    'red' => "\033[91m",
    'yellow' => "\033[93m",
    'reset' => "\033[0m",
];

function updateFile($file, $oldOrigin, $newOrigin) {
    global $colors;
    
    if (!file_exists($file)) {
        echo $colors['red'] . "✗ File not found: $file" . $colors['reset'] . "\n";
        return false;
    }
    
    $content = file_get_contents($file);
    
    if (strpos($content, $oldOrigin) === false) {
        echo $colors['yellow'] . "⊘ No changes needed: " . basename($file) . $colors['reset'] . "\n";
        return true;
    }
    
    // Replace all occurrences
    $updated = str_replace($oldOrigin, $newOrigin, $content);
    
    if (file_put_contents($file, $updated)) {
        echo $colors['green'] . "✓ Updated: " . basename($file) . $colors['reset'] . "\n";
        return true;
    } else {
        echo $colors['red'] . "✗ Failed to update: " . basename($file) . $colors['reset'] . "\n";
        return false;
    }
}

echo "\n=== Production Update Script ===\n";
echo "Updating all API files from: $localUrl\n";
echo "To: $productionUrl\n\n";

// Get all PHP files recursively
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($apiDir),
    RecursiveIteratorIterator::SELF_FIRST
);

$phpFiles = [];
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $phpFiles[] = $file->getRealPath();
    }
}

echo "Found " . count($phpFiles) . " PHP files to process.\n\n";

$updated = 0;
$failed = 0;
$skipped = 0;

foreach ($phpFiles as $file) {
    if (updateFile($file, $localUrl, $productionUrl)) {
        if (strpos(file_get_contents($file), $productionUrl) !== false) {
            $updated++;
        } else {
            $skipped++;
        }
    } else {
        $failed++;
    }
}

echo "\n=== Update Summary ===\n";
echo $colors['green'] . "Updated: $updated" . $colors['reset'] . "\n";
echo $colors['yellow'] . "Skipped: $skipped" . $colors['reset'] . "\n";
echo $colors['red'] . "Failed: $failed" . $colors['reset'] . "\n";
echo "\n✓ Production update complete!\n\n";
?>

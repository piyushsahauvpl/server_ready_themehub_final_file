<?php
/**
 * Lightweight JWT helper (HS256)
 * NOTE: Replace the secret with a strong value in production.
 */

if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', 'change_this_secret_in_production_!@#');
}

/**
 * Base64Url encode (no padding)
 */
function base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64Url decode
 */
function base64url_decode($data)
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $data .= str_repeat('=', $padlen);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Create a JWT token
 */
function jwt_encode(array $payload, int $expSeconds = 3600): string
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['exp'] = time() + $expSeconds;
    $segments = [
        base64url_encode(json_encode($header)),
        base64url_encode(json_encode($payload)),
    ];
    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, JWT_SECRET, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

/**
 * Decode a JWT token
 */
function jwt_decode(string $token)
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new Exception('Invalid token format');
    }
    [$headb64, $bodyb64, $cryptob64] = $parts;
    $payload = json_decode(base64url_decode($bodyb64), true);
    if (!$payload) {
        throw new Exception('Invalid payload');
    }
    $sig = base64url_decode($cryptob64);
    $expected = hash_hmac('sha256', "$headb64.$bodyb64", JWT_SECRET, true);
    if (!hash_equals($expected, $sig)) {
        throw new Exception('Signature verification failed');
    }
    if (isset($payload['exp']) && time() > $payload['exp']) {
        throw new Exception('Token expired');
    }
    return $payload;
}

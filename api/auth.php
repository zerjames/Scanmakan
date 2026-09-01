<?php
// api/auth.php — Admin authentication (session-based)

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Hardcoded credentials
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'admin123');

$method = $_SERVER['REQUEST_METHOD'];

// ── GET ?action=check ──────────────────────────────────────────────────────────
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    if ($action === 'check') {
        echo json_encode([
            'loggedIn' => isset($_SESSION['user']) && $_SESSION['user'] === ADMIN_USERNAME,
        ]);
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid action']);
    exit;
}

// ── POST ───────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $raw    = file_get_contents('php://input');
    $body   = json_decode($raw, true);
    $action = $body['action'] ?? '';

    if ($action === 'login') {
        $username = trim($body['username'] ?? '');
        $password = trim($body['password'] ?? '');

        if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
            $_SESSION['user'] = $username;
            echo json_encode(['success' => true, 'message' => 'Login berhasil']);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Username atau password salah']);
        }
        exit;
    }

    if ($action === 'logout') {
        session_unset();
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid action']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
exit;

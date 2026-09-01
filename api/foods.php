<?php
// api/foods.php — Read-only API (GET only)
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// Hanya izinkan GET
if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$id = $_GET['id'] ?? '';
$q  = $_GET['q']  ?? '';

if (!empty($id)) {
    $stmt = $pdo->prepare('SELECT * FROM foods WHERE id = ?');
    $stmt->execute([$id]);
    $food = $stmt->fetch();
    if ($food) {
        $food['portions']        = json_decode($food['portions'], true);
        $food['portion_labels']  = json_decode($food['portion_labels'], true);
        $food['portion_factors'] = json_decode($food['portion_factors'], true);
        $food['variations']      = json_decode($food['variations'], true);
        echo json_encode($food);
    } else {
        echo json_encode(null);
    }
} elseif (!empty($q)) {
    $stmt = $pdo->prepare('SELECT * FROM foods WHERE name_id LIKE ? OR id LIKE ? ORDER BY name_id ASC');
    $stmt->execute(["%$q%", "%$q%"]);
    $foods = $stmt->fetchAll();
    foreach ($foods as &$food) {
        $food['portions']        = json_decode($food['portions'], true);
        $food['portion_labels']  = json_decode($food['portion_labels'], true);
        $food['portion_factors'] = json_decode($food['portion_factors'], true);
        $food['variations']      = json_decode($food['variations'], true);
    }
    echo json_encode($foods);
} else {
    $stmt  = $pdo->query('SELECT * FROM foods ORDER BY name_id ASC');
    $foods = $stmt->fetchAll();
    foreach ($foods as &$food) {
        $food['portions']        = json_decode($food['portions'], true);
        $food['portion_labels']  = json_decode($food['portion_labels'], true);
        $food['portion_factors'] = json_decode($food['portion_factors'], true);
        $food['variations']      = json_decode($food['variations'], true);
    }
    echo json_encode($foods);
}
exit;

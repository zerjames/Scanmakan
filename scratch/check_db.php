<?php
require_once 'api/db.php';
$stmt = $pdo->query('SELECT id, name_id, source_url, variations FROM foods');
$foods = $stmt->fetchAll();
header('Content-Type: application/json');
echo json_encode($foods, JSON_PRETTY_PRINT);

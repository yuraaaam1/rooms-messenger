<?php

declare(strict_types=1);

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);

if (!is_string($path)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');

    echo 'Некорректный URL запроса.';

    exit;
}

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/index.php';

    exit;
}

if ($path === '/') {
    header('Content-Type: text/html; charset=utf-8');

    readfile(__DIR__ . '/index.html');

    exit;
}

$publicDirectory = realpath(__DIR__);
$requestedFile = realpath(__DIR__ . $path);

if (
    $publicDirectory !== false
    && $requestedFile !== false
    && str_starts_with($requestedFile, $publicDirectory . DIRECTORY_SEPARATOR)
    && is_file($requestedFile)
) {
    return false;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');

echo 'Ресурс не найден.';


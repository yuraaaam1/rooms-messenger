<?php

declare(strict_types=1);

use App\Application\RoomService;
use App\Http\JsonResponse;
use App\Http\RoomController;
use App\Infrastructure\Storage\JsonRoomRepository;

require_once __DIR__ . '/../bootstrap.php';

$config = require __DIR__ . '/../config/app.php';

$method =$_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);

if (!is_string($path)) {
    JsonResponse::send(400, [
        'error' => 'Некорректный URL запроса'
    ]);
}

if ($method === 'GET' && $path === '/api/health') {
    JsonResponse::send(200, [
        'status' => 'ok',
        'app' => $config['app_name'],
        'time' => gmdate('c'),
    ]);
}

if ($path === '/api/room/create') {
    if ($method !== 'POST') {
        header('Allow: POST');

        JsonResponse::send(405, [
            'error' => 'Для этого маршрута разрешён только метод запроса POST.'
        ]);
    }

    $roomRepository = new JsonRoomRepository($config['data_dir']);
    $roomService = new RoomService($roomRepository);
    $roomController = new RoomController(
        $roomService,
        $config['max_json_request_size_bytes'],    
    );

    $roomController->create();

}

JsonResponse::send(404, [
    'error' => 'Ресурс не найден',
]);

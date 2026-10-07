<?php

declare(strict_types=1);

namespace App\Http;

use App\Application\RoomService;
use InvalidArgumentException;
use JsonException;
use RuntimeException;

final class RoomController
{
    public function __construct(
        private readonly RoomService $roomService,
    ) {
    }

    public function create(): never
    {
        $payload = $this->readJsonObject();

        $name = $payload['name'] ?? null;
        $passwordHash = $payload['password_hash'] ?? null;

        if (!is_string($name) || !is_string($passwordHash)) {
            JsonResponse::send(400, [
                'error' => 'Поля "name" и "password_hash" обязательны.',
            ]);
        }

        try {
            $room = $this->roomService->createRoom($name, $passwordHash);
        } catch (InvalidArgumentException $exception) {
            JsonResponse::send(400, [
                'error' => $exception->getMessage(),
            ]);
        } catch (RuntimeException $exception) {
            error_log($exception->getMessage());

            JsonResponse::send(500, [
                'error' => 'Не удалось создать комнату.',
            ]);
        }

        JsonResponse::send(201, [
            'id' => $room->id,
            'name' => $room->name,
            'created_at' => $room->createdAt->format(DATE_ATOM),
        ]);
        
    }
    
    private function readJsonObject(): array 
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (!str_starts_with(strtolower($contentType), 'application/json')) {
            JsonResponse::send(415, [
                'error' => '"Content-Type" должен быть "application/json".'
            ]);
        }

        $rawBody = file_get_contents('php://input');

        if ($rawBody === false) {
            JsonResponse::send(400, [
                'error' => 'Не удалось прочитать тело запроса',
            ]);
        }

        try {
            $payload = json_decode(
                $rawBody,
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (JsonException) {
            JsonResponse::send(400, [
                'error' => 'Тело запроса должно содержать корректный JSON'
            ]);
        }

        if (!is_array($payload) || array_is_list($payload)) {
            JsonResponse::send(400, [
                'error' => 'JSON должен быть объектом',
            ]);
        }

        return $payload;
    }
}
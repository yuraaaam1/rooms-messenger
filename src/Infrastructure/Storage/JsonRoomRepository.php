<?php

declare(strict_types=1);

namespace App\Infrastructure\Storage;

use App\Domain\Room;
use RuntimeException;
use App\Application\RoomRepository;

final class JsonRoomRepository implements RoomRepository
{
    private readonly string $roomsDirectory;

    public function __construct(string $dataDirectory)
    {
        $this->roomsDirectory = rtrim($dataDirectory, '/') . '/rooms';
    }

    public function saveNew(Room $room): void
    {
        $roomDirectory = $this->roomsDirectory . '/' . $room->id;

        if (is_dir($roomDirectory)) {
            throw new RuntimeException('Комната с таким идентификатором уже существует.');          
        }

        if (!mkdir($roomDirectory, 0700, true)) {
            throw new RuntimeException('Не удалось создать директорию комнаты.');
        }

        $meta = [
            'id' => $room->id,
            'name' => $room->name,
            'password_hash' => $room->passwordHash,
            'created_at' => $room->createdAt->format(DATE_ATOM),
        ];

        $json = json_encode(
            $meta,
            JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR
        );

        $metaPath = $roomDirectory . '/meta.json';

        if (file_put_contents($metaPath, $json . PHP_EOL, LOCK_EX) === false) {
            throw new RuntimeException('Не удалось сохранить метаданные комнаты.');
        }
    }
}
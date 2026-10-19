<?php

declare(strict_types=1);

namespace App\Infrastructure\Storage;

use App\Domain\Room;
use App\Application\RoomRepository;
use RuntimeException;
use JsonException;

final class JsonRoomRepository implements RoomRepository
{
    private readonly string $roomsDirectory;

    public function __construct(string $dataDirectory)
    {
        $this->roomsDirectory = rtrim($dataDirectory, '/') . '/rooms';
    }

    public function saveNew(Room $room): void
    {
        $meta = [
            'id' => $room->id,
            'name' => $room->name,
            'password_hash' => $room->passwordHash,
            'created_at' => $room->createdAt->format(DATE_ATOM),
        ];

        try {
            $json = json_encode(
                $meta,
                JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR,
            ) . PHP_EOL;
        } catch (JsonException $exception) {
            throw new RuntimeException(
                'Не удалось подготовить метаданные комнаты.',
                0,
                $exception,
            );
        }

        $roomDirectory = $this->roomsDirectory . '/' . $room->id;

        if (!@mkdir($roomDirectory, 0700, true)) {
            if (is_dir($roomDirectory)) {
                throw new RuntimeException(
                    'Комната с таким идентификатором уже существует.'
                );
            }

            throw new RuntimeException(
                'Не удалось создать директориб комнаты.',
            );
        }

        $temporaryPath = $roomDirectory . '/.meta.json.tmp';
        $metaPath = $roomDirectory . '/meta.json';
        $published = false;

        try {
            $writtenBytes = @file_put_contents(
                $temporaryPath,
                $json,
                LOCK_EX,
            );

            if ($writtenBytes !== strlen($json)) {
                throw new RuntimeException(
                    'Не удалось полностью записать метаданные комнаты.'
                );
            }

            if (!@rename($temporaryPath, $metaPath)) {
                throw new RuntimeException(
                    'Не удалось опубликовать метаданные комнаты.'
                );
            }

            $published = true;
        } finally {
            if (!$published) {
                if (is_file($temporaryPath) && !@unlink($temporaryPath)) {
                    error_log(
                        'Не удалось удалить временный файл: ' . $temporaryPath
                    );
                }

                if (!@rmdir($roomDirectory)) {
                    error_log(
                        'Не удалось удалить незавершённуб директорию: '
                        . $roomDirectory,
                    );
                }
            }
        }
    }
}
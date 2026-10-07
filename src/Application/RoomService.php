<?php

declare(strict_types=1);

namespace App\Application;

use App\Domain\Room;
use DateTimeImmutable;
use DateTimeZone;

final class RoomService
{
    public function __construct(
        private readonly RoomRepository $roomRepository,
    ) { 
    }

    public function createRoom(string $name, string $passwordHash): Room
    {
        $room = new Room(
            id: bin2hex(random_bytes(16)),
            name: trim($name),
            passwordHash: strtolower($passwordHash),
            createdAt: new DateTimeImmutable('now', new DateTimeZone('UTC')),
        );

        $this->roomRepository->saveNew($room);

        return $room;
    }
}
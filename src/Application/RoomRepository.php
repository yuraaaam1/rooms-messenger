<?php

declare(strict_types=1);

namespace App\Application;

use App\Domain\Room;

interface RoomRepository
{
    public function saveNew(Room $room): void;
}
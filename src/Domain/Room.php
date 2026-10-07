<?php

declare(strict_types= 1);

namespace App\Domain;

use DateTimeImmutable;
use InvalidArgumentException;

final class Room
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $passwordHash,
        public readonly DateTimeImmutable $createdAt,
    ) {
        if (preg_match('/\A[a-f0-9]{32}\z/', $this->id) !== 1) {
            throw new InvalidArgumentException(
                'Идентификатор комнаты должен быть строкой из 32 символов hex.'
                );
        }

        if (trim($this->name) === '') {
            throw new InvalidArgumentException(
                'Название комнаты не может быть пустым.'
            );
        }

        if (preg_match('/\A[a-f0-9]{64}\z/', $this->passwordHash) !== 1) {
            throw new InvalidArgumentException(
                'Хеш пароля должен быть SHA-256 в hex-формате.'
            );
        }
    }
}

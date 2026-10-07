<?php

declare(strict_types=1);

$projectRoot = dirname(__DIR__);

return [
    'app_name' => 'Messenger',

    'data_dir' => $projectRoot . '/data',

    // Константы
    'poll_interval_seconds' => 10,
    'auth_timestamp_ttl_seconds' => 60,
    'max_messages_per_room' => 1000,
    'max_file_size_bytes' => 100 * 1024 * 1024,
    'file_chunk_size_bytes' => 1024 * 1024,
    'file_ttl_seconds' => 24 * 60 * 60,
];
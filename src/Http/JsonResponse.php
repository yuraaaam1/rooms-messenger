<?php  

declare(strict_types=1);

namespace App\Http;

final class JsonResponse
{
    public static function send(int $statusCode, array $body): never
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');

        echo json_encode(
            $body,
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        );

        exit(0);
    }
}
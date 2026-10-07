<?php

declare (strict_types=1);

spl_autoload_register(static function (string $class): void {
    $namespacePrefix = 'App\\';
    $sourceDirectory = __DIR__ . '/src/';

    if (!str_starts_with($class, $namespacePrefix)) {  
        return;
    }
    
    $relativeClassName = substr($class, strlen($namespacePrefix));
    $filePath = $sourceDirectory
        . str_replace('\\','/', $relativeClassName)
        . '.php';

    if (is_file($filePath)) {
        require_once $filePath;
    }
});
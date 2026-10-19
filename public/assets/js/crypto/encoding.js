const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: true,
});

export function textToBytes(text) {
    if (typeof text !== 'string') {
        throw new TypeError('Ожидалась строка.')
    }

    return textEncoder.encode(text);
}

export function bytesToText(bytes) {
    return textDecoder.decode(bytes);
}

export function bytesToBase64(bytes) {
    if (!ArrayBuffer.isView(bytes)) {
        throw new TypeError(
            'Ожидалось бинарное представление, например Uint8Array.'
        );
    }

    const view = new Uint8Array(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength,
    );

    let binary = '';

    for (const byte of view) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

export function base64ToBytes(base64) {
    if (typeof base64 !== 'string') {
        throw new TypeError('Ожидалась строка типа Base64.')
    }

    const binary = atob(base64);

    if (btoa(binary) !== base64) {
        throw new TypeError('Некорректный формат Base64.')
    }

    return Uint8Array.from(
        binary,
        character => character.charCodeAt(0),
    )
}
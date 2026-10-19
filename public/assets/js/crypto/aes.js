const IV_BYTES = 12;
const TAG_BITS = 128;
const TAG_BYTES = TAG_BITS / 8;

export async function encryptBytes(key, plainText) {
    if (!(plainText instanceof Uint8Array)) {
        throw new TypeError('Данные для шифрования должны быть Uint8Array.')
    }

    const iv = globalThis.crypto.getRandomValues(
        new Uint8Array(IV_BYTES),
    );

    const cipherText = await globalThis.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            tagLength: TAG_BITS,
        },
        key,
        plainText,
    );

    return { iv, cipherText: new Uint8Array(cipherText) };
}

export async function decryptBytes(key, iv, cipherText) {
    if (!(iv instanceof Uint8Array) || (iv.byteLength) !== IV_BYTES) {
        throw new TypeError('IV должен быть Uint8Array длиной 12 байт.')
    }

    if (
        !(cipherText instanceof Uint8Array)
        || cipherText.byteLength < TAG_BYTES 
    ) {
        throw new TypeError('Некорректные зашифрованные данные.');
    }

    const plainText = await globalThis.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv,
            tagLength: TAG_BITS,
        },
        key,
        cipherText,
    );

    return new Uint8Array(plainText)
}
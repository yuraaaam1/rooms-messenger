import { textToBytes } from './encoding.js';

export const PASSWORD_SALT_BYTES = 32;
export const PASSWORD_KDF_ITERATIONS = 200_000;

export function createPasswordSalt() {
    return globalThis.crypto.getRandomValues(
        new Uint8Array(PASSWORD_SALT_BYTES),
    );
}

export async function derivePasswordKey(password, salt) {
    if (typeof password !== 'string' || password.length === 0) {
        throw new TypeError('Личный пароль должен быть непустой строкой.')
    };

    if (
        !(salt instanceof Uint8Array)
        || salt.byteLength !== PASSWORD_SALT_BYTES
    ) {
        throw new TypeError('Соль должна быть Uint8Array длиной 32 байта.')
    }

    const passwordMaterial = await globalThis.crypto.subtle.importKey(
        'raw',
        textToBytes(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    );

    return globalThis.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt,
            iterations: PASSWORD_KDF_ITERATIONS,
        },
        passwordMaterial,
        {
            name: 'AES-GCM',
            length: 256,
        },
        false,
        ['encrypt', 'decrypt'],
    );
}
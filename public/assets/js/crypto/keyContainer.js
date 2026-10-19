import { encryptBytes, decryptBytes } from './aes.js';
import {
    textToBytes,
    bytesToText,
    bytesToBase64,
    base64ToBytes, 
} from './encoding.js';

export async function encryptPrivateKeys(keys, masterKey) {
    const privateKeys = {
        ecdh: await globalThis.crypto.subtle.exportKey(
            'jwk',
            keys.ecdh.privateKey,
        ),
        ecdsa: await globalThis.crypto.subtle.exportKey(
            'jwk',
            keys.ecdsa.privateKey,
        ),
    };

    const encrypted = await encryptBytes(
        masterKey,
        textToBytes(JSON.stringify(privateKeys)),
    );

    return {
        iv: bytesToBase64(encrypted.iv),
        cipherText: bytesToBase64(encrypted.cipherText),
    };
}

export async function decryptPrivateKeys(encrypted, masterKey, expectedPublicKeys) {
    if (
        expectedPublicKeys === null
        || typeof expectedPublicKeys !== 'object'
        || Array.isArray(expectedPublicKeys)
    ) {
        throw new TypeError('Ожидался набор публичных JWK')
    }
    
    const plainBytes = await decryptBytes(
        masterKey,
        base64ToBytes(encrypted.iv),
        base64ToBytes(encrypted.cipherText),
    );

    const privateKeys = JSON.parse(bytesToText(plainBytes));

    if (
        !isPrivateJwk(privateKeys?.ecdh)
        || !isPrivateJwk(privateKeys?.ecdsa)
    ) {
        throw new TypeError('Некорректный формат закрытых ключей.');
    }

    assertPublicJwkMatches(privateKeys.ecdh, expectedPublicKeys.ecdh, 'ECDH');
    assertPublicJwkMatches(privateKeys.ecdsa, expectedPublicKeys.ecdsa, 'ECDSA');

    const ecdh = await globalThis.crypto.subtle.importKey(
        'jwk',
        privateKeys.ecdh,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        false,
        ['deriveBits'],
    );

    const ecdsa = await globalThis.crypto.subtle.importKey(
        'jwk',
        privateKeys.ecdsa,
        {
            name: 'ECDSA',
            namedCurve: 'P-256',
        },
        false,
        ['sign'],
    );

    return { ecdh, ecdsa };
}

function assertPublicJwkMatches(privateJwk, publicJwk, algorithm) {
    if (
        publicJwk === null
        || typeof publicJwk !== 'object'
        || Array.isArray(publicJwk)
        || 'd' in publicJwk
    ) {
        throw new TypeError('Ожидался публичный JWK без закрытой части.');
    }

    for (const field of ['kty', 'crv', 'x', 'y']) {
        if (privateJwk[field] !== publicJwk[field]) {
            throw new Error(
                `Публичный ключ ${algorithm} не соответствует контейнеру.`,
            );
        }
    }
}

function isPrivateJwk(key) {
    return key !== null
        && typeof key === 'object'
        && !Array.isArray(key)
        && key.kty === 'EC'
        && key.crv === 'P-256'
        && typeof key.x === 'string'
        && typeof key.y === 'string'
        && typeof key.d === 'string'
}
export async function generateUserKeys() {
    if (!globalThis.crypto?.subtle) {
        throw new Error('Web Crypto API недоступен.');
    }

    const ecdh = await globalThis.crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveBits'],
    );

    const ecdsa = await globalThis.crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify'],
    );

    return { ecdh, ecdsa };
}

export async function exportPublicKeys(keys) {
    const ecdh = await globalThis.crypto.subtle.exportKey(
        'jwk',
        keys.ecdh.publicKey,
    );

    const ecdsa = await globalThis.crypto.subtle.exportKey(
        'jwk',
        keys.ecdsa.publicKey,
    );

    return { ecdh, ecdsa }
}

export async function importPublicKeys(publicKeys) {
    if (
        publicKeys === null
        || typeof publicKeys !== 'object'
        || Array.isArray(publicKeys)
    ) {
        throw new TypeError('Ожидался набор публичных JWK.');
    }

    for (const key of [publicKeys.ecdh, publicKeys.ecdsa]) {
        if (
            key === null
            || typeof key !== 'object'
            || Array.isArray(key)
            || 'd' in key
        ) {
            throw new TypeError('Ожидался публичный JWK без закрытой части.');
        }
    }

    const ecdh = await globalThis.crypto.subtle.importKey(
        'jwk',
        publicKeys.ecdh,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        [],
    );

    const ecdsa = await globalThis.crypto.subtle.importKey(
        'jwk',
        publicKeys.ecdsa,
        {
            name: 'ECDSA',
            namedCurve: 'P-256',
        },
        true,
        ['verify'],
    );

    return { ecdh, ecdsa };
}
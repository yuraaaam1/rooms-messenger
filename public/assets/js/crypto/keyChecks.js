export async function assertKeyPairsConsistent(privateKeys, publicKeys) {
    const challenge = globalThis.crypto.getRandomValues(new Uint8Array(32));

    const signature = await globalThis.crypto.subtle.sign(
        {
            name: 'ECDSA',
            hash: 'SHA-256',
        },
        privateKeys.ecdsa,
        challenge,
    );

    const signatureIsValid = await globalThis.crypto.subtle.verify(
        {
            name: 'ECDSA',
            hash: 'SHA-256',
        },
        publicKeys.ecdsa,
        signature,
        challenge,
    );

    if (!signatureIsValid) {
        throw new Error('Пара ECDSA не согласована');
    }

    const probeKeys = await globalThis.crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        false,
        ['deriveBits'],
    );

    let firstSecret;
    let secondSecret;

    try {
        firstSecret = new Uint8Array(
            await globalThis.crypto.subtle.deriveBits(
                {
                    name: 'ECDH',
                    public: probeKeys.publicKey,
                },
                privateKeys.ecdh,
                256,
            ),
        );

        secondSecret = new Uint8Array(
            await globalThis.crypto.subtle.deriveBits(
                {
                    name: 'ECDH',
                    public: publicKeys.ecdh,
                },
                probeKeys.privateKey,
                256,
            ),
        );

        if (!equalBytes(firstSecret, secondSecret)) {
            throw new Error('Пара ECDH не согласована.');
        }
    } finally {
        firstSecret?.fill(0);
        secondSecret?.fill(0);
    }
}

function equalBytes(left, right) {
    if (left.byteLength !== right.byteLength) {
        return false
    }

    let difference = 0;

    for (let index=0; index < left.byteLength; index += 1) {
        difference |= left[index] ^ right[index];
    }

    return difference === 0;
}
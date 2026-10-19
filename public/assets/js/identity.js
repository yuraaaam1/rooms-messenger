import { generateUserKeys, exportPublicKeys, importPublicKeys } from "./crypto/keys.js";

import {
    createPasswordSalt,
    derivePasswordKey,
    PASSWORD_SALT_BYTES,
} from './crypto/password.js';

import { encryptPrivateKeys, decryptPrivateKeys } from './crypto/keyContainer.js';
import { assertKeyPairsConsistent } from "./crypto/keyChecks.js";
import { bytesToBase64, base64ToBytes } from './crypto/encoding.js';

export const IDENTITY_VERSION = 1;

export async function createIdentityRecord(nickname, password) {
    if (typeof nickname !== 'string') {
        throw new TypeError('Никнейм должен быть строкой.');   
    }

    const normalizedNickname = nickname.trim();

    if (normalizedNickname.length === 0) {
        throw new TypeError('Никнейм не должен быть пустым')
    }

    const salt = createPasswordSalt();
    const masterKey = await derivePasswordKey(password, salt);

    const keys = await generateUserKeys();
    const publicKeys = await exportPublicKeys(keys);
    const encrypted = await encryptPrivateKeys(keys, masterKey);

    return {
        version: IDENTITY_VERSION,
        nickname: normalizedNickname,
        publicKeys,
        keyContainer: {
            salt: bytesToBase64(salt),
            iv: encrypted.iv,
            cipherText: encrypted.cipherText,
        },
    };
}

export async function restoreIdentityPrivateKeys(record, password) {
    validateIdentityRecord(record);

    const salt = base64ToBytes(record.keyContainer.salt);
    const masterKey = await derivePasswordKey(password, salt);

    const privateKeys = await decryptPrivateKeys(
        record.keyContainer,
        masterKey,
        record.publicKeys,
    );

    return privateKeys;
}

export function validateIdentityRecord(record) {
    if (!isObject(record)) {
        throw new TypeError('Локальная запись должна быть объектом.');
    }

    if (record.version !== IDENTITY_VERSION) {
        throw new Error('Неподдерживаемая версия локальной записи.');
    }

    if (
        typeof record.nickname !== 'string'
        || record.nickname.trim().length === 0
    ) {
        throw new TypeError('В локальной записи отсутсвует корректный никнейм.');
    }

    if (
        !isObject(record.publicKeys)
        || !hasPublicJwkShape(record.publicKeys.ecdh)
        || !hasPublicJwkShape(record.publicKeys.ecdsa)
    ) {
        throw new TypeError('Некорректная структура публичных ключей');
    }

    const container = record.keyContainer;

    if (!isObject(container)) {
        throw new TypeError('Отсутсвует ключевой контейнер.');
    }

    const salt = base64ToBytes(container.salt);
    const iv = base64ToBytes(container.iv);
    const cipherText = base64ToBytes(container.cipherText);

    if (salt.byteLength !== PASSWORD_SALT_BYTES) {
        throw new TypeError('Соль контейнера должна содержать 32 байта');
    }

    if (iv.byteLength !== 12) {
        throw new TypeError('IV контейнера должен содержать 12 байт.');
    }

    if (cipherText.byteLength < 16) {
        throw new TypeError('Шифротекст слишком коротий для метки AES-GCM.');
    }

    return record;
}

export async function unlockIdentity(record, password) {
    const snapshot = structuredClone(record);

    const privateKeys = await restoreIdentityPrivateKeys(snapshot, password);
    const publicKeys = await importPublicKeys(snapshot.publicKeys);

    await assertKeyPairsConsistent(privateKeys, publicKeys);

    return {
        nickname: snapshot.nickname,
        privateKeys,
        publicKeys,
    };
}

function isObject(value) {
    return value !== null
        && typeof value === 'object'
        && !Array.isArray(value)
}

function hasPublicJwkShape(key) {
    return isObject(key)
        && key.kty === 'EC'
        && key.crv === 'P-256'
        && typeof key.x === 'string'
        && key.x.length > 0
        && typeof key.y === 'string'
        && key.y.length > 0
        && !('d' in key);
}
import { validateIdentityRecord } from "../identity.js";

export const IDENTITY_STORAGE_KEY = 'messenger.identity';
export const IDENTITY_WRITE_LOCK = 'messenger.identity.write';

export function loadIdentityRecord(storage = globalThis.localStorage) {
    const serialized = storage.getItem(IDENTITY_STORAGE_KEY);

    if (serialized === null) {
        return null;
    }

    return validateIdentityRecord(JSON.parse(serialized));
}

export async function saveIdentityRecord(
    record,
    storage = globalThis.localStorage,
    locks = globalThis.navigator?.locks,
) {
    if (!locks || typeof locks.request !== 'function') {
        throw new Error('Web Locks API недоступен. Сохранение отменено.');
    }

    const snapshot = structuredClone(record);
    validateIdentityRecord(snapshot);

    await locks.request(
        IDENTITY_WRITE_LOCK,
        { mode: 'exclusive' },
        () => writeIdentityRecord(snapshot, storage),
    );
}

function writeIdentityRecord(record, storage) {

    if (storage.getItem(IDENTITY_STORAGE_KEY) !== null) {
        throw new Error('Локальна идентичность уже существует. Перезапись запрещена.');
    }

    const recordToStore = {
        version: record.version,
        nickname: record.nickname,
        publicKeys: {
            ecdh: copyPublicJwk(record.publicKeys.ecdh),
            ecdsa: copyPublicJwk(record.publicKeys.ecdsa),
        },
        keyContainer: {
            salt: record.keyContainer.salt,
            iv: record.keyContainer.iv,
            cipherText: record.keyContainer.cipherText,
        },
    };

    const serialized = JSON.stringify(recordToStore);

    storage.setItem(IDENTITY_STORAGE_KEY, serialized)
}

function copyPublicJwk(key) {
    return {
        kty: key.kty,
        crv: key.crv,
        x: key.x,
        y: key.y,
    };
}
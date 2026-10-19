import { createIdentityRecord, unlockIdentity } from './identity.js';

import {
    loadIdentityRecord,
    saveIdentityRecord,
} from './storage/identityStorage.js';

export function initializeIdentityUI(
    root = globalThis.document,
    storage,
    locks = globalThis.navigator?.locks,
) {
    const createSection = requireElement(root, 'identity-create-section');
    const unlockSection = requireElement(root, 'identity-unlock-section');
    const readySection = requireElement(root, 'identity-ready-section');

    const createFields = requireElement(root, 'identity-create-fields');
    const unlockFields = requireElement(root, 'identity-unlock-fields');

    const feedback = requireElement(root, 'identity-feedback');
    const storedNickname = requireElement(root, 'identity-stored-nickname');
    const nickname = requireElement(root, 'identity-nickname');

    const createForm = requireElement(root, 'identity-create-form');
    const createNickname = requireElement(root, 'identity-create-nickname');
    const createPassword = requireElement(root, 'identity-create-password');

    const createPasswordConfirmation = requireElement(
        root,
        'identity-create-password-confirmation',
    );

    let activeIdentity = null;
    let creationInProgress = false;

    createFields.disabled = true;
    unlockFields.disabled = true;

    createSection.hidden = true;
    unlockSection.hidden = true;
    readySection.hidden = true;

    storedNickname.textContent = '';
    nickname.textContent = '';
    feedback.textContent = '';

    createForm.addEventListener('submit', handleCreateSubmit);

    try {
        const record = loadIdentityRecord(storage);

        if (record === null) {
            createSection.hidden = false;

            if (!locks || typeof locks.request !== 'function') {
                feedback.textContent =
                    'Браузер не поддерживает безопасное сохранение профиля: Web Locks API недоступен.';

                return;
            }

            createFields.disabled = false;

            feedback.textContent =
                'Укажите никнейм и придумайте личный пароль.';

            return;
        }

        storedNickname.textContent = record.nickname;
        unlockSection.hidden = false;

        feedback.textContent =
            'Профиль найден. Вход подключим следующим шагом.';
    } catch (error) {
        console.error('Не удалось прочитать локальную идентичность:', error);

        feedback.textContent =
            'Не удалось прочитать сохранённый профиль. '
            + 'Создание нового профиля заблокировано. '
            + 'Существующие данные не изменены.';
    }

    async function handleCreateSubmit(event) {
        event.preventDefault();

        if (
            creationInProgress
            || activeIdentity !== null
            || createFields.disabled
            || createSection.hidden
        ) {
            return;
        }

        if (!createForm.reportValidity()) {
            return;
        }

        const normalizedNickname = createNickname.value.trim();

        if (normalizedNickname.length === 0) {
            feedback.textContent =
                'Никнейм не должен состоять только из пробелов.';

            createNickname.focus();
            return;
        }

        let password = createPassword.value;

        if (password !== createPasswordConfirmation.value) {
            feedback.textContent =
                'Пароли не совпадают. Проверьте повторный ввод.';

            createPasswordConfirmation.value = '';
            createPasswordConfirmation.focus();
            return;
        }

        creationInProgress = true;
        createFields.disabled = true;
        feedback.textContent = 'Создаём и сохраняем профиль...';

        let preparedIdentity = null;

        try {
            const record = await createIdentityRecord(
                normalizedNickname,
                password,
            );

            preparedIdentity = await unlockIdentity(record, password);

            await saveIdentityRecord(record, storage, locks);
        } catch (error) {
            console.error('Не удалось создать профиль:', error);

            feedback.textContent =
                'Не удалось завершить создание профиля. '
                + 'Перезагрузите страницу, чтобы проверить сохранённые данные.';

            return;
        } finally {
            password = '';
            createPassword.value = '';
            createPasswordConfirmation.value = '';
            creationInProgress = false;
        }

        activeIdentity = preparedIdentity;
        createForm.reset();

        createSection.hidden = true;
        unlockSection.hidden = true;
        nickname.textContent = activeIdentity.nickname;
        readySection.hidden = false;

        feedback.textContent = 'Профиль создан и готов к работе.';
    }
}

function requireElement(root, id) {
    const element = root.getElementById(id);

    if (element === null) {
        throw new Error(`Не найден элемент интерфейса: ${id}`);
    }

    return element;
}
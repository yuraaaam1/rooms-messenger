import { initializeIdentityUI } from "./identityUI.js";

const statusElement = document.getElementById('app-status')

async function bootApplication() {
    if (!window.isSecureContext) {
        statusElement.textContent =
            'Для работы Web Crypto API требуется HTTPS или localhost.';
        return;
    }

    if (!window.crypto?.subtle) {
        statusElement.textContent =
            'Этот браузер не поддерживает Web Crypto API.';
        return;
    }

    initializeIdentityUI();

    try {
        const response = await fetch('/api/health', {
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const health = await response.json();

        statusElement.textContent =
            `Клиент готов. Сервер ${health.app} доступен.`;
    } catch (error) {
        console.error('Не удалось выполнить проверку API:', error);

        statusElement.textContent =
            'Не удалось подключиться к серверноми API.';
    }
}

void bootApplication();
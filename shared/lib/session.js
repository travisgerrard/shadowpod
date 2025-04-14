"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoredSession = exports.syncSession = void 0;
const SESSION_KEY = 'shadowpod-auth-session';
// Web storage implementation
const webStorage = {
    async getItem(key) {
        return localStorage.getItem(key);
    },
    async setItem(key, value) {
        localStorage.setItem(key, value);
    },
    async removeItem(key) {
        localStorage.removeItem(key);
    },
};
// Mobile storage implementation
const mobileStorage = {
    async getItem(key) {
        // @ts-ignore - This will be replaced by platform-specific implementation
        return null;
    },
    async setItem(key, value) {
        // @ts-ignore - This will be replaced by platform-specific implementation
    },
    async removeItem(key) {
        // @ts-ignore - This will be replaced by platform-specific implementation
    },
};
// Use appropriate storage based on platform
const storage = typeof window !== 'undefined' ? webStorage : mobileStorage;
const syncSession = async (session) => {
    if (!session) {
        await storage.removeItem(SESSION_KEY);
        return;
    }
    const sessionData = JSON.stringify(session);
    await storage.setItem(SESSION_KEY, sessionData);
};
exports.syncSession = syncSession;
const getStoredSession = async () => {
    try {
        const sessionData = await storage.getItem(SESSION_KEY);
        if (!sessionData)
            return null;
        const session = JSON.parse(sessionData);
        // Validate session expiration
        if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
            await (0, exports.syncSession)(null);
            return null;
        }
        return session;
    }
    catch (error) {
        console.error('Error getting stored session:', error);
        return null;
    }
};
exports.getStoredSession = getStoredSession;

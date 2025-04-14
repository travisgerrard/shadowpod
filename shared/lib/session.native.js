"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoredSession = exports.syncSession = void 0;
const SecureStore = __importStar(require("expo-secure-store"));
const SESSION_KEY = 'shadowpod-auth-session';
// Mobile storage implementation using SecureStore
const storage = {
    async getItem(key) {
        return await SecureStore.getItemAsync(key);
    },
    async setItem(key, value) {
        await SecureStore.setItemAsync(key, value);
    },
    async removeItem(key) {
        await SecureStore.deleteItemAsync(key);
    },
};
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

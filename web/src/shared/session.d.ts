import { Session } from '@supabase/supabase-js';
export declare const syncSession: (session: Session | null) => Promise<void>;
export declare const getStoredSession: () => Promise<Session | null>;

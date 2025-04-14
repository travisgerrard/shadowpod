    -- Create user_profiles table
    CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    wanikani_api_token TEXT,
    selected_wanikani_level TEXT,
    encountered_items JSONB DEFAULT '[]'::JSONB,
    difficult_items JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create module_type enum
    CREATE TYPE module_type AS ENUM ('story', 'shadowing', 'prompt');

    -- Create user_modules table
    CREATE TABLE IF NOT EXISTS user_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    module_type module_type NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS user_modules_user_id_idx ON user_modules (user_id);
    CREATE INDEX IF NOT EXISTS user_modules_module_type_idx ON user_modules (module_type);

    -- Set up row level security
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view only their own profiles"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

    CREATE POLICY "Users can update only their own profiles"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

    CREATE POLICY "Users can view only their own modules"
    ON user_modules FOR SELECT
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert only their own modules"
    ON user_modules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    -- Function to handle new user creation
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
    INSERT INTO public.user_profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger for new user creation
    CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 
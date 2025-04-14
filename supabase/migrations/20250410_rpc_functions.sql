-- Function to update encountered items in user profile
CREATE OR REPLACE FUNCTION update_encountered_items(items JSONB)
RETURNS VOID AS $$
DECLARE
    current_items JSONB;
BEGIN
    -- Get current encountered_items
    SELECT encountered_items INTO current_items
    FROM user_profiles
    WHERE id = auth.uid();
    
    -- Update user_profiles with combined items
    UPDATE user_profiles
    SET encountered_items = current_items || items
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add item to difficult items
CREATE OR REPLACE FUNCTION add_difficult_item(item_vocab TEXT, item_reason TEXT)
RETURNS VOID AS $$
DECLARE
    current_items JSONB;
    new_item JSONB;
BEGIN
    -- Get current difficult_items
    SELECT difficult_items INTO current_items
    FROM user_profiles
    WHERE id = auth.uid();
    
    -- Create new item JSON
    new_item = jsonb_build_object('vocab', item_vocab, 'reason', item_reason);
    
    -- Update user_profiles with the new item added
    UPDATE user_profiles
    SET difficult_items = current_items || jsonb_build_array(new_item)
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
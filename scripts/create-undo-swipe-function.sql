-- Create a function to undo a swipe
CREATE OR REPLACE FUNCTION undo_swipe(
  p_swiper_id UUID,
  p_swiped_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
DECLARE
  v_deleted BOOLEAN := FALSE;
BEGIN
  -- Delete the swipe
  DELETE FROM swipes
  WHERE swiper_id = p_swiper_id
  AND swiped_id = p_swiped_id;
  
  -- Check if any row was deleted
  IF FOUND THEN
    v_deleted := TRUE;
  END IF;
  
  RETURN v_deleted;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION undo_swipe TO authenticated; 
-- Disable the slow message notification trigger for faster messaging
-- This removes the 2-3 second delay when sending messages

-- Drop the trigger that's causing slowness
DROP TRIGGER IF EXISTS trg_enqueue_job_on_message ON public.messages;

-- Keep the function for potential future use, but don't auto-trigger it
-- If you want notifications back later, you can re-enable with:
-- CREATE TRIGGER trg_enqueue_job_on_message
-- AFTER INSERT ON public.messages  
-- FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_on_message();

-- For now, messaging will be instant without automatic push notifications
-- Push notifications can be handled separately if needed

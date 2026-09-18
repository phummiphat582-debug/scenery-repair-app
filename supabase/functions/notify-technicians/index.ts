import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
  // Accept the canonical secret name, with a compatibility fallback for the
  // existing secret that was accidentally named with the App ID.
  const oneSignalRestApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')
    || (oneSignalAppId ? Deno.env.get(oneSignalAppId) : undefined);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!oneSignalAppId || !oneSignalRestApiKey || !supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Notification service is not configured' }, 503);
  }

  try {
    const body = await request.json();
    const ticketId = String(body?.ticketId || '');
    const requestId = String(body?.requestId || '');
    if (!ticketId && !requestId) return json({ error: 'ticketId or requestId is required' }, 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    let query = supabase.from('repair_tickets').select('id, request_id, title, department, location, priority').limit(1);
    query = ticketId && !ticketId.startsWith('ticket-')
      ? query.eq('id', ticketId)
      : query.eq('request_id', requestId);
    const { data: tickets, error: ticketError } = await query;
    if (ticketError) return json({ error: ticketError.message }, 500);
    const ticket = tickets?.[0];
    if (!ticket) return json({ sent: false, reason: 'ticket-not-found' }, 404);

    const title = ticket.priority === 'critical' || ticket.priority === 'high'
      ? 'มีงานแจ้งซ่อมด่วนเข้ามา'
      : 'มีงานแจ้งซ่อมใหม่เข้ามา';
    const content = `#${ticket.request_id} • ${ticket.title}${ticket.department ? ` • ${ticket.department}` : ''}`;
    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        Authorization: `Key ${oneSignalRestApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        target_channel: 'push',
        filters: [{ field: 'tag', key: 'scenery_role', relation: '=', value: 'technician' }],
        headings: { en: title, th: title },
        contents: { en: content, th: content },
        url: Deno.env.get('APP_URL') || 'https://phummiphat582-debug.github.io/scenery-repair-app/',
        data: { ticketId: ticket.id, requestId: ticket.request_id }
      })
    });

    const result = await oneSignalResponse.json().catch(() => ({}));
    if (!oneSignalResponse.ok) {
      console.error('[OneSignal]', result);
      return json({ sent: false, error: 'OneSignal rejected the notification' }, 502);
    }

    return json({ sent: Boolean(result?.id), notificationId: result?.id || null });
  } catch (error) {
    console.error('[notify-technicians]', error);
    return json({ error: 'Unexpected notification error' }, 500);
  }
});

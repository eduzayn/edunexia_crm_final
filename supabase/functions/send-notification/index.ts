import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter dados da requisição
    const { user_id, type, data } = await req.json();

    // Validar dados
    if (!user_id || !type || !data) {
      throw new Error('Dados inválidos');
    }

    // Criar notificação
    const { data: notification, error } = await supabaseClient
      .from('notifications')
      .insert([
        {
          user_id,
          type,
          data,
          read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Enviar notificação push (exemplo com web push)
    if (notification) {
      // Aqui você pode implementar a lógica de envio de push notification
      // Por exemplo, usando o serviço de web push do Supabase
    }

    return new Response(
      JSON.stringify({ success: true, data: notification }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 
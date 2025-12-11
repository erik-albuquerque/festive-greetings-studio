import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log('Webhook received:', JSON.stringify(payload));

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // AbacatePay webhook payload structure
    const event = payload.event;
    const billingData = payload.data?.billing || payload.billing;
    const metadata = billingData?.metadata || payload.metadata;
    const billingId = billingData?.id || payload.id;
    const status = billingData?.status || payload.status;

    console.log(`Processing webhook event: ${event}, billing ID: ${billingId}, status: ${status}`);

    if (!billingId) {
      console.log('No billing ID found in webhook');
      return new Response(
        JSON.stringify({ received: true, message: 'No billing ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different webhook events
    if (event === 'billing.paid' || status === 'PAID') {
      const userId = metadata?.user_id;
      const plan = metadata?.plan;

      console.log(`Payment confirmed for user ${userId}, plan: ${plan}`);

      // Update subscription status to active
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', billingId);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        
        // Try to find and update by user_id if payment_id doesn't match
        if (userId) {
          const { error: fallbackError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              payment_id: billingId,
              starts_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('status', 'pending');

          if (fallbackError) {
            console.error('Fallback update also failed:', fallbackError);
          } else {
            console.log('Subscription updated via fallback');
          }
        }
      } else {
        console.log('Subscription updated successfully');
      }

      // Cancel any existing free subscription for the user
      if (userId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', userId)
          .eq('plan', 'free')
          .eq('status', 'active');
      }
    } else if (event === 'billing.expired' || status === 'EXPIRED') {
      // Update subscription status to expired
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', billingId);

      if (error) {
        console.error('Error updating expired subscription:', error);
      }
    } else if (event === 'billing.refunded' || status === 'REFUNDED') {
      // Update subscription status to cancelled
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', billingId);

      if (error) {
        console.error('Error updating refunded subscription:', error);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event, billingId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

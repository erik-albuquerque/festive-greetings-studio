import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ABACATEPAY_API_KEY = Deno.env.get('ABACATEPAY_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying payment for user: ${user.id}`);

    // Get pending subscription for user
    const { data: pendingSubscription, error: subError } = await supabaseUser
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Subscription query error:', subError);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingSubscription) {
      // Check if user already has active subscription
      const { data: activeSubscription } = await supabaseUser
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .neq('plan', 'free')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSubscription) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'active',
            message: 'Subscription already active',
            subscription: activeSubscription
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'no_pending',
          message: 'No pending payment found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentId = pendingSubscription.payment_id;
    console.log(`Checking payment status for: ${paymentId}`);

    // Check payment status with AbacatePay
    const abacateResponse = await fetch(`https://api.abacatepay.com/v1/billing/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!abacateResponse.ok) {
      console.error('AbacatePay API error:', await abacateResponse.text());
      return new Response(
        JSON.stringify({ error: 'Error checking payment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const abacateData = await abacateResponse.json();
    console.log('AbacatePay response:', JSON.stringify(abacateData));

    // Find the specific billing
    const billing = abacateData.data?.find((b: any) => b.id === paymentId);
    
    if (!billing) {
      console.log('Billing not found in AbacatePay response');
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'pending',
          message: 'Payment still processing' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Payment status: ${billing.status}`);

    if (billing.status === 'PAID') {
      // Update subscription to active
      const { error: updateError } = await supabaseUser
        .from('subscriptions')
        .update({
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return new Response(
          JSON.stringify({ error: 'Error activating subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cancel free subscription if exists
      await supabaseUser
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('plan', 'free')
        .eq('status', 'active');

      console.log('Subscription activated successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'active',
          message: 'Payment confirmed! Subscription activated.',
          subscription: { ...pendingSubscription, status: 'active' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (billing.status === 'EXPIRED' || billing.status === 'REFUNDED') {
      // Update subscription status
      await supabaseUser
        .from('subscriptions')
        .update({
          status: billing.status.toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingSubscription.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          status: billing.status.toLowerCase(),
          message: `Payment ${billing.status.toLowerCase()}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        status: 'pending',
        message: 'Payment still pending' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Verify payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

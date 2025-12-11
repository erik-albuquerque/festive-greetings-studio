import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ABACATEPAY_API_KEY = Deno.env.get('ABACATEPAY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface PlanConfig {
  name: string;
  price_cents: number;
  description: string;
}

const PLANS: Record<string, PlanConfig> = {
  premium: {
    name: 'Festiva Premium',
    price_cents: 2990,
    description: 'Acesso completo ao Festiva com IA e templates premium'
  },
  family: {
    name: 'Festiva Família',
    price_cents: 4990,
    description: 'Plano família com até 5 membros'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { plan, returnUrl } = await req.json();
    
    if (!plan || !PLANS[plan]) {
      throw new Error('Invalid plan selected');
    }

    const planConfig = PLANS[plan];
    
    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const customerName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente';
    
    console.log(`Creating payment for user ${user.id}, plan: ${plan}, name: ${customerName}`);

    // Create charge in AbacatePay
    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [
          {
            externalId: `${plan}-${user.id}`,
            name: planConfig.name,
            description: planConfig.description,
            quantity: 1,
            price: planConfig.price_cents,
          }
        ],
        returnUrl: returnUrl || `${req.headers.get('origin')}/dashboard`,
        completionUrl: returnUrl || `${req.headers.get('origin')}/dashboard`,
        customer: {
          name: customerName,
          email: user.email,
          cellphone: user.phone || undefined,
          taxId: undefined,
        },
        metadata: {
          user_id: user.id,
          plan: plan,
        }
      }),
    });

    const paymentData = await response.json();
    
    console.log('AbacatePay response:', JSON.stringify(paymentData));

    if (!response.ok) {
      throw new Error(paymentData.message || 'Failed to create payment');
    }

    // Create pending subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: plan,
        status: 'pending',
        payment_id: paymentData.data?.id || paymentData.id,
        payment_provider: 'abacatepay',
        price_cents: planConfig.price_cents,
      });

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: paymentData.data?.url || paymentData.url,
        paymentId: paymentData.data?.id || paymentData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error creating payment:', error);
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

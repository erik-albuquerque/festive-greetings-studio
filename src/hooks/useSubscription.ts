import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Plan = "free" | "premium" | "family";
export type SubscriptionStatus = "active" | "cancelled" | "pending" | "expired";

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  payment_id: string | null;
  payment_provider: string | null;
  price_cents: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

  const isPremium = subscription?.plan === "premium" || subscription?.plan === "family";
  const isFamily = subscription?.plan === "family";

  return {
    subscription,
    isLoading,
    isPremium,
    isFamily,
    plan: subscription?.plan || "free",
    refetch,
  };
}

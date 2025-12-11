import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false);

  const createPayment = async (plan: "premium" | "family") => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar logado para fazer upgrade");
        return null;
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          plan,
          returnUrl: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast.error("Erro ao criar pagamento. Tente novamente.");
        return null;
      }

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return data;
      } else {
        toast.error("Erro ao obter URL de pagamento");
        return null;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Erro ao processar pagamento");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPayment,
    isLoading,
  };
}

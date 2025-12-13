import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "./useSubscription";

export function useVerifyPayment() {
  const [isVerifying, setIsVerifying] = useState(false);
  const { refetch } = useSubscription();

  const verifyPayment = async () => {
    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment');

      if (error) {
        console.error('Verify payment error:', error);
        toast.error("Erro ao verificar pagamento. Tente novamente.");
        return null;
      }

      console.log('Verify payment response:', data);

      if (data?.status === 'active') {
        toast.success("Pagamento confirmado! Sua assinatura está ativa.");
        await refetch();
        return data;
      } else if (data?.status === 'pending') {
        toast.info("Pagamento ainda pendente. Tente novamente em alguns segundos.");
        return data;
      } else if (data?.status === 'no_pending') {
        toast.info("Nenhum pagamento pendente encontrado.");
        return data;
      } else if (data?.status === 'expired') {
        toast.error("O pagamento expirou. Por favor, tente novamente.");
        return data;
      } else {
        toast.error("Status do pagamento: " + (data?.message || 'desconhecido'));
        return data;
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      toast.error("Erro ao verificar pagamento");
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyPayment,
    isVerifying,
  };
}

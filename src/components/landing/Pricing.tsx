import { motion } from "framer-motion";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePayment } from "@/hooks/usePayment";

const plans = [
  {
    name: "Gratuito",
    price: "0",
    description: "Perfeito para experimentar",
    features: [
      "1 cartão por mês",
      "Templates básicos",
      "Compartilhamento via link",
      "Marca d'água Festiva",
    ],
    cta: "Começar Grátis",
    popular: false,
    planId: "free" as const,
  },
  {
    name: "Premium",
    price: "29,90",
    description: "Para quem quer encantar",
    features: [
      "Cartões ilimitados",
      "Todos os templates premium",
      "Mensagens com IA ilimitadas",
      "Contadores personalizados",
      "Download em HD",
      "Sem marca d'água",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    popular: true,
    planId: "premium" as const,
  },
  {
    name: "Família",
    price: "49,90",
    description: "Para toda a família",
    features: [
      "Tudo do Premium",
      "Até 5 usuários",
      "Galeria compartilhada",
      "Templates exclusivos",
      "Suporte VIP",
    ],
    cta: "Assinar Família",
    popular: false,
    planId: "family" as const,
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const { createPayment, isLoading } = usePayment();
  const navigate = useNavigate();

  const handlePlanClick = async (planId: "free" | "premium" | "family") => {
    if (planId === "free") {
      navigate("/auth?mode=signup");
      return;
    }

    if (!user) {
      navigate(`/auth?mode=signup&plan=${planId}`);
      return;
    }

    await createPayment(planId);
  };

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-festiva-glow opacity-30" />
      
      <div className="festiva-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Planos para cada{" "}
            <span className="text-gradient-gold">necessidade</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha o plano ideal para celebrar as festas de fim de ano.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/20 to-transparent p-[1px]"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Mais Popular
                </div>
              )}
              
              <div className={`h-full glass-card rounded-2xl p-6 lg:p-8 ${
                plan.popular ? "border-primary/30" : ""
              }`}>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="font-display text-4xl font-bold">
                    R${plan.price}
                  </span>
                  {plan.price !== "0" && (
                    <span className="text-muted-foreground">/mês</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "gold" : "gold-outline"}
                  className="w-full"
                  onClick={() => handlePlanClick(plan.planId)}
                  disabled={isLoading}
                >
                  {isLoading && plan.planId !== "free" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground text-sm">
            🔒 Pagamento seguro • Cancele quando quiser • Garantia de 7 dias
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;

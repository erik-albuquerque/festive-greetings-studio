import { motion } from "framer-motion";
import { Check, Zap, Heart, Shield } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Rápido e Fácil",
    items: [
      "Crie cartões em menos de 5 minutos",
      "Interface intuitiva e moderna",
      "Sem necessidade de habilidades de design",
    ],
  },
  {
    icon: Heart,
    title: "Emocionante",
    items: [
      "Mensagens que tocam o coração",
      "IA treinada para momentos especiais",
      "Personalize cada detalhe",
    ],
  },
  {
    icon: Shield,
    title: "Confiável",
    items: [
      "Links que não expiram",
      "Compartilhamento seguro",
      "Suporte humanizado",
    ],
  },
];

const Benefits = () => {
  return (
    <section id="benefits" className="py-24 lg:py-32 bg-card/50">
      <div className="festiva-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Por que escolher o{" "}
              <span className="text-gradient-gold">Festiva</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Criamos a ferramenta perfeita para você celebrar os momentos mais 
              importantes do ano com quem você ama.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <ul className="space-y-2">
                      {benefit.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Decorative Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl" />
              <div className="absolute inset-4 glass-card rounded-2xl overflow-hidden">
                {/* Mock Card Preview */}
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <span className="text-4xl">🎄</span>
                  </div>
                  <h4 className="font-display text-2xl font-bold mb-2">
                    Feliz Natal!
                  </h4>
                  <p className="text-muted-foreground mb-6">
                    Que esta data traga paz e alegria para você e toda sua família.
                  </p>
                  <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-sm text-primary font-medium">
                      🕐 24d 12h 45m 30s
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center"
              >
                <span className="text-2xl">✨</span>
              </motion.div>
              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center"
              >
                <span className="text-xl">🎁</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;

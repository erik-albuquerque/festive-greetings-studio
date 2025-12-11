import { motion } from "framer-motion";
import { 
  Wand2, 
  Clock, 
  Share2, 
  Palette, 
  MessageSquareHeart, 
  Download 
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "Mensagens com IA",
    description: "Gere mensagens emocionantes e personalizadas com inteligência artificial em segundos.",
  },
  {
    icon: Palette,
    title: "Templates Premium",
    description: "Escolha entre dezenas de templates exclusivos para Natal e Réveillon.",
  },
  {
    icon: Clock,
    title: "Contador Regressivo",
    description: "Adicione contadores animados para a meia-noite ou momento especial.",
  },
  {
    icon: MessageSquareHeart,
    title: "Personalização Total",
    description: "Customize cores, fontes, imagens e adicione seu toque pessoal.",
  },
  {
    icon: Share2,
    title: "Compartilhamento Fácil",
    description: "Compartilhe via link, WhatsApp, email ou redes sociais com um clique.",
  },
  {
    icon: Download,
    title: "Download HD",
    description: "Baixe seus cartões em alta resolução para imprimir ou usar offline.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-festiva-glow opacity-50" />
      
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
            Tudo que você precisa para{" "}
            <span className="text-gradient-gold">encantar</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Recursos poderosos para criar cartões inesquecíveis em minutos.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card rounded-2xl p-6 lg:p-8 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

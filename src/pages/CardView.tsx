import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Clock, Heart, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { getTemplate } from "@/components/CardTemplates";

interface CardData {
  id: string;
  title: string;
  message: string | null;
  recipient_name: string | null;
  countdown_date: string | null;
  template: string;
}

const CardView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const fetchCard = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("share_slug", slug)
        .eq("is_public", true)
        .maybeSingle();

      if (!error && data) {
        setCard(data);
        // Increment views
        await supabase
          .from("cards")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", data.id);
      }
      setLoading(false);
    };

    fetchCard();
  }, [slug]);

  // Countdown timer
  useEffect(() => {
    if (!card?.countdown_date) return;

    const target = new Date(card.countdown_date).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [card?.countdown_date]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">
            Cartão não encontrado
          </h1>
          <p className="text-muted-foreground">
            Este cartão pode ter sido removido ou o link está incorreto.
          </p>
        </div>
      </div>
    );
  }

  const template = getTemplate(card.template);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${template.colors.background} flex items-center justify-center relative overflow-hidden p-4`}>
      {/* Background Effects */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br ${template.colors.accent} rounded-full blur-3xl opacity-50`} />
      <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br ${template.colors.accent} rounded-full blur-3xl opacity-30`} />

      {/* Floating decorations */}
      {template.decorations.map((decoration, index) => (
        <motion.div
          key={index}
          animate={{ 
            y: index % 2 === 0 ? [-10, 10, -10] : [10, -10, 10], 
            rotate: [0, index % 2 === 0 ? 5 : -5, 0] 
          }}
          transition={{ duration: 4 + index, repeat: Infinity }}
          className={`absolute text-3xl md:text-4xl ${
            index === 0 ? "top-20 left-[10%]" :
            index === 1 ? "top-32 right-[15%]" :
            index === 2 ? "bottom-20 left-[20%]" :
            "bottom-32 right-[25%]"
          }`}
        >
          {decoration}
        </motion.div>
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className={`glass-card rounded-3xl p-8 md:p-12 text-center ${template.colors.card}`}>
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${template.colors.accent} flex items-center justify-center mx-auto mb-8`}
          >
            <span className="text-5xl">{template.emoji}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`font-display text-3xl md:text-4xl font-bold mb-4 ${template.colors.text}`}
          >
            {card.title}
          </motion.h1>

          {/* Recipient */}
          {card.recipient_name && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-6"
            >
              Para: <span className="text-foreground">{card.recipient_name}</span>
            </motion.p>
          )}

          {/* Message */}
          {card.message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-background/30 rounded-2xl p-6 mb-8"
            >
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {card.message}
              </p>
            </motion.div>
          )}

          {/* Countdown */}
          {card.countdown_date && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <div className={`flex items-center justify-center gap-2 ${template.colors.text} mb-4`}>
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Contagem Regressiva</span>
              </div>
              <div className="flex justify-center gap-3">
                {[
                  { value: countdown.days, label: "Dias" },
                  { value: countdown.hours, label: "Horas" },
                  { value: countdown.minutes, label: "Min" },
                  { value: countdown.seconds, label: "Seg" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`bg-gradient-to-br ${template.colors.accent} rounded-xl px-4 py-3 min-w-[70px]`}
                  >
                    <div className={`text-2xl font-bold ${template.colors.text}`}>
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Heart className={`w-4 h-4 ${template.colors.text}`} />
            <span className="text-sm">
              Criado com{" "}
              <span className="text-gradient-gold font-semibold">Festiva</span>
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CardView;

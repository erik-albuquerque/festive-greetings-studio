import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Plus,
  Clock,
  Share2,
  LogOut,
  Wand2,
  Gift,
  Crown,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateSelector, getTemplate } from "@/components/CardTemplates";

interface CardItem {
  id: string;
  title: string;
  message: string | null;
  template: string;
  recipient_name: string | null;
  countdown_date: string | null;
  share_slug: string | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isPremium, plan, isLoading: subLoading } = useSubscription();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCard, setNewCard] = useState({
    title: "",
    message: "",
    recipient_name: "",
    countdown_date: "",
    template: "christmas-classic",
  });
  const [generatingMessage, setGeneratingMessage] = useState(false);

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch cards
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["cards", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CardItem[];
    },
    enabled: !!user?.id,
  });

  // Create card mutation
  const createCard = useMutation({
    mutationFn: async (cardData: typeof newCard) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Free plan limit
      if (!isPremium && cards.length >= 1) {
        throw new Error("Limite do plano gratuito atingido");
      }

      const slug = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from("cards")
        .insert({
          user_id: user.id,
          title: cardData.title,
          message: cardData.message,
          recipient_name: cardData.recipient_name,
          countdown_date: cardData.countdown_date || null,
          template: cardData.template,
          share_slug: slug,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Cartão criado com sucesso!");
      setShowCreateModal(false);
      setNewCard({
        title: "",
        message: "",
        recipient_name: "",
        countdown_date: "",
        template: "christmas-classic",
      });
    },
    onError: (error: any) => {
      if (error.message.includes("Limite")) {
        toast.error("Você atingiu o limite do plano gratuito. Faça upgrade para Premium!");
      } else {
        toast.error("Erro ao criar cartão");
      }
    },
  });

  // Delete card mutation
  const deleteCard = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Cartão excluído");
    },
  });

  // Generate AI message
  const generateMessage = async () => {
    if (!isPremium) {
      toast.error("Recurso disponível apenas no plano Premium");
      return;
    }

    setGeneratingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-message", {
        body: {
          recipient: newCard.recipient_name || "pessoa especial",
          occasion: "Natal e Ano Novo",
        },
      });

      if (error) throw error;
      setNewCard((prev) => ({ ...prev, message: data.message }));
      toast.success("Mensagem gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar mensagem. Tente novamente.");
    } finally {
      setGeneratingMessage(false);
    }
  };

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/card/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -4,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="festiva-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold text-gradient-gold">
              Festiva
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!isPremium && (
              <Button
                variant="gold-outline"
                size="sm"
                onClick={() => navigate("/#pricing")}
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">
              Plano: <span className="capitalize text-foreground">{plan}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="festiva-container py-8">
        {/* Stats */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
              <Card className="glass-card border-border/50 cursor-default">
                <CardContent className="p-6 flex items-center gap-4">
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Gift className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cartões Criados</p>
                    <motion.p 
                      className="text-2xl font-bold"
                      key={cards.length}
                      initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
                      animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      {cards.length}
                    </motion.p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
              <Card className="glass-card border-border/50 cursor-default">
                <CardContent className="p-6 flex items-center gap-4">
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Clock className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dias até Natal</p>
                    <p className="text-2xl font-bold">
                      {Math.max(
                        0,
                        Math.ceil(
                          (new Date("2024-12-25").getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover">
              <Card className="glass-card border-border/50 cursor-default">
                <CardContent className="p-6 flex items-center gap-4">
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                    animate={{ 
                      boxShadow: [
                        "0 0 0 0 hsla(var(--primary), 0)",
                        "0 0 20px 4px hsla(var(--primary), 0.3)",
                        "0 0 0 0 hsla(var(--primary), 0)",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seu Plano</p>
                    <p className="text-2xl font-bold capitalize">{plan}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Create Button */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
        >
          <h2 className="font-display text-2xl font-bold">Meus Cartões</h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="gold" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Cartão
            </Button>
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        {cardsLoading ? (
          <motion.div 
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
          </motion.div>
        ) : cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <Card className="glass-card border-border/50 border-dashed">
              <CardContent className="p-12 text-center">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                </motion.div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Nenhum cartão ainda
                </h3>
                <p className="text-muted-foreground mb-6">
                  Crie seu primeiro cartão e espalhe a magia das festas!
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="gold" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Meu Primeiro Cartão
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                layout
                layoutId={card.id}
              >
                <motion.div
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="glass-card border-border/50 overflow-hidden group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="truncate">{card.title}</span>
                        <motion.span 
                          className="text-2xl"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                        >
                          {getTemplate(card.template).emoji}
                        </motion.span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {card.recipient_name && (
                        <p className="text-sm text-muted-foreground">
                          Para: {card.recipient_name}
                        </p>
                      )}
                      {card.message && (
                        <p className="text-sm line-clamp-2">{card.message}</p>
                      )}
                      {card.countdown_date && (
                        <motion.div 
                          className="flex items-center gap-2 text-sm text-primary"
                          animate={{ opacity: [1, 0.6, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Clock className="w-4 h-4" />
                          <span>
                            Contagem para:{" "}
                            {new Date(card.countdown_date).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        </motion.div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => copyShareLink(card.share_slug!)}
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Copiar Link
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`/card/${card.share_slug}`, "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 10 }} 
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCard.mutate(card.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Create Modal */}
      <AnimatePresence mode="wait">
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
              }}
              className="w-full max-w-lg glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl shadow-primary/20"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-2xl font-bold mb-6">
                Criar Novo Cartão
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCard.mutate(newCard);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Título do Cartão</Label>
                  <Input
                    placeholder="Ex: Feliz Natal!"
                    value={newCard.title}
                    onChange={(e) =>
                      setNewCard((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Para quem?</Label>
                  <Input
                    placeholder="Nome do destinatário"
                    value={newCard.recipient_name}
                    onChange={(e) =>
                      setNewCard((prev) => ({
                        ...prev,
                        recipient_name: e.target.value,
                      }))
                    }
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mensagem</Label>
                    {isPremium && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateMessage}
                        disabled={generatingMessage}
                      >
                        <Wand2 className="w-4 h-4 mr-1" />
                        {generatingMessage ? "Gerando..." : "Gerar com IA"}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Escreva sua mensagem especial..."
                    value={newCard.message}
                    onChange={(e) =>
                      setNewCard((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    className="bg-background/50 min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Template do Cartão</Label>
                  <TemplateSelector
                    selected={newCard.template}
                    onSelect={(templateId) =>
                      setNewCard((prev) => ({ ...prev, template: templateId }))
                    }
                    isPremium={isPremium}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contagem Regressiva (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={newCard.countdown_date}
                    onChange={(e) =>
                      setNewCard((prev) => ({
                        ...prev,
                        countdown_date: e.target.value,
                      }))
                    }
                    className="bg-background/50"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    className="flex-1"
                    disabled={createCard.isPending}
                  >
                    {createCard.isPending ? "Criando..." : "Criar Cartão"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

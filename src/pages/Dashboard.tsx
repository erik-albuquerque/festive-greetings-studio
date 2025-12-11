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
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card border-border/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cartões Criados</p>
                <p className="text-2xl font-bold">{cards.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
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

          <Card className="glass-card border-border/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seu Plano</p>
                <p className="text-2xl font-bold capitalize">{plan}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Meus Cartões</h2>
          <Button variant="gold" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Cartão
          </Button>
        </div>

        {/* Cards Grid */}
        {cardsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
        ) : cards.length === 0 ? (
          <Card className="glass-card border-border/50 border-dashed">
            <CardContent className="p-12 text-center">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">
                Nenhum cartão ainda
              </h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro cartão e espalhe a magia das festas!
              </p>
              <Button variant="gold" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Meu Primeiro Cartão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass-card border-border/50 overflow-hidden group hover:border-primary/30 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate">{card.title}</span>
                      <span className="text-2xl">{getTemplate(card.template).emoji}</span>
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
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Clock className="w-4 h-4" />
                        <span>
                          Contagem para:{" "}
                          {new Date(card.countdown_date).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyShareLink(card.share_slug!)}
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Copiar Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/card/${card.share_slug}`, "_blank")
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCard.mutate(card.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
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

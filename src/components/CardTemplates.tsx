import React, { forwardRef } from "react";
import { Crown } from "lucide-react";

export interface CardTemplate {
  id: string;
  name: string;
  emoji: string;
  isPremium: boolean;
  colors: {
    background: string;
    accent: string;
    text: string;
    card: string;
  };
  decorations: string[];
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "christmas-classic",
    name: "Natal Clássico",
    emoji: "🎄",
    isPremium: false,
    colors: {
      background: "from-[#0A0A0B] to-[#1a1a1d]",
      accent: "from-primary/30 to-primary/10",
      text: "text-primary",
      card: "border-primary/20",
    },
    decorations: ["✨", "🎄", "🎁", "⭐"],
  },
  {
    id: "winter-wonderland",
    name: "Inverno Mágico",
    emoji: "❄️",
    isPremium: true,
    colors: {
      background: "from-[#0c1929] to-[#1a365d]",
      accent: "from-blue-400/30 to-cyan-400/10",
      text: "text-cyan-400",
      card: "border-cyan-400/20",
    },
    decorations: ["❄️", "⛄", "🌨️", "💎"],
  },
  {
    id: "golden-elegance",
    name: "Elegância Dourada",
    emoji: "✨",
    isPremium: true,
    colors: {
      background: "from-[#1a1608] to-[#2d2410]",
      accent: "from-amber-400/30 to-yellow-600/10",
      text: "text-amber-400",
      card: "border-amber-400/20",
    },
    decorations: ["✨", "🌟", "👑", "💫"],
  },
  {
    id: "festive-red",
    name: "Vermelho Festivo",
    emoji: "🎅",
    isPremium: true,
    colors: {
      background: "from-[#1a0808] to-[#2d1010]",
      accent: "from-red-500/30 to-rose-600/10",
      text: "text-red-400",
      card: "border-red-400/20",
    },
    decorations: ["🎅", "🦌", "🔔", "🎀"],
  },
  {
    id: "midnight-stars",
    name: "Noite Estrelada",
    emoji: "🌙",
    isPremium: true,
    colors: {
      background: "from-[#0a0a1a] to-[#1a1a3d]",
      accent: "from-indigo-400/30 to-purple-600/10",
      text: "text-indigo-400",
      card: "border-indigo-400/20",
    },
    decorations: ["🌙", "⭐", "✨", "🌠"],
  },
  {
    id: "new-year-party",
    name: "Réveillon",
    emoji: "🎉",
    isPremium: true,
    colors: {
      background: "from-[#0d0a1a] to-[#1a102d]",
      accent: "from-violet-500/30 to-fuchsia-600/10",
      text: "text-violet-400",
      card: "border-violet-400/20",
    },
    decorations: ["🎉", "🥂", "🎆", "🪩"],
  },
  {
    id: "cozy-christmas",
    name: "Natal Aconchegante",
    emoji: "🕯️",
    isPremium: true,
    colors: {
      background: "from-[#1a0f08] to-[#2d1a10]",
      accent: "from-orange-400/30 to-amber-600/10",
      text: "text-orange-400",
      card: "border-orange-400/20",
    },
    decorations: ["🕯️", "🔥", "☕", "🧦"],
  },
  {
    id: "nordic-frost",
    name: "Frost Nórdico",
    emoji: "🏔️",
    isPremium: true,
    colors: {
      background: "from-[#0a1a1a] to-[#102d2d]",
      accent: "from-teal-400/30 to-emerald-600/10",
      text: "text-teal-400",
      card: "border-teal-400/20",
    },
    decorations: ["🏔️", "🌲", "❄️", "🦌"],
  },
];

export const getTemplate = (templateId: string): CardTemplate => {
  return CARD_TEMPLATES.find((t) => t.id === templateId) || CARD_TEMPLATES[0];
};

interface TemplateSelectorProps {
  selected: string;
  onSelect: (templateId: string) => void;
  isPremium: boolean;
}

export const TemplateSelector = forwardRef<HTMLDivElement, TemplateSelectorProps>(
  ({ selected, onSelect, isPremium }, ref) => {
    return (
      <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CARD_TEMPLATES.map((template) => {
          const isLocked = template.isPremium && !isPremium;
          const isSelected = selected === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => !isLocked && onSelect(template.id)}
              disabled={isLocked}
              className={`relative p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : isLocked
                  ? "border-border/30 opacity-50 cursor-not-allowed"
                  : "border-border/50 hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-1">{template.emoji}</div>
              <div className="text-xs font-medium truncate">{template.name}</div>
              {isLocked && (
                <div className="absolute top-1 right-1">
                  <Crown className="w-3 h-3 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }
);

TemplateSelector.displayName = "TemplateSelector";

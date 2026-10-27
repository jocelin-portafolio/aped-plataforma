import { Hand, MessageCircle, Puzzle, Brain, Users, Palette, ChefHat, PersonStanding, Sparkles } from 'lucide-react';

// Icono y color (de la paleta del logo) de cada servicio y taller.
export const serviceIcons = {
  'terapia-ocupacional': { icon: Hand, tone: 'blue' },
  fonoaudiologia: { icon: MessageCircle, tone: 'sky' },
  'terapia-conductual': { icon: Puzzle, tone: 'green' },
  psicologia: { icon: Brain, tone: 'red' },
};

export const workshopIcons = {
  'habilidades-sociales': { icon: Users, tone: 'sky' },
  arteterapia: { icon: Palette, tone: 'red' },
  cocina: { icon: ChefHat, tone: 'yellow' },
  motricidad: { icon: PersonStanding, tone: 'green' },
};

export const fallbackIcon = { icon: Sparkles, tone: 'blue' };

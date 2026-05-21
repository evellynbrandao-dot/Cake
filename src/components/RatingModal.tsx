import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, X, MessageSquare, Award } from "lucide-react";
import { Bolo } from "../types";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bolo: Bolo | null;
  onSubmit: (id: string, stars: number, comment: string) => Promise<void>;
  isSubmitting: boolean;
}

const STAR_LABELS: Record<number, string> = {
  1: "Não gostei 😕",
  2: "Regular / Aceitável 😐",
  3: "Gostoso / Recomendado 🙂",
  4: "Muito Bom / Recomendo Forte! 😋",
  5: "Espetacular / Uma Obra de Arte! 🏆✨"
};

export default function RatingModal({ isOpen, onClose, bolo, onSubmit, isSubmitting }: RatingModalProps) {
  const [stars, setStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    if (bolo) {
      setStars(bolo.estrelas || 5);
      setComment(bolo.comentario_dono || "");
    }
  }, [bolo, isOpen]);

  if (!isOpen || !bolo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(bolo.id, stars, comment);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="rating-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      >
        <motion.div
          id="rating-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#fdfbf9] shadow-2xl border border-brand-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-brand-700 to-brand-800 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-300" />
              <h3 className="font-serif text-lg font-bold">Avaliar Bolo da Chef</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Minimizar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Short Cake Info Summary */}
            <div className="flex items-center gap-4 bg-brand-100/50 p-3 rounded-xl border border-brand-200/50">
              <img
                src={bolo.imagem_url}
                alt={bolo.nome}
                className="h-14 w-14 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">{bolo.categoria}</span>
                <h4 className="font-serif font-bold text-brand-900 leading-tight">{bolo.nome}</h4>
                <p className="text-xs text-brand-700 truncate max-w-xs">{bolo.recheio}</p>
              </div>
            </div>

            {/* Stars Selector */}
            <div className="space-y-2 text-center">
              <label className="block text-sm font-medium text-brand-900">
                Sua Nota de Especialista (Estrelas)
              </label>
              
              <div className="flex justify-center gap-2 py-3">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isGold = hoveredStars !== null ? star <= hoveredStars : star <= stars;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStars(star)}
                      onMouseEnter={() => setHoveredStars(star)}
                      onMouseLeave={() => setHoveredStars(null)}
                      className="cursor-pointer transition-transform duration-100 hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-9 w-9 ${
                          isGold 
                            ? "fill-amber-400 text-amber-500 [filter:drop-shadow(0_0_4px_rgba(245,158,11,0.4))]" 
                            : "text-brand-300 fill-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Label based on Selection */}
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-700 bg-brand-100 px-3 py-1 rounded-full border border-brand-200/30">
                  {STAR_LABELS[hoveredStars !== null ? hoveredStars : stars]}
                </span>
              </div>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-1">
              <label htmlFor="comment" className="flex items-center gap-1.5 text-sm font-medium text-brand-900">
                <MessageSquare className="h-4 w-4 text-brand-500" />
                Seu Parecer Técnico / Avaliação do Sabor
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: Massa super úmida e fofinha, recheio equilibrado na doçura, o cacau realçou perfeitamente o café de fundo..."
                className="w-full rounded-xl border border-brand-300 bg-white p-3 text-sm text-brand-900 placeholder-brand-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-shadow"
                required
              />
              <p className="text-[11px] text-brand-500">
                Apenas você (proprietário autenticado) poderá gravar ou substituir esta avaliação.
              </p>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-700 bg-brand-100 hover:bg-brand-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Gravando..." : "Salvar Avaliação"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

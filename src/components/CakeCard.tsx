import React from "react";
import { Star, MessageSquare, Edit2, Trash2, Shield, Calendar, Layers, Sparkles } from "lucide-react";
import { Bolo } from "../types";

interface CakeCardProps {
  key?: string;
  bolo: Bolo;
  isAdmin: boolean;
  onEdit: (bolo: Bolo) => void;
  onRate: (bolo: Bolo) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export default function CakeCard({ bolo, isAdmin, onEdit, onRate, onDelete }: CakeCardProps) {
  const isEvaluated = bolo.estrelas !== null && bolo.estrelas !== undefined;

  // Format ISO Date into Portuguese Readable format
  const formatRatingDate = (isoString: string | null) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return "";
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Tem certeza que deseja excluir o bolo "${bolo.nome}" do catálogo?`)) {
      onDelete(bolo.id);
    }
  };

  return (    <div
      id={`cake-card-${bolo.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-xs hover:shadow-md transition-all duration-300 border border-brand-100 hover:border-brand-200"
    >
      {/* Cake Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-brand-50">
        <img
          src={bolo.imagem_url}
          alt={bolo.nome}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Category Badge & Price Badge overlapping raw image */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-brand-900/90 backdrop-blur-xs px-3 py-1 text-[10px] font-bold text-white tracking-wider border border-white/10 uppercase">
            {bolo.categoria}
          </span>
          {bolo.is_custom && (
            <span className="rounded-full bg-rose-pastel-500/90 backdrop-blur-xs px-2.5 py-1 text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 animate-pulse" />
              Novo
            </span>
          )}
        </div>

        {bolo.preco_estimado && (
          <div className="absolute bottom-4 right-4 rounded-xl bg-white/95 backdrop-blur-xs px-3 py-1 text-xs font-bold text-brand-900 shadow-xs border border-brand-100">
            {bolo.preco_estimado}
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="flex flex-1 flex-col p-6 space-y-4">
        {/* Title and Base Description */}
        <div className="space-y-1.5">
          <h3 className="font-serif text-xl font-bold text-brand-900 group-hover:text-rose-pastel-600 tracking-tight leading-tight transition-colors">
            {bolo.nome}
          </h3>
          <p className="text-xs text-brand-800/80 leading-relaxed font-light">
            {bolo.descricao}
          </p>
        </div>

        {/* Technical/Baking Anatomy details */}
        <div className="rounded-[1.25rem] bg-brand-50 p-3.5 border border-brand-100/60 space-y-2 text-xs">
          <h4 className="font-bold text-brand-700 tracking-wider uppercase text-[9px] flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-brand-400" />
            Ingredientes / Estrutura
          </h4>
          <div className="grid grid-cols-1 gap-1 text-brand-900">
            <div>
              <span className="font-semibold text-brand-700">Massa: </span>
              <span className="font-normal text-brand-800">{bolo.massa}</span>
            </div>
            <div>
              <span className="font-semibold text-brand-700">Recheio: </span>
              <span className="font-normal text-brand-800">{bolo.recheio}</span>
            </div>
            <div>
              <span className="font-semibold text-brand-700">Cobertura: </span>
              <span className="font-normal text-brand-800">{bolo.cobertura}</span>
            </div>
          </div>
        </div>

        {/* Ratings Section (Owner Reviews Only) */}
        <div className="flex-1 flex flex-col justify-end pt-1">
          {isEvaluated ? (
            <div className="rounded-2xl border border-rose-pastel-100 bg-rose-pastel-50 p-4 space-y-2 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-5">
                <MessageSquare className="h-16 w-16 text-rose-pastel-500" />
              </div>
              
              {/* Stars & Author header */}
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (bolo.estrelas || 0)
                          ? "fill-rose-pastel-500 text-rose-pastel-500 [filter:drop-shadow(0_0_2px_rgba(255,110,133,0.3))]"
                          : "text-brand-200 fill-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-pastel-500 uppercase tracking-widest bg-pink-100/80 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-pastel-500 animate-pulse"></span>
                  Chef Critique
                </div>
              </div>

              {/* Owner's Custom Written Review */}
              <p className="text-xs text-brand-900 italic font-medium leading-relaxed bg-white/60 p-2.5 rounded-xl border border-brand-100/40">
                "{bolo.comentario_dono}"
              </p>

              {/* Date of Rating */}
              {bolo.avaliado_em && (
                <div className="flex items-center gap-1 text-[10px] text-brand-400">
                  <Calendar className="h-3 w-3 text-brand-300" />
                  <span>Avaliado em {formatRatingDate(bolo.avaliado_em)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-center">
              <span className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">
                Aguardando Avaliação
              </span>
              <p className="text-xs text-brand-550">
                A Chef ainda não publicou uma avaliação sensorial técnica para este bolo.
              </p>
              {isAdmin && (
                <button
                  onClick={() => onRate(bolo)}
                  className="mt-2 text-xs font-bold text-rose-pastel-500 hover:text-rose-pastel-600 underline flex items-center justify-center gap-1 w-full cursor-pointer"
                >
                  <Star className="h-3.5 w-3.5 fill-rose-pastel-500 text-rose-pastel-500" />
                  Avaliar agora mesmo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Administrator Actions Rail */}
        {isAdmin && (
          <div className="flex items-center justify-between border-t border-brand-100 pt-3.5 mt-2 bg-brand-50/60 -mx-6 -mb-6 px-6 py-3 rounded-b-[2rem]">
            <span className="text-[10px] font-bold text-brand-900 uppercase tracking-widest flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-brand-600" />
              Painel Chef
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onRate(bolo)}
                title="Avaliar Sabor"
                className="p-1.5 rounded-lg bg-white hover:bg-brand-100 text-rose-pastel-600 transition-colors border border-brand-100 cursor-pointer"
              >
                <Star className="h-4 w-4 fill-rose-pastel-500 text-rose-pastel-500" />
              </button>
              <button
                onClick={() => onEdit(bolo)}
                title="Editar Bolo"
                className="p-1.5 rounded-lg bg-white hover:bg-brand-100 text-brand-700 transition-colors border border-brand-100 cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                title="Excluir do Catálogo"
                className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-red-605 transition-colors border border-brand-100 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

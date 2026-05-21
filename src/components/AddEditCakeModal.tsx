import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Edit2, Image, Sparkles } from "lucide-react";
import { Bolo } from "../types";

interface AddEditCakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  boloToEdit: Bolo | null; // Null if adding a new one
  onSave: (bolo: Bolo) => Promise<boolean>;
  isSaving: boolean;
}

const CATEGORIES = ["Artesanal", "Gourmet", "Festas", "Tradicional", "Bolo Caseiro", "Especial Fit"];

const IMAGE_PRESETS = [
  { name: "Cenoura & Chocolate", url: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?q=80&w=600" },
  { name: "Morango Clássico", url: "https://images.unsplash.com/photo-1535141192574-5d4897c13636?q=80&w=600" },
  { name: "Chocolate Dourado", url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600" },
  { name: "Limão & Merengue", url: "https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=600" },
  { name: "Vermelho Veludo", url: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=600" },
  { name: "Maracujá & Chantilly", url: "https://images.unsplash.com/photo-1508737027454-e6454ef45afd?q=80&w=600" }
];

export default function AddEditCakeModal({ isOpen, onClose, boloToEdit, onSave, isSaving }: AddEditCakeModalProps) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Artesanal");
  const [massa, setMassa] = useState("");
  const [recheio, setRecheio] = useState("");
  const [cobertura, setCobertura] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoEstimado, setPrecoEstimado] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (boloToEdit) {
      setNome(boloToEdit.nome);
      setCategoria(boloToEdit.categoria);
      setMassa(boloToEdit.massa);
      setRecheio(boloToEdit.recheio);
      setCobertura(boloToEdit.cobertura);
      setDescricao(boloToEdit.descricao);
      setPrecoEstimado(boloToEdit.preco_estimado || "");
      setImageUrl(boloToEdit.imagem_url);
    } else {
      // Clear for new cake
      setNome("");
      setCategoria("Artesanal");
      setMassa("");
      setRecheio("");
      setCobertura("");
      setDescricao("");
      setPrecoEstimado("");
      setImageUrl(IMAGE_PRESETS[0].url); // Default to carrot cake image
    }
    setFormError(null);
  }, [boloToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nome.trim() || !massa.trim() || !recheio.trim() || !descricao.trim()) {
      setFormError("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const cakeId = boloToEdit ? boloToEdit.id : `custom-${Date.now()}`;
    const cakePayload: Bolo = {
      id: cakeId,
      nome: nome.trim(),
      categoria,
      massa: massa.trim(),
      recheio: recheio.trim(),
      cobertura: cobertura.trim() || "Sem Cobertura",
      descricao: descricao.trim(),
      preco_estimado: precoEstimado.trim() || undefined,
      imagem_url: imageUrl.trim() || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600",
      estrelas: boloToEdit?.estrelas || null, // Preserve previous stars if editing
      comentario_dono: boloToEdit?.comentario_dono || null,
      avaliado_em: boloToEdit?.avaliado_em || null,
      is_custom: true
    };

    const success = await onSave(cakePayload);
    if (success) {
      onClose();
    } else {
      setFormError("Erro ao gravar dados no banco. Verifique suas políticas do Supabase.");
    }
  };

  const randomizeImage = () => {
    // Pick random curated baking unsplash photo keyword
    const randId = Math.floor(Math.random() * 1000);
    setImageUrl(`https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop&sig=${randId}`);
  };

  return (
    <AnimatePresence>
      <div 
        id="add-edit-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          id="add-edit-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[#fdfbf9] shadow-2xl border border-brand-200 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-brand-700 to-brand-800 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              {boloToEdit ? <Edit2 className="h-5 w-5 text-brand-300" /> : <Plus className="h-5 w-5 text-brand-300" />}
              <h3 className="font-serif text-lg font-bold">
                {boloToEdit ? "Editar Dados do Bolo" : "Cadastrar Novo Bolo no Catálogo"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Modal fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-800">
                  Nome do Bolo *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Bolo Supremo de Cenoura com Granulado"
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-800">
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Massa */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-800">
                  Tipo de Massa *
                </label>
                <input
                  type="text"
                  value={massa}
                  onChange={(e) => setMassa(e.target.value)}
                  placeholder="Ex: Pão de Ló de Baunilha"
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              {/* Recheios */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-800">
                  Recheios / Camadas *
                </label>
                <input
                  type="text"
                  value={recheio}
                  onChange={(e) => setRecheio(e.target.value)}
                  placeholder="Ex: Ganache de Coco Fresco e Nozes"
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              {/* Cobertura */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-800">
                  Cobertura
                </label>
                <input
                  type="text"
                  value={cobertura}
                  onChange={(e) => setCobertura(e.target.value)}
                  placeholder="Ex: Calda de Chocolate e Raspas"
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preço Estimado */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-800">
                  Faixa de Preço (Opcional)
                </label>
                <input
                  type="text"
                  value={precoEstimado}
                  onChange={(e) => setPrecoEstimado(e.target.value)}
                  placeholder="Ex: R$ 75,00/kg ou R$ 45,00/bolo"
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Imagem URL */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-800 flex justify-between items-center">
                  <span>URL da Imagem *</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:outline-none truncate"
                    required
                  />
                  <button
                    type="button"
                    onClick={randomizeImage}
                    title="Foto aleatória de bolo"
                    className="rounded-xl px-2.5 py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-brand-600 animate-pulse" />
                    Bolo Aleatório
                  </button>
                </div>
              </div>
            </div>

            {/* Imagem Presets selector list */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-brand-700 flex items-center gap-1">
                <Image className="h-3.5 w-3.5" />
                Ou selecione uma foto de bolo do nosso acervo:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {IMAGE_PRESETS.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 text-left cursor-pointer transition-all hover:scale-[1.03] ${
                        isSelected ? "border-brand-600 ring-2 ring-brand-300" : "border-transparent"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-white font-medium truncate">
                        {preset.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-800">
                Descrição Detalhada do Bolo *
              </label>
              <textarea
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Conte-nos o conceito deste bolo, de onde veio a inspiração, as texturas, aroma, e o diferencial de sabor..."
                className="w-full rounded-xl border border-brand-200 bg-white p-3 text-sm text-brand-900 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            {/* Button Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-200/50">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-700 bg-brand-100 hover:bg-brand-200 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Gravando..." : boloToEdit ? "Salvar Alterações" : "Cadastrar Bolo"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

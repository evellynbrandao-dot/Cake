import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Loader2, 
  Plus, 
  ShieldCheck, 
  Shield, 
  LogOut, 
  LogIn, 
  HelpCircle, 
  Database,
  Coffee,
  Heart,
  Sparkles,
  UtensilsCrossed,
  Cake
} from "lucide-react";
import { Bolo } from "./types";
import { databaseService } from "./lib/databaseService";
import CakeCard from "./components/CakeCard";
import RatingModal from "./components/RatingModal";
import AddEditCakeModal from "./components/AddEditCakeModal";
import SupabaseHelp from "./components/SupabaseHelp";

// Session storage key to keep admin logged in during preview sessions
const ADMIN_SESSION_KEY = "admin_chef_auth";
const DEFAULT_PASSCODE = "bolo123";

export default function App() {
  const [bolos, setBolos] = useState<Bolo[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingError, setIsLoadingError] = useState<string | null>(null);

  // Connection diagnostics
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Administrative State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEnteringPasscode, setIsEnteringPasscode] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState("Todos"); // "Todos", "Apenas Avaliados", "Não Avaliados", "Exclusivos (5★)"

  // Modals Controller
  const [activeBoloForRating, setActiveBoloForRating] = useState<Bolo | null>(null);
  const [activeBoloForEdit, setActiveBoloForEdit] = useState<Bolo | null>(null);
  const [isAddCakeOpen, setIsAddCakeOpen] = useState(false);
  
  // Submitting States
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isSavingCake, setIsSavingCake] = useState(false);

  // Support bottom settings accordion toggle
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Load initial dataset on mount
  const loadCatalog = async () => {
    setIsInitialLoading(true);
    setIsLoadingError(null);
    try {
      const response = await databaseService.fetchBolos();
      setBolos(response.data);
      setIsSupabaseConnected(response.isSupabase);
      setSupabaseError(response.error);
    } catch (err: any) {
      console.error(err);
      setIsLoadingError("Ocorreu um erro ao inicializar o catálogo de bolos.");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    // Rehydrate admin authorization state
    const authSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (authSession === "true") {
      setIsAdmin(true);
    }
  }, []);

  // Category choices gathered dynamically plus "Todos"
  const categoriesList = useMemo(() => {
    const categories = new Set(bolos.map(b => b.categoria));
    return ["Todos", ...Array.from(categories)];
  }, [bolos]);

  // Real-time catalog analytics
  const analytics = useMemo(() => {
    const total = bolos.length;
    const evaluatedList = bolos.filter(b => b.estrelas !== null && b.estrelas !== undefined);
    const evaluatedCount = evaluatedList.length;
    
    // Calculate average rating
    const sum = evaluatedList.reduce((acc, current) => acc + (current.estrelas || 0), 0);
    const avg = evaluatedCount > 0 ? (sum / evaluatedCount).toFixed(1) : "0.0";

    return {
      total,
      evaluatedCount,
      avgStars: avg
    };
  }, [bolos]);

  // Handler: Lock & Unlock Admin Mode
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    if (passcodeInput === DEFAULT_PASSCODE) {
      setIsAdmin(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setIsEnteringPasscode(false);
      setPasscodeInput("");
    } else {
      setPasscodeError("Senha incorreta. Experimente 'bolo123'.");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  };

  // Handler: Save custom ratings
  const handleRatingSubmit = async (cakeId: string, stars: number, comment: string) => {
    setIsSubmittingRating(true);
    try {
      const res = await databaseService.submitRating(cakeId, stars, comment);
      if (res.success) {
        await loadCatalog(); // Refetch updated ratings from Supabase / localStorage
      } else {
        alert(`Não foi possível salvar a classificação no Supabase: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Falha ao se comunicar com o banco de dados: ${err.message || err}`);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Handler: Save / Update cakes in catalog
  const handleCakeSave = async (bolo: Bolo) => {
    setIsSavingCake(true);
    try {
      const res = await databaseService.saveBolo(bolo);
      if (res.success) {
        await loadCatalog();
        return true;
      } else {
        console.error(res.error);
        return false;
      }
    } catch (err: any) {
      console.error(err);
      return false;
    } finally {
      setIsSavingCake(false);
    }
  };

  // Handler: Delete cake
  const handleCakeDelete = async (id: string) => {
    try {
      const res = await databaseService.deleteBolo(id);
      if (res.success) {
        await loadCatalog();
      } else {
        alert(`Erro de banco: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message || err}`);
    }
  };

  // Core filter logic matching current selections
  const filteredBolos = useMemo(() => {
    return bolos.filter((bolo) => {
      // 1. Keyword search (checks Title, Massa, Recheio, Cobertura, Descricao)
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = 
        !term || 
        bolo.nome.toLowerCase().includes(term) ||
        bolo.massa.toLowerCase().includes(term) ||
        bolo.recheio.toLowerCase().includes(term) ||
        bolo.cobertura.toLowerCase().includes(term) ||
        bolo.descricao.toLowerCase().includes(term);

      // 2. Category selection
      const matchCategory = selectedCategory === "Todos" || bolo.categoria === selectedCategory;

      // 3. User Rating Selection
      let matchRating = true;
      if (selectedRatingFilter === "Apenas Avaliados") {
        matchRating = bolo.estrelas !== null;
      } else if (selectedRatingFilter === "Não Avaliados") {
        matchRating = bolo.estrelas === null;
      } else if (selectedRatingFilter === "Exclusivos (5★)") {
        matchRating = bolo.estrelas === 5;
      }

      return matchSearch && matchCategory && matchRating;
    });
  }, [bolos, searchTerm, selectedCategory, selectedRatingFilter]);
  const featuredBolo = useMemo(() => {
    if (bolos.length === 0) return null;
    // Prefer rated cakes, highest stars, or the newest custom cakes
    const sorted = [...bolos].sort((a, b) => {
      const scoreA = a.estrelas !== null ? a.estrelas : 0;
      const scoreB = b.estrelas !== null ? b.estrelas : 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.is_custom ? -1 : 1;
    });
    return sorted[0];
  }, [bolos]);

  // Compute 3 most recently rated cakes for the "Recent Logs" list
  const recentRatedBolos = useMemo(() => {
    return bolos
      .filter(b => b.estrelas !== null && b.estrelas !== undefined)
      .slice(0, 3);
  }, [bolos]);

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-brand-900 flex flex-col selection:bg-brand-200">
      
      {/* 1. TOP SUPABASE CONNECTION STATUS BAR */}
      <div className="bg-brand-900 text-white text-[11px] font-medium tracking-wide py-2 px-6 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-2">
          {isSupabaseConnected ? (
            <span className="inline-block h-2 bg-green-500 rounded-full w-2 animate-pulse"></span>
          ) : (
            <span className="inline-block h-2 bg-amber-400 rounded-full w-2"></span>
          )}
          <span>
            {isSupabaseConnected 
              ? "Supabase Status: Conectado ao Cloud Database" 
              : "Supabase Status: Armazenamento Local Temporário"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline opacity-60">Ready for deployment to Vercel</span>
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-bold underline"
          >
            <Database className="h-3 w-3 inline" />
            Configurações
          </button>
        </div>
      </div>

      {/* 2. BENTO WRAPPER CONTAINER */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 flex-1">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-pastel-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-100/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-900 font-sans">
              CakeCritique<span className="text-rose-pastel-500 italic">.admin</span>
            </h1>
          </div>
          
          <div className="flex-1 max-w-md mx-4 md:mx-12 w-full">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar bolo no acervo (ex: Red Velvet, Chocolate...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-brand-100 rounded-full py-2 pl-10 pr-16 focus:outline-none focus:border-rose-pastel-500 hover:border-brand-200 text-sm transition-all"
              />
              <Search className="absolute left-3.5 top-3 text-brand-300 h-4 w-4" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-2 text-xs font-bold text-rose-pastel-500 hover:text-rose-pastel-600 bg-rose-pastel-50 rounded-full px-2 py-0.5"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Admin auth switcher on the header right side */}
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-brand-100 shadow-xs">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-brand-400 uppercase tracking-widest">Avaliador Oficial</span>
              <span className="text-xs font-semibold flex items-center gap-1.5 text-brand-800">
                <span className={`w-2 h-2 rounded-full ${isAdmin ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`}></span> 
                {isAdmin ? "Chef Autenticado" : "Modo Visitante"}
              </span>
            </div>
            
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddCakeOpen(true)}
                  className="rounded-xl bg-rose-pastel-500 hover:bg-rose-pastel-600 text-white font-bold px-3 py-1.5 text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Novo
                </button>
                <button
                  onClick={handleLogout}
                  title="Sair do modo administrador"
                  className="p-1.5 text-brand-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEnteringPasscode(true)}
                className="bg-brand-800 hover:bg-brand-900 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Entrar
              </button>
            )}
          </div>
        </header>

        {/* MAIN BENTO GRID DASHBOARD */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* A. FEATURED SELECTION (Large col-span-8) */}
          <section className="col-span-1 lg:col-span-8 bg-white rounded-[2rem] p-6 sm:p-8 shadow-xs border border-brand-100 flex flex-col sm:flex-row gap-6 sm:gap-8 relative overflow-hidden">
            {featuredBolo ? (
              <>
                <div className="flex-1 flex flex-col justify-between z-10 space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-rose-pastel-100 text-rose-pastel-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Recomendado do Chef
                      </span>
                      <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-brand-100">
                        {featuredBolo.categoria}
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-950 font-serif leading-tight mb-3">
                      {featuredBolo.nome}
                    </h2>
                    <p className="text-brand-850/80 text-sm sm:text-base leading-relaxed max-w-md font-light">
                      {featuredBolo.descricao}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs border-t border-brand-100/60 pt-3 text-brand-800 max-w-sm">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-brand-400">Massa</span>
                        <span className="font-semibold truncate block">{featuredBolo.massa}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-brand-400">Recheio</span>
                        <span className="font-semibold truncate block">{featuredBolo.recheio}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-brand-400">Estilo</span>
                        <span className="font-semibold truncate block">{featuredBolo.is_custom ? "Temático" : "Clássico"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-end gap-4 pt-2">
                    <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
                      <span className="block text-[10px] font-bold text-brand-400 uppercase mb-0.5">Nota Sensorial</span>
                      <span className="text-3xl font-black text-brand-950">
                        {featuredBolo.estrelas !== null ? (featuredBolo.estrelas * 2).toFixed(1) : "—"}
                        <span className="text-lg font-medium text-brand-350">/10</span>
                      </span>
                    </div>
                    
                    {isAdmin ? (
                      <button 
                        onClick={() => setActiveBoloForEdit(featuredBolo)}
                        className="bg-rose-pastel-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:bg-rose-pastel-600 transition-all cursor-pointer text-xs"
                      >
                        Editar Informações
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveBoloForRating(featuredBolo)}
                        className="bg-brand-900 hover:bg-brand-950 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all cursor-pointer text-xs"
                      >
                        Registrar Sabor
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="w-full sm:w-64 h-56 sm:h-auto bg-rose-pastel-50 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden shadow-inner shrink-0 border border-brand-100/30">
                   <div className="absolute inset-0 bg-gradient-to-br from-rose-pastel-100/60 to-brand-100/20"></div>
                   <div className="w-36 h-36 bg-white rounded-full shadow-md relative z-10 flex items-center justify-center p-1 border border-brand-100/20 overflow-hidden">
                      <img 
                        src={featuredBolo.imagem_url} 
                        alt={featuredBolo.nome}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                   <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-pastel-100/50 rounded-full blur-2xl"></div>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col justify-center items-center py-12 text-center space-y-4">
                <span className="text-5xl">🍰</span>
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-brand-950">Catálogo Inicial Vazio</h3>
                  <p className="text-xs text-brand-600 leading-relaxed mt-1">
                    Cadastre o primeiro bolo artístico usando o painel do administrador para ver o destaque do acervo.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAdmin(true);
                    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
                    setIsAddCakeOpen(true);
                  }}
                  className="rounded-xl px-4 py-2 bg-rose-pastel-500 hover:bg-rose-pastel-600 text-white text-xs font-semibold shadow-xs"
                >
                  Liberar Administrador e Criar Bolo
                </button>
              </div>
            )}
          </section>

          {/* B. CATALOG STATS (col-span-4) */}
          <section className="col-span-1 lg:col-span-4 bg-brand-800 rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xs border border-brand-900 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-brand-700/20 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight">Catalog Stats</h3>
                <p className="text-[10px] text-brand-200/85 uppercase tracking-wider font-semibold">Avaliações e Cobertura</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 text-rose-pastel-500"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 pt-6">
              <div className="bg-brand-900/40 p-3.5 rounded-2xl border border-white/5">
                <span className="text-3xl font-black block text-rose-pastel-500">{analytics.total}</span>
                <span className="block text-[9px] uppercase font-bold text-brand-200 tracking-wider">Cakes</span>
              </div>
              
              <div className="bg-brand-900/40 p-3.5 rounded-2xl border border-white/5">
                <span className="text-3xl font-black block text-amber-300">{analytics.evaluatedCount}</span>
                <span className="block text-[9px] uppercase font-bold text-brand-200 tracking-wider">Rated</span>
              </div>

              <div className="bg-brand-900/40 p-3.5 rounded-2xl border border-white/5">
                <span className="text-3xl font-black block text-white">{analytics.avgStars}</span>
                <span className="block text-[9px] uppercase font-bold text-brand-200 tracking-wider">Average</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-brand-200/80 leading-relaxed font-light">
              Média geral estimada de notas atribuídas pela confeiteira em auditorias de sabor.
            </div>
          </section>

          {/* C. RECENT MANUAL LOGS LIST (col-span-4) */}
          <section className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-xs border border-brand-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-brand-950 uppercase text-[11px] tracking-widest text-[#a63412]">
                    Recent Manual Logs
                  </h3>
                  <p className="text-[10px] text-brand-400">Classificações publicadas</p>
                </div>
                <span className="text-[10px] font-bold text-rose-pastel-500 bg-pink-50 px-2 py-0.5 rounded-full">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3">
                {recentRatedBolos.length > 0 ? (
                  recentRatedBolos.map((rb) => (
                    <div 
                      key={rb.id} 
                      className="flex items-center gap-3 p-2.5 bg-brand-50/50 hover:bg-brand-50/90 rounded-xl border border-brand-100/40 transition-colors cursor-pointer"
                      onClick={() => setActiveBoloForRating(rb)}
                    >
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-xs border border-brand-100 overflow-hidden shrink-0">
                        <img 
                          src={rb.imagem_url} 
                          alt={rb.nome} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-brand-900 truncate">{rb.nome}</div>
                        <div className="text-[9px] text-brand-400 font-bold uppercase tracking-wide">
                          {rb.categoria}
                        </div>
                      </div>
                      <div className="font-black text-brand-950 text-sm bg-white border border-brand-100 h-8 w-8 rounded-lg flex items-center justify-center">
                        {rb.estrelas ? (rb.estrelas * 2).toFixed(1) : ""}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-brand-400 italic">
                    Nenhuma nota sensorial cadastrada recentemente.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-brand-100/80 text-[10px] text-brand-500 font-medium">
              Chave de teste padrão: <span className="font-bold font-mono bg-amber-100 px-1 rounded">bolo123</span>
            </div>
          </section>

          {/* D. CATEGORIES CAROUSEL SELECTION (col-span-8) */}
          <section className="col-span-1 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Dynamic visual category cell 1 */}
            <div 
              onClick={() => setSelectedCategory("Todos")}
              className={`rounded-[2rem] p-6 flex flex-col justify-between border-2 cursor-pointer transition-all ${
                selectedCategory === "Todos" 
                  ? "bg-rose-pastel-500 border-white text-white shadow-md transform -translate-y-1" 
                  : "bg-[#FFE4D6] border-white text-brand-900 hover:bg-[#ffdad2] shadow-xs"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-4xl font-extrabold ${selectedCategory === "Todos" ? "text-white/45" : "text-brand-800/25"} font-mono`}>01</span>
                <span className="text-xl">🧑‍🍳</span>
              </div>
              <div className="space-y-1 pt-6 text-left">
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">Visualizar</span>
                <h4 className="text-lg font-black leading-tight">Todos os <br />Sabores</h4>
              </div>
            </div>

            {/* Dynamic visual category cell 2 */}
            <div 
              onClick={() => {
                // Selects or defaults to the first category != 'Todos', or a traditional selection
                const cat = categoriesList[1] || "Tradicional";
                setSelectedCategory(cat);
              }}
              className={`rounded-[2rem] p-6 flex flex-col justify-between border-2 cursor-pointer transition-all ${
                selectedCategory !== "Todos" && selectedCategory === categoriesList[1]
                  ? "bg-rose-pastel-500 border-white text-white shadow-md transform -translate-y-1" 
                  : "bg-[#D9EBD7] border-white text-brand-900 hover:bg-[#cee4cb] shadow-xs"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-4xl font-extrabold ${selectedCategory !== "Todos" && selectedCategory === categoriesList[1] ? "text-white/45" : "text-emerald-800/25"} font-mono`}>02</span>
                <span className="text-xl">🍋</span>
              </div>
              <div className="space-y-1 pt-6 text-left">
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">Visualizar</span>
                <h4 className="text-lg font-black leading-tight truncate">
                  {categoriesList[1] || "Frutas Fina"} <br />Infusions
                </h4>
              </div>
            </div>

            {/* Dynamic visual category cell 3 */}
            <div 
              onClick={() => {
                const cat = categoriesList[2] || "Casamento";
                setSelectedCategory(cat);
              }}
              className={`rounded-[2rem] p-6 flex flex-col justify-between border-2 cursor-pointer transition-all ${
                selectedCategory !== "Todos" && selectedCategory === categoriesList[2]
                  ? "bg-rose-pastel-500 border-white text-white shadow-md transform -translate-y-1" 
                  : "bg-[#F5E1FF] border-white text-brand-900 hover:bg-[#eed2ff] shadow-xs"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-4xl font-extrabold ${selectedCategory !== "Todos" && selectedCategory === categoriesList[2] ? "text-white/45" : "text-purple-850/25"} font-mono`}>03</span>
                <span className="text-xl">💍</span>
              </div>
              <div className="space-y-1 pt-6 text-left">
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">Visualizar</span>
                <h4 className="text-lg font-black leading-tight truncate">
                  {categoriesList[2] || "Casamentos"} <br />Coleção
                </h4>
              </div>
            </div>

          </section>

        </main>

        {/* 3. SEARCH CONTROLS & FILTERING ROW */}
        <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-brand-100 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-brand-900 tracking-tight">Catálogo de Obras Confeitadas</h3>
              <p className="text-xs text-brand-500 leading-none">Use os seletores e pesquisas rápidas para navegar por massas e recheios</p>
            </div>
            
            {/* Quick rating filter select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider whitespace-nowrap">Avaliação:</span>
              <select
                value={selectedRatingFilter}
                onChange={(e) => setSelectedRatingFilter(e.target.value)}
                className="w-full md:w-48 bg-[#FFF9F5] border border-brand-100 text-brand-900 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-rose-pastel-500 shadow-xs"
              >
                <option value="Todos">Mostrar Todos</option>
                <option value="Apenas Avaliados">Filtrar por Avaliados pela Chef</option>
                <option value="Não Avaliados">Pendentes de Nota</option>
                <option value="Exclusivos (5★)">Dez de Dez (Dez Sabor) max-rating </option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-brand-50/80">
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer transition-all ${
                    isActive 
                      ? "bg-rose-pastel-500 text-white shadow-xs" 
                      : "bg-[#FFF9F5] hover:bg-brand-100 text-brand-850 border border-brand-100"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. MAIN CAKES CATALOG LIST */}
        <section className="space-y-6">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-brand-100 shadow-xs">
              <Loader2 className="h-8 w-8 text-rose-pastel-500 animate-spin" />
              <p className="text-xs mt-3 text-brand-500 font-bold">Resgatando catálogo e dados...</p>
            </div>
          ) : filteredBolos.length > 0 ? (
            <div 
              id="cakes-grid" 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredBolos.map((bolo) => (
                <CakeCard
                  key={bolo.id}
                  bolo={bolo}
                  isAdmin={isAdmin}
                  onEdit={setActiveBoloForEdit}
                  onRate={setActiveBoloForRating}
                  onDelete={handleCakeDelete}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-brand-200 bg-white p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
              <span className="text-4xl text-rose-pastel-500 block">🎂</span>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-brand-950">Nenhum bolo encontrado</h3>
                <p className="text-xs text-brand-600 max-w-sm mx-auto leading-relaxed">
                  Não encontramos bolos com este filtro atual ("{selectedCategory}"). Remova os termos de pesquisa ou redefina os filtros abaixo de forma intuitiva.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Todos");
                  setSelectedRatingFilter("Todos");
                }}
                className="rounded-full px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}
        </section>

      </div>

      {/* 5. DOCKABLE CONFIG PANEL ACCORDION (Supabase sync instructions) */}
      <footer className="bg-brand-100/50 border-t border-brand-200/80 py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-brand-900 flex items-center gap-1.5">
                <Sparkles className="text-brand-500 h-5 w-5 animate-spin" />
                Dona do Pedaço • Confeitaria Fina
              </h2>
              <p className="text-xs text-brand-600">
                Uso corporativo restrito para avaliação sensorial e controle de faturamento de portfólio.
              </p>
            </div>
            
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="rounded-xl bg-white border border-brand-300 hover:bg-brand-50 text-brand-800 px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Database className="h-4 w-4 text-brand-500" />
              {showConfigPanel ? "Ocultar Painel de Integração" : "Mostrar Configurações do Supabase"}
            </button>
          </div>

          {showConfigPanel && (
            <div className="animate-in fade-in duration-200">
              <SupabaseHelp
                onRefresh={loadCatalog}
                isSupabaseConnected={isSupabaseConnected}
                connectionError={supabaseError}
              />
            </div>
          )}

          <div className="border-t border-brand-200/60 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-brand-500 gap-2">
            <p>© 2026 Avaliação de Bolos da Chef. Direitos Reservados aos Confeiteiros parceiros.</p>
            <p>
              Desenvolvimento inteligente pronto para upload para o <strong>GitHub</strong> e deploy grátis no <strong>Vercel</strong>.
            </p>
          </div>

        </div>
      </footer>

      {/* ========================================================
          6. MODALS OVERLAYS & SECURE FLOATING MENUS
         ======================================================== */}

      {/* A. ENTERING PASSCODE PROMPT */}
      {isEnteringPasscode && (
        <div 
          id="passcode-overlay" 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => {
            setIsEnteringPasscode(false);
            setPasscodeError(null);
            setPasscodeInput("");
          }}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-brand-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1.5">
              <span className="text-xl">🧑‍🍳</span>
              <h3 className="font-serif text-lg font-bold text-brand-900">Autenticar Chef Proprietária</h3>
              <p className="text-xs text-brand-650">
                Insira sua chave de acesso pessoal para liberar o formulário manual de notas, estrelas e edição do catálogo.
              </p>
              <p className="text-[10px] text-brand-500 italic bg-brand-50 py-1.5 px-3 rounded-lg border border-brand-200/50">
                Chave de teste padrão: <strong className="font-mono text-brand-800">{DEFAULT_PASSCODE}</strong>
              </p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-widest">Senha de Acesso</label>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-3.5 py-2.5 text-sm text-center text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  autoFocus
                  required
                />
                {passcodeError && (
                  <p className="text-[11px] text-red-600 font-medium text-center">{passcodeError}</p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnteringPasscode(false);
                    setPasscodeError(null);
                    setPasscodeInput("");
                  }}
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-brand-700 bg-brand-100 hover:bg-brand-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. MANUAL RATING MODAL (Chef Reviews) */}
      <RatingModal
        isOpen={activeBoloForRating !== null}
        onClose={() => setActiveBoloForRating(null)}
        bolo={activeBoloForRating}
        onSubmit={handleRatingSubmit}
        isSubmitting={isSubmittingRating}
      />

      {/* C. ADD / EDIT CAKE MODAL */}
      <AddEditCakeModal
        isOpen={isAddCakeOpen || activeBoloForEdit !== null}
        onClose={() => {
          setIsAddCakeOpen(false);
          setActiveBoloForEdit(null);
        }}
        boloToEdit={activeBoloForEdit}
        onSave={handleCakeSave}
        isSaving={isSavingCake}
      />

    </div>
  );
}

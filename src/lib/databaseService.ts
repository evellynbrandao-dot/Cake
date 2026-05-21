import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Bolo } from "../types";
import { DEFAULT_CAKES } from "../data/defaultCakes";

// Key names for localStorage
const LOCAL_STORAGE_KEY = "bolos_catalog_data";
const SUPABASE_URL_KEY = "custom_supabase_url";
const SUPABASE_KEY_KEY = "custom_supabase_anon_key";

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
  source: "env" | "local" | "none";
}

// SQL Script to run in Supabase SQL Editor
export const SUPABASE_SQL_SETUP = `-- 1. CRILAR TABELA DE BOLOS
create table if not exists bolos (
  id text primary key,
  nome text not null,
  massa text not null,
  recheio text not null,
  cobertura text not null,
  descricao text not null,
  imagem_url text not null,
  estrelas integer check (estrelas >= 1 and estrelas <= 5),
  comentario_dono text,
  avaliado_em text,
  preco_estimado text,
  categoria text not null,
  is_custom boolean default false,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
alter table bolos enable row level security;

-- 3. CRIAR POLÍTICAS DE ACESSO (Permitir leitura pública e escrita para todos)
create policy "Permitir leitura para todos" on bolos
  for select using (true);

create policy "Permitir inserção e atualização" on bolos
  for all using (true) with check (true);
`;

// Retrieve Supabase Credentials from Environment or LocalStorage
export function getSupabaseCredentials(): SupabaseCredentials {
  // Check LocalStorage first (for user overrides)
  const localUrl = localStorage.getItem(SUPABASE_URL_KEY);
  const localKey = localStorage.getItem(SUPABASE_KEY_KEY);
  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey, source: "local" };
  }

  // Then check env variables through import.meta.env
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envUrl !== "MY_SUPABASE_URL" && envKey && envKey !== "MY_SUPABASE_ANON_KEY") {
    return { url: envUrl, anonKey: envKey, source: "env" };
  }

  return { url: "", anonKey: "", source: "none" };
}

// Initialize Supabase Client
let cachedClient: SupabaseClient | null = null;
let lastUsedCreds: string = "";

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (creds.source === "none") {
    return null;
  }

  const credsKey = `${creds.url}_${creds.anonKey}`;
  if (cachedClient && lastUsedCreds === credsKey) {
    return cachedClient;
  }

  try {
    // Validate URLs to prevent supabase-js constructor crashes
    if (!creds.url.startsWith("http://") && !creds.url.startsWith("https://")) {
      return null;
    }
    cachedClient = createClient(creds.url, creds.anonKey, {
      auth: {
        persistSession: false
      }
    });
    lastUsedCreds = credsKey;
    return cachedClient;
  } catch (error) {
    console.error("Erro ao inicializar cliente do Supabase:", error);
    return null;
  }
}

// Set custom credentials in localStorage for previewing
export function saveCustomSupabaseCredentials(url: string, key: string) {
  if (!url || !key) {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
  } else {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
  }
  // Clear cache
  cachedClient = null;
  lastUsedCreds = "";
}

// Initialize local data helper
function getLocalBolos(): Bolo[] {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // fallback
    }
  }
  // If no local storage data, set DEFAULT_CAKES
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CAKES));
  return DEFAULT_CAKES;
}

function saveLocalBolos(bolos: Bolo[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bolos));
}

// Core Database Service Interface
export const databaseService = {
  // Fetch all cakes
  async fetchBolos(): Promise<{ data: Bolo[]; error: string | null; isSupabase: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Fallback to local storage
      return { data: getLocalBolos(), error: null, isSupabase: false };
    }

    try {
      const { data, error } = await supabase
        .from("bolos")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) {
        console.warn("Erro ao ler do Supabase, usando localStorage:", error.message);
        return { data: getLocalBolos(), error: `Supabase: ${error.message} (Mostrando dados locais)`, isSupabase: false };
      }

      // If Supabase table is empty, auto-seed with DEFAULT_CAKES for optimal user experience!
      if (!data || data.length === 0) {
        console.log("Banco de dados Supabase vazio. Semeando dados padrão...");
        for (const item of DEFAULT_CAKES) {
          const { error: insertError } = await supabase.from("bolos").insert({
            id: item.id,
            nome: item.nome,
            massa: item.massa,
            recheio: item.recheio,
            cobertura: item.cobertura,
            descricao: item.descricao,
            imagem_url: item.imagem_url,
            estrelas: item.estrelas,
            comentario_dono: item.comentario_dono,
            avaliado_em: item.avaliado_em,
            preco_estimado: item.preco_estimado || "",
            categoria: item.categoria,
            is_custom: item.is_custom || false
          });
          if (insertError) {
            console.error("Erro ao semear bolo:", insertError.message);
          }
        }
        // Refetch after seeding
        const { data: refetchedData } = await supabase.from("bolos").select("*");
        return { data: refetchedData || DEFAULT_CAKES, error: null, isSupabase: true };
      }

      // Convert supabase query results into Bolo type format safely
      const formattedData: Bolo[] = data.map((b: any) => ({
        id: b.id,
        nome: b.nome,
        massa: b.massa,
        recheio: b.recheio,
        cobertura: b.cobertura,
        descricao: b.descricao,
        imagem_url: b.imagem_url,
        estrelas: b.estrelas,
        comentario_dono: b.comentario_dono,
        avaliado_em: b.avaliado_em,
        preco_estimado: b.preco_estimado,
        categoria: b.categoria,
        is_custom: b.is_custom
      }));

      return { data: formattedData, error: null, isSupabase: true };
    } catch (err: any) {
      console.error("Erro de rede com o Supabase:", err);
      return { data: getLocalBolos(), error: `Erro de Conexão: ${err.message || err}. Usando dados locais.`, isSupabase: false };
    }
  },

  // Save or update a cake
  async saveBolo(bolo: Bolo): Promise<{ success: boolean; error: string | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const local = getLocalBolos();
      const existingIndex = local.findIndex((b) => b.id === bolo.id);
      if (existingIndex >= 0) {
        local[existingIndex] = bolo;
      } else {
        local.unshift(bolo);
      }
      saveLocalBolos(local);
      return { success: true, error: null };
    }

    try {
      const payload = {
        id: bolo.id,
        nome: bolo.nome,
        massa: bolo.massa,
        recheio: bolo.recheio,
        cobertura: bolo.cobertura,
        descricao: bolo.descricao,
        imagem_url: bolo.imagem_url,
        estrelas: bolo.estrelas,
        comentario_dono: bolo.comentario_dono,
        avaliado_em: bolo.avaliado_em,
        preco_estimado: bolo.preco_estimado || "",
        categoria: bolo.categoria,
        is_custom: bolo.is_custom !== undefined ? bolo.is_custom : true
      };

      const { error } = await supabase
        .from("bolos")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        throw error;
      }
      return { success: true, error: null };
    } catch (err: any) {
      console.error("Erro ao salvar no Supabase:", err);
      return { success: false, error: err.message || err.toString() };
    }
  },

  // Delete a cake
  async deleteBolo(id: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const local = getLocalBolos();
      const filtered = local.filter((b) => b.id !== id);
      saveLocalBolos(filtered);
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase.from("bolos").delete().eq("id", id);
      if (error) {
        throw error;
      }
      return { success: true, error: null };
    } catch (err: any) {
      console.error("Erro ao deletar no Supabase:", err);
      return { success: false, error: err.message || err.toString() };
    }
  },

  // Update rating & owner comment directly for a cake
  async submitRating(id: string, estrelas: number, comentario: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = getSupabaseClient();
    const isoDate = new Date().toISOString();

    if (!supabase) {
      const local = getLocalBolos();
      const existingIndex = local.findIndex((b) => b.id === id);
      if (existingIndex >= 0) {
        local[existingIndex].estrelas = estrelas;
        local[existingIndex].comentario_dono = comentario;
        local[existingIndex].avaliado_em = isoDate;
        saveLocalBolos(local);
        return { success: true, error: null };
      }
      return { success: false, error: "Bolo não encontrado localmente." };
    }

    try {
      const { error } = await supabase
        .from("bolos")
        .update({
          estrelas: estrelas,
          comentario_dono: comentario,
          avaliado_em: isoDate
        })
        .eq("id", id);

      if (error) {
        throw error;
      }
      return { success: true, error: null };
    } catch (err: any) {
      console.error("Erro ao salvar avaliação corporativa no Supabase:", err);
      return { success: false, error: err.message || err.toString() };
    }
  }
};

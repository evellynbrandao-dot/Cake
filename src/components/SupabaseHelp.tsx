import React, { useState } from "react";
import { Database, Copy, Check, Terminal, ExternalLink, HelpCircle, Key, RefreshCw, AlertTriangle } from "lucide-react";
import { SUPABASE_SQL_SETUP, getSupabaseCredentials, saveCustomSupabaseCredentials } from "../lib/databaseService";

interface SupabaseHelpProps {
  onRefresh: () => void;
  isSupabaseConnected: boolean;
  connectionError: string | null;
}

export default function SupabaseHelp({ onRefresh, isSupabaseConnected, connectionError }: SupabaseHelpProps) {
  const creds = getSupabaseCredentials();
  
  const [url, setUrl] = useState(creds.url);
  const [anonKey, setAnonKey] = useState(creds.anonKey);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseCredentials(url, anonKey);
    setSavedSuccess(true);
    onRefresh();
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const clearCredentials = () => {
    saveCustomSupabaseCredentials("", "");
    setUrl("");
    setAnonKey("");
    onRefresh();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="supabase-help-card" className="bg-white rounded-3xl p-6 border border-brand-200 shadow-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-200/60 pb-4">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-brand-600" />
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-900">Sincronização com Supabase</h3>
            <p className="text-xs text-brand-600">Salve suas avaliações de bolo na nuvem</p>
          </div>
        </div>
        
        {/* Connection Status Badge */}
        {isSupabaseConnected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Supabase Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            Modo Local / Offline
          </span>
        )}
      </div>

      {/* Warning/Error Context Banner */}
      {connectionError ? (
        <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-200/50 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Aviso de Erro do Supabase:</p>
            <p className="font-normal opacity-90">{connectionError}</p>
            <p className="mt-1.5 hover:underline font-semibold cursor-pointer" onClick={() => setShowDocs(true)}>
              Verifique se a tabela 'bolos' foi criada corretamente ↓
            </p>
          </div>
        </div>
      ) : !isSupabaseConnected ? (
        <div className="p-3.5 bg-brand-100/50 text-brand-800 rounded-2xl border border-brand-200/40 text-xs leading-relaxed space-y-1">
          <p className="font-bold">✨ Perfeito para Vercel & GitHub!</p>
          <p>
            Neste momento o site está rodando no **modo de demonstração (localStorage)**. Suas avaliações e novos bolos estão salvos localmente no seu navegador.
          </p>
          <p className="font-medium text-brand-900 mt-1">
            Para salvar e ler da nuvem permanentemente, basta inserir as credenciais do seu Supabase abaixo ou configurar no arquivo `.env`.
          </p>
        </div>
      ) : (
        <div className="p-3.5 bg-brand-100/35 text-emerald-800 rounded-2xl border border-emerald-200/30 text-xs">
          <p className="font-semibold">✓ Banco de Dados Ativo e Conectado!</p>
          <p className="mt-1 text-brand-700">
            Suas avaliações e bolos estão sendo lidos/atualizados em tempo real diretamente da sua nuvem do Supabase. Perfeito para seu deploy no Vercel!
          </p>
          <p className="text-[10px] text-brand-500 mt-1.5">
            Fonte de credenciais ativas: <span className="font-bold uppercase">{creds.source === "env" ? "Arquivo .env / Vercel" : "Painel Local (Configurado abaixo)"}</span>
          </p>
        </div>
      )}

      {/* Setup Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-800 flex items-center gap-1">
          <Key className="h-3.5 w-3.5 text-brand-500" />
          Configuração de Conectividade do Supabase
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-brand-700">Supabase URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxxxxx.supabase.co"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2 text-xs text-brand-900 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-brand-700">Supabase Anon Key (Chave Pública Anon)</label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2 text-xs text-brand-900 focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Aplicar Credenciais
            </button>
            {(url || anonKey) && (
              <button
                type="button"
                onClick={clearCredentials}
                className="rounded-xl bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 text-xs font-semibold border border-red-100 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDocs(!showDocs)}
            className="text-xs text-brand-700 hover:text-brand-900 underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {showDocs ? "Esconder Instruções do SQL" : "Como criar tabelas no Supabase?"}
          </button>
        </div>

        {savedSuccess && (
          <p className="text-xs font-semibold text-emerald-600 animate-pulse">
            ✓ Credenciais salvas no seu navegador! Tentando conectar...
          </p>
        )}
      </form>

      {/* SQL Setup Instruction Box */}
      {showDocs && (
        <div className="border-t border-brand-200/60 pt-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-brand-600" />
              Script SQL para seu Supabase
            </h4>
            <button
              onClick={copyToClipboard}
              className="text-xs text-brand-700 hover:text-white hover:bg-brand-700 border border-brand-300 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer font-semibold"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar SQL Código
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-brand-700 space-y-1">
            <p><strong>Passo a passo no Supabase:</strong></p>
            <ol className="list-decimal pl-5 space-y-1 text-[11px] list-inside">
              <li>Acesse seu projeto no painel do <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 font-bold hover:underline inline-flex items-center gap-0.5">Supabase <ExternalLink className="h-2.5 w-2.5" /></a></li>
              <li>No menu esquerdo, vá em <strong>SQL Editor</strong> e clique em <strong>New Query</strong>.</li>
              <li>Cole o código SQL abaixo e clique no botão verde <strong>Run</strong>.</li>
              <li>A tabela 'bolos' estará pronta e configurada para ler e escrever livremente!</li>
            </ol>
          </div>

          <pre className="text-[10px] p-3.5 bg-brand-900 text-brand-100 rounded-2xl overflow-x-auto font-mono max-h-48 border border-brand-950 shadow-inner">
            {SUPABASE_SQL_SETUP}
          </pre>
        </div>
      )}
    </div>
  );
}

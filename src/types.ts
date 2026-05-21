export interface Bolo {
  id: string;
  nome: string;
  massa: string;
  recheio: string;
  cobertura: string;
  descricao: string;
  imagem_url: string;
  estrelas: number | null; // 1 to 5 stars, rated by the owner
  comentario_dono: string | null; // Review written by the owner
  avaliado_em: string | null; // ISO Date of the rating
  preco_estimado?: string; // e.g., "R$ 45,00/kg"
  categoria: string; // e.g., "Gourmet", "Artesanal", "Festas", "Caseiros"
  criado_em?: string;
  is_custom?: boolean; // True if the admin added this cake manually
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

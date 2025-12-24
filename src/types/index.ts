// Tipos principais do sistema

export interface Usuario {
  id: string;
  nome: string;
  pin: string;
  perfil: 'admin' | 'operador';
  ativo: boolean;
  criadoEm: string;
}

export interface Maquina {
  id: string;
  nome: string;
  tipo: TipoMaquina;
  placa: string;
  patrimonio: string;
  horimetroInicial: number;
  horimetroAtual: number;
  foto?: string;
  ativa: boolean;
  criadoEm: string;
}

export type TipoMaquina =
  | 'escavadeira'
  | 'retroescavadeira'
  | 'pa-carregadeira'
  | 'trator-esteira'
  | 'motoniveladora'
  | 'rolo-compactador'
  | 'caminhao-basculante'
  | 'caminhao-pipa'
  | 'outro';

export interface RegistroHoras {
  id: string;
  maquinaId: string;
  operadorId: string;
  obra: string;
  dataInicio: string;
  dataFim: string;
  horimetroInicio: number;
  horimetroFim: number;
  horasTrabalhadas: number;
  observacoes?: string;
  criadoEm: string;
}

export interface Manutencao {
  id: string;
  maquinaId: string;
  tipo: 'preventiva' | 'corretiva';
  data: string;
  horimetro: number;
  descricao: string;
  pecas?: string;
  custo?: number;
  proximaManutencaoHoras?: number;
  proximaManutencaoData?: string;
  status: 'pendente' | 'realizada' | 'atrasada';
  criadoEm: string;
}

export interface Obra {
  id: string;
  nome: string;
  endereco?: string;
  ativa: boolean;
}

// Tipos para o contexto de autenticação
export interface AuthContextType {
  usuario: Usuario | null;
  login: (pin: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Tipos para estatísticas do dashboard
export interface EstatisticasDashboard {
  totalMaquinas: number;
  maquinasAtivas: number;
  horasHoje: number;
  horasMes: number;
  manutencoesProximas: number;
  manutencoesPendentes: number;
}

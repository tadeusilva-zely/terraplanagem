import type { Usuario, Maquina, RegistroHoras, Manutencao, Obra } from '../types';
import {
  usuariosMock,
  maquinasMock,
  registrosHorasMock,
  manutencoesMock,
  obrasMock,
} from '../mocks/data';
import { v4 as uuidv4 } from 'uuid';

// Chaves do localStorage
const KEYS = {
  USUARIOS: 'terraplenagem_usuarios',
  MAQUINAS: 'terraplenagem_maquinas',
  REGISTROS: 'terraplenagem_registros',
  MANUTENCOES: 'terraplenagem_manutencoes',
  OBRAS: 'terraplenagem_obras',
  INITIALIZED: 'terraplenagem_initialized',
};

// Inicializa dados se não existirem
export function initializeStorage(): void {
  if (!localStorage.getItem(KEYS.INITIALIZED)) {
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuariosMock));
    localStorage.setItem(KEYS.MAQUINAS, JSON.stringify(maquinasMock));
    localStorage.setItem(KEYS.REGISTROS, JSON.stringify(registrosHorasMock));
    localStorage.setItem(KEYS.MANUTENCOES, JSON.stringify(manutencoesMock));
    localStorage.setItem(KEYS.OBRAS, JSON.stringify(obrasMock));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  }
}

// === USUÁRIOS ===
export function getUsuarios(): Usuario[] {
  const data = localStorage.getItem(KEYS.USUARIOS);
  return data ? JSON.parse(data) : [];
}

export function getUsuarioById(id: string): Usuario | undefined {
  return getUsuarios().find((u) => u.id === id);
}

export function getUsuarioByPin(pin: string): Usuario | undefined {
  return getUsuarios().find((u) => u.pin === pin && u.ativo);
}

export function saveUsuario(usuario: Omit<Usuario, 'id' | 'criadoEm'>): Usuario {
  const usuarios = getUsuarios();
  const novo: Usuario = {
    ...usuario,
    id: uuidv4(),
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(novo);
  localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
  return novo;
}

export function updateUsuario(id: string, dados: Partial<Usuario>): Usuario | null {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex((u) => u.id === id);
  if (index === -1) return null;
  usuarios[index] = { ...usuarios[index], ...dados };
  localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
  return usuarios[index];
}

export function deleteUsuario(id: string): boolean {
  const usuarios = getUsuarios();
  const filtered = usuarios.filter((u) => u.id !== id);
  if (filtered.length === usuarios.length) return false;
  localStorage.setItem(KEYS.USUARIOS, JSON.stringify(filtered));
  return true;
}

// === MÁQUINAS ===
export function getMaquinas(): Maquina[] {
  const data = localStorage.getItem(KEYS.MAQUINAS);
  return data ? JSON.parse(data) : [];
}

export function getMaquinaById(id: string): Maquina | undefined {
  return getMaquinas().find((m) => m.id === id);
}

export function saveMaquina(maquina: Omit<Maquina, 'id' | 'criadoEm'>): Maquina {
  const maquinas = getMaquinas();
  const nova: Maquina = {
    ...maquina,
    id: uuidv4(),
    criadoEm: new Date().toISOString(),
  };
  maquinas.push(nova);
  localStorage.setItem(KEYS.MAQUINAS, JSON.stringify(maquinas));
  return nova;
}

export function updateMaquina(id: string, dados: Partial<Maquina>): Maquina | null {
  const maquinas = getMaquinas();
  const index = maquinas.findIndex((m) => m.id === id);
  if (index === -1) return null;
  maquinas[index] = { ...maquinas[index], ...dados };
  localStorage.setItem(KEYS.MAQUINAS, JSON.stringify(maquinas));
  return maquinas[index];
}

export function deleteMaquina(id: string): boolean {
  const maquinas = getMaquinas();
  const filtered = maquinas.filter((m) => m.id !== id);
  if (filtered.length === maquinas.length) return false;
  localStorage.setItem(KEYS.MAQUINAS, JSON.stringify(filtered));
  return true;
}

// === REGISTROS DE HORAS ===
export function getRegistrosHoras(): RegistroHoras[] {
  const data = localStorage.getItem(KEYS.REGISTROS);
  return data ? JSON.parse(data) : [];
}

export function getRegistroById(id: string): RegistroHoras | undefined {
  return getRegistrosHoras().find((r) => r.id === id);
}

export function saveRegistroHoras(registro: Omit<RegistroHoras, 'id' | 'criadoEm'>): RegistroHoras {
  const registros = getRegistrosHoras();
  const novo: RegistroHoras = {
    ...registro,
    id: uuidv4(),
    criadoEm: new Date().toISOString(),
  };
  registros.push(novo);
  localStorage.setItem(KEYS.REGISTROS, JSON.stringify(registros));

  // Atualiza horímetro atual da máquina
  updateMaquina(registro.maquinaId, { horimetroAtual: registro.horimetroFim });

  return novo;
}

export function updateRegistroHoras(id: string, dados: Partial<RegistroHoras>): RegistroHoras | null {
  const registros = getRegistrosHoras();
  const index = registros.findIndex((r) => r.id === id);
  if (index === -1) return null;
  registros[index] = { ...registros[index], ...dados };
  localStorage.setItem(KEYS.REGISTROS, JSON.stringify(registros));
  return registros[index];
}

export function deleteRegistroHoras(id: string): boolean {
  const registros = getRegistrosHoras();
  const filtered = registros.filter((r) => r.id !== id);
  if (filtered.length === registros.length) return false;
  localStorage.setItem(KEYS.REGISTROS, JSON.stringify(filtered));
  return true;
}

// === MANUTENÇÕES ===
export function getManutencoes(): Manutencao[] {
  const data = localStorage.getItem(KEYS.MANUTENCOES);
  return data ? JSON.parse(data) : [];
}

export function getManutencaoById(id: string): Manutencao | undefined {
  return getManutencoes().find((m) => m.id === id);
}

export function saveManutencao(manutencao: Omit<Manutencao, 'id' | 'criadoEm'>): Manutencao {
  const manutencoes = getManutencoes();
  const nova: Manutencao = {
    ...manutencao,
    id: uuidv4(),
    criadoEm: new Date().toISOString(),
  };
  manutencoes.push(nova);
  localStorage.setItem(KEYS.MANUTENCOES, JSON.stringify(manutencoes));
  return nova;
}

export function updateManutencao(id: string, dados: Partial<Manutencao>): Manutencao | null {
  const manutencoes = getManutencoes();
  const index = manutencoes.findIndex((m) => m.id === id);
  if (index === -1) return null;
  manutencoes[index] = { ...manutencoes[index], ...dados };
  localStorage.setItem(KEYS.MANUTENCOES, JSON.stringify(manutencoes));
  return manutencoes[index];
}

export function deleteManutencao(id: string): boolean {
  const manutencoes = getManutencoes();
  const filtered = manutencoes.filter((m) => m.id !== id);
  if (filtered.length === manutencoes.length) return false;
  localStorage.setItem(KEYS.MANUTENCOES, JSON.stringify(filtered));
  return true;
}

// === OBRAS ===
export function getObras(): Obra[] {
  const data = localStorage.getItem(KEYS.OBRAS);
  return data ? JSON.parse(data) : [];
}

export function saveObra(obra: Omit<Obra, 'id'>): Obra {
  const obras = getObras();
  const nova: Obra = {
    ...obra,
    id: uuidv4(),
  };
  obras.push(nova);
  localStorage.setItem(KEYS.OBRAS, JSON.stringify(obras));
  return nova;
}

// === ESTATÍSTICAS ===
export function getEstatisticas() {
  const maquinas = getMaquinas();
  const registros = getRegistrosHoras();
  const manutencoes = getManutencoes();

  const hoje = new Date().toISOString().split('T')[0];
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const horasHoje = registros
    .filter((r) => r.dataInicio.startsWith(hoje))
    .reduce((acc, r) => acc + r.horasTrabalhadas, 0);

  const horasMes = registros
    .filter((r) => new Date(r.dataInicio) >= inicioMes)
    .reduce((acc, r) => acc + r.horasTrabalhadas, 0);

  const manutencoesProximas = manutencoes.filter(
    (m) => m.status === 'pendente'
  ).length;

  const manutencoesPendentes = manutencoes.filter(
    (m) => m.status === 'atrasada'
  ).length;

  return {
    totalMaquinas: maquinas.length,
    maquinasAtivas: maquinas.filter((m) => m.ativa).length,
    horasHoje,
    horasMes,
    manutencoesProximas,
    manutencoesPendentes,
  };
}

// Reset para dados originais (útil para testes)
export function resetStorage(): void {
  localStorage.removeItem(KEYS.INITIALIZED);
  initializeStorage();
}

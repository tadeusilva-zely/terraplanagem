import { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Search,
  Edit2,
  Trash2,
  X,
  Clock,
  Filter,
  Plus,
} from 'lucide-react';
import type { RegistroHoras, Maquina, Usuario } from '../types';
import {
  getRegistrosHoras,
  saveRegistroHoras,
  updateRegistroHoras,
  deleteRegistroHoras,
  getMaquinas,
  getUsuarios,
  getObras,
} from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

// Chave para salvar registro em andamento no localStorage
const REGISTRO_EM_ANDAMENTO_KEY = 'terraplenagem_registro_andamento';

interface RegistroEmAndamento {
  maquinaId: string;
  obra: string;
  horimetroInicio: number;
  dataInicio: string;
}

export default function RegistroHorasPage() {
  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [obras, setObras] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroMaquina, setFiltroMaquina] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalFinalizarAberto, setModalFinalizarAberto] = useState(false);
  const [editando, setEditando] = useState<RegistroHoras | null>(null);
  const { usuario, isAdmin } = useAuth();

  // Estado para iniciar turno
  const [maquinaSelecionada, setMaquinaSelecionada] = useState('');
  const [obraSelecionada, setObraSelecionada] = useState('');
  const [horimetroInicio, setHorimetroInicio] = useState(0);

  // Estado para finalizar turno
  const [horimetroFim, setHorimetroFim] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  // Registro em andamento
  const [registroEmAndamento, setRegistroEmAndamento] = useState<RegistroEmAndamento | null>(null);

  // Form para edição manual (admin)
  const [form, setForm] = useState({
    maquinaId: '',
    operadorId: '',
    obra: '',
    dataInicio: '',
    dataFim: '',
    horimetroInicio: 0,
    horimetroFim: 0,
    horasTrabalhadas: 0,
    observacoes: '',
  });

  useEffect(() => {
    carregarDados();
    // Carregar registro em andamento do localStorage
    const saved = localStorage.getItem(REGISTRO_EM_ANDAMENTO_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verificar se é do usuário atual
        if (parsed.operadorId === usuario?.id) {
          setRegistroEmAndamento(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [usuario?.id]);

  const carregarDados = () => {
    setRegistros(getRegistrosHoras());
    setMaquinas(getMaquinas().filter((m) => m.ativa));
    setUsuarios(getUsuarios().filter((u) => u.ativo));
    const obrasData = getObras();
    setObras(obrasData.filter((o) => o.ativa).map((o) => o.nome));
  };

  const registrosFiltrados = registros
    .filter((r) => {
      const maquina = maquinas.find((m) => m.id === r.maquinaId);
      const operador = usuarios.find((u) => u.id === r.operadorId);
      const matchBusca =
        maquina?.nome.toLowerCase().includes(busca.toLowerCase()) ||
        operador?.nome.toLowerCase().includes(busca.toLowerCase()) ||
        r.obra.toLowerCase().includes(busca.toLowerCase());
      const matchMaquina = !filtroMaquina || r.maquinaId === filtroMaquina;
      return matchBusca && matchMaquina;
    })
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const getMaquinaNome = (id: string) => maquinas.find((m) => m.id === id)?.nome || 'N/A';
  const getOperadorNome = (id: string) => usuarios.find((u) => u.id === id)?.nome || 'N/A';
  const getMaquinaHorimetro = (id: string) => maquinas.find((m) => m.id === id)?.horimetroAtual || 0;

  // Formatar data/hora
  const formatarDataHora = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // INICIAR TURNO
  const handleIniciar = () => {
    if (!maquinaSelecionada || !obraSelecionada) {
      alert('Selecione a máquina e a obra');
      return;
    }

    const agora = new Date();
    const registro: RegistroEmAndamento & { operadorId: string } = {
      maquinaId: maquinaSelecionada,
      obra: obraSelecionada,
      horimetroInicio: horimetroInicio,
      dataInicio: agora.toISOString(),
      operadorId: usuario?.id || '',
    };

    localStorage.setItem(REGISTRO_EM_ANDAMENTO_KEY, JSON.stringify(registro));
    setRegistroEmAndamento(registro);

    // Limpar seleção
    setMaquinaSelecionada('');
    setObraSelecionada('');
    setHorimetroInicio(0);
  };

  // FINALIZAR TURNO
  const handleFinalizar = () => {
    if (!registroEmAndamento) return;

    if (horimetroFim < registroEmAndamento.horimetroInicio) {
      alert('Horímetro final deve ser maior que o inicial');
      return;
    }

    const agora = new Date();
    const horasTrabalhadas = horimetroFim - registroEmAndamento.horimetroInicio;

    saveRegistroHoras({
      maquinaId: registroEmAndamento.maquinaId,
      operadorId: usuario?.id || '',
      obra: registroEmAndamento.obra,
      dataInicio: formatarDataHora(new Date(registroEmAndamento.dataInicio)),
      dataFim: formatarDataHora(agora),
      horimetroInicio: registroEmAndamento.horimetroInicio,
      horimetroFim: horimetroFim,
      horasTrabalhadas: horasTrabalhadas,
      observacoes: observacoes || undefined,
    });

    // Limpar
    localStorage.removeItem(REGISTRO_EM_ANDAMENTO_KEY);
    setRegistroEmAndamento(null);
    setHorimetroFim(0);
    setObservacoes('');
    setModalFinalizarAberto(false);
    carregarDados();
  };

  // Cancelar turno em andamento
  const handleCancelarTurno = () => {
    if (confirm('Tem certeza que deseja cancelar o turno em andamento?')) {
      localStorage.removeItem(REGISTRO_EM_ANDAMENTO_KEY);
      setRegistroEmAndamento(null);
    }
  };

  // Abrir modal para finalizar
  const abrirModalFinalizar = () => {
    if (registroEmAndamento) {
      setHorimetroFim(registroEmAndamento.horimetroInicio);
      setModalFinalizarAberto(true);
    }
  };

  // Selecionar máquina e preencher horímetro
  const handleSelecionarMaquina = (id: string) => {
    setMaquinaSelecionada(id);
    setHorimetroInicio(getMaquinaHorimetro(id));
  };

  // Modal de edição manual (admin)
  const abrirModal = (registro?: RegistroHoras) => {
    if (registro) {
      setEditando(registro);
      setForm({
        maquinaId: registro.maquinaId,
        operadorId: registro.operadorId,
        obra: registro.obra,
        dataInicio: registro.dataInicio,
        dataFim: registro.dataFim,
        horimetroInicio: registro.horimetroInicio,
        horimetroFim: registro.horimetroFim,
        horasTrabalhadas: registro.horasTrabalhadas,
        observacoes: registro.observacoes || '',
      });
    } else {
      setEditando(null);
      const hoje = new Date().toISOString().split('T')[0];
      setForm({
        maquinaId: '',
        operadorId: usuario?.id || '',
        obra: '',
        dataInicio: `${hoje} 07:00`,
        dataFim: `${hoje} 17:00`,
        horimetroInicio: 0,
        horimetroFim: 0,
        horasTrabalhadas: 0,
        observacoes: '',
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const calcularHoras = () => {
    const horas = form.horimetroFim - form.horimetroInicio;
    setForm({ ...form, horasTrabalhadas: horas > 0 ? horas : 0 });
  };

  const handleMaquinaChange = (maquinaId: string) => {
    const horimetro = getMaquinaHorimetro(maquinaId);
    setForm({
      ...form,
      maquinaId,
      horimetroInicio: horimetro,
      horimetroFim: horimetro,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editando) {
      updateRegistroHoras(editando.id, form);
    } else {
      saveRegistroHoras(form);
    }

    carregarDados();
    fecharModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      deleteRegistroHoras(id);
      carregarDados();
    }
  };

  // Calcular tempo decorrido
  const calcularTempoDecorrido = () => {
    if (!registroEmAndamento) return '0:00';
    const inicio = new Date(registroEmAndamento.dataInicio);
    const agora = new Date();
    const diff = agora.getTime() - inicio.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}:${minutos.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Registro de Horas</h1>
        {isAdmin && (
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={20} />
            Registro Manual
          </button>
        )}
      </div>

      {/* Card de Ponto - Iniciar/Finalizar */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {!registroEmAndamento ? (
          // INICIAR TURNO
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Play className="text-green-600" size={24} />
              Iniciar Turno
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máquina *
                </label>
                <select
                  value={maquinaSelecionada}
                  onChange={(e) => handleSelecionarMaquina(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                >
                  <option value="">Selecione a máquina...</option>
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obra *
                </label>
                <select
                  value={obraSelecionada}
                  onChange={(e) => setObraSelecionada(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                >
                  <option value="">Selecione a obra...</option>
                  {obras.map((obra) => (
                    <option key={obra} value={obra}>
                      {obra}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horímetro Atual *
                </label>
                <input
                  type="number"
                  value={horimetroInicio}
                  onChange={(e) => setHorimetroInicio(Number(e.target.value))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={handleIniciar}
              disabled={!maquinaSelecionada || !obraSelecionada}
              className={`w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-colors ${
                maquinaSelecionada && obraSelecionada
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play size={28} />
              INICIAR TURNO
            </button>
          </div>
        ) : (
          // TURNO EM ANDAMENTO - FINALIZAR
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Turno em Andamento
              </h2>
              <button
                onClick={handleCancelarTurno}
                className="text-sm text-red-600 hover:underline"
              >
                Cancelar turno
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Máquina</p>
                  <p className="font-bold text-gray-800">
                    {getMaquinaNome(registroEmAndamento.maquinaId)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Obra</p>
                  <p className="font-bold text-gray-800">{registroEmAndamento.obra}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Início</p>
                  <p className="font-bold text-gray-800">
                    {formatarDataHora(new Date(registroEmAndamento.dataInicio))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tempo</p>
                  <p className="font-bold text-2xl text-green-600">{calcularTempoDecorrido()}</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-500">Horímetro Início</p>
                <p className="font-mono font-bold text-xl">{registroEmAndamento.horimetroInicio}h</p>
              </div>
            </div>

            <button
              onClick={abrirModalFinalizar}
              className="w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Square size={28} />
              FINALIZAR TURNO
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={filtroMaquina}
            onChange={(e) => setFiltroMaquina(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white"
          >
            <option value="">Todas as máquinas</option>
            {maquinas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h3 className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 border-b">
          Histórico de Registros
        </h3>
        {registrosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="mx-auto mb-4 opacity-50" size={48} />
            <p>Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {registrosFiltrados.map((registro) => (
              <div key={registro.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {getMaquinaNome(registro.maquinaId)}
                      </h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded">
                        {registro.horasTrabalhadas}h
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>
                        <span className="font-medium">Operador:</span>{' '}
                        {getOperadorNome(registro.operadorId)}
                      </p>
                      <p>
                        <span className="font-medium">Obra:</span> {registro.obra}
                      </p>
                      <p>
                        <span className="font-medium">Período:</span> {registro.dataInicio} até{' '}
                        {registro.dataFim}
                      </p>
                      <p>
                        <span className="font-medium">Horímetro:</span>{' '}
                        {registro.horimetroInicio} → {registro.horimetroFim}
                      </p>
                      {registro.observacoes && (
                        <p className="text-gray-400 italic">{registro.observacoes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isAdmin || registro.operadorId === usuario?.id) && (
                      <>
                        <button
                          onClick={() => abrirModal(registro)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(registro.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Finalizar */}
      {modalFinalizarAberto && registroEmAndamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Finalizar Turno</h2>
              <button
                onClick={() => setModalFinalizarAberto(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Máquina</p>
                <p className="font-bold">{getMaquinaNome(registroEmAndamento.maquinaId)}</p>
                <p className="text-sm text-gray-500 mt-2">Horímetro Início</p>
                <p className="font-mono font-bold">{registroEmAndamento.horimetroInicio}h</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horímetro Final *
                </label>
                <input
                  type="number"
                  value={horimetroFim}
                  onChange={(e) => setHorimetroFim(Number(e.target.value))}
                  min={registroEmAndamento.horimetroInicio}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xl font-mono text-center"
                />
              </div>

              {horimetroFim > registroEmAndamento.horimetroInicio && (
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <span className="text-sm text-gray-600">Horas trabalhadas: </span>
                  <span className="text-2xl font-bold text-amber-600">
                    {horimetroFim - registroEmAndamento.horimetroInicio}h
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Alguma observação sobre o turno..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFinalizarAberto(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizar}
                  disabled={horimetroFim < registroEmAndamento.horimetroInicio}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-bold"
                >
                  FINALIZAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edição Manual */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editando ? 'Editar Registro' : 'Registro Manual'}
              </h2>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máquina *</label>
                <select
                  required
                  value={form.maquinaId}
                  onChange={(e) => handleMaquinaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Selecione...</option>
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} (Hor: {m.horimetroAtual}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operador *</label>
                <select
                  required
                  value={form.operadorId}
                  onChange={(e) => setForm({ ...form, operadorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Selecione...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Obra *</label>
                <select
                  required
                  value={form.obra}
                  onChange={(e) => setForm({ ...form, obra: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Selecione...</option>
                  {obras.map((obra) => (
                    <option key={obra} value={obra}>
                      {obra}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data/Hora Início *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.dataInicio}
                    onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="15/01/2024 07:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data/Hora Fim *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.dataFim}
                    onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="15/01/2024 17:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horímetro Início *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.horimetroInicio}
                    onChange={(e) => {
                      setForm({ ...form, horimetroInicio: Number(e.target.value) });
                    }}
                    onBlur={calcularHoras}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horímetro Fim *
                  </label>
                  <input
                    type="number"
                    required
                    min={form.horimetroInicio}
                    value={form.horimetroFim}
                    onChange={(e) => {
                      setForm({ ...form, horimetroFim: Number(e.target.value) });
                    }}
                    onBlur={calcularHoras}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg text-center">
                <span className="text-sm text-gray-600">Horas trabalhadas: </span>
                <span className="text-2xl font-bold text-amber-600">{form.horasTrabalhadas}h</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Observações opcionais..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editando ? 'Salvar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

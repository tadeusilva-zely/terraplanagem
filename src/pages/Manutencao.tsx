import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { Manutencao, Maquina } from '../types';
import {
  getManutencoes,
  saveManutencao,
  updateManutencao,
  deleteManutencao,
  getMaquinas,
} from '../services/storage';
import { useAuth } from '../contexts/AuthContext';

export default function ManutencaoPage() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Manutencao | null>(null);
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    maquinaId: '',
    tipo: 'preventiva' as 'preventiva' | 'corretiva',
    data: '',
    horimetro: 0,
    descricao: '',
    pecas: '',
    custo: 0,
    proximaManutencaoHoras: 0,
    proximaManutencaoData: '',
    status: 'pendente' as 'pendente' | 'realizada' | 'atrasada',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    setManutencoes(getManutencoes());
    setMaquinas(getMaquinas());
  };

  const manutencoesFiltradas = manutencoes
    .filter((m) => {
      const maquina = maquinas.find((maq) => maq.id === m.maquinaId);
      const matchBusca =
        maquina?.nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.descricao.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = !filtroStatus || m.status === filtroStatus;
      return matchBusca && matchStatus;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const getMaquinaNome = (id: string) => maquinas.find((m) => m.id === id)?.nome || 'N/A';
  const getMaquinaHorimetro = (id: string) => maquinas.find((m) => m.id === id)?.horimetroAtual || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'realizada':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'atrasada':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-amber-500" size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'realizada':
        return { text: 'Realizada', class: 'bg-green-100 text-green-700' };
      case 'atrasada':
        return { text: 'Atrasada', class: 'bg-red-100 text-red-700' };
      default:
        return { text: 'Pendente', class: 'bg-amber-100 text-amber-700' };
    }
  };

  const abrirModal = (manutencao?: Manutencao) => {
    if (manutencao) {
      setEditando(manutencao);
      setForm({
        maquinaId: manutencao.maquinaId,
        tipo: manutencao.tipo,
        data: manutencao.data.split('T')[0],
        horimetro: manutencao.horimetro,
        descricao: manutencao.descricao,
        pecas: manutencao.pecas || '',
        custo: manutencao.custo || 0,
        proximaManutencaoHoras: manutencao.proximaManutencaoHoras || 0,
        proximaManutencaoData: manutencao.proximaManutencaoData?.split('T')[0] || '',
        status: manutencao.status,
      });
    } else {
      setEditando(null);
      setForm({
        maquinaId: '',
        tipo: 'preventiva',
        data: new Date().toISOString().split('T')[0],
        horimetro: 0,
        descricao: '',
        pecas: '',
        custo: 0,
        proximaManutencaoHoras: 0,
        proximaManutencaoData: '',
        status: 'pendente',
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleMaquinaChange = (maquinaId: string) => {
    const horimetro = getMaquinaHorimetro(maquinaId);
    setForm({ ...form, maquinaId, horimetro });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dados = {
      ...form,
      data: new Date(form.data).toISOString(),
      proximaManutencaoData: form.proximaManutencaoData
        ? new Date(form.proximaManutencaoData).toISOString()
        : undefined,
      custo: form.custo || undefined,
      pecas: form.pecas || undefined,
      proximaManutencaoHoras: form.proximaManutencaoHoras || undefined,
    };

    if (editando) {
      updateManutencao(editando.id, dados);
    } else {
      saveManutencao(dados);
    }

    carregarDados();
    fecharModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
      deleteManutencao(id);
      carregarDados();
    }
  };

  const marcarRealizada = (manutencao: Manutencao) => {
    updateManutencao(manutencao.id, { status: 'realizada' });
    carregarDados();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Controle de Manutenção</h1>
        {isAdmin && (
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
            Nova Manutenção
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por máquina ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="realizada">Realizada</option>
          <option value="atrasada">Atrasada</option>
        </select>
      </div>

      {/* Lista de Manutenções */}
      <div className="space-y-4">
        {manutencoesFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-12 text-gray-500">
            <Wrench className="mx-auto mb-4 opacity-50" size={48} />
            <p>Nenhuma manutenção encontrada</p>
          </div>
        ) : (
          manutencoesFiltradas.map((manutencao) => {
            const statusInfo = getStatusLabel(manutencao.status);
            return (
              <div
                key={manutencao.id}
                className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                  manutencao.status === 'atrasada'
                    ? 'border-red-500'
                    : manutencao.status === 'realizada'
                    ? 'border-green-500'
                    : 'border-amber-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(manutencao.status)}
                      <h3 className="font-semibold text-gray-800">
                        {getMaquinaNome(manutencao.maquinaId)}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          manutencao.tipo === 'preventiva'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {manutencao.tipo === 'preventiva' ? 'Preventiva' : 'Corretiva'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusInfo.class}`}>
                        {statusInfo.text}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-2">{manutencao.descricao}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Data:</span>
                        <p className="font-medium">
                          {new Date(manutencao.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Horímetro:</span>
                        <p className="font-medium">{manutencao.horimetro}h</p>
                      </div>
                      {manutencao.custo && (
                        <div>
                          <span className="text-gray-500">Custo:</span>
                          <p className="font-medium text-green-600">
                            R$ {manutencao.custo.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                      {manutencao.proximaManutencaoHoras && (
                        <div>
                          <span className="text-gray-500">Próxima em:</span>
                          <p className="font-medium">{manutencao.proximaManutencaoHoras}h</p>
                        </div>
                      )}
                    </div>

                    {manutencao.pecas && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Peças:</span> {manutencao.pecas}
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex flex-col gap-2">
                      {manutencao.status !== 'realizada' && (
                        <button
                          onClick={() => marcarRealizada(manutencao)}
                          className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                        >
                          <CheckCircle size={16} />
                          Concluir
                        </button>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModal(manutencao)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(manutencao.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editando ? 'Editar Manutenção' : 'Nova Manutenção'}
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
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    required
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({ ...form, tipo: e.target.value as 'preventiva' | 'corretiva' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="preventiva">Preventiva</option>
                    <option value="corretiva">Corretiva</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    required
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as 'pendente' | 'realizada' | 'atrasada',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="realizada">Realizada</option>
                    <option value="atrasada">Atrasada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horímetro *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.horimetro}
                    onChange={(e) => setForm({ ...form, horimetro: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea
                  required
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Descreva a manutenção..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peças/Materiais
                </label>
                <input
                  type="text"
                  value={form.pecas}
                  onChange={(e) => setForm({ ...form, pecas: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ex: Óleo 15W40, Filtro de ar..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.custo}
                    onChange={(e) => setForm({ ...form, custo: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Próxima (horas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.proximaManutencaoHoras}
                    onChange={(e) =>
                      setForm({ ...form, proximaManutencaoHoras: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Horímetro"
                  />
                </div>
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
                  {editando ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

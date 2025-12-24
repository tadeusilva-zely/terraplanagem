import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { Maquina, TipoMaquina } from '../types';
import { getMaquinas, saveMaquina, updateMaquina, deleteMaquina } from '../services/storage';
import { tipoMaquinaLabels } from '../mocks/data';
import { useAuth } from '../contexts/AuthContext';

const tiposMaquina: TipoMaquina[] = [
  'escavadeira',
  'retroescavadeira',
  'pa-carregadeira',
  'trator-esteira',
  'motoniveladora',
  'rolo-compactador',
  'caminhao-basculante',
  'caminhao-pipa',
  'outro',
];

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Maquina | null>(null);
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    nome: '',
    tipo: 'escavadeira' as TipoMaquina,
    placa: '',
    patrimonio: '',
    horimetroInicial: 0,
    horimetroAtual: 0,
    ativa: true,
  });

  useEffect(() => {
    carregarMaquinas();
  }, []);

  const carregarMaquinas = () => {
    setMaquinas(getMaquinas());
  };

  const maquinasFiltradas = maquinas.filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.placa.toLowerCase().includes(busca.toLowerCase()) ||
      m.patrimonio.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirModal = (maquina?: Maquina) => {
    if (maquina) {
      setEditando(maquina);
      setForm({
        nome: maquina.nome,
        tipo: maquina.tipo,
        placa: maquina.placa,
        patrimonio: maquina.patrimonio,
        horimetroInicial: maquina.horimetroInicial,
        horimetroAtual: maquina.horimetroAtual,
        ativa: maquina.ativa,
      });
    } else {
      setEditando(null);
      setForm({
        nome: '',
        tipo: 'escavadeira',
        placa: '',
        patrimonio: '',
        horimetroInicial: 0,
        horimetroAtual: 0,
        ativa: true,
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editando) {
      updateMaquina(editando.id, form);
    } else {
      saveMaquina({
        ...form,
        horimetroAtual: form.horimetroAtual || form.horimetroInicial,
      });
    }

    carregarMaquinas();
    fecharModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta máquina?')) {
      deleteMaquina(id);
      carregarMaquinas();
    }
  };

  const toggleAtiva = (maquina: Maquina) => {
    updateMaquina(maquina.id, { ativa: !maquina.ativa });
    carregarMaquinas();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Máquinas</h1>
        {isAdmin && (
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
            Nova Máquina
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, placa ou patrimônio..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {/* Lista de Máquinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maquinasFiltradas.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Truck className="mx-auto mb-4 opacity-50" size={48} />
            <p>Nenhuma máquina encontrada</p>
          </div>
        ) : (
          maquinasFiltradas.map((maquina) => (
            <div
              key={maquina.id}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                maquina.ativa ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{maquina.nome}</h3>
                  <p className="text-sm text-gray-500">{tipoMaquinaLabels[maquina.tipo]}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    maquina.ativa
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {maquina.ativa ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Placa:</span>
                  <span className="font-medium">{maquina.placa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Patrimônio:</span>
                  <span className="font-medium">{maquina.patrimonio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Horímetro:</span>
                  <span className="font-bold text-amber-600">{maquina.horimetroAtual}h</span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => toggleAtiva(maquina)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      maquina.ativa
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {maquina.ativa ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {maquina.ativa ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => abrirModal(maquina)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(maquina.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editando ? 'Editar Máquina' : 'Nova Máquina'}
              </h2>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ex: Escavadeira CAT 320"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  required
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoMaquina })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {tiposMaquina.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipoMaquinaLabels[tipo]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.placa}
                    onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patrimônio *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.patrimonio}
                    onChange={(e) => setForm({ ...form, patrimonio: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="PAT-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horímetro Inicial *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.horimetroInicial}
                    onChange={(e) => setForm({ ...form, horimetroInicial: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                {editando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horímetro Atual *
                    </label>
                    <input
                      type="number"
                      required
                      min={form.horimetroInicial}
                      value={form.horimetroAtual}
                      onChange={(e) => setForm({ ...form, horimetroAtual: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativa"
                  checked={form.ativa}
                  onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="ativa" className="text-sm text-gray-700">
                  Máquina ativa
                </label>
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

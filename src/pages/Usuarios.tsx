import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Users,
  Shield,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { Usuario } from '../types';
import { getUsuarios, saveUsuario, updateUsuario, deleteUsuario } from '../services/storage';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);

  const [form, setForm] = useState({
    nome: '',
    pin: '',
    perfil: 'operador' as 'admin' | 'operador',
    ativo: true,
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = () => {
    setUsuarios(getUsuarios());
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditando(usuario);
      setForm({
        nome: usuario.nome,
        pin: usuario.pin,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
      });
    } else {
      setEditando(null);
      setForm({
        nome: '',
        pin: '',
        perfil: 'operador',
        ativo: true,
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

    // Verificar se PIN já existe (para outro usuário)
    const pinExiste = usuarios.some(
      (u) => u.pin === form.pin && u.id !== editando?.id
    );

    if (pinExiste) {
      alert('Este PIN já está em uso por outro usuário.');
      return;
    }

    if (editando) {
      updateUsuario(editando.id, form);
    } else {
      saveUsuario(form);
    }

    carregarUsuarios();
    fecharModal();
  };

  const handleDelete = (id: string) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (usuario?.perfil === 'admin') {
      const admins = usuarios.filter((u) => u.perfil === 'admin');
      if (admins.length <= 1) {
        alert('Não é possível excluir o único administrador.');
        return;
      }
    }

    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUsuario(id);
      carregarUsuarios();
    }
  };

  const toggleAtivo = (usuario: Usuario) => {
    if (usuario.perfil === 'admin') {
      const adminsAtivos = usuarios.filter((u) => u.perfil === 'admin' && u.ativo);
      if (adminsAtivos.length <= 1 && usuario.ativo) {
        alert('Não é possível desativar o único administrador ativo.');
        return;
      }
    }

    updateUsuario(usuario.id, { ativo: !usuario.ativo });
    carregarUsuarios();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuariosFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users className="mx-auto mb-4 opacity-50" size={48} />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <div
              key={usuario.id}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                usuario.ativo ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      usuario.perfil === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}
                  >
                    {usuario.perfil === 'admin' ? (
                      <Shield className="text-purple-600" size={24} />
                    ) : (
                      <User className="text-blue-600" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{usuario.nome}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        usuario.perfil === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {usuario.perfil === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    usuario.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <p>
                  <span className="font-medium">PIN:</span>{' '}
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {'•'.repeat(4)}
                  </span>
                </p>
                <p className="mt-1">
                  <span className="font-medium">Criado em:</span>{' '}
                  {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <button
                  onClick={() => toggleAtivo(usuario)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    usuario.ativo
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {usuario.ativo ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  {usuario.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => abrirModal(usuario)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(usuario.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editando ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 dígitos) *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={form.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setForm({ ...form, pin: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-center text-xl tracking-widest"
                  placeholder="0000"
                />
                <p className="text-xs text-gray-500 mt-1">PIN usado para fazer login no app</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
                <select
                  required
                  value={form.perfil}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value as 'admin' | 'operador' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Administradores têm acesso completo ao sistema
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Usuário ativo
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

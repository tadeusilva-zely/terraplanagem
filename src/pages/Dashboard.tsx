import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Clock,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { getEstatisticas, getRegistrosHoras, getManutencoes, getMaquinas, getUsuarios } from '../services/storage';
import type { EstatisticasDashboard, RegistroHoras, Manutencao } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

function StatCard({ title, value, icon, color, link }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}

export default function Dashboard() {
  const [stats, setStats] = useState<EstatisticasDashboard | null>(null);
  const [ultimosRegistros, setUltimosRegistros] = useState<RegistroHoras[]>([]);
  const [alertasManutencao, setAlertasManutencao] = useState<Manutencao[]>([]);

  useEffect(() => {
    setStats(getEstatisticas());

    const registros = getRegistrosHoras();
    setUltimosRegistros(registros.slice(-5).reverse());

    const manutencoes = getManutencoes();
    const alertas = manutencoes.filter(
      (m) => m.status === 'pendente' || m.status === 'atrasada'
    );
    setAlertasManutencao(alertas);
  }, []);

  const maquinas = getMaquinas();
  const usuarios = getUsuarios();

  const getMaquinaNome = (id: string) => maquinas.find((m) => m.id === id)?.nome || 'N/A';
  const getOperadorNome = (id: string) => usuarios.find((u) => u.id === id)?.nome || 'N/A';

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">
          <Calendar className="inline mr-2" size={16} />
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Máquinas Ativas"
          value={`${stats.maquinasAtivas}/${stats.totalMaquinas}`}
          icon={<Truck size={24} className="text-blue-500" />}
          color="border-blue-500"
          link="/maquinas"
        />
        <StatCard
          title="Horas Hoje"
          value={`${stats.horasHoje}h`}
          icon={<Clock size={24} className="text-green-500" />}
          color="border-green-500"
          link="/registro-horas"
        />
        <StatCard
          title="Horas no Mês"
          value={`${stats.horasMes}h`}
          icon={<TrendingUp size={24} className="text-amber-500" />}
          color="border-amber-500"
          link="/relatorios"
        />
        <StatCard
          title="Manutenções Pendentes"
          value={stats.manutencoesProximas + stats.manutencoesPendentes}
          icon={<Wrench size={24} className="text-red-500" />}
          color="border-red-500"
          link="/manutencao"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Registros */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Últimos Registros</h2>
            <Link to="/registro-horas" className="text-amber-600 text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {ultimosRegistros.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum registro encontrado</p>
            ) : (
              ultimosRegistros.map((registro) => (
                <div
                  key={registro.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{getMaquinaNome(registro.maquinaId)}</p>
                    <p className="text-sm text-gray-500">
                      {getOperadorNome(registro.operadorId)} • {registro.obra}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">{registro.horasTrabalhadas}h</p>
                    <p className="text-xs text-gray-400">
                      {new Date(registro.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas de Manutenção */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Alertas de Manutenção</h2>
            <Link to="/manutencao" className="text-amber-600 text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {alertasManutencao.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="mx-auto mb-2 opacity-50" size={32} />
                <p>Nenhuma manutenção pendente</p>
              </div>
            ) : (
              alertasManutencao.map((manutencao) => (
                <div
                  key={manutencao.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-l-4
                    ${manutencao.status === 'atrasada'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-amber-50 border-amber-500'}
                  `}
                >
                  <AlertTriangle
                    size={20}
                    className={manutencao.status === 'atrasada' ? 'text-red-500' : 'text-amber-500'}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {getMaquinaNome(manutencao.maquinaId)}
                    </p>
                    <p className="text-sm text-gray-600">{manutencao.descricao}</p>
                  </div>
                  <span
                    className={`
                      px-2 py-1 text-xs font-medium rounded
                      ${manutencao.status === 'atrasada'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'}
                    `}
                  >
                    {manutencao.status === 'atrasada' ? 'Atrasada' : 'Pendente'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

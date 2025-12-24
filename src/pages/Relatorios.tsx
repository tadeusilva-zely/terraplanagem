import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Filter,
  Truck,
  Clock,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import type { RegistroHoras, Maquina, Manutencao, Usuario } from '../types';
import {
  getRegistrosHoras,
  getMaquinas,
  getManutencoes,
  getUsuarios,
} from '../services/storage';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

type TipoRelatorio = 'horas-maquina' | 'horas-operador' | 'manutencoes' | 'resumo';

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('resumo');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [maquinaId, setMaquinaId] = useState('');

  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    setRegistros(getRegistrosHoras());
    setMaquinas(getMaquinas());
    setManutencoes(getManutencoes());
    setUsuarios(getUsuarios());

    // Definir período padrão (último mês)
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    setDataInicio(inicioMes.toISOString().split('T')[0]);
    setDataFim(hoje.toISOString().split('T')[0]);
  }, []);

  const getMaquinaNome = (id: string) => maquinas.find((m) => m.id === id)?.nome || 'N/A';
  const getOperadorNome = (id: string) => usuarios.find((u) => u.id === id)?.nome || 'N/A';

  // Filtrar dados pelo período
  const registrosFiltrados = registros.filter((r) => {
    const data = new Date(r.criadoEm);
    const inicio = dataInicio ? new Date(dataInicio) : new Date(0);
    const fim = dataFim ? new Date(dataFim + 'T23:59:59') : new Date();
    const matchData = data >= inicio && data <= fim;
    const matchMaquina = !maquinaId || r.maquinaId === maquinaId;
    return matchData && matchMaquina;
  });

  const manutencoesFiltradas = manutencoes.filter((m) => {
    const data = new Date(m.data);
    const inicio = dataInicio ? new Date(dataInicio) : new Date(0);
    const fim = dataFim ? new Date(dataFim + 'T23:59:59') : new Date();
    const matchData = data >= inicio && data <= fim;
    const matchMaquina = !maquinaId || m.maquinaId === maquinaId;
    return matchData && matchMaquina;
  });

  // Calcular dados para relatórios
  const calcularHorasPorMaquina = () => {
    const resultado: Record<string, { nome: string; horas: number; registros: number }> = {};
    registrosFiltrados.forEach((r) => {
      if (!resultado[r.maquinaId]) {
        resultado[r.maquinaId] = {
          nome: getMaquinaNome(r.maquinaId),
          horas: 0,
          registros: 0,
        };
      }
      resultado[r.maquinaId].horas += r.horasTrabalhadas;
      resultado[r.maquinaId].registros += 1;
    });
    return Object.values(resultado).sort((a, b) => b.horas - a.horas);
  };

  const calcularHorasPorOperador = () => {
    const resultado: Record<string, { nome: string; horas: number; registros: number }> = {};
    registrosFiltrados.forEach((r) => {
      if (!resultado[r.operadorId]) {
        resultado[r.operadorId] = {
          nome: getOperadorNome(r.operadorId),
          horas: 0,
          registros: 0,
        };
      }
      resultado[r.operadorId].horas += r.horasTrabalhadas;
      resultado[r.operadorId].registros += 1;
    });
    return Object.values(resultado).sort((a, b) => b.horas - a.horas);
  };

  const calcularResumo = () => {
    const totalHoras = registrosFiltrados.reduce((acc, r) => acc + r.horasTrabalhadas, 0);
    const totalRegistros = registrosFiltrados.length;
    const totalManutencoes = manutencoesFiltradas.length;
    const custoManutencoes = manutencoesFiltradas.reduce((acc, m) => acc + (m.custo || 0), 0);
    const maquinasUtilizadas = new Set(registrosFiltrados.map((r) => r.maquinaId)).size;

    return {
      totalHoras,
      totalRegistros,
      totalManutencoes,
      custoManutencoes,
      maquinasUtilizadas,
    };
  };

  // Exportar para PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    const titulo = getTituloRelatorio();
    const periodo = `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;

    doc.setFontSize(18);
    doc.text(titulo, 20, 20);
    doc.setFontSize(12);
    doc.text(periodo, 20, 30);

    let y = 45;

    if (tipoRelatorio === 'resumo') {
      const resumo = calcularResumo();
      doc.text(`Total de Horas: ${resumo.totalHoras}h`, 20, y);
      y += 10;
      doc.text(`Total de Registros: ${resumo.totalRegistros}`, 20, y);
      y += 10;
      doc.text(`Máquinas Utilizadas: ${resumo.maquinasUtilizadas}`, 20, y);
      y += 10;
      doc.text(`Total de Manutenções: ${resumo.totalManutencoes}`, 20, y);
      y += 10;
      doc.text(`Custo Manutenções: R$ ${resumo.custoManutencoes.toLocaleString('pt-BR')}`, 20, y);
    } else if (tipoRelatorio === 'horas-maquina') {
      const dados = calcularHorasPorMaquina();
      dados.forEach((item) => {
        doc.text(`${item.nome}: ${item.horas}h (${item.registros} registros)`, 20, y);
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    } else if (tipoRelatorio === 'horas-operador') {
      const dados = calcularHorasPorOperador();
      dados.forEach((item) => {
        doc.text(`${item.nome}: ${item.horas}h (${item.registros} registros)`, 20, y);
        y += 8;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    } else if (tipoRelatorio === 'manutencoes') {
      manutencoesFiltradas.forEach((m) => {
        doc.text(`${getMaquinaNome(m.maquinaId)} - ${m.descricao}`, 20, y);
        y += 6;
        doc.setFontSize(10);
        doc.text(
          `  ${formatarData(m.data)} | ${m.tipo} | R$ ${(m.custo || 0).toLocaleString('pt-BR')}`,
          20,
          y
        );
        doc.setFontSize(12);
        y += 10;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    }

    doc.save(`relatorio-${tipoRelatorio}-${dataInicio}-${dataFim}.pdf`);
  };

  // Exportar para Excel
  const exportarExcel = () => {
    let dados: Record<string, unknown>[] = [];

    if (tipoRelatorio === 'resumo') {
      const resumo = calcularResumo();
      dados = [
        { Métrica: 'Total de Horas', Valor: resumo.totalHoras },
        { Métrica: 'Total de Registros', Valor: resumo.totalRegistros },
        { Métrica: 'Máquinas Utilizadas', Valor: resumo.maquinasUtilizadas },
        { Métrica: 'Total de Manutenções', Valor: resumo.totalManutencoes },
        { Métrica: 'Custo Manutenções', Valor: resumo.custoManutencoes },
      ];
    } else if (tipoRelatorio === 'horas-maquina') {
      dados = calcularHorasPorMaquina().map((item) => ({
        Máquina: item.nome,
        'Horas Trabalhadas': item.horas,
        Registros: item.registros,
      }));
    } else if (tipoRelatorio === 'horas-operador') {
      dados = calcularHorasPorOperador().map((item) => ({
        Operador: item.nome,
        'Horas Trabalhadas': item.horas,
        Registros: item.registros,
      }));
    } else if (tipoRelatorio === 'manutencoes') {
      dados = manutencoesFiltradas.map((m) => ({
        Máquina: getMaquinaNome(m.maquinaId),
        Data: formatarData(m.data),
        Tipo: m.tipo,
        Descrição: m.descricao,
        Peças: m.pecas || '',
        Custo: m.custo || 0,
        Status: m.status,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio-${tipoRelatorio}-${dataInicio}-${dataFim}.xlsx`);
  };

  const getTituloRelatorio = () => {
    switch (tipoRelatorio) {
      case 'horas-maquina':
        return 'Relatório de Horas por Máquina';
      case 'horas-operador':
        return 'Relatório de Horas por Operador';
      case 'manutencoes':
        return 'Relatório de Manutenções';
      default:
        return 'Resumo Geral';
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const resumo = calcularResumo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <div className="flex gap-2">
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download size={20} />
            PDF
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-500" />
          <h2 className="font-semibold">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Relatório
            </label>
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="resumo">Resumo Geral</option>
              <option value="horas-maquina">Horas por Máquina</option>
              <option value="horas-operador">Horas por Operador</option>
              <option value="manutencoes">Manutenções</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máquina</label>
            <select
              value={maquinaId}
              onChange={(e) => setMaquinaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Todas</option>
              {maquinas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo do Relatório */}
      {tipoRelatorio === 'resumo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Horas</p>
                <p className="text-2xl font-bold">{resumo.totalHoras}h</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Registros</p>
                <p className="text-2xl font-bold">{resumo.totalRegistros}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Truck className="text-amber-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Máquinas Utilizadas</p>
                <p className="text-2xl font-bold">{resumo.maquinasUtilizadas}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wrench className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Manutenções</p>
                <p className="text-2xl font-bold">{resumo.totalManutencoes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Custo Manutenções</p>
                <p className="text-2xl font-bold">
                  R$ {resumo.custoManutencoes.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tipoRelatorio === 'horas-maquina' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Máquina</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Horas Trabalhadas
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Registros
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {calcularHorasPorMaquina().map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.nome}</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-bold">{item.horas}h</td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.registros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tipoRelatorio === 'horas-operador' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Operador
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Horas Trabalhadas
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Registros
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {calcularHorasPorOperador().map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.nome}</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-bold">{item.horas}h</td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.registros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tipoRelatorio === 'manutencoes' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Máquina</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Descrição
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Custo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {manutencoesFiltradas.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{getMaquinaNome(m.maquinaId)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatarData(m.data)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        m.tipo === 'preventiva'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.descricao}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    R$ {(m.custo || 0).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

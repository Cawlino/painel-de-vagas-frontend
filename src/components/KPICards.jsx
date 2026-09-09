import React from 'react';
import { BarChart3, MapPin, Wifi, Clock } from 'lucide-react';

const kpiConfig = [
  {
    key: 'total',
    label: 'Total de Vagas',
    icon: BarChart3,
    color: 'indigo',
    getValue: (stats) => stats.filtered || 0,
  },
  {
    key: 'maringa',
    label: 'Maringá e Região',
    icon: MapPin,
    color: 'emerald',
    getValue: (stats) => stats.totalMaringa || 0,
  },
  {
    key: 'remoto',
    label: 'Vagas Remotas',
    icon: Wifi,
    color: 'purple',
    getValue: (stats) => stats.totalRemoto || 0,
  },
];

const colorMap = {
  indigo: {
    glow: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
    icon: 'bg-indigo-500/10',
    iconText: 'text-indigo-400',
  },
  emerald: {
    glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    icon: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
  },
  purple: {
    glow: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    icon: 'bg-purple-500/10',
    iconText: 'text-purple-400',
  },
};

export default function KPICards({ stats, lastUpdate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {kpiConfig.map(({ key, label, icon: Icon, color, getValue }) => {
        const colors = colorMap[color];
        return (
          <div
            key={key}
            className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${colors.glow} rounded-full blur-3xl -mr-10 -mt-10 transition-all`} />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-medium text-sm">{label}</h3>
              <div className={`p-2 ${colors.icon} rounded-xl`}>
                <Icon className={`w-5 h-5 ${colors.iconText}`} />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{getValue(stats)}</p>
          </div>
        );
      })}

      {/* Última Sincronização */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 group-hover:bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-all" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-zinc-400 font-medium text-sm">Última Atualização</h3>
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <p className="text-lg font-medium text-white mt-3">
          {lastUpdate
            ? new Date(lastUpdate).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--/-- --:--'}
        </p>
      </div>
    </div>
  );
}

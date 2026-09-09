import React, { useState, useEffect, useMemo } from 'react';
import { Search, Briefcase, AlertCircle, MapPin, Wifi, RefreshCw } from 'lucide-react';
import JobCard from './components/JobCard';
import TabFilter from './components/TabFilter';
import KPICards from './components/KPICards';

const API_URL = '/api/vagas';

function App() {
  const [data, setData] = useState({ jobs: [], maringa: [], remoto: [], stats: {}, lastUpdate: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('todas');

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL);
      const json = await response.json();

      if (json.error && !json.jobs) throw new Error(json.error);

      setData({
        jobs: json.jobs || [],
        maringa: json.maringa || [],
        remoto: json.remoto || [],
        stats: json.stats || {},
        lastUpdate: json.lastUpdate,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar vagas. O scraper pode ainda estar coletando dados — tente novamente em alguns minutos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filtrar por tab de fonte
  const jobsByTab = useMemo(() => {
    if (activeTab === 'linkedin') return data.jobs.filter(j => j.source === 'linkedin');
    if (activeTab === 'catho') return data.jobs.filter(j => j.source === 'catho');
    return data.jobs;
  }, [data.jobs, activeTab]);

  // Filtrar por busca de texto
  const filteredJobs = useMemo(() => {
    if (!searchTerm.trim()) return jobsByTab;
    const term = searchTerm.toLowerCase();
    return jobsByTab.filter(job =>
      (job.title || '').toLowerCase().includes(term) ||
      (job.company || '').toLowerCase().includes(term) ||
      (job.location || '').toLowerCase().includes(term) ||
      (job.compatibility?.matched || []).some(kw => kw.toLowerCase().includes(term))
    );
  }, [jobsByTab, searchTerm]);

  // Separar vagas filtradas por localização
  const maringaJobs = useMemo(() => filteredJobs.filter(j => j.locationCategory === 'maringa'), [filteredJobs]);
  const remotoJobs = useMemo(() => filteredJobs.filter(j => j.locationCategory === 'remoto'), [filteredJobs]);

  // Contagens por tab
  const tabCounts = useMemo(() => ({
    todas: data.jobs.length,
    linkedin: data.jobs.filter(j => j.source === 'linkedin').length,
    'catho': data.jobs.filter(j => j.source === 'catho').length,
  }), [data.jobs]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 tracking-tight flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-indigo-400" />
              Painel de Vagas
            </h1>
            <p className="text-zinc-400 mt-2">
              Vagas filtradas do LinkedIn e Maringá.com · compatíveis com seu perfil
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full md:w-72 pl-10 pr-3 py-3 border border-zinc-800 rounded-2xl leading-5 bg-zinc-900/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-sm backdrop-blur-xl"
                placeholder="Buscar vagas, empresas, techs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchJobs}
              disabled={isLoading}
              className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-indigo-400 hover:border-zinc-700 transition-all disabled:opacity-50"
              title="Atualizar vagas"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* KPIs */}
        <KPICards stats={data.stats} lastUpdate={data.lastUpdate} />

        {/* Tab Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <TabFilter activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />
          <p className="text-xs text-zinc-500">
            Exibindo {filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} compatíveis com seu perfil
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500">Buscando vagas do LinkedIn e Maringá.com...</p>
            <p className="text-zinc-600 text-xs mt-2">A primeira busca pode levar até 30 segundos</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="w-10 h-10 mb-4 opacity-50 text-amber-500" />
            <p className="text-zinc-400 mb-2">Nenhuma vaga encontrada.</p>
            <p className="text-zinc-600 text-sm">
              {searchTerm ? 'Tente outra busca.' : 'O scraper ainda não coletou vagas. Aguarde a próxima execução ou clique em atualizar.'}
            </p>
          </div>
        ) : (
          /* Two Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Maringá e Região */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Maringá e Região</h2>
                  <p className="text-xs text-zinc-500">{maringaJobs.length} vaga{maringaJobs.length !== 1 ? 's' : ''} presenciais ou híbridas</p>
                </div>
              </div>
              <div className="space-y-4">
                {maringaJobs.length > 0 ? (
                  maringaJobs.map((job) => <JobCard key={job.id} job={job} />)
                ) : (
                  <div className="text-center py-12 text-zinc-600 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                    <MapPin className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma vaga presencial em Maringá encontrada</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Vagas Remotas */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Wifi className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Vagas Remotas</h2>
                  <p className="text-xs text-zinc-500">{remotoJobs.length} vaga{remotoJobs.length !== 1 ? 's' : ''} 100% remotas</p>
                </div>
              </div>
              <div className="space-y-4">
                {remotoJobs.length > 0 ? (
                  remotoJobs.map((job) => <JobCard key={job.id} job={job} />)
                ) : (
                  <div className="text-center py-12 text-zinc-600 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                    <Wifi className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma vaga remota encontrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

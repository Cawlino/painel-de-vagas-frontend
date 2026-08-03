import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Activity, ExternalLink, ChevronRight, BarChart3, Clock, AlertCircle } from 'lucide-react';

const MOCK_DATA = [
  { id: 1, date: '2023-10-25', company: 'Google', title: 'Senior Frontend Engineer', level: 'Senior', status: 'Entrevista' },
  { id: 2, date: '2023-10-24', company: 'Amazon', title: 'React Developer', level: 'Pleno', status: 'Enviado' },
  { id: 3, date: '2023-10-22', company: 'Netflix', title: 'UI Engineer', level: 'Senior', status: 'Rejeitado' },
  { id: 4, date: '2023-10-20', company: 'Microsoft', title: 'Software Engineer', level: 'Pleno', status: 'Teste Técnico' },
  { id: 5, date: '2023-10-18', company: 'Spotify', title: 'Web Developer', level: 'Junior', status: 'Oferta' },
];

const statusColors = {
  'Enviado': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Entrevista': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Teste Técnico': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Rejeitado': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Oferta': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // API Integration ready
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // const response = await fetch('YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL');
        // const data = await response.json();
        // setJobs(data);
        
        // Simulating network request for mock data
        setTimeout(() => {
          setJobs(MOCK_DATA);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProcesses = jobs.filter(j => j.status !== 'Rejeitado').length;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 tracking-tight flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-indigo-400" />
              Painel de Vagas
            </h1>
            <p className="text-zinc-400 mt-2">Acompanhe e gerencie suas candidaturas em tempo real.</p>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full md:w-80 pl-10 pr-3 py-3 border border-zinc-800 rounded-2xl leading-5 bg-zinc-900/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-sm backdrop-blur-xl"
              placeholder="Pesquisar vagas, empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-medium">Total de Vagas</h3>
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{jobs.length}</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-medium">Processos Ativos</h3>
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{activeProcesses}</p>
          </div>
          
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group hidden lg:block">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-purple-500/20"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-medium">Última Atualização</h3>
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-lg font-medium text-white mt-3">Hoje, 10:42 AM</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900/60">
                <tr>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data</th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Empresa</th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Vaga</th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nível</th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-5 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-transparent">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Carregando dados...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                   <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 mb-4 opacity-50" />
                        <p>Nenhuma vaga encontrada para esta pesquisa.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(job.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{job.company}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-zinc-300">{job.title}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-zinc-400">{job.level}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColors[job.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

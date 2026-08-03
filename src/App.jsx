import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Activity, ExternalLink, BarChart3, Clock, AlertCircle } from 'lucide-react';

// === COLOQUE A URL DO SEU GOOGLE APPS SCRIPT AQUI ===
const API_URL = 'https://script.google.com/macros/s/AKfycbwamZAAeYlS5fRB4zoNzyzZ4I74cnJjjdXz6CSCvYoJRhrJkS2bJIuClK7Mk03j2M-u/exec'; 

const MOCK_DATA = [
  { id: 1, date: '2023-10-25', company: 'Google', title: 'Senior Frontend Engineer', level: 'Senior', status: 'Entrevista', link: '#' },
  { id: 2, date: '2023-10-24', company: 'Amazon', title: 'React Developer', level: 'Pleno', status: 'Enviado', link: '#' },
];

function getStatusStyle(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('entrevista') || s.includes('fit cultural') || s.includes('raciocínio')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  if (s.includes('enviado') || s.includes('confirmada')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (s.includes('rejeitado') || s.includes('cancelada') || s.includes('encerrada') || s.includes('não prosseguiu')) return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (s.includes('oferta') || s.includes('aprovado')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (s.includes('alerta')) return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
}

function parseDate(dateStr) {
  if (!dateStr) return '';
  // Tenta manter o formato brasileiro se vier da planilha ou formatar ISO
  try {
    if (dateStr.includes('/')) return dateStr; 
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function App() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      
      if (API_URL === 'COLE_SUA_URL_AQUI') {
        // Se a URL ainda não foi colocada, exibe o MOCK e um aviso
        setTimeout(() => {
          setJobs(MOCK_DATA);
          setIsLoading(false);
          setError("Aviso: A API_URL não foi configurada. Exibindo dados de teste.");
          setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return;
      }

      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        // Mapeamento dinâmico das colunas exatas da sua planilha
        const mappedJobs = data.map((item, index) => ({
          id: index,
          date: parseDate(item['Data do E-mail']),
          company: item['Empresa / Plataforma'] || 'Desconhecida',
          title: item['Título da Vaga'] || '',
          level: item['Nível'] || '',
          status: item['Tipo / Status da Resposta'] || 'Em Análise',
          link: item['Link da Vaga'] || item['Link do E-mail'] || '#'
        }));
        
        // Remove itens em branco
        const validJobs = mappedJobs.filter(j => j.company !== 'Desconhecida' || j.title !== '');

        // Inverte a ordem para as mais recentes ficarem no topo (assumindo que as novas caem no fim da planilha)
        setJobs(validJobs.reverse());
        setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Erro ao carregar dados da planilha. Verifique a URL do Web App.");
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

  const rejectedKeywords = ['rejeitado', 'cancelada', 'encerrada', 'não prosseguiu'];
  const activeProcesses = jobs.filter(j => {
    const s = j.status.toLowerCase();
    return !rejectedKeywords.some(rk => s.includes(rk));
  }).length;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 tracking-tight flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-indigo-400" />
              Painel de Vagas
            </h1>
            <p className="text-zinc-400 mt-2">Acompanhe suas candidaturas automatizadas pelo Gemini Spark.</p>
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

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-medium">Total Registrado</h3>
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{jobs.length}</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-medium">Processos Ativos</h3>
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{activeProcesses}</p>
          </div>
          
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group hidden lg:block hover:border-zinc-700 transition-colors">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-purple-500/20"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-medium">Última Sincronização</h3>
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-lg font-medium text-white mt-3">Hoje, {lastUpdate || '--:--'}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800/80">
              <thead className="bg-zinc-900/80">
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
                        <p>Buscando dados da planilha...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                   <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 mb-4 opacity-50 text-amber-500" />
                        <p>Nenhuma vaga encontrada.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-zinc-400 font-mono">
                        {job.date}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{job.company}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-zinc-300">{job.title}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-zinc-400">{job.level}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getStatusStyle(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        {job.link !== '#' && job.link !== 'N/A' && (
                          <a href={job.link} target="_blank" rel="noopener noreferrer" className="inline-flex text-zinc-500 hover:text-indigo-400 transition-colors p-2 hover:bg-indigo-500/10 rounded-lg">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
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

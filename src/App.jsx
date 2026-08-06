import React, { useState, useEffect, useMemo } from 'react';
import { Search, Briefcase, Activity, ExternalLink, BarChart3, Clock, AlertCircle, ChevronUp, ChevronDown, Mail } from 'lucide-react';

const API_URL = '/api/vagas'; 

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
  if (!dateStr) return { display: '', dateObj: new Date(0) };
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      // already brazilian format DD/MM/YYYY, let's parse to Date object for sorting
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return { display: dateStr, dateObj: new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`) };
      }
      return { display: dateStr, dateObj: new Date(0) };
    }
    
    // For ISO dates like 2026-08-02T03:00:00.000Z or 2026-08-02
    const d = new Date(dateStr);
    if (isNaN(d)) return { display: dateStr, dateObj: new Date(0) };
    
    // Force UTC formatting to prevent timezone shift by 1 day
    const display = d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    return { display, dateObj: d };
  } catch {
    return { display: dateStr, dateObj: new Date(0) };
  }
}

function App() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');
  
  // Sorting state (default: date descending)
  const [sortConfig, setSortConfig] = useState({ key: 'dateObj', direction: 'desc' });

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        const mappedJobs = data.map((item, index) => {
          const parsedDate = parseDate(item['Data do E-mail']);
          return {
            id: index,
            date: parsedDate.display,
            dateObj: parsedDate.dateObj,
            company: item['Empresa / Plataforma'] || 'Desconhecida',
            title: item['Título da Vaga'] || '',
            level: item['Nível'] || '',
            status: item['Tipo / Status da Resposta'] || 'Em Análise',
            link: item['Link da Vaga'] && item['Link da Vaga'] !== 'N/A' ? item['Link da Vaga'] : null,
            emailLink: item['Link do E-mail'] && item['Link do E-mail'] !== 'N/A' ? item['Link do E-mail'] : null
          };
        });
        
        const validJobs = mappedJobs.filter(j => j.company !== 'Desconhecida' || j.title !== '');
        
        setJobs(validJobs);
        setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Erro ao carregar dados da planilha. Verifique se o Google Apps Script está ativo e com permissão 'Qualquer Pessoa'.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 inline-block ml-1" /> : <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  const sortedJobs = useMemo(() => {
    let sortableItems = [...jobs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [jobs, sortConfig]);

  const filteredJobs = sortedJobs.filter(job => 
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
      
      {/* Container Responsivo e Expandido */}
      <div className="w-full max-w-[95%] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 tracking-tight flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-indigo-400" />
              Painel de Vagas
            </h1>
            <p className="text-zinc-400 mt-2">Acompanhe suas candidaturas automatizadas pelo Gemini Spark.</p>
          </div>
          
          <div className="relative group w-full md:w-auto">
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
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('dateObj')}>
                    Data {getSortIcon('dateObj')}
                  </th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('company')}>
                    Empresa {getSortIcon('company')}
                  </th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('title')}>
                    Vaga {getSortIcon('title')}
                  </th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('level')}>
                    Nível {getSortIcon('level')}
                  </th>
                  <th scope="col" className="px-6 py-5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('status')}>
                    Status {getSortIcon('status')}
                  </th>
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
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                        {job.link && (
                          <a href={job.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zinc-500 hover:text-indigo-400 transition-colors p-2 hover:bg-indigo-500/10 rounded-lg" title="Link da Vaga">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {job.emailLink && (
                          <a href={job.emailLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zinc-500 hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-500/10 rounded-lg" title="Ver E-mail">
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {!job.link && !job.emailLink && (
                          <span className="text-zinc-600 text-xs italic">Sem links</span>
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

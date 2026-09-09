/**
 * Motor de Filtragem por Perfil — Daniel Barrionuevo Gomes
 * 
 * Filtra vagas coletadas dos scrapers baseado na compatibilidade
 * com o perfil profissional do candidato.
 */

// Keywords positivas — tecnologias e cargos compatíveis com o perfil do Daniel
const PROFILE_KEYWORDS = [
  // Frontend
  'react', 'reactjs', 'react.js', 'next', 'nextjs', 'next.js',
  'react native', 'expo', 'javascript', 'typescript', 'html', 'css',
  'tailwind', 'vite', 'redux', 'zustand', 'frontend', 'front-end', 'front end',
  // Backend
  'node', 'nodejs', 'node.js', 'express', 'nestjs',
  'python', 'django', 'fastapi', 'flask',
  'api rest', 'restful', 'api',
  // Database
  'postgresql', 'postgres', 'mysql', 'sql', 'mongodb', 'banco de dados', 'database',
  'supabase', 'drizzle',
  // DevOps & Tools
  'docker', 'git', 'github', 'ci/cd', 'linux', 'vercel', 'aws',
  // Data & BI  
  'power bi', 'powerbi', 'dax', 'etl', 'dados', 'data', 'bi',
  'analytics', 'analista de dados',
  // AI
  'inteligência artificial', 'ia', 'ai', 'machine learning', 'llm',
  'openai', 'gemini', 'agente', 'chatbot',
  // Cargos
  'desenvolvedor', 'developer', 'programador', 'engenheiro de software',
  'software engineer', 'full stack', 'fullstack', 'full-stack',
  'web developer', 'mobile developer', 'dev',
];

// Níveis aceitos
const ACCEPTED_LEVELS = [
  'júnior', 'junior', 'jr', 'pleno', 'mid', 'mid-level',
  'estagiário', 'estagiario', 'estágio', 'estagio', 'intern', 'trainee',
  'entry', 'entry-level', 'i', 'ii',
];

// Níveis rejeitados — se aparecerem exclusivamente no título
const REJECTED_LEVELS = [
  'sênior', 'senior', 'sr', 'lead', 'líder', 'lider',
  'gerente', 'manager', 'coordenador', 'coordinator',
  'diretor', 'director', 'head', 'principal', 'staff',
  'c-level', 'cto', 'ceo', 'vp',
];

// Áreas incompatíveis com o perfil
const REJECTED_AREAS = [
  'motorista', 'vendedor', 'vendas', 'atendente', 'balconista',
  'cozinheiro', 'garçom', 'auxiliar de limpeza', 'pedreiro',
  'mecânico', 'eletricista', 'soldador', 'operador de caixa',
  'enfermeiro', 'enfermagem', 'médico', 'advogado', 'contador',
  'recepcionista', 'secretária', 'porteiro', 'zelador',
  'agrônomo', 'veterinário', 'farmacêutico', 'dentista',
];

/**
 * Normaliza texto para comparação (lowercase, sem acentos)
 */
function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Calcula score de compatibilidade da vaga com o perfil
 * @param {object} job - Objeto da vaga { title, company, description, location }
 * @returns {object} { score: number (0-100), matched: string[], rejected: boolean, reason: string }
 */
export function calculateCompatibility(job) {
  const title = normalize(job.title || '');
  const description = normalize(job.description || '');
  const fullText = `${title} ${description}`;

  // Rejeitar por área incompatível
  for (const area of REJECTED_AREAS) {
    const normalArea = normalize(area);
    if (title.includes(normalArea)) {
      return { score: 0, matched: [], rejected: true, reason: `Área incompatível: ${area}` };
    }
  }

  // Verificar nível rejeitado — só rejeita se NÃO tiver nenhum nível aceito junto
  const hasRejectedLevel = REJECTED_LEVELS.some(level => {
    const normalLevel = normalize(level);
    return title.includes(normalLevel);
  });

  const hasAcceptedLevel = ACCEPTED_LEVELS.some(level => {
    const normalLevel = normalize(level);
    return title.includes(normalLevel) || fullText.includes(normalLevel);
  });

  if (hasRejectedLevel && !hasAcceptedLevel) {
    return { score: 0, matched: [], rejected: true, reason: 'Nível sênior/gerencial' };
  }

  // Calcular matches de keywords
  const matched = [];
  for (const keyword of PROFILE_KEYWORDS) {
    const normalKeyword = normalize(keyword);
    if (fullText.includes(normalKeyword)) {
      matched.push(keyword);
    }
  }

  if (matched.length === 0) {
    return { score: 0, matched: [], rejected: true, reason: 'Sem keywords compatíveis' };
  }

  // Score baseado na proporção de matches (max ~15 keywords relevantes = 100%)
  const score = Math.min(100, Math.round((matched.length / 8) * 100));

  return { score, matched, rejected: false, reason: null };
}

/**
 * Classifica a localização da vaga
 * @param {object} job - Objeto da vaga { location, title, description }
 * @returns {'maringa' | 'remoto' | 'outro'}
 */
export function classifyLocation(job) {
  const location = normalize(job.location || '');
  const title = normalize(job.title || '');
  const description = normalize(job.description || '');
  const fullText = `${location} ${title} ${description}`;

  // Detectar remoto
  const remoteKeywords = ['remoto', 'remote', 'home office', 'trabalho remoto', 'anywhere', 'a distancia'];
  const isRemote = remoteKeywords.some(kw => fullText.includes(normalize(kw)));

  // Detectar Maringá e Região
  const maringaKeywords = [
    'maringa', 'maringá', 'sarandi', 'paiçandu', 'paicandu', 'mandaguari',
    'mandaguaçu', 'mandaguacu', 'astorga', 'jandaia do sul', 'apucarana',
    'londrina', 'parana', 'paraná', 'pr,', ', pr'
  ];
  const isMaringa = maringaKeywords.some(kw => location.includes(normalize(kw)));

  // Híbrido em Maringá conta como Maringá
  if (isMaringa) return 'maringa';
  if (isRemote) return 'remoto';
  return 'outro';
}

/**
 * Filtra e classifica um array de vagas
 * @param {Array} jobs - Array de vagas brutas
 * @param {number} minScore - Score mínimo de compatibilidade (default: 15)
 * @returns {Array} Vagas filtradas e enriquecidas com score e classificação
 */
export function filterAndClassifyJobs(jobs, minScore = 15) {
  return jobs
    .map(job => {
      const compatibility = calculateCompatibility(job);
      const locationCategory = classifyLocation(job);
      return {
        ...job,
        compatibility,
        locationCategory,
      };
    })
    .filter(job => {
      // Remover rejeitadas
      if (job.compatibility.rejected) return false;
      // Remover score muito baixo
      if (job.compatibility.score < minScore) return false;
      // Remover vagas que não são de Maringá nem remotas
      if (job.locationCategory === 'outro') return false;
      return true;
    })
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}

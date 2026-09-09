/**
 * Motor de Filtragem por Perfil — Daniel Barrionuevo Gomes
 * 
 * NÃO exclui vagas de TI. Apenas calcula o score de compatibilidade
 * para exibição visual e classifica a localização (Maringá vs Remoto).
 * 
 * Só descarta vagas que NÃO são de TI (motorista, vendedor, etc).
 */

// Keywords do perfil do Daniel — usadas para calcular score de match
const PROFILE_KEYWORDS = [
  // Frontend
  'react', 'reactjs', 'react.js', 'next', 'nextjs', 'next.js',
  'react native', 'expo', 'javascript', 'typescript', 'html', 'css',
  'tailwind', 'vite', 'redux', 'zustand', 'frontend', 'front-end', 'front end',
  'angular', 'vue', 'svelte',
  // Backend
  'node', 'nodejs', 'node.js', 'express', 'nestjs',
  'python', 'django', 'fastapi', 'flask',
  'java', 'spring', 'spring boot',
  'php', 'laravel', 'ruby', 'rails', 'go', 'golang', 'rust', 'c#', '.net',
  'api rest', 'restful', 'api', 'graphql', 'microservices', 'microserviços',
  // Database
  'postgresql', 'postgres', 'mysql', 'sql', 'mongodb', 'banco de dados', 'database',
  'supabase', 'drizzle', 'prisma', 'redis', 'firebase', 'dynamodb',
  // DevOps & Tools
  'docker', 'kubernetes', 'k8s', 'git', 'github', 'gitlab', 'ci/cd', 'linux',
  'vercel', 'aws', 'azure', 'gcp', 'cloud', 'terraform', 'devops',
  // Data & BI  
  'power bi', 'powerbi', 'dax', 'etl', 'dados', 'data', 'bi',
  'analytics', 'analista de dados', 'data science', 'data engineer',
  'big data', 'spark', 'hadoop', 'tableau', 'looker',
  // AI & Automation
  'inteligência artificial', 'ia', 'ai', 'machine learning', 'ml',
  'deep learning', 'llm', 'nlp', 'chatbot', 'automação', 'automation',
  'openai', 'gemini', 'agente', 'rpa',
  // General Roles
  'desenvolvedor', 'developer', 'programador', 'engenheiro de software',
  'software engineer', 'full stack', 'fullstack', 'full-stack',
  'web developer', 'mobile developer', 'dev',
  'analista de sistemas', 'analista de ti', 'tech lead',
  'scrum', 'agile', 'ágil',
];

// Keywords que indicam que a vaga É de TI (filtro amplo)
const TI_KEYWORDS = [
  // Cargos de TI
  'desenvolvedor', 'developer', 'programador', 'engenheiro de software',
  'software engineer', 'full stack', 'fullstack', 'frontend', 'front-end',
  'backend', 'back-end', 'devops', 'dev ops', 'sre', 'devsecops',
  'analista de sistemas', 'analista de ti', 'analista de dados',
  'analista de bi', 'analista de suporte', 'analista de infraestrutura',
  'analista de segurança', 'analista de redes', 'analista de qa',
  'analista de testes', 'analista de requisitos', 'analista de negócios',
  'web developer', 'mobile developer', 'app developer',
  'data scientist', 'data engineer', 'data analyst',
  'dba', 'database administrator', 'administrador de banco',
  'scrum master', 'product owner', 'tech lead', 'líder técnico',
  'arquiteto de software', 'software architect',
  'designer ux', 'designer ui', 'ux/ui', 'ui/ux', 'ux designer',
  'qa', 'quality assurance', 'tester', 'testador',
  'suporte técnico', 'helpdesk', 'help desk', 'técnico de ti',
  'infraestrutura', 'sysadmin', 'system administrator',
  'cloud engineer', 'cloud architect', 'site reliability',
  'machine learning', 'ai engineer', 'ml engineer',
  'cybersecurity', 'segurança da informação', 'infosec',
  'product manager', 'gerente de produto',
  'automação', 'automation', 'rpa',
  'estagiário de ti', 'estagiário de desenvolvimento', 'estágio ti',
  'trainee ti', 'trainee tecnologia',
  // Tecnologias (se mencionar, provavelmente é TI)
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt',
  'node.js', 'python', 'java', 'javascript', 'typescript', 'php',
  'c#', '.net', 'ruby', 'go', 'golang', 'rust', 'swift', 'kotlin',
  'flutter', 'react native', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
  'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
  'power bi', 'tableau', 'looker', 'grafana',
  'linux', 'windows server', 'vmware', 'terraform', 'ansible',
  'git', 'github', 'gitlab', 'jenkins', 'ci/cd',
  'api', 'rest', 'graphql', 'microservices', 'microserviços',
  'html', 'css', 'tailwind', 'bootstrap', 'sass',
  'firebase', 'supabase', 'heroku', 'vercel',
  'agile', 'scrum', 'kanban', 'jira',
  'inteligência artificial', 'ia', 'ai', 'machine learning',
  'deep learning', 'nlp', 'llm', 'chatgpt', 'openai',
  'blockchain', 'web3', 'smart contract',
  'iot', 'internet das coisas', 'embedded',
  'erp', 'sap', 'totvs', 'salesforce', 'hubspot',
  'wordpress', 'drupal', 'magento', 'shopify',
  'figma', 'sketch', 'adobe xd',
  'software', 'sistema', 'aplicação', 'aplicativo', 'app',
  'tecnologia', 'technology', 'tech', 'computação', 'informática', 'ti',
];

// Áreas claramente NÃO-TI — só rejeitar se o título NÃO tiver nenhuma keyword de TI
const NON_TI_KEYWORDS = [
  'motorista', 'vendedor', 'vendedora', 'balconista', 'cozinheiro',
  'garçom', 'garçonete', 'auxiliar de limpeza', 'pedreiro',
  'mecânico', 'eletricista industrial', 'soldador', 'operador de caixa',
  'enfermeiro', 'enfermeira', 'enfermagem', 'médico', 'dentista',
  'advogado', 'contador', 'contadora', 'recepcionista', 'porteiro',
  'zelador', 'agrônomo', 'veterinário', 'farmacêutico',
  'açougueiro', 'padeiro', 'confeiteiro', 'cabeleireiro',
  'manicure', 'babá', 'diarista', 'costureira',
  'caminhoneiro', 'entregador', 'motoboy',
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
 * Verifica se a vaga é de TI
 */
function isITJob(job) {
  const title = normalize(job.title || '');
  const description = normalize(job.description || '');
  const fullText = `${title} ${description}`;

  // Se mencionar qualquer keyword de TI, é de TI
  const hasTI = TI_KEYWORDS.some(kw => fullText.includes(normalize(kw)));
  if (hasTI) return true;

  // Se NÃO mencionar TI e o título tem keyword de não-TI, rejeitar
  const hasNonTI = NON_TI_KEYWORDS.some(kw => title.includes(normalize(kw)));
  if (hasNonTI) return false;

  // Na dúvida, aceitar (pode ser uma vaga de TI com título genérico)
  return true;
}

/**
 * Calcula score de compatibilidade da vaga com o perfil do Daniel
 * Score é apenas para EXIBIÇÃO — nunca para filtrar/excluir vagas
 * @returns {object} { score: number (0-100), matched: string[] }
 */
export function calculateCompatibility(job) {
  const title = normalize(job.title || '');
  const description = normalize(job.description || '');
  const fullText = `${title} ${description}`;

  const matched = [];
  for (const keyword of PROFILE_KEYWORDS) {
    const normalKeyword = normalize(keyword);
    if (fullText.includes(normalKeyword)) {
      matched.push(keyword);
    }
  }

  // Score: 0-100 baseado na quantidade de matches
  const score = Math.min(100, Math.round((matched.length / 10) * 100));

  return { score, matched };
}

/**
 * Classifica a localização da vaga
 * @returns {'maringa' | 'remoto'}
 */
export function classifyLocation(job) {
  const location = normalize(job.location || '');
  const title = normalize(job.title || '');
  const description = normalize(job.description || '');
  const fullText = `${location} ${title} ${description}`;

  // Detectar Maringá e Região
  const maringaKeywords = [
    'maringa', 'sarandi', 'paicandu', 'paiçandu', 'mandaguari',
    'mandaguacu', 'mandaguaçu', 'astorga', 'jandaia do sul',
  ];
  const isMaringa = maringaKeywords.some(kw => location.includes(normalize(kw)));

  if (isMaringa) return 'maringa';

  // Tudo que NÃO é Maringá e região vai para Remoto/Outras
  // (inclui remoto, outras cidades, internacional, etc.)
  return 'remoto';
}

/**
 * Filtra e classifica um array de vagas
 * SÓ remove vagas que claramente NÃO são de TI.
 * Todas as vagas de TI passam e recebem score de match.
 */
export function filterAndClassifyJobs(jobs) {
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
    .filter(job => isITJob(job))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}

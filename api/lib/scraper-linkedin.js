/**
 * Scraper LinkedIn — API Guest Pública
 * 
 * Utiliza o endpoint público (sem autenticação) do LinkedIn
 * para buscar vagas de emprego por keywords e localização.
 */

import * as cheerio from 'cheerio';

const LINKEDIN_BASE_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

// User agents rotativos para evitar fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
];

// Keywords de busca baseadas no perfil do Daniel
const SEARCH_KEYWORDS = [
  'desenvolvedor full stack',
  'react developer',
  'frontend developer',
  'full stack developer',
  'software engineer',
  'desenvolvedor web',
  'node.js developer',
  'python developer',
  'desenvolvedor react',
  'analista de dados',
  'desenvolvedor junior',
  'desenvolvedor pleno',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Faz uma requisição para a API guest do LinkedIn
 * @param {string} keyword - Termo de busca
 * @param {string} location - Localização
 * @param {number} start - Offset de paginação (0, 25, 50...)
 * @returns {Array} Lista de vagas parseadas
 */
async function fetchLinkedInPage(keyword, location = 'Maringá, Paraná, Brasil', start = 0) {
  const params = new URLSearchParams({
    keywords: keyword,
    location: location,
    start: start.toString(),
    f_TPR: 'r604800', // últimos 7 dias
    sortBy: 'DD', // mais recentes primeiro
  });

  const url = `${LINKEDIN_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn(`LinkedIn returned ${response.status} for keyword "${keyword}" at start=${start}`);
      return [];
    }

    const html = await response.text();
    return parseLinkedInHTML(html);
  } catch (error) {
    console.error(`Error fetching LinkedIn for "${keyword}":`, error.message);
    return [];
  }
}

/**
 * Parseia o HTML retornado pelo endpoint guest do LinkedIn
 * @param {string} html - HTML bruto
 * @returns {Array} Vagas extraídas
 */
function parseLinkedInHTML(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $('li').each((_, element) => {
    try {
      const $el = $(element);
      
      const title = $el.find('.base-search-card__title').text().trim() ||
                    $el.find('h3.base-search-card__title').text().trim() ||
                    $el.find('[class*="job-search-card"] h3').text().trim();

      const company = $el.find('.base-search-card__subtitle a').text().trim() ||
                      $el.find('h4.base-search-card__subtitle').text().trim() ||
                      $el.find('[class*="base-search-card__subtitle"]').text().trim();

      const location = $el.find('.job-search-card__location').text().trim() ||
                       $el.find('[class*="job-search-card__location"]').text().trim();

      const link = $el.find('a.base-card__full-link').attr('href') ||
                   $el.find('a[class*="base-card__full-link"]').attr('href') ||
                   $el.find('a').first().attr('href') || '';

      const dateText = $el.find('time').attr('datetime') ||
                       $el.find('time').text().trim() || '';

      if (title && company) {
        jobs.push({
          title,
          company,
          location: location || 'Não especificada',
          link: link ? (link.startsWith('http') ? link.split('?')[0] : `https://www.linkedin.com${link.split('?')[0]}`) : '',
          date: dateText,
          source: 'linkedin',
          description: `${title} - ${company} - ${location}`,
        });
      }
    } catch (err) {
      // Skip malformed entries
    }
  });

  return jobs;
}

/**
 * Executa o scraping completo do LinkedIn
 * Busca com múltiplas keywords e remove duplicatas
 * @returns {Array} Todas as vagas encontradas (sem filtro de perfil)
 */
export async function scrapeLinkedIn() {
  console.log('[LinkedIn] Iniciando scraping...');
  const allJobs = [];
  const seenLinks = new Set();

  // Limitar a 4 keywords por execução para não sobrecarregar
  // e respeitar o tempo máximo da serverless function (10s no free tier)
  const keywordsToSearch = SEARCH_KEYWORDS.slice(0, 4);

  for (const keyword of keywordsToSearch) {
    console.log(`[LinkedIn] Buscando: "${keyword}"`);
    
    const jobs = await fetchLinkedInPage(keyword);
    
    for (const job of jobs) {
      // Deduplicar por link
      if (job.link && !seenLinks.has(job.link)) {
        seenLinks.add(job.link);
        allJobs.push(job);
      } else if (!job.link) {
        // Se não tem link, deduplicar por título + empresa
        const key = `${job.title}|${job.company}`;
        if (!seenLinks.has(key)) {
          seenLinks.add(key);
          allJobs.push(job);
        }
      }
    }

    // Delay entre requisições para evitar rate limiting (1-2 segundos)
    await delay(1500 + Math.random() * 1000);
  }

  // Também buscar vagas remotas de TI
  console.log('[LinkedIn] Buscando vagas remotas...');
  const remoteJobs = await fetchLinkedInPage('desenvolvedor', 'Brasil', 0);
  for (const job of remoteJobs) {
    const loc = (job.location || '').toLowerCase();
    if (loc.includes('remoto') || loc.includes('remote') || loc.includes('home office')) {
      const key = job.link || `${job.title}|${job.company}`;
      if (!seenLinks.has(key)) {
        seenLinks.add(key);
        allJobs.push(job);
      }
    }
  }

  console.log(`[LinkedIn] Total de vagas coletadas: ${allJobs.length}`);
  return allJobs;
}

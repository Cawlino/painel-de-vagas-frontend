/**
 * Scraper LinkedIn — API Guest Pública
 * 
 * Busca ampla de vagas de TI em Maringá e remotas no Brasil/mundo.
 * Utiliza o endpoint público (sem autenticação) do LinkedIn.
 */

import * as cheerio from 'cheerio';

const LINKEDIN_BASE_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
];

// Buscas para Maringá e região — vagas de TI locais
const MARINGA_SEARCHES = [
  { keywords: 'desenvolvedor', location: 'Maringá, Paraná, Brasil' },
  { keywords: 'developer', location: 'Maringá, Paraná, Brasil' },
  { keywords: 'analista de TI', location: 'Maringá, Paraná, Brasil' },
  { keywords: 'tecnologia da informação', location: 'Maringá, Paraná, Brasil' },
  { keywords: 'programador', location: 'Maringá, Paraná, Brasil' },
  { keywords: 'full stack', location: 'Maringá, Paraná, Brasil' },
  { keywords: 'suporte técnico TI', location: 'Maringá, Paraná, Brasil' },
];

// Buscas remotas — vagas de TI em todo o Brasil (incluindo remotas e internacionais)
const REMOTE_SEARCHES = [
  { keywords: 'desenvolvedor remoto', location: 'Brasil' },
  { keywords: 'remote developer', location: 'Brazil' },
  { keywords: 'full stack remote', location: 'Brazil' },
  { keywords: 'react developer remote', location: '' },
  { keywords: 'software engineer remote', location: '' },
  { keywords: 'python developer remoto', location: 'Brasil' },
  { keywords: 'analista de dados remoto', location: 'Brasil' },
  { keywords: 'automação TI remoto', location: 'Brasil' },
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Faz uma requisição para a API guest do LinkedIn
 */
async function fetchLinkedInPage(keyword, location = '', start = 0) {
  const params = new URLSearchParams({
    keywords: keyword,
    start: start.toString(),
    f_TPR: 'r604800', // últimos 7 dias
    sortBy: 'DD',
  });

  if (location) {
    params.set('location', location);
  }

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
      console.warn(`[LinkedIn] HTTP ${response.status} for "${keyword}" location="${location}" start=${start}`);
      return [];
    }

    const html = await response.text();
    return parseLinkedInHTML(html);
  } catch (error) {
    console.error(`[LinkedIn] Error fetching "${keyword}":`, error.message);
    return [];
  }
}

/**
 * Parseia o HTML retornado pelo endpoint guest do LinkedIn
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
 * Busca vagas de TI em Maringá + vagas remotas amplas
 */
export async function scrapeLinkedIn() {
  console.log('[LinkedIn] Iniciando scraping amplo de vagas de TI...');
  const allJobs = [];
  const seenKeys = new Set();

  function addJob(job) {
    const key = job.link || `${job.title}|${job.company}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      allJobs.push(job);
    }
  }

  // 1. Buscar vagas em Maringá e região (até 5 buscas para não estourar tempo)
  const maringaSearches = MARINGA_SEARCHES.slice(0, 5);
  for (const search of maringaSearches) {
    console.log(`[LinkedIn] Maringá: "${search.keywords}"`);
    const jobs = await fetchLinkedInPage(search.keywords, search.location);
    jobs.forEach(addJob);
    await delay(1200 + Math.random() * 800);
  }

  // 2. Buscar vagas remotas (até 4 buscas)
  const remoteSearches = REMOTE_SEARCHES.slice(0, 4);
  for (const search of remoteSearches) {
    console.log(`[LinkedIn] Remoto: "${search.keywords}"`);
    const jobs = await fetchLinkedInPage(search.keywords, search.location);
    jobs.forEach(addJob);
    await delay(1200 + Math.random() * 800);
  }

  console.log(`[LinkedIn] Total de vagas coletadas (sem duplicatas): ${allJobs.length}`);
  return allJobs;
}

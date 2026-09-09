/**
 * Scraper Maringá.com — Vagas de TI
 * 
 * Coleta vagas da seção de empregos do Maringá.com
 * na categoria Informática/TI/Internet/Telecomunicação.
 */

import * as cheerio from 'cheerio';

// URLs candidatas para scraping do Maringá.com
const MARINGA_URLS = [
  'https://www.maringa.com/empregos/area/informatica-ti-internet-e-telecomunicacao',
  'https://www.maringa.com/empregos/vagas-de-emprego/informatica-ti-internet-e-telecomunicacao',
  'https://www.maringa.com/empregos',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Tenta fazer scraping do Maringá.com
 * @returns {Array} Vagas encontradas
 */
async function fetchMaringaPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.warn(`[Maringá.com] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error(`[Maringá.com] Error fetching ${url}:`, error.message);
    return null;
  }
}

/**
 * Parseia o HTML do Maringá.com para extrair vagas
 * O site pode ter diferentes estruturas, tentamos múltiplos seletores
 */
function parseMaringaHTML(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  // Tentar múltiplos seletores comuns em sites de classificados brasileiros
  const selectors = [
    // Possíveis seletores para cards de vaga
    '.vaga-item', '.job-item', '.listing-item',
    '.classified-item', '.anuncio', '.emprego-item',
    'article.vaga', '.card-emprego', '.job-card',
    // Seletores genéricos para links de emprego
    'a[href*="/empregos/vaga/"]',
    'a[href*="/emprego/"]',
    '.list-group-item',
  ];

  // Tentar cada seletor
  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, .titulo, .title, .vaga-titulo').first().text().trim() ||
                     $el.text().trim().split('\n')[0].trim();
        const company = $el.find('.empresa, .company, .nome-empresa').first().text().trim() || 'Maringá.com';
        const link = $el.find('a').attr('href') || $el.attr('href') || '';
        const fullLink = link.startsWith('http') ? link : (link ? `https://www.maringa.com${link}` : '');

        if (title && title.length > 3 && title.length < 200) {
          jobs.push({
            title: title.substring(0, 150),
            company,
            location: 'Maringá, PR',
            link: fullLink,
            date: new Date().toISOString().split('T')[0],
            source: 'maringa.com',
            description: title,
          });
        }
      });

      if (jobs.length > 0) break; // Se encontrou vagas, para de tentar outros seletores
    }
  }

  // Fallback: tentar pegar todos os links que parecem vagas
  if (jobs.length === 0) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (
        (href.includes('/emprego') || href.includes('/vaga')) &&
        text.length > 5 && text.length < 200 &&
        !text.includes('Cadastre') && !text.includes('Login')
      ) {
        const fullLink = href.startsWith('http') ? href : `https://www.maringa.com${href}`;
        jobs.push({
          title: text.substring(0, 150),
          company: 'Maringá.com',
          location: 'Maringá, PR',
          link: fullLink,
          date: new Date().toISOString().split('T')[0],
          source: 'maringa.com',
          description: text,
        });
      }
    });
  }

  return jobs;
}

/**
 * Executa o scraping completo do Maringá.com
 * Tenta múltiplas URLs até encontrar vagas
 * @returns {Array} Vagas coletadas
 */
export async function scrapeMaringa() {
  console.log('[Maringá.com] Iniciando scraping...');

  for (const url of MARINGA_URLS) {
    console.log(`[Maringá.com] Tentando: ${url}`);
    const html = await fetchMaringaPage(url);

    if (html) {
      const jobs = parseMaringaHTML(html);
      if (jobs.length > 0) {
        console.log(`[Maringá.com] Encontradas ${jobs.length} vagas em ${url}`);
        
        // Deduplicar
        const seen = new Set();
        const unique = jobs.filter(job => {
          const key = job.link || `${job.title}|${job.company}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return unique;
      }
    }
  }

  console.warn('[Maringá.com] Nenhuma vaga encontrada em nenhuma URL. O site pode estar bloqueando requests.');
  
  // Retorna array vazio — o sistema continua funcionando só com LinkedIn
  return [];
}

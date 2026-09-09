/**
 * Scraper Catho — Vagas de TI em Maringá
 * 
 * Substitui o Maringá.com (que bloqueia requests).
 * A Catho retorna HTML acessível com vagas em elementos <article>.
 */

import * as cheerio from 'cheerio';

const CATHO_URLS = [
  'https://www.catho.com.br/vagas/ti/maringa-pr/',
  'https://www.catho.com.br/vagas/desenvolvedor/maringa-pr/',
  'https://www.catho.com.br/vagas/informatica/maringa-pr/',
  'https://www.catho.com.br/vagas/programador/maringa-pr/',
  'https://www.catho.com.br/vagas/tecnologia/maringa-pr/',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Faz fetch de uma página da Catho
 */
async function fetchCathoPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      console.warn(`[Catho] HTTP ${response.status} for ${url}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`[Catho] Error fetching ${url}:`, error.message);
    return null;
  }
}

/**
 * Parseia o HTML da Catho para extrair vagas
 * As vagas são listadas em elementos <article> com <h2> para o título
 * e links com href="/vagas/..."
 */
function parseCathoHTML(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $('article').each((_, el) => {
    try {
      const $el = $(el);

      // Título da vaga: está no <h2> dentro do article
      const title = $el.find('h2').first().text().trim();

      // Link da vaga: link que contém /vagas/ com ID numérico
      let link = '';
      $el.find('a[href*="/vagas/"]').each((_, a) => {
        const href = $(a).attr('href') || '';
        if (href.match(/\/vagas\/[^/]+\/\d+/)) {
          link = href.startsWith('http') ? href : `https://www.catho.com.br${href}`;
        }
      });

      // Empresa: geralmente está após o título em texto separado
      const fullText = $el.text().replace(/\s+/g, ' ').trim();

      // Tentar extrair empresa do texto do article
      let company = 'Catho';
      // Padrão comum: "Título EMPRESA_NAME N vagas - Cidade"
      const titleIndex = fullText.indexOf(title);
      if (titleIndex !== -1) {
        const afterTitle = fullText.slice(titleIndex + title.length).trim();
        // Pegar texto antes de "vaga" ou antes de "Maringa" ou "R$"
        const companyMatch = afterTitle.match(/^([A-ZÀ-Ú\s\-&|.]+?)(?:\s*\d+\s*vaga|\s*Maringa|\s*R\$|\s*A Combinar|\s*Enviando)/i);
        if (companyMatch && companyMatch[1].trim().length > 1) {
          company = companyMatch[1].trim();
        }
      }

      if (title && title.length > 3) {
        jobs.push({
          title,
          company,
          location: 'Maringá, PR',
          link,
          date: new Date().toISOString().split('T')[0],
          source: 'catho',
          description: `${title} - ${company} - Maringá, PR`,
        });
      }
    } catch (err) {
      // Skip malformed entries
    }
  });

  return jobs;
}

/**
 * Executa o scraping completo da Catho
 * Busca em múltiplas categorias de TI para Maringá
 */
export async function scrapeCatho() {
  console.log('[Catho] Iniciando scraping de vagas de TI em Maringá...');
  const seenKeys = new Set();
  const allJobs = [];

  for (const url of CATHO_URLS) {
    console.log(`[Catho] Buscando: ${url}`);
    const html = await fetchCathoPage(url);

    if (html) {
      const jobs = parseCathoHTML(html);
      for (const job of jobs) {
        const key = job.link || `${job.title}|${job.company}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allJobs.push(job);
        }
      }
      console.log(`[Catho] Encontradas ${jobs.length} vagas em ${url}`);
    }

    await delay(1000 + Math.random() * 500);
  }

  console.log(`[Catho] Total de vagas coletadas (sem duplicatas): ${allJobs.length}`);
  return allJobs;
}

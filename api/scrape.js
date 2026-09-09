/**
 * Scrape Orchestrator — Vercel Serverless Function
 * 
 * Executa os scrapers do LinkedIn e Catho,
 * aplica o filtro de perfil, e armazena os resultados em cache.
 * 
 * Chamado pelo cron job da Vercel (1x/dia) ou manualmente via GET /api/scrape
 */

import { scrapeLinkedIn } from './lib/scraper-linkedin.js';
import { scrapeCatho } from './lib/scraper-catho.js';
import { filterAndClassifyJobs } from './lib/profile-filter.js';

if (!globalThis.__vagasCache) {
  globalThis.__vagasCache = {
    jobs: [],
    lastUpdate: null,
    stats: { linkedin: 0, catho: 0, filtered: 0 },
  };
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  const isAuthorized = !cronSecret || 
                       authHeader === `Bearer ${cronSecret}` ||
                       req.headers['x-vercel-cron'] === '1';

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Scraper] Iniciando coleta de vagas...');
    const startTime = Date.now();

    // Executar scrapers em paralelo
    const [linkedinJobs, cathoJobs] = await Promise.all([
      scrapeLinkedIn().catch(err => {
        console.error('[Scraper] Erro no LinkedIn:', err.message);
        return [];
      }),
      scrapeCatho().catch(err => {
        console.error('[Scraper] Erro na Catho:', err.message);
        return [];
      }),
    ]);

    console.log(`[Scraper] LinkedIn: ${linkedinJobs.length} vagas brutas`);
    console.log(`[Scraper] Catho: ${cathoJobs.length} vagas brutas`);

    // Unificar todas as vagas
    const allJobs = [...linkedinJobs, ...cathoJobs];

    // Aplicar filtro (só remove não-TI) e classificação de localização
    const filteredJobs = filterAndClassifyJobs(allJobs);

    console.log(`[Scraper] Vagas após filtro: ${filteredJobs.length}`);

    // Adicionar IDs únicos
    const jobsWithIds = filteredJobs.map((job, index) => ({
      ...job,
      id: `${job.source}-${Date.now()}-${index}`,
    }));

    // Mesclar com cache existente
    const existingJobs = globalThis.__vagasCache.jobs || [];
    const mergedJobs = mergeJobs(existingJobs, jobsWithIds);

    // Atualizar cache
    globalThis.__vagasCache = {
      jobs: mergedJobs,
      lastUpdate: new Date().toISOString(),
      stats: {
        linkedin: linkedinJobs.length,
        catho: cathoJobs.length,
        filtered: mergedJobs.length,
        rawTotal: allJobs.length,
      },
    };

    const elapsed = Date.now() - startTime;
    console.log(`[Scraper] Concluído em ${elapsed}ms. Total no cache: ${mergedJobs.length}`);

    res.status(200).json({
      success: true,
      stats: globalThis.__vagasCache.stats,
      lastUpdate: globalThis.__vagasCache.lastUpdate,
      elapsed: `${elapsed}ms`,
      jobCount: mergedJobs.length,
    });
  } catch (error) {
    console.error('[Scraper] Erro fatal:', error);
    res.status(500).json({ error: 'Scraping failed', message: error.message });
  }
}

function mergeJobs(existing, newJobs) {
  const seen = new Set();
  const merged = [];

  for (const job of newJobs) {
    const key = job.link || `${job.title}|${job.company}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(job);
    }
  }

  for (const job of existing) {
    const key = job.link || `${job.title}|${job.company}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(job);
    }
  }

  return merged.slice(0, 300);
}

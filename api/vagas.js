/**
 * API de Vagas — Vercel Serverless Function
 * 
 * Lê as vagas do cache (populado pelo /api/scrape)
 * e retorna ao frontend em formato JSON.
 * 
 * Se o cache estiver vazio, executa um scraping on-demand.
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  try {
    let cache = globalThis.__vagasCache;

    // Se o cache está vazio ou muito antigo (>6h), faz scraping on-demand
    const cacheAge = cache.lastUpdate 
      ? (Date.now() - new Date(cache.lastUpdate).getTime()) / 1000 / 60 
      : Infinity;

    if (cache.jobs.length === 0 || cacheAge > 360) {
      console.log('[API /vagas] Cache vazio ou antigo, executando scraping on-demand...');
      
      try {
        const [linkedinJobs, cathoJobs] = await Promise.all([
          scrapeLinkedIn().catch(() => []),
          scrapeCatho().catch(() => []),
        ]);

        const allJobs = [...linkedinJobs, ...cathoJobs];
        const filteredJobs = filterAndClassifyJobs(allJobs);
        
        const jobsWithIds = filteredJobs.map((job, index) => ({
          ...job,
          id: `${job.source}-${Date.now()}-${index}`,
        }));

        globalThis.__vagasCache = {
          jobs: jobsWithIds,
          lastUpdate: new Date().toISOString(),
          stats: {
            linkedin: linkedinJobs.length,
            catho: cathoJobs.length,
            filtered: jobsWithIds.length,
          },
        };

        cache = globalThis.__vagasCache;
      } catch (scrapeErr) {
        console.error('[API /vagas] Erro no scraping on-demand:', scrapeErr.message);
      }
    }

    // Separar vagas por categoria de localização
    const maringaJobs = cache.jobs.filter(j => j.locationCategory === 'maringa');
    const remotoJobs = cache.jobs.filter(j => j.locationCategory === 'remoto');

    res.status(200).json({
      jobs: cache.jobs,
      maringa: maringaJobs,
      remoto: remotoJobs,
      stats: {
        ...cache.stats,
        totalMaringa: maringaJobs.length,
        totalRemoto: remotoJobs.length,
      },
      lastUpdate: cache.lastUpdate,
    });
  } catch (error) {
    console.error('[API /vagas] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs',
      jobs: [],
      maringa: [],
      remoto: [],
      stats: { linkedin: 0, catho: 0, filtered: 0, totalMaringa: 0, totalRemoto: 0 },
      lastUpdate: null,
    });
  }
}

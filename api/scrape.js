/**
 * Scrape Orchestrator — Vercel Serverless Function
 * 
 * Executa os scrapers do LinkedIn e Maringá.com,
 * aplica o filtro de perfil, e armazena os resultados em cache.
 * 
 * Chamado pelo cron job da Vercel (3x/dia) ou manualmente via GET /api/scrape
 */

import { scrapeLinkedIn } from './lib/scraper-linkedin.js';
import { scrapeMaringa } from './lib/scraper-maringa.js';
import { filterAndClassifyJobs } from './lib/profile-filter.js';

// Cache em memória (persistido entre invocações na mesma instância)
// Em produção, o cron grava aqui e o /api/vagas lê daqui
// Nota: em serverless, cada instância tem seu próprio cache,
// mas como o cron e o vagas.js rodam na mesma infraestrutura Vercel,
// usamos um store compartilhado via globalThis
if (!globalThis.__vagasCache) {
  globalThis.__vagasCache = {
    jobs: [],
    lastUpdate: null,
    stats: { linkedin: 0, maringa: 0, filtered: 0 },
  };
}

export default async function handler(req, res) {
  // Proteger contra chamadas não autorizadas em produção
  // O cron da Vercel envia um header especial
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  // Permitir sem auth em desenvolvimento ou se não configurou CRON_SECRET
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
    const [linkedinJobs, maringaJobs] = await Promise.all([
      scrapeLinkedIn().catch(err => {
        console.error('[Scraper] Erro no LinkedIn:', err.message);
        return [];
      }),
      scrapeMaringa().catch(err => {
        console.error('[Scraper] Erro no Maringá.com:', err.message);
        return [];
      }),
    ]);

    console.log(`[Scraper] LinkedIn: ${linkedinJobs.length} vagas brutas`);
    console.log(`[Scraper] Maringá.com: ${maringaJobs.length} vagas brutas`);

    // Unificar todas as vagas
    const allJobs = [...linkedinJobs, ...maringaJobs];

    // Aplicar filtro de perfil e classificação de localização
    const filteredJobs = filterAndClassifyJobs(allJobs);

    console.log(`[Scraper] Vagas após filtro de perfil: ${filteredJobs.length}`);

    // Adicionar IDs únicos
    const jobsWithIds = filteredJobs.map((job, index) => ({
      ...job,
      id: `${job.source}-${Date.now()}-${index}`,
    }));

    // Mesclar com cache existente (mantendo vagas antigas que ainda são válidas)
    const existingJobs = globalThis.__vagasCache.jobs || [];
    const mergedJobs = mergeJobs(existingJobs, jobsWithIds);

    // Atualizar cache
    globalThis.__vagasCache = {
      jobs: mergedJobs,
      lastUpdate: new Date().toISOString(),
      stats: {
        linkedin: linkedinJobs.length,
        maringa: maringaJobs.length,
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

/**
 * Mescla vagas novas com existentes, evitando duplicatas
 * Mantém no máximo 200 vagas mais recentes
 */
function mergeJobs(existing, newJobs) {
  const seen = new Set();
  const merged = [];

  // Adicionar novas primeiro (mais prioritárias)
  for (const job of newJobs) {
    const key = job.link || `${job.title}|${job.company}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(job);
    }
  }

  // Adicionar existentes que não estejam duplicadas
  for (const job of existing) {
    const key = job.link || `${job.title}|${job.company}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(job);
    }
  }

  // Limitar a 200 vagas
  return merged.slice(0, 200);
}

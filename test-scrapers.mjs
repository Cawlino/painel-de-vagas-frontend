// Script de teste para verificar o que os scrapers estão retornando
import { scrapeLinkedIn } from './api/lib/scraper-linkedin.js';
import { scrapeMaringa } from './api/lib/scraper-maringa.js';
import { filterAndClassifyJobs } from './api/lib/profile-filter.js';

async function test() {
  console.log('=== TESTANDO LINKEDIN ===');
  const linkedinJobs = await scrapeLinkedIn();
  console.log(`LinkedIn retornou: ${linkedinJobs.length} vagas`);
  linkedinJobs.slice(0, 5).forEach((j, i) => {
    console.log(`  [${i}] "${j.title}" | ${j.company} | ${j.location} | ${j.link?.slice(0, 60)}`);
  });

  console.log('\n=== TESTANDO MARINGÁ.COM ===');
  const maringaJobs = await scrapeMaringa();
  console.log(`Maringá.com retornou: ${maringaJobs.length} vagas`);
  maringaJobs.slice(0, 5).forEach((j, i) => {
    console.log(`  [${i}] "${j.title}" | ${j.company} | ${j.location}`);
  });

  console.log('\n=== APLICANDO FILTRO ===');
  const all = [...linkedinJobs, ...maringaJobs];
  const filtered = filterAndClassifyJobs(all);
  const maringa = filtered.filter(j => j.locationCategory === 'maringa');
  const remoto = filtered.filter(j => j.locationCategory === 'remoto');

  console.log(`Total bruto: ${all.length}`);
  console.log(`Após filtro TI: ${filtered.length}`);
  console.log(`Maringá e Região: ${maringa.length}`);
  console.log(`Remotas: ${remoto.length}`);

  if (maringa.length > 0) {
    console.log('\n--- VAGAS MARINGÁ ---');
    maringa.slice(0, 5).forEach((j, i) => console.log(`  [${i}] "${j.title}" | ${j.company} | match: ${j.compatibility.score}%`));
  }
  if (remoto.length > 0) {
    console.log('\n--- VAGAS REMOTAS ---');
    remoto.slice(0, 5).forEach((j, i) => console.log(`  [${i}] "${j.title}" | ${j.company} | match: ${j.compatibility.score}%`));
  }
}

test().catch(console.error);

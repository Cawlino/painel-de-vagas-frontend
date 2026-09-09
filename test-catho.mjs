import * as cheerio from 'cheerio';

async function analyzeCatho() {
  const res = await fetch('https://www.catho.com.br/vagas/ti/maringa-pr/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Look for job listing patterns
  console.log('=== SEARCHING FOR JOB ELEMENTS ===');

  // Try common selectors
  const selectors = [
    'article', '.job-card', '.search-result', '[data-job]', '[data-id]',
    'a[href*="/vagas/"]', 'a[href*="vaga"]',
    'h2', 'h3',
    '.cell_list_item', '.CustomCard', '.sc-',
    '[class*="Card"]', '[class*="card"]', '[class*="Job"]', '[class*="job"]',
    '[class*="Listing"]', '[class*="listing"]', '[class*="Result"]', '[class*="result"]',
  ];

  for (const sel of selectors) {
    const count = $(sel).length;
    if (count > 0 && count < 100) {
      console.log(`${sel}: ${count} elements`);
      if (count <= 30) {
        $(sel).each((i, el) => {
          if (i < 3) {
            const text = $(el).text().trim().replace(/\s+/g, ' ').slice(0, 120);
            const href = $(el).attr('href') || '';
            console.log(`  [${i}] text="${text}" href="${href.slice(0, 80)}"`);
          }
        });
      }
    }
  }

  // Look for JSON data embedded in the page
  console.log('\n=== SEARCHING FOR JSON DATA ===');
  const scripts = $('script');
  scripts.each((i, el) => {
    const content = $(el).html() || '';
    if (content.includes('vagas') || content.includes('jobs') || content.includes('titulo')) {
      console.log(`Script[${i}]: ${content.slice(0, 300)}...`);
    }
  });

  // Look for links that look like job listings
  console.log('\n=== JOB LINKS ===');
  let jobLinks = 0;
  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (href.includes('/vagas/') && text.length > 5 && text.length < 150 && jobLinks < 15) {
      console.log(`"${text}" -> ${href.slice(0, 100)}`);
      jobLinks++;
    }
  });
}

analyzeCatho().catch(console.error);

// Mobile nav toggle
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!isOpen));
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }
  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// Populate pages from site-data.json or inlined SITE_DATA if present
async function populateSite() {
  try {
    const data = (typeof window !== 'undefined' && window.SITE_DATA)
      ? window.SITE_DATA
      : await (async () => {
          const res = await fetch('site-data.json', { cache: 'no-cache' });
          if (!res.ok) return null;
          return res.json();
        })();
    if (!data) return;

    const nameEls = [
      document.getElementById('hero-name'),
      document.getElementById('footer-name'),
      document.querySelector('.brand'),
    ].filter(Boolean);
    nameEls.forEach((el) => (el.textContent = data.name || ''));

    const taglineEl = document.getElementById('hero-tagline');
    if (taglineEl && data.tagline) taglineEl.innerHTML = data.tagline;

    // Hero links (email + LinkedIn)
    const heroLinks = document.getElementById('hero-links');
    if (heroLinks) {
      const links = [];
      if (data.email) {
        links.push(`<a href="mailto:${data.email}"><img src="assets/img/mail.svg" alt="Email" class="icon" aria-hidden="true" />${data.email}</a>`);
      }
      // LinkedIn handle hardcoded for now per previous contact list
      links.push(`<a href="https://www.linkedin.com/in/mmchim/" target="_blank" rel="noopener"><img src="assets/img/linkedin.svg" alt="LinkedIn" class="icon" aria-hidden="true" />LinkedIn</a>`);
      // Google Scholar profile link
      links.push(`<a href="https://scholar.google.com/citations?user=zXMtGdkAAAAJ&hl=en&oi=ao" target="_blank" rel="noopener"><img src="assets/img/scholar.svg" alt="Google Scholar" class="icon" aria-hidden="true" />Google Scholar</a>`);
        // GitHub profile link
        links.push(`<a href="https://github.com/maychim" target="_blank" rel="noopener"><img src="assets/img/github.svg" alt="GitHub" class="icon" aria-hidden="true" />GitHub</a>`);
      heroLinks.innerHTML = links.join('');
    }

    // Home summary
    const summaryEl = document.getElementById('home-summary');
    if (summaryEl && data.summary) {
      // Allow HTML in summary so links render
      summaryEl.innerHTML = data.summary;
    }
    const keywordsEl = document.getElementById('home-keywords');
    if (keywordsEl && Array.isArray(data.interests)) {
      keywordsEl.innerHTML = data.interests.map((k) => `<span class="chip">${k}</span>`).join('');
    }

    // Home education
    const homeEdu = document.getElementById('home-education');
    if (homeEdu && Array.isArray(data.education) && data.education.length) {
      function splitEducationEntry(entry) {
        const str = String(entry || '');
        // Capture a year or year range (e.g., 2018 or 2021 – 2024 or 2021-2024), optionally with "Present"
        const match = str.match(/\b(\d{4}(?:\s*[-–—]\s*(?:Present|\d{4}))?)\b/i);
        if (!match) {
          return { years: '', text: str.trim() };
        }
        const years = match[1].replace(/\s+/g, ' ').trim();
        let rest = (str.slice(0, match.index) + str.slice(match.index + match[0].length));
        // Clean up leftover punctuation/spaces around the removed years
        rest = rest
          .replace(/\s*,\s*·/g, ' ·') // fix ", ·" -> " ·"
          .replace(/\s*,\s*$/g, '') // remove trailing comma
          .replace(/\s{2,}/g, ' ') // collapse spaces
          .replace(/\s*,\s*,/g, ', ') // double commas
          .replace(/\s*,\s*$/g, '')
          .trim();
        // If a comma remains before a middle dot, reduce to a single space
        rest = rest.replace(/,\s*·/g, ' ·');
        // Also remove a leading/trailing middle dot if dangling
        rest = rest.replace(/^·\s*/, '').replace(/\s*·\s*$/,'');
        // Prefer using a middle dot between degree and institution if not present but a comma exists
        // (non-destructive; leave original separators as-is otherwise)
        return { years, text: rest };
      }

      const eduHtml = data.education.map((e) => {
        const { years, text } = splitEducationEntry(e);
        const yearsHtml = years ? `<div class="edu-years">${years}</div>` : '';
        const textHtml = `<div class="edu-text">${text || String(e)}</div>`;
        return `<li><span class="edu-bullet"></span><div class="edu-item">${yearsHtml}${textHtml}</div></li>`;
      }).join('');

      homeEdu.innerHTML = `<h2>Education</h2><ul class="edu-list">${eduHtml}</ul>`;
    }

    const aboutEl = document.getElementById('about-content');
    if (aboutEl && data.about) {
      aboutEl.innerHTML = `<p>${data.about}</p>`;
    }
    const aboutExtra = document.getElementById('about-extra');
    if (aboutExtra) {
      const edu = Array.isArray(data.education) ? data.education : [];
      const interests = Array.isArray(data.interests) ? data.interests : [];
      const parts = [];
      if (edu.length) {
        parts.push(`<h2>Education</h2><ul>${edu.map((e) => `<li>${e}</li>`).join('')}</ul>`);
      }
      if (interests.length) {
        parts.push(`<h2>Interests</h2><ul>${interests.map((i) => `<li>${i}</li>`).join('')}</ul>`);
      }
      aboutExtra.innerHTML = parts.join('');
    }

    const pubList = document.getElementById('pub-list');
    if (pubList && Array.isArray(data.publications)) {
      // Emphasize the primary author "M. M. Chim" in various common formats
      function emphasizePrimaryAuthor(rawCitation) {
        if (!rawCitation) return '';
        let emphasized = String(rawCitation);
        const patterns = [
          /\bChim,\s*M\.?\s*M\.?\b/g, // "Chim, M. M."
          /\bM\.?\s*M\.?\s*Chim\b/g,   // "M. M. Chim"
          /\bChim,\s*M\.M\.\b/g,       // "Chim, M.M."
          /\bM\.M\.\s*Chim\b/g          // "M.M. Chim"
        ];
        for (const rx of patterns) {
          emphasized = emphasized.replace(rx, (m) => `<strong class="pub-author-me">${m}</strong>`);
        }
        return emphasized;
      }
      // Group by year; show title-first layout, optional metrics, and action buttons
      const items = data.publications.map((p) => {
        const isStructured = p && typeof p === 'object' && (p.authors || p.venue || p.year);
        const citation = !isStructured ? (typeof p === 'string' ? p : (p && p.title) ? p.title : '') : '';
        const url = (p && p.url) ? p.url : '';
        const isInPrep = isStructured ? /in\s*preparation/i.test(String(p.year || '')) : /in\s*preparation/i.test(citation);
        const yearMatch = isStructured ? String(p.year || '').match(/\b(20\d{2}|19\d{2})\b/) : citation.match(/\b(20\d{2}|19\d{2})\b/);
        const label = isInPrep ? 'In preparation' : (yearMatch ? yearMatch[1] : '');

        // Try to split into authors, year, title, and the remaining (journal/volume/etc.)
        let authors = '', year = '', titleText = '', rest = '';
        if (isStructured) {
          authors = p.authors || '';
          year = p.year != null ? String(p.year) : '';
          titleText = p.title || '';
          rest = p.venue || '';
        } else {
          const splitMatch = citation.match(/^(.+?)\((\d{4})\)\.\s+(.+?)\.?\s*(.*)$/);
          if (splitMatch) {
            authors = splitMatch[1].trim();
            year = splitMatch[2].trim();
            titleText = splitMatch[3].trim();
            rest = (splitMatch[4] || '').trim();
          }
        }

        const titleHtml = titleText
          ? `<div class="pub-title">${titleText}</div>`
          : '';
        // Separate authors on their own line; everything else on the next line
        const authorsHtml = authors
          ? `<div class="pub-authors">${emphasizePrimaryAuthor(authors)}</div>`
          : '';
        // Build details with italic journal name, then year in parentheses, then comma + volume/pages
        const numericYear = year && /^\d{4}$/.test(String(year));
        function splitVenue(venueStr) {
          const s = String(venueStr || '').trim();
          if (!s) return { journal: '', suffix: '' };
          const m = s.match(/^(.+?)\s+(\d.*)$/); // split before the first number-run
          if (m) {
            return { journal: m[1].trim(), suffix: (m[2] || '').trim() };
          }
          return { journal: s, suffix: '' };
        }
        let detailsText = '';
        if (rest) {
          const { journal, suffix } = splitVenue(rest);
          const journalHtml = journal ? `<em class="pub-journal">${journal}</em>` : '';
          const yearHtml = numericYear ? ` (${year})` : '';
          const suffixHtml = suffix ? `, ${suffix}` : '';
          detailsText = `${journalHtml}${yearHtml}${suffixHtml}`.trim();
        } else if (numericYear) {
          detailsText = `(${year})`;
        }
        const fullPaperBtn = url
          ? `<a class="btn btn-solid" href="${url}" target="_blank" rel="noopener noreferrer">Full Text</a>`
          : `<span class="btn btn-solid" aria-disabled="true">Full Text</span>`;
        const titleForChecks = titleText || citation;
        const isCEECarbonBriefPaper = /Neglecting\s+future\s+sporadic\s+volcanic\s+eruptions\s+underestimates\s+climate\s+uncertainty/i.test(titleForChecks);
        const isGRLPaper = /Climate\s+projections\s+very\s+likely\s+underestimate\s+future\s+volcanic\s+forcing/i.test(titleForChecks);
        const isWasteToEnergyPaper = /Waste\s*[-‑–—]?to\s*[-‑–—]?Energy/i.test(titleForChecks);

        const firstBtn = isCEECarbonBriefPaper
          ? `<a class="btn btn-outline" href="https://www.carbonbrief.org/guest-post-investigating-how-volcanic-eruptions-can-affect-climate-projections/" target="_blank" rel="noopener noreferrer">Carbon Brief</a>`
          : (isGRLPaper
              ? `<a class="btn btn-outline" href="https://www.cam.ac.uk/research/news/effect-of-volcanic-eruptions-significantly-underestimated-in-climate-projections" target="_blank" rel="noopener noreferrer">Press Release</a>`
              : (isWasteToEnergyPaper
                  ? `<a class="btn btn-outline" href="https://www.unep.org/news-and-stories/story/rummaging-through-trash-find-clean-energy" target="_blank" rel="noopener noreferrer">Press Release</a>`
                  : ''));

        const spotlightBtn = isGRLPaper
          ? `<a class="btn btn-outline" href="https://eos.org/research-spotlights/volcanoes-future-climate-effects-may-exceed-standard-estimates" target="_blank" rel="noopener noreferrer">Research Spotlight</a>`
          : '';

        // Attempt to extract DOI for metrics widgets
        let doi = '';
        if (isStructured && p.doi) {
          doi = String(p.doi);
        } else {
          try {
            const urlStr = String(url || '');
            const lower = urlStr.toLowerCase();
            const ix = lower.indexOf('doi.org/');
            if (ix !== -1) {
              doi = urlStr.slice(ix + 'doi.org/'.length).replace(/[#?].*$/, '');
            } else {
              const m = urlStr.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
              if (m) doi = m[1];
            }
          } catch {}
        }
        // Placeholder for Altmetric rectangular bar image (we'll hydrate with API after render)
        const altmetricSpan = (doi || url)
          ? `<span class="altmetric-bar-wrap" ${doi ? `data-doi="${doi}"` : ''} ${url ? `data-url="${url}"` : ''}></span>`
          : '';
        const dimensionsSpan = doi
          ? `<span class="__dimensions_badge_embed__" data-doi="${doi}" data-style="small_rectangle" data-legend="never"></span>`
          : '';

        // Inline metrics (Altmetric + Dimensions) appended at end of details line
        const metricsInline = (altmetricSpan || dimensionsSpan)
          ? `<span class="pub-metrics-inline">${altmetricSpan}${dimensionsSpan}</span>`
          : '';
        // If we couldn't split structured parts, fall back to showing the full citation on one line
        const detailsHtml = detailsText
          ? `<div class="pub-meta">${detailsText}${metricsInline}</div>`
          : (authorsHtml ? (metricsInline ? `<div class="pub-meta">${metricsInline}</div>` : '') : `<div class="pub-meta">${emphasizePrimaryAuthor(citation)}${metricsInline}</div>`);

        const citationHtml = `${titleHtml}${authorsHtml}${detailsHtml}`;

        const buttonsHtml = `
          <div class="pub-actions">
            ${firstBtn}
            ${spotlightBtn}
            ${fullPaperBtn}
          </div>`;
        const html = isInPrep ? `${citationHtml}` : `${citationHtml}${buttonsHtml}`;
        return { times: label ? [label] : [], text: html };
      });
      renderTimeline(pubList, items);
      // Hydrate Altmetric bar images using public API to get score
      try {
        const wraps = document.querySelectorAll('.altmetric-bar-wrap');
        wraps.forEach(async (wrap) => {
          const doiAttr = wrap.getAttribute('data-doi');
          const urlAttr = wrap.getAttribute('data-url');
          const apiUrl = doiAttr
            ? `https://api.altmetric.com/v1/doi/${encodeURIComponent(doiAttr)}`
            : (urlAttr ? `https://api.altmetric.com/v1/url/${encodeURIComponent(urlAttr)}` : null);
          if (!apiUrl) return;
          try {
            const res = await fetch(apiUrl, { mode: 'cors' });
            if (!res.ok) return;
            const data = await res.json();
            const score = Math.max(0, Math.round(Number(data && data.score ? data.score : 0)));
            const detailsUrl = (data && data.details_url)
              ? data.details_url
              : (doiAttr ? `https://www.altmetric.com/details.php?doi=${encodeURIComponent(doiAttr)}` : `https://www.altmetric.com/details.php?url=${encodeURIComponent(urlAttr || '')}`);
            const imgSrc = `https://d1uo4w7k31k5mn.cloudfront.net/v2_hq/${score}.png`;
            wrap.innerHTML = `<a class="altmetric-link" href="${detailsUrl}" target="_blank" rel="noopener noreferrer"><img class="altmetric-bar" src="${imgSrc}" alt="Altmetric score ${score}" width="88" height="18"/></a>`;
          } catch {}
        });
      } catch {}
      try { if (window && window.__dimensions_embed && typeof window.__dimensions_embed.addBadges === 'function') window.__dimensions_embed.addBadges(); } catch {}
    }

    const projList = null;

    const awardsList = document.getElementById('awards-list');

    const teachingList = document.getElementById('teaching-list');

    const talksList = document.getElementById('talks-list');

    const serviceList = null;

    function renderTimeline(listEl, items) {
      if (!listEl || !Array.isArray(items)) return;
      const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
      if (isMobile) {
        renderTimelineMobile(listEl, items);
        return;
      }
      const groups = new Map();
      for (const item of items) {
        if (typeof item === 'string') {
          const arr = groups.get('') || [];
          arr.push(item);
          groups.set('', arr);
          continue;
        }
        const times = Array.isArray(item.times) ? item.times : (item.time ? [item.time] : []);
        const text = item.text || '';
        if (!times.length) {
          const arr = groups.get('') || [];
          arr.push(text);
          groups.set('', arr);
        } else {
          for (const t of times) {
            const arr = groups.get(t) || [];
            arr.push(text);
            groups.set(t, arr);
          }
        }
      }
      function sortValue(label) {
        if (!label) return -Infinity;
        if (/in\s*prepar/i.test(label)) return 10000; // ensure In preparation at top
        if (/present/i.test(label)) return 9999;
        const nums = Array.from(label.matchAll(/\b(\d{4})\b/g)).map((m) => parseInt(m[1], 10));
        if (!nums.length) return -Infinity;
        return Math.max(...nums);
      }
      const labels = Array.from(groups.keys()).sort((a, b) => sortValue(b) - sortValue(a));
      const html = [];
      for (const label of labels) {
        const texts = groups.get(label) || [];
        const timeHtml = label ? `<span class="time">${label}</span>` : '';
        const listHtml = `<ul class="item-list">${texts.map((t) => `<li>${t}</li>`).join('')}</ul>`;
        html.push(`<li class="group"><div class="time-list">${timeHtml}</div><div class="item-body">${listHtml}</div></li>`);
      }
      listEl.innerHTML = html.join('');
    }

    function renderTimelineMobile(listEl, items) {
      const flat = [];
      for (const item of items) {
        if (typeof item === 'string') {
          flat.push({ label: '', text: item });
          continue;
        }
        const times = Array.isArray(item.times) ? item.times : (item.time ? [item.time] : []);
        const text = item.text || '';
        if (!times.length) {
          flat.push({ label: '', text });
        } else {
          for (const t of times) flat.push({ label: t, text });
        }
      }
      function sortValue(label) {
        if (!label) return -Infinity;
        if (/in\s*prepar/i.test(label)) return 10000;
        if (/present/i.test(label)) return 9999;
        const nums = Array.from(String(label).matchAll(/\b(\d{4})\b/g)).map((m) => parseInt(m[1], 10));
        if (!nums.length) return -Infinity;
        return Math.max(...nums);
      }
      flat.sort((a, b) => sortValue(String(b.label)) - sortValue(String(a.label)));
      const html = flat.map(({ label, text }) => {
        const timeHtml = label ? `<span class=\"time\">${label}</span>` : '';
        return `<li class=\"mobile-item\">${timeHtml}<div class=\"mobile-item-body\">${text}</div></li>`;
      }).join('');
      listEl.classList.add('timeline-mobile');
      listEl.innerHTML = html;
    }

    // projects page removed
    renderTimeline(awardsList, data.awards);
    renderTimeline(teachingList, data.teaching);
    renderTimeline(talksList, data.talks);
    // service page removed

    // Home contact removed per request

    const heroImg = document.getElementById('hero-photo');
    if (heroImg && data.photo) {
      heroImg.src = data.photo;
    }

    // Featured cards on home
    const featuredWrap = document.getElementById('featured-cards');
    if (featuredWrap && Array.isArray(data.featured)) {
      featuredWrap.innerHTML = data.featured
        .map((item) => {
          const title = item.title || '';
          const url = item.url || '#';
          const source = item.source || '';
          const image = item.image || '';
          const kicker = item.kicker || 'Link';
          const imgHtml = image
            ? `<div class="card-media"><img src="${image}" alt="${title}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"/></div>`
            : `<div class="card-media" aria-hidden="true"></div>`;
          return `
            <a class="card" href="${url}" target="_blank" rel="noopener noreferrer">
              ${imgHtml}
              <div class="card-body">
                <div class="card-kicker">${kicker}</div>
                <h3 class="card-title">${title}</h3>
                <div class="card-source">${source}</div>
              </div>
            </a>
          `;
        })
        .join('');
    }
  } catch {}
}

window.populateSite = populateSite;

(async function () { await populateSite(); })();

// Ensure mobile browsers (esp. iOS Safari) get a PNG favicon/apple-touch-icon
// by rasterizing the SVG icon at runtime. Some mobile browsers ignore SVG favicons.
(function ensurePngFavicons() {
  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    const svgPath = 'assets/img/volcano.svg';
    // Generate standard PNG sizes and an Apple touch icon
    const targets = [
      { size: 48, rel: 'icon', file: 'assets/img/favicon-48.png' },
      { size: 96, rel: 'icon', file: 'assets/img/favicon-96.png' },
      { size: 180, rel: 'apple-touch-icon', file: 'assets/img/apple-touch-icon.png' },
    ];
    fetch(svgPath, { cache: 'no-cache' })
      .then((res) => (res.ok ? res.text() : null))
      .then((svgText) => {
        if (!svgText) return;
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            targets.forEach(({ size, rel, file }) => {
              const canvas = document.createElement('canvas');
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              if (rel === 'apple-touch-icon') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);
              }
              ctx.drawImage(img, 0, 0, size, size);
              const pngUrl = canvas.toDataURL('image/png');
              // Remove existing icon links of this rel/size to avoid duplicates
              head.querySelectorAll(`link[rel='${rel}'][sizes='${size}x${size}']`).forEach((n) => n.remove());
              const link = document.createElement('link');
              link.rel = rel;
              link.sizes = `${size}x${size}`;
              link.href = pngUrl;
              head.appendChild(link);
              // Try to write to known file paths for static references (no-op on GitHub Pages)
              try { if (file) { /* placeholder; static hosting won't allow writing */ } } catch {}
            });
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      })
      .catch(() => {});
  } catch {}
})();


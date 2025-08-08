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
    if (taglineEl && data.tagline) taglineEl.textContent = data.tagline;

    // Hero links (email + LinkedIn)
    const heroLinks = document.getElementById('hero-links');
    if (heroLinks) {
      const links = [];
      if (data.email) {
        links.push(`<a href="mailto:${data.email}"><img src="assets/img/mail.svg" alt="Email" class="icon" aria-hidden="true" />${data.email}</a>`);
      }
      // LinkedIn handle hardcoded for now per previous contact list
      links.push(`<a href="https://www.linkedin.com/in/mmchim/" target="_blank" rel="noopener"><img src="assets/img/linkedin.svg" alt="LinkedIn" class="icon" aria-hidden="true" />LinkedIn</a>`);
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
      pubList.innerHTML = data.publications
        .map((p) => {
          if (typeof p === 'string') return `<li>${p}</li>`;
          if (p && typeof p === 'object' && p.title) {
            const citation = p.title;
            const url = p.url;
            if (url) {
              // Try to detect the paper title within the citation and link only that
              // Heuristic: after ") . " (year) comes the paper title sentence up to the next period
              let titleOnly = null;
              let m = citation.match(/\(\d{4}\)\.\s+(.+?)\.(?:\s|$)/);
              if (!m) {
                // Fallback heuristic: first sentence after "). "
                m = citation.match(/\)\.\s+([^\.]+)\./);
              }
              if (m && m[1]) {
                titleOnly = m[1];
                const linked = citation.replace(titleOnly, `<a href="${url}" target="_blank" rel="noopener noreferrer">${titleOnly}</a>`);
                return `<li>${linked}</li>`;
              }
              // Final fallback: link the whole citation
              return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${citation}</a></li>`;
            }
            return `<li>${citation}</li>`;
          }
          return '';
        })
        .join('');
    }

    const projList = null;

    const awardsList = document.getElementById('awards-list');

    const teachingList = document.getElementById('teaching-list');

    const talksList = document.getElementById('talks-list');

    const serviceList = null;

    function renderTimeline(listEl, items) {
      if (!listEl || !Array.isArray(items)) return;
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

    // projects page removed
    renderTimeline(awardsList, data.awards);
    renderTimeline(teachingList, data.teaching);
    renderTimeline(talksList, data.talks);
    // service page removed

    // Home contact
    const homeContact = document.getElementById('home-contact');
    if (homeContact) {
      const items = [];
      if (data.email) items.push(`<li><strong>Email</strong>: <a href="mailto:${data.email}">${data.email}</a></li>`);
      items.push(`<li><a href="https://www.linkedin.com/in/mmchim/" target="_blank" rel="noopener"><img src="assets/img/linkedin.svg" alt="LinkedIn" class="icon" />mmchim</a></li>`);
      homeContact.innerHTML = items.join('');
    }

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
            <article class="card">
              ${imgHtml}
              <div class="card-body">
                <div class="card-kicker">${kicker}</div>
                <h3 class="card-title"><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
                <div class="card-source">${source}</div>
              </div>
            </article>
          `;
        })
        .join('');
    }
  } catch {}
}

window.populateSite = populateSite;

(async function () { await populateSite(); })();


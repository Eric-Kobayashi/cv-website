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
      homeEdu.innerHTML = `<h2>Education</h2><ul>${data.education.map((e) => `<li>${e}</li>`).join('')}</ul>`;
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

    const emailEl = document.getElementById('contact-email');
    if (emailEl && data.email) {
      emailEl.textContent = data.email;
      emailEl.href = `mailto:${data.email}`;
    }
    const locEl = document.getElementById('contact-location');
    if (locEl && data.location) locEl.textContent = data.location;

    const heroImg = document.getElementById('hero-photo');
    if (heroImg && data.photo) {
      heroImg.src = data.photo;
    }
  } catch {}
}

window.populateSite = populateSite;

(async function () { await populateSite(); })();


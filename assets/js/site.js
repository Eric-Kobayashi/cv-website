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
        .map((p) => `<li>${p}</li>`)
        .join('');
    }

    const projList = document.getElementById('projects-list');
    if (projList && Array.isArray(data.projects)) {
      projList.innerHTML = data.projects.map((p) => `<li>${p}</li>`).join('');
    }

    const awardsList = document.getElementById('awards-list');
    if (awardsList && Array.isArray(data.awards)) {
      awardsList.innerHTML = data.awards.map((p) => `<li>${p}</li>`).join('');
    }

    const teachingList = document.getElementById('teaching-list');
    if (teachingList && Array.isArray(data.teaching)) {
      teachingList.innerHTML = data.teaching.map((p) => `<li>${p}</li>`).join('');
    }

    const talksList = document.getElementById('talks-list');
    if (talksList && Array.isArray(data.talks)) {
      talksList.innerHTML = data.talks.map((p) => `<li>${p}</li>`).join('');
    }

    const serviceList = document.getElementById('service-list');
    if (serviceList && Array.isArray(data.service)) {
      serviceList.innerHTML = data.service.map((p) => `<li>${p}</li>`).join('');
    }

    // Enhance all timeline lists with time extraction (avoid matching numbers like 5000)
    const timeRegex = /\b(?:19|20|21)\d{2}(?:\s*(?:–|—|-|to)\s*(?:(?:19|20|21)\d{2}|Present))?\b/g; // year or year-range

    function renderTimelineItem(li, moveTimesToFront) {
      const text = (li.textContent || '').trim();
      const times = Array.from(new Set((text.match(timeRegex) || []).map((t) => t)));
      let body = text;
      if (times.length) {
        body = text.replace(timeRegex, '').replace(/\s{2,}/g, ' ').replace(/^[,;:\s-]+/, '').trim();
      }
      li.innerHTML = '';
      const timeList = document.createElement('div');
      timeList.className = 'time-list';
      for (const t of times) {
        const span = document.createElement('span');
        span.className = 'time';
        span.textContent = t;
        timeList.appendChild(span);
      }
      li.appendChild(timeList);
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'item-body';
      bodyDiv.textContent = body;
      li.appendChild(bodyDiv);
    }

    // Talks and other timelines: render times in a left column, body aligned left with gap
    const timelineLists = [talksList, awardsList, projList, document.getElementById('teaching-list'), document.getElementById('service-list')].filter(Boolean);
    for (const list of timelineLists) {
      for (const li of Array.from(list.querySelectorAll('li'))) {
        renderTimelineItem(li, true);
      }
    }

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


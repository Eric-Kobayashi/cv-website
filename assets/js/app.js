function app() {
  return {
    navItems: [
      { key: 'home', label: 'Home' },
      { key: 'publications', label: 'Publications' },
      { key: 'awards', label: 'Awards' },
      { key: 'teaching', label: 'Teaching' },
      { key: 'talks', label: 'Talks' },
      { key: 'contact', label: 'Contact' },
    ],
    view: 'home',
    init() {
      const setFromHash = () => {
        const hash = (location.hash || '#home').replace('#', '');
        const valid = this.navItems.some((n) => n.key === hash);
        this.view = valid ? hash : 'home';
      };
      setFromHash();
      window.addEventListener('hashchange', setFromHash);
      if (typeof window.populateSite === 'function') {
        window.populateSite();
      }
    },
    goto(key) {
      const changed = this.view !== key;
      this.view = key;
      location.hash = key;
      // Force Alpine to re-render embedded objects (e.g., PDF) when switching back to a view
      if (changed && typeof window.populateSite === 'function') {
        // populateSite is idempotent and cheap
        window.populateSite();
      }
    },
    isActive(key) { return this.view === key; },
  };
}


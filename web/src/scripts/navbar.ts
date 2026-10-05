/** Navbar: seffaf -> solid gecisi, aktif bolum vurgusu, dil degistirmede hash korumasi. */
const navbar = document.querySelector<HTMLElement>('[data-navbar]');

if (navbar && !navbar.hasAttribute('data-solid')) {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    // Hero'nun alt kenari navbar'in altina inene kadar seffaf kalir.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        navbar.toggleAttribute('data-scrolled', !entry.isIntersecting);
      },
      { rootMargin: '-72px 0px 0px 0px' },
    );
    observer.observe(hero);
  } else {
    navbar.setAttribute('data-scrolled', '');
  }
}

const navLinks = new Map<string, HTMLAnchorElement>();
document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]').forEach((link) => {
  const id = link.dataset.navLink;
  if (id) navLinks.set(id, link);
});

if (navLinks.size > 0) {
  const sections = [...navLinks.keys()]
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);

  if (sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const link = navLinks.get(entry.target.id);
          if (!link) continue;
          if (entry.isIntersecting) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }
}

/** Dil degistirici: '/#koleksiyonlar' -> '/en#collections' */
const langSwitch = document.querySelector<HTMLAnchorElement>('[data-lang-switch]');

if (langSwitch) {
  const raw = langSwitch.dataset.anchorMap;
  const anchorMap: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  const baseHref = langSwitch.getAttribute('href') ?? '/';

  const syncHref = (): void => {
    const currentId = window.location.hash.slice(1);
    const mapped = anchorMap[currentId];
    langSwitch.setAttribute('href', mapped ? `${baseHref}#${mapped}` : baseHref);
  };

  syncHref();
  window.addEventListener('hashchange', syncHref);
}

/** Mobil menude bir linke tiklaninca popover kapanir. */
const menu = document.getElementById('site-menu');

menu?.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('a')) menu.hidePopover();
});

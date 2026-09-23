// dark/light theme toggle, persisted in localStorage
// (the actual attribute is set pre-paint by an inline script in <head> —
// this just wires up the button and keeps it in sync going forward)
(function () {
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;
  if (!btn) return;

  function isLight() {
    return root.getAttribute('data-theme') === 'light';
  }
  function syncIcon() {
    const icon = btn.querySelector('i');
    if (icon) icon.className = isLight() ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }

  syncIcon();

  btn.addEventListener('click', function () {
    const next = isLight() ? 'dark' : 'light';
    if (next === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncIcon();
  });
})();

// nav toggle (mobile sidebar)
(function () {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  const overlay = document.getElementById('nav-overlay');
  if (!toggle || !nav || !overlay) return;

  const icon = toggle.querySelector('i');

  function openNav() {
    nav.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    if (icon) icon.className = 'fa-solid fa-xmark';
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    nav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (icon) icon.className = 'fa-solid fa-bars';
    document.body.style.overflow = '';
  }
  toggle.addEventListener('click', function () {
    nav.classList.contains('is-open') ? closeNav() : openNav();
  });
  overlay.addEventListener('click', closeNav);
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
})();

// open the project/skill entry named in the URL hash, e.g. /projects/#pomoc
(function () {
  function openFromHash() {
    if (!location.hash) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView(); }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();

// wrap Rouge's generated code blocks with a header (language label + copy button),
// mirroring the old hand-authored .code-block markup
(function () {
  document.querySelectorAll('.highlighter-rouge').forEach(function (block) {
    const code = block.querySelector('pre.highlight code, pre.highlight');
    if (!code || block.dataset.wrapped) return;
    block.dataset.wrapped = '1';

    const langMatch = Array.from(block.classList).find(function (c) {
      return c.indexOf('language-') === 0;
    });
    const label = langMatch ? langMatch.replace('language-', '') : 'code';

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = '<span>' + label + '</span><button class="code-copy">copy</button>';
    block.insertBefore(header, block.firstChild);

    const btn = header.querySelector('.code-copy');
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(code.textContent).then(function () {
        const original = btn.textContent;
        btn.textContent = 'copied';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      });
    });
  });
})();

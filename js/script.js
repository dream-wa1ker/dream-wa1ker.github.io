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
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }  // bad %xx in the hash
    var el = document.getElementById(id);
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
      if (!navigator.clipboard) return;
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

// click an entry image to see it full size. the <dialog> is made once, on first use,
// and esc / the close button / a click outside the picture all close it
(function () {
  var zoom_buttons = document.querySelectorAll('.entry-zoom');
  if (!zoom_buttons.length || typeof HTMLDialogElement === 'undefined') return;

  var box = null;
  var big = null;

  function build() {
    box = document.createElement('dialog');
    box.className = 'lightbox';
    big = document.createElement('img');
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'lightbox-close';
    close.textContent = 'close';
    close.addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) {
      if (e.target === box) box.close();   // the backdrop counts as the dialog itself
    });
    box.appendChild(big);
    box.appendChild(close);
    document.body.appendChild(box);
  }

  zoom_buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!box) build();
      big.src = btn.dataset.full;
      big.alt = btn.dataset.alt || '';
      box.showModal();
    });
  });
})();

// accordion: opening an entry closes the others in the same list, then the page
// glides to the new entry once the heights have finished animating.
// "toggle" also fires for the url-hash opener above, so that path is covered too
(function () {
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var settle_ms = calm ? 0 : 340;   // a bit longer than the css height transition
  var timer = null;

  function glide_to(entry) {
    var top = entry.getBoundingClientRect().top;
    // only move if the title row is off screen or low down, otherwise stay put
    if (top >= 0 && top < window.innerHeight * 0.5) return;
    entry.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  }

  document.querySelectorAll('.entries .entry').forEach(function (entry) {
    entry.addEventListener('toggle', function () {
      if (!entry.open) return;
      entry.parentElement.querySelectorAll('.entry[open]').forEach(function (other) {
        if (other !== entry) other.open = false;
      });
      clearTimeout(timer);
      timer = setTimeout(function () { glide_to(entry); }, settle_ms);
    });
  });
})();

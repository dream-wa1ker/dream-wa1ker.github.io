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

// reusable split-pane card grid (skills / languages / projects)
function initSplitGrid(containerId, gridId, detailId, data) {
  const container = document.getElementById(containerId);
  const grid = document.getElementById(gridId);
  const detail = document.getElementById(detailId);
  if (!container || !grid || !detail) return;
  const detailContent = detail.querySelector('.detail-content');
  const closeBtn = detail.querySelector('.detail-close');

  function openDetail(key) {
    const item = data[key];
    if (!item) return;
    detailContent.innerHTML =
      '<div class="detail-title"><i class="' + item.iconClass + '"></i> ' + item.title + '</div>' +
      '<div class="detail-body">' + item.body + '</div>';
    detail.hidden = false;
    container.classList.add('is-split');
    grid.querySelectorAll('.card').forEach(function (c) {
      c.classList.toggle('is-active', c.dataset.key === key);
      c.setAttribute('aria-pressed', c.dataset.key === key ? 'true' : 'false');
    });
  }
  function closeDetail() {
    detail.hidden = true;
    container.classList.remove('is-split');
    grid.querySelectorAll('.card').forEach(function (c) {
      c.classList.remove('is-active');
      c.setAttribute('aria-pressed', 'false');
    });
  }
  grid.addEventListener('click', function (e) {
    const card = e.target.closest('.card');
    if (!card) return;
    const key = card.dataset.key;
    if (card.classList.contains('is-active')) closeDetail();
    else openDetail(key);
  });
  closeBtn.addEventListener('click', closeDetail);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !detail.hidden) closeDetail();
  });
}

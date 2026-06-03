(function () {
  var overlay = document.createElement('div');
  overlay.id = 'lx-overlay';
  var img = document.createElement('img');
  img.id = 'lx-img';
  img.alt = '';
  var btn = document.createElement('button');
  btn.id = 'lx-close';
  btn.setAttribute('aria-label', 'Close');
  btn.innerHTML = '&times;';
  overlay.appendChild(img);
  overlay.appendChild(btn);
  document.body.appendChild(overlay);

  function open(src, alt) {
    img.src = src;
    img.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { img.src = ''; }, 300);
  }

  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  btn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  document.querySelectorAll('.infographic-img img').forEach(function (el) {
    el.title = 'Click to enlarge';
    el.addEventListener('click', function () { open(el.src, el.alt); });
  });
})();

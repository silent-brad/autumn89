function walkerHeader(popover) {
  var name = popover.dataset.walkerName || '';
  var avatar = popover.dataset.walkerAvatar || '';
  var miles = popover.dataset.walkerMiles || '0';
  var pct = popover.dataset.walkerPct || '0';
  return '<div class="popover-header">' +
    '<img class="popover-avatar" src="' + avatar + '" alt="" />' +
    '<div class="popover-info">' +
      '<strong>' + name + '</strong>' +
      '<small class="numbers">' + miles + ' mi &middot; ' + pct + '%</small>' +
    '</div>' +
  '</div>';
}

function checkFlip(popover) {
  var cell = popover.parentElement;
  var cellRect = cell.getBoundingClientRect();
  // After showing, check actual popover rect too
  popover.classList.remove('flipped');
  var popRect = popover.getBoundingClientRect();
  if (popRect.top < 0 || cellRect.top < popRect.height + 20) {
    popover.classList.add('flipped');
  }
}

function showPopover(popover) {
  popover.classList.add('visible');
  checkFlip(popover);
}

function hidePopover(popover) {
  popover.classList.remove('visible');
}

function loadChart(popover) {
  if (popover.dataset.loaded) return;
  popover.dataset.loaded = '1';
  // Set header + loading state immediately
  popover.innerHTML = walkerHeader(popover) + '<div class="popover-chart-wrap"><span class="chart-label" style="display:block;text-align:center;padding:2rem 0;color:var(--color-text-muted)">Loading...</span></div>';
  fetch('/api/walker-chart/' + popover.dataset.walkerId)
    .then(function(r) { return r.text(); })
    .then(function(html) {
      var wrap = popover.querySelector('.popover-chart-wrap');
      if (wrap) wrap.innerHTML = html;
      if (typeof initChartTooltips === 'function') initChartTooltips(popover);
      if (popover.classList.contains('visible')) checkFlip(popover);
    });
}

function initPopovers(root) {
  root.querySelectorAll('.walker-cell').forEach(function(cell) {
    var popover = cell.querySelector('.walker-chart-popover');
    if (!popover || popover.dataset.init) return;
    popover.dataset.init = '1';
    var hideTimeout;

    function show() {
      clearTimeout(hideTimeout);
      showPopover(popover);
      loadChart(popover);
    }

    function hide() {
      hideTimeout = setTimeout(function() { hidePopover(popover); }, 100);
    }

    cell.addEventListener('mouseenter', show);
    cell.addEventListener('mouseleave', hide);
    popover.addEventListener('mouseenter', function() { clearTimeout(hideTimeout); });
    popover.addEventListener('mouseleave', hide);

    cell.addEventListener('touchstart', function(e) {
      if (e.target.closest('.chart-point-group')) return;
      e.preventDefault();
      var wasVisible = popover.classList.contains('visible');
      document.querySelectorAll('.walker-chart-popover.visible').forEach(function(p) {
        if (p !== popover) hidePopover(p);
      });
      if (wasVisible) {
        hidePopover(popover);
      } else {
        showPopover(popover);
        loadChart(popover);
      }
    });
  });
}

initPopovers(document);
document.body.addEventListener('htmx:afterSettle', function() {
  initPopovers(document);
});
document.addEventListener('touchstart', function(e) {
  if (!e.target.closest('.walker-cell')) {
    document.querySelectorAll('.walker-chart-popover.visible').forEach(function(p) {
      hidePopover(p);
    });
  }
});

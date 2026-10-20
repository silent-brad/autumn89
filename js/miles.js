function incrementMiles() {
  const input = document.getElementById("miles");
  const currentValue = parseFloat(input.value) || 0;
  input.value = (currentValue + 0.5).toFixed(1);
}

function decrementMiles() {
  const input = document.getElementById("miles");
  const currentValue = parseFloat(input.value) || 0;
  if (currentValue > 0.1) {
    input.value = (currentValue - 0.5).toFixed(1);
  }
}

function editMiles(entryId, currentMiles) {
  const row = document.getElementById("entry-row-" + entryId);
  if (!row) return;
  const cells = row.querySelectorAll("td");
  cells[1].innerHTML = `<input type="number" id="edit-miles-${entryId}" value="${currentMiles}" step="0.1" min="0.1" max="50" class="numbers edit-miles-input">`;
  cells[2].innerHTML = `
		<div class="edit-form">
			<button class="secondary outline save-btn" onclick="submitEditMiles(${entryId})">Save</button>
			<button class="secondary outline delete-btn-inline" onclick="deleteMiles(${entryId})">Delete</button>
			<button class="secondary outline cancel-btn-inline" onclick="cancelEdit(${entryId}, ${currentMiles})">Cancel</button>
		</div>`;
}

function cancelEdit(entryId, currentMiles) {
  const row = document.getElementById("entry-row-" + entryId);
  if (!row) return;
  const cells = row.querySelectorAll("td");
  cells[1].innerHTML = `<span class="miles-display-${entryId}">${currentMiles}</span>`;
  cells[2].innerHTML = `<button class="secondary outline edit-btn" onclick="editMiles(${entryId}, ${currentMiles})">Edit</button>`;
}

function submitEditMiles(entryId) {
  const miles = document.getElementById("edit-miles-" + entryId).value;
  fetch("/edit-miles", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "entry_id=" + entryId + "&miles=" + miles,
  })
    .then((r) => r.text())
    .then((html) => {
      document.getElementById("edit-response").innerHTML = html;
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
}

function deleteMiles(entryId) {
  if (!confirm("Delete this entry?")) return;
  fetch("/delete-miles", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "entry_id=" + entryId,
  })
    .then((r) => r.text())
    .then((html) => {
      document.getElementById("edit-response").innerHTML = html;
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
}

// Chart tooltips — attach directly to each point group
function initChartTooltipsIn(container) {
  if (!container) return;
  var tip = container.querySelector('.chart-tooltip');
  if (!tip) return;
  var svg = container.querySelector('svg');
  if (!svg) return;
  if (container.dataset.tooltipsInit) return;
  container.dataset.tooltipsInit = '1';

  function showTip(g) {
    var circle = g.querySelector('.chart-hit-target');
    var pt = svg.createSVGPoint();
    pt.x = parseFloat(circle.getAttribute('cx'));
    pt.y = parseFloat(circle.getAttribute('cy'));
    var screenPt = pt.matrixTransform(svg.getScreenCTM());
    var cr = container.getBoundingClientRect();
    tip.textContent = g.getAttribute('data-tooltip');
    tip.style.display = 'block';
    var tipW = tip.offsetWidth;
    var tipH = tip.offsetHeight;
    var left = screenPt.x - cr.left - tipW / 2;
    var top = screenPt.y - cr.top - tipH - 8;
    if (left < 0) left = 0;
    if (left + tipW > cr.width) left = cr.width - tipW;
    if (screenPt.y - tipH - 8 < cr.top) {
      top = screenPt.y - cr.top + 8;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  function hideTip() {
    tip.style.display = 'none';
  }

  svg.querySelectorAll('.chart-point-group').forEach(function(g) {
    g.addEventListener('mouseenter', function() { showTip(g); });
    g.addEventListener('mouseleave', hideTip);
    g.addEventListener('touchstart', function(e) {
      e.preventDefault();
      showTip(g);
    }, { passive: false });
  });
}

function initChartTooltips(root) {
  (root || document).querySelectorAll('.chart-container').forEach(initChartTooltipsIn);
}

initChartTooltips();
document.body.addEventListener('htmx:afterSwap', function(e) {
  if (e.detail.target && e.detail.target.id === 'miles-chart') {
    initChartTooltips(e.detail.target);
  }
});

// Trigger chart refresh after successful mile logging
const logResponse = document.getElementById("log-response");
if (logResponse) {
  const observer = new MutationObserver(function () {
    if (logResponse.innerHTML.includes("successfully")) {
      document.body.dispatchEvent(new Event("miles-logged"));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });
  observer.observe(logResponse, { childList: true });
}

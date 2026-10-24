import { showPopover, hidePopover } from "./popover";
import type { WalkerPopover } from "./types";

declare global {
  interface Window {
    initChartTooltips?: (root?: ParentNode) => void;
  }
}

function walkerHeader(popover: WalkerPopover): string {
  var name = popover.dataset.walkerName || "";
  var avatar = popover.dataset.walkerAvatar || "";
  var miles = popover.dataset.walkerMiles || "0";
  var pct = popover.dataset.walkerPct || "0";
  return `<div class="popover-header">
      <img class="popover-avatar" src="${avatar}" alt="" />
        <div class="popover-info">
          <strong>${name}</strong>
          <small class="numbers">${miles} mi &middot;${pct}%</small>
        </div>
      </div>`;
}

function checkFlip(popover: HTMLElement): void {
  var cell = popover.parentElement;
  var cellRect = cell.getBoundingClientRect();
  // After showing, check actual popover rect too
  popover.classList.remove("flipped");
  var popRect = popover.getBoundingClientRect();
  if (popRect.top < 0 || cellRect.top < popRect.height + 20) {
    popover.classList.add("flipped");
  }
}

function loadChart(popover: WalkerPopover): Promise<void> {
  if (popover.dataset.loaded) return;
  popover.dataset.loaded = "1";
  // Set header + loading state immediately
  popover.innerHTML =
    walkerHeader(popover) +
    `<div class="popover-chart-wrap">
      <span class="chart-label"
        style="display:block;text-align:center;padding:2rem 0;color:var(--color-text-muted)">
          Loading...
      </span>
    </div>`;
  fetch("/api/walker-chart/" + popover.dataset.walkerId)
    .then((r) => r.text())
    .then(function (html) {
      var wrap = popover.querySelector<HTMLElement>(".popover-chart-wrap");
      if (wrap) wrap.innerHTML = html;
      window.initChartTooltips?.(popover);
      if (popover.classList.contains("visible")) checkFlip(popover);
    });
}

export function initPopovers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".walker-cell").forEach(function (cell) {
    var popover = cell.querySelector<WalkerPopover>(".walker-chart-popover");
    if (!popover || popover.dataset.init) return;
    popover.dataset.init = "1";
    var hideTimeout;

    function show() {
      clearTimeout(hideTimeout);
      showPopover(popover);
      loadChart(popover);
    }

    function hide() {
      hideTimeout = setTimeout(() => hidePopover(popover), 100);
    }

    cell.addEventListener("mouseenter", show);
    cell.addEventListener("mouseleave", hide);
    popover.addEventListener("mouseenter", function () {
      clearTimeout(hideTimeout);
    });
    popover.addEventListener("mouseleave", hide);

    cell.addEventListener("touchstart", function (e) {
      if ((e.target as Element).closest(".chart-point-group")) return;
      e.preventDefault();
      var wasVisible = popover.classList.contains("visible");
      document
        .querySelectorAll<WalkerPopover>(".walker-chart-popover.visible")
        .forEach((p) => {
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

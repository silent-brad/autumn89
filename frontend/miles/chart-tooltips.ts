function showTip(
  container: HTMLElement,
  tip: HTMLElement,
  svg: SVGSVGElement,
  pt: DOMPoint,
  g: SVGGElement
): void {
  const circle = g.querySelector(
    ".chart-hit-target"
  ) as SVGCircleElement | null;

  if (!circle) return;

  pt.x = parseFloat(circle.getAttribute("cx") ?? "0");
  pt.y = parseFloat(circle.getAttribute("cy") ?? "0");

  const matrix = svg.getScreenCTM();

  if (!matrix) return;

  const screenPt = pt.matrixTransform(matrix);

  const cr = container.getBoundingClientRect();

  tip.textContent = g.getAttribute("data-tooltip") ?? "";

  tip.style.display = "block";

  const tipW = tip.offsetWidth;
  const tipH = tip.offsetHeight;

  let left = screenPt.x - cr.left - tipW / 2;
  let top = screenPt.y - cr.top - tipH - 8;

  if (left < 0) left = 0;

  if (left + tipW > cr.width) {
    left = cr.width - tipW;
  }

  if (screenPt.y - tipH - 8 < cr.top) {
    top = screenPt.y - cr.top + 8;
  }

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function initChartTooltipsIn(container: HTMLElement): void {
  const tip = container.querySelector(".chart-tooltip");

  if (!(tip instanceof HTMLElement)) return;

  const svg = container.querySelector("svg");

  if (!(svg instanceof SVGSVGElement)) return;

  if (container.dataset.tooltipsInit) return;

  container.dataset.tooltipsInit = "1";

  const pt = svg.createSVGPoint();

  svg.querySelectorAll<SVGGElement>(".chart-point-group").forEach((g) => {
    g.addEventListener("mouseenter", () => showTip(container, tip, svg, pt, g));

    g.addEventListener("mouseleave", () => {
      tip.style.display = "none";
    });

    g.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        showTip(container, tip, svg, pt, g);
      },
      { passive: false }
    );
  });
}

export function initChartTooltips(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>(".chart-container")
    .forEach(initChartTooltipsIn);
}

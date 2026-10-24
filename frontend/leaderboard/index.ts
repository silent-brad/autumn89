import { initPopovers } from "./chart-loader";
import "../miles/chart-tooltips";

initPopovers(document);
document.body.addEventListener("htmx:afterSettle", () =>
  initPopovers(document)
);
document.addEventListener("touchstart", (e) => {
  if (!(e.target as Element).closest(".walker-cell"))
    document
      .querySelectorAll<HTMLElement>(".walker-chart-popover.visible")
      .forEach((p) => p.classList.remove("visible"));
});

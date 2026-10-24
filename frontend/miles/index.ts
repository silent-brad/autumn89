import { initChartTooltips } from "./chart-tooltips";
import "./miles";

interface HtmxAfterSwapEvent extends Event {
  detail: { target: HTMLElement };
}

initChartTooltips();

document.body.addEventListener("htmx:afterSwap", (event: Event) => {
  const e = event as HtmxAfterSwapEvent;

  if (e.detail?.target?.id === "miles-chart") {
    initChartTooltips(e.detail.target);
  }
});

const logResponse = document.getElementById("log-response");

if (logResponse instanceof HTMLElement) {
  const observer = new MutationObserver(() => {
    if (logResponse.innerHTML.indexOf("successfully") !== -1) {
      document.body.dispatchEvent(new Event("miles-logged"));
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  observer.observe(logResponse, {
    childList: true,
    subtree: true,
  });
}

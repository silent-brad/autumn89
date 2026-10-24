import type { WalkerPopover } from "./types";

function checkFlip(popover: WalkerPopover): void {
  const cell = popover.parentElement;
  if (!cell) return;
  const cellRect = cell.getBoundingClientRect();
  popover.classList.remove("flipped");
  const popRect = popover.getBoundingClientRect();
  if (popRect.top < 0 || cellRect.top < popRect.height + 20) {
    popover.classList.add("flipped");
  }
}

export function showPopover(popover: WalkerPopover): void {
  popover.classList.add("visible");
  checkFlip(popover);
}

export function hidePopover(popover: WalkerPopover): void {
  popover.classList.remove("visible");
}

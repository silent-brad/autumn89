import { insertBlockquote } from "./blockquotes";

import type { FormatCommand } from "../globals";

export function formatEditor(
  editor: HTMLElement,
  command: FormatCommand
): void {
  editor.focus();

  if (command === "blockquote") {
    insertBlockquote();
    return;
  }

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  const text = range.toString();

  if (!text) return;

  const wrapper = createWrapper(command);

  wrapper.textContent = text;

  range.deleteContents();
  range.insertNode(wrapper);

  moveCursorAfter(wrapper, selection);
}

function createWrapper(command: "bold" | "italic" | "underline"): HTMLElement {
  switch (command) {
    case "bold":
      return document.createElement("strong");

    case "italic":
      return document.createElement("em");

    case "underline":
      return document.createElement("u");
  }
}

function moveCursorAfter(node: Node, selection: Selection): void {
  const range = document.createRange();

  range.setStartAfter(node);

  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
}

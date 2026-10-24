export function insertEditorLink(editor: HTMLElement): void {
  editor.focus();

  const url = prompt("Enter the link URL:");
  if (!url) return;

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  const link = document.createElement("a");

  link.href = url;
  link.textContent = range.toString() || url;

  range.deleteContents();
  range.insertNode(link);

  const newRange = document.createRange();

  newRange.setStartAfter(link);
  newRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(newRange);
}

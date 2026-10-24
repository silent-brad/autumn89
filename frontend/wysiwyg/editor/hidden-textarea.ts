export function updateHiddenTextarea(): void {
  const editor = document.getElementById(
    "text_content_editor"
  ) as HTMLElement | null;

  const textarea = document.getElementById(
    "text_content"
  ) as HTMLTextAreaElement | null;

  if (!editor || !textarea) return;

  const clone = editor.cloneNode(true) as HTMLElement;

  clone.querySelectorAll("blockquote cite").forEach((cite) => {
    if (cite.textContent === "Attribution") cite.remove();
  });

  textarea.value = clone.innerHTML;
}

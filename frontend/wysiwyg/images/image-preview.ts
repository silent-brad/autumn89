import { imageStore } from "./image-store";

let dragSrcIndex: number | null = null;

export function renderImagePreview(
  container: HTMLElement,
  hint: HTMLElement
): void {
  container.innerHTML = "";
  const files = imageStore.getFiles();
  if (files.length === 0) {
    hint.style.display = "none";
    return;
  }
  hint.style.display = "block";

  files.forEach((file: File, index: number) => {
    const thumb = document.createElement("div");
    thumb.className = "image-preview-thumb";
    thumb.setAttribute("data-index", String(index));
    thumb.setAttribute("draggable", "true");

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.className = "image-preview-img";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "image-preview-remove";
    removeBtn.innerHTML = "&times;";
    removeBtn.title = "Remove image";
    removeBtn.addEventListener("click", () => {
      imageStore.remove(index);
      renderImagePreview(container, hint);
    });

    // Drag events
    thumb.addEventListener("dragstart", (e: DragEvent) => {
      dragSrcIndex = index;
      thumb.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    thumb.addEventListener("dragend", () => {
      thumb.classList.remove("dragging");
      dragSrcIndex = null;
    });
    thumb.addEventListener("dragover", (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      thumb.classList.add("drag-over");
    });
    thumb.addEventListener("dragleave", () => {
      thumb.classList.remove("drag-over");
    });
    thumb.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();
      thumb.classList.remove("drag-over");
      if (dragSrcIndex === null || dragSrcIndex === index) return;
      imageStore.reorder(dragSrcIndex, index);
      renderImagePreview(container, hint);
    });

    thumb.appendChild(img);
    thumb.appendChild(removeBtn);
    container.appendChild(thumb);
  });
}

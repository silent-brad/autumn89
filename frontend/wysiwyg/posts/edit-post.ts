import { formatEditor } from "../editor/format";
import { insertEditorLink } from "../editor/links";
import { attachBlockquoteHandling } from "../editor/blockquotes";
import { imageStore } from "../images/image-store";

const originalPosts = new Map<number, string>();
let dragSrcIndex: number | null = null;

function getEditor(postId: number): HTMLElement | null {
  return document.getElementById(`edit-editor-${postId}`);
}

export function cancelEditPost(postId: number): void {
  const card = document.getElementById(`post-card-${postId}`);

  const original = originalPosts.get(postId);

  if (!card || !original) return;

  card.innerHTML = original;

  originalPosts.delete(postId);
}

window.editFormatText = (postId, command) => {
  const editor = getEditor(postId)!;
  formatEditor(editor, command);
};

window.editInsertLink = (postId) => {
  const editor = getEditor(postId)!;
  insertEditorLink(editor);
};

function toggleImageDelete(thumb: HTMLElement): void {
  thumb.classList.toggle("marked-for-delete");
}

function updateImageIndexes(preview: HTMLElement): void {
  Array.from(preview.children).forEach((child, index) => {
    (child as HTMLElement).dataset.index = String(index);
  });
}

function attachDragHandlers(thumb: HTMLElement, preview: HTMLElement): void {
  thumb.addEventListener("dragstart", (event: DragEvent) => {
    dragSrcIndex = Number(thumb.dataset.index);
    thumb.classList.add("dragging");
    event.dataTransfer?.setData("text/plain", String(dragSrcIndex));
    event.dataTransfer.effectAllowed = "move";
  });
  thumb.addEventListener("dragend", () => {
    thumb.classList.remove("dragging");
    dragSrcIndex = null;
  });
  thumb.addEventListener("dragover", (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    thumb.classList.add("drag-over");
  });
  thumb.addEventListener("dragleave", () =>
    thumb.classList.remove("drag-over")
  );
  thumb.addEventListener("drop", (event: DragEvent) => {
    event.preventDefault();
    thumb.classList.remove("drag-over");
    const targetIndex = Number(thumb.dataset.index);
    if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;

    const dragged = preview.children[dragSrcIndex];
    const target = preview.children[targetIndex];
    preview.insertBefore(
      dragged,
      dragSrcIndex < targetIndex ? target.nextSibling : target
    );
    updateImageIndexes(preview);
  });
}

function renderNewImages(preview: HTMLElement, hint: HTMLElement): void {
  preview.querySelectorAll(".new-image").forEach((image) => image.remove());

  imageStore.getFiles().forEach((file, fileIndex) => {
    const thumb = document.createElement("div");
    thumb.className = "image-preview-thumb new-image";
    thumb.dataset.fileIndex = String(fileIndex);
    thumb.draggable = true;

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.className = "image-preview-img";
    img.draggable = false;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "image-preview-remove";
    remove.innerHTML = "&times;";
    remove.title = "Remove image";
    remove.addEventListener("click", () => {
      imageStore.remove(Number(thumb.dataset.fileIndex));
      renderNewImages(preview, hint);
    });

    thumb.append(img, remove);
    attachDragHandlers(thumb, preview);
    preview.appendChild(thumb);
  });

  updateImageIndexes(preview);
  hint.style.display = preview.children.length ? "block" : "none";
}

export function editPost(postId: number): void {
  const card = document.getElementById(`post-card-${postId}`);
  if (!card) return;

  originalPosts.set(postId, card.innerHTML);
  const text = card.querySelector(".post-text-content")?.innerHTML ?? "";
  const images = Array.from(card.querySelectorAll<HTMLElement>(".post-image"));

  const editor = document.createElement("div");
  editor.id = `edit-editor-${postId}`;
  editor.className = "edit-editor";
  editor.contentEditable = "true";
  editor.setAttribute("placeholder", "Post text here...");
  editor.innerHTML = text;

  const form = document.createElement("div");
  form.className = "edit-post-form";
  form.innerHTML = `
    <div class="edit-toolbar">
      <button type="button" class="toolbar-btn" data-format="bold">B</button>
      <button type="button" class="toolbar-btn" data-format="italic">I</button>
      <button type="button" class="toolbar-btn" data-format="underline">U</button>
      <button type="button" class="toolbar-btn" data-format="blockquote">&ldquo;</button>
      <button type="button" class="toolbar-btn edit-link-button">Link</button>
    </div>`;
  form.appendChild(editor);

  const preview = document.createElement("div");
  preview.className = "image-preview-list edit-image-preview-list";
  const hint = document.createElement("div");
  hint.className = "text-muted image-preview-hint";
  hint.textContent = "Click an image to mark it for removal.";
  hint.style.display = images.length ? "block" : "none";

  images.forEach((image, index) => {
    const thumb = document.createElement("div");
    thumb.className = "image-preview-thumb existing-image";
    thumb.dataset.imageId = image.dataset.imageId ?? "";
    thumb.dataset.index = String(index);
    thumb.draggable = true;
    const source = image.querySelector("img");
    if (source) {
      const img = source.cloneNode(true) as HTMLImageElement;
      img.className = "image-preview-img";
      img.draggable = false;
      thumb.appendChild(img);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "image-preview-remove";
    remove.innerHTML = "&times;";
    remove.title = "Mark image for removal";
    remove.addEventListener("click", () => toggleImageDelete(thumb));
    thumb.appendChild(remove);

    attachDragHandlers(thumb, preview);
    preview.appendChild(thumb);
  });

  const inputLabel = document.createElement("label");
  inputLabel.textContent = "Add pictures (optional, max 5)";
  inputLabel.htmlFor = `edit-images-${postId}`;
  inputLabel.insertAdjacentHTML(
    "beforeend",
    `<input type="file" id="edit-images-${postId}" accept="image/*" multiple>`
  );

  const actions = document.createElement("div");
  actions.className = "edit-actions";
  actions.innerHTML = `
    <button type="button" class="secondary outline cancel-edit">Cancel</button>
    <button type="button" class="secondary outline delete">Delete</button>
    <button type="button" class="save-edit">Save</button>`;

  form.querySelectorAll<HTMLButtonElement>(".toolbar-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.format as
        | "bold"
        | "italic"
        | "underline"
        | "blockquote";
      formatEditor(editor, command);
    });
  });
  form
    .querySelector(".edit-link-button")
    ?.addEventListener("click", () => insertEditorLink(editor));
  attachBlockquoteHandling(editor);
  actions
    .querySelector(".cancel-edit")
    ?.addEventListener("click", () => cancelEditPost(postId));
  actions
    .querySelector(".delete")
    ?.addEventListener("click", () => window.deletePost(postId));
  actions
    .querySelector(".save-edit")
    ?.addEventListener("click", () => submitEditPost(postId));

  card.replaceChildren(form, preview, hint, inputLabel, actions);

  const input = inputLabel.querySelector("input");
  if (input) {
    input.addEventListener("change", () => {
      imageStore.clear();
      imageStore.add(Array.from(input.files ?? []).slice(0, 5 - images.length));
      renderNewImages(preview, hint);
      input.value = "";
    });
  }
}

export async function submitEditPost(postId: number): Promise<void> {
  const editor = getEditor(postId)!;

  const formData = new FormData();

  formData.append("post_id", String(postId));

  formData.append("text_content", editor.innerHTML);

  const removeIds: string[] = [];

  const card = document.getElementById(`post-card-${postId}`)! as HTMLElement;

  card.querySelectorAll(".existing-image.marked-for-delete").forEach((el) => {
    const id = el.getAttribute("data-image-id")!;
    removeIds.push(id);
  });

  if (removeIds.length > 0) {
    formData.append("remove_image_ids", removeIds.join(","));
  }

  card.querySelectorAll<HTMLElement>(".new-image").forEach((image, index) => {
    const fileIndex = Number(image.dataset.fileIndex);
    const file = imageStore.getFiles()[fileIndex];
    if (file) formData.append("image_" + index, file);
  });

  fetch("/edit-post", {
    method: "POST",
    body: formData,
  }).then((r) => {
    if (r.redirected) {
      window.location.href = r.url;
    } else {
      window.location.reload();
    }
  });
}

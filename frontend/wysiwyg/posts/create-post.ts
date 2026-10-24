import { imageStore } from "../images/image-store";
import { renderImagePreview } from "../images/image-preview";
import { updateHiddenTextarea } from "../editor/hidden-textarea";

export function setupImagePreview(): void {
  const input = document.getElementById("images") as HTMLInputElement | null;
  const container = document.getElementById("image-preview-list");
  const hint = document.getElementById("image-preview-hint");
  if (!input || !container || !hint) return;

  // clear any previous state when form re-initializes
  imageStore.clear();
  container.innerHTML = "";
  hint.style.display = "none";

  input.addEventListener("change", () => {
    const newFiles = Array.from(input.files ?? []);
    if (newFiles.length === 0) return;

    // Add new files, cap at 5
    const remaining = 5 - imageStore.getFiles().length;
    imageStore.add(newFiles.slice(0, remaining));

    renderImagePreview(container, hint);

    // reset input so same file can be chosen again if removed
    input.value = "";
  });
}

export function setupFormHandling(): void {
  const postForm = document.getElementById("post-form");
  if (!postForm) return;
  postForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateHiddenTextarea();

    var formData = new FormData();
    var textContent = document.getElementById(
      "text_content"
    ) as HTMLTextAreaElement | null;
    if (textContent) formData.append("text_content", textContent.value);

    imageStore.getFiles().forEach((file: File, i: number) =>
      formData.append("image_" + i, file)
    );

    fetch("/post", {
      method: "POST",
      body: formData,
    })
      .then((r: Response) => {
        var redirect = r.headers.get("HX-Redirect");
        if (redirect) {
          window.location.href = redirect;
          return null;
        }
        return r.text();
      })
      .then((text: string | null) => {
        if (text === null) return;
        if (!text || text.trim().length === 0) {
          window.location.reload();
          return;
        }
        var responseDiv = document.getElementById(
          "post-response"
        )! as HTMLElement;
        responseDiv.innerHTML = text;
        responseDiv.style.display = "block";
        setTimeout(() => {
          responseDiv.style.display = "none";
        }, 5000);
      })
      .catch(() => window.location.reload());
  });
}

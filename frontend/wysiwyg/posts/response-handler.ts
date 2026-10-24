export function setupPostResponseHandlers(): void {
  if (window._wysiwygPostHandlerBound) return;
  window._wysiwygPostHandlerBound = true;
  document.addEventListener("htmx:afterSwap", (event: Event) => {
    const htmxEvent = event as HtmxEvent;
    if (htmxEvent.detail.target.id === "post-response") {
      var responseDiv = htmxEvent.detail.target;
      responseDiv.style.display = "block";
      if (responseDiv.innerHTML.includes("successfully")) {
        var editor = document.getElementById(
          "text_content_editor"
        )! as HTMLElement;
        var hiddenTextarea = document.getElementById(
          "text_content"
        )! as HTMLTextAreaElement;
        var imageInput = document.getElementById("images")! as HTMLInputElement;
        var previewContainer = document.getElementById(
          "image-preview-list"
        )! as HTMLElement;
        var hint = document.getElementById(
          "image-preview-hint"
        )! as HTMLElement;

        if (editor) editor.innerHTML = "";
        if (hiddenTextarea) hiddenTextarea.value = "";
        if (imageInput) imageInput.value = "";
        if (previewContainer) previewContainer.innerHTML = "";
        if (hint) hint.style.display = "none";
        imageStore.clear();

        setTimeout(() => window.location.reload(), 1000);
      } else {
        setTimeout(() => {
          responseDiv.style.display = "none";
        }, 5000);
      }
    }
  });

  document.addEventListener("htmx:responseError", (event: Event) => {
    const htmxEvent = event as HtmxEvent;
    if (htmxEvent.detail.target && htmxEvent.detail.target.id === "post-response") {
      event.preventDefault();
      var responseDiv = htmxEvent.detail.target;
      var status = htmxEvent.detail.xhr.status;
      var msg = "An error occurred while creating your post.";
      if (status === 401) msg = "You must be logged in to create posts.";
      else if (status === 409) msg = "A conflict occurred. Please try again.";
      else if (status === 413)
        msg = "The uploaded file is too large. Maximum size is 10MB.";
      else if (status === 415)
        msg =
          "The uploaded file type is not supported. Please use JPG, PNG, GIF, or WebP.";
      else if (status >= 500)
        msg = "A server error occurred. Please try again later.";
      responseDiv.innerHTML = `<p style="color: var(--error-oklch-500);">${msg}</p>`;
      responseDiv.style.display = "block";
      setTimeout(() => {
        responseDiv.style.display = "none";
      }, 5000);
    }
  });
}
import { imageStore } from "../images/image-store";

interface HtmxEvent extends Event {
  detail: {
    target: HTMLElement;
    xhr: XMLHttpRequest;
  };
}

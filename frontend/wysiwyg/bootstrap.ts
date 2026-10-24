import { setupImagePreview, setupFormHandling } from "./posts/create-post";
import { setupPostResponseHandlers } from "./posts/response-handler";

function initialize(): void {
  if (document.getElementById("post-form")) {
    setupImagePreview();
    setupFormHandling();
  }
  setupPostResponseHandlers();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
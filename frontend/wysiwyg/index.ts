import { updateHiddenTextarea } from "./editor/hidden-textarea";

import { formatEditor } from "./editor/format";

import { insertEditorLink } from "./editor/links";

import { setupImagePreview } from "./posts/create-post";

import { editPost, cancelEditPost, submitEditPost } from "./posts/edit-post";

import { deletePost } from "./posts/delete-post";

window.updateHiddenTextarea = updateHiddenTextarea;

window.formatText = (command) => {
  const editor = document.getElementById("text_content_editor")! as HTMLElement;

  formatEditor(editor, command);
};

window.insertLink = () => {
  const editor = document.getElementById("text_content_editor")! as HTMLElement;
  insertEditorLink(editor);
};

window.editPost = editPost;

window.deletePost = deletePost;

window.cancelEditPost = cancelEditPost;

window.submitEditPost = submitEditPost;

import "./bootstrap";

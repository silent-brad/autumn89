// WYSIWYG Editor Scripts

if (document.getElementById("text_content_editor")) {
  initWysiwygEditor();
} else {
  document.addEventListener("DOMContentLoaded", function () {
    initWysiwygEditor();
  });
}

document.body.addEventListener("htmx:afterSettle", function (event) {
  if (
    event.detail.elt.querySelector &&
    event.detail.elt.querySelector("#text_content_editor")
  ) {
    initWysiwygEditor();
  }
});

function initWysiwygEditor() {
  window.formatText = formatText;
  window.insertLink = insertLink;
  window.updateHiddenTextarea = updateHiddenTextarea;

  var editor = document.getElementById("text_content_editor");
  if (editor) {
    setupFormHandling();
    setupBlockquoteHandling();
    setupImagePreview();
  }

  setupPostResponseHandlers();
}

// ---- Image Preview / Delete / Reorder for Create Form ----

var imageFileList = [];
var dragSrcIndex = null;

function setupImagePreview() {
  var input = document.getElementById("images");
  var container = document.getElementById("image-preview-list");
  var hint = document.getElementById("image-preview-hint");
  if (!input || !container) return;

  // clear any previous state when form re-initializes
  imageFileList = [];
  container.innerHTML = "";
  hint.style.display = "none";

  input.addEventListener("change", function () {
    var newFiles = Array.from(input.files);
    if (newFiles.length === 0) return;

    // Add new files, cap at 4
    var remaining = 4 - imageFileList.length;
    var toAdd = newFiles.slice(0, remaining);
    imageFileList = imageFileList.concat(toAdd);

    renderImagePreview(container, hint);

    // reset input so same file can be chosen again if removed
    input.value = "";
  });
}

function renderImagePreview(container, hint) {
  container.innerHTML = "";
  if (imageFileList.length === 0) {
    hint.style.display = "none";
    return;
  }
  hint.style.display = "block";

  imageFileList.forEach(function (file, index) {
    var thumb = document.createElement("div");
    thumb.className = "image-preview-thumb";
    thumb.setAttribute("data-index", index);
    thumb.setAttribute("draggable", "true");

    var img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.className = "image-preview-img";

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "image-preview-remove";
    removeBtn.innerHTML = "&times;";
    removeBtn.title = "Remove image";
    removeBtn.addEventListener("click", function () {
      imageFileList.splice(index, 1);
      renderImagePreview(container, hint);
    });

    // Drag events
    thumb.addEventListener("dragstart", function (e) {
      dragSrcIndex = index;
      thumb.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    thumb.addEventListener("dragend", function () {
      thumb.classList.remove("dragging");
      dragSrcIndex = null;
    });
    thumb.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      thumb.classList.add("drag-over");
    });
    thumb.addEventListener("dragleave", function () {
      thumb.classList.remove("drag-over");
    });
    thumb.addEventListener("drop", function (e) {
      e.preventDefault();
      thumb.classList.remove("drag-over");
      if (dragSrcIndex === null || dragSrcIndex === index) return;
      var moved = imageFileList.splice(dragSrcIndex, 1)[0];
      imageFileList.splice(index, 0, moved);
      renderImagePreview(container, hint);
    });

    thumb.appendChild(img);
    thumb.appendChild(removeBtn);
    container.appendChild(thumb);
  });
}

// ---- Form handling: build FormData manually so previews are included ----

function setupFormHandling() {
  var postForm = document.getElementById("post-form");
  if (postForm) {
    postForm.addEventListener("submit", function (event) {
      event.preventDefault();
      updateHiddenTextarea();

      var formData = new FormData();
      var textContent = document.getElementById("text_content");
      if (textContent) formData.append("text_content", textContent.value);

      imageFileList.forEach(function (file, i) {
        formData.append("image_" + i, file);
      });

      fetch("/post", {
        method: "POST",
        body: formData,
      })
        .then(function (r) {
          var redirect = r.headers.get("HX-Redirect");
          if (redirect) {
            window.location.href = redirect;
            return null;
          }
          return r.text();
        })
        .then(function (text) {
          if (text === null) return;
          if (!text || text.trim().length === 0) {
            window.location.reload();
            return;
          }
          var responseDiv = document.getElementById("post-response");
          if (responseDiv) {
            responseDiv.innerHTML = text;
            responseDiv.style.display = "block";
            setTimeout(function () {
              responseDiv.style.display = "none";
            }, 5000);
          }
        })
        .catch(function () {
          window.location.reload();
        });
    });
  }
}

// ---- Post response handlers ----

function setupPostResponseHandlers() {
  if (window._wysiwygPostHandlerBound) return;
  window._wysiwygPostHandlerBound = true;
  document.addEventListener("htmx:afterSwap", function (event) {
    if (event.detail.target.id === "post-response") {
      var responseDiv = event.detail.target;
      responseDiv.style.display = "block";
      if (responseDiv.innerHTML.includes("successfully")) {
        var editor = document.getElementById("text_content_editor");
        var hiddenTextarea = document.getElementById("text_content");
        var imageInput = document.getElementById("images");
        var previewContainer = document.getElementById("image-preview-list");
        var hint = document.getElementById("image-preview-hint");

        if (editor) editor.innerHTML = "";
        if (hiddenTextarea) hiddenTextarea.value = "";
        if (imageInput) imageInput.value = "";
        if (previewContainer) previewContainer.innerHTML = "";
        if (hint) hint.style.display = "none";
        imageFileList = [];

        setTimeout(function () {
          window.location.reload();
        }, 1000);
      } else {
        setTimeout(function () {
          responseDiv.style.display = "none";
        }, 5000);
      }
    }
  });

  document.addEventListener("htmx:responseError", function (event) {
    if (event.detail.target && event.detail.target.id === "post-response") {
      event.preventDefault();
      var responseDiv = event.detail.target;
      var status = event.detail.xhr.status;
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
      responseDiv.innerHTML =
        '<p style="color: var(--error-oklch-500);">' + msg + "</p>";
      responseDiv.style.display = "block";
      setTimeout(function () {
        responseDiv.style.display = "none";
      }, 5000);
    }
  });
}

// ---- Text formatting helpers ----

function updateHiddenTextarea() {
  var editor = document.getElementById("text_content_editor");
  var hiddenTextarea = document.getElementById("text_content");
  if (editor && hiddenTextarea) {
    var clone = editor.cloneNode(true);
    clone.querySelectorAll("blockquote cite").forEach(function (cite) {
      if (cite.textContent === "Attribution") cite.remove();
    });
    hiddenTextarea.value = clone.innerHTML;
  }
}

function formatText(command) {
  var editor = document.getElementById("text_content_editor");
  if (!editor) return;
  editor.focus();

  if (command === "blockquote") {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var range = selection.getRangeAt(0);
      var selectedText = range.toString();

      var blockquote = document.createElement("blockquote");
      var quoteBody = document.createElement("p");
      quoteBody.textContent = selectedText || "Quote text here";
      var cite = document.createElement("cite");
      cite.textContent = "Attribution";
      cite.setAttribute("contenteditable", "true");
      blockquote.appendChild(quoteBody);
      blockquote.appendChild(cite);

      range.deleteContents();
      range.insertNode(blockquote);

      var textNode = quoteBody.firstChild;
      if (textNode) {
        var newRange = document.createRange();
        newRange.selectNodeContents(textNode);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  } else {
    try {
      if (document.execCommand) {
        document.execCommand(command, false, null);
      } else {
        handleModernFormatting(command);
      }
    } catch (e) {
      console.warn("Formatting command failed:", command, e);
      handleModernFormatting(command);
    }
  }
  editor.focus();
}

function handleModernFormatting(command) {
  var selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  var range = selection.getRangeAt(0);
  var selectedText = range.toString();
  if (!selectedText) return;

  var element;
  switch (command) {
    case "bold":
      element = document.createElement("strong");
      break;
    case "italic":
      element = document.createElement("em");
      break;
    case "underline":
      element = document.createElement("u");
      break;
    default:
      return;
  }

  element.textContent = selectedText;
  range.deleteContents();
  range.insertNode(element);

  selection.removeAllRanges();
  var newRange = document.createRange();
  newRange.setStartAfter(element);
  newRange.collapse(true);
  selection.addRange(newRange);
}

function insertLink() {
  var editor = document.getElementById("text_content_editor");
  if (!editor) return;
  editor.focus();

  var url = prompt("Enter the link URL:");
  if (url) {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var range = selection.getRangeAt(0);
      var selectedText = range.toString();

      var link = document.createElement("a");
      link.href = url;
      link.textContent = selectedText || url;

      range.deleteContents();
      range.insertNode(link);

      selection.removeAllRanges();
      var newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.collapse(true);
      selection.addRange(newRange);
    }
    editor.focus();
  }
}

// ---- Blockquote handling ----

function setupBlockquoteHandling() {
  var editor = document.getElementById("text_content_editor");
  if (!editor) return;
  attachBlockquoteHandling(editor);
}

function attachBlockquoteHandling(editor) {
  var lastEnterTime = 0;
  var doubleEnterThreshold = 500;

  editor.addEventListener("keydown", function (event) {
    var selection = window.getSelection();
    var range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range) return;

    var currentNode = range.startContainer;
    var blockquote = null;
    var cite = null;

    while (currentNode && currentNode !== editor) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        if (currentNode.tagName === "CITE") cite = currentNode;
        if (currentNode.tagName === "BLOCKQUOTE") {
          blockquote = currentNode;
          break;
        }
      }
      currentNode = currentNode.parentNode;
    }

    if (!blockquote) {
      lastEnterTime = 0;
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      var citeEl = blockquote.querySelector("cite");
      var bodyEl = blockquote.querySelector("p");
      if (cite && bodyEl) {
        selectNodeContents(bodyEl);
      } else if (citeEl) {
        selectNodeContents(citeEl);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();

      if (cite) {
        escapeBlockquote(blockquote);
      } else {
        var currentTime = Date.now();
        var isDoubleEnter = currentTime - lastEnterTime < doubleEnterThreshold;
        lastEnterTime = currentTime;

        if (isDoubleEnter) {
          var citeEl2 = blockquote.querySelector("cite");
          if (citeEl2) selectNodeContents(citeEl2);
        } else {
          var br = document.createElement("br");
          range.insertNode(br);
          var newRange = document.createRange();
          newRange.setStartAfter(br);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    } else {
      lastEnterTime = 0;
    }
  });
}

function selectNodeContents(node) {
  var sel = window.getSelection();
  var r = document.createRange();
  r.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(r);
}

function escapeBlockquote(blockquote) {
  var cite = blockquote.querySelector("cite");
  if (cite && cite.textContent === "Attribution") {
    cite.remove();
  }

  var newP = document.createElement("p");
  newP.innerHTML = "<br>";

  if (blockquote.nextSibling) {
    blockquote.parentNode.insertBefore(newP, blockquote.nextSibling);
  } else {
    blockquote.parentNode.appendChild(newP);
  }

  var newRange = document.createRange();
  newRange.setStart(newP, 0);
  newRange.collapse(true);
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(newRange);
}

// ---- Post actions (edit, delete) ----

function deletePost(postId) {
  if (!confirm("Delete this post?")) return;
  fetch("/delete-post", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "post_id=" + postId,
  }).then(function (r) {
    var redirect = r.headers.get("HX-Redirect");
    if (redirect) {
      window.location.href = redirect;
    } else if (r.ok) {
      window.location.reload();
    }
  });
}

var originalPosts = {};

function cancelEditPost(postId) {
  var card = document.getElementById("post-card-" + postId);
  if (!card || !originalPosts[postId]) return;
  card.innerHTML = originalPosts[postId];
  delete originalPosts[postId];
}

function editPost(postId) {
  var card = document.getElementById("post-card-" + postId);
  if (!card) return;

  originalPosts[postId] = card.innerHTML;

  var textEl = card.querySelector(".post-text-content");
  var imageEls = card.querySelectorAll(".post-image");
  var currentText = textEl ? textEl.innerHTML : "";

  var linkSvg =
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
    '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

  var html =
    '<form id="edit-post-form-' +
    postId +
    '" enctype="multipart/form-data">' +
    '<input type="hidden" name="post_id" value="' +
    postId +
    '">' +
    '<div class="edit-toolbar">' +
    '<button type="button" onclick="editFormatText(' +
    postId +
    ', \'bold\')" title="Bold" class="toolbar-btn" data-format="bold">B</button>' +
    '<button type="button" onclick="editFormatText(' +
    postId +
    ', \'italic\')" title="Italic" class="toolbar-btn" data-format="italic">I</button>' +
    '<button type="button" onclick="editFormatText(' +
    postId +
    ', \'underline\')" title="Underline" class="toolbar-btn" data-format="underline">U</button>' +
    '<button type="button" onclick="editFormatText(' +
    postId +
    ', \'blockquote\')" title="Quote" class="toolbar-btn">&ldquo;</button>' +
    '<button type="button" onclick="editInsertLink(' +
    postId +
    ')" title="Link" class="toolbar-btn">' +
    linkSvg +
    "</button>" +
    "</div>" +
    '<div id="edit-editor-' +
    postId +
    '" class="edit-editor" contenteditable="true" placeholder="Post text here...">' +
    currentText +
    "</div>";

  if (imageEls.length > 0) {
    for (var i = 0; i < imageEls.length; i++) {
      var imgEl = imageEls[i].querySelector("img");
      var imgId = imageEls[i].getAttribute("data-image-id");
      if (imgEl) {
        html +=
          '<div class="edit-image-preview">' +
          '<img src="' +
          imgEl.getAttribute("src") +
          '" alt="Current image">' +
          '<label class="edit-remove-image">' +
          '<input type="checkbox" class="edit-remove-image-checkbox" value="' +
          (imgId || "") +
          '"> Remove image' +
          "</label></div>";
      }
    }
  }

  html +=
    "<label>" +
    (imageEls.length > 0
      ? "Add more pictures (optional)"
      : "Add pictures (optional, max 4)") +
    '<input type="file" id="edit-images-' +
    postId +
    '" name="images" accept="image/*" multiple>' +
    "</label>" +
    '<div class="edit-actions">' +
    '<button type="button" class="secondary outline" onclick="cancelEditPost(' +
    postId +
    ')">Cancel</button>' +
    '<button type="button" class="secondary outline delete" onclick="deletePost(' +
    postId +
    ')">Delete</button>' +
    '<button type="button" onclick="submitEditPost(' +
    postId +
    ')">Save</button>' +
    "</div></form>";

  card.innerHTML = html;

  var editEditor = document.getElementById("edit-editor-" + postId);
  if (editEditor) {
    attachBlockquoteHandling(editEditor);
  }
}

function editFormatText(postId, command) {
  var editor = document.getElementById("edit-editor-" + postId);
  if (!editor) return;
  editor.focus();

  if (command === "blockquote") {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var range = selection.getRangeAt(0);
      var selectedText = range.toString();

      var blockquote = document.createElement("blockquote");
      var quoteBody = document.createElement("p");
      quoteBody.textContent = selectedText || "Quote text here";
      var cite = document.createElement("cite");
      cite.textContent = "Attribution";
      cite.setAttribute("contenteditable", "true");
      blockquote.appendChild(quoteBody);
      blockquote.appendChild(cite);

      range.deleteContents();
      range.insertNode(blockquote);

      var textNode = quoteBody.firstChild;
      if (textNode) {
        var newRange = document.createRange();
        newRange.selectNodeContents(textNode);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  } else {
    try {
      document.execCommand(command, false, null);
    } catch (e) {
      console.warn("Formatting command failed:", command, e);
    }
  }
  editor.focus();
}

function editInsertLink(postId) {
  var editor = document.getElementById("edit-editor-" + postId);
  if (!editor) return;
  editor.focus();

  var url = prompt("Enter the link URL:");
  if (url) {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var range = selection.getRangeAt(0);
      var selectedText = range.toString();

      var link = document.createElement("a");
      link.href = url;
      link.textContent = selectedText || url;

      range.deleteContents();
      range.insertNode(link);

      selection.removeAllRanges();
      var newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.collapse(true);
      selection.addRange(newRange);
    }
    editor.focus();
  }
}

function submitEditPost(postId) {
  var editor = document.getElementById("edit-editor-" + postId);
  if (!editor) return;

  var formData = new FormData();
  formData.append("post_id", postId);
  formData.append("text_content", editor.innerHTML);

  var removeIds = [];
  var checkboxes = document.querySelectorAll(
    "#post-card-" + postId + " .edit-remove-image-checkbox",
  );
  checkboxes.forEach(function (cb) {
    if (cb.checked) removeIds.push(cb.value);
  });
  if (removeIds.length > 0) {
    formData.append("remove_image_ids", removeIds.join(","));
  }

  var fileInput = document.getElementById("edit-images-" + postId);
  if (fileInput && fileInput.files.length > 0) {
    for (var i = 0; i < fileInput.files.length; i++) {
      formData.append("images", fileInput.files[i]);
    }
  }

  fetch("/edit-post", {
    method: "POST",
    body: formData,
  }).then(function (r) {
    if (r.redirected) {
      window.location.href = r.url;
    } else {
      window.location.reload();
    }
  });
}

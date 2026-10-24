export function attachBlockquoteHandling(editor: HTMLElement): void {
  var lastEnterTime = 0;
  var doubleEnterThreshold = 500;

  editor.addEventListener("keydown", function (event) {
    var selection = window.getSelection()!;
    var range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range) return;

    var currentNode = range.startContainer;
    var blockquote = null;
    var cite = null;

    while (currentNode && currentNode !== editor) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as Element;
        if (element.tagName === "CITE") cite = element;
        if (element.tagName === "BLOCKQUOTE") {
          blockquote = element as HTMLElement;
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

export function insertBlockquote(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const blockquote = document.createElement("blockquote");
  const body = document.createElement("p");
  body.textContent = range.toString() || "Quote text here";
  const cite = document.createElement("cite");
  cite.textContent = "Attribution";
  cite.contentEditable = "true";
  blockquote.append(body, cite);
  range.deleteContents();
  range.insertNode(blockquote);
  selectNodeContents(body);
}

export function escapeBlockquote(blockquote: HTMLElement): void {
  var cite = blockquote.querySelector("cite");
  if (cite && cite.textContent === "Attribution") cite.remove();

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
  var selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(newRange);
}

export function selectNodeContents(node: Node): void {
  var sel = window.getSelection()!;
  var r = document.createRange();
  r.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(r);
}

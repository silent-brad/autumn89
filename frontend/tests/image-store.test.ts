import { ImageStore } from "../wysiwyg/images/image-store";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function testImageStore(): void {
  const store = new ImageStore();
  const first = new File(["first"], "first.png");
  const second = new File(["second"], "second.png");

  store.add([first, second]);
  assert(store.getFiles().length === 2, "adds files");
  store.reorder(0, 1);
  assert(store.getFiles()[0] === second, "reorders files");
  store.remove(0);
  assert(store.getFiles()[0] === first, "removes files");
  store.clear();
  assert(store.getFiles().length === 0, "clears files");
}

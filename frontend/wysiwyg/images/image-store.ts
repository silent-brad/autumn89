export class ImageStore {
  private files: File[] = [];

  getFiles(): File[] {
    return this.files;
  }

  clear(): void {
    this.files = [];
  }

  add(files: File[]): void {
    this.files.push(...files);
  }

  remove(index: number): void {
    this.files.splice(index, 1);
  }

  reorder(from: number, to: number): void {
    const file = this.files.splice(from, 1)[0];

    this.files.splice(to, 0, file);
  }
}

export const imageStore = new ImageStore();

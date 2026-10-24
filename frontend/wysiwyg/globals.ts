export {};

declare global {
  interface Window {
    formatText(command: FormatCommand): void;
    insertLink(): void;
    updateHiddenTextarea(): void;

    deletePost(postId: number): void;
    editPost(postId: number): void;
    cancelEditPost(postId: number): void;
    submitEditPost(postId: number): void;
    editFormatText(postId: number, command: FormatCommand): void;
    editInsertLink(postId: number): void;
    _wysiwygPostHandlerBound?: boolean;
  }
}

export type FormatCommand = "bold" | "italic" | "underline" | "blockquote";

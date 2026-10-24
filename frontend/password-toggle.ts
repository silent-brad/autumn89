export function togglePasswordVisibility(inputId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const toggle = input?.parentElement?.querySelector(".password-toggle");
  const icon = toggle?.querySelector(".toggle-icon");
  if (!input || !icon) return;

  input.type = input.type === "password" ? "text" : "password";
}

declare global {
  interface Window {
    togglePasswordVisibility(inputId: string): void;
  }
}

window.togglePasswordVisibility = togglePasswordVisibility;

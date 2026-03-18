export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

// Sanitizacion de campos para prevenir XSS y ataques de injección
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Se necesitan al menos 8 caracteres";
  if (!/\d/.test(password)) return "Debe contener al menos un número";
  if (!/[a-zA-Z]/.test(password)) return "Debe contener al menos una letra";
  return null;
}

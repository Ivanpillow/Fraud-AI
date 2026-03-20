export function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
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

export function validateFullName(fullName: string): string | null {
  const cleanName = fullName.trim().replace(/\s+/g, " ");

  if (!cleanName) return "Nombre completo es requerido";
  if (cleanName.length < 2) return "Nombre completo demasiado corto";
  if (cleanName.length > 120) return "Nombre completo demasiado largo";

  return null;
}

export function validateRoleName(roleName: string): string | null {
  const cleanRoleName = roleName.trim().replace(/\s+/g, " ");

  if (!cleanRoleName) return "Nombre del rol es requerido";
  if (cleanRoleName.length < 2) return "Nombre del rol demasiado corto";
  if (cleanRoleName.length > 50) return "Nombre del rol demasiado largo";
  if (!/^[A-Za-zÀ-ÿ0-9 _\-]+$/.test(cleanRoleName)) return "Nombre del rol inválido";

  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Se necesitan al menos 8 caracteres";
  if (password.length > 72) return "Contraseña demasiado larga";
  if (!/\d/.test(password)) return "Debe contener al menos un número";
  if (!/[a-zA-Z]/.test(password)) return "Debe contener al menos una letra";
  return null;
}

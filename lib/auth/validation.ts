/**
 * Authentication Input Validation Helper
 *
 * Enforces strict, server-side validation for login inputs before
 * making any network requests to authentication services.
 * Safe, sanitized errors are returned without exposing internal exceptions.
 */

export interface ValidationResult<T> {
  isValid: boolean;
  value?: T;
  error?: string;
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { isValid: false, error: "Email address is required." };
  }

  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, error: "Email address is required." };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: "Email address is too long." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address." };
  }

  return { isValid: true, value: trimmed };
}

export function validatePassword(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { isValid: false, error: "Password is required." };
  }

  if (!input) {
    return { isValid: false, error: "Password is required." };
  }

  if (input.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters." };
  }

  if (input.length > 256) {
    return { isValid: false, error: "Password is too long." };
  }

  return { isValid: true, value: input };
}

export interface LoginValidationResult {
  isValid: boolean;
  email?: string;
  password?: string;
  error?: string;
}

export function validateLoginInput(formData: FormData): LoginValidationResult {
  const emailInput = formData.get("email");
  const passwordInput = formData.get("password");

  const emailResult = validateEmail(emailInput);
  if (!emailResult.isValid || !emailResult.value) {
    return { isValid: false, error: emailResult.error ?? "Invalid email address." };
  }

  const passwordResult = validatePassword(passwordInput);
  if (!passwordResult.isValid || !passwordResult.value) {
    return { isValid: false, error: passwordResult.error ?? "Invalid password." };
  }

  return {
    isValid: true,
    email: emailResult.value,
    password: passwordResult.value,
  };
}

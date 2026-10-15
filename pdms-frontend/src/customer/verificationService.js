/**
 * Email Verification Service
 * 
 * Frontend-only abstraction prepared for backend integration.
 * The backend team will later replace these mock implementations with actual API calls
 * (e.g., fetch('/api/auth/send-verification', ...)).
 */

// Accepted mock verification code for testing and demonstration
export const MOCK_DEMO_CODE = "123456";

/**
 * Request a verification code to be sent to the given email address.
 * @param {string} email - The email address to verify.
 * @returns {Promise<{ ok: boolean, message?: string, error?: string }>}
 */
export async function sendVerificationCode(email) {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 450));

  const trimmed = email?.trim() || "";
  if (!trimmed) {
    return { ok: false, error: "empty_email", message: "Please enter your email address." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { ok: false, error: "invalid_email", message: "Please enter a valid email address." };
  }

  return {
    ok: true,
    message: `Verification code sent to ${trimmed}.`,
  };
}

/**
 * Resend a verification code to the given email address.
 * @param {string} email - The email address being verified.
 * @returns {Promise<{ ok: boolean, message?: string, error?: string }>}
 */
export async function resendVerificationCode(email) {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 450));

  const trimmed = email?.trim() || "";
  if (!trimmed) {
    return { ok: false, error: "empty_email", message: "Email address is required." };
  }

  return {
    ok: true,
    message: `A fresh verification code was sent to ${trimmed}.`,
  };
}

/**
 * Verify the code entered by the user against the email address.
 * @param {string} email - The email address being verified.
 * @param {string} code - The 6-digit verification code entered by user.
 * @returns {Promise<{ ok: boolean, message?: string, error?: string }>}
 */
export async function verifyVerificationCode(email, code) {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 550));

  const trimmedCode = code?.trim() || "";

  if (!trimmedCode) {
    return {
      ok: false,
      error: "empty_code",
      message: "Please enter the verification code.",
    };
  }

  if (trimmedCode.length < 6) {
    return {
      ok: false,
      error: "incomplete_code",
      message: "Please enter the complete 6-digit code.",
    };
  }

  // Accepts the designated mock code "123456"
  if (trimmedCode !== MOCK_DEMO_CODE) {
    return {
      ok: false,
      error: "invalid_code",
      message: "Invalid verification code. Please check and try again.",
    };
  }

  return {
    ok: true,
    message: "Email verified successfully.",
  };
}

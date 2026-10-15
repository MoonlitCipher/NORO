import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { registerAccount } from "../../customer/auth";
import { useCustomer } from "../../customer/CustomerContext";
import {
  MOCK_DEMO_CODE,
  resendVerificationCode,
  sendVerificationCode,
  verifyVerificationCode,
} from "../../customer/verificationService";
import { NoroMark } from "../../components/customer/CustomerUI";

const emptyForm = { name: "", email: "", identity: "", password: "", confirmPassword: "" };

function validate(form, register) {
  const errors = {};
  if (register && form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (register && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.identity.trim()) errors.identity = register ? "Enter your mobile number." : "Enter your email address.";
  if (register && form.identity.replace(/\D/g, "").length < 10) errors.identity = "Enter a valid 10-digit mobile number.";
  if (form.password.length < 8) errors.password = "Password must contain at least 8 characters.";
  if (register && (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) errors.password = "Use at least one letter and one number.";
  if (register && form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

function PasswordField({ label, value, onChange, error, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <div className={`field ${error ? "invalid" : ""}`}>
        <LockKeyhole size={18} />
        <input
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? "text" : "password"}
          placeholder="At least 8 characters"
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <small className="form-error">{error}</small>}
    </label>
  );
}

/**
 * 6-digit OTP code input component
 */
function CodeInput({ value, onChange, error, disabled }) {
  const inputRefs = useRef([]);

  const handleChange = (index, char) => {
    // Only accept digits
    const clean = char.replace(/\D/g, "");
    const nextArr = value.split("");
    while (nextArr.length < 6) nextArr.push("");
    nextArr[index] = clean.slice(-1);
    const nextStr = nextArr.join("").slice(0, 6);
    onChange(nextStr);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className={`otp-grid ${error ? "has-error" : ""}`} onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const digit = value[index] || "";
        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`otp-slot ${digit ? "filled" : ""} ${error ? "invalid" : ""}`}
            aria-label={`Digit ${index + 1} of verification code`}
          />
        );
      })}
    </div>
  );
}

function AuthShell({ mode }) {
  const navigate = useNavigate();
  const { signIn, signInWithEmail } = useCustomer();
  const location = useLocation();
  const register = mode === "register";

  // Login sub-states: "email" (enter email) or "verify" (email OTP verification)
  const [loginStep, setLoginStep] = useState("email");
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);

  // Form states
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    identity: location.state?.email || "",
  }));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(
    location.state?.registered ? "Account created! Verify your email to sign in." : ""
  );

  // Verification state
  const [code, setCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Countdown timer effect for resend code
  useEffect(() => {
    let timer;
    if (loginStep === "verify" && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [loginStep, countdown]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // Step 1: Send verification code and move to verify screen
  async function handleSendCode(event) {
    if (event) event.preventDefault();
    const email = form.identity.trim();
    if (!email) {
      setErrors({ identity: "Enter your email address." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ identity: "Enter a valid email address (e.g. you@example.com)." });
      return;
    }

    setIsSendingCode(true);
    setErrors({});
    const res = await sendVerificationCode(email);
    setIsSendingCode(false);

    if (!res.ok) {
      setErrors({ identity: res.message || "Could not send verification code." });
      return;
    }

    setCode("");
    setVerificationError("");
    setVerificationSuccess("");
    setCountdown(30);
    setLoginStep("verify");
  }

  // Step 2: Verify code
  async function handleVerifyCode(event) {
    if (event) event.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setVerificationError("Please enter the verification code.");
      return;
    }
    if (cleanCode.length < 6) {
      setVerificationError("Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    const res = await verifyVerificationCode(form.identity, cleanCode);
    setIsVerifying(false);

    if (!res.ok) {
      setVerificationError(res.message || "Invalid verification code.");
      return;
    }

    setVerificationSuccess("Email verified successfully! Signing you in...");
    setTimeout(() => {
      signInWithEmail(form.identity.trim());
      navigate("/customer", { replace: true });
    }, 600);
  }

  // Resend verification code
  async function handleResendCode() {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setVerificationError("");
    const res = await resendVerificationCode(form.identity);
    setIsResending(false);

    if (res.ok) {
      setCountdown(30);
      setMessage("A fresh verification code has been sent.");
      setTimeout(() => setMessage(""), 4000);
    } else {
      setVerificationError(res.message || "Failed to resend code.");
    }
  }

  // Traditional password submission (for registration or fallback)
  function submitPassword(event) {
    event.preventDefault();
    const nextErrors = validate(form, register);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (register) {
      const result = registerAccount({
        name: form.name,
        email: form.email,
        phone: form.identity,
        password: form.password,
      });
      if (!result.ok) {
        setErrors({ [result.error]: result.message });
        return;
      }
      navigate("/customer/login", {
        state: { registered: true, email: form.email },
        replace: true,
      });
    } else {
      const result = signIn(form.identity, form.password);
      if (!result.ok) {
        setErrors({ [result.error]: result.message });
        return;
      }
      navigate("/customer", { replace: true });
    }
  }

  function forgotPassword() {
    if (!form.identity.trim()) {
      setErrors((current) => ({ ...current, identity: "Enter your email first." }));
      return;
    }
    setMessage("Password reset instructions are ready to be sent.");
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <NoroMark />
        <p>
          Delivering your world,
          <br />
          <strong>one parcel at a time.</strong>
        </p>
        <div className="auth-proof">
          <span>
            <Check size={15} /> Live tracking
          </span>
          <span>
            <Check size={15} /> Safe delivery
          </span>
          <span>
            <Check size={15} /> Upfront pricing
          </span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-heading">
          <span className="eyebrow">
            {loginStep === "verify" && !register ? "EMAIL VERIFICATION" : "NORO CUSTOMER"}
          </span>
          <h1>
            {register
              ? "Create your account"
              : loginStep === "verify"
              ? "Verify your email"
              : "Welcome back"}
          </h1>
          <p>
            {register
              ? "Start sending in less than a minute."
              : loginStep === "verify"
              ? "Enter the 6-digit code sent to your inbox."
              : "Sign in to book and track your deliveries."}
          </p>
        </div>

        {message && (
          <div className="form-message" role="status">
            <Check size={16} />
            {message}
          </div>
        )}

        {/* 1. REGISTRATION FORM */}
        {register && (
          <form onSubmit={submitPassword} className="auth-form" noValidate>
            <label>
              Full name
              <div className={`field ${errors.name ? "invalid" : ""}`}>
                <UserRound size={18} />
                <input
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Test Name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
              </div>
              {errors.name && <small className="form-error">{errors.name}</small>}
            </label>

            <label>
              Email address
              <div className={`field ${errors.email ? "invalid" : ""}`}>
                <Mail size={18} />
                <input
                  required
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  type="email"
                  placeholder="test@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {errors.email && <small className="form-error">{errors.email}</small>}
            </label>

            <label>
              Mobile number
              <div className={`field ${errors.identity ? "invalid" : ""}`}>
                <Phone size={18} />
                <input
                  required
                  value={form.identity}
                  onChange={(event) => update("identity", event.target.value)}
                  type="tel"
                  inputMode="tel"
                  placeholder="9876543210"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.identity)}
                />
              </div>
              {errors.identity && <small className="form-error">{errors.identity}</small>}
            </label>

            <PasswordField
              label="Password"
              value={form.password}
              onChange={(value) => update("password", value)}
              error={errors.password}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm password"
              value={form.confirmPassword}
              onChange={(value) => update("confirmPassword", value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <p className="password-rules">
              <span className={form.password.length >= 8 ? "met" : ""}>
                <Check size={12} />
                8+ characters
              </span>
              <span
                className={
                  /[A-Za-z]/.test(form.password) && /\d/.test(form.password) ? "met" : ""
                }
              >
                <Check size={12} />
                Letter and number
              </span>
            </p>

            <button className="primary-button" type="submit">
              Create account
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* 2. LOGIN - STEP 1: ENTER EMAIL (WITH PASSWORD OPTION) */}
        {!register && loginStep === "email" && !usePasswordLogin && (
          <form onSubmit={handleSendCode} className="auth-form" noValidate>
            <label>
              Email address
              <div className={`field ${errors.identity ? "invalid" : ""}`}>
                <Mail size={18} />
                <input
                  required
                  value={form.identity}
                  onChange={(event) => update("identity", event.target.value)}
                  type="email"
                  placeholder="test@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.identity)}
                />
              </div>
              {errors.identity && <small className="form-error">{errors.identity}</small>}
            </label>

            <button className="primary-button" type="submit" disabled={isSendingCode}>
              {isSendingCode ? "Sending code..." : "Continue"}
              <ArrowRight size={18} />
            </button>

            <div className="login-alt-row">
              <button
                type="button"
                className="text-button text-muted-btn"
                onClick={() => setUsePasswordLogin(true)}
              >
                Sign in with password instead
              </button>
            </div>
          </form>
        )}

        {/* 2B. LOGIN - STEP 1 ALTERNATIVE: PASSWORD LOGIN */}
        {!register && loginStep === "email" && usePasswordLogin && (
          <form onSubmit={submitPassword} className="auth-form" noValidate>
            <label>
              Phone or email
              <div className={`field ${errors.identity ? "invalid" : ""}`}>
                <Mail size={18} />
                <input
                  required
                  value={form.identity}
                  onChange={(event) => update("identity", event.target.value)}
                  type="text"
                  placeholder="test@example.com"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.identity)}
                />
              </div>
              {errors.identity && <small className="form-error">{errors.identity}</small>}
            </label>

            <PasswordField
              label="Password"
              value={form.password}
              onChange={(value) => update("password", value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <button type="button" className="text-button forgot" onClick={forgotPassword}>
              Forgot password?
            </button>

            <button className="primary-button" type="submit">
              Sign in
              <ArrowRight size={18} />
            </button>

            <div className="login-alt-row">
              <button
                type="button"
                className="text-button text-muted-btn"
                onClick={() => setUsePasswordLogin(false)}
              >
                Sign in with email verification code
              </button>
            </div>
          </form>
        )}

        {/* 3. LOGIN - STEP 2: EMAIL VERIFICATION CODE UI */}
        {!register && loginStep === "verify" && (
          <div className="verification-wrapper">
            {/* Email being verified display */}
            <div className="verify-email-bar">
              <div className="email-chip">
                <Mail size={16} />
                <span className="email-text" title={form.identity}>
                  {form.identity}
                </span>
              </div>
              <button
                type="button"
                className="text-button change-email-btn"
                onClick={() => {
                  setLoginStep("email");
                  setVerificationError("");
                  setVerificationSuccess("");
                }}
              >
                Change email
              </button>
            </div>

            <p className="verify-instruction">
              We’ve sent a 6-digit verification code to your email. Enter it below to continue.
            </p>

            <div className="demo-code-banner">
              <small>
                Demo test code: <strong>{MOCK_DEMO_CODE}</strong>
                <br />
                (Enter any other 6 digits to test invalid-code rejection)
              </small>
            </div>

            <form onSubmit={handleVerifyCode} className="auth-form" noValidate>
              <label>
                Verification code
                <CodeInput
                  value={code}
                  onChange={(val) => {
                    setCode(val);
                    setVerificationError("");
                  }}
                  error={Boolean(verificationError)}
                  disabled={isVerifying || Boolean(verificationSuccess)}
                />
                {verificationError && (
                  <small className="form-error verification-error-text" role="alert">
                    {verificationError}
                  </small>
                )}
              </label>

              {verificationSuccess && (
                <div className="form-message" role="status">
                  <Check size={16} />
                  {verificationSuccess}
                </div>
              )}

              <button
                className="primary-button verify-submit-btn"
                type="submit"
                disabled={isVerifying || Boolean(verificationSuccess) || !code.trim()}
              >
                {isVerifying ? "Verifying code..." : "Verify & Sign in"}
                <ArrowRight size={18} />
              </button>

              {/* Resend code + timer */}
              <div className="resend-section">
                {countdown > 0 ? (
                  <span className="resend-countdown">
                    Resend code in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-button resend-btn"
                    onClick={handleResendCode}
                    disabled={isResending}
                  >
                    <RefreshCw size={14} className={isResending ? "spin" : ""} />
                    {isResending ? "Sending code..." : "Resend code"}
                  </button>
                )}
              </div>

              {/* Back / Change Email option */}
              <button
                type="button"
                className="secondary-button back-to-email-btn"
                onClick={() => {
                  setLoginStep("email");
                  setVerificationError("");
                  setVerificationSuccess("");
                }}
              >
                <ArrowLeft size={16} />
                Change email address
              </button>
            </form>
          </div>
        )}

        <div className="auth-switch">
          {register ? "Already have an account?" : "New to Noro?"}
          <button
            onClick={() => {
              setLoginStep("email");
              setErrors({});
              setVerificationError("");
              navigate(register ? "/customer/login" : "/customer/register");
            }}
          >
            {register ? "Sign in" : "Create account"}
          </button>
        </div>

        <p className="legal-copy">By continuing, you agree to Noro’s Terms and Privacy Policy.</p>
      </section>
    </main>
  );
}

export const LoginPage = () => <AuthShell mode="login" />;
export const RegisterPage = () => <AuthShell mode="register" />;

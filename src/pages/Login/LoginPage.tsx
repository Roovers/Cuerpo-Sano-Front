import { useState, useRef, useCallback } from "react";
import {
  Dumbbell,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { getSesionActual, login } from "../../services/authService";
import { motion, AnimatePresence } from "framer-motion";
import "./LoginPage.css";

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 21 21" fill="none">
    <rect width="10" height="10" fill="#F25022" />
    <rect x="11" width="10" height="10" fill="#7FBA00" />
    <rect y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
);

const RunnerFigure = () => (
  <motion.div
    className="ls-fit-person ls-runner-motion"
    initial={{ x: -90, opacity: 0 }}
    animate={{
      x: [-90, -25, 0, 18],
      opacity: [0, 1, 1, 1],
      y: [0, -3, 0, -3],
    }}
    transition={{
      duration: 1.25,
      ease: "easeOut",
      times: [0, 0.35, 0.7, 1],
    }}
  >
    <motion.span
      className="fit-head"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 0.38, repeat: Infinity, ease: "easeInOut" }}
    />
    <span className="fit-body" />

    <motion.span
      className="fit-arm fit-arm-left"
      animate={{ rotate: [42, -38, 42] }}
      transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.span
      className="fit-arm fit-arm-right"
      animate={{ rotate: [-42, 38, -42] }}
      transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.span
      className="fit-leg fit-leg-left"
      animate={{ rotate: [-42, 38, -42] }}
      transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.span
      className="fit-leg fit-leg-right"
      animate={{ rotate: [38, -42, 38] }}
      transition={{ duration: 0.42, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.span
      className="fit-speed-line line-1"
      animate={{ opacity: [0, 1, 0], x: [-8, -28, -44] }}
      transition={{ duration: 0.65, repeat: Infinity, ease: "easeOut" }}
    />
    <motion.span
      className="fit-speed-line line-2"
      animate={{ opacity: [0, 1, 0], x: [-4, -22, -38] }}
      transition={{ duration: 0.65, delay: 0.18, repeat: Infinity, ease: "easeOut" }}
    />
  </motion.div>
);

const BenchPressFigure = () => (
  <motion.div
    className="ls-fit-person ls-bench-motion"
    initial={{ y: 28, opacity: 0, scale: 0.92 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
  >
    <span className="bench-base" />
    <span className="bench-pad" />

    <span className="bench-head" />
    <span className="bench-body" />

    <motion.span
      className="bench-arm bench-arm-left"
      animate={{ rotate: [-42, -72, -42] }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.span
      className="bench-arm bench-arm-right"
      animate={{ rotate: [42, 72, 42] }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.span
      className="bench-bar"
      animate={{ y: [0, -20, 0] }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
    >
      <span />
      <span />
    </motion.span>
  </motion.div>
);

const JumperFigure = () => (
  <motion.div
    className="ls-fit-person ls-jumper-motion"
    initial={{ x: 70, opacity: 0, scale: 0.9 }}
    animate={{ x: 0, opacity: 1, scale: 1 }}
    transition={{ delay: 0.45, duration: 0.55, ease: "easeOut" }}
  >
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      className="jumper-inner"
    >
      <span className="fit-head" />
      <span className="fit-body" />

      <motion.span
        className="fit-arm fit-arm-left"
        animate={{ rotate: [18, -128, 18] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="fit-arm fit-arm-right"
        animate={{ rotate: [-18, 128, -18] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.span
        className="fit-leg fit-leg-left"
        animate={{ rotate: [-8, -36, -8] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="fit-leg fit-leg-right"
        animate={{ rotate: [8, 36, 8] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  </motion.div>
);

const FitnessSuccessOverlay = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="ls-success-overlay"
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          className="ls-fit-glow"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        <motion.div
          className="ls-fit-scene"
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <RunnerFigure />
          <BenchPressFigure />
          <JumperFigure />
        </motion.div>

        <motion.div
          className="ls-fit-copy"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.62, duration: 0.45, ease: "easeOut" }}
        >
          <p className="ls-success-text">¡Que bueno que volviste!</p>
          <p className="ls-success-sub">Ingresando al Sistema...</p>
        </motion.div>

        <motion.div className="ls-fit-progress">
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 1.05, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const rect = btn.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
  circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
  circle.classList.add("ls-ripple");
  btn.querySelector(".ls-ripple")?.remove();
  btn.appendChild(circle);
}

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length >= 3;
}
function validatePassword(v: string) {
  return v.length >= 6;
}

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [usuarioDirty, setUsuarioDirty] = useState(false);
  const [passwordDirty, setPasswordDirty] = useState(false);

  const navigate = useNavigate();
  const submitRef = useRef<HTMLButtonElement>(null);

  const usuarioValid = validateEmail(usuario);
  const passwordValid = validatePassword(password);

  const handleLogin = useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
    setUsuarioDirty(true);
    setPasswordDirty(true);

    if (!usuario.trim()) {
      toast.error("Ingresá tu usuario.");
      return;
    }
    if (!password.trim()) {
      toast.error("Ingresá tu contraseña.");
      return;
    }

    if (e) createRipple(e);

    try {
      setLoading(true);

      const response = await login({ usuario, password });

      if (rememberMe) {
        localStorage.setItem("rememberMe", "1");
      }
      localStorage.setItem("token", response.token);
      localStorage.setItem("usuario", response.usuario);
      localStorage.setItem("rol", response.rol);

      try {
        const sesion = await getSesionActual();
        localStorage.setItem("sesionActual", JSON.stringify(sesion));
      } catch (error) {
        console.error("No se pudo cargar /auth/me", error);
      }

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 2500);

    } catch (error) {
      console.error(error);
      toast.error("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }, [usuario, password, rememberMe, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submitRef.current?.click();
  };

  const usuarioState = usuarioDirty ? (usuarioValid ? "is-success" : "is-error") : "";
  const passwordState = passwordDirty ? (passwordValid ? "is-success" : "is-error") : "";

  return (
    <main className="ls">
      {}
      <div className="ls-bg" aria-hidden />
      <div className="ls-orb ls-orb-1" aria-hidden />
      <div className="ls-orb ls-orb-2" aria-hidden />
      <div className="ls-orb ls-orb-3" aria-hidden />

      <section className="ls-card" role="main" aria-label="Iniciar sesión">

        {}
        <FitnessSuccessOverlay visible={success} />

        {}
        <div className="ls-header">
          <div className="ls-logo" aria-hidden>
            <img src={logo} alt="Cuerpo Sano logo" />
          </div>
          <div className="ls-brand-text">
            <span className="ls-brand-tag">Sistema de Gestión Fitness</span>
            <p className="ls-brand-name">Cuerpo&nbsp;Sano</p>
          </div>
        </div>

        {}
        <div className="ls-copy">
          <h2>Iniciar sesión</h2>
          <p>Accedé al panel para gestionar socios, membresías, pagos y asistencias.</p>
        </div>

        {}
        <div className="ls-social">
          <button
            type="button"
            className="ls-social-btn"
            onClick={() => toast("Próximamente: Google SSO")}
            aria-label="Continuar con Google"
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            className="ls-social-btn"
            onClick={() => toast("Próximamente: Microsoft SSO")}
            aria-label="Continuar con Microsoft"
          >
            <MicrosoftIcon />
            Microsoft
          </button>
        </div>

        {}
        <div className="ls-divider" aria-hidden>
          <span>o continuá con tu usuario</span>
        </div>

        {}
        <div className="ls-form" role="form" aria-label="Formulario de acceso">

          {}
          <div className={`ls-field ${usuarioState}`}>
            <label className="ls-field-label" htmlFor="ls-usuario">Usuario</label>
            <div className="ls-input-wrap">
              <span className="ls-input-icon" aria-hidden>
                <UserRound size={16} />
              </span>
              <input
                id="ls-usuario"
                className="ls-input"
                type="text"
                placeholder="admin / tu email"
                autoComplete="username"
                value={usuario}
                onChange={e => { setUsuario(e.target.value); setUsuarioDirty(true); }}
                onBlur={() => setUsuarioDirty(true)}
                onKeyDown={handleKeyDown}
                aria-invalid={usuarioDirty && !usuarioValid}
                aria-describedby={usuarioDirty && !usuarioValid ? "ls-usuario-msg" : undefined}
              />
            </div>
            {usuarioDirty && !usuarioValid && (
              <span className="ls-field-msg" id="ls-usuario-msg" role="alert">
                Ingresá un usuario o email válido.
              </span>
            )}
          </div>

          {}
          <div className={`ls-field ${passwordState}`}>
            <div className="ls-field-label">
              <label htmlFor="ls-password">Contraseña</label>
              <a href="#recuperar" tabIndex={0} onClick={e => { e.preventDefault(); toast("Funcionalidad de recuperación próximamente"); }}>
                ¿Olvidaste la contraseña?
              </a>
            </div>
            <div className="ls-input-wrap">
              <span className="ls-input-icon" aria-hidden>
                <LockKeyhole size={16} />
              </span>
              <input
                id="ls-password"
                className="ls-input"
                type={showPass ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPasswordDirty(true); }}
                onBlur={() => setPasswordDirty(true)}
                onKeyDown={handleKeyDown}
                aria-invalid={passwordDirty && !passwordValid}
              />
              <button
                type="button"
                className="ls-input-action"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordDirty && !passwordValid && (
              <span className="ls-field-msg" role="alert">
                La contraseña debe tener al menos 6 caracteres.
              </span>
            )}
          </div>

          {}
          <div className="ls-options">
            <label className="ls-check-wrap">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                aria-label="Recordar sesión"
              />
              <span className="ls-check-box" aria-hidden>
                <span className="ls-check-tick">
                  <Check size={11} strokeWidth={3} />
                </span>
              </span>
              <span className="ls-check-label">Recordar sesión</span>
            </label>
          </div>

          {}
          <button
            ref={submitRef}
            type="button"
            className="ls-submit"
            onClick={handleLogin}
            disabled={loading || success}
            aria-busy={loading}
          >
            {loading
              ? <><span className="ls-spinner" aria-hidden />Ingresando…</>
              : "Ingresar al sistema"
            }
          </button>
        </div>

        {}
        <p className="ls-signup">
          ¿No tenés cuenta?{" "}
          <a href="#registro" onClick={e => { e.preventDefault(); toast("Contactá al administrador para crear una cuenta."); }}>
            Contactá al admin
          </a>
        </p>

        {}
        <footer className="ls-footer">
          <div className="ls-footer-left">
            <Dumbbell size={13} aria-hidden />
            <span>Gestión integral de gimnasio</span>
          </div>
          <div className="ls-footer-links">
            <a href="#privacidad">Privacidad</a>
            <a href="#terminos">Términos</a>
            <ShieldCheck size={12} aria-label="Conexión segura" />
            <span>v1.0</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
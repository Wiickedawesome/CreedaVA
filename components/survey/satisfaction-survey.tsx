"use client";

import { useState, useCallback } from "react";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n/context";
import { BrandLogo } from "@/components/brand/brand-logo";

interface SurveyQuestion {
  id: string;
  en: string;
  es: string;
}

interface SurveyRating {
  value: number;
  en: string;
  es: string;
  color: string;
}

export interface SurveyAnswers {
  [questionId: string]: number;
}

interface SatisfactionSurveyProps {
  customerName: string;
  onSubmit: (answers: SurveyAnswers, comment: string) => Promise<void>;
  isDemo?: boolean;
}

// ─── Questions ───────────────────────────────────────

const QUESTIONS: SurveyQuestion[] = [
  { id: "overall",       en: "How would you rate your overall experience with CreedaVA?",        es: "¿Cómo calificaría su experiencia general con CreedaVA?" },
  { id: "communication", en: "How satisfied are you with our communication and responsiveness?", es: "¿Qué tan satisfecho está con nuestra comunicación y capacidad de respuesta?" },
  { id: "quality",       en: "How would you rate the quality of work delivered?",                 es: "¿Cómo calificaría la calidad del trabajo entregado?" },
  { id: "timeliness",    en: "How satisfied are you with the timeliness of deliverables?",        es: "¿Qué tan satisfecho está con la puntualidad de las entregas?" },
  { id: "value",         en: "How would you rate the value for the price you pay?",               es: "¿Cómo calificaría la relación calidad-precio?" },
  { id: "understanding", en: "How well does our team understand your business needs?",            es: "¿Qué tan bien entiende nuestro equipo las necesidades de su negocio?" },
  { id: "proactive",     en: "How proactive is our team in suggesting improvements?",             es: "¿Qué tan proactivo es nuestro equipo al sugerir mejoras?" },
  { id: "reliability",   en: "How reliable and consistent is our service delivery?",              es: "¿Qué tan confiable y consistente es la prestación de nuestro servicio?" },
  { id: "recommend",     en: "How likely are you to recommend CreedaVA to others?",               es: "¿Qué tan probable es que recomiende CreedaVA a otros?" },
  { id: "continue",      en: "How likely are you to continue using our services?",                es: "¿Qué tan probable es que continúe utilizando nuestros servicios?" },
];

const RATINGS: SurveyRating[] = [
  { value: 1, en: "Poor",      es: "Malo",       color: "#DA1E28" },
  { value: 2, en: "Fair",      es: "Regular",    color: "#FF832B" },
  { value: 3, en: "Good",      es: "Bueno",      color: "#F1C21B" },
  { value: 4, en: "Very Good", es: "Muy Bueno",  color: "#198038" },
  { value: 5, en: "Excellent", es: "Excelente",  color: "#005148" },
];

// ─── Translations ────────────────────────────────────

const T = {
  en: {
    title: "How are we doing?",
    greeting: (name: string) => `Hi ${name}, we'd love to hear about your experience with CreedaVA.`,
    progress: (current: number, total: number) => `Question ${current} of ${total}`,
    commentLabel: "Any additional comments?",
    commentOptional: "(optional)",
    commentPlaceholder: "Tell us what we're doing well or how we can improve...",
    submit: "Submit Feedback",
    submitting: "Submitting...",
    thankYou: "Thank You!",
    thankYouMsg: "Your feedback has been recorded. We truly appreciate you taking the time to help us improve our services.",
    visitSite: "Visit CreedaVA",
    confidential: "Your feedback is confidential and helps us improve our services.",
    unavailable: "Survey Unavailable",
    preview: "Preview Mode — No data will be saved",
    tryAgain: "← Try Again (Demo)",
  },
  es: {
    title: "¿Cómo lo estamos haciendo?",
    greeting: (name: string) => `Hola ${name}, nos encantaría conocer tu experiencia con CreedaVA.`,
    progress: (current: number, total: number) => `Pregunta ${current} de ${total}`,
    commentLabel: "¿Algún comentario adicional?",
    commentOptional: "(opcional)",
    commentPlaceholder: "Cuéntanos qué hacemos bien o cómo podemos mejorar...",
    submit: "Enviar Comentarios",
    submitting: "Enviando...",
    thankYou: "¡Gracias!",
    thankYouMsg: "Sus comentarios han sido registrados. Agradecemos sinceramente que se haya tomado el tiempo de ayudarnos a mejorar nuestros servicios.",
    visitSite: "Visitar CreedaVA",
    confidential: "Sus comentarios son confidenciales y nos ayudan a mejorar nuestros servicios.",
    unavailable: "Encuesta No Disponible",
    preview: "Modo de Vista Previa — No se guardarán datos",
    tryAgain: "← Intentar de nuevo (Demo)",
  },
};

// ─── SVG Face Icons ──────────────────────────────────

function FaceIcon({ value, size = 40 }: { value: number; size?: number }) {
  const r = RATINGS[value - 1];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill={r.color} opacity="0.12" stroke={r.color} strokeWidth="2" />
      {/* Eyes */}
      {value <= 2 ? (
        // Sad/neutral eyes — dots
        <>
          <circle cx="16" cy="20" r="2.5" fill={r.color} />
          <circle cx="32" cy="20" r="2.5" fill={r.color} />
        </>
      ) : (
        // Happy eyes — arcs
        <>
          <path d="M13.5 20.5C14.5 18.5 16 17.5 17.5 18" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M34.5 20.5C33.5 18.5 32 17.5 30.5 18" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {/* Mouth */}
      {value === 1 && (
        <path d="M16 34C18 30 22 28 24 28C26 28 30 30 32 34" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
      {value === 2 && (
        <line x1="16" y1="32" x2="32" y2="32" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" />
      )}
      {value === 3 && (
        <path d="M16 30C18 33 22 34 24 34C26 34 30 33 32 30" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
      {value === 4 && (
        <path d="M15 29C17 34 21 36 24 36C27 36 31 34 33 29" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
      {value === 5 && (
        <>
          <path d="M14 28C16 35 20 38 24 38C28 38 32 35 34 28" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" fill={r.color} fillOpacity="0.15" />
          {/* Star sparkles */}
          <circle cx="8" cy="12" r="1.5" fill={r.color} opacity="0.6" />
          <circle cx="40" cy="12" r="1.5" fill={r.color} opacity="0.6" />
          <circle cx="6" cy="24" r="1" fill={r.color} opacity="0.4" />
          <circle cx="42" cy="24" r="1" fill={r.color} opacity="0.4" />
        </>
      )}
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────

export default function SatisfactionSurvey({ customerName, onSubmit, isDemo }: SatisfactionSurveyProps) {
  const { locale: lang } = useTranslation();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [fading, setFading] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const t = T[lang];
  const allAnswered = currentQ >= QUESTIONS.length;
  const avgRating = Object.values(answers).length > 0
    ? (Object.values(answers).reduce((a, b) => a + b, 0) / Object.values(answers).length).toFixed(1)
    : "0";

  const handleRate = useCallback((value: number) => {
    const q = QUESTIONS[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setFading(true);
    setTimeout(() => {
      setCurrentQ((prev) => prev + 1);
      setFading(false);
    }, 400);
  }, [currentQ]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(answers, comment.trim());
      setSubmitted(true);
    } catch {
      setError(lang === "en" ? "Failed to submit. Please try again." : "Error al enviar. Inténtelo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetDemo() {
    setCurrentQ(0);
    setAnswers({});
    setComment("");
    setSubmitted(false);
    setError("");
  }

  // ── Thank You State ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-b from-mk-paper to-mk-white py-20">
        <Container size="sm">
          <div className="text-center space-y-6">
            <BrandLogo className="mx-auto h-16 w-auto" />
            <div className="w-16 h-16 mx-auto rounded-full bg-mk-brand/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-mk-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-mk-ink">{t.thankYou}</h1>
            <p className="text-mk-ink-mute max-w-md mx-auto">{t.thankYouMsg}</p>
            <div className="pt-4">
              {isDemo ? (
                <button onClick={resetDemo} className="text-mk-brand hover:text-mk-brand-bright font-medium">
                  {t.tryAgain}
                </button>
              ) : (
                <a href="https://creedava.com" className="inline-flex items-center gap-2 text-mk-brand hover:text-mk-brand-bright font-medium">
                  {t.visitSite}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ── Survey ──
  return (
    <div className="min-h-screen bg-linear-to-b from-mk-paper to-mk-white py-12 lg:py-20">
      <Container size="sm">
        <div className="space-y-8">
          {/* Demo badge */}
          {isDemo && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                {t.preview}
              </span>
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-4">
            <BrandLogo className="mx-auto h-16 w-auto" />
            <h1 className="text-3xl font-bold text-mk-ink">{t.title}</h1>
            <p className="text-mk-ink-mute">{t.greeting(customerName)}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-mk-ink-mute">
              <span>{t.progress(Math.min(currentQ + 1, QUESTIONS.length), QUESTIONS.length)}</span>
              <span>{Math.round((Object.keys(answers).length / QUESTIONS.length) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-mk-paper-deep overflow-hidden">
              <div
                className="h-full rounded-full bg-mk-brand transition-all duration-500 ease-out"
                style={{ width: `${(Object.keys(answers).length / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Questions — one at a time with fade */}
          {!allAnswered && (
            <div
              className={`bg-mk-white rounded-(--mk-radius-lg) border border-mk-line-strong p-8 shadow-(--mk-shadow-card) transition-all duration-300 ${
                fading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              }`}
            >
              <p className="text-base font-medium text-mk-ink mb-8 text-center leading-relaxed">
                {QUESTIONS[currentQ][lang]}
              </p>
              <div className="flex justify-center gap-3 sm:gap-5">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleRate(r.value)}
                    className="flex flex-col items-center gap-2 p-2 sm:p-3 rounded-(--mk-radius) border-2 border-transparent hover:border-mk-line-strong hover:bg-mk-paper-deep transition-all cursor-pointer hover:scale-110 active:scale-95"
                  >
                    <FaceIcon value={r.value} size={44} />
                    <span className="text-xs font-medium text-mk-ink-mute">{r[lang]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment + Submit — shown after all questions */}
          {allAnswered && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Average score */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mk-brand/10">
                  <FaceIcon value={Math.round(Number(avgRating))} size={28} />
                  <span className="text-sm font-semibold text-mk-brand">
                    {lang === "en" ? `Average: ${avgRating}/5` : `Promedio: ${avgRating}/5`}
                  </span>
                </div>
              </div>

              {/* Comment box */}
              <div className="bg-mk-white rounded-(--mk-radius-lg) border border-mk-line-strong p-8 shadow-(--mk-shadow-card)">
                <label className="block text-sm font-medium text-mk-ink-soft mb-2">
                  {t.commentLabel} <span className="text-mk-ink-mute">{t.commentOptional}</span>
                </label>
                <textarea
                  className="w-full rounded-(--mk-radius) border border-mk-line-strong bg-mk-white px-4 py-3 text-sm min-h-28 resize-y focus:outline-none focus:ring-2 focus:ring-mk-brand/20 focus:border-mk-brand"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t.commentPlaceholder}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}

              {/* Submit */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 bg-mk-brand text-white px-8 py-3 rounded-full font-semibold text-base hover:bg-mk-brand-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t.submitting}
                    </>
                  ) : (
                    t.submit
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-mk-ink-mute">{t.confidential}</p>
        </div>
      </Container>
    </div>
  );
}

export { QUESTIONS, RATINGS, T };

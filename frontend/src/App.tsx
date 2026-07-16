import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ParticleBackground from "./ParticleBackground";
import QrScanner from "./QrScanner";
import {
  transcribeLecture,
  simplifyText,
  speakText,
  brailleText,
  signup,
  login,
  askAI,
  type AuthResponse,
} from "./api";

function TypewriterText({
  text,
  delay = 0,
  speed = 40,
  className,
  style,
  showCursor = false,
}: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  showCursor?: boolean;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span className={className} style={style}>
      {displayed}
      {showCursor && started && displayed.length < text.length && (
        <span className="animate-pulse">▍</span>
      )}
    </span>
  );
}

interface Lecture {
  id: string;
  name: string;
  transcript?: string;
  simplified?: string;
  audioUrl?: string;
  braille?: string;
  status: "uploading" | "transcribing" | "simplifying" | "speaking" | "brailling" | "done" | "error";
}

type StageKey = "transcript" | "simplified" | "audio" | "braille";

interface StageMeta {
  label: string;
  color: string;
  icon: string;
}

const STAGE_ORDER: StageKey[] = ["transcript", "simplified", "audio", "braille"];

const STAGE_META: Record<StageKey, StageMeta> = {
  transcript: { label: "Transcript", color: "var(--color-chalk-coral)", icon: "〜" },
  simplified: { label: "Simplified", color: "var(--color-chalk-gold)", icon: "≡" },
  audio: { label: "Audio", color: "var(--color-chalk-lilac)", icon: "◔" },
  braille: { label: "Braille", color: "var(--color-chalk-sky)", icon: "⠿" },
};

type AccessibilityNeed = "deaf" | "eyesight" | "learning" | "other" | "";

interface StudentProfile {
  childName: string;
  schoolName: string;
  location: string;
  need: AccessibilityNeed;
  otherNeed: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

function App() {
  const [showIntro, setShowIntro] = useState(true);

  const [user, setUser] = useState<AuthResponse | null>(() => {
    const stored = localStorage.getItem("accesslearnai_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    const stored = localStorage.getItem("accesslearnai_profile");
    return stored ? JSON.parse(stored) : null;
  });
  const [formChildName, setFormChildName] = useState("");
  const [formSchoolName, setFormSchoolName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formNeed, setFormNeed] = useState<AccessibilityNeed>("");
  const [formOtherNeed, setFormOtherNeed] = useState("");

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSubmitted, setHelpSubmitted] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const activeLecture = lectures.find((l) => l.id === activeId) ?? null;

  function updateLecture(id: string, patch: Partial<Lecture>) {
    setLectures((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  async function handleUpload(file: File) {
    const id = crypto.randomUUID();
    const newLecture: Lecture = {
      id,
      name: file.name,
      status: "uploading",
    };
    setLectures((prev) => [newLecture, ...prev]);
    setActiveId(id);

    try {
      updateLecture(id, { status: "transcribing" });
      const transcribeRes = await transcribeLecture(file);
      updateLecture(id, { transcript: transcribeRes.transcript });

      updateLecture(id, { status: "simplifying" });
      const simplifyRes = await simplifyText(transcribeRes.transcript);
      updateLecture(id, { simplified: simplifyRes.simplified });

      updateLecture(id, { status: "speaking" });
      const audioUrl = await speakText(simplifyRes.simplified);
      updateLecture(id, { audioUrl });

      updateLecture(id, { status: "brailling" });
      const brailleRes = await brailleText(simplifyRes.simplified);
      updateLecture(id, { braille: brailleRes.braille, status: "done" });
    } catch (err) {
      console.error(err);
      updateLecture(id, { status: "error" });
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res =
        authMode === "signup"
          ? await signup(authName, authEmail, authPassword)
          : await login(authEmail, authPassword);
      setUser(res);
      localStorage.setItem("accesslearnai_user", JSON.stringify(res));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem("accesslearnai_user");
    localStorage.removeItem("accesslearnai_profile");
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newProfile: StudentProfile = {
      childName: formChildName,
      schoolName: formSchoolName,
      location: formLocation,
      need: formNeed,
      otherNeed: formOtherNeed,
    };
    setProfile(newProfile);
    localStorage.setItem("accesslearnai_profile", JSON.stringify(newProfile));
  }

  async function handleChatSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const question = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const context = activeLecture?.transcript || "";
      const answer = await askAI(question, context);
      setChatMessages((prev) => [...prev, { role: "ai", text: answer }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't reach the AI right now. Try again in a moment." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleHelpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHelpSubmitted(true);
  }

  function handleQrScan(decodedText: string) {
    setScanResult(decodedText);
    setScannerOpen(false);

    const matched = lectures.find((l) => l.id === decodedText);
    if (matched) {
      setActiveId(matched.id);
    }
  }

  const inputStyle: React.CSSProperties = {
    borderColor: "rgba(255, 107, 44, 0.8)",
    color: "var(--color-ink)",
  };

  // 1. Intro screen
  if (showIntro) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-6 cursor-pointer relative overflow-hidden"
        style={{ backgroundColor: "var(--color-page-bg)" }}
        onClick={() => setShowIntro(false)}
      >
        <ParticleBackground />
        <div className="app-content flex flex-col items-center">
          <h1
            className="text-5xl md:text-6xl mb-4 min-h-[1.2em]"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
          >
            <TypewriterText text="Hello." delay={200} speed={100} showCursor />
          </h1>

          <p
            className="text-xl md:text-2xl max-w-xl leading-relaxed mb-2 min-h-[1.5em]"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-grid-orange)" }}
          >
            <TypewriterText text="Welcome to AccessLearnAI —" delay={1200} speed={35} showCursor />
          </p>

          <p
            className="text-lg md:text-xl max-w-xl leading-relaxed mb-10 min-h-[3em]"
            style={{ color: "var(--color-ink)" }}
          >
            <TypewriterText
              text="where trouble hearing, reading, or seeing a lecture is no longer trouble accessing it."
              delay={2800}
              speed={20}
              showCursor
            />
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 6.5, duration: 0.6 }}
            className="px-6 py-3 rounded-full border-2 text-sm"
            style={{ color: "var(--color-ink)", borderColor: "var(--color-grid-orange)" }}
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Click anywhere to begin
            </motion.span>
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. Login / Signup screen
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
        style={{ backgroundColor: "var(--color-page-bg)" }}
      >
        <ParticleBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="app-content w-full max-w-md rounded-2xl p-8 border-2 backdrop-blur-md"
          style={{
            backgroundColor: "rgba(255,255,255,0.75)",
            borderColor: "var(--color-grid-orange)",
          }}
        >
          <h2
            className="text-3xl mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
          >
            {authMode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm opacity-60 mb-6" style={{ color: "var(--color-ink)" }}>
            {authMode === "signup"
              ? "Join AccessLearnAI to start uploading lectures."
              : "Log in to continue where you left off."}
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <input
                type="text"
                placeholder="Full name"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border-2 outline-none text-sm"
                style={inputStyle}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border-2 outline-none text-sm"
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border-2 outline-none text-sm"
              style={inputStyle}
            />

            {authError && (
              <p className="text-sm" style={{ color: "var(--color-chalk-coral)" }}>
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-full font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-grid-orange)", color: "#FFFFFF" }}
            >
              {authLoading
                ? "Please wait…"
                : authMode === "signup"
                ? "Sign up"
                : "Log in"}
            </button>
          </form>

          <p className="text-sm text-center mt-5 opacity-70" style={{ color: "var(--color-ink)" }}>
            {authMode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              onClick={() => {
                setAuthMode(authMode === "signup" ? "login" : "signup");
                setAuthError("");
              }}
              className="font-bold underline"
              style={{ color: "var(--color-grid-orange)" }}
            >
              {authMode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // 3. Onboarding profile
  if (!profile) {
    const needOptions: { value: AccessibilityNeed; label: string }[] = [
      { value: "deaf", label: "Deaf or hard of hearing" },
      { value: "eyesight", label: "Eyesight difficulty" },
      { value: "learning", label: "Learning difficulty" },
      { value: "other", label: "Other" },
    ];

    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden"
        style={{ backgroundColor: "var(--color-page-bg)" }}
      >
        <ParticleBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="app-content w-full max-w-lg rounded-2xl p-8 border-2 backdrop-blur-md"
          style={{
            backgroundColor: "rgba(255,255,255,0.75)",
            borderColor: "var(--color-grid-orange)",
          }}
        >
          <h2
            className="text-3xl mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
          >
            Tell us about the student
          </h2>
          <p className="text-sm opacity-60 mb-6" style={{ color: "var(--color-ink)" }}>
            This helps us tailor lectures to what actually helps.
          </p>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Child's name"
              required
              value={formChildName}
              onChange={(e) => setFormChildName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border-2 outline-none text-sm"
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="School name"
              required
              value={formSchoolName}
              onChange={(e) => setFormSchoolName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border-2 outline-none text-sm"
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Location (city)"
              required
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border-2 outline-none text-sm"
              style={inputStyle}
            />

            <div>
              <p className="text-sm font-bold mb-2" style={{ color: "var(--color-ink)" }}>
                Accessibility need
              </p>
              <div className="space-y-2">
                {needOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-full border-2 cursor-pointer text-sm"
                    style={{
                      borderColor:
                        formNeed === opt.value
                          ? "var(--color-grid-orange)"
                          : "rgba(255,107,44,0.2)",
                      backgroundColor:
                        formNeed === opt.value ? "rgba(255,107,44,0.08)" : "transparent",
                      color: "var(--color-ink)",
                    }}
                  >
                    <input
                      type="radio"
                      name="need"
                      value={opt.value}
                      checked={formNeed === opt.value}
                      onChange={() => setFormNeed(opt.value)}
                      className="accent-orange-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {formNeed === "other" && (
                <textarea
                  placeholder="Tell us more…"
                  required
                  value={formOtherNeed}
                  onChange={(e) => setFormOtherNeed(e.target.value)}
                  rows={3}
                  className="w-full mt-3 px-4 py-3 rounded-2xl border-2 outline-none text-sm resize-none"
                  style={{
                    borderColor: "rgba(255,107,44,0.3)",
                    color: "#FFFFFF",
                    backgroundColor: "#000000",
                  }}
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-full font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-grid-orange)", color: "#FFFFFF" }}
            >
              Continue
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // 4. Main dashboard
  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ backgroundColor: "var(--color-page-bg)" }}
    >
      <ParticleBackground />
      {/* Sidebar */}
      <aside
        className="app-content w-72 shrink-0 border-r-2 flex flex-col"
        style={{ backgroundColor: "rgba(255,255,255,0.9)", borderColor: "var(--color-grid-orange)" }}
      >
        <div className="p-6 border-b-2" style={{ borderColor: "rgba(255,107,44,0.3)" }}>
          <h1
            className="text-2xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
          >
            AccessLearnAI
          </h1>
          <p className="text-sm opacity-60 mt-1" style={{ color: "var(--color-ink)" }}>
            One lecture, every sense.
          </p>
        </div>

        <div className="px-6 py-3 border-b" style={{ borderColor: "rgba(255,107,44,0.15)" }}>
          <p className="text-sm font-bold truncate" style={{ color: "var(--color-ink)" }}>
            {profile.childName}
          </p>
          <p className="text-xs opacity-50 truncate" style={{ color: "var(--color-ink)" }}>
            {profile.schoolName} · {profile.location}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs opacity-50 truncate" style={{ color: "var(--color-ink)" }}>
              {user.email}
            </p>
            <button
              onClick={handleLogout}
              className="text-xs underline opacity-60 hover:opacity-100"
              style={{ color: "var(--color-chalk-coral)" }}
            >
              Log out
            </button>
          </div>
        </div>

        <label className="m-4 cursor-pointer block">
          <div
            className="flex items-center gap-3 rounded-full px-3 py-2.5 border-2 backdrop-blur-md hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "rgba(255,107,44,0.06)", borderColor: "var(--color-grid-orange)" }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{ backgroundColor: "var(--color-grid-orange)", color: "#FFFFFF" }}
            >
              +
            </span>
            <span
              className="text-sm opacity-80 truncate"
              style={{ color: "var(--color-ink)" }}
            >
              Upload a lecture…
            </span>
          </div>
          <input
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
        </label>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {lectures.length === 0 && (
            <p className="text-sm opacity-40 px-4 py-6 text-center" style={{ color: "var(--color-ink)" }}>
              No lectures yet. Upload one to begin.
            </p>
          )}
          {lectures.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                l.id === activeId ? "bg-orange-100" : "hover:bg-orange-50"
              }`}
              style={{ color: "var(--color-ink)" }}
            >
              <div className="truncate">{l.name}</div>
              <div className="text-xs opacity-50 mt-0.5 capitalize">{l.status}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main panel */}
      <main className="app-content flex-1 p-10 overflow-y-auto">
        {!activeLecture && (
          <div
            className="h-full flex items-center justify-center opacity-40 text-lg"
            style={{ color: "var(--color-ink)" }}
          >
            Select or upload a lecture to see it transformed.
          </div>
        )}

        {activeLecture && (
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl mb-8"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
            >
              {activeLecture.name}
            </h2>

            <div className="space-y-6">
              {STAGE_ORDER.map((stage, i) => {
                const meta = STAGE_META[stage];
                const content =
                  stage === "transcript"
                    ? activeLecture.transcript
                    : stage === "simplified"
                    ? activeLecture.simplified
                    : stage === "audio"
                    ? activeLecture.audioUrl
                    : activeLecture.braille;

                const isDone = Boolean(content);
                const isActive =
                  !isDone &&
                  ((stage === "transcript" && activeLecture.status === "transcribing") ||
                    (stage === "simplified" && activeLecture.status === "simplifying") ||
                    (stage === "audio" && activeLecture.status === "speaking") ||
                    (stage === "braille" && activeLecture.status === "brailling"));

                return (
                  <div
                    key={stage}
                    className="rounded-xl p-5 border-2 shadow-sm"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.92)",
                      borderColor: isDone ? meta.color : "rgba(255,107,44,0.15)",
                      opacity: isDone ? 1 : isActive ? 0.9 : 0.5,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: meta.color, color: "#FFFFFF" }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: meta.color }} className="text-lg">
                        {meta.icon}
                      </span>
                      <h3 className="font-bold" style={{ color: "var(--color-ink)" }}>
                        {meta.label}
                      </h3>
                    </div>

                    {!isDone && isActive && (
                      <p className="text-sm opacity-90 animate-pulse" style={{ color: meta.color }}>
                        {stage === "transcript" && "Listening to the audio…"}
                        {stage === "simplified" && "Rewriting in simpler language…"}
                        {stage === "audio" && "Generating natural speech…"}
                        {stage === "braille" && "Converting to Braille…"}
                      </p>
                    )}

                    {!isDone && !isActive && (
                      <p className="text-sm opacity-40" style={{ color: "var(--color-ink)" }}>
                        Waiting…
                      </p>
                    )}

                    {isDone && stage === "audio" && (
                      <audio controls src={activeLecture.audioUrl} className="w-full" />
                    )}

                    {isDone && stage === "braille" && (
                      <p
                        className="text-2xl leading-loose tracking-wider break-words"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {content}
                      </p>
                    )}

                    {isDone && stage !== "audio" && stage !== "braille" && (
                      <p
                        className="text-sm leading-relaxed break-words"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* AI Assistant floating widget */}
      <div className="fixed bottom-6 right-6 z-20">
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-80 h-96 mb-3 rounded-2xl border-2 flex flex-col overflow-hidden backdrop-blur-md"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderColor: "var(--color-grid-orange)",
            }}
          >
            <div
              className="px-4 py-3 border-b-2 flex items-center justify-between"
              style={{ borderColor: "rgba(255,107,44,0.2)" }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                Ask a doubt
              </p>
              <button
                onClick={() => setChatOpen(false)}
                className="text-sm opacity-50 hover:opacity-100"
                style={{ color: "var(--color-ink)" }}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-xs opacity-50 text-center mt-6" style={{ color: "var(--color-ink)" }}>
                  Ask me anything about your lecture, or anything you're stuck on.
                </p>
              )}
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user" ? "ml-auto" : "mr-auto"
                  }`}
                  style={{
                    backgroundColor:
                      m.role === "user" ? "var(--color-grid-orange)" : "rgba(255,107,44,0.08)",
                    color: m.role === "user" ? "#FFFFFF" : "var(--color-ink)",
                  }}
                >
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <p className="text-xs opacity-50 animate-pulse" style={{ color: "var(--color-ink)" }}>
                  Thinking…
                </p>
              )}
            </div>

            <form onSubmit={handleChatSend} className="p-2 border-t-2" style={{ borderColor: "rgba(255,107,44,0.2)" }}>
              <input
                type="text"
                placeholder="Type your question…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full px-3 py-2 rounded-full border-2 outline-none text-xs"
                style={{ borderColor: "rgba(255,107,44,0.3)", color: "var(--color-ink)" }}
              />
            </form>
          </motion.div>
        )}

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--color-grid-orange)", color: "#FFFFFF" }}
        >
          {chatOpen ? "✕" : "💬"}
        </button>
      </div>

      {/* Human Assistant floating widget */}
      <div className="fixed bottom-6 right-24 z-20">
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-80 mb-3 rounded-2xl border-2 p-4 backdrop-blur-md"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderColor: "var(--color-grid-orange)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                Talk to a human
              </p>
              <button
                onClick={() => setHelpOpen(false)}
                className="text-sm opacity-50 hover:opacity-100"
                style={{ color: "var(--color-ink)" }}
              >
                ✕
              </button>
            </div>

            {!helpSubmitted ? (
              <form onSubmit={handleHelpSubmit} className="space-y-3">
                <p className="text-xs opacity-70" style={{ color: "var(--color-ink)" }}>
                  Want a mentor to walk you through something in person? Leave a note and
                  we'll set up a session.
                </p>
                <textarea
                  placeholder="What would you like help with?"
                  required
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-2xl border-2 outline-none text-xs resize-none"
                  style={{ borderColor: "rgba(255,107,44,0.3)", color: "var(--color-ink)" }}
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-full font-bold text-xs"
                  style={{ backgroundColor: "var(--color-grid-orange)", color: "#FFFFFF" }}
                >
                  Request a session
                </button>
              </form>
            ) : (
              <p className="text-xs opacity-80" style={{ color: "var(--color-ink)" }}>
                ✓ Request sent! A mentor will reach out to you soon.
              </p>
            )}
          </motion.div>
        )}

        <button
          onClick={() => setHelpOpen(!helpOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--color-chalk-sky)", color: "#FFFFFF" }}
        >
          {helpOpen ? "✕" : "🧑‍🏫"}
        </button>
      </div>
      {/* QR Scanner floating widget */}
      <div className="fixed bottom-6 right-[168px] z-20">
        {scannerOpen && (
          <div
            className="w-80 mb-3 rounded-2xl border-2 p-4 backdrop-blur-md"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderColor: "var(--color-grid-orange)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                Scan a QR code
              </p>
            </div>
            <QrScanner onScan={handleQrScan} onClose={() => setScannerOpen(false)} />
          </div>
        )}

        {scanResult && !scannerOpen && (
          <div
            className="w-80 mb-3 rounded-2xl border-2 p-4 text-xs break-words"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderColor: "var(--color-grid-orange)",
              color: "var(--color-ink)",
            }}
          >
            <p className="font-bold mb-1">Scanned:</p>
            <p>{scanResult}</p>
          </div>
        )}

        <button
          onClick={() => {
            setScannerOpen(!scannerOpen);
            setScanResult(null);
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--color-chalk-gold)", color: "#FFFFFF" }}
        >
          {scannerOpen ? "✕" : "▦"}
        </button>
      </div>
    </div>
  );
  
}

export default App;
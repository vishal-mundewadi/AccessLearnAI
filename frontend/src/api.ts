const BASE_URL = "http://127.0.0.1:8000";

export interface TranscribeResponse {
  message: string;
  filename: string;
  transcript: string;
  language: string;
  segments: { start: number; end: number; text: string }[];
}

export interface SimplifyResponse {
  original: string;
  simplified: string;
}

export interface BrailleResponse {
  original: string;
  braille: string;
}

export async function transcribeLecture(file: File): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function simplifyText(text: string): Promise<SimplifyResponse> {
  const res = await fetch(`${BASE_URL}/simplify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function speakText(text: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function brailleText(text: string): Promise<BrailleResponse> {
  const res = await fetch(`${BASE_URL}/braille`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Signup failed");
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function askAI(question: string, lectureContext: string = ""): Promise<string> {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, lecture_context: lectureContext }),
  });
  const data = await res.json();
  return data.answer;
}
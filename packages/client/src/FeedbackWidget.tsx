import { createSignal, For, Show } from "solid-js";

import { useClient } from "@revolt/client";

/**
 * Feedback widget (AgenXs custom)
 *
 * Floating button (bottom-right) that opens a small panel to submit
 * feedback, bug reports, questions, etc. Posts to the native /feedback/submit
 * endpoint, which stores it in the instance's MongoDB.
 */

const CATEGORIES = [
  { id: "Bug", emoji: "🐛", label: "Bug", placeholder: "O que quebrou? Onde? O que você esperava que acontecesse?" },
  { id: "Suggestion", emoji: "💡", label: "Sugestão", placeholder: "O que você gostaria de ver? Como isso ajudaria?" },
  { id: "Question", emoji: "❓", label: "Dúvida", placeholder: "Qual é a sua dúvida?" },
  { id: "Other", emoji: "💬", label: "Outro", placeholder: "Manda ver..." },
];

const MAX = 2000;

export function FeedbackWidget() {
  const client = useClient();

  const [open, setOpen] = createSignal(false);
  const [category, setCategory] = createSignal("Bug");
  const [content, setContent] = createSignal("");
  const [sending, setSending] = createSignal(false);
  const [sent, setSent] = createSignal(false);
  const [error, setError] = createSignal("");

  const placeholder = () =>
    CATEGORIES.find((c) => c.id === category())?.placeholder ?? "";

  async function submit() {
    if (!content().trim() || sending()) return;
    setSending(true);
    setError("");
    try {
      // Path is a custom native endpoint (not in the generated SDK types)
      await (client().api as unknown as {
        post: (path: string, body: unknown) => Promise<unknown>;
      }).post("/feedback/submit", {
        category: category(),
        content: content().trim(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });
      setSent(true);
      setContent("");
      setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 1600);
    } catch {
      setError("Não foi possível enviar. Tenta de novo em instantes.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        title="Enviar feedback"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          "z-index": "9000",
          width: "52px",
          height: "52px",
          "border-radius": "50%",
          border: "none",
          cursor: "pointer",
          "font-size": "22px",
          background: "var(--md-sys-color-primary, #7c6cf0)",
          color: "var(--md-sys-color-on-primary, #fff)",
          "box-shadow": "0 4px 14px rgba(0,0,0,0.35)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open() ? "✕" : "💬"}
      </button>

      {/* Panel */}
      <Show when={open()}>
        <div
          style={{
            position: "fixed",
            bottom: "84px",
            right: "20px",
            "z-index": "9000",
            width: "340px",
            "max-width": "calc(100vw - 40px)",
            background: "var(--md-sys-color-surface-container-high, #26232e)",
            color: "var(--md-sys-color-on-surface, #e8e6ee)",
            "border-radius": "16px",
            "box-shadow": "0 8px 30px rgba(0,0,0,0.45)",
            padding: "16px",
            display: "flex",
            "flex-direction": "column",
            gap: "12px",
            "font-family": "inherit",
          }}
        >
          <Show
            when={!sent()}
            fallback={
              <div style={{ padding: "24px 8px", "text-align": "center" }}>
                <div style={{ "font-size": "32px" }}>🎉</div>
                <div style={{ "font-weight": "700", "margin-top": "6px" }}>
                  Feedback enviado!
                </div>
                <div style={{ opacity: "0.6", "font-size": "0.85em", "margin-top": "2px" }}>
                  Valeu por ajudar a melhorar.
                </div>
              </div>
            }
          >
            <div style={{ "font-weight": "700", "font-size": "1.05em" }}>
              Enviar feedback
            </div>

            {/* Categories */}
            <div style={{ display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
              <For each={CATEGORIES}>
                {(c) => (
                  <button
                    onClick={() => setCategory(c.id)}
                    style={{
                      flex: "1",
                      "min-width": "64px",
                      padding: "8px 6px",
                      "border-radius": "10px",
                      cursor: "pointer",
                      "font-size": "0.82em",
                      border:
                        category() === c.id
                          ? "2px solid var(--md-sys-color-primary, #7c6cf0)"
                          : "2px solid transparent",
                      background:
                        category() === c.id
                          ? "var(--md-sys-color-primary-container, #3a3550)"
                          : "var(--md-sys-color-surface-container-highest, #322e3b)",
                      color: "var(--md-sys-color-on-surface, #e8e6ee)",
                    }}
                  >
                    <div style={{ "font-size": "18px" }}>{c.emoji}</div>
                    {c.label}
                  </button>
                )}
              </For>
            </div>

            {/* Textarea */}
            <textarea
              value={content()}
              maxLength={MAX}
              placeholder={placeholder()}
              onInput={(e) => setContent(e.currentTarget.value)}
              rows={4}
              style={{
                width: "100%",
                resize: "vertical",
                "box-sizing": "border-box",
                padding: "10px",
                "border-radius": "10px",
                border: "1px solid var(--md-sys-color-outline, #48454f)",
                background: "var(--md-sys-color-surface-container-low, #1c1a22)",
                color: "var(--md-sys-color-on-surface, #e8e6ee)",
                "font-family": "inherit",
                "font-size": "0.9em",
              }}
            />

            <Show when={error()}>
              <div style={{ color: "var(--md-sys-color-error, #f2b8b5)", "font-size": "0.82em" }}>
                {error()}
              </div>
            </Show>

            {/* Footer */}
            <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
              <span style={{ opacity: "0.5", "font-size": "0.78em" }}>
                {content().length}/{MAX}
              </span>
              <button
                onClick={submit}
                disabled={!content().trim() || sending()}
                style={{
                  padding: "8px 18px",
                  "border-radius": "10px",
                  border: "none",
                  cursor: content().trim() && !sending() ? "pointer" : "not-allowed",
                  "font-weight": "600",
                  background: "var(--md-sys-color-primary, #7c6cf0)",
                  color: "var(--md-sys-color-on-primary, #fff)",
                  opacity: !content().trim() || sending() ? "0.5" : "1",
                }}
              >
                {sending() ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { chatbot } from '@/config/chatbot';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  async function send(text) {
    const content = text.trim();
    if (!content || loading) return;

    const history = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    function updateReply(reply) {
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: reply }]);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-chatbot.limits.maxMessages) }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        updateReply(json?.error || 'No pude responder en este momento. Intenta nuevamente.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        updateReply(reply);
      }
    } catch {
      updateReply('Error de conexión. Revisa tu internet e intenta nuevamente.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="chat-widget">
      {open && (
        <section
          id="chat-panel"
          className="chat-panel"
          role="dialog"
          aria-label={chatbot.name}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <div className="chat-header">
            <img src="/images/logo.jpeg" alt="" width="36" height="36" />
            <div>
              <strong>{chatbot.name}</strong>
              <span>Respuestas automáticas</span>
            </div>
            <button type="button" className="chat-close" onClick={close} aria-label="Cerrar chat">
              ×
            </button>
          </div>

          <div className="chat-messages" ref={listRef} aria-live="polite">
            <p className="chat-bubble chat-bubble--assistant">{chatbot.welcome}</p>
            {messages.map((m, i) => (
              <p key={i} className={`chat-bubble chat-bubble--${m.role}`}>
                {m.content || <span className="chat-typing" aria-label="Escribiendo">···</span>}
              </p>
            ))}
          </div>

          {messages.length === 0 && (
            <div className="chat-quick-replies">
              {chatbot.quickReplies.map((q) => (
                <button key={q} type="button" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form className="chat-form" onSubmit={handleSubmit}>
            <label htmlFor="chat-input" className="sr-only">
              Escribe tu mensaje
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              placeholder="Escribe tu consulta..."
              autoComplete="off"
              maxLength={chatbot.limits.maxChars}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn--sm" disabled={loading || !input.trim()}>
              Enviar
            </button>
          </form>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        className="chat-toggle"
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? 'Cerrar chat de atención' : 'Abrir chat de atención'}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? (
          <span aria-hidden="true">×</span>
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.5 3.4 6L4.6 21l4.3-2.3c1 .2 2 .3 3.1.3 5.5 0 10-3.6 10-8s-4.5-8-10-8z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

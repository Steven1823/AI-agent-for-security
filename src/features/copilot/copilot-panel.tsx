"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles, Trash2, User2 } from "lucide-react";
import type { ChatMessage } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatClock } from "@/lib/utils";

const SUGGESTIONS = [
  "Why did this fail?",
  "What is our biggest risk?",
  "How can we improve resilience?",
  "Show incidents from today",
  "Predict the next failure",
  "Status report",
];

export function CopilotPanel({ compact }: { compact?: boolean }) {
  const log = usePulseStore((s) => s.chatLog);
  const thinking = usePulseStore((s) => s.copilotThinking);
  const ask = usePulseStore((s) => s.askCopilot);
  const clear = usePulseStore((s) => s.clearChat);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [log, thinking]);

  const submit = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || thinking) return;
    setInput("");
    await ask(q);
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-400" />
          AI Copilot
          <Badge variant="accent" className="ml-1">
            <Sparkles className="h-3 w-3" />
            Grounded
          </Badge>
        </CardTitle>
        {log.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-0">
        <div
          ref={scrollRef}
          className={cn(
            "flex flex-col gap-3 overflow-y-auto px-5",
            compact ? "h-64" : "h-[440px]",
          )}
        >
          {log.length === 0 && (
            <div className="my-auto flex flex-col items-center gap-3 py-6 text-center">
              <Sparkles className="h-7 w-7 text-violet-400/70" />
              <p className="max-w-md text-sm text-muted-foreground">
                Ask anything about your live system. Every answer is grounded in
                the current incidents, components, and metrics — with citations
                you can click.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {log.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className="h-3.5 w-3.5 text-violet-400" />
              <span className="inline-flex gap-1">
                <Dot delay={0} />
                <Dot delay={0.15} />
                <Dot delay={0.3} />
              </span>
              Copilot is thinking…
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 border-t border-border/60 px-5 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the copilot…"
            disabled={thinking}
            className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-violet-400/50"
          />
          <Button
            type="submit"
            variant="gradient"
            disabled={thinking || !input.trim()}
            size="icon"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
          <Bot className="h-4 w-4" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-sky-500/15 text-foreground"
            : "bg-secondary/50 text-foreground",
        )}
      >
        {message.content.split("\n").map((line, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {renderRich(line)}
          </p>
        ))}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((c) => (
              <span
                key={`${c.kind}-${c.id}`}
                title={`${c.kind}:${c.id}`}
                className="rounded-md bg-background/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {c.kind}: {c.label}
              </span>
            ))}
          </div>
        )}
        {!isUser && message.confidence != null && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Confidence</span>
              <span>{message.confidence}%</span>
            </div>
            <Progress
              value={message.confidence}
              className="mt-1 h-1"
              indicatorClassName={
                message.confidence >= 80
                  ? "bg-emerald-400"
                  : message.confidence >= 60
                  ? "bg-amber-400"
                  : "bg-rose-400"
              }
            />
            {message.confidence < 70 && (
              <p className="mt-1 text-[10px] text-amber-300/80">
                Low confidence — human review recommended.
              </p>
            )}
          </div>
        )}
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {formatClock(message.ts)}
        </p>
      </div>
      {isUser && (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
          <User2 className="h-4 w-4" />
        </span>
      )}
    </motion.div>
  );
}

function renderRich(line: string) {
  // Minimal **bold** markdown only — no external deps.
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.2, delay }}
      className="h-1.5 w-1.5 rounded-full bg-violet-300"
    />
  );
}

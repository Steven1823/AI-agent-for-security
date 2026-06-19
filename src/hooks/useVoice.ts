"use client";

import { useEffect, useRef } from "react";
import { usePulseStore } from "@/lib/store";

/**
 * Drains the voice queue and speaks each message using the browser
 * Speech Synthesis API. Respects the global mute flag and volume slider.
 */
export function useVoice() {
  const queue = usePulseStore((s) => s.voiceQueue);
  const muted = usePulseStore((s) => s.muted);
  const volume = usePulseStore((s) => s.volume);
  const consumeVoice = usePulseStore((s) => s.consumeVoice);
  const speaking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking.current) return;
    if (queue.length === 0) return;

    const text = consumeVoice();
    if (!text) return;

    if (muted || volume <= 0) return; // dropped while muted

    speaking.current = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02;
    utter.pitch = 1;
    utter.volume = Math.min(1, Math.max(0, volume / 100));
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => /Google US English|Samantha|Microsoft Aria|Daniel/i.test(v.name),
    );
    if (preferred) utter.voice = preferred;
    utter.onend = () => {
      speaking.current = false;
    };
    utter.onerror = () => {
      speaking.current = false;
    };
    window.speechSynthesis.speak(utter);
  }, [queue, muted, volume, consumeVoice]);
}

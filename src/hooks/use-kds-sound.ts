import { useCallback, useRef } from "react";

export function useKDSSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Ambil/buat AudioContext (harus triggered by user interaction)
  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    // Resume kalau suspended (browser autoplay policy)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Suara: ding-ding (order baru masuk)
  const playNewOrder = useCallback(() => {
    try {
      const ctx = getContext();
      // 2 beep cepat
      [0, 0.2].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880; // note A5
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + delay + 0.15,
        );
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } catch {
      // Audio context gagal — silent fail
    }
  }, [getContext]);

  // Suara: 3 naik (item ready)
  const playReady = useCallback(() => {
    try {
      const ctx = getContext();
      [0, 0.12, 0.24].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 660 * (i + 1);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + delay + 0.12,
        );
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.12);
      });
    } catch {
      // silent fail
    }
  }, [getContext]);

  return { playNewOrder, playReady };
}

"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const BACKGROUND_VOLUME = 0.1;

export function BackgroundAudio({
  src,
  loop,
}: {
  src: string;
  loop: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    let active = true;
    element.volume = BACKGROUND_VOLUME;

    const resume = () => {
      void element.play().catch(() => {
        // The visible control remains available if the browser still blocks audio.
      });
    };

    void element.play().catch(() => {
      if (!active) return;
      window.addEventListener("pointerdown", resume, {
        capture: true,
        once: true,
      });
      window.addEventListener("keydown", resume, {
        capture: true,
        once: true,
      });
    });

    return () => {
      active = false;
      window.removeEventListener("pointerdown", resume, true);
      window.removeEventListener("keydown", resume, true);
    };
  }, [src]);

  async function toggle() {
    if (!audio.current) return;
    if (audio.current.paused) {
      await audio.current.play();
    } else {
      audio.current.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-30 sm:right-6 sm:bottom-6">
      <audio
        ref={audio}
        src={src}
        loop={loop}
        autoPlay
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause background music" : "Play background music"}
        className="flex items-center gap-2 rounded-full border border-ink/15 bg-white/95 px-4 py-2.5 text-[13px] font-bold text-ink shadow-lg backdrop-blur"
      >
        <Volume2 className="size-4 text-accent" />
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        <span>{playing ? "Pause score" : "Play score"}</span>
      </button>
    </div>
  );
}

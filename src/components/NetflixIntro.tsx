import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, ChevronRight } from "lucide-react";

interface NetflixIntroProps {
  onComplete: () => void;
}

export default function NetflixIntro({ onComplete }: NetflixIntroProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stage, setStage] = useState<"letters" | "zoomV" | "ribbons" | "fade">("letters");
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play B&W Ta-Dum Sound using Web Audio API
  const playTaDum = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Ensure audio context is running
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // FIRST BEAT: Low deep thud (Ta-)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(75, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.3);

      gain1.gain.setValueAtTime(0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // SECOND BEAT: Brighter, slightly richer thud + ringing ( -Dum)
      const delay = 0.16; // 160ms delay
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator(); // harmonic
      const gain2 = ctx.createGain();

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(110, now + delay);
      osc2.frequency.exponentialRampToValueAtTime(45, now + delay + 1.2);

      osc3.type = "sine";
      osc3.frequency.setValueAtTime(220, now + delay);
      osc3.frequency.exponentialRampToValueAtTime(55, now + delay + 1.2);

      gain2.gain.setValueAtTime(0.0, now);
      // Fast attack for second beat
      gain2.gain.linearRampToValueAtTime(0.7, now + delay + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 1.5);

      // Filter to make it warmer and less harsh
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, now + delay);
      filter.frequency.exponentialRampToValueAtTime(70, now + delay + 1.0);

      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + delay);
      osc3.start(now + delay);
      osc2.stop(now + delay + 1.5);
      osc3.stop(now + delay + 1.5);

    } catch (err) {
      console.warn("Audio Context playback failed or was blocked by browser policies:", err);
    }
  };

  useEffect(() => {
    // Attempt to play the startup chime 350ms after mounting
    const soundTimer = setTimeout(() => {
      playTaDum();
    }, 350);

    // Timeline stages
    // 0.0s to 1.6s: Spell out V-A-L-I-D-A-T-E
    // 1.6s to 2.4s: Zoom into the core "V" stroke
    // 2.4s to 3.4s: Explode into cascading barcode vertical ribbons
    // 3.4s to 3.9s: Fade overall screen to reveal app
    const stage1Timer = setTimeout(() => setStage("zoomV"), 1600);
    const stage2Timer = setTimeout(() => setStage("ribbons"), 2450);
    const stage3Timer = setTimeout(() => setStage("fade"), 3400);
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3900);

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      clearTimeout(completeTimer);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Ribbons generator
  const ribbonCount = 14;
  const ribbons = Array.from({ length: ribbonCount }).map((_, i) => {
    // Staggered colors ranging from white to charcoal to rich gray
    const grays = [
      "bg-white",
      "bg-neutral-100",
      "bg-neutral-200",
      "bg-neutral-300",
      "bg-neutral-400",
      "bg-neutral-500",
      "bg-neutral-600",
      "bg-neutral-700",
      "bg-neutral-800",
      "bg-neutral-900",
      "bg-black",
    ];
    const randomColor = grays[Math.floor(Math.sin(i * 123) * 5 + 5)];
    const widthPercent = 100 / ribbonCount;
    const delay = (i * 0.03).toFixed(2);
    const duration = (0.6 + Math.sin(i) * 0.2).toFixed(2);

    return {
      id: i,
      color: randomColor,
      left: `${i * widthPercent}%`,
      width: `${widthPercent + 0.5}%`, // slightly overlapping to avoid gaps
      delay: parseFloat(delay),
      duration: parseFloat(duration),
    };
  });

  return (
    <div id="intro-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none font-display">
      {/* Sound Indicator Overlay */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <button
          id="sound-toggle-btn"
          onClick={() => {
            const nextVal = !soundEnabled;
            setSoundEnabled(nextVal);
            if (nextVal) playTaDum();
          }}
          className="p-2 border border-neutral-800 bg-neutral-950/80 rounded-full hover:bg-neutral-900 transition-colors text-neutral-400 hover:text-white"
          title={soundEnabled ? "Mute startup sound" : "Unmute startup sound"}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <span className="text-[10px] tracking-widest font-mono text-neutral-500 uppercase">
          {soundEnabled ? "Audio On" : "Muted"}
        </span>
      </div>

      {/* Skip Intro Button */}
      <button
        id="skip-intro-btn"
        onClick={onComplete}
        className="absolute top-6 right-6 z-10 flex items-center gap-1 px-4 py-2 border border-neutral-800 bg-neutral-950/80 rounded-full hover:bg-neutral-900 transition-colors text-xs font-mono text-neutral-400 hover:text-white group"
      >
        Skip Intro
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Stage 1 & 2: Letter Spacing and Large Logo Zoom */}
      <AnimatePresence mode="wait">
        {stage === "letters" && (
          <motion.div
            key="letters-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center"
          >
            {/* The Logo: VALIDATE */}
            <div className="flex gap-[0.5vw] md:gap-[1.5vw] items-center">
              {"VALIDATE".split("").map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: index * 0.08,
                      type: "spring",
                      stiffness: 120,
                      damping: 10,
                    },
                  }}
                  className="text-4xl md:text-8xl font-black tracking-tight text-white select-none"
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 flex items-center gap-2"
            >
              <div className="h-[1px] w-8 bg-neutral-800" />
              <span className="text-xs tracking-[0.4em] font-mono text-neutral-400 uppercase">
                AI Validation Engine
              </span>
              <div className="h-[1px] w-8 bg-neutral-800" />
            </motion.div>
          </motion.div>
        )}

        {stage === "zoomV" && (
          <motion.div
            key="v-zoom-container"
            className="relative w-full h-full flex items-center justify-center"
            initial={{ scale: 1 }}
            animate={{
              scale: 45,
              transition: {
                duration: 1.1,
                ease: [0.85, 0, 0.15, 1], // sudden parabolic surge
              },
            }}
          >
            {/* Massive single V letter that zooms straight into the viewer */}
            <motion.span
              className="text-9xl font-black text-white select-none leading-none select-none"
              style={{ originX: 0.5, originY: 0.56 }} // adjust zoom focus to the valley of the V
            >
              V
            </motion.span>
          </motion.div>
        )}

        {stage === "ribbons" && (
          <motion.div
            key="ribbons-cascades"
            className="absolute inset-0 w-full h-full bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dynamic vertical bars/ribbons mimicking the Netflix visual bloom but B&W */}
            {ribbons.map((ribbon) => (
              <motion.div
                key={ribbon.id}
                className={`absolute top-0 bottom-0 ${ribbon.color}`}
                style={{
                  left: ribbon.left,
                  width: ribbon.width,
                }}
                initial={{ scaleY: 0, originY: ribbon.id % 2 === 0 ? 0 : 1 }}
                animate={{
                  scaleY: 1,
                  transition: {
                    duration: ribbon.duration,
                    delay: ribbon.delay,
                    ease: [0.25, 1, 0.5, 1],
                  },
                }}
              />
            ))}

            {/* A subtle dynamic vignette gradient to add depth to the columns */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black pointer-events-none" />
          </motion.div>
        )}

        {stage === "fade" && (
          <motion.div
            key="fade-curtain"
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
              transition: {
                duration: 0.5,
                times: [0, 0.3, 1],
                ease: "easeInOut",
              },
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

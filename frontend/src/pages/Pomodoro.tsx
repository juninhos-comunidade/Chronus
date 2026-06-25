import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const focusDuration = 25 * 60;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function Pomodoro() {
  const [secondsLeft, setSecondsLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const progress = useMemo(
    () => ((focusDuration - secondsLeft) / focusDuration) * 100,
    [secondsLeft],
  );

  useEffect(() => {
    if (!isRunning || secondsLeft === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0) {
      setIsRunning(false);
    }
  }, [secondsLeft]);

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(focusDuration);
  }

  return (
    <section className="mx-auto flex max-w-[960px] flex-col gap-6">
      <div className="relative flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-white/20 bg-[#17161b] px-5 py-6">
        <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/20 px-2.5 py-1 text-xs text-white/80">
          ID 203
        </div>
        <span className="absolute right-5 top-5 text-sm text-primary-yellow">
          Tarefa
        </span>

        <p className="mb-4 text-sm text-white/70">
          Sprint 3: Levantar requisitos do sistema
        </p>

        <div
          className="grid h-40 w-40 place-items-center rounded-full p-1"
          style={{
            background: `conic-gradient(#ffb900 ${progress}%, #ffb900 0 ${Math.max(
              progress,
              1,
            )}%, transparent ${Math.max(progress, 1)}%)`,
          }}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-[#17161b]">
            <span className="text-4xl font-semibold tracking-normal">
              {formatTime(secondsLeft)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning((value) => !value)}
            className="grid h-11 w-18 place-items-center rounded-lg bg-primary-yellow/20 text-primary-yellow transition-colors hover:bg-primary-yellow hover:text-black"
            aria-label={isRunning ? "Pausar pomodoro" : "Iniciar pomodoro"}
          >
            {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="grid h-11 w-14 place-items-center rounded-lg bg-white/20 text-white/80 transition-colors hover:bg-white/30 hover:text-white"
            aria-label="Reiniciar pomodoro"
          >
            <RotateCcw size={22} />
          </button>

          {secondsLeft === 0 && (
            <button
              type="button"
              onClick={resetTimer}
              className="grid h-11 w-14 place-items-center rounded-lg bg-white/20 text-white/80 transition-colors hover:bg-white/30 hover:text-white"
              aria-label="Encerrar pomodoro"
            >
              <Square size={20} fill="currentColor" />
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["6", "Hoje"],
          ["37", "Total"],
          ["7", "Tarefas feitas"],
        ].map(([value, label]) => (
          <article
            key={label}
            className="grid min-h-28 place-items-center rounded-lg border border-white/20 bg-[#17161b] p-4 text-center"
          >
            <div>
              <strong className="block text-3xl font-semibold">{value}</strong>
              <span className="mt-1.5 block text-xs font-semibold uppercase text-white/70">
                {label}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Pomodoro;

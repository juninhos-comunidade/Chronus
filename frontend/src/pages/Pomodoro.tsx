import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo } from "react";

import {
  getCompletedPomodoros,
  getCompletedPomodorosToday,
  getTasksWithStatus,
  selectActivePomodoroTask,
  useChronusStore,
} from "@/stores/useChronusStore";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function Pomodoro() {
  const pomodoro = useChronusStore((state) => state.pomodoro);
  const columns = useChronusStore((state) => state.columns);
  const activeTask = useChronusStore(selectActivePomodoroTask);
  const tasks = useMemo(() => getTasksWithStatus(columns), [columns]);
  const setPomodoroTask = useChronusStore((state) => state.setPomodoroTask);
  const togglePomodoro = useChronusStore((state) => state.togglePomodoro);
  const resetPomodoro = useChronusStore((state) => state.resetPomodoro);
  const tickPomodoro = useChronusStore((state) => state.tickPomodoro);
  const completedToday = useMemo(
    () => getCompletedPomodorosToday(pomodoro.sessions),
    [pomodoro.sessions],
  );
  const completedTotal = useMemo(
    () => getCompletedPomodoros(columns),
    [columns],
  );
  const progress = useMemo(
    () =>
      ((pomodoro.focusDuration - pomodoro.secondsLeft) /
        pomodoro.focusDuration) *
      100,
    [pomodoro.focusDuration, pomodoro.secondsLeft],
  );

  useEffect(() => {
    if (!pomodoro.isRunning || pomodoro.secondsLeft === 0) {
      return;
    }

    const timer = window.setInterval(tickPomodoro, 1000);

    return () => window.clearInterval(timer);
  }, [pomodoro.isRunning, pomodoro.secondsLeft, tickPomodoro]);

  return (
    <section className="mx-auto flex max-w-[960px] flex-col gap-6">
      <div className="relative flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-white/20 bg-[#17161b] px-5 py-6">
        <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/20 px-2.5 py-1 text-xs text-white/80">
          {activeTask?.code ?? "Sem tarefa"}
        </div>
        <span className="absolute right-5 top-5 text-sm text-primary-yellow">
          Tarefa
        </span>

        <p className="mb-4 text-sm text-white/70">
          {activeTask
            ? `${activeTask.description} ${activeTask.title}`
            : "Selecione uma tarefa para iniciar o ciclo."}
        </p>

        <select
          value={pomodoro.activeTaskId ?? ""}
          onChange={(event) => setPomodoroTask(event.target.value)}
          disabled={tasks.length === 0}
          className="mb-5 w-full max-w-md rounded-lg border border-white/15 bg-[#252429] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary-yellow"
          aria-label="Selecionar tarefa do pomodoro"
        >
          {tasks.length === 0 && (
            <option value="">Nenhuma tarefa disponível</option>
          )}
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.code} - {task.title}
            </option>
          ))}
        </select>

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
              {formatTime(pomodoro.secondsLeft)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={togglePomodoro}
            disabled={!activeTask}
            className="grid h-11 w-18 place-items-center rounded-lg bg-primary-yellow/20 text-primary-yellow transition-colors hover:bg-primary-yellow hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary-yellow/20 disabled:hover:text-primary-yellow"
            aria-label={
              pomodoro.isRunning ? "Pausar pomodoro" : "Iniciar pomodoro"
            }
          >
            {pomodoro.isRunning ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" />
            )}
          </button>

          <button
            type="button"
            onClick={resetPomodoro}
            className="grid h-11 w-14 place-items-center rounded-lg bg-white/20 text-white/80 transition-colors hover:bg-white/30 hover:text-white"
            aria-label="Reiniciar pomodoro"
          >
            <RotateCcw size={22} />
          </button>

          {pomodoro.secondsLeft === 0 && (
            <button
              type="button"
              onClick={resetPomodoro}
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
          [String(completedToday), "Hoje"],
          [String(completedTotal), "Total"],
          [
            String(tasks.filter((task) => task.pomodorosCompleted > 0).length),
            "Tarefas feitas",
          ],
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

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { MessageCircle, MoreHorizontal, Plus, Timer } from "lucide-react";
import { type FormEvent, useState } from "react";

import {
  useChronusStore,
  type KanbanColumn,
  type TaskPriority,
} from "@/stores/useChronusStore";

const priorityClass = {
  Alta: "border-red-400/60 bg-red-500/50 text-red-100",
  media: "border-amber-300/50 bg-amber-500/70 text-amber-100",
  baixa: "border-green-500/30 bg-green-700/70 text-green-100",
};

const initialFormState = {
  title: "",
  description: "",
  priority: "media" as TaskPriority,
  assignee: "",
  dueToday: true,
};

function Kanban() {
  const columns = useChronusStore((state) => state.columns);
  const activeTaskId = useChronusStore((state) => state.pomodoro.activeTaskId);
  const addTask = useChronusStore((state) => state.addTask);
  const moveTask = useChronusStore((state) => state.moveTask);
  const setPomodoroTask = useChronusStore((state) => state.setPomodoroTask);
  const [targetColumn, setTargetColumn] = useState<KanbanColumn | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [formError, setFormError] = useState("");

  function openTaskForm(column: KanbanColumn) {
    setTargetColumn(column);
    setFormState(initialFormState);
    setFormError("");
  }

  function closeTaskForm() {
    setTargetColumn(null);
    setFormError("");
  }

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!targetColumn) {
      return;
    }

    const task = addTask(targetColumn.id, formState);

    if (!task) {
      setFormError("Preencha título, descrição e responsável.");
      return;
    }

    closeTaskForm();
  }

  function handleDragEnd(result: DropResult) {
    const destination = result.destination;

    if (!destination) {
      return;
    }

    moveTask({
      sourceColumnId: result.source.droppableId,
      sourceIndex: result.source.index,
      destinationColumnId: destination.droppableId,
      destinationIndex: destination.index,
    });
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <section className="h-full overflow-hidden">
        <div className="flex h-full gap-4 overflow-x-auto pb-5 scrollbar-thin">
          {columns.map((column) => (
            <article
              key={column.id}
              className="flex h-fit max-h-full w-[300px] shrink-0 flex-col rounded-lg border border-white/15 bg-[#17161b] p-4"
            >
              <header className="mb-4 flex items-center gap-2.5 border-b border-white/25 pb-3">
                <span className={`h-3 w-3 rounded-full ${column.color}`} />
                <h2 className="mr-auto text-base font-semibold text-white/85">
                  {column.title}
                </h2>
                <button
                  type="button"
                  onClick={() => openTaskForm(column)}
                  className="text-white/45 transition-colors hover:text-primary-yellow"
                  aria-label={`Adicionar tarefa em ${column.title}`}
                >
                  <Plus size={18} />
                </button>
                <button
                  type="button"
                  className="text-white/45 transition-colors hover:text-white"
                  aria-label={`Mais opções de ${column.title}`}
                >
                  <MoreHorizontal size={20} />
                </button>
              </header>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex min-h-20 flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="rounded-lg border border-white/15 bg-[#252429] p-4 shadow-sm"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <span className="text-sm text-white/55">
                                {task.code}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs ${priorityClass[task.priority]}`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            <h3 className="mb-2 text-base font-semibold">
                              {task.title}
                            </h3>
                            <p className="mb-3 line-clamp-3 text-sm leading-snug text-white/70">
                              {task.description}
                            </p>

                            <footer className="flex items-center justify-between">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-green-700 text-xs font-semibold">
                                {task.assignee}
                              </span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setPomodoroTask(task.id)}
                                  className={`text-white/55 transition-colors hover:text-primary-yellow ${
                                    activeTaskId === task.id
                                      ? "text-primary-yellow"
                                      : ""
                                  }`}
                                  aria-label={`Usar ${task.code} no pomodoro`}
                                >
                                  <Timer size={18} />
                                </button>
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-white/75">
                                  <MessageCircle
                                    size={18}
                                    className="text-primary-yellow"
                                  />
                                  {task.comments}
                                </span>
                              </div>
                            </footer>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {column.tasks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/45">
                        Nenhuma tarefa nesta coluna.
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {column.id === "backlog" && (
                <button
                  type="button"
                  onClick={() => openTaskForm(column)}
                  className="mt-4 flex h-12 items-center justify-center gap-3 rounded-lg border border-primary-yellow text-sm font-semibold text-primary-yellow transition-colors hover:bg-primary-yellow hover:text-black"
                >
                  <Plus size={18} />
                  Adicionar tarefa
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      {targetColumn && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-lg rounded-lg border border-white/15 bg-[#17161b] p-5 shadow-xl"
          >
            <header className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Adicionar tarefa</h2>
                <p className="text-sm text-white/55">{targetColumn.title}</p>
              </div>
              <button
                type="button"
                onClick={closeTaskForm}
                className="rounded-lg px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </button>
            </header>

            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold">
                Título
                <input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      title: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-white/15 bg-[#252429] px-3 py-2 text-sm font-normal text-white outline-none transition-colors focus:border-primary-yellow"
                  placeholder="Nome da tarefa"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-semibold">
                Descrição
                <textarea
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-24 resize-none rounded-lg border border-white/15 bg-[#252429] px-3 py-2 text-sm font-normal text-white outline-none transition-colors focus:border-primary-yellow"
                  placeholder="Escopo, critério de aceite ou contexto"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <label className="grid gap-1.5 text-sm font-semibold">
                  Prioridade
                  <select
                    value={formState.priority}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        priority: event.target.value as TaskPriority,
                      }))
                    }
                    className="rounded-lg border border-white/15 bg-[#252429] px-3 py-2 text-sm font-normal text-white outline-none transition-colors focus:border-primary-yellow"
                  >
                    <option value="Alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-semibold">
                  Responsável
                  <input
                    value={formState.assignee}
                    onChange={(event) =>
                      setFormState((state) => ({
                        ...state,
                        assignee: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-white/15 bg-[#252429] px-3 py-2 text-sm font-normal uppercase text-white outline-none transition-colors focus:border-primary-yellow"
                    maxLength={2}
                    placeholder="KA"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={formState.dueToday}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      dueToday: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-primary-yellow"
                />
                Vence hoje
              </label>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {formError}
              </p>
            )}

            <footer className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeTaskForm}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/20 hover:text-white"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary-yellow px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-500"
              >
                Salvar tarefa
              </button>
            </footer>
          </form>
        </div>
      )}
    </DragDropContext>
  );
}

export default Kanban;

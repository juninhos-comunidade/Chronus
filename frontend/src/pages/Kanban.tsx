import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { MessageCircle, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: "Alta" | "media" | "baixa";
  assignee: string;
  comments: number;
};

type Column = {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
};

const initialColumns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    color: "bg-red-500",
    tasks: [
      {
        id: "backlog-1",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "Alta",
        assignee: "JS",
        comments: 12,
      },
      {
        id: "backlog-2",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "baixa",
        assignee: "MR",
        comments: 8,
      },
    ],
  },
  {
    id: "todo",
    title: "A Fazer",
    color: "bg-blue-400",
    tasks: [
      {
        id: "todo-1",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "Alta",
        assignee: "JS",
        comments: 12,
      },
      {
        id: "todo-2",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "baixa",
        assignee: "MR",
        comments: 8,
      },
      {
        id: "todo-3",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "Alta",
        assignee: "LK",
        comments: 1,
      },
    ],
  },
  {
    id: "progress",
    title: "Em Andamento",
    color: "bg-amber-400",
    tasks: [
      {
        id: "progress-1",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "Alta",
        assignee: "KA",
        comments: 12,
      },
      {
        id: "progress-2",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "media",
        assignee: "MA",
        comments: 8,
      },
    ],
  },
  {
    id: "done",
    title: "Concluído",
    color: "bg-green-600",
    tasks: [
      {
        id: "done-1",
        title: "Fix: modal",
        description:
          "Lorem ipsum dolor sit amet consectetur adipisicnonsectetur adipiscing elit g elit sed do....",
        priority: "baixa",
        assignee: "EP",
        comments: 4,
      },
    ],
  },
];

const priorityClass = {
  Alta: "border-red-400/60 bg-red-500/50 text-red-100",
  media: "border-amber-300/50 bg-amber-500/70 text-amber-100",
  baixa: "border-green-500/30 bg-green-700/70 text-green-100",
};

function Kanban() {
  const [columns, setColumns] = useState(initialColumns);

  function handleDragEnd(result: DropResult) {
    const destination = result.destination;

    if (!destination) {
      return;
    }

    setColumns((currentColumns) => {
      const nextColumns = currentColumns.map((column) => ({
        ...column,
        tasks: [...column.tasks],
      }));
      const sourceColumn = nextColumns.find(
        (column) => column.id === result.source.droppableId,
      );
      const destinationColumn = nextColumns.find(
        (column) => column.id === destination.droppableId,
      );

      if (!sourceColumn || !destinationColumn) {
        return currentColumns;
      }

      const [task] = sourceColumn.tasks.splice(result.source.index, 1);

      if (!task) {
        return currentColumns;
      }

      destinationColumn.tasks.splice(destination.index, 0, task);
      return nextColumns;
    });
  }

  function addTask(columnId: string) {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              tasks: [
                ...column.tasks,
                {
                  id: `${columnId}-${Date.now()}`,
                  title: "Nova tarefa",
                  description: "Descreva o escopo, responsável e prazo desta tarefa.",
                  priority: "media",
                  assignee: "NC",
                  comments: 0,
                },
              ],
            }
          : column,
      ),
    );
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
                  onClick={() => addTask(column.id)}
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
                                ID 203
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
                              <span className="flex items-center gap-1.5 text-sm font-semibold text-white/75">
                                <MessageCircle
                                  size={18}
                                  className="text-primary-yellow"
                                />
                                {task.comments}
                              </span>
                            </footer>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {column.id === "backlog" && (
                <button
                  type="button"
                  onClick={() => addTask(column.id)}
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
    </DragDropContext>
  );
}

export default Kanban;

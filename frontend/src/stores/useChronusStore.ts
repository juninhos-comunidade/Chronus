import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TaskPriority = "Alta" | "media" | "baixa";

export type Task = {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  comments: number;
  dueToday: boolean;
  onTime: boolean;
  pomodorosCompleted: number;
  createdAt: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
};

export type BadgeIcon = "badgeCheck" | "medal" | "shieldCheck";

export type BadgeCard = {
  icon: BadgeIcon;
  title: string;
  description: string;
  unlocked: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type CurrentUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

export type TaskWithStatus = Task & {
  status: string;
  columnId: string;
};

type CreateTaskInput = {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  dueToday: boolean;
};

type PomodoroState = {
  activeTaskId: string | null;
  focusDuration: number;
  secondsLeft: number;
  isRunning: boolean;
  sessions: PomodoroSession[];
};

type PomodoroSession = {
  id: string;
  taskId: string;
  completedAt: string;
};

type ChronusStore = {
  columns: KanbanColumn[];
  workspaces: Workspace[];
  currentUser: CurrentUser;
  pomodoro: PomodoroState;
  addTask: (columnId: string, task: CreateTaskInput) => Task | null;
  moveTask: (params: {
    sourceColumnId: string;
    sourceIndex: number;
    destinationColumnId: string;
    destinationIndex: number;
  }) => void;
  setPomodoroTask: (taskId: string) => void;
  togglePomodoro: () => void;
  resetPomodoro: () => void;
  tickPomodoro: () => void;
};

const focusDuration = 25 * 60;

const initialColumns: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    color: "bg-red-500",
    tasks: [],
  },
  {
    id: "todo",
    title: "A Fazer",
    color: "bg-blue-400",
    tasks: [],
  },
  {
    id: "progress",
    title: "Em Andamento",
    color: "bg-amber-400",
    tasks: [],
  },
  {
    id: "done",
    title: "Concluído",
    color: "bg-green-600",
    tasks: [],
  },
];

const initialWorkspaces: Workspace[] = [];

const initialCurrentUser: CurrentUser = {
  name: "Usuário",
  email: "",
};

function createTaskId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}`;
}

function createTaskCode(columns: KanbanColumn[]) {
  const highestCode = columns
    .flatMap((column) => column.tasks)
    .map((task) => Number(task.code.replace(/\D/g, "")))
    .filter(Number.isFinite)
    .reduce((highest, current) => Math.max(highest, current), 200);

  return `ID ${highestCode + 1}`;
}

function findTask(columns: KanbanColumn[], taskId: string | null) {
  if (!taskId) {
    return null;
  }

  return (
    columns
      .flatMap((column) => column.tasks)
      .find((task) => task.id === taskId) ?? null
  );
}

export function getTasksWithStatus(columns: KanbanColumn[]): TaskWithStatus[] {
  return columns.flatMap((column) =>
    column.tasks.map((task) => ({
      ...task,
      status: column.title,
      columnId: column.id,
    })),
  );
}

export function getCompletedPomodoros(columns: KanbanColumn[]) {
  return columns
    .flatMap((column) => column.tasks)
    .reduce((total, task) => total + task.pomodorosCompleted, 0);
}

export function getCompletedPomodorosToday(sessions: PomodoroSession[]) {
  const today = new Date().toDateString();

  return sessions.filter(
    (session) => new Date(session.completedAt).toDateString() === today,
  ).length;
}

export function getBadgesFromData(
  columns: KanbanColumn[],
  sessions: PomodoroSession[],
): BadgeCard[] {
  const tasks = getTasksWithStatus(columns);
  const completedTasks = tasks.filter((task) => task.status === "Concluído");
  const completedPomodoros = getCompletedPomodoros(columns);
  const completedToday = getCompletedPomodorosToday(sessions);

  return [
    {
      icon: "badgeCheck",
      title: "Mestre Cronista",
      description: "Conclua 5 tarefas para desbloquear.",
      unlocked: completedTasks.length >= 5,
    },
    {
      icon: "medal",
      title: "Sprint de Ouro",
      description: "Finalize 3 tarefas no prazo para desbloquear.",
      unlocked:
        completedTasks.filter((task) => task.onTime).length >= 3,
    },
    {
      icon: "shieldCheck",
      title: "Guardião do Foco",
      description: "Complete 4 ciclos de pomodoro no dia.",
      unlocked: completedPomodoros >= 4 || completedToday >= 4,
    },
  ];
}

export function selectActivePomodoroTask(state: ChronusStore) {
  return findTask(state.columns, state.pomodoro.activeTaskId);
}

export const useChronusStore = create<ChronusStore>()(
  persist((set, get) => ({
  columns: initialColumns,
  workspaces: initialWorkspaces,
  currentUser: initialCurrentUser,
  pomodoro: {
    activeTaskId: null,
    focusDuration,
    secondsLeft: focusDuration,
    isRunning: false,
    sessions: [],
  },
  addTask: (columnId, taskInput) => {
    const title = taskInput.title.trim();
    const description = taskInput.description.trim();
    const assignee = taskInput.assignee.trim().toUpperCase();

    if (!title || !description || !assignee) {
      return null;
    }

    const task: Task = {
      id: createTaskId(),
      code: createTaskCode(get().columns),
      title,
      description,
      priority: taskInput.priority,
      assignee: assignee.slice(0, 2),
      comments: 0,
      dueToday: taskInput.dueToday,
      onTime: true,
      pomodorosCompleted: 0,
      createdAt: new Date().toISOString(),
    };

    let created = false;

    set((state) => ({
      columns: state.columns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        created = true;
        return {
          ...column,
          tasks: [...column.tasks, task],
        };
      }),
      pomodoro: created
        ? {
            ...state.pomodoro,
            activeTaskId: task.id,
            secondsLeft: state.pomodoro.focusDuration,
            isRunning: false,
          }
        : state.pomodoro,
    }));

    return created ? task : null;
  },
  moveTask: ({
    sourceColumnId,
    sourceIndex,
    destinationColumnId,
    destinationIndex,
  }) => {
    set((state) => {
      const nextColumns = state.columns.map((column) => ({
        ...column,
        tasks: [...column.tasks],
      }));
      const sourceColumn = nextColumns.find(
        (column) => column.id === sourceColumnId,
      );
      const destinationColumn = nextColumns.find(
        (column) => column.id === destinationColumnId,
      );

      if (!sourceColumn || !destinationColumn) {
        return state;
      }

      const [task] = sourceColumn.tasks.splice(sourceIndex, 1);

      if (!task) {
        return state;
      }

      destinationColumn.tasks.splice(destinationIndex, 0, task);

      return { columns: nextColumns };
    });
  },
  setPomodoroTask: (taskId) => {
    const taskExists = Boolean(findTask(get().columns, taskId));

    if (!taskExists) {
      return;
    }

    set((state) => ({
      pomodoro: {
        ...state.pomodoro,
        activeTaskId: taskId,
        secondsLeft: state.pomodoro.focusDuration,
        isRunning: false,
      },
    }));
  },
  togglePomodoro: () => {
    if (!get().pomodoro.activeTaskId) {
      return;
    }

    set((state) => ({
      pomodoro: {
        ...state.pomodoro,
        isRunning: !state.pomodoro.isRunning,
      },
    }));
  },
  resetPomodoro: () => {
    set((state) => ({
      pomodoro: {
        ...state.pomodoro,
        secondsLeft: state.pomodoro.focusDuration,
        isRunning: false,
      },
    }));
  },
  tickPomodoro: () => {
    set((state) => {
      if (!state.pomodoro.isRunning || state.pomodoro.secondsLeft === 0) {
        return state;
      }

      const nextSecondsLeft = Math.max(state.pomodoro.secondsLeft - 1, 0);
      const completedCycle = nextSecondsLeft === 0;
      const activeTaskId = state.pomodoro.activeTaskId;

      return {
        columns: completedCycle && activeTaskId
          ? state.columns.map((column) => ({
              ...column,
              tasks: column.tasks.map((task) =>
                task.id === activeTaskId
                  ? {
                      ...task,
                      pomodorosCompleted: task.pomodorosCompleted + 1,
                    }
                  : task,
              ),
            }))
          : state.columns,
        pomodoro: {
          ...state.pomodoro,
          secondsLeft: nextSecondsLeft,
          isRunning: !completedCycle,
          sessions:
            completedCycle && activeTaskId
              ? [
                  ...state.pomodoro.sessions,
                  {
                    id: createTaskId(),
                    taskId: activeTaskId,
                    completedAt: new Date().toISOString(),
                  },
                ]
              : state.pomodoro.sessions,
        },
      };
    });
  },
}), {
    name: "chronus-store",
    version: 1,
  }),
);

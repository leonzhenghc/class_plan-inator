import { useMemo } from 'react'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { formatDue, toDateKey } from '../lib/dates.js'

/**
 * What a study session can be pointed at: outstanding assignments plus today's
 * unfinished tasks, flattened into one shape the picker and the timer can share.
 *
 * IDs are prefixed by source so an assignment and a task can never collide.
 */
export function useSessionTaskOptions() {
  const { assignments, tasks, classesById } = useWorkspace()

  return useMemo(() => {
    const todayKey = toDateKey(new Date())

    const fromAssignments = assignments
      .filter((item) => item.status !== 'done')
      .map((item) => ({
        id: `assignment:${item.id}`,
        title: item.title,
        meta: [classesById[item.class_id]?.name, formatDue(item.due_at)]
          .filter(Boolean)
          .join(' • '),
        source: 'Assignment',
        urgent: Boolean(item.due_at) && new Date(item.due_at) <= new Date(),
      }))

    const fromTasks = tasks
      .filter((item) => !item.done && item.task_date === todayKey)
      .map((item) => ({
        id: `task:${item.id}`,
        title: item.title,
        meta: item.category || 'Today',
        source: 'Task',
        urgent: false,
      }))

    return [...fromAssignments, ...fromTasks]
  }, [assignments, tasks, classesById])
}

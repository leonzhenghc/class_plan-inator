import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Checkbox from '../ui/Checkbox.jsx'
import { cn } from '../ui/cn.js'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'
import { toDateKey } from '../../lib/dates.js'

/** Day's checklist. Deliberately flat — it sits beside a dense time grid. */
export default function TaskPanel({ date, focusedTaskId = null, className }) {
  const { tasks, createTask, updateTask, deleteTask } = useWorkspace()
  const [draft, setDraft] = useState('')

  const dateKey = toDateKey(date)
  const dayTasks = tasks.filter((task) => task.task_date === dateKey)
  const remaining = dayTasks.filter((task) => !task.done).length

  // A search deep link landing here gets scrolled into view.
  useEffect(() => {
    if (!focusedTaskId) return
    document
      .querySelector(`[data-task-id="${focusedTaskId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusedTaskId])

  const add = async (event) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    setDraft('')
    await createTask({ title, task_date: dateKey })
  }

  return (
    <div className={cn('flex min-h-0 flex-col border-l border-line pl-5', className)}>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[13px] font-bold tracking-[0.08em] text-ink-3 uppercase">Tasks</p>
        <span className="text-[13px] text-ink-4">{remaining} left</span>
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {dayTasks.length === 0 ? (
          <li className="text-[13px] leading-relaxed text-ink-4">
            Nothing for this day yet.
          </li>
        ) : (
          dayTasks.map((task) => (
            <li
              key={task.id}
              data-task-id={task.id}
              className={cn(
                'group flex items-start gap-2.5 rounded-md py-1',
                focusedTaskId === task.id && 'bg-brand-50 px-1 ring-1 ring-brand-500 dark:bg-brand-500/10',
              )}
            >
              <Checkbox
                checked={task.done}
                onChange={() => updateTask(task.id, { done: !task.done })}
                label={task.title}
                className="mt-0 h-5 w-5"
              />
              <span
                className={cn(
                  'min-w-0 flex-1 text-[13px] leading-5',
                  task.done ? 'text-ink-4 line-through' : 'text-ink-2',
                )}
              >
                {task.title}
              </span>
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                aria-label={`Delete ${task.title}`}
                className="cursor-pointer rounded p-0.5 text-ink-4 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={add} className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task"
          aria-label="Add a task"
          className="h-9 min-w-0 flex-1 rounded-lg border border-line px-3 text-[13px] text-ink placeholder:text-ink-4 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}

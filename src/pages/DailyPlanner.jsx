import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Utensils } from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card from '../components/ui/Card.jsx'
import Checkbox from '../components/ui/Checkbox.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { cn } from '../components/ui/cn.js'
import { initialTasks, scheduleEvents } from '../data/mock.js'

const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 80

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

function formatHour(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${String(display).padStart(2, '0')}:00 ${suffix}`
}

export default function DailyPlanner() {
  const [tasks, setTasks] = useState(initialTasks)
  const [draft, setDraft] = useState('')

  const remaining = tasks.filter((task) => !task.done).length

  const toggleTask = (id) =>
    setTasks((items) =>
      items.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    )

  const addTask = (event) => {
    event.preventDefault()
    const label = draft.trim()
    if (!label) return
    setTasks((items) => [...items, { id: `t${Date.now()}`, label, done: false }])
    setDraft('')
  }

  return (
    <>
      <TopBar placeholder="Search tasks, notes, or classes..." />

      <main className="flex flex-1 items-start gap-6 px-8 py-8">
        {/* -------------------------------- Timeline ------------------------------- */}
        <Card className="min-w-0 flex-1 px-8 py-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Tuesday, Oct 24
              </h1>
              <p className="mt-2 text-[15px] text-gray-500">
                You have 4 study blocks scheduled today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { icon: ChevronLeft, label: 'Previous day' },
                { icon: ChevronRight, label: 'Next day' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 border-t border-gray-200 pt-6">
            <div className="relative pl-[104px]">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative h-20 border-t border-gray-100 first:border-t-0"
                >
                  <span className="absolute top-0 -left-[104px] w-[84px] -translate-y-1/2 text-right text-[13px] font-medium text-gray-500">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}

              <div className="pointer-events-none absolute inset-0 left-[104px]">
                {scheduleEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'pointer-events-auto absolute right-0 left-0 overflow-hidden rounded-lg px-5 py-4',
                      event.theme.block,
                    )}
                    style={{
                      top: `${(event.start - START_HOUR) * HOUR_HEIGHT}px`,
                      height: `${(event.end - event.start) * HOUR_HEIGHT - 6}px`,
                    }}
                  >
                    <span
                      className={cn('absolute inset-y-0 left-0 w-[5px]', event.theme.accent)}
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className={cn('text-[17px] font-bold', event.theme.title)}>
                          {event.title}
                        </p>
                        {event.subtitle ? (
                          <p className={cn('mt-1 text-[15px]', event.theme.subtitle)}>
                            {event.subtitle}
                          </p>
                        ) : null}
                        {event.tag ? (
                          <StatusTag tone="focus" className="mt-3">
                            {event.tag}
                          </StatusTag>
                        ) : null}
                      </div>
                      {event.time ? (
                        <p className={cn('shrink-0 text-[15px] font-medium', event.theme.time)}>
                          {event.time}
                        </p>
                      ) : null}
                      {event.icon === 'utensils' ? (
                        <Utensils className="h-5 w-5 shrink-0 text-emerald-700" strokeWidth={2} />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* --------------------------------- Tasks -------------------------------- */}
        <Card className="flex w-[380px] shrink-0 flex-col self-stretch px-6 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Tasks</h2>
            <span className="rounded-full bg-brand-600 px-3 py-1 text-[13px] font-bold text-white">
              {remaining} Left
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3.5"
              >
                <Checkbox
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  label={task.label}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-[15px] font-semibold',
                      task.done ? 'text-gray-400 line-through' : 'text-gray-800',
                    )}
                  >
                    {task.label}
                  </p>
                  {task.due ? (
                    <p className="mt-0.5 text-[13px] font-medium text-red-500">{task.due}</p>
                  ) : null}
                </div>
                {task.tag ? (
                  <StatusTag tone={task.tag.tone} caps={false}>
                    {task.tag.label}
                  </StatusTag>
                ) : null}
              </li>
            ))}
          </ul>

          <form onSubmit={addTask} className="mt-auto pt-6">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 pl-4">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Add a new task..."
                aria-label="Add a new task"
                className="h-9 min-w-0 flex-1 text-[15px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Add task"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <p className="mt-2 text-center text-[13px] text-gray-400">Press Enter to quick-add</p>
          </form>
        </Card>
      </main>
    </>
  )
}

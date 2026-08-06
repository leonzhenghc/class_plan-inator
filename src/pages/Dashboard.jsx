import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Filter,
  MoreHorizontal,
  NotebookPen,
  Play,
  Plus,
  RotateCcw,
  Timer,
  TrendingUp,
} from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card, { CardTitle } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Checkbox from '../components/ui/Checkbox.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { cn } from '../components/ui/cn.js'
import { learningVelocity, todaysFocus } from '../data/mock.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import AssignmentDialog from '../components/classes/AssignmentDialog.jsx'
import { daysFromToday, formatDue, startOfToday } from '../lib/dates.js'

const STATUS_TAGS = {
  todo: { label: 'To Do', tone: 'todo' },
  in_progress: { label: 'In Progress', tone: 'progress' },
  done: { label: 'Done', tone: 'done' },
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const { profile } = useAuth()
  const greetingName = profile?.display_name || profile?.full_name?.split(' ')[0] || 'there'

  const { assignments, classesById, updateAssignment } = useWorkspace()
  const [focusItems, setFocusItems] = useState(todaysFocus)
  const [assignmentDialog, setAssignmentDialog] = useState({ open: false, editing: null })
  const [openMenu, setOpenMenu] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const toggleFocus = (id) =>
    setFocusItems((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    )

  const outstanding = useMemo(
    () => assignments.filter((item) => item.status !== 'done'),
    [assignments],
  )

  const dueToday = useMemo(
    () => outstanding.filter((item) => item.due_at && daysFromToday(item.due_at) === 0).length,
    [outstanding],
  )

  /** Next seven days, with a marker whose colour reflects the nearest deadline. */
  const week = useMemo(() => {
    const base = startOfToday()
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(base)
      date.setDate(base.getDate() + offset)
      const count = outstanding.filter(
        (item) => item.due_at && daysFromToday(item.due_at) === offset,
      ).length
      return {
        label: DAY_LABELS[date.getDay()],
        date: date.getDate(),
        active: offset === 0,
        marker:
          count === 0
            ? null
            : count >= 3
              ? 'bg-red-400'
              : count === 2
                ? 'bg-amber-400'
                : 'bg-brand-500',
      }
    })
  }, [outstanding])

  const upcoming = useMemo(
    () => (showCompleted ? assignments : outstanding).slice(0, 5),
    [assignments, outstanding, showCompleted],
  )

  return (
    <>
      <TopBar placeholder="Search tasks, classes, or notes..." hasAlert />

      <main className="flex flex-1 items-start gap-6 px-8 py-8">
        {/* ------------------------------ Left column ----------------------------- */}
        <div className="min-w-0 flex-1">
          <div className="mb-8">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
              Welcome back, {greetingName}
            </h1>
            <p className="mt-3 text-lg text-gray-500">
              You have{' '}
              <span className="font-bold text-brand-600">
                {dueToday} assignment{dueToday === 1 ? '' : 's'}
              </span>{' '}
              due today.
            </p>
          </div>

          <Card className="mb-10 px-7 py-6">
            <CardTitle
              action={
                <Link
                  to="/classes"
                  className="inline-flex items-center gap-1 text-[15px] font-bold text-brand-600 hover:text-brand-700"
                >
                  Full Calendar
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              }
            >
              Weekly Outlook
            </CardTitle>

            <div className="mt-6 grid grid-cols-7 gap-2">
              {week.map((day) => (
                <div key={`${day.label}-${day.date}`} className="flex flex-col items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      day.active ? 'text-brand-600' : 'text-gray-500',
                    )}
                  >
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full border text-[17px] font-semibold',
                      day.active
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700',
                    )}
                  >
                    {day.date}
                  </span>
                  <span
                    className={cn('h-1 w-6 rounded-full', day.marker ? day.marker : 'bg-transparent')}
                  />
                </div>
              ))}
            </div>
          </Card>

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Upcoming Assignments
            </h2>
            <Button
              variant="ghost"
              size="md"
              icon={Filter}
              className="font-semibold"
              onClick={() => setShowCompleted((value) => !value)}
            >
              {showCompleted ? 'Hide completed' : 'Show completed'}
            </Button>
          </div>

          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <NotebookPen className="h-6 w-6 text-gray-400" strokeWidth={2} />
                </span>
                <p className="text-[15px] font-semibold text-gray-700">Nothing outstanding</p>
                <p className="max-w-xs text-[15px] text-gray-500">
                  Add an assignment and it will show up here, sorted by what is due soonest.
                </p>
                <Button
                  icon={Plus}
                  size="sm"
                  className="mt-1"
                  onClick={() => setAssignmentDialog({ open: true, editing: null })}
                >
                  New assignment
                </Button>
              </Card>
            ) : (
              upcoming.map((assignment) => {
                const course = classesById[assignment.class_id]
                const tag = STATUS_TAGS[assignment.status] ?? STATUS_TAGS.todo
                return (
                  <Card key={assignment.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                      <NotebookPen className="h-5 w-5" strokeWidth={2} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-bold text-gray-900">
                        {assignment.title}
                      </p>
                      <p className="mt-0.5 truncate text-[15px] text-gray-500">
                        {course ? `${course.name} • ` : ''}
                        {formatDue(assignment.due_at)}
                      </p>
                    </div>

                    <StatusTag tone={tag.tone}>{tag.label}</StatusTag>

                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Options for ${assignment.title}`}
                        onClick={() =>
                          setOpenMenu((current) => (current === assignment.id ? null : assignment.id))
                        }
                        className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-5 w-5" strokeWidth={2.25} />
                      </button>

                      {openMenu === assignment.id ? (
                        <>
                          <button
                            type="button"
                            aria-label="Close menu"
                            tabIndex={-1}
                            onClick={() => setOpenMenu(null)}
                            className="fixed inset-0 z-10 cursor-default"
                          />
                          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                            <MenuItem
                              onClick={() => {
                                setOpenMenu(null)
                                updateAssignment(assignment.id, { status: 'done' })
                              }}
                            >
                              Mark as done
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                setOpenMenu(null)
                                updateAssignment(assignment.id, {
                                  status: assignment.status === 'in_progress' ? 'todo' : 'in_progress',
                                })
                              }}
                            >
                              {assignment.status === 'in_progress'
                                ? 'Move back to To Do'
                                : 'Mark in progress'}
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                setOpenMenu(null)
                                setAssignmentDialog({ open: true, editing: assignment })
                              }}
                            >
                              Edit…
                            </MenuItem>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* ------------------------------ Right column ---------------------------- */}
        <div className="w-[380px] shrink-0 space-y-5">
          <Card className="flex items-center gap-4 px-5 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />
            </span>
            <div className="flex-1 border-r border-gray-200 pr-4">
              <p className="text-[13px] text-gray-500">Focus Score</p>
              <p className="text-[15px] font-bold text-gray-900">+12% this week</p>
            </div>
            <div className="pl-1">
              <p className="text-[13px] text-gray-500">Current Streak</p>
              <p className="text-[15px] font-bold text-gray-900">8 Days 🔥</p>
            </div>
          </Card>

          <Card className="px-6 py-5">
            <CardTitle>Today&apos;s Focus</CardTitle>
            <ul className="mt-5 space-y-4">
              {focusItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    checked={item.done}
                    onChange={() => toggleFocus(item.id)}
                    label={item.label}
                  />
                  <span className="text-[15px] leading-6 text-gray-800">{item.label}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-5 w-full cursor-pointer rounded-xl border border-dashed border-brand-300 py-3 text-[15px] font-bold text-brand-600 transition-colors hover:bg-brand-50"
            >
              + Add specific goal
            </button>
          </Card>

          <Card className="px-6 py-5">
            <CardTitle
              action={<Timer className="h-[18px] w-[18px] text-gray-500" strokeWidth={2} />}
            >
              Pomodoro
            </CardTitle>
            <p className="mt-6 text-center text-6xl font-extrabold tracking-tight tabular-nums">
              25<span className="mx-0.5">:</span>00
            </p>
            <p className="mt-2 text-center text-[15px] text-gray-500">Deep Work Session</p>
            <div className="mt-5 flex items-center gap-3">
              <Button as={Link} to="/pomodoro" icon={Play} className="flex-1">
                Start
              </Button>
              <button
                type="button"
                aria-label="Reset timer"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </button>
            </div>
          </Card>

          <Card className="px-6 py-5">
            <CardTitle
              action={
                <span className="text-[13px] font-bold text-emerald-600">↑ 18%</span>
              }
            >
              Learning Velocity
            </CardTitle>
            <div className="mt-6 flex h-40 items-end gap-3">
              {learningVelocity.map((bar, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-32 w-full items-end">
                    <div
                      className={cn(
                        'w-full rounded-t-md',
                        bar.active ? 'bg-brand-600' : 'bg-gray-200',
                      )}
                      style={{ height: `${bar.value}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{bar.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      <AssignmentDialog
        open={assignmentDialog.open}
        editing={assignmentDialog.editing}
        onClose={() => setAssignmentDialog({ open: false, editing: null })}
      />
    </>
  )
}

function MenuItem({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full cursor-pointer px-4 py-2.5 text-left text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      {children}
    </button>
  )
}

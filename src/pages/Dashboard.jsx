import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Feather,
  Filter,
  Microscope,
  MoreHorizontal,
  Play,
  RotateCcw,
  Sigma,
  Timer,
  TrendingUp,
} from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card, { CardTitle } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Checkbox from '../components/ui/Checkbox.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { cn } from '../components/ui/cn.js'
import { learningVelocity, todaysFocus, upcomingAssignments, weekDays } from '../data/mock.js'
import { useAuth } from '../context/AuthContext.jsx'

const ASSIGNMENT_ICONS = { feather: Feather, microscope: Microscope, sigma: Sigma }

export default function Dashboard() {
  const { profile } = useAuth()
  const greetingName = profile?.display_name || profile?.full_name?.split(' ')[0] || 'there'

  const [focusItems, setFocusItems] = useState(todaysFocus)

  const toggleFocus = (id) =>
    setFocusItems((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
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
              You have <span className="font-bold text-brand-600">3 assignments</span> due today.
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
              {weekDays.map((day) => (
                <div key={day.label} className="flex flex-col items-center gap-2">
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
            <Button variant="ghost" size="md" icon={Filter} className="font-semibold">
              Filter
            </Button>
          </div>

          <div className="space-y-4">
            {upcomingAssignments.map((assignment) => {
              const Icon = ASSIGNMENT_ICONS[assignment.icon]
              return (
                <Card key={assignment.id} className="flex items-center gap-4 px-5 py-4">
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      assignment.iconClass,
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-bold text-gray-900">
                      {assignment.title}
                    </p>
                    <p className="mt-0.5 truncate text-[15px] text-gray-500">{assignment.meta}</p>
                  </div>

                  <StatusTag tone={assignment.status.tone}>{assignment.status.label}</StatusTag>

                  <button
                    type="button"
                    aria-label={`Options for ${assignment.title}`}
                    className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <MoreHorizontal className="h-5 w-5" strokeWidth={2.25} />
                  </button>
                </Card>
              )
            })}
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
    </>
  )
}

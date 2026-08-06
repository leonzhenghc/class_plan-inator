import { useMemo, useState } from 'react'
import {
  ChevronDown,
  GraduationCap,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  SlidersHorizontal,
  Timer,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import TopBar from '../components/layout/TopBar.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { cn } from '../components/ui/cn.js'
import ClassDialog from '../components/classes/ClassDialog.jsx'
import AssignmentDialog from '../components/classes/AssignmentDialog.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { dueTone, formatDueShort } from '../lib/dates.js'

const CATEGORY_TONES = {
  STEM: 'stem',
  Humanities: 'humanities',
  Arts: 'arts',
  'Social Science': 'social',
  Other: 'todo',
}

const ALL_TERMS = '__all__'

export default function ClassPlanner() {
  const { loading, classes, statsByClass } = useWorkspace()
  const [view, setView] = useState('grid')
  const [term, setTerm] = useState(ALL_TERMS)
  const [sortBy, setSortBy] = useState('due')
  const [classDialog, setClassDialog] = useState({ open: false, editing: null })
  const [assignmentDialog, setAssignmentDialog] = useState({ open: false, classId: null })

  const terms = useMemo(
    () => [...new Set(classes.map((item) => item.term).filter(Boolean))].sort(),
    [classes],
  )

  const visible = useMemo(() => {
    const filtered =
      term === ALL_TERMS ? classes : classes.filter((item) => (item.term || '') === term)

    // Classes with nothing outstanding sink to the bottom rather than jumping to the top.
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      const nextA = statsByClass[a.id]?.next?.due_at
      const nextB = statsByClass[b.id]?.next?.due_at
      if (!nextA && !nextB) return a.name.localeCompare(b.name)
      if (!nextA) return 1
      if (!nextB) return -1
      return new Date(nextA) - new Date(nextB)
    })
  }, [classes, term, sortBy, statsByClass])

  return (
    <>
      <TopBar placeholder="Search classes or assignments..." />

      <main className="flex-1 px-8 py-8">
        <div className="mb-7 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">Class Planner</h1>
            <p className="mt-3 text-lg text-gray-500">
              Manage your academic load and track your assignment progress.
            </p>
          </div>
          <Button
            icon={Plus}
            size="lg"
            onClick={() => setClassDialog({ open: true, editing: null })}
          >
            Add Class
          </Button>
        </div>

        <Card className="mb-7 flex flex-wrap items-center gap-4 px-6 py-4">
          <span className="flex items-center gap-2 text-[13px] font-bold tracking-[0.08em] text-gray-500 uppercase">
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            Filter by:
          </span>

          <div className="relative">
            <select
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Filter by term"
              className="h-11 cursor-pointer appearance-none rounded-xl border border-gray-200 pr-10 pl-4 text-[15px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none"
            >
              <option value={ALL_TERMS}>All terms</option>
              {terms.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500"
              strokeWidth={2.5}
            />
          </div>

          <button
            type="button"
            onClick={() => setSortBy((current) => (current === 'due' ? 'name' : 'due'))}
            className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-gray-200 px-4 text-[15px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {sortBy === 'due' ? 'Sort by Due Date' : 'Sort by Name'}
          </button>

          <div className="ml-auto flex items-center gap-2">
            {[
              { id: 'grid', icon: LayoutGrid, label: 'Grid view' },
              { id: 'list', icon: List, label: 'List view' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={cn(
                  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors',
                  view === id
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </button>
            ))}
          </div>
        </Card>

        {loading ? (
          <p className="py-16 text-center text-[15px] text-gray-400">Loading your classes…</p>
        ) : (
          <div
            className={cn(
              'gap-6',
              view === 'grid' ? 'grid grid-cols-1 xl:grid-cols-3' : 'flex flex-col',
            )}
          >
            {visible.map((course) => {
              const stats = statsByClass[course.id] ?? { total: 0, done: 0, next: null }
              return (
                <Card key={course.id} className="group flex flex-col px-6 py-6">
                  <div className="flex items-start justify-between gap-3">
                    <StatusTag tone={CATEGORY_TONES[course.category] ?? 'todo'}>
                      {course.category}
                    </StatusTag>
                    <button
                      type="button"
                      onClick={() => setClassDialog({ open: true, editing: course })}
                      aria-label={`Edit ${course.name}`}
                      className="cursor-pointer rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                  </div>

                  <h3 className="mt-4 text-[27px] leading-tight font-extrabold tracking-tight text-gray-900">
                    {course.name}
                  </h3>
                  <p className="mt-2 flex items-center gap-2 text-[15px] text-gray-500">
                    <GraduationCap className="h-[18px] w-[18px]" strokeWidth={2} />
                    {course.professor || 'No professor set'}
                  </p>

                  <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3.5">
                    <p className="text-[11px] font-bold tracking-[0.08em] text-gray-500 uppercase">
                      Next Assignment
                    </p>
                    {stats.next ? (
                      <div className="mt-1.5 flex items-start justify-between gap-3">
                        <p className="text-[15px] font-semibold text-gray-800">{stats.next.title}</p>
                        <p
                          className={cn(
                            'shrink-0 text-right text-[13px] font-semibold',
                            dueTone(stats.next.due_at, stats.next.status),
                          )}
                        >
                          {formatDueShort(stats.next.due_at)}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssignmentDialog({ open: true, classId: course.id })}
                        className="mt-1.5 cursor-pointer text-[15px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Nothing due — add one
                      </button>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[15px] text-gray-600">Course Progress</span>
                      <span className="text-[15px] font-semibold text-brand-600">
                        {stats.done}/{stats.total} Assignments
                      </span>
                    </div>
                    <ProgressBar value={stats.done} max={stats.total || 1} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setAssignmentDialog({ open: true, classId: course.id })}
                    className="mt-4 cursor-pointer self-start text-[13px] font-semibold text-gray-400 transition-colors hover:text-brand-600"
                  >
                    + Add assignment
                  </button>
                </Card>
              )
            })}

            <button
              type="button"
              onClick={() => setClassDialog({ open: true, editing: null })}
              className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Plus className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <span className="text-[15px] font-semibold">
                {classes.length === 0 ? 'Add your first class' : 'Enroll in a new class'}
              </span>
            </button>
          </div>
        )}

        <div className="relative mt-10 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-10 py-12 text-white">
          <Timer
            className="absolute -right-6 bottom-[-30px] h-64 w-64 text-white/10"
            strokeWidth={1.25}
          />
          <div className="relative max-w-xl">
            <h3 className="text-3xl font-extrabold tracking-tight">Ready to crush your goals?</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-100">
              Focus sessions can increase your productivity by up to 40%. Join 2,000 students online
              right now.
            </p>
            <Button as={Link} to="/pomodoro" variant="white" size="lg" className="mt-7">
              Start Focus Mode
            </Button>
          </div>
        </div>
      </main>

      <ClassDialog
        open={classDialog.open}
        editing={classDialog.editing}
        onClose={() => setClassDialog({ open: false, editing: null })}
      />
      <AssignmentDialog
        open={assignmentDialog.open}
        defaultClassId={assignmentDialog.classId}
        onClose={() => setAssignmentDialog({ open: false, classId: null })}
      />
    </>
  )
}

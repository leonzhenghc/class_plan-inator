import { useState } from 'react'
import { ChevronDown, GraduationCap, LayoutGrid, List, Plus, SlidersHorizontal, Timer } from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { cn } from '../components/ui/cn.js'
import { classes } from '../data/mock.js'

export default function ClassPlanner() {
  const [view, setView] = useState('grid')

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
          <Button icon={Plus} size="lg">
            Add Class
          </Button>
        </div>

        <Card className="mb-7 flex flex-wrap items-center gap-4 px-6 py-4">
          <span className="flex items-center gap-2 text-[13px] font-bold tracking-[0.08em] text-gray-500 uppercase">
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            Filter by:
          </span>

          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 text-[15px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Fall Semester 2023
            <ChevronDown className="h-4 w-4 text-gray-500" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-gray-200 px-4 text-[15px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Sort by Due Date
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

        <div
          className={cn(
            'gap-6',
            view === 'grid' ? 'grid grid-cols-1 xl:grid-cols-3' : 'flex flex-col',
          )}
        >
          {classes.map((course) => (
            <Card key={course.id} className="flex flex-col px-6 py-6">
              <StatusTag tone={course.tone} className="self-start">
                {course.category}
              </StatusTag>

              <h3 className="mt-5 text-[27px] leading-tight font-extrabold tracking-tight text-gray-900">
                {course.name}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-[15px] text-gray-500">
                <GraduationCap className="h-[18px] w-[18px]" strokeWidth={2} />
                {course.professor}
              </p>

              <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3.5">
                <p className="text-[11px] font-bold tracking-[0.08em] text-gray-500 uppercase">
                  Next Assignment
                </p>
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-gray-800">
                    {course.nextAssignment}
                  </p>
                  <p
                    className={cn(
                      'shrink-0 text-right text-[13px] font-semibold',
                      course.dueTone,
                    )}
                  >
                    {course.due}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[15px] text-gray-600">Course Progress</span>
                  <span className="text-[15px] font-semibold text-brand-600">
                    {course.completed}/{course.total} Assignments
                  </span>
                </div>
                <ProgressBar value={course.completed} max={course.total} />
              </div>
            </Card>
          ))}

          <button
            type="button"
            className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Plus className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <span className="text-[15px] font-semibold">Enroll in a new class</span>
          </button>
        </div>

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
            <Button variant="white" size="lg" className="mt-7">
              Start Focus Mode
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, CircleHelp, ClipboardList, GraduationCap, NotebookPen, Search } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'
import { formatDueShort } from '../../lib/dates.js'
import { buildTarget } from '../../lib/searchTarget.js'

const SEARCH_LIMIT = 4

export default function TopBar({ placeholder = 'Search tasks, classes, or notes...', hasAlert }) {
  const { profile } = useAuth()
  const { classes, assignments, tasks, events } = useWorkspace()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return { classes: [], assignments: [], tasks: [], events: [] }
    const hit = (text) => text?.toString().toLowerCase().includes(needle)
    return {
      classes: classes.filter((c) => hit(c.name) || hit(c.professor) || hit(c.category)).slice(0, SEARCH_LIMIT),
      assignments: assignments.filter((a) => hit(a.title)).slice(0, SEARCH_LIMIT),
      tasks: tasks.filter((t) => hit(t.title) || hit(t.category)).slice(0, SEARCH_LIMIT),
      events: events.filter((e) => hit(e.title) || hit(e.subtitle)).slice(0, SEARCH_LIMIT),
    }
  }, [query, classes, assignments, tasks, events])

  const total = results.classes.length + results.assignments.length + results.tasks.length + results.events.length
  const open = focused && query.trim().length > 0

  // Results deep-link to the exact item on the destination page; every page
  // reads the focus parameter to highlight what was searched for.
  const go = (to) => {
    setQuery('')
    setFocused(false)
    navigate(to)
  }

  // Result groups are keyed by plural names; buildTarget speaks singular kinds.
  const KIND_BY_GROUP = {
    classes: 'class',
    assignments: 'assignment',
    tasks: 'task',
    events: 'event',
  }

  const goFirst = (event) => {
    if (event.key !== 'Enter') return
    const first =
      results.classes[0] ??
      results.assignments[0] ??
      results.tasks[0] ??
      results.events[0]
    if (!first) return
    const [group] = Object.entries(results).find(([, items]) => items[0] === first) ?? []
    const kind = KIND_BY_GROUP[group]
    if (kind) go(buildTarget(kind, first).to)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
      <div className="flex h-20 items-center gap-6 px-8">
        <div className="relative w-full max-w-[520px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-ink-4"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={goFirst}
            placeholder={placeholder}
            aria-label="Search"
            className="h-12 w-full rounded-full bg-surface-2 pr-4 pl-12 text-[15px] text-ink-2 placeholder:text-ink-4 focus:bg-surface focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />

          {open ? (
            <div className="absolute top-14 right-0 left-0 z-20 overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
              {total === 0 ? (
                <p className="px-5 py-4 text-[15px] text-ink-3">
                  No results for &ldquo;{query.trim()}&rdquo;
                </p>
              ) : (
                <ul className="max-h-[420px] overflow-y-auto py-2">
                  <SearchGroup
                    label="Classes"
                    icon={GraduationCap}
                    items={results.classes}
                    title={(item) => item.name}
                    meta={(item) => item.professor || item.category}
                    to={(item) => buildTarget('class', item).to}
                    onPick={go}
                  />
                  <SearchGroup
                    label="Assignments"
                    icon={NotebookPen}
                    items={results.assignments}
                    title={(item) => item.title}
                    meta={(item) => formatDueShort(item.due_at)}
                    to={(item) => buildTarget('assignment', item).to}
                    onPick={go}
                  />
                  <SearchGroup
                    label="Events"
                    icon={CalendarDays}
                    items={results.events}
                    title={(item) => item.title}
                    meta={(item) => item.subtitle}
                    to={(item) => buildTarget('event', item).to}
                    onPick={go}
                  />
                  <SearchGroup
                    label="Tasks"
                    icon={ClipboardList}
                    items={results.tasks}
                    title={(item) => item.title}
                    meta={(item) => item.category}
                    to={(item) => buildTarget('task', item).to}
                    onPick={go}
                  />
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-5">
          <button
            type="button"
            aria-label="Notifications"
            className="relative cursor-pointer text-ink-3 transition-colors hover:text-ink"
          >
            <Bell className="h-[22px] w-[22px]" strokeWidth={2} />
            {hasAlert ? (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            ) : null}
          </button>
          <button
            type="button"
            aria-label="Help"
            className="cursor-pointer text-ink-3 transition-colors hover:text-ink"
          >
            <CircleHelp className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <Avatar
            name={profile?.full_name || profile?.display_name || 'Student'}
            className="h-10 w-10"
            textClassName="text-sm"
          />
        </div>
      </div>
    </header>
  )
}

function SearchGroup({ label, icon: Icon, items, title, meta, to, onPick }) {
  if (items.length === 0) return null
  return (
    <li>
      <p className="px-5 pt-3 pb-1.5 text-[11px] font-bold tracking-[0.08em] text-ink-4 uppercase">
        {label}
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          // mousedown fires before the input blurs, so the dropdown is still open.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(to(item))}
          className="flex w-full cursor-pointer items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-surface-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-3">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-ink">{title(item)}</span>
            {meta(item) ? (
              <span className="block truncate text-[13px] text-ink-4">{meta(item)}</span>
            ) : null}
          </span>
        </button>
      ))}
    </li>
  )
}
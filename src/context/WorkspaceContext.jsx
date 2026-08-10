import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const WorkspaceContext = createContext(null)

/**
 * The signed-in user's classes and assignments, loaded once and shared, so the
 * Dashboard and Class Planner don't each fetch the same rows.
 *
 * Every mutation writes to Supabase first and only then updates local state, so
 * the UI can never drift from what was actually stored.
 */
export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  /** Monotonic run id; a stale in-flight fetch is discarded once a newer run starts. */
  const loadRef = useRef(0)
  /**
   * Mirror of `events` for the series helpers. They need the current rows but
   * must not be recreated every time an event changes, or the drag handlers
   * they feed would be rebuilt mid-gesture.
   */
  const eventsRef = useRef([])

  const load = useCallback(async () => {
    const run = ++loadRef.current

    if (!user) {
      setClasses([])
      setAssignments([])
      setTasks([])
      setEvents([])
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    // A student's whole workspace is small, so fetch it once and filter by date
    // in memory. That keeps day-to-day navigation instant with no extra round trips.
    const [classResult, assignmentResult, taskResult, eventResult, sessionResult] =
      await Promise.all([
      supabase.from('classes').select('*').order('created_at', { ascending: true }),
      supabase
        .from('assignments')
        .select('*')
        .order('due_at', { ascending: true, nullsFirst: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      supabase.from('events').select('*').order('starts_at', { ascending: true }),
      supabase
        .from('pomodoro_sessions')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(500),
    ])

    // A newer run owns the state now — typically the user signed out mid-fetch.
    if (run !== loadRef.current) return

    setError(
      classResult.error ??
        assignmentResult.error ??
        taskResult.error ??
        eventResult.error ??
        sessionResult.error ??
        null,
    )
    setClasses(classResult.data ?? [])
    setAssignments(assignmentResult.data ?? [])
    setTasks(taskResult.data ?? [])
    setEvents(eventResult.data ?? [])
    setSessions(sessionResult.data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  /* ------------------------------- classes -------------------------------- */

  const createClass = useCallback(
    async (values) => {
      const { data, error: insertError } = await supabase
        .from('classes')
        .insert({ ...values, user_id: user.id })
        .select()
        .single()
      if (!insertError) setClasses((current) => [...current, data])
      return { data, error: insertError }
    },
    [user],
  )

  const updateClass = useCallback(async (id, values) => {
    const { data, error: updateError } = await supabase
      .from('classes')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!updateError) {
      setClasses((current) => current.map((item) => (item.id === id ? data : item)))
    }
    return { data, error: updateError }
  }, [])

  const deleteClass = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('classes').delete().eq('id', id)
    if (!deleteError) {
      setClasses((current) => current.filter((item) => item.id !== id))
      // The FK cascades in Postgres; mirror that locally instead of refetching.
      setAssignments((current) => current.filter((item) => item.class_id !== id))
    }
    return { error: deleteError }
  }, [])

  /* ----------------------------- assignments ------------------------------ */

  const createAssignment = useCallback(
    async (values) => {
      const { data, error: insertError } = await supabase
        .from('assignments')
        .insert({ ...values, user_id: user.id })
        .select()
        .single()
      if (!insertError) setAssignments((current) => [...current, data])
      return { data, error: insertError }
    },
    [user],
  )

  const updateAssignment = useCallback(async (id, values) => {
    const { data, error: updateError } = await supabase
      .from('assignments')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!updateError) {
      setAssignments((current) => current.map((item) => (item.id === id ? data : item)))
    }
    return { data, error: updateError }
  }, [])

  const deleteAssignment = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('assignments').delete().eq('id', id)
    if (!deleteError) setAssignments((current) => current.filter((item) => item.id !== id))
    return { error: deleteError }
  }, [])

  /* -------------------------------- tasks --------------------------------- */

  const createTask = useCallback(
    async (values) => {
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({ ...values, user_id: user.id })
        .select()
        .single()
      if (!insertError) setTasks((current) => [...current, data])
      return { data, error: insertError }
    },
    [user],
  )

  const updateTask = useCallback(async (id, values) => {
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!updateError) setTasks((current) => current.map((item) => (item.id === id ? data : item)))
    return { data, error: updateError }
  }, [])

  const deleteTask = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id)
    if (!deleteError) setTasks((current) => current.filter((item) => item.id !== id))
    return { error: deleteError }
  }, [])

  /* -------------------------------- events -------------------------------- */

  const createEvent = useCallback(
    async (values) => {
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({ ...values, user_id: user.id })
        .select()
        .single()
      if (!insertError) setEvents((current) => [...current, data])
      return { data, error: insertError }
    },
    [user],
  )

  const updateEvent = useCallback(async (id, values) => {
    const { data, error: updateError } = await supabase
      .from('events')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!updateError) setEvents((current) => current.map((item) => (item.id === id ? data : item)))
    return { data, error: updateError }
  }, [])

  /** Hides one date of a series — used by "delete this occurrence". */
  const excludeOccurrence = useCallback(async (seriesId, dateKey) => {
    const series = eventsRef.current.find((item) => item.id === seriesId)
    if (!series) return { error: new Error('Series not found') }
    const excluded = [...new Set([...(series.excluded_dates ?? []), dateKey])]
    return updateEvent(seriesId, { excluded_dates: excluded })
  }, [updateEvent])

  /**
   * Detaches one date from a series: the series skips it, and a normal row
   * takes its place. That row is an ordinary event from then on, so editing or
   * dragging it later never touches the rest of the series.
   */
  const overrideOccurrence = useCallback(
    async (seriesId, dateKey, values) => {
      const series = eventsRef.current.find((item) => item.id === seriesId)
      if (!series) return { error: new Error('Series not found') }

      const { error: excludeError } = await excludeOccurrence(seriesId, dateKey)
      if (excludeError) return { error: excludeError }

      const { id, created_at, updated_at, ...base } = series
      return createEvent({
        ...base,
        repeat_freq: null,
        repeat_days: [],
        repeat_until: null,
        excluded_dates: [],
        recurrence_id: seriesId,
        event_date: dateKey,
        ...values,
      })
    },
    [excludeOccurrence, createEvent],
  )

  const deleteEvent = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('events').delete().eq('id', id)
    if (!deleteError) setEvents((current) => current.filter((item) => item.id !== id))
    return { error: deleteError }
  }, [])

  /* --------------------------- pomodoro sessions --------------------------- */

  /** Records a finished focus or break block. Newest first, matching the query. */
  const logSession = useCallback(
    async (values) => {
      if (!user) return { error: new Error('Not signed in') }
      const { data, error: insertError } = await supabase
        .from('pomodoro_sessions')
        .insert({ ...values, user_id: user.id })
        .select()
        .single()
      if (!insertError) setSessions((current) => [data, ...current])
      return { data, error: insertError }
    },
    [user],
  )

  /* ------------------------------- derived -------------------------------- */

  const classesById = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, item])),
    [classes],
  )

  /** Per class: total, how many are done, and the soonest one still outstanding. */
  const statsByClass = useMemo(() => {
    const stats = Object.fromEntries(
      classes.map((item) => [item.id, { total: 0, done: 0, next: null }]),
    )

    for (const assignment of assignments) {
      const bucket = stats[assignment.class_id]
      if (!bucket) continue

      bucket.total += 1

      if (assignment.status === 'done') {
        bucket.done += 1
        continue
      }

      // Undated assignments only fill the slot when nothing dated has claimed it.
      const current = bucket.next
      if (!current) bucket.next = assignment
      else if (assignment.due_at && !current.due_at) bucket.next = assignment
      else if (
        assignment.due_at &&
        current.due_at &&
        new Date(assignment.due_at) < new Date(current.due_at)
      ) {
        bucket.next = assignment
      }
    }

    return stats
  }, [classes, assignments])

  const value = useMemo(
    () => ({
      loading,
      error,
      classes,
      assignments,
      tasks,
      events,
      sessions,
      classesById,
      statsByClass,
      reload: load,
      createClass,
      updateClass,
      deleteClass,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      createTask,
      updateTask,
      deleteTask,
      createEvent,
      updateEvent,
      deleteEvent,
      excludeOccurrence,
      overrideOccurrence,
      logSession,
    }),
    [
      loading,
      error,
      classes,
      assignments,
      tasks,
      events,
      sessions,
      classesById,
      statsByClass,
      load,
      createClass,
      updateClass,
      deleteClass,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      createTask,
      updateTask,
      deleteTask,
      createEvent,
      updateEvent,
      deleteEvent,
      excludeOccurrence,
      overrideOccurrence,
      logSession,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return context
}

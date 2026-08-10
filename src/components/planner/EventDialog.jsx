import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Dialog, { Field, inputClass } from '../ui/Dialog.jsx'
import Button from '../ui/Button.jsx'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'
import { hoursToTimeInput, timeInputToHours } from '../../lib/dates.js'
import { WEEKDAYS } from '../../lib/recurrence.js'
import { cn } from '../ui/cn.js'

export const EVENT_KINDS = [
  { value: 'class', label: 'Class' },
  { value: 'study', label: 'Study' },
  { value: 'break', label: 'Break' },
  { value: 'personal', label: 'Personal' },
]

export default function EventDialog({ open, onClose, editing, dateKey, defaultStart }) {
  const { classes, events, createEvent, updateEvent, deleteEvent, excludeOccurrence, overrideOccurrence } =
    useWorkspace()

  /** The stored row behind whatever is being edited — a series, or a plain event. */
  const series = editing?.seriesId
    ? events.find((item) => item.id === editing.seriesId)
    : editing
  const repeats = Boolean(series?.repeat_freq)
  const [values, setValues] = useState({
    dateKey: '',
    title: '',
    subtitle: '',
    kind: 'study',
    start: '09:00',
    end: '10:00',
    tag: '',
    classId: '',
    repeatFreq: '',
    repeatDays: [],
    repeatUntil: '',
  })
  /** 'one' edits just this date, 'all' edits the series. Only shown when relevant. */
  const [scope, setScope] = useState('one')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues({
      dateKey: dateKey ?? '',
      title: editing?.title ?? '',
      subtitle: editing?.subtitle ?? '',
      kind: editing?.kind ?? 'study',
      start: hoursToTimeInput(editing ? Number(editing.starts_at) : (defaultStart ?? 9)),
      end: hoursToTimeInput(editing ? Number(editing.ends_at) : (defaultStart ?? 9) + 1),
      tag: editing?.tag ?? '',
      classId: editing?.class_id ?? '',
      repeatFreq: series?.repeat_freq ?? '',
      repeatDays: series?.repeat_days ?? [],
      repeatUntil: series?.repeat_until ?? '',
    })
    setScope('one')
    setError(null)
    setConfirmingDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultStart, dateKey])

  const set = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()

    if (!values.dateKey) {
      setError('Pick a day for this block.')
      return
    }

    const starts = timeInputToHours(values.start)
    const ends = timeInputToHours(values.end)

    if (!values.title.trim()) {
      setError('Give the event a title.')
      return
    }
    if (starts === null || ends === null) {
      setError('Set both a start and an end time.')
      return
    }
    // The database enforces this too; catching it here gives a better message.
    if (ends <= starts) {
      setError('The end time has to be after the start time.')
      return
    }

    setError(null)

    const payload = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      kind: values.kind,
      event_date: values.dateKey,
      starts_at: starts,
      ends_at: ends,
      tag: values.tag.trim(),
      class_id: values.classId || null,
    }

    // Editing one date of a series detaches that date instead of touching the rule.
    if (repeats && editing?.isOccurrence && scope === 'one') {
      setBusy(true)
      const { error: overrideError } = await overrideOccurrence(
        editing.seriesId,
        editing.event_date,
        payload,
      )
      setBusy(false)
      if (overrideError) {
        setError(overrideError.message)
        return
      }
      onClose()
      return
    }

    const rule = {
      repeat_freq: values.repeatFreq || null,
      repeat_days: values.repeatFreq === 'weekly' ? values.repeatDays : [],
      repeat_until: values.repeatFreq && values.repeatUntil ? values.repeatUntil : null,
    }

    // "All events" keeps the series on its own start date; only the rule and
    // details change, otherwise editing a later occurrence would move the series.
    const target = repeats ? series : editing
    setBusy(true)
    const { error: saveError } = target
      ? await updateEvent(target.id, {
          ...payload,
          event_date: repeats ? series.event_date : payload.event_date,
          ...rule,
        })
      : await createEvent({ ...payload, ...rule })

    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    onClose()
  }

  const remove = async () => {
    setBusy(true)
    const { error: deleteError } =
      repeats && editing?.isOccurrence && scope === 'one'
        ? await excludeOccurrence(editing.seriesId, editing.event_date)
        : await deleteEvent(repeats ? series.id : editing.id)
    setBusy(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit block' : 'Add to your day'}
      description={editing ? undefined : 'Blocks show up on the timeline for this day.'}
      footer={
        <>
          {editing ? (
            <Button
              type="button"
              variant="outline"
              icon={Trash2}
              onClick={() => (confirmingDelete ? remove() : setConfirmingDelete(true))}
              disabled={busy}
              className={
                confirmingDelete ? 'mr-auto border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' : 'mr-auto'
              }
            >
              {confirmingDelete ? 'Delete for good?' : 'Delete'}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="event-form" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add block'}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} className="space-y-5 pb-3">
        <Field id="event-title" label="Title">
          <input
            id="event-title"
            value={values.title}
            onChange={set('title')}
            placeholder="Intro to Psychology"
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field id="event-subtitle" label="Details" hint="Room, focus, anything useful">
          <input
            id="event-subtitle"
            value={values.subtitle}
            onChange={set('subtitle')}
            placeholder="Room 402 — Lecture on Neuroplasticity"
            className={inputClass}
          />
        </Field>

        <Field
          id="event-date"
          label="Day"
          hint={editing ? 'Use drag to move a block to another day' : undefined}
        >
          <input
            id="event-date"
            type="date"
            value={values.dateKey}
            onChange={set('dateKey')}
            disabled={Boolean(editing)}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="event-start" label="Starts">
            <input
              id="event-start"
              type="time"
              value={values.start}
              onChange={set('start')}
              className={inputClass}
            />
          </Field>
          <Field id="event-end" label="Ends">
            <input
              id="event-end"
              type="time"
              value={values.end}
              onChange={set('end')}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="event-kind" label="Type" hint="Sets the block colour">
            <select
              id="event-kind"
              value={values.kind}
              onChange={set('kind')}
              className={`${inputClass} cursor-pointer bg-surface`}
            >
              {EVENT_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="event-class" label="Class" hint="Optional">
            <select
              id="event-class"
              value={values.classId}
              onChange={set('classId')}
              className={`${inputClass} cursor-pointer bg-surface`}
            >
              <option value="">No class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* -------------------------------- Repeat -------------------------------- */}
        <div className="rounded-xl border border-line p-4">
          <Field id="event-repeat" label="Repeat">
            <select
              id="event-repeat"
              value={values.repeatFreq}
              onChange={set('repeatFreq')}
              disabled={editing?.isOccurrence && scope === 'one'}
              className={`${inputClass} cursor-pointer bg-surface disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">Does not repeat</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Every day</option>
            </select>
          </Field>

          {values.repeatFreq === 'weekly' ? (
            <div className="mt-4">
              <span className="mb-2 block text-[13px] font-medium text-ink-3">On these days</span>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((day) => {
                  const active = values.repeatDays.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-label={day.full}
                      aria-pressed={active}
                      disabled={editing?.isOccurrence && scope === 'one'}
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          repeatDays: current.repeatDays.includes(day.value)
                            ? current.repeatDays.filter((value) => value !== day.value)
                            : [...current.repeatDays, day.value],
                        }))
                      }
                      className={cn(
                        'h-9 w-9 cursor-pointer rounded-full text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                        active
                          ? 'bg-brand-600 text-white'
                          : 'bg-surface-2 text-ink-2 hover:bg-line',
                      )}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {values.repeatFreq ? (
            <Field
              id="event-until"
              label="Until"
              hint="Leave blank to repeat indefinitely"
              className="mt-4"
            >
              <input
                id="event-until"
                type="date"
                value={values.repeatUntil}
                onChange={set('repeatUntil')}
                disabled={editing?.isOccurrence && scope === 'one'}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </Field>
          ) : null}
        </div>

        {/* Only meaningful when one date of a repeating series is being edited. */}
        {repeats && editing?.isOccurrence ? (
          <div className="rounded-xl bg-surface-2 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'one', label: 'This event' },
                { value: 'all', label: 'The whole series' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setScope(option.value)}
                  className={cn(
                    'cursor-pointer rounded-lg py-2 text-[13px] font-semibold transition-colors',
                    scope === option.value
                      ? 'bg-surface text-ink shadow-sm'
                      : 'text-ink-3 hover:text-ink',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="px-2 pt-2 pb-1 text-[12px] leading-relaxed text-ink-4">
              {scope === 'one'
                ? 'Changes apply to this date only, and it stops following the series.'
                : 'Changes apply to every occurrence, including the repeat rule.'}
            </p>
          </div>
        ) : null}

        <Field id="event-tag" label="Tag" hint='Optional, e.g. "High focus"'>
          <input
            id="event-tag"
            value={values.tag}
            onChange={set('tag')}
            placeholder="High focus"
            className={inputClass}
          />
        </Field>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Dialog, { Field, inputClass } from '../ui/Dialog.jsx'
import Button from '../ui/Button.jsx'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'
import { hoursToTimeInput, timeInputToHours } from '../../lib/dates.js'

export const EVENT_KINDS = [
  { value: 'class', label: 'Class' },
  { value: 'study', label: 'Study' },
  { value: 'break', label: 'Break' },
  { value: 'personal', label: 'Personal' },
]

export default function EventDialog({ open, onClose, editing, dateKey, defaultStart }) {
  const { classes, createEvent, updateEvent, deleteEvent } = useWorkspace()
  const [values, setValues] = useState({
    title: '',
    subtitle: '',
    kind: 'study',
    start: '09:00',
    end: '10:00',
    tag: '',
    classId: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues({
      title: editing?.title ?? '',
      subtitle: editing?.subtitle ?? '',
      kind: editing?.kind ?? 'study',
      start: hoursToTimeInput(editing ? Number(editing.starts_at) : (defaultStart ?? 9)),
      end: hoursToTimeInput(editing ? Number(editing.ends_at) : (defaultStart ?? 9) + 1),
      tag: editing?.tag ?? '',
      classId: editing?.class_id ?? '',
    })
    setError(null)
    setConfirmingDelete(false)
  }, [open, editing, defaultStart])

  const set = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()

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

    setBusy(true)
    setError(null)

    const payload = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      kind: values.kind,
      event_date: dateKey,
      starts_at: starts,
      ends_at: ends,
      tag: values.tag.trim(),
      class_id: values.classId || null,
    }

    const { error: saveError } = editing
      ? await updateEvent(editing.id, payload)
      : await createEvent(payload)

    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    onClose()
  }

  const remove = async () => {
    setBusy(true)
    const { error: deleteError } = await deleteEvent(editing.id)
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

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Dialog, { Field, inputClass } from '../ui/Dialog.jsx'
import Button from '../ui/Button.jsx'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'
import { buildClassSchedule, SEMESTERS } from '../../lib/classSchedule.js'
import { WEEKDAYS } from '../../lib/recurrence.js'
import { hoursToTimeInput, timeInputToHours } from '../../lib/dates.js'
import { cn } from '../ui/cn.js'

export const CATEGORIES = ['STEM', 'Humanities', 'Arts', 'Social Science', 'Other']

const EMPTY = {
  name: '',
  professor: '',
  category: 'STEM',
  code: '',
  semester: '',
  startsOn: '',
  endsOn: '',
  startTime: '',
  endTime: '',
  meetingDays: [],
}

export default function ClassDialog({ open, onClose, editing }) {
  const { createClass, updateClass, deleteClass } = useWorkspace()
  const [values, setValues] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(
      editing
        ? {
            name: editing.name ?? '',
            professor: editing.professor ?? '',
            category: editing.category ?? 'STEM',
            code: editing.code ?? '',
            semester: editing.semester ?? '',
            startsOn: editing.starts_on ?? '',
            endsOn: editing.ends_on ?? '',
            startTime: editing.start_time ? hoursToTimeInput(Number(editing.start_time)) : '',
            endTime: editing.end_time ? hoursToTimeInput(Number(editing.end_time)) : '',
            meetingDays: editing.meeting_days ?? [],
          }
        : EMPTY,
    )
    setError(null)
    setConfirmingDelete(false)
  }, [open, editing])

  const set = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const toggleDay = (day) =>
    setValues((current) => ({
      ...current,
      meetingDays: current.meetingDays.includes(day)
        ? current.meetingDays.filter((value) => value !== day)
        : [...current.meetingDays, day],
    }))

  const submit = async (event) => {
    event.preventDefault()
    if (!values.name.trim()) {
      setError('Give the class a name.')
      return
    }

    const { schedule, error: scheduleError } = buildClassSchedule({
      classId: editing?.id ?? null,
      name: values.name.trim(),
      startsOn: values.startsOn,
      endsOn: values.endsOn,
      startTime: values.startTime ? timeInputToHours(values.startTime) : null,
      endTime: values.endTime ? timeInputToHours(values.endTime) : null,
      meetingDays: values.meetingDays,
    })
    if (scheduleError) {
      setError(scheduleError.message)
      return
    }

    setBusy(true)
    setError(null)

    const payload = {
      name: values.name.trim(),
      professor: values.professor.trim(),
      category: values.category,
      code: values.code.trim(),
      semester: values.semester || null,
      starts_on: values.startsOn || null,
      ends_on: values.endsOn || null,
      start_time: values.startTime ? timeInputToHours(values.startTime) : null,
      end_time: values.endTime ? timeInputToHours(values.endTime) : null,
      meeting_days: values.meetingDays,
    }

    const { error: saveError } = editing
      ? await updateClass(editing.id, payload, schedule)
      : await createClass(payload, schedule)

    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    onClose()
  }

  const remove = async () => {
    setBusy(true)
    const { error: deleteError } = await deleteClass(editing.id)
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
      title={editing ? 'Edit class' : 'Add a class'}
      description={
        editing
          ? 'Update the details for this class.'
          : 'Add its schedule too and the meetings appear in your calendar.'
      }
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
          <Button type="submit" form="class-form" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add class'}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={submit} className="space-y-5 pb-3">
        <Field id="class-name" label="Class name">
          <input
            id="class-name"
            value={values.name}
            onChange={set('name')}
            placeholder="Quantum Physics"
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field id="class-professor" label="Professor">
          <input
            id="class-professor"
            value={values.professor}
            onChange={set('professor')}
            placeholder="Prof. Julian Sterling"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="class-category" label="Category">
            <select
              id="class-category"
              value={values.category}
              onChange={set('category')}
              className={`${inputClass} cursor-pointer bg-surface`}
            >
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>

          <Field id="class-code" label="Course code" hint="Optional">
            <input
              id="class-code"
              value={values.code}
              onChange={set('code')}
              placeholder="PHY 301"
              className={inputClass}
            />
          </Field>
        </div>

        <Field id="class-semester" label="Semester" hint="Used by the semester filter">
          <select
            id="class-semester"
            value={values.semester}
            onChange={set('semester')}
            className={`${inputClass} cursor-pointer bg-surface`}
          >
            <option value="">No semester</option>
            {SEMESTERS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        {/* ------------------------------ Schedule ------------------------------ */}
        <div className="rounded-xl border border-line p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-bold text-ink">Schedule</p>
            <p className="text-[13px] text-ink-4">
              Meetings appear in your calendar as fixed blocks
            </p>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field id="class-starts-on" label="From date">
              <input
                id="class-starts-on"
                type="date"
                value={values.startsOn}
                onChange={set('startsOn')}
                className={inputClass}
              />
            </Field>
            <Field id="class-ends-on" label="To date">
              <input
                id="class-ends-on"
                type="date"
                value={values.endsOn}
                onChange={set('endsOn')}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="class-start-time" label="From time">
              <input
                id="class-start-time"
                type="time"
                value={values.startTime}
                onChange={set('startTime')}
                className={inputClass}
              />
            </Field>
            <Field id="class-end-time" label="To time">
              <input
                id="class-end-time"
                type="time"
                value={values.endTime}
                onChange={set('endTime')}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5">
            <span className="mb-2 block text-[13px] font-medium text-ink-3">
              Meets on these days
            </span>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((day) => {
                const active = values.meetingDays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-label={day.full}
                    aria-pressed={active}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'h-9 w-9 cursor-pointer rounded-full text-[13px] font-bold transition-colors',
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
        </div>

        {confirmingDelete ? (
          <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400">
            Deleting this class also deletes its assignments and removes its fixed calendar
            blocks. Press Delete again to confirm.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
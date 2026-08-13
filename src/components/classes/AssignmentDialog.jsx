import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Dialog, { Field, inputClass } from '../ui/Dialog.jsx'
import Button from '../ui/Button.jsx'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'
import { fromDateTimeInputs, toDateTimeInputs } from '../../lib/dates.js'

export const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export default function AssignmentDialog({ open, onClose, editing, defaultClassId }) {
  const { classes, createAssignment, updateAssignment, deleteAssignment } = useWorkspace()
  const [values, setValues] = useState({
    title: '',
    classId: '',
    status: 'todo',
    date: '',
    time: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    const due = toDateTimeInputs(editing?.due_at)
    setValues({
      title: editing?.title ?? '',
      classId: editing?.class_id ?? defaultClassId ?? classes[0]?.id ?? '',
      status: editing?.status ?? 'todo',
      date: due.date,
      time: due.time,
    })
    setError(null)
    setConfirmingDelete(false)
  }, [open, editing, defaultClassId, classes])

  const set = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!values.title.trim()) {
      setError('Give the assignment a title.')
      return
    }

    setBusy(true)
    setError(null)

    const payload = {
      title: values.title.trim(),
      class_id: values.classId || null,
      status: values.status,
      due_at: fromDateTimeInputs(values.date, values.time),
    }

    const { error: saveError } = editing
      ? await updateAssignment(editing.id, payload)
      : await createAssignment(payload)

    setBusy(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    onClose()
  }

  const remove = async () => {
    setBusy(true)
    const { error: deleteError } = await deleteAssignment(editing.id)
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
      title={editing ? 'Edit assignment' : 'New assignment'}
      description={editing ? undefined : 'Track something you need to hand in.'}
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
          <Button type="submit" form="assignment-form" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add assignment'}
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={submit} className="space-y-5 pb-3">
        <Field id="assignment-title" label="Title">
          <input
            id="assignment-title"
            value={values.title}
            onChange={set('title')}
            placeholder="Lab Report: Particle Motion"
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field id="assignment-class" label="Class">
          <select
            id="assignment-class"
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="assignment-date" label="Due date" hint="Leave blank for no deadline">
            <input
              id="assignment-date"
              type="date"
              value={values.date}
              onChange={set('date')}
              className={inputClass}
            />
          </Field>

          <Field id="assignment-time" label="Due time" hint="Defaults to 11:59 PM">
            <input
              id="assignment-time"
              type="time"
              value={values.time}
              onChange={set('time')}
              className={inputClass}
            />
          </Field>
        </div>

        <Field id="assignment-status" label="Status">
          <select
            id="assignment-status"
            value={values.status}
            onChange={set('status')}
            className={`${inputClass} cursor-pointer bg-surface`}
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}

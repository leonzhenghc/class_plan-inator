import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Dialog, { Field, inputClass } from '../ui/Dialog.jsx'
import Button from '../ui/Button.jsx'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'

export const CATEGORIES = ['STEM', 'Humanities', 'Arts', 'Social Science', 'Other']

const EMPTY = { name: '', professor: '', category: 'STEM', term: '', code: '' }

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
            term: editing.term ?? '',
            code: editing.code ?? '',
          }
        : EMPTY,
    )
    setError(null)
    setConfirmingDelete(false)
  }, [open, editing])

  const set = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!values.name.trim()) {
      setError('Give the class a name.')
      return
    }

    setBusy(true)
    setError(null)

    const payload = {
      name: values.name.trim(),
      professor: values.professor.trim(),
      category: values.category,
      term: values.term.trim(),
      code: values.code.trim(),
    }

    const { error: saveError } = editing
      ? await updateClass(editing.id, payload)
      : await createClass(payload)

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
        editing ? 'Update the details for this class.' : 'It will show up on your Class Planner.'
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

        <Field id="class-term" label="Term" hint="Used by the semester filter">
          <input
            id="class-term"
            value={values.term}
            onChange={set('term')}
            placeholder="Fall Semester 2026"
            className={inputClass}
          />
        </Field>

        {confirmingDelete ? (
          <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400">
            Deleting this class also deletes its assignments. Press Delete again to confirm.
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

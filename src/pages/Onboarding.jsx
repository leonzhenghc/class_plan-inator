import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Check, Copy, Loader2, Plus, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Stepper from '../components/ui/Stepper.jsx'
import { cn } from '../components/ui/cn.js'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other']
const CATEGORIES = ['STEM', 'Humanities', 'Arts', 'Social Science', 'Other']

const STEPS = [
  { id: 'profile', title: 'About you', blurb: 'So the app knows who it is working for.' },
  { id: 'prefs', title: 'How you study', blurb: 'Your default focus session. Change it any time.' },
  { id: 'classes', title: 'Your classes', blurb: 'Add a few now — you can add more later.' },
]

const emptyClass = () => ({ key: crypto.randomUUID(), name: '', professor: '', category: 'STEM' })

export default function Onboarding() {
  const { user, profile, loading, profileLoaded, needsOnboarding, updateProfile, updatePreferences } =
    useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [details, setDetails] = useState({
    fullName: '',
    displayName: '',
    school: '',
    program: '',
    year: 'Freshman',
  })
  const [prefs, setPrefs] = useState({
    focusMinutes: 25,
    breakMinutes: 5,
    rounds: 4,
    dailyGoalMinutes: 120,
  })
  const [classes, setClasses] = useState([emptyClass()])

  // Seed the name fields from whatever the provider gave us, once profile arrives.
  const [seeded, setSeeded] = useState(false)
  if (!seeded && profile) {
    setSeeded(true)
    setDetails((current) => ({
      ...current,
      fullName: profile.full_name || current.fullName,
      displayName: profile.display_name || current.displayName,
    }))
  }

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/signin" replace />
  if (profileLoaded && !needsOnboarding) return <Navigate to="/dashboard" replace />

  const canContinue =
    step === 0 ? details.fullName.trim().length > 0 && details.school.trim().length > 0 : true

  const finish = async () => {
    setBusy(true)
    setError(null)

    const named = classes.filter((item) => item.name.trim().length > 0)

    const [{ error: profileError }, { error: prefsError }] = await Promise.all([
      updateProfile({
        full_name: details.fullName.trim(),
        display_name: (details.displayName || details.fullName.split(' ')[0]).trim(),
        school: details.school.trim(),
        program: details.program.trim(),
        year: details.year,
        onboarded_at: new Date().toISOString(),
      }),
      updatePreferences({
        focus_minutes: prefs.focusMinutes,
        break_minutes: prefs.breakMinutes,
        rounds: prefs.rounds,
        daily_goal_minutes: prefs.dailyGoalMinutes,
      }),
    ])

    let classError = null
    if (named.length > 0) {
      const { error: insertError } = await supabase.from('classes').insert(
        named.map((item) => ({
          user_id: user.id,
          name: item.name.trim(),
          professor: item.professor.trim(),
          category: item.category,
        })),
      )
      classError = insertError
    }

    setBusy(false)

    const failure = profileError || prefsError || classError
    if (failure) {
      setError(failure.message ?? 'Could not save your details. Please try again.')
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <Copy className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-[22px] font-extrabold tracking-tight text-brand-600">Clarity</p>
            <p className="text-xs font-medium text-gray-500">Student Workspace</p>
          </div>
        </div>

        {/* ------------------------------ Step markers ----------------------------- */}
        <ol className="mb-7 flex items-center gap-3">
          {STEPS.map((item, index) => (
            <li key={item.id} className="flex flex-1 items-center gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors',
                  index < step
                    ? 'bg-brand-600 text-white'
                    : index === step
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-200 text-gray-500',
                )}
              >
                {index < step ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  'h-1 flex-1 rounded-full',
                  index < step ? 'bg-brand-600' : 'bg-gray-200',
                  index === STEPS.length - 1 && 'hidden',
                )}
              />
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {STEPS[step].title}
          </h1>
          <p className="mt-1 text-[15px] text-gray-500">{STEPS[step].blurb}</p>

          <div className="mt-6">
            {step === 0 ? <ProfileStep value={details} onChange={setDetails} /> : null}
            {step === 1 ? <PrefsStep value={prefs} onChange={setPrefs} /> : null}
            {step === 2 ? <ClassesStep value={classes} onChange={setClasses} /> : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
            >
              <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={2.25} />
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => setStep((value) => value - 1)}
              disabled={step === 0 || busy}
              className={cn(step === 0 && 'invisible')}
            >
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                iconRight={ArrowRight}
                onClick={() => setStep((value) => value + 1)}
                disabled={!canContinue}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={busy}>
                {busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
                Finish setup
              </Button>
            )}
          </div>
        </div>

        {step === STEPS.length - 1 ? (
          <p className="mt-4 text-center text-[13px] text-gray-400">
            Leave the class fields blank to skip — you can add them from the Class Planner.
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function ProfileStep({ value, onChange }) {
  const set = (field) => (event) =>
    onChange((current) => ({ ...current, [field]: event.target.value }))

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label="Full name" value={value.fullName} onChange={set('fullName')} required />
        <Field
          id="displayName"
          label="Display name"
          hint="What we greet you with"
          value={value.displayName}
          onChange={set('displayName')}
          placeholder={value.fullName.split(' ')[0] || 'Alex'}
        />
      </div>
      <Field id="school" label="School" value={value.school} onChange={set('school')} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="program"
          label="Program or major"
          value={value.program}
          onChange={set('program')}
          placeholder="Computer Science"
        />
        <div>
          <label htmlFor="year" className="mb-2 block text-[13px] font-medium text-gray-600">
            Year
          </label>
          <select
            id="year"
            value={value.year}
            onChange={set('year')}
            className="h-12 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          >
            {YEARS.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function PrefsStep({ value, onChange }) {
  const total =
    value.focusMinutes * value.rounds + value.breakMinutes * Math.max(0, value.rounds - 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stepper
          label="Focus"
          unit="min"
          value={value.focusMinutes}
          onChange={(next) =>
            onChange((current) => ({ ...current, focusMinutes: next(current.focusMinutes) }))
          }
          min={5}
          max={90}
          step={5}
        />
        <Stepper
          label="Break"
          unit="min"
          value={value.breakMinutes}
          onChange={(next) =>
            onChange((current) => ({ ...current, breakMinutes: next(current.breakMinutes) }))
          }
          min={1}
          max={30}
        />
        <Stepper
          label="Rounds"
          value={value.rounds}
          onChange={(next) => onChange((current) => ({ ...current, rounds: next(current.rounds) }))}
          min={1}
          max={8}
        />
      </div>

      <p className="rounded-xl bg-brand-50 px-4 py-3 text-[15px] font-medium text-brand-700">
        A full session runs about {total} minutes, including breaks.
      </p>

      <Stepper
        label="Daily study goal"
        unit="min"
        value={value.dailyGoalMinutes}
        onChange={(next) =>
          onChange((current) => ({ ...current, dailyGoalMinutes: next(current.dailyGoalMinutes) }))
        }
        min={0}
        max={720}
        step={30}
        className="max-w-[220px]"
      />
    </div>
  )
}

function ClassesStep({ value, onChange }) {
  const setField = (key, field) => (event) =>
    onChange((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: event.target.value } : item)),
    )

  return (
    <div className="space-y-4">
      {value.map((item, index) => (
        <div key={item.key} className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-bold tracking-[0.08em] text-gray-500 uppercase">
              Class {index + 1}
            </p>
            {value.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange((current) => current.filter((row) => row.key !== item.key))}
                aria-label={`Remove class ${index + 1}`}
                className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <Field
              id={`class-name-${item.key}`}
              label="Class name"
              value={item.name}
              onChange={setField(item.key, 'name')}
              placeholder="Quantum Physics"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id={`class-prof-${item.key}`}
                label="Professor"
                value={item.professor}
                onChange={setField(item.key, 'professor')}
                placeholder="Prof. Julian Sterling"
              />
              <div>
                <label
                  htmlFor={`class-cat-${item.key}`}
                  className="mb-2 block text-[13px] font-medium text-gray-600"
                >
                  Category
                </label>
                <select
                  id={`class-cat-${item.key}`}
                  value={item.category}
                  onChange={setField(item.key, 'category')}
                  className="h-12 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange((current) => [...current, emptyClass()])}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 py-3 text-[15px] font-bold text-brand-600 transition-colors hover:bg-brand-50"
      >
        <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
        Add another class
      </button>
    </div>
  )
}

function Field({ id, label, hint, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-gray-600">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-[15px] text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        {...props}
      />
      {hint ? <p className="mt-1.5 text-[13px] text-gray-400">{hint}</p> : null}
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
    </div>
  )
}

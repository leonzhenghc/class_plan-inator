import { useState } from 'react'
import { BellRing, LogOut, Moon, Pencil, Sparkles, Timer } from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card, { CardTitle } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import ToggleSwitch from '../components/ui/ToggleSwitch.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import ChipGroup from '../components/ui/ChipGroup.jsx'
import { HOBBIES, STUDY_STYLES, TRAITS } from '../data/personality.js'
import { cn } from '../components/ui/cn.js'
import { useAuth } from '../context/AuthContext.jsx'

const NOTIFICATION_ROWS = [
  {
    id: 'dueDates',
    label: 'Due date reminders',
    description: 'Get pinged 24h before submission.',
  },
  {
    id: 'deepWork',
    label: 'Deep Work Mode',
    description: 'Auto-silence during Pomodoro rounds.',
  },
]

export default function Settings() {
  const {
    user,
    profile: savedProfile,
    preferences,
    signOut,
    updateProfile,
    updatePreferences,
  } = useAuth()

  const [profile, setProfile] = useState({
    fullName: savedProfile?.full_name ?? '',
    displayName: savedProfile?.display_name ?? '',
  })
  const [pomodoro, setPomodoro] = useState({
    focus: preferences?.focus_minutes ?? 25,
    break: preferences?.break_minutes ?? 5,
  })
  const [notifications, setNotifications] = useState({
    dueDates: preferences?.due_date_reminders ?? true,
    deepWork: preferences?.deep_work_mode ?? false,
  })
  const [theme, setTheme] = useState(preferences?.theme ?? 'light')
  const [personality, setPersonality] = useState({
    traits: savedProfile?.personality_traits ?? [],
    hobbies: savedProfile?.hobbies ?? [],
    studyStyles: savedProfile?.study_styles ?? [],
    aboutMe: savedProfile?.about_me ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  const revert = () => {
    setProfile({
      fullName: savedProfile?.full_name ?? '',
      displayName: savedProfile?.display_name ?? '',
    })
    setPomodoro({
      focus: preferences?.focus_minutes ?? 25,
      break: preferences?.break_minutes ?? 5,
    })
    setNotifications({
      dueDates: preferences?.due_date_reminders ?? true,
      deepWork: preferences?.deep_work_mode ?? false,
    })
    setTheme(preferences?.theme ?? 'light')
    setPersonality({
      traits: savedProfile?.personality_traits ?? [],
      hobbies: savedProfile?.hobbies ?? [],
      studyStyles: savedProfile?.study_styles ?? [],
      aboutMe: savedProfile?.about_me ?? '',
    })
    setStatus(null)
  }

  const save = async () => {
    setSaving(true)
    setStatus(null)

    const [{ error: profileError }, { error: prefsError }] = await Promise.all([
      updateProfile({
        full_name: profile.fullName.trim(),
        display_name: profile.displayName.trim(),
        personality_traits: personality.traits,
        hobbies: personality.hobbies,
        study_styles: personality.studyStyles,
        about_me: personality.aboutMe.trim(),
      }),
      updatePreferences({
        focus_minutes: Number(pomodoro.focus) || 25,
        break_minutes: Number(pomodoro.break) || 5,
        due_date_reminders: notifications.dueDates,
        deep_work_mode: notifications.deepWork,
        theme,
      }),
    ])

    setSaving(false)
    const failure = profileError || prefsError
    setStatus(
      failure
        ? { tone: 'error', message: failure.message ?? 'Could not save.' }
        : { tone: 'ok', message: 'Saved.' },
    )
  }

  return (
    <>
      <TopBar placeholder="Search tasks, classes, or notes..." />

      <main className="flex-1 px-8 py-8">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">Settings</h1>
          <p className="mt-3 text-lg text-gray-500">
            Customize your workspace and manage your connected academic tools.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* -------------------------------- Profile ------------------------------- */}
          <Card className="px-7 py-7 xl:col-span-2">
            <div className="flex items-start gap-6">
              <div className="relative shrink-0">
                <Avatar
                  name={profile.fullName}
                  shape="rounded-2xl"
                  className="h-[104px] w-[104px] ring-4 ring-brand-100"
                  textClassName="text-3xl"
                />
                <button
                  type="button"
                  aria-label="Change profile photo"
                  className="absolute -right-2 -bottom-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700"
                >
                  <Pencil className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  {profile.fullName}
                </h2>
                <p className="mt-1 text-[15px] text-gray-500">{user.email}</p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    { id: 'fullName', label: 'Full Name' },
                    { id: 'displayName', label: 'Display Name' },
                  ].map((field) => (
                    <div key={field.id}>
                      <label
                        htmlFor={field.id}
                        className="mb-2 block text-[13px] font-medium text-gray-500"
                      >
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        value={profile[field.id]}
                        onChange={(event) =>
                          setProfile((current) => ({ ...current, [field.id]: event.target.value }))
                        }
                        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-[15px] text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ---------------------------- Pomodoro settings -------------------------- */}
          <Card className="px-6 py-6">
            <CardTitle icon={Timer}>Pomodoro Settings</CardTitle>

            <div className="mt-6 space-y-5">
              {[
                { id: 'focus', label: 'Focus length' },
                { id: 'break', label: 'Break length' },
              ].map((field) => (
                <div key={field.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor={field.id} className="text-[15px] font-medium text-gray-700">
                      {field.label}
                    </label>
                    <span className="text-[13px] font-semibold text-brand-600">min</span>
                  </div>
                  <input
                    id={field.id}
                    type="number"
                    min={1}
                    value={pomodoro[field.id]}
                    onChange={(event) =>
                      setPomodoro((current) => ({ ...current, [field.id]: event.target.value }))
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-[15px] text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPomodoro({ focus: 25, break: 5 })}
              className="mt-6 w-full cursor-pointer text-center text-[15px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Reset to Default
            </button>
          </Card>

          {/* ------------------------------ Notifications ---------------------------- */}
          <Card className="px-7 py-6 xl:col-span-3">
            <CardTitle icon={BellRing}>Notifications</CardTitle>

            <div className="mt-6 space-y-6">
              {NOTIFICATION_ROWS.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-gray-900">{row.label}</p>
                    <p className="mt-0.5 text-[13px] text-gray-500">{row.description}</p>
                  </div>
                  <ToggleSwitch
                    checked={notifications[row.id]}
                    onChange={(value) =>
                      setNotifications((current) => ({ ...current, [row.id]: value }))
                    }
                    label={row.label}
                  />
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* ------------------------------- Personality ------------------------------- */}
        <Card className="mt-6 px-7 py-6">
          <CardTitle icon={Sparkles}>About you</CardTitle>
          <p className="mt-1 text-[15px] text-gray-500">
            Context for your study assistant. Change it whenever you like.
          </p>

          <div className="mt-6 space-y-6">
            <ChipGroup
              label="How would you describe yourself?"
              options={TRAITS}
              value={personality.traits}
              onChange={(update) =>
                setPersonality((current) => ({ ...current, traits: update(current.traits) }))
              }
            />
            <ChipGroup
              label="What are you into outside class?"
              options={HOBBIES}
              value={personality.hobbies}
              onChange={(update) =>
                setPersonality((current) => ({ ...current, hobbies: update(current.hobbies) }))
              }
              allowCustom
              placeholder="Something else you enjoy"
            />
            <ChipGroup
              label="How do you like to study?"
              options={STUDY_STYLES}
              value={personality.studyStyles}
              onChange={(update) =>
                setPersonality((current) => ({ ...current, studyStyles: update(current.studyStyles) }))
              }
            />
            <div>
              <label
                htmlFor="aboutMe"
                className="mb-2 block text-[15px] font-semibold text-gray-800"
              >
                Anything else worth knowing?
              </label>
              <textarea
                id="aboutMe"
                rows={3}
                value={personality.aboutMe}
                onChange={(event) =>
                  setPersonality((current) => ({ ...current, aboutMe: event.target.value }))
                }
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-[15px] leading-relaxed text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* -------------------------------- Appearance ------------------------------- */}
        <div className="mt-6 flex items-center gap-5 rounded-2xl border border-gray-200 bg-gray-50 px-7 py-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Moon className="h-6 w-6 text-brand-600" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-extrabold tracking-tight text-gray-900">Appearance</p>
            <p className="mt-1 text-[15px] text-gray-500">
              Switch between Light and Dark workspace themes.
            </p>
          </div>
          <SegmentedControl
            size="sm"
            className="bg-white ring-1 ring-gray-200"
            activeClassName="bg-sky-50 text-gray-900"
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            value={theme}
            onChange={setTheme}
          />
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="outline" size="lg" icon={LogOut} onClick={signOut}>
              Sign out
            </Button>

            <div className="flex items-center gap-4">
              {status ? (
                <span
                  role="status"
                  className={cn(
                    'text-[15px] font-semibold',
                    status.tone === 'error' ? 'text-red-600' : 'text-emerald-600',
                  )}
                >
                  {status.message}
                </span>
              ) : null}
              <Button variant="outline" size="lg" onClick={revert} disabled={saving}>
                Cancel Changes
              </Button>
              <Button size="lg" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

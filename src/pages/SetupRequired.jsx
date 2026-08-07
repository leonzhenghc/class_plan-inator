import { Copy, Database, FileCode2, KeyRound } from 'lucide-react'

const STEPS = [
  {
    icon: Database,
    title: 'Create a Supabase project',
    body: 'Any region and the free tier are fine. Wait for it to finish provisioning.',
  },
  {
    icon: FileCode2,
    title: 'Run the schema',
    body: 'Open the SQL editor and run supabase/migrations/0001_init.sql from this repo. It creates the tables, the new-user trigger and the row-level-security policies.',
  },
  {
    icon: KeyRound,
    title: 'Add your keys',
    body: 'Copy .env.example to .env, then fill in the Project URL and the anon key from Project Settings → API. Restart the dev server afterwards.',
  },
]

/**
 * Shown instead of the app when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
 * missing, so a fresh clone explains itself rather than throwing on import.
 */
export default function SetupRequired() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-14">
      <div className="mx-auto w-full max-w-[600px]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <Copy className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-[22px] font-extrabold tracking-tight text-brand-600">Clarity</p>
            <p className="text-xs font-medium text-gray-500">Student Workspace</p>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Connect your backend
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          Clarity stores your classes, tasks and sessions in Supabase. Three steps and you are in.
        </p>

        <ol className="mt-8 space-y-4">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li
              key={title}
              className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-gray-900">
                  {index + 1}. {title}
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-500">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
          Use the <span className="font-semibold">anon</span> key only. Anything in a{' '}
          <span className="font-mono">VITE_</span> variable ships inside the public JavaScript
          bundle, so the <span className="font-semibold">service_role</span> key must never go in{' '}
          <span className="font-mono">.env</span> — it bypasses row-level security.
        </p>
      </div>
    </div>
  )
}

import { Bell, CircleHelp, Search } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { user } from '../../data/mock.js'

export default function TopBar({ placeholder = 'Search tasks, classes, or notes...', hasAlert }) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center gap-6 px-8">
        <div className="relative w-full max-w-[520px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
            strokeWidth={2}
          />
          <input
            type="search"
            placeholder={placeholder}
            className="h-12 w-full rounded-full bg-gray-100 pr-4 pl-12 text-[15px] text-gray-700 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-5">
          <button
            type="button"
            aria-label="Notifications"
            className="relative cursor-pointer text-gray-500 transition-colors hover:text-gray-800"
          >
            <Bell className="h-[22px] w-[22px]" strokeWidth={2} />
            {hasAlert ? (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            ) : null}
          </button>
          <button
            type="button"
            aria-label="Help"
            className="cursor-pointer text-gray-500 transition-colors hover:text-gray-800"
          >
            <CircleHelp className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <Avatar name={user.fullName} className="h-10 w-10" textClassName="text-sm" />
        </div>
      </div>
    </header>
  )
}

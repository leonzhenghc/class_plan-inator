/* ---------------------------------- Dashboard --------------------------------- */

export const weekDays = [
  { label: 'Mon', date: 12, marker: null },
  { label: 'Tue', date: 13, marker: 'bg-brand-600', active: true },
  { label: 'Wed', date: 14, marker: 'bg-red-200' },
  { label: 'Thu', date: 15, marker: null },
  { label: 'Fri', date: 16, marker: 'bg-emerald-300' },
  { label: 'Sat', date: 17, marker: null },
  { label: 'Sun', date: 18, marker: null },
]

export const upcomingAssignments = [
  {
    id: 'a1',
    title: 'Modern History Essay',
    meta: 'HIS 101 • Due today, 11:59 PM',
    status: { label: 'Due Today', tone: 'due' },
    icon: 'feather',
    iconClass: 'bg-brand-100 text-brand-600',
  },
  {
    id: 'a2',
    title: 'Lab Report: Cellular Mitosis',
    meta: 'BIO 204 • Due in 2 days',
    status: { label: 'In Progress', tone: 'progress' },
    icon: 'microscope',
    iconClass: 'bg-sky-100 text-sky-600',
  },
  {
    id: 'a3',
    title: 'Calculus III Problem Set',
    meta: 'MAT 301 • Due in 4 days',
    status: { label: 'To Do', tone: 'todo' },
    icon: 'sigma',
    iconClass: 'bg-violet-100 text-violet-600',
  },
]

export const todaysFocus = [
  { id: 'f1', label: 'Draft introduction for history essay', done: true },
  { id: 'f2', label: 'Review chapter 4 math notes', done: false },
  { id: 'f3', label: 'Email professor regarding lab data', done: false },
]

export const learningVelocity = [
  { day: 'M', value: 32, active: false },
  { day: 'T', value: 55, active: false },
  { day: 'W', value: 68, active: false },
  { day: 'T', value: 47, active: false },
  { day: 'F', value: 86, active: false },
  { day: 'S', value: 96, active: true },
  { day: 'S', value: 38, active: false },
]

/* -------------------------------- Class Planner ------------------------------- */

export const classes = [
  {
    id: 'c1',
    category: 'STEM',
    tone: 'stem',
    name: 'Quantum Physics',
    professor: 'Prof. Julian Sterling',
    nextAssignment: 'Lab Report: Particle Motion',
    due: 'In 2 days',
    dueTone: 'text-red-500',
    completed: 8,
    total: 12,
  },
  {
    id: 'c2',
    category: 'HUMANITIES',
    tone: 'humanities',
    name: 'Modern History',
    professor: 'Dr. Elena Rodriguez',
    nextAssignment: 'The Industrial Revolution Essay',
    due: 'In 5 days',
    dueTone: 'text-gray-500',
    completed: 5,
    total: 15,
  },
  {
    id: 'c3',
    category: 'ARTS',
    tone: 'arts',
    name: 'Digital Design II',
    professor: 'Prof. Marcus Chen',
    nextAssignment: 'Brand Identity System',
    due: 'Due Today',
    dueTone: 'text-brand-600',
    completed: 11,
    total: 12,
  },
  {
    id: 'c4',
    category: 'STEM',
    tone: 'stem',
    name: 'Analytical Chemistry',
    professor: 'Dr. Sarah Jenkins',
    nextAssignment: 'Spectroscopy Quiz',
    due: 'Next Week',
    dueTone: 'text-gray-500',
    completed: 10,
    total: 20,
  },
  {
    id: 'c5',
    category: 'SOCIAL SCIENCE',
    tone: 'social',
    name: 'Macroeconomics',
    professor: 'Prof. Adam Smith Jr.',
    nextAssignment: 'Market Trends Report',
    due: 'Due Tomorrow',
    dueTone: 'text-red-500',
    completed: 15,
    total: 20,
  },
]

/* -------------------------------- Daily Planner ------------------------------- */

export const scheduleEvents = [
  {
    id: 'e1',
    title: 'Intro to Psychology',
    subtitle: 'Room 402 - Lecture on Neuroplasticity',
    time: '09:00 - 11:00 AM',
    start: 9,
    end: 11,
    theme: {
      block: 'bg-violet-100',
      accent: 'bg-brand-600',
      title: 'text-gray-900',
      subtitle: 'text-brand-600',
      time: 'text-gray-800',
    },
  },
  {
    id: 'e2',
    title: 'Lunch Break',
    start: 12,
    end: 13,
    icon: 'utensils',
    theme: {
      block: 'bg-emerald-100',
      accent: 'bg-emerald-600',
      title: 'text-gray-900',
      subtitle: 'text-emerald-700',
      time: 'text-gray-700',
    },
  },
  {
    id: 'e3',
    title: 'Study: Microeconomics',
    subtitle: 'Focus: Chapter 4 Problem Sets',
    time: '02:00 - 04:30 PM',
    tag: 'High Focus',
    start: 14,
    end: 16.5,
    theme: {
      block: 'bg-sky-100',
      accent: 'bg-sky-600',
      title: 'text-gray-900',
      subtitle: 'text-gray-600',
      time: 'text-gray-800',
    },
  },
  {
    id: 'e4',
    title: 'Evening Workout',
    subtitle: 'Upper Body focus',
    time: '06:00 - 07:30 PM',
    start: 18,
    end: 19.5,
    theme: {
      block: 'bg-gray-100',
      accent: 'bg-gray-400',
      title: 'text-gray-900',
      subtitle: 'text-gray-600',
      time: 'text-gray-800',
    },
  },
]

export const initialTasks = [
  { id: 't1', label: 'Submit English Essay', due: 'Due today, 11:59 PM', done: false },
  {
    id: 't2',
    label: 'Buy textbook for Sociology',
    tag: { label: 'Personal', tone: 'brand' },
    done: false,
  },
  { id: 't3', label: 'Check email for internship', done: true },
  { id: 't4', label: 'Prep for Chem Lab', tag: { label: 'Science', tone: 'info' }, done: false },
  { id: 't5', label: 'Review Spanish vocab', done: false },
]

/* ---------------------------------- Pomodoro ---------------------------------- */

export const activityLog = [
  { id: 'l1', title: 'Calc Homework', time: 'Completed at 10:45 AM', duration: '25m' },
  { id: 'l2', title: 'Short Break', time: 'Completed at 10:15 AM', duration: '5m' },
  { id: 'l3', title: 'History Reading', time: 'Completed at 09:50 AM', duration: '25m' },
]

/* ------------------------------- Session setup -------------------------------- */

/**
 * What the study-session popup offers to work on: everything already synced from the
 * calendar (upcoming assignments) plus whatever is still open on today's planner.
 * Derived from the lists above so there is one source of truth per item.
 */
export const sessionTaskOptions = [
  ...upcomingAssignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    meta: assignment.meta,
    source: 'Assignment',
    urgent: assignment.status.tone === 'due',
  })),
  ...initialTasks
    .filter((task) => !task.done)
    .map((task) => ({
      id: task.id,
      title: task.label,
      meta: task.due ?? task.tag?.label ?? 'Today',
      source: 'Task',
      urgent: Boolean(task.due),
    })),
]

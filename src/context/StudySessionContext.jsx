import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { revealImages } from '../data/revealImages.js'
import { useWorkspace } from './WorkspaceContext.jsx'
import { useAuth } from './AuthContext.jsx'

const StudySessionContext = createContext(null)

export const DEFAULT_CONFIG = {
  focusMinutes: 25,
  breakMinutes: 5,
  rounds: 4,
  /** Index into `revealImages`, or 'auto' to rotate one image per round. */
  image: 'auto',
  taskIds: [],
}

/**
 * Owns the whole study session: setup config, which block is running, and which of the
 * chosen tasks are done. Lives above the router so the sidebar can open setup from any
 * page and so navigating away mid-session doesn't discard the timer.
 *
 * Blocks advance manually: when one hits 00:00 the timer stops and waits for the user to
 * start the next one. A session runs focus → break → focus … ending on the final focus
 * block, with no trailing break.
 *
 * The countdown is anchored to the wall clock (`endsAtRef`), not to interval ticks:
 * browsers throttle `setInterval` in hidden tabs and stop it during sleep, so a pure
 * decrement would stretch a 25-minute block out to hours. Each tick — and each return
 * to the tab — recomputes the remaining seconds from the end timestamp.
 */
export function StudySessionProvider({ children }) {
  const { logSession } = useWorkspace()
  const { preferences } = useAuth()
  const [config, setConfig] = useState(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [phase, setPhase] = useState('focus')
  const [round, setRound] = useState(1)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [doneTaskIds, setDoneTaskIds] = useState([])
  const [logError, setLogError] = useState(null)
  const intervalRef = useRef(null)
  /** Guards against double-logging a block if the completion effect re-runs. */
  const loggedRef = useRef(false)
  /** Seconds remaining while the clock is stopped (pause, reset, …). */
  const remainingRef = useRef(0)
  /** Wall-clock timestamp the running block ends at. */
  const endsAtRef = useRef(0)
  /**
   * Bumped whenever the user (re)sets the block length. The interval cleanup only
   * captures the remaining time when the generation matches, so a reset issued
   * while running isn't clobbered by the old deadline.
   */
  const blockGenRef = useRef(0)
  /** Block payload waiting to be written to `pomodoro_sessions`. */
  const pendingLogRef = useRef(null)

  /** Setup opens with whatever the user saved in Settings. */
  const defaultConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      focusMinutes: preferences?.focus_minutes ?? DEFAULT_CONFIG.focusMinutes,
      breakMinutes: preferences?.break_minutes ?? DEFAULT_CONFIG.breakMinutes,
      rounds: preferences?.rounds ?? DEFAULT_CONFIG.rounds,
    }),
    [preferences],
  )

  useEffect(() => {
    if (!running) return undefined
    const gen = blockGenRef.current
    endsAtRef.current = Date.now() + remainingRef.current * 1000
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000)))
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)
    const onVisibilityChange = () => {
      // Hidden tabs don't tick; catch up the moment the tab is visible again.
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (blockGenRef.current === gen) {
        remainingRef.current = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000))
      }
    }
  }, [running])

  /**
   * Writes the completed-block row. On failure the payload stays queued and the
   * next `startSession`/`advance` retries it, so a transient network blip can't
   * silently drop a finished block from the history.
   */
  const flushPendingLog = useCallback(async () => {
    const payload = pendingLogRef.current
    if (!payload) return
    const { error } = await logSession(payload)
    if (error) {
      setLogError('Couldn\u2019t save this completed block \u2014 it will retry.')
      return
    }
    pendingLogRef.current = null
    setLogError(null)
  }, [logSession])

  /**
   * A block that reaches zero while still running finished on its own, so it counts.
   * Skipping sets `running` false before zeroing the clock, which is how a skipped
   * block is excluded from the history without needing a separate flag.
   */
  useEffect(() => {
    if (!running || secondsLeft !== 0 || !config) return
    setRunning(false)
    if (loggedRef.current) return
    loggedRef.current = true

    const minutes = phase === 'focus' ? config.focusMinutes : config.breakMinutes
    pendingLogRef.current = {
      phase,
      minutes,
      round,
      label: phase === 'focus' ? 'Focus session' : 'Break',
    }
    flushPendingLog()
  }, [running, secondsLeft, config, phase, round, flushPendingLog])

  const openSetup = useCallback(() => setSetupOpen(true), [])
  const closeSetup = useCallback(() => setSetupOpen(false), [])

  const startSession = useCallback(
    (nextConfig) => {
      const full = nextConfig.focusMinutes * 60
      remainingRef.current = full
      // Also update the deadline directly: if a session is already running the
      // effect below won't re-run, and the tick must read the new deadline.
      endsAtRef.current = Date.now() + full * 1000
      blockGenRef.current += 1
      setConfig(nextConfig)
      setPhase('focus')
      setRound(1)
      setSecondsLeft(full)
      setDoneTaskIds([])
      setSetupOpen(false)
      loggedRef.current = false
      setRunning(true)
      flushPendingLog()
    },
    [flushPendingLog],
  )

  const blockSeconds = useMemo(() => {
    if (!config) return 0
    return (phase === 'focus' ? config.focusMinutes : config.breakMinutes) * 60
  }, [config, phase])

  const blockComplete = Boolean(config) && secondsLeft === 0
  const isFinalFocus = Boolean(config) && phase === 'focus' && round >= config.rounds
  const sessionComplete = blockComplete && isFinalFocus

  /** Moves to the next block and starts it — one press is both "advance" and "start". */
  const advance = useCallback(
    () => {
      if (!config || sessionComplete) return
      const full = (phase === 'focus' ? config.breakMinutes : config.focusMinutes) * 60
      remainingRef.current = full
      endsAtRef.current = Date.now() + full * 1000
      blockGenRef.current += 1
      if (phase === 'focus') {
        setPhase('break')
        setSecondsLeft(full)
      } else {
        setPhase('focus')
        setRound((value) => value + 1)
        setSecondsLeft(full)
      }
      loggedRef.current = false
      setRunning(true)
      flushPendingLog()
    },
    [config, phase, sessionComplete, flushPendingLog],
  )

  const toggle = useCallback(() => {
    if (!config) return
    if (blockComplete) {
      advance()
      return
    }
    setRunning((value) => !value)
  }, [config, blockComplete, advance])

  /** Restarts the current block from the top. */
  const reset = useCallback(() => {
    remainingRef.current = blockSeconds
    blockGenRef.current += 1
    setRunning(false)
    loggedRef.current = false
    setSecondsLeft(blockSeconds)
  }, [blockSeconds])

  /** Jumps the current block to 00:00, landing on the "block complete" state. */
  const skip = useCallback(() => {
    remainingRef.current = 0
    blockGenRef.current += 1
    setRunning(false)
    setSecondsLeft(0)
  }, [])

  const toggleTask = useCallback((id) => {
    setDoneTaskIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))
  }, [])

  /** Fixed pick, or one image per round when set to 'auto'. */
  const activeImage = useMemo(() => {
    if (revealImages.length === 0) return null
    if (!config || config.image === 'auto') {
      return revealImages[(round - 1) % revealImages.length]
    }
    return revealImages[config.image] ?? revealImages[0]
  }, [config, round])

  const value = useMemo(
    () => ({
      config,
      defaultConfig,
      hasSession: Boolean(config),
      setupOpen,
      openSetup,
      closeSetup,
      startSession,
      phase,
      round,
      secondsLeft,
      blockSeconds,
      running,
      blockComplete,
      sessionComplete,
      activeImage,
      doneTaskIds,
      toggleTask,
      toggle,
      advance,
      reset,
      skip,
      logError,
    }),
    [
      config,
      defaultConfig,
      setupOpen,
      openSetup,
      closeSetup,
      startSession,
      phase,
      round,
      secondsLeft,
      blockSeconds,
      running,
      blockComplete,
      sessionComplete,
      activeImage,
      doneTaskIds,
      toggleTask,
      toggle,
      advance,
      reset,
      skip,
      logError,
    ],
  )

  return <StudySessionContext.Provider value={value}>{children}</StudySessionContext.Provider>
}

export function useStudySession() {
  const context = useContext(StudySessionContext)
  if (!context) throw new Error('useStudySession must be used within a StudySessionProvider')
  return context
}
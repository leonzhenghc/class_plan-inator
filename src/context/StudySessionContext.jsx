import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { revealImages } from '../data/revealImages.js'

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
 */
export function StudySessionProvider({ children }) {
  const [config, setConfig] = useState(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [phase, setPhase] = useState('focus')
  const [round, setRound] = useState(1)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [doneTaskIds, setDoneTaskIds] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!running) return undefined
    intervalRef.current = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const openSetup = useCallback(() => setSetupOpen(true), [])
  const closeSetup = useCallback(() => setSetupOpen(false), [])

  const startSession = useCallback((nextConfig) => {
    setConfig(nextConfig)
    setPhase('focus')
    setRound(1)
    setSecondsLeft(nextConfig.focusMinutes * 60)
    setDoneTaskIds([])
    setSetupOpen(false)
    setRunning(true)
  }, [])

  const blockSeconds = useMemo(() => {
    if (!config) return 0
    return (phase === 'focus' ? config.focusMinutes : config.breakMinutes) * 60
  }, [config, phase])

  const blockComplete = Boolean(config) && secondsLeft === 0
  const isFinalFocus = Boolean(config) && phase === 'focus' && round >= config.rounds
  const sessionComplete = blockComplete && isFinalFocus

  /** Moves to the next block and starts it — one press is both "advance" and "start". */
  const advance = useCallback(() => {
    if (!config || sessionComplete) return
    if (phase === 'focus') {
      setPhase('break')
      setSecondsLeft(config.breakMinutes * 60)
    } else {
      setPhase('focus')
      setRound((value) => value + 1)
      setSecondsLeft(config.focusMinutes * 60)
    }
    setRunning(true)
  }, [config, phase, sessionComplete])

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
    setRunning(false)
    setSecondsLeft(blockSeconds)
  }, [blockSeconds])

  /** Jumps the current block to 00:00, landing on the "block complete" state. */
  const skip = useCallback(() => {
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
    }),
    [
      config,
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
    ],
  )

  return <StudySessionContext.Provider value={value}>{children}</StudySessionContext.Provider>
}

export function useStudySession() {
  const context = useContext(StudySessionContext)
  if (!context) throw new Error('useStudySession must be used within a StudySessionProvider')
  return context
}

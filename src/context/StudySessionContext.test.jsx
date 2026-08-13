import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { logSession } = vi.hoisted(() => ({ logSession: vi.fn() }))

vi.mock('./WorkspaceContext.jsx', () => ({
  useWorkspace: () => ({ logSession }),
}))

vi.mock('./AuthContext.jsx', () => ({
  useAuth: () => ({ preferences: null }),
}))

import { StudySessionProvider, useStudySession } from './StudySessionContext.jsx'

function Probe() {
  const session = useStudySession()
  return (
    <div>
      <span data-testid="seconds">{session.secondsLeft}</span>
      <span data-testid="running">{String(session.running)}</span>
      <span data-testid="complete">{String(session.blockComplete)}</span>
      <span data-testid="log-error">{session.logError ?? 'none'}</span>
      <button
        type="button"
        onClick={() =>
          session.startSession({
            focusMinutes: 25,
            breakMinutes: 5,
            rounds: 4,
            image: 'auto',
            taskIds: [],
          })
        }
      >
        start
      </button>
      <button type="button" onClick={session.toggle}>
        toggle
      </button>
      <button type="button" onClick={session.advance}>
        advance
      </button>
      <button type="button" onClick={session.reset}>
        reset
      </button>
    </div>
  )
}

function Harness({ children }) {
  return <StudySessionProvider>{children}</StudySessionProvider>
}

const flush = async () => {
  await act(async () => {})
  await act(async () => {})
}

beforeEach(() => {
  logSession.mockReset()
  logSession.mockResolvedValue({ data: { id: 's1' }, error: null })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('countdown', () => {
  it('finishes a 25-minute block on the wall clock and logs it once', async () => {
    vi.useFakeTimers()
    render(
      <Harness>
        <Probe />
      </Harness>,
    )

    await act(async () => {
      fireEvent.click(screen.getByText('start'))
    })
    expect(screen.getByTestId('running')).toHaveTextContent('true')

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByTestId('seconds')).toHaveTextContent('1440')

    await act(async () => {
      vi.advanceTimersByTime(24 * 60_000)
    })
    expect(screen.getByTestId('seconds')).toHaveTextContent('0')
    expect(screen.getByTestId('complete')).toHaveTextContent('true')
    expect(screen.getByTestId('running')).toHaveTextContent('false')

    await flush()
    expect(logSession).toHaveBeenCalledTimes(1)
    expect(logSession).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'focus', minutes: 25, round: 1 }),
    )
  })

  it('pauses on the remaining wall-clock time and resumes without drifting', async () => {
    vi.useFakeTimers()
    render(
      <Harness>
        <Probe />
      </Harness>,
    )

    await act(async () => {
      fireEvent.click(screen.getByText('start'))
    })
    await act(async () => {
      vi.advanceTimersByTime(90_000)
    })
    expect(screen.getByTestId('seconds')).toHaveTextContent('1410')

    await act(async () => {
      fireEvent.click(screen.getByText('toggle'))
    })
    expect(screen.getByTestId('running')).toHaveTextContent('false')

    // A paused clock must not advance while stopped.
    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000)
    })
    expect(screen.getByTestId('seconds')).toHaveTextContent('1410')

    await act(async () => {
      fireEvent.click(screen.getByText('toggle'))
    })
    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByTestId('seconds')).toHaveTextContent('1400')
  })

  it('catches up from the wall clock when the tab becomes visible', async () => {
    vi.useFakeTimers()
    const intervalFns = []
    // Capture the interval callback without ever running it, mimicking a
    // throttled hidden tab: only the visibilitychange listener can move the
    // countdown, and it must read the wall-clock deadline.
    vi.stubGlobal('setInterval', (fn) => {
      intervalFns.push(fn)
      return 1
    })
    vi.stubGlobal('clearInterval', () => {})

    render(
      <Harness>
        <Probe />
      </Harness>,
    )

    await act(async () => {
      fireEvent.click(screen.getByText('start'))
    })
    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000)
    })
    expect(screen.getByTestId('seconds')).toHaveTextContent('1500')

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByTestId('seconds')).toHaveTextContent('1200')
    expect(intervalFns).not.toHaveLength(0)
  })
})

describe('history logging', () => {
  it('retries a failed session log on the next advance', async () => {
    logSession.mockResolvedValueOnce({ error: new Error('network down') })
    vi.useFakeTimers()
    render(
      <Harness>
        <Probe />
      </Harness>,
    )

    await act(async () => {
      fireEvent.click(screen.getByText('start'))
    })
    await act(async () => {
      vi.advanceTimersByTime(25 * 60_000)
    })
    expect(screen.getByTestId('complete')).toHaveTextContent('true')

    await flush()
    expect(logSession).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('log-error')).not.toHaveTextContent('none')

    await act(async () => {
      fireEvent.click(screen.getByText('advance'))
    })
    await flush()
    expect(logSession).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('log-error')).toHaveTextContent('none')
  })
})

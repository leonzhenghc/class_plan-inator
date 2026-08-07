import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { queryState } = vi.hoisted(() => ({
  queryState: {
    user: null,
    /** One deferred per table per load() invocation, so each run is resolvable independently. */
    generations: [],
    makeDeferreds() {
      const deferreds = {}
      for (const table of [
        'classes',
        'assignments',
        'tasks',
        'events',
        'pomodoro_sessions',
      ]) {
        let resolve = () => {}
        let reject = () => {}
        const promise = new Promise((res, rej) => {
          resolve = res
          reject = rej
        })
        deferreds[table] = { promise, resolve, reject }
      }
      return deferreds
    },
  },
}))

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn((table) => {
      const deferred = queryState.generations.at(-1)[table]
      // A ".then" on the chain means Promise.all resolves with the same value the
      // deferred was given, no matter which method the component ends on.
      const chain = {
        then: (onFulfilled, onRejected) => deferred.promise.then(onFulfilled, onRejected),
        select: () => chain,
        order: () => chain,
        limit: () => chain,
        eq: () => chain,
        insert: () => chain,
        update: () => chain,
        delete: () => chain,
        single: () => chain,
      }
      return chain
    }),
  },
  isSupabaseConfigured: true,
}))

vi.mock('./AuthContext.jsx', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAuth: () => ({ user: queryState.user }),
  }
})

import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx'

function Probe() {
  const { loading, error, classes } = useWorkspace()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="classes">{classes.length}</span>
      <span data-testid="error">{error?.message ?? 'none'}</span>
    </div>
  )
}

function Harness({ children }) {
  const [mounts, setMounts] = useState(0)
  return (
    <div>
      <button type="button" onClick={() => setMounts((m) => m + 1)}>
        rerender {mounts}
      </button>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </div>
  )
}

function deferred(table) {
  return queryState.generations[queryState.generations.length - 1][table]
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  queryState.user = null
  queryState.generations = []
  queryState.generations.push(queryState.makeDeferreds())
})

describe('WorkspaceProvider fetch lifecycle', () => {
  it('applies results once every query resolves', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )

    // Resolve classes only; others return empty arrays.
    deferred('classes').resolve({ data: [{ id: 'c1' }], error: null })
    for (const table of ['assignments', 'tasks', 'events', 'pomodoro_sessions']) {
      deferred(table).resolve({ data: [], error: null })
    }

    await waitFor(() => expect(screen.getByTestId('classes')).toHaveTextContent('1'))
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('none')
  })

  it('discards a fetch still in flight when the user signs out', async () => {
    queryState.user = { id: 'u1' }
    const view = render(
      <Harness>
        <Probe />
      </Harness>,
    )

    // Sign out: load() starts a new run and clears state synchronously.
    queryState.user = null
    view.rerender(
      <Harness>
        <Probe />
      </Harness>,
    )
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('classes')).toHaveTextContent('0')

    // The first run's fetches resolve AFTER sign-out — they must be discarded.
    deferred('classes').resolve({
      data: [{ id: 'stale-c1' }],
      error: { message: 'stale error' },
    })
    for (const table of ['assignments', 'tasks', 'events', 'pomodoro_sessions']) {
      deferred(table).resolve({ data: [{ id: 'stale' }], error: null })
    }

    await flush()
    expect(screen.getByTestId('classes')).toHaveTextContent('0')
    expect(screen.getByTestId('error')).toHaveTextContent('none')
  })

  it('surfaces pomodoro_sessions errors instead of dropping them', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )

    deferred('classes').resolve({ data: [], error: null })
    deferred('assignments').resolve({ data: [], error: null })
    deferred('tasks').resolve({ data: [], error: null })
    deferred('events').resolve({ data: [], error: null })
    deferred('pomodoro_sessions').resolve({
      data: null,
      error: { message: 'sessions query blew up' },
    })

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('sessions query blew up'))
  })
})
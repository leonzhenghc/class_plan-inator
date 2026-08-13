import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { queryState } = vi.hoisted(() => ({
  queryState: {
    user: null,
    /** One deferred per table per load() invocation, so each run is resolvable independently. */
    generations: [],
    /** Every insert/update/delete gets its own deferred, in call order. */
    mutations: [],
    createDeferred() {
      let resolve = () => {}
      let reject = () => {}
      const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
      })
      return { promise, resolve, reject }
    },
    makeDeferreds() {
      const deferreds = {}
      for (const table of [
        'classes',
        'assignments',
        'tasks',
        'events',
        'pomodoro_sessions',
      ]) {
        deferreds[table] = this.createDeferred()
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
        single: () => chain,
        update: () => mutationChain('update'),
        delete: () => mutationChain('delete'),
        insert: () => mutationChain('insert'),
      }
      // Mutations run after load, so giving each its own deferred keeps them
      // independent of the load() generation — and of each other.
      const mutationChain = (verb) => {
        const deferred = queryState.createDeferred()
        queryState.mutations.push({ table, verb, deferred })
        const inner = {
          then: (onFulfilled, onRejected) => deferred.promise.then(onFulfilled, onRejected),
          select: () => inner,
          order: () => inner,
          limit: () => inner,
          eq: () => inner,
          single: () => inner,
          update: () => mutationChain('update'),
          delete: () => mutationChain('delete'),
          insert: () => mutationChain('insert'),
        }
        return inner
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
  const {
    loading,
    error,
    classes,
    events,
    createEvent,
    createClass,
    updateClass,
    deleteClass,
  } = useWorkspace()
  const [result, setResult] = useState('')
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="classes">{classes.length}</span>
      <span data-testid="events">{events.length}</span>
      <span data-testid="error">{error?.message ?? 'none'}</span>
      <button
        type="button"
        onClick={async () => {
          const { error: saveError } = await createEvent({ title: 'x' })
          setResult(saveError ? `error: ${saveError.message}` : 'ok')
        }}
      >
        create event
      </button>
      <button
        type="button"
        onClick={async () => {
          const { error: saveError } = await createClass(
            { name: 'Quantum' },
            { title: 'Quantum', kind: 'class', event_date: '2026-08-24', fixed: true },
          )
          setResult(saveError ? `error: ${saveError.message}` : 'ok')
        }}
      >
        create class with schedule
      </button>
      <button
        type="button"
        onClick={async () => {
          const { error: saveError } = await updateClass(
            'c1',
            { name: 'New name' },
            { title: 'Quantum', kind: 'class', event_date: '2026-08-24', fixed: true },
          )
          setResult(saveError ? `error: ${saveError.message}` : 'ok')
        }}
      >
        update class
      </button>
      <button
        type="button"
        onClick={async () => {
          const { error: deleteError } = await deleteClass('c1')
          setResult(deleteError ? `error: ${deleteError.message}` : 'ok')
        }}
      >
        delete class
      </button>
      <span data-testid="create-result">{result}</span>
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

function mutation(table, verb) {
  return [...queryState.mutations].reverse().find((item) => item.table === table && item.verb === verb)
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

function resolveLoad() {
  deferred('classes').resolve({ data: [], error: null })
  deferred('assignments').resolve({ data: [], error: null })
  deferred('tasks').resolve({ data: [], error: null })
  deferred('events').resolve({ data: [], error: null })
  deferred('pomodoro_sessions').resolve({ data: [], error: null })
}

beforeEach(() => {
  queryState.user = null
  queryState.generations = []
  queryState.mutations = []
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

  it('returns a usable error when a mutation rejects, without touching state', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )
    resolveLoad()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    fireEvent.click(screen.getByText('create event'))
    mutation('events', 'insert').deferred.reject(new Error('network down'))

    await waitFor(() =>
      expect(screen.getByTestId('create-result')).toHaveTextContent('error: network down'),
    )
    expect(screen.getByTestId('events')).toHaveTextContent('0')
  })

  it('surfaces a rejected workspace fetch instead of hanging on loading', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )

    deferred('events').reject(new Error('network down'))

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('network down'))
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })
})

describe('class schedules', () => {
  it('saves the fixed schedule event alongside the class', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )
    resolveLoad()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    fireEvent.click(screen.getByText('create class with schedule'))
    mutation('classes', 'insert').deferred.resolve({ data: { id: 'c1' }, error: null })
    await waitFor(() => expect(mutation('events', 'insert')).toBeDefined())
    mutation('events', 'insert').deferred.resolve({
      data: { id: 'e1', class_id: 'c1', fixed: true },
      error: null,
    })

    await waitFor(() => expect(screen.getByTestId('create-result')).toHaveTextContent('ok'))
    expect(screen.getByTestId('classes')).toHaveTextContent('1')
    expect(screen.getByTestId('events')).toHaveTextContent('1')
  })

  it('keeps the class when only the schedule insert fails', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )
    resolveLoad()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    fireEvent.click(screen.getByText('create class with schedule'))
    mutation('classes', 'insert').deferred.resolve({ data: { id: 'c1' }, error: null })
    await waitFor(() => expect(mutation('events', 'insert')).toBeDefined())
    mutation('events', 'insert').deferred.reject(new Error('network down'))

    await waitFor(() =>
      expect(screen.getByTestId('create-result')).toHaveTextContent('error: network down'),
    )
    expect(screen.getByTestId('classes')).toHaveTextContent('1')
    expect(screen.getByTestId('events')).toHaveTextContent('0')
  })

  it('regenerates fixed blocks when a class is updated', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )
    deferred('classes').resolve({ data: [{ id: 'c1' }], error: null })
    for (const table of ['assignments', 'tasks', 'pomodoro_sessions']) {
      deferred(table).resolve({ data: [], error: null })
    }
    deferred('events').resolve({
      data: [{ id: 'e1', class_id: 'c1', fixed: true }],
      error: null,
    })
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    fireEvent.click(screen.getByText('update class'))
    mutation('classes', 'update').deferred.resolve({
      data: { id: 'c1', name: 'New name' },
      error: null,
    })
    await waitFor(() => expect(mutation('events', 'delete')).toBeDefined())
    mutation('events', 'delete').deferred.resolve({ data: null, error: null })
    await waitFor(() => expect(mutation('events', 'insert')).toBeDefined())
    mutation('events', 'insert').deferred.resolve({
      data: { id: 'e2', class_id: 'c1', fixed: true },
      error: null,
    })

    await waitFor(() => expect(screen.getByTestId('create-result')).toHaveTextContent('ok'))
    // e1 gone, e2 present — a length of one proves both the delete and insert ran.
    expect(screen.getByTestId('events')).toHaveTextContent('1')
  })

  it('removes fixed blocks when the class is deleted', async () => {
    queryState.user = { id: 'u1' }
    render(
      <Harness>
        <Probe />
      </Harness>,
    )
    deferred('classes').resolve({ data: [{ id: 'c1' }], error: null })
    for (const table of ['assignments', 'tasks', 'pomodoro_sessions']) {
      deferred(table).resolve({ data: [], error: null })
    }
    deferred('events').resolve({
      data: [{ id: 'e1', class_id: 'c1', fixed: true }],
      error: null,
    })
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    fireEvent.click(screen.getByText('delete class'))
    mutation('events', 'delete').deferred.resolve({ data: null, error: null })
    await waitFor(() => expect(mutation('classes', 'delete')).toBeDefined())
    mutation('classes', 'delete').deferred.resolve({ data: null, error: null })

    await waitFor(() => expect(screen.getByTestId('create-result')).toHaveTextContent('ok'))
    expect(screen.getByTestId('classes')).toHaveTextContent('0')
    expect(screen.getByTestId('events')).toHaveTextContent('0')
  })
})
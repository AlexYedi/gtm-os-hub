import { loginAction } from './actions'

export const metadata = { title: 'Cockpit — sign in' }

export default async function CockpitLogin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Cockpit · Tier 3</p>
      <h1 className="mt-2 text-2xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-ink-muted">The private capture surface — timer, submissions, and pace.</p>
      <form action={loginAction} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          placeholder="Cockpit password"
          autoComplete="current-password"
          className="w-full rounded-md border border-edge bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {e ? <p className="text-xs text-accent">Incorrect password.</p> : null}
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-cream hover:bg-accent-dark"
        >
          Enter
        </button>
      </form>
    </main>
  )
}

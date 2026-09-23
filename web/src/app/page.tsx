import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const features = [
  {
    title: 'Boards',
    body: 'Lists and cards. Drag work across stages without leaving the page.'
  },
  {
    title: 'Calendar',
    body: 'A full month of due dates. See the week before it arrives.'
  },
  {
    title: 'Timeline',
    body: 'Every task with a start and due date becomes a bar on a real timeline.'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <p className="text-sm font-medium text-primary">Task management, kept quiet</p>
        <h1 className="mt-3 max-w-2xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          Plan the work. See the line it takes.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-7 text-muted-foreground">
          TaskLine is a small workspace for boards, dates, and timelines. Same job as the heavy
          tools — fewer screens, less chrome, your name on the work.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/register">Create a workspace</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Use the demo</Link>
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Demo: demo@taskline.app / demo1234</p>

        <section className="mt-16 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-medium">Product launch</span>
              <span className="text-muted-foreground">Board · Timeline</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['To do', 'In progress', 'Done'].map((name, index) => (
                <div key={name} className="rounded-lg bg-background p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{name}</p>
                  <div className="space-y-2">
                    {(index === 0
                      ? ['Timeline view', 'AI agents (next)']
                      : index === 1
                        ? ['Kanban drag and drop', 'Calendar view']
                        : ['Landing page', 'Auth shell']
                    ).map((card) => (
                      <div key={card} className="rounded-md border border-border px-3 py-2 text-sm">
                        {card}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title}>
              <h2 className="text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 rounded-2xl border border-border bg-card px-8 py-10">
          <h2 className="text-2xl font-semibold tracking-tight">AI, later — without the pitch.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The next version is meant to talk to agents from a board, a task, or the timeline. This
            release stays honest: lists, dates, and a line you can follow.
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        TaskLine · a portfolio product
      </footer>
    </div>
  )
}

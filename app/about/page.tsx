import Link from "next/link"

export default function AboutPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">About This Digital Twin</h1>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </Link>
        </div>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">What is a Digital Twin?</h2>
            <p>
              This AI-powered digital twin is designed to represent you professionally. It can answer questions about
              your experience, skills, projects, and career goals in a way that reflects your unique background and
              personality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">How It Works</h2>
            <p>
              The digital twin uses advanced AI technology to understand and respond to questions about your
              professional profile. It's trained on information about your background, making it an interactive way for
              employers and colleagues to learn about you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Use Cases</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Share with potential employers to showcase your background interactively</li>
              <li>Provide quick answers to common questions about your experience</li>
              <li>Demonstrate your technical skills through this innovative presentation</li>
              <li>Save time by letting the AI handle initial screening questions</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Technology Stack</h2>
            <div className="flex flex-wrap gap-2">
              {["Next.js", "AI SDK", "Upstash Vector", "TypeScript", "Tailwind CSS"].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="pt-6">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Try the Chat Interface
          </Link>
        </div>
      </div>
    </main>
  )
}

import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-balance">Digital Twin AI</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            An AI-powered digital twin chatbot that represents you professionally. Ask questions and get responses that
            reflect your experience, skills, and personality.
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Start Conversation
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors"
          >
            About This Twin
          </Link>
        </div>

        <div className="pt-8 border-t border-border">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">What you can ask:</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">→</span>
              <span>Professional experience and skills</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">→</span>
              <span>Technical expertise and projects</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">→</span>
              <span>Work style and collaboration approach</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">→</span>
              <span>Career goals and interests</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}

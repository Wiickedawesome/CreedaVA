import Link from "next/link";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="bg-mk-paper py-32 text-mk-ink lg:py-48">
      <Container size="sm">
        <div className="text-center">
          <p className="font-display text-6xl font-extrabold tracking-[-0.045em] text-mk-brand mb-4">
            404
          </p>
          <h1 className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-mk-ink mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-mk-ink-mute mb-8 max-w-md mx-auto">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has
            been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3 bg-mk-brand text-white font-semibold rounded-full shadow-[var(--mk-shadow-brand)] hover:bg-mk-brand-bright transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border border-mk-line-strong bg-mk-white/80 text-mk-ink font-semibold rounded-full hover:border-mk-brand hover:text-mk-brand transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

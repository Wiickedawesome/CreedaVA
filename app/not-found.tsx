import Link from "next/link";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="py-32 lg:py-48">
      <Container size="sm">
        <div className="text-center">
          <p className="text-6xl font-bold text-primary mb-4">404</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-60 mb-8 max-w-md mx-auto">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has
            been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-medium rounded-md hover:bg-primary hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

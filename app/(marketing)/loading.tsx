import { Container } from "@/components/ui";

export default function MarketingLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading page content">
      {/* Hero skeleton */}
      <section className="py-20 lg:py-32 bg-linear-to-b from-mk-paper to-mk-white">
        <Container>
          <div className="max-w-2xl mx-auto text-center animate-pulse">
            <div className="h-10 bg-mk-line rounded-(--mk-radius) w-3/4 mx-auto mb-6" />
            <div className="h-5 bg-mk-line rounded w-full mx-auto mb-3" />
            <div className="h-5 bg-mk-line rounded w-2/3 mx-auto" />
          </div>
        </Container>
      </section>

      {/* Content skeleton */}
      <section className="bg-mk-white py-16 lg:py-24">
        <Container>
          <div className="animate-pulse space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-mk-paper rounded-(--mk-radius-lg) p-8">
                  <div className="w-12 h-12 bg-mk-line rounded-(--mk-radius) mb-4" />
                  <div className="h-5 bg-mk-line rounded w-2/3 mb-3" />
                  <div className="h-4 bg-mk-line rounded w-full mb-2" />
                  <div className="h-4 bg-mk-line rounded w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

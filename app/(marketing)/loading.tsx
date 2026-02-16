import { Container } from "@/components/ui";

export default function MarketingLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="py-20 lg:py-32 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="max-w-2xl mx-auto text-center animate-pulse">
            <div className="h-10 bg-gray-20 rounded-lg w-3/4 mx-auto mb-6" />
            <div className="h-5 bg-gray-20 rounded w-full mx-auto mb-3" />
            <div className="h-5 bg-gray-20 rounded w-2/3 mx-auto" />
          </div>
        </Container>
      </section>

      {/* Content skeleton */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="animate-pulse space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-10 rounded-2xl p-8">
                  <div className="w-12 h-12 bg-gray-20 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-20 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-gray-20 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-20 rounded w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

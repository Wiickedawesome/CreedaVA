/**
 * Lazy-loaded AI helpers
 *
 * Each function dynamically imports lib/firebase/ai only when called,
 * keeping the firebase/ai SDK out of the initial page bundle.
 */

export async function lazyGenerateText(
  ...args: Parameters<typeof import("./ai").generateText>
) {
  const { generateText } = await import("./ai");
  return generateText(...args);
}

export async function lazyGenerateBlogPost(
  ...args: Parameters<typeof import("./ai").generateBlogPost>
) {
  const { generateBlogPost } = await import("./ai");
  return generateBlogPost(...args);
}

export async function lazySuggestKeywords(
  ...args: Parameters<typeof import("./ai").suggestKeywords>
) {
  const { suggestKeywords } = await import("./ai");
  return suggestKeywords(...args);
}

export async function lazyAnalyzeSEO(
  ...args: Parameters<typeof import("./ai").analyzeSEO>
) {
  const { analyzeSEO } = await import("./ai");
  return analyzeSEO(...args);
}

export async function lazyGenerateSocialPosts(
  ...args: Parameters<typeof import("./ai").generateSocialPosts>
) {
  const { generateSocialPosts } = await import("./ai");
  return generateSocialPosts(...args);
}

export async function lazyGenerateEmail(
  ...args: Parameters<typeof import("./ai").generateEmail>
) {
  const { generateEmail } = await import("./ai");
  return generateEmail(...args);
}

export async function lazyGenerateLandingPage(
  ...args: Parameters<typeof import("./ai").generateLandingPage>
) {
  const { generateLandingPage } = await import("./ai");
  return generateLandingPage(...args);
}

export async function lazyGenerateReport(
  ...args: Parameters<typeof import("./ai").generateReport>
) {
  const { generateReport } = await import("./ai");
  return generateReport(...args);
}

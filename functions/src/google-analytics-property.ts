export function toGA4PropertyResourceName(propertyId: string | undefined): string {
  const rawPropertyId = propertyId?.trim();

  if (!rawPropertyId) {
    throw new Error("GA4 Property ID is required");
  }

  const numericPropertyId = rawPropertyId.replace(/^properties\//, "");

  if (!/^\d+$/.test(numericPropertyId)) {
    throw new Error("GA4 Property ID must be numeric, for example 524822766");
  }

  return `properties/${numericPropertyId}`;
}

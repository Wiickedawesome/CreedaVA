import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if an email address belongs to the @creedava.com domain
 * @param email - The email address to validate
 * @returns boolean - True if email ends with @creedava.com, false otherwise
 */
export function isValidCreedaVAEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@creedava.com')
}

/**
 * Error message for domain restriction
 */
export const DOMAIN_RESTRICTION_MESSAGE = 'Access restricted to @creedava.com email addresses only'

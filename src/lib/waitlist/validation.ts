export interface WaitlistSubmissionInput {
  email: unknown;
  primaryTool?: unknown;
  whatBuilding?: unknown;
  referralCode?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  sourcePage?: unknown;
  website?: unknown; // Honeypot field
}

export interface WaitlistSubmission {
  email: string;
  emailNormalized: string;
  primaryTool: string | null;
  whatBuilding: string | null;
  referralCode: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  sourcePage: string;
  honeypotTriggered: boolean;
}

export interface WaitlistValidationResult {
  valid: boolean;
  data?: WaitlistSubmission;
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_TOOL_LENGTH = 64;
const MAX_BUILDING_LENGTH = 240;
const MAX_REFERRAL_LENGTH = 64;
const MAX_UTM_LENGTH = 128;
const MAX_SOURCE_PAGE_LENGTH = 128;

function normalizeOptionalString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeSourcePage(value: unknown): string {
  if (typeof value !== 'string') {
    return '/';
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) {
    return '/';
  }

  return trimmed.slice(0, MAX_SOURCE_PAGE_LENGTH);
}

export function validateWaitlistSubmission(input: WaitlistSubmissionInput): WaitlistValidationResult {
  if (!input || typeof input !== 'object') {
    return {
      valid: false,
      error: 'Invalid request payload',
    };
  }

  if (typeof input.email !== 'string') {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  const email = input.email.trim();
  const emailNormalized = email.toLowerCase();

  if (!email) {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return {
      valid: false,
      error: 'Email is too long',
    };
  }

  if (!EMAIL_PATTERN.test(emailNormalized)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }

  const website = normalizeOptionalString(input.website, 256);

  return {
    valid: true,
    data: {
      email,
      emailNormalized,
      primaryTool: normalizeOptionalString(input.primaryTool, MAX_TOOL_LENGTH),
      whatBuilding: normalizeOptionalString(input.whatBuilding, MAX_BUILDING_LENGTH),
      referralCode: normalizeOptionalString(input.referralCode, MAX_REFERRAL_LENGTH),
      utmSource: normalizeOptionalString(input.utmSource, MAX_UTM_LENGTH),
      utmMedium: normalizeOptionalString(input.utmMedium, MAX_UTM_LENGTH),
      utmCampaign: normalizeOptionalString(input.utmCampaign, MAX_UTM_LENGTH),
      sourcePage: normalizeSourcePage(input.sourcePage),
      honeypotTriggered: Boolean(website),
    },
  };
}

export function isValidConfirmationToken(token: string): boolean {
  // UUID + random suffix format generated server-side in API route
  return token.length >= 40 && token.length <= 80 && /^[a-zA-Z0-9-]+$/.test(token);
}

'use client';

/**
 * Password Strength Indicator Component
 *
 * Displays a visual indicator of password strength and provides
 * real-time feedback to help users create strong passwords.
 */

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4; // 0=none, 1=weak, 2=fair, 3=good, 4=strong
  feedback: string[];
  meetsMinimum: boolean;
}

/**
 * Calculates password strength based on multiple criteria
 */
function calculatePasswordStrength(password: string): StrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  const hasMinLength = password.length >= 12;
  const hasGoodLength = password.length >= 16;

  // Character type checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Calculate score (0-4)
  if (password.length === 0) {
    return { score: 0, feedback: [], meetsMinimum: false };
  }

  if (hasMinLength) score++;
  if (hasGoodLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  // Cap at 4 and cast to the union type
  const finalScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

  // Generate feedback
  if (!hasMinLength) {
    feedback.push(`At least 12 characters (${password.length}/12)`);
  }

  if (!hasUppercase) {
    feedback.push('Include uppercase letter (A-Z)');
  }

  if (!hasLowercase) {
    feedback.push('Include lowercase letter (a-z)');
  }

  if (!hasNumber) {
    feedback.push('Include number (0-9)');
  }

  if (!hasSpecial) {
    feedback.push('Include special character (!@#$%...)');
  }

  // Check if meets minimum requirements
  const meetsMinimum = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  // Add positive feedback if strong
  if (meetsMinimum && feedback.length === 0) {
    feedback.push('Strong password!');
  }

  return { score: finalScore, feedback, meetsMinimum };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, feedback, meetsMinimum } = calculatePasswordStrength(password);

  // Don't show anything if password is empty
  if (password.length === 0) {
    return null;
  }

  // Color scheme based on score
  const colors = {
    0: 'bg-gray-300 dark:bg-gray-600',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500',
  };

  const labels = {
    0: 'None',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  };

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-colors ${
              level <= score ? colors[score] : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          Password strength: <span className="font-medium">{labels[score]}</span>
        </span>
        {meetsMinimum && (
          <span className="text-green-600 dark:text-green-400">✓ Meets requirements</span>
        )}
      </div>

      {/* Feedback list */}
      {feedback.length > 0 && (
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          {feedback.map((item, index) => (
            <li key={index} className="flex items-start gap-1">
              <span className={meetsMinimum ? 'text-green-500' : 'text-gray-400'}>
                {item.includes('Strong') ? '✓' : '•'}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Validates password against security requirements
 * Use this for form validation
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  const { meetsMinimum } = calculatePasswordStrength(password);

  if (!meetsMinimum) {
    return {
      valid: false,
      error:
        'Password must be at least 12 characters and include uppercase, lowercase, number, and special character',
    };
  }

  return { valid: true };
}

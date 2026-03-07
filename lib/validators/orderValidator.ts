// lib/validators/orderValidator.ts
// Comprehensive order validation to prevent spam/test orders

interface ValidationResult {
    valid: boolean;
    error?: string;
}

// ============================================
// EMAIL VALIDATION
// ============================================

const EMAIL_PATTERNS = {
    // Domain kanglogo
    ownDomain: /@kanglogo\.com$/i,

    // Email test patterns (diperlebar)
    testPrefixes: [
        /^test/i, /^demo/i, /^sample/i, /^fake/i, /^spam/i,
        /^trash/i, /^temp/i, /^dummy/i, /^asdf/i, /^qwer/i,
        /^admin@/i, /^info@/i, /^halo@/i, /^hello@/i, /^hi@/i,
        /^contact@/i, /^support@/i, /^sales@/i, /^noreply/i,
        /^no-reply/i, /^donotreply/i, /^example/i, /^user\d+@/i,
        /^customer\d+@/i, /^buyer\d+@/i, /^order\d+@/i,
        /^saypul/i, /^miyabi/i, // Dari contoh user
    ],

    // Disposable/temporary email domains (diperlebar)
    disposableDomains: [
        'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'throwaway.email', 'mailinator.com', 'maildrop.cc',
        'temp-mail.org', 'getnada.com', 'trashmail.com',
        'yopmail.com', 'fakeinbox.com', 'sharklasers.com',
        'grr.la', 'guerrillamail.biz', 'spam4.me',
        'mintemail.com', 'emailondeck.com', 'mytemp.email',
        'tempinbox.com', 'dispostable.com', 'mohmal.com',
        'emailfake.com', 'throwawaymail.com', 'fake-mail.com'
    ],

    // Invalid patterns
    invalidPatterns: [
        /\.\./, // Double dots
        /@\./, // @ followed by dot
        /\.@/, // Dot followed by @
        /^\./, // Starts with dot
        /\.$/, // Ends with dot
        /@.*@/, // Multiple @
    ]
};

export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return { valid: false, error: 'Email wajib diisi' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Basic format check
    if (trimmedEmail.length < 5) {
        return { valid: false, error: 'Email terlalu pendek' };
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        return { valid: false, error: 'Format email tidak valid' };
    }

    // Check invalid patterns
    if (EMAIL_PATTERNS.invalidPatterns.some(pattern => pattern.test(trimmedEmail))) {
        return { valid: false, error: 'Format email tidak valid' };
    }

    // Check own domain
    if (EMAIL_PATTERNS.ownDomain.test(trimmedEmail)) {
        return { valid: false, error: 'Email dengan domain @kanglogo.com tidak dapat digunakan' };
    }

    // Check test prefixes
    if (EMAIL_PATTERNS.testPrefixes.some(pattern => pattern.test(trimmedEmail))) {
        return { valid: false, error: 'Email test/demo tidak dapat digunakan untuk pembelian' };
    }

    // Check disposable domains
    const domain = trimmedEmail.split('@')[1];
    if (EMAIL_PATTERNS.disposableDomains.includes(domain)) {
        return { valid: false, error: 'Email sementara/disposable tidak dapat digunakan' };
    }

    return { valid: true };
}

// ============================================
// PHONE VALIDATION
// ============================================

const PHONE_RULES: Record<string, { min: number; max: number; name: string }> = {
    '+62': { min: 10, max: 13, name: 'Indonesia' },
    '+60': { min: 9, max: 11, name: 'Malaysia' },
    '+65': { min: 8, max: 8, name: 'Singapura' },
    '+1': { min: 10, max: 10, name: 'US/Canada' },
    '+44': { min: 10, max: 10, name: 'UK' },
    '+61': { min: 9, max: 9, name: 'Australia' },
    '+81': { min: 10, max: 10, name: 'Jepang' },
    '+82': { min: 10, max: 11, name: 'Korea' },
    '+86': { min: 11, max: 11, name: 'China' },
    '+91': { min: 10, max: 10, name: 'India' },
    '+49': { min: 10, max: 11, name: 'Jerman' },
    '+33': { min: 9, max: 9, name: 'Prancis' },
};

const BLOCKED_PHONES = [
    '6289604954294',  // Kanglogo number
    '1234567890',
    '0123456789',
    '9876543210',
    '0000000000',
    '1111111111',
    '2222222222',
    '3333333333',
    '4444444444',
    '5555555555',
    '6666666666',
    '7777777777',
    '8888888888',
    '9999999999',
    '123456789',
    '111111111',
    '000000000',
];

export function validatePhone(phone: string, countryCode: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
        return { valid: true }; // Phone is optional
    }

    const phoneDigits = phone.replace(/\D/g, '');

    // Check minimum length
    if (phoneDigits.length < 8) {
        return { valid: false, error: 'Nomor HP terlalu pendek' };
    }

    // Check maximum length
    if (phoneDigits.length > 15) {
        return { valid: false, error: 'Nomor HP terlalu panjang' };
    }

    // Check country-specific rules
    const countryRule = PHONE_RULES[countryCode];
    if (countryRule) {
        if (phoneDigits.length < countryRule.min || phoneDigits.length > countryRule.max) {
            return {
                valid: false,
                error: `Nomor HP ${countryRule.name} harus ${countryRule.min}-${countryRule.max} digit`
            };
        }
    }

    // Check blocked numbers
    if (BLOCKED_PHONES.some(blocked => phoneDigits.includes(blocked))) {
        return { valid: false, error: 'Nomor HP tidak valid' };
    }

    // Check if all digits are the same
    if (/^(\d)\1+$/.test(phoneDigits)) {
        return { valid: false, error: 'Nomor HP tidak valid' };
    }

    // Check sequential patterns (ascending/descending)
    const isSequential = (str: string) => {
        for (let i = 0; i < str.length - 2; i++) {
            const a = parseInt(str[i]);
            const b = parseInt(str[i + 1]);
            const c = parseInt(str[i + 2]);
            if (b === a + 1 && c === b + 1) return true; // Ascending
            if (b === a - 1 && c === b - 1) return true; // Descending
        }
        return false;
    };

    if (phoneDigits.length >= 8 && isSequential(phoneDigits)) {
        return { valid: false, error: 'Nomor HP tidak valid' };
    }

    return { valid: true };
}

// ============================================
// NAME VALIDATION
// ============================================

const NAME_PATTERNS = {
    // Suspicious patterns (diperlebar)
    suspicious: [
        /^test/i, /^demo/i, /^sample/i, /^fake/i,
        /^asdf/i, /^qwer/i, /^admin/i, /^user\d+/i,
        /^customer\d+/i, /^buyer\d+/i, /^order\d+/i,
        /^spam/i, /^trash/i, /^temp/i, /^dummy/i,
        /^example/i, /^null/i, /^undefined/i,
        /^none/i, /^n\/a/i, /^na$/i,
        /^xxx/i, /^zzz/i, /^aaa/i,
        /^miyabi/i, /^saypul/i, // Dari contoh
    ],

    // Must have at least one letter
    mustHaveLetters: /[a-zA-Z]/,

    // Invalid characters (only letters, spaces, dots, hyphens, apostrophes allowed)
    invalidChars: /[^a-zA-Z\s.\-']/,
};

export function validateName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Nama wajib diisi' };
    }

    const trimmedName = name.trim();

    // Check length
    if (trimmedName.length < 3) {
        return { valid: false, error: 'Nama terlalu pendek (minimal 3 karakter)' };
    }

    if (trimmedName.length > 50) {
        return { valid: false, error: 'Nama terlalu panjang (maksimal 50 karakter)' };
    }

    // Must have letters
    if (!NAME_PATTERNS.mustHaveLetters.test(trimmedName)) {
        return { valid: false, error: 'Nama harus mengandung huruf' };
    }

    // Check invalid characters
    if (NAME_PATTERNS.invalidChars.test(trimmedName)) {
        return { valid: false, error: 'Nama mengandung karakter tidak valid' };
    }

    // Check suspicious patterns
    if (NAME_PATTERNS.suspicious.some(pattern => pattern.test(trimmedName))) {
        return { valid: false, error: 'Nama tidak valid' };
    }

    // Check if name is only one character repeated
    if (/^(.)\1+$/.test(trimmedName.replace(/\s/g, ''))) {
        return { valid: false, error: 'Nama tidak valid' };
    }

    return { valid: true };
}

// ============================================
// COMBINED VALIDATION
// ============================================

export interface OrderData {
    customer_name: string;
    customer_email: string;
    customer_whatsapp?: string;
    country_code?: string;
}

export function validateOrder(data: OrderData): ValidationResult {
    // Validate name
    const nameCheck = validateName(data.customer_name);
    if (!nameCheck.valid) return nameCheck;

    // Validate email
    const emailCheck = validateEmail(data.customer_email);
    if (!emailCheck.valid) return emailCheck;

    // Validate phone (if provided)
    if (data.customer_whatsapp) {
        const phoneCheck = validatePhone(
            data.customer_whatsapp,
            data.country_code || '+62'
        );
        if (!phoneCheck.valid) return phoneCheck;
    }

    return { valid: true };
}

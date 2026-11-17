export interface CountryDialInfo {
  readonly code: string;
  readonly name: string;
  readonly dialCode: string;
  readonly flag: string;
}

export const COUNTRIES: readonly CountryDialInfo[] = [
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Indonesia (+62)

// Sorted by dial code length descending so longer codes (+852, +971, +358) match before shorter (+1, +7)
const SORTED_DIAL_CODES = [...COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

export function parsePhoneNumber(rawPhone?: string): {
  dialCode: string;
  nationalNumber: string;
  matchedCountry: CountryDialInfo;
} {
  const cleaned = (rawPhone || '').trim();
  if (!cleaned) {
    return { dialCode: DEFAULT_COUNTRY.dialCode, nationalNumber: '', matchedCountry: DEFAULT_COUNTRY };
  }

  // Handle + prefix
  if (cleaned.startsWith('+')) {
    for (const country of SORTED_DIAL_CODES) {
      if (cleaned.startsWith(country.dialCode)) {
        const remaining = cleaned.slice(country.dialCode.length).trim();
        return { dialCode: country.dialCode, nationalNumber: remaining, matchedCountry: country };
      }
    }
  }

  // Handle leading 0 (Indonesian local format convention 08...)
  if (cleaned.startsWith('0')) {
    return {
      dialCode: DEFAULT_COUNTRY.dialCode,
      nationalNumber: cleaned.replace(/^0+/, ''),
      matchedCountry: DEFAULT_COUNTRY,
    };
  }

  // Fallback: assume default country with cleaned number
  return {
    dialCode: DEFAULT_COUNTRY.dialCode,
    nationalNumber: cleaned,
    matchedCountry: DEFAULT_COUNTRY,
  };
}

export function formatFullPhoneNumber(dialCode: string, nationalNumber: string): string {
  const num = nationalNumber.replace(/\s+/g, ' ').trim();
  if (!num) return '';
  return `${dialCode} ${num}`;
}

import { NextResponse } from 'next/server';

export interface AfricanCountry {
  name: string;
  code: string;
  flag: string;
  cca2: string;
  mask: string;
  placeholder: string;
}

export const ALL_AFRICAN_COUNTRIES: AfricanCountry[] = [
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', cca2: 'NG', mask: '### ### ####', placeholder: '803 123 4567' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭', cca2: 'GH', mask: '## ### ####', placeholder: '24 123 4567' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪', cca2: 'KE', mask: '### ### ###', placeholder: '712 345 678' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', cca2: 'ZA', mask: '## ### ####', placeholder: '82 123 4567' },
  { name: 'Rwanda', code: '+250', flag: '🇷🇼', cca2: 'RW', mask: '### ### ###', placeholder: '788 123 456' },
  { name: 'Uganda', code: '+256', flag: '🇺🇬', cca2: 'UG', mask: '### ### ###', placeholder: '772 123 456' },
  { name: 'Cameroon', code: '+237', flag: '🇨🇲', cca2: 'CM', mask: '### ## ## ##', placeholder: '670 12 34 56' },
  { name: 'Algeria', code: '+213', flag: '🇩🇿', cca2: 'DZ', mask: '## ## ## ##', placeholder: '55 12 34 56' },
  { name: 'Angola', code: '+244', flag: '🇦🇴', cca2: 'AO', mask: '### ### ###', placeholder: '923 123 456' },
  { name: 'Benin', code: '+229', flag: '🇧🇯', cca2: 'BJ', mask: '## ## ## ##', placeholder: '97 12 34 56' },
  { name: 'Botswana', code: '+267', flag: '🇧🇼', cca2: 'BW', mask: '## ### ###', placeholder: '71 234 567' },
  { name: 'Burkina Faso', code: '+226', flag: '🇧🇫', cca2: 'BF', mask: '## ## ## ##', placeholder: '70 12 34 56' },
  { name: 'Burundi', code: '+257', flag: '🇧🇮', cca2: 'BI', mask: '## ## ## ##', placeholder: '79 12 34 56' },
  { name: 'Cabo Verde', code: '+238', flag: '🇨🇻', cca2: 'CV', mask: '### ## ##', placeholder: '991 23 45' },
  { name: 'Central African Republic', code: '+236', flag: '🇨🇫', cca2: 'CF', mask: '## ## ## ##', placeholder: '70 12 34 56' },
  { name: 'Chad', code: '+235', flag: '🇹🇩', cca2: 'TD', mask: '## ## ## ##', placeholder: '66 12 34 56' },
  { name: 'Comoros', code: '+269', flag: '🇰🇲', cca2: 'KM', mask: '### ## ##', placeholder: '321 23 45' },
  { name: 'Congo', code: '+242', flag: '🇨🇬', cca2: 'CG', mask: '## ### ####', placeholder: '06 123 4567' },
  { name: 'DR Congo', code: '+243', flag: '🇨🇩', cca2: 'CD', mask: '### ### ###', placeholder: '812 345 678' },
  { name: 'Djibouti', code: '+253', flag: '🇩🇯', cca2: 'DJ', mask: '## ## ## ##', placeholder: '77 12 34 56' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬', cca2: 'EG', mask: '### ### ####', placeholder: '100 123 4567' },
  { name: 'Equatorial Guinea', code: '+240', flag: '🇬🇶', cca2: 'GQ', mask: '### ### ###', placeholder: '222 123 456' },
  { name: 'Eritrea', code: '+291', flag: '🇪🇷', cca2: 'ER', mask: '# ### ###', placeholder: '7 123 456' },
  { name: 'Eswatini', code: '+268', flag: '🇸🇿', cca2: 'SZ', mask: '#### ####', placeholder: '7612 3456' },
  { name: 'Ethiopia', code: '+251', flag: '🇪🇹', cca2: 'ET', mask: '## ### ####', placeholder: '91 123 4567' },
  { name: 'Gabon', code: '+241', flag: '🇬🇦', cca2: 'GA', mask: '## ## ## ##', placeholder: '06 12 34 56' },
  { name: 'Gambia', code: '+220', flag: '🇬🇲', cca2: 'GM', mask: '### ####', placeholder: '701 2345' },
  { name: 'Guinea', code: '+224', flag: '🇬🇳', cca2: 'GN', mask: '### ## ## ##', placeholder: '621 12 34 56' },
  { name: 'Guinea-Bissau', code: '+245', flag: '🇬🇼', cca2: 'GW', mask: '### ####', placeholder: '955 1234' },
  { name: 'Ivory Coast', code: '+225', flag: '🇨🇮', cca2: 'CI', mask: '## ## ## ## ##', placeholder: '07 12 34 56 78' },
  { name: 'Lesotho', code: '+266', flag: '🇱🇸', cca2: 'LS', mask: '#### ####', placeholder: '5812 3456' },
  { name: 'Liberia', code: '+231', flag: '🇱🇷', cca2: 'LR', mask: '## ### ####', placeholder: '77 123 4567' },
  { name: 'Libya', code: '+218', flag: '🇱🇾', cca2: 'LY', mask: '## ### ####', placeholder: '91 123 4567' },
  { name: 'Madagascar', code: '+261', flag: '🇲🇬', cca2: 'MG', mask: '## ## ### ##', placeholder: '32 12 345 67' },
  { name: 'Malawi', code: '+265', flag: '🇲🇼', cca2: 'MW', mask: '### ### ###', placeholder: '991 234 567' },
  { name: 'Mali', code: '+223', flag: '🇲🇱', cca2: 'ML', mask: '## ## ## ##', placeholder: '65 12 34 56' },
  { name: 'Mauritania', code: '+222', flag: '🇲🇷', cca2: 'MR', mask: '## ## ## ##', placeholder: '45 12 34 56' },
  { name: 'Mauritius', code: '+230', flag: '🇲🇺', cca2: 'MU', mask: '#### ####', placeholder: '5123 4567' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦', cca2: 'MA', mask: '## #### ###', placeholder: '61 2345 678' },
  { name: 'Mozambique', code: '+258', flag: '🇲🇿', cca2: 'MZ', mask: '## ### ####', placeholder: '84 123 4567' },
  { name: 'Namibia', code: '+264', flag: '🇳🇦', cca2: 'NA', mask: '## ### ####', placeholder: '81 123 4567' },
  { name: 'Niger', code: '+227', flag: '🇳🇪', cca2: 'NE', mask: '## ## ## ##', placeholder: '90 12 34 56' },
  { name: 'Sao Tome and Principe', code: '+239', flag: '🇸🇹', cca2: 'ST', mask: '### ####', placeholder: '991 2345' },
  { name: 'Senegal', code: '+221', flag: '🇸🇳', cca2: 'SN', mask: '## ### ####', placeholder: '77 123 4567' },
  { name: 'Seychelles', code: '+248', flag: '🇸🇨', cca2: 'SC', mask: '# ### ###', placeholder: '2 512 345' },
  { name: 'Sierra Leone', code: '+232', flag: '🇸🇱', cca2: 'SL', mask: '## ######', placeholder: '76 123456' },
  { name: 'Somalia', code: '+252', flag: '🇸🇴', cca2: 'SO', mask: '# ### ###', placeholder: '6 123 456' },
  { name: 'South Sudan', code: '+211', flag: '🇸🇸', cca2: 'SS', mask: '### ### ###', placeholder: '921 234 567' },
  { name: 'Sudan', code: '+249', flag: '🇸🇩', cca2: 'SD', mask: '## ### ####', placeholder: '91 123 4567' },
  { name: 'Tanzania', code: '+255', flag: '🇹🇿', cca2: 'TZ', mask: '### ### ###', placeholder: '754 123 456' },
  { name: 'Togo', code: '+228', flag: '🇹🇬', cca2: 'TG', mask: '## ## ## ##', placeholder: '90 12 34 56' },
  { name: 'Tunisia', code: '+216', flag: '🇹🇳', cca2: 'TN', mask: '## ### ###', placeholder: '20 123 456' },
  { name: 'Zambia', code: '+260', flag: '🇿🇲', cca2: 'ZM', mask: '## ### ####', placeholder: '97 123 4567' },
  { name: 'Zimbabwe', code: '+263', flag: '🇿🇼', cca2: 'ZW', mask: '## ### ####', placeholder: '77 123 4567' }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: ALL_AFRICAN_COUNTRIES.length,
    countries: ALL_AFRICAN_COUNTRIES
  });
}

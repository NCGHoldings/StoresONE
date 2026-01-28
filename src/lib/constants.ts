// Comprehensive list of IANA timezones organized by region
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export const TIMEZONES: TimezoneOption[] = [
  // Africa
  { value: "Africa/Abidjan", label: "Abidjan", offset: "GMT+0", region: "Africa" },
  { value: "Africa/Accra", label: "Accra", offset: "GMT+0", region: "Africa" },
  { value: "Africa/Addis_Ababa", label: "Addis Ababa", offset: "GMT+3", region: "Africa" },
  { value: "Africa/Algiers", label: "Algiers", offset: "GMT+1", region: "Africa" },
  { value: "Africa/Cairo", label: "Cairo", offset: "GMT+2", region: "Africa" },
  { value: "Africa/Casablanca", label: "Casablanca", offset: "GMT+1", region: "Africa" },
  { value: "Africa/Dar_es_Salaam", label: "Dar es Salaam", offset: "GMT+3", region: "Africa" },
  { value: "Africa/Johannesburg", label: "Johannesburg", offset: "GMT+2", region: "Africa" },
  { value: "Africa/Khartoum", label: "Khartoum", offset: "GMT+2", region: "Africa" },
  { value: "Africa/Kinshasa", label: "Kinshasa", offset: "GMT+1", region: "Africa" },
  { value: "Africa/Lagos", label: "Lagos", offset: "GMT+1", region: "Africa" },
  { value: "Africa/Luanda", label: "Luanda", offset: "GMT+1", region: "Africa" },
  { value: "Africa/Nairobi", label: "Nairobi", offset: "GMT+3", region: "Africa" },
  { value: "Africa/Tunis", label: "Tunis", offset: "GMT+1", region: "Africa" },
  
  // America - North
  { value: "America/Anchorage", label: "Anchorage", offset: "GMT-9", region: "America" },
  { value: "America/Chicago", label: "Chicago", offset: "GMT-6", region: "America" },
  { value: "America/Denver", label: "Denver", offset: "GMT-7", region: "America" },
  { value: "America/Detroit", label: "Detroit", offset: "GMT-5", region: "America" },
  { value: "America/Edmonton", label: "Edmonton", offset: "GMT-7", region: "America" },
  { value: "America/Halifax", label: "Halifax", offset: "GMT-4", region: "America" },
  { value: "America/Honolulu", label: "Honolulu", offset: "GMT-10", region: "America" },
  { value: "America/Los_Angeles", label: "Los Angeles", offset: "GMT-8", region: "America" },
  { value: "America/Mexico_City", label: "Mexico City", offset: "GMT-6", region: "America" },
  { value: "America/Montreal", label: "Montreal", offset: "GMT-5", region: "America" },
  { value: "America/New_York", label: "New York", offset: "GMT-5", region: "America" },
  { value: "America/Phoenix", label: "Phoenix", offset: "GMT-7", region: "America" },
  { value: "America/Toronto", label: "Toronto", offset: "GMT-5", region: "America" },
  { value: "America/Vancouver", label: "Vancouver", offset: "GMT-8", region: "America" },
  { value: "America/Winnipeg", label: "Winnipeg", offset: "GMT-6", region: "America" },
  
  // America - Central & Caribbean
  { value: "America/Bogota", label: "Bogota", offset: "GMT-5", region: "America" },
  { value: "America/Cancun", label: "Cancun", offset: "GMT-5", region: "America" },
  { value: "America/Costa_Rica", label: "Costa Rica", offset: "GMT-6", region: "America" },
  { value: "America/Guatemala", label: "Guatemala", offset: "GMT-6", region: "America" },
  { value: "America/Havana", label: "Havana", offset: "GMT-5", region: "America" },
  { value: "America/Jamaica", label: "Jamaica", offset: "GMT-5", region: "America" },
  { value: "America/Panama", label: "Panama", offset: "GMT-5", region: "America" },
  { value: "America/Puerto_Rico", label: "Puerto Rico", offset: "GMT-4", region: "America" },
  { value: "America/Santo_Domingo", label: "Santo Domingo", offset: "GMT-4", region: "America" },
  
  // America - South
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires", offset: "GMT-3", region: "America" },
  { value: "America/Asuncion", label: "Asuncion", offset: "GMT-4", region: "America" },
  { value: "America/Caracas", label: "Caracas", offset: "GMT-4", region: "America" },
  { value: "America/Guayaquil", label: "Guayaquil", offset: "GMT-5", region: "America" },
  { value: "America/La_Paz", label: "La Paz", offset: "GMT-4", region: "America" },
  { value: "America/Lima", label: "Lima", offset: "GMT-5", region: "America" },
  { value: "America/Montevideo", label: "Montevideo", offset: "GMT-3", region: "America" },
  { value: "America/Santiago", label: "Santiago", offset: "GMT-4", region: "America" },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: "GMT-3", region: "America" },
  
  // Asia
  { value: "Asia/Almaty", label: "Almaty", offset: "GMT+6", region: "Asia" },
  { value: "Asia/Amman", label: "Amman", offset: "GMT+3", region: "Asia" },
  { value: "Asia/Baghdad", label: "Baghdad", offset: "GMT+3", region: "Asia" },
  { value: "Asia/Bahrain", label: "Bahrain", offset: "GMT+3", region: "Asia" },
  { value: "Asia/Baku", label: "Baku", offset: "GMT+4", region: "Asia" },
  { value: "Asia/Bangkok", label: "Bangkok", offset: "GMT+7", region: "Asia" },
  { value: "Asia/Beirut", label: "Beirut", offset: "GMT+2", region: "Asia" },
  { value: "Asia/Colombo", label: "Colombo", offset: "GMT+5:30", region: "Asia" },
  { value: "Asia/Dhaka", label: "Dhaka", offset: "GMT+6", region: "Asia" },
  { value: "Asia/Dubai", label: "Dubai", offset: "GMT+4", region: "Asia" },
  { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh", offset: "GMT+7", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Irkutsk", label: "Irkutsk", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Istanbul", label: "Istanbul", offset: "GMT+3", region: "Asia" },
  { value: "Asia/Jakarta", label: "Jakarta", offset: "GMT+7", region: "Asia" },
  { value: "Asia/Jerusalem", label: "Jerusalem", offset: "GMT+2", region: "Asia" },
  { value: "Asia/Kabul", label: "Kabul", offset: "GMT+4:30", region: "Asia" },
  { value: "Asia/Karachi", label: "Karachi", offset: "GMT+5", region: "Asia" },
  { value: "Asia/Kathmandu", label: "Kathmandu", offset: "GMT+5:45", region: "Asia" },
  { value: "Asia/Kolkata", label: "Kolkata", offset: "GMT+5:30", region: "Asia" },
  { value: "Asia/Krasnoyarsk", label: "Krasnoyarsk", offset: "GMT+7", region: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Kuwait", label: "Kuwait", offset: "GMT+3", region: "Asia" },
  { value: "Asia/Macau", label: "Macau", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Manila", label: "Manila", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Muscat", label: "Muscat", offset: "GMT+4", region: "Asia" },
  { value: "Asia/Novosibirsk", label: "Novosibirsk", offset: "GMT+7", region: "Asia" },
  { value: "Asia/Qatar", label: "Qatar", offset: "GMT+3", region: "Asia" },
  { value: "Asia/Riyadh", label: "Riyadh", offset: "GMT+3", region: "Asia" },
  { value: "Asia/Seoul", label: "Seoul", offset: "GMT+9", region: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Singapore", label: "Singapore", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Taipei", label: "Taipei", offset: "GMT+8", region: "Asia" },
  { value: "Asia/Tashkent", label: "Tashkent", offset: "GMT+5", region: "Asia" },
  { value: "Asia/Tbilisi", label: "Tbilisi", offset: "GMT+4", region: "Asia" },
  { value: "Asia/Tehran", label: "Tehran", offset: "GMT+3:30", region: "Asia" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: "GMT+9", region: "Asia" },
  { value: "Asia/Vladivostok", label: "Vladivostok", offset: "GMT+10", region: "Asia" },
  { value: "Asia/Yekaterinburg", label: "Yekaterinburg", offset: "GMT+5", region: "Asia" },
  { value: "Asia/Yangon", label: "Yangon", offset: "GMT+6:30", region: "Asia" },
  
  // Atlantic
  { value: "Atlantic/Azores", label: "Azores", offset: "GMT-1", region: "Atlantic" },
  { value: "Atlantic/Bermuda", label: "Bermuda", offset: "GMT-4", region: "Atlantic" },
  { value: "Atlantic/Canary", label: "Canary Islands", offset: "GMT+0", region: "Atlantic" },
  { value: "Atlantic/Cape_Verde", label: "Cape Verde", offset: "GMT-1", region: "Atlantic" },
  { value: "Atlantic/Reykjavik", label: "Reykjavik", offset: "GMT+0", region: "Atlantic" },
  
  // Australia & Pacific
  { value: "Australia/Adelaide", label: "Adelaide", offset: "GMT+9:30", region: "Australia" },
  { value: "Australia/Brisbane", label: "Brisbane", offset: "GMT+10", region: "Australia" },
  { value: "Australia/Darwin", label: "Darwin", offset: "GMT+9:30", region: "Australia" },
  { value: "Australia/Hobart", label: "Hobart", offset: "GMT+10", region: "Australia" },
  { value: "Australia/Melbourne", label: "Melbourne", offset: "GMT+10", region: "Australia" },
  { value: "Australia/Perth", label: "Perth", offset: "GMT+8", region: "Australia" },
  { value: "Australia/Sydney", label: "Sydney", offset: "GMT+10", region: "Australia" },
  
  // Europe
  { value: "Europe/Amsterdam", label: "Amsterdam", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Athens", label: "Athens", offset: "GMT+2", region: "Europe" },
  { value: "Europe/Belgrade", label: "Belgrade", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Brussels", label: "Brussels", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Bucharest", label: "Bucharest", offset: "GMT+2", region: "Europe" },
  { value: "Europe/Budapest", label: "Budapest", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Copenhagen", label: "Copenhagen", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Dublin", label: "Dublin", offset: "GMT+0", region: "Europe" },
  { value: "Europe/Helsinki", label: "Helsinki", offset: "GMT+2", region: "Europe" },
  { value: "Europe/Kiev", label: "Kyiv", offset: "GMT+2", region: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbon", offset: "GMT+0", region: "Europe" },
  { value: "Europe/London", label: "London", offset: "GMT+0", region: "Europe" },
  { value: "Europe/Luxembourg", label: "Luxembourg", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Milan", label: "Milan", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow", offset: "GMT+3", region: "Europe" },
  { value: "Europe/Oslo", label: "Oslo", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Paris", label: "Paris", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Prague", label: "Prague", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Rome", label: "Rome", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Sofia", label: "Sofia", offset: "GMT+2", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Vienna", label: "Vienna", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw", offset: "GMT+1", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich", offset: "GMT+1", region: "Europe" },
  
  // Pacific
  { value: "Pacific/Auckland", label: "Auckland", offset: "GMT+12", region: "Pacific" },
  { value: "Pacific/Fiji", label: "Fiji", offset: "GMT+12", region: "Pacific" },
  { value: "Pacific/Guam", label: "Guam", offset: "GMT+10", region: "Pacific" },
  { value: "Pacific/Honolulu", label: "Honolulu", offset: "GMT-10", region: "Pacific" },
  { value: "Pacific/Pago_Pago", label: "Pago Pago", offset: "GMT-11", region: "Pacific" },
  { value: "Pacific/Port_Moresby", label: "Port Moresby", offset: "GMT+10", region: "Pacific" },
  { value: "Pacific/Tahiti", label: "Tahiti", offset: "GMT-10", region: "Pacific" },
  
  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "GMT+0", region: "UTC" },
];

// Comprehensive list of ISO 4217 currencies
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  // Major currencies
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  
  // Middle East
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع." },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  
  // Asia
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "Rs" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  
  // Europe (non-Euro)
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "ISK", name: "Icelandic Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин." },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  
  // Africa
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م." },
  { code: "MUR", name: "Mauritian Rupee", symbol: "Rs" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
  
  // Americas
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs." },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "CRC", name: "Costa Rican Colon", symbol: "₡" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$" },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q" },
  { code: "HNL", name: "Honduran Lempira", symbol: "L" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "NIO", name: "Nicaraguan Cordoba", symbol: "C$" },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/." },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
  { code: "PYG", name: "Paraguayan Guarani", symbol: "₲" },
  { code: "TTD", name: "Trinidad Dollar", symbol: "TT$" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U" },
  { code: "VES", name: "Venezuelan Bolivar", symbol: "Bs.S" },
  
  // Oceania
  { code: "FJD", name: "Fijian Dollar", symbol: "FJ$" },
  { code: "PGK", name: "Papua New Guinean Kina", symbol: "K" },
  { code: "XPF", name: "CFP Franc", symbol: "₣" },
  
  // Other
  { code: "AFN", name: "Afghan Afghani", symbol: "؋" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾" },
  { code: "IRR", name: "Iranian Rial", symbol: "﷼" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "KGS", name: "Kyrgyzstani Som", symbol: "лв" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل" },
  { code: "MNT", name: "Mongolian Tugrik", symbol: "₮" },
  { code: "SYP", name: "Syrian Pound", symbol: "£" },
  { code: "UZS", name: "Uzbekistani Som", symbol: "лв" },
];

// Helper to get timezone regions for grouping
export const TIMEZONE_REGIONS = [...new Set(TIMEZONES.map(tz => tz.region))];

// Date format options
export const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (Europe)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (Germany)" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "YYYY/MM/DD", label: "YYYY/MM/DD (Japan)" },
];

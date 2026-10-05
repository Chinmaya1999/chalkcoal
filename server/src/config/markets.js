// Where we sell and in what currency. Prices are authored in GBP (designed in London) and converted.
export const CURRENCIES = {
  GBP: { symbol: '£', name: 'British pound', locale: 'en-GB', freeOver: 120, flat: 8, step: 1 },
  USD: { symbol: '$', name: 'US dollar', locale: 'en-US', freeOver: 150, flat: 12, step: 1 },
  EUR: { symbol: '€', name: 'Euro', locale: 'en-IE', freeOver: 140, flat: 10, step: 1 },
  AED: { symbol: 'AED', name: 'UAE dirham', locale: 'en-AE', freeOver: 550, flat: 35, step: 5 },
};

// Placeholder rates per £1 — edit them in Admin → Site content.
export const DEFAULT_RATES = { GBP: 1, USD: 1.27, EUR: 1.17, AED: 4.66 };

const eu = ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland'];

export const COUNTRIES = [
  { name: 'United Kingdom', currency: 'GBP' },
  ...eu.map((name) => ({ name, currency: 'EUR' })),
  { name: 'United States', currency: 'USD' },
  { name: 'United Arab Emirates', currency: 'AED' },
];
export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

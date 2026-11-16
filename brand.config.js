/*
 * ==========================================================================
 *  BRAND CONFIG  -  the single place to white-label the portal
 * ==========================================================================
 *  Edit the values below and refresh the page. No rebuild is needed.
 *
 *  - name / shortName ........ shown everywhere ("Your Hotel" in the UI text)
 *  - initials ................ logo monogram (1-3 letters)
 *  - logo .................... optional image path (e.g. 'assets/logo.svg').
 *                              Leave null to use the monogram.
 *  - manager ................. logged-in demo user (name, role, initials)
 *  - contact ................. address, GSTIN/tax id and e-mail on invoices
 *  - accent .................. brand colour (hex) for light and dark mode
 *  - images .................. hero / background photos (paths or URLs)
 * ==========================================================================
 */
window.BRAND_CONFIG = {
  name: 'Your Hotel',
  shortName: 'Your Hotel',
  initials: 'YH',
  logo: null,
  tagline: 'Hotel Management Portal',

  manager: {
    name: 'Aarav Mehta',
    firstName: 'Aarav',
    role: 'General Manager',
    initials: 'AM'
  },

  contact: {
    address: '123 Hotel Street, Your City, State 000000',
    gstin: '00AAAAA0000A1Z0',
    email: 'contact@yourhotel.com',
    domain: 'yourhotel.com'
  },

  accent: {
    light: '#0071E3',   // Apple blue
    dark: '#0A84FF'
  },

  images: {
    splash: 'assets/img/pool-resort.jpg',
    login: 'assets/img/hotel-dusk.jpg',
    dashboard: 'assets/img/hotel-exterior.jpg'
  }
};

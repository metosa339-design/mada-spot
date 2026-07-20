import { defineConfig, devices } from '@playwright/test';

// Port paramétrable : le port 3000 est parfois déjà pris par un autre projet
// Next.js (dev server oublié). Lancer avec `PORT=3100 npx playwright test` pour
// booter un serveur mada-spot dédié sans toucher aux autres.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  // `next dev` compile les routes à la demande : plusieurs workers qui tapent
  // des routes non compilées en parallèle affament l'hydratation (JS servi trop
  // tard → soumission native des forms). On sérialise pour un dev server sain.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  /* Lance automatiquement ton serveur Next.js de développement */
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
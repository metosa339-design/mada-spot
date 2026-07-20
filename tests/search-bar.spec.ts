import { test, expect, Page } from '@playwright/test';

/**
 * Barre de recherche du hero (HeroClean) — parcours + régression visuelle.
 *
 * Contexte du bug corrigé : le <form> porte l'animation `hero-fade-rise` dont
 * les keyframes appliquent un `transform` conservé (animation-fill-mode: both).
 * Un `transform` non-nul crée un *stacking context* : le popover de dates
 * (z-40) se retrouvait piégé DANS le form et ne pouvait pas passer au-dessus du
 * bloc de statistiques (« 18 » / « Régions couvertes »), qui est un frère situé
 * plus loin dans le DOM et peint donc par-dessus. Correctif : le form reçoit
 * `relative z-20`, ce qui place l'unité entière (popover compris) au-dessus des
 * stats.
 *
 * Ce test verrouille la correction : les champs du popover doivent être
 * réellement CLIQUABLES (un .click() fait un hit-test → il échoue si un autre
 * élément intercepte le pointeur), puis valide le parcours complet jusqu'aux
 * résultats sans crash.
 */

test.describe.configure({ mode: 'serial' });

test.describe('Barre de recherche hero — popover dates + parcours', () => {
  test.setTimeout(120_000);

  /**
   * Navigue puis laisse React s'hydrater. En `next dev`, `domcontentloaded`
   * précède l'exécution du JS : interagir trop tôt provoque une soumission
   * native du form (rechargement) et le popover ne s'ouvre jamais.
   */
  const gotoHydrated = async (page: Page, path: string) => {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
      // Sous forte charge de compilation dev, networkidle peut ne pas se poser :
      // les retries d'interaction ci-dessous couvrent le cas.
    });
  };

  // Date ISO (YYYY-MM-DD) à N jours d'aujourd'hui — l'input type=date impose ISO.
  const isoInDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  test('Destination « Ambositra » → dates → Rechercher affiche les résultats', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await gotoHydrated(page, '/');

    // 1) DESTINATION
    const destinationInput = page.locator('form input[type="text"]').first();
    await expect(destinationInput, 'Le champ Destination doit exister').toBeVisible({
      timeout: 15_000,
    });
    await destinationInput.click();
    await destinationInput.fill('Ambositra');
    await expect(destinationInput).toHaveValue('Ambositra');

    // 2) DATES — ouvrir le popover. On retente le clic tant que le champ ARRIVÉE
    // n'est pas apparu : couvre le cas où le handler React n'est pas hydraté au
    // 1er clic (le popover ne s'ouvre qu'avec le JS chargé).
    const datesTrigger = page.getByRole('button', { name: /choisir|dates/i }).first();
    const checkIn = page.locator('#hero-checkin');
    const checkOut = page.locator('#hero-checkout');

    await expect(async () => {
      if (!(await checkIn.isVisible().catch(() => false))) {
        await datesTrigger.click();
      }
      await expect(checkIn).toBeVisible();
    }).toPass({ timeout: 20_000 });

    // 3) RÉGRESSION z-index : les champs du popover doivent être cliquables et
    // non recouverts par les stats « 18 / Régions couvertes ». Un .click() fait
    // un hit-test d'actionnabilité → il lève « intercepts pointer events » si le
    // bug d'empilement réapparaît.
    const fakeCheckIn = isoInDays(10);
    const fakeCheckOut = isoInDays(12);

    await checkIn.click();
    await checkIn.fill(fakeCheckIn);
    await expect(checkIn).toHaveValue(fakeCheckIn);

    await checkOut.click();
    await checkOut.fill(fakeCheckOut);
    await expect(checkOut).toHaveValue(fakeCheckOut);

    // 4) VALIDER (bouton orange du popover dates) → le popover se ferme
    const validate = page.getByRole('button', { name: /^(valider|validate)$/i }).first();
    await expect(validate, 'Le bouton « Valider » du popover doit être visible').toBeVisible();
    await validate.click();
    await expect(checkIn, 'Le popover de dates doit se fermer après Valider').toBeHidden({
      timeout: 5_000,
    });

    // 5) RECHERCHER (gros bouton orange submit). Le popover s'est ouvert → la
    // page est hydratée, donc le clic est géré par React (router.push). Le
    // toPass sécurise malgré tout contre un submit natif résiduel.
    const submit = page.locator('form button[type="submit"]').first();
    await expect(submit, 'Le bouton « Rechercher » doit exister').toBeVisible();

    await expect(async () => {
      if (!/\/search\b/.test(page.url())) {
        await submit.click();
      }
      expect(page.url()).toMatch(/\/search\?.*q=Ambositra/i);
    }).toPass({ timeout: 20_000 });

    // 6) La transition a eu lieu et la page /search rend sans crash
    expect(page.url(), 'On doit avoir navigué vers /search').toContain('/search');
    expect(page.url(), 'La destination doit être passée en query').toMatch(/q=Ambositra/i);
    expect(page.url(), 'Les dates saisies doivent être transmises').toMatch(/checkin=/);

    await expect(page.locator('body')).toBeVisible();
    const errorHeading = page.getByRole('heading', {
      name: /erreur|something went wrong|500|unhandled/i,
    });
    await expect(errorHeading, 'Aucune page d\'erreur globale ne doit s\'afficher').toHaveCount(0);

    // Pas d'erreur JS majeure (on ignore les échecs de fonts Google en dev)
    const jsErrors = pageErrors.filter((m) => !/font|turbopack|hydration/i.test(m));
    expect(jsErrors, `Erreurs JS détectées : ${jsErrors.join(' | ')}`).toEqual([]);
  });
});

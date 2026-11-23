import { test, expect } from '@playwright/test';

test('1. presenta la identidad y el mensaje de Barrio Vivo', async ({ page }) => {
  await page.goto('/'); await expect(page).toHaveTitle(/Barrio Vivo/); await expect(page.getByRole('heading', { name: /El cambio empieza/ })).toBeVisible();
});
test('2. muestra las acciones existentes en el muro', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Buenas ideas se contagian.' })).toBeVisible(); await expect(page.locator('.activity-card').first()).toBeVisible({ timeout: 10000 });
});
test('3. filtra el muro por categoría', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Movilidad', exact: true }).click(); await expect(page.locator('.activity-card')).toHaveCount(0); await expect(page.locator('.empty-state')).toContainText('Todavía no hay acciones');
});
test('4. publica una acción y aparece en el muro', async ({ page }) => {
  const title = `Bici comunitaria ${Date.now()}`; await page.goto('/'); await page.getByLabel('¿Qué hiciste?').fill(title); await page.getByLabel('Tu nombre').fill('Alex'); await page.getByLabel('Tipo de acción').selectOption('Movilidad'); await page.getByLabel('Cuéntanos un poquito más').fill('Compartimos bicicletas para recorrer el barrio.'); await page.getByRole('button', { name: 'Compartir acción' }).click(); await expect(page.getByRole('status')).toContainText('¡Gracias'); await expect(page.getByRole('heading', { name: title })).toBeVisible();
});
test('5. valida los campos requeridos antes de publicar', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Compartir acción' }).click(); await expect(page.getByLabel('¿Qué hiciste?')).toHaveJSProperty('validity.valid', false);
});
test('6. actualiza el total de acciones al publicar', async ({ page }) => {
  await page.goto('/'); const before = Number(await page.locator('.metric').nth(1).locator('strong').textContent()); await page.getByLabel('¿Qué hiciste?').fill(`Lectura en la plaza ${Date.now()}`); await page.getByLabel('Tu nombre').fill('Sam'); await page.getByLabel('Tipo de acción').selectOption('Educación'); await page.getByLabel('Cuéntanos un poquito más').fill('Compartimos libros y cuentos con las familias.'); await page.getByRole('button', { name: 'Compartir acción' }).click(); await expect(page.getByRole('status')).toBeVisible(); await expect(page.locator('.metric').nth(1).locator('strong')).toHaveText(String(before + 1));
});

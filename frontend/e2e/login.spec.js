import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Login — fluxo público crítico', () => {
  test('renderiza acesso com campos identificáveis', async ({ page }) => {
    await page.goto('/login');

    await expect(
      page.getByRole('heading', { name: 'Entrar no Cinesia' }),
    ).toBeVisible();

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Continuar com Google' }),
    ).toBeVisible();
  });

  test('alterna para cadastro sem perder labels', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(
      page.getByRole('heading', { name: 'Criar sua conta' }),
    ).toBeVisible();
    await expect(page.getByLabel('Nome')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
  });

  test('não apresenta violações sérias ou críticas de acessibilidade', async ({ page }) => {
    await page.goto('/login');

    const results = await new AxeBuilder({ page }).analyze();

    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact),
    );

    expect(blocking).toEqual([]);
  });

  test('não cria rolagem horizontal em viewport móvel', async ({ page }) => {
    await page.goto('/login');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(overflow).toBe(false);
  });
});

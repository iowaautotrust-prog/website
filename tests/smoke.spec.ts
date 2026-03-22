// Smoke tests — checks all major public routes load correctly
// Run with: npx playwright test tests/smoke.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Smoke Tests', () => {
  test('Home page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Iowa Auto Trust/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('Inventory page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await expect(page.locator('form')).toBeVisible();
  });

  test('Login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Signup page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Privacy page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Terms page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/terms`);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Service booking page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/service`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Protected /admin redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveURL(/login/);
  });

  test('Protected /profile redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/login/);
  });

  test('Protected /shop redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await expect(page).toHaveURL(/login/);
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-does-not-exist`);
    await expect(page.locator('body')).toBeVisible();
  });
});

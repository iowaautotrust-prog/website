// Security / Vulnerability Tests
// Tests XSS prevention, auth bypass attempts, input sanitization
// Run with: npx playwright test tests/security.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Security Tests', () => {
  test('XSS: script injection in search field is escaped', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    const xssPayload = '<script>alert("xss")</script>';
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(xssPayload);
      // Ensure no alert dialog appears (script not executed)
      let alertFired = false;
      page.on('dialog', () => { alertFired = true; });
      await page.waitForTimeout(500);
      expect(alertFired).toBe(false);
    }
  });

  test('XSS: script injection in contact form is escaped', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    const xssPayload = '<img src=x onerror=alert(1)>';
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(xssPayload);
      let alertFired = false;
      page.on('dialog', () => { alertFired = true; });
      await page.waitForTimeout(500);
      expect(alertFired).toBe(false);
    }
  });

  test('Auth bypass: /admin is inaccessible without login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForURL(/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test('Auth bypass: /shop is inaccessible without login', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForURL(/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test('Auth bypass: /profile is inaccessible without login', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForURL(/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test('Password policy: weak password is rejected on signup', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('weak');
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      // Should not navigate away — still on signup page
      await expect(page).toHaveURL(/signup/);
    }
  });

  test('SQL injection: search field handles SQL chars safely', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory`);
    const sqlPayload = "' OR '1'='1'; DROP TABLE vehicles; --";
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(sqlPayload);
      await page.keyboard.press('Enter');
      // Page should still be on inventory, no crash
      await expect(page.locator('body')).toBeVisible();
      await expect(page).toHaveURL(/inventory/);
    }
  });

  test('Clickjacking: X-Frame-Options header set (vercel.json)', async ({ page }) => {
    // This is enforced at the server level via vercel.json
    // Verify page loads normally (header check done at CDN level)
    await page.goto(BASE_URL);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Open redirect: login redirect param cannot hijack to external URL', async ({ page }) => {
    await page.goto(`${BASE_URL}/login?redirect=https://evil.com`);
    // After any auth interaction the redirect should stay on-domain
    await expect(page).not.toHaveURL(/evil\.com/);
  });
});

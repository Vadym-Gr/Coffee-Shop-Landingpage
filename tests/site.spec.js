import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 375, 767, 768, 1024, 1366, 1440, 1920]) {
  test('layout and assets at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(response.url());
    });
    await page.goto('./');
    await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(img => {
        img.loading = 'eager';
      });
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map(img => img.decode()));
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await expect(page.locator('h1')).toHaveText('Coffee');
    expect(
      await page
        .locator('img')
        .evaluateAll(images => images.every(img => img.naturalWidth > 0))
    ).toBe(true);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible({
      visible: width < 1440,
    });
    expect(errors).toEqual([]);
    if ([320, 768, 1440].includes(width)) {
      await page.screenshot({
        path: 'test-results/site-' + width + '.png',
        fullPage: true,
      });
    }
  });
}

test('order dialog validates, selects coffee, traps focus and restores focus', async ({
  page,
}) => {
  await page.goto('./');
  const trigger = page.getByRole('button', {
    name: 'Order Macchiato',
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Your next coffee break' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#coffee-choice')).toHaveValue('Macchiato');
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Preview request' })
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Close order form' })
  ).toBeFocused();
  await page.getByRole('button', { name: 'Preview request' }).click();
  await expect(page.locator('#order-status')).toBeEmpty();
  await page.getByLabel('Your name').fill('  ');
  await dialog
    .getByLabel('Email address', { exact: true })
    .fill('guest@example.com');
  await page.getByRole('button', { name: 'Preview request' }).click();
  await expect(page.locator('#order-status')).toBeEmpty();
  await page.getByLabel('Your name').fill('Coffee Guest');
  await page.getByRole('button', { name: 'Preview request' }).click();
  await expect(page.locator('#order-status')).toContainText(
    'no order has been placed'
  );
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('#order-backdrop').click({ position: { x: 2, y: 2 } });
  await expect(dialog).not.toBeVisible();
});

test('mobile menu navigation, focus, modal handoff and resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('./');
  const toggle = page.getByRole('button', { name: 'Open menu' });
  await toggle.click();
  const menu = page.getByRole('dialog', { name: 'Bean Scene' });
  await expect(menu).toBeVisible();
  await expect(page.locator('body')).toHaveClass('scroll-locked');
  await menu.getByRole('link', { name: 'Menu', exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(page).toHaveURL(/#menu$/);
  await page.evaluate(() => scrollTo(0, 0));
  await toggle.click();
  await menu.getByRole('button', { name: 'Order Now' }).click();
  await expect(menu).not.toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Your next coffee break' })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(menu).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveClass('scroll-locked');
});

test('subscription is validated and remains a local demo; carousel wraps', async ({
  page,
}) => {
  await page.goto('./');
  const requests = [];
  page.on('request', request => {
    if (request.method() !== 'GET') requests.push(request.url());
  });
  await page.locator('#subscriber-email').fill('invalid');
  await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(page.locator('#subscribe-status')).toBeEmpty();
  await page.locator('#subscriber-email').fill('guest@example.com');
  await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await expect(page.locator('#subscribe-status')).toContainText(
    'you have not been subscribed'
  );
  await page.getByRole('button', { name: 'Previous review' }).click();
  await expect(page.locator('#review-position')).toHaveText('3 of 3');
  await page.getByRole('button', { name: 'Next review' }).click();
  await expect(page.locator('#review-position')).toHaveText('1 of 3');
  expect(requests).toEqual([]);
});

test('WCAG accessibility on page, order form and mobile menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations
  ).toEqual([]);
  await page
    .getByRole('button', { name: 'Order Cappuccino', exact: true })
    .click();
  await expect(page.locator('#order-backdrop')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/order-dialog.png' });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('#mobile-menu')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/mobile-menu.png' });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations
  ).toEqual([]);
});

test('retina assets and reduced motion', async ({ browser }) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/Coffee-Shop-Landingpage/');
  expect(
    await page
      .locator('.hero')
      .evaluate(el => getComputedStyle(el).backgroundImage)
  ).toContain('hero@2x');
  await page.locator('.coffee-card__image').first().scrollIntoViewIfNeeded();
  expect(
    await page
      .locator('.coffee-card__image')
      .first()
      .evaluate(img => img.currentSrc)
  ).toContain('@2x');
  expect(
    await page
      .locator('html')
      .evaluate(el => getComputedStyle(el).scrollBehavior)
  ).toBe('auto');
  await context.close();
});

import { test, expect } from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#dashboard')).toBeVisible();
});
test('navigation and accessible demo mode', async ({page}) => {
  await expect(page.locator('#modeBadge')).toContainText('Demo');
  for (const name of ['Organisations','Match explorer','Proposals','My organisation','About & privacy']) {
    await page.getByRole('button',{name}).click();
    await expect(page.locator('.view.active')).toBeVisible();
  }
});
test('matching is explainable and not marketed as verified AI', async ({page}) => {
  await page.getByRole('button',{name:'Match explorer'}).click();
  await expect(page.locator('#matchingGrid')).toContainText('Illustrative');
  await expect(page.locator('#matchingGrid')).toContainText('Why?');
});
test('responsive mobile menu and no horizontal overflow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#menu')).toBeVisible();
  await page.locator('#menu').click();
  await expect(page.locator('#sidebar')).toHaveClass(/open/);
  await page.getByRole('button',{name:'Organisations'}).click();
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  const over=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  expect(over).toBe(false);
});
test('role-specific proposal workflow in demo mode', async ({page}) => {
  await page.locator('#demoRole').selectOption('sponsor');
  await page.getByRole('button',{name:'Proposals'}).click();
  await page.locator('#addProposal').click();
  await expect(page.locator('#proposalDialog')).toBeVisible();
  await page.locator('#proposalAmount').fill('500');
  await page.locator('#proposalMessage').fill('This is a fictional sponsorship support proposal.');
  await page.locator('#proposalForm button[value="submitted"]').click();
  await expect(page.locator('#proposalDialog')).not.toBeVisible();
  await page.locator('#demoRole').selectOption('club');
  await expect(page.locator('#proposalList [data-pstatus$="|accepted"]').first()).toBeVisible();
});
test('new organisation requires verification', async ({page}) => {
  await page.locator('#demoRole').selectOption('club');
  await page.getByRole('button',{name:'Organisations'}).click();
  await page.locator('#addOrg').click();
  await page.locator('#orgName').fill('Test Community Initiative');
  await page.locator('#orgCity').fill('Leicester');
  await page.locator('#orgBudget').fill('2000');
  await page.locator('#orgDescription').fill('A fictional community project for testing.');
  await page.locator('#orgForm button[type=submit]').click();
  await expect(page.locator('#myOrg')).toContainText('Test Community Initiative');
  await expect(page.locator('#myOrg')).toContainText('pending');
  await page.locator('#demoRole').selectOption('admin');
  await page.getByRole('button',{name:'Verification'}).click();
  await expect(page.locator('#verificationList')).toContainText('Test Community Initiative');
});
test('data reset restores fictional sample records', async ({page}) => {
  await page.getByRole('button',{name:'About & privacy'}).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#resetDemo').click();
  await page.getByRole('button',{name:'Organisations'}).click();
  await expect(page.locator('#directoryGrid')).toContainText('Sheffield Youth FC');
});

test('campaign studio generates a local copyable brief',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Campaign studio'}).click();
  await page.locator('#campaignTitle').fill('Community Sports Day');
  await page.locator('#campaignCommunity').fill('Test Football Club');
  await page.locator('#campaignBrand').fill('Partner Business Ltd');
  await page.locator('#campaignGenerate').click();
  await expect(page.locator('#campaignOutput')).toContainText('Community Sports Day');
  await expect(page.locator('#campaignOutput')).toContainText('REVIEW CHECKLIST');
});

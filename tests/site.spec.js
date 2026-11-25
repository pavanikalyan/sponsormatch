import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.goto('/');
 await expect(page.locator('#dashboard')).toBeVisible();
});

test('default Club view has only club actions and no removed elements',async({page})=>{
 await expect(page.locator('#demoRole')).toHaveValue('club');
 await expect(page.locator('#demoRole option[value="visitor"]')).toHaveCount(0);
 await expect(page.locator('#authOpen')).toBeVisible();
 await expect(page.locator('#registerOpen')).toBeVisible();
 await expect(page.locator('#modeNotice')).toHaveCount(0);
 await expect(page.locator('#studio')).toHaveCount(0);
 await expect(page.locator('#nav [data-page="verification"]')).toBeHidden();
 await expect(page.locator('#nav [data-page="profile"]')).toBeVisible();
 await expect(page.locator('#roleHeroTitle')).toContainText('sponsors');
 await page.locator('#nav [data-page="directory"]').click();
 await expect(page.locator('#directoryGrid')).toContainText('Peak Coffee Co.');
 await expect(page.locator('#directoryGrid')).not.toContainText('Sheffield Youth FC');
 await page.locator('#nav [data-page="proposals"]').click();
 await expect(page.locator('#addProposal')).toBeDisabled();
});

test('Sponsor view shows community clubs and creates proposals',async({page})=>{
 await page.locator('#demoRole').selectOption('sponsor');
 await expect(page.locator('#roleHeroTitle')).toContainText('communities');
 await expect(page.locator('#nav [data-page="verification"]')).toBeHidden();
 await page.locator('#nav [data-page="directory"]').click();
 await expect(page.locator('#directoryGrid')).toContainText('Sheffield Youth FC');
 await expect(page.locator('#directoryGrid')).not.toContainText('Peak Coffee Co.');
 await page.locator('#nav [data-page="matching"]').click();
 await expect(page.locator('#matchingGrid')).toContainText('Why this match?');
 await expect(page.locator('#matchingGrid')).toContainText('Create proposal');
 await page.locator('#nav [data-page="proposals"]').click();
 await page.locator('#addProposal').click();
 await expect(page.locator('#proposalDialog')).toBeVisible();
 await page.locator('#proposalAmount').fill('500');
 await page.locator('#proposalMessage').fill('Our fictional sponsorship support for this club.');
 await page.locator('#proposalForm button[value="submitted"]').click();
 await expect(page.locator('#proposalDialog')).not.toBeVisible();
 await expect(page.locator('#proposalList')).toContainText('Our fictional sponsorship');
 await page.locator('#demoRole').selectOption('club');
 await page.locator('#nav [data-page="proposals"]').click();
 await expect(page.locator('#proposalList')).toContainText('Our fictional sponsorship');
 await expect(page.locator('#proposalList [data-pstatus$="|accepted"]').first()).toBeVisible();
});

test('Admin can verify applications but cannot create proposals or organisation profiles',async({page})=>{
 await page.locator('#demoRole').selectOption('club');
 await page.locator('#nav [data-page="profile"]').click();
 await page.locator('#profileAddOrg').click();
 await page.locator('#orgName').fill('Test Community Initiative');
 await page.locator('#orgCity').fill('Leicester');
 await page.locator('#orgBudget').fill('2000');
 await page.locator('#orgDescription').fill('A fictional community project for testing.');
 await page.locator('#orgForm button[type=submit]').click();
 await expect(page.locator('#myOrg')).toContainText('Test Community Initiative');
 await expect(page.locator('#myOrg')).toContainText('pending');
 await page.locator('#demoRole').selectOption('admin');
 await expect(page.locator('#nav [data-page="verification"]')).toBeVisible();
 await expect(page.locator('#nav [data-page="matching"]')).toBeHidden();
 await expect(page.locator('#nav [data-page="profile"]')).toBeHidden();
 await page.locator('#nav [data-page="directory"]').click();
 await expect(page.locator('#addOrg')).toBeHidden();
 await page.locator('#nav [data-page="proposals"]').click();
 await expect(page.locator('#addProposal')).toBeDisabled();
 await page.locator('#nav [data-page="verification"]').click();
 await expect(page.locator('#verificationList')).toContainText('Test Community Initiative');
 await page.locator('#verificationList [data-verify$="|approved"]').first().click();
 await expect(page.locator('#verificationList')).not.toContainText('Test Community Initiative');
});

test('matching is explainable for both roles',async({page})=>{
 for (const role of ['club','sponsor']){
  await page.locator('#demoRole').selectOption(role);
  await page.locator('#nav [data-page="matching"]').click();
  await expect(page.locator('#matchingGrid')).toContainText('not a prediction');
 }
});

test('mobile navigation has no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.locator('#menu').click();
 await expect(page.locator('#sidebar')).toHaveClass(/open/);
 await page.locator('#nav [data-page="directory"]').click();
 await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)).toBe(false);
});

test('data reset restores sample records',async({page})=>{
 await page.locator('#nav [data-page="help"]').click();
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#resetDemo').click();
 await page.locator('#nav [data-page="directory"]').click();
 await expect(page.locator('#directoryGrid')).toContainText('Peak Coffee Co.');
});

test('direct URL hash does not reveal admin-only screen to Club',async({page})=>{
 await page.goto('/#verification');
 await expect(page.locator('#dashboard')).toBeVisible();
 await expect(page.locator('#verification')).toBeHidden();
});


test('Log in opens a dedicated page with safe backend notice',async({page})=>{
 await page.locator('#authOpen').click();
 await expect(page).toHaveURL(/\/login\.html$/);
 await expect(page.getByRole('heading',{name:'Log in to SponsorMatch'})).toBeVisible();
 await expect(page.locator('#backendMessage')).toBeVisible();
 await expect(page.locator('#email')).toBeDisabled();
 await expect(page.locator('#password')).toBeDisabled();
 await expect(page.locator('#authPageSubmit')).toBeDisabled();
 await page.getByRole('link',{name:'Back to home'}).click();
 await expect(page.locator('#dashboard')).toBeVisible();
});
test('Register opens separate Club and Sponsor registration page',async({page})=>{
 await page.locator('#registerOpen').click();
 await expect(page).toHaveURL(/\/register\.html$/);
 await expect(page.getByRole('heading',{name:'Create your account'})).toBeVisible();
 await expect(page.locator('#accountRole option')).toHaveCount(2);
 await expect(page.locator('#accountRole option[value="club"]')).toHaveCount(1);
 await expect(page.locator('#accountRole option[value="sponsor"]')).toHaveCount(1);
 await expect(page.locator('#accountRole option[value="admin"]')).toHaveCount(0);
 await expect(page.locator('#backendMessage')).toBeVisible();
 await page.getByRole('link',{name:'Log in'}).last().click();
 await expect(page).toHaveURL(/\/login\.html$/);
});
test('post-auth URLs show appropriate home notifications and clear query flags',async({page})=>{
 await page.goto('/?auth=registered');
 await expect(page.locator('#toast')).toContainText('Check your email');
 await expect(page).toHaveURL(/\/#dashboard$/);
 await page.goto('/?auth=login');
 await expect(page.locator('#toast')).toContainText('Logged in successfully');
 await expect(page).toHaveURL(/\/#dashboard$/);
});

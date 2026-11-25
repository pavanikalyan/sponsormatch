import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for(const section of ['dashboard','directory','matching','proposals','help']){
  test('WCAG AA audit: '+section,async({page})=>{
    await page.goto('/home.html');
    if(section!=='dashboard')await page.locator('#nav [data-page="'+section+'"]').click();
    const results=await new AxeBuilder({page})
      .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])
      .analyze();
    expect(results.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  });
}

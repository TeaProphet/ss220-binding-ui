import {test,expect} from '@playwright/test';

test('character gets common and role-specific bindings',async({page})=>{
 const name=`Борис Тестов ${Date.now()}`;
 await page.goto('/');
 await page.getByRole('button',{name:'Добавить персонажа'}).click();
 await page.getByLabel('Имя персонажа').fill(name);
 await page.getByText('Унатх',{exact:true}).click();
 await page.getByRole('button',{name:'Создать персонажа'}).click();
 await expect(page.getByRole('heading',{name})).toBeVisible();

 await page.getByRole('button',{name:/Добавить (первый )?бинд/}).first().click();
 await page.getByText('Переназначить системный бинд',{exact:true}).click();
 await page.getByLabel('Действие').fill('MoveUp');
 await page.getByRole('button',{name:'Записать сочетание'}).click();
 await page.keyboard.press('Control+KeyW');
 await expect(page.getByRole('dialog').locator('kbd')).toHaveText(['Ctrl','W']);
 await page.getByRole('button',{name:'Сохранить бинд'}).click();
 await expect(page.getByText('Двигаться вперёд').first()).toBeVisible();
 await page.getByRole('button',{name:'Сохранить профиль'}).click();
 await expect(page.getByRole('status')).toContainText('Общие бинды');

 await page.getByRole('button',{name:'Добавить должность'}).click();
 await page.getByRole('button',{name:/Инженерный отдел/}).click();
 await page.getByText('Инженер',{exact:true}).click();
 await page.getByRole('button',{name:'Добавить должность'}).last().click();
 await expect(page.locator('.window-title')).toContainText('Инженер');
 await page.getByRole('button',{name:/Добавить (первый )?бинд/}).first().click();
 await page.getByText('Переназначить системный бинд',{exact:true}).click();
 await page.getByLabel('Действие').fill('Drop');
 await page.getByRole('button',{name:'Записать сочетание'}).click();
 await page.keyboard.press('KeyG');
 await page.getByRole('button',{name:'Сохранить бинд'}).click();
 await page.getByRole('button',{name:'Сохранить профиль'}).click();
 await page.getByRole('button',{name:'Применить в игре'}).click();
 await expect(page.getByRole('status')).toContainText('Инженер');

 await page.setViewportSize({width:1440,height:1000});
 const dockCenter=await page.evaluate(()=>{const dock=document.querySelector('.action-dock').getBoundingClientRect(),sidebar=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar'));return {actual:dock.left+dock.width/2,expected:sidebar+(innerWidth-sidebar)/2}});
 expect(Math.abs(dockCenter.actual-dockCenter.expected)).toBeLessThan(1);
 await page.screenshot({path:'test-results/editor-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(250);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/editor-mobile.png',fullPage:true});
});

test('binding editor starts with a chat and emote form',async({page})=>{
 const name=`Мария Тестова ${Date.now()}`;
 await page.goto('/');
 await page.getByRole('button',{name:'Добавить персонажа'}).click();
 await page.getByLabel('Имя персонажа').fill(name);
 await page.getByRole('button',{name:'Создать персонажа'}).click();
 await page.getByRole('button',{name:/Добавить (первый )?бинд/}).first().click();
 await expect(page.getByLabel('Переназначить системный бинд')).not.toBeChecked();
 await page.getByLabel('Что сделать').selectOption('me');
 await page.getByLabel('Текст').fill('машет рукой.');
 await page.getByRole('button',{name:'Записать сочетание'}).click();
 await page.keyboard.press('Control+KeyM');
 await page.getByRole('button',{name:'Сохранить бинд'}).click();
 await expect(page.getByText('me машет рукой.').first()).toBeVisible();
});

test('global bindings persist and are inherited by a character',async({page})=>{
 const phrase=`Общий сигнал ${Date.now()}`;
 await page.goto('/');
 await page.locator('.global-nav').click();
 await expect(page.getByRole('heading',{name:'Для всех персонажей'})).toBeVisible();
 await page.getByRole('button',{name:/Добавить (первый )?бинд/}).first().click();
 await page.getByLabel('Что сделать').selectOption('say');
 await page.getByLabel('Текст').fill(phrase);
 await page.getByRole('button',{name:'Записать сочетание'}).click();
 await page.keyboard.press('Control+Alt+KeyH');
 await page.getByRole('button',{name:'Сохранить бинд'}).click();
 await page.getByRole('button',{name:'Сохранить общие бинды'}).click();
 await expect(page.getByRole('status')).toContainText('для всех персонажей сохранены');
 const characterButton=page.locator('.character-nav>button:not(.global-nav)').first();
 if(await characterButton.count()){
  await characterButton.click();
  await page.getByRole('button',{name:'Применить в игре'}).click();
  await expect(page.getByRole('status')).toContainText('В игру записаны');
  const applied=await page.evaluate(async()=>await (await fetch('/api/bindings')).json());
  expect(applied.config.binds.some(bind=>bind.function===`say ${phrase}`)).toBe(true);
 }
 await page.reload();
 await page.locator('.global-nav').click();
 await expect(page.getByText(`say ${phrase}`).first()).toBeVisible();
});

test('applying from global view excludes the previously selected character',async({page})=>{
 const stamp=Date.now(),name=`Глобальный тест ${stamp}`,personal=`Личное ${stamp}`,shared=`Общее ${stamp}`;
 await page.goto('/');
 await page.getByRole('button',{name:'Добавить персонажа'}).click();
 await page.getByLabel('Имя персонажа').fill(name);
 await page.getByRole('button',{name:'Создать персонажа'}).click();
 await page.getByRole('button',{name:/Добавить (первый )?бинд/}).first().click();
 await page.getByLabel('Что сделать').selectOption('say');
 await page.getByLabel('Текст').fill(personal);
 await page.getByRole('button',{name:'Записать сочетание'}).click();
 await page.keyboard.press('KeyJ');
 await page.getByRole('button',{name:'Сохранить бинд'}).click();
 await page.getByRole('button',{name:'Сохранить профиль'}).click();
 await page.locator('.global-nav').click();
 await page.getByRole('button',{name:/Добавить (первый )?бинд/}).first().click();
 await page.getByLabel('Что сделать').selectOption('say');
 await page.getByLabel('Текст').fill(shared);
 await page.getByRole('button',{name:'Записать сочетание'}).click();
 await page.keyboard.press('KeyK');
 await page.getByRole('button',{name:'Сохранить бинд'}).click();
 let applied;
 await page.route('**/api/bindings',async route=>{
  if(route.request().method()!=='POST')return route.continue();
  applied=route.request().postDataJSON().config;
  await route.fulfill({status:200,contentType:'application/json',body:'{"revision":"test","exists":true}'});
 });
 await page.getByRole('button',{name:'Применить в игре'}).click();
 await expect(page.getByRole('status')).toContainText('В игру записаны общие бинды для всех персонажей.');
 expect(applied.binds.some(bind=>bind.function===`say ${shared}`)).toBe(true);
 expect(applied.binds.some(bind=>bind.function===`say ${personal}`)).toBe(false);
});

test('new Walk remap does not copy the default Shift binding',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Для всех/}).click();
 await page.getByRole('button',{name:/Добавить (первый )?бинд/}).first().click();
 await page.getByText('Переназначить системный бинд',{exact:true}).click();
 await page.getByLabel('Действие').fill('Walk');
 await page.getByRole('button',{name:'Записать сочетание'}).click();
 await page.keyboard.press('CapsLock');
 await page.getByRole('button',{name:'Сохранить бинд'}).click();
 const walkRows=page.locator('.binding-row').filter({hasText:'Walk'});
 await expect(walkRows).toHaveCount(1);
 await expect(walkRows).toContainText('CapsLock');
 await expect(walkRows).not.toContainText('Shift');
});

test('system bindings stay in a separate read-only menu',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Системные бинды/}).click();
 await expect(page.getByRole('heading',{name:'Системные бинды'})).toBeVisible();
 await page.getByPlaceholder('Найти системное действие…').fill('MoveUp');
 await expect(page.getByText('Двигаться вперёд')).toBeVisible();
 await expect(page.getByRole('button',{name:/Добавить бинд/})).toHaveCount(0);
});

test('every button exposes a native title',async({page})=>{
 const expectTitles=async()=>expect(await page.locator('button').evaluateAll(buttons=>buttons.every(button=>Boolean(button.title.trim())))).toBe(true);
 await page.goto('/');
 await expectTitles();
 await expect(page.getByRole('button',{name:/Системные бинды/})).toHaveAttribute('title','Системные бинды справочник игры');
 await page.getByRole('button',{name:'Добавить персонажа'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expectTitles();
 await page.getByRole('button',{name:'Закрыть'}).click();
 await page.getByRole('button',{name:'Импортировать персонажей'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expectTitles();
});

test('imports SS220 character YAML without overwriting an existing profile',async({page})=>{
 const name=`Ирис Импорт ${Date.now()}`;
 await page.route('**/api/presets/import',route=>route.fulfill({status:200,contentType:'text/html',body:'<!DOCTYPE html><title>SS220 Binding</title>'}));
 await page.goto('/');
 await page.getByRole('button',{name:'Импортировать персонажей'}).click();
 await page.locator('input[type="file"]').setInputFiles({name:'iris.yml',mimeType:'application/x-yaml',buffer:Buffer.from(`forkId: ss220\nversion: 2\nprofile:\n  name: ${name}\n  species: Moth\n`)});
 await expect(page.getByRole('dialog')).toContainText(name);
 await expect(page.getByRole('dialog')).toContainText('Ниан');
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:'test-results/import-desktop.png',fullPage:true});
 await page.getByRole('button',{name:/Импортировать · 1/}).click();
 await expect(page.getByRole('status')).toContainText(`Импортирован персонаж «${name}»`);
 await page.getByRole('button',{name:new RegExp(name)}).click();
 await expect(page.getByRole('heading',{name})).toBeVisible();

 await page.getByRole('button',{name:'Импортировать персонажей'}).click();
 await page.locator('input[type="file"]').setInputFiles({name:'iris.yml',mimeType:'application/x-yaml',buffer:Buffer.from(`version: 2\nprofile:\n  name: ${name}\n  species: Human\n`)});
 await expect(page.getByRole('dialog')).toContainText('Уже добавлен');
 await expect(page.getByRole('dialog').getByRole('button',{name:/Импортировать/})).toBeDisabled();
 await page.getByRole('button',{name:'Закрыть'}).click();
});

test('accepts exported character files by drag and drop',async({page})=>{
 const name=`Дроп Импорт ${Date.now()}`;
 await page.goto('/');
 await page.getByRole('button',{name:'Импортировать персонажей'}).click();
 const picker=page.locator('.import-picker');
 await picker.evaluate((element,characterName)=>{
  const dataTransfer=new DataTransfer();
  dataTransfer.items.add(new File([`version: 2\nprofile:\n  name: ${characterName}\n  species: Diona\n`],'drop-export',{type:'text/plain'}));
  element.dispatchEvent(new DragEvent('dragenter',{bubbles:true,cancelable:true,dataTransfer}));
  element.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer}));
 },name);
 await expect(picker).toHaveClass(/is-dragging/);
 await expect(picker).toContainText('Отпустите файлы здесь');
 await picker.evaluate((element,characterName)=>{
  const dataTransfer=new DataTransfer();
  dataTransfer.items.add(new File([`version: 2\nprofile:\n  name: ${characterName}\n  species: Diona\n`],'drop-export',{type:'text/plain'}));
  element.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer}));
 },name);
 await expect(picker).not.toHaveClass(/is-dragging/);
 await expect(page.getByRole('dialog')).toContainText(name);
 await expect(page.getByRole('dialog')).toContainText('Дионея');
});

test('shutdown control confirms and shows the stopped state',async({page})=>{
 let token='';
 await page.route('**/api/shutdown',async route=>{token=route.request().headers()['x-editor-token'];await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'})});
 await page.goto('/');
 const dialogPromise=page.waitForEvent('dialog'),clickPromise=page.getByRole('button',{name:/Отключить/}).click(),dialog=await dialogPromise;
 expect(dialog.message()).toContain('Отключить SS220 Binding');
 await dialog.accept();
 await clickPromise;
 await expect(page.getByRole('heading',{name:'SS220 Binding отключён'})).toBeVisible();
 expect(token).toBeTruthy();
});

test('API rejects unauthenticated and foreign-origin writes',async({request})=>{
 const response=await request.post('/api/bindings',{data:{config:{version:1,binds:[]}}});
 expect(response.status()).toBe(403);
 const foreign=await request.get('/api/bindings',{headers:{Origin:'https://example.com'}});
 expect(foreign.status()).toBe(403);
 const shutdown=await request.post('/api/shutdown');
 expect(shutdown.status()).toBe(403);
 const global=await request.post('/api/global',{data:{config:{version:1,binds:[],leaveEmpty:[]}}});
 expect(global.status()).toBe(403);
});

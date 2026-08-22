import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('ERR:', error.message));

  await page.goto('http://localhost:3001');
  
  await new Promise(r => setTimeout(r, 2000));

  // Let's manually trigger a progress save in the console
  await page.evaluate(async () => {
    try {
       const progressStore = (await import('/src/core/storage/ProgressStore.ts')).progressStore;
       await progressStore.saveProgress({
          id: 'singleton',
          currentAct: 'Act I',
          currentChamber: 5,
          completedChambers: [1,2,3,4],
          lastPlayedAt: Date.now()
       });
       console.log("SAVE SUCCESS");
       
       const p = await progressStore.getProgress();
       console.log("LOAD SUCCESS:", p.currentChamber);
    } catch(e) {
       console.log("DB ERROR", e);
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();

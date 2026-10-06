const { _electron }=require(process.env.LUMA_PLAYWRIGHT||'playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const workspace=path.resolve('../..'),data=process.env.LUMA_SMOKE_DATA_DIR||path.join(workspace,'work','smoke-centered-scaling');
 const launch=()=>_electron.launch({executablePath:process.env.LUMA_EXECUTABLE||require('electron'),args:process.env.LUMA_EXECUTABLE?['--no-sandbox']:['.','--no-sandbox'],env:{...process.env,LUMA_TEST_MODE:'1',LUMA_DATA_DIR:data},timeout:30000});
 const center=l=>[l.x+l.width*l.scale/2,l.y+l.height*l.scale/2];
 const compareCenter=(layer,expected)=>center(layer).forEach((v,i)=>assert(Math.abs(v-expected[i])<1e-6,`Center moved: ${v} != ${expected[i]}`));
 let app;const errors=[];
 try{
  app=await launch();let page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.getByRole('heading',{name:'Bring a little character.'}).waitFor();const config=await page.evaluate(()=>window.desktop.config());if(config.serverWarning)await page.getByRole('button',{name:'Dismiss error'}).click();
  await page.getByRole('button',{name:'Artwork & rig'}).click();await page.getByRole('button',{name:'Layered rig',exact:true}).click();
  const before=config.active.layers.find(l=>l.id==='head'),expected=center(before);
  const scale=page.getByRole('slider',{name:/^Scale/});
  for(const value of ['1.5','0.6','1.25']){
   await scale.fill(value);await page.waitForFunction(async value=>(await window.desktop.config()).active.layers.find(l=>l.id==='head').scale===value,Number(value));
   const edited=(await page.evaluate(()=>window.desktop.config())).active.layers.find(l=>l.id==='head');compareCenter(edited,expected);assert.equal(edited.pivotX,before.pivotX);assert.equal(edited.pivotY,before.pivotY);
  }
  await page.getByRole('button',{name:'Save changes'}).click();await page.getByRole('button',{name:'Saved',exact:true}).waitFor();
  const nextWindow=app.waitForEvent('window');await app.evaluate(async({BrowserWindow},url)=>{const w=new BrowserWindow({width:1024,height:1024,useContentSize:true,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});await w.loadURL(url);},config.outputUrl);const overlay=await nextWindow;await overlay.setViewportSize({width:1024,height:1024});
  await overlay.waitForFunction(()=>{const c=document.querySelector('canvas');return c.width===1024&&c.height===1024&&c.getContext('2d').getImageData(512,500,1,1).data[3]>0;});
  const pixels=()=>Array.from(document.querySelector('canvas').getContext('2d').getImageData(0,0,1024,1024).data).filter((_,i)=>i%4===3).reduce((sum,a)=>sum+a,0);
  await page.waitForFunction(()=>{const c=document.querySelector('.stage canvas');return c.getContext('2d').getImageData(512,500,1,1).data[3]>0;});
  const studioAlpha=await page.locator('.stage canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,1024,1024).data).filter((_,i)=>i%4===3).reduce((sum,a)=>sum+a,0));await overlay.waitForFunction(expected=>{const a=document.querySelector('canvas').getContext('2d').getImageData(0,0,1024,1024).data;let sum=0;for(let i=3;i<a.length;i+=4)sum+=a[i];return sum===expected;},studioAlpha);assert.equal(await overlay.evaluate(pixels),studioAlpha);assert.equal(await overlay.evaluate(()=>document.querySelector('canvas').getContext('2d').getImageData(0,0,1,1).data[3]),0);
  await overlay.close();await app.close();app=await launch();page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.getByRole('heading',{name:'Bring a little character.'}).waitFor();const loaded=await page.evaluate(()=>window.desktop.config());const head=loaded.active.layers.find(l=>l.id==='head');assert.equal(head.scale,1.25);compareCenter(head,expected);
  await page.getByRole('button',{name:'Artwork & rig'}).click();await page.locator('.toast').waitFor({state:'detached'});await page.screenshot({path:path.join(workspace,'outputs','Luma-centered-scaling.png'),fullPage:true});
  assert.deepEqual(errors,[]);const result={passed:true,checks:['Scale slider grows and shrinks around fixed image center','Custom pivot coordinates unchanged','Profile survives application restart','Studio and OBS pixel output agree','OBS transparency preserved'],center:expected,reloadedScale:head.scale,pageErrors:errors};await fs.writeFile(path.join(workspace,'work','scaling-smoke-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await app?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

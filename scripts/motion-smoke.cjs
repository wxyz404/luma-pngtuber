const { _electron } = require(process.env.SPROUT_PLAYWRIGHT || 'playwright');
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict'), sharp = require('sharp');
const Module = require('node:module');
const compiled = require('esbuild').buildSync({entryPoints:['src/tracking/head-pose.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text;
const poseModule = new Module(__filename, module); poseModule._compile(compiled,__filename);
const { headPose } = poseModule.exports;
function matrix(yaw,pitch) {
  const y=yaw*Math.PI/180,p=pitch*Math.PI/180,c=Math.cos(y),s=Math.sin(y),a=Math.cos(p),b=Math.sin(p);
  return [c,0,-s,0,s*b,a,c*b,0,s*a,-b,c*a,0,0,0,-40,1];
}
(async()=>{
  const workspace=path.resolve('../..'),data=process.env.SPROUT_SMOKE_DATA_DIR||path.join(workspace,'work','smoke-motion-v033');
  const fixtures=path.join(workspace,'work','motion-fixtures');await fs.mkdir(fixtures,{recursive:true});
  for(const facing of ['left','right']) await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect x="470" y="300" width="64" height="80" fill="#c65c32"/><circle cx="512" cy="512" r="12" fill="#f0f0f0"/><circle cx="${facing==='left'?300:724}" cy="512" r="12" fill="#1446e6"/></svg>`)).png().toFile(path.join(fixtures,facing+'.png'));
  const launch=()=>_electron.launch({executablePath:process.env.SPROUT_EXECUTABLE||require('electron'),args:process.env.SPROUT_EXECUTABLE?['--no-sandbox']:['.','--no-sandbox'],env:{...process.env,SPROUT_TEST_MODE:'1',SPROUT_DATA_DIR:data},timeout:30000});
  let app,overlay,page;const errors=[];
  try {
    app=await launch();page=await app.firstWindow();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
    await page.getByRole('heading',{name:'Bring a little character.'}).waitFor();const config=await page.evaluate(()=>window.desktop.config());
    if(config.serverWarning)await page.getByRole('button',{name:'Dismiss error'}).click();
    await page.getByRole('button',{name:'Motion',exact:true}).click();
    await page.getByRole('slider',{name:/^Smoothing/}).fill('0');
    await page.getByRole('switch',{name:'Mirror movement',exact:true}).click();
    const next=app.waitForEvent('window');await app.evaluate(async({BrowserWindow},url)=>{const w=new BrowserWindow({width:1024,height:1024,useContentSize:true,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});await w.loadURL(url);},config.outputUrl);overlay=await next;overlay.setDefaultTimeout(20000);await overlay.setViewportSize({width:1024,height:1024});
    const pixels=async(p,selector)=>p.locator(selector).evaluate(async c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).join(',');});
    const equalPixels=async expected=>overlay.waitForFunction(async expected=>{const c=document.querySelector('canvas'),v=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',v))).join(',')===expected;},expected);
    await page.evaluate(()=>{
      window.__motionSignals={yaw:0,pitch:0,roll:0};
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');let pulse=0;window.__motionTimer=setInterval(()=>{ctx.fillStyle=`rgb(${pulse++%255},80,80)`;ctx.fillRect(0,0,640,480);},33);
      navigator.mediaDevices.getUserMedia=async()=>canvas.captureStream(30);
      window.Worker=class{onmessage=null;terminate(){this.dead=true;}postMessage(data){if(data.type==='init')setTimeout(()=>this.onmessage?.({data:{type:'ready',connections:[]}}),0);if(data.type==='frame'){data.bitmap.close();setTimeout(()=>{if(!this.dead)this.onmessage?.({data:{type:'result',duration:5,frame:{timestamp:data.timestamp,status:'tracked',yaw:0,pitch:0,roll:0,x:0,y:0,mouth:0,smile:0,brow:0,blinkLeft:0,blinkRight:0,...window.__motionSignals}}});},5);}}};
    });
    const importFixture=async(button,facing)=>{await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({filePaths:[file],canceled:false});},path.join(fixtures,facing+'.png'));await page.getByRole('button',{name:button,exact:true}).click();};
    const facingTab=async facing=>page.locator('.facing-tabs').getByRole('button',{name:new RegExp('^'+facing)}).click();
    const setPose=async(yaw,pitch)=>{const angles=headPose(matrix(yaw,pitch));await page.evaluate(angles=>{window.__motionSignals=angles;},angles);};
    const waitNod=async(p,selector,pitch)=>p.waitForFunction(({selector,pitch})=>{
      const c=document.querySelector(selector),v=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let white=0,blue=0,wy=0,by=0;
      for(let i=0;i<v.length;i+=4){if(v[i+3]<240)continue;const y=Math.floor(i/4/c.width);if(v[i]>230&&v[i+1]>230&&v[i+2]>230){white++;wy+=y;}if(v[i]<30&&v[i+1]>60&&v[i+1]<80&&v[i+2]>220){blue++;by+=y;}}
      return white>10&&blue>10&&(by/blue-wy/white)*Math.sign(pitch)>5;
    },{selector,pitch});
    for(const mode of ['simple','layered']){
      console.log('Checking '+mode+' tilt and mirroring');await page.getByRole('button',{name:'Artwork & rig',exact:true}).click();await page.getByRole('button',{name:mode==='simple'?'PNG poses':'Layered rig',exact:true}).click();
      if(mode==='layered')for(const name of ['Body','Eyes','Brows','Mouth'])await page.locator('.layer-row').filter({hasText:new RegExp('^'+name)}).getByTitle('Toggle visibility').click();
      for(const facing of ['Left','Right']){await facingTab(facing);await importFixture(mode==='simple'?'Replace PNG':`Assign ${facing} Resting PNG`,facing.toLowerCase());}
      await page.getByRole('button',{name:'Motion',exact:true}).click();
      if(mode==='simple'){await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/index.html'))?.show());await page.getByRole('button',{name:'Start camera',exact:true}).click();}
      for(const mirrorMovement of [false,true]){
        if(mirrorMovement)await page.getByRole('switch',{name:'Mirror movement',exact:true}).click();
        for(const yaw of [-40,40])for(const pitch of [-20,20]){
          await setPose(yaw,pitch);await waitNod(page,'.stage canvas',pitch);await waitNod(overlay,'canvas',pitch);
          const baseline=await pixels(page,'.stage canvas');await equalPixels(baseline);await page.locator('.stage canvas').evaluate(c=>{window.__baselinePixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;});
          await page.getByRole('switch',{name:'Mirror avatar',exact:true}).click();

          await page.waitForFunction(()=>{const c=document.querySelector('.stage canvas'),v=c.getContext('2d').getImageData(0,0,c.width,c.height).data,expected=window.__baselinePixels;let error=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x++)for(let channel=0;channel<4;channel++)error+=Math.abs(v[(y*1024+x)*4+channel]-expected[(y*1024+1023-x)*4+channel]);return error/v.length<.05;});
          await waitNod(page,'.stage canvas',pitch);await waitNod(overlay,'canvas',pitch);await equalPixels(await pixels(page,'.stage canvas'));
          await page.getByRole('switch',{name:'Mirror avatar',exact:true}).click();
        }
        if(mirrorMovement)await page.getByRole('switch',{name:'Mirror movement',exact:true}).click();
      }
    }
    await page.getByRole('button',{name:'Pause tracking',exact:true}).click();await page.evaluate(()=>clearInterval(window.__motionTimer));
    await page.getByRole('switch',{name:'Mirror avatar',exact:true}).click();await page.getByRole('button',{name:'Save changes'}).click();await page.getByRole('button',{name:'Saved',exact:true}).waitFor();
    const saved=(await page.evaluate(()=>window.desktop.config())).active;assert.equal(saved.settings.mirrorAvatar,true);assert.equal(saved.settings.mirror,false);
    assert.equal(await overlay.evaluate(()=>document.querySelector('canvas').getContext('2d').getImageData(0,0,1,1).data[3]),0);assert.equal(await overlay.locator('video').count(),0);
    // Editing a reflected layer still moves in the dragged screen direction.
    await page.getByRole('button',{name:'Artwork & rig',exact:true}).click();await page.getByText('Edit on canvas',{exact:true}).locator('..').getByRole('switch').click();
    const box=await page.locator('.stage canvas').boundingBox();const original=saved.layers.find(l=>l.id==='head');
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+20,box.y+box.height/2);await page.mouse.up();
    await page.waitForFunction(async expected=>Math.abs((await window.desktop.config()).active.layers.find(l=>l.id==='head').x-expected)<1e-6,original.x-20*1024/box.width);
    await page.keyboard.down('Shift');await page.mouse.click(box.x+box.width*.25,box.y+box.height*.6);await page.keyboard.up('Shift');
    await page.waitForFunction(async()=>{const l=(await window.desktop.config()).active.layers.find(l=>l.id==='head');return Math.abs(l.pivotX-(768-l.x)/(l.width*l.scale))<.005;});
    await page.getByRole('button',{name:'Save changes'}).click();await page.getByRole('button',{name:'Saved',exact:true}).waitFor();const edited=(await page.evaluate(()=>window.desktop.config())).active;
    await overlay.close();overlay=null;await app.close();app=await launch();page=await app.firstWindow();await page.getByRole('heading',{name:'Bring a little character.'}).waitFor();assert.deepEqual((await page.evaluate(()=>window.desktop.config())).active,edited);
    assert.deepEqual(errors,[]);const result={passed:true,version:require('../package.json').version,checks:['Column-major up/down nods in both side states and both rig modes','Both motion-mirror settings preserve nod direction','Avatar flip matches horizontal reflection in studio and OBS','Output remains transparent with no camera feed','Mirrored layer drag and pivot placement','Independent mirror settings and geometry survive restart'],pageErrors:errors};await fs.writeFile(path.join(workspace,'outputs','Sprout-motion-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  } catch(error){console.log((await page.locator('body').innerText()).slice(-1800));console.log(await page.evaluate(()=>({signals:window.__motionSignals})));await page.screenshot({path:path.join(workspace,'outputs','Sprout-motion-debug.png')});throw error;} finally {await app?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

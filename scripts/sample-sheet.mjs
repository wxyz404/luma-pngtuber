import sharp from 'sharp';
import {art} from './sample-art.mjs';
const facings=['left','center','right'];
const states=[['Resting','neutral'],['Talking','neutral.talk'],['Blinking','neutral.blink'],['Smiling','smile'],['Smile + talk','smile.talk'],['Surprised','surprise']];
const legacy={neutral:'neutral','neutral.talk':'talk','neutral.blink':'blink',smile:'smile',surprise:'surprise'};
const key=(facing,state)=>facing==='center'&&legacy[state]?legacy[state]:facing!=='center'&&state==='neutral'?facing:`${facing}-${state.replaceAll('.','-')}`;
let content='<rect width="1440" height="860" fill="#f7f5ef"/><text x="30" y="36" font-family="Segoe UI,Arial" font-size="23" fill="#344642">Sprout · bundled facing states</text>';
for(const [row,facing] of facings.entries())for(const [col,[label,state]] of states.entries()){
const x=col*240,y=60+row*262;
content+=`<rect x="${x+10}" y="${y}" width="220" height="250" rx="12" fill="#e9ede2"/><text x="${x+120}" y="${y+24}" text-anchor="middle" font-family="Segoe UI,Arial" font-size="14" fill="#506c61">${facing[0].toUpperCase()+facing.slice(1)} · ${label}</text><g transform="translate(${x+15} ${y+30}) scale(.205)">${art[key(facing,state)]}</g>`;
}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="860">${content}</svg>`)).png().toFile('../../outputs/Sprout-facing-artwork.png');
let preview='<rect width="900" height="340" fill="#f7f5ef"/>';
for(const [i,facing] of facings.entries())preview+=`<text x="${150+i*300}" y="30" text-anchor="middle" font-family="Segoe UI,Arial" font-size="20" fill="#506c61">${facing[0].toUpperCase()+facing.slice(1)}</text><g transform="translate(${i*300+6} 42) scale(.28)">${art[key(facing,'neutral')]}</g>`;
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="340">${preview}</svg>`)).png().toFile('../../outputs/Sprout-facing-preview.png');

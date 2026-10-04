import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID,createHash } from 'node:crypto';
import { AvatarProfile, assetSchema, profileSchema } from '../src/shared/types';
import { sampleProfile } from '../src/shared/sample';
export class ProfileStore {
  constructor(public root:string,private bundled:string){}
  async init(){await fs.mkdir(path.join(this.root,'profiles'),{recursive:true});await fs.mkdir(path.join(this.root,'assets'),{recursive:true});}
  async list(){const result:AvatarProfile[]=[];for(const name of await fs.readdir(path.join(this.root,'profiles'))){if(!name.endsWith('.json'))continue;try{result.push(profileSchema.parse(JSON.parse(await fs.readFile(path.join(this.root,'profiles',name),'utf8'))));}catch{/* A corrupt file is preserved; valid profiles remain available. */}}return result;}
  async save(value:unknown){const profile=profileSchema.parse(value);if(profile.mode==='simple'&&!profile.poses['center.neutral'])throw new Error('Assign a neutral PNG before saving a simple avatar.');const dest=path.join(this.root,'profiles',`${profile.id}.json`),temp=dest+'.tmp';await fs.writeFile(temp,JSON.stringify(profile,null,2));await fs.rename(temp,dest);return profile;}
  async create(name:string){const p=sampleProfile(randomUUID());p.name=name.slice(0,80)||'New avatar';await this.save(p);return p;}
  async load(id:string){if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error('Invalid avatar identifier.');return profileSchema.parse(JSON.parse(await fs.readFile(path.join(this.root,'profiles',`${id}.json`),'utf8')));}
  assetPath(ref:string){assetSchema.parse(ref);return ref.startsWith('sample/')?path.join(this.bundled,ref):path.join(this.root,ref);}
  async importBytes(bytes:Buffer){if(bytes.length>20*1024*1024||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Use a valid PNG smaller than 20 MB.');const name=createHash('sha256').update(bytes).digest('hex')+'.png';await fs.writeFile(path.join(this.root,'assets',name),bytes);return `assets/${name}`;}
  async preferences(){try{return JSON.parse(await fs.readFile(path.join(this.root,'preferences.json'),'utf8'));}catch{return {};}}
  async setPreferences(prefs:object){const target=path.join(this.root,'preferences.json');await fs.writeFile(target+'.tmp',JSON.stringify(prefs,null,2));await fs.rename(target+'.tmp',target);}
}

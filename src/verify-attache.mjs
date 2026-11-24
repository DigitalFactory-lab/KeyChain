import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createCanvas,Image} from '@napi-rs/canvas';
import {FONT_FILES,parseFont,buildGeometry,svgDocument} from './geometry.js';
// Anneau et motif doivent se fondre dans la silhouette (aucun pont ajouté), et le trou garder une bordure pleine autour de lui.
const cases=[['T','right','flame'],['J','right','flame'],['Lily','right','flame'],['Matt','left','star'],['Digital','right','butterfly'],['Yanis\nKenza','left','heart'],['Noé-Liam','both','star']];
let count=0;
for(const [key,file] of Object.entries(FONT_FILES)){
 const b=fs.readFileSync(file),font=parseFont(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 for(const [text,position,shape] of cases){
  const cfg={text,font:key,material:'black',textColor:'#ffffff',lineGap:2,width:80,border:2.5,hole:4,decorations:[{shape,leftShape:'star',rightShape:'heart',color:'#ff3a30',size:90,gap:1.5,position}]};
  const g=buildGeometry(cfg,font);
  assert.equal(g.bridges,0,`${key} ${JSON.stringify(text)} : pont ajouté`);
  const ratio=20,img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=Buffer.from(svgDocument(g,'uv'));});
  const c=createCanvas(Math.round(g.width*ratio),Math.round(g.height*ratio)),ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);
  const cx=(g.hole.x+g.shift.x)*ratio,cy=(g.hole.y+g.shift.y)*ratio,clear=(g.hole.r+cfg.border*.8)*ratio;
  for(let a=0;a<360;a+=10)for(const f of [.5,1]){const x=Math.round(cx+Math.cos(a*Math.PI/180)*clear*f),y=Math.round(cy+Math.sin(a*Math.PI/180)*clear*f);if(x<0||y<0||x>=c.width||y>=c.height)continue;assert.equal(ctx.getImageData(x,y,1,1).data[3],0,`${key} ${JSON.stringify(text)} : encre trop près du trou`);}
  count++;
 }
}
console.log(`${count} porte-clés vérifiés : anneau et motif soudés à la silhouette sans pont, bordure pleine autour du trou.`);

import {STICKER_MOTIFS} from './sticker-motifs.js';
import opentype from 'opentype.js';
import ClipperLib from 'clipper-lib';
export const FONTS={bagelfatone:{name:'Bagel Fat One',file:'assets/bagelfatone.ttf'},russoone:{name:'Russo One',file:'assets/russoone.ttf'},knewave:{name:'Knewave',file:'assets/knewave.ttf'},sedgwickavedisplay:{name:'Sedgwick Ave',file:'assets/sedgwickavedisplay.ttf'},shrikhand:{name:'Shrikhand',file:'assets/shrikhand.ttf'},bungee:{name:'Bungee',file:'assets/bungee.ttf'},chewy:{name:'Chewy',file:'assets/chewy.ttf'},luckiestguy:{name:'Luckiest Guy',file:'assets/luckiestguy.ttf'}};
export const FONT_FILES=Object.fromEntries(Object.entries(FONTS).map(([key,font])=>[key,font.file]));
export const MATERIALS={white:{name:'Plexi blanc',fill:'#ffffff'},black:{name:'Plexi noir',fill:'#17191c'},wood:{name:'Bois clair',fill:'url(#material-wood)'}};
export const MOTIFS={none:{name:'Aucun',d:''},...STICKER_MOTIFS};
const S=1000;
const toInt=p=>({X:Math.round(p.x*S),Y:Math.round(p.y*S)});
function flatten(commands){let paths=[],p=[],cur={x:0,y:0},start;const add=q=>{p.push(toInt(q));cur=q;};for(const c of commands){if(c.type==='M'){if(p.length>2)paths.push(p);p=[];add({x:c.x,y:c.y});start=cur;}else if(c.type==='L')add({x:c.x,y:c.y});else if(c.type==='C'||c.type==='Q'){const from=cur;const len=Math.hypot(c.x-from.x,c.y-from.y)+Math.hypot(c.x1-from.x,c.y1-from.y)+(c.type==='C'?Math.hypot(c.x2-c.x,c.y2-c.y):0);const n=Math.max(6,Math.ceil(len/.16));for(let i=1;i<=n;i++){let t=i/n,u=1-t;add(c.type==='C'?{x:u*u*u*from.x+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x,y:u*u*u*from.y+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y}:{x:u*u*from.x+2*u*t*c.x1+t*t*c.x,y:u*u*from.y+2*u*t*c.y1+t*t*c.y});}}else if(c.type==='Z'){if(p.length>2)paths.push(p);p=[];cur=start;}}if(p.length>2)paths.push(p);return paths;}
function exteriors(paths){const c=new ClipperLib.Clipper();c.AddPaths(paths,ClipperLib.PolyType.ptSubject,true);let tree=new ClipperLib.PolyTree();c.Execute(ClipperLib.ClipType.ctUnion,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);return tree.Childs().map(n=>n.Contour());}
function offset(paths,amount,open=false){let co=new ClipperLib.ClipperOffset(2,.03*S);co.AddPaths(paths,ClipperLib.JoinType.jtRound,open?ClipperLib.EndType.etOpenRound:ClipperLib.EndType.etClosedPolygon);let out=new ClipperLib.Paths();co.Execute(out,amount*S);return out;}
function circle(x,y,r){return Array.from({length:96},(_,i)=>toInt({x:x+r*Math.cos(i*2*Math.PI/96),y:y+r*Math.sin(i*2*Math.PI/96)}));}
function connect(parts,thickness){let merged=exteriors(parts),limit=0;while(merged.length>1&&limit++<40){let best={d:Infinity};const first=merged.reduce((a,b)=>Math.abs(ClipperLib.Clipper.Area(a))>Math.abs(ClipperLib.Clipper.Area(b))?a:b);for(const other of merged){if(other===first)continue;for(let i=0;i<first.length;i+=2)for(let j=0;j<other.length;j+=2){const a=first[i],b=other[j],d=(a.X-b.X)**2+(a.Y-b.Y)**2;if(d<best.d)best={a,b,d};}}const bridge=offset([[best.a,best.b]],thickness/2,true);merged=exteriors([...merged,...bridge]);}if(merged.length!==1)throw Error('Le contour ne peut pas être relié. Essaie un autre texte ou une bordure plus large.');merged.bridges=limit;return merged;}
function bounds(paths){const all=paths.flat();return {x1:Math.min(...all.map(p=>p.X))/S,y1:Math.min(...all.map(p=>p.Y))/S,x2:Math.max(...all.map(p=>p.X))/S,y2:Math.max(...all.map(p=>p.Y))/S};}
function svgToContours(d){/* Motif contours use M/L/C only; details may use arcs and stay separate. */const tokens=d.match(/[A-Za-z]|-?\d*\.?\d+/g);let cmds=[],i=0,kind;while(i<tokens.length){if(/[A-Za-z]/.test(tokens[i]))kind=tokens[i++];if(kind==='Z'){cmds.push({type:'Z'});kind=null;continue;}const count={M:2,L:2,C:6,Q:4,H:1,V:1}[kind];if(!count)throw Error('Motif non reconnu');const a=tokens.slice(i,i+count).map(Number);i+=count;const previous=cmds.at(-1);if(kind==='H')cmds.push({type:'L',x:a[0],y:previous.y});else if(kind==='V')cmds.push({type:'L',x:previous.x,y:a[0]});else cmds.push(kind==='C'?{type:kind,x1:a[0],y1:a[1],x2:a[2],y2:a[3],x:a[4],y:a[5]}:kind==='Q'?{type:kind,x1:a[0],y1:a[1],x:a[2],y:a[3]}:{type:kind,x:a[0],y:a[1]});}return flatten(cmds);}
/* Sérialisation SVG maison : la méthode toPathData d’opentype.js 2.0 renvoie « NaN » quand une coordonnée a une partie décimale infime (ex. 12.000000000000002), ce qui coupe le tracé. */
function pathData(commands,places){const n=v=>String(+v.toFixed(places));return commands.map(c=>c.type==='Z'?'Z':c.type+(c.type==='C'?[c.x1,c.y1,c.x2,c.y2,c.x,c.y]:c.type==='Q'?[c.x1,c.y1,c.x,c.y]:[c.x,c.y]).map(n).join(' ')).join('');}
export function parseFont(buffer){return opentype.parse(buffer);}
/* Aperçu du texte saisi dans une carte de police : mêmes glyphes que la découpe, mis à l’échelle par le viewBox. */
export function fontPreview(text,font){const label=text.normalize('NFC').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).join(' ')||'Aa';const path=linePath(label,font,100);const b=path.getBoundingBox();if(!Number.isFinite(b.x1)||b.x2<=b.x1)return '';const pad=4;return `<svg viewBox="${(b.x1-pad).toFixed(1)} ${(b.y1-pad).toFixed(1)} ${(b.x2-b.x1+pad*2).toFixed(1)} ${(b.y2-b.y1+pad*2).toFixed(1)}" preserveAspectRatio="xMidYMid meet" focusable="false"><path d="${pathData(path.commands,1)}" fill="currentColor"/></svg>`;}
export function validate(config,font){if(config.lineGap!==undefined&&(!Number.isFinite(config.lineGap)||config.lineGap<0||config.lineGap>12))throw Error('Choisis un interligne entre 0 et 12 mm.');if(!config.text.trim())throw Error('Saisis un prénom ou un texte pour créer le porte-clés.');if([...config.text].length>18)throw Error('Le texte est limité à 18 caractères.');for(const char of config.text){if(![' ','\n','\r'].includes(char)&&font.charToGlyphIndex(char)===0)throw Error(`Le caractère « ${char} » n’est pas disponible dans cette police.`);}for(const item of config.decorations){if(item.gap!==undefined&&(!Number.isFinite(item.gap)||item.gap<0||item.gap>12))throw Error('Choisis un écart du motif entre 0 et 12 mm.');}if(config.width<40||config.width>140||!Number.isFinite(config.width))throw Error('Choisis une largeur entre 40 et 140 mm.');if(config.border<1.5||config.border>5||!Number.isFinite(config.border))throw Error('Choisis une bordure entre 1,5 et 5 mm.');if(config.hole<3||config.hole>6||!Number.isFinite(config.hole))throw Error('Choisis un trou entre 3 et 6 mm.');}
function linePath(text,font,size){const path=new opentype.Path();const chars=[...text];let advance=0;for(let i=0;i<chars.length;i++){const glyph=font.charToGlyph(chars[i]);path.extend(glyph.getPath(advance,0,size,{},font));advance+=(glyph.advanceWidth||0)/font.unitsPerEm*size;if(i+1<chars.length)advance+=font.getKerningValue(glyph,font.charToGlyph(chars[i+1]))/font.unitsPerEm*size;}return path;}
function generate(config,font,size,frozen){const placement={sides:{}};
const lines=config.text.trim().normalize('NFC').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
const rows=lines.map(line=>{const path=linePath(line,font,size);return {path,bb:bounds(flatten(path.commands))};});
const lineHeight=Math.min(...rows.map(row=>row.bb.y2-row.bb.y1));
let path=rows[0].path;
if(rows.length>1){
 path=new opentype.Path();
 const maxWidth=Math.max(...rows.map(row=>row.bb.x2-row.bb.x1));let top=0;
 for(const row of rows){
  const dx=(maxWidth-(row.bb.x2-row.bb.x1))/2-row.bb.x1,dy=top-row.bb.y1;
  path.extend(row.path.commands.map(command=>{const c={...command};for(const key of ['x','x1','x2'])if(key in c)c[key]+=dx;for(const key of ['y','y1','y2'])if(key in c)c[key]+=dy;return c;}));
  top+=row.bb.y2-row.bb.y1+(config.lineGap??size*.18);
 }
}
let glyphs=flatten(path.commands);let bb=bounds(glyphs);let tx=-bb.x1,ty=-bb.y1;glyphs=glyphs.map(p=>p.map(q=>({X:q.X+Math.round(tx*S),Y:q.Y+Math.round(ty*S)})));const textW=bb.x2-bb.x1,textH=bb.y2-bb.y1;const ink=[{paths:glyphs,extra:0}];let solid=offset(exteriors(glyphs),config.border),art=[`<path fill="${config.textColor}" d="${pathData(path.commands,4)}" transform="translate(${tx} ${ty})"/>`];let right=textW,left=0;
for(const item of config.decorations){
 const w=Math.max(7,textH*.92)*item.size/100,y=(textH-w)/2,gap=item.gap??config.border*.6;
 const position=item.position||'right';
 if(!['left','right','both'].includes(position))throw Error('Choisis la position du motif.');
 for(const side of position==='both'?['left','right']:[position]){
  const shape=position==='both'?(item[side+'Shape']??item.shape):item.shape;
  if(shape==='none')continue;
  const motif=MOTIFS[shape];
  const stroke=(motif.strokeWidth||0)*w/200;
  const local=svgToContours(motif.d).map(p=>p.map(q=>({X:Math.round(q.X*w/100),Y:Math.round((q.Y/S*w/100+y)*S)})));
  const edge=side==='left'?left:right,x=frozen?edge+frozen.sides[side]:placeMotif(glyphs,local,stroke,side,edge,gap,w);placement.sides[side]=x-edge;
  if(side==='left')left=x;else right=x+w;
  const contours=local.map(p=>p.map(q=>({X:q.X+Math.round(x*S),Y:q.Y})));
  ink.push({paths:contours,extra:stroke});
  solid.push(...offset(exteriors(contours),config.border+stroke));
  art.push(`<g data-motif="${shape}" transform="translate(${x} ${y}) scale(${w/100})"><path d="${motif.d} ${motif.cutouts||''}" fill="${item.color}" stroke="${item.color}" stroke-width="${motif.strokeWidth||0}" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd"/>${motif.detail?`<path d="${motif.detail}" fill="${config.textColor}"/>`:''}</g>`);
 }
}
const spot=frozen?{x:left+frozen.hole.dx,y:textH/2+frozen.hole.dy}:placeHole(ink,left,textH,config.hole/2+config.border);placement.hole={dx:spot.x-left,dy:spot.y-textH/2};const hole={x:spot.x,y:spot.y,r:config.hole/2};solid.push(circle(hole.x,hole.y,hole.r+config.border));const connected=connect(solid,Math.max(2,config.border*1.5));const b=bounds(connected);return {placement,bridges:connected.bridges,outer:connected[0],art:art.join(''),hole,bounds:b,width:b.x2-b.x1,height:b.y2-b.y1,fontHeight:lineHeight};}
/* Distance (mm) entre un point et l’encre la plus proche : contours des lettres et des motifs, épaisseur de trait comprise. */
function inkSegments(ink,y,margin){const out=[],lo=(y-margin)*S,hi=(y+margin)*S;for(const {paths,extra} of ink)for(const p of paths)for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[j],b=p[i];if(Math.min(a.Y,b.Y)-extra*S>hi||Math.max(a.Y,b.Y)+extra*S<lo)continue;out.push([a.X,a.Y,b.X-a.X,b.Y-a.Y,extra]);}return out;}
function inkDistance(segments,x,y){const px=x*S,py=y*S;let best=Infinity;for(const [ax,ay,dx,dy,extra] of segments){const l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=t<0?0:t>1?1:t;const d=Math.hypot(px-ax-t*dx,py-ay-t*dy)/S-extra;if(d<best)best=d;}return best;}
/* Profil d’un contour vu d’un côté : le point le plus à gauche (ou à droite) de chaque tranche horizontale de 0,2 mm. Les segments longs sont densifiés, sinon un trait droit (le M de Bungee) n’aurait de points qu’à ses extrémités. */
function profile(paths,keepMax,minY,maxY){const bin=.2*S,rows=new Map(),keep=q=>{if(q.Y<minY||q.Y>maxY)return;const k=Math.round(q.Y/bin),cur=rows.get(k);if(!cur||(keepMax?q.X>cur.X:q.X<cur.X))rows.set(k,q);};for(const p of paths)for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[j],b=p[i],n=Math.max(1,Math.ceil(Math.hypot(b.X-a.X,b.Y-a.Y)/bin));for(let k=0;k<n;k++)keep({X:a.X+(b.X-a.X)*k/n,Y:a.Y+(b.Y-a.Y)*k/n});}const keys=[...rows.keys()].sort((a,b)=>a-b),pts=keys.map(k=>rows.get(k)),segs=[];for(let i=1;i<keys.length;i++)if(keys[i]-keys[i-1]<=2)segs.push([pts[i-1],pts[i]]);return {pts,segs};}
/* Place un motif contre les lettres plutôt que contre leur boîte : l’écart choisi sépare réellement le motif de la lettre la plus proche, ce qui évite un pont fin quand la dernière (ou la première) lettre est penchée ou creuse à mi-hauteur. */
function placeMotif(glyphs,local,stroke,side,edge,gap,w){
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of local)for(const q of p){if(q.X<minX)minX=q.X;if(q.X>maxX)maxX=q.X;if(q.Y<minY)minY=q.Y;if(q.Y>maxY)maxY=q.Y;}
 const right=side==='right',start=right?edge+gap-minX/S:edge-gap-maxX/S,reach=(gap+stroke+1)*S;
 const text=profile(glyphs,right,minY-reach,maxY+reach),shape=profile(local,!right,-Infinity,Infinity);
 if(!text.pts.length)return start;
 /* Distance continue entre les deux profils : points de l’un contre segments de l’autre, dans les deux sens. */
 const seg=(px,py,a,b)=>{const dx=b.X-a.X,dy=b.Y-a.Y,l=dx*dx+dy*dy;let t=l?((px-a.X)*dx+(py-a.Y)*dy)/l:0;t=t<0?0:t>1?1:t;const ex=px-a.X-t*dx,ey=py-a.Y-t*dy;return ex*ex+ey*ey;};
 const dist=x=>{const ox=x*S;let best=Infinity;for(const q of shape.pts){const px=q.X+ox;for(const t of text.pts){const dx=px-t.X,dy=q.Y-t.Y,d=dx*dx+dy*dy;if(d<best)best=d;}for(const [a,b] of text.segs){const d=seg(px,q.Y,a,b);if(d<best)best=d;}}for(const t of text.pts)for(const [a,b] of shape.segs){const d=seg(t.X-ox,t.Y,a,b);if(d<best)best=d;}return Math.sqrt(best)/S-stroke;};
 const dir=right?-1:1,step=.4,refine=(far,near)=>{for(let k=0;k<12;k++){const mid=(far+near)/2;if(dist(mid)>gap)far=mid;else near=mid;}return far;};
 let x=start,best=dist(x);
 for(let travel=step;travel<=w;travel+=step){const nx=start+dir*travel,nd=dist(nx);if(nd<=gap)return refine(x,nx);if(nd<best)best=nd;else if(nd>best+step)break;x=nx;}
 return start;
}
/* Cherche, sur une ligne horizontale, la position la plus à droite où le trou garde une bordure pleine (distance « radius » jusqu’à l’encre). */
function scanRow(ink,left,y,radius){
 const segments=inkSegments(ink,y,radius*1.5),at=x=>inkDistance(segments,x,y),step=.5,refine=(lo,hi)=>{for(let k=0;k<12;k++){const mid=(lo+hi)/2;if(at(mid)>radius)lo=mid;else hi=mid;}return lo;};
 let x=left-radius-1,d=at(x);
 if(d<=radius){while(d<=radius&&x>left-radius*5){x-=step;d=at(x);}return {x:refine(x,x+step),y};}
 let best=d;
 for(let nx=x+step;nx<=left+radius*5;nx+=step){const nd=at(nx);if(nd<=radius)return {x:refine(nx-step,nx),y};if(nd<best)best=nd;else if(nd>best+step)break;}
 return null;
}
/* Place l’anneau au plus près du contenu réel, à mi-hauteur si possible : il se fond dans la silhouette même quand la première lettre est penchée ou irrégulière. Pour un T ou un J seul, l’anneau monte ou descend jusqu’à la partie de la lettre la plus proche. */
function placeHole(ink,left,height,radius){
 const mid=height/2;
 for(let dy=0;dy<=mid;dy+=.5)for(const y of dy?[mid-dy,mid+dy]:[mid]){const spot=scanRow(ink,left,y,radius);if(spot)return spot;}
 return {x:left-radius,y:mid};
}
export function buildGeometry(config,font){validate(config,font);let size=20,g,prev=null,frozen=null;for(let i=0;i<12;i++){g=generate(config,font,size,frozen);if(Math.abs(g.width-config.width)<.003)break;/* Près du but, l’anneau et le motif sont figés : la largeur devient continue et l’ajustement converge. */if(!frozen&&Math.abs(g.width-config.width)<.5)frozen=g.placement;/* Méthode de la sécante : la largeur varie presque linéairement avec la taille des lettres. */let next=prev&&Math.abs(g.width-prev.width)>1e-6?size+(config.width-g.width)*(size-prev.size)/(g.width-prev.width):NaN;if(!Number.isFinite(next)||next<size*.35||next>size*2.5)next=size*Math.max(.35,Math.min(2.5,(config.width-(config.hole+config.border*3))/(g.width-(config.hole+config.border*3))));prev={size,width:g.width};size=next;}if(g.fontHeight<4)throw Error('Les lettres seraient trop petites. Augmente la largeur ou raccourcis le texte.');const shift={x:-g.bounds.x1,y:-g.bounds.y1};let d=g.outer.map((p,i)=>`${i?'L':'M'}${(p.X/S+shift.x).toFixed(3)} ${(p.Y/S+shift.y).toFixed(3)}`).join(' ')+' Z';return {...g,shift,d,material:config.material||'white',width:+g.width.toFixed(3),height:+g.height.toFixed(3)};}
function holePath(g){const x=g.hole.x+g.shift.x,y=g.hole.y+g.shift.y,r=g.hole.r;return `M ${x+r} ${y} A ${r} ${r} 0 1 0 ${x-r} ${y} A ${r} ${r} 0 1 0 ${x+r} ${y} Z`;}
function materialDefs(material){if(material!=='wood')return '';return `<defs><filter id="material-grain"><feTurbulence type="fractalNoise" baseFrequency="0.025 0.8" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter><pattern id="material-wood" patternUnits="userSpaceOnUse" width="100" height="35"><rect width="100" height="35" fill="#dfbf91"/><rect width="100" height="35" filter="url(#material-grain)" opacity="0.12"/><g fill="none" stroke="#ac7c45" stroke-width="0.12" opacity="0.22"><path d="M0 3 Q22 1 48 3 T100 2 M0 8 Q30 5 52 8 T100 7 M0 14 Q18 12 44 14 T100 15 M0 20 Q33 18 70 21 T100 20 M0 27 Q22 24 59 27 T100 26 M0 32 Q40 30 65 33 T100 32"/></g></pattern></defs>`;}
export function svgDocument(g,mode='uv',preview=false){const base=`${g.d} ${holePath(g)}`;const art=`<g transform="translate(${g.shift.x} ${g.shift.y})">${g.art}</g>`;const laser=`<path d="${base}" fill="none" stroke="#000000" stroke-width="0.6"/>`;const material=MATERIALS[g.material]||MATERIALS.white;const content=mode==='laser'?laser:mode==='result'?`${materialDefs(g.material)}<path data-material="${g.material}" d="${base}" fill="${material.fill}" fill-rule="evenodd"/>${art}`:mode==='proof'?`<path data-material="${g.material}" d="${base}" fill="${g.material==='wood'?'#dfbf91':material.fill}" fill-rule="evenodd" stroke="#b8b8b8" stroke-width="0.2"/>${art}`:art;return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}mm" height="${g.height}mm" viewBox="0 0 ${g.width} ${g.height}">${content}</svg>`;}

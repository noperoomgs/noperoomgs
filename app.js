'use strict';

const paper = 'https://proceedings.neurips.cc/paper_files/paper/2025/file/464012c83279e19be4cd42c25f341c92-Paper-Conference.pdf';
const datasets = {
  replica: { label: 'Replica', tables: 'Tables 1 & 2', page: 7, rows: [['CF-3DGS','25.40','0.77','0.29','0.059'],['Nope-NeRF','27.46','0.75','0.40','0.039'],['NopeRoomGS','32.14','0.90','0.09','0.009']] },
  scannet: { label: 'ScanNet', tables: 'Table 3', page: 8, rows: [['CF-3DGS','23.26','0.68','0.24','0.040'],['Nope-NeRF','22.11','0.64','0.39','0.040'],['NopeRoomGS','25.38','0.72','0.20','0.020']] },
  tanks: { label: 'Tanks & Temples', tables: 'Table 4', page: 9, rows: [['CF-3DGS','31.28','0.93','0.09','0.004'],['Nope-NeRF','26.34','0.74','0.39','0.006'],['NopeRoomGS','31.68','0.94','0.07','0.003']] }
};
const tabs = [...document.querySelectorAll('[data-dataset]')];
function selectDataset(key) {
  const data = datasets[key];
  tabs.forEach(tab => {const selected = tab.dataset.dataset === key; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;});
  document.getElementById('dataset-panel').setAttribute('aria-labelledby', `tab-${key}`);
  const tbody = document.getElementById('results-body');
  tbody.replaceChildren();
  data.rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    if (index === 2) tr.className = 'ours';
    row.forEach((value, column) => {
      const cell = document.createElement(column === 0 ? 'th' : 'td');
      cell.textContent = value;
      if (column === 0) {cell.scope = 'row'; if (index === 2) {const badge = document.createElement('span'); badge.textContent = 'Ours'; cell.append(' ', badge);}}
      tr.append(cell);
    });
    tbody.append(tr);
  });
  const values = data.rows[2];
  ['psnr','ssim','lpips','ate'].forEach((metric,index) => {
    const element = document.getElementById(`metric-${metric}`);
    element.textContent = values[index+1];
    if (metric === 'psnr') {const unit = document.createElement('span'); unit.textContent = 'dB'; element.append(unit);}
  });
  document.getElementById('table-caption').textContent = `${data.label} benchmark comparison`;
  const source = document.getElementById('result-source-link');
  source.textContent = `${data.tables} of the paper`;
  source.href = `${paper}#page=${data.page}`;
}
tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => selectDataset(tab.dataset.dataset));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
    if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length-1;
    if (next !== undefined) {event.preventDefault(); tabs[next].focus(); selectDataset(tabs[next].dataset.dataset);}
  });
});

const poster = document.getElementById('video-poster');
function hidePoster() {poster.style.visibility = 'hidden';}
poster.addEventListener('error', hidePoster);
if (poster.complete && !poster.naturalWidth) hidePoster();
document.getElementById('play-video').addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/ksteHb-WFlE?autoplay=1';
  iframe.title = 'NopeRoomGS project video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  const container = document.getElementById('video-container');
  container.classList.add('playing');
  container.replaceChildren(iframe);
  iframe.focus();
});

document.getElementById('copy-citation').addEventListener('click', async () => {
  const text = document.getElementById('bibtex').textContent;
  const label = document.querySelector('#copy-citation span');
  const status = document.getElementById('copy-status');
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const area = document.createElement('textarea');
      area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.append(area); area.select();
      const copied = document.execCommand('copy'); area.remove();
      document.getElementById('copy-citation').focus();
      if (!copied) throw new Error('Clipboard unavailable');
    }
    label.textContent = 'Copied!'; status.textContent = 'Citation copied to clipboard.';
    setTimeout(() => {label.textContent = 'Copy citation';}, 2200);
  } catch {
    const range = document.createRange(); range.selectNodeContents(document.getElementById('bibtex'));
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    label.textContent = 'Selected — copy manually'; status.textContent = 'Citation selected. Use your device’s copy command or download the BibTeX file.';
  }
});

// Procedural room schematic; this is an illustration, not a reconstruction result.
const canvas = document.getElementById('room-canvas');
const ctx = canvas.getContext('2d');
let stage = 'local';
let seed = 51;
function random() {seed = (seed*16807)%2147483647; return (seed-1)/2147483646;}
const points = [];
function surface(count, create, color) {for(let i=0;i<count;i++) points.push({...create(random(),random()), color, radius: .6+random()*1.1});}
surface(2100,(u,v)=>({x:u*4-2,y:0,z:v*3-1.5}),0);
surface(1200,(u,v)=>({x:-2,y:v*2.3,z:u*3-1.5}),1);
surface(1400,(u,v)=>({x:u*4-2,y:v*2.3,z:1.5}),1);
// Table, sofa, and cabinet surfaces make the diagram legible as a room.
surface(650,(u,v)=>({x:u*1.5-.6,y:.75,z:v*.8-.9}),2);
surface(700,(u,v)=>({x:u*1.9-.6,y:.45,z:v*.7+.55}),3);
surface(650,(u,v)=>({x:u*1.9-.6,y:v*.8+.45,z:1.28}),3);
surface(600,(u,v)=>({x:-1.8+u*.6,y:1.2,z:v*1-.35}),2);
function drawRoom() {
  if (!ctx) return;
  const width = canvas.clientWidth, height = canvas.clientHeight, dpr = Math.min(window.devicePixelRatio||1,2);
  canvas.width = width*dpr; canvas.height = height*dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height);
  const scale = Math.min(width/5.7,height/3.8);
  function project(x,y,z) {return [width*.52+(x*.83-z*.6)*scale,height*.63+(x*.3+z*.4-y*.88)*scale];}
  ctx.lineWidth=.65; ctx.strokeStyle='#ddd6e7';
  for(let i=0;i<=8;i++) {const x=i*.5-2; const a=project(x,0,-1.5),b=project(x,0,1.5);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
  for(let i=0;i<=6;i++) {const z=i*.5-1.5; const a=project(-2,0,z),b=project(2,0,z);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
  const colors=stage==='global'?['#8875bb','#a891c9','#614da3','#9c76ae']:['#a8a0c4','#b7accb','#7c79b3','#b090c3'];
  points.forEach((p,index)=>{
    if(stage==='local' && p.x>.7 && index%4!==0) return;
    const [x,y]=project(p.x,p.y,p.z);
    ctx.fillStyle=colors[p.color];ctx.globalAlpha=stage==='local' && p.x>.7?.2:.64;
    ctx.beginPath();ctx.ellipse(x,y,p.radius,p.radius*.7,-.3,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;
  ctx.strokeStyle=stage==='global'?'#7161b7':'#b093bf';ctx.lineWidth=1.3;ctx.setLineDash([4,4]);
  ctx.beginPath();
  const trajectory=[[-1.4,.4,-.9],[-.8,.4,-.65],[-.2,.4,-.35],[.45,.4,-.25],[1.1,.4,-.6],[1.45,.4,-.9]];
  trajectory.forEach((p,i)=>{const q=project(...p);i===0?ctx.moveTo(...q):ctx.lineTo(...q)});ctx.stroke();ctx.setLineDash([]);
  trajectory.slice(0,stage==='global'?6:3).forEach(p=>{
    const [x,y]=project(...p);ctx.fillStyle='#f8f6fc';ctx.strokeStyle='#7560c5';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(x-6,y-4);ctx.lineTo(x+4,y-4);ctx.lineTo(x+9,y-8);ctx.lineTo(x+9,y+5);ctx.lineTo(x+4,y+1);ctx.lineTo(x-6,y+1);ctx.closePath();ctx.fill();ctx.stroke();
  });
}
document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
  stage=button.dataset.stage;
  document.querySelectorAll('[data-stage]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
  document.getElementById('stage-label').textContent=stage==='local'?'LOCAL GEOMETRY':'GLOBAL RECONSTRUCTION';
  document.getElementById('stage-caption').textContent=stage==='local'?'Overlapping clips → reliable local geometry':'Alternating optimization → unified global scene';
  drawRoom();
}));
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(drawRoom).observe(canvas);
else window.addEventListener('resize',drawRoom);
drawRoom();

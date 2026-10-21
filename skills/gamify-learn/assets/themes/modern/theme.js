/* gamify-learn theme pack: MODERN. Loaded before the engine; the engine reads window.__THEME.
   icons: name -> (px) => svg string. Flat sticker icons: solid fills, 1.8px ink outline, no gradients.
   palette: confetti + lab plot colours. */
(function(){
const INK='#121418',SUN='#ffc83d',BLUE='#2f5bff',RED='#e5372b',GREEN='#12a35f',W='#ffffff';
const wrap=(px,inner)=>{const s=Math.round(px*9);return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" stroke="'+INK+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+inner+'</svg>'};
function starPts(cx,cy,R,r){let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:R;p.push((cx+rr*Math.cos(a)).toFixed(2)+','+(cy+rr*Math.sin(a)).toFixed(2))}return p.join(' ')}
const I={
 heart:px=>wrap(px,'<path d="M12 20s-8-4.5-8-10.5A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.5C20 15.5 12 20 12 20z" fill="'+RED+'"/>'),
 star:px=>wrap(px,'<polygon points="'+starPts(12,12.8,9.2,4.3)+'" fill="'+SUN+'"/>'),
 flame:px=>wrap(px,'<path d="M12 2.5c1 4 5.8 5.8 5.8 10.8a5.8 5.8 0 0 1-11.6 0c0-3 1.9-4.4 2.8-6.5.7 1.4 1.3 2 2.2 2.4.4-2.3.1-4.5.8-6.7z" fill="#ff7a1a"/><path d="M12 13c.6 2 3 2.6 3 4.6a3 3 0 0 1-6 0c0-1.8 2.4-2.6 3-4.6z" fill="'+SUN+'" stroke-width="1.4"/>'),
 coin:px=>wrap(px,'<circle cx="12" cy="12" r="9" fill="'+SUN+'"/><path d="M12 7.5v9M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" fill="none" stroke-width="1.6"/>'),
 trophy:px=>wrap(px,'<path d="M7.5 6H4.5v1.8A3.2 3.2 0 0 0 7.7 11M16.5 6h3v1.8a3.2 3.2 0 0 1-3.2 3.2" fill="none"/><path d="M7 3.5h10v6a5 5 0 0 1-10 0z" fill="'+SUN+'"/><path d="M12 14.5v3" /><rect x="7.5" y="17.5" width="9" height="3.5" rx="1.2" fill="'+BLUE+'"/>'),
 boss:px=>wrap(px,'<path d="M4.5 10 6 3.5l3.8 3h4.4l3.8-3 1.5 6.5v4a6.5 6.5 0 0 1-6.5 6.5h-2A6.5 6.5 0 0 1 4.5 14z" fill="'+RED+'"/><circle cx="9" cy="12.5" r="1.9" fill="'+W+'"/><circle cx="15" cy="12.5" r="1.9" fill="'+W+'"/><path d="M10 16.6h4" />'),
 hero:px=>wrap(px,'<circle cx="12" cy="12" r="9.2" fill="'+BLUE+'"/><circle cx="9.2" cy="11" r="1.5" fill="'+W+'" stroke-width="1.2"/><circle cx="14.8" cy="11" r="1.5" fill="'+W+'" stroke-width="1.2"/><path d="M9 15q3 2.4 6 0" fill="none" stroke="'+W+'" stroke-width="1.6"/>'),
 book:px=>wrap(px,'<path d="M3 5.5c3.2-1.1 6.2-.8 9 1v13.5c-2.8-1.8-5.8-2.1-9-1z" fill="'+W+'"/><path d="M21 5.5c-3.2-1.1-6.2-.8-9 1v13.5c2.8-1.8 5.8-2.1 9-1z" fill="'+BLUE+'"/>'),
 bolt:px=>wrap(px,'<path d="M13.8 2.5 5.5 13.6h5.6l-1 7.9 8.4-11.3h-5.8z" fill="'+SUN+'"/>'),
 sword:px=>wrap(px,'<path d="M14.5 3.5H20.5v6L11 19l-6-6z" fill="'+W+'"/><path d="m4 20 3.2-3.2M4.5 12.5l7 7" /><circle cx="4.2" cy="19.8" r="1.4" fill="'+SUN+'"/>'),
 skull:px=>wrap(px,'<path d="M4.8 11a7.2 7.2 0 0 1 14.4 0v3.6l-1.6 1v3.6H6.4v-3.6l-1.6-1z" fill="'+W+'"/><circle cx="9.3" cy="11.6" r="1.7" fill="'+INK+'"/><circle cx="14.7" cy="11.6" r="1.7" fill="'+INK+'"/>'),
 flag:px=>wrap(px,'<path d="M5.5 21.5V3" /><path d="M5.5 4h12.5l-2.8 4.3L18 12.5H5.5z" fill="'+GREEN+'"/>')
};
window.__THEME={
  name:'modern',
  icons:I,
  palette:{
    conf:['#ffc83d','#2f5bff','#e5372b','#12a35f','#ffffff'],
    grid:'#e6e9f0',axis:'#4a5060',ink:'#121418',
    series:['#e5372b','#2f5bff','#121418'],at:'#e5372b',
    bw:2,mw:2.5,lw:3.5,font:"'JetBrains Mono',ui-monospace,Consolas,monospace"
  }
};
})();

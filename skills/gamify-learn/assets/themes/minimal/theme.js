/* gamify-learn theme pack: MINIMAL. Loaded before the engine; the engine reads window.__THEME.
   icons: name -> (px) => svg string. Monoline 1.6px ink strokes on a 24 grid, one gold fill for stars and coins.
   palette: confetti + lab plot colours. */
(function(){
const INK='#14161b',GOLD='#f4c430',ACC='#2346d8';
const wrap=(px,inner)=>{const s=Math.round(px*8);return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="'+INK+'" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+inner+'</svg>'};
function starPts(cx,cy,R,r){let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:R;p.push((cx+rr*Math.cos(a)).toFixed(2)+','+(cy+rr*Math.sin(a)).toFixed(2))}return p.join(' ')}
const I={
 heart:px=>wrap(px,'<path d="M12 19.5s-7.5-4.3-7.5-10A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 7.5 2.3c0 5.7-7.5 10-7.5 10z"/>'),
 star:px=>wrap(px,'<polygon points="'+starPts(12,12.6,8.6,3.9)+'" fill="'+GOLD+'"/>'),
 flame:px=>wrap(px,'<path d="M12 3.2c.8 3.6 5 5.4 5 9.9a5 5 0 0 1-10 0c0-2.7 1.7-4 2.5-5.9.6 1.3 1.2 1.9 2 2.2.3-2.1.1-4.2.5-6.2z"/>'),
 coin:px=>wrap(px,'<circle cx="12" cy="12" r="8.2" fill="'+GOLD+'"/><circle cx="12" cy="12" r="4.6"/>'),
 trophy:px=>wrap(px,'<path d="M8 4h8v5.5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13.5V17M8.5 20h7M9.5 17h5"/>'),
 boss:px=>wrap(px,'<path d="M4.5 10 6 4.5l3.5 2.8h5L18 4.5l1.5 5.5v4.2a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6z"/><path d="M9 12.5h.01M15 12.5h.01" stroke-width="2.6"/><path d="M10 16.2h4"/>'),
 hero:px=>wrap(px,'<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>'),
 book:px=>wrap(px,'<path d="M3.5 5.5c3-1 5.8-.7 8.5 1v13c-2.7-1.7-5.5-2-8.5-1z"/><path d="M20.5 5.5c-3-1-5.8-.7-8.5 1v13c2.7-1.7 5.5-2 8.5-1z"/>'),
 bolt:px=>wrap(px,'<path d="M13.5 3 6 13.2h5.2L10.5 21l7.5-10.2h-5.2z"/>'),
 sword:px=>wrap(px,'<path d="M14.5 4H20v5.5L10.5 19 5 13.5z"/><path d="m7 15.5-3 3M5.5 13 11 18.5M3.5 20.5l1-1"/>'),
 skull:px=>wrap(px,'<path d="M5 11a7 7 0 0 1 14 0v3.5l-1.5 1v3h-11v-3l-1.5-1z"/><path d="M9.3 11.6h.01M14.7 11.6h.01" stroke-width="2.8"/><path d="M10.5 18.5v-2M13.5 18.5v-2"/>'),
 flag:px=>wrap(px,'<path d="M5.5 21V3.5"/><path d="M5.5 4.5h11.5l-2.5 4 2.5 4H5.5" fill="'+ACC+'" stroke="'+ACC+'"/>')
};
window.__THEME={
  name:'minimal',
  icons:I,
  palette:{
    conf:['#2346d8','#f4c430','#14161b','#17784a'],
    grid:'#e2e4e9',axis:'#5e6472',ink:'#14161b',
    series:['#d4442e','#2346d8','#14161b'],at:'#d4442e',
    bw:1,mw:2,lw:2.5,font:"'JetBrains Mono',ui-monospace,Consolas,monospace"
  }
};
})();

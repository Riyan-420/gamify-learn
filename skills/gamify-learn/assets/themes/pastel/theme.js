/* gamify-learn theme pack: PASTEL (minimal, modern, smooth). Loaded before the engine; the engine reads window.__THEME.
   icons: name -> (px) => svg string, drawn as soft vector shapes (no pixel art). palette: confetti + lab plot colours. */
(function(){
let U=0;
const gid=()=>'pg'+(++U);
const lg=(i,a,b)=>'<linearGradient id="'+i+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient>';
const wrap=(px,defs,inner)=>{const s=Math.round(px*9);return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" aria-hidden="true"><defs>'+defs+'</defs>'+inner+'</svg>'};
const INK='#3a3d66';
function starPts(cx,cy,R,r){let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:R;p.push((cx+rr*Math.cos(a)).toFixed(2)+','+(cy+rr*Math.sin(a)).toFixed(2))}return p.join(' ')}
const I={
 heart:px=>{const g=gid();return wrap(px,lg(g,'#ffc2d1','#ff7f9b'),'<path d="M12 20.6C5.4 16.4 2.5 13 2.5 9.3 2.5 6.4 4.7 4.3 7.4 4.3c1.8 0 3.4.9 4.6 2.6 1.2-1.7 2.8-2.6 4.6-2.6 2.7 0 4.9 2.1 4.9 5 0 3.7-2.9 7.1-9.5 11.3z" fill="url(#'+g+')"/><ellipse cx="7.7" cy="8.3" rx="2" ry="1.25" fill="#fff" opacity=".55" transform="rotate(-32 7.7 8.3)"/>')},
 star:px=>{const g=gid();return wrap(px,lg(g,'#fff0b8','#ffc95e'),'<polygon points="'+starPts(12,12.8,9,4.4)+'" fill="url(#'+g+')" stroke="#ffd77a" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="9.6" cy="9.6" rx="1.5" ry=".9" fill="#fff" opacity=".7" transform="rotate(-35 9.6 9.6)"/>')},
 flame:px=>{const g=gid();return wrap(px,lg(g,'#ffc58a','#ff7f8f'),'<path d="M12 2C13 7 19 9 19 15a7 7 0 0 1-14 0c0-3.5 2.5-5 3.5-7.5C9.5 9 10 9.5 11 10c.5-3 .5-5.5 1-8z" fill="url(#'+g+')"/><path d="M12 12.5c.5 2.5 4 3 4 5.5a4 4 0 0 1-8 0c0-2.500 3.500-3 4-5.5z" fill="#fff0b8"/>')},
 coin:px=>{const g=gid();return wrap(px,lg(g,'#fff0b8','#ffcf66'),'<circle cx="12" cy="12" r="9.5" fill="url(#'+g+')"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#fff" stroke-width="1.4" opacity=".65"/><path d="M12 8.2l1 2.4 2.5.2-1.9 1.7.6 2.5L12 13.7 9.8 15l.6-2.5-1.9-1.7 2.5-.2z" fill="#fff" opacity=".9"/>')},
 trophy:px=>{const g=gid();return wrap(px,lg(g,'#fff0b8','#ffc95e'),'<path d="M7 5.5H4.2v1.7a3.5 3.5 0 0 0 3.5 3.4M17 5.5h2.8v1.7a3.5 3.5 0 0 1-3.5 3.4" fill="none" stroke="#ffd77a" stroke-width="1.8" stroke-linecap="round"/><path d="M7 3h10v6.700A5 5 0 0 1 12 14.700 5 5 0 0 1 7 9.700z" fill="url(#'+g+')"/><rect x="10.8" y="14.500" width="2.400" height="3" fill="#ffc94d"/><rect x="7.500" y="17.500" width="9" height="3.200" rx="1.600" fill="#ffb84a"/><ellipse cx="9.600" cy="7" rx="1" ry="2.200" fill="#fff" opacity=".55"/>')},
 boss:px=>{const g=gid();return wrap(px,lg(g,'#d3c8ff','#9b8af2'),'<path d="M6.200 7.400 4 2.800l5 2.300zM17.800 7.400 20 2.800l-5 2.300z" fill="#ff9fb5"/><path d="M3.800 13.200c0-5 3.600-8.400 8.200-8.400s8.200 3.400 8.200 8.400c0 3.800-2.500 6.300-8.200 6.300S3.800 17 3.800 13.200z" fill="url(#'+g+')"/><circle cx="9" cy="12.400" r="2.200" fill="#fff"/><circle cx="15" cy="12.400" r="2.200" fill="#fff"/><circle cx="9.300" cy="12.700" r="1.050" fill="'+INK+'"/><circle cx="14.700" cy="12.700" r="1.050" fill="'+INK+'"/><path d="M6.800 9.600l4-1.200M17.200 9.600l-4-1.200" stroke="'+INK+'" stroke-width="1.400" stroke-linecap="round"/><path d="M9.600 16.800q2.400-1.600 4.800 0" fill="none" stroke="'+INK+'" stroke-width="1.400" stroke-linecap="round"/>')},
 hero:px=>{const g=gid();return wrap(px,lg(g,'#cfc6ff','#ffbcd0'),'<circle cx="12" cy="13" r="9" fill="url(#'+g+')"/><ellipse cx="9" cy="11.800" rx="1.900" ry="2.300" fill="#fff"/><ellipse cx="15" cy="11.800" rx="1.900" ry="2.300" fill="#fff"/><circle cx="9.300" cy="12.200" r="1.100" fill="'+INK+'"/><circle cx="15.300" cy="12.200" r="1.100" fill="'+INK+'"/><circle cx="6.400" cy="15.600" r="1.500" fill="#ff8aa0" opacity=".45"/><circle cx="17.600" cy="15.600" r="1.500" fill="#ff8aa0" opacity=".45"/><path d="M9.800 16.200q2.200 1.900 4.400 0" fill="none" stroke="'+INK+'" stroke-width="1.300" stroke-linecap="round"/><path d="M19 1.800l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#ffd166"/>')},
 book:px=>{const g=gid(),h=gid();return wrap(px,lg(g,'#e0ebff','#b9d0ff')+lg(h,'#c9bfff','#9fb4ff'),'<path d="M2.800 5.600c3.200-1.100 6.200-.9 9.200.9v13.500c-3-1.800-6-2-9.200-.9z" fill="url(#'+g+')"/><path d="M21.200 5.600c-3.200-1.100-6.200-.9-9.200.9v13.500c3-1.800 6-2 9.200-.9z" fill="url(#'+h+')"/><path d="M5.400 9.400c1.600-.4 3.200-.2 4.800.5M5.400 12.600c1.600-.4 3.200-.2 4.800.5" fill="none" stroke="#fff" stroke-width="1.200" stroke-linecap="round" opacity=".85"/>')},
 bolt:px=>{const g=gid();return wrap(px,lg(g,'#fff0b8','#ffb15c'),'<path d="M13.600 2.200 5.200 13.400h5.400L9.500 21.800l9.300-12.100h-5.600z" fill="url(#'+g+')" stroke="#ffcf7a" stroke-width="1.300" stroke-linejoin="round"/>')},
 sword:px=>{const g=gid();return wrap(px,lg(g,'#e6edff','#b9c8ff'),'<g transform="rotate(35 12 12)"><rect x="10.800" y="1.800" width="2.600" height="11.500" rx="1.300" fill="url(#'+g+')"/><rect x="7.800" y="13.200" width="8.600" height="2.300" rx="1.150" fill="#ffc94d"/><rect x="10.800" y="15.300" width="2.600" height="4.600" rx="1.300" fill="#ff9fb5"/><circle cx="12.100" cy="21" r="1.500" fill="#ffc94d"/></g>')},
 skull:px=>{const g=gid();return wrap(px,lg(g,'#ffffff','#ddd6ff'),'<path d="M5 20.500V11a7 7 0 0 1 14 0v9.500l-2.300-1.800-2.300 1.800L12 18.700 9.600 20.500 7.300 18.700z" fill="url(#'+g+')" stroke="#cfc8ff" stroke-width="1.200" stroke-linejoin="round"/><circle cx="9.400" cy="11.200" r="1.250" fill="'+INK+'"/><circle cx="14.600" cy="11.200" r="1.250" fill="'+INK+'"/><path d="M10.600 14.200q1.400.9 2.800 0" fill="none" stroke="'+INK+'" stroke-width="1.200" stroke-linecap="round"/>')},
 flag:px=>{const g=gid();return wrap(px,lg(g,'#ffc2d1','#ff8fa8'),'<rect x="4.800" y="2.600" width="2.200" height="19" rx="1.100" fill="#b9b0f0"/><path d="M7 3.800c3-1.500 5 1.500 8 0 1.600-.8 3-.9 4-.3v8.200c-1-.6-2.400-.5-4 .3-3 1.500-5-1.500-8 0z" fill="url(#'+g+')"/>')}
};
window.__THEME={
  name:'pastel',
  icons:I,
  palette:{
    conf:['#a99bff','#ff9fb5','#9fe0c8','#ffd98a','#9fc4ff'],
    grid:'#ece9ff',axis:'#6a6e94',ink:'#3a3d66',
    series:['#ff7f96','#6f8df0','#3a3d66'],at:'#ff7f96',
    bw:1.5,mw:2.5,lw:3.5,font:"ui-monospace,'Cascadia Mono',Consolas,monospace"
  }
};
})();

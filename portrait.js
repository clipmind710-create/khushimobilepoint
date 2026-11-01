// Monkey follows the mouse / finger. Move or drag anywhere: he turns his head and body that way.
(function(){
  var wrap=document.getElementById('magnetWrap'),inner=document.getElementById('magnetInner');
  if(!wrap||!inner)return;
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var tx=0,ty=0,cx=0,cy=0,vx=0,vy=0,down=false,boost=1,lastMove=performance.now(),happy=0;
  inner.style.transformOrigin='50% 28%';inner.style.transition='none';
  function aim(x,y){
    var r=wrap.getBoundingClientRect(),hx=r.left+r.width/2,hy=r.top+r.height*.3;
    var dx=(x-hx)/(innerWidth*.5),dy=(y-hy)/(innerHeight*.5);
    tx=Math.max(-1,Math.min(1,dx));ty=Math.max(-1,Math.min(1,dy));lastMove=performance.now();
  }
  addEventListener('pointermove',function(e){aim(e.clientX,e.clientY)},{passive:true});
  addEventListener('pointerdown',function(e){down=true;aim(e.clientX,e.clientY)},{passive:true});
  addEventListener('pointerup',function(){down=false});addEventListener('pointercancel',function(){down=false});
  addEventListener('scroll',function(){ty=.8;lastMove=performance.now()},{passive:true});
  document.querySelectorAll('.contact-btn').forEach(function(b){
    b.addEventListener('pointerenter',function(){happy=1});b.addEventListener('pointerleave',function(){happy=0});
  });
  var last=performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    var dt=Math.min(.04,(now-last)/1000);last=now;
    var idle=now-lastMove>6000,t=now/1000;
    var gx=reduce?0:tx,gy=reduce?0:ty;
    if(idle&&!reduce){gx=Math.sin(t*.5)*.7;gy=Math.sin(t*.37)*.25}          // looks around when nobody touches
    boost+=((down?1.5:1)-boost)*Math.min(1,dt*10);
    vx+=((gx*boost-cx)*60-vx*9)*dt;vy+=((gy*boost-cy)*60-vy*9)*dt;           // soft spring, no snapping
    cx+=vx*dt;cy+=vy*dt;
    var breathe=1+Math.sin(t*1.6)*.006,hop=happy?Math.abs(Math.sin(t*9))*-10:0;
    inner.style.transform='translate3d('+(cx*26)+'px,'+(cy*12+hop)+'px,0) rotateY('+(cx*24)+'deg) rotateX('+(-cy*14)+'deg) rotateZ('+(cx*3)+'deg) scale('+(breathe*(down?1.04:1))+')';
  }
  requestAnimationFrame(frame);
})();

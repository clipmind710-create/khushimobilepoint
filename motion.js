// Jack-style motion for every page: FadeIn on scroll, Magnet (follows the mouse), scroll-reveal text, mouse parallax.
(function(){
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // FadeIn: whileInView, once, margin 50px
  var els=[].slice.call(document.querySelectorAll('[data-fade]'));
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('shown');io.unobserve(e.target)}})},{rootMargin:'50px'});
    els.forEach(function(el){io.observe(el)});
  }else els.forEach(function(el){el.classList.add('shown')});

  // Magnet: padding 150, strength 3, in .3s ease-out, out .6s ease-in-out
  function magnet(el,pad,str){
    el.style.willChange='transform';var active=false;
    addEventListener('pointermove',function(e){
      if(e.pointerType==='touch'||reduce)return;
      var r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      var near=Math.abs(cx-e.clientX)<r.width/2+pad&&Math.abs(cy-e.clientY)<r.height/2+pad;
      if(near){active=true;el.style.transition='transform .3s ease-out';
        el.style.transform='translate3d('+((e.clientX-cx)/str)+'px,'+((e.clientY-cy)/str)+'px,0)'}
      else if(active){active=false;el.style.transition='transform .6s ease-in-out';el.style.transform='translate3d(0,0,0)'}
    },{passive:true});
  }
  var m=document.getElementById('magnet');if(m)magnet(m,150,3);
  document.querySelectorAll('[data-magnet]').forEach(function(b){magnet(b,60,4)});

  // headings drift a little against the mouse
  var par=[].slice.call(document.querySelectorAll('[data-par]'));
  if(par.length&&!reduce)addEventListener('pointermove',function(e){
    if(e.pointerType==='touch')return;
    var x=(e.clientX/innerWidth-.5)*2,y=(e.clientY/innerHeight-.5)*2;
    par.forEach(function(p){var k=+p.getAttribute('data-par')||12;p.style.transform='translate3d('+(-x*k)+'px,'+(-y*k*.5)+'px,0)'});
  },{passive:true});

  // AnimatedText: each character goes .2 -> 1 with scroll (start .8 / end .2)
  var rvs=[].slice.call(document.querySelectorAll('.rv')).map(function(rv){
    var t=rv.textContent;rv.textContent='';rv.setAttribute('aria-label',t);
    var cs=[].map.call(t,function(c){var s=document.createElement('span');s.textContent=c;s.style.opacity=reduce?1:.2;s.style.transition='opacity .15s';rv.appendChild(s);return s});
    return {el:rv,cs:cs};
  });
  // Marquee: row1 moves right, row2 moves left, driven by scroll
  var mq=document.getElementById('mq'),r1=document.getElementById('m1'),r2=document.getElementById('m2');
  function setup(r){if(!r)return;var n=+r.getAttribute('data-n'),w=0;for(var i=0;i<n;i++)w+=432;r.style.marginLeft=(-w)+'px'}
  setup(r1);setup(r2);
  // Project cards stack: each scales down as the next one arrives
  var stack=document.getElementById('stack'),cards=stack?[].slice.call(stack.querySelectorAll('.pc')):[];
  var tick=false;
  function upd(){tick=false;if(reduce)return;
    rvs.forEach(function(o){var r=o.el.getBoundingClientRect(),a=innerHeight*.8,z=innerHeight*.2,
      p=Math.max(0,Math.min(1,(a-r.top)/((a-z)+r.height)));
      o.cs.forEach(function(s,i){var v=Math.max(0,Math.min(1,p*o.cs.length*1.15-i));s.style.opacity=.2+.8*v})});
    if(mq){var off=(scrollY-(mq.getBoundingClientRect().top+scrollY)+innerHeight)*.3;
      if(r1)r1.style.transform='translate3d('+(off-200)+'px,0,0)';if(r2)r2.style.transform='translate3d('+(-(off-200))+'px,0,0)'}
    if(stack){var sr=stack.getBoundingClientRect(),top=sr.top+scrollY,p=Math.max(0,Math.min(1,(scrollY-top)/(sr.height-innerHeight)));
      cards.forEach(function(c,i){var target=1-(cards.length-1-i)*.03,st=i*.25,q=Math.max(0,Math.min(1,(p-st)/(1-st)));
        c.style.transform='scale('+(1+(target-1)*q)+')'})}
  }
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});addEventListener('resize',upd);upd();
})();

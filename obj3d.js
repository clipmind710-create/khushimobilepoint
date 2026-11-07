// Drag-to-rotate 3D products with the Khushi Mobile Point logo. No libraries: plain WebGL.
(function(){
var cvs=document.getElementById('obj3d');if(!cvs)return;
var fb=document.getElementById('obj3dFb'),kind=cvs.getAttribute('data-model')||'charger';
var gl=cvs.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)return;
var PI=Math.PI;
// ---------- math ----------
function ident(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}
function mul(a,b){var o=new Float32Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o}
function chain(){var m=ident();for(var i=0;i<arguments.length;i++)m=mul(m,arguments[i]);return m}
function T(x,y,z){var m=ident();m[12]=x;m[13]=y;m[14]=z;return m}
function S(x,y,z){var m=ident();m[0]=x;m[5]=y===undefined?x:y;m[10]=z===undefined?x:z;return m}
function RX(a){var c=Math.cos(a),s=Math.sin(a),m=ident();m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m}
function RY(a){var c=Math.cos(a),s=Math.sin(a),m=ident();m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m}
function RZ(a){var c=Math.cos(a),s=Math.sin(a),m=ident();m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m}
function persp(f,asp,n,fa){var t=1/Math.tan(f/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(fa+n)/(n-fa);m[11]=-1;m[14]=2*fa*n/(n-fa);return m}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function nrm(a){var l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}
function pw(x,e){return(x<0?-1:1)*Math.pow(Math.abs(x),e)}
function xf(m,p){return[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]}
// ---------- geometry ----------
function pack(P,N,U,I){var g={p:new Float32Array(P),n:new Float32Array(N),t:new Float32Array(U),i:new Uint16Array(I),min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]};
  for(var k=0;k<P.length;k+=3)for(var a=0;a<3;a++){g.min[a]=Math.min(g.min[a],P[k+a]);g.max[a]=Math.max(g.max[a],P[k+a])}return g}
function grid(P,N,U,I,nu,nv){for(var i=0;i<nu;i++)for(var j=0;j<nv;j++){var a=i*(nv+1)+j,b=a+1,c=a+nv+1,d=c+1;I.push(a,c,b,b,c,d)}}
function superE(a,b,c,e1,e2,nu,nv){nu=nu||34;nv=nv||56;var P=[],N=[],U=[],I=[],h=1e-4;
  function f(u,v){var cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);return[a*pw(cu,e1)*pw(cv,e2),b*pw(su,e1),c*pw(cu,e1)*pw(sv,e2)]}
  for(var i=0;i<=nu;i++){var u=-PI/2+PI*i/nu;for(var j=0;j<=nv;j++){var v=-PI+2*PI*j/nv,p=f(u,v);
    var n=cross(sub(f(u,v+h),f(u,v-h)),sub(f(u+h,v),f(u-h,v))),l=Math.hypot(n[0],n[1],n[2]);
    if(!(l>1e-13))n=[p[0]/(a*a),p[1]/(b*b),p[2]/(c*c)];else if(dot(n,p)<0)n=[-n[0],-n[1],-n[2]];
    n=nrm(n);P.push(p[0],p[1],p[2]);N.push(n[0],n[1],n[2]);U.push(j/nv,i/nu)}}
  grid(P,N,U,I,nu,nv);return pack(P,N,U,I)}
function cyl(r1,r2,h,seg){seg=seg||28;var P=[],N=[],U=[],I=[],k,a,x,z;
  for(k=0;k<=seg;k++){a=2*PI*k/seg;x=Math.cos(a);z=Math.sin(a);P.push(x*r1,-h/2,z*r1,x*r2,h/2,z*r2);N.push(x,0,z,x,0,z);U.push(k/seg,0,k/seg,1)}
  for(k=0;k<seg;k++){var b=k*2;I.push(b,b+1,b+2,b+2,b+1,b+3)}
  [-1,1].forEach(function(s){var c0=P.length/3,r=s<0?r1:r2;P.push(0,s*h/2,0);N.push(0,s,0);U.push(.5,.5);
    for(k=0;k<=seg;k++){a=2*PI*k/seg;P.push(Math.cos(a)*r,s*h/2,Math.sin(a)*r);N.push(0,s,0);U.push(0,0)}
    for(k=0;k<seg;k++)I.push(c0,c0+1+k,c0+2+k)});
  return pack(P,N,U,I)}
function tube(path,r,seg){seg=seg||10;var P=[],N=[],U=[],I=[],n=path.length,fr=[],t,nn,i,k;
  for(i=0;i<n;i++){t=nrm(sub(path[Math.min(i+1,n-1)],path[Math.max(i-1,0)]));
    if(i===0){var ref=Math.abs(t[1])>.9?[1,0,0]:[0,1,0];nn=nrm(cross(ref,t))}else{var d=dot(nn,t);nn=nrm([nn[0]-t[0]*d,nn[1]-t[1]*d,nn[2]-t[2]*d])}
    fr.push([t,nn,cross(t,nn)])}
  for(i=0;i<n;i++){var rr=typeof r==='function'?r(i/(n-1)):r;for(k=0;k<=seg;k++){var a=2*PI*k/seg,c=Math.cos(a),s=Math.sin(a),q=fr[i];
    var nx=q[1][0]*c+q[2][0]*s,ny=q[1][1]*c+q[2][1]*s,nz=q[1][2]*c+q[2][2]*s;
    P.push(path[i][0]+nx*rr,path[i][1]+ny*rr,path[i][2]+nz*rr);N.push(nx,ny,nz);U.push(k/seg,i/(n-1))}}
  for(i=0;i<n-1;i++)for(k=0;k<seg;k++){var a0=i*(seg+1)+k,b0=a0+1,c0=a0+seg+1,d0=c0+1;I.push(a0,c0,b0,b0,c0,d0)}
  [0,n-1].forEach(function(e){var c0=P.length/3,tt=fr[e][0],sg=e?1:-1,rr=typeof r==='function'?r(e?1:0):r;P.push(path[e][0],path[e][1],path[e][2]);N.push(tt[0]*sg,tt[1]*sg,tt[2]*sg);U.push(0,0);
    for(k=0;k<=seg;k++){var a=2*PI*k/seg,c=Math.cos(a),s=Math.sin(a),q=fr[e];P.push(path[e][0]+(q[1][0]*c+q[2][0]*s)*rr,path[e][1]+(q[1][1]*c+q[2][1]*s)*rr,path[e][2]+(q[1][2]*c+q[2][2]*s)*rr);N.push(tt[0]*sg,tt[1]*sg,tt[2]*sg);U.push(0,0)}
    for(k=0;k<seg;k++)I.push(c0,c0+1+k,c0+2+k)});
  return pack(P,N,U,I)}
function quad(w,h){return pack([-w/2,-h/2,0,w/2,-h/2,0,w/2,h/2,0,-w/2,h/2,0],[0,0,1,0,0,1,0,0,1,0,0,1],[0,0,1,0,1,1,0,1],[0,1,2,0,2,3])}
function spline(c,per){var o=[],i,j;for(i=0;i<c.length-1;i++){var p0=c[Math.max(i-1,0)],p1=c[i],p2=c[i+1],p3=c[Math.min(i+2,c.length-1)];
  for(j=0;j<per;j++){var t=j/per,t2=t*t,t3=t2*t;o.push([0,1,2].map(function(k){return .5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)}))}}
  o.push(c[c.length-1]);return o}
function helix(R,turns,z0,z1,n,cx,cy){var o=[];for(var i=0;i<=n;i++){var s=i/n,a=turns*2*PI*s;o.push([cx+R*Math.cos(a),cy+R*Math.sin(a),z0+(z1-z0)*s])}return o}
function circle(R,n,cx,cy,z){var o=[];for(var i=0;i<=n;i++){var a=2*PI*i/n;o.push([cx+R*Math.cos(a),cy+R*Math.sin(a),z])}return o}
// ---------- textures (logo is drawn from the shop name) ----------
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function cv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
function logoTo(c,x,y,w,h){c.save();c.translate(x,y);c.scale(w/1024,h/512);
  var g=c.createLinearGradient(0,0,1024,512);g.addColorStop(0,'#18011F');g.addColorStop(.37,'#B600A8');g.addColorStop(.72,'#7621B0');g.addColorStop(1,'#BE4C00');
  rr(c,8,8,1008,496,110);c.fillStyle=g;c.fill();c.lineWidth=10;c.strokeStyle='rgba(255,255,255,.92)';c.stroke();
  c.fillStyle='#fff';c.beginPath();c.arc(165,256,118,0,2*PI);c.fill();
  rr(c,125,178,80,156,16);c.fillStyle='#7621B0';c.fill();rr(c,134,194,62,106,8);c.fillStyle='#e9c8ff';c.fill();c.beginPath();c.arc(165,318,6,0,2*PI);c.fillStyle='#fff';c.fill();
  c.fillStyle='#fff';c.textBaseline='alphabetic';c.font='900 150px Kanit,"Arial Black",Arial,sans-serif';c.fillText('KHUSHI',315,290);
  c.font='600 62px Kanit,Arial,sans-serif';c.fillText('MOBILE POINT',320,378);c.restore()}
function drawLogo(){var c=cv(1024,512),x=c.getContext('2d');x.clearRect(0,0,1024,512);logoTo(x,0,0,1024,512);return c}
function drawWall(){var c=cv(512,1024),x=c.getContext('2d');rr(x,0,0,512,1024,56);x.save();x.clip();
  var g=x.createLinearGradient(0,0,512,1024);g.addColorStop(0,'#ffd21a');g.addColorStop(.5,'#ff8a00');g.addColorStop(1,'#d63a00');x.fillStyle=g;x.fillRect(0,0,512,1024);
  x.fillStyle='rgba(255,255,255,.14)';for(var i=0;i<6;i++){x.beginPath();x.moveTo(-100+i*150,0);x.lineTo(60+i*150,0);x.lineTo(-340+i*150,1024);x.lineTo(-500+i*150,1024);x.fill()}
  x.fillStyle='#fff';x.font='600 30px Arial,sans-serif';x.fillText('10:30',40,70);x.fillText('\u25CF\u25CF\u25CF',400,70);
  logoTo(x,56,396,400,200);x.font='500 28px Kanit,Arial,sans-serif';x.textAlign='center';x.fillText('Sapotra',256,650);x.restore();return c}
function drawLcd(){var c=cv(512,256),x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#b5e0a4');g.addColorStop(1,'#86bf8f');x.fillStyle=g;x.fillRect(0,0,512,256);
  x.fillStyle='#17331c';x.font='600 26px Arial,sans-serif';x.fillText('\u25B2 .ill  10:30',16,38);x.textAlign='center';x.font='900 92px Kanit,"Arial Black",Arial,sans-serif';x.fillText('KHUSHI',256,150);
  x.font='600 38px Kanit,Arial,sans-serif';x.fillText('MOBILE POINT',256,206);x.fillRect(0,230,512,3);return c}
var TX={logo:{draw:drawLogo},wall:{draw:drawWall},lcd:{draw:drawLcd}};
function upTex(k){var t=TX[k];t.canvas=t.draw();if(!t.tex)t.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t.tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,t.canvas);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
// ---------- materials & models ----------
function mat(c,sp,sh,me,o){var m={c:c,sp:sp,sh:sh,me:me||0,em:0,a:1,tex:null,decal:false};if(o)for(var k in o)m[k]=o[k];return m}
var M={white:mat([.93,.94,.96],.5,40,.04),steel:mat([.8,.82,.86],1,90,.85),gold:mat([.84,.68,.38],1,70,.8),red:mat([.96,.07,.09],.6,50,0),black:mat([.06,.06,.08],.7,70,.1),
 dark:mat([.15,.16,.19],.5,40,.05),navy:mat([.08,.09,.13],.6,55,.22),rubber:mat([.09,.09,.1],.2,12,0),cord:mat([.9,.89,.82],.25,20,0),grey:mat([.62,.64,.68],.4,30,.05),
 blue:mat([.45,.7,.9],.4,30,0),green:mat([.2,.95,.45],.4,30,0,{em:1}),
 logo:mat([1,1,1],.5,60,0,{tex:'logo',decal:true,em:.12}),wall:mat([1,1,1],.9,90,0,{tex:'wall',decal:true,em:.9}),lcd:mat([1,1,1],.4,50,0,{tex:'lcd',decal:true,em:.92})};
var parts=[];function add(g,m,mt){parts.push({g:g,m:m||ident(),mat:mt})}
function LG(w,x,y,z,ry,rx){add(quad(w,w/2),chain(T(x,y,z),RY(ry||0),RX(rx||0)),M.logo)}
function plugA(x,y,z,rz){add(superE(.15,.26,.05,.3,.3),chain(T(x,y,z),RZ(rz||0),T(0,.22,0)),M.steel);add(superE(.19,.2,.09,.3,.3),chain(T(x,y,z),RZ(rz||0),T(0,-.14,0)),M.white)}
function plugC(x,y,z,rz){add(superE(.1,.2,.045,.5,.5),chain(T(x,y,z),RZ(rz||0),T(0,.2,0)),M.steel);add(superE(.15,.2,.08,.3,.3),chain(T(x,y,z),RZ(rz||0),T(0,-.12,0)),M.white)}
function tag(x,y,z,w){add(superE(w*.5,w*.27,.018,.2,.2),T(x,y,z),M.dark);LG(w*.92,x,y,z+.02,0);LG(w*.92,x,y,z-.02,PI)}
var MODELS={
 charger:function(){add(superE(.8,.8,.45,.22,.22),T(-.25,.35,-.1),M.white);
  [.27,-.27].forEach(function(o){add(cyl(.07,.07,.5,20),chain(T(-1.2,.35+o,-.1),RZ(PI/2)),M.steel)});
  LG(1.15,-.25,.5,.36,0);LG(1.15,-.25,.2,-.56,PI);
  add(tube(helix(.5,5,.3,.8,200,.55,-.5),.06,10),ident(),M.red);
  add(tube(spline([[1.05,-.5,.8],[1.25,-.1,.85],[1.2,.3,.85]],8),.06,10),ident(),M.red);plugA(1.2,.55,.85,0)},
 cable:function(){add(tube(helix(.75,5.5,-.3,.3,260,0,-.2),.075,10),ident(),M.red);
  add(tube(circle(.86,60,0,-.2,0),.1,10),ident(),M.white);
  add(tube(spline([[.75,-.2,-.3],[.82,.3,-.3],[.7,.8,-.3],[.7,1.05,-.3]],10),.075,10),ident(),M.red);plugA(.7,1.3,-.3,0);
  add(tube(spline([[-.75,-.2,.3],[-.82,.3,.3],[-.7,.8,.3],[-.7,1.05,.3]],10),.075,10),ident(),M.red);plugC(-.7,1.28,.3,0);
  add(tube([[0,-1.02,0],[0,-1.2,0]],.025,6),ident(),M.steel);tag(0,-1.55,0,.95)},
 battery:function(){add(superE(.95,1.28,.12,.16,.16),ident(),M.navy);
  add(superE(.34,.07,.02,.3,.3),T(-.45,1.36,0),M.gold);add(superE(.2,.1,.07,.3,.3),T(-.45,1.45,0),M.black);
  add(superE(.7,.1,.012,.3,.3),T(.2,-.95,.125),M.grey);add(superE(.7,.1,.012,.3,.3),T(.2,-.95,-.125),M.grey);
  LG(1.55,0,.15,.131,0);LG(1.55,0,.15,-.131,PI)},
 display:function(){add(superE(.85,1.75,.07,.12,.12),ident(),M.black);
  add(quad(1.58,3.4),T(0,0,.076),M.wall);
  add(tube(spline([[-.3,-1.7,-.07],[-.3,-1.3,-.075],[.2,-1.1,-.075]],8),.035,6),ident(),M.blue);
  add(superE(.3,.06,.012,.3,.3),T(-.2,-1.52,-.078),M.gold);LG(1.15,0,.3,-.08,PI)},
 earbuds:function(){add(superE(1.1,.62,.66,.25,.25),T(0,-.5,0),M.dark);add(superE(1.105,.018,.665,.1,.1),T(0,-.2,0),M.black);
  [-1,1].forEach(function(s){add(superE(.27,.25,.25,1,1),chain(T(s*.46,.62,0),RZ(-s*.3)),M.black);
   add(cyl(.09,.075,.8,18),chain(T(s*.4,.2,0),RZ(-s*.2)),M.black);add(superE(.05,.05,.04,1,1),T(s*.58,.42,.26),M.steel)});
  add(superE(.07,.07,.03,1,1),T(0,-1.03,.665),M.green);LG(1.25,0,-.62,.67,0);LG(1.25,0,-.62,-.67,PI)},
 earphone:function(){[-1,1].forEach(function(s){var g=chain(T(s*.95,1.0,0),RZ(-s*.35));
   add(cyl(.17,.17,.4,22),chain(g,T(0,0,0)),M.black);add(cyl(.2,.2,.1,24),chain(g,T(0,.24,0)),M.gold);add(superE(.13,.1,.13,1,1),chain(g,T(0,.36,0)),M.rubber);
   add(tube(spline([[s*.95-s*.07,.8,0],[s*.9,.25,0],[s*.45,-.45,0],[0,-.85,0]],12),.055,8),ident(),M.cord)});
  add(cyl(.07,.07,.2,14),T(0,-.85,0),M.black);add(tube(spline([[0,-.85,0],[0,-1.4,0],[0,-1.85,0]],10),.055,8),ident(),M.cord);
  add(superE(.15,.34,.11,.3,.3),T(0,-1.3,0),M.black);add(cyl(.05,.05,.1,12),T(0,-1.3,.09),M.steel);
  add(cyl(.09,.09,.28,16),T(0,-2.0,0),M.black);add(cyl(.055,.055,.5,16),T(0,-2.4,0),M.steel);
  add(tube([[0,-.85,0],[.4,-1.0,0]],.02,6),ident(),M.grey);tag(.75,-1.1,0,1.05)},
 keypad:function(){add(superE(.62,1.25,.17,.25,.25),ident(),M.dark);add(superE(.5,.3,.01,.2,.2),T(0,.62,.168),M.black);
  add(quad(.92,.46),T(0,.62,.182),M.lcd);
  add(superE(.1,.06,.03,.5,.5),T(-.3,.2,.19),M.green);add(superE(.1,.06,.03,.5,.5),T(.3,.2,.19),M.red);add(superE(.12,.12,.035,1,1),T(0,.2,.19),M.grey);
  for(var r=0;r<4;r++)for(var c=-1;c<=1;c++)add(superE(.15,.075,.032,.45,.45),T(c*.34,-.08-r*.24,.185),M.grey);
  LG(1.0,0,.15,-.172,PI)}
};
(MODELS[kind]||MODELS.charger)();
// auto-centre and scale the model to a fixed size
var mn=[1e9,1e9,1e9],mxx=[-1e9,-1e9,-1e9];
parts.forEach(function(p){for(var i=0;i<8;i++){var q=xf(p.m,[i&1?p.g.max[0]:p.g.min[0],i&2?p.g.max[1]:p.g.min[1],i&4?p.g.max[2]:p.g.min[2]]);for(var a=0;a<3;a++){mn[a]=Math.min(mn[a],q[a]);mxx[a]=Math.max(mxx[a],q[a])}}});
var size=Math.max(mxx[0]-mn[0],mxx[1]-mn[1],mxx[2]-mn[2]),sc=3.3/Math.hypot(mxx[0]-mn[0],mxx[1]-mn[1],mxx[2]-mn[2]),ctr=[(mn[0]+mxx[0])/2,(mn[1]+mxx[1])/2,(mn[2]+mxx[2])/2],FIT=chain(S(sc),T(-ctr[0],-ctr[1],-ctr[2]));
parts.forEach(function(p){p.F=mul(FIT,p.m)});
// ---------- GL ----------
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o}
var VS='attribute vec3 aP,aN;attribute vec2 aT;uniform mat4 uMV,uP;uniform mat3 uNM;varying vec3 vN,vV;varying vec2 vT;void main(){vec4 p=uMV*vec4(aP,1.);vV=p.xyz;vN=uNM*aN;vT=aT;gl_Position=uP*p;}';
var FS='precision mediump float;varying vec3 vN,vV;varying vec2 vT;uniform vec3 uC;uniform float uSp,uSh,uMe,uEm,uTex,uA;uniform sampler2D uTx;'+
'void main(){vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;vec3 v=normalize(-vV);vec3 base=uC;float a=uA;if(uTex>.5){vec4 t=texture2D(uTx,vT);base=t.rgb;a*=t.a;}'+
'vec3 l1=normalize(vec3(.5,.8,.7)),l2=normalize(vec3(-.8,.2,.4));float d1=max(dot(n,l1),0.),d2=max(dot(n,l2),0.);'+
'vec3 amb=mix(vec3(.2,.19,.22),vec3(.46,.47,.52),n.y*.5+.5);vec3 lit=base*(amb+d1*.85+d2*.3);'+
'vec3 h1=normalize(l1+v);float s=pow(max(dot(n,h1),0.),uSh)*uSp;'+
'vec3 r=reflect(-v,n);float env=smoothstep(-.3,.9,r.y);vec3 ec=mix(vec3(.06,.06,.08),vec3(.92,.94,1.),env)+vec3(.5)*pow(max(dot(r,l1),0.),24.);'+
'lit=mix(lit,ec*base*1.1+base*.1,uMe);float rim=pow(1.-max(dot(n,v),0.),3.);vec3 col=lit+vec3(s)+rim*.07;col=mix(col,base*1.05,uEm);gl_FragColor=vec4(col,a);}';
var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
var L={};['uMV','uP','uNM','uC','uSp','uSh','uMe','uEm','uTex','uA','uTx'].forEach(function(n){L[n]=gl.getUniformLocation(pr,n)});
var A={p:gl.getAttribLocation(pr,'aP'),n:gl.getAttribLocation(pr,'aN'),t:gl.getAttribLocation(pr,'aT')};
function buf(t,d){var b=gl.createBuffer();gl.bindBuffer(t,b);gl.bufferData(t,d,gl.STATIC_DRAW);return b}
parts.forEach(function(p){var g=p.g;if(!g.bp){g.bp=buf(gl.ARRAY_BUFFER,g.p);g.bn=buf(gl.ARRAY_BUFFER,g.n);g.bt=buf(gl.ARRAY_BUFFER,g.t);g.bi=buf(gl.ELEMENT_ARRAY_BUFFER,g.i)}});
Object.keys(TX).forEach(upTex);if(document.fonts&&document.fonts.load)document.fonts.load('900 60px Kanit').then(function(){Object.keys(TX).forEach(upTex)},function(){});
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);gl.uniform1i(L.uTx,0);
function drawPart(p,VR){var m=p.mat,mv=mul(VR,p.F),g=p.g;
  gl.uniformMatrix4fv(L.uMV,false,mv);gl.uniformMatrix3fv(L.uNM,false,[mv[0],mv[1],mv[2],mv[4],mv[5],mv[6],mv[8],mv[9],mv[10]]);
  gl.uniform3fv(L.uC,m.c);gl.uniform1f(L.uSp,m.sp);gl.uniform1f(L.uSh,m.sh);gl.uniform1f(L.uMe,m.me);gl.uniform1f(L.uEm,m.em);gl.uniform1f(L.uA,m.a);gl.uniform1f(L.uTex,m.tex?1:0);
  if(m.tex){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,TX[m.tex].tex)}
  gl.bindBuffer(gl.ARRAY_BUFFER,g.bp);gl.enableVertexAttribArray(A.p);gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,g.bn);gl.enableVertexAttribArray(A.n);gl.vertexAttribPointer(A.n,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,g.bt);gl.enableVertexAttribArray(A.t);gl.vertexAttribPointer(A.t,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.bi);gl.drawElements(gl.TRIANGLES,g.i.length,gl.UNSIGNED_SHORT,0)}
// ---------- orbit controls: drag to look from any side ----------
var yaw=-1.1,pitch=.28,vy=0,vp=0,drag=false,lx=0,ly=0,lastUse=-1e9,hint=document.querySelector('.hint');
cvs.style.display='block';if(fb)fb.style.display='none';
cvs.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;ly=e.clientY;lastUse=performance.now();try{cvs.setPointerCapture(e.pointerId)}catch(x){}cvs.style.cursor='grabbing';if(hint)hint.style.opacity=0;e.preventDefault()});
addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;vy=dx*.012;vp=dy*.012;yaw+=vy;pitch=Math.max(-1.5,Math.min(1.5,pitch+vp));lastUse=performance.now()});
function up(){if(drag){drag=false;cvs.style.cursor='grab';lastUse=performance.now()}}
addEventListener('pointerup',up);addEventListener('pointercancel',up);
var visible=true;if(window.IntersectionObserver)new IntersectionObserver(function(es){visible=es[0].isIntersecting},{threshold:0}).observe(cvs);
function size_(){var r=Math.min(devicePixelRatio||1,2),b=cvs.getBoundingClientRect();cvs.width=Math.max(2,b.width*r);cvs.height=Math.max(2,b.height*r);gl.viewport(0,0,cvs.width,cvs.height)}
if(window.ResizeObserver)new ResizeObserver(size_).observe(cvs);size_();
var P=persp(.56,1,1,30),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
function frame(now){requestAnimationFrame(frame);if(!visible)return;
  if(!drag){yaw+=vy;pitch=Math.max(-1.5,Math.min(1.5,pitch+vp));vy*=.94;vp*=.94;
    if(now-lastUse>2200){if(!reduce)yaw+=.006;pitch+=(.28-pitch)*.02}}
  var R=mul(RX(pitch),RY(yaw)),VR=mul(T(0,0,-6.4),R);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(L.uP,false,P);
  gl.disable(gl.POLYGON_OFFSET_FILL);gl.disable(gl.CULL_FACE);
  parts.forEach(function(p){if(!p.mat.decal)drawPart(p,VR)});
  gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2,-2);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
  parts.forEach(function(p){if(p.mat.decal)drawPart(p,VR)});
  gl.disable(gl.CULL_FACE);gl.disable(gl.POLYGON_OFFSET_FILL)}
requestAnimationFrame(frame);
window.__obj3d={set:function(y,p){yaw=y;pitch=p;lastUse=performance.now();vy=vp=0}};
})();

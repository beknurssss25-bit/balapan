(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
function rnd(n){return Math.floor(Math.random()*n)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=rnd(i+1),t=a[i];a[i]=a[j];a[j]=t}return a}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
var store={get:function(k,d){try{var v=localStorage.getItem('balapan-'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem('balapan-'+k,JSON.stringify(v))}catch(e){}}};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function pop(e){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}
function toast(t){var x=$('toast');x.textContent=t;x.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){x.classList.remove('show')},2200)}

/* ---------- Theme ---------- */
var theme=store.get('theme',(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');
function applyTheme(){document.documentElement.setAttribute('data-theme',theme);$('themeBtn').textContent=theme==='dark'?'☀️':'🌙';$('themeBtn').setAttribute('aria-label',theme==='dark'?'Күндізгі режим':'Түнгі режим')}
$('themeBtn').onclick=function(){theme=theme==='dark'?'light':'dark';store.set('theme',theme);applyTheme()};applyTheme();

/* ---------- Sound ---------- */
var soundOn=store.get('sound',true),actx=null;
function applySound(){$('soundBtn').textContent=soundOn?'🔊':'🔇';$('soundBtn').setAttribute('aria-pressed',String(soundOn));$('soundBtn').setAttribute('aria-label',soundOn?'Дыбысты өшіру':'Дыбысты қосу')}
$('soundBtn').onclick=function(){soundOn=!soundOn;store.set('sound',soundOn);applySound();if(!soundOn)stopSay();toast(soundOn?'🔊 Дыбыс қосулы':'🔇 Дыбыс өшірулі')};applySound();
function tone(freqs,dur,type){if(!soundOn)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();var t=actx.currentTime;
freqs.forEach(function(f,i){var o=actx.createOscillator(),g=actx.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t+i*dur);g.gain.exponentialRampToValueAtTime(0.18,t+i*dur+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+(i+1)*dur);o.connect(g);g.connect(actx.destination);o.start(t+i*dur);o.stop(t+(i+1)*dur+0.05)})}catch(e){}}
var sfx={ok:function(){tone([523,659,784],0.11)},bad:function(){tone([220,180],0.14,'triangle')},tap:function(){tone([660],0.06)}};

/* ---------- Speech: bundled natural Kazakh clips, speechSynthesis only as fallback ---------- */
var BD=window.BD,AMAP=window.BALAPAN_AUDIO||{},synth=window.speechSynthesis||null,voice=null,player=null,sq=[],sqTimer=0;
function pickVoice(){if(synth){var v=synth.getVoices();voice=v.find(function(x){return /^kk/i.test(x.lang)})||v.find(function(x){return /^ru/i.test(x.lang)})||null}
$('voiceNote').textContent='🔊 Табиғи қазақша дауыс (офлайн аудио).'}
function stopSay(){sq=[];clearTimeout(sqTimer);if(player){try{player.pause()}catch(e){}player.onended=player.onerror=null;player=null}if(synth)try{synth.cancel()}catch(e){}}
function fallback(t,next){try{if(!synth||!voice||!t){next();return}var u=new SpeechSynthesisUtterance(t.replace(/^[A-Z+\-]+:/,''));u.voice=voice;u.lang=voice.lang;u.rate=.8;u.pitch=1.1;u.onend=u.onerror=next;synth.speak(u)}catch(e){next()}}
function clean(k){return String(k).replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u200D]/gu,'').replace(/\s+/g,' ').trim()}
var AV='5';
function playNext(){if(!sq.length)return;var k=sq.shift(),f=AMAP[k]||AMAP[clean(k)],done=false;
 var next=function(){if(done)return;done=true;if(player){player.onended=player.onerror=null}player=null;sqTimer=setTimeout(playNext,120)};
 if(!f){fallback(clean(k),next);return}
 var a=new Audio('audio/'+f+'?v='+AV);player=a;a.onended=next;
 /* fallback to speechSynthesis ONLY if the clip never started (never in addition to it) */
 var started=false;a.onplaying=function(){started=true};
 a.onerror=function(){if(done||player!==a)return;if(started){next();return}a.onended=a.onerror=null;fallback(clean(k),next)};
 var pr=a.play();if(pr&&pr.catch)pr.catch(function(){if(player===a&&!started){a.onended=a.onerror=null;player=null;done=true}})}
/* say(key) or say([key1,key2,...]) — plays clips in sequence; identical request within 500ms is ignored (double tap / ghost click) */
var lastSay='',lastSayT=0;
function say(k){if(!soundOn)return;var id=JSON.stringify(k),now=Date.now();if(id===lastSay&&now-lastSayT<500)return;lastSay=id;lastSayT=now;stopSay();sq=(Array.isArray(k)?k:[k]).filter(Boolean);playNext()}
if(synth){pickVoice();synth.onvoiceschanged=pickVoice}else pickVoice();
function praiseKey(t){var c=clean(t);return BD.PRAISE.filter(function(p){return c.indexOf(p)===0})[0]}

/* ---------- Levels (shared) ---------- */
function Levels(id,n,onPick){var me=this;me.key='lv-'+id;me.n=n;me.unlocked=Math.min(n,store.get(me.key,1));me.cur=Math.min(me.unlocked,store.get(me.key+'-cur',1));me.box=$(id+'Lv');me.onPick=onPick;me.render()}
Levels.prototype.render=function(){var me=this;me.box.innerHTML='';for(var i=1;i<=me.n;i++)(function(i){var lock=i>me.unlocked,b=el('button','chip lv'+(i===me.cur?' on':'')+(lock?' locked':''),(lock?'🔒 ':'')+'Деңгей '+i);
 b.disabled=lock;b.setAttribute('aria-pressed',String(i===me.cur));b.onclick=function(){me.set(i,true)};me.box.appendChild(b)})(i)};
Levels.prototype.set=function(i,announce){this.cur=i;store.set(this.key+'-cur',i);this.render();if(announce)say('LV:'+i);this.onPick(i)};
/* called after a level is completed; returns true if moved to a new level */
Levels.prototype.win=function(src){var me=this;if(me.cur<me.n){if(me.cur+1>me.unlocked){me.unlocked=me.cur+1;store.set(me.key,me.unlocked)}
 var nx=me.cur+1;toast('🎉 Жаңа деңгей ашылды! Деңгей '+nx);confetti(null,null,180);setTimeout(function(){say(['Келесі деңгей!','LV:'+nx]);me.set(nx,false)},1700);return true}
 toast('🏆 Барлық деңгейден өттің!');confetti(null,null,220);setTimeout(function(){say('Барлық деңгейден өттің! Сен нағыз чемпионсың!')},900);return false};
function progress(id,k,need){$(id).textContent='⭐ '+k+'/'+need}

/* ---------- Confetti ---------- */
var cv=$('confetti'),cx=cv.getContext('2d'),parts=[],raf=0;
function sizeCv(){var d=window.devicePixelRatio||1;cv.width=innerWidth*d;cv.height=innerHeight*d;cx.setTransform(d,0,0,d,0,0)}sizeCv();addEventListener('resize',sizeCv);
var CC=['#FF6B6B','#FAB005','#40C057','#339AF0','#7048E8','#F06595'];
function confetti(x,y,n){if(reduce)return;x=x==null?innerWidth/2:x;y=y==null?innerHeight/2:y;for(var i=0;i<(n||60);i++){var a=Math.random()*Math.PI*2,s=4+Math.random()*7;
parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-4,r:4+Math.random()*5,c:CC[rnd(CC.length)],rot:Math.random()*6,vr:Math.random()*.3-.15,life:90+rnd(40),star:Math.random()<.25})}
if(!raf)raf=requestAnimationFrame(tick)}
function tick(){cx.clearRect(0,0,innerWidth,innerHeight);parts=parts.filter(function(p){return p.life-->0&&p.y<innerHeight+40});
parts.forEach(function(p){p.vy+=.22;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);cx.globalAlpha=Math.min(1,p.life/30);cx.fillStyle=p.c;
if(p.star){cx.font=(p.r*3)+'px sans-serif';cx.fillText('⭐',0,0)}else cx.fillRect(-p.r,-p.r/2,p.r*2,p.r);cx.restore()});
raf=parts.length?requestAnimationFrame(tick):0}
function centerOf(e){if(!e||!e.getBoundingClientRect)return [null,null];var r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}

/* ---------- Stars & rewards ---------- */
var stars=store.get('stars',0);var MED=[[10,'🥉 Қола марапат'],[25,'🥈 Күміс марапат'],[50,'🥇 Алтын марапат'],[100,'🏆 Чемпион']];
function renderStars(){$('starCount').textContent=stars;var next=MED.find(function(m){return stars<m[0]});
[].forEach.call(document.querySelectorAll('.medal'),function(m){m.classList.toggle('got',stars>=+m.dataset.need)});
var prev=0;MED.forEach(function(m){if(stars>=m[0])prev=m[0]});
$('rewardBar').style.width=(next?Math.round((stars-prev)/(next[0]-prev)*100):100)+'%';
$('rewardText').textContent=next?('Келесі марапатқа дейін '+(next[0]-stars)+' жұлдыз қалды!'):'Сен — нағыз чемпионсың! 🏆'}
function addStar(src){stars++;store.set('stars',stars);var b=$('starBtn');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');
var c=centerOf(src);confetti(c[0],c[1],50);sfx.ok();MED.forEach(function(m){if(stars===m[0]){toast('Құттықтаймыз! '+m[1]+' алдың!');setTimeout(function(){say('Құттықтаймыз! Сен марапат алдың!')},1200);confetti(null,null,140)}});renderStars()}
$('starBtn').onclick=function(){location.hash='#rewards'};
$('resetStars').onclick=function(){if(confirm('Жұлдыздарды нөлдейміз бе?')){stars=0;store.set('stars',0);renderStars()}};renderStars();
var praise=['Жарайсың! 🎉','Керемет! 🌟','Тамаша! 👏','Өте жақсы! 💪','Бәрекелді! 🥳'];
function good(){return praise[rnd(praise.length)]}var tryMsg='Қайта байқап көр! 🙂';
function fb(id,ok,t){var f=$(id);f.textContent=t||(ok?good():tryMsg);f.className='fb '+(ok?'ok':'bad');pop(f);if(!ok){sfx.bad();say('Қайта байқап көр!')}}

/* ---------- 1. Alphabet ---------- */
var A=BD.A;
var L=$('letters'),curL=A[0];
A.forEach(function(a){var b=el('button',null,a[0]);b.setAttribute('aria-label',a[0]+' — '+a[2]);
b.onclick=function(){[].forEach.call(L.children,function(c){c.classList.remove('on')});b.classList.add('on');var s=$('letterShow');
s.children[0].textContent=a[0]+' '+a[0].toLowerCase();s.children[1].textContent=a[1];s.children[2].textContent=a[2];curL=a;pop(s);sfx.tap();say('L:'+a[0])};L.appendChild(b)});
$('sayLetter').onclick=function(){say(curL[2])};

/* ---------- 2. Numbers (levels: 1–5, 1–10, 6–15, 11–20) ---------- */
var OBJ=['🍎','⭐','🐤','🎈','🌸','🍓','🐟','🚗','🦋','🍪'],cur=1,numLock=false,numOk=0,NEED=5;
var numLv=new Levels('num',BD.LV.count.length,function(){numOk=0;buildNumBtns();newCount()});
function buildNumBtns(){var r=BD.LV.count[numLv.cur-1],box=$('numBtns');box.innerHTML='';box.classList.toggle('wide',r[1]-r[0]>=10);
for(var n=r[0];n<=r[1];n++)(function(n){var b=el('button',null,n);b.onclick=function(){if(numLock)return;
if(n===cur){numLock=true;numOk++;progress('numProg',numOk,NEED);fb('numFb',true,good()+' '+n+' — '+BD.num(n));say(BD.num(n));addStar(b);
 setTimeout(function(){$('numFb').textContent='';if(numOk>=NEED&&numLv.win(b))return;if(numOk>=NEED)numOk=0;newCount()},1500)}else fb('numFb',false)};box.appendChild(b)})(n)}
function newCount(){var r=BD.LV.count[numLv.cur-1],prev=cur;do{cur=r[0]+rnd(r[1]-r[0]+1)}while(cur===prev&&r[1]>r[0]);var o=OBJ[rnd(OBJ.length)],box=$('countBox');box.innerHTML='';box.dataset.n=cur;box.classList.toggle('many',cur>10);
for(var i=0;i<cur;i++){var s=el('span',null,o);s.style.animationDelay=(i*50)+'ms';box.appendChild(s)}numLock=false;progress('numProg',numOk,NEED)}
$('countBox').onclick=function(){say('Неше зат бар?')};
buildNumBtns();newCount();

/* ---------- 3. Colors & shapes (levels: colours, shapes, mixed, 6 cards colour+shape) ---------- */
var C=BD.C,S=BD.S,colorLock=false,colOk=0,colQ='';
var colLv=new Levels('col',BD.LV.color.length,function(){colOk=0;newColor()});
function newColor(){colorLock=false;var cf=BD.LV.color[colLv.cur-1],N=cf.n,mode=cf.mode[rnd(cf.mode.length)],opts=[],keys={},guard=0;
while(opts.length<N&&guard++<500){var c=rnd(C.length),s=rnd(S.length);var dup=mode===0?keys[c+'_'+s]:(keys['c'+c]||keys['s'+s]);
 if(mode===0&&N>S.length){if(!keys[c+'_'+s]&&!keys['c'+c]){keys[c+'_'+s]=keys['c'+c]=1;opts.push([c,s])}}else if(!dup&&!keys['c'+c]&&!keys['s'+s]){keys['c'+c]=keys['s'+s]=keys[c+'_'+s]=1;opts.push([c,s])}}
var target=opts[rnd(opts.length)];
var q=mode===0?(C[target[0]][0]+' '+S[target[1]][0]):mode===1?(C[target[0]][0]+' түсті пішін'):S[target[1]][0];colQ='Q:'+q;
$('colorQ').innerHTML='Тап: <b>'+q+'</b> 👀';$('colorFb').textContent='';progress('colProg',colOk,NEED);
var box=$('colorBtns');box.innerHTML='';box.classList.toggle('six',N>4);opts.forEach(function(o){var b=el('button',null,'<svg viewBox="0 0 100 100" fill="'+C[o[0]][1]+'">'+S[o[1]][1]+'</svg>');b.setAttribute('aria-label',C[o[0]][0]+' '+S[o[1]][0]);
var ok=mode===0?(o[0]===target[0]&&o[1]===target[1]):mode===1?o[0]===target[0]:o[1]===target[1];if(ok)b.dataset.ok='1';
b.onclick=function(){if(colorLock)return;if(ok){colorLock=true;colOk++;progress('colProg',colOk,NEED);var g=good();fb('colorFb',true,g);pop(b);say([praiseKey(g),C[o[0]][0]+' '+S[o[1]][0]]);addStar(b);
 setTimeout(function(){if(colOk>=NEED&&colLv.win(b))return;if(colOk>=NEED)colOk=0;newColor()},1500)}else fb('colorFb',false)};box.appendChild(b)})}
$('colorQ').addEventListener('click',function(){say(colQ)});
newColor();

/* ---------- 4. Animals ---------- */
var AN=BD.AN;
AN.forEach(function(a){var b=el('button',null,a[0]+'<small>'+a[1]+'</small>');b.setAttribute('aria-label',a[1]);
b.onclick=function(){b.classList.add('on');pop(b);sfx.tap();say(a[1])};$('animalGrid').appendChild(b)});

/* ---------- 5. Memory (levels: 3,4,6,8,10,12 pairs) ---------- */
var first=null,lock=false,moves=0,found=0,memPairs=3,memT=0;
var memLv=new Levels('mem',BD.LV.mem.length,function(){newMem()});
function newMem(){clearTimeout(memT);memPairs=BD.LV.mem[memLv.cur-1];var e=shuffle(BD.MEM).slice(0,memPairs),d=shuffle(e.concat(e)),g=$('memGrid');g.innerHTML='';first=null;lock=false;moves=0;found=0;$('moves').textContent=0;$('memFb').textContent='';
var n=d.length,cols=n<=6?3:n<=8?4:n<=12?4:n<=16?4:n<=20?5:6;var mob=innerWidth<600;if(mob&&cols>4)cols=n>=24?4:cols;if(!mob)cols=n<=6?3:n<=8?4:n<=12?6:n<=16?8:n<=20?10:8;
g.style.setProperty('--cols',cols);g.dataset.n=n;$('memLvInfo').textContent='Деңгей '+memLv.cur+' · '+memPairs+' жұп';
d.forEach(function(x){var b=el('button',null,'<span class="in"><span class="f">❓</span><span class="b">'+x+'</span></span>');b.dataset.v=x;b.setAttribute('aria-label','Карта');
b.onclick=function(){if(lock||b.classList.contains('open')||b.classList.contains('done'))return;b.classList.add('open');sfx.tap();
if(!first){first=b;return}moves++;$('moves').textContent=moves;
if(first.dataset.v===x){var f0=first;first=null;setTimeout(function(){f0.classList.add('done');b.classList.add('done')},350);found++;addStar(b);
 if(found===memPairs){var g2=good();fb('memFb',true,g2+' Барлығын таптың!');say([praiseKey(g2),'Барлығын таптың!']);confetti(null,null,160);memT=setTimeout(function(){if(!memLv.win(b))$('memFb').textContent='🏆 Барлық деңгейден өттің!'},1400)}}
else{lock=true;var f=first;first=null;setTimeout(function(){f.classList.remove('open');b.classList.remove('open');lock=false},900)}};g.appendChild(b)})}
$('memReset').onclick=newMem;newMem();
var memW=innerWidth<600;addEventListener('resize',function(){var m=innerWidth<600;if(m!==memW){memW=m;var g=$('memGrid'),n=g.children.length,c=m?(n<=6?3:4):(n<=6?3:n<=8?4:n<=12?6:n<=16?8:n<=20?10:8);g.style.setProperty('--cols',c)}});

/* ---------- 6. Drawing ---------- */
var paint=$('paint'),outline=$('outline'),pc=paint.getContext('2d'),oc=outline.getContext('2d'),wrap=paint.parentNode;
var COLS=['#FA5252','#FD7E14','#FCC419','#40C057','#15AABF','#228BE6','#7048E8','#F783AC','#8B5A2B','#212529','#FFFFFF'];
var brush={c:COLS[0],s:14,erase:false},tpl='none';
COLS.forEach(function(c,i){var b=el('button',i?null:'on');b.style.background=c;b.setAttribute('aria-label','Түс '+(i+1));b.onclick=function(){brush.c=c;brush.erase=false;$('eraser').classList.remove('on');
[].forEach.call($('palette').children,function(x){x.classList.remove('on')});b.classList.add('on')};$('palette').appendChild(b)});
[].forEach.call(document.querySelectorAll('[data-size]'),function(b){b.onclick=function(){brush.s=+b.dataset.size;[].forEach.call(document.querySelectorAll('[data-size]'),function(x){x.classList.remove('on')});b.classList.add('on')}});
$('eraser').onclick=function(){brush.erase=!brush.erase;this.classList.toggle('on',brush.erase)};
function sizeCanvas(){var r=wrap.getBoundingClientRect(),d=window.devicePixelRatio||1,w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(paint.width===w&&paint.height===h)return;
var tmp=document.createElement('canvas');tmp.width=paint.width;tmp.height=paint.height;tmp.getContext('2d').drawImage(paint,0,0);
paint.width=outline.width=w;paint.height=outline.height=h;pc.drawImage(tmp,0,0,w,h);drawTpl()}
function drawTpl(){var w=outline.width,h=outline.height;oc.clearRect(0,0,w,h);if(tpl==='none')return;var k=Math.min(w/400,h/300);oc.save();oc.translate((w-400*k)/2,(h-300*k)/2);oc.scale(k,k);
oc.lineWidth=5;oc.strokeStyle='#343a40';oc.lineJoin=oc.lineCap='round';oc.beginPath();
if(tpl==='house'){oc.rect(110,140,180,130);oc.moveTo(90,145);oc.lineTo(200,50);oc.lineTo(310,145);oc.closePath();oc.rect(180,200,45,70);oc.rect(125,165,40,35);oc.rect(240,165,40,35);oc.moveTo(0,270);oc.lineTo(400,270)}
if(tpl==='sun'){oc.arc(200,150,65,0,7);for(var i=0;i<12;i++){var a=i*Math.PI/6;oc.moveTo(200+Math.cos(a)*85,150+Math.sin(a)*85);oc.lineTo(200+Math.cos(a)*125,150+Math.sin(a)*125)}oc.moveTo(222,135);oc.arc(215,135,7,0,7);oc.moveTo(192,135);oc.arc(185,135,7,0,7);oc.moveTo(170,165);oc.quadraticCurveTo(200,195,230,165)}
if(tpl==='fish'){oc.ellipse(180,150,110,65,0,0,7);oc.moveTo(285,150);oc.lineTo(360,95);oc.lineTo(360,205);oc.closePath();oc.moveTo(130,140);oc.arc(122,140,8,0,7);oc.moveTo(200,90);oc.quadraticCurveTo(170,150,200,210);oc.moveTo(240,100);oc.quadraticCurveTo(215,150,240,200)}
oc.stroke();oc.restore()}
var drawing=null;
function pt(e){var r=paint.getBoundingClientRect(),d=paint.width/r.width;return [(e.clientX-r.left)*d,(e.clientY-r.top)*d,d]}
paint.addEventListener('pointerdown',function(e){e.preventDefault();try{paint.setPointerCapture(e.pointerId)}catch(_){}var p=pt(e);drawing=p;stroke(p,p)});
paint.addEventListener('pointermove',function(e){if(!drawing)return;var p=pt(e);stroke(drawing,p);drawing=p});
['pointerup','pointercancel','pointerleave'].forEach(function(t){paint.addEventListener(t,function(){drawing=null})});
function stroke(a,b){pc.globalCompositeOperation=brush.erase?'destination-out':'source-over';pc.strokeStyle=brush.c;pc.lineWidth=brush.s*b[2];pc.lineCap=pc.lineJoin='round';pc.beginPath();pc.moveTo(a[0],a[1]);pc.lineTo(b[0]+.01,b[1]);pc.stroke()}
[].forEach.call(document.querySelectorAll('[data-tpl]'),function(b){b.onclick=function(){tpl=b.dataset.tpl;pc.clearRect(0,0,paint.width,paint.height);drawTpl();[].forEach.call(document.querySelectorAll('[data-tpl]'),function(x){x.classList.remove('on')});b.classList.add('on')}});
document.querySelector('[data-tpl=none]').classList.add('on');
$('clearCanvas').onclick=function(){pc.clearRect(0,0,paint.width,paint.height)};
$('saveCanvas').onclick=function(){try{var t=document.createElement('canvas');t.width=paint.width;t.height=paint.height;var c=t.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,t.width,t.height);c.drawImage(paint,0,0);c.drawImage(outline,0,0);
var a=document.createElement('a');a.href=t.toDataURL('image/png');a.download='balapan-suret.png';document.body.appendChild(a);a.click();a.remove();toast('💾 Сурет сақталды!')}catch(e){toast('Сақтау мүмкін болмады')}};
sizeCanvas();addEventListener('resize',sizeCanvas);

/* ---------- 7. Drag & drop matching (pool of 24 pairs, levels 3/4/5/6 pairs, no recent repeats) ---------- */
var PAIRS=BD.PAIRS,sel=null,fedN=0,matchN=3,deck=[],recent=[],matchT=0;
var matchLv=new Levels('match',BD.LV.match.length,function(){newMatch()});
function drawPairs(n){var set=[],foods={},guard=0;
 while(set.length<n&&guard++<200){if(!deck.length){deck=shuffle(PAIRS.map(function(_,i){return i}).filter(function(i){return recent.indexOf(i)<0}))}
  var i=deck.shift();var p=PAIRS[i];if(foods[p[3]]||set.indexOf(i)>=0){deck.push(i);continue}foods[p[3]]=1;set.push(i)}
 recent=set.slice();return set.map(function(i){return PAIRS[i]})}
function newMatch(){clearTimeout(matchT);matchN=BD.LV.match[matchLv.cur-1];var set=drawPairs(matchN),fo=$('foods'),ea=$('eaters');fo.innerHTML='';ea.innerHTML='';sel=null;fedN=0;$('matchFb').textContent='';
fo.dataset.n=ea.dataset.n=matchN;$('matchLvInfo').textContent='Деңгей '+matchLv.cur+' · '+matchN+' жұп';
shuffle(set).forEach(function(p){var b=el('button','food',p[2]);b.dataset.k=p[3];b.setAttribute('aria-label',p[3]);fo.appendChild(b);makeDrag(b)});
shuffle(set).forEach(function(p){var d=el('button','eater',p[0]+'<small>'+p[1]+'</small>');d.dataset.k=p[3];d.dataset.a=p[1];d.setAttribute('aria-label',p[1]);
d.onclick=function(){if(sel)tryDrop(sel,d)};ea.appendChild(d)});window.__balapanMatch=set.map(function(p){return p[1]})}
function tryDrop(f,d){if(d.classList.contains('fed')||f.classList.contains('used'))return;if(f.dataset.k===d.dataset.k){d.classList.add('fed');d.insertAdjacentHTML('beforeend','<span class="got">'+f.textContent+'</span>');f.classList.add('used');f.classList.remove('sel');sel=null;fedN++;
say('M:'+d.dataset.a);addStar(d);var all=fedN===matchN;fb('matchFb',true,all?good()+' Барлығы тойды!':good());
if(all)matchT=setTimeout(function(){say('Барлығы тойды!');confetti(null,null,140);matchT=setTimeout(function(){if(!matchLv.win(d))newMatch()},1600)},1800)}else{fb('matchFb',false);pop(d)}}
function makeDrag(b){var start=null,moved=false;
b.addEventListener('pointerdown',function(e){e.preventDefault();start=[e.clientX,e.clientY];moved=false;try{b.setPointerCapture(e.pointerId)}catch(_){}});
b.addEventListener('pointermove',function(e){if(!start)return;var dx=e.clientX-start[0],dy=e.clientY-start[1];if(!moved&&Math.hypot(dx,dy)>8){moved=true;b.classList.add('drag')}
if(moved){b.style.transform='translate('+dx+'px,'+dy+'px) scale(1.1)';var t=hit(e);[].forEach.call(document.querySelectorAll('.eater'),function(x){x.classList.toggle('hover',x===t)})}});
function end(e){if(!start)return;start=null;var t0=moved?hit(e):null;b.style.transition='none';b.classList.remove('drag');b.style.transform='';[].forEach.call(document.querySelectorAll('.eater'),function(x){x.classList.remove('hover')});
void b.offsetWidth;b.style.transition='';if(moved){if(t0)tryDrop(b,t0)}else{[].forEach.call(document.querySelectorAll('.food'),function(x){x.classList.remove('sel')});sel=b;b.classList.add('sel');sfx.tap()}}
b.addEventListener('pointerup',end);b.addEventListener('pointercancel',function(){start=null;b.classList.remove('drag');b.style.transform=''})}
function hit(e){var t=document.elementFromPoint(e.clientX,e.clientY);return t&&t.closest?t.closest('.eater'):null}
$('matchReset').onclick=newMatch;newMatch();

/* ---------- 8. Math (levels: within 5, 10, 20) ---------- */
var mathLock=false,MO=['🍎','🍓','🐥','⭐','🎈'],mathOk=0,mathK='';
var mathLv=new Levels('math',BD.LV.math.length,function(){mathOk=0;newMath()});
function newMath(){mathLock=false;var M=BD.LV.math[mathLv.cur-1],plus=Math.random()<.5,a,b,ans;if(plus){a=1+rnd(M-1);b=1+rnd(M-a);ans=a+b}else{a=2+rnd(M-1);b=1+rnd(a-1);ans=a-b}
mathK=BD.mathKey(a,b,plus);
var o=MO[rnd(MO.length)],v='';if(plus)v=Array(a+1).join(o)+' ➕ '+Array(b+1).join(o);else{for(var i=0;i<a;i++)v+=i>=a-b?'<span class="x">'+o+'</span>':o}
var mv=$('mathVis');mv.innerHTML=v;mv.classList.toggle('many',a+b>12);$('mathExpr').textContent=a+(plus?' + ':' − ')+b+' = ?';$('mathFb').textContent='';progress('mathProg',mathOk,NEED);
var ch=[ans];while(ch.length<(M>10?4:3)){var w=Math.max(0,Math.min(M,ans+rnd(7)-3));if(ch.indexOf(w)<0)ch.push(w)}
var box=$('mathBtns');box.innerHTML='';shuffle(ch).forEach(function(c){var bt=el('button',null,c);if(c===ans)bt.dataset.ok='1';
bt.onclick=function(){if(mathLock)return;if(c===ans){mathLock=true;mathOk++;progress('mathProg',mathOk,NEED);bt.classList.add('right');$('mathExpr').textContent=a+(plus?' + ':' − ')+b+' = '+ans;var g=good();fb('mathFb',true,g);say([praiseKey(g),BD.num(ans)]);addStar(bt);
 setTimeout(function(){if(mathOk>=NEED&&mathLv.win(bt))return;if(mathOk>=NEED)mathOk=0;newMath()},1700)}
else{bt.classList.remove('wrong');void bt.offsetWidth;bt.classList.add('wrong');fb('mathFb',false)}};box.appendChild(bt)})}
$('mathExpr').onclick=$('mathVis').onclick=function(){say(mathK)};
newMath();

/* ---------- 9. Opposites (levels: 3 choices/10 pairs, 4 choices/16 pairs, 5 choices/16 pairs) ---------- */
var OP=BD.OP,oppLock=false,oppOk=0,oppQ='',oppLast=-1;
var oppLv=new Levels('opp',BD.LV.opp.length,function(){oppOk=0;newOpp()});
function newOpp(){oppLock=false;var cf=BD.LV.opp[oppLv.cur-1],POOL=OP.slice(0,cf.pool),i;do{i=rnd(POOL.length)}while(i===oppLast);oppLast=i;var p=POOL[i],flip=Math.random()<.5,q=flip?[p[2],p[3]]:[p[0],p[1]],ans=flip?[p[0],p[1]]:[p[2],p[3]];oppQ=q[1];
$('oppWord').innerHTML='<span>'+q[0]+'</span><span>'+q[1]+'</span>';$('oppFb').textContent='';progress('oppProg',oppOk,NEED);
var others=shuffle(POOL.filter(function(_,j){return j!==i})).slice(0,cf.n-1).map(function(o){return Math.random()<.5?[o[0],o[1]]:[o[2],o[3]]});
var box=$('oppBtns');box.innerHTML='';shuffle([ans].concat(others)).forEach(function(c){var b=el('button',null,'<i>'+c[0]+'</i>'+c[1]);if(c===ans)b.dataset.ok='1';
b.onclick=function(){if(oppLock)return;if(c===ans){oppLock=true;oppOk++;progress('oppProg',oppOk,NEED);b.classList.add('right');fb('oppFb',true,good()+' '+q[1]+' — '+ans[1]);say([q[1],ans[1]]);addStar(b);
 setTimeout(function(){if(oppOk>=NEED&&oppLv.win(b))return;if(oppOk>=NEED)oppOk=0;newOpp()},1900)}
else{b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');fb('oppFb',false)}};box.appendChild(b)})}
$('oppWord').onclick=function(){say(oppQ)};
newOpp();

/* ---------- 10. Story & rhyme ---------- */
var STORIES=BD.STORIES;
var si=0,pg=0;
function renderPage(){var p=STORIES[si][pg],pic=$('storyPic');pic.innerHTML=p[0]==='img'?'<img src="images/chick.svg" alt="Балапан">':p[0];$('storyText').textContent=p[1];
[pic,$('storyText')].forEach(function(x){x.classList.remove('page-in');void x.offsetWidth;x.classList.add('page-in')});
var d=$('storyDots');d.innerHTML='';STORIES[si].forEach(function(_,j){d.appendChild(el('i',j===pg?'on':null))});
$('prevPage').disabled=pg===0;$('nextPage').textContent=pg===STORIES[si].length-1?'Басынан ↺':'Келесі ▶'}
$('prevPage').onclick=function(){if(pg>0){pg--;renderPage()}};
$('nextPage').onclick=function(){if(pg<STORIES[si].length-1)pg++;else{pg=0;if(si===0){addStar(this)}}renderPage()};
$('readPage').onclick=function(){say('S:'+STORIES[si][pg][1])};
[].forEach.call(document.querySelectorAll('[data-story]'),function(b){b.onclick=function(){si=+b.dataset.story;pg=0;[].forEach.call(document.querySelectorAll('[data-story]'),function(x){x.classList.remove('on')});b.classList.add('on');renderPage()}});
renderPage();

/* ---------- Scroll effects ---------- */
var rev=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window&&!reduce){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.08,rootMargin:'0px 0px -40px 0px'});[].forEach.call(rev,function(r){io.observe(r)})}
else[].forEach.call(rev,function(r){r.classList.add('in')});
function onScroll(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;$('scrollBar').style.width=(m>0?h.scrollTop/m*100:0)+'%';$('toTop').classList.toggle('show',h.scrollTop>600)}
addEventListener('scroll',onScroll,{passive:true});onScroll();
$('toTop').onclick=function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})};
window.__balapan={get stars(){return stars},say:say,levels:{mem:memLv,num:numLv,col:colLv,math:mathLv,opp:oppLv,match:matchLv}};
})();

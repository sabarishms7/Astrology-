import {
  SwissEphemeris,
  Planet,
  LunarPoint,
  HouseSystem,
  SiderealMode
} from "https://cdn.jsdelivr.net/npm/@swisseph/browser@1.3.1/+esm";

const $ = id => document.getElementById(id);
const norm = x => ((x % 360) + 360) % 360;
const deg = x => `${x.toFixed(2)}°`;

const signs = [
  ["Mesha","மேஷம்","Aries"],["Rishabha","ரிஷபம்","Taurus"],["Mithuna","மிதுனம்","Gemini"],
  ["Karka","கடகம்","Cancer"],["Simha","சிம்மம்","Leo"],["Kanya","கன்னி","Virgo"],
  ["Tula","துலாம்","Libra"],["Vrischika","விருச்சிகம்","Scorpio"],["Dhanus","தனுசு","Sagittarius"],
  ["Makara","மகரம்","Capricorn"],["Kumbha","கும்பம்","Aquarius"],["Meena","மீனம்","Pisces"]
];

const nakNames = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha",
  "Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha",
  "Purva Bhadrapada","Uttara Bhadrapada","Revati"
];
const nakTamil = [
  "அஸ்வினி","பரணி","கார்த்திகை","ரோகிணி","மிருகசீரிஷம்","திருவாதிரை","புனர்பூசம்","பூசம்","ஆயில்யம்",
  "மகம்","பூரம்","உத்திரம்","ஹஸ்தம்","சித்திரை","சுவாதி","விசாகம்","அனுஷம்","கேட்டை",
  "மூலம்","பூராடம்","உத்திராடம்","திருவோணம்","அவிட்டம்","சதயம்","பூரட்டாதி","உத்திரட்டாதி","ரேவதி"
];
const nakLords = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const gana = [
  "Deva","Manushya","Rakshasa","Manushya","Deva","Manushya","Deva","Deva","Rakshasa",
  "Rakshasa","Manushya","Deva","Deva","Rakshasa","Deva","Rakshasa","Deva","Rakshasa",
  "Rakshasa","Manushya","Deva","Deva","Rakshasa","Rakshasa","Manushya","Manushya","Deva"
];
// Common South-Indian nadi grouping (3 x 9).
const nadi = [
  "Aadi","Madhya","Antya","Aadi","Madhya","Antya","Aadi","Madhya","Antya",
  "Aadi","Madhya","Antya","Aadi","Madhya","Antya","Aadi","Madhya","Antya",
  "Aadi","Madhya","Antya","Aadi","Madhya","Antya","Aadi","Madhya","Antya"
];
// Five Rajju groups commonly used in Tamil matching.
const rajju = [
  "Pada","Kati","Nabhi","Kanta","Sira","Kanta","Nabhi","Pada","Pada",
  "Kati","Kati","Nabhi","Kanta","Sira","Sira","Nabhi","Kati","Pada",
  "Pada","Kati","Nabhi","Kanta","Kanta","Nabhi","Kati","Kati","Pada"
];
// Common yoni animal mapping (27 stars).
const yoni = [
  "Horse","Elephant","Goat","Serpent","Serpent","Dog","Cat","Goat","Cat",
  "Rat","Rat","Cow","Buffalo","Tiger","Buffalo","Tiger","Deer","Deer",
  "Dog","Monkey","Mongoose","Monkey","Lion","Horse","Lion","Cow","Elephant"
];
const yoniEnemy = new Set([
  ["Horse","Buffalo"],["Elephant","Lion"],["Goat","Monkey"],["Serpent","Mongoose"],
  ["Dog","Deer"],["Cat","Rat"],["Rat","Cat"],["Cow","Tiger"],["Buffalo","Horse"],
  ["Tiger","Cow"],["Deer","Dog"],["Monkey","Goat"],["Mongoose","Serpent"],["Lion","Elephant"]
].map(([a,b]) => [a,b].sort().join("|")));

const vedhaPairs = [
  [0,23],[1,16],[2,15],[3,14],[4,13],[5,12],[6,20],[7,21],[8,19],
  [9,18],[10,22],[11,25],[17,24]
];
const vedhaMap = new Map();
for (const [a,b] of vedhaPairs){ vedhaMap.set(a,b); vedhaMap.set(b,a); }

const signLord = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
const planetNames = {
  [Planet.Sun]:"Sun",[Planet.Moon]:"Moon",[Planet.Mars]:"Mars",[Planet.Mercury]:"Mercury",
  [Planet.Jupiter]:"Jupiter",[Planet.Venus]:"Venus",[Planet.Saturn]:"Saturn"
};
const planetShort = {Sun:"Su",Moon:"Mo",Mars:"Ma",Mercury:"Me",Jupiter:"Ju",Venus:"Ve",Saturn:"Sa",Rahu:"Ra",Ketu:"Ke"};

let swe;
let currentChart = null;

async function init(){
  swe = new SwissEphemeris();
  await swe.init();
  swe.setSiderealMode(SiderealMode.Lahiri);
  $("engineStatus").textContent = "Engine ready • Lahiri sidereal";
}
init().catch(e => {
  $("engineStatus").textContent = "Engine failed";
  showError("Could not initialize the astrology engine: " + e.message);
});

function showError(msg){ $("errorBox").textContent=msg; $("errorBox").classList.remove("hidden"); }
function clearError(){ $("errorBox").classList.add("hidden"); }

function localToUTC(dateStr,timeStr,tz){
  const [y,m,d]=dateStr.split("-").map(Number);
  const [hh,mm]=timeStr.split(":").map(Number);
  return new Date(Date.UTC(y,m-1,d,hh,mm) - tz*3600000);
}
function signIndex(longitude){ return Math.floor(norm(longitude)/30); }
function nakData(longitude){
  const l=norm(longitude);
  const span=360/27;
  const idx=Math.min(26,Math.floor(l/span));
  const within=l-idx*span;
  const pada=Math.min(4,Math.floor(within/(span/4))+1);
  return {index:idx,name:nakNames[idx],tamil:nakTamil[idx],pada,lord:nakLords[idx]};
}
function dms(l){
  l=norm(l); const d=Math.floor(l), m=Math.floor((l-d)*60), s=Math.round((((l-d)*60)-m)*60);
  return `${d}° ${m}' ${s}"`;
}
function wholeHouse(ascLon,lon){ return ((signIndex(lon)-signIndex(ascLon)+12)%12)+1; }

function navamsaSign(longitude){
  const s=signIndex(longitude), within=norm(longitude)%30, n=Math.min(8,Math.floor(within/(30/9)));
  const movable=[0,3,6,9].includes(s), fixed=[1,4,7,10].includes(s);
  const start=movable?s:fixed?(s+8)%12:(s+4)%12;
  return (start+n)%12;
}

function calcPlanet(body,jd){
  const p=swe.calculatePosition(jd,body);
  return p.longitude;
}
function calculate(){
  clearError();
  if(!swe) throw new Error("Calculation engine is still loading.");
  const name=$("name").value.trim()||"Unnamed";
  const utc=localToUTC($("dob").value,$("time").value,Number($("tz").value));
  if(Number.isNaN(utc.getTime())) throw new Error("Enter a valid date/time.");
  const lat=Number($("lat").value), lon=Number($("lon").value);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180) throw new Error("Latitude/longitude is invalid.");
  const jd=swe.dateToJulianDay(utc);
  swe.setSiderealMode(SiderealMode.Lahiri);
  const houses=swe.calculateHouses(jd,lat,lon,HouseSystem.WholeSign);
  const asc=norm(houses.ascendant);
  const positions=[];
  for(const [body,label] of Object.entries(planetNames)){
    const b=Number(body), l=norm(calcPlanet(b,jd));
    positions.push({key:label,longitude:l,sign:signIndex(l),house:wholeHouse(asc,l),nak:nakData(l),latitude:swe.calculatePosition(jd,b).latitude});
  }
  const rahuLon=norm(calcPlanet(LunarPoint.MeanNode,jd));
  positions.push({key:"Rahu",longitude:rahuLon,sign:signIndex(rahuLon),house:wholeHouse(asc,rahuLon),nak:nakData(rahuLon),latitude:0});
  const ketuLon=norm(rahuLon+180);
  positions.push({key:"Ketu",longitude:ketuLon,sign:signIndex(ketuLon),house:wholeHouse(asc,ketuLon),nak:nakData(ketuLon),latitude:0});
  const moon=positions.find(p=>p.key==="Moon");
  const ascNak=nakData(asc);
  currentChart={name,gender:$("gender").value,dob:$("dob").value,time:$("time").value,tz,place:$("place").value,lat,lon,jd,asc,mc:norm(houses.mc),ayan:swe.getAyanamsa(jd),positions,moon,ascNak};
  render(currentChart);
}
$("birthForm").addEventListener("submit",e=>{e.preventDefault();try{calculate()}catch(err){showError(err.message)}});
$("printBtn").addEventListener("click",()=>window.print());
$("sampleBtn").addEventListener("click",()=>{
  $("name").value="Sample";
  $("gender").value="male"; $("dob").value="2000-01-01"; $("time").value="12:00";
  $("tz").value="5.5"; $("place").value="Chennai"; $("lat").value="13.0827"; $("lon").value="80.2707";
});
$("useCurrentBtn").addEventListener("click",()=>{
  if(!currentChart)return;
  const m=currentChart.moon;
  $("groomNak").value=m.nak.index; $("groomPada").value=m.nak.pada;
});
for(let i=0;i<27;i++){
  $("brideNak").insertAdjacentHTML("beforeend",`<option value="${i}">${i+1}. ${nakNames[i]} — ${nakTamil[i]}</option>`);
  $("groomNak").insertAdjacentHTML("beforeend",`<option value="${i}">${i+1}. ${nakNames[i]} — ${nakTamil[i]}</option>`);
}

function render(c){
  $("summary").classList.remove("hidden"); $("technical").classList.remove("hidden"); $("charts").classList.remove("hidden");
  ["grahaSection","bhavaSection","nakSection","dashaSection","marriageSection"].forEach(id=>$(id).classList.remove("hidden"));
  $("sLagna").textContent=`${signs[signIndex(c.asc)][0]} (${deg(c.asc%30)})`;
  $("sRasi").textContent=signs[c.moon.sign][0];
  $("sNak").textContent=`${c.moon.nak.name} / ${c.moon.nak.tamil}`;
  $("sPada").textContent=c.moon.nak.pada;
  $("jd").textContent=c.jd.toFixed(6); $("ayan").textContent=deg(c.ayan); $("asc").textContent=dms(c.asc); $("mc").textContent=dms(c.mc);
  renderChart($("rasiChart"),c.positions, x=>x.sign);
  renderChart($("navamsaChart"),c.positions, x=>navamsaSign(x.longitude));
  renderGrahas(c); renderBhavas(c); renderNak(c); renderDasha(c);
  renderMarriageAstro(c);
  $("groomNak").value=c.moon.nak.index; $("groomPada").value=c.moon.nak.pada;
}
function chartCells(){
  // South Indian fixed-sign positions.
  return [11,0,1,2,10, null, null,3,9,null,null,4,8,7,6,5];
}
function renderChart(el,positions,getSign){
  el.innerHTML="";
  const cells=chartCells();
  for(const s of cells){
    const cell=document.createElement("div"); cell.className="rasi-cell";
    if(s===null){cell.classList.add("center"); el.appendChild(cell); continue;}
    cell.innerHTML=`<div class="sign">${s+1}. ${signs[s][0]}</div>`;
    const ps=positions.filter(p=>getSign(p)===s);
    for(const p of ps) cell.insertAdjacentHTML("beforeend",`<div class="planet">${planetShort[p.key]||p.key}</div>`);
    el.appendChild(cell);
  }
}
function renderGrahas(c){
  $("grahaTable").innerHTML=`<thead><tr><th>Graha</th><th>Longitude</th><th>Rasi</th><th>House</th><th>Nakshatra</th><th>Pada</th><th>Lat</th></tr></thead><tbody>`+
    c.positions.map(p=>`<tr><td>${p.key}</td><td>${dms(p.longitude)}</td><td>${signs[p.sign][0]}</td><td>${p.house}</td><td>${p.nak.name}</td><td>${p.nak.pada}</td><td>${p.latitude.toFixed(3)}°</td></tr>`).join("")+"</tbody>";
}
function renderBhavas(c){
  $("bhavaGrid").innerHTML=Array.from({length:12},(_,i)=>{
    const sign=(signIndex(c.asc)+i)%12, ps=c.positions.filter(p=>p.house===i+1);
    return `<div class="bhava"><b>Bhava ${i+1}</b><div>${signs[sign][0]}</div><div>${ps.length?ps.map(p=>p.key).join(", "):"—"}</div></div>`;
  }).join("");
}
function renderNak(c){
  const n=c.moon.nak;
  $("nakInfo").innerHTML=`<div class="nak-card">
    <div class="mini"><span>Moon Nakshatra</span><b>${n.name} / ${n.tamil}</b></div>
    <div class="mini"><span>Pada</span><b>${n.pada}</b></div>
    <div class="mini"><span>Nakshatra Lord</span><b>${n.lord}</b></div>
    <div class="mini"><span>Moon Rasi</span><b>${signs[c.moon.sign][0]}</b></div>
    <div class="mini"><span>Gana</span><b>${gana[n.index]}</b></div>
    <div class="mini"><span>Yoni</span><b>${yoni[n.index]}</b></div>
    <div class="mini"><span>Rajju</span><b>${rajju[n.index]}</b></div>
    <div class="mini"><span>Nadi</span><b>${nadi[n.index]}</b></div>
  </div>`;
}

const dashaYears={Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};
const dashaSeq=["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
function addYears(date,years){const d=new Date(date); d.setTime(d.getTime()+years*365.2425*86400000); return d;}
function fmtDate(d){return d.toISOString().slice(0,10)}
function renderDasha(c){
  const startLord=c.moon.nak.lord, startIdx=dashaSeq.indexOf(startLord);
  const nakSpan=360/27, elapsed=(norm(c.moon.longitude)%nakSpan)/nakSpan;
  const remaining=dashaYears[startLord]*(1-elapsed);
  let cursor=localToUTC(c.dob,c.time,c.tz);
  const rows=[];
  for(let i=0;i<9;i++){
    const lord=dashaSeq[(startIdx+i)%9], yrs=i===0?remaining:dashaYears[lord];
    const end=addYears(cursor,yrs);
    rows.push(`<tr><td>${lord}</td><td>${dashaYears[lord]} yrs</td><td>${fmtDate(cursor)}</td><td>${fmtDate(end)}</td></tr>`);
    cursor=end;
  }
  $("dashaTable").innerHTML=`<thead><tr><th>Mahadasha</th><th>Full Period</th><th>Start</th><th>End</th></tr></thead><tbody>${rows.join("")}</tbody>`;
}

function countStar(from,to){return ((to-from+27)%27)+1;}
function dina(girl,boy){const c=countStar(girl,boy); return [2,4,6,8,9].includes(c%9===0?9:c%9);}
function mahendra(girl,boy){return [4,7,10,13,16,19,22,25].includes(countStar(girl,boy));}
function streeDeergha(girl,boy){return countStar(girl,boy)>=13;}
function ganaScore(g,b){
  if(gana[g]===gana[b]) return 1;
  if((gana[g]==="Deva"&&gana[b]==="Manushya")||(gana[g]==="Manushya"&&gana[b]==="Deva")) return .5;
  if(gana[g]==="Rakshasa"&&gana[b]==="Rakshasa") return .5;
  return 0;
}
function yoniScore(g,b){
  if(yoni[g]===yoni[b]) return 1;
  if(yoniEnemy.has([yoni[g],yoni[b]].sort().join("|"))) return 0;
  return .5;
}
function rasiIndexFromNak(i){
  // Nakshatra spans can cross signs; use the star's conventional starting sign.
  const longitude=i*(360/27)+(360/27)/2;
  return signIndex(longitude);
}
function rasiScore(g,b){
  const gr=rasiIndexFromNak(g), br=rasiIndexFromNak(b);
  const d=((br-gr+12)%12)+1;
  // Common simplified Tamil rule: 2/3/4/5/6/7/8/9/12 counted as acceptable in many tables,
  // with 6/8 and 2/12 treated differently by some schools. Keep configurable.
  const bad=[2,6,8,12];
  return bad.includes(d)?0:1;
}
function rasiAdhipathi(g,b){
  const gr=signLord[rasiIndexFromNak(g)], br=signLord[rasiIndexFromNak(b)];
  if(gr===br)return 1;
  const friends={Sun:["Moon","Mars","Jupiter"],Moon:["Sun","Mercury"],Mars:["Sun","Moon","Jupiter"],
    Mercury:["Sun","Venus"],Jupiter:["Sun","Moon","Mars"],Venus:["Mercury","Saturn"],Saturn:["Mercury","Venus"]};
  if((friends[gr]||[]).includes(br)||(friends[br]||[]).includes(gr))return .5;
  return 0;
}
function vasya(g,b){
  const gr=rasiIndexFromNak(g), br=rasiIndexFromNak(b);
  const groups=[[0,4,8],[1,3],[2,5],[6,9],[7,10,11]];
  return groups.some(x=>x.includes(gr)&&x.includes(br))?1:.5;
}
function rajjuScore(g,b){return rajju[g]===rajju[b]?0:1;}
function vedhaScore(g,b){return vedhaMap.get(g)===b?0:1;}
function porutham(girl,boy){
  const items=[
    ["Dina",dina(girl,boy),"Health / general harmony"],
    ["Gana",ganaScore(girl,boy),"Temperament"],
    ["Mahendra",mahendra(girl,boy),"Growth / welfare"],
    ["Sthree Deergha",streeDeergha(girl,boy),"Traditional star-distance test"],
    ["Yoni",yoniScore(girl,boy),"Yoni/physical compatibility"],
    ["Rasi",rasiScore(girl,boy),"Moon-sign relationship"],
    ["Rasi Athipathi",rasiAdhipathi(girl,boy),"Rasi-lord relationship"],
    ["Vasya",vasya(girl,boy),"Mutual attraction / influence"],
    ["Rajju",rajjuScore(girl,boy),"Traditional longevity check"],
    ["Vedha",vedhaScore(girl,boy),"Traditional obstruction check"]
  ];
  const score=items.reduce((s,x)=>s+x[1],0);
  return {items,score};
}
$("poruthamBtn").addEventListener("click",()=>{
  const g=Number($("brideNak").value), b=Number($("groomNak").value), r=porutham(g,b);
  const critical=r.items.find(x=>x[0]==="Rajju")[1]===0||r.items.find(x=>x[0]==="Vedha")[1]===0;
  const verdict=critical?"Traditional critical mismatch (Rajju/Vedha).":"Porutham result should be read with the complete horoscope.";
  const level=r.score>=8?"Excellent range":r.score>=6?"Good range":r.score>=5?"Moderate / review":"Low range";
  $("poruthamResult").classList.remove("hidden");
  $("poruthamResult").innerHTML=`<div class="result-summary">
    <div class="score">${r.score.toFixed(1)}<small>/10</small></div>
    <div class="verdict ${critical||r.score<5?"bad":"good"}"><b>${level}</b><p>${verdict}</p>
    <div class="hint">Bride: ${nakNames[g]} • Groom: ${nakNames[b]} • This score is a traditional screening aid, not a guarantee.</div></div>
  </div>
  <div class="table-wrap"><table class="porutham-table"><thead><tr><th>Porutham</th><th>Result</th><th>Score</th><th>Purpose</th></tr></thead><tbody>
  ${r.items.map(x=>`<tr><td>${x[0]}</td><td class="${x[1]===1?"pass":x[1]===0?"fail":"mid"}">${x[1]===1?"MATCH":x[1]===0?"NO MATCH":"MEDIUM"}</td><td>${x[1]}</td><td>${x[2]}</td></tr>`).join("")}</tbody></table></div>`;
});

function renderMarriageAstro(c){
  const lagna=signIndex(c.asc), seventh=(lagna+6)%12, lord=signLord[seventh];
  const seventhLord=c.positions.find(p=>p.key===lord);
  const mars=c.positions.find(p=>p.key==="Mars");
  const venus=c.positions.find(p=>p.key==="Venus");
  const jupiter=c.positions.find(p=>p.key==="Jupiter");
  const moon=c.moon;
  const doshaHouses=[1,2,4,7,8,12];
  const fromLagna=doshaHouses.includes(mars.house);
  const fromMoon=doshaHouses.includes(wholeHouse(moon.longitude,mars.longitude));
  const fromVenus=doshaHouses.includes(wholeHouse(venus.longitude,mars.longitude));
  $("marriageAstro").classList.remove("hidden");
  $("marriageAstro").innerHTML=`<div class="card" style="margin-top:16px">
    <h3>Chart-based marriage factors</h3>
    <div class="nak-card">
      <div class="mini"><span>7th House</span><b>${seventh+1}. ${signs[seventh][0]}</b></div>
      <div class="mini"><span>7th Lord</span><b>${lord} in Bhava ${seventhLord?.house??"—"}</b></div>
      <div class="mini"><span>Venus</span><b>${signs[venus.sign][0]}, Bhava ${venus.house}</b></div>
      <div class="mini"><span>Jupiter</span><b>${signs[jupiter.sign][0]}, Bhava ${jupiter.house}</b></div>
      <div class="mini"><span>Sevvai from Lagna</span><b>${fromLagna?"Flagged":"Not flagged"}</b></div>
      <div class="mini"><span>Sevvai from Moon</span><b>${fromMoon?"Flagged":"Not flagged"}</b></div>
      <div class="mini"><span>Sevvai from Venus</span><b>${fromVenus?"Flagged":"Not flagged"}</b></div>
      <div class="mini"><span>D9 7th sign</span><b>${signs[(navamsaSign(c.asc)+6)%12][0]}</b></div>
    </div>
    <p class="hint">Sevvai/Manglik rules and cancellation exceptions differ between schools. This screen intentionally shows the common house-based flags and does not declare a final marriage verdict.</p>
  </div>`;
}

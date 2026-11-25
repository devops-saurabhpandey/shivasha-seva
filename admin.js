const form=document.getElementById("loginForm");
const keyInput=document.getElementById("apiKey"),message=document.getElementById("message"),panel=document.getElementById("recordsPanel"),rows=document.getElementById("records"),count=document.getElementById("count");
const searchInput=document.getElementById("searchInput"),kindFilter=document.getElementById("kindFilter"),categoryFilter=document.getElementById("categoryFilter"),statusFilter=document.getElementById("statusFilter"),priorityFilter=document.getElementById("priorityFilter");
const apiBase=String(window.SHIVASHA_API_BASE_URL||"").trim().replace(/\/$/,"");
let sessionKey="",allItems=[];
function cell(value){const td=document.createElement("td");td.textContent=value??"";return td}
function dateLabel(value){const date=new Date(value);return Number.isNaN(date.getTime())?"—":date.toLocaleString("hi-IN")}
function statusLabel(value){return ({new:"नया",reviewed:"जाँचा गया",closed:"बंद"})[value]||value}
function kindLabel(value){return value==="request"?"सहायता अनुरोध":"स्वयंसेवक"}
function priorityLabel(value){return ({normal:"सामान्य",urgent:"तत्काल",emergency:"आपातकालीन"})[value]||"सामान्य"}
function normalizePlace(value){return String(value||"").normalize("NFKC").toLocaleLowerCase("hi-IN").replace(/[\\s,.-]+/g," ").trim()}
function serviceTags(value){
  const text=String(value||"").toLocaleLowerCase("hi-IN");
  const groups=[
    ["human","मानव","व्यक्ति","परिवार","बुजुर्ग","दिव्यांग"],
    ["animal","पशु","जानवर","गाय","कुत्ता","बिल्ली"],
    ["bird","पक्षी","चिड़िया","घायल पक्षी"],
    ["health","स्वास्थ्य","रक्तदान","मेडिकल","चिकित्सा"],
    ["education","शिक्षा","किताब","पढ़ाई","स्टेशनरी"],
    ["technical","तकनीकी","तकनीक","अन्य"]
  ];
  return groups.filter(group=>group.slice(1).some(word=>text.includes(word))).map(group=>group[0]);
}
function volunteerMatches(request){
  if(request.kind!=="request")return [];
  const place=normalizePlace(request.location),tags=serviceTags(request.category);
  return allItems.filter(person=>{
    if(person.kind!=="volunteer"||person.status==="closed")return false;
    const volunteerPlace=normalizePlace(person.location);
    const sameArea=place&&volunteerPlace&&(place===volunteerPlace||place.includes(volunteerPlace)||volunteerPlace.includes(place));
    const volunteerTags=serviceTags(person.category);
    const sameService=tags.length&&volunteerTags.some(tag=>tags.includes(tag));
    return Boolean(sameArea&&sameService);
  });
}
function visibleItems(){const q=searchInput.value.trim().toLocaleLowerCase("hi-IN");return allItems.filter(item=>{const kindOk=kindFilter.value==="all"||item.kind===kindFilter.value,catOk=categoryFilter.value==="all"||item.category===categoryFilter.value,statusOk=statusFilter.value==="all"||item.status===statusFilter.value,priorityOk=priorityFilter.value==="all"||(item.priority||"normal")===priorityFilter.value;const hay=[item.category,item.location,item.details,kindLabel(item.kind),statusLabel(item.status),priorityLabel(item.priority)].join(" ").toLocaleLowerCase("hi-IN");return kindOk&&catOk&&statusOk&&priorityOk&&(!q||hay.includes(q))})}
function updateCategories(){const selected=categoryFilter.value,cats=[...new Set(allItems.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"hi"));categoryFilter.replaceChildren();const all=document.createElement("option");all.value="all";all.textContent="सभी श्रेणियाँ";categoryFilter.append(all);for(const value of cats){const o=document.createElement("option");o.value=value;o.textContent=value;categoryFilter.append(o)}categoryFilter.value=cats.includes(selected)?selected:"all"}
function renderRecords(){const openEmergencies=allItems.filter(item=>item.kind==="request"&&item.priority==="emergency"&&item.status!=="closed").length;const alert=document.getElementById("emergencyAlert");alert.hidden=openEmergencies===0;alert.textContent=openEmergencies?`ध्यान दें: ${openEmergencies} आपातकालीन सहायता अनुरोध अभी बंद नहीं हुए हैं। कृपया तुरंत समीक्षा करें।`:"";const items=visibleItems();rows.replaceChildren();for(const item of items){const tr=document.createElement("tr");tr.append(cell(dateLabel(item.createdAt)),cell(kindLabel(item.kind)),cell(priorityLabel(item.priority)),cell(item.category),cell(item.location),cell(item.details||"—"));
const matches=volunteerMatches(item);
const matchCell=cell(item.kind==="request"?(matches.length?matches.length+" संभावित स्वयंसेवक":"अभी कोई मिलान नहीं"):"—");
matchCell.title=matches.map(person=>person.category+" — "+person.location).join(" | ");
tr.append(matchCell);
if(item.priority==="emergency")tr.classList.add("priority-emergency");else if(item.priority==="urgent")tr.classList.add("priority-urgent");const statusCell=cell(statusLabel(item.status)),actionCell=document.createElement("td"),select=document.createElement("select");select.setAttribute("aria-label","आवेदन की स्थिति");for(const [v,l] of Object.entries({new:"नया",reviewed:"जाँचा गया",closed:"बंद"})){const o=document.createElement("option");o.value=v;o.textContent=l;select.append(o)}select.value=item.status;const save=document.createElement("button");save.type="button";save.className="small-action";save.textContent="बदलें";save.addEventListener("click",async()=>{save.disabled=true;message.textContent="स्थिति अपडेट हो रही है…";try{const response=await fetch(apiBase+"/api/admin/submissions/"+encodeURIComponent(item.kind)+"/"+encodeURIComponent(item._id),{method:"PATCH",headers:{Authorization:"Bearer "+sessionKey,"Content-Type":"application/json"},body:JSON.stringify({status:select.value}),cache:"no-store"});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"स्थिति अपडेट नहीं हुई।");item.status=data.status;renderRecords();message.textContent="आवेदन की स्थिति अपडेट हो गई।"}catch(error){message.textContent=error.message||"अपडेट विफल रहा।"}finally{save.disabled=false}});actionCell.append(select,save);tr.append(statusCell,actionCell);rows.append(tr)}count.textContent="दिखाए जा रहे रिकॉर्ड: "+items.length+" / कुल प्राप्त: "+allItems.length;document.getElementById("exportButton").disabled=items.length===0}
async function loadRecords(){if(!apiBase){message.textContent="API अभी configure नहीं है। Server deploy और health check के बाद api-config.js में HTTPS API URL सेट करें।";return}message.textContent="रिकॉर्ड लोड हो रहे हैं…";try{const response=await fetch(apiBase+"/api/admin/submissions?limit=100",{headers:{Authorization:"Bearer "+sessionKey},cache:"no-store"}),data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"रिकॉर्ड प्राप्त नहीं हुए।");allItems=Array.isArray(data.items)?data.items:[];updateCategories();renderRecords();panel.hidden=false;message.textContent="रिकॉर्ड सुरक्षित रूप से लोड हो गए।"}catch(error){panel.hidden=true;message.textContent=error.message||"सर्वर से संपर्क नहीं हो सका।"}}
function csvCell(value){let text=String(value??"");if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'}
function exportCsv(){const items=visibleItems();if(!items.length){message.textContent="Export करने के लिए कोई रिकॉर्ड नहीं है।";return}const data=[["तारीख","आवेदन प्रकार","प्राथमिकता","श्रेणी","स्थान","विवरण","संभावित स्वयंसेवक","स्थिति","रिकॉर्ड ID"],...items.map(x=>[dateLabel(x.createdAt),kindLabel(x.kind),priorityLabel(x.priority),x.category,x.location,x.details||"",x.kind==="request"?volunteerMatches(x).length:0,statusLabel(x.status),x._id])];const csv="\uFEFF"+data.map(row=>row.map(csvCell).join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download="shivasha-seva-applications-"+new Date().toISOString().slice(0,10)+".csv";document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);message.textContent="CSV export तैयार है। इसे Excel या Google Sheets में खोल सकते हैं।"}
form.addEventListener("submit",async e=>{e.preventDefault();sessionKey=keyInput.value.trim();if(sessionKey.length<32){message.textContent="मान्य Admin API Key दर्ज करें।";return}keyInput.value="";await loadRecords()});
document.getElementById("refreshButton").addEventListener("click",loadRecords);document.getElementById("exportButton").addEventListener("click",exportCsv);
document.getElementById("logoutButton").addEventListener("click",()=>{sessionKey="";allItems=[];rows.replaceChildren();panel.hidden=true;message.textContent="Logout हो गया।"});
[searchInput,kindFilter,categoryFilter,statusFilter,priorityFilter].forEach(control=>control.addEventListener(control===searchInput?"input":"change",renderRecords));
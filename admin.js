const form=document.getElementById("loginForm");
const keyInput=document.getElementById("apiKey");
const message=document.getElementById("message");
const panel=document.getElementById("recordsPanel");
const rows=document.getElementById("records");
const count=document.getElementById("count");
const apiBase=String(window.SHIVASHA_API_BASE_URL||"").trim().replace(/\/$/,"");
let sessionKey="";

function cell(value){const td=document.createElement("td");td.textContent=value??"";return td}
function dateLabel(value){const date=new Date(value);return Number.isNaN(date.getTime())?"—":date.toLocaleString("hi-IN")}
async function loadRecords(){
  if(!apiBase){message.textContent="API अभी configure नहीं है। Server deploy और health check के बाद api-config.js में HTTPS API URL सेट करें।";return}
  message.textContent="रिकॉर्ड लोड हो रहे हैं…";
  try{
    const response=await fetch(apiBase+"/api/admin/submissions?limit=100",{headers:{Authorization:"Bearer "+sessionKey},cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"रिकॉर्ड प्राप्त नहीं हुए।");
    rows.replaceChildren();
    for(const item of data.items||[]){
      const tr=document.createElement("tr");
      tr.append(cell(dateLabel(item.createdAt)));
      tr.append(cell(item.kind==="request"?"सहायता अनुरोध":"स्वयंसेवक"));
      tr.append(cell(item.category));
      tr.append(cell(item.location));
      tr.append(cell(item.details||"—"));
      tr.append(cell(item.status));
      rows.append(tr);
    }
    count.textContent="कुल रिकॉर्ड: "+(data.items||[]).length;
    panel.hidden=false;
    message.textContent="रिकॉर्ड सुरक्षित रूप से लोड हो गए।";
  }catch(error){panel.hidden=true;message.textContent=error.message||"सर्वर से संपर्क नहीं हो सका।"}
}
form.addEventListener("submit",async event=>{
  event.preventDefault();
  sessionKey=keyInput.value.trim();
  if(sessionKey.length<32){message.textContent="मान्य Admin API Key दर्ज करें।";return}
  keyInput.value="";
  await loadRecords();
});
document.getElementById("refreshButton").addEventListener("click",loadRecords);
document.getElementById("logoutButton").addEventListener("click",()=>{
  sessionKey="";
  rows.replaceChildren();
  panel.hidden=true;
  message.textContent="Logout हो गया।";
});

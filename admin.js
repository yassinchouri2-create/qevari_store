let sb=null;
async function init(){
 if(!window.QEVARI_SUPABASE_URL||window.QEVARI_SUPABASE_URL.includes("PASTE_")){alert("Supabase n'est pas configuré.");return;}
 sb=supabase.createClient(window.QEVARI_SUPABASE_URL,window.QEVARI_SUPABASE_KEY);
 const {data:{session}}=await sb.auth.getSession(); if(session) show();
}
async function login(){
 const email=document.getElementById("email").value.trim(),password=document.getElementById("password").value;
 const {error}=await sb.auth.signInWithPassword({email,password});
 if(error){alert(error.message);return;} show();
}
async function logout(){await sb.auth.signOut();location.reload();}
function show(){document.getElementById("login").hidden=true;document.getElementById("dashboard").hidden=false;renderOrders();}
async function getOrders(){const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false});if(error){alert(error.message);return []}return data||[]}
async function renderOrders(){
 const o=await getOrders();
 document.getElementById("statOrders").textContent=o.length;
 document.getElementById("statRevenue").textContent=o.reduce((a,x)=>a+Number(x.total||0),0)+" DH";
 document.getElementById("statNew").textContent=o.filter(x=>x.status==="Nouveau").length;
 const el=document.getElementById("orders");
 if(!o.length){el.innerHTML='<div class="empty">Aucune commande pour le moment.</div>';return}
  el.innerHTML=o.map(x=>`<article class="order"><div class="order-main"><div><b>${esc(x.id)}</b><span>${new Date(x.created_at).toLocaleString("fr-FR")}</span></div><div><b>${esc(x.customer_name)}</b><span>${esc(x.customer_phone)} • ${esc(x.customer_city)}</span><span>${esc(x.customer_address)}</span></div><div>${(x.items||[]).map(i=>`<span class="tag">${esc(i.name)} — ${i.price} DH${i.selected_image?` <a href="${esc(i.selected_image)}" target="_blank" rel="noopener">Photo choisie</a>`:""}</span>`).join("")}</div></div><div class="order-side"><strong>${x.total} DH</strong><select onchange="setStatus('${x.id}',this.value)">${["Nouveau","Confirmée","Expédiée","Livrée","Annulée"].map(st=>`<option ${x.status===st?"selected":""}>${st}</option>`).join("")}</select></div></article>`).join("")
}
async function setStatus(id,status){const {error}=await sb.from("orders").update({status}).eq("id",id);if(error)alert(error.message);else renderOrders()}
async function clearOrders(){if(!confirm("Supprimer toutes les commandes ?"))return;const {error}=await sb.from("orders").delete().not("id","is",null);if(error)alert(error.message);else renderOrders()}
async function exportCSV(){const o=await getOrders(),rows=[["ID","Date","Nom","Téléphone","Ville","Adresse","Articles","Total","Statut"]];o.forEach(x=>rows.push([x.id,x.created_at,x.customer_name,x.customer_phone,x.customer_city,x.customer_address,(x.items||[]).map(i=>i.name).join(" | "),x.total,x.status]));const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="qevari-orders.csv";a.click()}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
init();

async function getProducts(){
  const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
  if(error){alert(error.message);return []}
  return data||[];
}
async function renderProducts(){
  const products=await getProducts();
  const el=document.getElementById("productsList");
  if(!el)return;
  if(!products.length){el.innerHTML='<div class="empty">Aucun produit.</div>';return}
  el.innerHTML=products.map(p=>`
    <article class="product-row">
      ${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:""}
      <div class="product-info">
        <b>${esc(p.name)}</b>
        <span>${Number(p.price||0).toFixed(2)} DH · Stock: ${p.stock??0}</span>
        <small>${esc(p.category||"")} ${p.active?"· Actif":"· Inactif"}</small>
      </div>
      <div class="product-actions">
        <button onclick="editProduct('${p.id}')">Modifier</button>
        <button onclick="deleteProduct('${p.id}')">Supprimer</button>
      </div>
    </article>`).join("");
}
function openProductForm(p){
  document.getElementById("productForm").hidden=false;
  if(p){
    document.getElementById("productId").value=p.id;
    document.getElementById("productName").value=p.name||"";
    document.getElementById("productPrice").value=p.price||0;
    document.getElementById("productStock").value=p.stock||0;
    document.getElementById("productCategory").value=p.category||"";
    document.getElementById("productImage").value=p.image_url||"";
    document.getElementById("productDescription").value=p.description||"";
    document.getElementById("productActive").checked=!!p.active;
  } else {
    document.getElementById("productId").value="";
    document.getElementById("productName").value="";
    document.getElementById("productPrice").value="";
    document.getElementById("productStock").value=0;
    document.getElementById("productCategory").value="";
    document.getElementById("productImage").value="";
    document.getElementById("productDescription").value="";
    document.getElementById("productActive").checked=true;
  }
}
function closeProductForm(){document.getElementById("productForm").hidden=true}
async function saveProduct(){
  const id=document.getElementById("productId").value;
  const payload={
    name:document.getElementById("productName").value.trim(),
    price:Number(document.getElementById("productPrice").value||0),
    stock:Number(document.getElementById("productStock").value||0),
    category:document.getElementById("productCategory").value.trim(),
    image_url:document.getElementById("productImage").value.trim(),
    description:document.getElementById("productDescription").value.trim(),
    active:document.getElementById("productActive").checked
  };
  if(!payload.name){alert("Nom du produit obligatoire.");return}
  if(!payload.category){alert("Choisis une catégorie pour le produit.");return}
  const q=id?sb.from("products").update(payload).eq("id",id):sb.from("products").insert(payload);
  const {error}=await q;
  if(error){alert(error.message);return}
  closeProductForm(); await renderProducts();
}
async function editProduct(id){
  const {data,error}=await sb.from("products").select("*").eq("id",id).single();
  if(error){alert(error.message);return}
  openProductForm(data);
}
async function deleteProduct(id){
  if(!confirm("Supprimer ce produit ?"))return;
  const {error}=await sb.from("products").delete().eq("id",id);
  if(error){alert(error.message);return}
  renderProducts();
}
async function loadSocialLinks(){
  const {data,error}=await sb.from("site_settings").select("instagram_url,tiktok_url,facebook_url,whatsapp_phone").eq("id",1).maybeSingle();
  if(error){console.warn("QEVARI settings:",error.message);return;}
  document.getElementById("instagramUrl").value=data?.instagram_url||"";
  document.getElementById("tiktokUrl").value=data?.tiktok_url||"";
  document.getElementById("facebookUrl").value=data?.facebook_url||"";
  document.getElementById("whatsappPhone").value=data?.whatsapp_phone||"";
}
async function saveSocialLinks(){
  const payload={
    id:1,
    instagram_url:document.getElementById("instagramUrl").value.trim()||null,
    tiktok_url:document.getElementById("tiktokUrl").value.trim()||null,
    facebook_url:document.getElementById("facebookUrl").value.trim()||null,
    whatsapp_phone:document.getElementById("whatsappPhone").value.trim()||null,
    updated_at:new Date().toISOString()
  };
  const {error}=await sb.from("site_settings").upsert(payload);
  if(error){alert(error.message);return;}
  alert("Liens reseaux sociaux enregistres.");
}
const oldShow=show;
show=async function(){oldShow(); await renderProducts(); await loadSocialLinks();}

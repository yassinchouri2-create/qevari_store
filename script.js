let products=[];
let selectedCategory=null;
const values=[
["Q","QUALITY","Qualité","Calidad","الجودة","Kalite","품질"],
["E","EXCELLENCE","Excellence","Excelencia","التميز","Mükemmellik","우수성"],
["V","VALUE","Valeur","Valor","القيمة","Değer","가치"],
["A","AUTHENTICITY","Authenticité","Autenticidad","الأصالة","Özgünlük","진정성"],
["R","RELIABILITY","Fiabilité","Fiabilidad","الموثوقية","Güvenilirlik","신뢰성"],
["I","INNOVATION","Innovation","Innovación","الابتكار","Yenilik","혁신"]
];

let cart=[];
let activeProductImages=[];
let activeProductImageIndex=0;

function getImageUrls(value){
  return String(value||"").split(/[\n,]/).map(url=>url.trim()).filter(Boolean);
}

function productWithSelectedImage(product){
  const image=activeProductImages[activeProductImageIndex]||"";
  return image?{...product,selected_image:image}:product;
}

function renderValues(){
  const el=document.getElementById("valueGrid");
  if(!el)return;
  el.innerHTML=values.map(v=>`<article class="value"><span class="letter">${v[0]}</span><h3>${v[1]}</h3><div class="langs">
  <span>🇬🇧 <b>${v[1]}</b></span><span>🇫🇷 ${v[2]}</span><span>🇪🇸 ${v[3]}</span><span>🇸🇦 ${v[4]}</span><span>🇹🇷 ${v[5]}</span><span>🇰🇷 ${v[6]}</span>
  </div></article>`).join("");
}

function render(){
  const el=document.getElementById("products");
  if(!el)return;
  const isPreview=selectedCategory===null;
  if(isPreview)document.querySelectorAll(".category-filter").forEach(button=>button.classList.remove("active"));
  const visibleProducts=isPreview
    ? products.slice(0,3)
    : selectedCategory
    ? products.filter(p=>String(p.category||"").trim().toLocaleLowerCase()===selectedCategory.toLocaleLowerCase())
    : products;
  if(!visibleProducts.length){
    el.innerHTML='<div class="empty">Aucun produit disponible pour le moment.</div>';
    renderBag();
    return;
  }
  el.innerHTML=visibleProducts.map(p=>{const imageUrls=getImageUrls(p.image_url);return `<article class="product">
    <button class="photo product-view" onclick="openProductDetails('${escapeHtml(p.id)}')" aria-label="Voir ${escapeHtml(p.name)}">${imageUrls[0] ? `<img src="${escapeHtml(imageUrls[0])}" alt="${escapeHtml(p.name)}" loading="lazy">` : `<span>${escapeHtml((p.name||"Q").charAt(0))}</span>`}</button>
    <div class="info">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="price">${Number(p.price||0).toFixed(2)} DH</div>
      <button class="view-details" onclick="openProductDetails('${escapeHtml(p.id)}')">VOIR LE PRODUIT</button>
      <button class="buy-now" onclick="buyNow('${escapeHtml(p.id)}')">COMMANDER DIRECTEMENT</button>
      <button class="add" onclick="addById('${escapeHtml(p.id)}',event)">AJOUTER AU PANIER</button>
    </div>
  </article>`}).join("")+(isPreview&&products.length>3?'<div class="product-show-all"><p>Découvre toute la collection.</p><button class="view-details" onclick="filterProducts(\'\')">VOIR TOUS LES PRODUITS</button></div>':"");
  renderBag();
}

function filterProducts(category){
  selectedCategory=category||"";
  const title=document.getElementById("collectionTitle");
  if(title) title.textContent=selectedCategory||"NEW IN";
  document.querySelectorAll(".category-filter").forEach(button=>{
    button.classList.toggle("active",selectedCategory!==null&&(button.dataset.category||"").toLocaleLowerCase()===selectedCategory.toLocaleLowerCase());
  });
  render();
}

function goToCategory(category){
  filterProducts(category);
  document.getElementById("new").scrollIntoView({behavior:"smooth",block:"start"});
}

function setupCategoryLinks(){
  const links=[
    ["#men a","Homme"],["#women a","Femme"],
    ["footer div:nth-child(2) a:nth-of-type(1)",""],
    ["footer div:nth-child(2) a:nth-of-type(2)","Homme"],
    ["footer div:nth-child(2) a:nth-of-type(3)","Femme"],
    ["footer div:nth-child(2) a:nth-of-type(4)","Promotions"],
    ["footer div:nth-child(3) a:nth-of-type(1)","values"],
    ["footer div:nth-child(3) a:nth-of-type(2)","Sacs & Accessoires"],
    ["footer div:nth-child(3) a:nth-of-type(3)","Équipement Maison"],
    ["footer div:nth-child(3) a:nth-of-type(4)","Occasion"]
  ];
  links.forEach(([selector,category])=>{
    const link=document.querySelector(selector);
    if(!link)return;
    link.href=category==="values"?"#values":"#new";
    link.addEventListener("click",event=>{
      if(category==="values")return;
      event.preventDefault();
      goToCategory(category);
    });
  });
}

function escapeHtml(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

async function loadProducts(){
  if(!window.QEVARI_SUPABASE_URL || window.QEVARI_SUPABASE_URL.includes("PASTE_")){
    render();
    return;
  }
  try{
    const client=supabase.createClient(window.QEVARI_SUPABASE_URL,window.QEVARI_SUPABASE_KEY);
    const {data,error}=await client.from("products")
      .select("id,name,price,stock,category,image_url,description,active,created_at")
      .eq("active",true)
      .gt("stock",0)
      .order("created_at",{ascending:false});
    if(error) throw error;
    products=(data||[]).map(p=>({
      ...p,
      price:Number(p.price||0)
    }));
    render();
  }catch(err){
    console.error("QEVARI products:",err);
    products=[];
    render();
  }
}

async function loadSocialLinks(){
  if(!window.QEVARI_SUPABASE_URL || window.QEVARI_SUPABASE_URL.includes("PASTE_"))return;
  try{
    const client=supabase.createClient(window.QEVARI_SUPABASE_URL,window.QEVARI_SUPABASE_KEY);
    const {data,error}=await client.from("site_settings").select("instagram_url,tiktok_url,facebook_url,whatsapp_phone").eq("id",1).maybeSingle();
    if(error || !data)return;
    const footerLinks=document.querySelectorAll("footer div:nth-child(4) a");
    [[footerLinks[0],data.instagram_url],[footerLinks[1],data.tiktok_url],[footerLinks[2],data.facebook_url]].forEach(([link,url])=>{
      if(link && url){link.href=url;link.target="_blank";link.rel="noopener";}
    });
    const whatsapp=document.getElementById("whatsappConsultation");
    const phone=String(data.whatsapp_phone||"").replace(/\D/g,"");
    if(whatsapp && phone)whatsapp.href="https://wa.me/"+phone;
  }catch(err){console.warn("QEVARI social links:",err);}
}

function add(i){
  cart.push(products[i]);
  renderBag();
  animateToCart(products[i]);
}

function addById(id,event){
  const product=products.find(p=>String(p.id)===String(id));
  if(!product)return;
  if(getImageUrls(product.image_url).length>1){openProductDetails(id);return;}
  addProductToCart(product,event);
}

function addProductToCart(product,event){
  cart.push(product);
  renderBag();
  animateToCart(product,event?.currentTarget);
}

function animateToCart(product,source){
  const target=document.querySelector(".bag");
  const image=source?.closest(".product")?.querySelector(".photo img")||document.querySelector("#productDetailMainImage img");
  if(!target || !image){showCartNotice(product);return;}
  const from=image.getBoundingClientRect();
  const to=target.getBoundingClientRect();
  const flying=image.cloneNode(true);
  flying.className="cart-fly";
  flying.style.left=from.left+"px";
  flying.style.top=from.top+"px";
  flying.style.width=from.width+"px";
  flying.style.height=from.height+"px";
  document.body.appendChild(flying);
  requestAnimationFrame(()=>{
    flying.style.transform=`translate(${to.left-from.left}px,${to.top-from.top}px) scale(.18)`;
    flying.style.opacity=".55";
  });
  setTimeout(()=>{flying.remove();showCartNotice(product);},650);
}

function showCartNotice(product){
  const previous=document.getElementById("cartNotice");
  if(previous)previous.remove();
  const imageUrl=getImageUrls(product.image_url)[0];
  const notice=document.createElement("div");
  notice.id="cartNotice";
  notice.className="cart-notice";
  notice.innerHTML=`${imageUrl?`<img src="${escapeHtml(imageUrl)}" alt="">`:"<span>Q</span>"}<div><b>AJOUTÉ AU PANIER</b><small>${escapeHtml(product.name||"Produit")}</small></div>`;
  document.body.appendChild(notice);
  setTimeout(()=>notice.remove(),2200);
}

function buyNow(id){
  const product=products.find(p=>String(p.id)===String(id));
  if(!product)return;
  if(getImageUrls(product.image_url).length>1){openProductDetails(id);return;}
  buyProductNow(product);
}

function buyProductNow(product){
  cart=[product];
  renderBag();
  closeProductDetails();
  openBag();
}

function renderBag(){
  const count=document.getElementById("count");
  const items=document.getElementById("items");
  const total=document.getElementById("total");
  if(!count)return;
  count.textContent=cart.length;
  items.innerHTML=cart.length?cart.map((p,i)=>`<div class="bagline"><span>${escapeHtml(p.name)}</span><b>${Number(p.price||0).toFixed(2)} DH</b><button onclick="removeItem(${i})" style="border:0;background:none;cursor:pointer">×</button></div>`).join(""):"<p>Ton panier est vide.</p>";
  total.textContent=cart.reduce((amount,p)=>amount+Number(p.price||0),0).toFixed(2)+" DH";
}

function removeItem(i){cart.splice(i,1);renderBag();}

function openBag(){document.getElementById("bag").classList.add("open");document.getElementById("veil").classList.add("show")}
function closeBag(){document.getElementById("bag").classList.remove("open");document.getElementById("veil").classList.remove("show")}

function checkout(){
  if(!cart.length){alert("Ton panier est vide.");return;}
  document.getElementById("orderModal").classList.add("show");
}

function closeOrder(){document.getElementById("orderModal").classList.remove("show");}

function openProductDetails(id){
  const product=products.find(p=>String(p.id)===String(id));
  if(!product)return;
  activeProductImages=getImageUrls(product.image_url);
  activeProductImageIndex=0;
  document.getElementById("productDetailName").textContent=product.name||"Produit";
  document.getElementById("productDetailPrice").textContent=Number(product.price||0).toFixed(2)+" DH";
  document.getElementById("productDetailDescription").textContent=product.description||"Aucune description disponible pour le moment.";
  document.getElementById("productDetailAdd").onclick=()=>{addProductToCart(productWithSelectedImage(product),{currentTarget:document.getElementById("productDetailAdd")});closeProductDetails();};
  document.getElementById("productDetailBuyNow").onclick=()=>buyProductNow(productWithSelectedImage(product));
  renderProductGallery();
  document.getElementById("productDetailModal").classList.add("show");
}

function renderProductGallery(){
  const main=document.getElementById("productDetailMainImage");
  const thumbs=document.getElementById("productDetailThumbnails");
  const imageUrl=activeProductImages[activeProductImageIndex];
  main.innerHTML=imageUrl?`<img src="${escapeHtml(imageUrl)}" alt="">`:"<span>Q</span>";
  thumbs.innerHTML=activeProductImages.length>1?activeProductImages.map((url,index)=>`<button class="product-thumb ${index===activeProductImageIndex?"active":""}" onclick="selectProductImage(${index})"><img src="${escapeHtml(url)}" alt=""></button>`).join(""):"";
}
function selectProductImage(index){activeProductImageIndex=index;renderProductGallery();}
function closeProductDetails(){document.getElementById("productDetailModal").classList.remove("show");}

async function submitOrder(e){
 e.preventDefault();
 if(!cart.length){alert("Ton panier est vide.");closeOrder();return;}
 const fd=new FormData(e.target);
 const items=cart.map(p=>({id:p.id,name:String(p.name||"Produit"),selected_image:p.selected_image||null,price:Number(p.price||0)}));
 const total=items.reduce((amount,item)=>amount+item.price,0);
 if(!Number.isFinite(total) || total<=0){alert("Le total de la commande est invalide. Vérifie les prix des produits.");return;}
 const order={customer_name:fd.get("name").trim(),customer_phone:fd.get("phone").trim(),customer_city:fd.get("city").trim(),customer_address:fd.get("address").trim(),items,total,status:"Nouveau"};
 if(!window.QEVARI_SUPABASE_URL || window.QEVARI_SUPABASE_URL.includes("PASTE_")){alert("Supabase n'est pas configuré.");return;}
 try{
  const client=supabase.createClient(window.QEVARI_SUPABASE_URL,window.QEVARI_SUPABASE_KEY);
  const {error}=await client.from("orders").insert([order]);
  if(error) throw error;
  cart=[]; renderBag(); closeOrder(); e.target.reset(); closeBag();
  document.getElementById("successModal").classList.add("show");
  document.getElementById("whatsappOrder").style.display="none";
 }catch(err){console.error("QEVARI order:",err);alert(`Impossible d'enregistrer la commande. ${err.message||"Vérifie Supabase/RLS puis exécute SUPABASE_SQL.txt."}`);}
}
function closeSuccess(){document.getElementById("successModal").classList.remove("show");}

function join(e){
  e.preventDefault();
  document.getElementById("msg").textContent="Merci ! Bienvenue dans QEVARI Club.";
  document.getElementById("email").value="";
}

renderValues();
setupCategoryLinks();
loadProducts();
loadSocialLinks();

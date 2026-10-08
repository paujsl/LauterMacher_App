"use strict";

/* =====================================================================
   LAUTERMACHER — APP.JS V5.0.0
   Supabase = source de vérité. Aucun localStorage métier.
   ===================================================================== */

const SUPABASE_URL = "https://gsbkfrjhierqopkwpqjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_xiM5w8RhiN0I0j5HSVPfnw_LhLQgozX";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* Pendant le développement Pauline + ChatGPT : false = horaires scolaires actifs. */
const DEVELOPMENT_MODE = true;
const SCHOOL_OPEN_HOUR = 9;
const SCHOOL_CLOSE_HOUR = 15;

const $ = id => document.getElementById(id);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const integer = value => Number.parseInt(value, 10) || 0;
const number = value => Number(value) || 0;
const money = value => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(number(value));
const dateDE = value => value ? new Intl.DateTimeFormat("de-DE").format(new Date(`${value}T12:00:00`)) : "—";
const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const state = {
    currentPerson:null,
    selectedLoginPerson:null,
    products:[],
    inventory:[],
    drinksCart:{},
    bakeryCart:{},
    eventCart:{},
    currentEvent:null,
    events:[],
    notifications:[],
    notificationMode:"received",
    reportPeriod:"today",
    reportSort:"revenue",
    drinksReceivedCents:0,
    bakeryReceivedCents:0,
    eventReceivedCents:0,
    currentScreenId:"identityScreen",
    previousScreenId:null,
    realtimeChannel:null,
    bakeryTestOrders:[],
    eventTestOrders:{},
    confirmAction:null
};

function setText(id,value){const el=$(id);if(el)el.textContent=value??"";}
function setHTML(id,value){const el=$(id);if(el)el.innerHTML=value??"";}
function show(el,display=""){if(el){el.hidden=false;if(display)el.style.display=display;}}
function hide(el){if(el){el.hidden=true;el.style.display="none";}}
function isTeacher(){return state.currentPerson?.person_type==="lehrer";}
function personName(person){return [person?.first_name,person?.last_name].filter(Boolean).join(" ").trim()||person?.display_name||person?.name||"—";}
function productArea(p){return String(p?.area||p?.category||p?.product_area||"").toLowerCase();}
function productIcon(p){return p?.icon||p?.emoji||"•";}
function productPrice(p){return number(p?.sale_price??p?.price??p?.unit_price);}
function activeProduct(p){return p?.active!==false;}
function toast(message,type="info"){
    const box=$("toastContainer"); if(!box){console.log(message);return;}
    const el=document.createElement("div"); el.className=`toast toast-${type}`; el.textContent=message; box.appendChild(el);
    setTimeout(()=>el.remove(),3500);
}
function parseMoney(value){
    if(typeof value==="number")return value;
    const s=String(value??"").trim().replace(/\s/g,"").replace("€","").replace(/\./g,"").replace(",",".");
    const n=Number(s); return Number.isFinite(n)?n:0;
}
function centsAppend(current,value){
    const digits=String(Math.max(0,integer(current)))+(String(value||"").replace(/\D/g,""));
    return integer(digits.replace(/^0+(?=\d)/,"").slice(0,7)||"0");
}
function centsDelete(current){
    const s=String(Math.max(0,integer(current))); return s.length<=1?0:integer(s.slice(0,-1));
}
function cartTotal(cart){return Object.values(cart||{}).reduce((sum,x)=>sum+productPrice(x)*integer(x.quantity),0);}
function cartItemsForRpc(cart){
    return Object.values(cart||{}).filter(x=>integer(x.quantity)>0).map(x=>({
        product_id:x.id,
        quantity:integer(x.quantity),
        unit_price:productPrice(x)
    }));
}
function cartAdd(cart,product){
    if(!cart[product.id])cart[product.id]={...product,quantity:0};
    cart[product.id].quantity++;
}
function cartChange(cart,id,delta){
    if(!cart[id])return;
    cart[id].quantity=Math.max(0,integer(cart[id].quantity)+delta);
    if(!cart[id].quantity)delete cart[id];
}
function clearCart(cart){Object.keys(cart).forEach(k=>delete cart[k]);}

/* =====================================================================
   NAVIGATION / HEADER
   ===================================================================== */

const screenTitles = {
    homeScreen:"Startseite",
    drinksSaleScreen:"Getränke",
    drinksPaymentScreen:"Getränke · Bezahlen",
    drinksSuccessScreen:"Getränke",
    freeDrinksScreen:"Getränke · Schichtende",
    bakeryMenuScreen:"Bäckerei",
    bakerySaleScreen:"Bäckerei · Kasse",
    bakeryPaymentScreen:"Bäckerei · Bezahlen",
    bakerySuccessScreen:"Bäckerei",
    bakeryOutputScreen:"Bäckerei · Ausgabe",
    editMenuScreen:"Bearbeiten",
    productsScreen:"Bearbeiten · Produkte",
    studentInventoryScreen:"Bearbeiten · Inventur",
    teacherInventoryScreen:"Bearbeiten · Inventur",
    invoicesScreen:"Bearbeiten · Rechnungen",
    studentsScreen:"Bearbeiten · Schüler",
    notificationsScreen:"Benachrichtigungen",
    reportsScreen:"Berichte",
    eventsScreen:"Sonderveranstaltung",
    eventTypeScreen:"Sonderveranstaltung · Neu",
    eventCreateScreen:"Sonderveranstaltung · Neu",
    eventWorkspaceScreen:"Sonderveranstaltung",
    eventProductsScreen:"Sonderveranstaltung · Produkte",
    eventSaleScreen:"Sonderveranstaltung · Kasse",
    eventPaymentScreen:"Sonderveranstaltung · Bezahlen",
    eventSuccessScreen:"Sonderveranstaltung",
    eventOutputScreen:"Sonderveranstaltung · Ausgabe",
    eventEndInventoryScreen:"Sonderveranstaltung · Endinventur"
};

function showScreen(id,{login=false}={}){
    $$(".screen").forEach(el=>{el.style.display="none";el.classList.remove("screen-visible");});
    const target=$(id); if(!target)return;
    target.hidden=false; target.style.display="block"; target.classList.add("screen-visible");
    state.previousScreenId=state.currentScreenId;
    state.currentScreenId=id;
    const authenticated=!!state.currentPerson&&!login;
    const header=$("appHeader"), breadcrumb=$("breadcrumb");
    if(header){header.hidden=!authenticated;header.style.display=authenticated?"":"none";}
    if(breadcrumb){breadcrumb.hidden=!authenticated||id==="homeScreen";breadcrumb.style.display=(!authenticated||id==="homeScreen")?"none":"";}
    setText("breadcrumbCurrent",screenTitles[id]||"");
    window.scrollTo({top:0,behavior:"auto"});
}
function goHome(){showScreen("homeScreen");}
$("homeLogoButton")?.addEventListener("click",goHome);
$("breadcrumbHomeButton")?.addEventListener("click",goHome);

function applyRoleUI(){
    const teacher=isTeacher();
    $$(".teacher-only").forEach(el=>{
        el.hidden=!teacher;
        if(teacher)el.style.display="";
        else el.style.display="none";
    });
    document.body.classList.toggle("teacher-mode",teacher);
    setText("currentPersonName",personName(state.currentPerson));
    setText("currentPersonRole",teacher?"Lehrkraft":"Schüler");
    setText("homeRoleLabel",teacher?"Lehrkraft":"Schüler");
    $("currentPersonRole")?.classList.toggle("teacher-role",teacher);
    $("homeRoleLabel")?.classList.toggle("teacher-role",teacher);
    ["homeDrinksTestBadge","homeBakeryTestBadge"].forEach(id=>{const el=$(id);if(el){el.hidden=!teacher;el.style.display=teacher?"":"none";}});
}

/* =====================================================================
   SCHULZEITEN
   ===================================================================== */

function schoolOpenNow(){
    if(DEVELOPMENT_MODE)return true;
    const now=new Date(), h=now.getHours();
    return h>=SCHOOL_OPEN_HOUR&&h<SCHOOL_CLOSE_HOUR;
}
function studentMayOpenPin(person){
    return person?.person_type==="lehrer"||schoolOpenNow();
}
function showSchoolClosed(){
    state.selectedLoginPerson=null;
    showScreen("schoolClosedScreen",{login:true});
}

/* =====================================================================
   AUTH / LOGIN
   ===================================================================== */

async function loadLoginPeople(){
    try{
        let {data,error}=await db.rpc("get_login_people");
        if(error){
            const fallback=await db.from("login_people").select("*");
            data=fallback.data; error=fallback.error;
        }
        if(error)throw error;
        const grid=$("peopleGrid"); if(!grid)return;
        grid.innerHTML="";
        (data||[]).forEach(person=>{
            const btn=document.createElement("button");
            btn.type="button"; btn.className="person-card";
            btn.innerHTML=`<span class="person-avatar">${person.person_type==="lehrer"?"👨‍🏫":"👤"}</span><strong>${esc(personName(person))}</strong><small>${person.person_type==="lehrer"?"Lehrkraft":"Schüler"}</small>`;
            btn.addEventListener("click",()=>{
                state.selectedLoginPerson=person;
                if(!studentMayOpenPin(person)){showSchoolClosed();return;}
                setText("selectedPersonName",personName(person));
                $("loginPinInput").value="";
                setText("pinLoginError","");
                showScreen("pinLoginScreen",{login:true});
                setTimeout(()=>$("loginPinInput")?.focus(),50);
            });
            grid.appendChild(btn);
        });
        setText("identityError","");
    }catch(error){
        console.error(error); setText("identityError","Personen konnten nicht geladen werden.");
    }
}

$("loginBackButton")?.addEventListener("click",()=>{state.selectedLoginPerson=null;showScreen("identityScreen",{login:true});});
$("loginConfirmButton")?.addEventListener("click",loginWithPin);
$("loginPinInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")loginWithPin();});

async function loginWithPin(){
    const person=state.selectedLoginPerson, pin=String($("loginPinInput")?.value||"").trim();
    if(!person)return;
    if(!studentMayOpenPin(person)){showSchoolClosed();return;}
    if(!/^\d{4}$/.test(pin)){setText("pinLoginError","Bitte eine vierstellige PIN eingeben.");return;}
    const button=$("loginConfirmButton"); if(button)button.disabled=true;
    try{
        const {data,error}=await db.functions.invoke("login-with-pin",{body:{person_id:person.id,pin}});
        if(error)throw error;
        if(!data?.success||!data?.token_hash)throw new Error(data?.error||"PIN falsch.");
        const {error:verifyError}=await db.auth.verifyOtp({token_hash:data.token_hash,type:data.verification_type});
        if(verifyError)throw verifyError;
        await initialiseAuthenticatedApp();
    }catch(error){
        console.error(error); setText("pinLoginError",error?.message==="PIN falsch."?"PIN falsch.":"Anmeldung fehlgeschlagen.");
    }finally{if(button)button.disabled=false;}
}

async function loadCurrentPerson(){
    const {data:{session}}=await db.auth.getSession();
    if(!session)return null;
    const {data,error}=await db.from("people").select("*").eq("auth_user_id",session.user.id).eq("active",true).maybeSingle();
    if(error)throw error;
    state.currentPerson=data;
    return data;
}

async function initialiseAuthenticatedApp(){
    try{
        const person=await loadCurrentPerson();
        if(!person){await db.auth.signOut();return;}
        if(!isTeacher()&&!schoolOpenNow()){await db.auth.signOut();showSchoolClosed();return;}
        applyRoleUI();
        await Promise.all([loadProducts(),loadInventory(),loadNotifications(),loadEvents()]);
        startRealtime();
        goHome();
    }catch(error){console.error(error);toast("Die App konnte nicht geladen werden.","error");}
}

$("logoutButton")?.addEventListener("click",async()=>{
    if(state.realtimeChannel){await db.removeChannel(state.realtimeChannel);state.realtimeChannel=null;}
    await db.auth.signOut();
    state.currentPerson=null;state.selectedLoginPerson=null;
    showScreen("identityScreen",{login:true});await loadLoginPeople();
});

/* =====================================================================
   PRODUCTS / INVENTORY
   ===================================================================== */

async function loadProducts() {
    let { data, error } = await db
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    // Si la colonne de tri n'existe pas, réessayer sans elle.
    if (error && (
        error.code === "42703" ||
        /sort_order|column.*does not exist/i.test(error.message || "")
    )) {
        console.warn("Tri sort_order indisponible, nouvel essai :", error.message);

        const retry = await db
            .from("products")
            .select("*")
            .order("name", { ascending: true });

        data = retry.data;
        error = retry.error;
    }

    if (error) {
        console.error("Erreur de chargement des produits :", error);
        toast("Produkte konnten nicht geladen werden.", "error");
        return;
    }

    state.products = data || [];

    console.info("Produits chargés :", state.products.length);

    if (state.currentScreenId === "drinksSaleScreen") renderDrinksSale();
    if (state.currentScreenId === "bakerySaleScreen") renderBakerySale();
    if (state.currentScreenId === "productsScreen") renderProductsAdmin();
}
async function loadInventory(){
    const {data,error}=await db.from("inventory").select("*");
    if(error){console.error(error);return;}
    state.inventory=data||[];
}
function inventoryForProduct(id){
    const row=state.inventory.find(x=>x.product_id===id);
    return integer(row?.quantity??row?.current_quantity??row?.stock_quantity);
}

/* =====================================================================
   HOME
   ===================================================================== */

$("homeDrinksButton")?.addEventListener("click",()=>{clearCart(state.drinksCart);renderDrinksSale();showScreen("drinksSaleScreen");});
$("homeBakeryButton")?.addEventListener("click",()=>showScreen("bakeryMenuScreen"));
$("homeEditButton")?.addEventListener("click",()=>showScreen("editMenuScreen"));
$("homeReportsButton")?.addEventListener("click",async()=>{showScreen("reportsScreen");await loadReports();});
$("homeEventsButton")?.addEventListener("click",async()=>{showScreen("eventsScreen");await loadEvents();});

/* =====================================================================
   CART RENDER
   ===================================================================== */

function renderProductGrid(containerId,products,cart,onChange){
    const grid=$(containerId); if(!grid)return;
    grid.innerHTML="";
    products.filter(activeProduct).forEach(p=>{
        const btn=document.createElement("button");btn.type="button";btn.className="sale-product-card";
        const qty=integer(cart[p.id]?.quantity);
        btn.innerHTML=`<span class="sale-product-icon">${esc(productIcon(p))}</span><strong>${esc(p.name)}</strong><span>${money(productPrice(p))}</span>${qty?`<b class="product-quantity-badge">${qty}</b>`:""}`;
        btn.addEventListener("click",()=>{cartAdd(cart,p);onChange();});
        grid.appendChild(btn);
    });
}
function renderCart(containerId,totalId,buttonId,cart,onChange){
    const box=$(containerId);if(!box)return;
    const items=Object.values(cart);
    box.innerHTML=items.length?"":`<div class="empty-cart">Noch keine Produkte.</div>`;
    items.forEach(item=>{
        const row=document.createElement("div");row.className="cart-row";
        row.innerHTML=`<div><strong>${esc(productIcon(item))} ${esc(item.name)}</strong><small>${money(productPrice(item))}</small></div><div class="quantity-control"><button type="button" data-minus>−</button><span>${integer(item.quantity)}</span><button type="button" data-plus>+</button></div><strong>${money(productPrice(item)*integer(item.quantity))}</strong>`;
        row.querySelector("[data-minus]").onclick=()=>{cartChange(cart,item.id,-1);onChange();};
        row.querySelector("[data-plus]").onclick=()=>{cartChange(cart,item.id,1);onChange();};
        box.appendChild(row);
    });
    const total=cartTotal(cart);setText(totalId,money(total));
    const pay=$(buttonId);if(pay)pay.disabled=total<=0;
}

/* =====================================================================
   GETRÄNKE
   ===================================================================== */

function drinksProducts(){return state.products.filter(p=>productArea(p).includes("geträn")||productArea(p)==="drinks");}
function renderDrinksSale(){
    renderProductGrid("drinksProductGrid",drinksProducts(),state.drinksCart,renderDrinksSale);
    renderCart("drinksCartItems","drinksCartTotal","drinksPayButton",state.drinksCart,renderDrinksSale);
    const teacher=isTeacher();["drinksTestBanner"].forEach(id=>{const e=$(id);if(e){e.hidden=!teacher;e.style.display=teacher?"":"none";}});
}
$("drinksSaleBackButton")?.addEventListener("click",goHome);
$("drinksPayButton")?.addEventListener("click",()=>{
    if(cartTotal(state.drinksCart)<=0)return;
    state.drinksReceivedCents=0;renderDrinksPayment();showScreen("drinksPaymentScreen");
});
$("drinksPaymentBackButton")?.addEventListener("click",()=>showScreen("drinksSaleScreen"));

function renderDrinksPayment(){
    const total=cartTotal(state.drinksCart),received=state.drinksReceivedCents/100;
    setText("drinksPaymentTotal",money(total));setText("drinksAmountReceived",money(received));setText("drinksChangeAmount",money(Math.max(0,received-total)));
    const b=$("drinksPaidButton");if(b)b.disabled=total<=0||received+0.0001<total;
    const banner=$("drinksPaymentTestBanner");if(banner){banner.hidden=!isTeacher();banner.style.display=isTeacher()?"":"none";}
}
$("drinksPaymentKeypad")?.addEventListener("click",e=>{
    const key=e.target.closest(".payment-key");if(!key)return;
    if(key.id==="drinksDeletePaymentButton")state.drinksReceivedCents=centsDelete(state.drinksReceivedCents);
    else state.drinksReceivedCents=centsAppend(state.drinksReceivedCents,key.dataset.value);
    renderDrinksPayment();
});
$("drinksPaidButton")?.addEventListener("click",async event=>{
    event.preventDefault();
   
    const total=cartTotal(state.drinksCart),received=state.drinksReceivedCents/100;
    if(total<=0||received+0.0001<total)return;
    const btn=$("drinksPaidButton");btn.disabled=true;
    try{
        if(isTeacher()){
            setText("drinksSuccessDescription","Testverkauf – keine Daten wurden gespeichert.");
        }else{
            const {error}=await db.rpc("create_sale_order",{p_area:"getränke",p_items:cartItemsForRpc(state.drinksCart),p_payment_amount:received});
            if(error)throw error;
            setText("drinksSuccessDescription","Verkauf wurde gespeichert.");
        }
        setText("drinksSuccessChange",money(received-total));
        clearCart(state.drinksCart);state.drinksReceivedCents=0;showScreen("drinksSuccessScreen");
    }catch(error){console.error(error);toast("Zahlung konnte nicht gespeichert werden.","error");renderDrinksPayment();}
});
$("drinksNewOrderButton")?.addEventListener("click",()=>{renderDrinksSale();showScreen("drinksSaleScreen");});
$("drinksShiftEndButton")?.addEventListener("click",()=>openFreeDrinks("drinksSaleScreen"));
$("drinksSuccessShiftEndButton")?.addEventListener("click",()=>openFreeDrinks("drinksSuccessScreen"));

/* =====================================================================
   FREE DRINKS
   ===================================================================== */

function openFreeDrinks(backScreen){
    state.freeDrinksBackScreen=backScreen;
    const banner=$("freeDrinksTestBanner");if(banner){banner.hidden=!isTeacher();banner.style.display=isTeacher()?"":"none";}
    renderFreeDrinks();showScreen("freeDrinksScreen");
}
function renderFreeDrinks(){
    const box=$("freeDrinksList");if(!box)return;box.innerHTML="";
    drinksProducts().filter(activeProduct).forEach(p=>{
        const row=document.createElement("div");row.className="quantity-product-row";row.dataset.productId=p.id;row.dataset.quantity="0";
        row.innerHTML=`<span>${esc(productIcon(p))}</span><strong>${esc(p.name)}</strong><div class="quantity-control"><button type="button" data-minus>−</button><span data-value>0</span><button type="button" data-plus>+</button></div>`;
        const update=d=>{const q=Math.max(0,integer(row.dataset.quantity)+d);row.dataset.quantity=q;row.querySelector("[data-value]").textContent=q;};
        row.querySelector("[data-minus]").onclick=()=>update(-1);row.querySelector("[data-plus]").onclick=()=>update(1);box.appendChild(row);
    });
}
$("freeDrinksBackButton")?.addEventListener("click",()=>showScreen(state.freeDrinksBackScreen||"drinksSaleScreen"));
$("freeDrinksNoneButton")?.addEventListener("click",()=>finishFreeDrinks([]));
$("freeDrinksSaveButton")?.addEventListener("click",()=>{
    const items=$$("#freeDrinksList [data-product-id]").map(row=>({product_id:row.dataset.productId,quantity:integer(row.dataset.quantity)})).filter(x=>x.quantity>0);
    finishFreeDrinks(items);
});
async function finishFreeDrinks(items){
    try{
        if(!isTeacher()&&items.length){
            const {error}=await db.rpc("record_free_drinks",{p_items:items,p_context:"getränke",p_event_id:null});
            if(error)throw error;
        }
        toast("Gut gemacht heute, Team! 🎉","success");goHome();
    }catch(error){console.error(error);toast("Schicht konnte nicht beendet werden.","error");}
}

/* =====================================================================
   BÄCKEREI
   ===================================================================== */

function bakeryProducts(){return state.products.filter(p=>productArea(p).includes("bäck")||productArea(p).includes("back")||productArea(p)==="bakery");}
$("bakeryMenuBackButton")?.addEventListener("click",goHome);
$("bakeryCashierButton")?.addEventListener("click",()=>{clearCart(state.bakeryCart);renderBakerySale();showScreen("bakerySaleScreen");});
$("bakeryOutputButton")?.addEventListener("click",async()=>{showScreen("bakeryOutputScreen");await loadBakeryOrders();});
$("bakerySaleBackButton")?.addEventListener("click",()=>showScreen("bakeryMenuScreen"));
function renderBakerySale(){
    renderProductGrid("bakeryProductGrid",bakeryProducts(),state.bakeryCart,renderBakerySale);
    renderCart("bakeryCartItems","bakeryCartTotal","bakeryPayButton",state.bakeryCart,renderBakerySale);
    const banner=$("bakerySaleTestBanner");if(banner){banner.hidden=!isTeacher();banner.style.display=isTeacher()?"":"none";}
}
$("bakeryPayButton")?.addEventListener("click",()=>{
    if(cartTotal(state.bakeryCart)<=0)return;
    state.bakeryReceivedCents=0;renderBakeryPayment();showScreen("bakeryPaymentScreen");
});
$("bakeryPaymentBackButton")?.addEventListener("click",()=>showScreen("bakerySaleScreen"));
function renderBakeryPayment(){
    const total=cartTotal(state.bakeryCart),received=state.bakeryReceivedCents/100;
    setText("bakeryPaymentTotal",money(total));setText("bakeryAmountReceived",money(received));setText("bakeryChangeAmount",money(Math.max(0,received-total)));
    const b=$("bakeryPaidButton");if(b)b.disabled=total<=0||received+0.0001<total;
    const banner=$("bakeryPaymentTestBanner");if(banner){banner.hidden=!isTeacher();banner.style.display=isTeacher()?"":"none";}
}
$("bakeryPaymentKeypad")?.addEventListener("click",e=>{
    const key=e.target.closest(".payment-key");if(!key)return;
    if(key.id==="bakeryDeletePaymentButton")state.bakeryReceivedCents=centsDelete(state.bakeryReceivedCents);
    else state.bakeryReceivedCents=centsAppend(state.bakeryReceivedCents,key.dataset.value);
    renderBakeryPayment();
});
$("bakeryPaidButton")?.addEventListener("click",async event=>{
    event.preventDefault();
   
    const total=cartTotal(state.bakeryCart),received=state.bakeryReceivedCents/100;if(total<=0||received+0.0001<total)return;
    const btn=$("bakeryPaidButton");btn.disabled=true;
    try{
        let orderNumber;
        if(isTeacher()){
            orderNumber=String(Math.floor(100+Math.random()*900));
            state.bakeryTestOrders.unshift({id:crypto.randomUUID(),order_number:orderNumber,status:"offen",created_at:new Date().toISOString(),items:Object.values(state.bakeryCart).map(x=>({...x}))});
        }else{
            const {data,error}=await db.rpc("create_sale_order",{p_area:"bäckerei",p_items:cartItemsForRpc(state.bakeryCart),p_payment_amount:received});
            if(error)throw error;
            orderNumber=data?.order_number||data?.[0]?.order_number||"---";
        }
        setText("bakerySuccessOrderNumber",orderNumber);setText("bakerySuccessChange",money(received-total));
        clearCart(state.bakeryCart);state.bakeryReceivedCents=0;showScreen("bakerySuccessScreen");
    }catch(error){console.error(error);toast("Zahlung konnte nicht gespeichert werden.","error");renderBakeryPayment();}
});
$("bakeryNewOrderButton")?.addEventListener("click",()=>{renderBakerySale();showScreen("bakerySaleScreen");});
$("bakeryOutputBackButton")?.addEventListener("click",()=>showScreen("bakeryMenuScreen"));
$("bakeryCashShiftEndButton")?.addEventListener("click",()=>{toast("Gut gemacht heute, Team! 🎉","success");goHome();});
$("bakeryOutputShiftEndButton")?.addEventListener("click",()=>{toast("Gut gemacht heute, Team! 🎉","success");goHome();});

async function loadBakeryOrders(){
    const banner=$("bakeryOutputTestBanner");if(banner){banner.hidden=!isTeacher();banner.style.display=isTeacher()?"":"none";}
    if(isTeacher()){renderBakeryOrders(state.bakeryTestOrders);return;}
    const {data,error}=await db.from("orders").select("*,order_items(*)").eq("area","bäckerei").order("created_at",{ascending:false}).limit(100);
    if(error){console.error(error);toast("Bestellungen konnten nicht geladen werden.","error");return;}
    renderBakeryOrders(data||[]);
}
function renderBakeryOrders(orders){
    const open=orders.filter(o=>o.status==="offen"),done=orders.filter(o=>o.status!=="offen").slice(0,20);
    setText("bakeryOpenOrderCount",open.length);setText("bakeryCompletedOrderCount",done.length);
    const openBox=$("bakeryOutputOrders"),doneBox=$("bakeryCompletedOrders");if(!openBox||!doneBox)return;
    openBox.innerHTML=open.length?"":`<div class="empty-state"><strong>Alles erledigt!</strong></div>`;
    open.forEach(o=>{
        const card=document.createElement("article");card.className="output-order-card";
        const items=o.order_items||o.items||[];
        card.innerHTML=`<div class="output-order-number">${esc(o.order_number||"---")}</div><div class="output-order-items">${items.map(i=>`<div>${integer(i.quantity)}× ${esc(i.product_name||i.name||state.products.find(p=>p.id===i.product_id)?.name||"Produkt")}</div>`).join("")}</div><button class="primary-action" type="button">Ausgegeben</button>`;
        card.querySelector("button").onclick=()=>serveBakeryOrder(o.id);openBox.appendChild(card);
    });
    doneBox.innerHTML=done.length?"":`<div class="empty-state"><small>Noch keine fertige Bestellung.</small></div>`;
    done.forEach(o=>{const row=document.createElement("div");row.className="completed-order-row";row.innerHTML=`<strong>#${esc(o.order_number||"---")}</strong><span>✓ Fertig</span>`;doneBox.appendChild(row);});
}
async function serveBakeryOrder(id){
    try{
        if(isTeacher()){
            const row=state.bakeryTestOrders.find(x=>x.id===id);if(row)row.status="ausgegeben";renderBakeryOrders(state.bakeryTestOrders);return;
        }
        const {error}=await db.rpc("serve_bakery_order",{p_order_id:id});if(error)throw error;await loadBakeryOrders();
    }catch(error){console.error(error);toast("Bestellung konnte nicht abgeschlossen werden.","error");}
}

/* =====================================================================
   BEARBEITEN
   ===================================================================== */

$("editMenuBackButton")?.addEventListener("click",goHome);
$("productsButton")?.addEventListener("click",()=>{renderProductsAdmin();showScreen("productsScreen");});
$("inventoryButton")?.addEventListener("click",async()=>{
    if(isTeacher()){await renderTeacherInventory();showScreen("teacherInventoryScreen");}
    else{renderStudentInventory();showScreen("studentInventoryScreen");}
});
$("invoicesButton")?.addEventListener("click",async()=>{if(!isTeacher())return;showScreen("invoicesScreen");await initialiseInvoices();});
$("studentsButton")?.addEventListener("click",async()=>{if(!isTeacher())return;showScreen("studentsScreen");await loadStudents();});
$("notificationsAdminButton")?.addEventListener("click",async()=>{if(!isTeacher())return;showScreen("notificationsScreen");await openNotificationsAdmin();});

/* =====================================================================
   PRODUKTE
   ===================================================================== */

let productFilter = "all";
let productEditorProduct = null;
let productEditorOpen = false;
let productEditorDirty = false;
let productSaving = false;
let productsRenderGeneration = 0;


$("productsBackButton")?.addEventListener("click", () => {
    if (closeProductEditor()) {
        showScreen("editMenuScreen");
    }
});


$$("[data-product-filter]").forEach(button => {
    button.addEventListener("click", () => {
        productFilter = button.dataset.productFilter;

        $$("[data-product-filter]").forEach(item => {
            item.classList.toggle(
                "active",
                item === button
            );
        });

        renderProductsAdmin();
    });
});


$("addProductButton")?.addEventListener(
    "click",
    () => openProductModal(null)
);

$("closeProductModalButton")?.addEventListener(
    "click",
    () => closeProductEditor()
);

$("cancelProductButton")?.addEventListener(
    "click",
    () => closeProductEditor()
);

$("productForm")?.addEventListener("input", () => {
    productEditorDirty = true;
});

$("productForm")?.addEventListener("change", () => {
    productEditorDirty = true;
});

$("productForm")?.addEventListener(
    "submit",
    saveProduct
);


function closeProductEditor(force = false) {
    if (productSaving && !force) {
        return false;
    }

    if (
        !force &&
        productEditorDirty &&
        !confirm("Nicht gespeicherte Änderungen verwerfen?")
    ) {
        return false;
    }

    productEditorOpen = false;
    productEditorDirty = false;
    productEditorProduct = null;

    const editor = $("productModal");

    if (editor) {
        editor.hidden = true;

        $("productsScreen")
            .querySelector(".admin-content")
            .appendChild(editor);
    }

    return true;
}


function openProductModal(product) {
    if (!state.currentPerson || productSaving) {
        return;
    }

    if (!closeProductEditor()) {
        return;
    }

    productEditorProduct = product
        ? { ...product }
        : null;

    $("productForm").reset();

    $("productIdInput").value =
        product?.id || "";

    $("productNameInput").value =
        product?.name || "";

    $("productPriceInput").value = product
        ? Number(
            product.price ?? productPrice(product)
        ).toFixed(2).replace(".", ",")
        : "";

    $("productCategoryInput").value =
        productArea(product).includes("bäck")
            ? "bäckerei"
            : "getränke";

    $("productIconInput").value =
        product?.icon || "";

    $("productActiveInput").checked =
        product?.active !== false;

    setText(
        "productModalTitle",
        product
            ? "Produkt bearbeiten"
            : "Produkt hinzufügen"
    );

    setText("productFormMessage", "");

    productEditorOpen = true;

    const editor = $("productModal");

    const container = Array.from(
        $("productAdminList").children
    ).find(item => {
        return item.dataset.productId ===
            String(product?.id);
    });

    if (container && product) {
        container.appendChild(editor);
    } else {
        $("productAdminList").before(editor);
    }

    editor.hidden = false;

    editor.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    $("productNameInput").focus({
        preventScroll: true
    });
}


function productChangeValue(field, value) {
    if (field === "price") {
        return money(value);
    }

    if (field === "active") {
        return value ? "Aktiv" : "Inaktiv";
    }

    return String(value ?? "—");
}


async function renderProductsAdmin() {
    const box = $("productAdminList");

    if (!box || !state.currentPerson) return;

    const generation = ++productsRenderGeneration;

    let changes = [];

    if (isTeacher()) {
        const { data, error } = await db.rpc(
            "get_product_change_highlights"
        );

        if (generation !== productsRenderGeneration) return;

        if (error) {
            console.error(error);

            toast(
                "Änderungshinweise konnten nicht geladen werden.",
                "error"
            );
        } else {
            changes = data || [];
        }
    }

    if (generation !== productsRenderGeneration) return;

    const editor = $("productModal");

    // Préserver le formulaire et le brouillon pendant la synchronisation.
    if (editor) {
        box.before(editor);
    }

    box.innerHTML = "";

    // Afficher uniquement les produits actifs.
    const products = state.products.filter(product => {
        return activeProduct(product) && (
            productFilter === "all" ||
            productArea(product) === productFilter
        );
    });

    products.forEach(product => {
        const events = changes.filter(change => {
            return change.product_id === String(product.id);
        });

        const fields = new Set(
            events.flatMap(change => change.active_fields || [])
        );

        const marked = field => {
            return fields.has(field)
                ? "product-field-changed"
                : "";
        };

        const item = document.createElement("div");

        item.className = "product-admin-item";
        item.dataset.productId = String(product.id);

        item.innerHTML = `
            <div class="product-admin-row ${
                fields.has("_created") ? "product-added" : ""
            }">
                <div class="product-admin-main">
                    <span
                        data-product-field="icon"
                        class="${marked("icon")}"
                    >
                        ${esc(productIcon(product))}
                    </span>

                    <div>
                        <strong
                            data-product-field="name"
                            class="${marked("name")}"
                        >
                            ${esc(product.name)}
                        </strong>

                        <small>
                            <span
                                data-product-field="price"
                                class="${marked("price")}"
                            >
                                ${money(
                                    product.price ?? productPrice(product)
                                )}
                            </span>

                            ·

                            <span
                                data-product-field="category"
                                class="${marked("category")}"
                            >
                                ${esc(
                                    product.category || productArea(product)
                                )}
                            </span>

                            <span
                                data-product-field="active"
                                class="${marked("active")}"
                            >
                                ${fields.has("active") ? " · Aktiv" : ""}
                            </span>
                        </small>
                    </div>
                </div>

                <div class="product-admin-actions">
                    <button
                        type="button"
                        class="secondary-action"
                        data-edit
                    >
                        Bearbeiten
                    </button>

                    <button
                        type="button"
                        class="danger-action"
                        data-delete
                    >
                        Löschen
                    </button>
                </div>
            </div>
        `;

        item.querySelector("[data-edit]").onclick =
            () => openProductModal(product);

        item.querySelector("[data-delete]").onclick =
            () => deleteProduct(product);

        if (events.length) {
            const details = document.createElement("details");

            details.className = "product-change-popover";

            const labels = {
                name: "Name",
                price: "Preis",
                category: "Bereich",
                icon: "Symbol",
                active: "Status"
            };

            details.innerHTML = `
                <summary>
                    Änderung durch Schüler ansehen
                </summary>

                <div class="product-change-panel">
                    ${events.map(change => {
                        const date = new Intl.DateTimeFormat(
                            "de-DE",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Europe/Berlin"
                            }
                        ).format(new Date(change.changed_at));

                        const text = change.action === "created"
                            ? `${change.actor_name} hat dieses Produkt am ${date} hinzugefügt.`
                            : `${change.actor_name} hat dieses Produkt am ${date} geändert.`;

                        const lines = (change.active_fields || [])
                            .filter(field => field !== "_created")
                            .map(field => {
                                const before = productChangeValue(
                                    field,
                                    change.before_values?.[field]
                                );

                                const after = productChangeValue(
                                    field,
                                    change.after_values?.[field]
                                );

                                return `
                                    <p>
                                        ${esc(labels[field] || field)}:
                                        ${change.action === "created"
                                            ? ""
                                            : esc(before) + " → "}
                                        ${esc(after)}
                                    </p>
                                `;
                            })
                            .join("");

                        return `
                            <p>
                                <strong>${esc(text)}</strong>
                            </p>

                            ${lines}
                        `;
                    }).join("")}

                    <button
                        type="button"
                        class="secondary-action"
                        data-seen
                    >
                        Gesehen
                    </button>
                </div>
            `;

            item.appendChild(details);

            item.querySelectorAll(
                ".product-field-changed"
            ).forEach(field => {
                field.tabIndex = 0;
                field.setAttribute("role", "button");
                field.setAttribute(
                    "aria-label",
                    "Änderung ansehen"
                );

                field.onclick = () => {
                    details.open = true;
                };

                field.onkeydown = event => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        details.open = true;
                    }
                };
            });

            details.querySelector("[data-seen]").onclick =
                async event => {
                    const button = event.currentTarget;

                    button.disabled = true;

                    try {
                        const { error } = await db.rpc(
                            "acknowledge_product_changes",
                            {
                                p_event_ids: events.map(
                                    change => change.id
                                )
                            }
                        );

                        if (error) throw error;

                        await loadNotifications();
                        await renderProductsAdmin();

                    } catch (error) {
                        console.error(error);

                        button.disabled = false;

                        toast(
                            "Hinweis konnte nicht bestätigt werden.",
                            "error"
                        );
                    }
                };
        }

        box.appendChild(item);

        if (
            productEditorOpen &&
            productEditorProduct?.id === product.id
        ) {
            item.appendChild(editor);
        }
    });

    if (!products.length) {
        const empty = document.createElement("p");

        empty.textContent =
            "Keine Produkte in diesem Bereich.";

        box.appendChild(empty);
    }
}

async function saveProduct(event) {
    event.preventDefault();

    if (productSaving || !state.currentPerson) {
        return;
    }

    const name =
        $("productNameInput").value.trim();

    const rawPrice =
        $("productPriceInput")
            .value
            .trim()
            .replace(/\s|€/g, "");

    if (
        !name ||
        !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/
            .test(rawPrice)
    ) {
        setText(
            "productFormMessage",
            "Bitte Name und einen gültigen Preis eingeben, z. B. 1,50."
        );

        return;
    }

    const payload = {
        name,

        price: parseMoney(rawPrice),

        category:
            $("productCategoryInput").value,

        icon:
            $("productIconInput").value.trim() || null,

        active:
            $("productActiveInput").checked
    };

    if (
        !Number.isFinite(payload.price) ||
        payload.price < 0
    ) {
        return;
    }

    productSaving = true;

    $("saveProductButton").disabled = true;

    setText("productFormMessage", "");

    try {
        let query;

        if (productEditorProduct) {
            query = db
                .from("products")
                .update(payload)
                .eq(
                    "id",
                    productEditorProduct.id
                )
                .eq(
                    "edit_version",
                    productEditorProduct.edit_version ?? 0
                );
        } else {
            query = db
                .from("products")
                .insert({
                    id: crypto.randomUUID(),
                    ...payload
                });
        }

        const { data, error } = await query
            .select("id")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error(
                "product_changed_elsewhere"
            );
        }

        closeProductEditor(true);

        await loadProducts();
        await renderProductsAdmin();

        toast(
            "Produkt gespeichert.",
            "success"
        );

    } catch (error) {
        console.error(error);

        setText(
            "productFormMessage",
            error.message === "product_changed_elsewhere"
                ? "Dieses Produkt wurde inzwischen geändert. Dein Entwurf bleibt erhalten. Bitte Änderungen notieren und das Produkt neu öffnen."
                : "Produkt konnte nicht gespeichert werden. Bitte erneut versuchen."
        );

    } finally {
        productSaving = false;

        $("saveProductButton").disabled = false;
    }
}


async function deleteProduct(product) {
    if (
        productSaving ||
        !state.currentPerson ||
        product.active === false
    ) {
        return;
    }

    if (
        !confirm(
            `„${product.name}“ deaktivieren? Das Produkt bleibt im Verlauf erhalten.`
        )
    ) {
        return;
    }

    productSaving = true;

    try {
        const { data, error } = await db
            .from("products")
            .update({
                active: false
            })
            .eq(
                "id",
                product.id
            )
            .eq(
                "edit_version",
                product.edit_version ?? 0
            )
            .select("id")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error(
                "product_changed_elsewhere"
            );
        }

        await loadProducts();
        await renderProductsAdmin();

        toast(
            "Produkt deaktiviert.",
            "success"
        );

    } catch (error) {
        console.error(error);

        toast(
            error.message === "product_changed_elsewhere"
                ? "Produkt inzwischen geändert. Bitte neu laden und erneut prüfen."
                : "Produkt konnte nicht deaktiviert werden.",
            "error"
        );

    } finally {
        productSaving = false;
    }
}
/* =====================================================================
   INVENTUR — SCHÜLER
   ===================================================================== */

$("studentInventoryBackButton")?.addEventListener(
    "click",
    () => showScreen("editMenuScreen")
);

function renderStudentInventory() {

    const box = $("studentInventoryList");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    drinksProducts()
        .filter(activeProduct)
        .forEach(product => {

            const row = document.createElement("div");

            row.className = "inventory-count-row";
            row.dataset.productId = product.id;

            row.innerHTML = `
                <div class="inventory-product-info">
                    <span class="inventory-product-icon">
                        ${esc(productIcon(product))}
                    </span>

                    <div>
                        <strong>
                            ${esc(product.name)}
                        </strong>

                        <small>
                            Aktueller Bestand:
                            ${inventoryForProduct(product.id)}
                        </small>
                    </div>
                </div>

                <input
                    class="inventory-count-input"
                    data-inventory-count
                    inputmode="numeric"
                    min="0"
                    placeholder="0"
                    type="number"
                />
            `;

            box.appendChild(row);
        });
}


$("submitStudentInventoryButton")?.addEventListener(
    "click",
    async () => {

        const rows =
            $$("#studentInventoryList [data-product-id]");

        const items =
            rows.map(row => {

                const input =
                    row.querySelector(
                        "[data-inventory-count]"
                    );

                const raw =
                    String(
                        input?.value ?? ""
                    ).trim();

                if (raw === "") {
                    return null;
                }

                return {
                    product_id: row.dataset.productId,
                    quantity: Math.max(0, integer(raw))
                };

            }).filter(Boolean);


        if (!items.length) {

            setText(
                "studentInventoryMessage",
                "Bitte mindestens einen Bestand eintragen."
            );

            return;
        }


        const button =
            $("submitStudentInventoryButton");

        if (button) {
            button.disabled = true;
        }


        try {

           const { error } = await db.rpc("submit_inventory_count", {
    p_items: items,
    p_context: "getränke",
    p_event_id: null,
    p_inventory_type: "daily"
});


            if (error) {
                throw error;
            }


            setText(
                "studentInventoryMessage",
                "Inventur wurde an den Lehrer geschickt."
            );

            toast(
                "Inventur gesendet.",
                "success"
            );


            renderStudentInventory();

        } catch (error) {

    console.error("Fehler beim Senden der Inventur:", error);

    const errorCode = error?.code || "";
    const errorMessage = error?.message || "Unbekannter Fehler";

    setText(
        "studentInventoryMessage",
        `Inventur konnte nicht gesendet werden. ${errorCode}: ${errorMessage}`
    );

} finally {

            if (button) {
                button.disabled = false;
            }
        }
    }
);


/* =====================================================================
   INVENTUR — LEHRER
   ===================================================================== */

$("teacherInventoryBackButton")?.addEventListener(
    "click",
    () => showScreen("editMenuScreen")
);



async function renderTeacherInventory() {
    const box = $("teacherInventoryList");

    if (
        !box ||
        !isTeacher() ||
        renderTeacherInventory.busy
    ) {
        return;
    }

    const generation =
        (renderTeacherInventory.generation || 0) + 1;

    renderTeacherInventory.generation = generation;

    const dateText = value => {
        return new Intl.DateTimeFormat("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Berlin"
        }).format(new Date(value));
    };


    async function commitReview(rpc, args, successText) {
    if (renderTeacherInventory.busy) {
        return;
    }

    renderTeacherInventory.busy = true;

    box.querySelectorAll("button").forEach(button => {
        button.disabled = true;
    });

    let failure = null;

    try {
        const { data, error } = await db.rpc(
            rpc,
            args
        );

        if (error) {
            throw error;
        }

        if (data === false) {
            throw new Error(
                "Die Änderung wurde nicht gespeichert."
            );
        }

        toast(
            data === "superseded"
                ? "Ältere Zählung archiviert. Bestand unverändert."
                : successText,
            "success"
        );

    } catch (error) {
        console.error(
            "Inventur — fehlgeschlagene Funktion:",
            rpc,
            error
        );

        failure = {
            code: error.code || "—",
            message:
                error.message ||
                "Unbekannter Fehler",
            details: error.details || "",
            hint: error.hint || ""
        };

    } finally {
        renderTeacherInventory.busy = false;

        await renderTeacherInventory();
    }

    if (failure) {
        let errorBox = $("teacherInventoryError");

        if (!errorBox) {
            errorBox = document.createElement("div");
            errorBox.id = "teacherInventoryError";
            errorBox.setAttribute("role", "alert");

            box.before(errorBox);
        }

        errorBox.style.cssText = `
            margin: 12px 0;
            padding: 14px;
            background: #fff0f0;
            color: #962828;
            border: 1px solid #e8aaaa;
            border-radius: 12px;
            overflow-wrap: anywhere;
            white-space: pre-wrap;
        `;

        errorBox.textContent = [
            "Bestätigung konnte nicht gespeichert werden.",
            `Funktion: ${rpc}`,
            `Fehlercode: ${failure.code}`,
            `Meldung: ${failure.message}`,
            failure.details
                ? `Details: ${failure.details}`
                : "",
            failure.hint
                ? `Hinweis: ${failure.hint}`
                : ""
        ].filter(Boolean).join("\n");

    } else {
        $("teacherInventoryError")?.remove();
    }
}

    try {
        const [stocks, dashboard] = await Promise.all([
            db.from("inventory").select("*"),

            db.rpc("teacher_inventory_dashboard")
        ]);

        if (
            generation !== renderTeacherInventory.generation ||
            renderTeacherInventory.busy
        ) {
            return;
        }

        if (stocks.error) {
            throw stocks.error;
        }

        if (dashboard.error) {
            throw dashboard.error;
        }

        state.inventory = stocks.data || [];

        const submission =
            dashboard.data?.latest || null;

        const history =
            dashboard.data?.history || [];

        const items =
            submission?.inventory_submission_items || [];

        const stockFor = id => {
            return state.inventory.find(stock =>
                String(stock.product_id) === String(id)
            );
        };

        const itemsByProduct = new Map();

        for (const item of items) {
            const key = String(item.product_id);
            const previous = itemsByProduct.get(key);

            if (
                !previous ||
                (
                    previous.reviewed_at &&
                    !item.reviewed_at
                )
            ) {
                itemsByProduct.set(key, item);
            }
        }


        // Historique au-dessus du tableau.

        let notice = $("teacherInventoryNotice");

if (!notice) {
    notice = document.createElement("section");
    notice.id = "teacherInventoryNotice";
}

// Placer l'historique après la liste des produits,
// même si le bloc existe déjà.
box.after(notice);

        notice.className = "teacher-inventory-history";
        notice.hidden = false;

        notice.innerHTML = `
            <h2>Letzte Inventuren</h2>

            <div class="teacher-inventory-history-list">
                ${history.length ? `
                    <div class="teacher-inventory-history-heading">
                        <span>Datum</span>
                        <span>Schüler/in</span>
                        <span>Status</span>
                    </div>
                ` : `
                    <p>Noch keine eingereichte Inventur.</p>
                `}

                ${history.map(entry => {
                    const replaced =
                        entry.reviewed_note ===
                        "Durch neuere Inventur ersetzt.";

                    const current =
                        entry.id === submission?.id;

                    const status = replaced
                        ? "Durch neuere Inventur ersetzt"
                        : entry.status === "angenommen"
                            ? "Geprüft"
                            : entry.status === "eingereicht"
                                ? "Prüfung ausstehend"
                                : "Abgelehnt";

                    return `
                        <div class="
                            teacher-inventory-history-row
                            ${current
                                ? "is-current"
                                : replaced
                                    ? "is-replaced"
                                    : ""}
                        ">
                            <span>
                                ${esc(dateText(entry.submitted_at))}
                            </span>

                            <span title="${esc(entry.student_name)}">
                                ${esc(entry.student_name)}
                            </span>

                            <span>
                                ${esc(status)}
                            </span>
                        </div>
                    `;
                }).join("")}
            </div>
        `;

        const oldHistory =
            $("inventorySubmissionsList")
                ?.closest(".submissions-section");

        if (oldHistory) {
            oldHistory.hidden = true;
        }


        // Tableau des produits.

        box.innerHTML = "";

        box.classList.toggle(
            "has-student-inventory",
            Boolean(submission)
        );

        if (submission) {
            const heading = document.createElement("div");

            heading.className = "teacher-inventory-heading";

            heading.innerHTML = `
                <span>Produkt</span>
                <span>Schüler-Inventur</span>
                <span>Unterschied</span>

                <div class="teacher-inventory-heading-action">
                    <button
                        type="button"
                        class="primary-action"
                        data-review-all
                    >
                        Alle bestätigen
                    </button>
                </div>
            `;

            box.appendChild(heading);

            heading.querySelector(
                "[data-review-all]"
            ).addEventListener("click", async () => {
                const expected = items
                    .filter(item => !item.reviewed_at)
                    .map(item => {
                        const stock =
                            stockFor(item.product_id);

                        return {
                            item_id: item.id,
                            quantity:
                                Number(stock?.quantity ?? 0),
                            updated_at:
                                stock?.updated_at || null
                        };
                    });

                await commitReview(
                    "teacher_review_inventory_submission",
                    {
                        p_submission_id: submission.id,
                        p_expected_items: expected
                    },
                    "Inventur vollständig bestätigt."
                );
            });
        }

        const products = drinksProducts()
            .filter(activeProduct)
            .slice();

        // Garder accessibles les produits comptés
        // qui auraient été désactivés ensuite.
        for (const item of items) {
            if (
                !products.some(product =>
                    String(product.id) ===
                    String(item.product_id)
                )
            ) {
                products.push(
                    state.products.find(product =>
                        String(product.id) ===
                        String(item.product_id)
                    ) || {
                        id: item.product_id,
                        name: item.product_name || "Produkt",
                        active: false
                    }
                );
            }
        }

        products.forEach(product => {
            const stock = stockFor(product.id);

            const digital =
                Number(stock?.quantity ?? 0);

            const item = itemsByProduct.get(
                String(product.id)
            );

            const counted = item?.quantity == null
                ? null
                : Number(item.quantity);

            const hasCount =
                counted !== null &&
                Number.isFinite(counted);

            const pending =
                hasCount && !item.reviewed_at;

            const stale =
                pending &&
                stock?.last_counted_at &&
                Date.parse(submission.submitted_at) <=
                    Date.parse(stock.last_counted_at);

            const difference = hasCount
                ? counted - digital
                : null;

            const action = pending
                ? (
                    stale || difference === 0
                        ? "confirm"
                        : "override"
                )
                : "add";

            const label = action === "add"
                ? "+ Bestand"
                : action === "confirm"
                    ? "Bestätigen"
                    : "Bestand übernehmen";

            const row = document.createElement("div");

            row.className = "teacher-inventory-row";

            row.innerHTML = `
                <div class="inventory-product-info">
                    <span class="inventory-product-icon">
                        ${esc(productIcon(product))}
                    </span>

                    <div>
                        <strong>
                            ${esc(product.name)}
                        </strong>

                        <small>
                            Bestand: ${digital}
                        </small>
                    </div>
                </div>

                ${submission ? `
                    <div class="teacher-student-count">
                        ${hasCount ? counted : "—"}

                        ${item?.reviewed_at
                            ? "<small>Geprüft</small>"
                            : ""}
                    </div>

                    <div class="
                        teacher-student-difference
                        ${hasCount
                            ? difference === 0
                                ? "is-equal"
                                : "is-different"
                            : ""}
                    ">
                        ${hasCount
                            ? (
                                difference > 0 ? "+" : ""
                            ) + difference
                            : "—"}

                        ${stale
                            ? "<small>Ältere Zählung</small>"
                            : ""}
                    </div>
                ` : ""}

                <div class="teacher-stock-form">
                    <input
                        data-stock-quantity
                        type="number"
                        min="1"
                        step="1"
                        inputmode="numeric"
                        placeholder="Menge"
                        aria-label="Menge"
                        ${pending ? "disabled" : ""}
                    >

                    <input
                        data-stock-cost
                        type="text"
                        inputmode="decimal"
                        placeholder="EK optional"
                        aria-label="Einkaufspreis optional"
                        ${pending ? "disabled" : ""}
                    >

                    <button
                        type="button"
                        class="
                            primary-action
                            teacher-action-${action}
                        "
                        data-inventory-action
                    >
                        ${label}
                    </button>
                </div>
            `;

            const button = row.querySelector(
                "[data-inventory-action]"
            );

            if (stale) {
                button.title =
                    "Ältere Zählung archivieren. " +
                    "Der Bestand bleibt unverändert.";
            }

            button.addEventListener("click", async () => {
                if (action !== "add") {
                    await commitReview(
                        "teacher_review_inventory_item",
                        {
                            p_submission_id: submission.id,
                            p_item_id: item.id,
                            p_action: action,
                            p_expected_quantity: digital,
                            p_expected_updated_at:
                                stock?.updated_at || null
                        },
                        "Zählung bestätigt."
                    );

                    return;
                }

                const quantity = Number(
                    row.querySelector(
                        "[data-stock-quantity]"
                    ).value.trim()
                );

                const rawCost =
                    row.querySelector(
                        "[data-stock-cost]"
                    ).value.trim();

                if (
                    !Number.isSafeInteger(quantity) ||
                    quantity <= 0
                ) {
                    toast(
                        "Bitte eine ganze Menge größer als 0 eingeben.",
                        "error"
                    );

                    return;
                }

                if (
                    rawCost &&
                    !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/
                        .test(
                            rawCost.replace(/\s|€/g, "")
                        )
                ) {
                    toast(
                        "Bitte einen gültigen Einkaufspreis eingeben, z. B. 0,50.",
                        "error"
                    );

                    return;
                }

                await commitReview(
                    "teacher_add_stock",
                    {
                        p_product_id: product.id,
                        p_quantity: quantity,
                        p_invoice_id:
                            state.currentInventoryInvoice
                                ?.id || null,
                        p_unit_purchase_price:
                            rawCost
                                ? parseMoney(rawCost)
                                : null
                    },
                    "Bestand aktualisiert."
                );
            });

            box.appendChild(row);
        });

    } catch (error) {
        if (
            generation !==
            renderTeacherInventory.generation
        ) {
            return;
        }

        console.error("Inventur:", error);

        box.innerHTML = `
            <div class="empty-state">
                Inventur konnte nicht geladen werden.
                Bitte erneut öffnen.
            </div>
        `;

        toast(
            "Inventur konnte nicht geladen werden.",
            "error"
        );
    }
}

async function loadInventorySubmissions() {
    if (
        isTeacher() &&
        state.currentScreenId === "teacherInventoryScreen"
    ) {
        await renderTeacherInventory();

        return [];
    }

    const box = $("inventorySubmissionsList");

    const { data, error } = await db
        .from("inventory_submissions")
        .select(`
            *,
            inventory_submission_items(*)
        `)
        .order("submitted_at", {
            ascending: false
        })
        .limit(100);

    if (error) {
        console.error(
            "Inventuren konnten nicht geladen werden:",
            error
        );

        if (box) {
            box.innerHTML = `
                <div class="empty-state">
                    Inventuren konnten nicht geladen werden.
                </div>
            `;
        }

        return [];
    }

    const submissions = data || [];

    if (!box) {
        return submissions;
    }

    box.innerHTML = submissions.length
        ? ""
        : `
            <div class="empty-state">
                Noch keine eingereichte Inventur.
            </div>
        `;

    submissions.forEach(submission => {
        const card = document.createElement("article");

        card.className = "submission-card";

        const lines = (
            submission.inventory_submission_items || []
        ).map(item => {
            const product = state.products.find(
                product =>
                    product.id === item.product_id
            );

            const name =
                item.product_name ||
                product?.name ||
                "Produkt";

            const quantity =
                item.quantity ??
                item.counted_quantity ??
                "—";

            return `
                <div class="submission-item">
                    <span>${esc(name)}</span>
                    <strong>
                        ${esc(String(quantity))}
                    </strong>
                </div>
            `;
        }).join("");

        const date = submission.submitted_at
            ? new Intl.DateTimeFormat("de-DE", {
                dateStyle: "short",
                timeStyle: "short"
            }).format(
                new Date(submission.submitted_at)
            )
            : "";

        card.innerHTML = `
            <div class="submission-card-header">
                <strong>Inventur</strong>
                <small>${date}</small>
            </div>

            <div class="submission-items">
                ${lines}
            </div>
        `;

        box.appendChild(card);
    });

    return submissions;
}

/* =====================================================================
   RECHNUNGEN
   ===================================================================== */

/* =====================================================================
   BUCHHALTUNG — RECHNUNGEN UND SONSTIGE EINNAHMEN
   ===================================================================== */

screenTitles.invoicesScreen = "Bearbeiten · Buchhaltung";

$("invoicesBackButton")?.addEventListener(
    "click",
    () => showScreen("editMenuScreen")
);

$("invoiceContextSelect")?.addEventListener(
    "change",
    updateInvoiceEventVisibility
);

$("invoiceDateInput")?.addEventListener(
    "change",
    refreshInvoiceNumber
);

$("invoicePfandInput")?.addEventListener(
    "input",
    updateInvoicePfand
);

$("invoiceForm")?.addEventListener(
    "submit",
    saveInvoice
);

$("receiptForm")?.addEventListener(
    "submit",
    saveBookkeepingReceipt
);


function accountingDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}


function accountingMoneyInput(raw) {
    const text = String(raw || "")
        .trim()
        .replace(/\s|€/g, "");

    const valid =
        /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text);

    return valid ? parseMoney(text) : NaN;
}


function updateInvoicePfand() {
    const quantity = Number($("invoicePfandInput")?.value);

    setText(
        "invoicePfandAmount",
        Number.isSafeInteger(quantity) && quantity >= 0
            ? money(quantity * 0.25)
            : "—"
    );
}


async function initialiseInvoices() {
    if (!isTeacher()) return;

    $("invoiceDateInput").value ||= todayISO();
    $("receiptDateInput").value ||= todayISO();

    setText("invoiceFormMessage", "");
    setText("receiptFormMessage", "");

    updateInvoicePfand();

    await Promise.all([
        refreshInvoiceNumber(),
        populateInvoiceEvents(),
        loadInvoices(),
        loadBookkeepingReceipts()
    ]);

    updateInvoiceEventVisibility();
}


async function refreshInvoiceNumber() {
    if (!isTeacher() || !$("invoiceNumberInput")) return;

    const { data, error } = await db.rpc(
        "preview_next_invoice_number",
        {
            p_invoice_date:
                $("invoiceDateInput").value || todayISO()
        }
    );

    if (error) {
        console.error(error);
        $("invoiceNumberInput").value = "";
        return;
    }

    $("invoiceNumberInput").value = data || "";
}


async function populateInvoiceEvents() {
    const select = $("invoiceEventSelect");
    if (!select) return;

    const previous = select.value;

    if (!state.events.length) {
        await loadEvents();
    }

    select.innerHTML =
        '<option value="">Veranstaltung auswählen</option>';

    state.events.forEach(event => {
        const option = document.createElement("option");

        option.value = event.id;
        option.textContent =
            `${event.name} · ${dateDE(event.event_date)}`;

        select.appendChild(option);
    });

    select.value = previous;
}


function updateInvoiceEventVisibility() {
    const field = $("invoiceEventField");
    if (!field) return;

    const visible =
        $("invoiceContextSelect")?.value === "sonderveranstaltung";

    field.hidden = !visible;
    field.style.display = visible ? "" : "none";
}


async function askInvoiceStockUpdate() {
    return new Promise(resolve => {
        const dialog = document.createElement("dialog");

        dialog.className = "invoice-stock-dialog";

        dialog.setAttribute(
            "aria-labelledby",
            "invoiceStockQuestion"
        );

        dialog.innerHTML = `
            <h2 id="invoiceStockQuestion">
                Rechnung gespeichert
            </h2>

            <p>
                Möchtest du jetzt deinen Bestand aktualisieren?
            </p>

            <form
                method="dialog"
                class="invoice-stock-dialog-actions"
            >
                <button
                    class="secondary-action"
                    value="no"
                    autofocus
                >
                    Nein
                </button>

                <button
                    class="primary-action"
                    value="yes"
                >
                    Ja
                </button>
            </form>
        `;

        document.body.appendChild(dialog);

        dialog.addEventListener(
            "close",
            () => {
                const yes = dialog.returnValue === "yes";
                dialog.remove();
                resolve(yes);
            },
            { once: true }
        );

        dialog.showModal();
    });
}


/*
 * Chargement de toutes les entrées par pages.
 * Aucun maximum de dix entrées dans les historiques.
 */
async function loadAllAccountingRows(table) {
    const rows = new Map();
    let offset = 0;

    while (true) {
        const { data, error, count } = await db
            .from(table)
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + 499);

        if (error) throw error;

        const page = data || [];

        page.forEach(row => {
            rows.set(row.id, row);
        });

        offset += page.length;

        if (
            !page.length ||
            (
                count != null
                    ? offset >= count
                    : page.length < 500
            )
        ) {
            break;
        }
    }

    return Array.from(rows.values());
}


async function loadInvoices() {
    const result = await loadBookkeepingHistory();
    return result ? result.invoices : null;
}


async function loadBookkeepingReceipts() {
    const result = await loadBookkeepingHistory();
    return result ? result.receipts : null;
}


async function loadBookkeepingHistory() {
    if (!isTeacher()) return null;

    if (loadBookkeepingHistory.pending) {
        return loadBookkeepingHistory.pending;
    }

    const task = (async () => {
        try {
            const [invoices, receipts] = await Promise.all([
                loadAllAccountingRows("invoices"),
                loadAllAccountingRows("bookkeeping_receipts")
            ]);

            const entries = [
                ...invoices.map(invoice => ({
                    id: `invoice:${invoice.id}`,
                    date: invoice.invoice_date,
                    createdAt: invoice.created_at,
                    type: "invoice",
                    typeLabel: "Rechnung",
                    description: [
                        invoice.invoice_number || "Rechnung",
                        invoice.supplier,
                        invoice.context
                    ].filter(Boolean).join(" · "),
                    amount: invoice.total_amount,
                    pfandQuantity: integer(invoice.pfand_quantity),
                    pfandAmount: number(invoice.pfand_amount)
                })),

                ...receipts.map(receipt => ({
                    id: `receipt:${receipt.id}`,
                    date: receipt.receipt_date,
                    createdAt: receipt.created_at,
                    type: receipt.kind,
                    typeLabel:
                        receipt.kind === "pfand_return"
                            ? "Pfandrückgabe"
                            : "Sonstige Einnahme",
                    description: receipt.reason,
                    amount: receipt.amount
                }))
            ];

            entries.sort((a, b) =>
                String(b.date).localeCompare(String(a.date)) ||
                String(b.createdAt).localeCompare(String(a.createdAt)) ||
                b.id.localeCompare(a.id)
            );

            const list = $("bookkeepingList");

            if (list) {
                list.innerHTML = "";

                if (!entries.length) {
                    list.innerHTML = `
                        <tr>
                            <td colspan="4">Noch keine Einträge.</td>
                        </tr>
                    `;
                }

                entries.forEach(entry => {
                    const row = document.createElement("tr");
                    const isInvoice = entry.type === "invoice";

                    row.className = isInvoice
                        ? "bookkeeping-expense-row"
                        : "bookkeeping-income-row";

                    const pfandInfo =
                        isInvoice && entry.pfandQuantity > 0
                            ? ` · Pfand: ${entry.pfandQuantity} / ${
                                money(entry.pfandAmount)
                            }`
                            : "";

                    const description =
                        entry.description + pfandInfo;

                    row.innerHTML = `
                        <td>${esc(dateDE(entry.date))}</td>

                        <td>${esc(entry.typeLabel)}</td>

                        <td title="${esc(description)}">
                            ${esc(description)}
                        </td>

                        <td class="bookkeeping-amount">
                            ${isInvoice ? "−" : "+"}
                            ${money(entry.amount)}
                        </td>
                    `;

                    list.appendChild(row);
                });
            }

            setText(
                "bookkeepingHistoryCount",
                `${entries.length} ${
                    entries.length === 1 ? "Eintrag" : "Einträge"
                }`
            );

            setText("bookkeepingHistoryMessage", "");

            return { invoices, receipts };

        } catch (error) {
            console.error(error);

            setText(
                "bookkeepingHistoryMessage",
                "Einträge konnten nicht aktualisiert werden. " +
                "Bitte Buchhaltung erneut öffnen."
            );

            return null;
        }
    })();

    loadBookkeepingHistory.pending = task;

    try {
        return await task;
    } finally {
        if (loadBookkeepingHistory.pending === task) {
            loadBookkeepingHistory.pending = null;
        }
    }
}
async function saveInvoice(event) {
    event.preventDefault();

    if (!isTeacher() || saveInvoice.busy) return;

    setText("invoiceFormMessage", "");

    const context = $("invoiceContextSelect").value;
    const invoiceDate = $("invoiceDateInput").value;

    const supplier =
        $("invoiceSupplierInput").value.trim() || null;

    const total = accountingMoneyInput(
        $("invoiceTotalInput").value
    );

    const pfand = Number($("invoicePfandInput").value);

    const eventId =
        context === "sonderveranstaltung"
            ? $("invoiceEventSelect").value || null
            : null;

    if (
        !invoiceDate ||
        !Number.isFinite(total) ||
        total <= 0 ||
        !Number.isSafeInteger(pfand) ||
        pfand < 0 ||
        pfand * 0.25 > total
    ) {
        setText(
            "invoiceFormMessage",
            "Bitte Datum, Gesamtkosten und Pfandanzahl prüfen. " +
            "Der Pfandbetrag darf die Gesamtkosten nicht überschreiten."
        );

        return;
    }

    if (context === "sonderveranstaltung" && !eventId) {
        setText(
            "invoiceFormMessage",
            "Bitte eine Veranstaltung auswählen."
        );

        return;
    }

    saveInvoice.busy = true;
    $("saveInvoiceButton").disabled = true;

    let saved = false;

    try {
        const { data, error } = await db.rpc(
            "create_bookkeeping_invoice",
            {
                p_context: context,
                p_invoice_date: invoiceDate,
                p_supplier: supplier,
                p_total_amount: total,
                p_event_id: eventId,
                p_pfand_quantity: pfand
            }
        );

        if (error) throw error;

        saved = true;

        const invoice = Array.isArray(data) ? data[0] : data;

        $("invoiceSupplierInput").value = "";
        $("invoiceTotalInput").value = "";
        $("invoicePfandInput").value = "0";

        updateInvoicePfand();

        state.currentInventoryInvoice = null;

        const card = $("inventoryInvoiceContextCard");

        if (card) {
            card.hidden = true;
            card.style.display = "none";
        }

        setText("invoiceFormMessage", "");

        toast("Rechnung gespeichert.", "success");

        const history = $("bookkeepingHistory");

        if (history) {
            history.open = true;
        }

        /*
         * Une erreur de rafraîchissement ne transforme pas
         * une facture enregistrée en échec d'enregistrement.
         */
        const updates = await Promise.allSettled([
            loadBookkeepingHistory(),
            refreshInvoiceNumber()
        ]);

        updates.forEach(result => {
            if (result.status === "rejected") {
                console.error(result.reason);
            }
        });

        if (
            context === "getränke" &&
            invoice?.id &&
            await askInvoiceStockUpdate()
        ) {
            state.currentInventoryInvoice = invoice;

            setText(
                "inventoryInvoiceNumber",
                invoice.invoice_number || "Rechnung"
            );

            setText(
                "inventoryInvoiceSupplier",
                invoice.supplier || supplier || "—"
            );

            if (card) {
                card.hidden = false;
                card.style.display = "";
            }

            showScreen("teacherInventoryScreen");
            await renderTeacherInventory();

        } else {
            $("invoiceTotalInput")?.focus();
        }

    } catch (error) {
        console.error(error);

        if (saved) {
            setText("invoiceFormMessage", "");

            toast(
                "Rechnung gespeichert. Ansicht konnte nicht " +
                "vollständig aktualisiert werden.",
                "info"
            );

        } else {
            setText(
                "invoiceFormMessage",
                "Rechnung konnte nicht gespeichert werden. " +
                (error.message || "Bitte erneut versuchen.")
            );
        }

    } finally {
        saveInvoice.busy = false;
        $("saveInvoiceButton").disabled = false;
    }
}

async function saveBookkeepingReceipt(event) {
    event.preventDefault();

    if (!isTeacher() || saveBookkeepingReceipt.busy) return;

    setText("receiptFormMessage", "");

    const date = $("receiptDateInput").value;
    const kind = $("receiptKindInput").value;
    const reason = $("receiptReasonInput").value.trim();

    const amount = accountingMoneyInput(
        $("receiptAmountInput").value
    );

    if (
        !date ||
        !reason ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        setText(
            "receiptFormMessage",
            "Bitte Datum, Grund und einen Betrag größer als 0 eingeben."
        );

        return;
    }

    saveBookkeepingReceipt.busy = true;
    $("saveReceiptButton").disabled = true;

    let saved = false;

    try {
        const { error } = await db.rpc(
            "create_bookkeeping_receipt",
            {
                p_receipt_date: date,
                p_kind: kind,
                p_reason: reason,
                p_amount: amount
            }
        );

        if (error) throw error;

        saved = true;

        $("receiptReasonInput").value = "";
        $("receiptAmountInput").value = "";

        setText("receiptFormMessage", "");

        toast("Einnahme gespeichert.", "success");

        const history = $("bookkeepingHistory");

        if (history) {
            history.open = true;
        }

        await loadBookkeepingHistory();

        $("receiptReasonInput")?.focus();

    } catch (error) {
        console.error(error);

        if (saved) {
            setText("receiptFormMessage", "");

            toast(
                "Einnahme gespeichert. Ansicht konnte nicht " +
                "vollständig aktualisiert werden.",
                "info"
            );

        } else {
            setText(
                "receiptFormMessage",
                "Einnahme konnte nicht gespeichert werden. " +
                (error.message || "Bitte erneut versuchen.")
            );
        }

    } finally {
        saveBookkeepingReceipt.busy = false;
        $("saveReceiptButton").disabled = false;
    }
}

/* =====================================================================
   SCHÜLER
   ===================================================================== */

$("studentsBackButton")?.addEventListener(
    "click",
    () => showScreen("editMenuScreen")
);


async function loadStudents() {

    if (!isTeacher()) {
        return;
    }
   
    await loadStudentAccessPanel();
    
    const box =
        $("studentsList");

    if (!box) {
        return;
    }


    /*
     * V4 :
     * la Lehrkraft peut lire public.people grâce aux policies
     * déjà présentes dans l'architecture Supabase.
     *
     * On ne dépend donc PAS de login_people pour l'écran
     * d'administration des élèves.
     */

    const {
        data,
        error
    } = await db
        .from("people")
        .select(
            "id,first_name,last_name,student_number,person_type,active,created_at"
        )
        .eq(
            "person_type",
            "schüler"
        )
        .eq(
            "active",
            true
        )
        .order(
            "first_name",
            {
                ascending:
                    true
            }
        );


    if (error) {

        console.error(error);

        box.innerHTML = `
            <div class="empty-state">
                Schüler konnten nicht geladen werden.
            </div>
        `;

        return;
    }


    const students =
        data || [];


    box.innerHTML =
        students.length
            ? ""
            : `
                <div class="empty-state">
                    Keine Schüler gefunden.
                </div>
            `;


    students.forEach(
        student => {

            const row =
                document.createElement("article");

            row.className =
                "student-row";


            row.innerHTML = `
                <div class="student-row-main">

                    <span class="student-avatar">
                        👤
                    </span>

                    <div>

                        <strong>
                            ${esc(
                                personName(student)
                            )}
                        </strong>

                        <small>
                            ${
                                student.student_number
                                    ? `Nr. ${esc(
                                        student.student_number
                                    )}`
                                    : "Keine Schülernummer"
                            }
                        </small>

                    </div>

                </div>

                <div class="student-row-actions">

                    <button
                        class="secondary-action"
                        data-edit-student
                        type="button"
                    >
                        Bearbeiten
                    </button>

                    <button
                        class="danger-action"
                        data-delete-student
                        type="button"
                    >
                        Löschen
                    </button>

                </div>
            `;


            row.querySelector(
                "[data-edit-student]"
            ).addEventListener(
                "click",
                () => openStudentModal(
                    student
                )
            );


            row.querySelector(
                "[data-delete-student]"
            ).addEventListener(
                "click",
                () => deactivateStudent(
                    student
                )
            );


            box.appendChild(row);
        }
    );
}


$("addStudentButton")?.addEventListener(
    "click",
    () => openStudentModal(null)
);


function openStudentModal(student) {

    if (!isTeacher()) {
        return;
    }


    $("studentIdInput").value =
        student?.id ||
        "";

    $("studentFirstNameInput").value =
        student?.first_name ||
        "";

    $("studentLastNameInput").value =
        student?.last_name ||
        "";

    $("studentNumberInput").value =
        student?.student_number ||
        "";

    $("studentPinInput").value =
        "";


    setText(
        "studentModalTitle",
        student
            ? "Schüler bearbeiten"
            : "Schüler hinzufügen"
    );


    setText(
        "studentPinHint",
        student
            ? "Leer lassen, um die PIN nicht zu ändern"
            : "4 Ziffern"
    );


    setText(
        "studentFormMessage",
        ""
    );


    show(
        $("studentModal"),
        "flex"
    );
}


$("closeStudentModalButton")?.addEventListener(
    "click",
    () => hide(
        $("studentModal")
    )
);


$("cancelStudentButton")?.addEventListener(
    "click",
    () => hide(
        $("studentModal")
    )
);


$("studentForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isTeacher()) {
            return;
        }


        const id =
            $("studentIdInput")
                ?.value
                .trim();

        const firstName =
            $("studentFirstNameInput")
                ?.value
                .trim();

        const lastName =
            $("studentLastNameInput")
                ?.value
                .trim();

        const studentNumber =
            $("studentNumberInput")
                ?.value
                .trim();

        const pin =
            $("studentPinInput")
                ?.value
                .trim();


        if (!firstName) {

            setText(
                "studentFormMessage",
                "Bitte einen Vornamen eingeben."
            );

            return;
        }


        if (
            pin &&
            !/^\d{4}$/.test(pin)
        ) {

            setText(
                "studentFormMessage",
                "Die PIN muss aus 4 Ziffern bestehen."
            );

            return;
        }


        if (
            !id &&
            !/^\d{4}$/.test(pin)
        ) {

            setText(
                "studentFormMessage",
                "Für einen neuen Schüler ist eine vierstellige PIN erforderlich."
            );

            return;
        }


        const button =
            $("saveStudentButton");

        if (button) {
            button.disabled = true;
        }


        try {

            if (id) {

                const {
                    error
                } = await db.rpc(
                    "teacher_update_student",
                    {
                        p_person_id:
                            id,

                        p_first_name:
                            firstName,

                        p_last_name:
                            lastName ||
                            null,

                        p_student_number:
                            studentNumber ||
                            null,

                        p_pin:
                            pin ||
                            null
                    }
                );


                if (error) {
                    throw error;
                }

            } else {

                const {
                    error
                } = await db.rpc(
                    "teacher_create_student",
                    {
                        p_first_name:
                            firstName,

                        p_last_name:
                            lastName ||
                            null,

                        p_student_number:
                            studentNumber ||
                            null,

                        p_pin:
                            pin
                    }
                );


                if (error) {
                    throw error;
                }
            }


            hide(
                $("studentModal")
            );


            await loadStudents();

            toast(
                "Schüler gespeichert.",
                "success"
            );

        } catch (error) {

            console.error(error);

            setText(
                "studentFormMessage",
                "Schüler konnte nicht gespeichert werden."
            );

        } finally {

            if (button) {
                button.disabled = false;
            }
        }
    }
);


async function deactivateStudent(student) {

    if (!isTeacher()) {
        return;
    }


    if (
        !window.confirm(
            `${personName(student)} wirklich löschen?`
        )
    ) {
        return;
    }


    try {

        const {
            error
        } = await db.rpc(
            "teacher_deactivate_student",
            {
                p_person_id:
                    student.id
            }
        );


        if (error) {
            throw error;
        }


        await loadStudents();

        toast(
            "Schüler entfernt.",
            "success"
        );

    } catch (error) {

        console.error(error);

        toast(
            "Schüler konnte nicht entfernt werden.",
            "error"
        );
    }
}


/* =====================================================================
   BENACHRICHTIGUNGEN
   ===================================================================== */

$("notificationButton")?.addEventListener(
    "click",
    async () => {

        const popover =
            $("notificationPopover");

        if (!popover) {
            return;
        }


        if (popover.hidden) {

            await loadNotifications();

            popover.hidden =
                false;

            popover.style.display =
                "";

            $("notificationButton")
                ?.setAttribute(
                    "aria-expanded",
                    "true"
                );

        } else {

            hideNotificationPopover();
        }
    }
);


$("closeNotificationPopoverButton")?.addEventListener(
    "click",
    hideNotificationPopover
);


function hideNotificationPopover() {

    const popover =
        $("notificationPopover");

    if (popover) {

        popover.hidden =
            true;

        popover.style.display =
            "none";
    }


    $("notificationButton")
        ?.setAttribute(
            "aria-expanded",
            "false"
        );
}


$("showAllNotificationsButton")?.addEventListener(
    "click",
    async () => {

        hideNotificationPopover();

        state.notificationMode =
            "received";

        showScreen(
            "notificationsScreen"
        );

        await loadNotifications();

        renderNotificationsPage();
    }
);


$("notificationsBackButton")?.addEventListener(
    "click",
    () => {

        if (isTeacher()) {

            showScreen(
                "editMenuScreen"
            );

        } else {

            goHome();
        }
    }
);


async function loadNotifications() {

    if (!state.currentPerson) {
        return;
    }


    const {
        data,
        error
    } = await db
        .from("notifications")
        .select("*")
        .or(
            [
                `recipient_person_id.eq.${state.currentPerson.id}`,
                `recipient_type.eq.${isTeacher() ? "teacher" : "student"}`,
                "recipient_type.eq.all"
            ].join(",")
        )
        .order(
            "created_at",
            {
                ascending:
                    false
            }
        )
        .limit(100);


    if (error) {

        console.error(error);

        return;
    }


    state.notifications =
        data || [];


    renderNotificationBadge();

    renderNotificationPreview();


    if (
        state.currentScreenId ===
        "notificationsScreen"
    ) {

        renderNotificationsPage();
    }
}


function unreadNotifications() {

    return state.notifications.filter(
        notification =>
            !notification.read_at
    );
}


function renderNotificationBadge() {

    const badge =
        $("notificationCount");

    if (!badge) {
        return;
    }


    const count =
        unreadNotifications().length;


    badge.textContent =
        String(count);

    badge.hidden =
        count === 0;

    badge.style.display =
        count
            ? ""
            : "none";
}


function renderNotificationPreview() {

    const box =
        $("notificationPreviewList");

    if (!box) {
        return;
    }


    const notifications =
        state.notifications.slice(
            0,
            5
        );


    box.innerHTML =
        notifications.length
            ? ""
            : `
                <div class="notification-preview-empty">
                    Keine neuen Benachrichtigungen.
                </div>
            `;


    notifications.forEach(
        notification => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                `notification-preview-item ${
                    notification.read_at
                        ? "notification-read"
                        : "notification-new"
                }`;


            button.innerHTML = `
                <strong>
                    ${esc(
                        notification.title ||
                        "Benachrichtigung"
                    )}
                </strong>

                <small>
                    ${esc(
                        notification.message ||
                        ""
                    )}
                </small>
            `;


            button.addEventListener(
                "click",
                async () => {

                    await markNotificationRead(
                        notification
                    );

                    hideNotificationPopover();

                    state.notificationMode =
                        "received";

                    showScreen(
                        "notificationsScreen"
                    );

                    renderNotificationsPage();
                }
            );


            box.appendChild(button);
        }
    );
}


async function markNotificationRead(
    notification
) {

    if (
        !notification ||
        notification.read_at
    ) {
        return;
    }


    try {

        const {
            error
        } = await db.rpc(
            "mark_notification_read",
            {
                p_notification_id:
                    notification.id
            }
        );


        if (error) {
            throw error;
        }


        notification.read_at =
            new Date()
                .toISOString();


        renderNotificationBadge();

        renderNotificationPreview();

    } catch (error) {

        console.error(error);
    }
}


async function openNotificationsAdmin() {

    if (!isTeacher()) {
        return;
    }


    state.notificationMode =
        "received";


    await Promise.all([
        loadNotificationRecipients(),
        loadNotifications()
    ]);


    renderNotificationTabs();

    renderNotificationsPage();
}


async function loadNotificationRecipients() {

    const box =
        $("notificationRecipientList");

    if (!box) {
        return;
    }


    const {
        data,
        error
    } = await db
        .from("people")
        .select(
            "id,first_name,last_name,student_number"
        )
        .eq(
            "person_type",
            "schüler"
        )
        .eq(
            "active",
            true
        )
        .order(
            "first_name",
            {
                ascending:
                    true
            }
        );


    if (error) {

        console.error(error);

        box.innerHTML = `
            <p>
                Schüler konnten nicht geladen werden.
            </p>
        `;

        return;
    }


    const students =
        data || [];


    box.innerHTML = `
        <label class="recipient-option recipient-option-all">

            <input
                id="notificationSelectAllStudents"
                type="checkbox"
            />

            <span>
                Alle
            </span>

        </label>

        ${students.map(
            student => `
                <label class="recipient-option">

                    <input
                        data-notification-recipient
                        type="checkbox"
                        value="${esc(student.id)}"
                    />

                    <span>
                        ${esc(
                            personName(student)
                        )}
                    </span>

                </label>
            `
        ).join("")}
    `;


    $("notificationSelectAllStudents")
        ?.addEventListener(
            "change",
            event => {

                $$(
                    "#notificationRecipientList [data-notification-recipient]"
                )
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            event.target.checked;
                    }
                );
            }
        );


    $$(
        "#notificationRecipientList [data-notification-recipient]"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                () => {

                    const all =
                        $$(
                            "#notificationRecipientList [data-notification-recipient]"
                        );

                    const selectAll =
                        $("notificationSelectAllStudents");

                    if (selectAll) {

                        selectAll.checked =
                            all.length > 0 &&
                            all.every(
                                item =>
                                    item.checked
                            );
                    }
                }
            );
        }
    );
}


$("teacherSendNotificationButton")?.addEventListener(
    "click",
    async () => {

        if (!isTeacher()) {
            return;
        }


        const recipientIds =
            $$(
                "#notificationRecipientList [data-notification-recipient]:checked"
            )
            .map(
                input =>
                    input.value
            );


        const title =
            $("teacherNotificationTitle")
                ?.value
                .trim();

        const message =
            $("teacherNotificationMessage")
                ?.value
                .trim();


        if (!recipientIds.length) {

            setText(
                "teacherNotificationMessageStatus",
                "Bitte mindestens einen Schüler auswählen."
            );

            return;
        }


        if (!title) {

            setText(
                "teacherNotificationMessageStatus",
                "Bitte einen Titel eingeben."
            );

            return;
        }


        const button =
            $("teacherSendNotificationButton");

        if (button) {
            button.disabled = true;
        }


        try {

            const {
                error
            } = await db.rpc(
                "teacher_send_notification",
                {
                    p_recipient_ids:
                        recipientIds,

                    p_title:
                        title,

                    p_message:
                        message ||
                        null
                }
            );


            if (error) {
                throw error;
            }


            $("teacherNotificationTitle").value =
                "";

            $("teacherNotificationMessage").value =
                "";


            $$(
                "#notificationRecipientList input[type='checkbox']"
            )
            .forEach(
                input => {
                    input.checked =
                        false;
                }
            );


            setText(
                "teacherNotificationMessageStatus",
                "Benachrichtigung wurde gesendet."
            );


            toast(
                "Benachrichtigung gesendet.",
                "success"
            );


            if (
                state.notificationMode ===
                "sent"
            ) {

                await loadSentNotifications();
            }

        } catch (error) {

            console.error(error);

            setText(
                "teacherNotificationMessageStatus",
                "Benachrichtigung konnte nicht gesendet werden."
            );

        } finally {

            if (button) {
                button.disabled = false;
            }
        }
    }
);


$("receivedNotificationsTab")?.addEventListener(
    "click",
    async () => {

        state.notificationMode =
            "received";

        renderNotificationTabs();

        await loadNotifications();

        renderNotificationsPage();
    }
);


$("sentNotificationsTab")?.addEventListener(
    "click",
    async () => {

        if (!isTeacher()) {
            return;
        }


        state.notificationMode =
            "sent";

        renderNotificationTabs();

        await loadSentNotifications();
    }
);


function renderNotificationTabs() {

    $("receivedNotificationsTab")
        ?.classList.toggle(
            "active",
            state.notificationMode ===
                "received"
        );


    $("sentNotificationsTab")
        ?.classList.toggle(
            "active",
            state.notificationMode ===
                "sent"
        );
}


function renderNotificationsPage() {

    if (
        state.notificationMode ===
        "sent"
    ) {
        return;
    }


    renderNotificationTabs();


    const box =
        $("notificationsList");

    const empty =
        $("notificationsEmpty");


    if (!box) {
        return;
    }


    const notifications =
        state.notifications;


    box.innerHTML =
        "";


    if (empty) {

        empty.hidden =
            notifications.length > 0;

        empty.style.display =
            notifications.length
                ? "none"
                : "";
    }


    notifications.forEach(
        notification => {

            const card =
                document.createElement("article");

            card.className =
                `notification-card ${
                    notification.read_at
                        ? "notification-read"
                        : "notification-new"
                }`;


            card.innerHTML = `
                <div class="notification-card-main">

                    <div class="notification-card-icon">
                        ${
                            notification.read_at
                                ? "✓"
                                : "🔔"
                        }
                    </div>

                    <div>

                        <strong>
                            ${esc(
                                notification.title ||
                                "Benachrichtigung"
                            )}
                        </strong>

                        <p>
                            ${esc(
                                notification.message ||
                                ""
                            )}
                        </p>

                        <small>
                            ${
                                notification.created_at
                                    ? new Intl.DateTimeFormat(
                                        "de-DE",
                                        {
                                            dateStyle:
                                                "short",

                                            timeStyle:
                                                "short"
                                        }
                                    ).format(
                                        new Date(
                                            notification.created_at
                                        )
                                    )
                                    : ""
                            }
                        </small>

                    </div>

                </div>
            `;


            if (
                !notification.read_at
            ) {

                card.tabIndex =
                    0;

                card.addEventListener(
                    "click",
                    async () => {

                        await markNotificationRead(
                            notification
                        );

                        renderNotificationsPage();
                    }
                );
            }


            box.appendChild(card);
        }
    );
}


async function loadSentNotifications() {

    if (!isTeacher()) {
        return;
    }


    const box =
        $("notificationsList");

    const empty =
        $("notificationsEmpty");


    if (!box) {
        return;
    }


    const {
        data,
        error
    } = await db
        .from("notifications")
        .select("*")
        .eq(
            "created_by",
            state.currentPerson.id
        )
        .order(
            "created_at",
            {
                ascending:
                    false
            }
        )
        .limit(100);


    if (error) {

        console.error(error);

        box.innerHTML = `
            <div class="empty-state">
                Gesendete Benachrichtigungen konnten nicht geladen werden.
            </div>
        `;

        return;
    }


    const sent =
        data || [];


    /*
     * Pour afficher les noms des destinataires sans exposer
     * de données inutiles aux élèves, cette requête n'est faite
     * que côté Lehrkraft.
     */

    const recipientIds =
        [
            ...new Set(
                sent
                    .map(
                        item =>
                            item.recipient_person_id
                    )
                    .filter(Boolean)
            )
        ];


    let peopleMap =
        new Map();


    if (recipientIds.length) {

        const {
            data:
                people,
            error:
                peopleError
        } = await db
            .from("people")
            .select(
                "id,first_name,last_name"
            )
            .in(
                "id",
                recipientIds
            );


        if (!peopleError) {

            peopleMap =
                new Map(
                    (people || [])
                        .map(
                            person => [
                                person.id,
                                personName(person)
                            ]
                        )
                );
        }
    }


    box.innerHTML =
        "";


    if (empty) {

        empty.hidden =
            sent.length > 0;

        empty.style.display =
            sent.length
                ? "none"
                : "";
    }


    sent.forEach(
        notification => {

            const card =
                document.createElement("article");

            card.className =
                "notification-card notification-sent";


            let recipient =
                "Alle";


            if (
                notification.recipient_person_id
            ) {

                recipient =
                    peopleMap.get(
                        notification.recipient_person_id
                    ) ||
                    "Schüler";

            } else if (
                notification.recipient_type ===
                "student"
            ) {

                recipient =
                    "Alle Schüler";

            } else if (
                notification.recipient_type ===
                "teacher"
            ) {

                recipient =
                    "Lehrkraft";
            }


            card.innerHTML = `
                <div class="notification-card-main">

                    <div class="notification-card-icon">
                        📤
                    </div>

                    <div>

                        <strong>
                            ${esc(
                                notification.title ||
                                "Benachrichtigung"
                            )}
                        </strong>

                        <p>
                            ${esc(
                                notification.message ||
                                ""
                            )}
                        </p>

                        <small>
                            An:
                            ${esc(recipient)}
                            ·
                            ${
                                notification.created_at
                                    ? new Intl.DateTimeFormat(
                                        "de-DE",
                                        {
                                            dateStyle:
                                                "short",

                                            timeStyle:
                                                "short"
                                        }
                                    ).format(
                                        new Date(
                                            notification.created_at
                                        )
                                    )
                                    : ""
                            }
                        </small>

                    </div>

                </div>
            `;


            box.appendChild(card);
        }
    );
}


/* =====================================================================
   EVENTS — LADEN / LISTE
   ===================================================================== */

$("eventsBackButton")?.addEventListener(
    "click",
    goHome
);


async function loadEvents() {

    const {
        data,
        error
    } = await db
        .from("events")
        .select("*")
        .order(
            "event_date",
            {
                ascending:
                    true
            }
        );


    if (error) {

        console.error(error);

        return;
    }


    state.events =
        data || [];


    if (
        state.currentScreenId ===
        "eventsScreen"
    ) {

        renderEvents();
    }
}


function eventClosed(event) {

    return (
        event?.status ===
            "abgeschlossen" ||
        Boolean(
            event?.completed_at
        )
    );
}


function renderEvents() {

    const upcoming =
        $("upcomingEventsList");

    const past =
        $("pastEventsList");


    if (!upcoming || !past) {
        return;
    }


    const openEvents =
        state.events.filter(
            event =>
                !eventClosed(event)
        );


    const closedEvents =
        state.events
            .filter(
                event =>
                    eventClosed(event)
            )
            .sort(
                (a,b) =>
                    new Date(
                        b.completed_at ||
                        b.event_date
                    ) -
                    new Date(
                        a.completed_at ||
                        a.event_date
                    )
            )
            .slice(
                0,
                5
            );


    upcoming.innerHTML =
        openEvents.length
            ? ""
            : `
                <div class="empty-state">
                    Keine offene Veranstaltung.
                </div>
            `;


    openEvents.forEach(
        event => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "event-list-row";


            button.innerHTML = `
                <div>

                    <strong>
                        ${esc(event.name)}
                    </strong>

                    <small>
                        ${dateDE(event.event_date)}
                        ·
                        ${
                            event.event_type ===
                                "other"
                                ? "Anderes"
                                : "Food"
                        }
                    </small>

                </div>

                <span>
                    ›
                </span>
            `;


            button.addEventListener(
                "click",
                () => openEventWorkspace(
                    event
                )
            );


            upcoming.appendChild(
                button
            );
        }
    );


    past.innerHTML =
        closedEvents.length
            ? ""
            : `
                <div class="empty-state">
                    Noch keine abgeschlossene Veranstaltung.
                </div>
            `;


    closedEvents.forEach(
        event => {

            const row =
                document.createElement("div");

            row.className =
                "event-list-row event-closed";


            row.innerHTML = `
                <div>

                    <strong>
                        ${esc(event.name)}
                    </strong>

                    <small>
                        ${dateDE(event.event_date)}
                        ·
                        ${
                            event.event_type ===
                                "other"
                                ? "Anderes"
                                : "Food"
                        }
                    </small>

                </div>

                <span class="event-closed-badge">
                    Abgeschlossen
                </span>
            `;


            /*
             * Important V4 :
             * événement réellement clôturé =
             * ligne informative NON cliquable.
             */

            past.appendChild(row);
        }
    );
}


/* =====================================================================
   EVENT — CRÉATION
   ===================================================================== */

$("createEventButton")?.addEventListener(
    "click",
    () => {

        if (!isTeacher()) {
            return;
        }

        showScreen(
            "eventTypeScreen"
        );
    }
);


$("eventTypeBackButton")?.addEventListener(
    "click",
    () => showScreen(
        "eventsScreen"
    )
);


$("createFoodEventButton")?.addEventListener(
    "click",
    () => openEventCreate(
        "food"
    )
);


$("createOtherEventButton")?.addEventListener(
    "click",
    () => openEventCreate(
        "other"
    )
);


function openEventCreate(type) {

    if (!isTeacher()) {
        return;
    }


    $("eventCreateTypeInput").value =
        type;


    setText(
        "eventCreateTitle",
        type === "food"
            ? "Neue Food-Veranstaltung"
            : "Neue Veranstaltung"
    );


    const revenueField =
        $("eventDirectRevenueField");

    const inventoryField =
        $("eventStartInventoryField");


    if (revenueField) {

        revenueField.hidden =
            type !== "other";

        revenueField.style.display =
            type === "other"
                ? ""
                : "none";
    }


    if (inventoryField) {

        inventoryField.hidden =
            type !== "food";

        inventoryField.style.display =
            type === "food"
                ? ""
                : "none";
    }


    $("eventNameInput").value =
        "";

    $("eventDateInput").value =
        todayISO();

    $("eventDescriptionInput").value =
        "";

    $("eventDirectRevenueInput").value =
        "";

    $("eventStartInventoryInput").checked =
        false;


    setText(
        "eventCreateMessage",
        ""
    );


    showScreen(
        "eventCreateScreen"
    );
}


$("eventCreateBackButton")?.addEventListener(
    "click",
    () => showScreen(
        "eventTypeScreen"
    )
);


$("eventCreateForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isTeacher()) {
            return;
        }


        const type =
            $("eventCreateTypeInput")
                ?.value ||
            "food";

        const name =
            $("eventNameInput")
                ?.value
                .trim();

        const eventDate =
            $("eventDateInput")
                ?.value;

        const description =
            $("eventDescriptionInput")
                ?.value
                .trim() ||
            null;

        const directRevenue =
            type === "other"
                ? parseMoney(
                    $("eventDirectRevenueInput")
                        ?.value
                )
                : null;


        if (
            !name ||
            !eventDate
        ) {

            setText(
                "eventCreateMessage",
                "Bitte Name und Datum ausfüllen."
            );

            return;
        }


        const button =
            $("saveEventButton");

        if (button) {
            button.disabled = true;
        }


        try {

            const {
                data,
                error
            } = await db.rpc(
                "create_special_event",
                {
                    p_name:
                        name,

                    p_event_date:
                        eventDate,

                    p_event_type:
                        type,

                    p_description:
                        description,

                    p_direct_revenue:
                        directRevenue
                }
            );


            if (error) {
                throw error;
            }


            const created =
                Array.isArray(data)
                    ? data[0]
                    : data;


            toast(
                "Veranstaltung erstellt.",
                "success"
            );


            await loadEvents();


            if (created?.id) {

                const fresh =
                    state.events.find(
                        item =>
                            item.id ===
                            created.id
                    ) ||
                    created;


                await openEventWorkspace(
                    fresh
                );

            } else {

                showScreen(
                    "eventsScreen"
                );

                renderEvents();
            }

        } catch (error) {

            console.error(error);

            setText(
                "eventCreateMessage",
                "Veranstaltung konnte nicht erstellt werden."
            );

        } finally {

            if (button) {
                button.disabled = false;
            }
        }
    }
);


/* =====================================================================
   EVENT — WORKSPACE
   ===================================================================== */

$("eventWorkspaceBackButton")?.addEventListener(
    "click",
    async () => {

        await loadEvents();

        showScreen(
            "eventsScreen"
        );

        renderEvents();
    }
);


async function openEventWorkspace(event) {

    if (!event) {
        return;
    }


    /*
     * On recharge l'événement afin d'éviter de travailler
     * sur un état périmé après une Endinventur ou clôture.
     */

    const {
        data,
        error
    } = await db
        .from("events")
        .select("*")
        .eq(
            "id",
            event.id
        )
        .maybeSingle();


    if (!error && data) {

        state.currentEvent =
            data;

    } else {

        state.currentEvent =
            event;
    }


    const current =
        state.currentEvent;


    if (eventClosed(current)) {

        await loadEvents();

        showScreen(
            "eventsScreen"
        );

        renderEvents();

        return;
    }


    setText(
        "eventWorkspaceName",
        current.name
    );


    setText(
        "eventWorkspaceDate",
        dateDE(
            current.event_date
        )
    );


    const info =
        $("eventWorkspaceInfo");


    if (info) {

        info.innerHTML = `
            <span>
                ${
                    current.event_type ===
                        "other"
                        ? "🎟️ Anderes"
                        : "🍔 Food"
                }
            </span>

            <strong>
                ${esc(current.name)}
            </strong>

            ${
                current.description
                    ? `<small>${esc(
                        current.description
                    )}</small>`
                    : ""
            }
        `;
    }


    const food =
        current.event_type !==
        "other";


    const foodWorkspace =
        $("foodEventWorkspace");

    const otherWorkspace =
        $("otherEventWorkspace");


    if (foodWorkspace) {

        foodWorkspace.hidden =
            !food;

        foodWorkspace.style.display =
            food
                ? ""
                : "none";
    }


    if (otherWorkspace) {

        otherWorkspace.hidden =
            food;

        otherWorkspace.style.display =
            food
                ? "none"
                : "";
    }


    if (!food) {

        setText(
            "otherEventRevenueDisplay",
            current.direct_revenue == null
                ? "—"
                : money(
                    current.direct_revenue
                )
        );
    }


    const closeArea =
        $("eventCloseArea");


    if (closeArea) {

        closeArea.hidden =
            !isTeacher();

        closeArea.style.display =
            isTeacher()
                ? ""
                : "none";
    }


    ["eventCashierTestBadge","eventOutputTestBadge"]
        .forEach(
            id => {

                const badge =
                    $(id);

                if (badge) {

                    badge.hidden =
                        !isTeacher();

                    badge.style.display =
                        isTeacher()
                            ? ""
                            : "none";
                }
            }
        );


    setText(
        "eventCloseMessage",
        ""
    );


    showScreen(
        "eventWorkspaceScreen"
    );
}


/* =====================================================================
   EVENT — CLÔTURE V4
   ===================================================================== */

$("closeEventButton")?.addEventListener(
    "click",
    async event => {

        event.preventDefault();

        if (
            !isTeacher() ||
            !state.currentEvent
        ) {
            return;
        }


        if (
            !window.confirm(
                `"${state.currentEvent.name}" wirklich abschließen? Danach wird die Veranstaltung nur noch als abgeschlossene Zeile angezeigt.`
            )
        ) {
            return;
        }


        const button =
            $("closeEventButton");

        if (button) {
            button.disabled = true;
        }


        setText(
            "eventCloseMessage",
            ""
        );


        try {

            const {
                error
            } = await db.rpc(
                "teacher_close_event",
                {
                    p_event_id:
                        state.currentEvent.id
                }
            );


            if (error) {
                throw error;
            }


            toast(
                "Veranstaltung abgeschlossen.",
                "success"
            );


            state.currentEvent =
                null;


            await loadEvents();

            showScreen(
                "eventsScreen"
            );

            renderEvents();

        } catch (error) {

            console.error(error);


            let message =
                "Veranstaltung konnte nicht abgeschlossen werden.";


            const errorText =
                String(
                    error?.message ||
                    ""
                );


            if (
                errorText.includes(
                    "end_inventory_required"
                )
            ) {

                message =
                    "Bitte zuerst die Endinventur speichern.";

            } else if (
                errorText.includes(
                    "start_inventory_required"
                )
            ) {

                message =
                    "Die erforderliche Startinventur fehlt.";

            } else if (
                errorText.includes(
                    "direct_revenue_required"
                )
            ) {

                message =
                    "Bitte zuerst den Umsatz der Veranstaltung eintragen.";
            }


            setText(
                "eventCloseMessage",
                message
            );


            toast(
                message,
                "error"
            );

        } finally {

            if (button) {
                button.disabled = false;
            }
        }
    }
);


/* =====================================================================
   EVENT — OTHER REVENUE
   ===================================================================== */

$("editOtherEventRevenueButton")?.addEventListener(
    "click",
    () => {

        if (
            !isTeacher() ||
            !state.currentEvent
        ) {
            return;
        }


        $("otherEventRevenueInput").value =
            state.currentEvent.direct_revenue == null
                ? ""
                : String(
                    state.currentEvent.direct_revenue
                ).replace(
                    ".",
                    ","
                );


        setText(
            "otherEventRevenueMessage",
            ""
        );


        show(
            $("otherEventRevenueModal"),
            "flex"
        );
    }
);


$("closeOtherEventRevenueModalButton")?.addEventListener(
    "click",
    () => hide(
        $("otherEventRevenueModal")
    )
);


$("cancelOtherEventRevenueButton")?.addEventListener(
    "click",
    () => hide(
        $("otherEventRevenueModal")
    )
);


$("otherEventRevenueForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !isTeacher() ||
            !state.currentEvent
        ) {
            return;
        }


        const revenue =
            parseMoney(
                $("otherEventRevenueInput")
                    ?.value
            );


        if (revenue < 0) {

            setText(
                "otherEventRevenueMessage",
                "Bitte einen gültigen Umsatz eingeben."
            );

            return;
        }


        try {

            const {
                data,
                error
            } = await db.rpc(
                "update_other_event_revenue",
                {
                    p_event_id:
                        state.currentEvent.id,

                    p_direct_revenue:
                        revenue
                }
            );


            if (error) {
                throw error;
            }


            if (data) {

                state.currentEvent =
                    Array.isArray(data)
                        ? data[0]
                        : data;
            }


            state.currentEvent.direct_revenue =
                revenue;


            setText(
                "otherEventRevenueDisplay",
                money(revenue)
            );


            hide(
                $("otherEventRevenueModal")
            );


            toast(
                "Umsatz gespeichert.",
                "success"
            );

        } catch (error) {

            console.error(error);

            setText(
                "otherEventRevenueMessage",
                "Umsatz konnte nicht gespeichert werden."
            );
        }
    }
);


/* =====================================================================
   EVENT — PRODUKTE
   ===================================================================== */

$("eventProductsButton")?.addEventListener(
    "click",
    async () => {

        if (!state.currentEvent) {
            return;
        }


        showScreen(
            "eventProductsScreen"
        );


        await loadEventProducts();
    }
);


$("eventProductsBackButton")?.addEventListener(
    "click",
    () => openEventWorkspace(
        state.currentEvent
    )
);


async function loadEventProducts() {

    if (!state.currentEvent) {
        return;
    }


    const {
        data,
        error
    } = await db
        .from("event_products")
        .select("*")
        .eq(
            "event_id",
            state.currentEvent.id
        )
        .order(
            "name",
            {
                ascending:
                    true
            }
        );


    if (error) {

        console.error(error);

        toast(
            "Produkte konnten nicht geladen werden.",
            "error"
        );

        return;
    }


    state.currentEventProducts =
        data || [];


    renderEventProducts();

    populateGlobalEventProductSelect();
}


function populateGlobalEventProductSelect() {

    const select =
        $("globalProductForEventSelect");

    if (!select) {
        return;
    }


    const usedGlobalIds =
        new Set(
            (
                state.currentEventProducts ||
                []
            )
            .map(
                product =>
                    product.product_id
            )
            .filter(Boolean)
        );


    const available =
        state.products.filter(
            product =>
                activeProduct(product) &&
                !usedGlobalIds.has(
                    product.id
                )
        );


    select.innerHTML = `
        <option value="">
            Produkt auswählen
        </option>
    `;


    available.forEach(
        product => {

            const option =
                document.createElement("option");

            option.value =
                product.id;

            option.textContent =
                `${productIcon(product)} ${product.name} · ${money(productPrice(product))}`;

            select.appendChild(
                option
            );
        }
    );
}


function renderEventProducts() {

    const box =
        $("eventProductsList");

    if (!box) {
        return;
    }


    const products =
        state.currentEventProducts ||
        [];


    box.innerHTML =
        products.length
            ? ""
            : `
                <div class="empty-state">
                    Noch keine Produkte für diese Veranstaltung.
                </div>
            `;


    products.forEach(
        product => {

            const row =
                document.createElement("article");

            row.className =
                "product-admin-row";


            row.innerHTML = `
                <div class="product-admin-main">

                    <span>
                        ${esc(
                            product.icon ||
                            "🎪"
                        )}
                    </span>

                    <div>

                        <strong>
                            ${esc(product.name)}
                        </strong>

                        <small>
                            ${money(
                                product.sale_price ??
                                product.price ??
                                0
                            )}
                        </small>

                    </div>

                </div>

                <div class="product-admin-actions">

                    <button
                        class="secondary-action"
                        data-event-product-edit
                        type="button"
                    >
                        Bearbeiten
                    </button>

                </div>
            `;


            row.querySelector(
                "[data-event-product-edit]"
            ).addEventListener(
                "click",
                () => openEventProductModal(
                    product
                )
            );


            box.appendChild(row);
        }
    );
}


$("addGlobalProductToEventButton")?.addEventListener(
    "click",
    async () => {

        if (!state.currentEvent) {
            return;
        }


        const productId =
            $("globalProductForEventSelect")
                ?.value;


        if (!productId) {

            toast(
                "Bitte ein Produkt auswählen.",
                "error"
            );

            return;
        }


        const product =
            state.products.find(
                item =>
                    item.id ===
                    productId
            );


        if (!product) {
            return;
        }


        try {

            const {
                error
            } = await db.rpc(
                "upsert_event_product",
                {
                    p_event_id:
                        state.currentEvent.id,

                    p_product_id:
                        product.id,

                    p_name:
                        product.name,

                    p_icon:
                        productIcon(product),

                    p_sale_price:
                        productPrice(product),

                    p_source:
                        "global"
                }
            );


            if (error) {
                throw error;
            }


            await loadEventProducts();

            toast(
                "Produkt hinzugefügt.",
                "success"
            );

        } catch (error) {

            console.error(error);

            toast(
                "Produkt konnte nicht hinzugefügt werden.",
                "error"
            );
        }
    }
);


$("addCustomEventProductButton")?.addEventListener(
    "click",
    () => openEventProductModal(
        null
    )
);


function openEventProductModal(
    product
) {

    $("eventProductIdInput").value =
        product?.id ||
        "";

    $("eventProductNameInput").value =
        product?.name ||
        "";

    $("eventProductPriceInput").value =
        product
            ? String(
                product.sale_price ??
                product.price ??
                0
            ).replace(
                ".",
                ","
            )
            : "";

    $("eventProductIconInput").value =
        product?.icon ||
        "";


    setText(
        "eventProductModalTitle",
        product
            ? "Veranstaltungsprodukt bearbeiten"
            : "Eigenes Produkt hinzufügen"
    );


    setText(
        "eventProductFormMessage",
        ""
    );


    show(
        $("eventProductModal"),
        "flex"
    );
}


$("closeEventProductModalButton")?.addEventListener(
    "click",
    () => hide(
        $("eventProductModal")
    )
);


$("cancelEventProductButton")?.addEventListener(
    "click",
    () => hide(
        $("eventProductModal")
    )
);


$("eventProductForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!state.currentEvent) {
            return;
        }


        const eventProductId =
            $("eventProductIdInput")
                ?.value ||
            null;

        const name =
            $("eventProductNameInput")
                ?.value
                .trim();

        const price =
            parseMoney(
                $("eventProductPriceInput")
                    ?.value
            );

        const icon =
            $("eventProductIconInput")
                ?.value
                .trim() ||
            "🎪";


        if (!name) {

            setText(
                "eventProductFormMessage",
                "Bitte einen Produktnamen eingeben."
            );

            return;
        }


        try {

            /*
             * RPC upsert_event_product identifie les produits globaux
             * par product_id. Pour un produit propre à l'événement,
             * product_id reste null.
             *
             * Lors d'une modification d'un custom product existant,
             * on met directement à jour la ligne connue.
             */

            if (eventProductId) {

                const {
                    error
                } = await db
                    .from("event_products")
                    .update({
                        name,
                        icon,
                        sale_price:
                            price
                    })
                    .eq(
                        "id",
                        eventProductId
                    )
                    .eq(
                        "event_id",
                        state.currentEvent.id
                    );


                if (error) {
                    throw error;
                }

            } else {

                const {
                    error
                } = await db.rpc(
                    "upsert_event_product",
                    {
                        p_event_id:
                            state.currentEvent.id,

                        p_product_id:
                            null,

                        p_name:
                            name,

                        p_icon:
                            icon,

                        p_sale_price:
                            price,

                        p_source:
                            "custom"
                    }
                );


                if (error) {
                    throw error;
                }
            }


            hide(
                $("eventProductModal")
            );


            await loadEventProducts();


            toast(
                "Produkt gespeichert.",
                "success"
            );

        } catch (error) {

            console.error(error);

            setText(
                "eventProductFormMessage",
                "Produkt konnte nicht gespeichert werden."
            );
        }
    }
);
/* =====================================================================
   EVENT — KASSE
   ===================================================================== */

$("eventCashierButton")?.addEventListener(
    "click",
    async () => {

        if (
            !state.currentEvent ||
            state.currentEvent.event_type === "other"
        ) {
            return;
        }


        await loadEventProducts();


        clearCart(
            state.eventCart
        );


        renderEventSale();


        const banner =
            $("eventSaleTestBanner");

        if (banner) {

            banner.hidden =
                !isTeacher();

            banner.style.display =
                isTeacher()
                    ? ""
                    : "none";
        }


        showScreen(
            "eventSaleScreen"
        );
    }
);


$("eventSaleBackButton")?.addEventListener(
    "click",
    () => openEventWorkspace(
        state.currentEvent
    )
);


function eventProductPrice(product) {

    return number(
        product?.sale_price ??
        product?.price ??
        product?.unit_price
    );
}


function renderEventSale() {

    const grid =
        $("eventProductGrid");

    const cartBox =
        $("eventCartItems");


    if (!grid || !cartBox) {
        return;
    }


    const products =
        (
            state.currentEventProducts ||
            []
        )
        .filter(
            product =>
                product.active !== false
        );


    grid.innerHTML =
        "";


    products.forEach(
        product => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "sale-product-card";


            const quantity =
                integer(
                    state.eventCart[
                        product.id
                    ]?.quantity
                );


            button.innerHTML = `
                <span class="sale-product-icon">
                    ${esc(
                        product.icon ||
                        "🎪"
                    )}
                </span>

                <strong>
                    ${esc(product.name)}
                </strong>

                <span>
                    ${money(
                        eventProductPrice(
                            product
                        )
                    )}
                </span>

                ${
                    quantity
                        ? `
                            <b class="product-quantity-badge">
                                ${quantity}
                            </b>
                        `
                        : ""
                }
            `;


            button.addEventListener(
                "click",
                () => {

                    if (
                        !state.eventCart[
                            product.id
                        ]
                    ) {

                        state.eventCart[
                            product.id
                        ] = {
                            ...product,
                            price:
                                eventProductPrice(
                                    product
                                ),
                            quantity:
                                0
                        };
                    }


                    state.eventCart[
                        product.id
                    ].quantity++;


                    renderEventSale();
                }
            );


            grid.appendChild(
                button
            );
        }
    );


    const items =
        Object.values(
            state.eventCart
        );


    cartBox.innerHTML =
        items.length
            ? ""
            : `
                <div class="empty-cart">
                    Noch keine Produkte.
                </div>
            `;


    items.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "cart-row";


            row.innerHTML = `
                <div>

                    <strong>
                        ${esc(
                            item.icon ||
                            "🎪"
                        )}
                        ${esc(item.name)}
                    </strong>

                    <small>
                        ${money(
                            eventProductPrice(
                                item
                            )
                        )}
                    </small>

                </div>

                <div class="quantity-control">

                    <button
                        type="button"
                        data-minus
                    >
                        −
                    </button>

                    <span>
                        ${integer(
                            item.quantity
                        )}
                    </span>

                    <button
                        type="button"
                        data-plus
                    >
                        +
                    </button>

                </div>

                <strong>
                    ${money(
                        eventProductPrice(
                            item
                        ) *
                        integer(
                            item.quantity
                        )
                    )}
                </strong>
            `;


            row.querySelector(
                "[data-minus]"
            ).addEventListener(
                "click",
                () => {

                    item.quantity =
                        Math.max(
                            0,
                            integer(
                                item.quantity
                            ) - 1
                        );


                    if (
                        item.quantity === 0
                    ) {

                        delete state.eventCart[
                            item.id
                        ];
                    }


                    renderEventSale();
                }
            );


            row.querySelector(
                "[data-plus]"
            ).addEventListener(
                "click",
                () => {

                    item.quantity =
                        integer(
                            item.quantity
                        ) + 1;


                    renderEventSale();
                }
            );


            cartBox.appendChild(
                row
            );
        }
    );


    const total =
        Object.values(
            state.eventCart
        )
        .reduce(
            (
                sum,
                item
            ) =>
                sum +
                eventProductPrice(
                    item
                ) *
                integer(
                    item.quantity
                ),
            0
        );


    setText(
        "eventCartTotal",
        money(total)
    );


    const payButton =
        $("eventPayButton");


    if (payButton) {

        payButton.disabled =
            total <= 0;
    }
}


function eventCartTotal() {

    return Object.values(
        state.eventCart
    )
    .reduce(
        (
            sum,
            item
        ) =>
            sum +
            eventProductPrice(
                item
            ) *
            integer(
                item.quantity
            ),
        0
    );
}


function eventCartItemsForRpc() {

    return Object.values(
        state.eventCart
    )
    .filter(
        item =>
            integer(
                item.quantity
            ) > 0
    )
    .map(
        item => ({
            event_product_id:
                item.id,

            quantity:
                integer(
                    item.quantity
                ),

            unit_price:
                eventProductPrice(
                    item
                )
        })
    );
}


$("eventPayButton")?.addEventListener(
    "click",
    () => {

        if (
            eventCartTotal() <= 0
        ) {
            return;
        }


        state.eventReceivedCents =
            0;


        renderEventPayment();


        showScreen(
            "eventPaymentScreen"
        );
    }
);


$("eventPaymentBackButton")?.addEventListener(
    "click",
    () => showScreen(
        "eventSaleScreen"
    )
);


function renderEventPayment() {

    const total =
        eventCartTotal();

    const received =
        state.eventReceivedCents /
        100;


    setText(
        "eventPaymentTotal",
        money(total)
    );


    setText(
        "eventAmountReceived",
        money(received)
    );


    setText(
        "eventChangeAmount",
        money(
            Math.max(
                0,
                received - total
            )
        )
    );


    const paidButton =
        $("eventPaidButton");


    if (paidButton) {

        paidButton.disabled =
            total <= 0 ||
            received + 0.0001 <
                total;
    }


    const banner =
        $("eventPaymentTestBanner");


    if (banner) {

        banner.hidden =
            !isTeacher();

        banner.style.display =
            isTeacher()
                ? ""
                : "none";
    }
}


$("eventPaymentKeypad")?.addEventListener(
    "click",
    event => {

        const key =
            event.target.closest(
                ".payment-key"
            );


        if (!key) {
            return;
        }


        if (
            key.id ===
            "eventDeletePaymentButton"
        ) {

            state.eventReceivedCents =
                centsDelete(
                    state.eventReceivedCents
                );

        } else {

            state.eventReceivedCents =
                centsAppend(
                    state.eventReceivedCents,
                    key.dataset.value
                );
        }


        renderEventPayment();
    }
);


$("eventPaidButton")?.addEventListener(
    "click",
    async () => {

        if (
            !state.currentEvent
        ) {
            return;
        }


        const total =
            eventCartTotal();

        const received =
            state.eventReceivedCents /
            100;


        if (
            total <= 0 ||
            received + 0.0001 <
                total
        ) {
            return;
        }


        const button =
            $("eventPaidButton");


        if (button) {
            button.disabled = true;
        }


        try {

            let orderNumber;


            /*
             * LEHRKRAFT = TESTUMGEBUNG
             *
             * Aucune vente, aucun stock et aucun chiffre
             * d'affaires réel ne sont modifiés.
             */

            if (isTeacher()) {

                const testOrder = {

                    id:
                        crypto.randomUUID(),

                    event_id:
                        state.currentEvent.id,

                    order_number:
                        String(
                            Math.floor(
                                100 +
                                Math.random() *
                                900
                            )
                        ),

                    status:
                        "offen",

                    created_at:
                        new Date()
                            .toISOString(),

                    items:
                        Object.values(
                            state.eventCart
                        )
                        .map(
                            item => ({
                                event_product_id:
                                    item.id,

                                product_name:
                                    item.name,

                                name:
                                    item.name,

                                quantity:
                                    integer(
                                        item.quantity
                                    ),

                                unit_price:
                                    eventProductPrice(
                                        item
                                    )
                            })
                        )
                };


                if (
                    !state.eventTestOrders[
                        state.currentEvent.id
                    ]
                ) {

                    state.eventTestOrders[
                        state.currentEvent.id
                    ] = [];
                }


                state.eventTestOrders[
                    state.currentEvent.id
                ].unshift(
                    testOrder
                );


                orderNumber =
                    testOrder.order_number;

            } else {

                const {
                    data,
                    error
                } = await db.rpc(
                    "create_event_sale_order",
                    {
                        p_event_id:
                            state.currentEvent.id,

                        p_items:
                            eventCartItemsForRpc(),

                        p_payment_amount:
                            received
                    }
                );


                if (error) {
                    throw error;
                }


                const created =
                    Array.isArray(data)
                        ? data[0]
                        : data;


                orderNumber =
                    created?.order_number ||
                    "---";
            }


            setText(
                "eventSuccessOrderNumber",
                orderNumber
            );


            setText(
                "eventSuccessChange",
                money(
                    received -
                    total
                )
            );


            clearCart(
                state.eventCart
            );


            state.eventReceivedCents =
                0;


            showScreen(
                "eventSuccessScreen"
            );

        } catch (error) {

            console.error(error);


            toast(
                "Zahlung konnte nicht gespeichert werden.",
                "error"
            );


            renderEventPayment();

        } finally {

            if (button) {
                button.disabled = false;
            }
        }
    }
);


$("eventNewOrderButton")?.addEventListener(
    "click",
    () => {

        clearCart(
            state.eventCart
        );

        renderEventSale();

        showScreen(
            "eventSaleScreen"
        );
    }
);


/* =====================================================================
   EVENT — AUSGABE
   ===================================================================== */

$("eventOutputButton")?.addEventListener(
    "click",
    async () => {

        if (
            !state.currentEvent ||
            state.currentEvent.event_type ===
                "other"
        ) {
            return;
        }


        showScreen(
            "eventOutputScreen"
        );


        await loadEventOrders();
    }
);


$("eventOutputBackButton")?.addEventListener(
    "click",
    () => openEventWorkspace(
        state.currentEvent
    )
);


async function loadEventOrders() {

    if (!state.currentEvent) {
        return;
    }


    const banner =
        $("eventOutputTestBanner");


    if (banner) {

        banner.hidden =
            !isTeacher();

        banner.style.display =
            isTeacher()
                ? ""
                : "none";
    }


    if (isTeacher()) {

        const orders =
            state.eventTestOrders[
                state.currentEvent.id
            ] ||
            [];


        renderEventOrders(
            orders
        );

        return;
    }


    const {
        data,
        error
    } = await db
        .from("event_orders")
        .select(`
            *,
            event_order_items(*)
        `)
        .eq(
            "event_id",
            state.currentEvent.id
        )
        .order(
            "created_at",
            {
                ascending:
                    false
            }
        )
        .limit(100);


    if (error) {

        console.error(error);


        toast(
            "Bestellungen konnten nicht geladen werden.",
            "error"
        );

        return;
    }


    const orders =
        (data || [])
        .map(
            order => ({
                ...order,

                items:
                    order.event_order_items ||
                    []
            })
        );


    renderEventOrders(
        orders
    );
}


function eventOrderDone(order) {

    return (
        order.status ===
            "ausgegeben" ||
        order.status ===
            "served" ||
        order.status ===
            "fertig" ||
        order.status ===
            "completed"
    );
}


function renderEventOrders(
    orders
) {

    const openOrders =
        (orders || [])
        .filter(
            order =>
                !eventOrderDone(
                    order
                )
        );


    const completedOrders =
        (orders || [])
        .filter(
            eventOrderDone
        )
        .slice(
            0,
            20
        );


    setText(
        "eventOpenOrderCount",
        openOrders.length
    );


    setText(
        "eventCompletedOrderCount",
        completedOrders.length
    );


    const openBox =
        $("eventOutputOrders");

    const completedBox =
        $("eventCompletedOrders");


    if (openBox) {

        openBox.innerHTML =
            openOrders.length
                ? ""
                : `
                    <div class="empty-state">
                        <strong>
                            Alles erledigt!
                        </strong>
                    </div>
                `;


        openOrders.forEach(
            order => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "output-order-card";


                const items =
                    order.items ||
                    order.event_order_items ||
                    [];


                card.innerHTML = `
                    <div class="output-order-number">
                        ${esc(
                            order.order_number ||
                            "---"
                        )}
                    </div>

                    <div class="output-order-items">

                        ${items.map(
                            item => `
                                <div>
                                    ${integer(
                                        item.quantity
                                    )}×
                                    ${esc(
                                        item.product_name ||
                                        item.name ||
                                        state.currentEventProducts
                                            ?.find(
                                                product =>
                                                    product.id ===
                                                    item.event_product_id
                                            )
                                            ?.name ||
                                        "Produkt"
                                    )}
                                </div>
                            `
                        ).join("")}

                    </div>

                    <button
                        class="primary-action"
                        data-serve-event
                        type="button"
                    >
                        Ausgegeben
                    </button>
                `;


                card.querySelector(
                    "[data-serve-event]"
                )
                .addEventListener(
                    "click",
                    () =>
                        serveEventOrder(
                            order.id
                        )
                );


                openBox.appendChild(
                    card
                );
            }
        );
    }


    if (completedBox) {

        completedBox.innerHTML =
            completedOrders.length
                ? ""
                : `
                    <div class="empty-state">
                        <small>
                            Noch keine fertige Bestellung.
                        </small>
                    </div>
                `;


        completedOrders.forEach(
            order => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "completed-order-row";


                row.innerHTML = `
                    <strong>
                        #${esc(
                            order.order_number ||
                            "---"
                        )}
                    </strong>

                    <span>
                        ✓ Fertig
                    </span>
                `;


                completedBox.appendChild(
                    row
                );
            }
        );
    }


    const empty =
        $("eventOutputEmpty");


    if (empty) {

        empty.hidden =
            openOrders.length > 0;

        empty.style.display =
            openOrders.length
                ? "none"
                : "";
    }
}


async function serveEventOrder(
    orderId
) {

    if (
        !orderId ||
        !state.currentEvent
    ) {
        return;
    }


    try {

        /*
         * Test professeur :
         * uniquement mémoire locale de la session.
         * Aucune écriture métier.
         */

        if (isTeacher()) {

            const orders =
                state.eventTestOrders[
                    state.currentEvent.id
                ] ||
                [];


            const order =
                orders.find(
                    item =>
                        item.id ===
                        orderId
                );


            if (order) {

                order.status =
                    "ausgegeben";
            }


            renderEventOrders(
                orders
            );

            return;
        }


        const {
            error
        } = await db.rpc(
            "serve_event_order",
            {
                p_order_id:
                    orderId
            }
        );


        if (error) {
            throw error;
        }


        await loadEventOrders();

    } catch (error) {

        console.error(error);


        toast(
            "Bestellung konnte nicht abgeschlossen werden.",
            "error"
        );
    }
}


/* =====================================================================
   EVENT — SCHICHT BEENDEN
   ===================================================================== */

$("eventCashShiftEndButton")?.addEventListener(
    "click",
    () => {

        showTeamFinished(
            "Danke für deinen Einsatz an der Kasse!",
            () => openEventWorkspace(
                state.currentEvent
            )
        );
    }
);


$("eventOutputShiftEndButton")?.addEventListener(
    "click",
    () => {

        showTeamFinished(
            "Danke für deinen Einsatz bei der Ausgabe!",
            () => openEventWorkspace(
                state.currentEvent
            )
        );
    }
);


function showTeamFinished(
    text,
    after
) {

    const existing =
        document.querySelector(
            ".team-finished-overlay"
        );


    if (existing) {
        existing.remove();
    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "team-finished-overlay";


    overlay.innerHTML = `
        <div class="team-finished-card">

            <span class="team-finished-icon">
                🎉
            </span>

            <h2>
                Gut gemacht heute, Team!
            </h2>

            <p>
                ${esc(text)}
            </p>

            <button
                class="primary-action"
                type="button"
            >
                Weiter
            </button>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    overlay.querySelector(
        "button"
    )
    .addEventListener(
        "click",
        () => {

            overlay.remove();

            if (
                typeof after ===
                "function"
            ) {

                after();
            }
        }
    );
}


/* =====================================================================
   EVENT — ENDINVENTUR
   ===================================================================== */

$("eventEndInventoryButton")?.addEventListener(
    "click",
    async () => {

        if (
            !state.currentEvent ||
            state.currentEvent.event_type ===
                "other"
        ) {
            return;
        }


        await loadEventProducts();


        renderEventEndInventory();


        setText(
            "eventEndInventoryMessage",
            ""
        );


        showScreen(
            "eventEndInventoryScreen"
        );
    }
);


$("eventEndInventoryBackButton")?.addEventListener(
    "click",
    () => openEventWorkspace(
        state.currentEvent
    )
);


function renderEventEndInventory() {

    const box =
        $("eventEndInventoryList");


    if (!box) {
        return;
    }


    const products =
        state.currentEventProducts ||
        [];


    box.innerHTML =
        products.length
            ? ""
            : `
                <div class="empty-state">
                    Keine Produkte für diese Veranstaltung.
                </div>
            `;


    products.forEach(
        product => {

            const row =
                document.createElement(
                    "label"
                );


            row.className =
                "inventory-count-row";


            row.dataset.eventProductId =
                product.id;


            row.innerHTML = `
                <div class="inventory-product-info">

                    <span class="inventory-product-icon">
                        ${esc(
                            product.icon ||
                            "🎪"
                        )}
                    </span>

                    <div>

                        <strong>
                            ${esc(
                                product.name
                            )}
                        </strong>

                        <small>
                            Endbestand
                        </small>

                    </div>

                </div>

                <input
                    class="inventory-count-input"
                    data-event-end-count
                    inputmode="numeric"
                    min="0"
                    placeholder="0"
                    type="number"
                />
            `;


            box.appendChild(
                row
            );
        }
    );
}


$("saveEventEndInventoryButton")?.addEventListener(
    "click",
    async () => {

        if (
            !state.currentEvent
        ) {
            return;
        }


        /*
         * Contrairement à Kasse/Ausgabe :
         * l'Endinventur du professeur est RÉELLE.
         */

        const rows =
            $$(
                "#eventEndInventoryList [data-event-product-id]"
            );


        const items =
            rows.map(
                row => {

                    const input =
                        row.querySelector(
                            "[data-event-end-count]"
                        );


                    const raw =
                        String(
                            input?.value ??
                            ""
                        ).trim();


                    if (
                        raw === ""
                    ) {

                        return null;
                    }


                    return {
                        event_product_id:
                            row.dataset.eventProductId,

                        quantity:
                            Math.max(
                                0,
                                integer(raw)
                            )
                    };
                }
            )
            .filter(Boolean);


        if (
            items.length !==
            rows.length
        ) {

            setText(
                "eventEndInventoryMessage",
                "Bitte für jedes Produkt einen Endbestand eintragen."
            );

            return;
        }


        const button =
            $("saveEventEndInventoryButton");


        if (button) {
            button.disabled = true;
        }


        try {

            const {
                error
            } = await db.rpc(
                "submit_event_end_inventory",
                {
                    p_event_id:
                        state.currentEvent.id,

                    p_items:
                        items
                }
            );


            if (error) {
                throw error;
            }


            setText(
                "eventEndInventoryMessage",
                "Endinventur wurde gespeichert."
            );


            toast(
                "Endinventur gespeichert.",
                "success"
            );


            await loadEvents();


            state.currentEvent =
                state.events.find(
                    event =>
                        event.id ===
                        state.currentEvent.id
                ) ||
                state.currentEvent;


            setTimeout(
                () => openEventWorkspace(
                    state.currentEvent
                ),
                500
            );

        } catch (error) {

            console.error(error);


            setText(
                "eventEndInventoryMessage",
                "Endinventur konnte nicht gespeichert werden."
            );

        } finally {

            if (button) {
                button.disabled = false;
            }
        }
    }
);


/* =====================================================================
   BERICHTE
   ===================================================================== */

$("reportsBackButton")?.addEventListener(
    "click",
    goHome
);


$("reportPeriodTabs")?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-period]"
            );


        if (!button) {
            return;
        }


        state.reportPeriod =
            button.dataset.period;


        $$(
            "#reportPeriodTabs [data-period]"
        )
        .forEach(
            item =>
                item.classList.toggle(
                    "active",
                    item === button
                )
        );


        loadReports();
    }
);


$$("[data-report-sort]").forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                state.reportSort =
                    button.dataset.reportSort;


                $$(
                    "[data-report-sort]"
                )
                .forEach(
                    item =>
                        item.classList.toggle(
                            "active",
                            item === button
                        )
                );


                renderReportProducts(
                    state.reportLines ||
                    []
                );
            }
        );
    }
);


function reportPeriodStart(
    period
) {

    const now =
        new Date();


    if (
        period === "today" ||
        period === "day"
    ) {

        now.setHours(
            0,
            0,
            0,
            0
        );

        return now;
    }


    if (
        period === "week"
    ) {

        const weekday =
            now.getDay() ||
            7;


        now.setDate(
            now.getDate() -
            weekday +
            1
        );


        now.setHours(
            0,
            0,
            0,
            0
        );


        return now;
    }


    if (
        period === "month"
    ) {

        now.setDate(1);

        now.setHours(
            0,
            0,
            0,
            0
        );


        return now;
    }


    /*
     * Schuljahr:
     * septembre → juillet.
     */

    const schoolYear =
        now.getMonth() >= 8
            ? now.getFullYear()
            : now.getFullYear() - 1;


    return new Date(
        schoolYear,
        8,
        1,
        0,
        0,
        0,
        0
    );
}


async function loadReports() {
    if (!isTeacher()) return;

    const generation = (loadReports.generation || 0) + 1;
    loadReports.generation = generation;

    setText(
        "reportCurrentDate",
        new Date().toLocaleDateString("de-DE")
    );

    const start = reportPeriodStart(state.reportPeriod);

    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);

    try {
        const [sales, ledger] = await Promise.all([
            db
                .from("report_sales_lines_v1")
                .select("*")
                .gte("sold_at", start.toISOString())
                .lt("sold_at", end.toISOString()),

            db.rpc("get_bookkeeping_entries", {
                p_from: accountingDateKey(start),
                p_to: accountingDateKey(end)
            })
        ]);

        if (generation !== loadReports.generation) return;

        if (sales.error) throw sales.error;
        if (ledger.error) throw ledger.error;

        const lines = sales.data || [];
        const entries = ledger.data || [];

        state.reportLines = lines;
        state.reportAccountingEntries = entries;

        const sum = (rows, field) =>
            rows.reduce(
                (total, row) =>
                    total + Math.round(number(row[field]) * 100),
                0
            ) / 100;

        const schoolLines = lines.filter(
            line => line.area !== "bäckerei"
        );

        const unknown = schoolLines.some(
            line => line.estimated_profit == null
        );

        const baseProfit = sum(
            schoolLines,
            "estimated_profit"
        );

        const adjustment = sum(entries, "profit_delta");

        const pfandPaid = -sum(
            entries.filter(entry => entry.kind === "pfand_paid"),
            "profit_delta"
        );

        const pfandReturned = sum(
            entries.filter(entry => entry.kind === "pfand_return"),
            "amount"
        );

        const otherIncome = sum(
            entries.filter(entry => entry.kind === "other"),
            "amount"
        );

        setText(
            "reportRevenue",
            money(sum(lines, "revenue"))
        );

        setText(
            "reportDrinksRevenue",
            money(
                sum(
                    lines.filter(line => line.area === "getränke"),
                    "revenue"
                )
            )
        );

        setText(
            "reportBakeryRevenue",
            money(
                sum(
                    lines.filter(line => line.area === "bäckerei"),
                    "revenue"
                )
            )
        );

        const salesCount = new Set(
            lines
                .map(line => line.order_id || line.event_order_id)
                .filter(Boolean)
        ).size;

        setText("reportSalesCount", String(salesCount));

        setText(
            "reportProfit",
            unknown ? "—" : money(baseProfit + adjustment)
        );

        let panel = $("reportAccountingSummary");

        if (!panel) {
            panel = document.createElement("div");
            panel.id = "reportAccountingSummary";
            panel.className = "report-kpi-grid";

            $("reportProfit")
                .closest(".report-kpi-grid")
                .after(panel);
        }

        panel.innerHTML = `
            <article class="report-kpi-card">
                <span>Pfand bezahlt · LauterMacher</span>
                <strong>${money(pfandPaid)}</strong>
            </article>

            <article class="report-kpi-card">
                <span>Pfand zurückerhalten</span>
                <strong>${money(pfandReturned)}</strong>
            </article>

            <article class="report-kpi-card">
                <span>Sonstige Einnahmen</span>
                <strong>${money(otherIncome)}</strong>
            </article>
        `;

        renderReportProducts(lines);
        await renderSchoolYearChart();

    } catch (error) {
        if (generation !== loadReports.generation) return;

        console.error(error);

        setText("reportProfit", "—");
        $("reportAccountingSummary")?.remove();

        toast(
            "Berichte konnten nicht vollständig geladen werden.",
            "error"
        );
    }
}


/* =====================================================================
   BERICHTE — PRODUKTE
   ===================================================================== */

function renderReportProducts(
    lines
) {

    const map =
        new Map();


    for (
        const line of
        lines
    ) {

        const key =
            line.product_id ||
            line.event_product_id ||
            line.product_name ||
            "—";


        if (
            !map.has(key)
        ) {

            map.set(
                key,
                {
                    name:
                        line.product_name ||
                        "—",

                    quantity:
                        0,

                    revenue:
                        0,

                    profit:
                        0,

                    unknownProfit:
                        false,

                    stock:
                        line.current_stock ??
                        null
                }
            );
        }


        const row =
            map.get(key);


        row.quantity +=
            integer(
                line.quantity
            );


        row.revenue +=
            number(
                line.revenue
            );


        if (
            line.area ===
            "bäckerei"
        ) {

            /*
             * Pas de bénéfice école
             * pour la boulangerie.
             */

            row.profit +=
                0;

        } else if (
            line.estimated_profit ==
            null
        ) {

            row.unknownProfit =
                true;

        } else {

            row.profit +=
                number(
                    line.estimated_profit
                );
        }
    }


    const rows =
        Array.from(
            map.values()
        );


    if (
        state.reportSort ===
        "profit"
    ) {

        rows.sort(
            (a,b) => {

                if (
                    a.unknownProfit &&
                    !b.unknownProfit
                ) {
                    return 1;
                }


                if (
                    b.unknownProfit &&
                    !a.unknownProfit
                ) {
                    return -1;
                }


                return (
                    b.profit -
                    a.profit
                );
            }
        );

    } else if (
        state.reportSort ===
        "quantity"
    ) {

        rows.sort(
            (a,b) =>
                b.quantity -
                a.quantity
        );

    } else {

        rows.sort(
            (a,b) =>
                b.revenue -
                a.revenue
        );
    }


    const body =
        $("reportProductTableBody");


    if (body) {

        body.innerHTML =
            rows.length
                ? rows.map(
                    row => `
                        <div class="report-product-row">

                            <span>
                                ${esc(
                                    row.name
                                )}
                            </span>

                            <span>
                                ${row.quantity}
                            </span>

                            <span>
                                ${
                                    row.stock ==
                                    null
                                        ? "—"
                                        : integer(
                                            row.stock
                                        )
                                }
                            </span>

                            <span>
                                ${money(
                                    row.revenue
                                )}
                            </span>

                            <span>
                                ${
                                    row.unknownProfit
                                        ? "—"
                                        : money(
                                            row.profit
                                        )
                                }
                            </span>

                        </div>
                    `
                ).join("")
                : `
                    <div class="empty-state">
                        Keine Verkäufe im gewählten Zeitraum.
                    </div>
                `;
    }


    const top =
        [...rows]
        .sort(
            (a,b) =>
                b.quantity -
                a.quantity
        )[0];


    setText(
        "reportTopProductName",
        top?.name ||
        "—"
    );


    setText(
        "reportTopProductLabel",
        top
            ? `${top.quantity} Stück`
            : "Noch keine Verkäufe"
    );
}


/* =====================================================================
   BERICHTE — SCHULJAHR-GRAFIK
   ===================================================================== */

async function renderSchoolYearChart() {
    const chart = $("schoolYearProfitChart");

    if (!chart || !isTeacher()) return;

    const generation =
        (renderSchoolYearChart.generation || 0) + 1;

    renderSchoolYearChart.generation = generation;

    const start = reportPeriodStart("schoolyear");
    const end = new Date(start.getFullYear() + 1, 7, 1);

    try {
        const [sales, ledger] = await Promise.all([
            db
                .from("report_sales_lines_v1")
                .select("*")
                .gte("sold_at", start.toISOString())
                .lt("sold_at", end.toISOString()),

            db.rpc("get_bookkeeping_entries", {
                p_from: accountingDateKey(start),
                p_to: accountingDateKey(end)
            })
        ]);

        if (generation !== renderSchoolYearChart.generation) {
            return;
        }

        if (sales.error) throw sales.error;
        if (ledger.error) throw ledger.error;

        const lines = sales.data || [];
        const entries = ledger.data || [];

        const months = Array.from(
            { length: 11 },
            (_, index) => {
                const date = new Date(
                    start.getFullYear(),
                    start.getMonth() + index,
                    1
                );

                const key = accountingDateKey(date).slice(0, 7);

                const relevant = lines.filter(line =>
                    line.area !== "bäckerei" &&
                    accountingDateKey(
                        new Date(line.sold_at)
                    ).slice(0, 7) === key
                );

                const adjustments = entries.filter(
                    entry => entry.entry_date.slice(0, 7) === key
                );

                const salesCents = relevant.reduce(
                    (sum, line) =>
                        sum +
                        Math.round(
                            number(line.estimated_profit) * 100
                        ),
                    0
                );

                const adjustmentCents = adjustments.reduce(
                    (sum, entry) =>
                        sum +
                        Math.round(
                            number(entry.profit_delta) * 100
                        ),
                    0
                );

                return {
                    date,
                    value: (salesCents + adjustmentCents) / 100,
                    unknown: relevant.some(
                        line => line.estimated_profit == null
                    )
                };
            }
        );

        const max = Math.max(
            1,
            ...months
                .filter(month => !month.unknown)
                .map(month => Math.abs(month.value))
        );

        chart.innerHTML = "";

        months.forEach(month => {
            const column = document.createElement("div");
            column.className = "chart-column";

            const height = month.unknown
                ? 0
                : Math.abs(month.value) / max * 85;

            const position = month.value < 0
                ? "top:90px"
                : "bottom:90px";

            const negativeClass = month.value < 0
                ? "is-negative"
                : "";

            const tooltip = month.unknown
                ? "Kosten teilweise unbekannt"
                : money(month.value);

            column.innerHTML = `
                <div class="chart-value">
                    ${month.unknown ? "—" : money(month.value)}
                </div>

                <div class="accounting-chart-plot">
                    <div
                        class="accounting-chart-bar ${negativeClass}"
                        style="${position};height:${height}px"
                        title="${esc(tooltip)}"
                    ></div>
                </div>

                <small>
                    ${month.date.toLocaleDateString(
                        "de-DE",
                        { month: "short" }
                    )}
                </small>
            `;

            chart.appendChild(column);
        });

    } catch (error) {
        if (generation !== renderSchoolYearChart.generation) {
            return;
        }

        console.error(error);

        chart.innerHTML = `
            <div class="empty-state">
                Diagramm konnte nicht geladen werden.
            </div>
        `;
    }
}


/* =====================================================================
   BERICHTE — EXPORT EXCEL
   ===================================================================== */

$("exportReportsButton")?.addEventListener(
    "click",
    () => {

        if (!window.XLSX) {

            toast(
                "Excel-Bibliothek konnte nicht geladen werden.",
                "error"
            );

            return;
        }


        const lines =
            state.reportLines ||
            [];


        const rows =
            lines.map(
                line => ({

                    Datum:
                        line.sold_at
                            ? new Date(
                                line.sold_at
                            ).toLocaleString(
                                "de-DE"
                            )
                            : "",

                    Bereich:
                        line.area ||
                        "",

                    Produkt:
                        line.product_name ||
                        "",

                    Menge:
                        integer(
                            line.quantity
                        ),

                    Einzelpreis:
                        number(
                            line.unit_price
                        ),

                    Umsatz:
                        number(
                            line.revenue
                        ),

                    "Geschätzte Kosten":
                        line.area ===
                            "bäckerei" ||
                        line.estimated_cost ==
                            null
                            ? "—"
                            : number(
                                line.estimated_cost
                            ),

                    "Geschätzter Gewinn":
                        line.area ===
                            "bäckerei" ||
                        line.estimated_profit ==
                            null
                            ? "—"
                            : number(
                                line.estimated_profit
                            )
                })
            );


        const workbook =
            XLSX.utils.book_new();


        const worksheet =
            XLSX.utils.json_to_sheet(
                rows.length
                    ? rows
                    : [
                        {
                            Hinweis:
                                "Keine Daten im gewählten Zeitraum"
                        }
                    ]
            );


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Bericht"
        );


        XLSX.writeFile(
            workbook,
            `LauterMacher_Bericht_${todayISO()}.xlsx`
        );
    }
);
/* =====================================================================
   REALTIME — SUPABASE
   ===================================================================== */

function startRealtime() {

    if (!state.currentPerson) {
        return;
    }


    if (state.realtimeChannel) {

        db.removeChannel(
            state.realtimeChannel
        );

        state.realtimeChannel =
            null;
    }


    const channelName =
        `lautermacher-live-${state.currentPerson.id}`;


    state.realtimeChannel =
        db.channel(
            channelName
        );


    /*
     * PRODUKTE
     *
     * Toute modification de produit est immédiatement
     * récupérée sur les autres appareils.
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "products"
        },
        async () => {

            await loadProducts();


            if (
                state.currentScreenId ===
                "productsScreen"
            ) {

                renderProductsAdmin();
            }


            if (
                state.currentScreenId ===
                "drinksSaleScreen"
            ) {

                renderDrinksSale();
            }


            if (
                state.currentScreenId ===
                "bakerySaleScreen"
            ) {

                renderBakerySale();
            }
        }
    );


    /*
     * INVENTAIRE GLOBAL
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "inventory"
        },
        async () => {

            await loadInventory();


            if (
                state.currentScreenId ===
                "studentInventoryScreen"
            ) {

                renderStudentInventory();
            }


            if (
                state.currentScreenId ===
                "teacherInventoryScreen"
            ) {

                await renderTeacherInventory();
            }
        }
    );


    /*
     * INVENTURES ENVOYÉES PAR LES ÉLÈVES
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "inventory_submissions"
        },
        async () => {

            if (
                isTeacher() &&
                state.currentScreenId ===
                    "teacherInventoryScreen"
            ) {

                await loadInventorySubmissions();
            }
        }
    );


    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "inventory_submission_items"
        },
        async () => {

            if (
                isTeacher() &&
                state.currentScreenId ===
                    "teacherInventoryScreen"
            ) {

                await loadInventorySubmissions();
            }
        }
    );


    /*
     * COMMANDES BÄCKEREI
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "orders"
        },
        async payload => {

            if (
                payload.new?.area ===
                    "bäckerei" ||
                payload.old?.area ===
                    "bäckerei"
            ) {

                if (
                    state.currentScreenId ===
                    "bakeryOutputScreen"
                ) {

                    await loadBakeryOrders();
                }
            }
        }
    );


    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "order_items"
        },
        async () => {

            if (
                state.currentScreenId ===
                "bakeryOutputScreen"
            ) {

                await loadBakeryOrders();
            }
        }
    );


    /*
     * ÉVÉNEMENTS
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "events"
        },
        async payload => {

            await loadEvents();


            if (
                state.currentScreenId ===
                "eventsScreen"
            ) {

                renderEvents();
            }


            if (
                state.currentEvent &&
                (
                    payload.new?.id ===
                        state.currentEvent.id ||
                    payload.old?.id ===
                        state.currentEvent.id
                )
            ) {

                const fresh =
                    state.events.find(
                        event =>
                            event.id ===
                            state.currentEvent.id
                    );


                if (fresh) {

                    state.currentEvent =
                        fresh;


                    if (
                        eventClosed(
                            fresh
                        )
                    ) {

                        showScreen(
                            "eventsScreen"
                        );

                        renderEvents();

                    } else if (
                        state.currentScreenId ===
                        "eventWorkspaceScreen"
                    ) {

                        await openEventWorkspace(
                            fresh
                        );
                    }
                }
            }
        }
    );


    /*
     * PRODUKTE D'UNE SONDERVERANSTALTUNG
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "event_products"
        },
        async payload => {

            if (
                !state.currentEvent
            ) {
                return;
            }


            if (
                payload.new?.event_id !==
                    state.currentEvent.id &&
                payload.old?.event_id !==
                    state.currentEvent.id
            ) {
                return;
            }


            await loadEventProducts();


            if (
                state.currentScreenId ===
                "eventSaleScreen"
            ) {

                renderEventSale();
            }


            if (
                state.currentScreenId ===
                "eventEndInventoryScreen"
            ) {

                renderEventEndInventory();
            }
        }
    );


    /*
     * COMMANDES SONDERVERANSTALTUNG
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "event_orders"
        },
        async payload => {

            if (
                !state.currentEvent ||
                isTeacher()
            ) {
                return;
            }


            if (
                payload.new?.event_id ===
                    state.currentEvent.id ||
                payload.old?.event_id ===
                    state.currentEvent.id
            ) {

                if (
                    state.currentScreenId ===
                    "eventOutputScreen"
                ) {

                    await loadEventOrders();
                }
            }
        }
    );


    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "event_order_items"
        },
        async () => {

            if (
                !isTeacher() &&
                state.currentScreenId ===
                    "eventOutputScreen"
            ) {

                await loadEventOrders();
            }
        }
    );


    /*
     * INVENTAIRE DES ÉVÉNEMENTS
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "event_inventory"
        },
        async () => {

            if (
                state.currentEvent &&
                state.currentScreenId ===
                    "eventEndInventoryScreen"
            ) {

                /*
                 * Pas de remplacement automatique des valeurs
                 * que l'utilisateur est en train de saisir.
                 *
                 * L'événement lui-même sera synchronisé via
                 * la table events.
                 */
            }
        }
    );


    /*
     * FACTURES
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "invoices"
        },
        async () => {

            if (
                isTeacher() &&
                state.currentScreenId ===
                    "invoicesScreen"
            ) {

                await loadInvoices();
            }
        }
    );


    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "invoice_items"
        },
        async () => {

            if (
                isTeacher() &&
                state.currentScreenId ===
                    "invoicesScreen"
            ) {

                await loadInvoices();
            }
        }
    );


    /*
     * BOISSONS GRATUITES DES EMPLOYÉS
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "employee_free_drinks"
        },
        async () => {

            if (
                isTeacher() &&
                state.currentScreenId ===
                    "reportsScreen"
            ) {

                await loadReports();
            }
        }
    );


    /*
     * NOTIFICATIONS
     *
     * Une notification reçue sur un autre iPad doit apparaître
     * immédiatement, sans reconnexion.
     */

    state.realtimeChannel.on(
        "postgres_changes",
        {
            event:
                "*",

            schema:
                "public",

            table:
                "notifications"
        },
        async payload => {

            const notification =
                payload.new ||
                payload.old;


            if (
                !notification
            ) {
                return;
            }


            const forCurrentPerson =
                notification.recipient_person_id ===
                    state.currentPerson.id ||
                notification.recipient_type ===
                    "all" ||
                (
                    notification.recipient_type ===
                        "student" &&
                    !isTeacher()
                ) ||
                (
                    notification.recipient_type ===
                        "teacher" &&
                    isTeacher()
                );


            const sentByCurrentTeacher =
                isTeacher() &&
                notification.created_by ===
                    state.currentPerson.id;


            if (
                forCurrentPerson
            ) {

                await loadNotifications();
            }


            if (
                sentByCurrentTeacher &&
                state.currentScreenId ===
                    "notificationsScreen" &&
                state.notificationMode ===
                    "sent"
            ) {

                await loadSentNotifications();
            }
        }
    );


    state.realtimeChannel.subscribe(
        status => {

            if (
                status ===
                "CHANNEL_ERROR"
            ) {

                console.error(
                    "Supabase Realtime konnte nicht verbunden werden."
                );
            }
        }
    );
}


/* =====================================================================
   RAFRAÎCHISSEMENT DES BADGES / DONNÉES
   ===================================================================== */

async function refreshVisibleScreen() {

    if (
        !state.currentPerson
    ) {
        return;
    }


    try {

        switch (
            state.currentScreenId
        ) {

            case "homeScreen":

                await Promise.all([
                    loadNotifications(),
                    loadEvents()
                ]);

                break;


            case "drinksSaleScreen":

                await Promise.all([
                    loadProducts(),
                    loadInventory()
                ]);

                renderDrinksSale();

                break;


            case "bakerySaleScreen":

                await loadProducts();

                renderBakerySale();

                break;


            case "bakeryOutputScreen":

                await loadBakeryOrders();

                break;


            case "productsScreen":

                await loadProducts();

                renderProductsAdmin();

                break;


            case "studentInventoryScreen":

                await Promise.all([
                    loadProducts(),
                    loadInventory()
                ]);

                renderStudentInventory();

                break;


            case "teacherInventoryScreen":

                await renderTeacherInventory();

                break;


            case "invoicesScreen":

                await loadInvoices();

                break;


            case "studentsScreen":

                if (
                    isTeacher()
                ) {

                    await loadStudents();
                }

                break;


            case "notificationsScreen":

                if (
                    state.notificationMode ===
                    "sent" &&
                    isTeacher()
                ) {

                    await loadSentNotifications();

                } else {

                    await loadNotifications();

                    renderNotificationsPage();
                }

                break;


            case "reportsScreen":

                if (
                    isTeacher()
                ) {

                    await loadReports();
                }

                break;


            case "eventsScreen":

                await loadEvents();

                renderEvents();

                break;


            case "eventProductsScreen":

                await loadEventProducts();

                break;


            case "eventOutputScreen":

                await loadEventOrders();

                break;


            default:
                break;
        }

    } catch (error) {

        console.error(
            "Aktualisierung fehlgeschlagen:",
            error
        );
    }
}


/*
 * Lorsqu'on revient dans l'application après avoir utilisé
 * une autre app sur l'iPad, on recharge l'écran visible.
 */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible" &&
            state.currentPerson
        ) {

            refreshVisibleScreen();
        }
    }
);


/*
 * Même principe lorsque la fenêtre reprend le focus.
 */

window.addEventListener(
    "focus",
    () => {

        if (
            state.currentPerson
        ) {

            refreshVisibleScreen();
        }
    }
);


/* =====================================================================
   FERMETURE DES POPOVERS / MODALES
   ===================================================================== */

document.addEventListener(
    "click",
    event => {

        const popover =
            $("notificationPopover");


        if (
            popover &&
            !popover.hidden &&
            !popover.contains(
                event.target
            ) &&
            !$("notificationButton")
                ?.contains(
                    event.target
                )
        ) {

            hideNotificationPopover();
        }
    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }


        hideNotificationPopover();


        [
            "productModal",
            "studentModal",
            "eventProductModal",
            "otherEventRevenueModal"
        ]
        .forEach(
            id => {

                const modal =
                    $(id);

                if (
                    modal &&
                    !modal.hidden
                ) {

                    hide(modal);
                }
            }
        );
    }
);


/* =====================================================================
   SÉCURITÉ UI
   ===================================================================== */

/*
 * Si une fonction réservée à la Lehrkraft est appelée depuis
 * l'interface alors qu'un élève est connecté, elle est masquée
 * par applyRoleUI(). Les contrôles côté Supabase/RLS restent
 * néanmoins l'autorité de sécurité.
 */

function enforceTeacherOnlyUI() {

    const teacher =
        isTeacher();


    $$(
        ".teacher-only"
    )
    .forEach(
        element => {

            element.hidden =
                !teacher;

            element.style.display =
                teacher
                    ? ""
                    : "none";
        }
    );
}


/* =====================================================================
   HORAIRES ÉLÈVES
   ===================================================================== */

/*
 * DEVELOPMENT_MODE = true pendant le développement.
 *
 * Donc aucun élève n'est bloqué actuellement.
 *
 * Pour la version finale :
 *
 *     const DEVELOPMENT_MODE = false;
 *
 * En dehors de 09:00–15:00 :
 * - aucun écran PIN pour un élève ;
 * - uniquement schoolClosedScreen ;
 * - aucun bouton "Zur Anmeldung".
 */

function enforceSchoolHoursForCurrentSession() {

    if (
        DEVELOPMENT_MODE ||
        !state.currentPerson ||
        isTeacher()
    ) {
        return;
    }


    if (
        !schoolOpenNow()
    ) {

        db.auth.signOut()
            .finally(
                () => {

                    state.currentPerson =
                        null;

                    showSchoolClosed();
                }
            );
    }
}


/*
 * Contrôle périodique uniquement utile lorsque
 * DEVELOPMENT_MODE sera désactivé.
 */

setInterval(
    enforceSchoolHoursForCurrentSession,
    60 * 1000
);


/* =====================================================================
   NETTOYAGE DES TESTS LEHRKRAFT
   ===================================================================== */

/*
 * Les commandes de test Lehrkraft sont volontairement
 * uniquement conservées en mémoire.
 *
 * Elles disparaissent au rechargement de la page et ne touchent :
 * - ni orders ;
 * - ni event_orders ;
 * - ni inventory ;
 * - ni chiffre d'affaires ;
 * - ni bénéfice ;
 * - ni rapports.
 */

function clearTeacherTestEnvironment() {

    state.bakeryTestOrders =
        [];

    state.eventTestOrders =
        {};

    clearCart(
        state.drinksCart
    );

    clearCart(
        state.bakeryCart
    );

    clearCart(
        state.eventCart
    );

    state.drinksReceivedCents =
        0;

    state.bakeryReceivedCents =
        0;

    state.eventReceivedCents =
        0;
}


/* =====================================================================
   AUTH STATE
   ===================================================================== */

db.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (
            event ===
                "SIGNED_OUT" ||
            !session
        ) {

            if (
                state.realtimeChannel
            ) {

                db.removeChannel(
                    state.realtimeChannel
                );

                state.realtimeChannel =
                    null;
            }


            state.currentPerson =
                null;


            clearTeacherTestEnvironment();


            /*
             * On ne force pas identityScreen ici si
             * schoolClosedScreen est déjà affiché.
             */

            if (
                state.currentScreenId !==
                "schoolClosedScreen"
            ) {

                showScreen(
                    "identityScreen",
                    {
                        login:
                            true
                    }
                );
            }
        }
    }
);


/* =====================================================================
   INITIALISATION
   ===================================================================== */

async function initialiseAuthentication() {

    /*
     * Au chargement :
     * 1. session Supabase existante ?
     * 2. personne correspondante ?
     * 3. sinon écran de sélection.
     */

    try {

        const {
            data:
                {
                    session
                }
        } = await db.auth.getSession();


        if (session) {

            const person =
                await loadCurrentPerson();


            if (person) {

                /*
                 * En version finale, une session élève
                 * encore ouverte après 15h est fermée.
                 */

                if (
                    !DEVELOPMENT_MODE &&
                    !isTeacher() &&
                    !schoolOpenNow()
                ) {

                    await db.auth.signOut();

                    state.currentPerson =
                        null;

                    showSchoolClosed();

                    return;
                }


                applyRoleUI();

                enforceTeacherOnlyUI();


                await Promise.all([
                    loadProducts(),
                    loadInventory(),
                    loadNotifications(),
                    loadEvents()
                ]);


                startRealtime();


                goHome();

                return;
            }


            await db.auth.signOut();
        }


        state.currentPerson =
            null;


        showScreen(
            "identityScreen",
            {
                login:
                    true
            }
        );


        await loadLoginPeople();

    } catch (error) {

        console.error(
            "Initialisierung fehlgeschlagen:",
            error
        );


        state.currentPerson =
            null;


        showScreen(
            "identityScreen",
            {
                login:
                    true
            }
        );


        await loadLoginPeople();
    }
}


/* =====================================================================
   DÉMARRAGE
   ===================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Les modales et éléments protégés sont cachés avant
         * l'initialisation pour éviter un flash visuel.
         */

        [
            "productModal",
            "studentModal",
            "eventProductModal",
            "otherEventRevenueModal",
            "notificationPopover"
        ]
        .forEach(
            id => {

                const element =
                    $(id);

                if (element) {

                    element.hidden =
                        true;
                }
            }
        );


        initialiseAuthentication();
    }
);
/* =====================================================================
   SCHÜLER — ZUGANG FREISCHALTEN
   Gestion des autorisations uniquement.
   Le blocage horaire reste désactivé pendant le développement.
   ===================================================================== */

const studentAccessState = {
    students: [],
    grants: [],
    selected: new Set(),
    offset: 0
};


function accessBerlinDate(value) {
    return new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
}


function accessGrantStatus(grant) {
    const now = Date.now() + studentAccessState.offset;

    if (grant.revoked_at) return "Widerrufen";

    if (now >= Date.parse(grant.ends_at)) {
        return "Abgelaufen";
    }

    return now < Date.parse(grant.starts_at)
        ? "Geplant"
        : "Aktiv";
}


function updateAccessStart() {
    const planned =
        $("accessStartMode").value === "planned";

    $("accessStartField").hidden = !planned;
    $("accessStartField").style.display = planned ? "" : "none";
    $("accessStartInput").required = planned;

    setText("accessUntil", "");
}


async function previewAccessEnd() {
    const duration = Number($("accessDuration").value);

    const planned =
        $("accessStartMode").value === "planned";

    if (
        !Number.isSafeInteger(duration) ||
        duration <= 0 ||
        (planned && !$("accessStartInput").value)
    ) {
        setText("accessUntil", "");
        return;
    }

    const generation =
        (previewAccessEnd.generation || 0) + 1;

    previewAccessEnd.generation = generation;

    try {
        const { data, error } = await db.rpc(
            "teacher_preview_student_access",
            {
                p_start_local: planned
                    ? $("accessStartInput").value
                    : null,

                p_duration: duration,
                p_unit: $("accessDurationUnit").value
            }
        );

        if (generation !== previewAccessEnd.generation) return;

        if (error) throw error;

        setText(
            "accessUntil",
            `Zugang bis ${accessBerlinDate(data.ends_at)} · Europe/Berlin`
        );

    } catch (error) {
        console.error(error);

        setText(
            "accessUntil",
            "Bitte Beginn und Dauer prüfen."
        );
    }
}


function renderAccessSelection() {
    const selected = studentAccessState.selected;
    const students = studentAccessState.students;

    const search = $("accessSearch").value
        .trim()
        .toLocaleLowerCase("de-DE");

    const list = $("accessStudentChoices");
    list.innerHTML = "";

    const visibleStudents = students.filter(student =>
        personName(student)
            .toLocaleLowerCase("de-DE")
            .includes(search)
    );

    visibleStudents.forEach(student => {
        const button = document.createElement("button");
        const isSelected = selected.has(student.id);

        button.type = "button";

        button.className = isSelected
            ? "access-chip is-selected"
            : "access-chip";

        button.textContent = personName(student);

        button.setAttribute(
            "aria-pressed",
            String(isSelected)
        );

        button.addEventListener("click", () => {
            if (selected.has(student.id)) {
                selected.delete(student.id);
            } else {
                selected.add(student.id);
            }

            renderAccessSelection();
        });

        list.appendChild(button);
    });

    if (!visibleStudents.length) {
        const message = document.createElement("p");
        message.textContent = "Keine Schüler gefunden.";
        list.appendChild(message);
    }

    const allSelected =
        students.length > 0 &&
        selected.size === students.length;

    const allButton = $("accessSelectAll");

    allButton.disabled = !students.length;

    allButton.className = allSelected
        ? "access-chip is-selected"
        : "access-chip";

    allButton.setAttribute(
        "aria-pressed",
        String(allSelected)
    );

    allButton.textContent = allSelected
        ? "Alle abwählen"
        : "Alle auswählen";

    setText(
        "accessSelectionCount",
        `${selected.size} ausgewählt`
    );
}


function renderAccessHistory() {
    const body = $("accessHistoryList");
    if (!body) return;

    body.innerHTML = "";

    setText(
        "accessHistoryCount",
        `${studentAccessState.grants.length} Einträge`
    );

    if (!studentAccessState.grants.length) {
        body.innerHTML = `
            <tr>
                <td colspan="5">Noch keine Freischaltungen.</td>
            </tr>
        `;

        return;
    }

    studentAccessState.grants.forEach(grant => {
        const status = accessGrantStatus(grant);
        const row = document.createElement("tr");

        row.className =
            status === "Aktiv"
                ? "access-active"
                : status === "Geplant"
                    ? "access-planned"
                    : "access-finished";

        row.innerHTML = `
            <td>${esc(personName(grant))}</td>

            <td>
                ${esc(accessBerlinDate(grant.starts_at))}
            </td>

            <td>
                ${esc(accessBerlinDate(grant.ends_at))}
            </td>

            <td>${status}</td>

            <td></td>
        `;

        if (status === "Aktiv" || status === "Geplant") {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "secondary-action";
            button.textContent = "Widerrufen";

            button.addEventListener("click", async () => {
                button.disabled = true;

                try {
                    const { error } = await db.rpc(
                        "teacher_revoke_student_access",
                        {
                            p_grant_id: grant.id
                        }
                    );

                    if (error) throw error;

                    await loadStudentAccessPanel();

                } catch (error) {
                    console.error(error);

                    setText(
                        "accessFormMessage",
                        "Freischaltung konnte nicht widerrufen werden."
                    );

                } finally {
                    button.disabled = false;
                }
            });

            row.lastElementChild.appendChild(button);
        }

        body.appendChild(row);
    });
}


async function loadStudentAccessPanel() {
    if (!isTeacher() || !$("studentAccessPanel")) return;

    try {
        const { data, error } = await db.rpc(
            "teacher_get_student_access"
        );

        if (error) throw error;

        studentAccessState.students = data.students || [];
        studentAccessState.grants = data.grants || [];

        studentAccessState.offset =
            Date.parse(data.server_now) - Date.now();

        const validIds = new Set(
            studentAccessState.students.map(student => student.id)
        );

        studentAccessState.selected = new Set(
            [...studentAccessState.selected].filter(
                id => validIds.has(id)
            )
        );

        renderAccessSelection();
        renderAccessHistory();

        setText("accessHistoryMessage", "");

        await previewAccessEnd();

    } catch (error) {
        console.error(error);

        setText(
            "accessHistoryMessage",
            "Freischaltungen konnten nicht geladen werden."
        );
    }
}


async function saveStudentAccess(event) {
    event.preventDefault();

    if (!isTeacher() || saveStudentAccess.busy) return;

    setText("accessFormMessage", "");

    const duration = Number($("accessDuration").value);

    const planned =
        $("accessStartMode").value === "planned";

    if (
        !studentAccessState.selected.size ||
        !Number.isSafeInteger(duration) ||
        duration <= 0 ||
        (planned && !$("accessStartInput").value)
    ) {
        setText(
            "accessFormMessage",
            "Bitte Schüler, Beginn und Dauer auswählen."
        );

        return;
    }

    saveStudentAccess.busy = true;
    $("saveStudentAccessButton").disabled = true;

    try {
        const { error } = await db.rpc(
            "teacher_create_student_access",
            {
                p_student_ids: [
                    ...studentAccessState.selected
                ],

                p_start_local: planned
                    ? $("accessStartInput").value
                    : null,

                p_duration: duration,
                p_unit: $("accessDurationUnit").value
            }
        );

        if (error) throw error;

        studentAccessState.selected.clear();
        renderAccessSelection();

        toast("Freischaltung gespeichert.", "success");

        $("accessHistory").open = true;

        await loadStudentAccessPanel();

    } catch (error) {
        console.error(error);

        setText(
            "accessFormMessage",
            "Freischaltung konnte nicht gespeichert werden. " +
            (error.message || "")
        );

    } finally {
        saveStudentAccess.busy = false;
        $("saveStudentAccessButton").disabled = false;
    }
}


$("accessSearch")?.addEventListener(
    "input",
    renderAccessSelection
);


$("accessSelectAll")?.addEventListener(
    "click",
    () => {
        const students = studentAccessState.students;

        const allSelected =
            students.length > 0 &&
            studentAccessState.selected.size === students.length;

        studentAccessState.selected = allSelected
            ? new Set()
            : new Set(
                students.map(student => student.id)
            );

        renderAccessSelection();
    }
);


$("accessStartMode")?.addEventListener(
    "change",
    () => {
        updateAccessStart();
        previewAccessEnd();
    }
);


[
    "accessStartInput",
    "accessDuration",
    "accessDurationUnit"
].forEach(id => {
    $(id)?.addEventListener("change", previewAccessEnd);
});


$("studentAccessForm")?.addEventListener(
    "submit",
    saveStudentAccess
);


/* Mise à jour des statuts pendant la consultation de l'écran. */

setInterval(() => {
    if (
        isTeacher() &&
        state.currentScreenId === "studentsScreen"
    ) {
        renderAccessHistory();
    }
}, 60000);

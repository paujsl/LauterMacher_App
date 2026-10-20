"use strict";

/* =====================================================================
   LAUTERMACHER — APP.JS V5.0.0
   Supabase = source de vérité. Aucun localStorage métier.
   ===================================================================== */

const SUPABASE_URL = "https://gsbkfrjhierqopkwpqjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_xiM5w8RhiN0I0j5HSVPfnw_LhLQgozX";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* Pendant le développement Pauline + ChatGPT : false = horaires scolaires actifs. */
const DEVELOPMENT_MODE = false;
const SCHOOL_OPEN_HOUR = 8;
const SCHOOL_CLOSE_HOUR = 14;

const $ = id => document.getElementById(id);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const productEmojiClass = value => {
    const emojis = String(value ?? "").match(
        /\p{Extended_Pictographic}(?:\uFE0F|\uFE0E|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*/gu
    ) || [];

    return emojis.length >= 2 ? "product-icon-double" : "";
};
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

/* Profil spécial du Bufdi — affichage uniquement */


/* =========================================================
   RÔLES UTILISATEURS — LEHRKRAFT / BUFDI / SCHÜLER
   Le rôle provient directement de Supabase.
   ========================================================= */

function isBufdi(person) {
    return person?.person_type === "bufdi";
}

function personRoleLabel(person) {
    if (person?.person_type === "lehrer") {
        return "Lehrkraft";
    }

    if (isBufdi(person)) {
        return "Bufdi";
    }

    return "Schüler";
}

function personRoleEmoji(person) {
    if (person?.person_type === "lehrer") {
        return "👨🏻‍🏫";
    }

    if (isBufdi(person)) {
        return "👨🏻‍💼";
    }

    return "👤";
}

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

function confirmInApp(message, title = "Bestätigung") {
    return new Promise(resolve => {
        const dialog = document.createElement("dialog");

        dialog.className = "shift-end-drinks-dialog";
        dialog.setAttribute("aria-labelledby", "appConfirmTitle");

        dialog.innerHTML = `
            <h2 id="appConfirmTitle"></h2>
            <p id="appConfirmMessage"></p>
            <form method="dialog">
                <button
                    type="submit"
                    value="cancel"
                    class="secondary-action"
                >
                    Abbrechen
                </button>
                <button
                    type="submit"
                    value="confirm"
                    class="primary-action"
                >
                    Bestätigen
                </button>
            </form>
        `;

        dialog.querySelector("h2").textContent = title;
        dialog.querySelector("p").textContent = message;

        document.body.appendChild(dialog);

        dialog.addEventListener("close", () => {
            const confirmed = dialog.returnValue === "confirm";
            dialog.remove();
            resolve(confirmed);
        }, { once: true });

        dialog.showModal();
    });
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
    studentsScreen:"Bearbeiten · 👤 Profile",
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

/* =========================================================
   NAVIGATION — URL PAR ÉCRAN
   ========================================================= */

const APP_SCREEN_ROUTES = {
    identityScreen: "/connexion",
    pinLoginScreen: "/connexion/pin",
    schoolClosedScreen: "/feierabend",

    homeScreen: "/homepage",

    drinksSaleScreen: "/getraenke/kasse",
    drinksPaymentScreen: "/getraenke/bezahlen",
    drinksSuccessScreen: "/getraenke/bezahlt",
    freeDrinksScreen: "/getraenke/kostenlose-getraenke",

    bakeryMenuScreen: "/baeckerei",
    bakerySaleScreen: "/baeckerei/kasse",
    bakeryPaymentScreen: "/baeckerei/bezahlen",
    bakerySuccessScreen: "/baeckerei/bezahlt",
    bakeryOutputScreen: "/baeckerei/ausgabe",

    editMenuScreen: "/bearbeiten",
    productsScreen: "/bearbeiten/produkte",
    studentInventoryScreen: "/bearbeiten/inventur",
    teacherInventoryScreen: "/bearbeiten/inventur-pruefen",
    invoicesScreen: "/bearbeiten/buchhaltung",
    studentsScreen: "/bearbeiten/schueler",
    notificationsScreen: "/bearbeiten/benachrichtigungen",

    reportsScreen: "/berichte",

    eventsScreen: "/sonderveranstaltungen",
    eventTypeScreen: "/sonderveranstaltungen/typ",
    eventCreateScreen: "/sonderveranstaltungen/neu",
    eventWorkspaceScreen: "/sonderveranstaltungen/uebersicht",
    eventProductsScreen: "/sonderveranstaltungen/produkte",
    eventSaleScreen: "/sonderveranstaltungen/kasse",
    eventPaymentScreen: "/sonderveranstaltungen/bezahlen",
    eventSuccessScreen: "/sonderveranstaltungen/bezahlt",
    eventOutputScreen: "/sonderveranstaltungen/ausgabe",
    eventEndInventoryScreen: "/sonderveranstaltungen/endinventur"
};

const APP_ROUTE_SCREENS = Object.fromEntries(
    Object.entries(APP_SCREEN_ROUTES).map(
        ([screen, route]) => [route, screen]
    )
);

const APP_EVENT_CONTEXT_SCREENS = new Set([
    "eventWorkspaceScreen",
    "eventProductsScreen",
    "eventSaleScreen",
    "eventPaymentScreen",
    "eventSuccessScreen",
    "eventOutputScreen",
    "eventEndInventoryScreen"
]);

let appInitialRouteHash = window.location.hash;
let appInitialRouteUsed = false;
let appRouteHistoryMuted = false;
let appRouteRequest = 0;


function readAppRoute(hash = window.location.hash) {
    const raw = hash.replace(/^#/, "") || "/homepage";
    const separator = raw.indexOf("?");

    const path = separator >= 0
        ? raw.slice(0, separator)
        : raw;

    const query = separator >= 0
        ? raw.slice(separator + 1)
        : "";

    return {
        screen: APP_ROUTE_SCREENS[path] || "homeScreen",
        params: new URLSearchParams(query)
    };
}


function appScreenHash(id) {
    const route = APP_SCREEN_ROUTES[id] || "/homepage";
    const params = new URLSearchParams();

    if (
        APP_EVENT_CONTEXT_SCREENS.has(id) &&
        state.currentEvent?.id
    ) {
        params.set("event", state.currentEvent.id);
    }

    if (id === "eventCreateScreen") {
        params.set(
            "type",
            $("eventCreateTypeInput")?.value || "food"
        );
    }

    const query = params.toString();

    return `#${route}${query ? `?${query}` : ""}`;
}


function allowedAppScreen(id) {
    if (!$(id)) {
        return state.currentPerson
            ? "homeScreen"
            : "identityScreen";
    }

    if (id === "schoolClosedScreen") {
        return id;
    }

    if (!state.currentPerson) {
        return id === "pinLoginScreen" &&
            state.selectedLoginPerson
                ? "pinLoginScreen"
                : "identityScreen";
    }

    if (
        id === "identityScreen" ||
        id === "pinLoginScreen"
    ) {
        return "homeScreen";
    }

    if ($(id).classList.contains("teacher-only") && !isTeacher()) {
        return "homeScreen";
    }

    return id;
}


function showScreen(
    requestedId,
    { login = false, historyMode = "push" } = {}
) {
    const id = allowedAppScreen(requestedId);
    const target = $(id);

    if (!target) return;

    $$(".screen").forEach(element => {
        element.style.display = "none";
        element.classList.remove("screen-visible");
    });

    target.hidden = false;
    target.style.display = "block";
    target.classList.add("screen-visible");

    if (state.currentScreenId !== id) {
        state.previousScreenId = state.currentScreenId;
    }

        state.currentScreenId = id;
    updateTeacherTestUI();

    const loginScreen = [
        "identityScreen",
        "pinLoginScreen",
        "schoolClosedScreen"
    ].includes(id);

    const authenticated =
        Boolean(state.currentPerson) &&
        !login &&
        !loginScreen;

    const header = $("appHeader");
    const breadcrumb = $("breadcrumb");

    if (header) {
        header.hidden = !authenticated;
        header.style.display = authenticated ? "" : "none";
    }

    if (breadcrumb) {
        const hidden = !authenticated || id === "homeScreen";

        breadcrumb.hidden = hidden;
        breadcrumb.style.display = hidden ? "none" : "";
    }

    setText("breadcrumbCurrent", screenTitles[id] || "");

    if (!appRouteHistoryMuted) {
        const hash = appScreenHash(id);

        const replace =
            historyMode === "replace" ||
            loginScreen ||
            id !== requestedId ||
            window.location.hash === hash;

        const routeState = {
            lauterMacher: true,
            screen: id
        };

        if (replace) {
            window.history.replaceState(routeState, "", hash);
        } else {
            window.history.pushState(routeState, "", hash);
        }
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}

/* =====================================================
   PROFESSEUR — BOUTON MODE NORMAL / TEST
   ===================================================== */

const TEACHER_TEST_SCREENS = new Set([
    "drinksSaleScreen",
    "drinksPaymentScreen",
    "drinksSuccessScreen",
    "freeDrinksScreen",
    "bakerySaleScreen",
    "bakeryPaymentScreen",
    "bakerySuccessScreen",
    "bakeryOutputScreen",
    "eventSaleScreen",
    "eventPaymentScreen",
    "eventSuccessScreen",
    "eventOutputScreen"
]);


function updateTeacherTestUI() {
    const active = isTeacherTestMode();

    document.body.classList.toggle(
        "teacher-test-mode",
        active
    );

    document.querySelectorAll(
        ".teacher-test-toggle"
    ).forEach(button => {
        const screen = button.closest(".screen");

        const visible =
            isTeacher() &&
            TEACHER_TEST_SCREENS.has(state.currentScreenId) &&
            screen?.id === state.currentScreenId;

        const group = button.closest(".teacher-test-group");
        const warning = group?.querySelector(".teacher-test-warning");

        if (group) {
            group.hidden = !visible;
        }

        button.hidden = !visible;

        button.textContent = active
            ? "Testumgebung aktiv"
            : "Testumgebung";

        button.setAttribute(
            "aria-pressed",
            String(active)
        );

        if (warning) {
            warning.hidden = !(visible && active);
        }
    });

    [
        "homeDrinksTestBadge",
        "homeBakeryTestBadge"
    ].forEach(id => {
        const badge = $(id);

        if (badge) {
            badge.hidden = !active;
            badge.style.display = active ? "" : "none";
        }
    });
}


function installTeacherTestToggles() {
    for (const id of TEACHER_TEST_SCREENS) {
        const screen = $(id);

        if (
            !screen ||
            screen.querySelector(".teacher-test-toggle")
        ) {
            continue;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.className = "teacher-test-toggle";

        button.addEventListener("click", async () => {
            if (!isTeacher() || state.cashierSaving) return;

            if (
                cashierCartCents(state.drinksCart) > 0 ||
                cashierCartCents(state.bakeryCart) > 0 ||
                Object.keys(state.eventCart).length > 0
            ) {
                toast(
                    "Bitte zuerst den Warenkorb leeren, bevor du den Modus wechselst.",
                    "error"
                );
                return;
            }

            teacherTestMode = !teacherTestMode;

            updateTeacherTestUI();

            if (state.currentScreenId === "bakeryOutputScreen") {
                await loadBakeryOrders();
            }

            if (state.currentScreenId === "eventOutputScreen") {
                await loadEventOrders();
            }

            if (state.currentScreenId === "drinksSaleScreen") {
                renderDrinksSale();
            }

            if (state.currentScreenId === "bakerySaleScreen") {
                renderBakerySale();
            }

            if (state.currentScreenId === "drinksPaymentScreen") {
                renderCashierPayment("drinks");
            }

            if (state.currentScreenId === "bakeryPaymentScreen") {
                renderCashierPayment("bakery");
            }

            if (state.currentScreenId === "eventSaleScreen") {
                renderEventSale();
            }

            if (state.currentScreenId === "eventPaymentScreen") {
                renderEventPayment();
            }
        });

        
const group = document.createElement("div");
group.className = "teacher-test-group";

const warning = document.createElement("div");
warning.className = "teacher-test-warning";
warning.textContent =
    "⚠️ Testumgebung – keine Daten werden gespeichert";
warning.hidden = true;

group.append(button, warning);

const header =
    screen.querySelector(":scope > .screen-header") ||
    screen.querySelector(":scope > .page-header") ||
    screen.querySelector("header.screen-header") ||
    screen.querySelector("header.page-header");

if (header) {
    header.appendChild(group);
} else {
    screen.prepend(group);
}

    }

    updateTeacherTestUI();
}

function goHome() {
    showScreen("homeScreen");
}

async function openAppRoute(hash) {
    const request = ++appRouteRequest;
    const personId = state.currentPerson?.id;

    let { screen, params } = readAppRoute(hash);

    try {
        if (state.currentPerson && !isTeacher()) {
            if (!await checkStudentTestAccess()) return;

            if (!schoolOpenNow()) {
                showSchoolClosed();
                return;
            }
        }

        if (
            request !== appRouteRequest ||
            state.currentPerson?.id !== personId
        ) {
            return;
        }

        screen = allowedAppScreen(screen);

        // Ces confirmations appartiennent à un paiement terminé.
        // Revenir dessus ouvre la caisse, sans rejouer le paiement.
        const successFallbacks = {
            drinksSuccessScreen: "drinksSaleScreen",
            bakerySuccessScreen: "bakerySaleScreen",
            eventSuccessScreen: "eventSaleScreen"
        };

        screen = successFallbacks[screen] || screen;

        if (
            screen === "drinksPaymentScreen" &&
            cashierCartCents(state.drinksCart) <= 0
        ) {
            screen = "drinksSaleScreen";
        }

        if (
            screen === "bakeryPaymentScreen" &&
            cashierCartCents(state.bakeryCart) <= 0
        ) {
            screen = "bakerySaleScreen";
        }

        // Chaque événement possède son identifiant dans l'URL.
        if (
            state.currentPerson &&
            APP_EVENT_CONTEXT_SCREENS.has(screen)
        ) {
            const eventId = params.get("event");

            if (
                !eventId ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)
            ) {
                screen = "eventsScreen";

            } else {
                const { data, error } = await db
                    .from("events")
                    .select("*")
                    .eq("id", eventId)
                    .maybeSingle();

                if (error) throw error;

                if (
                    request !== appRouteRequest ||
                    state.currentPerson?.id !== personId
                ) {
                    return;
                }

                if (!data || eventClosed(data)) {
                    screen = "eventsScreen";
                } else {
                    state.currentEvent = data;
                }
            }
        }

        appRouteHistoryMuted = true;

        try {
            if (
                APP_EVENT_CONTEXT_SCREENS.has(screen) &&
                state.currentEvent
            ) {
                await openEventWorkspace(state.currentEvent);
            }

            if (
                request !== appRouteRequest ||
                state.currentPerson?.id !== personId
            ) {
                return;
            }

            if (screen === "eventCreateScreen") {
                openEventCreate(
                    params.get("type") === "other"
                        ? "other"
                        : "food"
                );
            }

                        showScreen(screen);

            // Réactiver les URL avant le chargement des données.
            appRouteHistoryMuted = false;

            if (screen === "drinksPaymentScreen") {
                renderCashierPayment("drinks");

            } else if (screen === "bakeryPaymentScreen") {
                renderCashierPayment("bakery");

            } else if (screen === "freeDrinksScreen") {
                if (!$("freeDrinksList")?.children.length) {
                    renderFreeDrinks();
                }

            } else if (screen === "invoicesScreen") {
                await initialiseInvoices();

            } else if (screen === "notificationsScreen") {
                if (isTeacher()) {
                    await loadNotificationRecipients();
                }

                await refreshVisibleScreen();

            } else if (screen === "eventSaleScreen") {
                await loadEventProducts();
                renderEventSale();

            } else if (screen === "eventPaymentScreen") {
                // Le panier événement n'est pas restauré
                // après un rechargement de la page.
                showScreen("eventSaleScreen");
                await loadEventProducts();
                renderEventSale();

            } else if (screen === "eventEndInventoryScreen") {
                await loadEventProducts();
                renderEventEndInventory();

            } else {
                await refreshVisibleScreen();
            }

        } finally {
            appRouteHistoryMuted = false;
        }

        if (
            request === appRouteRequest &&
            state.currentPerson?.id === personId
        ) {
            showScreen(state.currentScreenId, {
                historyMode: "replace"
            });
        }

    } catch (error) {
        appRouteHistoryMuted = false;

        if (
            request !== appRouteRequest ||
            state.currentPerson?.id !== personId
        ) {
            return;
        }

        console.error("Navigation:", error);

        toast(
            "Die Seite konnte nicht geöffnet werden.",
            "error"
        );

        showScreen(
            state.currentPerson ? "homeScreen" : "identityScreen",
            { historyMode: "replace" }
        );
    }
}


async function openInitialAppRoute() {
    if (appInitialRouteUsed) {
        showScreen("homeScreen", {
            historyMode: "replace"
        });
        return;
    }

    appInitialRouteUsed = true;

    await openAppRoute(
        appInitialRouteHash || "#/homepage"
    );
}


function handleAppBrowserNavigation() {
    const hash = window.location.hash;

    // Un lien protégé peut être repris après connexion.
    if (!state.currentPerson && !appInitialRouteUsed) {
        appInitialRouteHash = hash;
    }

    openAppRoute(hash);
}


window.addEventListener(
    "popstate",
    handleAppBrowserNavigation
);


window.addEventListener("hashchange", () => {
    // Retour/Suivant peut émettre aussi hashchange.
    // Éviter de recharger deux fois l'écran déjà affiché.
    if (
        window.location.hash !== appScreenHash(state.currentScreenId)
    ) {
        handleAppBrowserNavigation();
    }
});

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
    setText("currentPersonRole", personRoleLabel(state.currentPerson));
    setText("homeRoleLabel", personRoleLabel(state.currentPerson));
    $("currentPersonRole")?.classList.toggle("teacher-role",teacher);
    $("homeRoleLabel")?.classList.toggle("teacher-role",teacher);
    ["homeDrinksTestBadge","homeBakeryTestBadge"].forEach(id => {
        const el = $(id);

        if (el) {
            el.hidden = !isTeacherTestMode();
            el.style.display = isTeacherTestMode() ? "" : "none";
        }
    });}

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


async function loadLoginPeople() {
    try {
        let { data, error } = await db.rpc("get_login_people");

        if (error) {
            const fallback = await db
                .from("login_people")
                .select("*");

            data = fallback.data;
            error = fallback.error;
        }

        if (error) throw error;

        const grid = $("peopleGrid");
        if (!grid) return;

        grid.innerHTML = "";

        const people = [...(data || [])];

        // 1. Professeurs
        // 2. Lukas (Bufdi)
        // 3. Élèves par ordre alphabétique
        people.sort((a, b) => {
            const priority = person => {
                if (person.person_type === "lehrer") return 0;
                if (isBufdi(person)) return 1;
                return 2;
            };

            const difference = priority(a) - priority(b);
            if (difference !== 0) return difference;

            const nameA = [
                a.last_name || "",
                a.first_name || ""
            ].join(" ");

            const nameB = [
                b.last_name || "",
                b.first_name || ""
            ].join(" ");

            return nameA.localeCompare(nameB, "de", {
                sensitivity: "base"
            });
        });

        people.forEach(person => {
            const btn = document.createElement("button");

            btn.type = "button";
            btn.className = "person-card";

            btn.innerHTML = `
                <span class="person-avatar">
                    ${personRoleEmoji(person)}
                </span>
                <strong>${esc(personName(person))}</strong>
                <small>${personRoleLabel(person)}</small>
            `;

            btn.addEventListener("click", () => {
                state.selectedLoginPerson = person;

                if (!studentMayOpenPin(person)) {
                    showSchoolClosed();
                    return;
                }

                setText("selectedPersonName", personName(person));
                $("loginPinInput").value = "";
                setText("pinLoginError", "");

                showScreen("pinLoginScreen", { login: true });

                setTimeout(
                    () => $("loginPinInput")?.focus(),
                    50
                );
            });

            grid.appendChild(btn);
        });

        setText("identityError", "");

    } catch (error) {
        console.error(error);
        setText(
            "identityError",
            "Personen konnten nicht geladen werden."
        );
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

async function checkStudentTestAccess() {
    const person = state.currentPerson;

    if (
        !person ||
        person.person_type === "lehrer"
    ) {
        return true;
    }

    const { data, error } = await db.rpc(
        "current_student_access_test_status"
    );

    if (error) throw error;

    // La session peut avoir changé pendant la requête.
    if (state.currentPerson?.id !== person.id) {
        return false;
    }

    if (data?.allowed === true) {
        return true;
    }

    if (data?.allowed !== false) {
        throw new Error("Ungültige Zugangsauskunft.");
    }

    /*
     * Fermer immédiatement les écrans de travail,
     * avant d'attendre la déconnexion Supabase.
     */
    state.currentPerson = null;
    state.selectedLoginPerson = null;

    showSchoolClosed();

    const screen = $("schoolClosedScreen");

    const title = screen?.querySelector("h1, h2");
    const message = screen?.querySelector("p");

    if (title) {
        title.textContent =
            "Deine Website macht auch Feierabend.";
    }

    if (message) {
        message.textContent =
            "Dein Zugang ist derzeit gesperrt. " +
            "Eine Lehrkraft kann ihn wieder freischalten. " +
            "Bitte lade die Seite danach erneut.";
    }

    const channel = state.realtimeChannel;
    state.realtimeChannel = null;

    /*
     * La fermeture visuelle a déjà eu lieu.
     * Nettoyer ensuite la connexion et l'abonnement.
     */
    const cleanup = [
        db.auth.signOut()
    ];

    if (channel) {
        cleanup.push(db.removeChannel(channel));
    }

    const results = await Promise.allSettled(cleanup);

    results.forEach(result => {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    });

    return false;
}

async function initialiseAuthenticatedApp() {
    try {
        const person = await loadCurrentPerson();

        if (!person) {
            await db.auth.signOut();
            return;
        }

        if (!await checkStudentTestAccess()) {
            return;
        }

        if (!isTeacher() && !schoolOpenNow()) {
            state.currentPerson = null;

            showSchoolClosed();

            await db.auth.signOut();
            return;
        }

                applyRoleUI();
        enforceTeacherOnlyUI();
        installTeacherTestToggles();

        await Promise.all([
            loadProducts(),
            loadInventory(),
            loadNotifications(),
            loadEvents()
        ]);

        startRealtime();
        await openInitialAppRoute();

    } catch (error) {
        console.error(error);

        toast(
            "Die App konnte nicht geladen werden.",
            "error"
        );
    }
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
        btn.innerHTML=`<span class="sale-product-icon ${productEmojiClass(productIcon(p))}">${esc(productIcon(p))}</span><strong>${esc(p.name)}</strong><span>${money(productPrice(p))}</span>${qty?`<b class="product-quantity-badge">${qty}</b>`:""}`;
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
   GETRÄNKE + BÄCKEREI — CAISSES
   ===================================================================== */

function cashierEntryCents(raw) {
    const [euros = "0", decimals = ""] =
        String(raw || "0").split(",");

    return (
        Number(euros || "0") * 100 +
        Number(decimals.padEnd(2, "0"))
    );
}


function cashierEntryKey(raw, key) {
    raw = String(raw || "");

    if (key === "delete") {
        return raw.slice(0, -1);
    }

    if (key === ",") {
        return raw.includes(",")
            ? raw
            : (raw || "0") + ",";
    }

    if (!/^\d$/.test(key)) return raw;

    if (raw.includes(",")) {
        return raw.split(",")[1].length < 2
            ? raw + key
            : raw;
    }

    if (raw === "0") return key;

    return raw.length < 6 ? raw + key : raw;
}


function cashierCartCents(cart) {
    return Object.values(cart).reduce(
        (sum, item) =>
            sum +
            Math.round(productPrice(item) * 100) *
            integer(item.quantity),
        0
    );
}


function openCashierPayment(area) {
    if (cashierCartCents(state[`${area}Cart`]) <= 0) return;

    state[`${area}PaymentInput`] = "";
state[`${area}ReceivedCents`] = 0;

// Réinitialiser Passend bezahlt.
const exactButton = $(`${area}ExactPaymentButton`);

if (exactButton) {
    exactButton.disabled = false;
}

const paidButton = $(`${area}PaidButton`);

if (paidButton) {
    delete paidButton.dataset.exactPaymentPending;
}

renderCashierPayment(area);
    showScreen(`${area}PaymentScreen`);
}

/* =====================================================
   BEZAHLEN — BOUTON "PASSEND BEZAHLT"
   Getränke + Bäckerei, Lehrer + Schüler
   ===================================================== */


function installExactPaymentButton(area) {
    const paidButton = $(`${area}PaidButton`);
    const keypad = $(`${area}PaymentKeypad`);

    if (!paidButton || !keypad) return;

    const buttonId = `${area}ExactPaymentButton`;

    if ($(buttonId)) return;

    const button = document.createElement("button");

    button.id = buttonId;
    button.type = "button";
    button.className = "exact-payment-button";
    button.textContent = "✓ Passend bezahlt";

    // Le raccourci se trouve sous le bouton Bezahlt.
    paidButton.insertAdjacentElement("afterend", button);

    button.addEventListener("click", () => {
        if (
            state.cashierSaving ||
            button.disabled ||
            paidButton.dataset.exactPaymentPending === "true"
        ) {
            return;
        }

        let totalCents;

        if (area === "event") {
            totalCents = Math.round(eventCartTotal() * 100);
        } else {
            totalCents = cashierCartCents(
                state[`${area}Cart`]
            );
        }

        if (totalCents <= 0) return;

        // Le client a donné exactement le montant dû.
        if (area === "event") {
            state.eventReceivedCents = totalCents;
            renderEventPayment();
        } else {
            state[`${area}ReceivedCents`] = totalCents;

            state[`${area}PaymentInput`] =
                `${Math.floor(totalCents / 100)},${String(
                    totalCents % 100
                ).padStart(2, "0")}`;

            renderCashierPayment(area);
        }

        // Utiliser le paiement existant : aucune
        // deuxième logique de vente ou de stock.
        if (paidButton.disabled) return;

        paidButton.dataset.exactPaymentPending = "true";
        button.disabled = true;

        paidButton.click();

        // La prochaine ouverture de l'écran de paiement
        // réinitialisera le raccourci.
    });
}


function renderCashierPayment(area) {
    installExactPaymentButton(area);

       const exactButton = $(`${area}ExactPaymentButton`);

    if (exactButton && !state.cashierSaving) {
        exactButton.disabled = false;
    }

    const total = cashierCartCents(state[`${area}Cart`]);
    const received = state[`${area}ReceivedCents`] || 0;

    setText(`${area}PaymentTotal`, money(total / 100));
    setText(`${area}AmountReceived`, money(received / 100));

    setText(
        `${area}ChangeAmount`,
        money(Math.max(0, received - total) / 100)
    );

    const button = $(`${area}PaidButton`);

    if (button) {
        button.disabled =
            !!state.cashierSaving ||
            total <= 0 ||
            received < total;
    }

    const banner = $(`${area}PaymentTestBanner`);

    if (banner) {
        banner.hidden = !isTeacher();
        banner.style.display = isTeacher() ? "" : "none";
    }
}


function renderDrinksPayment() {
    renderCashierPayment("drinks");
}


function renderBakeryPayment() {
    renderCashierPayment("bakery");
}


function handleCashierKey(area, event) {
    if (state.cashierSaving) return;

    const button = event.target.closest(".payment-key");
    if (!button) return;

    const key = button.id === `${area}DeletePaymentButton`
        ? "delete"
        : button.dataset.value;

    const raw = cashierEntryKey(
        state[`${area}PaymentInput`],
        key
    );

    state[`${area}PaymentInput`] = raw;
    state[`${area}ReceivedCents`] = cashierEntryCents(raw);

    renderCashierPayment(area);
}


function bakeryBerlinDay(value = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(value));
}


function nextBakeryTestOrderNumber() {
    const teacherId = state.currentPerson?.id;

    if (!teacherId || !isTeacher()) {
        throw new Error("teacher_required");
    }

    const key = `${teacherId}:${bakeryBerlinDay()}`;

    state.bakeryTestCounters ??= {};

    const number = state.bakeryTestCounters[key] ?? 1;

    if (number > 50) {
        throw new Error("test_order_number_limit_reached");
    }

    state.bakeryTestCounters[key] = number + 1;

    return number;
}


async function completeCashierPayment(area, event) {
    event.preventDefault();

    if (!state.currentPerson || state.cashierSaving) return;

    const cart = state[`${area}Cart`];
    const total = cashierCartCents(cart);
    const received = state[`${area}ReceivedCents`] || 0;

    if (total <= 0 || received < total) return;

        const teacherTest = isTeacherTestMode();
    const personId = state.currentPerson.id;

    state.cashierSaving = true;
    renderCashierPayment(area);

    let saved = false;

    try {
        let change = (received - total) / 100;
        let orderNumber = "---";

        if (teacherTest) {

            if (area === "bakery") {
                const testId = crypto.randomUUID();

                const items = Object.values(cart).map(
                    item => ({ ...item })
                );

                orderNumber = nextBakeryTestOrderNumber();

                state.bakeryTestOrders.unshift({
    id: testId,
    owner_id: personId,
    order_number: orderNumber,
    status: "offen",
    total_amount: total / 100,
    created_at: new Date().toISOString(),
    served_at: null,
    items
});
            }

        } else {
            const { data, error } = await db.rpc(
                "create_sale_order",
                {
                    p_area: area === "drinks"
                        ? "getränke"
                        : "bäckerei",

                    p_items: cartItemsForRpc(cart),
                    p_payment_amount: received / 100
                }
            );

            if (error) throw error;

            saved = true;

            const order = Array.isArray(data)
                ? data[0]
                : data;

            change = order?.change_amount ?? change;
            orderNumber = order?.order_number ?? orderNumber;
        }

        setText(
            "drinksSuccessDescription",
            teacherTest
                ? "Testverkauf – keine Daten wurden gespeichert."
                : "Verkauf wurde gespeichert."
        );

        setText(`${area}SuccessChange`, money(change));

        if (area === "bakery") {
            setText(
                "bakerySuccessOrderNumber",
                orderNumber === "---"
                    ? "---"
                    : teacherTest
                        ? `Test #${orderNumber}`
                        : `#${orderNumber}`
            );
        }

        clearCart(cart);

        state[`${area}PaymentInput`] = "";
        state[`${area}ReceivedCents`] = 0;

        showScreen(`${area}SuccessScreen`);

        if (!teacherTest) {
            try {
                await loadInventory();
            } catch (error) {
                console.error(error);
            }
        }

    } catch (error) {
        console.error(error);

        const message = String(error?.message || "");

        let notification =
            "Zahlung konnte nicht gespeichert werden.";

        if (saved) {
            notification =
                "Verkauf gespeichert. Ansicht konnte nicht aktualisiert werden.";

        } else if (
            message.includes("test_order_number_limit_reached")
        ) {
            notification =
                "Alle 50 Testbestellnummern sind heute vergeben.";

        } else if (
            message.includes("daily_order_number_limit_reached")
        ) {
            notification =
                "Alle Bestellnummern von 10 bis 499 sind heute vergeben.";
        }

        toast(notification, saved ? "info" : "error");

    } finally {
        state.cashierSaving = false;
        renderCashierPayment(area);
    }
}


/* GETRÄNKE */

function drinksProducts() {
    return state.products.filter(product =>
        productArea(product).includes("geträn") ||
        productArea(product) === "drinks"
    );
}


function renderDrinksSale() {
    renderProductGrid(
        "drinksProductGrid",
        drinksProducts(),
        state.drinksCart,
        renderDrinksSale
    );

    renderCart(
        "drinksCartItems",
        "drinksCartTotal",
        "drinksPayButton",
        state.drinksCart,
        renderDrinksSale
    );

    const banner = $("drinksTestBanner");

    if (banner) {
                banner.hidden = !isTeacherTestMode();
        banner.style.display = isTeacherTestMode() ? "" : "none";
    }
}


$("drinksSaleBackButton")?.addEventListener("click", goHome);

$("drinksPayButton")?.addEventListener(
    "click",
    () => openCashierPayment("drinks")
);

$("drinksPaymentBackButton")?.addEventListener("click", () => {
    if (!state.cashierSaving) showScreen("drinksSaleScreen");
});

$("drinksPaymentKeypad")?.addEventListener(
    "click",
    event => handleCashierKey("drinks", event)
);

$("drinksPaidButton")?.addEventListener(
    "click",
    event => completeCashierPayment("drinks", event)
);

$("drinksNewOrderButton")?.addEventListener("click", () => {
    renderDrinksSale();
    showScreen("drinksSaleScreen");
});

$("drinksShiftEndButton")?.addEventListener(
    "click",
    () => openFreeDrinks("drinksSaleScreen")
);

$("drinksSuccessShiftEndButton")?.addEventListener(
    "click",
    () => openFreeDrinks("drinksSuccessScreen")
);


/* KOSTENLOSE GETRÄNKE */

function openFreeDrinks(backScreen) {
    state.freeDrinksBackScreen = backScreen;

    const banner = $("freeDrinksTestBanner");

    if (banner) {
        banner.hidden = !isTeacher();
        banner.style.display = isTeacher() ? "" : "none";
    }

    renderFreeDrinks();
    showScreen("freeDrinksScreen");
}


function renderFreeDrinks() {
    const box = $("freeDrinksList");
    if (!box) return;

    box.innerHTML = "";

    drinksProducts().filter(activeProduct).forEach(product => {
        const row = document.createElement("div");

        row.className = "quantity-product-row";
        row.dataset.productId = product.id;
        row.dataset.quantity = "0";

        row.innerHTML = `
            <span>${esc(productIcon(product))}</span>
            <strong>${esc(product.name)}</strong>

            <div class="quantity-control">
                <button type="button" data-minus>−</button>
                <span data-value>0</span>
                <button type="button" data-plus>+</button>
            </div>
        `;

        const update = delta => {
            if (finishFreeDrinks.busy) return;

            const quantity = Math.max(
                0,
                integer(row.dataset.quantity) + delta
            );

            row.dataset.quantity = quantity;
            row.querySelector("[data-value]").textContent = quantity;
        };

        row.querySelector("[data-minus]").onclick = () => update(-1);
        row.querySelector("[data-plus]").onclick = () => update(1);

        box.appendChild(row);
    });
}


$("freeDrinksBackButton")?.addEventListener("click", () => {
    if (!finishFreeDrinks.busy) {
        showScreen(state.freeDrinksBackScreen || "drinksSaleScreen");
    }
});

$("freeDrinksNoneButton")?.addEventListener(
    "click",
    () => finishFreeDrinks([])
);

$("freeDrinksSaveButton")?.addEventListener("click", () => {
    const items = $$("#freeDrinksList [data-product-id]")
        .map(row => ({
            product_id: row.dataset.productId,
            quantity: integer(row.dataset.quantity)
        }))
        .filter(item => item.quantity > 0);

    finishFreeDrinks(items);
});


async function finishFreeDrinks(items) {
    if (!state.currentPerson || finishFreeDrinks.busy) return;

    if (!items.length) {
        askShiftEnd("freeDrinksScreen");
        return;
    }

    finishFreeDrinks.busy = true;

    const buttonIds = [
        "freeDrinksNoneButton",
        "freeDrinksSaveButton",
        "freeDrinksEndButton"
    ];

    buttonIds.forEach(id => {
        if ($(id)) $(id).disabled = true;
    });

    let saved = false;

    try {
                if (!isTeacherTestMode()) {
            const { error } = await db.rpc(
                "record_free_drinks",
                {
                    p_items: items,
                    p_context: "getränke",
                    p_event_id: null
                }
            );

            if (error) throw error;

            saved = true;
        }

        // Nouvelle saisie, sans reprendre les quantités
        // qui viennent d'être enregistrées.
        renderFreeDrinks();

        toast(
                        isTeacherTestMode()
                ? "Testeingabe abgeschlossen. Weitere Getränke können eingetragen werden."
                : "Getränke gespeichert. Weitere Getränke können eingetragen werden.",
            "success"
        );

        if (saved) {
            try {
                await loadInventory();
            } catch (error) {
                console.error(error);
            }
        }

    } catch (error) {
        console.error(error);

        toast(
            saved
                ? "Getränke gespeichert. Bitte nicht nochmals eintragen."
                : "Getränke konnten nicht gespeichert werden.",
            "error"
        );

    } finally {
        finishFreeDrinks.busy = false;

        buttonIds.forEach(id => {
            if ($(id)) $(id).disabled = false;
        });
    }
}


/* BÄCKEREI */

function bakeryProducts() {
    return state.products.filter(product =>
        productArea(product).includes("bäck") ||
        productArea(product).includes("back") ||
        productArea(product) === "bakery"
    );
}


function renderBakerySale() {
    renderProductGrid(
        "bakeryProductGrid",
        bakeryProducts(),
        state.bakeryCart,
        renderBakerySale
    );

    renderCart(
        "bakeryCartItems",
        "bakeryCartTotal",
        "bakeryPayButton",
        state.bakeryCart,
        renderBakerySale
    );

    const banner = $("bakerySaleTestBanner");

    if (banner) {
        banner.hidden = !isTeacher();
        banner.style.display = isTeacher() ? "" : "none";
    }
}


$("bakeryMenuBackButton")?.addEventListener("click", goHome);

$("bakeryCashierButton")?.addEventListener("click", () => {
    clearCart(state.bakeryCart);
    renderBakerySale();
    showScreen("bakerySaleScreen");
});

$("bakeryOutputButton")?.addEventListener("click", async () => {
    showScreen("bakeryOutputScreen");
    await loadBakeryOrders();
});

$("bakerySaleBackButton")?.addEventListener(
    "click",
    () => showScreen("bakeryMenuScreen")
);

$("bakeryPayButton")?.addEventListener(
    "click",
    () => openCashierPayment("bakery")
);

$("bakeryPaymentBackButton")?.addEventListener("click", () => {
    if (!state.cashierSaving) showScreen("bakerySaleScreen");
});

$("bakeryPaymentKeypad")?.addEventListener(
    "click",
    event => handleCashierKey("bakery", event)
);

$("bakeryPaidButton")?.addEventListener(
    "click",
    event => completeCashierPayment("bakery", event)
);

$("bakeryNewOrderButton")?.addEventListener("click", () => {
    renderBakerySale();
    showScreen("bakerySaleScreen");
});

$("bakeryOutputBackButton")?.addEventListener(
    "click",
    () => showScreen("bakeryMenuScreen")
);

function askShiftEnd(backScreen) {
    if (document.getElementById("shiftEndDrinksDialog")) {
        return;
    }

    const dialog = document.createElement("dialog");

    dialog.id = "shiftEndDrinksDialog";
    dialog.className = "shift-end-drinks-dialog";

    dialog.setAttribute(
        "aria-labelledby",
        "shiftEndDrinksTitle"
    );

    dialog.innerHTML = `
        <h2 id="shiftEndDrinksTitle">
            Schicht beenden?
        </h2>

        <p>
            Sind die kostenlosen Getränke für alle
            Schülerinnen und Schüler der heutigen
            Schicht bereits eingetragen?
        </p>

        <form method="dialog">

            <button
                class="secondary-action"
                value="cancel"
                type="submit"
            >
                Zurück
            </button>

            <button
                class="secondary-action"
                value="drinks"
                type="submit"
            >
                Nein, Getränke eintragen
            </button>

            <button
                class="primary-action"
                value="finish"
                type="submit"
            >
                Ja, Schicht beenden
            </button>

        </form>
    `;

    document.body.appendChild(dialog);

    dialog.addEventListener("close", () => {
        const action = dialog.returnValue;

        dialog.remove();

        if (action === "drinks") {
            if (backScreen === "freeDrinksScreen") {
                // Conserver les quantités déjà saisies.
                showScreen("freeDrinksScreen");
            } else {
                openFreeDrinks(backScreen);
            }

        } else if (action === "finish") {
            toast(
                                isTeacherTestMode()
                    ? "Test beendet – keine echten Daten wurden geändert."
                    : "Gut gemacht heute, Team! 🎉",
                "success"
            );

            goHome();
        }
    }, { once: true });

    dialog.showModal();
}


$("bakeryCashShiftEndButton")?.addEventListener("click", () => {
    askShiftEnd("bakerySaleScreen");
});


$("bakeryOutputShiftEndButton")?.addEventListener("click", () => {
    askShiftEnd("bakeryOutputScreen");
});


$("freeDrinksEndButton")?.addEventListener("click", () => {
    if (!finishFreeDrinks.busy) {
        askShiftEnd("freeDrinksScreen");
    }
});
const bakeryServingIds = new Set();

let bakeryOrdersLoadVersion = 0;


function bakeryOrderDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}


function bakeryOrderItems(order) {
    return order.order_items || order.items || [];
}


function bakeryOrderItemName(item) {
    return (
        item.product_name ||
        item.name ||
        state.products.find(
            product => product.id === item.product_id
        )?.name ||
        "Produkt"
    );
}


function ownBakeryTestOrders() {
    if (!isTeacher()) return [];

    const personId = state.currentPerson?.id;

    return (state.bakeryTestOrders || [])
        .filter(order => order.owner_id === personId)
        .map(order => ({
            ...order,
            is_teacher_test: true
        }));
}


function bakeryOrderLabel(order) {
    const number = order.order_number ?? "---";

    return order.is_teacher_test
        ? `Test #${number}`
        : `#${number}`;
}


async function loadBakeryOrders() {
    const version = ++bakeryOrdersLoadVersion;

    const personId = state.currentPerson?.id;
    const teacherView = isTeacher();

    if (!personId) return;

    const banner = $("bakeryOutputTestBanner");

    // Le cadre jaune existant suffit.
    if (banner) {
        banner.hidden = true;
        banner.style.display = "none";
    }

    try {
        const orders = [];
        const pageSize = 500;

        // Élèves et professeur chargent les commandes réelles.
        for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await db
                .from("orders")
                .select("*,order_items(*)")
                .eq("area", "bäckerei")
                .eq("is_test", false)
                .in("status", ["offen", "ausgegeben"])
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .range(offset, offset + pageSize - 1);

            if (error) throw error;

            if (
                version !== bakeryOrdersLoadVersion ||
                state.currentPerson?.id !== personId ||
                isTeacher() !== teacherView
            ) {
                return;
            }

            const page = data || [];

            orders.push(...page);

            if (page.length < pageSize) break;
        }

        const realOrders = [
            ...new Map(
                orders.map(order => [order.id, order])
            ).values()
        ].map(order => ({
            ...order,
            is_teacher_test: false
        }));

        renderBakeryOrders([
            ...realOrders,
            ...ownBakeryTestOrders()
        ]);

    } catch (error) {
        if (
            version !== bakeryOrdersLoadVersion ||
            state.currentPerson?.id !== personId ||
            isTeacher() !== teacherView
        ) {
            return;
        }

        console.error(error);

        // Les tests personnels restent accessibles
        // si le chargement des commandes réelles échoue.
        if (teacherView) {
            renderBakeryOrders(ownBakeryTestOrders());
        }

        toast(
            "Echte Bestellungen konnten nicht geladen werden.",
            "error"
        );
    }
}


function bakeryOrderTotal(order) {
    const storedTotal = order.total_amount ?? order.total;

    if (
        storedTotal !== null &&
        storedTotal !== undefined &&
        Number.isFinite(Number(storedTotal))
    ) {
        return Number(storedTotal);
    }

    return bakeryOrderItems(order).reduce(
        (sum, item) => {
            return sum +
                productPrice(item) * integer(item.quantity);
        },
        0
    );
}


function bakeryCardDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(date);

    const values = {};

    for (const part of parts) {
        values[part.type] = part.value;
    }

    return (
        `${values.day}.${values.month} · ` +
        `${values.hour}:${values.minute}`
    );
}


function renderBakeryOrders(orders) {
    const teacherView = isTeacher();

        const visibleOrders = orders.filter(order => {
        return order.is_teacher_test
            ? isTeacherTestMode() &&
                order.owner_id === state.currentPerson?.id
            : !isTeacherTestMode();
    });

    const open = visibleOrders
        .filter(order => order.status === "offen")
        .sort(
            (a, b) =>
                new Date(a.created_at) - new Date(b.created_at)
        );

    const done = visibleOrders
        .filter(order => order.status === "ausgegeben")
        .sort(
            (a, b) =>
                new Date(b.served_at || b.created_at) -
                new Date(a.served_at || a.created_at)
        );

    setText("bakeryOpenOrderCount", open.length);
    setText("bakeryCompletedOrderCount", done.length);

    const openBox = $("bakeryOutputOrders");
    const doneBox = $("bakeryCompletedOrders");

    if (!openBox || !doneBox) return;

    openBox.innerHTML = "";

    const masonry = document.createElement("div");

    masonry.className = "bakery-order-masonry";

    openBox.appendChild(masonry);

    if (!open.length) {
        masonry.innerHTML = `
            <div class="empty-state bakery-output-empty">
                <strong>Alles erledigt! ✓</strong>
                <span>Keine offenen Bestellungen.</span>
            </div>
        `;
    }

    for (const order of open) {
        const card = document.createElement("article");

        const testOrder = Boolean(order.is_teacher_test);

                const canServe = testOrder
            ? isTeacherTestMode() &&
                order.owner_id === state.currentPerson?.id
            : !isTeacherTestMode();

        const heading = testOrder
            ? bakeryOrderLabel(order)
            : `Bestellung #${order.order_number ?? "---"}`;

        card.className =
            "output-order-card" +
            (testOrder ? " bakery-test-order" : "");

        card.innerHTML = `
            <div class="bakery-order-card-header">

                <strong class="output-order-number">
                    ${esc(heading)}
                </strong>

            </div>

            <div class="bakery-order-card-body">

                <time class="bakery-order-time">
                    ${esc(bakeryCardDate(order.created_at))}
                </time>

                <div class="output-order-items">

                    ${bakeryOrderItems(order).map(item => `
                        <div class="bakery-order-item">

                            <strong class="bakery-item-quantity">
                                ${integer(item.quantity)}×
                            </strong>

                            <span>
                                ${esc(bakeryOrderItemName(item))}
                            </span>

                        </div>
                    `).join("")}

                </div>

                <div class="bakery-order-total">
                    Gesamt:
                    ${esc(money(bakeryOrderTotal(order)))}
                </div>

                ${canServe ? `
                    <button
                        class="bakery-served-button"
                        type="button"
                    >
                        Ausgegeben
                    </button>
                ` : `
                    <span class="bakery-readonly-label">
                        Nur Ansicht
                    </span>
                `}

            </div>
        `;

        const button = card.querySelector("button");

        if (button) {
            button.dataset.orderId = order.id;
            button.disabled = bakeryServingIds.has(order.id);

            button.addEventListener("click", () => {
                serveBakeryOrder(order.id);
            });
        }

        masonry.appendChild(card);
    }

    doneBox.innerHTML = done.length
        ? ""
        : `
            <div class="empty-state">
                <small>Noch keine fertigen Bestellungen.</small>
            </div>
        `;

    for (const order of done) {
        const row = document.createElement("div");

        row.className =
            "completed-order-row" +
            (order.is_teacher_test ? " bakery-test-order" : "");

        row.innerHTML = `
            <strong>
                ${esc(bakeryOrderLabel(order))}
            </strong>

            <time>
                ${esc(
                    bakeryOrderDate(
                        order.served_at || order.created_at
                    )
                )}
            </time>
        `;

        doneBox.appendChild(row);
    }
}

async function serveBakeryOrder(id) {
    if (!state.currentPerson || bakeryServingIds.has(id)) {
        return;
    }

    const personId = state.currentPerson.id;
    const teacherView = isTeacher();

    let testOrder = null;

        if (isTeacherTestMode()) {
        testOrder = (state.bakeryTestOrders || [])
            .find(order =>
                order.id === id &&
                order.owner_id === personId
            );

        // Un professeur ne peut jamais traiter
        // une commande réelle depuis cet écran.
        if (!testOrder) return;
    }

    bakeryServingIds.add(id);

    const openBox = $("bakeryOutputOrders");

    if (openBox) {
        for (const button of openBox.querySelectorAll("button")) {
            if (button.dataset.orderId === id) {
                button.disabled = true;
            }
        }
    }

        try {
        if (isTeacherTestMode()) {
            if (testOrder.status === "offen") {
                testOrder.status = "ausgegeben";
                testOrder.served_at = new Date().toISOString();
            }

        } else {
            const { error } = await db.rpc(
                "serve_bakery_order",
                { p_order_id: id }
            );

            if (error) throw error;
        }

    } catch (error) {
        console.error(error);

        if (state.currentPerson?.id === personId) {
            toast(
                "Bestellung konnte nicht als serviert markiert werden.",
                "error"
            );
        }

    } finally {
        bakeryServingIds.delete(id);

        if (
            state.currentPerson?.id === personId &&
            isTeacher() === teacherView
        ) {
            await loadBakeryOrders();
        }
    }
}

$("bakeryOutputEditButton")?.addEventListener("click", () => {
    showScreen("editMenuScreen");
});

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
   
       $("productIanInput").value =
        product?.ian || "";

       $("productIanUnitsInput").value =
        product?.units_per_ian ?? 1;

    $("productStoreNameInput").value =
        product?.store_name || "";

        const packPrice =
        product?.purchase_pack_price != null
            ? Number(product.purchase_pack_price)
            : product?.purchase_price != null
                ? Number(product.purchase_price) *
                  Number(product.units_per_ian ?? 1)
                : null;

    $("productPurchasePriceInput").value =
        packPrice == null
            ? ""
            : packPrice.toFixed(2).replace(".", ",");

    updateProductUnitCostPreview();

    $("productEanInput").value =
        product?.ean || "";

    $("productActiveInput").checked =
        product?.active !== false;

    setText(
        "productModalTitle",
        product
            ? "Produkt bearbeiten"
            : "Produkt hinzufügen"
    );
    renderProductPurchaseReferences(product);
   
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
    class="${marked("icon")} ${productEmojiClass(productIcon(product))}"
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

                                                       ${
                                product.ian
                                    ? " · " + esc(product.ian)
                                    : ""
                            }

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

   await renderProductChangeHistory();
   
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

    const purchaseReferences =
        readProductPurchaseReferences();
       const ian = $("productIanInput").value.trim();

    const ean = $("productEanInput").value
        .trim()
        .replace(/\s+/g, "");

    if (ean && !/^(\d{8}|\d{13})$/.test(ean)) {
        setText(
            "productFormMessage",
            "Die EAN muss aus 8 oder 13 Ziffern bestehen."
        );

        return;
    }

       const rawUnitsPerIan =
        $("productIanUnitsInput").value.trim();

    const unitsPerIan = Number(rawUnitsPerIan);

    if (
        !/^\d+$/.test(rawUnitsPerIan) ||
        !Number.isSafeInteger(unitsPerIan) ||
        unitsPerIan < 1 ||
        unitsPerIan > 2147483647
    ) {
        setText(
            "productFormMessage",
            "Bitte mindestens 1 Einheit pro Packung eingeben."
        );

        return;
    }

    const storeName =
        $("productStoreNameInput").value.trim();

    const rawPurchasePrice =
        $("productPurchasePriceInput").value
            .trim()
            .replace(/\s|€/g, "");

    let purchasePrice = null;

    if (rawPurchasePrice !== "") {
        if (
            !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/
                .test(rawPurchasePrice)
        ) {
            setText(
                "productFormMessage",
                "Bitte einen gültigen Einkaufspreis eingeben, z. B. 0,50."
            );

            return;
        }

        purchasePrice = parseMoney(rawPurchasePrice);

        if (
            !Number.isFinite(purchasePrice) ||
            purchasePrice < 0
        ) {
            setText(
                "productFormMessage",
                "Der Einkaufspreis muss mindestens 0 € betragen."
            );

            return;
        }
    }

       const purchasePackPrice = purchasePrice;

    purchasePrice =
        purchasePackPrice == null
            ? null
            : Number(
                (purchasePackPrice / unitsPerIan).toFixed(6)
            );
    const payload = {
        name,

        price: parseMoney(rawPrice),

        category:
            $("productCategoryInput").value,

        icon:
            $("productIconInput").value.trim() || null,

                active:
            $("productActiveInput").checked,

                        purchase_references: purchaseReferences,

        ian: ian || null,

        ean: ean || null,

        units_per_ian: unitsPerIan,

        store_name: storeName || null,

                purchase_price: purchasePrice,

        purchase_pack_price: purchasePackPrice
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

        state.products
        .filter(activeProduct)
        .forEach(product => {

            const row = document.createElement("div");

            row.className = "inventory-count-row";
            row.dataset.productId = product.id;
            row.dataset.stockCategory = productArea(product);

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
        const [stocks, dashboard, inventoryHistory] = await Promise.all([
    db.from("inventory").select("*"),

    db.rpc("teacher_inventory_dashboard"),

    db.rpc("teacher_get_inventory_history")
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

        const history = inventoryHistory.error
    ? dashboard.data?.history || []
    : inventoryHistory.data || [];

if (inventoryHistory.error) {
    console.error(inventoryHistory.error);
}

        const items =
            submission?.inventory_submission_items || [];

       let invoiceStockLines = [];

if (state.currentInventoryInvoice?.id) {
    const { data, error } = await db.rpc(
        "teacher_invoice_stock_status",
        {
            p_invoice_id: state.currentInventoryInvoice.id
        }
    );

    if (error) throw error;

    invoiceStockLines = Array.isArray(data) ? data : [];
}

const invoiceStockByProduct = new Map(
    invoiceStockLines.map(line => [
        String(line.product_id),
        line
    ])
);

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

box.after(notice);

const historyOpen =
    notice.querySelector("details")?.open ?? true;

notice.className =
    "teacher-inventory-history admin-history-card";

notice.hidden = false;

notice.innerHTML = `
    <details ${historyOpen ? "open" : ""}>

        <summary class="admin-history-summary">
            <span>Letzte Inventuren</span>
            <span>${history.length} Einträge</span>
        </summary>

        <div
            class="admin-history-scroll"
            tabindex="0"
            aria-label="Letzte Inventuren"
        >
            <table class="admin-history-table">

                <thead>
                    <tr>
                        <th scope="col">Datum</th>
                        <th scope="col">Schüler/in</th>
                        <th scope="col">Status</th>
                    </tr>
                </thead>

                <tbody>
                    ${
                        history.length
                            ? history.map(entry => {
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

                                const rowClass = current
                                    ? "history-current"
                                    : replaced
                                        ? "history-seen"
                                        : "";

                                return `
                                    <tr class="${rowClass}">
                                        <td>
                                            ${esc(
                                                adminHistoryDate(
                                                    entry.submitted_at
                                                )
                                            )}
                                        </td>

                                        <td>
                                            ${esc(entry.student_name)}
                                        </td>

                                        <td>${esc(status)}</td>
                                    </tr>
                                `;
                            }).join("")
                            : `
                                <tr>
                                    <td colspan="3">
                                        Noch keine eingereichte Inventur.
                                    </td>
                                </tr>
                            `
                    }
                </tbody>

            </table>
        </div>

        ${
            inventoryHistory.error
                ? `
                    <p class="form-message">
                        Das vollständige Inventurverzeichnis
                        konnte nicht geladen werden.
                    </p>
                `
                : ""
        }

    </details>
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

        const products = state.products
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

       // Bouton collectif pour les achats de la facture.
if (
    state.currentInventoryInvoice?.id &&
    invoiceStockLines.some(
        line => Number(line.remaining) > 0
    )
) {
    const invoiceToolbar = document.createElement("div");

    invoiceToolbar.className = "teacher-inventory-heading";

    invoiceToolbar.innerHTML = `
        <strong>
            Wareneingang ·
            ${esc(
                state.currentInventoryInvoice.invoice_number ||
                "Rechnung"
            )}
        </strong>

        <button
            type="button"
            class="primary-action"
            data-confirm-invoice-stock
        >
            Alle bestätigen
        </button>
    `;

    box.appendChild(invoiceToolbar);

    invoiceToolbar.querySelector(
        "[data-confirm-invoice-stock]"
    ).addEventListener("click", async () => {
        const entries = [];

        for (const row of box.querySelectorAll(
            ".teacher-inventory-row[data-invoice-product-id]"
        )) {
            const quantityInput = row.querySelector(
                "[data-stock-quantity]"
            );

            const costInput = row.querySelector(
                "[data-stock-cost]"
            );

            const quantity = Number(quantityInput.value);
            const rawCost = costInput.value.trim();

            if (
                !Number.isSafeInteger(quantity) ||
                quantity <= 0
            ) {
                toast(
                    "Bitte alle Mengen prüfen.",
                    "error"
                );
                return;
            }

            if (
                rawCost &&
                !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/
                    .test(rawCost.replace(/\s|€/g, ""))
            ) {
                toast(
                    "Bitte alle Einkaufspreise prüfen.",
                    "error"
                );
                return;
            }

            entries.push({
                product_id: row.dataset.invoiceProductId,
                quantity,
                unit_purchase_price: rawCost
                    ? parseMoney(rawCost)
                    : null
            });
        }

        if (!entries.length) {
            toast(
                "Keine offenen Rechnungsprodukte vorhanden.",
                "error"
            );
            return;
        }

        await commitReview(
            "teacher_receive_invoice_stock",
            {
                p_invoice_id:
                    state.currentInventoryInvoice.id,
                p_entries: entries
            },
            "Alle Rechnungsprodukte wurden übernommen."
        );
    });
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

const invoiceStockLine = invoiceStockByProduct.get(
    String(product.id)
);

const invoiceRemaining = Math.max(
    0,
    Number(invoiceStockLine?.remaining ?? 0)
);

const invoicePrefill =
    action === "add" && invoiceRemaining > 0;

const row = document.createElement("div");

row.className = "teacher-inventory-row";
row.dataset.stockCategory = productArea(product);

if (invoicePrefill) {
    row.dataset.invoiceProductId = String(product.id);
}

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
    ${invoicePrefill
        ? `value="${invoiceRemaining}"`
        : ""}
    ${pending ? "disabled" : ""}
>

                    <input
    data-stock-cost
    type="text"
    inputmode="decimal"
    placeholder="EK optional"
    aria-label="Einkaufspreis optional"
    ${invoicePrefill &&
      invoiceStockLine.unit_purchase_price != null
        ? `value="${Number(
            invoiceStockLine.unit_purchase_price
          ).toFixed(2).replace(".", ",")}"`
        : ""}
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

                if (invoicePrefill) {
    await commitReview(
        "teacher_receive_invoice_stock",
        {
            p_invoice_id: state.currentInventoryInvoice.id,
            p_entries: [{
                product_id: product.id,
                quantity,
                unit_purchase_price: rawCost
                    ? parseMoney(rawCost)
                    : null
            }]
        },
        "Bestand aktualisiert."
    );
} else {
    await commitReview(
        "teacher_add_stock_v8",
        {
            p_product_id: product.id,
            p_quantity: quantity,
            p_invoice_id: null,
            p_unit_purchase_price: rawCost
                ? parseMoney(rawCost)
                : null
        },
        "Bestand aktualisiert."
    );
}
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

$("addInvoiceItemButton")?.addEventListener(
    "click",
    addInvoiceItem
);

$("invoiceTotalInput")?.addEventListener(
    "input",
    updateInvoiceItemsTotal
);

$("invoicePfandInput")?.addEventListener(
    "input",
    updateInvoiceItemsTotal
);

$("invoiceSupplierInput")?.addEventListener(
    "change",
    () => {
        document.querySelectorAll(
            "#invoiceItemsList .invoice-item-row"
        ).forEach(invoiceItemLookup);
    }
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

if (!$("invoiceItemsList")?.children.length) {
    addInvoiceItem();
}

updateInvoiceItemsTotal();
   
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

/* =========================================================
   BUCHHALTUNG — RECHNUNGSPOSITIONEN
   ========================================================= */

function invoiceItemMoney(value) {
    return Number(value).toFixed(2).replace(".", ",");
}

function invoiceItemCents(value) {
    const parsed = accountingMoneyInput(String(value ?? ""));
    return Number.isFinite(parsed)
        ? Math.round(parsed * 100)
        : null;
}

function invoiceItemReferences() {
    const results = [];

    for (const product of state.products || []) {
        const saved = Array.isArray(product.purchase_references)
            ? product.purchase_references
            : [];

        const refs = saved.length
            ? saved
            : [{
                ian: product.ian,
                name: product.store_name || product.name,
                store: "",
                units_per_ian: product.units_per_ian,
                purchase_pack_price: product.purchase_pack_price
            }];

        for (const ref of refs) {
            const ian = String(ref.ian ?? "").trim();

            if (!/^\d{6}$/.test(ian)) continue;

            const units = Number(
                ref.units_per_ian ?? product.units_per_ian ?? 1
            );

            const packPrice = ref.purchase_pack_price
                ?? (
                    ref.purchase_price == null
                        ? product.purchase_pack_price
                        : Number(ref.purchase_price) * units
                );

            results.push({
                product_id: product.id,
                ian,
                name: ref.name || product.name,
                store: ref.store || "",
                units: Number.isSafeInteger(units) && units > 0
                    ? units
                    : 1,
                price: packPrice
            });
        }
    }

    return results;
}

function invoiceItemUpdateRow(row) {
    const quantity = Number(
        row.querySelector("[data-invoice-quantity]").value
    );

    const priceCents = invoiceItemCents(
        row.querySelector("[data-invoice-price]").value
    );

    const totalInput = row.querySelector("[data-invoice-line-total]");

    const validQuantity =
        Number.isSafeInteger(quantity) && quantity > 0;

    const validPrice = priceCents !== null && priceCents >= 0;

    const cents = validQuantity && validPrice
        ? quantity * priceCents
        : null;

    totalInput.value = cents === null
        ? ""
        : invoiceItemMoney(cents / 100);

    updateInvoiceItemsTotal();
}

function invoiceItemLookup(row) {
    const ian = row.querySelector("[data-invoice-ian]").value.trim();
    const name = row.querySelector("[data-invoice-name]");
    const units = row.querySelector("[data-invoice-units]");
    const price = row.querySelector("[data-invoice-price]");

    row.dataset.productId = "";

    if (!/^\d{6}$/.test(ian)) {
        updateInvoiceItemsTotal();
        return;
    }

    const supplier = $("invoiceSupplierInput").value
        .trim()
        .toLocaleLowerCase("de");

    const matches = invoiceItemReferences()
        .filter(ref => ref.ian === ian);

    const selected =
        matches.find(ref =>
            supplier &&
            ref.store.trim().toLocaleLowerCase("de") === supplier
        ) || (matches.length === 1 ? matches[0] : null);

    if (!selected) {
        if (matches.length > 1) {
            setText(
                "invoiceFormMessage",
                "Diese IAN hat mehrere Einkaufsreferenzen. " +
                "Bitte den passenden Laden eingeben."
            );
        }

        updateInvoiceItemsTotal();
        return;
    }

    row.dataset.productId = selected.product_id;
    name.value = selected.name;
    units.value = String(selected.units);

    if (selected.price != null && Number.isFinite(Number(selected.price))) {
        price.value = invoiceItemMoney(selected.price);
    }

    setText("invoiceFormMessage", "");
    invoiceItemUpdateRow(row);
}

function addInvoiceItem() {
    const list = $("invoiceItemsList");
    if (!list) return;

    const row = document.createElement("div");
    row.className = "invoice-item-row";
    row.dataset.productId = "";

    row.innerHTML = `
        <label>
            <span>IAN</span>
            <input
                data-invoice-ian
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="123456"
                autocomplete="off"
            >
        </label>

        <label>
            <span>Name im Geschäft</span>
            <input
                data-invoice-name
                type="text"
                maxlength="160"
                placeholder="Produktname"
            >
        </label>

        <label>
            <span>Menge</span>
            <input
                data-invoice-quantity
                type="number"
                min="1"
                step="1"
                value="1"
            >
        </label>

        <label>
            <span>Einheit</span>
            <input
    data-invoice-units
    type="number"
    min="1"
    step="1"
    value="1"
    title="Stück pro Packung"
>
        </label>

        <label>
            <span>EK (€)</span>
            <input
                data-invoice-price
                type="text"
                inputmode="decimal"
                placeholder="0,00"
            >
        </label>

        <label>
            <span>Gesamt (€)</span>
            <input
                data-invoice-line-total
                type="text"
                readonly
                tabindex="-1"
            >
        </label>

        <button
            type="button"
            class="invoice-item-remove"
            data-invoice-remove
            aria-label="Produkt entfernen"
        >×</button>
    `;

    list.append(row);

    const ianInput = row.querySelector("[data-invoice-ian]");

    ianInput.addEventListener("input", () => {
        ianInput.value = ianInput.value.replace(/\D/g, "").slice(0, 6);
        invoiceItemLookup(row);
    });

    row.querySelector("[data-invoice-quantity]")
        .addEventListener("input", () => invoiceItemUpdateRow(row));

    row.querySelector("[data-invoice-price]")
        .addEventListener("input", () => invoiceItemUpdateRow(row));

   row.querySelector("[data-invoice-units]")
    .addEventListener("input", updateInvoiceItemsTotal);

    row.querySelector("[data-invoice-remove]")
        .addEventListener("click", () => {
            row.remove();
            updateInvoiceItemsTotal();
        });

    row.querySelector("[data-invoice-name]")
        .addEventListener("input", updateInvoiceItemsTotal);

    updateInvoiceItemsTotal();
    ianInput.focus();
}

function collectInvoiceItems() {
    const rows = [
        ...document.querySelectorAll(
            "#invoiceItemsList .invoice-item-row"
        )
    ];

    if (!rows.length) {
        throw new Error("Bitte mindestens ein Produkt hinzufügen.");
    }

    return rows.map((row, index) => {
        const get = selector =>
            row.querySelector(selector).value.trim();

        const ian = get("[data-invoice-ian]");
        const name = get("[data-invoice-name]");
        const quantity = Number(get("[data-invoice-quantity]"));
        const units = Number(get("[data-invoice-units]"));
        const priceCents = invoiceItemCents(
            get("[data-invoice-price]")
        );

                if (
            (ian !== "" && !/^\d{6}$/.test(ian)) ||
            !name ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0 ||
            !Number.isSafeInteger(units) ||
            units <= 0 ||
            priceCents === null ||
            priceCents < 0
        ) {
            throw new Error(
                `Produktzeile ${index + 1}: Bitte IAN, Name, ` +
                "Menge, Einheit und EK prüfen."
            );
        }

        return {
            product_id: row.dataset.productId || null,
            ian,
            product_name: name,
            quantity,
            units_per_pack: units,
            unit_purchase_price: priceCents / 100,
            line_total: quantity * priceCents / 100
        };
    });
}

function updateInvoiceItemsTotal() {
    const rows = [
        ...document.querySelectorAll(
            "#invoiceItemsList .invoice-item-row"
        )
    ];

    let subtotalCents = 0;
    let complete = rows.length > 0;

    for (const row of rows) {
        const quantity = Number(
            row.querySelector("[data-invoice-quantity]").value
        );

        const priceCents = invoiceItemCents(
            row.querySelector("[data-invoice-price]").value
        );

        if (
            !Number.isSafeInteger(quantity) ||
            quantity <= 0 ||
            priceCents === null ||
            priceCents < 0
        ) {
            complete = false;
            continue;
        }

        subtotalCents += quantity * priceCents;
    }

    const pfandQuantity = Number($("invoicePfandInput").value);
    const pfandCents =
        Number.isSafeInteger(pfandQuantity) && pfandQuantity >= 0
            ? pfandQuantity * 25
            : 0;

    const calculatedCents = subtotalCents + pfandCents;
    const invoiceCents = invoiceItemCents(
        $("invoiceTotalInput").value
    );

    setText("invoiceItemsSubtotal", invoiceItemMoney(subtotalCents / 100));
    setText("invoiceItemsPfand", invoiceItemMoney(pfandCents / 100));
    setText(
        "invoiceItemsCalculatedTotal",
        invoiceItemMoney(calculatedCents / 100)
    );

    const check = $("invoiceItemsCheck");
    if (!check) return;

    const valid =
        complete &&
        invoiceCents !== null &&
        calculatedCents === invoiceCents;

    check.dataset.valid = String(valid);

    check.textContent = valid
        ? "✓ Rechnungsbetrag stimmt überein."
        : "Bitte Produkte, Pfand und Rechnungsbetrag prüfen.";
}

let shoppingInvoicePurchase = null;

async function openShoppingPurchaseInvoice(purchase) {
    if (!isTeacher() || !purchase) return;

    if (
        shoppingInvoicePurchase &&
        shoppingInvoicePurchase.id !== purchase.id
    ) {
        toast(
            "Bitte zuerst die vorbereitete Rechnung abschließen.",
            "error"
        );
        return;
    }

    const items = purchase.items || [];

    if (!items.length) {
        toast("Dieser Einkauf enthält keine Produkte.", "error");
        return;
    }

        const invalidItem = items.find(item =>
        !String(item.product_id || "").trim() ||
        !Number.isSafeInteger(Number(item.packs)) ||
        Number(item.packs) <= 0 ||
        !Number.isSafeInteger(Number(item.units_per_pack)) ||
        Number(item.units_per_pack) <= 0
    );

    if (invalidItem) {
                toast(
            "Bitte die Packungsgrößen und Mengen dieses Einkaufs prüfen.",
            "error"
        );
        return;
    }

    await initialiseInvoices();

    const existingRows = document.querySelectorAll(
        "#invoiceItemsList .invoice-item-row"
    );

    const hasExistingInput = [...existingRows].some(row =>
        row.querySelector("[data-invoice-ian]").value.trim() ||
        row.querySelector("[data-invoice-name]").value.trim() ||
        row.querySelector("[data-invoice-price]").value.trim()
    );

    if (
        hasExistingInput &&
        !confirm(
            "Die aktuelle Rechnungsvorbereitung ersetzen?"
        )
    ) {
        return;
    }

    shoppingInvoicePurchase = purchase;

    $("invoiceContextSelect").value = "getränke";
    $("invoiceContextSelect").disabled = true;

    $("invoiceSupplierInput").value = purchase.supplier || "";
    $("invoiceDateInput").value = todayISO();
    $("invoicePfandInput").value = "0";

    $("invoiceItemsList").replaceChildren();

    let subtotalCents = 0;

    for (const item of items) {
        addInvoiceItem();

        const row = $("invoiceItemsList").lastElementChild;

        row.dataset.productId = item.product_id;

        row.querySelector("[data-invoice-ian]").value =
            String(item.ian || "");

        row.querySelector("[data-invoice-name]").value =
            String(item.product_name || "");

        row.querySelector("[data-invoice-quantity]").value =
            String(item.packs);

        row.querySelector("[data-invoice-units]").value =
            String(item.units_per_pack);

        const price = Number(item.estimated_pack_price);

        const priceCents =
            item.estimated_pack_price != null &&
            Number.isFinite(price) &&
            price >= 0
                ? Math.round(price * 100)
                : 0;

        row.querySelector("[data-invoice-price]").value =
            invoiceItemMoney(priceCents / 100);

        subtotalCents += Number(item.packs) * priceCents;

        invoiceItemUpdateRow(row);
    }

    $("invoiceTotalInput").value =
        invoiceItemMoney(subtotalCents / 100);

    updateInvoicePfand();
    updateInvoiceItemsTotal();
    updateInvoiceEventVisibility();

    showScreen("invoicesScreen");

    setText(
        "invoiceFormMessage",
        "🛒 Einkauf übernommen. Bitte Preise, Pfand " +
        "und Rechnungsbetrag anhand des Kassenbons prüfen."
    );

    $("invoiceForm").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
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

let invoiceItems;

try {
    invoiceItems = collectInvoiceItems();

    const itemsCents = invoiceItems.reduce(
        (sum, item) =>
            sum + Math.round(item.line_total * 100),
        0
    );

    const expectedCents = itemsCents + pfand * 25;
    const actualCents = Math.round(total * 100);

    if (expectedCents !== actualCents) {
        throw new Error(
            "Der Rechnungsbetrag stimmt nicht mit " +
            "den Produkten und dem Pfand überein."
        );
    }
} catch (error) {
    setText("invoiceFormMessage", error.message);
    return;
}
    if (
        shoppingInvoicePurchase &&
        context !== "getränke"
    ) {
        setText(
            "invoiceFormMessage",
            "Diese Einkaufsrechnung muss dem Bereich Getränke zugeordnet sein."
        );
        return;
    }
   
    saveInvoice.busy = true;
    $("saveInvoiceButton").disabled = true;

    let saved = false;

    try {
              const rpcName = shoppingInvoicePurchase
            ? "teacher_invoice_from_shopping_purchase"
            : "create_bookkeeping_invoice_with_items";

        const rpcParams = shoppingInvoicePurchase
            ? {
                p_purchase_id: shoppingInvoicePurchase.id,
                p_invoice_date: invoiceDate,
                p_supplier: supplier,
                p_total_amount: total,
                p_pfand_quantity: pfand,
                p_items: invoiceItems
            }
            : {
                p_context: context,
                p_invoice_date: invoiceDate,
                p_supplier: supplier,
                p_total_amount: total,
                p_event_id: eventId,
                p_pfand_quantity: pfand,
                p_items: invoiceItems
            };

        const { data, error } = await db.rpc(
            rpcName,
            rpcParams
        );

        if (error) throw error;

                saved = true;

        const invoice = Array.isArray(data) ? data[0] : data;

        if (shoppingInvoicePurchase) {
            shoppingInvoicePurchase = null;
            $("invoiceContextSelect").disabled = false;
        }

        $("invoiceSupplierInput").value = "";
        $("invoiceTotalInput").value = "";
        $("invoicePfandInput").value = "0";

       $("invoiceItemsList").replaceChildren();
addInvoiceItem();
updateInvoiceItemsTotal();

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
        
.in(
    "person_type",
    ["schüler", "bufdi"]
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


    
const students = [...(data || [])];

students.sort((a, b) => {
    // Les Bufdis apparaissent avant les Schüler.
    const priorityA = a.person_type === "bufdi" ? 0 : 1;
    const priorityB = b.person_type === "bufdi" ? 0 : 1;

    if (priorityA !== priorityB) {
        return priorityA - priorityB;
    }

    // Ordre alphabétique par nom, puis prénom.
    const nameA = [
        a.last_name || "",
        a.first_name || ""
    ].join(" ");

    const nameB = [
        b.last_name || "",
        b.first_name || ""
    ].join(" ");

    return nameA.localeCompare(nameB, "de", {
        sensitivity: "base"
    });
});



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
    ${personRoleEmoji(student)}
</span>


                    <div>

                        <strong>
                            ${esc(
                                personName(student)
                            )}
                        </strong>


<small>
    ${personRoleLabel(student)}
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

$("studentRoleInput").value =
    student?.person_type === "bufdi"
        ? "bufdi"
        : "schüler";
   
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

const personType =
    $("studentRoleInput").value;
       
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
                        p_student_id:
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
    null,

p_person_type:
    personType

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
    pin,

p_person_type:
    personType

                       
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
    personType === "bufdi"
        ? "Bufdi gespeichert."
        : "Schüler gespeichert.",
    "success"
);


               } catch (error) {

            console.error("Schüler speichern:", error);

            const details = [
                error?.code,
                error?.message,
                error?.details,
                error?.hint
            ].filter(Boolean).join(" · ");

            setText(
                "studentFormMessage",
                "Schüler konnte nicht gespeichert werden." +
                (details ? " " + details : "")
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


    
const confirmed = await confirmInApp(
    `${personName(student)} wirklich deaktivieren?`,
    "Profil deaktivieren?"
);

if (!confirmed) {
    return;
}



    try {

        const {
            error
        } = await db.rpc(
            
"teacher_deactivate_student",
{
    p_student_id:
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


function updateNotificationRecipientSelection() {
    const inputs = $$(
        "#notificationRecipientList [data-notification-recipient]"
    );

    const selected = inputs.filter(input => input.checked).length;

    const all = $("notificationSelectAllStudents");

    if (all) {
        all.checked =
            inputs.length > 0 &&
            selected === inputs.length;

        all.indeterminate =
            selected > 0 &&
            selected < inputs.length;

        all.disabled = !inputs.length;
    }

    setText(
        "notificationRecipientCount",
        `${selected} ausgewählt`
    );

    setText(
        "notificationSelectAllLabel",
        inputs.length > 0 && selected === inputs.length
            ? "Alle abwählen"
            : "Alle auswählen"
    );
}


async function loadNotificationRecipients() {
    const box = $("notificationRecipientList");

    if (!box || !isTeacher()) return;

    const selected = new Set(
        $$(
            "#notificationRecipientList " +
            "[data-notification-recipient]:checked"
        ).map(input => input.value)
    );

    const { data, error } = await db
        .from("people")
        .select("id,first_name,last_name,student_number")
        .eq("person_type", "schüler")
        .eq("active", true)
        .order("first_name", { ascending: true });

    if (error) {
        console.error(error);

        box.innerHTML =
            "<p>Schüler konnten nicht geladen werden.</p>";

        return;
    }

    box.innerHTML = `
        <input
            id="notificationRecipientSearch"
            type="search"
            placeholder="Schüler suchen"
            aria-label="Schüler suchen"
        >

        <div class="notification-selection-heading">

            <label
                class="notification-recipient-chip notification-recipient-all"
            >
                <input
                    id="notificationSelectAllStudents"
                    type="checkbox"
                >

                <span id="notificationSelectAllLabel">
                    Alle auswählen
                </span>
            </label>

            <span id="notificationRecipientCount">
                0 ausgewählt
            </span>

        </div>

        <div class="notification-recipient-bubbles">

            ${(data || []).map(student => `
                <label
                    class="notification-recipient-chip"
                    data-recipient-name="${
                        esc(
                            personName(student)
                                .toLocaleLowerCase("de-DE")
                        )
                    }"
                >
                    <input
                        type="checkbox"
                        data-notification-recipient
                        value="${esc(student.id)}"
                        ${selected.has(student.id) ? "checked" : ""}
                    >

                    <span class="recipient-chip-name">

                        ${esc(personName(student))}

                        <span
                            class="recipient-chip-circle"
                            aria-hidden="true"
                        ></span>

                    </span>
                </label>
            `).join("")}

        </div>
    `;

    $("notificationSelectAllStudents").addEventListener(
        "change",
        event => {
            $$(
                "#notificationRecipientList " +
                "[data-notification-recipient]"
            ).forEach(input => {
                input.checked = event.target.checked;
            });

            updateNotificationRecipientSelection();
        }
    );

    $$(
        "#notificationRecipientList [data-notification-recipient]"
    ).forEach(input => {
        input.addEventListener(
            "change",
            updateNotificationRecipientSelection
        );
    });

    $("notificationRecipientSearch").addEventListener(
        "input",
        event => {
            const search = event.target.value
                .trim()
                .toLocaleLowerCase("de-DE");

            $$(
                "#notificationRecipientList [data-recipient-name]"
            ).forEach(label => {
                label.hidden =
                    !label.dataset.recipientName.includes(search);
            });
        }
    );

    updateNotificationRecipientSelection();
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

                        const { error } = await db.rpc(
                "teacher_send_student_notification",
                {
                    p_recipient_ids: recipientIds,
                    p_title: title,
                    p_message: message || null
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
).forEach(input => {
    input.checked = false;
});

updateNotificationRecipientSelection();


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

            console.error(
                "teacher_send_notification:",
                error
            );

            const diagnostic = [
                "Benachrichtigung konnte nicht gesendet werden.",
                "Funktion: teacher_send_student_notification",
                `Fehlercode: ${error?.code || "unbekannt"}`,
                `Meldung: ${
                    error?.message ||
                    String(error)
                }`,
                error?.details
                    ? `Details: ${error.details}`
                    : "",
                error?.hint
                    ? `Hinweis: ${error.hint}`
                    : ""
            ].filter(Boolean).join("\n");

            const status = $(
                "teacherNotificationMessageStatus"
            );

            if (status) {
                status.style.whiteSpace = "pre-line";
                status.textContent = diagnostic;
            }

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


       
const confirmed = await confirmInApp(
    `"${state.currentEvent.name}" wirklich abschließen? Danach wird die Veranstaltung nur noch als abgeschlossene Zeile angezeigt.`,
    "Veranstaltung abschließen?"
);

if (!confirmed) {
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
                !isTeacherTestMode();

            banner.style.display =
                isTeacherTestMode()
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


        state.eventReceivedCents = 0;

// Réinitialiser Passend bezahlt pour une nouvelle vente.
const exactButton = $("eventExactPaymentButton");

if (exactButton) {
    exactButton.disabled = false;
}

const paidButton = $("eventPaidButton");

if (paidButton) {
    delete paidButton.dataset.exactPaymentPending;
}

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
       installExactPaymentButton("event");

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
            !isTeacherTestMode();

        banner.style.display =
            isTeacherTestMode()
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

                        if (isTeacherTestMode()) {

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
            !isTeacherTestMode();

        banner.style.display =
            isTeacherTestMode()
                ? ""
                : "none";
    }


        if (isTeacherTestMode()) {

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

                if (isTeacherTestMode()) {

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
        const [sales, ledger, freeDrinks] = await Promise.all([
            db.rpc("teacher_get_cashier_sales_lines", {
                p_from: start.toISOString(),
                p_to: end.toISOString()
            }),

            db.rpc("get_bookkeeping_entries", {
                p_from: accountingDateKey(start),
                p_to: accountingDateKey(end)
            }),

            db.rpc("teacher_get_free_drinks_report", {
                p_from: start.toISOString(),
                p_to: end.toISOString()
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

        const baseProfit = sum(schoolLines, "estimated_profit");
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

        setText("reportRevenue", money(sum(lines, "revenue")));

        setText(
            "reportDrinksRevenue",
            money(sum(
                lines.filter(line => line.area === "getränke"),
                "revenue"
            ))
        );

        setText(
            "reportBakeryRevenue",
            money(sum(
                lines.filter(line => line.area === "bäckerei"),
                "revenue"
            ))
        );

        setText(
            "reportSalesCount",
            String(new Set(
                lines
                    .map(line => line.order_id || line.event_order_id)
                    .filter(Boolean)
            ).size)
        );

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
        renderFreeDrinksReport(freeDrinks.data, freeDrinks.error);

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

isBakery:
    line.area === "bäckerei",

stock:
    line.current_stock ??
    null
                }
            );
        }


        const row =
            map.get(key);

       row.isBakery =
    row.isBakery ||
    line.area === "bäckerei";

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
                                    row.isBakery || row.unknownProfit
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
            db.rpc("teacher_get_cashier_sales_lines", {
    p_from: start.toISOString(),
    p_to: end.toISOString()
}),

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

/*
 * Contrôle immédiat de l'accès lors d'un changement
 * d'autorisation ou de période de test.
 */
if (
    state.currentPerson &&
    !isTeacher()
) {
    const studentId = state.currentPerson.id;

    [
        "student_access_grants",
        "student_access_tests"
    ].forEach(table => {
        state.realtimeChannel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table,
                filter: `student_id=eq.${studentId}`
            },
            () => {
                if (
                    state.currentPerson?.id === studentId
                ) {
                    enforceSchoolHoursForCurrentSession();
                }
            }
        );
    });
}
   addCashierReportRealtime();
   
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

async function enforceSchoolHoursForCurrentSession() {
    if (
        !state.currentPerson ||
        isTeacher()
    ) {
        return;
    }

    /*
     * Si une révocation arrive pendant un contrôle,
     * effectuer un nouveau contrôle juste après.
     */
    if (enforceSchoolHoursForCurrentSession.busy) {
        enforceSchoolHoursForCurrentSession.pending = true;
        return;
    }

    enforceSchoolHoursForCurrentSession.busy = true;

    try {
        do {
            enforceSchoolHoursForCurrentSession.pending = false;

            if (
                !state.currentPerson ||
                isTeacher()
            ) {
                return;
            }

            if (!await checkStudentTestAccess()) {
                return;
            }

            if (
                !DEVELOPMENT_MODE &&
                !schoolOpenNow()
            ) {
                state.currentPerson = null;
                state.selectedLoginPerson = null;

                showSchoolClosed();

                await db.auth.signOut();
                return;
            }

        } while (
            enforceSchoolHoursForCurrentSession.pending
        );

    } catch (error) {
        console.error(
            "Zugangsprüfung fehlgeschlagen:",
            error
        );

    } finally {
        enforceSchoolHoursForCurrentSession.busy = false;
    }
}


/*
 * Contrôle périodique uniquement utile lorsque
 * DEVELOPMENT_MODE sera désactivé.
 */

// Contrôle de secours si un événement Realtime est manqué.
setInterval(
    enforceSchoolHoursForCurrentSession,
    2000
);

// Contrôle au retour dans l'onglet.
document.addEventListener(
    "visibilitychange",
    () => {
        if (!document.hidden) {
            enforceSchoolHoursForCurrentSession();
        }
    }
);

window.addEventListener(
    "focus",
    () => {
        enforceSchoolHoursForCurrentSession();
    }
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

/* =====================================================
   MODE DE VENTE PROFESSEUR
   Normal par défaut, test sur demande
   ===================================================== */

let teacherTestMode = false;

function isTeacherTestMode() {
    return isTeacher() && teacherTestMode;
}

function isRealSalesMode() {
    return !isTeacherTestMode();
}

function clearTeacherTestEnvironment() {
    teacherTestMode = false;
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
    try {
        const {
            data: { session }
        } = await db.auth.getSession();

        if (session) {
            await initialiseAuthenticatedApp();
            return;
        }

        state.currentPerson = null;

        showScreen(
            "identityScreen",
            { login: true }
        );

        await loadLoginPeople();

    } catch (error) {
        console.error(
            "Initialisierung fehlgeschlagen:",
            error
        );

        state.currentPerson = null;

        showScreen(
            "identityScreen",
            { login: true }
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
/* =====================================================================
   HISTORIQUES — INVENTUR ET PRODUKTE
   ===================================================================== */

function adminHistoryDate(value) {
    return new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value));
}


function productHistoryDescription(entry) {
    const before = entry.before_values || {};
    const after = entry.after_values || {};

    if (entry.action === "created") {
        return "Produkt hinzugefügt";
    }

    const labels = {
        name: "Name",
        price: "Preis",
        category: "Bereich",
        icon: "Symbol",
        active: "Status"
    };

    return (entry.changed_fields || [])
        .filter(field => field !== "_created")
        .map(field => {
            if (field === "active" && after.active === false) {
                return "Produkt entfernt";
            }

            if (field === "active" && after.active === true) {
                return "Produkt wieder aktiviert";
            }

            return (
                `${labels[field] || field}: ` +
                `${productChangeValue(field, before[field])} → ` +
                `${productChangeValue(field, after[field])}`
            );
        })
        .join(" · ") || "Produkt geändert";
}


async function renderProductChangeHistory() {
    const list = $("productAdminList");

    if (!list) return;

    let panel = $("productChangeHistoryPanel");

    if (!isTeacher()) {
        if (panel) panel.hidden = true;
        return;
    }

    if (!panel) {
        panel = document.createElement("section");
        panel.id = "productChangeHistoryPanel";
        panel.className = "admin-history-card teacher-only";
    }

    list.after(panel);

    panel.hidden = false;
    panel.style.display = "";

    const open =
        panel.querySelector("details")?.open ?? true;

    panel.innerHTML = `
        <details ${open ? "open" : ""}>

            <summary class="admin-history-summary">
                <span>Letzte Änderungen</span>

                <span id="productChangeHistoryCount">
                    Lädt …
                </span>
            </summary>

            <div
                class="admin-history-scroll"
                tabindex="0"
                aria-label="Produktänderungen"
            >
                <table class="admin-history-table">

                    <thead>
                        <tr>
                            <th scope="col">Datum</th>
                            <th scope="col">Person</th>
                            <th scope="col">Produkt</th>
                            <th scope="col">Änderung</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>

                    <tbody id="productChangeHistoryRows"></tbody>

                </table>
            </div>

            <p
                class="form-message"
                id="productChangeHistoryMessage"
                role="status"
            ></p>

        </details>
    `;

    const personId = state.currentPerson.id;

    const generation =
        (renderProductChangeHistory.generation || 0) + 1;

    renderProductChangeHistory.generation = generation;

    try {
        const { data, error } = await db.rpc(
            "teacher_get_product_change_history"
        );

        if (
            generation !== renderProductChangeHistory.generation ||
            !isTeacher() ||
            state.currentPerson?.id !== personId
        ) {
            return;
        }

        if (error) throw error;

        const entries = data || [];
        const body = $("productChangeHistoryRows");

        setText(
            "productChangeHistoryCount",
            `${entries.length} Einträge`
        );

        body.innerHTML = entries.length
            ? ""
            : `
                <tr>
                    <td colspan="5">Noch keine Änderungen.</td>
                </tr>
            `;

        entries.forEach(entry => {
            const unseen =
                entry.student_change && !entry.seen_at;

            const row = document.createElement("tr");

            row.className = unseen
                ? "history-unseen"
                : entry.student_change
                    ? "history-seen"
                    : "";

            const name =
                entry.after_values?.name ||
                entry.before_values?.name ||
                entry.product_id;

            const status = entry.student_change
                ? entry.seen_at
                    ? "Gesehen"
                    : "Neu"
                : "—";

            row.innerHTML = `
                <td>
                    ${esc(adminHistoryDate(entry.changed_at))}
                </td>

                <td>
                    ${esc(entry.actor_name)}

                    <small>
                        ${
                            entry.student_change
                                ? "Schüler/in"
                                : "Lehrkraft"
                        }
                    </small>
                </td>

                <td>${esc(name)}</td>

                <td>
                    ${esc(productHistoryDescription(entry))}
                </td>

                <td>${status}</td>
            `;

            body.appendChild(row);
        });

    } catch (error) {
        if (
            generation !== renderProductChangeHistory.generation ||
            !isTeacher()
        ) {
            return;
        }

        console.error(error);

        setText("productChangeHistoryCount", "");

        setText(
            "productChangeHistoryMessage",
            "Änderungen konnten nicht geladen werden."
        );
    }
}
function renderFreeDrinksReport(data, error = null) {
    if (!isTeacher()) return;

    let panel = $("freeDrinksReportPanel");

    if (!panel) {
        panel = document.createElement("section");
        panel.id = "freeDrinksReportPanel";
        panel.className = "admin-history-card teacher-only";

        const anchor =
            $("reportAccountingSummary") ||
            $("reportProfit")?.closest(".report-kpi-grid");

        if (!anchor) return;

        anchor.after(panel);
    }

    const open = panel.querySelector("details")?.open ?? true;
    const entries = data?.entries || [];

    panel.innerHTML = `
        <div class="free-drinks-report-heading">
            <h2>Kostenlose Getränke – Anzahl</h2>

            <strong>
                ${error ? "—" : `${integer(data?.quantity)} Stück`}
            </strong>
        </div>

        <details ${open ? "open" : ""}>

            <summary class="admin-history-summary">
                <span>Letzte Einträge</span>
                <span>${entries.length} Einträge</span>
            </summary>

            <div
                class="admin-history-scroll"
                tabindex="0"
                aria-label="Kostenlose Getränke"
            >
                <table class="admin-history-table">
                    <thead>
                        <tr>
                            <th scope="col">Datum</th>
                            <th scope="col">Erfasst von</th>
                            <th scope="col">Produkt</th>
                            <th scope="col">Anzahl</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${
                            entries.length
                                ? entries.map(entry => `
                                    <tr>
                                        <td>
                                            ${esc(
                                                adminHistoryDate(
                                                    entry.created_at
                                                )
                                            )}
                                        </td>
                                        <td>${esc(entry.person_name)}</td>
                                        <td>${esc(entry.product_name)}</td>
                                        <td>${integer(entry.quantity)}</td>
                                    </tr>
                                `).join("")
                                : `
                                    <tr>
                                        <td colspan="4">
                                            Noch keine Einträge im gewählten Zeitraum.
                                        </td>
                                    </tr>
                                `
                        }
                    </tbody>
                </table>
            </div>

        </details>

        ${
            error
                ? `
                    <p class="form-message">
                        Kostenlose Getränke konnten nicht geladen werden.
                    </p>
                `
                : ""
        }
    `;

    if (error) console.error(error);
}


function queueCashierReportRefresh() {
    if (
        !isTeacher() ||
        state.currentScreenId !== "reportsScreen"
    ) {
        return;
    }

    clearTimeout(queueCashierReportRefresh.timer);

    queueCashierReportRefresh.timer = setTimeout(() => {
        if (
            isTeacher() &&
            state.currentScreenId === "reportsScreen"
        ) {
            loadReports();
        }
    }, 300);
}


function addCashierReportRealtime() {
    if (!state.realtimeChannel || !isTeacher()) return;

    ["orders", "order_items"].forEach(table => {
        state.realtimeChannel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table
            },
            queueCashierReportRefresh
        );
    });
}
/* =====================================================================
   CALCULATRICES — SAISIE EN EUROS
   ===================================================================== */

function euroKeypadNext(raw, key) {
    raw = String(raw || "");

    if (key === "delete") {
        return raw.slice(0, -1);
    }

    if (key === ",") {
        return raw.includes(",")
            ? raw
            : (raw || "0") + ",";
    }

    if (!/^\d$/.test(key)) return raw;

    if (raw.includes(",")) {
        return raw.split(",")[1].length < 2
            ? raw + key
            : raw;
    }

    if (raw === "0") return key;

    return raw.length < 6 ? raw + key : raw;
}


function euroKeypadCents(raw) {
    const [whole = "0", fraction = ""] =
        String(raw || "0").split(",");

    return (
        Number(whole || "0") * 100 +
        Number(fraction.padEnd(2, "0"))
    );
}


function installEuroPaymentKeypads() {
    ["drinks", "bakery"].forEach(area => {
        const keypad = $(`${area}PaymentKeypad`);

        if (
            !keypad ||
            keypad.dataset.euroKeypadInstalled === "true"
        ) {
            return;
        }

        keypad.dataset.euroKeypadInstalled = "true";

        keypad.innerHTML = [
            "1", "2", "3",
            "4", "5", "6",
            "7", "8", "9",
            ",", "0"
        ].map(value => `
            <button
                class="payment-key"
                data-value="${value}"
                type="button"
            >
                ${value}
            </button>
        `).join("") + `
            <button
                aria-label="Letzte Ziffer löschen"
                class="payment-key delete-key"
                id="${area}DeletePaymentButton"
                type="button"
            >
                ⌫
            </button>
        `;

        // Nouvelle commande : vider la saisie précédente.
        $(`${area}PayButton`)?.addEventListener(
            "click",
            () => {
                state[`${area}PaymentInput`] = "";
                state[`${area}ReceivedCents`] = 0;
            },
            true
        );

        /*
         * Traiter les touches avant les anciens écouteurs.
         * Cela évite qu'une seconde logique transforme
         * la saisie en centimes.
         */
        keypad.addEventListener(
            "click",
            event => {
                const button =
                    event.target.closest(".payment-key");

                if (!button || !keypad.contains(button)) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                if (state.cashierSaving) return;

                const key =
                    button.id === `${area}DeletePaymentButton`
                        ? "delete"
                        : button.dataset.value;

                const raw = euroKeypadNext(
                    state[`${area}PaymentInput`],
                    key
                );

                state[`${area}PaymentInput`] = raw;

                state[`${area}ReceivedCents`] =
                    euroKeypadCents(raw);

                if (area === "drinks") {
                    renderDrinksPayment();
                } else {
                    renderBakeryPayment();
                }
            },
            true
        );
    });
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        installEuroPaymentKeypads,
        { once: true }
    );
} else {
    installEuroPaymentKeypads();
}
/* =========================================================
   SON DERVERANSTALTUNGEN — COMPLÉMENT V6
   À ajouter une seule fois à la fin de app.js.
   ========================================================= */

(() => {
    const V = {
        invoice: null,
        invoiceMode: false,
        busy: false,
        outputMode: "real"
    };

    const dialog = $("eventV6Dialog");
    const form = $("eventV6Form");

    const visible = (node, yes) => {
        if (!node) return;
        node.hidden = !yes;
        node.style.display = yes ? "" : "none";
    };

    const fail = error => {
        console.error(error);

        const text = String(error?.message || error);

        if (text.includes("price_changed")) {
            return "Der Preis wurde geändert. Bitte den Warenkorb prüfen und erneut bezahlen.";
        }

        if (text.includes("insufficient_stock")) {
            return "Nicht genug Bestand: " +
                text.split("insufficient_stock:").pop().trim();
        }

        if (
            text.includes("invoice_not_available") ||
            text.includes("event_invoice_links")
        ) {
            return "Diese Rechnung ist bereits einer Veranstaltung zugeordnet.";
        }

        return "Bitte die Angaben prüfen. " + text;
    };

    const amount = value => {
        const s = String(value ?? "").trim().replace(",", ".");

        if (!/^\d+(\.\d{1,2})?$/.test(s)) {
            throw Error("Bitte einen gültigen Betrag eingeben.");
        }

        return Number(s);
    };

    const quantity = value => {
        if (!/^\d+$/.test(String(value))) {
            throw Error("Bitte eine ganze Anzahl eingeben.");
        }

        const n = Number(value);

        if (!Number.isSafeInteger(n) || n > 2147483647) {
            throw Error("Ungültige Anzahl.");
        }

        return n;
    };

    const rpc = async (name, args) => {
        const { data, error } = await db.rpc(name, args);

        if (error) throw error;

        return Array.isArray(data) ? data[0] : data;
    };

    const intercept = (
        id,
        type,
        handler,
        when = () => true
    ) => {
        $(id)?.addEventListener(
            type,
            async event => {
                if (!when()) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                if (V.busy) return;

                V.busy = true;

                const button =
                    event.currentTarget.tagName === "BUTTON"
                        ? event.currentTarget
                        : event.currentTarget.querySelector(
                            '[type="submit"]'
                        );

                if (button) button.disabled = true;

                try {
                    await handler(event);
                } catch (error) {
                    toast(fail(error), "error");
                } finally {
                    V.busy = false;
                    if (button) button.disabled = false;
                }
            },
            true
        );
    };

    const openDialog = (
        title,
        html,
        save,
        label = "Speichern"
    ) => {
        if (dialog.open) dialog.close();

        $("eventV6Title").textContent = title;
        $("eventV6Fields").innerHTML = html;
        $("eventV6Message").textContent = "";
        $("eventV6Save").textContent = label;

        visible($("eventV6Save"), !!save);

        form.onsubmit = async event => {
            event.preventDefault();

            if (V.busy || !save) return;

            V.busy = true;
            $("eventV6Save").disabled = true;

            try {
                await save();
            } catch (error) {
                $("eventV6Message").textContent = fail(error);
            } finally {
                V.busy = false;
                $("eventV6Save").disabled = false;
            }
        };

        dialog.showModal();
    };

    $("eventV6Cancel").onclick = () => {
        if (!V.busy) dialog.close();
    };

    dialog.addEventListener("cancel", event => {
        if (V.busy) event.preventDefault();
    });

    const field = (
        label,
        name,
        value = "",
        type = "text",
        required = true
    ) => `
        <label class="form-field">
            <span>${esc(label)}</span>
            <input
                name="${name}"
                type="${type}"
                value="${esc(value)}"
                ${type === "number" ? 'min="0" step="1"' : ""}
                ${required ? "required" : ""}
            >
        </label>
    `;

    const value = name =>
        form.elements.namedItem(name).value;


    /* Raccordement avec les identifiants du HTML joint. */

    if ($("eventSaleProductGrid")) {
        $("eventSaleProductGrid").id = "eventProductGrid";
    }

    const oldShowScreen = showScreen;

    showScreen = (id, options) => {
        if (id === "eventEndInventoryScreen") {
            id = "eventWorkspaceScreen";
        }

        if (V.invoiceMode && id !== "invoicesScreen") {
            V.invoiceMode = false;
            $("invoiceContextSelect").disabled = false;
            $("saveInvoiceButton").textContent =
                "Rechnung speichern";
        }

        oldShowScreen(id, options);
    };

    visible($("eventEndInventoryButton"), false);

    $("eventEndInventoryScreen")
        ?.classList.add("teacher-only");

    $("foodEventWorkspace")
        ?.classList.add("event-v6-grid");

    $("eventDirectRevenueField")?.remove();
    $("eventStartInventoryField")?.remove();


    /* Création : question sur les coûts et sélection de facture. */

    $("eventCreateForm").insertAdjacentHTML(
        "beforeend",
        `
        <fieldset class="form-card" id="eventCostsFields">
            <legend id="eventCostsQuestion"></legend>

            <label>
                <input
                    name="eventCosts"
                    type="radio"
                    value="yes"
                    required
                >
                Ja
            </label>

            <label>
                <input
                    name="eventCosts"
                    type="radio"
                    value="no"
                    required
                >
                Nein
            </label>

            <div id="eventInvoiceChoice" hidden>
                <label class="form-field">
                    <span>Vorhandene Rechnung</span>

                    <select id="eventInvoiceChoiceSelect">
                        <option value="">
                            Rechnung auswählen
                        </option>
                    </select>
                </label>

                <button
                    class="secondary-action"
                    type="button"
                    id="eventNewInvoiceButton"
                >
                    + Rechnung in Buchhaltung vorbereiten
                </button>

                <p id="eventInvoiceDraftLabel"></p>
            </div>
        </fieldset>
        `
    );

    $("saveEventButton").before($("eventCostsFields"));

    $("eventCostsFields").onchange = () => {
        visible(
            $("eventInvoiceChoice"),
            document.querySelector(
                '[name="eventCosts"]:checked'
            )?.value === "yes"
        );
    };

    $("eventInvoiceChoiceSelect").onchange = () => {
        V.invoice = null;
        $("eventInvoiceDraftLabel").textContent = "";
    };

    const invoices = async () => {
        const { data, error } = await db
            .from("invoices")
            .select("id,invoice_number,supplier,total_amount")
            .is("event_id", null)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const {
            data: links,
            error: linkError
        } = await db
            .from("event_invoice_links")
            .select("invoice_id");

        if (linkError) throw linkError;

        const used = new Set(
            (links || []).map(x => x.invoice_id)
        );

        $("eventInvoiceChoiceSelect").innerHTML =
            '<option value="">Rechnung auswählen</option>' +
            (data || [])
                .filter(i => !used.has(i.id))
                .map(i => `
                    <option value="${i.id}">
                        ${esc(
                            i.invoice_number ||
                            i.supplier ||
                            "Rechnung"
                        )}
                        · ${money(i.total_amount)}
                    </option>
                `)
                .join("");
    };

    openEventCreate = type => {
        if (!isTeacher()) return;

        V.invoice = null;
        V.invoiceMode = false;

        $("eventCreateForm").reset();
        $("eventCreateTypeInput").value = type;
        $("eventDateInput").value = todayISO();

        setText(
            "eventCreateTitle",
            type === "food"
                ? "Neue Food-Veranstaltung"
                : "Neue Veranstaltung"
        );

        setText(
            "eventCostsQuestion",
            type === "food"
                ? "Sind für diese Veranstaltung Kosten entstanden?"
                : "Wurde Material für diese Veranstaltung gekauft?"
        );

        visible($("eventInvoiceChoice"), false);

        setText("eventInvoiceDraftLabel", "");
        setText("eventCreateMessage", "");

        showScreen("eventCreateScreen");

        invoices().catch(error => {
            setText("eventCreateMessage", fail(error));
        });
    };

    intercept("eventCreateForm", "submit", async () => {
        if (!isTeacher()) return;

        const choice = document.querySelector(
            '[name="eventCosts"]:checked'
        )?.value;

        if (!choice) {
            throw Error("Bitte die Kostenfrage beantworten.");
        }

        const yes = choice === "yes";
        const id =
            $("eventInvoiceChoiceSelect").value || null;

        if (yes && !id && !V.invoice) {
            throw Error(
                "Bitte eine Rechnung auswählen oder vorbereiten."
            );
        }

        const e = await rpc("create_event_v6", {
            p_name: $("eventNameInput").value.trim(),
            p_event_date: $("eventDateInput").value,
            p_event_type: $("eventCreateTypeInput").value,
            p_description:
                $("eventDescriptionInput").value.trim() || null,
            p_has_costs: yes,
            p_invoice_id: yes ? id : null,
            p_invoice: yes && !id ? V.invoice : null
        });

        V.invoice = null;

        await loadEvents();
        await openEventWorkspace(e);
    });


    /* Préparation d'une nouvelle facture dans Buchhaltung. */

    intercept("eventNewInvoiceButton", "click", async () => {
        V.invoiceMode = true;

        try {
            await initialiseInvoices();

            $("invoiceForm").reset();
            $("invoiceDateInput").value = todayISO();
            $("invoicePfandInput").value = "0";

            $("invoiceContextSelect").value =
                "sonderveranstaltung";

            $("invoiceContextSelect").disabled = true;

            visible($("invoiceEventField"), false);

            setText(
                "invoiceFormMessage",
                "Diese Rechnung wird zusammen mit der Veranstaltung gespeichert."
            );

            $("saveInvoiceButton").textContent =
                "Rechnung übernehmen und zurück";

            showScreen("invoicesScreen");
        } catch (error) {
            V.invoiceMode = false;
            throw error;
        }
    });

    const returnToCreate = () => {
        V.invoiceMode = false;

        $("invoiceContextSelect").disabled = false;

        $("saveInvoiceButton").textContent =
            "Rechnung speichern";

        updateInvoiceEventVisibility();
        showScreen("eventCreateScreen");
    };

    intercept(
        "invoicesBackButton",
        "click",
        returnToCreate,
        () => V.invoiceMode
    );

    intercept(
        "invoiceForm",
        "submit",
        async () => {
            const total = amount(
                $("invoiceTotalInput").value
            );

            const pfand = quantity(
                $("invoicePfandInput").value
            );

            if (
                total <= 0 ||
                pfand * 0.25 > total ||
                !$("invoiceDateInput").value
            ) {
                throw Error(
                    "Bitte Datum, Betrag und Pfand prüfen."
                );
            }

            V.invoice = {
                date: $("invoiceDateInput").value,
                supplier:
                    $("invoiceSupplierInput").value.trim() ||
                    null,
                total,
                pfand
            };

            $("eventInvoiceChoiceSelect").value = "";

            setText(
                "eventInvoiceDraftLabel",
                `Rechnung vorbereitet · ${money(total)}`
            );

            returnToCreate();
        },
        () => V.invoiceMode
    );


    /* Produits, prix et panier. */

    eventProductPrice = p =>
        number(
            p?.promotion_price ??
            p?.price ??
            p?.unit_price
        );

    loadEventProducts = async () => {
        if (!state.currentEvent) return;

        const id = state.currentEvent.id;

        const { data, error } = await db
            .from("event_products")
            .select("*")
            .eq("event_id", id)
            .order("name");

        if (error) throw error;
        if (state.currentEvent?.id !== id) return;

        state.currentEventProducts = data || [];

        renderEventProducts();
        populateGlobalEventProductSelect();

        for (const item of Object.values(state.eventCart)) {
            const current = state.currentEventProducts.find(
                p => p.id === item.id
            );

            if (current) {
                Object.assign(item, {
                    price: current.price,
                    promotion_price: current.promotion_price
                });
            }
        }

        if (state.currentScreenId === "eventSaleScreen") {
            renderEventSale();
        }

        if (state.currentScreenId === "eventPaymentScreen") {
            renderEventPayment();
        }
    };

    populateGlobalEventProductSelect = () => {
        let box = $("eventGlobalChips");

        if (!box) {
            const old = $("globalProductForEventSelect")
                ?.closest(".form-card");

            if (old) visible(old, false);

            box = document.createElement("div");
            box.id = "eventGlobalChips";
            box.className = "event-v6-chips";

            $("eventProductsList").before(box);
        }

        const used = new Set(
            (state.currentEventProducts || [])
                .map(p => p.product_id)
        );

        box.innerHTML = state.products
            .filter(activeProduct)
            .map(p => `
                <button
                    type="button"
                    class="secondary-action"
                    data-product="${esc(p.id)}"
                    ${used.has(p.id) ? "disabled" : ""}
                >
                    ${esc(productIcon(p))}
                    ${esc(p.name)}
                    ${used.has(p.id) ? "✓" : "+"}
                </button>
            `)
            .join("");

        box.querySelectorAll("button").forEach(button => {
            button.onclick = async () => {
                if (V.busy) return;

                V.busy = true;
                button.disabled = true;

                try {
                    await rpc("upsert_event_product", {
                        p_event_id: state.currentEvent.id,
                        p_product_id: button.dataset.product
                    });

                    await loadEventProducts();
                } catch (error) {
                    toast(fail(error), "error");
                    button.disabled = false;
                } finally {
                    V.busy = false;
                }
            };
        });
    };

    const oldRenderProducts = renderEventProducts;

    renderEventProducts = () => {
        oldRenderProducts();

        $("eventProductsList")
            .querySelectorAll(".product-admin-row")
            .forEach((row, i) => {
                const p = state.currentEventProducts[i];

                row.querySelector(
                    ".product-admin-main small"
                ).textContent =
                    `${money(p.price)} · ` +
                    (
                        p.product_id
                            ? "Regulärer Bestand"
                            : `Veranstaltungsbestand: ${p.stock_quantity}`
                    ) +
                    (
                        p.promotion_price != null
                            ? " · Angebot " +
                              money(p.promotion_price)
                            : ""
                    );
            });
    };

    openEventProductModal = (product = null) => {
        openDialog(
            product
                ? "Produkt bearbeiten"
                : "Eigenes Veranstaltungsprodukt",

            field(
                "Name",
                "name",
                product?.name || ""
            ) +
            field(
                "Normalpreis (€)",
                "price",
                product?.price ?? ""
            ) +
            field(
                "Symbol",
                "icon",
                product?.icon || "🍔",
                "text",
                false
            ) +
            (
                !product?.product_id
                    ? field(
                                                product
                            ? (
                                isTeacher()
                                    ? "Zusätzliche Menge (zum Bestand addieren)"
                                    : "Zusätzliche Menge (Lehrer bestätigt)"
                            )
                            : (
                                isTeacher()
                                    ? "Anfangsbestand"
                                    : "Anfangsbestand (Lehrer bestätigt)"
                            ),
                        "stock",
                        "0",
                        "number"
                    )
                    : "<p>Dieses Produkt verwendet den regulären Bestand.</p>"
            ),

            async () => {
                await rpc("save_event_product_v6", {
                    p_event_id: state.currentEvent.id,
                    p_event_product_id: product?.id || null,
                    p_product_id: product?.product_id || null,
                    p_name: value("name").trim(),
                    p_price: amount(value("price")),
                    p_icon: value("icon") || "🍔",
                    p_add_stock: product?.product_id
                        ? 0
                        : quantity(value("stock"))
                });

                dialog.close();
                await loadEventProducts();
            }
        );
    };


    /* Angebot : uniquement pour l'événement courant. */

        const offer = async () => {
        await loadEventProducts();

        const products = [...state.currentEventProducts];

        openDialog(
            "🍬 Angebot",

            "<p>Nur für diese Veranstaltung. Leer lassen, um das Angebot zu entfernen.</p>" +

            products.map(p => `
                <label class="event-offer-row-v8">
                    <div class="inventory-product-info">
                        <span class="inventory-product-icon">
                            ${esc(
                                state.products.find(item =>
                                    String(item.id) === String(p.product_id)
                                )?.icon || p.icon || "🍔"
                            )}
                        </span>

                        <div>
                            <strong>${esc(p.name)}</strong>
                            <small>
                                Normalpreis: ${money(p.price)}
                            </small>
                        </div>
                    </div>

                    <input
                        name="${esc(p.id)}"
                        type="text"
                        inputmode="decimal"
                        aria-label="${esc(p.name)}: Angebotspreis in Euro"
                        placeholder="€"
                        value="${esc(
                            p.promotion_price == null
                                ? ""
                                : String(p.promotion_price).replace(".", ",")
                        )}"
                    >
                </label>
            `).join(""),

            async () => {
                const items = products.map(p => ({
                    id: p.id,
                    price: value(p.id).trim() === ""
                        ? null
                        : amount(value(p.id))
                }));

                await rpc("set_event_promotions_v6", {
                    p_event_id: state.currentEvent.id,
                    p_items: items
                });

                dialog.close();
                await loadEventProducts();
            }
        );
    };
    [
        "eventWorkspaceScreen",
        "eventSaleScreen",
        "eventOutputScreen"
    ].forEach(id => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "event-v6-offer";
        button.textContent = "🍬 Angebot";

        button.onclick = () => {
            if (V.busy) return;

            offer().catch(error => {
                toast(fail(error), "error");
            });
        };

        $(id).querySelector("header").append(button);
    });

    const oldOpenWorkspace = openEventWorkspace;

    openEventWorkspace = async e => {
        await oldOpenWorkspace(e);

        const food =
            state.currentEvent?.event_type === "food";

        $("eventWorkspaceScreen")
            .querySelector(".event-v6-offer")
            .hidden = !food;

        visible($("eventEndInventoryButton"), false);
        visible($("editOtherEventRevenueButton"), false);
    };

    const oldRenderSale = renderEventSale;

    renderEventSale = () => {
        oldRenderSale();

                $("eventSaleScreen").classList.toggle(
            "event-v6-test",
            isTeacherTestMode()
        );
    };

    const oldRenderPayment = renderEventPayment;

    renderEventPayment = () => {
        oldRenderPayment();

                $("eventPaymentScreen").classList.toggle(
            "event-v6-test",
            isTeacherTestMode()
        );
    };


    /* Paiement : commandes professeur uniquement en mémoire. */

    intercept("eventPaidButton", "click", async () => {
        const total = eventCartTotal();
        const received = state.eventReceivedCents / 100;

        if (total <= 0 || received < total) return;

                let order;

        if (isTeacherTestMode()) {
            order = {
                id: crypto.randomUUID(),
                event_id: state.currentEvent.id,
                order_number: String(
                    Math.floor(100 + Math.random() * 900)
                ),
                status: "offen",

                items: eventCartItemsForRpc().map(item => ({
                    ...item,
                    product_name:
                        state.eventCart[
                            item.event_product_id
                        ].name
                }))
            };

            (
                state.eventTestOrders[
                    state.currentEvent.id
                ] ||= []
            ).unshift(order);

        } else {
            try {
                order = await rpc(
                    "create_event_sale_order",
                    {
                        p_event_id: state.currentEvent.id,
                        p_items: eventCartItemsForRpc(),
                        p_payment_amount: received
                    }
                );
            } catch (error) {
                if (
                    String(error.message)
                        .includes("price_changed")
                ) {
                    await loadEventProducts();
                }

                throw error;
            }
        }

        setText(
            "eventSuccessOrderNumber",
            order.order_number
        );

        setText(
            "eventSuccessChange",
            money(
                order.change_amount ??
                received - total
            )
        );

        clearCart(state.eventCart);
        state.eventReceivedCents = 0;

        showScreen("eventSuccessScreen");
    });


    /* Fin du service : gratuités, sans clôturer l'événement. */

    const free = async () => {
        await loadEventProducts();

        const products = [...state.currentEventProducts];

        openDialog(
            "Schicht beenden",

            `
            <p>
                Trage die kostenlosen Produkte ein, die du und
                deine Kolleginnen und Kollegen während der
                heutigen Schicht genommen habt.
            </p>

            <p class="event-v6-warning">
                ‼️ Nur du erfasst heute die kostenlosen Produkte
                für das gesamte Team. Frage deshalb alle
                Kolleginnen und Kollegen, bevor du dieses
                Fenster schließt!
            </p>

            <p>
                Nur neue Mengen eintragen. Bereits gespeicherte
                Mengen nicht erneut erfassen.
            </p>
            ` +
            products.map(p => field(
                p.name,
                p.id,
                "0",
                "number"
            )).join(""),

            async () => {
                const items = products
                    .map(p => ({
                        event_product_id: p.id,
                        quantity: quantity(value(p.id))
                    }))
                    .filter(i => i.quantity > 0);

                                if (!isTeacherTestMode()) {
                    await rpc("record_event_free_v6", {
                        p_event_id: state.currentEvent.id,
                        p_items: items
                    });
                }

                dialog.close();

                showTeamFinished(
                    "Danke für deinen Einsatz! Die Veranstaltung bleibt geöffnet.",
                    () => openEventWorkspace(
                        state.currentEvent
                    )
                );
            },

                        isTeacherTestMode()
                ? "Test: Schicht beenden"
                : "Speichern und Schicht beenden"
        );
    };

    [
        "eventShiftEndButton",
        "eventCashShiftEndButton",
        "eventOutputShiftEndButton"
    ].forEach(id => {
        intercept(id, "click", free);
    });

    if (!$("eventOutputShiftEndButton")) {
        const b = document.createElement("button");

        b.id = "eventOutputShiftEndButton";
        b.type = "button";
        b.className = "secondary-action";
        b.textContent = "Schicht beenden";

        $("eventOutputScreen")
            .querySelector("header")
            .append(b);

        intercept(b.id, "click", free);
    }


    /* Professeur : tests personnels ou consultation réelle. */

    const toolbar = document.createElement("div");

    toolbar.className = "event-v6-output-tabs";

    toolbar.innerHTML = `
        <button type="button" data-mode="test">
            Meine Testbestellungen
        </button>

        <button type="button" data-mode="real">
            Echte Bestellungen ansehen
        </button>
    `;

    $("eventOutputOrders").before(toolbar);

    toolbar.querySelectorAll("button").forEach(b => {
        b.onclick = () => {
            V.outputMode = b.dataset.mode;

            loadEventOrders().catch(error => {
                toast(fail(error), "error");
            });
        };
    });

    loadEventOrders = async () => {
        if (!state.currentEvent) return;

                visible(toolbar, false);

                $("eventOutputScreen").classList.toggle(
            "event-v6-test",
            isTeacherTestMode()
        );

                V.outputMode = isTeacherTestMode() ? "test" : "real";
        const readOnly = false;

        let orders;

                if (isTeacherTestMode()) {
            orders =
                state.eventTestOrders[
                    state.currentEvent.id
                ] || [];
        } else {
            const { data, error } = await db
                .from("event_orders")
                .select("*,event_order_items(*)")
                .eq("event_id", state.currentEvent.id)
                .eq("is_test", false)
                .order("created_at", {
                    ascending: false
                });

            if (error) throw error;

            orders = (data || []).map(o => ({
                ...o,
                items: o.event_order_items || []
            }));
        }

        renderEventOrders(orders);

        if (readOnly) {
            $("eventOutputOrders")
                .querySelectorAll("[data-serve-event]")
                .forEach(b => b.remove());
        }

        setText(
            "eventOutputTestBanner",
            readOnly
                ? "Echte Bestellungen · Nur ansehen"
                : "⚠️ Testumgebung – keine echten Verkäufe"
        );

                visible(
            $("eventOutputTestBanner"),
            isTeacherTestMode()
        );
    };

    const oldServe = serveEventOrder;

        serveEventOrder = async id => {
        await oldServe(id);
    };


    /* Clôture officielle : professeur uniquement. */

    intercept("closeEventButton", "click", async () => {
        if (!isTeacher()) return;

        await loadEventProducts();

        const e = state.currentEvent;
        const food = e.event_type === "food";

        if (!food) state.currentEventProducts = [];

        const custom = state.currentEventProducts.filter(
            p => !p.product_id
        );

        openDialog(
            "Veranstaltung offiziell abschließen",

            (
                !food
                    ? field(
                        "Umsatz (€) – 0 € ist gültig",
                        "revenue",
                        e.direct_revenue ?? ""
                    )
                    : "<p>Die Einnahmen werden aus den echten Verkäufen berechnet.</p>"
            ) +

            `
            <label class="form-field">
                <span>
                    ${
                        food
                            ? "Sind noch eigens für diese Veranstaltung erstellte Produkte übrig?"
                            : "Sind Produkte oder Materialien übrig?"
                    }
                </span>
                              
                                <small class="event-leftovers-note-v8">
                    Dies betrifft nur Produkte oder Materialien, die
                    speziell für diese Veranstaltung gekauft wurden.
                    Reguläre Getränke gehören nicht dazu.
                </small>

                <select name="leftovers" required>
                    <option value="">Bitte wählen</option>
                    <option value="no">Nein</option>
                    <option value="yes">Ja</option>
                </select>
            </label>

            <div id="eventV6Counts" hidden>
                ${
                    food
                        ? custom.map(p => field(
                            p.name,
                            p.id,
                            "",
                            "number"
                        )).join("")
                        : `
                            <p>
                                Eine Zeile pro Produkt oder
                                Material: Name; Anzahl
                            </p>

                            <textarea
                                name="materials"
                                rows="5"
                                placeholder="Becher; 20"
                            ></textarea>
                        `
                }
            </div>
            ` +

            (
                food
                    ? `
                        <label>
                            <input
                                type="checkbox"
                                name="free"
                                required
                            >
                            Die kostenlosen Produkte wurden
                            vollständig erfasst
                            (auch 0 ist möglich).
                        </label>
                    `
                    : ""
            ) +

            "<p>Nur diese Aktion schließt die Veranstaltung endgültig ab.</p>",

            async () => {
                const left =
                    value("leftovers") === "yes";

                let counts = [];

                if (left && food) {
                    counts = custom.map(p => ({
                        id: p.id,
                        quantity: quantity(value(p.id))
                    }));
                }

                if (left && !food) {
                    counts = value("materials")
                        .split("\n")
                        .filter(s => s.trim())
                        .map(s => {
                            const parts = s.split(";");

                            if (
                                parts.length !== 2 ||
                                !parts[0].trim()
                            ) {
                                throw Error(
                                    "Bitte Name; Anzahl eingeben."
                                );
                            }

                            return {
                                name: parts[0].trim(),
                                quantity: quantity(
                                    parts[1].trim()
                                )
                            };
                        });
                }

                const summary = await rpc(
                    "close_event_v6",
                    {
                        p_event_id: e.id,
                        p_revenue: food
                            ? null
                            : amount(value("revenue")),
                        p_leftovers: left,
                        p_counts: counts,
                        p_free_confirmed: food
                            ? form.elements
                                .namedItem("free")
                                .checked
                            : false
                    }
                );

                dialog.close();
                state.currentEvent = null;

                clearCart(state.eventCart);

                await loadEvents();
                showScreen("eventsScreen");
                renderEvents();

                openDialog(
                    "Veranstaltung abgeschlossen",

                    `
                    <p>
                        Einnahmen:
                        <strong>
                            ${money(summary.revenue)}
                        </strong>
                    </p>

                    <p>
                        Verkäufe:
                        <strong>
                            ${integer(summary.sales)}
                        </strong>
                    </p>

                    <p>
                        Kostenlose Einheiten:
                        <strong>
                            ${integer(summary.free_units)}
                        </strong>
                    </p>
                    `,

                    null
                );
            },

            "Offiziell abschließen"
        );

        const select =
            form.elements.namedItem("leftovers");

        select.onchange = () => {
            const yes = select.value === "yes";

            visible($("eventV6Counts"), yes);

            $("eventV6Counts")
                .querySelectorAll("input")
                .forEach(input => {
                    input.required = yes;
                });
        };

        $("eventV6Counts")
            .querySelectorAll("input")
            .forEach(input => {
                input.required = false;
            });
    });


    /* Historique compact, repliable et défilant. */

    renderEvents = () => {
        const open = state.events.filter(
            e => !eventClosed(e)
        );

        const closed = state.events
            .filter(eventClosed)
            .sort((a, b) =>
                String(
                    b.completed_at || b.event_date
                ).localeCompare(
                    String(
                        a.completed_at || a.event_date
                    )
                )
            );

        $("upcomingEventsList").innerHTML = "";
        $("pastEventsList").innerHTML = "";

        const row = (e, done) => {
            const element = document.createElement(
                done ? "div" : "button"
            );

            element.className = "event-v6-row";

            if (!done) {
                element.type = "button";

                element.onclick = () =>
                    openEventWorkspace(e);
            }

            element.innerHTML = `
                <strong>${esc(e.name)}</strong>

                <span>${dateDE(e.event_date)}</span>

                <span>
                    ${
                        e.event_type === "food"
                            ? "🍔 Food"
                            : "🎟️ Anderes"
                    }
                </span>

                ${
                    done
                        ? "<span>✓ Abgeschlossen</span>"
                        : ""
                }
            `;

            return element;
        };

        open.forEach(e => {
            $("upcomingEventsList").append(
                row(e, false)
            );
        });

        closed.forEach(e => {
            $("pastEventsList").append(
                row(e, true)
            );
        });

        if (!open.length) {
            $("upcomingEventsList").textContent =
                "Keine offenen Veranstaltungen.";
        }

        if (!closed.length) {
            $("pastEventsList").textContent =
                "Noch keine abgeschlossenen Veranstaltungen.";
        }
    };

    const past = $("pastEventsList");
    const section = past.closest(".event-list-section");
    const details = document.createElement("details");

    details.className = "event-v6-history";

    details.innerHTML = `
        <summary>Letzte Veranstaltungen</summary>
    `;

    section.replaceChildren(details);
    details.append(past);


    /* Texte pour les boissons gratuites habituelles. */

    const intro = $("freeDrinksScreen")
        ?.querySelector(".celebration-heading p");

    if (intro) {
        intro.textContent =
            "Trage die kostenlosen Getränke ein, die du und deine Kolleginnen und Kollegen während der heutigen Schicht genommen habt.";

        intro.insertAdjacentHTML(
            "afterend",
            `
            <p class="event-v6-warning">
                ‼️ Nur du erfasst heute die kostenlosen Getränke
                für das gesamte Team. Frage deshalb alle
                Kolleginnen und Kollegen, bevor du dieses
                Fenster schließt!
            </p>
            `
        );
    }


    /* Secours si Realtime est momentanément indisponible. */

    let refreshing = false;

    setInterval(async () => {
        if (
            refreshing ||
            document.hidden ||
            !state.currentPerson ||
            !state.currentEvent ||
            V.busy
        ) {
            return;
        }

        const screen = state.currentScreenId;

        if (![
            "eventOutputScreen",
            "eventSaleScreen",
            "eventPaymentScreen"
        ].includes(screen)) {
            return;
        }

        refreshing = true;

        try {
            const { data, error } = await db
                .from("events")
                .select("*")
                .eq("id", state.currentEvent.id)
                .single();

            if (error) throw error;

            state.currentEvent = data;

            if (eventClosed(data)) {
                dialog.close();
                clearCart(state.eventCart);

                state.currentEvent = null;

                await loadEvents();
                showScreen("eventsScreen");
                renderEvents();

                return;
            }

            if (screen === "eventOutputScreen") {
                await loadEventOrders();
            } else {
                await loadEventProducts();
            }
        } catch (error) {
            console.error(error);
        } finally {
            refreshing = false;
        }
    }, 5000);

    db.auth.onAuthStateChange(event => {
        if (event === "SIGNED_OUT") {
            V.invoice = null;
            V.invoiceMode = false;
            dialog.close();
        }
    });
})();

/* =========================================================
   ACCÈS ÉLÈVES — HORAIRES ET AUTORISATIONS PROFESSEUR
   Supabase décide de l'accès.
   ========================================================= */

(() => {
    state.studentAccessAllowed = false;

    /*
     * La vérification se fait après le PIN :
     * avant connexion, on ne peut pas vérifier
     * l'autorisation exceptionnelle de cet élève.
     */
    studentMayOpenPin = () => true;

    schoolOpenNow = () =>
        isTeacher() ||
        state.studentAccessAllowed === true;

    const previousCheck = checkStudentTestAccess;

    checkStudentTestAccess = async () => {
        const person = state.currentPerson;

        if (!person) return false;
        if (isTeacher()) return true;

        state.studentAccessAllowed = false;

        try {
            const allowed = await previousCheck();

            if (state.currentPerson?.id !== person.id) {
                return false;
            }

            state.studentAccessAllowed = allowed === true;

            return state.studentAccessAllowed;
        } catch (error) {
            console.error(
                "Zugangsprüfung fehlgeschlagen:",
                error
            );

            state.studentAccessAllowed = false;
            state.currentPerson = null;
            state.selectedLoginPerson = null;

            showSchoolClosed();

            await db.auth.signOut();

            return false;
        }
    };

    db.auth.onAuthStateChange(event => {
        if (event === "SIGNED_OUT") {
            state.studentAccessAllowed = false;
        }
    });
})();
/* =========================================================
   NOTIFICATIONS — NAVIGATION ET APERÇU COMPACT
   ========================================================= */

(() => {
    const handled = new Set();
    let opening = false;

    /* Ouvrir l'historique et charger les destinataires professeur */
    const archive = async () => {
        hideNotificationPopover();

        state.notificationMode = "received";

        showScreen("notificationsScreen");

        if (isTeacher()) {
            await openNotificationsAdmin();
        } else {
            await loadNotifications();
            renderNotificationsPage();
        }
    };

    /* Enregistrer la lecture avant de retirer une notification */
    markNotificationRead = async notification => {
        if (!notification || notification.read_at) return;

        const { data, error } = await db.rpc(
            "mark_notification_read",
            {
                p_notification_id: notification.id
            }
        );

        if (error) throw error;

        if (data !== true) {
            throw Error(
                "Benachrichtigung konnte nicht als gelesen markiert werden."
            );
        }

        const timestamp = new Date().toISOString();

        notification.read_at = timestamp;

        const saved = state.notifications.find(
            n => n.id === notification.id
        );

        if (saved) saved.read_at = timestamp;

        renderNotificationBadge();
        renderNotificationPreview();
    };

    /* Destinations reconnues : aucun lien arbitraire n'est exécuté */
    const navigate = async notification => {
        const target = String(
            notification.link_target || ""
        );

        const type = String(
            notification.notification_type || ""
        );

        /* Produits */
        if (
            ["products", "productsScreen"].includes(target) ||
            type === "product_change"
        ) {
            await loadProducts();
            renderProductsAdmin();
            showScreen("productsScreen");
            return;
        }

        /* Inventaires */
        if (
            [
                "inventory",
                "teacherInventoryScreen",
                "studentInventoryScreen"
            ].includes(target) ||
            type === "inventory"
        ) {
            if (isTeacher()) {
                showScreen("teacherInventoryScreen");
                await renderTeacherInventory();
            } else {
                renderStudentInventory();
                showScreen("studentInventoryScreen");
            }

            return;
        }

        /* Événements */
        if (
            [
                "events",
                "event_end_inventory",
                "eventWorkspaceScreen"
            ].includes(target) ||
            type === "event_closure_reminder"
        ) {
            await loadEvents();

            const event = state.events.find(
                e => e.id === notification.link_data?.event_id
            );

            if (event && !eventClosed(event)) {
                await openEventWorkspace(event);
            } else {
                showScreen("eventsScreen");
                renderEvents();
            }

            return;
        }

        /* Comptabilité */
        if (target === "invoices" && isTeacher()) {
            showScreen("invoicesScreen");
            await initialiseInvoices();
            return;
        }

        /* Gestion des élèves */
        if (target === "students" && isTeacher()) {
            showScreen("studentsScreen");
            await loadStudents();
            return;
        }

        /* Rapports */
        if (target === "reports" && isTeacher()) {
            showScreen("reportsScreen");
            await loadReports();
            return;
        }

        /* Message sans écran associé : ouvrir l'historique */
        await archive();
    };

    const activate = async notification => {
        if (
            opening ||
            handled.has(notification.id)
        ) {
            return;
        }

        opening = true;
        handled.add(notification.id);

        try {
            await markNotificationRead(notification);

            hideNotificationPopover();

            await navigate(notification);
        } catch (error) {
            console.error(error);

            toast(
                "Benachrichtigung konnte nicht geöffnet werden. Bitte erneut versuchen.",
                "error"
            );
        } finally {
            opening = false;
            handled.delete(notification.id);
        }
    };

    /* Liste affichée dans la cloche */
    renderNotificationPreview = () => {
        const box = $("notificationPreviewList");

        if (!box) return;

        const notifications = [...state.notifications]
            .sort((a, b) =>
                String(b.created_at).localeCompare(
                    String(a.created_at)
                )
            )
            .filter(notification =>
                !isTeacher() || !notification.read_at
            )
            .slice(0, 5);

        box.innerHTML = "";

        if (!notifications.length) {
            box.innerHTML = `
                <div class="notification-preview-empty">
                    Keine neuen Benachrichtigungen.
                </div>
            `;

            return;
        }

        for (const notification of notifications) {
            const button = document.createElement("button");

            button.type = "button";

            button.className =
                "notification-preview-item notification-compact " +
                (
                    notification.read_at
                        ? "notification-read"
                        : "notification-new"
                );

            button.title =
                `${notification.title || "Benachrichtigung"} – ` +
                `${notification.message || ""}`;

            button.setAttribute(
                "aria-label",
                button.title
            );

            button.innerHTML = `
                <strong>
                    ${esc(
                        notification.title ||
                        "Benachrichtigung"
                    )}
                </strong>

                <span
                    class="notification-separator"
                    aria-hidden="true"
                >
                    –
                </span>

                <small>
                    ${esc(notification.message || "")}
                </small>
            `;

            button.onclick = () => activate(notification);

            box.append(button);
        }
    };

    /* Les notifications de l'historique sont aussi navigables */
    const originalPage = renderNotificationsPage;

    renderNotificationsPage = () => {
        originalPage();

        if (state.notificationMode === "sent") return;

        const cards = $$(
            "#notificationsList .notification-card"
        );

        cards.forEach((card, index) => {
            const notification = state.notifications[index];

            if (!notification) return;

            card.tabIndex = 0;
            card.setAttribute("role", "button");

            card.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    activate(notification);
                },
                true
            );

            card.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        activate(notification);
                    }
                }
            );
        });
    };

    /* Corrige Alle anzeigen : charge aussi Empfänger */
    $("showAllNotificationsButton")?.addEventListener(
        "click",
        async event => {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (opening) return;

            opening = true;

            try {
                await archive();
            } catch (error) {
                console.error(error);

                toast(
                    "Benachrichtigungen konnten nicht geladen werden.",
                    "error"
                );
            } finally {
                opening = false;
            }
        },
        true
    );
})();
/* =========================================================
   FIN DE SERVICE — GETRÄNKE ET BÄCKEREI
   ========================================================= */

(() => {
    let drinksEntryOpen = false;

    const interceptClick = (id, handler) => {
        $(id)?.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopImmediatePropagation();

                handler();
            },
            true
        );
    };

    /* Fin de service Bäckerei : aucun formulaire de boissons */
    const finishBakeryShift = () => {
        if (state.cashierSaving) return;

        clearCart(state.bakeryCart);
        state.bakeryReceivedCents = 0;
        state.bakeryPaymentInput = "";

        goHome();

        toast(
            "Gut gemacht heute, Team! 🎉",
            "success"
        );
    };

    interceptClick(
        "bakeryCashShiftEndButton",
        finishBakeryShift
    );

    interceptClick(
        "bakeryOutputShiftEndButton",
        finishBakeryShift
    );

    /* Supprimer l'avertissement ajouté par l'ancien complément */
    const screen = $("freeDrinksScreen");

    screen?.querySelectorAll(".event-v6-warning")
        .forEach(element => element.remove());

    const intro = screen?.querySelector(
        ".celebration-heading p"
    );

    if (intro) {
        intro.textContent =
            "Trage die kostenlosen Getränke ein, die du und deine Kolleginnen und Kollegen während der heutigen Schicht genommen habt.";
    }

    const warning = screen?.querySelector(
        ".free-drinks-warning"
    );

    if (warning) {
        warning.textContent =
            "‼️ Nur du erfasst heute die kostenlosen Getränke " +
            "für das gesamte Team. Bitte schließe dieses Fenster " +
            "erst, wenn du alle kostenlosen Getränke des Teams " +
            "für diese Schicht eingetragen und gespeichert hast!";
    }

    /* Formulaire accessible depuis Getränke uniquement */
    const previousOpenFreeDrinks = openFreeDrinks;

    openFreeDrinks = backScreen => {
        if (![
            "drinksSaleScreen",
            "drinksSuccessScreen"
        ].includes(backScreen)) {
            return;
        }

        drinksEntryOpen = true;
        previousOpenFreeDrinks(backScreen);
    };

    /* Empêcher l'ouverture directe depuis une autre rubrique */
    const previousShowScreen = showScreen;

    showScreen = (id, options) => {
        if (
            id === "freeDrinksScreen" &&
            !drinksEntryOpen
        ) {
            previousShowScreen("homeScreen", options);
            return;
        }

        previousShowScreen(id, options);
    };

    /* Terminer Getränke après sauvegarde des quantités */
    const finishDrinksShift = () => {
        if (finishFreeDrinks.busy) return;

        const unsaved = $$(
            "#freeDrinksList [data-product-id]"
        ).some(row => integer(row.dataset.quantity) > 0);

        if (unsaved) {
            toast(
                "Bitte zuerst die Getränke speichern.",
                "info"
            );
            return;
        }

        drinksEntryOpen = false;

        clearCart(state.drinksCart);
        state.drinksReceivedCents = 0;
        state.drinksPaymentInput = "";

        goHome();

        toast(
            "Gut gemacht heute, Team! 🎉",
            "success"
        );
    };

    interceptClick(
        "freeDrinksEndButton",
        finishDrinksShift
    );

    interceptClick(
        "freeDrinksNoneButton",
        finishDrinksShift
    );

    db.auth.onAuthStateChange(event => {
        if (event === "SIGNED_OUT") {
            drinksEntryOpen = false;
        }
    });
})();
/* Élèves : numéro masqué et modification du PIN par crayon */

(() => {
    const numberInput = $("studentNumberInput");

    /* Conserve la valeur existante sans afficher le champ */
    if (numberInput) {
        const label = numberInput.closest("label");

        if (label) {
            label.hidden = true;
            label.style.display = "none";
        }

        numberInput.type = "hidden";
    }

    const pin = $("studentPinInput");
    if (!pin) return;

    const wrapper = document.createElement("div");
    wrapper.className = "student-pin-editor";

    pin.before(wrapper);
    wrapper.append(pin);

    const pencil = document.createElement("button");

    pencil.type = "button";
    pencil.className = "student-pin-pencil";
    pencil.textContent = "✎";
    pencil.title = "PIN ändern";
    pencil.setAttribute("aria-label", "PIN ändern");

    wrapper.append(pencil);

    const lockPin = () => {
        pin.value = "";
        pin.readOnly = true;
        pin.required = false;
        pin.placeholder = "****";

        pencil.title = "PIN ändern";
        pencil.setAttribute("aria-label", "PIN ändern");

        setText(
            "studentPinHint",
            "Zum Ändern auf den Stift klicken."
        );
    };

    pencil.onclick = () => {
        if (pin.readOnly) {
            pin.readOnly = false;
            pin.required = true;
            pin.placeholder = "Neue PIN";
            pin.focus();

            pencil.title = "PIN-Änderung verwerfen";
            pencil.setAttribute(
                "aria-label",
                "PIN-Änderung verwerfen"
            );

            setText(
                "studentPinHint",
                "Neue PIN mit 4 Ziffern eingeben."
            );
        } else {
            /* Un second clic annule la modification du PIN */
            lockPin();
        }
    };

    const previousOpenStudentModal = openStudentModal;

    openStudentModal = student => {
        if (!isTeacher()) return;

        previousOpenStudentModal(student);

        pin.type = "password";
        pin.value = "";

        if (student) {
            pencil.hidden = false;
            lockPin();
        } else {
            /* Création : le PIN doit être saisi directement */
            pencil.hidden = true;
            pin.readOnly = false;
            pin.required = true;
            pin.placeholder = "4 Ziffern";

            setText("studentPinHint", "4 Ziffern");
        }
    };
})();
/* Notifications reçues : suppression personnelle professeur */

(() => {
    let loadVersion = 0;
    const deleting = new Set();

    /* Charger les notifications sans celles retirées */
    loadNotifications = async () => {
        const person = state.currentPerson;
        if (!person) return;

        const teacher = isTeacher();
        const version = ++loadVersion;

        const notificationsQuery = db
            .from("notifications")
            .select("*")
            .or([
                `recipient_person_id.eq.${person.id}`,
                `recipient_type.eq.${teacher ? "teacher" : "student"}`,
                "recipient_type.eq.all"
            ].join(","))
            .order("created_at", { ascending: false })
            .limit(100);

        const dismissalsQuery = teacher
            ? db.from("notification_dismissals")
                .select("notification_id")
                .eq("person_id", person.id)
            : Promise.resolve({
                data: [],
                error: null
            });

        const [notifications, dismissals] =
            await Promise.all([
                notificationsQuery,
                dismissalsQuery
            ]);

        if (
            version !== loadVersion ||
            state.currentPerson?.id !== person.id
        ) {
            return;
        }

        if (notifications.error) throw notifications.error;
        if (dismissals.error) throw dismissals.error;

        const removed = new Set(
            (dismissals.data || []).map(
                item => item.notification_id
            )
        );

        state.notifications = (notifications.data || [])
            .filter(item => !removed.has(item.id));

        renderNotificationBadge();
        renderNotificationPreview();

        if (state.currentScreenId === "notificationsScreen") {
            renderNotificationsPage();
        }
    };

    /* Ajouter la croix aux notifications reçues */
    const previousRender = renderNotificationsPage;

    renderNotificationsPage = () => {
        previousRender();

        if (
            !isTeacher() ||
            state.notificationMode === "sent"
        ) {
            return;
        }

        $$("#notificationsList .notification-card")
            .forEach((card, index) => {
                const notification = state.notifications[index];
                if (!notification) return;

                card.classList.add("notification-removable");

                const button = document.createElement("button");

                button.type = "button";
                button.className = "notification-remove-button";
                button.dataset.removeNotification = notification.id;
                button.textContent = "×";
                button.title = "Benachrichtigung entfernen";

                button.setAttribute(
                    "aria-label",
                    `Benachrichtigung entfernen: ${notification.title || ""}`
                );

                card.append(button);
            });
    };

    const list = $("notificationsList");

    /* Intercepter la croix avant la navigation de la notification */
    list?.addEventListener(
        "click",
        async event => {
            const button = event.target.closest(
                "[data-remove-notification]"
            );

            if (!button) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            if (!isTeacher()) return;

            const id = button.dataset.removeNotification;

            if (deleting.has(id)) return;

            deleting.add(id);
            button.disabled = true;

            try {
                const { data, error } = await db.rpc(
                    "teacher_dismiss_notification",
                    {
                        p_notification_id: id
                    }
                );

                if (error) throw error;
                if (data !== true) {
                    throw Error("Entfernen fehlgeschlagen.");
                }

                state.notifications = state.notifications
                    .filter(notification => notification.id !== id);

                renderNotificationBadge();
                renderNotificationPreview();
                renderNotificationsPage();

                toast(
                    "Benachrichtigung entfernt.",
                    "success"
                );
            } catch (error) {
                console.error(error);

                button.disabled = false;

                toast(
                    "Benachrichtigung konnte nicht entfernt werden.",
                    "error"
                );
            } finally {
                deleting.delete(id);
            }
        },
        true
    );

    /* Utilisation au clavier sans ouvrir la notification */
    list?.addEventListener(
        "keydown",
        event => {
            const button = event.target.closest(
                "[data-remove-notification]"
            );

            if (
                button &&
                (event.key === "Enter" || event.key === " ")
            ) {
                event.preventDefault();
                event.stopImmediatePropagation();

                button.click();
            }
        },
        true
    );
})();
/* =========================================================
   SON DERVERANSTALTUNG — HARMONISATION V7
   Ajouter une seule fois à la fin de app.js.
   ========================================================= */

(() => {
    let busy = false;
    let freeOpen = false;

    const serving = new Set();

    const icon = product => {
        const habitual = state.products.find(
            item => item.id === product.product_id
        );

        return habitual
            ? productIcon(habitual)
            : (product.icon || "🍔");
    };

    const rpc = async (name, args) => {
        const { data, error } = await db.rpc(name, args);

        if (error) throw error;

        return Array.isArray(data) ? data[0] : data;
    };

    const errorText = error => {
        console.error(error);

        const message = String(error?.message || error);

        return message.includes("insufficient_stock")
            ? "Nicht genug Bestand: " +
              message.split("insufficient_stock:").pop().trim()
            : "Bitte erneut versuchen. " + message;
    };

    const context = () => ({
        event: state.currentEvent?.id,
        person: state.currentPerson?.id
    });

    const unchanged = saved =>
        saved.event === state.currentEvent?.id &&
        saved.person === state.currentPerson?.id;


    /* Retirer les textes inutiles, conserver + Veranstaltung */
    $("teacherEventActions")
        ?.querySelector("div")
        ?.remove();


    /* Historique toujours ouvert */
    const past = $("pastEventsList");
    const history = past.closest(".event-list-section");

    const heading = document.createElement("h2");
    heading.textContent = "Letzte Veranstaltungen";

    const headingRow = document.createElement("div");
    headingRow.className = "section-heading";
    headingRow.append(heading);

    history.replaceChildren(headingRow, past);
    history.classList.add("event-v7-history");


    /* Sélection globale des boissons */
    const all = document.createElement("button");

    all.id = "eventSelectAllDrinksButton";
    all.type = "button";
    all.className = "secondary-action";
    all.textContent = "Alle Getränke auswählen";

    $("eventProductsList").before(all);

    const footer = document.createElement("div");
    footer.className = "event-v7-products-footer";

    footer.innerHTML = `
        <button
            type="button"
            class="primary-action"
            id="eventProductsConfirmButton"
        >
            Produkte bestätigen
        </button>
    `;

    $("eventProductsList").after(footer);


    populateGlobalEventProductSelect = () => {
        let box = $("eventGlobalChips");

        if (!box) {
            box = document.createElement("div");
            box.id = "eventGlobalChips";
            box.className = "event-v6-chips";

            $("eventProductsList").before(box);
        }

        box.before(all);

        const old = $("globalProductForEventSelect")
            ?.closest(".form-card");

        if (old) {
            old.hidden = true;
            old.style.display = "none";
        }

        const used = new Set(
            (state.currentEventProducts || [])
                .map(product => product.product_id)
        );

        box.innerHTML = state.products
            .filter(activeProduct)
            .map(product => `
                <button
                    type="button"
                    class="secondary-action ${
                        used.has(product.id)
                            ? "is-selected"
                            : ""
                    }"
                    data-event-catalog="${esc(product.id)}"
                    ${used.has(product.id) ? "disabled" : ""}
                >
                    ${esc(productIcon(product))}
                    ${esc(product.name)}
                    ${used.has(product.id) ? "✓" : "+"}
                </button>
            `)
            .join("");

        box.querySelectorAll("button").forEach(button => {
            button.onclick = async () => {
                if (busy || !state.currentEvent) return;

                busy = true;
                button.disabled = true;

                const saved = context();

                try {
                    const product = state.products.find(
                        item =>
                            item.id === button.dataset.eventCatalog
                    );

                    await rpc("upsert_event_product", {
                        p_event_id: saved.event,
                        p_product_id: product.id,
                        p_name: product.name,
                        p_price: product.price,
                        p_icon: productIcon(product)
                    });

                    if (unchanged(saved)) {
                        await loadEventProducts();
                    }
                } catch (error) {
                    toast(errorText(error), "error");
                    button.disabled = false;
                } finally {
                    busy = false;
                }
            };
        });
    };


    /* Produits sélectionnés en lignes compactes */
    renderEventProducts = () => {
        const box = $("eventProductsList");
        box.innerHTML = "";

        if (!(state.currentEventProducts || []).length) {
            box.innerHTML = `
                <div class="empty-state">
                    Noch keine Produkte ausgewählt.
                </div>
            `;

            return;
        }

        for (const product of state.currentEventProducts) {
            const row = document.createElement("article");

            row.className =
                "product-admin-row event-v7-product-row";

            row.innerHTML = `
                <div class="product-admin-main">
                    <span>${esc(icon(product))}</span>

                    <div>
                        <strong>${esc(product.name)}</strong>

                        <small>
                            ${money(product.price)} ·
                            ${
                                product.product_id
                                    ? "Regulärer Bestand"
                                    : "Veranstaltungsbestand: " +
                                      integer(product.stock_quantity)
                            }
                            ${
                                product.promotion_price != null
                                    ? " · Angebot " +
                                      money(product.promotion_price)
                                    : ""
                            }
                        </small>
                    </div>
                </div>

                <div class="product-admin-actions">
                    <button
                        class="secondary-action"
                        type="button"
                    >
                        Bearbeiten
                    </button>
                </div>
            `;

            row.querySelector("button").onclick = () =>
                openEventProductModal(product);

            box.append(row);
        }
    };


    /* Clavier : mêmes touches et helpers que Getränke/Bäckerei */
    $("eventPaymentKeypad").innerHTML = [
        "1", "2", "3",
        "4", "5", "6",
        "7", "8", "9",
        ",", "0"
    ].map(key => `
        <button
            class="payment-key"
            data-value="${key}"
            type="button"
        >
            ${key}
        </button>
    `).join("") + `
        <button
            class="payment-key delete-key"
            id="eventDeletePaymentButton"
            aria-label="Letzte Ziffer löschen"
            type="button"
        >
            ⌫
        </button>
    `;

    $("eventPaymentScreen")
        .querySelectorAll(".payment-summary-card > span")
        .forEach((label, index) => {
            label.textContent =
                index === 0 ? "Zu zahlen:" : "Kunde gibt:";
        });

    $("eventAmountReceived")
        .closest(".payment-summary-card")
        .classList.add("payment-received-card");

    $("eventPaymentScreen")
        .querySelector(".change-container > span")
        .textContent = "Rückgeld:";

    $("eventSuccessScreen")
        .querySelector(".success-content > p")
        .textContent =
            "Bitte gib diese Bestellnummer an den Schüler oder Kunden weiter!";

    $("eventSuccessOrderNumber")
        .setAttribute("aria-live", "polite");

    $("eventOutputScreen")
        .querySelector("header")
        .classList.add("bakery-dashboard-header");


    if (!$("eventSuccessShiftEndButton")) {
        const button = document.createElement("button");

        button.id = "eventSuccessShiftEndButton";
        button.type = "button";
        button.className = "secondary-action";
        button.textContent = "Schicht beenden";

        $("eventNewOrderButton").after(button);
    }


    const oldShow = showScreen;

    showScreen = (id, options) => {
        if (id === "eventSuccessScreen") {
            const numberElement = $("eventSuccessOrderNumber");

            numberElement.textContent =
                "#" + numberElement.textContent.replace(/^#+/, "");

            const test =
                state.eventTestOrders[state.currentEvent?.id]?.[0];

            if (isTeacher() && test && !test.created_at) {
                test.created_at = new Date().toISOString();
            }

            state.eventPaymentInput = "";
        }

        oldShow(id, options);
    };


    /* Ausgabe : mêmes cartes et historique que Bäckerei */
    renderEventOrders = orders => {
        if (!state.currentEvent) return;

        const open = (orders || [])
            .filter(order => !eventOrderDone(order))
            .sort((a, b) =>
                String(a.created_at || "").localeCompare(
                    String(b.created_at || "")
                )
            );

        const done = (orders || [])
            .filter(eventOrderDone)
            .sort((a, b) =>
                String(
                    b.served_at || b.created_at || ""
                ).localeCompare(
                    String(a.served_at || a.created_at || "")
                )
            );

        setText("eventOpenOrderCount", open.length);
        setText("eventCompletedOrderCount", done.length);

        const openBox = $("eventOutputOrders");
        const doneBox = $("eventCompletedOrders");

        if (!openBox || !doneBox) return;

        openBox.innerHTML =
            '<div class="bakery-order-masonry"></div>';

        const masonry = openBox.firstElementChild;

        if (!open.length) {
            masonry.innerHTML = `
                <div class="empty-state bakery-output-empty">
                    <strong>Alles erledigt! ✓</strong>
                    <span>Keine offenen Bestellungen.</span>
                </div>
            `;
        }

        for (const order of open) {
            
const test = isTeacherTestMode() && (
    state.eventTestOrders[state.currentEvent.id] || []
).some(item => item.id === order.id);

const canServe = isTeacherTestMode()
    ? test
    : true;

            const items =
                order.items || order.event_order_items || [];

            const total = order.total ?? items.reduce(
                (sum, item) =>
                    sum +
                    number(item.unit_price) *
                    integer(item.quantity),
                0
            );

            const card = document.createElement("article");

            card.className = "output-order-card" +
                (test ? " bakery-test-order" : "");

            card.innerHTML = `
                <div class="bakery-order-card-header">
                    <strong class="output-order-number">
                        ${test ? "Testbestellung" : "Bestellung"}
                        #${esc(order.order_number)}
                    </strong>
                </div>

                <div class="bakery-order-card-body">
                    <time class="bakery-order-time">
                        ${esc(bakeryCardDate(
                            order.created_at ||
                            new Date().toISOString()
                        ))}
                    </time>

                    <div class="output-order-items">
                        ${items.map(item => `
                            <div class="bakery-order-item">
                                <strong class="bakery-item-quantity">
                                    ${integer(item.quantity)}×
                                </strong>

                                <span>
                                    ${esc(
                                        item.product_name ||
                                        item.name ||
                                        "Produkt"
                                    )}
                                </span>
                            </div>
                        `).join("")}
                    </div>

                    <div class="bakery-order-total">
                        Gesamt: ${money(total)}
                    </div>

                    ${
                        canServe
                            ? `
                                <button
                                    class="bakery-served-button"
                                    data-serve-event
                                    type="button"
                                >
                                    Ausgegeben
                                </button>
                            `
                            : `
                                <span class="bakery-readonly-label">
                                    Nur Ansicht
                                </span>
                            `
                    }
                </div>
            `;

            const button = card.querySelector("button");

            if (button) {
                button.disabled = serving.has(order.id);

                button.onclick = () =>
                    serveEventOrder(order.id);
            }

            masonry.append(card);
        }

        doneBox.innerHTML = done.length ? "" : `
            <div class="empty-state">
                <small>Noch keine fertigen Bestellungen.</small>
            </div>
        `;

        for (const order of done) {
            const row = document.createElement("div");
            row.className = "completed-order-row";

            row.innerHTML = `
                <strong>#${esc(order.order_number)}</strong>

                <time>
                    ${esc(bakeryOrderDate(
                        order.served_at ||
                        order.created_at ||
                        new Date().toISOString()
                    ))}
                </time>
            `;

            doneBox.append(row);
        }

        const empty = $("eventOutputEmpty");

        if (empty) {
            empty.hidden = true;
            empty.style.display = "none";
        }
    };


    
serveEventOrder = async id => {
    if (
        serving.has(id) ||
        !state.currentPerson ||
        !state.currentEvent
    ) {
        return;
    }

    const testMode = isTeacherTestMode();
    const saved = context();

    serving.add(id);

    try {
        if (testMode) {
            const order = (
                state.eventTestOrders[saved.event] || []
            ).find(item => item.id === id);

            if (!order) return;

            order.status = "ausgegeben";
            order.served_at = new Date().toISOString();
        } else {
            await rpc("serve_event_order", {
                p_order_id: id
            });
        }
    } catch (error) {
        console.error(error);
        toast(errorText(error), "error");
    } finally {
        serving.delete(id);

        if (unchanged(saved)) {
            await loadEventOrders();
        }
    }
};


    /* Produits gratuits de l'événement */
    const dialog = $("eventV6Dialog");
    const form = $("eventV6Form");

    dialog.addEventListener("close", () => {
        freeOpen = false;
    });

    dialog.addEventListener("cancel", event => {
        if (freeOpen && busy) event.preventDefault();
    });

    const free = async () => {
        if (!state.currentEvent || !state.currentPerson) return;

        const saved = context();
        const requestId = crypto.randomUUID();

        await loadEventProducts();

        if (!unchanged(saved)) return;

        if (dialog.open) dialog.close();

        freeOpen = true;

        $("eventV6Title").textContent =
            "Gut gemacht heute, Team!";

        $("eventV6Message").textContent = "";
        $("eventV6Save").hidden = false;
        $("eventV6Save").style.display = "";

        $("eventV6Save").textContent = isTeacher()
            ? "Test: Schicht beenden"
            : "Speichern und Schicht beenden";

        $("eventV6Fields").innerHTML = `
            <p>Erfasse hier die kostenlosen Produkte.</p>

            <p class="free-drinks-warning">
                ‼️ Nur du erfasst heute die kostenlosen Produkte
                für das gesamte Team. Bitte schließe dieses
                Fenster erst, wenn du alle kostenlosen Produkte
                des Teams für diese Schicht eingetragen und
                gespeichert hast!
            </p>

            <div
                class="quantity-product-list"
                id="eventFreeProductList"
            ></div>
        `;

        const products = [...state.currentEventProducts];

        for (const product of products) {
            const row = document.createElement("div");

            row.className = "quantity-product-row";
            row.dataset.id = product.id;
            row.dataset.quantity = "0";

            row.innerHTML = `
                <span>${esc(icon(product))}</span>
                <strong>${esc(product.name)}</strong>

                <div class="quantity-control">
                    <button type="button" data-minus>−</button>
                    <span data-value>0</span>
                    <button type="button" data-plus>+</button>
                </div>
            `;

            const update = delta => {
                if (busy) return;

                const quantity = Math.max(
                    0,
                    integer(row.dataset.quantity) + delta
                );

                row.dataset.quantity = String(quantity);

                row.querySelector("[data-value]")
                    .textContent = quantity;
            };

            row.querySelector("[data-minus]").onclick =
                () => update(-1);

            row.querySelector("[data-plus]").onclick =
                () => update(1);

            $("eventFreeProductList").append(row);
        }

        form.onsubmit = async event => {
            event.preventDefault();

            if (busy || !freeOpen) return;

            busy = true;
            $("eventV6Save").disabled = true;

            try {
                if (!unchanged(saved)) {
                    throw Error(
                        "Die Veranstaltung ist nicht mehr geöffnet."
                    );
                }

                const items = $$(
                    "#eventFreeProductList [data-id]"
                )
                    .map(row => ({
                        event_product_id: row.dataset.id,
                        quantity: integer(row.dataset.quantity)
                    }))
                    .filter(item => item.quantity > 0);

                let clients;

                if (isTeacher()) {
                    clients = (
                        state.eventTestOrders[saved.event] || []
                    ).length;
                } else {
                    const summary = await rpc(
                        "finish_event_shift_v7",
                        {
                            p_event_id: saved.event,
                            p_items: items,
                            p_request_id: requestId
                        }
                    );

                    clients = summary.clients;
                }

                dialog.close();

                clearCart(state.eventCart);
                state.eventReceivedCents = 0;
                state.eventPaymentInput = "";

                if (unchanged(saved)) {
                    goHome();

                    toast(
                        isTeacher()
                            ? `Test beendet. ${clients} Testbestellungen.`
                            : `Sehr gut gemacht heute, Team! Wir haben heute ${clients} Kunden bedient. 🎉`,
                        "success"
                    );
                }
            } catch (error) {
                $("eventV6Message").textContent =
                    errorText(error);
            } finally {
                busy = false;
                $("eventV6Save").disabled = false;
            }
        };

        dialog.showModal();
    };


    /* Remplace les anciens handlers des boutons concernés */
    document.addEventListener(
        "click",
        async event => {
            const button = event.target.closest("button");

            if (!button) return;

            const shift = [
                "eventShiftEndButton",
                "eventCashShiftEndButton",
                "eventOutputShiftEndButton",
                "eventSuccessShiftEndButton"
            ].includes(button.id);

            if (button.closest("#eventPaymentKeypad")) {
                event.preventDefault();
                event.stopImmediatePropagation();

                state.eventPaymentInput = euroKeypadNext(
                    state.eventPaymentInput,
                    button.id === "eventDeletePaymentButton"
                        ? "delete"
                        : button.dataset.value
                );

                state.eventReceivedCents = euroKeypadCents(
                    state.eventPaymentInput
                );

                renderEventPayment();
                return;
            }

            if (button.id === "eventPayButton") {
                state.eventPaymentInput = "";
                return;
            }

            if (
                button.id === "eventV6Cancel" &&
                freeOpen &&
                busy
            ) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            if (
                !shift &&
                ![
                    "eventSelectAllDrinksButton",
                    "eventProductsConfirmButton"
                ].includes(button.id)
            ) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            if (busy) return;

            busy = true;
            button.disabled = true;

            const saved = context();

            try {
                if (shift) {
                    await free();
                } else if (
                    button.id === "eventSelectAllDrinksButton"
                ) {
                    await rpc("add_event_drinks_v7", {
                        p_event_id: saved.event
                    });

                    if (unchanged(saved)) {
                        await loadEventProducts();
                    }
                } else if (unchanged(saved)) {
                    await loadEventProducts();
                    await openEventWorkspace(state.currentEvent);
                }
            } catch (error) {
                toast(errorText(error), "error");
            } finally {
                busy = false;
                button.disabled = false;
            }
        },
        true
    );
})();
/* =========================================================
   V8 — PRODUITS SPÉCIFIQUES ET VALIDATION DES STOCKS
   ========================================================= */

(() => {
    let catalog = [];
    let loading = 0;
    let saving = false;
    let editing = null;

    const filters = {
        student: "all",
        teacher: "all"
    };

    const message = error => {
        console.error(error);

        const text = String(error.message || error);

        if (text.includes("stock_changed_reload")) {
            return "Der Bestand hat sich geändert. Bitte neu zählen und erneut senden.";
        }

        if (text.includes("proposal_already_reviewed")) {
            return "Diese Inventur wurde bereits geprüft.";
        }

        if (text.includes("event_stock_archived")) {
            return "Dieses Veranstaltungsprodukt ist bereits abgeschlossen.";
        }

        return "Die Änderung konnte nicht gespeichert werden. " + text;
    };

    const rpc = async (name, args = {}) => {
        const { data, error } = await db.rpc(name, args);

        if (error) throw error;

        return data;
    };

    const qty = input => {
        const raw = String(input.value).trim();

        if (
            !/^\d+$/.test(raw) ||
            Number(raw) > 2147483647
        ) {
            throw Error(
                "Bitte eine ganze Anzahl ab 0 eintragen."
            );
        }

        return Number(raw);
    };

    const choices = [
        ["all", "Alle"],
        ["getränke", "🥤 Getränke"],
        ["bäckerei", "🥨 Bäckerei"],
        ["event", "🎪 Sonderveranstaltung"]
    ];

    const productTabs =
        $("productsScreen").querySelector(".filter-tabs");

    const eventTab = document.createElement("button");

    eventTab.type = "button";
    eventTab.className = "filter-tab";
    eventTab.dataset.productFilter = "event";
    eventTab.textContent = "🎪 Sonderveranstaltung";
    eventTab.hidden = true;

    productTabs.append(eventTab);

    for (const role of ["student", "teacher"]) {
        const list = $(role + "InventoryList");
        const tabs = document.createElement("div");

        tabs.className = "filter-tabs";
        tabs.id = role + "InventoryFiltersV8";

        tabs.innerHTML = choices.map(([value, label]) => `
            <button
                type="button"
                class="filter-tab ${value === "all" ? "active" : ""}"
                data-stock-filter="${value}"
                data-stock-role="${role}"
                ${value === "event" ? "hidden" : ""}
            >
                ${label}
            </button>
        `).join("");

        list.before(tabs);
    }

    const teacherCustom = document.createElement("div");

    teacherCustom.id = "teacherEventStockV8";
    $("teacherInventoryList").after(teacherCustom);

    const refresh = async () => {
        catalog = await rpc("event_stock_catalog_v8");

        const exists = catalog.length > 0;

        eventTab.hidden = !exists;

        if (!exists && productFilter === "event") {
            productFilter = "all";
        }

        for (const role of ["student", "teacher"]) {
            $(role + "InventoryFiltersV8")
                .querySelector('[data-stock-filter="event"]')
                .hidden = !exists;

            if (!exists && filters[role] === "event") {
                filters[role] = "all";
            }
        }
    };

    const applyFilter = role => {
        const value = filters[role];

        $(role + "InventoryFiltersV8")
            .querySelectorAll("button")
            .forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.stockFilter === value
                );
            });

        $(role + "InventoryList")
            .querySelectorAll("[data-stock-category]")
            .forEach(row => {
                row.hidden =
                    value !== "all" &&
                    row.dataset.stockCategory !== value;
            });

        if (role === "teacher") {
            teacherCustom.hidden =
                value !== "all" && value !== "event";

            $("teacherInventoryList")
                .querySelector(".teacher-inventory-heading")
                ?.classList.toggle(
                    "event-v8-hidden",
                    value === "event"
                );
        }
    };

    const productInfo = product => `
        <div class="inventory-product-info">
            <span class="inventory-product-icon">
                ${esc(product.icon || "🍔")}
            </span>

            <div>
                <strong>${esc(product.name)}</strong>

                <small>
                    🎪 ${esc(product.event_name)}
                    · Bestand: ${product.stock_quantity}
                    ${product.closed ? " · Restbestand" : ""}
                </small>
            </div>
        </div>
    `;

    const studentBase = renderStudentInventory;

    renderStudentInventory = async () => {
        const token = ++loading;

        studentBase();

        try {
            await refresh();

            if (token !== loading) return;

            const list = $("studentInventoryList");

            catalog.forEach(product => {
                const row = document.createElement("div");

                row.className = "inventory-count-row";
                row.dataset.stockCategory = "event";
                row.dataset.eventStock = product.id;
                row.dataset.eventId = product.event_id;
                row.dataset.stockVersion = product.stock_version;

                row.innerHTML = productInfo(product) + `
                    <input
                        class="inventory-count-input"
                        data-event-count
                        type="number"
                        min="0"
                        step="1"
                        inputmode="numeric"
                        placeholder="0"
                        aria-label="Gezählter Bestand"
                    >
                `;

                if (product.proposals.length) {
                    row.querySelector("small")
                        .append(" · Bestätigung ausstehend");
                }

                list.append(row);
            });

            applyFilter("student");

        } catch (error) {
            toast(message(error), "error");
        }
    };

    const teacherBase = renderTeacherInventory;

    renderTeacherInventory = async () => {
        await teacherBase();

        if (!isTeacher()) return;

        try {
            await refresh();

            teacherCustom.innerHTML = catalog.map(product => `
                <section class="event-stock-card-v8">
                    ${productInfo(product)}

                    ${product.proposals.map(proposal => `
                        <div class="event-stock-review-v8">
                            <span>
                                ${
                                    proposal.kind === "addition"
                                        ? "Zusätzlicher Bestand"
                                        : "Gezählter Bestand"
                                }:
                                <strong>${proposal.quantity}</strong>
                                · ${esc(proposal.author_name)}
                                · ${dateDE(proposal.submitted_at)}
                            </span>

                            <div>
                                <button
                                    type="button"
                                    class="primary-action"
                                    data-event-review="${proposal.id}"
                                >
                                    Bestätigen
                                </button>

                                <button
                                    type="button"
                                    class="secondary-action"
                                    data-event-reject="${proposal.id}"
                                >
                                    Ablehnen
                                </button>
                            </div>
                        </div>
                    `).join("")}

                                        <div class="teacher-stock-form event-stock-entry-v9">
                        <input
                            data-teacher-count="${product.id}"
                            type="number"
                            min="${product.closed ? 0 : 1}"
                            step="1"
                            inputmode="numeric"
                            placeholder="Menge"
                            aria-label="${
                                product.closed
                                    ? 'Gezählter Restbestand'
                                    : 'Zusätzliche Menge'
                            }"
                            ${product.proposals.length ? "disabled" : ""}
                        >

                        <input
                            data-teacher-cost="${product.id}"
                            type="text"
                            inputmode="decimal"
                            placeholder="EK optional"
                            aria-label="Einkaufspreis pro Stück, optional"
                            ${product.proposals.length ? "disabled" : ""}
                        >

                        <button
                            type="button"
                            class="primary-action teacher-action-add"
                            data-teacher-propose="${product.id}"
                            ${product.proposals.length ? "disabled" : ""}
                        >
                            ${
                                product.closed
                                    ? "Bestand bestätigen"
                                    : "+ Bestand"
                            }
                        </button>
                    </div>
                </section>
            `).join("");

            $("teacherInventoryList").append(teacherCustom);

            applyFilter("teacher");

        } catch (error) {
            toast(message(error), "error");
        }
    };

    const productsBase = renderProductsAdmin;

    renderProductsAdmin = async () => {
        await productsBase();

        try {
            await refresh();

            if (
                productFilter === "all" &&
                !$("productAdminList").children.length
            ) {
                await productsBase();
            }

            productTabs.querySelectorAll("button")
                .forEach(button => {
                    button.classList.toggle(
                        "active",
                        button.dataset.productFilter === productFilter
                    );
                });

            $("productAdminList")
                .querySelectorAll("[data-event-admin]")
                .forEach(row => row.remove());

                        if (
                productFilter !== "all" &&
                productFilter !== "event"
            ) {
                return;
            }

            if (catalog.length > 0) {
                $("productAdminList")
                    .querySelectorAll(":scope > p")
                    .forEach(element => {
                        if (
                            element.textContent.trim() ===
                            "Keine Produkte in diesem Bereich."
                        ) {
                            element.remove();
                        }
                    });
            }

            catalog.forEach(product => {
                const row = document.createElement("div");

                row.className = "product-admin-item";
                row.dataset.eventAdmin = product.id;

                row.innerHTML = `
                    <div class="product-admin-row">
                        ${productInfo(product)}

                        <div class="product-admin-actions">
                            <button
                                type="button"
                                class="secondary-action"
                                data-event-edit-v8="${product.id}"
                            >
                                ${
                                    product.closed
                                        ? "Inventur"
                                        : "Bearbeiten"
                                }
                            </button>
                        </div>
                    </div>
                `;

                $("productAdminList").append(row);
            });

        } catch (error) {
            toast(message(error), "error");
        }
    };

    const editor = document.createElement("dialog");

    editor.className = "event-v6-dialog";
    editor.id = "eventProductEditorV8";

    editor.innerHTML = `
        <form>
            <h2>Veranstaltungsprodukt bearbeiten</h2>

            <label class="form-field">
                Name
                <input name="name" required>
            </label>

            <label class="form-field">
                Normalpreis (€)
                <input name="price" required inputmode="decimal">
            </label>

            <label class="form-field">
                Symbol
                <input name="icon" required>
            </label>

            <label class="form-field">
                Zusätzliche Menge
                <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value="0"
                >
            </label>

            <p>
                Der Bestand eines Schülers wird erst nach
                Bestätigung durch den Lehrer übernommen.
            </p>

            <p class="form-message" role="alert"></p>

            <div class="modal-actions">
                <button
                    type="button"
                    class="secondary-action"
                    data-close-v8
                >
                    Schließen
                </button>

                <button
                    type="submit"
                    class="primary-action"
                >
                    Speichern
                </button>
            </div>
        </form>
    `;

    document.body.append(editor);

    editor.querySelector("[data-close-v8]").onclick = () => {
        if (!saving) editor.close();
    };

    editor.addEventListener("cancel", event => {
        if (saving) event.preventDefault();
    });

    editor.querySelector("form").onsubmit = async event => {
        event.preventDefault();

        if (saving || !editing) return;

        saving = true;

        const form = event.currentTarget;
        const button = form.querySelector('[type="submit"]');

        button.disabled = true;

        try {
            const price = String(form.elements.price.value)
                .trim()
                .replace(",", ".");

            if (
                !/^\d+(\.\d{1,2})?$/.test(price) ||
                Number(price) <= 0
            ) {
                throw Error("Bitte einen gültigen Preis eingeben.");
            }

            await rpc("save_event_product_v6", {
                p_event_id: editing.event_id,
                p_event_product_id: editing.id,
                p_product_id: null,
                p_name: form.elements.name.value.trim(),
                p_price: Number(price),
                p_icon: form.elements.icon.value.trim(),
                p_add_stock: qty(form.elements.stock)
            });

            editor.close();

            await renderProductsAdmin();

            if (state.currentEvent?.id === editing.event_id) {
                await loadEventProducts();
            }

            toast(
                "Produkt gespeichert. Schüler-Bestände warten auf Bestätigung.",
                "success"
            );

        } catch (error) {
            form.querySelector(".form-message").textContent =
                message(error);

        } finally {
            saving = false;
            button.disabled = false;
        }
    };

    document.addEventListener("click", async event => {
        const target = event.target.closest("button");

        if (!target) return;

        const stockFilter = target.dataset.stockFilter;
        const productChoice = target.dataset.productFilter;

        const submit =
            target.id === "submitStudentInventoryButton";

        const review =
            target.dataset.eventReview ||
            target.dataset.eventReject;

        const proposal = target.dataset.teacherPropose;
        const edit = target.dataset.eventEditV8;

        if (
            stockFilter === undefined &&
            productChoice === undefined &&
            !submit &&
            !review &&
            !proposal &&
            !edit
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (saving) return;

        if (stockFilter !== undefined) {
            filters[target.dataset.stockRole] = stockFilter;
            applyFilter(target.dataset.stockRole);
            return;
        }

        if (productChoice !== undefined) {
            productFilter = productChoice;
            await renderProductsAdmin();
            return;
        }

        if (edit) {
            editing = catalog.find(product => product.id === edit);

            if (!editing) return;

            if (editing.closed) {
                if (isTeacher()) {
                    await renderTeacherInventory();
                    showScreen("teacherInventoryScreen");
                    filters.teacher = "event";
                    applyFilter("teacher");
                } else {
                    await renderStudentInventory();
                    showScreen("studentInventoryScreen");
                    filters.student = "event";
                    applyFilter("student");
                }

                return;
            }

            const form = editor.querySelector("form");

            form.reset();

            form.elements.name.value = editing.name;

            form.elements.price.value =
                String(editing.price).replace(".", ",");

            form.elements.icon.value = editing.icon || "🍔";
            form.querySelector(".form-message").textContent = "";

            editor.showModal();
            return;
        }

        saving = true;
        target.disabled = true;

        try {
            if (submit) {
                const regular = [];
                const custom = [];

                $("studentInventoryList")
                    .querySelectorAll("[data-product-id]")
                    .forEach(row => {
                        const input =
                            row.querySelector("[data-inventory-count]");

                        if (input.value.trim() !== "") {
                            regular.push({
                                product_id: row.dataset.productId,
                                quantity: qty(input)
                            });
                        }
                    });

                $("studentInventoryList")
                    .querySelectorAll("[data-event-stock]")
                    .forEach(row => {
                        const input =
                            row.querySelector("[data-event-count]");

                        if (input.value.trim() !== "") {
                            custom.push({
                                id: row.dataset.eventStock,
                                event_id: row.dataset.eventId,
                                quantity: qty(input),
                                version: row.dataset.stockVersion
                            });
                        }
                    });

                if (!regular.length && !custom.length) {
                    throw Error(
                        "Bitte mindestens einen Bestand eintragen."
                    );
                }

                await rpc("submit_inventory_v8", {
                    p_regular: regular,
                    p_custom: custom
                });

                $("studentInventoryMessage").textContent =
                    "Inventur wurde an den Lehrer geschickt.";

                await renderStudentInventory();

                toast("Inventur gesendet.", "success");

            } else if (review) {
                await rpc("review_event_stock_v8", {
                    p_id: review,
                    p_accept: !!target.dataset.eventReview
                });

                await renderTeacherInventory();

                if (state.currentEvent) {
                    await loadEventProducts();
                }

                toast("Inventur geprüft.", "success");

                        } else if (proposal) {
                const product = catalog.find(
                    product => product.id === proposal
                );

                const input = teacherCustom.querySelector(
                    `[data-teacher-count="${proposal}"]`
                );

                const costInput = teacherCustom.querySelector(
                    `[data-teacher-cost="${proposal}"]`
                );

                const rawCost = costInput.value
                    .trim()
                    .replace(",", ".");

                let purchasePrice = null;

                if (rawCost !== "") {
                    if (!/^\d+(\.\d{1,2})?$/.test(rawCost)) {
                        throw Error(
                            "Bitte einen gültigen Einkaufspreis eingeben, z. B. 0,50."
                        );
                    }

                    purchasePrice = Number(rawCost);
                }

                const quantity = qty(input);

                if (!product.closed && quantity === 0) {
                    throw Error(
                        "Bitte eine Menge größer als 0 eintragen."
                    );
                }

                await rpc("teacher_event_stock_v9", {
                    p_product: product.id,
                    p_quantity: quantity,
                    p_version: product.stock_version,
                    p_purchase_price: purchasePrice
                });

                await renderTeacherInventory();

                if (
                    state.currentEvent?.id === product.event_id
                ) {
                    await loadEventProducts();
                }

                toast(
                    product.closed
                        ? "Restbestand bestätigt."
                        : "Bestand aktualisiert.",
                    "success"
                );
            }
        } catch (error) {
            toast(message(error), "error");

        } finally {
            saving = false;
            target.disabled = false;
        }
    }, true);
})();
/* Feierabend : permettre de changer de profil */

(() => {
    const screen = $("schoolClosedScreen");

    if (!screen || $("changeProfileClosedButton")) return;

    const button = document.createElement("button");

    button.id = "changeProfileClosedButton";
    button.type = "button";
    button.className = "primary-action";
    button.textContent = "Profil wechseln";
    button.style.marginTop = "20px";

    const message = document.createElement("p");
    message.className = "form-message";
    message.setAttribute("role", "alert");

    const container =
        screen.querySelector(".school-closed-card") || screen;

    container.append(button, message);

    button.addEventListener("click", async () => {
        if (button.disabled) return;

        button.disabled = true;
        message.textContent = "";

        try {
            const { error } = await db.auth.signOut({
                scope: "local"
            });

            if (error) throw error;

            state.currentPerson = null;
            state.selectedLoginPerson = null;
            state.studentAccessAllowed = false;

            if (state.realtimeChannel) {
                const channel = state.realtimeChannel;
                state.realtimeChannel = null;

                await db.removeChannel(channel);
            }

            applyRoleUI();

            showScreen("identityScreen", {
                login: true,
                historyMode: "replace"
            });

            await loadLoginPeople();

        } catch (error) {
            console.error("Profilwechsel:", error);

            message.textContent =
                "Profilwechsel fehlgeschlagen. Bitte erneut versuchen.";

        } finally {
            button.disabled = false;
        }
    });
})();
/* Calcul automatique : prix du lot / unités du lot */

function updateProductUnitCostPreview() {
    const output = $("productUnitCostInput");

    if (!output) return;

    const units = Number(
        $("productIanUnitsInput")?.value
    );

    const rawPrice = String(
        $("productPurchasePriceInput")?.value || ""
    ).trim().replace(/\s|€/g, "");

    if (
        !Number.isInteger(units) ||
        units < 1 ||
        !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/
            .test(rawPrice)
    ) {
        output.value = "";
        return;
    }

    const packPrice = parseMoney(rawPrice);

    if (!Number.isFinite(packPrice) || packPrice < 0) {
        output.value = "";
        return;
    }

    output.value =
        (packPrice / units).toFixed(2).replace(".", ",") +
        " €";
}

[
    "productIanUnitsInput",
    "productPurchasePriceInput"
].forEach(id => {
    $(id)?.addEventListener(
        "input",
        updateProductUnitCostPreview
    );
});
/* =========================================================
   BERICHTE V1 — ERGEBNISSE UND BESTAND
   ========================================================= */

(() => {
    const DAY = 86400000;

    const S = {
        tab: "results",
        period: "day",
        metric: "revenue",
        rank: "quantity",
        days: 30,
        data: null,
        selected: new Set(),
        generation: 0
    };

    const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    });

    const wall = value => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
            return Date.parse(value + "T00:00:00Z");
        }

        const p = Object.fromEntries(
            fmt.formatToParts(new Date(value))
                .map(x => [x.type, x.value])
        );

        return Date.UTC(
            +p.year, +p.month - 1, +p.day,
            +p.hour, +p.minute, +p.second
        );
    };

    const key = t =>
        new Date(t).toISOString().slice(0, 10);

    const month = (t, n = 0) => {
        const d = new Date(t);

        return Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth() + n,
            1
        );
    };

    const year = t => {
        const d = new Date(t);

        return Date.UTC(
            d.getUTCFullYear() - (d.getUTCMonth() < 8 ? 1 : 0),
            8,
            1
        );
    };

    const windowFor = (period, t) => {
        const day = Math.floor(t / DAY) * DAY;

        if (period === "day") {
            return [day, day + DAY, day - DAY];
        }

        if (period === "week") {
            const a = day -
                ((new Date(day).getUTCDay() + 6) % 7) * DAY;

            return [a, a + 7 * DAY, a - 7 * DAY];
        }

        if (period === "month") {
            return [month(t), month(t, 1), month(t, -1)];
        }

        const a = year(t);
        const d = new Date(a);

        return [
            a,
            Date.UTC(d.getUTCFullYear() + 1, 8, 1),
            Date.UTC(d.getUTCFullYear() - 1, 8, 1)
        ];
    };

    const buckets = (period, t) => {
        const [a] = windowFor(period, t);

        return Array.from({ length: 12 }, (_, i) => {
            const start =
                period === "schoolyear"
                    ? month(a, i)
                    : period === "month"
                        ? month(a, i - 11)
                        : a + (i - 11) *
                          (period === "week" ? 7 : 1) * DAY;

            const end =
                period === "month" || period === "schoolyear"
                    ? month(start, 1)
                    : start + (period === "week" ? 7 : 1) * DAY;

            return { start, end };
        });
    };

    const saleKey = r =>
        r.product_id
            ? "product:" + r.product_id
            : r.event_product_id
                ? "event:" + r.event_product_id
                : "other:" + r.product_name;

    const between = (rows, a, b) =>
        rows.filter(r => r.t >= a && r.t < b);

    const sum = (rows, field) =>
        rows.reduce(
            (total, row) => total + Number(row[field] || 0),
            0
        );

    const stats = (data, a, b) => {
        const lines = between(data.sales, a, b);
        const free = between(data.free, a, b);
        const direct = between(data.other_events, a, b);

        return {
            lines,

            revenue:
                sum(lines, "revenue") +
                sum(direct, "amount"),

            profit: lines.some(r => r.estimated_profit == null)
                ? null
                : sum(lines, "estimated_profit"),

            tickets: new Set(
                lines.map(r => r.order_id || r.event_order_id)
                    .filter(Boolean)
            ).size,

            drinks: sum(
                lines.filter(r => r.area === "getränke"),
                "quantity"
            ),

            bakery: sum(
                lines.filter(r => r.area === "bäckerei"),
                "quantity"
            ),

            expenses: sum(
                between(data.expenses, a, b),
                "amount"
            ),

            other: sum(
                between(data.ledger, a, b)
                    .filter(r => r.kind === "other"),
                "amount"
            ),

            free: sum(free, "quantity"),

            freeCost: free.some(r => r.purchase_price == null)
                ? null
                : free.reduce(
                    (total, r) =>
                        total +
                        Number(r.quantity) *
                        Number(r.purchase_price),
                    0
                )
        };
    };

    const amount = n => n == null ? "—" : money(n);

    const int = n => new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 0
    }).format(n);

    const label = t => new Intl.DateTimeFormat("de-DE", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit"
    }).format(new Date(t));

    const shortMonth = t => new Intl.DateTimeFormat("de-DE", {
        timeZone: "UTC",
        month: "short",
        year: "2-digit"
    }).format(new Date(t));

    const comparison = (current, previous, euros = false) => {
        if (current == null || previous == null) {
            return "Vergleich nicht verfügbar";
        }

        const delta = current - previous;

        if (!delta) return "Unverändert zur Vorperiode";

        if (previous <= 0) {
            return (delta > 0 ? "+" : "") +
                (euros ? money(delta) : int(delta)) +
                " zur Vorperiode";
        }

        const p = delta / previous * 100;

        return (p > 0 ? "+" : "") +
            p.toLocaleString("de-DE", {
                maximumFractionDigits: 1
            }) +
            " % zur Vorperiode";
    };

    const root = $("reportsScreen");

    if (!root) return;

    root.innerHTML = `
        <header class="screen-header">
            <button
                type="button"
                class="back-button"
                data-r1-home
            >← Startseite</button>

            <h1>📊 Berichte</h1>
        </header>

        <section class="r1-content">
            <div class="r1-toolbar">
                <nav class="r1-tabs" aria-label="Berichte">
                    <button
                        type="button"
                        data-r1-tab="results"
                        class="active"
                    >Ergebnisse</button>

                    <button
                        type="button"
                        data-r1-tab="stock"
                    >Bestand</button>
                </nav>

                <div class="r1-actions">
                    <button
                        type="button"
                        class="secondary-action"
                        data-r1-refresh
                    >Aktualisieren</button>

                    <button
                        type="button"
                        class="secondary-action"
                        data-r1-export
                    >Exportieren</button>
                </div>
            </div>

            <p id="r1Status" role="status"></p>

            <section id="r1Results">
                <div
                    class="r1-tabs r1-periods"
                    aria-label="Zeitraum"
                >
                    ${[
                        ["day", "Tag"],
                        ["week", "Woche"],
                        ["month", "Monat"],
                        ["schoolyear", "Schuljahr"]
                    ].map(([value, text]) => `
                        <button
                            type="button"
                            data-r1-period="${value}"
                            class="${value === "day" ? "active" : ""}"
                        >${text}</button>
                    `).join("")}
                </div>

                <p id="r1PeriodLabel" class="r1-muted"></p>

                <div class="r1-result-top">
                    <article class="r1-card">
                        <div class="r1-heading">
                            <h2>Entwicklung</h2>

                            <div class="r1-tabs">
                                <button
                                    type="button"
                                    data-r1-metric="revenue"
                                    class="active"
                                >Umsatz</button>

                                <button
                                    type="button"
                                    data-r1-metric="profit"
                                >Gewinn</button>
                            </div>
                        </div>

                        <div id="r1Bars"></div>

                        <p class="r1-muted">
                            Die letzte begonnene Periode ist noch
                            nicht vollständig. Schuljahr:
                            September bis August.
                        </p>
                    </article>

                    <article class="r1-card">
                        <div class="r1-heading">
                            <h2>Top 3</h2>

                            <select
                                id="r1Rank"
                                aria-label="Rangliste"
                            >
                                <option value="quantity">
                                    Nach verkaufter Menge
                                </option>
                                <option value="revenue">
                                    Nach Umsatz
                                </option>
                            </select>
                        </div>

                        <div id="r1Podium"></div>
                    </article>
                </div>

                <div id="r1Kpis" class="r1-kpis"></div>

                <p class="r1-muted">
                    Gewinn = geschätzter Verkaufsgewinn aus
                    Produktverkäufen. Fehlende Einkaufspreise
                    werden nicht als 0 € behandelt.
                    Einkaufsausgaben, kostenlose Getränke und
                    sonstige Einnahmen werden separat ausgewiesen.
                    Der Umsatz enthält auch abgeschlossene
                    Veranstaltungen mit direkt erfasstem Umsatz.
                    Getränkeeinkäufe ohne Pfand.
                </p>

                <article class="r1-card">
                    <h2>Produkte</h2>

                    <div class="r1-scroll">
                        <table class="r1-table">
                            <thead>
                                <tr>
                                    <th>Produkt</th>
                                    <th>Verkaufte Menge</th>
                                    <th>Aktueller Bestand</th>
                                    <th>Umsatz</th>
                                    <th>Gewinn*</th>
                                </tr>
                            </thead>
                            <tbody id="r1ProductRows"></tbody>
                        </table>
                    </div>

                    <p class="r1-muted">
                        * Geschätzt. Bestand: aktueller Wert,
                        unabhängig vom gewählten Zeitraum.
                    </p>
                </article>

                <article class="r1-card">
                    <h2>Inventurdifferenzen</h2>

                    <p class="r1-muted">
                        Reguläre Produkte · bestätigte Zählungen ·
                        maximal 100 Einträge. Eine Abweichung ist
                        kein Nachweis für einen Fehler einer
                        bestimmten Person.
                    </p>

                    <div class="r1-scroll">
                        <table class="r1-table">
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Produkt</th>
                                    <th>Vorheriger Bestand</th>
                                    <th>Gezählt</th>
                                    <th>Abweichung</th>
                                </tr>
                            </thead>
                            <tbody id="r1DifferenceRows"></tbody>
                        </table>
                    </div>
                </article>
            </section>

            <section id="r1Stock" hidden>
                <h2>Aktuelle Bestände</h2>

                <p class="r1-muted">
                    Zielbestand und Mindestbestand können pro
                    Produkt angepasst werden.
                    Anfangswerte: 30 und 5 Stück.
                </p>

                <div id="r1Gauges" class="r1-gauges"></div>

                <article class="r1-card">
                    <div class="r1-heading">
                        <h2>Bestandsentwicklung</h2>

                        <div class="r1-actions">
                            <select
                                id="r1StockDays"
                                aria-label="Zeitraum der Bestandsentwicklung"
                            >
                                <option value="30">Letzte 30 Tage</option>
                                <option value="90">Letzte 90 Tage</option>
                                <option value="365">Letzte 365 Tage</option>
                            </select>

                            <details class="r1-picker">
                                <summary>Produkte auswählen</summary>
                                <div id="r1StockChoices"></div>
                            </details>
                        </div>
                    </div>

                    <div id="r1StockChart"></div>
                    <div id="r1StockLegend" class="r1-legend"></div>

                    <p class="r1-muted">
                        Die Aufzeichnung beginnt mit der Einrichtung
                        dieser Ansicht. Frühere Bestände werden
                        nicht geschätzt. Werte ohne Änderung
                        werden fortgeführt.
                    </p>
                </article>
            </section>
        </section>
    `;

       /* Onglets Ergebnisse / Bestand */

    const reportTabs =
        root.querySelector('nav[aria-label="Berichte"]');

    reportTabs.setAttribute("role", "tablist");

    reportTabs.querySelectorAll("button").forEach(button => {
        const results = button.dataset.r1Tab === "results";

        button.id = "r2-tab-" + button.dataset.r1Tab;
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(results));

        button.setAttribute(
            "aria-controls",
            results ? "r1Results" : "r1Stock"
        );

        button.addEventListener("click", () => {
            reportTabs.querySelectorAll("button").forEach(b => {
                b.setAttribute(
                    "aria-selected",
                    String(b === button)
                );
            });
        });
    });

    [
        ["r1Results", "results"],
        ["r1Stock", "stock"]
    ].forEach(([id, tab]) => {
        $(id).setAttribute("role", "tabpanel");

        $(id).setAttribute(
            "aria-labelledby",
            "r2-tab-" + tab
        );
    });

    reportTabs.addEventListener("keydown", event => {
        if (
            !["ArrowLeft", "ArrowRight"].includes(event.key)
        ) return;

        event.preventDefault();

        const buttons = [
            ...reportTabs.querySelectorAll("button")
        ];

        const i = buttons.indexOf(document.activeElement);

        const next =
            buttons[(i + 1 + buttons.length) % buttons.length];

        next.focus();
        next.click();
    });

    /* Même menu déroulant que le Top 3 */

    root.querySelector(
        '[data-r1-metric="revenue"]'
    ).parentElement.outerHTML = `
        <select
            id="r2Metric"
            aria-label="Kennzahl des Diagramms"
        >
            <option value="revenue">Umsatz</option>
            <option value="profit">Gewinn</option>
        </select>
    `;

    /* Inventurdifferenzen sous le graphique de stock */

    const differenceCard =
        $("r1DifferenceRows").closest(".r1-card");

    differenceCard.querySelector("h2").insertAdjacentHTML(
        "afterend",
        '<p id="r2DifferencePeriod" class="r1-muted"></p>'
    );

    $("r1Stock").append(differenceCard);
    const productTotals = () => {
        const d = S.data;
        const n = wall(d.now);
        const [a] = windowFor(S.period, n);
        const current = stats(d, a, n);

        const map = new Map(
            d.products.filter(p => p.active).map(p => [
                p.key,
                {
                    ...p,
                    sold: 0,
                    revenue: 0,
                    profit: 0,
                    unknown: false
                }
            ])
        );

        current.lines.forEach(r => {
            const k = saleKey(r);

            if (!map.has(k)) {
                const p = d.products.find(p => p.key === k);

                map.set(k, {
                    ...p,
                    key: k,
                    name: p?.name || r.product_name,
                    icon: p?.icon || "📦",
                    quantity: p?.quantity ?? null,
                    sold: 0,
                    revenue: 0,
                    profit: 0,
                    unknown: false
                });
            }

            const p = map.get(k);

            p.sold += Number(r.quantity);
            p.revenue += Number(r.revenue);
            p.profit += Number(r.estimated_profit || 0);
            p.unknown ||= r.estimated_profit == null;
        });

        return [...map.values()].sort(
            (a, b) =>
                b.sold - a.sold ||
                a.name.localeCompare(b.name, "de")
        );
    };

        const drawBars = () => {
        const n = wall(S.data.now);
        const bs = buckets(S.period, n);

        const values = bs.map(b =>
            b.start >= n
                ? null
                : stats(
                    S.data,
                    b.start,
                    Math.min(b.end, n)
                )[S.metric]
        );

        const known = values.filter(v => v != null);

        const low = Math.min(0, ...known);
        const high = Math.max(1, ...known);

        const y = v =>
            25 + (high - v) / (high - low) * 180;

        const zero = y(0);

        const numberLabel = value =>
            Number(value).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        $("r1Bars").innerHTML = `
            <svg
                viewBox="0 0 760 270"
                role="img"
                aria-label="${
                    S.metric === "revenue"
                        ? "Umsatz"
                        : "Geschätzter Verkaufsgewinn"
                } der zwölf Perioden"
            >
                <text
                    x="12"
                    y="14"
                    font-size="11"
                    fill="#094369"
                >Werte in €</text>

                <line
                    x1="12"
                    x2="750"
                    y1="${zero}"
                    y2="${zero}"
                    stroke="#dce6f0"
                />

                ${bs.map((b, i) => {
                    const x = 17 + i * 61;

                    const caption =
                        S.period === "month" ||
                        S.period === "schoolyear"
                            ? shortMonth(b.start)
                            : label(b.start);

                    const axis = `
                        <text
                            x="${x + 25}"
                            y="247"
                            text-anchor="middle"
                            font-size="11"
                            fill="#094369"
                        >${esc(caption)}</text>
                    `;

                    if (values[i] == null) {
                        return `
                            <text
                                x="${x + 25}"
                                y="${zero - 8}"
                                text-anchor="middle"
                                fill="#094369"
                            >—</text>

                            ${axis}
                        `;
                    }

                    const value = values[i];

                    const top = Math.min(y(value), zero);

                    const height = Math.max(
                        Math.abs(y(value) - zero),
                        2
                    );

                    const running = b.end > n;

                    const fill = running
                        ? "#5371fd"
                        : "#094369";

                    const small = height < 24;

                    const badgeY = value >= 0
                        ? top - 23
                        : top + height + 4;

                    const textY = small
                        ? badgeY + 13
                        : top + height / 2 + 3;

                    const text = numberLabel(value);

                    return `
                        <rect
                            x="${x}"
                            y="${top}"
                            width="50"
                            height="${height}"
                            rx="5"
                            fill="${fill}"
                        >
                            <title>
                                ${esc(caption)}:
                                ${esc(money(value))}
                                ${running ? " · laufend" : ""}
                            </title>
                        </rect>

                        ${small ? `
                            <rect
                                x="${x}"
                                y="${badgeY}"
                                width="50"
                                height="18"
                                rx="6"
                                fill="${fill}"
                            />
                        ` : ""}

                        <text
                            class="r2-bar-value"
                            x="${x + 25}"
                            y="${textY}"
                            text-anchor="middle"
                            font-size="${text.length > 9 ? 8 : 10}"
                            font-weight="700"
                            fill="white"
                        >${esc(text)}</text>

                        ${axis}

                        ${running ? `
                            <text
                                x="${x + 25}"
                                y="262"
                                text-anchor="middle"
                                font-size="9"
                                fill="#094369"
                            >laufend</text>
                        ` : ""}
                    `;
                }).join("")}
            </svg>
        `;
    };

    const renderResults = () => {
        const d = S.data;
        const n = wall(d.now);
        const [a, end, previousStart] = windowFor(S.period, n);

        const previousEnd = Math.min(
            a,
            previousStart + (n - a)
        );

        const current = stats(d, a, n);
        const previous = stats(d, previousStart, previousEnd);

        $("r1PeriodLabel").textContent =
            label(a) + " – " + label(n) +
            " · Vergleich bis zum entsprechenden Zeitpunkt der Vorperiode";

        const cards = [
            ["Umsatz", "revenue", true],
            ["Geschätzter Verkaufsgewinn", "profit", true],
            ["Verkäufe / Kassenbons", "tickets", false],
            ["Verkaufte Getränke", "drinks", false],
            ["Verkaufte Backwaren", "bakery", false],
            ["Ausgaben für Getränkeeinkäufe", "expenses", true],
            ["Sonstige Einnahmen", "other", true],
            ["Kostenlose Getränke", "free", false]
        ];

                $("r2DifferencePeriod").textContent =
            "Zeitraum: " + $("r1PeriodLabel").textContent;

        $("r1Kpis").innerHTML = cards.map(
            ([title, k, euros]) => {
                const text = comparison(
                    current[k],
                    previous[k],
                    euros
                );

                const valid =
                    current[k] != null &&
                    previous[k] != null;

                const delta = valid
                    ? current[k] - previous[k]
                    : 0;

                const color = delta > 0
                    ? "#05a85a"
                    : delta < 0
                        ? "#fa4343"
                        : "#64748b";

                const suffix = " zur Vorperiode";

                const comparisonHtml =
                    valid &&
                    delta !== 0 &&
                    text.endsWith(suffix)
                        ? `
                            <strong style="color:${color}">
                                ${esc(
                                    text.slice(0, -suffix.length)
                                )}
                            </strong>
                            zur Vorperiode
                        `
                        : esc(text);

                return `
                    <div class="r2-kpi-wrap">
                        <article
                            class="r1-kpi ${
                                k === "free" ? "r2-orange" : ""
                            }"
                        >
                            <span>${title}</span>

                            <strong>
                                ${
                                    euros
                                        ? amount(current[k])
                                        : int(current[k])
                                }
                            </strong>

                            ${k === "free" ? `
                                <small>
                                    Geschätzter Einkaufspreis:
                                    ${amount(current.freeCost)}
                                </small>
                            ` : ""}
                        </article>

                        <p class="r2-comparison">
                            ${comparisonHtml}
                        </p>
                    </div>
                `;
            }
        ).join("");

        const products = productTotals();

        const top = products
            .filter(p => p.sold > 0)
            .sort((a, b) =>
                b[S.rank === "quantity" ? "sold" : "revenue"] -
                a[S.rank === "quantity" ? "sold" : "revenue"]
            )
            .slice(0, 3);

        $("r1Podium").innerHTML = top.length
            ? top.map((p, i) => `
                <div class="r1-winner">
                    <span class="r1-medal">
                        ${["🥇", "🥈", "🥉"][i]}
                    </span>

                    <span class="r1-product-icon">
                        ${esc(p.icon || "📦")}
                    </span>

                    <div>
                        <strong>${esc(p.name)}</strong>
                        <small>
                            ${
                                S.rank === "quantity"
                                    ? int(p.sold) + " Stück"
                                    : money(p.revenue)
                            }
                        </small>
                    </div>
                </div>
            `).join("")
            : `<p class="r1-muted">
                Noch keine Verkäufe in diesem Zeitraum.
               </p>`;

        $("r1ProductRows").innerHTML = products.length
            ? products.map(p => `
                <tr>
                    <td>${esc(p.icon || "📦")} ${esc(p.name)}</td>
                    <td>${int(p.sold)}</td>
                    <td>${p.quantity == null ? "—" : int(p.quantity)}</td>
                    <td>${money(p.revenue)}</td>
                    <td>${
    ["bäckerei", "bakery"].includes(
        String(p.area || "").toLowerCase()
    )
        ? "—"
        : p.unknown
            ? "—"
            : money(p.profit)
}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5">Keine Produkte vorhanden.</td></tr>`;

        const differences = between(d.differences, a, n);

        $("r1DifferenceRows").innerHTML = differences.length
            ? differences.map(r => `
                <tr>
                                        <td data-sort-value="${r.t}">
                        ${label(r.t)}
                    </td>
                    <td>${esc(r.product_name)}</td>
                    <td>${int(r.inventory_before)}</td>
                    <td>${int(r.quantity)}</td>
                    <td>
                        ${r.difference > 0 ? "+" : ""}${int(r.difference)}
                    </td>
                </tr>
            `).join("")
            : `<tr><td colspan="5">
                Keine bestätigten Zählabweichungen in diesem Zeitraum.
               </td></tr>`;

        drawBars();
    };
    const stockProducts = () =>
        S.data.products.filter(product =>
            product.active &&
            [
                "getränke",
                "sonderveranstaltung"
            ].includes(product.area)
        );
    const colors = [
        "#5371fd", "#0f9f84", "#e0a42e", "#e05c70",
        "#094369", "#968032", "#457b9d", "#a660b4"
    ];

        /* Courbe arrondie sans dépassement entre deux valeurs */

    const smoothStockPath = points => {
        if (!points.length) return "";

        if (points.length === 1) {
            return `M ${points[0].x} ${points[0].y}`;
        }

        const slopes = points.slice(1).map((p, i) =>
            (p.y - points[i].y) /
            (p.x - points[i].x)
        );

        const tangents = points.map((p, i) => {
            if (!i) return slopes[0];

            if (i === points.length - 1) {
                return slopes[slopes.length - 1];
            }

            if (slopes[i - 1] * slopes[i] <= 0) {
                return 0;
            }

            return (
                2 * slopes[i - 1] * slopes[i] /
                (slopes[i - 1] + slopes[i])
            );
        });

        slopes.forEach((slope, i) => {
            if (!slope) {
                tangents[i] = 0;
                tangents[i + 1] = 0;
                return;
            }

            const norm = Math.hypot(
                tangents[i] / slope,
                tangents[i + 1] / slope
            );

            if (norm > 3) {
                tangents[i] *= 3 / norm;
                tangents[i + 1] *= 3 / norm;
            }
        });

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i];
            const b = points[i + 1];
            const dx = (b.x - a.x) / 3;

            path += `
                C ${a.x + dx} ${a.y + dx * tangents[i]},
                  ${b.x - dx} ${b.y - dx * tangents[i + 1]},
                  ${b.x} ${b.y}
            `;
        }

        return path;
    };

    const drawStock = () => {
        const n = wall(S.data.now);

        const last = Math.floor(n / DAY) * DAY;
        const start = last - (S.days - 1) * DAY;

                const products = stockProducts().filter(
            p => S.selected.has(p.key)
        );

        const series = products.map(product => {
            const history = S.data.history
                .filter(h => h.product_key === product.key)
                .sort(
                    (a, b) =>
                        a.t - b.t ||
                        Number(a.id) - Number(b.id)
                );

            let j = 0;
            let value = null;

            const points = Array.from(
                { length: S.days },
                (_, i) => {
                    const t = start + i * DAY;

                    while (
                        j < history.length &&
                        history[j].t < Math.min(t + DAY, n)
                    ) {
                        value = Number(
                            history[j++].quantity
                        );
                    }

                    return { t, value };
                }
            );

            return {
                product,
                points
            };
        });

        const max = Math.max(
            1,
            ...series.flatMap(s =>
                s.points.map(p => p.value || 0)
            )
        );

        const x = t =>
            58 + (t - start) /
            (Math.max(S.days - 1, 1) * DAY) * 680;

        const y = value =>
            200 - value / max * 175;

        const colorFor = i =>
            colors[i] ||
            `hsl(${(i * 137.5) % 360} 55% 42%)`;

        $("r1StockChart").innerHTML = products.length
            ? `
                <svg
                    viewBox="0 0 760 235"
                    role="img"
                    aria-label="Bestandsentwicklung mit Wareneingängen"
                >
                    ${Array.from(
                        { length: 5 },
                        (_, i) => {
                            const value = max * i / 4;

                            return `
                                <line
                                    x1="58"
                                    x2="742"
                                    y1="${y(value)}"
                                    y2="${y(value)}"
                                    stroke="#e7edf4"
                                />

                                <text
                                    x="50"
                                    y="${y(value) + 4}"
                                    text-anchor="end"
                                    font-size="11"
                                    fill="#094369"
                                >${int(value)}</text>
                            `;
                        }
                    ).join("")}

                    ${series.map((s, i) => {
                        const known = s.points.filter(
                            p => p.value != null
                        );

                        const color = colorFor(i);

                        const path = smoothStockPath(
                            known.map(p => ({
                                x: x(p.t),
                                y: y(p.value)
                            }))
                        );

                        const purchases =
                            (S.data.purchases || []).filter(r =>
                                r.product_key === s.product.key &&
                                r.t >= start &&
                                r.t <= n
                            );

                        const purchaseDays = [
                            ...new Set(
                                purchases.map(r =>
                                    Math.floor(r.t / DAY) * DAY
                                )
                            )
                        ];

                        return `
                            <path
                                d="${path}"
                                fill="none"
                                stroke="${color}"
                                stroke-width="2.5"
                            />

                            ${known.map(p => `
                                <circle
                                    cx="${x(p.t)}"
                                    cy="${y(p.value)}"
                                    r="2"
                                    fill="${color}"
                                >
                                    <title>
                                        ${esc(s.product.name)} ·
                                        ${label(p.t)}:
                                        ${int(p.value)} Stück
                                    </title>
                                </circle>
                            `).join("")}

                            ${purchaseDays.map(day => {
                                const point = s.points.find(
                                    p => p.t === day
                                );

                                if (point?.value == null) {
                                    return "";
                                }

                                const entries = purchases.filter(
                                    r =>
                                        Math.floor(r.t / DAY) *
                                        DAY === day
                                );

                                const dates = [
                                    ...new Set(
                                        entries
                                            .map(r => r.purchase_date)
                                            .filter(Boolean)
                                    )
                                ];

                                const tip =
                                    s.product.name +
                                    " · Wareneingang: " +
                                    label(day) +
                                    " · +" +
                                    int(sum(entries, "quantity")) +
                                    " Stück" +
                                    (
                                        dates.length
                                            ? " · Einkaufsdatum: " +
                                              dates.join(", ")
                                            : ""
                                    );

                                return `
                                    <circle
                                        cx="${x(day)}"
                                        cy="${y(point.value)}"
                                        r="7"
                                        fill="${color}"
                                        stroke="white"
                                        stroke-width="2.5"
                                    >
                                        <title>${esc(tip)}</title>
                                    </circle>
                                `;
                            }).join("")}
                        `;
                    }).join("")}

                    <text
                        x="58"
                        y="225"
                        font-size="11"
                        fill="#094369"
                    >${label(start)}</text>

                    <text
                        x="742"
                        y="225"
                        text-anchor="end"
                        font-size="11"
                        fill="#094369"
                    >${label(last)}</text>
                </svg>
            `
            : `
                <p class="r1-muted">
                    Bitte mindestens ein Produkt auswählen.
                </p>
            `;

        $("r1StockLegend").innerHTML =
            products.map((p, i) => `
                <span>
                    <i style="background:${colorFor(i)}"></i>
                    ${esc(p.name)}
                </span>
            `).join("") +

            `
                <span class="r2-purchase-key">
                    ● Großer Punkt: Wareneingang
                </span>
            `;
    };
    const renderStock = () => {
        const products = stockProducts();

        $("r1Gauges").innerHTML = products.map(p => {
            const low = p.quantity <= p.low_stock_threshold;

            const color =
                p.quantity <= 0
                    ? "#b42318"
                    : low
                        ? "#d8a326"
                        : "#4b9b74";

            const percent = Math.min(
                100,
                Math.max(0, p.quantity / p.stock_target * 100)
            );

            return `
                <article class="r1-card r1-gauge">
                    <h3>${esc(p.icon || "📦")} ${esc(p.name)}</h3>

                    <svg
                        viewBox="0 0 116 72"
                        role="img"
                        aria-label="${esc(p.name)}: ${p.quantity} Stück"
                    >
                        <path
                            d="M 12 58 A 46 46 0 0 1 104 58"
                            fill="none"
                            stroke="#edf1f6"
                            stroke-width="12"
                        />

                        <path
                            d="M 12 58 A 46 46 0 0 1 104 58"
                            fill="none"
                            stroke="${color}"
                            stroke-width="12"
                            pathLength="100"
                            stroke-dasharray="${percent} 100"
                        />

                        <text
                            x="58" y="53"
                            text-anchor="middle"
                            font-size="22"
                            font-weight="700"
                            fill="#094369"
                        >${int(p.quantity)}</text>
                    </svg>

                    <small>
                        Stück · Zielbestand: ${int(p.stock_target)}
                    </small>

                    <p class="r1-stock-state" style="color:${color}">
                        ${
                            p.quantity <= 0
                                ? "Nicht auf Lager"
                                : low
                                    ? "Nachkaufen"
                                    : "Ausreichend vorhanden"
                        }
                    </p>

                    <details>
                        <summary>Grenzwerte</summary>

                        <form data-r1-target="${esc(p.key)}">
                            <label>
                                Zielbestand
                                <input
                                    name="target"
                                    type="number"
                                    min="1"
                                    max="2147483647"
                                    value="${p.stock_target}"
                                    required
                                >
                            </label>

                            <label>
                                Mindestbestand
                                <input
                                    name="low"
                                    type="number"
                                    min="0"
                                    max="2147483646"
                                    value="${p.low_stock_threshold}"
                                    required
                                >
                            </label>

                            <button
                                type="submit"
                                class="secondary-action"
                            >Speichern</button>
                        </form>
                    </details>
                </article>
            `;
        }).join("") || "<p>Keine Produkte vorhanden.</p>";

        $("r1StockChoices").innerHTML = `
            <label>
                <input
                    type="checkbox"
                    data-r1-all
                    ${
                        products.length &&
                        products.every(p => S.selected.has(p.key))
                            ? "checked"
                            : ""
                    }
                >
                Alle Produkte
            </label>
        ` + products.map(p => `
            <label>
                <input
                    type="checkbox"
                    data-r1-product="${esc(p.key)}"
                    ${S.selected.has(p.key) ? "checked" : ""}
                >
                ${esc(p.icon || "📦")} ${esc(p.name)}
            </label>
        `).join("");

        drawStock();
    };

    const render = () => {
        if (!S.data) return;

        renderResults();
        renderStock();
    };

    loadReports = async () => {
        if (!isTeacher()) return;

        const generation = ++S.generation;
        const n = wall(new Date());
        const [a, end, previous] = windowFor(S.period, n);

        const from = Math.min(
            buckets(S.period, n)[0].start,
            previous,
            Math.floor(n / DAY) * DAY - 365 * DAY
        );

        $("r1Status").textContent = "Berichte werden geladen …";

        try {
            const { data, error } = await db.rpc(
                "teacher_reports_v3",
                {
                    p_from: key(from),
                    p_to: key(Math.floor(n / DAY) * DAY + DAY)
                }
            );

            if (error) throw error;

            if (
                generation !== S.generation ||
                !isTeacher()
            ) return;

            for (const [name, field] of [
                ["sales", "sold_at"],
                ["free", "created_at"],
                ["expenses", "date"],
                ["ledger", "entry_date"],
                ["differences", "reviewed_at"],
                ["other_events", "date"],
                ["history", "recorded_at"],
                ["purchases", "created_at"]
            ]) {
                data[name] = (data[name] || []).map(r => ({
                    ...r,
                    t: wall(r[field])
                }));
            }

            S.data = data;

            if (!S.selected.size) {
                                stockProducts()
                    .slice(0, 2)
                    .forEach(p => S.selected.add(p.key));
            }

            render();

            $("r1Status").textContent =
                "Stand: " + new Date(data.now).toLocaleString(
                    "de-DE",
                    { timeZone: "Europe/Berlin" }
                );

        } catch (error) {
            if (generation !== S.generation) return;

            console.error(error);

            $("r1Status").textContent =
                "Berichte konnten nicht geladen werden. Bitte erneut versuchen.";
        }
    };

    root.addEventListener("click", async event => {
        const button = event.target.closest("button");

        if (!button) return;

        if (button.hasAttribute("data-r1-home")) {
            goHome();
            return;
        }

        if (!isTeacher()) return;

        if (button.dataset.r1Tab) {
            S.tab = button.dataset.r1Tab;

            $("r1Results").hidden = S.tab !== "results";
            $("r1Stock").hidden = S.tab !== "stock";

            root.querySelectorAll("[data-r1-tab]")
                .forEach(b => b.classList.toggle(
                    "active",
                    b.dataset.r1Tab === S.tab
                ));
        }

        if (button.dataset.r1Period) {
            S.period = button.dataset.r1Period;

            root.querySelectorAll("[data-r1-period]")
                .forEach(b => b.classList.toggle(
                    "active",
                    b.dataset.r1Period === S.period
                ));

            await loadReports();
        }

        if (button.dataset.r1Metric) {
            S.metric = button.dataset.r1Metric;

            root.querySelectorAll("[data-r1-metric]")
                .forEach(b => b.classList.toggle(
                    "active",
                    b.dataset.r1Metric === S.metric
                ));

            if (S.data) drawBars();
        }

        if (button.hasAttribute("data-r1-refresh")) {
            await loadReports();
        }

        if (
            button.hasAttribute("data-r1-export") &&
            S.data
        ) {
            if (!window.XLSX) {
                toast(
                    "Excel-Export ist nicht verfügbar. Bitte neu laden.",
                    "error"
                );
                return;
            }

            const n = wall(S.data.now);
            const [a] = windowFor(S.period, n);
            const current = stats(S.data, a, n);

            const workbook = XLSX.utils.book_new();

            const add = (name, rows) => {
                XLSX.utils.book_append_sheet(
                    workbook,
                    XLSX.utils.json_to_sheet(rows),
                    name
                );
            };

            add("Ergebnisse", [{
                Von: key(a),
                Bis: key(n),
                Umsatz: current.revenue,
                "Verkaufsgewinn geschätzt": current.profit,
                Kassenbons: current.tickets,
                "Getränke verkauft": current.drinks,
                "Backwaren verkauft": current.bakery,
                "Getränkeeinkäufe ohne Pfand": current.expenses,
                "Sonstige Einnahmen": current.other,
                "Kostenlose Getränke": current.free,
                "Kosten kostenloser Getränke": current.freeCost
            }]);

            add("Produkte", productTotals().map(p => ({
                Produkt: p.name,
                "Verkaufte Menge": p.sold,
                "Aktueller Bestand": p.quantity,
                Umsatz: p.revenue,
                "Gewinn geschätzt":
    ["bäckerei", "bakery"].includes(
        String(p.area || "").toLowerCase()
    )
        ? null
        : p.unknown
            ? null
            : p.profit
            })));

            add(
                "Bestand",
                stockProducts().map(p => ({
                    Produkt: p.name,
                    Bestand: p.quantity,
                    Zielbestand: p.stock_target,
                    Mindestbestand: p.low_stock_threshold
                }))
            );

            add(
                "Inventurdifferenzen",
                between(S.data.differences, a, n).map(r => ({
                    Datum: key(r.t),
                    Produkt: r.product_name,
                    "Vorheriger Bestand": r.inventory_before,
                    Gezählt: r.quantity,
                    Abweichung: r.difference
                }))
            );

            XLSX.writeFile(
                workbook,
                "LauterMacher_Berichte_" + key(n) + ".xlsx"
            );
        }
    });

    root.addEventListener("change", event => {
        const el = event.target;

        if (!isTeacher()) return;
               if (el.id === "r2Metric") {
            S.metric = el.value;

            if (S.data) {
                drawBars();
            }
        }

        if (el.id === "r1Rank") {
            S.rank = el.value;
            if (S.data) renderResults();
        }

        if (el.id === "r1StockDays") {
            S.days = Number(el.value);
            if (S.data) drawStock();
        }

        if (el.hasAttribute("data-r1-all") && S.data) {
            S.selected.clear();

            if (el.checked) {
                stockProducts()
                    .forEach(p => S.selected.add(p.key));
            }

            renderStock();
        }

        if (el.dataset.r1Product) {
            if (el.checked) {
                S.selected.add(el.dataset.r1Product);
            } else {
                S.selected.delete(el.dataset.r1Product);
            }

            drawStock();
        }
    });

    root.addEventListener("submit", async event => {
        const form = event.target.closest("[data-r1-target]");

        if (!form) return;

        event.preventDefault();

        if (!isTeacher()) return;

        const target = Number(form.elements.target.value);
        const low = Number(form.elements.low.value);
        const button = form.querySelector("button");

        if (
            !Number.isInteger(target) ||
            !Number.isInteger(low) ||
            target < 1 ||
            low < 0 ||
            low >= target
        ) {
            toast(
                "Der Mindestbestand muss kleiner als der Zielbestand sein.",
                "error"
            );
            return;
        }

        button.disabled = true;

        try {
            const { error } = await db.rpc(
                "teacher_report_targets_v1",
                {
                    p_key: form.dataset.r1Target,
                    p_target: target,
                    p_low: low
                }
            );

            if (error) throw error;

            const product = S.data.products.find(
                p => p.key === form.dataset.r1Target
            );

            product.stock_target = target;
            product.low_stock_threshold = low;

            renderStock();

            toast("Grenzwerte gespeichert.", "success");

        } catch (error) {
            console.error(error);

            toast(
                "Grenzwerte konnten nicht gespeichert werden.",
                "error"
            );

        } finally {
            button.disabled = false;
        }
    });
})();
/* =========================================================
   BERICHTE — TRI DES TABLEAUX
   ========================================================= */

(() => {
    const setup = (id, defaultColumn) => {
        const body = $(id);

        if (!body) return;

        const table = body.closest("table");

        if (table.dataset.r3SortReady) return;

        table.dataset.r3SortReady = "true";

        const headers = [
            ...table.querySelectorAll("thead th")
        ];

        let column = defaultColumn;
        let descending = true;

        const buttons = [];

        const value = (row, index) => {
            const cell = row.cells[index];

            if (!cell) return null;

            if (cell.dataset.sortValue !== undefined) {
                const number = Number(cell.dataset.sortValue);

                return Number.isFinite(number)
                    ? number
                    : null;
            }

            const text = cell.textContent.trim();

            if (!text || text === "—") return null;

            const numeric = text
                .replace(/\s|€/g, "")
                .replace(/−/g, "-")
                .replace(/\./g, "")
                .replace(",", ".");

            return /^[+-]?\d+(\.\d+)?$/.test(numeric)
                ? Number(numeric)
                : null;
        };

        const updateHeaders = () => {
            buttons.forEach(({ button, index, title }) => {
                const active = index === column;

                button.classList.toggle(
                    "r3-sort-active",
                    active
                );

                button.querySelector(
                    ".r3-sort-triangle"
                ).textContent = active
                    ? descending ? "▼" : "▲"
                    : "▽";

                button.setAttribute(
                    "aria-label",
                    title + ": " + (
                        active
                            ? descending
                                ? "absteigend sortiert"
                                : "aufsteigend sortiert"
                            : "absteigend sortieren"
                    )
                );

                if (active) {
                    headers[index].setAttribute(
                        "aria-sort",
                        descending
                            ? "descending"
                            : "ascending"
                    );
                } else {
                    headers[index].removeAttribute(
                        "aria-sort"
                    );
                }
            });
        };

        const sortRows = () => {
            observer.disconnect();

            const rows = [...body.rows];

            rows.sort((a, b) => {
                const av = value(a, column);
                const bv = value(b, column);

                if (av == null && bv == null) return 0;

                // Les valeurs inconnues restent à la fin.
                if (av == null) return 1;
                if (bv == null) return -1;

                return descending
                    ? bv - av
                    : av - bv;
            });

            const fragment =
                document.createDocumentFragment();

            rows.forEach(row => fragment.append(row));

            body.append(fragment);

            observer.observe(body, {
                childList: true
            });

            updateHeaders();
        };

        const observer =
            new MutationObserver(sortRows);

        headers.forEach((header, index) => {
            const title = header.textContent.trim();

            if (title === "Produkt") return;

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "r3-sort-button";

            const triangle =
                document.createElement("span");

            triangle.className = "r3-sort-triangle";
            triangle.setAttribute("aria-hidden", "true");

            button.append(
                document.createTextNode(title + " "),
                triangle
            );

            header.replaceChildren(button);

            buttons.push({
                button,
                index,
                title
            });

            button.addEventListener("click", () => {
                if (column === index) {
                    descending = !descending;
                } else {
                    column = index;
                    descending = true;
                }

                sortRows();
            });
        });

        sortRows();
    };

    // Produits : quantité vendue, décroissante.
    setup("r1ProductRows", 1);

    // Écarts : date, de la plus récente à la plus ancienne.
    setup("r1DifferenceRows", 0);
})();
/* =========================================================
   PRODUITS — RÉFÉRENCES D’ACHAT MULTIPLES
   ========================================================= */

/* =========================================================
   RÉFÉRENCES D’ACHAT V2 — UNE LIGNE PAR RÉFÉRENCE
   ========================================================= */

function readProductPurchaseReferences() {
    const rows = [
        ...document.querySelectorAll(
            "#productPurchaseRefs [data-purchase-ref]"
        )
    ];

    const refs = rows.map(row => {
        const get = name =>
            row.querySelector(
                `[data-ref-${name}]`
            ).value.trim();

        const rawPrice = get("price").replace(",", ".");
        const units = Number(get("units"));

        const packPrice =
            rawPrice !== "" &&
            /^\d+(\.\d{1,2})?$/.test(rawPrice)
                ? Number(rawPrice)
                : null;

        const ref = {
            store: get("store"),
            name: get("name"),
            ian: get("ian"),
            ean: get("ean"),

            units_per_ian: units,

            purchase_pack_price: packPrice,

            purchase_price:
                packPrice != null && units > 0
                    ? Number(
                        (packPrice / units).toFixed(6)
                    )
                    : null
        };

        row.querySelector(
            "[data-ref-unit-cost]"
        ).value = ref.purchase_price == null
            ? ""
            : money(ref.purchase_price);

        return ref;

    }).filter(ref =>
        ref.ian ||
        ref.name ||
        ref.store ||
        ref.ean ||
        ref.purchase_pack_price != null ||
        (
            Number.isFinite(ref.units_per_ian) &&
            ref.units_per_ian !== 1
        )
    );

    /*
     * La première référence reste compatible avec
     * les fonctions actuelles de l’application.
     */
    const first = refs[0];

    $("productIanInput").value =
        first?.ian || "";

    $("productStoreNameInput").value =
        first?.name || "";

    $("productEanInput").value =
        first?.ean || "";

    $("productIanUnitsInput").value =
        first?.units_per_ian ?? 1;

    $("productPurchasePriceInput").value =
        first?.purchase_pack_price == null
            ? ""
            : Number(first.purchase_pack_price)
                .toFixed(2)
                .replace(".", ",");

    updateProductUnitCostPreview();

    return refs;
}

function addProductPurchaseReference(ref = {}) {
    const row = document.createElement("div");

    row.className = "product-purchase-ref";
    row.dataset.purchaseRef = "";

    const price = ref.purchase_pack_price == null
        ? ""
        : Number(ref.purchase_pack_price)
            .toFixed(2)
            .replace(".", ",");

    row.innerHTML = `
        <label>
            <span>Geschäft</span>

            <input
                type="text"
                data-ref-store
                maxlength="80"
                value="${esc(ref.store || "")}"
                placeholder="ALDI"
                autocomplete="off"
            >
        </label>

        <label>
            <span>Name im Geschäft</span>

            <input
                type="text"
                data-ref-name
                maxlength="150"
                value="${esc(ref.name || "")}"
                placeholder="Name auf dem Kassenbon"
                autocomplete="off"
            >
        </label>

        <label>
            <span>IAN</span>

            <input
                type="text"
                data-ref-ian
                maxlength="64"
                value="${esc(ref.ian || "")}"
                placeholder="123456"
                autocomplete="off"
            >
        </label>

        <label>
            <span>Stück/Packung</span>

            <input
                type="number"
                data-ref-units
                min="1"
                max="2147483647"
                step="1"
                inputmode="numeric"
                value="${esc(String(ref.units_per_ian ?? 1))}"
                required
            >
        </label>

        <label>
            <span>Einkaufspreis</span>

            <input
                type="text"
                data-ref-price
                inputmode="decimal"
                pattern="[0-9]+([,.][0-9]{1,2})?"
                value="${esc(price)}"
                placeholder="Preis des Pakets"
                title="Preis der gesamten Packung, z. B. 3,69"
                autocomplete="off"
            >
        </label>

        <label>
            <span>EK pro Stück</span>

            <input
                type="text"
                data-ref-unit-cost
                readonly
                placeholder="—"
                aria-label="Berechneter Einkaufspreis pro Stück"
            >
        </label>

        <label>
            <span>EAN (Barcode)</span>

            <input
                type="text"
                data-ref-ean
                inputmode="numeric"
                maxlength="13"
                pattern="([0-9]{8}|[0-9]{13})"
                value="${esc(ref.ean || "")}"
                placeholder="8 oder 13 Ziffern"
                title="Bitte 8 oder 13 Ziffern eingeben."
                autocomplete="off"
            >
        </label>

        <button
            type="button"
            class="product-ref-remove"
            data-remove-ref
            aria-label="Diese Einkaufsreferenz entfernen"
        >×</button>
    `;
    row.querySelectorAll(
        "[data-ref-store], [data-ref-name]"
    ).forEach(input => {
        const updateTitle = () => {
            input.title = input.value;
        };

        updateTitle();

        input.addEventListener("input", updateTitle);

        input.addEventListener("blur", () => {
            input.scrollLeft = 0;
        });
    });
   
    $("productPurchaseRefs").append(row);
}

function renderProductPurchaseReferences(product) {
    $("productPurchaseRefs").replaceChildren();

    const legacyUnits =
        Number(product?.units_per_ian ?? 1);

    const legacyPack =
        product?.purchase_pack_price ??
        (
            product?.purchase_price == null
                ? null
                : Number(product.purchase_price) * legacyUnits
        );

    const saved =
        Array.isArray(product?.purchase_references)
            ? product.purchase_references.filter(ref =>
                ref &&
                typeof ref === "object" &&
                !Array.isArray(ref)
            )
            : [];

    const refs = saved.length
        ? saved
        : [{
            ian: product?.ian || "",
            name: product?.store_name || "",
            store: ""
        }];

    refs.forEach((ref, index) => {
        addProductPurchaseReference({
            ...ref,

            units_per_ian:
                ref.units_per_ian ?? legacyUnits,

            purchase_pack_price:
                ref.purchase_pack_price === undefined
                    ? legacyPack
                    : ref.purchase_pack_price,

            ean:
                ref.ean ??
                (
                    index === 0
                        ? product?.ean || ""
                        : ""
                )
        });
    });

    readProductPurchaseReferences();
}

(() => {
    if ($("productPurchaseRefs")) return;

    const ianGroup =
        $("productIanInput").closest(".form-field");

    const panel = document.createElement("div");

    panel.className = "product-refs-panel";

    panel.innerHTML = `
        <div class="product-refs-heading">
            <strong>Einkaufsreferenzen</strong>

            <button
                type="button"
                class="secondary-action"
                id="addProductPurchaseRef"
                aria-label="Einkaufsreferenz hinzufügen"
            >+</button>
        </div>

        <div
            id="productPurchaseRefs"
            tabindex="0"
            aria-label="Einkaufsreferenzen, horizontal scrollbar"
        ></div>

        <small>
            Einkaufspreis = Preis der gesamten Packung.
            Die erste Zeile ist die Hauptreferenz.
        </small>
    `;

    ianGroup.before(panel);

    /*
     * Conserver les anciens champs pour le code existant.
     * Leur affichage est remplacé par les nouvelles lignes.
     */
    [
        "productIanInput",
        "productStoreNameInput",
        "productIanUnitsInput",
        "productPurchasePriceInput",
        "productEanInput"
    ].forEach(id => {
        const input = $(id);

        input.closest(".form-field").style.display = "none";

        // Les nouveaux champs portent la validation du formulaire.
        input.disabled = true;
    });

    $("addProductPurchaseRef").addEventListener(
        "click",
        () => {
            if (productSaving) return;

            if (
                $("productPurchaseRefs").children.length >= 50
            ) {
                toast(
                    "Maximal 50 Einkaufsreferenzen pro Produkt.",
                    "error"
                );
                return;
            }

            addProductPurchaseReference();

            productEditorDirty = true;

            $("productPurchaseRefs")
                .lastElementChild
                .querySelector("input")
                .focus();
        }
    );

    $("productPurchaseRefs").addEventListener(
        "input",
        readProductPurchaseReferences
    );

    $("productPurchaseRefs").addEventListener(
        "click",
        event => {
            const button = event.target.closest(
                "[data-remove-ref]"
            );

            if (!button || productSaving) return;

            button.closest("[data-purchase-ref]").remove();

            if (!$("productPurchaseRefs").children.length) {
                addProductPurchaseReference();
            }

            readProductPurchaseReferences();

            productEditorDirty = true;
        }
    );
})();
/* =========================================================
   EINKAUFSLISTE V1 — PROFESSEUR
   ========================================================= */

(() => {
    const screenId = "shoppingListScreen";

    if ($(screenId)) return;

    screenTitles[screenId] = "Einkaufsliste";
    APP_SCREEN_ROUTES[screenId] = "/einkaufsliste";
    APP_ROUTE_SCREENS["/einkaufsliste"] = screenId;

    const homeButton = document.createElement("button");

    homeButton.type = "button";
    homeButton.id = "homeShoppingButton";
    homeButton.className = "home-menu-card teacher-only";

    homeButton.innerHTML = `
        <span class="home-menu-icon">🛒</span>

        <span class="home-menu-text">
            <strong>Einkaufsliste</strong>
            <small>Getränke nachkaufen</small>
        </span>

        <span class="home-menu-arrow">›</span>
    `;

    homeButton.hidden = !isTeacher();
    homeButton.style.display = isTeacher() ? "" : "none";

    $("homeReportsButton").after(homeButton);

    const screen = document.createElement("main");

    screen.id = screenId;
    screen.className = "screen admin-page teacher-only";
    screen.hidden = true;

    screen.innerHTML = `
        <header class="screen-header">
            <button
                type="button"
                class="back-button"
                id="shoppingBackButton"
            >← Startseite</button>

            <h1>🛒 Einkaufsliste</h1>
        </header>

        <section class="admin-content shopping-content">
           
<div class="shopping-toolbar">
    <div class="shopping-settings">
        <label>
            Vorrat für
            <span class="shopping-setting-control">
                <select id="shoppingWeeks">
                    <option value="1">1 Woche</option>
                    <option value="2" selected>2 Wochen</option>
                    <option value="3">3 Wochen</option>
                    <option value="4">4 Wochen</option>
                    <option value="5">5 Wochen</option>
                    <option value="6">6 Wochen</option>
                </select>
            </span>
        </label>

        <label>
            Sicherheitsreserve
            <span class="shopping-setting-control">
                <select id="shoppingSafetyDays">
                    <option value="0">0 Tage</option>
                    <option value="1">1 Tag</option>
                    <option value="2" selected>2 Tage</option>
                    <option value="3">3 Tage</option>
                    <option value="4">4 Tage</option>
                    <option value="5">5 Tage</option>
                    <option value="6">6 Tage</option>
                    <option value="7">7 Tage</option>
                </select>
            </span>
        </label>
    </div>

    <div class="shopping-main-actions">
        <button
            type="button"
            class="secondary-action"
            id="shoppingRefreshButton"
        >Aktualisieren</button>
    </div>

    <button
        type="button"
        id="shoppingResetButton"
        hidden
    >Neue Planung</button>
</div>


            <p class="shopping-note">
                Vorschlag aus Verbrauch und aktuellem Bestand.
                Die Berechnung berücksichtigt Montag bis Freitag.
                Ferien werden noch nicht automatisch ausgeschlossen.
                Bei wenigen Verkaufsdaten wird der Zielbestand verwendet.
            </p>

            <p id="shoppingStatus" role="status"></p>

            <div class="shopping-scroll">
                <table class="shopping-table">
                    <thead>
                       
<tr>
    <th aria-label="Gekauft">✓</th>
    <th>Produkt</th>
    <th>Bestand</th>
    <th>Packungen</th>
    <th>Stück</th>
</tr>

                    </thead>

                    <tbody id="shoppingRows"></tbody>
                </table>
            </div>

            <p id="shoppingTotal"></p>

            <p class="shopping-note">
                Änderungen und Häkchen werden für die Lehrkräfte
                gemeinsam gespeichert. Ein Häkchen ändert den Bestand
                noch nicht. Der Wareneingang wird später über die
                bestätigte Rechnung gebucht.
            </p>
        </section>
    `;

        document.body.append(screen);

    let rows = [];
    let generation = 0;
    let saving = false;

    const finishShoppingButton = document.createElement("button");
    finishShoppingButton.type = "button";
    finishShoppingButton.className = "secondary-action";
    finishShoppingButton.id = "shoppingFinishButton";
    finishShoppingButton.textContent = "🛒 Einkauf abschließen";

    
const shoppingTotal = $("shoppingTotal");

document.querySelector(
    "#shoppingListScreen .shopping-main-actions"
).append(finishShoppingButton);


    const pendingPurchasesBox = document.createElement("section");
    pendingPurchasesBox.id = "shoppingPendingPurchases";
    pendingPurchasesBox.style.marginTop = "24px";

    finishShoppingButton.insertAdjacentElement(
        "afterend",
        pendingPurchasesBox
    );
   
    const packsFor = row =>
        row.manual_packs ?? row.suggested_packs;

       // Fenêtre interne pour modifier un achat en attente.
    const purchaseEditDialog = document.createElement("dialog");

    purchaseEditDialog.id = "purchaseEditDialog";

    purchaseEditDialog.style.cssText = `
        width: min(620px, calc(100vw - 32px));
        max-height: 85vh;
        overflow-y: auto;
        box-sizing: border-box;
        border: none;
        border-radius: 20px;
        padding: 24px;
        background: white;
        color: #12496c;
        box-shadow: 0 20px 70px rgba(0,0,0,.25);
    `;

    purchaseEditDialog.innerHTML = `
        <form id="purchaseEditForm">
            <h2 style="margin-top:0">
                🛒 Einkauf bearbeiten
            </h2>

            <p style="color:#64748b">
                Mengen können bis zur Rechnungserfassung
                geändert werden.
            </p>

            <label
                for="purchaseEditSupplier"
                style="display:block;margin-bottom:16px"
            >
                <strong>Geschäft</strong>

                <input
                    id="purchaseEditSupplier"
                    type="text"
                    style="
                        display:block;
                        width:100%;
                        box-sizing:border-box;
                        margin-top:6px;
                    "
                >
            </label>

            <div id="purchaseEditItems"></div>

            <p
                id="purchaseEditMessage"
                role="alert"
                style="color:#b91c1c"
            ></p>

            <div style="
                display:flex;
                justify-content:flex-end;
                flex-wrap:wrap;
                gap:10px;
                margin-top:24px;
            ">
                <button
                    type="button"
                    class="secondary-action"
                    id="purchaseEditCancel"
                >
                    Abbrechen
                </button>

                <button
                    type="submit"
                    id="purchaseEditSave"
                >
                    Änderungen speichern
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(purchaseEditDialog);

    let editingPurchase = null;

    const openPurchaseEditDialog = purchase => {
        if (!purchase || saving) return;

        editingPurchase = purchase;

        $("purchaseEditSupplier").value =
            purchase.supplier || "";

        $("purchaseEditMessage").textContent = "";

        $("purchaseEditItems").innerHTML = (
            purchase.items || []
        ).map((item, index) => `
            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:16px;
                padding:12px 0;
                border-bottom:1px solid #e2e8f0;
            ">
                <div style="flex:1;min-width:0">
                    <strong>${esc(item.product_name)}</strong>

                    <div style="
                        color:#64748b;
                        font-size:13px;
                        margin-top:4px;
                    ">
                        ${esc(String(item.units_per_pack))}
                        Stück / Packung
                    </div>
                </div>

                <label style="width:105px;flex-shrink:0">
                    <span style="font-size:12px">
                        Packungen
                    </span>

                    <input
                        type="number"
                        min="0"
                        max="99999999"
                        step="1"
                        required
                        data-edit-item-index="${index}"
                        value="${Number(item.packs)}"
                        style="
                            width:100%;
                            box-sizing:border-box;
                        "
                    >
                </label>
            </div>
        `).join("");

        purchaseEditDialog.showModal();
    };

    $("purchaseEditCancel").addEventListener(
        "click",
        () => purchaseEditDialog.close()
    );

    purchaseEditDialog.addEventListener("close", () => {
        editingPurchase = null;
    });

    $("purchaseEditForm").addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (!editingPurchase || saving || !isTeacher()) {
                return;
            }

            const purchase = editingPurchase;
            const supplier =
                $("purchaseEditSupplier").value.trim();

            const inputs = [
                ...$("purchaseEditItems").querySelectorAll(
                    "[data-edit-item-index]"
                )
            ];

            const items = [];

            for (const input of inputs) {
                const raw = input.value.trim();
                const packs = Number(raw);

                if (
                    !/^\d+$/.test(raw) ||
                    !Number.isSafeInteger(packs) ||
                    packs > 99999999
                ) {
                    $("purchaseEditMessage").textContent =
                        "Bitte gültige Packungsmengen eingeben.";
                    return;
                }

                if (packs === 0) continue;

                const original = purchase.items[
                    Number(input.dataset.editItemIndex)
                ];

                items.push({
                    product_id: original.product_id,
                    product_name: original.product_name,
                    ian: original.ian,
                    packs,
                    units_per_pack: original.units_per_pack,
                    estimated_pack_price:
                        original.estimated_pack_price
                });
            }

            if (!items.length) {
                $("purchaseEditMessage").textContent =
                    "Mindestens ein Produkt muss übrig bleiben.";
                return;
            }

            saving = true;

            const saveButton = $("purchaseEditSave");
            saveButton.disabled = true;

            $("purchaseEditCancel").disabled = true;

            try {
                const { error } = await db.rpc(
                    "teacher_update_shopping_purchase",
                    {
                        p_purchase_id: purchase.id,
                        p_supplier: supplier,
                        p_items: items
                    }
                );

                if (error) throw error;

                purchaseEditDialog.close();

                toast(
                    "Einkauf erfolgreich aktualisiert.",
                    "success"
                );

                await loadPendingPurchases();

            } catch (error) {
                console.error(error);

                $("purchaseEditMessage").textContent =
                    "Änderungen konnten nicht gespeichert werden.";

            } finally {
                saving = false;
                saveButton.disabled = false;
                $("purchaseEditCancel").disabled = false;
            }
        }
    );
   
    let pendingPurchases = [];

    const loadPendingPurchases = async () => {
        if (!isTeacher()) return;

        const { data, error } = await db.rpc(
            "teacher_list_pending_shopping_purchases"
        );

        if (error) throw error;

        pendingPurchases = Array.isArray(data) ? data : [];

        renderPendingPurchases();
    };

    
    const renderPendingPurchases = () => {
        pendingPurchasesBox.className = "shopping-pending-section";

        pendingPurchasesBox.innerHTML = `
            <div class="shopping-section-heading">
                <div>
                    <h2>📋 Offene Einkäufe</h2>
                    <p>
                        Bereits eingekauft, aber noch nicht
                        in der Buchhaltung erfasst.
                    </p>
                </div>

                <span class="shopping-section-count">
                    ${pendingPurchases.length}
                </span>
            </div>

            ${
                pendingPurchases.length
                    ? `
                        <div class="shopping-purchase-grid">
                            ${pendingPurchases.map(purchase => {
                                const items = purchase.items || [];

                                const totalPacks = items.reduce(
                                    (sum, item) =>
                                        sum + Number(item.packs || 0),
                                    0
                                );

                                const estimatedTotal = items.reduce(
                                    (sum, item) =>
                                        sum +
                                        Number(item.packs || 0) *
                                        Number(
                                            item.estimated_pack_price || 0
                                        ),
                                    0
                                );

                                const hasMissingPrices = items.some(
                                    item =>
                                        item.estimated_pack_price == null
                                );

                                return `
                                    <article class="shopping-purchase-card">
                                        <div class="shopping-purchase-header">
                                            <div>
                                                <span class="shopping-purchase-label">
                                                    OFFENER EINKAUF
                                                </span>

                                                <h3>
                                                    🛍️ ${esc(
                                                        purchase.supplier ||
                                                        "Ohne Geschäft"
                                                    )}
                                                </h3>

                                                <time>
                                                    ${esc(
                                                        new Date(
                                                            purchase.purchased_at
                                                        ).toLocaleDateString(
                                                            "de-DE"
                                                        )
                                                    )}
                                                </time>
                                            </div>

                                            <span class="shopping-purchase-status">
                                                Rechnung offen
                                            </span>
                                        </div>

                                        <div class="shopping-purchase-summary">
                                            <span>
                                                ${items.length}
                                                Produkte
                                            </span>

                                            <span>
                                                ${totalPacks}
                                                Packungen
                                            </span>
                                        </div>

                                        <div class="shopping-purchase-items">
                                            ${items.map(item => `
                                                <div class="shopping-purchase-item">
                                                    <span>
                                                        ${esc(
                                                            item.product_name
                                                        )}
                                                    </span>

                                                    <strong>
                                                        ${Number(item.packs)}
                                                        ×
                                                        ${Number(
                                                            item.units_per_pack
                                                        )}
                                                    </strong>
                                                </div>
                                            `).join("")}
                                        </div>

                                        <div class="shopping-purchase-footer">
                                            <div class="shopping-purchase-estimate">
                                                <small>
                                                    Geschätzter Betrag
                                                </small>

                                                <strong>
                                                    ${money(estimatedTotal)}
                                                </strong>

                                                ${
                                                    hasMissingPrices
                                                        ? `
                                                            <small>
                                                                Preise teilweise
                                                                unbekannt
                                                            </small>
                                                        `
                                                        : ""
                                                }
                                            </div>

                                            <div class="shopping-purchase-actions">
                                                <button
                                                    type="button"
                                                    class="secondary-action"
                                                    data-edit-purchase="${esc(
                                                        purchase.id
                                                    )}"
                                                >
                                                    ✏️ Bearbeiten
                                                </button>

                                                <button
                                                    type="button"
                                                    class="primary-action"
                                                    data-invoice-purchase="${esc(
                                                        purchase.id
                                                    )}"
                                                >
                                                    🧾 Rechnung erfassen
                                                </button>
                                                
<button
    type="button"
    class="secondary-action shopping-cancel-button"
    data-cancel-purchase="${esc(purchase.id)}"
>
    🗑️ Einkauf stornieren
</button>

                                            </div>
                                        </div>
                                    </article>
                                `;
                            }).join("")}
                        </div>
                    `
                    : `
                        <div class="shopping-empty-state">
                            <span>✨</span>
                            <strong>Alles erledigt!</strong>
                            <p>Keine offenen Einkäufe vorhanden.</p>
                        </div>
                    `
            }
        `;
    };

   
    /* =====================================================
       ETAPE 4 — ANNULATION ET HISTORIQUE DES ACHATS
       ===================================================== */

    const shoppingHistoryBox = document.createElement("section");
    shoppingHistoryBox.id = "shoppingRecentPurchases";
    shoppingHistoryBox.className = "shopping-history-section";

    pendingPurchasesBox.insertAdjacentElement(
        "afterend",
        shoppingHistoryBox
    );

    let recentShoppingPurchases = [];
    let shoppingActionBusy = false;

    const shoppingHistoryDate = value => {
        if (!value) return "—";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString("de-DE", {
                timeZone: "Europe/Berlin"
            });
    };

    const shoppingHistoryMoney = value =>
        Number(value || 0).toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR"
        });

    const renderShoppingHistory = () => {
        shoppingHistoryBox.innerHTML = `
            <div class="shopping-section-heading">
                <div>
                    <h2>🕘 Letzte Einkäufe</h2>
                    <p>
                        Abgeschlossene Einkäufe mit Rechnung.
                    </p>
                </div>
                <span class="shopping-section-count">
                    ${recentShoppingPurchases.length}
                </span>
            </div>

            ${
                recentShoppingPurchases.length
                    ? `
                        <div class="shopping-history-list">
                            ${recentShoppingPurchases.map(purchase => {
                                const items = purchase.items || [];

                                return `
                                    <article class="shopping-history-card">
                                        <div class="shopping-history-main">
                                            <div>
                                                <strong>
                                                    ${esc(
                                                        purchase.supplier ||
                                                        "Ohne Geschäft"
                                                    )}
                                                </strong>

                                                <p>
                                                    ${esc(
                                                        shoppingHistoryDate(
                                                            purchase.purchased_at
                                                        )
                                                    )}
                                                    ·
                                                    ${esc(
                                                        purchase.invoice_number ||
                                                        "Rechnung vorhanden"
                                                    )}
                                                </p>
                                            </div>

                                            <strong class="shopping-history-price">
                                                ${shoppingHistoryMoney(
                                                    purchase.total_amount
                                                )}
                                            </strong>
                                        </div>

                                        <div class="shopping-history-products">
                                            ${items.map(item => `
                                                <span>
                                                    ${esc(item.product_name)}
                                                    ·
                                                    ${Number(item.packs || 0)}
                                                    Packung(en)
                                                </span>
                                            `).join("")}
                                        </div>

                                        <div class="shopping-history-actions">
                                            <span class="shopping-history-status">
                                                ✓ Abgerechnet
                                            </span>

                                            <button
                                                type="button"
                                                class="secondary-action shopping-hide-button"
                                                data-hide-purchase="${esc(
                                                    purchase.id
                                                )}"
                                            >
                                                Aus Verlauf ausblenden
                                            </button>
                                        </div>
                                    </article>
                                `;
                            }).join("")}
                        </div>
                    `
                    : `
                        <div class="shopping-history-empty">
                            Noch keine abgeschlossenen Einkäufe.
                        </div>
                    `
            }
        `;
    };

    const loadShoppingHistory = async () => {
        if (!isTeacher()) return;

        const personId = state.currentPerson?.id;

        shoppingHistoryBox.innerHTML =
            '<p class="shopping-note">Verlauf wird geladen …</p>';

        const { data, error } = await db.rpc(
            "teacher_list_recent_shopping_purchases"
        );

        if (error) throw error;

        if (
            !isTeacher() ||
            state.currentPerson?.id !== personId
        ) return;

        recentShoppingPurchases =
            Array.isArray(data) ? data : [];

        renderShoppingHistory();
    };

    const refreshShoppingPurchases = async () => {
        await loadPendingPurchases();
        await loadShoppingHistory();
    };

    pendingPurchasesBox.addEventListener(
        "click",
        async event => {
            const button = event.target.closest(
                "[data-cancel-purchase]"
            );

            if (
                !button ||
                shoppingActionBusy ||
                saving ||
                !isTeacher()
            ) return;

            const purchase = pendingPurchases.find(
                item => item.id === button.dataset.cancelPurchase
            );

            if (!purchase) return;

            const confirmed = await confirmInApp(
                "Diesen offenen Einkauf stornieren? " +
                "Die Daten bleiben gespeichert. " +
                "Es wird keine Rechnung gelöscht.",
                "Einkauf stornieren"
            );

            if (!confirmed) return;

            shoppingActionBusy = true;
            button.disabled = true;

            try {
                const { error } = await db.rpc(
                    "teacher_cancel_shopping_purchase",
                    {
                        p_purchase_id: purchase.id
                    }
                );

                if (error) throw error;

                await refreshShoppingPurchases();

                toast("Einkauf wurde storniert.", "success");
            } catch (error) {
                console.error(error);

                toast(
                    "Einkauf konnte nicht storniert werden.",
                    "error"
                );
            } finally {
                shoppingActionBusy = false;
                button.disabled = false;
            }
        }
    );

    shoppingHistoryBox.addEventListener(
        "click",
        async event => {
            const button = event.target.closest(
                "[data-hide-purchase]"
            );

            if (
                !button ||
                shoppingActionBusy ||
                saving ||
                !isTeacher()
            ) return;

            const purchase = recentShoppingPurchases.find(
                item => item.id === button.dataset.hidePurchase
            );

            if (!purchase) return;

            const confirmed = await confirmInApp(
                "Diesen Einkauf aus dem Verlauf ausblenden? " +
                "Die Rechnung und alle Buchhaltungsdaten " +
                "bleiben erhalten.",
                "Einkauf ausblenden"
            );

            if (!confirmed) return;

            shoppingActionBusy = true;
            button.disabled = true;

            try {
                const { error } = await db.rpc(
                    "teacher_hide_shopping_purchase",
                    {
                        p_purchase_id: purchase.id
                    }
                );

                if (error) throw error;

                await loadShoppingHistory();

                toast(
                    "Einkauf wurde ausgeblendet.",
                    "success"
                );
            } catch (error) {
                console.error(error);

                toast(
                    "Einkauf konnte nicht ausgeblendet werden.",
                    "error"
                );
            } finally {
                shoppingActionBusy = false;
                button.disabled = false;
            }
        }
    );

    const render = () => {
        $("shoppingRows").innerHTML = rows.map(row => {
            const packs = packsFor(row);

            const price = row.pack_price == null
                ? null
                : packs * Number(row.pack_price);

            return `
                <tr
                    data-shopping-product="${esc(row.id)}"
                    class="${row.checked ? "shopping-checked" : ""}"
                >
                    <td>
                        <input
                            type="checkbox"
                            data-shopping-check
                            aria-label="${esc(row.name)} gekauft"
                            ${row.checked ? "checked" : ""}
                        >
                    </td>

                    <td>
                        <strong>
                            ${esc(row.icon || "🥤")}
                            ${esc(row.name)}
                        </strong>

                        <small class="shopping-product-reference">
    ${[
        row.ian
            ? "IAN: " + esc(String(row.ian))
            : "",
        esc(String(row.units)) + " Stück / Packung"
    ].filter(Boolean).join(" · ")}
</small>
                    </td>

                    <td>${row.stock}</td>

                    <td>
                        <input
                            type="number"
                            min="0"
                            max="2147483647"
                            step="1"
                            value="${packs}"
                            data-shopping-packs
                            aria-label="Packungen für ${esc(row.name)}"
                        >
                    </td>

                    <td>${packs * row.units}</td>
                </tr>
            `;
        }).join("") || `
            <tr>
                <td colspan="5">Keine Getränke vorhanden.</td>
            </tr>
        `;

        const open = rows.filter(
            row => !row.checked && packsFor(row) > 0
        );

        const knownTotal = open.reduce(
            (total, row) =>
                total +
                packsFor(row) * Number(row.pack_price || 0),
            0
        );

        const missingPrices = open.some(
            row => row.pack_price == null
        );

        $("shoppingTotal").textContent =
            "Geschätzter Betrag für offene Einkäufe: " +
            money(knownTotal) +
            (
                missingPrices
                    ? " · Nicht vollständig: Einkaufspreise fehlen."
                    : ""
            );
    };

    const load = async (reset = false) => {
        if (!isTeacher()) return;

        
const weeks = Number($("shoppingWeeks").value);
const days = weeks * 5;
const safety = Number($("shoppingSafetyDays").value);


        if (
            !Number.isInteger(days) ||
            days < 1 || days > 30 ||
            !Number.isInteger(safety) ||
            safety < 0 || safety > 14
        ) {
            toast("Bitte gültige Schultage eingeben.", "error");
            return;
        }

        const request = ++generation;
        const personId = state.currentPerson.id;

        $("shoppingStatus").textContent =
            "Einkaufsliste wird geladen …";

        try {
            const { data, error } = await db.rpc(
                "teacher_shopping_list_v1",
                {
                    p_days: days,
                    p_safety_days: safety,
                    p_reset: reset
                }
            );

            if (error) throw error;

            if (
                request !== generation ||
                !isTeacher() ||
                state.currentPerson?.id !== personId
            ) return;

                        rows = data || [];
            render();

            
            try {
                await refreshShoppingPurchases();
            } catch (purchaseError) {
                console.error(purchaseError);

                pendingPurchasesBox.textContent =
                    "Einkäufe konnten nicht vollständig geladen werden.";

                shoppingHistoryBox.textContent =
                    "Verlauf konnte nicht geladen werden.";
            }


            $("shoppingStatus").textContent =
                "Aktualisiert: " +
                new Date().toLocaleString("de-DE", {
                    timeZone: "Europe/Berlin"
                });

        } catch (error) {
            console.error(error);

            $("shoppingStatus").textContent =
                "Einkaufsliste konnte nicht geladen werden.";
        }
    };

    const previousShowScreen = showScreen;

    showScreen = (id, ...args) => {
        const result = previousShowScreen(id, ...args);

        if (
            state.currentScreenId === screenId &&
            isTeacher()
        ) {
            load();
        }

        return result;
    };

    homeButton.addEventListener(
        "click",
        () => showScreen(screenId)
    );

    $("shoppingBackButton").addEventListener(
        "click",
        goHome
    );

    $("shoppingRefreshButton").addEventListener(
        "click",
        () => {
            if (!saving) load();
        }
    );

       const shoppingFinishDialog = document.createElement("dialog");

    shoppingFinishDialog.id = "shoppingFinishDialog";
    shoppingFinishDialog.className = "shopping-finish-dialog";

    shoppingFinishDialog.style.cssText = `
        width: min(420px, calc(100vw - 32px));
        max-width: 100%;
        box-sizing: border-box;
        border: none;
        border-radius: 18px;
        padding: 26px;
        background: #ffffff;
        color: #12496c;
        box-shadow: 0 20px 70px rgba(0,0,0,.25);
    `;

    shoppingFinishDialog.innerHTML = `
        <form id="shoppingFinishForm">
            <h2 style="margin:0 0 10px">
                🛒 Einkauf abschließen
            </h2>

            <p style="
                color:#64748b;
                margin:0 0 22px;
                line-height:1.5;
            ">
                In welchem Geschäft wurde eingekauft?
            </p>

            <label
                for="shoppingFinishSupplier"
                style="display:block;margin-bottom:18px"
            >
                <strong>Geschäft</strong>

                <input
                    id="shoppingFinishSupplier"
                    type="text"
                    required
                    maxlength="150"
                    placeholder="z. B. ALDI, Lidl, REWE"
                    autocomplete="off"
                    style="
                        display:block;
                        width:100%;
                        box-sizing:border-box;
                        margin-top:8px;
                        padding:11px;
                    "
                >
            </label>

            <p
                id="shoppingFinishError"
                role="alert"
                style="color:#b91c1c"
            ></p>

            <div style="
                display:flex;
                justify-content:flex-end;
                flex-wrap:wrap;
                gap:10px;
                margin-top:20px;
            ">
                <button
                    type="button"
                    class="secondary-action"
                    id="shoppingFinishCancel"
                >
                    Abbrechen
                </button>

                <button
                    type="submit"
                    class="primary-action"
                    id="shoppingFinishSave"
                >
                    Einkauf speichern
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(shoppingFinishDialog);

    let shoppingFinishItems = null;

    $("shoppingFinishCancel").addEventListener("click", () => {
        if (!saving) shoppingFinishDialog.close();
    });

    shoppingFinishDialog.addEventListener("close", () => {
        shoppingFinishItems = null;
        $("shoppingFinishError").textContent = "";
    });
   
        finishShoppingButton.addEventListener("click", () => {
        if (!isTeacher() || saving) return;

        const items = rows
            .filter(row => row.checked)
            .map(row => ({
                product_id: String(row.id),
                product_name: String(row.store_name || row.name),
                ian: row.ian ? String(row.ian) : null,
                packs: Number(packsFor(row)),
                units_per_pack: Number(row.units),
                estimated_pack_price:
                    row.pack_price == null
                        ? null
                        : Number(row.pack_price)
            }))
            .filter(item => item.packs > 0);

        if (!items.length) {
            toast(
                "Bitte gekaufte Produkte zuerst anhaken.",
                "error"
            );
            return;
        }

        const valid = items.every(item =>
            Number.isSafeInteger(item.packs) &&
            item.packs > 0 &&
            item.packs <= 99999999 &&
            Number.isSafeInteger(item.units_per_pack) &&
            item.units_per_pack > 0
        );

        if (!valid) {
            toast("Ungültige Einkaufsmenge.", "error");
            return;
        }

        shoppingFinishItems = items;

        $("shoppingFinishSupplier").value = "";
        $("shoppingFinishError").textContent = "";

        shoppingFinishDialog.showModal();
        $("shoppingFinishSupplier").focus();
    });

    $("shoppingFinishForm").addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (
                !isTeacher() ||
                saving ||
                !shoppingFinishItems?.length
            ) {
                return;
            }

            const supplier =
                $("shoppingFinishSupplier").value.trim();

            if (!supplier) {
                $("shoppingFinishError").textContent =
                    "Bitte Geschäft eingeben.";
                return;
            }

            saving = true;

            const saveButton = $("shoppingFinishSave");
            saveButton.disabled = true;
            $("shoppingFinishCancel").disabled = true;
            finishShoppingButton.disabled = true;

            try {
                const { data, error } = await db.rpc(
                    "teacher_create_shopping_purchase",
                    {
                        p_supplier: supplier,
                        p_items: shoppingFinishItems
                    }
                );

                if (error) throw error;

                shoppingFinishDialog.close();

                toast(
                    "Einkauf gespeichert. Rechnung noch erfassen.",
                    "success"
                );

                console.info(
                    "Shopping purchase created:",
                    data
                );

                try {
                    await loadPendingPurchases();
                } catch (refreshError) {
                    console.error(refreshError);
                    toast(
                        "Einkauf gespeichert. Bitte Liste aktualisieren.",
                        "info"
                    );
                }

            } catch (error) {
                console.error(error);

                $("shoppingFinishError").textContent =
                    "Einkauf konnte nicht gespeichert werden.";

            } finally {
                saving = false;
                saveButton.disabled = false;
                $("shoppingFinishCancel").disabled = false;
                finishShoppingButton.disabled = false;
            }
        }
    );

    pendingPurchasesBox.addEventListener("click", async event => {
        const button = event.target.closest(
            "[data-invoice-purchase]"
        );

        if (!button || saving || !isTeacher()) return;

        const purchase = pendingPurchases.find(
            item => item.id === button.dataset.invoicePurchase
        );

        if (!purchase) return;

        button.disabled = true;

        try {
            await openShoppingPurchaseInvoice(purchase);
        } catch (error) {
            console.error(error);

            toast(
                "Rechnung konnte nicht vorbereitet werden.",
                "error"
            );
        } finally {
            button.disabled = false;
        }
    });
   
        pendingPurchasesBox.addEventListener("click", event => {
        const button = event.target.closest(
            "[data-edit-purchase]"
        );

        if (!button || saving || !isTeacher()) return;

        const purchase = pendingPurchases.find(
            item => item.id === button.dataset.editPurchase
        );

        if (!purchase) return;

        openPurchaseEditDialog(purchase);
    });
   
    $("shoppingResetButton").addEventListener(
        "click",
        () => {
            if (saving) return;

            if (confirm(
                "Manuelle Mengen und Häkchen für alle Lehrkräfte " +
                "zurücksetzen und die Liste neu berechnen?"
            )) {
                load(true);
            }
        }
    );

    $("shoppingRows").addEventListener("change", async event => {
        if (!isTeacher()) return;

        const line = event.target.closest(
            "[data-shopping-product]"
        );

        if (!line) return;

        if (saving) {
            render();
            return;
        }

        const row = rows.find(
            row => row.id === line.dataset.shoppingProduct
        );

        const input = line.querySelector(
            "[data-shopping-packs]"
        );

        const raw = input.value.trim();
        const packs = Number(raw);

        if (
            !/^\d+$/.test(raw) ||
            !Number.isSafeInteger(packs) ||
            packs > 2147483647
        ) {
            toast("Bitte eine ganze Menge ab 0 eingeben.", "error");
            render();
            return;
        }

        const checked = line.querySelector(
            "[data-shopping-check]"
        ).checked;

        saving = true;

        screen.querySelectorAll("input, button")
            .forEach(el => el.disabled = true);

        try {
            const { error } = await db.rpc(
                "teacher_shopping_save_v1",
                {
                    p_product_id: row.id,
                    p_packs: packs,
                    p_checked: checked
                }
            );

            if (error) throw error;

            row.manual_packs = packs;
            row.checked = checked;

            render();

        } catch (error) {
            console.error(error);
            toast("Änderung konnte nicht gespeichert werden.", "error");
            render();

        } finally {
            saving = false;

            screen.querySelectorAll("input, button")
                .forEach(el => el.disabled = false);
        }
    });
})();
/* =========================================================
   RECHNUNGEN — SCAN ET IMPORT V1
   ========================================================= */

function parseInvoiceScanText(text) {
   const lines = String(text)
    .split(/\r?\n/)
    .map(line => line
        .replace(
            /\bs\s*u\s*m\s*m\s*e\b/gi,
            "Summe"
        )
        .replace(
            /\bp\s*f\s*a\s*n\s*d\b/gi,
            "Pfand"
        )
        .trim()
    )
    .filter(Boolean);

    const toAmount = value => Number(
        value.includes(",")
            ? value.replace(/\./g, "").replace(",", ".")
            : value
    );

    const amounts = line => (
        line.match(
            /-?\d+(?:\.\d{3})*,\d{2}(?!\d)|-?\d+\.\d{2}(?!\d)/g
        ) || []
    ).map(toAmount);

    const brand = String(text).match(
        /\b(ALDI(?:\s+(?:NORD|SÜD))?|LIDL|KAUFLAND|REWE|EDEKA|NETTO|PENNY)\b/i
    );

    let date = "";
    let total = null;
    let score = -1;
    let totalSource = "";

    const deposits = [];

    lines.forEach((line, i) => {
        // Date du ticket.
        if (!date) {
            const match = line.match(
                /\b(\d{1,2})[./](\d{1,2})[./](\d{4}|\d{2})\b/
            );

            if (match) {
                const year = match[3].length === 2
                    ? 2000 + Number(match[3])
                    : Number(match[3]);

                const parsedDate = new Date(Date.UTC(
                    year,
                    Number(match[2]) - 1,
                    Number(match[1])
                ));

                if (
                    parsedDate.getUTCFullYear() === year &&
                    parsedDate.getUTCMonth() === Number(match[2]) - 1 &&
                    parsedDate.getUTCDate() === Number(match[1])
                ) {
                    date = parsedDate.toISOString().slice(0, 10);
                }
            }
        }

        const values = amounts(line);

        const last = values.length
            ? values[values.length - 1]
            : null;

        // Priorité au total explicitement indiqué sur le ticket.
        if (
            /\b(summe|gesamtsumme|gesamtbetrag|gesamt|endsumme|zu\s*zahlen|total)\b/i.test(line) &&
            !/netto|mwst|steuer|gegeben|rückgeld/i.test(line)
        ) {
            const rank =
                /zu\s*zahlen|endsumme|gesamtbetrag|gesamtsumme/i.test(line)
                    ? 2
                    : 1;

            if (last > 0 && rank >= score) {
                total = last;
                score = rank;
                totalSource = "total";
            }
        }

        // À défaut : montant du paiement par carte, avec avertissement.
        const context = lines
            .slice(Math.max(0, i - 3), i + 1)
            .join(" ")
            .replace(/\s+/g, "")
            .toLowerCase();

        if (
            score < 1 &&
            /\bbetrag\b/i.test(line) &&
            /EUR|€/i.test(line) &&
            /kartenzahlung|girocard/.test(context) &&
            last > 0
        ) {
            total = last;
            score = 0;
            totalSource = "payment";
        }

        if (!/pfand/i.test(line)) {
            return;
        }

        // Sur les tickets ALDI, la quantité précède souvent Pfand.
        let quantity = null;
        let unit = null;

        for (
            let j = i;
            j >= Math.max(0, i - 3);
            j--
        ) {
            if (j < i && /pfand/i.test(lines[j])) {
                break;
            }

            const quantityMatch = lines[j].match(
                /^\s*[^0-9]{0,5}(\d{1,4})\s*[x×*]{1,2}(?=\s|$)/i
            );

            if (quantityMatch) {
                quantity = Number(quantityMatch[1]);

                if (/\b0[,.]25\b/.test(lines[j])) {
                    unit = 0.25;
                }

                break;
            }

            // Ne pas reprendre la quantité d'un autre produit.
            if (
                j < i &&
                /\b\d{6,8}\b/.test(lines[j])
            ) {
                break;
            }
        }

        const code =
            line.match(/\b\d{6,8}\b/)?.[0] || "";

        deposits.push({
            quantity,
            unit,
            amount: last,
            code,
            resolved: false
        });
    });

    const knownCodes = new Set();

    // Identifier les références confirmées à 0,25 €.
    deposits.forEach(row => {
        if (!row.quantity || row.amount < 0) {
            return;
        }

        const matches =
            row.amount != null &&
            Math.abs(row.quantity * 0.25 - row.amount) < 0.02;

        if (
            matches ||
            (row.unit === 0.25 && row.amount == null)
        ) {
            row.resolved = true;

            if (row.code) {
                knownCodes.add(row.code);
            }
        }
    });

    // Compléter uniquement les lignes de références déjà confirmées.
    deposits.forEach(row => {
        if (
            row.resolved ||
            !row.code ||
            !knownCodes.has(row.code) ||
            row.amount < 0
        ) {
            return;
        }

        if (row.quantity && row.amount == null) {
            row.resolved = true;

        } else if (
            !row.quantity &&
            row.amount != null
        ) {
            const quantity = row.amount / 0.25;

            if (
                quantity > 0 &&
                Number.isInteger(quantity)
            ) {
                row.quantity = quantity;
                row.resolved = true;
            }
        }
    });

    const pfand = deposits.reduce(
        (sum, row) =>
            sum + (row.resolved ? row.quantity : 0),
        0
    );

    return {
        supplier: brand
            ? brand[0].replace(/\s+/g, " ").toUpperCase()
            : "",

        date,
        total,
        total_source: totalSource,
        pfand,

        pfand_amount: Number(
            (pfand * 0.25).toFixed(2)
        ),

        warning: deposits.some(row => !row.resolved)
    };
}

(() => {
    const page = $("invoicesScreen");

   if (!page || $("invoiceUploadButton")) return;

    const scanIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="
                M8 3H3v5
                m13-5h5v5
                M3 16v5h5
                m13-5v5h-5
                M7 7v10
                m3-10v10
                m3-10v10
                m4-10v10
            "/>
        </svg>
    `;

    const actions = document.createElement("div");
    actions.className = "invoice-scan-actions";

    actions.innerHTML = `
        <button type="button" id="invoiceUploadButton">
            ${scanIcon}
            Rechnung hochladen
        </button>
    `;

    page.querySelector("header").append(actions);

    const camera = document.createElement("input");
    camera.type = "file";
    camera.accept = "image/*";
    camera.setAttribute("capture", "environment");
    camera.hidden = true;

    const upload = document.createElement("input");
    upload.type = "file";
    upload.accept = "image/*,application/pdf";
    upload.hidden = true;

    page.append(camera, upload);

    const dialog = document.createElement("dialog");
    dialog.className = "invoice-ocr-dialog";

    dialog.innerHTML = `
        <form id="invoiceOcrForm">
            <div class="invoice-ocr-heading">
                <h2>Rechnung prüfen</h2>

                <button
                    type="button"
                    data-ocr-close
                    aria-label="Schließen"
                >×</button>
            </div>

            <p>
                Automatisch erkannte Angaben sind Vorschläge.
                Bitte mit dem Beleg vergleichen.
                Eine Rechnung pro Datei auswählen.
            </p>

            <p id="invoiceOcrStatus" role="status"></p>

            <progress
                id="invoiceOcrProgress"
                max="1"
            ></progress>

            <div class="invoice-ocr-layout">
                <div>
                    <img
                        id="invoiceOcrImage"
                        alt="Vorschau des Belegs"
                    >

                    <details>
                        <summary>Erkannter Text</summary>

                        <textarea
                            id="invoiceOcrText"
                            readonly
                            aria-label="Erkannter Text"
                        ></textarea>
                    </details>
                </div>

                <div class="invoice-ocr-fields">
                    <label>
                        Laden
                        <input name="supplier" maxlength="150">
                    </label>

                    <label>
                        Rechnungsdatum
                        <input name="date" type="date" required>
                    </label>

                    <label>
                        Gesamtkosten inkl. Pfand (€)

                        <input
                            name="total"
                            type="text"
                            inputmode="decimal"
                            required
                        >
                    </label>

                    <label>
                        Pfandanzahl · 0,25 € je Stück

                        <input
                            name="pfand"
                            type="number"
                            min="0"
                            step="1"
                            value="0"
                            required
                        >
                    </label>

                    <p id="invoiceOcrWarning"></p>

                    <button
                        type="submit"
                        class="primary-action"
                        id="invoiceOcrApply"
                        disabled
                    >In Formular übernehmen</button>

                    <button
                        type="button"
                        class="secondary-action"
                        data-ocr-close
                    >Abbrechen</button>
                </div>
            </div>
        </form>
    `;

    document.body.append(dialog);

    const form = $("invoiceOcrForm");

    let busy = false;
    let job = 0;
    let active = null;
    let scriptPromise = null;

    const say = text => {
        $("invoiceOcrStatus").textContent = text;
    };

    const setBusy = value => {
        busy = value;

        actions.querySelectorAll("button").forEach(button => {
            button.disabled = value;
        });
    };

    const close = () => {
        job++;

        if (active) {
            active.worker.terminate().catch(() => {});
            active = null;
        }

        setBusy(false);
        dialog.close();
        form.reset();

        $("invoiceOcrImage").removeAttribute("src");
    };

    dialog.querySelectorAll("[data-ocr-close]")
        .forEach(button => button.onclick = close);

    dialog.addEventListener("cancel", event => {
        event.preventDefault();
        close();
    });

    const loadOcr = () => {
        if (window.Tesseract) {
            return Promise.resolve();
        }

        if (scriptPromise) return scriptPromise;

        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js";

            script.onload = () => resolve();

            script.onerror = () => {
                script.remove();
                scriptPromise = null;

                reject(Error(
                    "Das Texterkennungsmodul konnte nicht geladen werden."
                ));
            };

            document.head.append(script);
        });

        return scriptPromise;
    };

    const imageCanvas = async file => {
    const url = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = url;
        await image.decode();

        const selection = await new Promise(resolve => {
            const dialog = document.createElement("dialog");

            dialog.style.cssText = `
                box-sizing: border-box;
                width: min(94vw, 820px);
                max-height: 94dvh;
                overflow: auto;
                padding: 20px;
                border: 0;
                border-radius: 24px;
                background: white;
                color: #243568;
                box-shadow: 0 18px 60px #0003;
                font-family: inherit;
            `;

            dialog.innerHTML = `
                <h2 style="margin:0 0 10px">
                    Kassenbon zuschneiden
                </h2>

                <p style="margin:0 0 16px">
                    Ziehe mit dem Finger oder der Maus einen Rahmen
                    um den gesamten Kassenbon.
                    Produkte, Pfand und Summe müssen im Rahmen bleiben.
                </p>

                <div style="
                    display:flex;
                    justify-content:center;
                    padding:10px;
                    border-radius:16px;
                    background:#eef2ff;
                ">
                    <canvas
                        aria-label="Foto des Kassenbons zum Zuschneiden"
                        style="
                            display:block;
                            max-width:100%;
                            max-height:60dvh;
                            width:auto;
                            height:auto;
                            touch-action:none;
                            cursor:crosshair;
                        "
                    ></canvas>
                </div>

                <p
                    data-crop-message
                    role="status"
                    style="font-size:14px"
                >
                    Aktuell ist das gesamte Foto ausgewählt.
                </p>

                <div style="
                    display:flex;
                    justify-content:flex-end;
                    flex-wrap:wrap;
                    gap:10px;
                    margin-top:16px;
                ">
                    <button type="button" data-crop-cancel>
                        Abbrechen
                    </button>

                    <button type="button" data-crop-reset>
                        Ganzes Foto
                    </button>

                    <button type="button" data-crop-apply>
                        Ausschnitt erkennen
                    </button>
                </div>
            `;

            const canvas = dialog.querySelector("canvas");
            const context = canvas.getContext("2d");
            const message = dialog.querySelector("[data-crop-message]");
            const apply = dialog.querySelector("[data-crop-apply]");

            dialog.querySelectorAll("button").forEach(button => {
                button.style.cssText = `
                    padding:11px 16px;
                    border:0;
                    border-radius:14px;
                    font:inherit;
                    font-weight:600;
                    cursor:pointer;
                    background:#eef2ff;
                    color:#243568;
                `;
            });

            apply.style.background = "#5371fd";
            apply.style.color = "#fff";

            // L'aperçu est réduit, mais le découpage utilisera
            // les pixels de la photo originale.
            const previewRatio = Math.min(
                1,
                1200 / Math.max(
                    image.naturalWidth,
                    image.naturalHeight
                )
            );

            canvas.width = Math.max(
                1,
                Math.round(image.naturalWidth * previewRatio)
            );

            canvas.height = Math.max(
                1,
                Math.round(image.naturalHeight * previewRatio)
            );

            let box = {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height
            };

            let start = null;
            let pointerId = null;
            let finished = false;

            const draw = () => {
                context.clearRect(
                    0, 0, canvas.width, canvas.height
                );

                context.drawImage(
                    image, 0, 0, canvas.width, canvas.height
                );

                context.fillStyle = "rgba(15, 25, 55, 0.5)";

                context.beginPath();
                context.rect(0, 0, canvas.width, canvas.height);

                context.rect(
                    box.x,
                    box.y,
                    box.width,
                    box.height
                );

                context.fill("evenodd");

                context.strokeStyle = "#5371fd";
                context.lineWidth = 3;

                context.strokeRect(
                    box.x,
                    box.y,
                    box.width,
                    box.height
                );

                const valid =
                    box.width >= 10 &&
                    box.height >= 10;

                apply.disabled = !valid;
                apply.style.opacity = valid ? "1" : "0.5";
            };

            const point = event => {
                const rect = canvas.getBoundingClientRect();

                return {
                    x: Math.max(
                        0,
                        Math.min(
                            canvas.width,
                            (event.clientX - rect.left) *
                            canvas.width / rect.width
                        )
                    ),

                    y: Math.max(
                        0,
                        Math.min(
                            canvas.height,
                            (event.clientY - rect.top) *
                            canvas.height / rect.height
                        )
                    )
                };
            };

            const updateSelection = event => {
                const end = point(event);

                box = {
                    x: Math.min(start.x, end.x),
                    y: Math.min(start.y, end.y),
                    width: Math.abs(end.x - start.x),
                    height: Math.abs(end.y - start.y)
                };

                message.textContent =
                    "Der helle Bereich wird gelesen. " +
                    "Zum Ändern einen neuen Rahmen ziehen.";

                draw();
            };

            canvas.addEventListener("pointerdown", event => {
                if (pointerId !== null) return;
                if (event.pointerType === "mouse" && event.button !== 0) {
                    return;
                }

                event.preventDefault();

                pointerId = event.pointerId;
                start = point(event);

                canvas.setPointerCapture(event.pointerId);
                updateSelection(event);
            });

            canvas.addEventListener("pointermove", event => {
                if (
                    !start ||
                    event.pointerId !== pointerId
                ) {
                    return;
                }

                event.preventDefault();
                updateSelection(event);
            });

            const stopDragging = event => {
                if (event.pointerId !== pointerId) return;

                start = null;
                pointerId = null;

                if (canvas.hasPointerCapture(event.pointerId)) {
                    canvas.releasePointerCapture(event.pointerId);
                }
            };

            canvas.addEventListener("pointerup", stopDragging);
            canvas.addEventListener("pointercancel", stopDragging);
            canvas.addEventListener("lostpointercapture", () => {
                start = null;
                pointerId = null;
            });

            const finish = value => {
                if (finished) return;
                finished = true;

                if (dialog.open) dialog.close();
                dialog.remove();

                resolve(value);
            };

            dialog.querySelector("[data-crop-cancel]")
                .addEventListener("click", () => finish(null));

            dialog.querySelector("[data-crop-reset]")
                .addEventListener("click", () => {
                    box = {
                        x: 0,
                        y: 0,
                        width: canvas.width,
                        height: canvas.height
                    };

                    message.textContent =
                        "Das gesamte Foto ist ausgewählt.";

                    draw();
                });

            apply.addEventListener("click", () => {
                if (apply.disabled) return;

                finish({
                    x: box.x * image.naturalWidth / canvas.width,
                    y: box.y * image.naturalHeight / canvas.height,
                    width: box.width * image.naturalWidth / canvas.width,
                    height: box.height * image.naturalHeight / canvas.height
                });
            });

            dialog.addEventListener("cancel", event => {
                event.preventDefault();
                finish(null);
            });

            dialog.addEventListener("close", () => finish(null));

            document.body.append(dialog);
            draw();
            dialog.showModal();
        });

        if (!selection) {
            throw Error("cancelled");
        }

        // Recadrer depuis l'original, puis limiter la mémoire utilisée.
        const ratio = Math.min(
            1,
            3000 / selection.width,
            Math.sqrt(
                8000000 /
                (selection.width * selection.height)
            )
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(
            1,
            Math.round(selection.width * ratio)
        );

        canvas.height = Math.max(
            1,
            Math.round(selection.height * ratio)
        );

        const context = canvas.getContext("2d");

        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.drawImage(
            image,
            selection.x,
            selection.y,
            selection.width,
            selection.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return canvas;

    } finally {
        URL.revokeObjectURL(url);
    }
};

    const run = async file => {
        if (!file || busy || !isTeacher()) return;

        if (file.size > 25 * 1024 * 1024) {
            toast(
                "Bitte eine Datei mit höchstens 25 MB auswählen.",
                "error"
            );
            return;
        }

        const id = ++job;
        const personId = state.currentPerson.id;

        let worker = null;
        let pdf = null;

        const guard = () => {
            if (
                id !== job ||
                !isTeacher() ||
                state.currentPerson?.id !== personId
            ) {
                throw Error("cancelled");
            }
        };

        const recognize = async canvas => {
            guard();

            if (!worker) {
                say(
                    "Texterkennung wird vorbereitet. " +
                    "Beim ersten Mal kann dies etwas dauern."
                );

                await loadOcr();
                guard();

                worker = await Tesseract.createWorker(
                    ["deu", "eng"],
                    1,
                    {
                        logger: message => {
                            if (id !== job) return;

                            if (
                                message.status === "recognizing text"
                            ) {
                                say(
                                    "Text wird erkannt … " +
                                    Math.round(message.progress * 100) +
                                    " %"
                                );

                                $("invoiceOcrProgress").value =
                                    message.progress;
                            }
                        }
                    }
                );

                guard();

                active = { id, worker };

                await worker.setParameters({
                    preserve_interword_spaces: "1"
                });
            }

            const result = await worker.recognize(canvas);

            guard();

            return result.data.text || "";
        };

        setBusy(true);
        form.reset();

        $("invoiceOcrApply").disabled = true;
        $("invoiceOcrWarning").textContent = "";
        $("invoiceOcrImage").removeAttribute("src");
        $("invoiceOcrProgress").removeAttribute("value");

        dialog.showModal();

        say("Beleg wird geöffnet …");

        try {
            let text = "";

            const isPdf =
                file.type === "application/pdf" ||
                /\.pdf$/i.test(file.name);

            if (isPdf) {
                const base =
                    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/";

                const pdfjs = await import(
                    base + "legacy/build/pdf.mjs"
                );

                guard();

                pdfjs.GlobalWorkerOptions.workerSrc =
                    base + "legacy/build/pdf.worker.mjs";

                pdf = await pdfjs.getDocument({
                    data: new Uint8Array(
                        await file.arrayBuffer()
                    ),
                    cMapUrl: base + "cmaps/",
                    cMapPacked: true,
                    standardFontDataUrl: base + "standard_fonts/"
                }).promise;

                guard();

                if (pdf.numPages > 8) {
                    throw Error(
                        "Bitte eine Rechnung mit höchstens 8 Seiten auswählen."
                    );
                }

                for (let i = 1; i <= pdf.numPages; i++) {
                    guard();

                    say(
                        "PDF-Seite " + i +
                        " von " + pdf.numPages +
                        " wird gelesen …"
                    );

                    const pdfPage = await pdf.getPage(i);
                    const content = await pdfPage.getTextContent();

                    let lastY = null;

                    let pageText = content.items.map(item => {
                        if (!("str" in item)) return "";

                        const y = item.transform[5];

                        const newline =
                            lastY != null &&
                            Math.abs(y - lastY) > 2;

                        lastY = y;

                        return (
                            (newline ? "\n" : " ") +
                            item.str +
                            (item.hasEOL ? "\n" : "")
                        );
                    }).join("");

                    if (
                        i === 1 ||
                        pageText.trim().length < 60
                    ) {
                        const original = pdfPage.getViewport({
                            scale: 1
                        });

                        const scale = Math.min(
                            3,
                            2400 / Math.max(
                                original.width,
                                original.height
                            )
                        );

                        const viewport = pdfPage.getViewport({
                            scale
                        });

                        const canvas =
                            document.createElement("canvas");

                        canvas.width =
                            Math.ceil(viewport.width);

                        canvas.height =
                            Math.ceil(viewport.height);

                        await pdfPage.render({
                            canvasContext:
                                canvas.getContext("2d"),
                            viewport
                        }).promise;

                        guard();

                        if (i === 1) {
                            $("invoiceOcrImage").src =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.85
                                );
                        }

                        if (pageText.trim().length < 60) {
                            pageText = await recognize(canvas);
                        }

                        canvas.width = 1;
                        canvas.height = 1;
                    }

                    text += "\n" + pageText;

                    pdfPage.cleanup();
                }

            } else {
                const canvas = await imageCanvas(file);

                guard();

                $("invoiceOcrImage").src =
                    canvas.toDataURL("image/jpeg", 0.85);

                text = await recognize(canvas);

                canvas.width = 1;
                canvas.height = 1;
            }

            guard();

            $("invoiceOcrText").value = text;

            if (!text.trim()) {
                throw Error(
                    "Kein Text erkannt. Bitte ein schärferes Foto " +
                    "bei gutem Licht aufnehmen."
                );
            }

            const draft = parseInvoiceScanText(text);

            form.elements.supplier.value = draft.supplier;
            form.elements.date.value = draft.date;

            form.elements.total.value =
                draft.total == null
                    ? ""
                    : draft.total.toFixed(2).replace(".", ",");

            form.elements.pfand.value = draft.pfand;

            const scanWarnings = [];

if (draft.total_source === "payment") {
    scanWarnings.push(
        "Keine lesbare Summe gefunden. " +
        "Der vorgeschlagene Gesamtbetrag stammt vom Kartenbeleg. " +
        "Bitte mit dem Kassenbon vergleichen."
    );
}

if (draft.warning) {
    scanWarnings.push(
        "Nicht alle Pfandzeilen konnten eindeutig gelesen werden. " +
        "Die vorgeschlagene Anzahl kann unvollständig sein. " +
        "Bitte prüfen; das Formular rechnet mit 0,25 € je Stück."
    );
}

$("invoiceOcrWarning").textContent =
    scanWarnings.join(" ");

            $("invoiceOcrProgress").value = 1;

            say(
                "Erkennung abgeschlossen. " +
                "Bitte alle Angaben prüfen."
            );

            $("invoiceOcrApply").disabled = false;

        } catch (error) {
            if (
                id === job &&
                error.message !== "cancelled"
            ) {
                console.error(error);

                say(
                    /^(Bitte|Kein|Das)/.test(error.message || "")
                        ? error.message
                        : "Beleg konnte nicht gelesen werden. " +
                          "Bitte JPEG, PNG oder PDF versuchen."
                );
            }

        } finally {
            if (worker) {
                await worker.terminate().catch(() => {});
            }

            if (pdf) {
                await pdf.destroy().catch(() => {});
            }

            if (active?.id === id) {
                active = null;
            }

            if (id === job) {
                setBusy(false);
            }
        }
    };

       /* Icône document pour le bouton d’import */

    $("invoiceUploadButton").innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="
                M14 3H5v18h14V8L14 3Z
                m0 0v5h5
                M8 12h8
                M8 16h8
            "/>
        </svg>
        Rechnung hochladen
    `;

    $("invoiceUploadButton").onclick = () => {
        if (!isTeacher() || busy) return;

        upload.value = "";
        upload.click();
    };

    camera.onchange = () =>
        run(camera.files?.[0]);

    upload.onchange = () =>
        run(upload.files?.[0]);

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (busy || !isTeacher()) return;

        const rawTotal = form.elements.total.value
            .trim()
            .replace(",", ".");

        const total = Number(rawTotal);

        const count = Number(
            form.elements.pfand.value
        );

        if (
            !/^\d+(\.\d{1,2})?$/.test(rawTotal) ||
            !Number.isFinite(total) ||
            total <= 0 ||
            !Number.isSafeInteger(count) ||
            count < 0 ||
            count * 0.25 > total
        ) {
            say(
                "Bitte Gesamtkosten und Pfandanzahl prüfen."
            );
            return;
        }

        $("invoiceSupplierInput").value =
            form.elements.supplier.value.trim();

        $("invoiceDateInput").value =
            form.elements.date.value;

        $("invoiceTotalInput").value =
            total.toFixed(2).replace(".", ",");

        $("invoicePfandInput").value = count;

        updateInvoicePfand();

        close();

        setText(
            "invoiceFormMessage",
            "Scan übernommen. Bitte prüfen und " +
            "die Rechnung anschließend speichern."
        );

        $("invoiceForm").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    db.auth.onAuthStateChange(event => {
        if (event === "SIGNED_OUT") {
            close();
        }
    });
})();
/* Un seul bouton : importer un document ou prendre une photo */

/* Désactiver le scanner caméra et conserver l'import */
(() => {
})();

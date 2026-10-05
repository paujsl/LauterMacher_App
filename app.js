// ========================================
// LAUTER MACHER
// APP.JS — VERSION FINALE V1
// ========================================


// ========================================
// SUPABASE AUTHENTIFIZIERUNG
// ========================================

const SUPABASE_URL = "https://gsbkfrjhierqopkwpqjc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmtmcmpoaWVycW9wa3dwcWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MjI3MjgsImV4cCI6MjEwNjQ5ODcyOH0.BV5aYeAO2nE5SjiEOCs3GA1hwQpg0IJzEl5wizApUVU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let currentPerson = null;
let selectedLoginPerson = null;

// ========================================
// SCREENS
// ========================================

const homeScreen = document.getElementById("homeScreen");
const saleScreen = document.getElementById("saleScreen");
const paymentScreen = document.getElementById("paymentScreen");
const successScreen = document.getElementById("successScreen");
const identityScreen = document.getElementById("identityScreen");
const pinLoginScreen = document.getElementById("pinLoginScreen");
const peopleGrid = document.getElementById("peopleGrid");
const identityError = document.getElementById("identityError");
const selectedPersonName = document.getElementById("selectedPersonName");
const loginPinInput = document.getElementById("loginPinInput");
const pinLoginError = document.getElementById("pinLoginError");
const loginBackButton = document.getElementById("loginBackButton");
const loginConfirmButton = document.getElementById("loginConfirmButton");
const currentPersonName = document.getElementById("currentPersonName");
const logoutButton = document.getElementById("logoutButton");

const adminScreen = document.getElementById("adminScreen");
const reportsScreen = document.getElementById("reportsScreen");
const inventoryScreen = document.getElementById("inventoryScreen");
const productsScreen = document.getElementById("productsScreen");


// ========================================
// VERKAUF BUTTONS
// ========================================

const saleButton = document.getElementById("saleButton");
const saleBackButton = document.getElementById("saleBackButton");
const paymentBackButton = document.getElementById("paymentBackButton");
const payButton = document.getElementById("payButton");
const paidButton = document.getElementById("paidButton");
const newOrderButton = document.getElementById("newOrderButton");
const successHomeButton = document.getElementById("successHomeButton");


// ========================================
// PRODUCT GRIDS
// ========================================

const drinksGrid = document.getElementById("drinksGrid");
const bakeryGrid = document.getElementById("bakeryGrid");


// ========================================
// CART
// ========================================

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");


// ========================================
// PAYMENT
// ========================================

const paymentTotal = document.getElementById("paymentTotal");
const amountReceived = document.getElementById("amountReceived");
const changeAmount = document.getElementById("changeAmount");
const successChange = document.getElementById("successChange");

const paymentKeys = document.querySelectorAll(".payment-key");
const deletePaymentButton = document.getElementById("deletePaymentButton");


// ========================================
// ADMIN PIN
// ========================================

const adminButton = document.getElementById("adminButton");
const pinModal = document.getElementById("pinModal");
const cancelButton = document.getElementById("cancelButton");
const confirmButton = document.getElementById("confirmButton");
const deleteButton = document.getElementById("deleteButton");

const numberButtons = document.querySelectorAll(".number-button");
const pinDisplay = document.querySelectorAll("#pinDisplay span");


// ========================================
// ADMIN NAVIGATION
// ========================================

const adminBackButton = document.getElementById("adminBackButton");
const reportsButton = document.getElementById("reportsButton");
const inventoryButton = document.getElementById("inventoryButton");
const productsButton = document.getElementById("productsButton");

const reportsBackButton = document.getElementById("reportsBackButton");
const inventoryBackButton = document.getElementById("inventoryBackButton");
const productsBackButton = document.getElementById("productsBackButton");


// ========================================
// REPORTS
// ========================================

const periodTabs = document.querySelectorAll(".period-tab");
const reportDateLabel = document.getElementById("reportDateLabel");
const reportRevenue = document.getElementById("reportRevenue");
const reportTransactions = document.getElementById("reportTransactions");
const reportDrinks = document.getElementById("reportDrinks");
const reportBakery = document.getElementById("reportBakery");
const reportProducts = document.getElementById("reportProducts");

const exportReportButton = document.getElementById("exportReportButton");
const clearReportsButton = document.getElementById("clearReportsButton");


// ========================================
// INVENTORY
// ========================================

const inventoryList = document.getElementById("inventoryList");
const inventoryModal = document.getElementById("inventoryModal");
const closeInventoryModalButton =
    document.getElementById("closeInventoryModalButton");
const cancelInventoryButton =
    document.getElementById("cancelInventoryButton");
const saveInventoryButton =
    document.getElementById("saveInventoryButton");
const inventoryProductLabel =
    document.getElementById("inventoryProductLabel");
const inventoryAmountInput =
    document.getElementById("inventoryAmountInput");


// ========================================
// PRODUCTS ADMIN
// ========================================

const adminProductsList =
    document.getElementById("adminProductsList");

const addProductButton =
    document.getElementById("addProductButton");

const productModal =
    document.getElementById("productModal");

const closeProductModalButton =
    document.getElementById("closeProductModalButton");

const cancelProductButton =
    document.getElementById("cancelProductButton");

const saveProductButton =
    document.getElementById("saveProductButton");

const productModalTitle =
    document.getElementById("productModalTitle");

const productNameInput =
    document.getElementById("productNameInput");

const productPriceInput =
    document.getElementById("productPriceInput");

const productCategoryInput =
    document.getElementById("productCategoryInput");

const productIconInput =
    document.getElementById("productIconInput");


// ========================================
// VARIABLES
// ========================================

let cart = [];
let receivedAmount = "";
let enteredPin = "";
let currentReportPeriod = "day";
let editingProductId = null;
let inventoryProductId = null;

// ========================================
// NEUE APP-ARCHITEKTUR — MENÜ / FUNKTIONEN
// ========================================

let currentArea = null;
let currentFunction = null;
let currentTestMode = false;

const AREA_CONFIG = {
    getraenke: {
        title: "🥤 Getränke",
        functions: [
            { id: "getränke_kasse", title: "Kasse", icon: "💰", description: "Getränke verkaufen und bezahlen" }
        ]
    },
    baeckerei: {
        title: "🥐 Bäckerei",
        functions: [
            { id: "bäckerei_kasse", title: "Kasse", icon: "💰", description: "Bestellungen aufnehmen und bezahlen" },
            { id: "bäckerei_ausgabe", title: "Ausgabe", icon: "🍽️", description: "Bezahlte Bestellungen vorbereiten und ausgeben" }
        ]
    },
    bearbeiten: {
        title: "✏️ Bearbeiten",
        functions: [
            { id: "bearbeiten_produkte", title: "Produkte", icon: "🥤", description: "Produkte und Preise bearbeiten" },
            { id: "bearbeiten_inventar", title: "Inventar", icon: "📦", description: "Bestände prüfen und bearbeiten" },
            { id: "bearbeiten_schüler", title: "Schüler", icon: "👥", description: "Schüler verwalten", teacherOnly: true }
        ]
    },
    sonderveranstaltung: {
        title: "🎪 Sonderveranstaltung",
        functions: [
            { id: "sonder_beginning_inventory", title: "Anfangsbestand", icon: "📦", description: "Bestand vor der Veranstaltung erfassen" },
            { id: "sonder_products", title: "Produkte & Preise", icon: "🏷️", description: "Produkte und Verkaufspreise festlegen" },
            { id: "sonder_kasse", title: "Kasse", icon: "💰", description: "Getränke und Essen gemeinsam verkaufen" },
            { id: "sonder_ausgabe", title: "Ausgabe", icon: "🍽️", description: "Getränke und Essen gemeinsam ausgeben" },
            { id: "sonder_end_inventory", title: "Endbestand", icon: "📦", description: "Bestand nach der Veranstaltung erfassen" }
        ]
    }
};

let appMenuRoot = null;
let appMenuTitle = null;
let appMenuContent = null;


// ========================================
// SETTINGS
// ========================================

const ADMIN_PIN = "1234";

const STORAGE_KEYS = {
    products: "lauterMacher_products_v1",
    sales: "lauterMacher_sales_v1",
    inventory: "lauterMacher_inventory_v1"
};


// ========================================
// LOCAL DATA
// ========================================

let products = loadProducts();
let sales = loadSales();
let inventory = loadInventory();


// ========================================
// INITIALISATION
// ========================================

document.addEventListener("DOMContentLoaded", async function () {
    renderProducts();
    updateCart();
    ensureMainMenuStructure();

    showScreen(identityScreen);
    await initialiseAuthentication();
});


// ========================================
// AUTH — LOGIN
// ========================================

async function initialiseAuthentication() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {
            const restored = await loadCurrentPerson(sessionData.session);

            if (restored) {
                applyLoggedInState(restored);
                return;
            }

            await supabaseClient.auth.signOut();
        }

        await loadLoginPeople();
    } catch (error) {
        console.error("Authentifizierung konnte nicht initialisiert werden.", error);
        identityError.textContent = "Die Anmeldung konnte nicht geladen werden.";
        await loadLoginPeople();
    }
}


async function loadLoginPeople() {
    identityError.textContent = "";
    peopleGrid.innerHTML = '<div class="login-loading">Personen werden geladen …</div>';

    const { data, error } = await supabaseClient
        .from("login_people")
        .select("id, first_name, last_name, person_type")
        .order("person_type")
        .order("last_name")
        .order("first_name");

    if (error) {
        console.error("Login-Personen konnten nicht geladen werden.", error);
        peopleGrid.innerHTML = "";
        identityError.textContent = "Personen konnten nicht geladen werden. Bitte Internetverbindung prüfen.";
        return;
    }

    peopleGrid.innerHTML = "";

    data.forEach(function (person) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "person-login-card";

        const fullName = [person.first_name, person.last_name]
            .filter(Boolean)
            .join(" ");

        button.innerHTML = `
            <span class="person-login-icon">${person.person_type === "lehrer" ? "👨‍🏫" : "👤"}</span>
            <span class="person-login-name">${escapeHtml(fullName)}</span>
            <span class="person-login-type">${person.person_type === "lehrer" ? "Lehrkraft" : "Schüler/in"}</span>
        `;

        button.addEventListener("click", function () {
            selectLoginPerson(person);
        });

        peopleGrid.appendChild(button);
    });

    if (data.length === 0) {
        identityError.textContent = "Keine aktiven Personen gefunden.";
    }
}


function selectLoginPerson(person) {
    selectedLoginPerson = person;
    selectedPersonName.textContent = [person.first_name, person.last_name]
        .filter(Boolean)
        .join(" ");
    pinLoginError.textContent = "";
    loginPinInput.value = "";

    showScreen(pinLoginScreen);
    window.setTimeout(function () {
        loginPinInput.focus();
    }, 50);
}


loginBackButton.addEventListener("click", function () {
    selectedLoginPerson = null;
    loginPinInput.value = "";
    pinLoginError.textContent = "";
    showScreen(identityScreen);
});


loginPinInput.addEventListener("input", function () {
    loginPinInput.value = loginPinInput.value.replace(/[^0-9]/g, "").slice(0, 4);
    pinLoginError.textContent = "";
});


loginPinInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        loginConfirmButton.click();
    }
});


loginConfirmButton.addEventListener("click", loginWithPin);


async function loginWithPin() {
    if (!selectedLoginPerson) {
        return;
    }

    const pin = loginPinInput.value;

    if (!/^[0-9]{4}$/.test(pin)) {
        pinLoginError.textContent = "Bitte eine 4-stellige PIN eingeben.";
        loginPinInput.focus();
        return;
    }

    loginConfirmButton.disabled = true;
    loginConfirmButton.textContent = "Anmeldung …";
    pinLoginError.textContent = "";

    try {
        const { data, error } = await supabaseClient.functions.invoke(
            "login-with-pin",
            {
                body: {
                    person_id: selectedLoginPerson.id,
                    pin: pin
                }
            }
        );

        if (error) {
            throw error;
        }

        if (!data || !data.success || !data.token_hash || !data.verification_type) {
            throw new Error("Ungültige Antwort vom Login-Service.");
        }

        const { data: otpData, error: otpError } = await supabaseClient.auth.verifyOtp({
            token_hash: data.token_hash,
            type: data.verification_type
        });

        if (otpError) {
            throw otpError;
        }

        const person = await loadCurrentPerson(otpData.session);

        if (!person) {
            throw new Error("Person konnte nach der Anmeldung nicht geladen werden.");
        }

        applyLoggedInState(person);
    } catch (error) {
        console.error("Login fehlgeschlagen.", error);
        pinLoginError.textContent = "Falsche PIN oder Anmeldung nicht möglich.";
        loginPinInput.value = "";
        loginPinInput.focus();
    } finally {
        loginConfirmButton.disabled = false;
        loginConfirmButton.textContent = "Einloggen";
    }
}


async function loadCurrentPerson(session) {
    if (!session || !session.user) {
        return null;
    }

    const { data, error } = await supabaseClient
        .from("people")
        .select("id, first_name, last_name, person_type, active")
        .eq("auth_user_id", session.user.id)
        .eq("active", true)
        .single();

    if (error) {
        console.error("Aktuelle Person konnte nicht geladen werden.", error);
        return null;
    }

    return data;
}


function applyLoggedInState(person) {
    currentPerson = person;
    currentTestMode = person.person_type === "lehrer";

    currentPersonName.textContent = [person.first_name, person.last_name]
        .filter(Boolean)
        .join(" ");

    // Der alte Admin-Einstieg wird durch das neue Bearbeiten-Menü ersetzt.
    adminButton.style.display = "none";

    selectedLoginPerson = null;
    loginPinInput.value = "";
    pinLoginError.textContent = "";

    buildMainMenu();
    showMainMenu();
}


logoutButton.addEventListener("click", async function () {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Abmeldung fehlgeschlagen.", error);
        alert("Abmeldung war nicht möglich.");
        return;
    }

    currentPerson = null;
    selectedLoginPerson = null;
    currentTestMode = false;
    currentArea = null;
    currentFunction = null;
    currentPersonName.textContent = "-";
    adminButton.style.display = "none";
    resetSale();
    showScreen(identityScreen);
    await loadLoginPeople();
});


supabaseClient.auth.onAuthStateChange(function (_event, session) {
    if (!session && currentPerson) {
        currentPerson = null;
        currentTestMode = false;
        currentArea = null;
        currentFunction = null;
        adminButton.style.display = "none";
        showScreen(identityScreen);
    }
});


// ========================================
// HAUPTMENÜ — ARCHITEKTUR
// ========================================

function ensureMainMenuStructure() {
    if (appMenuRoot) {
        return;
    }

    const existingHomeButtons = homeScreen.querySelector(".home-buttons");

    appMenuRoot = document.createElement("div");
    appMenuRoot.id = "appMenuRoot";
    appMenuRoot.className = "app-menu-root";

    appMenuTitle = document.createElement("div");
    appMenuTitle.className = "app-menu-title";

    appMenuContent = document.createElement("div");
    appMenuContent.className = "app-menu-content";

    appMenuRoot.appendChild(appMenuTitle);
    appMenuRoot.appendChild(appMenuContent);

    if (existingHomeButtons) {
        existingHomeButtons.style.display = "none";
        existingHomeButtons.insertAdjacentElement("afterend", appMenuRoot);
    } else {
        homeScreen.appendChild(appMenuRoot);
    }
}


function buildMainMenu() {
    ensureMainMenuStructure();

    appMenuTitle.innerHTML = `
        <div class="app-menu-kicker">Hauptmenü</div>
        <h2>Was möchtest du machen?</h2>
        ${currentTestMode ? '<span class="test-mode-badge">🧪 Testumgebung</span>' : ''}
    `;

    appMenuContent.innerHTML = "";

    Object.entries(AREA_CONFIG).forEach(function ([areaId, area]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "area-menu-card";
        button.dataset.area = areaId;

        const visibleFunctions = getVisibleFunctions(areaId);
        const countText = visibleFunctions.length === 1
            ? "1 Funktion"
            : `${visibleFunctions.length} Funktionen`;

        button.innerHTML = `
            <span class="area-menu-icon">${area.title.slice(0, 2)}</span>
            <span class="area-menu-text">
                <strong>${escapeHtml(area.title.slice(3))}</strong>
                <small>${countText}</small>
            </span>
            <span class="area-menu-arrow">›</span>
        `;

        button.addEventListener("click", function () {
            openAreaMenu(areaId);
        });

        appMenuContent.appendChild(button);
    });
}


function getVisibleFunctions(areaId) {
    const area = AREA_CONFIG[areaId];

    if (!area) {
        return [];
    }

    return area.functions.filter(function (item) {
        if (item.teacherOnly && (!currentPerson || currentPerson.person_type !== "lehrer")) {
            return false;
        }
        return true;
    });
}


function showMainMenu() {
    ensureMainMenuStructure();
    buildMainMenu();
    appMenuTitle.classList.remove("sub-menu-title");
    showScreen(homeScreen);
}


function openAreaMenu(areaId) {
    const area = AREA_CONFIG[areaId];

    if (!area) {
        return;
    }

    currentArea = areaId;
    currentFunction = null;

    appMenuTitle.innerHTML = `
        <button id="menuBackButton" class="menu-back-button" type="button">← Hauptmenü</button>
        <h2>${escapeHtml(area.title)}</h2>
        ${currentTestMode ? '<span class="test-mode-badge">🧪 Testumgebung</span>' : ''}
    `;
    appMenuTitle.classList.add("sub-menu-title");

    const content = document.createElement("div");
    content.className = "function-menu-grid";

    getVisibleFunctions(areaId).forEach(function (item) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "function-menu-card";

        button.innerHTML = `
            <span class="function-menu-icon">${item.icon}</span>
            <span class="function-menu-text">
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.description)}</small>
            </span>
            <span class="area-menu-arrow">›</span>
        `;

        button.addEventListener("click", function () {
            openFunction(areaId, item.id);
        });

        content.appendChild(button);
    });

    appMenuContent.innerHTML = "";
    appMenuContent.appendChild(content);

    const backButton = document.getElementById("menuBackButton");
    backButton.addEventListener("click", showMainMenu);
}


function openFunction(areaId, functionId) {
    currentArea = areaId;
    currentFunction = functionId;

    if (functionId === "getränke_kasse") {
        openDrinkCashRegister();
        return;
    }

    if (functionId === "bäckerei_kasse") {
        openBakeryCashRegister();
        return;
    }

    if (functionId === "bearbeiten_produkte") {
        renderAdminProducts();
        showScreen(productsScreen);
        return;
    }

    if (functionId === "bearbeiten_inventar") {
        renderInventory();
        showScreen(inventoryScreen);
        return;
    }

    if (functionId === "bearbeiten_schüler") {
        openArchitecturePlaceholder(
            "👥 Schüler",
            "Hier wird die Schülerverwaltung aufgebaut: Schüler hinzufügen, bearbeiten, aktivieren/deaktivieren und PIN zurücksetzen."
        );
        return;
    }

    if (functionId === "bäckerei_ausgabe") {
        openArchitecturePlaceholder(
            "🍽️ Bäckerei · Ausgabe",
            "Die Ausgabe wird in der nächsten Ausbaustufe direkt mit den bezahlten Bäckerei-Bestellungen aus Supabase verbunden."
        );
        return;
    }

    if (functionId === "sonder_beginning_inventory") {
        openArchitecturePlaceholder("📦 Anfangsbestand", "Der Anfangsbestand einer Sonderveranstaltung wird hier vor Beginn erfasst.");
        return;
    }

    if (functionId === "sonder_products") {
        openArchitecturePlaceholder("🏷️ Produkte & Preise", "Hier werden die Produkte und Preise der jeweiligen Sonderveranstaltung festgelegt.");
        return;
    }

    if (functionId === "sonder_kasse") {
        openArchitecturePlaceholder("💰 Sonderveranstaltung · Kasse", "Eine gemeinsame Kasse für Getränke und Essen. Die genaue Umsetzung bestätigen wir vor dem Bau dieses Bereichs.");
        return;
    }

    if (functionId === "sonder_ausgabe") {
        openArchitecturePlaceholder("🍽️ Sonderveranstaltung · Ausgabe", "Eine gemeinsame Ausgabe für Getränke und Essen. Die genaue Umsetzung bestätigen wir vor dem Bau dieses Bereichs.");
        return;
    }

    if (functionId === "sonder_end_inventory") {
        openArchitecturePlaceholder("📦 Endbestand", "Hier wird der Bestand nach der Sonderveranstaltung erfasst.");
    }
}


function openDrinkCashRegister() {
    setSaleArea("getränke");
    showScreen(saleScreen);
}


function openBakeryCashRegister() {
    setSaleArea("bäckerei");
    showScreen(saleScreen);
}


function setSaleArea(area) {
    currentArea = area;
    currentFunction = area === "getränke" ? "getränke_kasse" : "bäckerei_kasse";

    const sections = saleScreen.querySelectorAll(".product-section");
    if (sections.length >= 2) {
        sections[0].style.display = area === "getränke" ? "block" : "none";
        sections[1].style.display = area === "bäckerei" ? "block" : "none";
    }

    const header = saleScreen.querySelector(".screen-header h1");
    if (header) {
        header.textContent = area === "getränke" ? "🥤 Getränke · Kasse" : "🥐 Bäckerei · Kasse";
    }

    renderProducts();
    resetSale();
}


function openArchitecturePlaceholder(title, description) {
    ensureArchitecturePlaceholder();

    architecturePlaceholderTitle.textContent = title;
    architecturePlaceholderText.textContent = description;
    architecturePlaceholderMode.textContent = currentTestMode
        ? "🧪 Testumgebung"
        : "Arbeitsbereich";

    showScreen(architecturePlaceholderScreen);
}


let architecturePlaceholderScreen = null;
let architecturePlaceholderTitle = null;
let architecturePlaceholderText = null;
let architecturePlaceholderMode = null;


function ensureArchitecturePlaceholder() {
    if (architecturePlaceholderScreen) {
        return;
    }

    architecturePlaceholderScreen = document.createElement("main");
    architecturePlaceholderScreen.id = "architecturePlaceholderScreen";
    architecturePlaceholderScreen.className = "screen architecture-placeholder-screen";

    architecturePlaceholderScreen.innerHTML = `
        <header class="screen-header">
            <button id="architecturePlaceholderBack" class="back-button" type="button">← Menü</button>
            <h1 id="architecturePlaceholderTitle"></h1>
        </header>
        <section class="architecture-placeholder-content">
            <div id="architecturePlaceholderMode" class="test-mode-badge"></div>
            <div class="architecture-placeholder-icon">🚧</div>
            <h2>Bereich wird vorbereitet</h2>
            <p id="architecturePlaceholderText"></p>
            <button id="architecturePlaceholderHome" class="primary-action" type="button">← Zurück zum Menü</button>
        </section>
    `;

    document.body.appendChild(architecturePlaceholderScreen);

    architecturePlaceholderTitle = document.getElementById("architecturePlaceholderTitle");
    architecturePlaceholderText = document.getElementById("architecturePlaceholderText");
    architecturePlaceholderMode = document.getElementById("architecturePlaceholderMode");

    document.getElementById("architecturePlaceholderBack").addEventListener("click", showMainMenu);
    document.getElementById("architecturePlaceholderHome").addEventListener("click", showMainMenu);
}


function returnToMenuFromWorkingScreen() {
    resetSale();
    showMainMenu();
}


// ========================================
// LOCAL STORAGE — PRODUCTS
// ========================================

function loadProducts() {
    try {
        const saved = localStorage.getItem(
            STORAGE_KEYS.products
        );

        if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Produkte konnten nicht geladen werden.", error);
    }

    return PRODUCTS.map(function (product) {
        return { ...product };
    });
}


function saveProducts() {
    localStorage.setItem(
        STORAGE_KEYS.products,
        JSON.stringify(products)
    );
}


// ========================================
// LOCAL STORAGE — SALES
// ========================================

function loadSales() {
    try {
        const saved = localStorage.getItem(
            STORAGE_KEYS.sales
        );

        if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Verkaufsdaten konnten nicht geladen werden.", error);
    }

    return [];
}


function saveSales() {
    localStorage.setItem(
        STORAGE_KEYS.sales,
        JSON.stringify(sales)
    );
}


// ========================================
// LOCAL STORAGE — INVENTORY
// ========================================

function loadInventory() {
    try {
        const saved = localStorage.getItem(
            STORAGE_KEYS.inventory
        );

        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Inventar konnte nicht geladen werden.", error);
    }

    return {};
}


function saveInventory() {
    localStorage.setItem(
        STORAGE_KEYS.inventory,
        JSON.stringify(inventory)
    );
}


// ========================================
// SCREEN NAVIGATION
// ========================================

function showScreen(screen) {
    const screens = document.querySelectorAll(".screen");

    screens.forEach(function (item) {
        item.style.display = "none";
    });

    screen.style.display = "block";
}


// ========================================
// VERKAUF — PRODUCTS
// ========================================

function renderProducts() {
    drinksGrid.innerHTML = "";
    bakeryGrid.innerHTML = "";

    products.forEach(function (product) {
        const button = createProductButton(product);

        if (product.category === "drink") {
            drinksGrid.appendChild(button);
        }

        if (product.category === "bakery") {
            bakeryGrid.appendChild(button);
        }
    });

    if (bakeryGrid.children.length === 0) {
        bakeryGrid.innerHTML = `
            <div class="coming-soon">
                Weitere Produkte folgen.
            </div>
        `;
    }
}


function createProductButton(product) {
    const button = document.createElement("button");

    button.className = "product-card";
    button.dataset.productId = product.id;

    button.innerHTML = `
        <span class="product-icon">${escapeHtml(product.icon)}</span>
        <span class="product-name">${escapeHtml(product.name)}</span>
        <span class="product-price">${formatPrice(product.price)}</span>
    `;

    button.addEventListener("click", function () {
        addToCart(product);
    });

    return button;
}


// ========================================
// VERKAUF — OPEN
// ========================================

saleButton.addEventListener("click", function () {
    openDrinkCashRegister();
});


// ========================================
// VERKAUF — BACK HOME
// ========================================

saleBackButton.addEventListener("click", function () {
    resetSale();
    showMainMenu();
});


// ========================================
// CART — ADD
// ========================================

function addToCart(product) {
    const existingProduct = cart.find(function (item) {
        return item.id === product.id;
    });

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            category: product.category,
            quantity: 1
        });
    }

    updateCart();
}


// ========================================
// CART — DISPLAY
// ========================================

function updateCart() {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                Noch keine Produkte ausgewählt.
            </div>
        `;

        cartTotal.textContent = "0,00 €";
        payButton.disabled = true;
        return;
    }

    cart.forEach(function (product, index) {
        const item = document.createElement("div");

        item.className = "cart-item";

        const productTotal =
            Number(product.price) * product.quantity;

        item.innerHTML = `
            <div class="cart-product-info">
                <span class="cart-product-name">
                    ${escapeHtml(product.name)}
                </span>
                <span class="cart-product-price">
                    ${formatPrice(productTotal)}
                </span>
            </div>

            <div class="cart-controls">
                <button
                    class="cart-control minus"
                    data-index="${index}"
                >
                    −
                </button>

                <span class="cart-quantity">
                    ${product.quantity}
                </span>

                <button
                    class="cart-control plus"
                    data-index="${index}"
                >
                    +
                </button>
            </div>
        `;

        cartItems.appendChild(item);
    });

    cartTotal.textContent =
        formatPrice(calculateTotal());

    payButton.disabled = false;

    attachCartEvents();
}


// ========================================
// CART — BUTTONS
// ========================================

function attachCartEvents() {
    const minusButtons =
        document.querySelectorAll(".cart-control.minus");

    const plusButtons =
        document.querySelectorAll(".cart-control.plus");

    minusButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const index = Number(button.dataset.index);

            cart[index].quantity -= 1;

            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }

            updateCart();
        });
    });

    plusButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const index = Number(button.dataset.index);

            cart[index].quantity += 1;

            updateCart();
        });
    });
}


// ========================================
// TOTAL
// ========================================

function calculateTotal() {
    return cart.reduce(
        function (total, product) {
            return total +
                Number(product.price) *
                Number(product.quantity);
        },
        0
    );
}


// ========================================
// PAYMENT — OPEN
// ========================================

payButton.addEventListener("click", function () {
    if (cart.length === 0) {
        return;
    }

    const total = calculateTotal();

    paymentTotal.textContent = formatPrice(total);

    receivedAmount = "";

    updatePaymentDisplay();

    showScreen(paymentScreen);
});


// ========================================
// PAYMENT — BACK
// ========================================

paymentBackButton.addEventListener("click", function () {
    receivedAmount = "";
    showScreen(saleScreen);
});


// ========================================
// PAYMENT KEYPAD
// ========================================

paymentKeys.forEach(function (button) {
    button.addEventListener("click", function () {
        const value =
            button.textContent.trim();

        if (value === ",") {
            addDecimal();
            return;
        }

        if (receivedAmount === "0") {
            receivedAmount = "";
        }

        if (
            receivedAmount.includes(",") &&
            receivedAmount.split(",")[1].length >= 2
        ) {
            return;
        }

        receivedAmount += value;

        updatePaymentDisplay();
    });
});


// ========================================
// PAYMENT DECIMAL
// ========================================

function addDecimal() {
    if (receivedAmount === "") {
        receivedAmount = "0";
    }

    if (!receivedAmount.includes(",")) {
        receivedAmount += ",";
    }

    updatePaymentDisplay();
}


// ========================================
// PAYMENT DELETE
// ========================================

deletePaymentButton.addEventListener("click", function () {
    receivedAmount =
        receivedAmount.slice(0, -1);

    updatePaymentDisplay();
});


// ========================================
// PAYMENT DISPLAY
// ========================================

function updatePaymentDisplay() {
    let displayValue = receivedAmount;

    if (
        displayValue === "" ||
        displayValue === ","
    ) {
        displayValue = "0,00";
    }

    amountReceived.textContent =
        displayValue + " €";

    calculateChange();
}


// ========================================
// PAYMENT CHANGE
// ========================================

function calculateChange() {
    const total = calculateTotal();

    const received =
        parseGermanNumber(receivedAmount);

    const change =
        received - total;

    if (receivedAmount === "") {
        changeAmount.textContent = "0,00 €";
        paidButton.disabled = true;
        return;
    }

    if (change < 0) {
        changeAmount.textContent =
            "Noch " +
            formatPrice(Math.abs(change));

        paidButton.disabled = true;
        return;
    }

    changeAmount.textContent =
        formatPrice(change);

    paidButton.disabled = false;
}


// ========================================
// PAYMENT — SAVE SALE
// ========================================

paidButton.addEventListener("click", function () {
    const total = calculateTotal();

    const received =
        parseGermanNumber(receivedAmount);

    if (received < total) {
        return;
    }

    const change =
        received - total;

    saveSale(total, received, change);

    successChange.textContent =
        formatPrice(change);

    showScreen(successScreen);
});


// ========================================
// SAVE SALE
// ========================================

function saveSale(total, received, change) {
    const saleItems = cart.map(function (item) {
        return {
            id: item.id,
            name: item.name,
            price: Number(item.price),
            category: item.category,
            quantity: Number(item.quantity)
        };
    });

    const sale = {
        id: Date.now(),
        date: new Date().toISOString(),
        is_test: currentTestMode,
        total: roundMoney(total),
        received: roundMoney(received),
        change: roundMoney(change),
        items: saleItems
    };

    sales.push(sale);
    saveSales();

    // Testverkäufe der Lehrkraft dürfen keine echten Bestände verändern.
    if (currentTestMode) {
        return;
    }

    // Nur Getränke verändern den Bestand.
    saleItems.forEach(function (item) {
        if (item.category === "drink") {
            const currentStock =
                Number(inventory[item.id] || 0);

            inventory[item.id] =
                currentStock - item.quantity;
        }
    });

    saveInventory();
}


// ========================================
// NEW ORDER
// ========================================

newOrderButton.addEventListener("click", function () {
    resetSale();
    showScreen(saleScreen);
});


// ========================================
// SUCCESS → HOME
// ========================================

successHomeButton.addEventListener("click", function () {
    resetSale();
    showMainMenu();
});


// ========================================
// RESET SALE
// ========================================

function resetSale() {
    cart = [];
    receivedAmount = "";

    updateCart();
}


// ========================================
// ADMIN — OPEN PIN
// ========================================

adminButton.addEventListener("click", function () {
    if (!currentPerson) {
        return;
    }
    openAreaMenu("bearbeiten");
});


// ========================================
// ADMIN — CLOSE PIN
// ========================================

cancelButton.addEventListener("click", closePinModal);

function closePinModal() {
    pinModal.style.display = "none";
    pinModal.setAttribute("aria-hidden", "true");

    enteredPin = "";

    updatePinDisplay();
}


// ========================================
// PIN NUMBERS
// ========================================

numberButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        if (enteredPin.length >= 4) {
            return;
        }

        enteredPin +=
            button.textContent.trim();

        updatePinDisplay();
    });
});


// ========================================
// DELETE PIN
// ========================================

deleteButton.addEventListener("click", function () {
    enteredPin =
        enteredPin.slice(0, -1);

    updatePinDisplay();
});


// ========================================
// PIN DISPLAY
// ========================================

function updatePinDisplay() {
    pinDisplay.forEach(function (item, index) {
        if (index < enteredPin.length) {
            item.textContent = "●";
        } else {
            item.textContent = "○";
        }
    });
}


// ========================================
// CONFIRM PIN
// ========================================

confirmButton.addEventListener("click", function () {
    if (currentPerson && currentPerson.person_type === "lehrer") {
        closePinModal();
        showScreen(adminScreen);
        return;
    }

    closePinModal();
    alert("Dieser Bereich ist nur für Lehrkräfte verfügbar.");
});


// ========================================
// CLOSE PIN OUTSIDE
// ========================================

pinModal.addEventListener("click", function (event) {
    if (event.target === pinModal) {
        closePinModal();
    }
});


// ========================================
// ADMIN NAVIGATION
// ========================================

adminBackButton.addEventListener("click", function () {
    showMainMenu();
});

reportsButton.addEventListener("click", function () {
    currentReportPeriod = "day";
    updatePeriodTabs();
    renderReport();
    showScreen(reportsScreen);
});

inventoryButton.addEventListener("click", function () {
    renderInventory();
    showScreen(inventoryScreen);
});

productsButton.addEventListener("click", function () {
    renderAdminProducts();
    showScreen(productsScreen);
});

reportsBackButton.addEventListener("click", function () {
    openAreaMenu("bearbeiten");
});

inventoryBackButton.addEventListener("click", function () {
    openAreaMenu("bearbeiten");
});

productsBackButton.addEventListener("click", function () {
    openAreaMenu("bearbeiten");
});


// ========================================
// REPORT PERIOD TABS
// ========================================

periodTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        currentReportPeriod =
            tab.dataset.period;

        updatePeriodTabs();
        renderReport();
    });
});


function updatePeriodTabs() {
    periodTabs.forEach(function (tab) {
        tab.classList.toggle(
            "active",
            tab.dataset.period === currentReportPeriod
        );
    });
}


// ========================================
// REPORTS
// ========================================

function getRealSales() {
    return sales.filter(function (sale) {
        return sale.is_test !== true;
    });
}


function renderReport() {
    const filteredSales =
        getSalesForPeriod(currentReportPeriod);

    const revenue =
        filteredSales.reduce(
            function (sum, sale) {
                return sum + Number(sale.total || 0);
            },
            0
        );

    let transactionCount =
        filteredSales.length;

    let drinkCount = 0;
    let bakeryCount = 0;

    const productSummary = {};

    filteredSales.forEach(function (sale) {
        sale.items.forEach(function (item) {
            const quantity =
                Number(item.quantity || 0);

            if (item.category === "drink") {
                drinkCount += quantity;
            }

            if (item.category === "bakery") {
                bakeryCount += quantity;
            }

            if (!productSummary[item.id]) {
                productSummary[item.id] = {
                    id: item.id,
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }

            productSummary[item.id].quantity += quantity;

            productSummary[item.id].revenue +=
                Number(item.price) * quantity;
        });
    });

    reportRevenue.textContent =
        formatPrice(revenue);

    reportTransactions.textContent =
        transactionCount;

    reportDrinks.textContent =
        drinkCount;

    reportBakery.textContent =
        bakeryCount;

    reportDateLabel.textContent =
        getReportLabel(currentReportPeriod);

    renderReportProducts(productSummary);
}


function renderReportProducts(productSummary) {
    reportProducts.innerHTML = "";

    const entries =
        Object.values(productSummary)
            .sort(function (a, b) {
                return b.quantity - a.quantity;
            });

    if (entries.length === 0) {
        reportProducts.innerHTML = `
            <div class="no-data">
                Keine Verkäufe in diesem Zeitraum.
            </div>
        `;
        return;
    }

    entries.forEach(function (item) {
        const row =
            document.createElement("div");

        row.className =
            "report-product-row";

        row.innerHTML = `
            <span class="report-product-name">
                ${escapeHtml(item.name)}
            </span>

            <span class="report-product-quantity">
                ${item.quantity} Stück
            </span>

            <span class="report-product-revenue">
                ${formatPrice(item.revenue)}
            </span>
        `;

        reportProducts.appendChild(row);
    });
}


// ========================================
// REPORT PERIOD FILTER
// ========================================

function getSalesForPeriod(period) {
    const now = new Date();

    return getRealSales().filter(function (sale) {
        const date = new Date(sale.date);

        if (period === "day") {
            return isSameDay(date, now);
        }

        if (period === "week") {
            return isSameWeek(date, now);
        }

        if (period === "month") {
            return (
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth()
            );
        }

        return false;
    });
}


function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}


function isSameWeek(date, reference) {
    const start = getMonday(reference);
    const end = new Date(start);

    end.setDate(start.getDate() + 7);

    return date >= start && date < end;
}


function getMonday(date) {
    const result =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const day = result.getDay();

    const difference =
        day === 0 ? -6 : 1 - day;

    result.setDate(
        result.getDate() + difference
    );

    result.setHours(0, 0, 0, 0);

    return result;
}


function getReportLabel(period) {
    const now = new Date();

    if (period === "day") {
        return (
            "Heute · " +
            now.toLocaleDateString("de-DE")
        );
    }

    if (period === "week") {
        const monday = getMonday(now);
        const sunday = new Date(monday);

        sunday.setDate(monday.getDate() + 6);

        return (
            "Woche · " +
            monday.toLocaleDateString("de-DE") +
            " – " +
            sunday.toLocaleDateString("de-DE")
        );
    }

    return (
        "Monat · " +
        now.toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric"
        })
    );
}


// ========================================
// REPORT — CSV EXPORT
// ========================================

exportReportButton.addEventListener(
    "click",
    exportReportAsCSV
);


function exportReportAsCSV() {
    const filteredSales =
        getSalesForPeriod(currentReportPeriod);

    const rows = [
        [
            "Datum",
            "Produkt",
            "Kategorie",
            "Menge",
            "Einzelpreis",
            "Umsatz"
        ]
    ];

    filteredSales.forEach(function (sale) {
        sale.items.forEach(function (item) {
            rows.push([
                new Date(sale.date)
                    .toLocaleString("de-DE"),
                item.name,
                item.category === "drink"
                    ? "Getränk"
                    : "Bäckerei",
                item.quantity,
                Number(item.price)
                    .toFixed(2)
                    .replace(".", ","),
                (
                    Number(item.price) *
                    Number(item.quantity)
                )
                    .toFixed(2)
                    .replace(".", ",")
            ]);
        });
    });

    if (rows.length === 1) {
        alert(
            "Keine Verkaufsdaten für diesen Zeitraum."
        );
        return;
    }

    const csv = rows
        .map(function (row) {
            return row
                .map(csvEscape)
                .join(";");
        })
        .join("\n");

    const blob =
        new Blob(
            ["\uFEFF" + csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "LauterMacher_" +
        currentReportPeriod +
        "_" +
        getDateForFileName() +
        ".csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


function csvEscape(value) {
    const text =
        String(value ?? "");

    if (
        text.includes(";") ||
        text.includes('"') ||
        text.includes("\n")
    ) {
        return '"' +
            text.replaceAll('"', '""') +
            '"';
    }

    return text;
}


// ========================================
// REPORT — CLEAR
// ========================================

clearReportsButton.addEventListener(
    "click",
    function () {
        if (sales.length === 0) {
            alert("Es gibt keine Verkaufsdaten.");
            return;
        }

        const confirmed =
            confirm(
                "Möchtest du wirklich ALLE Verkaufsdaten löschen?"
            );

        if (!confirmed) {
            return;
        }

        sales = [];
        saveSales();

        renderReport();

        alert("Alle Verkaufsdaten wurden gelöscht.");
    }
);


// ========================================
// INVENTORY
// ========================================

function renderInventory() {
    inventoryList.innerHTML = "";

    const drinks =
        products.filter(function (product) {
            return product.category === "drink";
        });

    if (drinks.length === 0) {
        inventoryList.innerHTML = `
            <div class="no-data">
                Keine Getränke vorhanden.
            </div>
        `;
        return;
    }

    drinks.forEach(function (product) {
        const stock =
            Number(inventory[product.id] || 0);

        const card =
            document.createElement("div");

        card.className =
            "inventory-card";

        let stockClass = "";

        if (stock <= 0) {
            stockClass = "empty";
        } else if (stock <= 5) {
            stockClass = "low";
        }

        card.innerHTML = `
            <div class="inventory-product">
                <span class="inventory-icon">
                    ${escapeHtml(product.icon)}
                </span>

                <div>
                    <strong>
                        ${escapeHtml(product.name)}
                    </strong>
                    <small>
                        ${formatPrice(product.price)}
                    </small>
                </div>
            </div>

            <div class="inventory-stock ${stockClass}">
                ${stock} Stück
            </div>

            <button
                class="inventory-adjust-button"
                data-product-id="${escapeHtml(product.id)}"
            >
                ＋ Bestand
            </button>
        `;

        inventoryList.appendChild(card);
    });

    document
        .querySelectorAll(".inventory-adjust-button")
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    openInventoryModal(
                        button.dataset.productId
                    );
                }
            );
        });
}


// ========================================
// INVENTORY MODAL
// ========================================

function openInventoryModal(productId) {
    const product =
        products.find(function (item) {
            return item.id === productId;
        });

    if (!product) {
        return;
    }

    inventoryProductId =
        productId;

    inventoryProductLabel.textContent =
        product.name +
        " · Aktueller Bestand: " +
        Number(inventory[productId] || 0) +
        " Stück";

    inventoryAmountInput.value = "";

    inventoryModal.style.display = "flex";
    inventoryModal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(function () {
        inventoryAmountInput.focus();
    }, 50);
}


function closeInventoryModal() {
    inventoryModal.style.display = "none";
    inventoryModal.setAttribute(
        "aria-hidden",
        "true"
    );

    inventoryProductId = null;
}


closeInventoryModalButton.addEventListener(
    "click",
    closeInventoryModal
);

cancelInventoryButton.addEventListener(
    "click",
    closeInventoryModal
);

inventoryModal.addEventListener(
    "click",
    function (event) {
        if (event.target === inventoryModal) {
            closeInventoryModal();
        }
    }
);


saveInventoryButton.addEventListener(
    "click",
    function () {
        if (!inventoryProductId) {
            return;
        }

        const amount =
            Number(
                inventoryAmountInput.value
            );

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            alert(
                "Bitte eine positive Menge eingeben."
            );
            return;
        }

        inventory[inventoryProductId] =
            Number(
                inventory[inventoryProductId] || 0
            ) + Math.floor(amount);

        saveInventory();
        renderInventory();
        closeInventoryModal();
    }
);


// ========================================
// PRODUCTS ADMIN — DISPLAY
// ========================================

function renderAdminProducts() {
    adminProductsList.innerHTML = "";

    if (products.length === 0) {
        adminProductsList.innerHTML = `
            <div class="no-data">
                Keine Produkte vorhanden.
            </div>
        `;
        return;
    }

    products.forEach(function (product) {
        const row =
            document.createElement("div");

        row.className =
            "admin-product-row";

        const categoryLabel =
            product.category === "drink"
                ? "Getränk"
                : "Bäckerei";

        row.innerHTML = `
            <div class="admin-product-icon">
                ${escapeHtml(product.icon)}
            </div>

            <div class="admin-product-info">
                <strong>
                    ${escapeHtml(product.name)}
                </strong>

                <small>
                    ${categoryLabel}
                </small>

                <div class="admin-product-price">
                    ${formatPrice(product.price)}
                </div>
            </div>

            <div class="admin-product-actions">
                <button
                    class="icon-action edit-product-button"
                    data-product-id="${escapeHtml(product.id)}"
                    title="Bearbeiten"
                >
                    ✏️
                </button>

                <button
                    class="icon-action delete delete-product-button"
                    data-product-id="${escapeHtml(product.id)}"
                    title="Löschen"
                >
                    🗑️
                </button>
            </div>
        `;

        adminProductsList.appendChild(row);
    });

    document
        .querySelectorAll(".edit-product-button")
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    openProductModal(
                        button.dataset.productId
                    );
                }
            );
        });

    document
        .querySelectorAll(".delete-product-button")
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    deleteProduct(
                        button.dataset.productId
                    );
                }
            );
        });
}


// ========================================
// PRODUCT MODAL — ADD
// ========================================

addProductButton.addEventListener(
    "click",
    function () {
        openProductModal();
    }
);


function openProductModal(productId = null) {
    editingProductId =
        productId;

    if (productId) {
        const product =
            products.find(function (item) {
                return item.id === productId;
            });

        if (!product) {
            return;
        }

        productModalTitle.textContent =
            "Produkt bearbeiten";

        productNameInput.value =
            product.name;

        productPriceInput.value =
            Number(product.price)
                .toFixed(2);

        productCategoryInput.value =
            product.category;

        productIconInput.value =
            product.icon;
    } else {
        productModalTitle.textContent =
            "Produkt hinzufügen";

        productNameInput.value = "";
        productPriceInput.value = "";
        productCategoryInput.value = "drink";
        productIconInput.value = "🥤";
    }

    productModal.style.display = "flex";

    productModal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(function () {
        productNameInput.focus();
    }, 50);
}


// ========================================
// PRODUCT MODAL — CLOSE
// ========================================

function closeProductModal() {
    productModal.style.display = "none";

    productModal.setAttribute(
        "aria-hidden",
        "true"
    );

    editingProductId = null;
}


closeProductModalButton.addEventListener(
    "click",
    closeProductModal
);

cancelProductButton.addEventListener(
    "click",
    closeProductModal
);

productModal.addEventListener(
    "click",
    function (event) {
        if (event.target === productModal) {
            closeProductModal();
        }
    }
);


// ========================================
// PRODUCT — SAVE
// ========================================

saveProductButton.addEventListener(
    "click",
    function () {
        const name =
            productNameInput.value.trim();

        const price =
            Number(productPriceInput.value);

        const category =
            productCategoryInput.value;

        const icon =
            productIconInput.value.trim() ||
            "🥤";

        if (!name) {
            alert(
                "Bitte einen Produktnamen eingeben."
            );
            return;
        }

        if (
            !Number.isFinite(price) ||
            price < 0
        ) {
            alert(
                "Bitte einen gültigen Preis eingeben."
            );
            return;
        }

        if (
            category !== "drink" &&
            category !== "bakery"
        ) {
            alert("Ungültige Kategorie.");
            return;
        }

        if (editingProductId) {
            const product =
                products.find(function (item) {
                    return item.id === editingProductId;
                });

            if (!product) {
                return;
            }

            product.name = name;
            product.price = roundMoney(price);
            product.category = category;
            product.icon = icon;
        } else {
            const newProduct = {
                id: createProductId(name),
                name: name,
                price: roundMoney(price),
                category: category,
                icon: icon
            };

            products.push(newProduct);

            if (
                newProduct.category === "drink" &&
                inventory[newProduct.id] === undefined
            ) {
                inventory[newProduct.id] = 0;
                saveInventory();
            }
        }

        saveProducts();
        renderProducts();
        renderAdminProducts();

        closeProductModal();
    }
);


// ========================================
// PRODUCT — DELETE
// ========================================

function deleteProduct(productId) {
    const product =
        products.find(function (item) {
            return item.id === productId;
        });

    if (!product) {
        return;
    }

    const confirmed =
        confirm(
            "Produkt „" +
            product.name +
            "“ wirklich löschen?"
        );

    if (!confirmed) {
        return;
    }

    products =
        products.filter(function (item) {
            return item.id !== productId;
        });

    delete inventory[productId];

    saveProducts();
    saveInventory();

    cart =
        cart.filter(function (item) {
            return item.id !== productId;
        });

    updateCart();
    renderProducts();
    renderAdminProducts();
}


// ========================================
// HELPERS
// ========================================

function parseGermanNumber(value) {
    if (!value) {
        return 0;
    }

    return Number(
        String(value).replace(",", ".")
    );
}


function formatPrice(value) {
    const number =
        Number(value || 0);

    return number
        .toFixed(2)
        .replace(".", ",") +
        " €";
}


function roundMoney(value) {
    return Math.round(
        (Number(value) + Number.EPSILON) * 100
    ) / 100;
}


function createProductId(name) {
    const base =
        name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") ||
        "produkt";

    let id = base;
    let counter = 2;

    while (
        products.some(function (product) {
            return product.id === id;
        })
    ) {
        id = base + "-" + counter;
        counter += 1;
    }

    return id;
}


function getDateForFileName() {
    const date = new Date();

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ========================================
// END
// ========================================

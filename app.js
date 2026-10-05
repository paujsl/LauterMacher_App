// ========================================
// LAUTER MACHER
// APP.JS — STABILISIERTE VERSION
// ========================================


// ========================================
// SUPABASE AUTHENTIFIZIERUNG
// ========================================

const SUPABASE_URL = "https://gsbkfrjhierqopkwpqjc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiZ3Nia2ZyaWVy…";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let currentPerson = null;
let selectedLoginPerson = null;
let currentReturnScreen = null;
let saleTestMode = false;


// ========================================
// SCREENS
// ========================================

const identityScreen = document.getElementById("identityScreen");
const pinLoginScreen = document.getElementById("pinLoginScreen");
const homeScreen = document.getElementById("homeScreen");
const saleScreen = document.getElementById("saleScreen");
const paymentScreen = document.getElementById("paymentScreen");
const successScreen = document.getElementById("successScreen");
const bakeryMenuScreen = document.getElementById("bakeryMenuScreen");
const eventMenuScreen = document.getElementById("eventMenuScreen");
const adminScreen = document.getElementById("adminScreen");
const reportsScreen = document.getElementById("reportsScreen");
const inventoryScreen = document.getElementById("inventoryScreen");
const inventoryCountScreen = document.getElementById("inventoryCountScreen");
const productsScreen = document.getElementById("productsScreen");


// ========================================
// LOGIN
// ========================================

const peopleGrid = document.getElementById("peopleGrid");
const identityError = document.getElementById("identityError");
const selectedPersonName = document.getElementById("selectedPersonName");
const loginPinInput = document.getElementById("loginPinInput");
const pinLoginError = document.getElementById("pinLoginError");
const loginBackButton = document.getElementById("loginBackButton");
const loginConfirmButton = document.getElementById("loginConfirmButton");


// ========================================
// GLOBAL HEADER
// ========================================

const appHeader = document.getElementById("appHeader");
const currentPersonName = document.getElementById("currentPersonName");
const homeRoleLabel = document.getElementById("homeRoleLabel");
const logoutButton = document.getElementById("logoutButton");
const notificationButton = document.getElementById("notificationButton");
const notificationCount = document.getElementById("notificationCount");


// ========================================
// HOME
// ========================================

const saleButton = document.getElementById("saleButton");
const bakeryButton = document.getElementById("bakeryButton");
const adminButton = document.getElementById("adminButton");
const reportsHomeButton = document.getElementById("reportsHomeButton");
const eventButton = document.getElementById("eventButton");

// ========================================
// BÄCKEREI
// ========================================

const bakeryBackButton = document.getElementById("bakeryBackButton");
const bakeryCashButton = document.getElementById("bakeryCashButton");
const bakeryServiceButton = document.getElementById("bakeryServiceButton");


// ========================================
// SONDERVERANSTALTUNG
// ========================================

const eventBackButton = document.getElementById("eventBackButton");
const futureFunctionButtons = document.querySelectorAll(".future-function");


// ========================================
// SALE
// ========================================

const saleBackButton = document.getElementById("saleBackButton");
const drinksGrid = document.getElementById("drinksGrid");
const bakeryGrid = document.getElementById("bakeryGrid");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const payButton = document.getElementById("payButton");


// ========================================
// PAYMENT
// ========================================

const paymentBackButton = document.getElementById("paymentBackButton");
const paymentTotal = document.getElementById("paymentTotal");
const amountReceived = document.getElementById("amountReceived");
const changeAmount = document.getElementById("changeAmount");
const paidButton = document.getElementById("paidButton");
const paymentKeys = document.querySelectorAll(".payment-key");
const deletePaymentButton = document.getElementById("deletePaymentButton");


// ========================================
// SUCCESS
// ========================================

const successChange = document.getElementById("successChange");
const newOrderButton = document.getElementById("newOrderButton");
const successHomeButton = document.getElementById("successHomeButton");


// ========================================
// BEARBEITEN
// ========================================

const adminBackButton = document.getElementById("adminBackButton");
const productsButton = document.getElementById("productsButton");
const inventoryButton = document.getElementById("inventoryButton");
const editMenuTitle = document.getElementById("editMenuTitle");
const editMenuDescription = document.getElementById("editMenuDescription");
const inventoryMenuTitle = document.getElementById("inventoryMenuTitle");
const inventoryMenuDescription = document.getElementById("inventoryMenuDescription");


// ========================================
// PRODUCTS
// ========================================

const productsBackButton = document.getElementById("productsBackButton");
const adminProductsList = document.getElementById("adminProductsList");
const addProductButton = document.getElementById("addProductButton");
const productModal = document.getElementById("productModal");
const closeProductModalButton = document.getElementById("closeProductModalButton");
const cancelProductButton = document.getElementById("cancelProductButton");
const saveProductButton = document.getElementById("saveProductButton");
const productModalTitle = document.getElementById("productModalTitle");
const productNameInput = document.getElementById("productNameInput");
const productPriceInput = document.getElementById("productPriceInput");
const productCategoryInput = document.getElementById("productCategoryInput");
const productIconInput = document.getElementById("productIconInput");


// ========================================
// INVENTORY — TEACHER
// ========================================

const inventoryBackButton = document.getElementById("inventoryBackButton");
const inventoryList = document.getElementById("inventoryList");
const inventoryModal = document.getElementById("inventoryModal");
const closeInventoryModalButton = document.getElementById("closeInventoryModalButton");
const cancelInventoryButton = document.getElementById("cancelInventoryButton");
const saveInventoryButton = document.getElementById("saveInventoryButton");
const inventoryProductLabel = document.getElementById("inventoryProductLabel");
const inventoryAmountInput = document.getElementById("inventoryAmountInput");


// ========================================
// INVENTUR — STUDENT
// ========================================

const inventoryCountBackButton = document.getElementById("inventoryCountBackButton");
const inventoryCountList = document.getElementById("inventoryCountList");
const submitInventoryButton = document.getElementById("submitInventoryButton");


// ========================================
// REPORTS
// ========================================

const reportsBackButton = document.getElementById("reportsBackButton");
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
// VARIABLES / LOCAL DATA
// ========================================

let cart = [];
let receivedAmount = "";
let currentReportPeriod = "day";
let editingProductId = null;
let inventoryProductId = null;
let productsSyncInProgress = false;

const STORAGE_KEYS = {
    products: "lauterMacher_products_v1",
    sales: "lauterMacher_sales_v1",
    inventory: "lauterMacher_inventory_v1",
    inventorySubmissions: "lauterMacher_inventory_submissions_v1"
};

let products = loadProducts();
let sales = loadSales();
let inventory = loadInventory();


// ========================================
// INITIALISATION
// ========================================

document.addEventListener("DOMContentLoaded", async function () {
    renderProducts();
    updateCart();
    updateInventoryMenus();
    hideAppHeader();
    showScreen(identityScreen);
    await initialiseAuthentication();
});


// ========================================
// AUTHENTICATION
// ========================================

async function initialiseAuthentication() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {
            const restoredPerson = await loadCurrentPerson(sessionData.session);

            if (restoredPerson) {
                await applyLoggedInState(restoredPerson);
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
    loginPinInput.value = "";
    pinLoginError.textContent = "";

    showScreen(pinLoginScreen);
    hideAppHeader();

    setTimeout(function () {
        loginPinInput.focus();
    }, 50);
}


loginBackButton.addEventListener("click", function () {
    selectedLoginPerson = null;
    loginPinInput.value = "";
    pinLoginError.textContent = "";
    hideAppHeader();
    showScreen(identityScreen);
});


loginPinInput.addEventListener("input", function () {
    loginPinInput.value = loginPinInput.value
        .replace(/[^0-9]/g, "")
        .slice(0, 4);

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

        await applyLoggedInState(person);
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


async function applyLoggedInState(person) {
    currentPerson = person;
    selectedLoginPerson = null;

    currentPersonName.textContent = [person.first_name, person.last_name]
        .filter(Boolean)
        .join(" ");

    updateHomeForPerson();
    updateInventoryMenus();
    updateNotificationBadge();
    await refreshProductsFromSupabase();
    showAppHeader();
    showScreen(homeScreen);
}


logoutButton.addEventListener("click", async function () {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error("Abmeldung fehlgeschlagen.", error);
    }

    currentPerson = null;
    selectedLoginPerson = null;
    resetSale();
    currentPersonName.textContent = "-";
    hideAppHeader();
    showScreen(identityScreen);
    await loadLoginPeople();
});


supabaseClient.auth.onAuthStateChange(function (_event, session) {
    if (!session && currentPerson) {
        currentPerson = null;
        hideAppHeader();
        showScreen(identityScreen);
    }
});


// ========================================
// HEADER
// ========================================

function showAppHeader() {
    appHeader.classList.add("visible");
}


function hideAppHeader() {
    appHeader.classList.remove("visible");
}


function updateHomeForPerson() {
    const isTeacher = isCurrentTeacher();

    homeRoleLabel.textContent = isTeacher ? "Lehrkraft" : "Schüler/in";
    studentHomeMenu.hidden = isTeacher;
    teacherHomeMenu.hidden = !isTeacher;
    reportsHomeButton.hidden = false;

}


function isCurrentTeacher() {
    return Boolean(
        currentPerson &&
        currentPerson.person_type === "lehrer"
    );
}


function updateInventoryMenus() {
    const isTeacher = isCurrentTeacher();

    if (isTeacher) {
        editMenuTitle.textContent = "Bearbeiten";
        editMenuDescription.textContent = "Produkte, Preise und Inventar verwalten.";
        inventoryMenuTitle.textContent = "Inventar";
        inventoryMenuDescription.textContent = "Bestand verwalten";
    } else {
        editMenuTitle.textContent = "Bearbeiten";
        editMenuDescription.textContent = "Produkte und Preise selbstständig bearbeiten.";
        inventoryMenuTitle.textContent = "Inventur";
        inventoryMenuDescription.textContent = "Bestand zählen und an den Professor senden";
    }
}


function updateNotificationBadge() {
    if (!isCurrentTeacher()) {
        notificationCount.hidden = true;
        notificationCount.textContent = "0";
        return;
    }

    const submissions = loadInventorySubmissions();
    const pendingCount = submissions.length;

    if (pendingCount > 0) {
        notificationCount.hidden = false;
        notificationCount.textContent = String(pendingCount);
    } else {
        notificationCount.hidden = true;
        notificationCount.textContent = "0";
    }
}


notificationButton.addEventListener("click", function () {
    // Die Glocke bleibt bewusst ohne Meldungstext.
    // Das echte Benachrichtigungssystem folgt später.
});


// ========================================
// SUPABASE — PRODUCTS
// ========================================

function mapDbCategoryToAppCategory(category) {
    if (category === "getränke" || category === "drink") {
        return "drink";
    }

    if (category === "bäckerei" || category === "bakery") {
        return "bakery";
    }

    return category;
}


function mapAppCategoryToDbCategory(category) {
    if (category === "drink" || category === "getränke") {
        return "getränke";
    }

    if (category === "bakery" || category === "bäckerei") {
        return "bäckerei";
    }

    return category;
}


function mapDbProductToAppProduct(product) {
    return {
        id: String(product.id),
        name: String(product.name || ""),
        price: Number(product.price || 0),
        category: mapDbCategoryToAppCategory(product.category),
        icon: String(product.icon || "🥤"),
        active: product.active !== false
    };
}


async function refreshProductsFromSupabase() {
    if (!currentPerson || productsSyncInProgress) {
        return false;
    }

    productsSyncInProgress = true;

    try {
        const { data, error } = await supabaseClient
            .from("products")
            .select("id, name, price, category, icon, active, created_at")
            .eq("active", true)
            .order("created_at", { ascending: true })
            .order("name", { ascending: true });

        if (error) {
            throw error;
        }

        products = (data || []).map(mapDbProductToAppProduct);
        saveProducts();
        renderProducts();

        if (productsScreen && productsScreen.classList.contains("screen-visible")) {
            renderAdminProducts();
        }

        return true;
    } catch (error) {
        console.error("Produkte konnten nicht aus Supabase geladen werden.", error);
        return false;
    } finally {
        productsSyncInProgress = false;
    }
}


// ========================================
// LOCAL STORAGE — PRODUCTS
// ========================================

function loadProducts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.products);

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
        const saved = localStorage.getItem(STORAGE_KEYS.sales);

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
        const saved = localStorage.getItem(STORAGE_KEYS.inventory);

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
// LOCAL STORAGE — INVENTURMELDUNGEN
// ========================================

function loadInventorySubmissions() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.inventorySubmissions);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Inventurmeldungen konnten nicht geladen werden.", error);
        return [];
    }
}


function saveInventorySubmissions(submissions) {
    localStorage.setItem(
        STORAGE_KEYS.inventorySubmissions,
        JSON.stringify(submissions)
    );
}


// ========================================
// SCREEN NAVIGATION
// ========================================

function showScreen(screen, returnScreen = null) {
    if (!screen) {
        return;
    }

    if (returnScreen) {
        currentReturnScreen = returnScreen;
    }

    document.querySelectorAll(".screen").forEach(function (item) {
        item.classList.remove("screen-visible");
        item.style.display = "none";
    });

    screen.style.display = "block";
    screen.classList.add("screen-visible");

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


// ========================================
// HOME NAVIGATION
// ========================================

async function openSaleScreen() {
    saleTestMode = isCurrentTeacher();
    await refreshProductsFromSupabase();
    resetSale();
    showScreen(saleScreen, homeScreen);
}


function openBakeryMenu() {
    showScreen(bakeryMenuScreen, homeScreen);
}


function openEventMenu() {
    showScreen(eventMenuScreen, homeScreen);
}


function openEditMenu() {
    updateInventoryMenus();
    showScreen(adminScreen, homeScreen);
}


saleButton.addEventListener("click", openSaleScreen);
teacherSaleButton.addEventListener("click", openSaleScreen);

bakeryButton.addEventListener("click", openBakeryMenu);
teacherBakeryButton.addEventListener("click", openBakeryMenu);

eventButton.addEventListener("click", openEventMenu);
teacherEventButton.addEventListener("click", openEventMenu);

adminButton.addEventListener("click", openEditMenu);
teacherAdminButton.addEventListener("click", openEditMenu);


reportsHomeButton.addEventListener("click", function () {
    if (!isCurrentTeacher()) {
        return;
    }

    currentReportPeriod = "day";
    updatePeriodTabs();
    renderReport();
    showScreen(reportsScreen, homeScreen);
});


// ========================================
// BÄCKEREI NAVIGATION
// ========================================

bakeryBackButton.addEventListener("click", function () {
    showScreen(homeScreen);
});


bakeryCashButton.addEventListener("click", function () {
    alert("Die Bäckerei-Kasse wird noch gemeinsam festgelegt.");
});


bakeryServiceButton.addEventListener("click", function () {
    alert("Die Bäckerei-Ausgabe wird noch gemeinsam festgelegt.");
});


// ========================================
// SONDERVERANSTALTUNG NAVIGATION
// ========================================

eventBackButton.addEventListener("click", function () {
    showScreen(homeScreen);
});


futureFunctionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        alert("Diese Funktion wird noch gemeinsam festgelegt.");
    });
});


// ========================================
// SALE — RENDER PRODUCTS
// ========================================

function renderProducts() {
    drinksGrid.innerHTML = "";
    bakeryGrid.innerHTML = "";

    products
        .filter(function (product) {
            return product.category === "drink";
        })
        .forEach(function (product) {
            drinksGrid.appendChild(createProductButton(product));
        });

    products
        .filter(function (product) {
            return product.category === "bakery";
        })
        .forEach(function (product) {
            bakeryGrid.appendChild(createProductButton(product));
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

    button.type = "button";
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
// CART
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

        const total = Number(product.price) * Number(product.quantity);

        item.innerHTML = `
            <div class="cart-product-info">
                <span class="cart-product-name">${escapeHtml(product.name)}</span>
                <span class="cart-product-price">${formatPrice(total)}</span>
            </div>

            <div class="cart-controls">
                <button type="button" class="cart-control minus" data-index="${index}">−</button>
                <span class="cart-quantity">${product.quantity}</span>
                <button type="button" class="cart-control plus" data-index="${index}">+</button>
            </div>
        `;

        cartItems.appendChild(item);
    });

    cartTotal.textContent = formatPrice(calculateTotal());
    payButton.disabled = false;

    attachCartEvents();
}


function attachCartEvents() {
    document.querySelectorAll(".cart-control.minus").forEach(function (button) {
        button.addEventListener("click", function () {
            const index = Number(button.dataset.index);

            if (!cart[index]) {
                return;
            }

            cart[index].quantity -= 1;

            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }

            updateCart();
        });
    });

    document.querySelectorAll(".cart-control.plus").forEach(function (button) {
        button.addEventListener("click", function () {
            const index = Number(button.dataset.index);

            if (!cart[index]) {
                return;
            }

            cart[index].quantity += 1;
            updateCart();
        });
    });
}


function calculateTotal() {
    return cart.reduce(function (total, product) {
        return total + Number(product.price) * Number(product.quantity);
    }, 0);
}


saleBackButton.addEventListener("click", function () {
    resetSale();
    showScreen(homeScreen);
});


// ========================================
// PAYMENT
// ========================================

payButton.addEventListener("click", function () {
    if (cart.length === 0) {
        return;
    }

    paymentTotal.textContent = formatPrice(calculateTotal());
    receivedAmount = "";
    updatePaymentDisplay();
    showScreen(paymentScreen, saleScreen);
});


paymentBackButton.addEventListener("click", function () {
    receivedAmount = "";
    showScreen(saleScreen);
});


paymentKeys.forEach(function (button) {
    button.addEventListener("click", function () {
        const value = button.textContent.trim();

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


function addDecimal() {
    if (receivedAmount === "") {
        receivedAmount = "0";
    }

    if (!receivedAmount.includes(",")) {
        receivedAmount += ",";
    }

    updatePaymentDisplay();
}


deletePaymentButton.addEventListener("click", function () {
    receivedAmount = receivedAmount.slice(0, -1);
    updatePaymentDisplay();
});


function updatePaymentDisplay() {
    let displayValue = receivedAmount;

    if (displayValue === "" || displayValue === ",") {
        displayValue = "0,00";
    }

    amountReceived.textContent = displayValue + " €";
    calculateChange();
}


function calculateChange() {
    const total = calculateTotal();
    const received = parseGermanNumber(receivedAmount);
    const change = received - total;

    if (receivedAmount === "") {
        changeAmount.textContent = "0,00 €";
        paidButton.disabled = true;
        return;
    }

    if (change < 0) {
        changeAmount.textContent = "Noch " + formatPrice(Math.abs(change));
        paidButton.disabled = true;
        return;
    }

    changeAmount.textContent = formatPrice(change);
    paidButton.disabled = false;
}


paidButton.addEventListener("click", function () {
    const total = calculateTotal();
    const received = parseGermanNumber(receivedAmount);

    if (received < total) {
        return;
    }

    const change = received - total;

    saveSale(total, received, change);
    successChange.textContent = formatPrice(change);
    showScreen(successScreen);
});


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

    if (saleTestMode) {
        return;
    }

    const sale = {
        id: Date.now(),
        date: new Date().toISOString(),
        total: roundMoney(total),
        received: roundMoney(received),
        change: roundMoney(change),
        items: saleItems
    };

    sales.push(sale);
    saveSales();

    saleItems.forEach(function (item) {
        if (item.category !== "drink") {
            return;
        }

        const stock = Number(inventory[item.id] || 0);
        inventory[item.id] = stock - item.quantity;
    });

    saveInventory();
}


newOrderButton.addEventListener("click", function () {
    resetSale();
    showScreen(saleScreen, homeScreen);
});


successHomeButton.addEventListener("click", function () {
    resetSale();
    showScreen(homeScreen);
});


function resetSale() {
    cart = [];
    receivedAmount = "";
    saleTestMode = false;
    updateCart();
}


// ========================================
// BEARBEITEN
// ========================================

adminBackButton.addEventListener("click", function () {
    showScreen(homeScreen);
});


productsButton.addEventListener("click", async function () {
    await refreshProductsFromSupabase();
    renderAdminProducts();
    showScreen(productsScreen, adminScreen);
});


inventoryButton.addEventListener("click", function () {
    if (isCurrentTeacher()) {
        renderInventory();
        showScreen(inventoryScreen, adminScreen);
        return;
    }

    renderInventoryCount();
    showScreen(inventoryCountScreen, adminScreen);
});


// ========================================
// PRODUCTS — DISPLAY
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
        const row = document.createElement("div");
        row.className = "admin-product-row";

        const categoryLabel = product.category === "drink"
            ? "Getränk"
            : "Bäckerei";

        row.innerHTML = `
            <div class="admin-product-icon">${escapeHtml(product.icon)}</div>

            <div class="admin-product-info">
                <strong>${escapeHtml(product.name)}</strong>
                <small>${categoryLabel}</small>
                <div class="admin-product-price">${formatPrice(product.price)}</div>
            </div>

            <div class="admin-product-actions">
                <button type="button" class="icon-action edit-product-button" data-product-id="${escapeHtml(product.id)}" title="Bearbeiten">✏️</button>
                <button type="button" class="icon-action delete delete-product-button" data-product-id="${escapeHtml(product.id)}" title="Löschen">🗑️</button>
            </div>
        `;

        adminProductsList.appendChild(row);
    });

    document.querySelectorAll(".edit-product-button").forEach(function (button) {
        button.addEventListener("click", function () {
            openProductModal(button.dataset.productId);
        });
    });

    document.querySelectorAll(".delete-product-button").forEach(function (button) {
        button.addEventListener("click", function () {
            deleteProduct(button.dataset.productId);
        });
    });
}


addProductButton.addEventListener("click", function () {
    openProductModal();
});


function openProductModal(productId = null) {
    editingProductId = productId;

    if (productId) {
        const product = products.find(function (item) {
            return item.id === productId;
        });

        if (!product) {
            return;
        }

        productModalTitle.textContent = "Produkt bearbeiten";
        productNameInput.value = product.name;
        productPriceInput.value = Number(product.price).toFixed(2);
        productCategoryInput.value = product.category;
        productIconInput.value = product.icon;
    } else {
        productModalTitle.textContent = "Produkt hinzufügen";
        productNameInput.value = "";
        productPriceInput.value = "";
        productCategoryInput.value = "drink";
        productIconInput.value = "🥤";
    }

    productModal.style.display = "flex";
    productModal.setAttribute("aria-hidden", "false");

    setTimeout(function () {
        productNameInput.focus();
    }, 50);
}


function closeProductModal() {
    productModal.style.display = "none";
    productModal.setAttribute("aria-hidden", "true");
    editingProductId = null;
}


closeProductModalButton.addEventListener("click", closeProductModal);
cancelProductButton.addEventListener("click", closeProductModal);


productModal.addEventListener("click", function (event) {
    if (event.target === productModal) {
        closeProductModal();
    }
});


saveProductButton.addEventListener("click", async function () {
    const name = productNameInput.value.trim();
    const price = Number(productPriceInput.value);
    const category = productCategoryInput.value;
    const icon = productIconInput.value.trim() || "🥤";

    if (!name) {
        alert("Bitte einen Produktnamen eingeben.");
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        alert("Bitte einen gültigen Preis eingeben.");
        return;
    }

    if (category !== "drink" && category !== "bakery") {
        alert("Ungültige Kategorie.");
        return;
    }

    if (!currentPerson) {
        alert("Bitte zuerst anmelden.");
        return;
    }

    saveProductButton.disabled = true;
    saveProductButton.textContent = "Speichern …";

    try {
        const dbProduct = {
            name: name,
            price: roundMoney(price),
            category: mapAppCategoryToDbCategory(category),
            icon: icon,
            active: true
        };

        if (editingProductId) {
            const { data, error } = await supabaseClient
                .from("products")
                .update(dbProduct)
                .eq("id", editingProductId)
                .eq("active", true)
                .select("id, name, price, category, icon, active, created_at")
                .single();

            if (error) {
                throw error;
            }

            const updatedProduct = mapDbProductToAppProduct(data);

            products = products.map(function (product) {
                return product.id === updatedProduct.id
                    ? updatedProduct
                    : product;
            });
        } else {
            const { data, error } = await supabaseClient
                .from("products")
                .insert({
                    id: createProductId(name),
                    ...dbProduct
                })
                .select("id, name, price, category, icon, active, created_at")
                .single();

            if (error) {
                throw error;
            }

            const newProduct = mapDbProductToAppProduct(data);
            products.push(newProduct);

            if (newProduct.category === "drink") {
                inventory[newProduct.id] = Number(inventory[newProduct.id] || 0);
                saveInventory();
            }
        }

        saveProducts();
        renderProducts();
        renderAdminProducts();
        closeProductModal();
    } catch (error) {
        console.error("Produkt konnte nicht in Supabase gespeichert werden.", error);
        alert("Das Produkt konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
        saveProductButton.disabled = false;
        saveProductButton.textContent = "Speichern";
    }
});


async function deleteProduct(productId) {
    const product = products.find(function (item) {
        return item.id === productId;
    });

    if (!product || !currentPerson) {
        return;
    }

    const confirmed = confirm(
        "Produkt „" + product.name + "“ wirklich löschen?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("products")
            .update({ active: false })
            .eq("id", productId)
            .eq("active", true);

        if (error) {
            throw error;
        }

        products = products.filter(function (item) {
            return item.id !== productId;
        });

        delete inventory[productId];

        cart = cart.filter(function (item) {
            return item.id !== productId;
        });

        saveProducts();
        saveInventory();
        updateCart();
        renderProducts();
        renderAdminProducts();
    } catch (error) {
        console.error("Produkt konnte nicht in Supabase gelöscht werden.", error);
        alert("Das Produkt konnte nicht gelöscht werden. Bitte erneut versuchen.");
    }
}


productsBackButton.addEventListener("click", function () {
    closeProductModal();
    showScreen(adminScreen);
});


// ========================================
// INVENTAR — TEACHER
// ========================================

function renderInventory() {
    inventoryList.innerHTML = "";

    const drinks = products.filter(function (product) {
        return product.category === "drink";
    });

    if (drinks.length === 0) {
        inventoryList.innerHTML = '<div class="no-data">Keine Getränke vorhanden.</div>';
        return;
    }

    drinks.forEach(function (product) {
        const stock = Number(inventory[product.id] || 0);
        const card = document.createElement("div");
        card.className = "inventory-card";

        let stockClass = "";

        if (stock <= 0) {
            stockClass = "empty";
        } else if (stock <= 5) {
            stockClass = "low";
        }

        card.innerHTML = `
            <div class="inventory-product">
                <span class="inventory-icon">${escapeHtml(product.icon)}</span>
                <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <small>${formatPrice(product.price)}</small>
                </div>
            </div>

            <div class="inventory-stock ${stockClass}">
                ${stock} Stück
            </div>

            <button type="button" class="inventory-adjust-button" data-product-id="${escapeHtml(product.id)}">
                ＋ Bestand
            </button>
        `;

        inventoryList.appendChild(card);
    });

    document.querySelectorAll(".inventory-adjust-button").forEach(function (button) {
        button.addEventListener("click", function () {
            openInventoryModal(button.dataset.productId);
        });
    });
}


function openInventoryModal(productId) {
    const product = products.find(function (item) {
        return item.id === productId;
    });

    if (!product || !isCurrentTeacher()) {
        return;
    }

    inventoryProductId = productId;
    inventoryProductLabel.textContent =
        product.name +
        " · Aktueller Bestand: " +
        Number(inventory[productId] || 0) +
        " Stück";

    inventoryAmountInput.value = "";
    inventoryModal.style.display = "flex";
    inventoryModal.setAttribute("aria-hidden", "false");

    setTimeout(function () {
        inventoryAmountInput.focus();
    }, 50);
}


function closeInventoryModal() {
    inventoryModal.style.display = "none";
    inventoryModal.setAttribute("aria-hidden", "true");
    inventoryProductId = null;
}


closeInventoryModalButton.addEventListener("click", closeInventoryModal);
cancelInventoryButton.addEventListener("click", closeInventoryModal);


inventoryModal.addEventListener("click", function (event) {
    if (event.target === inventoryModal) {
        closeInventoryModal();
    }
});


saveInventoryButton.addEventListener("click", function () {
    if (!inventoryProductId || !isCurrentTeacher()) {
        closeInventoryModal();
        return;
    }

    const amount = Number(inventoryAmountInput.value);

    if (!Number.isInteger(amount) || amount <= 0) {
        alert("Bitte eine positive ganze Menge eingeben.");
        return;
    }

    inventory[inventoryProductId] =
        Number(inventory[inventoryProductId] || 0) + amount;

    saveInventory();
    renderInventory();
    closeInventoryModal();
});


inventoryBackButton.addEventListener("click", function () {
    showScreen(adminScreen);
});


// ========================================
// INVENTUR — STUDENT
// ========================================

function renderInventoryCount() {
    inventoryCountList.innerHTML = "";

    const drinks = products.filter(function (product) {
        return product.category === "drink";
    });

    if (drinks.length === 0) {
        inventoryCountList.innerHTML = '<div class="no-data">Keine Getränke vorhanden.</div>';
        return;
    }

    drinks.forEach(function (product) {
        const row = document.createElement("div");
        row.className = "inventory-count-row";

        row.innerHTML = `
            <div class="inventory-count-product">
                <span>${escapeHtml(product.icon)}</span>
                <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <small>${formatPrice(product.price)}</small>
                </div>
            </div>

            <input
                class="inventory-count-input"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                data-product-id="${escapeHtml(product.id)}"
                aria-label="Gezählter Bestand ${escapeHtml(product.name)}"
                placeholder="0"
            >
        `;

        inventoryCountList.appendChild(row);
    });
}


inventoryCountBackButton.addEventListener("click", function () {
    showScreen(adminScreen);
});


submitInventoryButton.addEventListener("click", function () {
    if (!currentPerson || currentPerson.person_type !== "schüler") {
        return;
    }

    const inputs = inventoryCountList.querySelectorAll(".inventory-count-input");
    const counts = [];
    let hasInvalidValue = false;

    inputs.forEach(function (input) {
        const value = input.value.trim();

        if (value === "") {
            return;
        }

        const quantity = Number(value);

        if (!Number.isInteger(quantity) || quantity < 0) {
            hasInvalidValue = true;
            return;
        }

        const product = products.find(function (item) {
            return item.id === input.dataset.productId;
        });

        if (product) {
            counts.push({
                product_id: product.id,
                product_name: product.name,
                quantity: quantity
            });
        }
    });

    if (hasInvalidValue) {
        alert("Bitte nur ganze Mengen ab 0 eingeben.");
        return;
    }

    if (counts.length === 0) {
        alert("Bitte mindestens eine gezählte Menge eingeben.");
        return;
    }

    const submissions = loadInventorySubmissions();

    submissions.push({
        id: Date.now(),
        submitted_at: new Date().toISOString(),
        person_id: currentPerson.id,
        person_name: [currentPerson.first_name, currentPerson.last_name]
            .filter(Boolean)
            .join(" "),
        counts: counts
    });

    saveInventorySubmissions(submissions);
    renderInventoryCount();
    alert("Die Inventur wurde an den Professor übermittelt.");
});


// ========================================
// REPORTS
// ========================================

reportsBackButton.addEventListener("click", function () {
    showScreen(homeScreen);
});


periodTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        currentReportPeriod = tab.dataset.period;
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


function renderReport() {
    if (!isCurrentTeacher()) {
        return;
    }

    const filteredSales = getSalesForPeriod(currentReportPeriod);

    const revenue = filteredSales.reduce(function (sum, sale) {
        return sum + Number(sale.total || 0);
    }, 0);

    let drinkCount = 0;
    let bakeryCount = 0;
    const productSummary = {};

    filteredSales.forEach(function (sale) {
        sale.items.forEach(function (item) {
            const quantity = Number(item.quantity || 0);

            if (item.category === "drink") {
                drinkCount += quantity;
            }

            if (item.category === "bakery") {
                bakeryCount += quantity;
            }

            if (!productSummary[item.id]) {
                productSummary[item.id] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }

            productSummary[item.id].quantity += quantity;
            productSummary[item.id].revenue += Number(item.price) * quantity;
        });
    });

    reportRevenue.textContent = formatPrice(revenue);
    reportTransactions.textContent = String(filteredSales.length);
    reportDrinks.textContent = String(drinkCount);
    reportBakery.textContent = String(bakeryCount);
    reportDateLabel.textContent = getReportLabel(currentReportPeriod);

    renderReportProducts(productSummary);
}


function renderReportProducts(productSummary) {
    reportProducts.innerHTML = "";

    const entries = Object.values(productSummary).sort(function (a, b) {
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
        const row = document.createElement("div");
        row.className = "report-product-row";

        row.innerHTML = `
            <span class="report-product-name">${escapeHtml(item.name)}</span>
            <span class="report-product-quantity">${item.quantity} Stück</span>
            <span class="report-product-revenue">${formatPrice(item.revenue)}</span>
        `;

        reportProducts.appendChild(row);
    });
}


function getSalesForPeriod(period) {
    const now = new Date();

    return sales.filter(function (sale) {
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
    const result = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const day = result.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + difference);
    result.setHours(0, 0, 0, 0);

    return result;
}


function getReportLabel(period) {
    const now = new Date();

    if (period === "day") {
        return "Heute · " + now.toLocaleDateString("de-DE");
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


exportReportButton.addEventListener("click", exportReportAsCSV);


function exportReportAsCSV() {
    if (!isCurrentTeacher()) {
        return;
    }

    const filteredSales = getSalesForPeriod(currentReportPeriod);
    const rows = [[
        "Datum",
        "Produkt",
        "Kategorie",
        "Menge",
        "Einzelpreis",
        "Umsatz"
    ]];

    filteredSales.forEach(function (sale) {
        sale.items.forEach(function (item) {
            rows.push([
                new Date(sale.date).toLocaleString("de-DE"),
                item.name,
                item.category === "drink" ? "Getränk" : "Bäckerei",
                item.quantity,
                Number(item.price).toFixed(2).replace(".", ","),
                (
                    Number(item.price) *
                    Number(item.quantity)
                ).toFixed(2).replace(".", ",")
            ]);
        });
    });

    if (rows.length === 1) {
        alert("Keine Verkaufsdaten für diesen Zeitraum.");
        return;
    }

    const csv = rows
        .map(function (row) {
            return row.map(csvEscape).join(";");
        })
        .join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

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
    const text = String(value ?? "");

    if (
        text.includes(";") ||
        text.includes('"') ||
        text.includes("\n")
    ) {
        return '"' + text.replaceAll('"', '""') + '"';
    }

    return text;
}


clearReportsButton.addEventListener("click", function () {
    if (!isCurrentTeacher()) {
        return;
    }

    if (sales.length === 0) {
        alert("Es gibt keine Verkaufsdaten.");
        return;
    }

    const confirmed = confirm(
        "Möchtest du wirklich ALLE Verkaufsdaten löschen?"
    );

    if (!confirmed) {
        return;
    }

    sales = [];
    saveSales();
    renderReport();
    alert("Alle Verkaufsdaten wurden gelöscht.");
});


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
    const number = Number(value || 0);

    return (
        number
            .toFixed(2)
            .replace(".", ",") +
        " €"
    );
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

    while (products.some(function (product) {
        return product.id === id;
    })) {
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

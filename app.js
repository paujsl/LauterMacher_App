const SUPABASE_URL = "https://gsbkfrjhierqopkwpqjc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiZ3Nia2ZyamllcnFvcGt3cHFqYyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzkwOTIyNzI4LCJleHAiOjIxMDY0OTg3Mjh9.BV5aYeAO2nE5SjiEOCs3GA1hwQpg0IJzEl5wizApUVU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

let currentPerson = null;
let selectedLoginPerson = null;
let currentReturnScreen = null;

let cart = [];
let receivedAmount = "";
let currentReportPeriod = "day";
let editingProductId = null;
let inventoryProductId = null;
let saleTestMode = false;

let currentEventId = null;
let eventProductEditingId = null;
let eventSaleCart = [];
let eventReceivedAmount = "";
let currentEventSaleTestMode = false;
let currentSuccessContext = "daily";

let eventStartInventoryRows = [];
let eventSetupInvoices = [];


const STORAGE_KEYS = {
    products: "lauterMacher_products_v1",
    sales: "lauterMacher_sales_v1",
    inventory: "lauterMacher_inventory_v1",
    inventorySubmissions: "lauterMacher_inventory_submissions_v1",
    shiftClosures: "lauterMacher_shift_closures_v1",
    invoices: "lauterMacher_invoices_v1",
    purchases: "lauterMacher_purchases_v1",
    events: "lauterMacher_events_v1"
};


const DEFAULT_PRODUCTS = [
    {
        id: "wasser",
        name: "Wasser",
        price: 1.00,
        category: "drink",
        icon: "💧"
    },
    {
        id: "apfelsaft",
        name: "Apfelsaft",
        price: 1.50,
        category: "drink",
        icon: "🧃"
    },
    {
        id: "capri-sun",
        name: "Capri-Sun",
        price: 1.50,
        category: "drink",
        icon: "🧃"
    },
    {
        id: "fake-cola",
        name: "Fake Cola",
        price: 1.50,
        category: "drink",
        icon: "🥤"
    },
    {
        id: "fake-fanta",
        name: "Fake Fanta",
        price: 1.50,
        category: "drink",
        icon: "🥤"
    },
    {
        id: "fake-sprite",
        name: "Fake Sprite",
        price: 1.50,
        category: "drink",
        icon: "🥤"
    },
    {
        id: "isodrink",
        name: "Isodrink",
        price: 2.00,
        category: "drink",
        icon: "⚡"
    }
];


const identityScreen = document.getElementById("identityScreen");
const pinLoginScreen = document.getElementById("pinLoginScreen");
const homeScreen = document.getElementById("homeScreen");
const saleScreen = document.getElementById("saleScreen");
const paymentScreen = document.getElementById("paymentScreen");
const successScreen = document.getElementById("successScreen");
const bakeryMenuScreen = document.getElementById("bakeryMenuScreen");
const bakeryCashScreen = document.getElementById("bakeryCashScreen");
const bakeryOutputScreen = document.getElementById("bakeryOutputScreen");
const adminScreen = document.getElementById("adminScreen");
const inventoryScreen = document.getElementById("inventoryScreen");
const inventoryCountScreen = document.getElementById("inventoryCountScreen");
const inventoryInvoicesScreen = document.getElementById("inventoryInvoicesScreen");
const productsScreen = document.getElementById("productsScreen");
const reportsScreen = document.getElementById("reportsScreen");
const eventListScreen = document.getElementById("eventListScreen");
const eventCreateScreen = document.getElementById("eventCreateScreen");
const eventStartSetupScreen = document.getElementById("eventStartSetupScreen");
const eventProductsScreen = document.getElementById("eventProductsScreen");
const eventWorkspaceScreen = document.getElementById("eventWorkspaceScreen");
const eventCashScreen = document.getElementById("eventCashScreen");
const eventOutputScreen = document.getElementById("eventOutputScreen");
const eventEndInventoryScreen = document.getElementById("eventEndInventoryScreen");


const peopleGrid = document.getElementById("peopleGrid");
const identityError = document.getElementById("identityError");
const selectedPersonName = document.getElementById("selectedPersonName");
const loginPinInput = document.getElementById("loginPinInput");
const pinLoginError = document.getElementById("pinLoginError");
const loginBackButton = document.getElementById("loginBackButton");
const loginConfirmButton = document.getElementById("loginConfirmButton");


const appHeader = document.getElementById("appHeader");
const currentPersonName = document.getElementById("currentPersonName");
const homeRoleLabel = document.getElementById("homeRoleLabel");
const logoutButton = document.getElementById("logoutButton");
const notificationButton = document.getElementById("notificationButton");
const notificationCount = document.getElementById("notificationCount");


const studentHomeMenu = document.getElementById("studentHomeMenu");
const teacherHomeMenu = document.getElementById("teacherHomeMenu");

const saleButton = document.getElementById("saleButton");
const teacherSaleButton = document.getElementById("teacherSaleButton");
const bakeryButton = document.getElementById("bakeryButton");
const teacherBakeryButton = document.getElementById("teacherBakeryButton");
const adminButton = document.getElementById("adminButton");
const teacherAdminButton = document.getElementById("teacherAdminButton");
const reportsHomeButton = document.getElementById("reportsHomeButton");
const eventButton = document.getElementById("eventButton");
const teacherEventButton = document.getElementById("teacherEventButton");


const bakeryBackButton = document.getElementById("bakeryBackButton");
const bakeryCashButton = document.getElementById("bakeryCashButton");
const bakeryServiceButton = document.getElementById("bakeryServiceButton");
const bakeryCashBackButton = document.getElementById("bakeryCashBackButton");
const bakeryOutputBackButton = document.getElementById("bakeryOutputBackButton");
const bakeryCashShiftEndButton = document.getElementById("bakeryCashShiftEndButton");
const bakeryOutputShiftEndButton = document.getElementById("bakeryOutputShiftEndButton");


const saleBackButton = document.getElementById("saleBackButton");
const drinksGrid = document.getElementById("drinksGrid");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const payButton = document.getElementById("payButton");
const paymentBackButton = document.getElementById("paymentBackButton");
const paymentTotal = document.getElementById("paymentTotal");
const amountReceived = document.getElementById("amountReceived");
const changeAmount = document.getElementById("changeAmount");
const paidButton = document.getElementById("paidButton");
const paymentKeys = document.querySelectorAll(".payment-key:not(.delete-key)");
const deletePaymentButton = document.getElementById("deletePaymentButton");
const successTitle = document.getElementById("successTitle");
const successDescription = document.getElementById("successDescription");
const successChange = document.getElementById("successChange");
const newOrderButton = document.getElementById("newOrderButton");
const successShiftEndButton = document.getElementById("successShiftEndButton");


const adminBackButton = document.getElementById("adminBackButton");
const productsButton = document.getElementById("productsButton");
const inventoryButton = document.getElementById("inventoryButton");
const inventoryInvoicesButton = document.getElementById("inventoryInvoicesButton");
const studentsButton = document.getElementById("studentsButton");
const editMenuTitle = document.getElementById("editMenuTitle");
const editMenuDescription = document.getElementById("editMenuDescription");
const inventoryMenuTitle = document.getElementById("inventoryMenuTitle");
const inventoryMenuDescription = document.getElementById("inventoryMenuDescription");


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


const inventoryBackButton = document.getElementById("inventoryBackButton");
const inventoryList = document.getElementById("inventoryList");
const inventoryModal = document.getElementById("inventoryModal");
const closeInventoryModalButton = document.getElementById("closeInventoryModalButton");
const cancelInventoryButton = document.getElementById("cancelInventoryButton");
const saveInventoryButton = document.getElementById("saveInventoryButton");
const inventoryProductLabel = document.getElementById("inventoryProductLabel");
const inventoryAmountInput = document.getElementById("inventoryAmountInput");


const inventoryCountBackButton = document.getElementById("inventoryCountBackButton");
const inventoryCountList = document.getElementById("inventoryCountList");
const submitInventoryButton = document.getElementById("submitInventoryButton");


const inventoryInvoicesBackButton = document.getElementById("inventoryInvoicesBackButton");
const invoiceContextInput = document.getElementById("invoiceContextInput");
const invoiceDateInput = document.getElementById("invoiceDateInput");
const invoiceSupplierInput = document.getElementById("invoiceSupplierInput");
const invoiceNumberInput = document.getElementById("invoiceNumberInput");
const invoiceProductInput = document.getElementById("invoiceProductInput");
const invoiceQuantityInput = document.getElementById("invoiceQuantityInput");
const invoiceAmountInput = document.getElementById("invoiceAmountInput");
const saveInvoiceButton = document.getElementById("saveInvoiceButton");
const purchaseContextInput = document.getElementById("purchaseContextInput");
const purchaseProductInput = document.getElementById("purchaseProductInput");
const purchaseQuantityInput = document.getElementById("purchaseQuantityInput");
const savePurchaseButton = document.getElementById("savePurchaseButton");
const invoiceList = document.getElementById("invoiceList");


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


const eventListBackButton = document.getElementById("eventListBackButton");
const eventListTitle = document.getElementById("eventListTitle");
const eventListDescription = document.getElementById("eventListDescription");
const createEventButton = document.getElementById("createEventButton");
const eventList = document.getElementById("eventList");


const eventCreateBackButton = document.getElementById("eventCreateBackButton");
const eventNameInput = document.getElementById("eventNameInput");
const eventDateInput = document.getElementById("eventDateInput");
const eventStartInventoryYesButton = document.getElementById("eventStartInventoryYesButton");
const eventStartInventoryNoButton = document.getElementById("eventStartInventoryNoButton");


const eventStartSetupBackButton = document.getElementById("eventStartSetupBackButton");
const eventStartSetupTitle = document.getElementById("eventStartSetupTitle");
const eventStartInventoryList = document.getElementById("eventStartInventoryList");
const addEventStartStockButton = document.getElementById("addEventStartStockButton");
const eventInvoiceDateInput = document.getElementById("eventInvoiceDateInput");
const eventInvoiceSupplierInput = document.getElementById("eventInvoiceSupplierInput");
const eventInvoiceNumberInput = document.getElementById("eventInvoiceNumberInput");
const eventInvoiceProductInput = document.getElementById("eventInvoiceProductInput");
const eventInvoiceQuantityInput = document.getElementById("eventInvoiceQuantityInput");
const eventInvoiceAmountInput = document.getElementById("eventInvoiceAmountInput");
const addEventInvoiceButton = document.getElementById("addEventInvoiceButton");
const eventInvoiceList = document.getElementById("eventInvoiceList");
const eventStartSetupContinueButton = document.getElementById("eventStartSetupContinueButton");


const eventProductsBackButton = document.getElementById("eventProductsBackButton");
const eventProductsTitle = document.getElementById("eventProductsTitle");
const addEventProductButton = document.getElementById("addEventProductButton");
const eventProductsList = document.getElementById("eventProductsList");
const eventProductsContinueButton = document.getElementById("eventProductsContinueButton");
const eventProductModal = document.getElementById("eventProductModal");
const closeEventProductModalButton = document.getElementById("closeEventProductModalButton");
const cancelEventProductButton = document.getElementById("cancelEventProductButton");
const saveEventProductButton = document.getElementById("saveEventProductButton");
const eventProductModalTitle = document.getElementById("eventProductModalTitle");
const eventProductNameInput = document.getElementById("eventProductNameInput");
const eventProductPriceInput = document.getElementById("eventProductPriceInput");
const eventProductIconInput = document.getElementById("eventProductIconInput");


const eventWorkspaceBackButton = document.getElementById("eventWorkspaceBackButton");
const eventWorkspaceName = document.getElementById("eventWorkspaceName");
const eventWorkspaceDate = document.getElementById("eventWorkspaceDate");
const eventWorkspaceStudentOptions = document.getElementById("eventWorkspaceStudentOptions");
const eventWorkspaceTeacherOptions = document.getElementById("eventWorkspaceTeacherOptions");
const studentEventCashButton = document.getElementById("studentEventCashButton");
const studentEventOutputButton = document.getElementById("studentEventOutputButton");
const teacherEventCashButton = document.getElementById("teacherEventCashButton");
const teacherEventOutputButton = document.getElementById("teacherEventOutputButton");
const teacherEventEndInventoryButton = document.getElementById("teacherEventEndInventoryButton");


const eventCashBackButton = document.getElementById("eventCashBackButton");
const eventCashTitle = document.getElementById("eventCashTitle");
const eventCashProductHeading = document.getElementById("eventCashProductHeading");
const eventCashProductsGrid = document.getElementById("eventCashProductsGrid");
const eventCartItems = document.getElementById("eventCartItems");
const eventCartTotal = document.getElementById("eventCartTotal");
const eventPayButton = document.getElementById("eventPayButton");
const eventCashShiftEndButton = document.getElementById("eventCashShiftEndButton");


const eventOutputBackButton = document.getElementById("eventOutputBackButton");
const eventOutputTitle = document.getElementById("eventOutputTitle");
const eventOutputOrders = document.getElementById("eventOutputOrders");
const eventOutputShiftEndButton = document.getElementById("eventOutputShiftEndButton");


const eventEndInventoryBackButton = document.getElementById("eventEndInventoryBackButton");
const eventEndInventoryTitle = document.getElementById("eventEndInventoryTitle");
const eventEndInventoryList = document.getElementById("eventEndInventoryList");
const saveEventEndInventoryButton = document.getElementById("saveEventEndInventoryButton");


const siteMessageModal = document.getElementById("siteMessageModal");
const siteMessageIcon = document.getElementById("siteMessageIcon");
const siteMessageTitle = document.getElementById("siteMessageTitle");
const siteMessageText = document.getElementById("siteMessageText");
const siteMessagePrimaryButton = document.getElementById("siteMessagePrimaryButton");
let siteMessageCallback = null;


document.addEventListener("DOMContentLoaded", async function () {
    setDefaultDates();
    renderProducts();
    updateCart();
    hideAppHeader();
    updateInventoryMenus();
    showScreen(identityScreen);
    await initialiseAuthentication();
});


async function initialiseAuthentication() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {
            const restoredPerson = await loadCurrentPerson(sessionData.session);

            if (restoredPerson) {
                applyLoggedInState(restoredPerson);
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
        identityError.textContent = "Personen konnten nicht geladen werden. Bitte Verbindung prüfen.";
        return;
    }

    peopleGrid.innerHTML = "";

    (data || []).forEach(function (person) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "person-login-card";

        const fullName = getFullName(person);

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

    if (!data || data.length === 0) {
        identityError.textContent = "Keine aktiven Personen gefunden.";
    }
}


function selectLoginPerson(person) {
    selectedLoginPerson = person;
    selectedPersonName.textContent = getFullName(person);
    loginPinInput.value = "";
    pinLoginError.textContent = "";
    hideAppHeader();
    showScreen(pinLoginScreen);

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
    selectedLoginPerson = null;

    currentPersonName.textContent = getFullName(person);
    homeRoleLabel.textContent = isCurrentTeacher() ? "Professor" : "";

    updateHomeForPerson();
    updateInventoryMenus();
    updateNotificationBadge();
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
    currentPersonName.textContent = "-";
    homeRoleLabel.textContent = "";
    hideAppHeader();
    resetSale();
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


function showAppHeader() {
    appHeader.classList.add("visible");
}


function hideAppHeader() {
    appHeader.classList.remove("visible");
}


function updateHomeForPerson() {
    const isTeacher = isCurrentTeacher();

    studentHomeMenu.hidden = isTeacher;
    teacherHomeMenu.hidden = !isTeacher;
    homeRoleLabel.hidden = !isTeacher;
}


function isCurrentTeacher() {
    return Boolean(
        currentPerson &&
        currentPerson.person_type === "lehrer"
    );
}


function updateInventoryMenus() {
    const isTeacher = isCurrentTeacher();

    editMenuTitle.textContent = "Bearbeiten";

    if (isTeacher) {
        editMenuDescription.textContent =
            "Produkte, Inventur, Rechnungen und Schüler verwalten.";

        inventoryMenuTitle.textContent =
            "Inventur & Rechnungen";

        inventoryMenuDescription.textContent =
            "Bestände, gekaufte Mengen und Kosten erfassen";

        inventoryInvoicesButton.hidden = false;
        studentsButton.hidden = false;
    } else {
        editMenuDescription.textContent =
            "Produkte und Preise selbstständig bearbeiten.";

        inventoryMenuTitle.textContent =
            "Inventur";

        inventoryMenuDescription.textContent =
            "Bestand zählen und an den Lehrer schicken";

        inventoryInvoicesButton.hidden = true;
        studentsButton.hidden = true;
    }
}


function updateNotificationBadge() {
    if (!isCurrentTeacher()) {
        notificationCount.hidden = true;
        notificationCount.textContent = "0";
        return;
    }

    const submissions = loadInventorySubmissions();

    if (submissions.length > 0) {
        notificationCount.hidden = false;
        notificationCount.textContent = String(submissions.length);
    } else {
        notificationCount.hidden = true;
        notificationCount.textContent = "0";
    }
}


notificationButton.addEventListener("click", function () {
    // Le vrai système de notifications sera ajouté plus tard.
});


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

    const fallback =
        typeof PRODUCTS !== "undefined" &&
        Array.isArray(PRODUCTS)
            ? PRODUCTS
            : DEFAULT_PRODUCTS;

    return fallback.map(function (product) {
        return { ...product };
    });
}


function saveProducts() {
    localStorage.setItem(
        STORAGE_KEYS.products,
        JSON.stringify(products)
    );
}


function loadSales() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.sales);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error("Verkaufsdaten konnten nicht geladen werden.", error);
        return [];
    }
}


function saveSales() {
    localStorage.setItem(
        STORAGE_KEYS.sales,
        JSON.stringify(sales)
    );
}


function loadInventory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.inventory);
        const parsed = saved ? JSON.parse(saved) : {};

        return parsed &&
            typeof parsed === "object"
            ? parsed
            : {};
    } catch (error) {
        console.error("Inventar konnte nicht geladen werden.", error);
        return {};
    }
}


function saveInventory() {
    localStorage.setItem(
        STORAGE_KEYS.inventory,
        JSON.stringify(inventory)
    );
}


function loadInventorySubmissions() {
    try {
        const saved = localStorage.getItem(
            STORAGE_KEYS.inventorySubmissions
        );

        const parsed =
            saved
                ? JSON.parse(saved)
                : [];

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            "Inventurmeldungen konnten nicht geladen werden.",
            error
        );

        return [];
    }
}


function saveInventorySubmissions(submissions) {
    localStorage.setItem(
        STORAGE_KEYS.inventorySubmissions,
        JSON.stringify(submissions)
    );
}


function loadShiftClosures() {
    try {
        const saved =
            localStorage.getItem(
                STORAGE_KEYS.shiftClosures
            );

        const parsed =
            saved
                ? JSON.parse(saved)
                : [];

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            "Schichtabschlüsse konnten nicht geladen werden.",
            error
        );

        return [];
    }
}


function saveShiftClosures(closures) {
    localStorage.setItem(
        STORAGE_KEYS.shiftClosures,
        JSON.stringify(closures)
    );
}


function loadInvoices() {
    try {
        const saved =
            localStorage.getItem(
                STORAGE_KEYS.invoices
            );

        const parsed =
            saved
                ? JSON.parse(saved)
                : [];

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            "Rechnungen konnten nicht geladen werden.",
            error
        );

        return [];
    }
}


function saveInvoices(invoices) {
    localStorage.setItem(
        STORAGE_KEYS.invoices,
        JSON.stringify(invoices)
    );
}


function loadPurchases() {
    try {
        const saved =
            localStorage.getItem(
                STORAGE_KEYS.purchases
            );

        const parsed =
            saved
                ? JSON.parse(saved)
                : [];

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            "Wareneingänge konnten nicht geladen werden.",
            error
        );

        return [];
    }
}


function savePurchases(purchases) {
    localStorage.setItem(
        STORAGE_KEYS.purchases,
        JSON.stringify(purchases)
    );
}


function loadEvents() {
    try {
        const saved =
            localStorage.getItem(
                STORAGE_KEYS.events
            );

        const parsed =
            saved
                ? JSON.parse(saved)
                : [];

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            "Veranstaltungen konnten nicht geladen werden.",
            error
        );

        return [];
    }
}


function saveEvents(events) {
    localStorage.setItem(
        STORAGE_KEYS.events,
        JSON.stringify(events)
    );
}


let products = loadProducts();
let sales = loadSales();
let inventory = loadInventory();


function showScreen(
    screen,
    returnScreen = null
) {
    if (!screen) {
        return;
    }

    if (returnScreen) {
        currentReturnScreen =
            returnScreen;
    }

    document
        .querySelectorAll(".screen")
        .forEach(function (item) {
            item.classList.remove(
                "screen-visible"
            );

            item.style.display =
                "none";
        });

    screen.style.display =
        "block";

    screen.classList.add(
        "screen-visible"
    );

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


function openSaleScreen() {
    saleTestMode =
        isCurrentTeacher();

    resetSale();

    showScreen(
        saleScreen,
        homeScreen
    );
}


function openBakeryMenu() {
    showScreen(
        bakeryMenuScreen,
        homeScreen
    );
}


function openEditMenu() {
    updateInventoryMenus();

    showScreen(
        adminScreen,
        homeScreen
    );
}


function openEventList() {
    renderEventList();

    showScreen(
        eventListScreen,
        homeScreen
    );
}


saleButton.addEventListener(
    "click",
    openSaleScreen
);

teacherSaleButton.addEventListener(
    "click",
    openSaleScreen
);

bakeryButton.addEventListener(
    "click",
    openBakeryMenu
);

teacherBakeryButton.addEventListener(
    "click",
    openBakeryMenu
);

adminButton.addEventListener(
    "click",
    openEditMenu
);

teacherAdminButton.addEventListener(
    "click",
    openEditMenu
);

eventButton.addEventListener(
    "click",
    openEventList
);

teacherEventButton.addEventListener(
    "click",
    openEventList
);


reportsHomeButton.addEventListener(
    "click",
    function () {
        if (!isCurrentTeacher()) {
            return;
        }

        currentReportPeriod =
            "day";

        updatePeriodTabs();

        renderReport();

        showScreen(
            reportsScreen,
            homeScreen
        );
    }
);


bakeryBackButton.addEventListener(
    "click",
    function () {
        showScreen(homeScreen);
    }
);


bakeryCashButton.addEventListener(
    "click",
    function () {
        showScreen(
            bakeryCashScreen,
            bakeryMenuScreen
        );
    }
);


bakeryServiceButton.addEventListener(
    "click",
    function () {
        showScreen(
            bakeryOutputScreen,
            bakeryMenuScreen
        );
    }
);


bakeryCashBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            bakeryMenuScreen
        );
    }
);


bakeryOutputBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            bakeryMenuScreen
        );
    }
);


bakeryCashShiftEndButton.addEventListener(
    "click",
    function () {
        endDailyShift(
            "Bäckerei · Kasse",
            homeScreen
        );
    }
);


bakeryOutputShiftEndButton.addEventListener(
    "click",
    function () {
        endDailyShift(
            "Bäckerei · Ausgabe",
            homeScreen
        );
    }
);


function renderProducts() {
    drinksGrid.innerHTML = "";

    products
        .filter(function (product) {
            return product.category === "drink";
        })
        .forEach(function (product) {
            drinksGrid.appendChild(
                createProductButton(product)
            );
        });

    if (
        drinksGrid.children.length ===
        0
    ) {
        drinksGrid.innerHTML = `
            <div class="coming-soon">
                Keine Getränke vorhanden.
            </div>
        `;
    }
}


function createProductButton(
    product
) {
    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.className =
        "product-card";

    button.dataset.productId =
        product.id;

    button.innerHTML = `
        <span class="product-icon">
            ${escapeHtml(product.icon)}
        </span>

        <span class="product-name">
            ${escapeHtml(product.name)}
        </span>

        <span class="product-price">
            ${formatPrice(product.price)}
        </span>
    `;

    button.addEventListener(
        "click",
        function () {
            addToCart(
                product
            );
        }
    );

    return button;
}


function addToCart(
    product
) {
    const existing =
        cart.find(
            function (item) {
                return item.id ===
                    product.id;
            }
        );

    if (existing) {
        existing.quantity += 1;
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
    cartItems.innerHTML =
        "";

    if (
        cart.length ===
        0
    ) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                Noch keine Getränke ausgewählt.
            </div>
        `;

        cartTotal.textContent =
            "0,00 €";

        payButton.disabled =
            true;

        return;
    }

    cart.forEach(
        function (
            product,
            index
        ) {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "cart-item";

            const total =
                Number(
                    product.price
                ) *
                Number(
                    product.quantity
                );

            item.innerHTML = `
                <div class="cart-product-info">
                    <span class="cart-product-name">
                        ${escapeHtml(
                            product.name
                        )}
                    </span>

                    <span class="cart-product-price">
                        ${formatPrice(
                            total
                        )}
                    </span>
                </div>

                <div class="cart-controls">

                    <button
                        type="button"
                        class="cart-control minus"
                        data-index="${index}"
                    >
                        −
                    </button>

                    <span class="cart-quantity">
                        ${product.quantity}
                    </span>

                    <button
                        type="button"
                        class="cart-control plus"
                        data-index="${index}"
                    >
                        +
                    </button>

                </div>
            `;

            cartItems.appendChild(
                item
            );
        }
    );

    cartTotal.textContent =
        formatPrice(
            calculateTotal()
        );

    payButton.disabled =
        false;

    document
        .querySelectorAll(
            "#cartItems .cart-control.minus"
        )
        .forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    function () {
                        const index =
                            Number(
                                button.dataset.index
                            );

                        if (!cart[index]) {
                            return;
                        }

                        cart[index].quantity -=
                            1;

                        if (
                            cart[index].quantity <=
                            0
                        ) {
                            cart.splice(
                                index,
                                1
                            );
                        }

                        updateCart();
                    }
                );
            }
        );

    document
        .querySelectorAll(
            "#cartItems .cart-control.plus"
        )
        .forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    function () {
                        const index =
                            Number(
                                button.dataset.index
                            );

                        if (!cart[index]) {
                            return;
                        }

                        cart[index].quantity +=
                            1;

                        updateCart();
                    }
                );
            }
        );
}


function calculateTotal() {
    return cart.reduce(
        function (
            total,
            product
        ) {
            return total +
                Number(
                    product.price
                ) *
                Number(
                    product.quantity
                );
        },
        0
    );
}


saleBackButton.addEventListener(
    "click",
    function () {
        resetSale();
        showScreen(
            homeScreen
        );
    }
);


payButton.addEventListener(
    "click",
    function () {
        if (cart.length === 0) {
            return;
        }

        paymentTotal.textContent =
            formatPrice(
                calculateTotal()
            );

        receivedAmount =
            "";

        updatePaymentDisplay();

        showScreen(
            paymentScreen,
            saleScreen
        );
    }
);


paymentBackButton.addEventListener(
    "click",
    function () {
        receivedAmount =
            "";

        showScreen(
            saleScreen
        );
    }
);


paymentKeys.forEach(
    function (button) {
        button.addEventListener(
            "click",
            function () {

                const value =
                    button.textContent.trim();

                if (
                    value ===
                    ","
                ) {
                    addDecimal();
                    return;
                }

                if (
                    receivedAmount ===
                    "0"
                ) {
                    receivedAmount =
                        "";
                }

                if (
                    receivedAmount.includes(
                        ","
                    ) &&
                    receivedAmount
                        .split(",")[1]
                        .length >=
                        2
                ) {
                    return;
                }

                receivedAmount +=
                    value;

                updatePaymentDisplay();
            }
        );
    }
);


function addDecimal() {
    if (
        receivedAmount ===
        ""
    ) {
        receivedAmount =
            "0";
    }

    if (
        !receivedAmount.includes(
            ","
        )
    ) {
        receivedAmount +=
            ",";
    }

    updatePaymentDisplay();
}


deletePaymentButton.addEventListener(
    "click",
    function () {
        receivedAmount =
            receivedAmount.slice(
                0,
                -1
            );

        updatePaymentDisplay();
    }
);


function updatePaymentDisplay() {
    let displayValue =
        receivedAmount;

    if (
        displayValue ===
        "" ||
        displayValue ===
        ","
    ) {
        displayValue =
            "0,00";
    }

    amountReceived.textContent =
        displayValue +
        " €";

    calculateChange();
}


function calculateChange() {
    const total =
        calculateTotal();

    const received =
        parseGermanNumber(
            receivedAmount
        );

    const change =
        received -
        total;

    if (
        receivedAmount ===
        ""
    ) {
        changeAmount.textContent =
            "0,00 €";

        paidButton.disabled =
            true;

        return;
    }

    if (
        change <
        0
    ) {
        changeAmount.textContent =
            "Noch " +
            formatPrice(
                Math.abs(
                    change
                )
            );

        paidButton.disabled =
            true;

        return;
    }

    changeAmount.textContent =
        formatPrice(
            change
        );

    paidButton.disabled =
        false;
}


paidButton.addEventListener(
    "click",
    function () {

        const total =
            calculateTotal();

        const received =
            parseGermanNumber(
                receivedAmount
            );

        if (
            received <
            total
        ) {
            return;
        }

        const change =
            received -
            total;

        saveDailySale(
            total,
            received,
            change
        );

        successTitle.textContent =
            "Zahlung erfolgreich!";

        successDescription.textContent =
            saleTestMode
                ? "Testverkauf – nicht als echte Kassenbuchung gespeichert."
                : "Verkauf wurde gespeichert.";

        successChange.textContent =
            formatPrice(
                change
            );

        currentSuccessContext =
            "daily";

        successShiftEndButton.textContent =
            "Schicht beenden";

        showScreen(
            successScreen
        );
    }
);


function saveDailySale(
    total,
    received,
    change
) {

    const saleItems =
        cart.map(
            function (item) {
                return {
                    id:
                        item.id,

                    name:
                        item.name,

                    price:
                        Number(
                            item.price
                        ),

                    category:
                        item.category,

                    quantity:
                        Number(
                            item.quantity
                        )
                };
            }
        );

    if (
        saleTestMode
    ) {
        return;
    }

    const sale = {
        id:
            Date.now(),

        date:
            new Date().toISOString(),

        total:
            roundMoney(
                total
            ),

        received:
            roundMoney(
                received
            ),

        change:
            roundMoney(
                change
            ),

        items:
            saleItems
    };

    sales.push(
        sale
    );

    saveSales();

    saleItems.forEach(
        function (item) {
            if (
                item.category !==
                "drink"
            ) {
                return;
            }

            inventory[
                item.id
            ] =
                Number(
                    inventory[
                        item.id
                    ] ||
                    0
                ) -
                item.quantity;
        }
    );

    saveInventory();
}


newOrderButton.addEventListener(
    "click",
    function () {

        if (
            currentSuccessContext ===
            "event"
        ) {
            eventSaleCart =
                [];

            eventReceivedAmount =
                "";

            showScreen(
                eventCashScreen,
                eventWorkspaceScreen
            );

            return;
        }

        resetSale();

        showScreen(
            saleScreen,
            homeScreen
        );
    }
);


successShiftEndButton.addEventListener(
    "click",
    function () {

        if (
            currentSuccessContext ===
            "event"
        ) {
            endEventShift();
            return;
        }

        endDailyShift(
            "Getränke · Kasse",
            homeScreen
        );
    }
);


function resetSale() {

    cart =
        [];

    receivedAmount =
        "";

    saleTestMode =
        false;

    updateCart();
}


function endDailyShift(
    source,
    targetScreen
) {

    const today =
        new Date();

    const todaySales =
        getSalesForDay(
            today
        );

    const transactionCount =
        todaySales.length;

    const revenue =
        todaySales.reduce(
            function (
                sum,
                sale
            ) {
                return sum +
                    Number(
                        sale.total ||
                        0
                    );
            },
            0
        );

    const isTest =
        isCurrentTeacher();

    const text =
        isTest
            ? "Testumgebung: Heute habt ihr " +
                transactionCount +
                " Verkäufe gemacht und " +
                formatPrice(
                    revenue
                ) +
                " Umsatz erzielt."
            : "Heute habt ihr " +
                transactionCount +
                " Verkäufe gemacht und " +
                formatPrice(
                    revenue
                ) +
                " Umsatz erzielt.";

    showSiteMessage(
        "🎉",
        "Well done heute, Team! 🎉",
        text,
        "Weiter",
        function () {

            if (!isTest) {

                const closures =
                    loadShiftClosures();

                closures.push({
                    id:
                        Date.now(),

                    closed_at:
                        new Date().toISOString(),

                    work_date:
                        getLocalDateKey(
                            today
                        ),

                    person_id:
                        currentPerson
                            ? currentPerson.id
                            : null,

                    person_name:
                        currentPerson
                            ? getFullName(
                                currentPerson
                            )
                            : "",

                    source:
                        source,

                    transaction_count:
                        transactionCount,

                    revenue:
                        roundMoney(
                            revenue
                        )
                });

                saveShiftClosures(
                    closures
                );
            }

            resetSale();

            showScreen(
                targetScreen ||
                homeScreen
            );
        }
    );
}


function getSalesForDay(
    date
) {
    return sales.filter(
        function (sale) {
            return isSameDay(
                new Date(
                    sale.date
                ),
                date
            );
        }
    );
}


adminBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            homeScreen
        );
    }
);


productsButton.addEventListener(
    "click",
    function () {

        renderAdminProducts();

        showScreen(
            productsScreen,
            adminScreen
        );
    }
);


inventoryButton.addEventListener(
    "click",
    function () {

        if (
            isCurrentTeacher()
        ) {

            renderInventory();

            showScreen(
                inventoryScreen,
                adminScreen
            );

            return;
        }

        renderInventoryCount();

        showScreen(
            inventoryCountScreen,
            adminScreen
        );
    }
);


inventoryInvoicesButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {
            return;
        }

        renderInvoiceContextOptions();
        renderInvoiceList();
        setDefaultDates();

        showScreen(
            inventoryInvoicesScreen,
            adminScreen
        );
    }
);


studentsButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {
            return;
        }

        alert(
            "Die Schülerverwaltung wird später gemeinsam ergänzt."
        );
    }
);


function renderAdminProducts() {

    adminProductsList.innerHTML =
        "";

    if (
        products.length ===
        0
    ) {

        adminProductsList.innerHTML =
            '<div class="no-data">Keine Produkte vorhanden.</div>';

        return;
    }

    products.forEach(
        function (product) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "admin-product-row";

            const categoryLabel =
                product.category ===
                "drink"
                    ? "Getränk"
                    : "Bäckerei";

            row.innerHTML = `
                <div class="admin-product-icon">
                    ${escapeHtml(
                        product.icon
                    )}
                </div>

                <div class="admin-product-info">

                    <strong>
                        ${escapeHtml(
                            product.name
                        )}
                    </strong>

                    <small>
                        ${categoryLabel}
                    </small>

                    <div class="admin-product-price">
                        ${formatPrice(
                            product.price
                        )}
                    </div>

                </div>

                <div class="admin-product-actions">

                    <button
                        type="button"
                        class="icon-action edit-product-button"
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                        title="Bearbeiten"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="icon-action delete delete-product-button"
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                        title="Löschen"
                    >
                        🗑️
                    </button>

                </div>
            `;

            adminProductsList.appendChild(
                row
            );
        }
    );

    document
        .querySelectorAll(
            ".edit-product-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {
                        openProductModal(
                            button.dataset.productId
                        );
                    }
                );
            }
        );

    document
        .querySelectorAll(
            ".delete-product-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {
                        deleteProduct(
                            button.dataset.productId
                        );
                    }
                );
            }
        );
}


addProductButton.addEventListener(
    "click",
    function () {
        openProductModal();
    }
);


function openProductModal(
    productId = null
) {

    editingProductId =
        productId;

    if (
        productId
    ) {

        const product =
            products.find(
                function (item) {
                    return (
                        item.id ===
                        productId
                    );
                }
            );

        if (!product) {
            return;
        }

        productModalTitle.textContent =
            "Produkt bearbeiten";

        productNameInput.value =
            product.name;

        productPriceInput.value =
            Number(
                product.price
            ).toFixed(
                2
            );

        productCategoryInput.value =
            product.category;

        productIconInput.value =
            product.icon;

    } else {

        productModalTitle.textContent =
            "Produkt hinzufügen";

        productNameInput.value =
            "";

        productPriceInput.value =
            "";

        productCategoryInput.value =
            "drink";

        productIconInput.value =
            "🥤";
    }

    productModal.style.display =
        "flex";

    productModal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(
        function () {
            productNameInput.focus();
        },
        50
    );
}


function closeProductModal() {

    productModal.style.display =
        "none";

    productModal.setAttribute(
        "aria-hidden",
        "true"
    );

    editingProductId =
        null;
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

        if (
            event.target ===
            productModal
        ) {

            closeProductModal();
        }
    }
);


saveProductButton.addEventListener(
    "click",
    function () {

        const name =
            productNameInput.value.trim();

        const price =
            Number(
                productPriceInput.value
            );

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
            !Number.isFinite(
                price
            ) ||
            price < 0
        ) {

            alert(
                "Bitte einen gültigen Preis eingeben."
            );

            return;
        }

        if (
            category !==
            "drink" &&
            category !==
            "bakery"
        ) {

            alert(
                "Ungültige Kategorie."
            );

            return;
        }

        if (
            editingProductId
        ) {

            const product =
                products.find(
                    function (item) {

                        return (
                            item.id ===
                            editingProductId
                        );
                    }
                );

            if (!product) {
                return;
            }

            product.name =
                name;

            product.price =
                roundMoney(
                    price
                );

            product.category =
                category;

            product.icon =
                icon;

        } else {

            const newProduct = {

                id:
                    createProductId(
                        name
                    ),

                name:
                    name,

                price:
                    roundMoney(
                        price
                    ),

                category:
                    category,

                icon:
                    icon
            };

            products.push(
                newProduct
            );

            if (
                newProduct.category ===
                "drink" &&
                inventory[
                    newProduct.id
                ] === undefined
            ) {

                inventory[
                    newProduct.id
                ] =
                    0;

                saveInventory();
            }
        }

        saveProducts();

        renderProducts();

        renderAdminProducts();

        closeProductModal();
    }
);


function deleteProduct(
    productId
) {

    const product =
        products.find(
            function (item) {
                return (
                    item.id ===
                    productId
                );
            }
        );

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
        products.filter(
            function (item) {
                return (
                    item.id !==
                    productId
                );
            }
        );

    delete inventory[
        productId
    ];

    cart =
        cart.filter(
            function (item) {
                return (
                    item.id !==
                    productId
                );
            }
        );

    saveProducts();
    saveInventory();

    updateCart();
    renderProducts();
    renderAdminProducts();
}


productsBackButton.addEventListener(
    "click",
    function () {
        closeProductModal();

        showScreen(
            adminScreen
        );
    }
);


function renderInventory() {

    inventoryList.innerHTML =
        "";

    const drinks =
        products.filter(
            function (product) {
                return (
                    product.category ===
                    "drink"
                );
            }
        );

    if (
        drinks.length ===
        0
    ) {

        inventoryList.innerHTML =
            '<div class="no-data">Keine Getränke vorhanden.</div>';

        return;
    }

    drinks.forEach(
        function (product) {

            const stock =
                Number(
                    inventory[
                        product.id
                    ] ||
                    0
                );

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "inventory-card";

            let stockClass =
                "";

            if (
                stock <=
                0
            ) {

                stockClass =
                    "empty";

            } else if (
                stock <=
                5
            ) {

                stockClass =
                    "low";
            }

            card.innerHTML = `
                <div class="inventory-product">

                    <span class="inventory-icon">
                        ${escapeHtml(
                            product.icon
                        )}
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(
                                product.name
                            )}
                        </strong>

                        <small>
                            ${formatPrice(
                                product.price
                            )}
                        </small>

                    </div>

                </div>

                <div class="inventory-stock ${stockClass}">
                    ${stock} Stück
                </div>

                <button
                    type="button"
                    class="inventory-adjust-button"
                    data-product-id="${escapeHtml(
                        product.id
                    )}"
                >
                    ＋ Bestand
                </button>
            `;

            inventoryList.appendChild(
                card
            );
        }
    );

    document
        .querySelectorAll(
            ".inventory-adjust-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openInventoryModal(
                            button.dataset.productId
                        );
                    }
                );
            }
        );
}


function openInventoryModal(
    productId
) {

    const product =
        products.find(
            function (item) {
                return (
                    item.id ===
                    productId
                );
            }
        );

    if (
        !product ||
        !isCurrentTeacher()
    ) {
        return;
    }

    inventoryProductId =
        productId;

    inventoryProductLabel.textContent =
        product.name +
        " · Aktueller Bestand: " +
        Number(
            inventory[
                productId
            ] ||
            0
        ) +
        " Stück";

    inventoryAmountInput.value =
        "";

    inventoryModal.style.display =
        "flex";

    inventoryModal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(
        function () {
            inventoryAmountInput.focus();
        },
        50
    );
}


function closeInventoryModal() {

    inventoryModal.style.display =
        "none";

    inventoryModal.setAttribute(
        "aria-hidden",
        "true"
    );

    inventoryProductId =
        null;
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

        if (
            event.target ===
            inventoryModal
        ) {

            closeInventoryModal();
        }
    }
);


saveInventoryButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher() ||
            !inventoryProductId
        ) {

            return;
        }

        const amount =
            Number(
                inventoryAmountInput.value
            );

        if (
            !Number.isInteger(
                amount
            ) ||
            amount <=
            0
        ) {

            alert(
                "Bitte eine positive ganze Menge eingeben."
            );

            return;
        }

        inventory[
            inventoryProductId
        ] =
            Number(
                inventory[
                    inventoryProductId
                ] ||
                0
            ) +
            amount;

        saveInventory();

        renderInventory();

        closeInventoryModal();
    }
);


inventoryBackButton.addEventListener(
    "click",
    function () {

        closeInventoryModal();

        showScreen(
            adminScreen
        );
    }
);


function renderInventoryCount() {

    inventoryCountList.innerHTML =
        "";

    const drinks =
        products.filter(
            function (product) {

                return (
                    product.category ===
                    "drink"
                );
            }
        );

    if (
        drinks.length ===
        0
    ) {

        inventoryCountList.innerHTML =
            '<div class="no-data">Keine Getränke vorhanden.</div>';

        return;
    }

    drinks.forEach(
        function (product) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "inventory-count-row";

            row.innerHTML = `
                <div class="inventory-count-product">

                    <span>
                        ${escapeHtml(
                            product.icon
                        )}
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(
                                product.name
                            )}
                        </strong>

                        <small>
                            ${formatPrice(
                                product.price
                            )}
                        </small>

                    </div>

                </div>

                <input
                    class="inventory-count-input"
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    data-product-id="${escapeHtml(
                        product.id
                    )}"
                    aria-label="Gezählter Bestand ${escapeHtml(
                        product.name
                    )}"
                    placeholder="0"
                >
            `;

            inventoryCountList.appendChild(
                row
            );
        }
    );
}


inventoryCountBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            adminScreen
        );
    }
);


submitInventoryButton.addEventListener(
    "click",
    function () {

        if (
            !currentPerson ||
            currentPerson.person_type !==
            "schüler"
        ) {

            return;
        }

        const inputs =
            inventoryCountList.querySelectorAll(
                ".inventory-count-input"
            );

        const counts =
            [];

        let hasInvalidValue =
            false;

        inputs.forEach(
            function (input) {

                const value =
                    input.value.trim();

                if (
                    value ===
                    ""
                ) {

                    return;
                }

                const quantity =
                    Number(
                        value
                    );

                if (
                    !Number.isInteger(
                        quantity
                    ) ||
                    quantity < 0
                ) {

                    hasInvalidValue =
                        true;

                    return;
                }

                const product =
                    products.find(
                        function (item) {

                            return (
                                item.id ===
                                input.dataset.productId
                            );
                        }
                    );

                if (product) {

                    counts.push(
                        {
                            product_id:
                                product.id,

                            product_name:
                                product.name,

                            quantity:
                                quantity
                        }
                    );
                }
            }
        );

        if (
            hasInvalidValue
        ) {

            alert(
                "Bitte nur ganze Mengen ab 0 eingeben."
            );

            return;
        }

        if (
            counts.length ===
            0
        ) {

            alert(
                "Bitte mindestens eine gezählte Menge eingeben."
            );

            return;
        }

        const submissions =
            loadInventorySubmissions();

        submissions.push({
            id:
                Date.now(),

            submitted_at:
                new Date().toISOString(),

            person_id:
                currentPerson.id,

            person_name:
                getFullName(
                    currentPerson
                ),

            counts:
                counts
        });

        saveInventorySubmissions(
            submissions
        );

        alert(
            "Die Inventur wurde an den Lehrer geschickt."
        );

        renderInventoryCount();

        updateNotificationBadge();
    }
);


function renderInvoiceContextOptions() {

    const events =
        loadEvents();

    [
        invoiceContextInput,
        purchaseContextInput
    ].forEach(
        function (select) {

            const currentValue =
                select.value ||
                "getränke";

            select.innerHTML =
                "";

            const drinksOption =
                document.createElement(
                    "option"
                );

            drinksOption.value =
                "getränke";

            drinksOption.textContent =
                "Getränke";

            select.appendChild(
                drinksOption
            );

            events.forEach(
                function (event) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        "event:" +
                        event.id;

                    option.textContent =
                        "Sonderveranstaltung: " +
                        event.name;

                    select.appendChild(
                        option
                    );
                }
            );

            const allowed =
                [
                    ...select.options
                ].some(
                    function (option) {
                        return (
                            option.value ===
                            currentValue
                        );
                    }
                );

            select.value =
                allowed
                    ? currentValue
                    : "getränke";
        }
    );
}


function getContextLabel(
    value
) {

    if (
        value ===
        "getränke"
    ) {

        return "Getränke";
    }

    if (
        value.startsWith(
            "event:"
        )
    ) {

        const eventId =
            value.slice(
                6
            );

        const event =
            getEventById(
                eventId
            );

        if (event) {

            return (
                "Sonderveranstaltung: " +
                event.name
            );
        }
    }

    return value;
}


function saveInvoiceRecord(
    context,
    date,
    supplier,
    invoiceNumber,
    product,
    quantity,
    amount
) {

    const invoices =
        loadInvoices();

    invoices.push({
        id:
            Date.now(),

        context:
            context,

        context_label:
            getContextLabel(
                context
            ),

        date:
            date,

        supplier:
            supplier,

        invoice_number:
            invoiceNumber,

        product:
            product,

        quantity:
            quantity,

        amount:
            roundMoney(
                amount
            ),

        created_at:
            new Date().toISOString(),

        person_id:
            currentPerson
                ? currentPerson.id
                : null
    });

    saveInvoices(
        invoices
    );
}


saveInvoiceButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {
            return;
        }

        const context =
            invoiceContextInput.value;

        const date =
            invoiceDateInput.value;

        const supplier =
            invoiceSupplierInput.value.trim();

        const invoiceNumber =
            invoiceNumberInput.value.trim();

        const product =
            invoiceProductInput.value.trim();

        const quantity =
            Number(
                invoiceQuantityInput.value ||
                0
            );

        const amount =
            Number(
                invoiceAmountInput.value
            );

        if (!date) {

            alert(
                "Bitte ein Rechnungsdatum eingeben."
            );

            return;
        }

        if (!product) {

            alert(
                "Bitte ein Produkt eingeben."
            );

            return;
        }

        if (
            !Number.isInteger(
                quantity
            ) ||
            quantity < 0
        ) {

            alert(
                "Bitte eine gültige Menge eingeben."
            );

            return;
        }

        if (
            !Number.isFinite(
                amount
            ) ||
            amount < 0
        ) {

            alert(
                "Bitte gültige Gesamtkosten eingeben."
            );

            return;
        }

        saveInvoiceRecord(
            context,
            date,
            supplier,
            invoiceNumber,
            product,
            quantity,
            amount
        );

        invoiceSupplierInput.value =
            "";

        invoiceNumberInput.value =
            "";

        invoiceProductInput.value =
            "";

        invoiceQuantityInput.value =
            "";

        invoiceAmountInput.value =
            "";

        renderInvoiceList();
    }
);


function savePurchaseRecord(
    context,
    product,
    quantity
) {

    const purchases =
        loadPurchases();

    purchases.push({
        id:
            Date.now(),

        context:
            context,

        context_label:
            getContextLabel(
                context
            ),

        product:
            product,

        quantity:
            quantity,

        created_at:
            new Date().toISOString(),

        person_id:
            currentPerson
                ? currentPerson.id
                : null
    });

    savePurchases(
        purchases
    );
}


savePurchaseButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {

            return;
        }

        const context =
            purchaseContextInput.value;

        const product =
            purchaseProductInput.value.trim();

        const quantity =
            Number(
                purchaseQuantityInput.value
            );

        if (!product) {

            alert(
                "Bitte ein Produkt eingeben."
            );

            return;
        }

        if (
            !Number.isInteger(
                quantity
            ) ||
            quantity <=
            0
        ) {

            alert(
                "Bitte eine positive ganze Menge eingeben."
            );

            return;
        }

        savePurchaseRecord(
            context,
            product,
            quantity
        );

        if (
            context ===
            "getränke"
        ) {

            const matchingProduct =
                products.find(
                    function (item) {

                        return (
                            item.name.toLowerCase() ===
                            product.toLowerCase()
                        );
                    }
                );

            if (
                matchingProduct &&
                matchingProduct.category ===
                "drink"
            ) {

                inventory[
                    matchingProduct.id
                ] =
                    Number(
                        inventory[
                            matchingProduct.id
                        ] ||
                        0
                    ) +
                    quantity;

                saveInventory();
            }
        }

        purchaseProductInput.value =
            "";

        purchaseQuantityInput.value =
            "";

        renderInvoiceList();
    }
);


function renderInvoiceList() {

    invoiceList.innerHTML =
        "";

    const invoices =
        loadInvoices()
            .slice()
            .sort(
                function (a, b) {
                    return String(
                        b.date
                    ).localeCompare(
                        String(
                            a.date
                        )
                    );
                }
            );

    const purchases =
        loadPurchases()
            .slice()
            .sort(
                function (a, b) {
                    return String(
                        b.created_at
                    ).localeCompare(
                        String(
                            a.created_at
                        )
                    );
                }
            );

    if (
        invoices.length ===
        0 &&
        purchases.length ===
        0
    ) {

        invoiceList.innerHTML =
            '<div class="no-data">Noch keine Rechnungen oder Wareneingänge vorhanden.</div>';

        return;
    }

    invoices
        .slice(
            0,
            15
        )
        .forEach(
            function (invoice) {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "record-row";

                row.innerHTML = `
                    <div>

                        <strong>
                            🧾 ${escapeHtml(
                                invoice.product
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                invoice.context_label
                            )} ·
                            ${escapeHtml(
                                invoice.date
                            )}
                        </small>

                        <small>
                            ${invoice.quantity}
                            Stück ·
                            ${formatPrice(
                                invoice.amount
                            )}
                        </small>

                    </div>

                    <span class="record-type">
                        Rechnung
                    </span>
                `;

                invoiceList.appendChild(
                    row
                );
            }
        );

    purchases
        .slice(
            0,
            15
        )
        .forEach(
            function (purchase) {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "record-row";

                row.innerHTML = `
                    <div>

                        <strong>
                            📦 ${escapeHtml(
                                purchase.product
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                purchase.context_label
                            )}
                        </small>

                        <small>
                            ${purchase.quantity}
                            Stück
                        </small>

                    </div>

                    <span class="record-type">
                        Wareneingang
                    </span>
                `;

                invoiceList.appendChild(
                    row
                );
            }
        );
}


inventoryInvoicesBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            adminScreen
        );
    }
);


reportsBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            homeScreen
        );
    }
);


periodTabs.forEach(
    function (tab) {

        tab.addEventListener(
            "click",
            function () {

                currentReportPeriod =
                    tab.dataset.period;

                updatePeriodTabs();

                renderReport();
            }
        );
    }
);


function updatePeriodTabs() {

    periodTabs.forEach(
        function (tab) {

            tab.classList.toggle(
                "active",
                tab.dataset.period ===
                currentReportPeriod
            );
        }
    );
}


function renderReport() {

    if (
        !isCurrentTeacher()
    ) {
        return;
    }

    const filteredSales =
        getSalesForPeriod(
            currentReportPeriod
        );

    const revenue =
        filteredSales.reduce(
            function (
                sum,
                sale
            ) {
                return (
                    sum +
                    Number(
                        sale.total ||
                        0
                    )
                );
            },
            0
        );

    let drinkCount =
        0;

    let bakeryCount =
        0;

    const productSummary =
        {};

    filteredSales.forEach(
        function (sale) {

            (
                sale.items ||
                []
            ).forEach(
                function (item) {

                    const quantity =
                        Number(
                            item.quantity ||
                            0
                        );

                    if (
                        item.category ===
                        "drink"
                    ) {

                        drinkCount +=
                            quantity;
                    }

                    if (
                        item.category ===
                        "bakery"
                    ) {

                        bakeryCount +=
                            quantity;
                    }

                    if (
                        !productSummary[
                            item.id
                        ]
                    ) {

                        productSummary[
                            item.id
                        ] = {

                            name:
                                item.name,

                            quantity:
                                0,

                            revenue:
                                0
                        };
                    }

                    productSummary[
                        item.id
                    ].quantity +=
                        quantity;

                    productSummary[
                        item.id
                    ].revenue +=
                        Number(
                            item.price
                        ) *
                        quantity;
                }
            );
        }
    );

    reportRevenue.textContent =
        formatPrice(
            revenue
        );

    reportTransactions.textContent =
        String(
            filteredSales.length
        );

    reportDrinks.textContent =
        String(
            drinkCount
        );

    reportBakery.textContent =
        String(
            bakeryCount
        );

    reportDateLabel.textContent =
        getReportLabel(
            currentReportPeriod
        );

    renderReportProducts(
        productSummary
    );
}


function renderReportProducts(
    productSummary
) {

    reportProducts.innerHTML =
        "";

    const entries =
        Object.values(
            productSummary
        ).sort(
            function (a, b) {
                return (
                    b.quantity -
                    a.quantity
                );
            }
        );

    if (
        entries.length ===
        0
    ) {

        reportProducts.innerHTML = `
            <div class="no-data">
                Keine Verkäufe in diesem Zeitraum.
            </div>
        `;

        return;
    }

    entries.forEach(
        function (item) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "report-product-row";

            row.innerHTML = `
                <span class="report-product-name">
                    ${escapeHtml(
                        item.name
                    )}
                </span>

                <span class="report-product-quantity">
                    ${item.quantity} Stück
                </span>

                <span class="report-product-revenue">
                    ${formatPrice(
                        item.revenue
                    )}
                </span>
            `;

            reportProducts.appendChild(
                row
            );
        }
    );
}


function getSalesForPeriod(
    period
) {

    const now =
        new Date();

    return sales.filter(
        function (sale) {

            const date =
                new Date(
                    sale.date
                );

            if (
                period ===
                "day"
            ) {

                return isSameDay(
                    date,
                    now
                );
            }

            if (
                period ===
                "week"
            ) {

                return isSameWeek(
                    date,
                    now
                );
            }

            if (
                period ===
                "month"
            ) {

                return (
                    date.getFullYear() ===
                    now.getFullYear() &&
                    date.getMonth() ===
                    now.getMonth()
                );
            }

            return false;
        }
    );
}


function isSameDay(
    a,
    b
) {

    return (
        a.getFullYear() ===
        b.getFullYear() &&
        a.getMonth() ===
        b.getMonth() &&
        a.getDate() ===
        b.getDate()
    );
}


function isSameWeek(
    date,
    reference
) {

    const start =
        getMonday(
            reference
        );

    const end =
        new Date(
            start
        );

    end.setDate(
        start.getDate() +
        7
    );

    return (
        date >=
        start &&
        date <
        end
    );
}


function getMonday(
    date
) {

    const result =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const day =
        result.getDay();

    const difference =
        day ===
        0
            ? -6
            : 1 - day;

    result.setDate(
        result.getDate() +
        difference
    );

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function getReportLabel(
    period
) {

    const now =
        new Date();

    if (
        period ===
        "day"
    ) {

        return (
            "Heute · " +
            now.toLocaleDateString(
                "de-DE"
            )
        );
    }

    if (
        period ===
        "week"
    ) {

        const monday =
            getMonday(
                now
            );

        const sunday =
            new Date(
                monday
            );

        sunday.setDate(
            monday.getDate() +
            6
        );

        return (
            "Woche · " +
            monday.toLocaleDateString(
                "de-DE"
            ) +
            " – " +
            sunday.toLocaleDateString(
                "de-DE"
            )
        );
    }

    return (
        "Monat · " +
        now.toLocaleDateString(
            "de-DE",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        )
    );
}


exportReportButton.addEventListener(
    "click",
    exportReportAsCSV
);


function exportReportAsCSV() {

    if (
        !isCurrentTeacher()
    ) {
        return;
    }

    const filteredSales =
        getSalesForPeriod(
            currentReportPeriod
        );

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

    filteredSales.forEach(
        function (sale) {

            (
                sale.items ||
                []
            ).forEach(
                function (item) {

                    rows.push(
                        [
                            new Date(
                                sale.date
                            ).toLocaleString(
                                "de-DE"
                            ),

                            item.name,

                            item.category ===
                            "drink"
                                ? "Getränk"
                                : "Bäckerei",

                            item.quantity,

                            Number(
                                item.price
                            )
                                .toFixed(
                                    2
                                )
                                .replace(
                                    ".",
                                    ","
                                ),

                            (
                                Number(
                                    item.price
                                ) *
                                Number(
                                    item.quantity
                                )
                            )
                                .toFixed(
                                    2
                                )
                                .replace(
                                    ".",
                                    ","
                                )
                        ]
                    );
                }
            );
        }
    );

    if (
        rows.length ===
        1
    ) {

        alert(
            "Keine Verkaufsdaten für diesen Zeitraum."
        );

        return;
    }

    const csv =
        rows
            .map(
                function (row) {
                    return row
                        .map(
                            csvEscape
                        )
                        .join(
                            ";"
                        );
                }
            )
            .join(
                "\n"
            );

    const blob =
        new Blob(
            [
                "\uFEFF" +
                csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        "LauterMacher_" +
        currentReportPeriod +
        "_" +
        getDateForFileName() +
        ".csv";

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );
}


function csvEscape(
    value
) {

    const text =
        String(
            value ?? ""
        );

    if (
        text.includes(";") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return (
            '"' +
            text.replaceAll(
                '"',
                '""'
            ) +
            '"'
        );
    }

    return text;
}


clearReportsButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {
            return;
        }

        if (
            sales.length ===
            0
        ) {

            alert(
                "Es gibt keine Verkaufsdaten."
            );

            return;
        }

        const confirmed =
            confirm(
                "Möchtest du wirklich ALLE Verkaufsdaten löschen?"
            );

        if (
            !confirmed
        ) {
            return;
        }

        sales =
            [];

        saveSales();

        renderReport();

        alert(
            "Alle Verkaufsdaten wurden gelöscht."
        );
    }
);


// ========================================
// SONDERVERANSTALTUNG
// ========================================

eventListBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            homeScreen
        );
    }
);


createEventButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {
            return;
        }

        eventNameInput.value =
            "";

        eventDateInput.value =
            getLocalDateKey(
                new Date()
            );

        showScreen(
            eventCreateScreen,
            eventListScreen
        );
    }
);


function renderEventList() {

    const isTeacher =
        isCurrentTeacher();

    const events =
        loadEvents()
            .slice()
            .sort(
                function (a, b) {
                    return String(
                        a.event_date
                    ).localeCompare(
                        String(
                            b.event_date
                        )
                    );
                }
            );

    eventListTitle.textContent =
        isTeacher
            ? "Veranstaltungen verwalten"
            : "Veranstaltungen";

    eventListDescription.textContent =
        isTeacher
            ? "Erstelle eine Veranstaltung oder öffne eine bestehende."
            : "Wähle eine Veranstaltung aus, an der du arbeitest.";

    createEventButton.hidden =
        !isTeacher;

    eventList.innerHTML =
        "";

    if (
        events.length ===
        0
    ) {

        eventList.innerHTML =
            '<div class="no-data">Noch keine Veranstaltungen vorhanden.</div>';

        return;
    }

    events.forEach(
        function (event) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "event-list-card";

            const statusLabel =
                event.status ===
                "abgeschlossen"
                    ? "Abgeschlossen"
                    : "Offen";

            card.innerHTML = `
                <div class="event-list-main">

                    <span class="event-list-icon">
                        🎪
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(
                                event.name
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                formatEventDate(
                                    event.event_date
                                )
                            )}
                        </small>

                        <small>
                            ${statusLabel}
                        </small>

                    </div>

                </div>

                <button
                    type="button"
                    class="primary-action small-action event-open-button"
                    data-event-id="${escapeHtml(
                        event.id
                    )}"
                >
                    Öffnen
                </button>
            `;

            eventList.appendChild(
                card
            );
        }
    );

    document
        .querySelectorAll(
            ".event-open-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openEvent(
                            button.dataset.eventId
                        );
                    }
                );
            }
        );
}


function openEvent(
    eventId
) {

    const event =
        getEventById(
            eventId
        );

    if (!event) {
        return;
    }

    currentEventId =
        eventId;

    if (
        isCurrentTeacher()
    ) {

        if (
            event.has_start_inventory &&
            !event.start_setup_completed
        ) {

            prepareEventStartSetup(
                event
            );

            showScreen(
                eventStartSetupScreen,
                eventListScreen
            );

            return;
        }

        prepareEventProducts(
            event
        );

        showScreen(
            eventProductsScreen,
            eventListScreen
        );

        return;
    }

    prepareEventProducts(
        event
    );

    showScreen(
        eventProductsScreen,
        eventListScreen
    );
}


// ========================================
// EVENT ERSTELLEN
// ========================================

eventCreateBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            eventListScreen
        );
    }
);


eventStartInventoryYesButton.addEventListener(
    "click",
    function () {
        createEvent(
            true
        );
    }
);


eventStartInventoryNoButton.addEventListener(
    "click",
    function () {
        createEvent(
            false
        );
    }
);


function createEvent(
    hasStartInventory
) {

    if (
        !isCurrentTeacher()
    ) {
        return;
    }

    const name =
        eventNameInput.value.trim();

    const date =
        eventDateInput.value;

    if (!name) {

        alert(
            "Bitte einen Namen für die Veranstaltung eingeben."
        );

        return;
    }

    if (!date) {

        alert(
            "Bitte ein Datum auswählen."
        );

        return;
    }

    const events =
        loadEvents();

    const event = {

        id:
            createId(
                "event"
            ),

        name:
            name,

        event_date:
            date,

        has_start_inventory:
            hasStartInventory,

        start_inventory:
            [],

        start_setup_completed:
            !hasStartInventory,

        invoices:
            [],

        products:
            [],

        sales:
            [],

        end_inventory:
            [],

        end_inventory_completed:
            false,

        status:
            "offen",

        created_at:
            new Date().toISOString(),

        created_by:
            currentPerson
                ? currentPerson.id
                : null
    };

    events.push(
        event
    );

    saveEvents(
        events
    );

    currentEventId =
        event.id;

    if (
        hasStartInventory
    ) {

        prepareEventStartSetup(
            event
        );

        showScreen(
            eventStartSetupScreen,
            eventListScreen
        );

    } else {

        prepareEventProducts(
            event
        );

        showScreen(
            eventProductsScreen,
            eventListScreen
        );
    }
}


function prepareEventStartSetup(
    event
) {

    eventStartSetupTitle.textContent =
        "Anfangsbestand · " +
        event.name;

    eventStartInventoryRows =
        Array.isArray(
            event.start_inventory
        )
            ? event.start_inventory.map(
                function (item) {
                    return {
                        ...item
                    };
                }
            )
            : [];

    eventSetupInvoices =
        Array.isArray(
            event.invoices
        )
            ? event.invoices.map(
                function (item) {
                    return {
                        ...item
                    };
                }
            )
            : [];

    renderEventStartInventory();
    renderEventSetupInvoices();
    setDefaultDates();
}


function renderEventStartInventory() {

    eventStartInventoryList.innerHTML =
        "";

    if (
        eventStartInventoryRows.length ===
        0
    ) {

        eventStartInventoryList.innerHTML = `
            <div class="no-data event-start-empty">
                Noch kein Produkt hinzugefügt.
            </div>
        `;

        return;
    }

    eventStartInventoryRows.forEach(
        function (
            item,
            index
        ) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "event-inventory-editor-row";

            row.innerHTML = `
                <input
                    type="text"
                    class="event-stock-name"
                    value="${escapeAttribute(
                        item.product_name ||
                        ""
                    )}"
                    placeholder="Produkt"
                    data-index="${index}"
                >

                <input
                    type="number"
                    class="event-stock-quantity"
                    value="${Number(
                        item.quantity ||
                        0
                    )}"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    placeholder="Menge"
                    data-index="${index}"
                >

                <button
                    type="button"
                    class="icon-action delete event-remove-stock"
                    data-index="${index}"
                    title="Entfernen"
                >
                    🗑️
                </button>
            `;

            eventStartInventoryList.appendChild(
                row
            );
        }
    );

    document
        .querySelectorAll(
            ".event-stock-name"
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "input",
                    function () {

                        const index =
                            Number(
                                input.dataset.index
                            );

                        eventStartInventoryRows[
                            index
                        ].product_name =
                            input.value;
                    }
                );
            }
        );

    document
        .querySelectorAll(
            ".event-stock-quantity"
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "input",
                    function () {

                        const index =
                            Number(
                                input.dataset.index
                            );

                        eventStartInventoryRows[
                            index
                        ].quantity =
                            Number(
                                input.value ||
                                0
                            );
                    }
                );
            }
        );

    document
        .querySelectorAll(
            ".event-remove-stock"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        eventStartInventoryRows.splice(
                            index,
                            1
                        );

                        renderEventStartInventory();
                    }
                );
            }
        );
}


addEventStartStockButton.addEventListener(
    "click",
    function () {

        eventStartInventoryRows.push(
            {
                product_name:
                    "",

                quantity:
                    0
            }
        );

        renderEventStartInventory();

        const lastInput =
            eventStartInventoryList.querySelector(
                ".event-stock-name:last-of-type"
            );

        if (lastInput) {
            lastInput.focus();
        }
    }
);


function renderEventSetupInvoices() {

    eventInvoiceList.innerHTML =
        "";

    if (
        eventSetupInvoices.length ===
        0
    ) {

        eventInvoiceList.innerHTML =
            '<div class="no-data">Noch keine Rechnung hinzugefügt.</div>';

        return;
    }

    eventSetupInvoices.forEach(
        function (
            invoice,
            index
        ) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "record-row";

            row.innerHTML = `
                <div>

                    <strong>
                        🧾 ${escapeHtml(
                            invoice.product
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            invoice.date
                        )} ·
                        ${invoice.quantity}
                        Stück ·
                        ${formatPrice(
                            invoice.amount
                        )}
                    </small>

                    <small>
                        ${escapeHtml(
                            invoice.supplier ||
                            ""
                        )}
                    </small>

                </div>

                <button
                    type="button"
                    class="icon-action delete event-remove-invoice"
                    data-index="${index}"
                    title="Entfernen"
                >
                    🗑️
                </button>
            `;

            eventInvoiceList.appendChild(
                row
            );
        }
    );

    document
        .querySelectorAll(
            ".event-remove-invoice"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        eventSetupInvoices.splice(
                            index,
                            1
                        );

                        renderEventSetupInvoices();
                    }
                );
            }
        );
}


addEventInvoiceButton.addEventListener(
    "click",
    function () {

        const date =
            eventInvoiceDateInput.value;

        const supplier =
            eventInvoiceSupplierInput.value.trim();

        const invoiceNumber =
            eventInvoiceNumberInput.value.trim();

        const product =
            eventInvoiceProductInput.value.trim();

        const quantity =
            Number(
                eventInvoiceQuantityInput.value ||
                0
            );

        const amount =
            Number(
                eventInvoiceAmountInput.value
            );

        if (
            !date ||
            !product
        ) {

            alert(
                "Bitte Datum und Produkt eingeben."
            );

            return;
        }

        if (
            !Number.isInteger(
                quantity
            ) ||
            quantity <
            0
        ) {

            alert(
                "Bitte eine gültige Menge eingeben."
            );

            return;
        }

        if (
            !Number.isFinite(
                amount
            ) ||
            amount <
            0
        ) {

            alert(
                "Bitte gültige Gesamtkosten eingeben."
            );

            return;
        }

        eventSetupInvoices.push({
            id:
                Date.now(),

            date:
                date,

            supplier:
                supplier,

            invoice_number:
                invoiceNumber,

            product:
                product,

            quantity:
                quantity,

            amount:
                roundMoney(
                    amount
                )
        });

        eventInvoiceProductInput.value =
            "";

        eventInvoiceQuantityInput.value =
            "";

        eventInvoiceAmountInput.value =
            "";

        eventInvoiceSupplierInput.value =
            "";

        eventInvoiceNumberInput.value =
            "";

        renderEventSetupInvoices();
    }
);


eventStartSetupBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            eventListScreen
        );
    }
);


eventStartSetupContinueButton.addEventListener(
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (!event) {
            return;
        }

        const cleanedInventory =
            eventStartInventoryRows
                .filter(
                    function (item) {

                        return (
                            String(
                                item.product_name ||
                                ""
                            ).trim() !==
                            "" &&

                            Number.isInteger(
                                Number(
                                    item.quantity ||
                                    0
                                )
                            ) &&

                            Number(
                                item.quantity ||
                                0
                            ) >=
                            0
                        );
                    }
                )
                .map(
                    function (item) {

                        return {
                            product_name:
                                String(
                                    item.product_name
                                ).trim(),

                            quantity:
                                Number(
                                    item.quantity ||
                                    0
                                )
                        };
                    }
                );

        event.start_inventory =
            cleanedInventory;

        event.invoices =
            eventSetupInvoices.map(
                function (item) {
                    return {
                        ...item
                    };
                }
            );

        event.start_setup_completed =
            true;

        updateCurrentEvent(
            event
        );

        prepareEventProducts(
            event
        );

        showScreen(
            eventProductsScreen
        );
    }
);


function prepareEventProducts(
    event
) {

    eventProductsTitle.textContent =
        "Produkte erstellen · " +
        event.name;

    renderEventProducts();
}


function renderEventProducts() {

    const event =
        getCurrentEvent();

    eventProductsList.innerHTML =
        "";

    if (!event) {
        return;
    }

    if (
        !Array.isArray(
            event.products
        )
    ) {
        event.products =
            [];
    }

    if (
        event.products.length ===
        0
    ) {

        eventProductsList.innerHTML = `
            <div class="no-data">
                Noch keine Produkte für diese Veranstaltung.
            </div>
        `;

        return;
    }

    event.products.forEach(
        function (product) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "admin-product-row";

            row.innerHTML = `

                <div class="admin-product-icon">
                    ${escapeHtml(
                        product.icon
                    )}
                </div>

                <div class="admin-product-info">

                    <strong>
                        ${escapeHtml(
                            product.name
                        )}
                    </strong>

                    <small>
                        Veranstaltungsprodukt
                    </small>

                    <div class="admin-product-price">
                        ${formatPrice(
                            product.price
                        )}
                    </div>

                </div>

                <div class="admin-product-actions">

                    <button
                        type="button"
                        class="icon-action event-edit-product"
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                        title="Bearbeiten"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="icon-action delete event-delete-product"
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                        title="Löschen"
                    >
                        🗑️
                    </button>

                </div>
            `;

            eventProductsList.appendChild(
                row
            );
        }
    );

    document
        .querySelectorAll(
            ".event-edit-product"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openEventProductModal(
                            button.dataset.productId
                        );
                    }
                );
            }
        );

    document
        .querySelectorAll(
            ".event-delete-product"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const event =
                            getCurrentEvent();

                        if (!event) {
                            return;
                        }

                        const product =
                            event.products.find(
                                function (item) {
                                    return (
                                        item.id ===
                                        button.dataset.productId
                                    );
                                }
                            );

                        if (!product) {
                            return;
                        }

                        if (
                            confirm(
                                "Produkt „" +
                                product.name +
                                "“ wirklich löschen?"
                            )
                        ) {

                            event.products =
                                event.products.filter(
                                    function (item) {
                                        return (
                                            item.id !==
                                            button.dataset.productId
                                        );
                                    }
                                );

                            updateCurrentEvent(
                                event
                            );

                            renderEventProducts();
                        }
                    }
                );
            }
        );
}


addEventProductButton.addEventListener(
    "click",
    function () {
        openEventProductModal();
    }
);


function openEventProductModal(
    productId = null
) {

    eventProductEditingId =
        productId;

    if (
        productId
    ) {

        const event =
            getCurrentEvent();

        if (!event) {
            return;
        }

        const product =
            event.products.find(
                function (item) {

                    return (
                        item.id ===
                        productId
                    );
                }
            );

        if (!product) {
            return;
        }

        eventProductModalTitle.textContent =
            "Produkt bearbeiten";

        eventProductNameInput.value =
            product.name;

        eventProductPriceInput.value =
            Number(
                product.price
            ).toFixed(
                2
            );

        eventProductIconInput.value =
            product.icon;

    } else {

        eventProductModalTitle.textContent =
            "Produkt hinzufügen";

        eventProductNameInput.value =
            "";

        eventProductPriceInput.value =
            "";

        eventProductIconInput.value =
            "🎪";
    }

    eventProductModal.style.display =
        "flex";

    eventProductModal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(
        function () {
            eventProductNameInput.focus();
        },
        50
    );
}


function closeEventProductModal() {

    eventProductModal.style.display =
        "none";

    eventProductModal.setAttribute(
        "aria-hidden",
        "true"
    );

    eventProductEditingId =
        null;
}


closeEventProductModalButton.addEventListener(
    "click",
    closeEventProductModal
);

cancelEventProductButton.addEventListener(
    "click",
    closeEventProductModal
);


eventProductModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            eventProductModal
        ) {

            closeEventProductModal();
        }
    }
);


saveEventProductButton.addEventListener(
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (!event) {
            return;
        }

        const name =
            eventProductNameInput.value.trim();

        const price =
            Number(
                eventProductPriceInput.value
            );

        const icon =
            eventProductIconInput.value.trim() ||
            "🎪";

        if (!name) {

            alert(
                "Bitte einen Produktnamen eingeben."
            );

            return;
        }

        if (
            !Number.isFinite(
                price
            ) ||
            price < 0
        ) {

            alert(
                "Bitte einen gültigen Preis eingeben."
            );

            return;
        }

        if (
            eventProductEditingId
        ) {

            const product =
                event.products.find(
                    function (item) {
                        return (
                            item.id ===
                            eventProductEditingId
                        );
                    }
                );

            if (!product) {
                return;
            }

            product.name =
                name;

            product.price =
                roundMoney(
                    price
                );

            product.icon =
                icon;

        } else {

            event.products.push({
                id:
                    createId(
                        "event-product"
                    ),

                name:
                    name,

                price:
                    roundMoney(
                        price
                    ),

                icon:
                    icon
            });
        }

        updateCurrentEvent(
            event
        );

        closeEventProductModal();

        renderEventProducts();
    }
);


eventProductsBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            eventListScreen
        );
    }
);


eventProductsContinueButton.addEventListener(
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (!event) {
            return;
        }

        if (
            !Array.isArray(
                event.products
            ) ||
            event.products.length ===
            0
        ) {

            alert(
                "Bitte mindestens ein Produkt anlegen."
            );

            return;
        }

        updateCurrentEvent(
            event
        );

        renderEventWorkspace();

        showScreen(
            eventWorkspaceScreen
        );
    }
);


function renderEventWorkspace() {

    const event =
        getCurrentEvent();

    if (!event) {
        return;
    }

    eventWorkspaceName.textContent =
        event.name;

    eventWorkspaceDate.textContent =
        formatEventDate(
            event.event_date
        );

    eventWorkspaceStudentOptions.hidden =
        isCurrentTeacher();

    eventWorkspaceTeacherOptions.hidden =
        !isCurrentTeacher();
}


studentEventCashButton.addEventListener(
    "click",
    function () {
        openEventCash(
            false
        );
    }
);


studentEventOutputButton.addEventListener(
    "click",
    function () {
        openEventOutput(
            false
        );
    }
);


teacherEventCashButton.addEventListener(
    "click",
    function () {
        openEventCash(
            true
        );
    }
);


teacherEventOutputButton.addEventListener(
    "click",
    function () {
        openEventOutput(
            true
        );
    }
);


teacherEventEndInventoryButton.addEventListener(
    "click",
    function () {
        openEventEndInventory();
    }
);


function openEventCash(
    testMode
) {

    const event =
        getCurrentEvent();

    if (!event) {
        return;
    }

    currentEventSaleTestMode =
        Boolean(
            testMode
        );

    eventSaleCart =
        [];

    eventReceivedAmount =
        "";

    eventCashTitle.textContent =
        testMode
            ? "Kasse · Testumgebung"
            : "Kasse";

    eventCashProductHeading.textContent =
        event.name;

    renderEventCashProducts();

    updateEventCart();

    showScreen(
        eventCashScreen,
        eventWorkspaceScreen
    );
}


function openEventOutput(
    testMode
) {

    const event =
        getCurrentEvent();

    if (!event) {
        return;
    }

    eventOutputTitle.textContent =
        testMode
            ? "Ausgabe · Testumgebung"
            : "Ausgabe";

    renderEventOutput();

    showScreen(
        eventOutputScreen,
        eventWorkspaceScreen
    );
}


function renderEventCashProducts() {

    const event =
        getCurrentEvent();

    eventCashProductsGrid.innerHTML =
        "";

    if (
        !event ||
        !Array.isArray(
            event.products
        )
    ) {
        return;
    }

    event.products.forEach(
        function (product) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "product-card";

            button.innerHTML = `
                <span class="product-icon">
                    ${escapeHtml(
                        product.icon
                    )}
                </span>

                <span class="product-name">
                    ${escapeHtml(
                        product.name
                    )}
                </span>

                <span class="product-price">
                    ${formatPrice(
                        product.price
                    )}
                </span>
            `;

            button.addEventListener(
                "click",
                function () {
                    addEventProductToCart(
                        product
                    );
                }
            );

            eventCashProductsGrid.appendChild(
                button
            );
        }
    );

    if (
        eventCashProductsGrid.children.length ===
        0
    ) {

        eventCashProductsGrid.innerHTML =
            `
                <div class="coming-soon">
                    Keine Produkte vorhanden.
                </div>
            `;
    }
}


function addEventProductToCart(
    product
) {

    const existing =
        eventSaleCart.find(
            function (item) {
                return (
                    item.id ===
                    product.id
                );
            }
        );

    if (existing) {

        existing.quantity +=
            1;

    } else {

        eventSaleCart.push(
            {
                id:
                    product.id,

                name:
                    product.name,

                price:
                    Number(
                        product.price
                    ),

                quantity:
                    1,

                icon:
                    product.icon
            }
        );
    }

    updateEventCart();
}


function updateEventCart() {

    eventCartItems.innerHTML =
        "";

    if (
        eventSaleCart.length ===
        0
    ) {

        eventCartItems.innerHTML = `
            <div class="empty-cart">
                Noch keine Produkte ausgewählt.
            </div>
        `;

        eventCartTotal.textContent =
            "0,00 €";

        eventPayButton.disabled =
            true;

        return;
    }

    eventSaleCart.forEach(
        function (
            item,
            index
        ) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "cart-item";

            row.innerHTML = `
                <div class="cart-product-info">

                    <span class="cart-product-name">
                        ${escapeHtml(
                            item.name
                        )}
                    </span>

                    <span class="cart-product-price">
                        ${formatPrice(
                            item.price *
                            item.quantity
                        )}
                    </span>

                </div>

                <div class="cart-controls">

                    <button
                        type="button"
                        class="cart-control minus event-cart-minus"
                        data-index="${index}"
                    >
                        −
                    </button>

                    <span class="cart-quantity">
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="cart-control plus event-cart-plus"
                        data-index="${index}"
                    >
                        +
                    </button>

                </div>
            `;

            eventCartItems.appendChild(
                row
            );
        }
    );

    eventCartTotal.textContent =
        formatPrice(
            calculateEventCartTotal()
        );

    eventPayButton.disabled =
        false;

    document
        .querySelectorAll(
            ".event-cart-minus"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        if (
                            !eventSaleCart[
                                index
                            ]
                        ) {
                            return;
                        }

                        eventSaleCart[
                            index
                        ].quantity -=
                            1;

                        if (
                            eventSaleCart[
                                index
                            ].quantity <=
                            0
                        ) {

                            eventSaleCart.splice(
                                index,
                                1
                            );
                        }

                        updateEventCart();
                    }
                );
            }
        );

    document
        .querySelectorAll(
            ".event-cart-plus"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        if (
                            !eventSaleCart[
                                index
                            ]
                        ) {
                            return;
                        }

                        eventSaleCart[
                            index
                        ].quantity +=
                            1;

                        updateEventCart();
                    }
                );
            }
        );
}


function calculateEventCartTotal() {

    return eventSaleCart.reduce(
        function (
            sum,
            item
        ) {

            return (
                sum +
                Number(
                    item.price
                ) *
                Number(
                    item.quantity
                )
            );

        },
        0
    );
}


eventCashBackButton.addEventListener(
    "click",
    function () {

        eventSaleCart =
            [];

        eventReceivedAmount =
            "";

        showScreen(
            eventWorkspaceScreen
        );
    }
);


eventPayButton.addEventListener(
    "click",
    function () {

        if (
            eventSaleCart.length ===
            0
        ) {
            return;
        }

        const total =
            calculateEventCartTotal();

        const receivedText =
            window.prompt(
                "Kunde gibt (Euro, z. B. 10,00):"
            );

        if (
            receivedText ===
            null
        ) {
            return;
        }

        const received =
            parseGermanNumber(
                receivedText
            );

        if (
            !Number.isFinite(
                received
            ) ||
            received <
            total
        ) {

            alert(
                "Der eingegebene Betrag reicht nicht aus."
            );

            return;
        }

        const change =
            received -
            total;

        const event =
            getCurrentEvent();

        if (!event) {
            return;
        }

        if (
            !currentEventSaleTestMode
        ) {

            if (
                !Array.isArray(
                    event.sales
                )
            ) {

                event.sales =
                    [];
            }

            event.sales.push(
                {
                    id:
                        Date.now(),

                    date:
                        new Date().toISOString(),

                    total:
                        roundMoney(
                            total
                        ),

                    received:
                        roundMoney(
                            received
                        ),

                    change:
                        roundMoney(
                            change
                        ),

                    items:
                        eventSaleCart.map(
                            function (item) {
                                return {
                                    id:
                                        item.id,

                                    name:
                                        item.name,

                                    price:
                                        Number(
                                            item.price
                                        ),

                                    quantity:
                                        Number(
                                            item.quantity
                                        )
                                };
                            }
                        )
                }
            );

            updateCurrentEvent(
                event
            );
        }

        successTitle.textContent =
            "Zahlung erfolgreich!";

        successDescription.textContent =
            currentEventSaleTestMode
                ? "Veranstaltung · Testumgebung"
                : "Veranstaltung · Verkauf gespeichert.";

        successChange.textContent =
            formatPrice(
                change
            );

        currentEventId =
            event.id;

        currentSuccessContext =
            "event";

        showScreen(
            successScreen
        );
    }
);


eventCashShiftEndButton.addEventListener(
    "click",
    function () {
        endEventShift();
    }
);


eventOutputBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            eventWorkspaceScreen
        );
    }
);


eventOutputShiftEndButton.addEventListener(
    "click",
    function () {
        endEventShift();
    }
);


function renderEventOutput() {

    const event =
        getCurrentEvent();

    eventOutputOrders.innerHTML =
        "";

    if (
        !event ||
        !Array.isArray(
            event.sales
        ) ||
        event.sales.length ===
        0
    ) {

        eventOutputOrders.innerHTML = `
            <div class="no-data">
                Noch keine bezahlten Bestellungen vorhanden.
            </div>
        `;

        return;
    }

    event.sales
        .slice()
        .reverse()
        .forEach(
            function (
                sale,
                index
            ) {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "event-order-card";

                const number =
                    event.sales.length -
                    index;

                row.innerHTML = `
                    <div>

                        <strong>
                            Bestellung ${number}
                        </strong>

                        <small>
                            ${formatPrice(
                                sale.total
                            )}
                        </small>

                        <small>
                            ${
                                (
                                    sale.items ||
                                    []
                                )
                                    .map(
                                        function (
                                            item
                                        ) {
                                            return (
                                                escapeHtml(
                                                    item.name
                                                ) +
                                                " × " +
                                                item.quantity
                                            );
                                        }
                                    )
                                    .join(
                                        " · "
                                    )
                            }
                        </small>

                    </div>

                    <span class="event-order-status">
                        Bezahlt
                    </span>
                `;

                eventOutputOrders.appendChild(
                    row
                );
            }
        );
}


function endEventShift() {

    const event =
        getCurrentEvent();

    if (!event) {
        return;
    }

    const salesForEvent =
        Array.isArray(
            event.sales
        )
            ? event.sales
            : [];

    const count =
        salesForEvent.length;

    const revenue =
        salesForEvent.reduce(
            function (
                sum,
                sale
            ) {

                return (
                    sum +
                    Number(
                        sale.total ||
                        0
                    )
                );
            },
            0
        );

    const isTest =
        isCurrentTeacher();

    const text =
        isTest
            ? "Testumgebung: Ihr hattet " +
                count +
                " Verkäufe und " +
                formatPrice(
                    revenue
                ) +
                " Umsatz."
            : "Ihr habt " +
                count +
                " Verkäufe gemacht und " +
                formatPrice(
                    revenue
                ) +
                " Umsatz erzielt.";

    showSiteMessage(
        "🎉",
        "Well done heute, Team! 🎉",
        text,
        isTest
            ? "Zur Veranstaltung"
            : "Weiter zur Endinventur",
        function () {

            if (
                isTest
            ) {

                showScreen(
                    eventWorkspaceScreen
                );

                return;
            }

            openEventEndInventory();
        }
    );
}


function openEventEndInventory() {

    const event =
        getCurrentEvent();

    if (!event) {
        return;
    }

    eventEndInventoryTitle.textContent =
        "Endinventur · " +
        event.name;

    renderEventEndInventory();

    showScreen(
        eventEndInventoryScreen,
        eventWorkspaceScreen
    );
}


function renderEventEndInventory() {

    const event =
        getCurrentEvent();

    eventEndInventoryList.innerHTML =
        "";

    if (!event) {
        return;
    }

    const rows =
        [];

    if (
        Array.isArray(
            event.products
        ) &&
        event.products.length >
        0
    ) {

        event.products.forEach(
            function (product) {

                rows.push(
                    {
                        key:
                            product.id,

                        name:
                            product.name,

                        icon:
                            product.icon
                                || "🎪"
                    }
                );
            }
        );
    }

    if (
        Array.isArray(
            event.start_inventory
        )
    ) {

        event.start_inventory.forEach(
            function (item) {

                const existing =
                    rows.find(
                        function (row) {

                            return (
                                row.name
                                    .toLowerCase() ===
                                String(
                                    item.product_name ||
                                    ""
                                ).toLowerCase()
                            );
                        }
                    );

                if (!existing) {

                    rows.push(
                        {
                            key:
                                createId(
                                    "stock"
                                ),

                            name:
                                item.product_name,

                            icon:
                                "📦"
                        }
                    );
                }
            }
        );
    }

    if (
        rows.length ===
        0
    ) {

        eventEndInventoryList.innerHTML =
            '<div class="no-data">Keine Produkte vorhanden.</div>';

        return;
    }

    rows.forEach(
        function (row) {

            const previous =
                (
                    event.end_inventory ||
                    []
                ).find(
                    function (item) {

                        return (
                            String(
                                item.product_name ||
                                ""
                            ).toLowerCase() ===
                            String(
                                row.name ||
                                ""
                            ).toLowerCase()
                        );
                    }
                );

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "inventory-count-row";

            card.innerHTML = `
                <div class="inventory-count-product">

                    <span>
                        ${escapeHtml(
                            row.icon ||
                            "📦"
                        )}
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(
                                row.name
                            )}
                        </strong>

                        <small>
                            gezählter Endbestand
                        </small>

                    </div>

                </div>

                <input
                    class="inventory-count-input event-end-inventory-input"
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    value="${
                        previous
                            ? Number(
                                previous.quantity ||
                                0
                            )
                            : ""
                    }"
                    placeholder="0"
                    data-product-name="${escapeAttribute(
                        row.name
                    )}"
                >
            `;

            eventEndInventoryList.appendChild(
                card
            );
        }
    );
}


eventEndInventoryBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            eventWorkspaceScreen
        );
    }
);


saveEventEndInventoryButton.addEventListener(
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (!event) {
            return;
        }

        const inputs =
            eventEndInventoryList.querySelectorAll(
                ".event-end-inventory-input"
            );

        const rows =
            [];

        let invalid =
            false;

        inputs.forEach(
            function (input) {

                const value =
                    input.value.trim();

                if (
                    value ===
                    ""
                ) {
                    return;
                }

                const quantity =
                    Number(
                        value
                    );

                if (
                    !Number.isInteger(
                        quantity
                    ) ||
                    quantity <
                    0
                ) {

                    invalid =
                        true;

                    return;
                }

                rows.push(
                    {
                        product_name:
                            input.dataset.productName,

                        quantity:
                            quantity,

                        person_id:
                            currentPerson
                                ? currentPerson.id
                                : null,

                        person_name:
                            currentPerson
                                ? getFullName(
                                    currentPerson
                                )
                                : ""
                    }
                );
            }
        );

        if (
            invalid
        ) {

            alert(
                "Bitte nur ganze Mengen ab 0 eingeben."
            );

            return;
        }

        if (
            rows.length ===
            0
        ) {

            alert(
                "Bitte mindestens eine Menge eingeben."
            );

            return;
        }

        event.end_inventory =
            rows;

        event.end_inventory_completed =
            true;

        event.status =
            "abgeschlossen";

        updateCurrentEvent(
            event
        );

        showSiteMessage(
            "✅",
            "Endinventur gespeichert",
            "Die Endinventur für „" +
                event.name +
                "“ wurde gespeichert.",
            "Weiter",
            function () {

                currentEventId =
                    null;

                eventSaleCart =
                    [];

                eventReceivedAmount =
                    "";

                showScreen(
                    homeScreen
                );
            }
        );
    }
);


eventWorkspaceBackButton.addEventListener(
    "click",
    function () {
        showScreen(
            eventListScreen
        );
    }
);


function showSiteMessage(
    icon,
    title,
    text,
    buttonText,
    callback
) {

    siteMessageIcon.textContent =
        icon;

    siteMessageTitle.textContent =
        title;

    siteMessageText.textContent =
        text;

    siteMessagePrimaryButton.textContent =
        buttonText;

    siteMessageCallback =
        typeof callback ===
        "function"
            ? callback
            : null;

    siteMessageModal.style.display =
        "flex";

    siteMessageModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


siteMessagePrimaryButton.addEventListener(
    "click",
    function () {

        const callback =
            siteMessageCallback;

        siteMessageCallback =
            null;

        siteMessageModal.style.display =
            "none";

        siteMessageModal.setAttribute(
            "aria-hidden",
            "true"
        );

        if (callback) {
            callback();
        }
    }
);


function getEventById(
    eventId
) {

    return loadEvents().find(
        function (event) {
            return event.id ===
                eventId;
        }
    ) || null;
}


function getCurrentEvent() {

    if (
        !currentEventId
    ) {
        return null;
    }

    return getEventById(
        currentEventId
    );
}


function updateCurrentEvent(
    event
) {

    const events =
        loadEvents();

    const index =
        events.findIndex(
            function (item) {
                return (
                    item.id ===
                    event.id
                );
            }
        );

    if (
        index ===
        -1
    ) {

        events.push(
            event
        );

    } else {

        events[
            index
        ] =
            event;
    }

    saveEvents(
        events
    );
}


function setDefaultDates() {

    const today =
        getLocalDateKey(
            new Date()
        );

    if (
        !invoiceDateInput.value
    ) {

        invoiceDateInput.value =
            today;
    }

    if (
        !eventInvoiceDateInput.value
    ) {

        eventInvoiceDateInput.value =
            today;
    }

    if (
        !eventDateInput.value
    ) {

        eventDateInput.value =
            today;
    }
}


function createId(
    prefix
) {

    const random =
        Math.random()
            .toString(36)
            .slice(2, 9);

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        random
    );
}


function formatEventDate(
    value
) {

    if (!value) {
        return "";
    }

    const date =
        new Date(
            value +
            "T12:00:00"
        );

    return date.toLocaleDateString(
        "de-DE",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"
        }
    );
}


function parseGermanNumber(
    value
) {

    if (!value) {
        return 0;
    }

    return Number(
        String(
            value
        )
            .replace(
                /€/g,
                ""
            )
            .replace(
                /\s/g,
                ""
            )
            .replace(
                /\./g,
                ""
            )
            .replace(
                ",",
                "."
            )
    );
}


function formatPrice(
    value
) {

    const number =
        Number(
            value ||
            0
        );

    return (
        number
            .toFixed(
                2
            )
            .replace(
                ".",
                ","
            ) +
        " €"
    );
}


function roundMoney(
    value
) {

    return (
        Math.round(
            (
                Number(
                    value
                ) +
                Number.EPSILON
            ) *
            100
        ) /
        100
    );
}


function getLocalDateKey(
    date
) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() +
            1
        ).padStart(
            2,
            "0"
        ) +
        "-" +
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )
    );
}


function getDateForFileName() {

    return getLocalDateKey(
        new Date()
    );
}


function getFullName(
    person
) {

    if (!person) {
        return "";
    }

    return [
        person.first_name,
        person.last_name
    ]
        .filter(Boolean)
        .join(" ");
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );
}


// ========================================
// END
// ========================================

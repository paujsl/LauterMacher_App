// ========================================
// LAUTER MACHER
// APP.JS — STABILISIERTE VERSION 7
// ========================================


// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL = "https://gsbkfrjhierqopkwpqjc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_xiM5w8RhiN0I0j5HSVPfnw_LhLQgozX";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

let currentPerson = null;
let selectedLoginPerson = null;
let currentReturnScreen = null;

let saleTestMode = false;
let cart = [];
let receivedAmount = "";

let currentReportPeriod = "day";
let editingProductId = null;
let inventoryProductId = null;


// ========================================
// SCREENS
// ========================================

const identityScreen =
    document.getElementById("identityScreen");

const pinLoginScreen =
    document.getElementById("pinLoginScreen");

const homeScreen =
    document.getElementById("homeScreen");

const saleScreen =
    document.getElementById("saleScreen");

const paymentScreen =
    document.getElementById("paymentScreen");

const successScreen =
    document.getElementById("successScreen");

const bakeryMenuScreen =
    document.getElementById("bakeryMenuScreen");

const bakeryCashScreen =
    document.getElementById("bakeryCashScreen");

const bakeryOutputScreen =
    document.getElementById("bakeryOutputScreen");

const eventMenuScreen =
    document.getElementById("eventMenuScreen");

const adminScreen =
    document.getElementById("adminScreen");

const reportsScreen =
    document.getElementById("reportsScreen");

const inventoryScreen =
    document.getElementById("inventoryScreen");

const inventoryCountScreen =
    document.getElementById("inventoryCountScreen");

const productsScreen =
    document.getElementById("productsScreen");


// ========================================
// LOGIN
// ========================================

const peopleGrid =
    document.getElementById("peopleGrid");

const identityError =
    document.getElementById("identityError");

const selectedPersonName =
    document.getElementById("selectedPersonName");

const loginPinInput =
    document.getElementById("loginPinInput");

const pinLoginError =
    document.getElementById("pinLoginError");

const loginBackButton =
    document.getElementById("loginBackButton");

const loginConfirmButton =
    document.getElementById("loginConfirmButton");


// ========================================
// GLOBAL HEADER
// ========================================

const appHeader =
    document.getElementById("appHeader");

const currentPersonName =
    document.getElementById("currentPersonName");

const homeRoleLabel =
    document.getElementById("homeRoleLabel");

const logoutButton =
    document.getElementById("logoutButton");

const notificationButton =
    document.getElementById("notificationButton");

const notificationCount =
    document.getElementById("notificationCount");


// ========================================
// HOME
// ========================================

const studentHomeMenu =
    document.getElementById("studentHomeMenu");

const teacherHomeMenu =
    document.getElementById("teacherHomeMenu");

const saleButton =
    document.getElementById("saleButton");

const teacherSaleButton =
    document.getElementById("teacherSaleButton");

const bakeryButton =
    document.getElementById("bakeryButton");

const teacherBakeryButton =
    document.getElementById("teacherBakeryButton");

const adminButton =
    document.getElementById("adminButton");

const teacherAdminButton =
    document.getElementById("teacherAdminButton");

const reportsHomeButton =
    document.getElementById("reportsHomeButton");

const eventButton =
    document.getElementById("eventButton");

const teacherEventButton =
    document.getElementById("teacherEventButton");


// ========================================
// BÄCKEREI
// ========================================

const bakeryBackButton =
    document.getElementById("bakeryBackButton");

const bakeryCashButton =
    document.getElementById("bakeryCashButton");

const bakeryServiceButton =
    document.getElementById("bakeryServiceButton");

const bakeryCashBackButton =
    document.getElementById("bakeryCashBackButton");

const bakeryOutputBackButton =
    document.getElementById("bakeryOutputBackButton");

const bakeryCashShiftEndButton =
    document.getElementById(
        "bakeryCashShiftEndButton"
    );

const bakeryOutputShiftEndButton =
    document.getElementById(
        "bakeryOutputShiftEndButton"
    );


// ========================================
// SONDERVERANSTALTUNG
// ========================================

const eventBackButton =
    document.getElementById("eventBackButton");

const futureFunctionButtons =
    document.querySelectorAll(
        ".future-function"
    );


// ========================================
// GETRÄNKE KASSE
// ========================================

const saleBackButton =
    document.getElementById(
        "saleBackButton"
    );

const saleShiftEndButton =
    document.getElementById(
        "saleShiftEndButton"
    );

const drinksGrid =
    document.getElementById("drinksGrid");

const bakeryGrid =
    document.getElementById("bakeryGrid");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const payButton =
    document.getElementById("payButton");


// ========================================
// PAYMENT
// ========================================

const paymentBackButton =
    document.getElementById(
        "paymentBackButton"
    );

const paymentTotal =
    document.getElementById("paymentTotal");

const amountReceived =
    document.getElementById(
        "amountReceived"
    );

const changeAmount =
    document.getElementById(
        "changeAmount"
    );

const paidButton =
    document.getElementById("paidButton");

const paymentKeys =
    document.querySelectorAll(
        ".payment-key"
    );

const deletePaymentButton =
    document.getElementById(
        "deletePaymentButton"
    );


// ========================================
// SUCCESS
// ========================================

const successChange =
    document.getElementById(
        "successChange"
    );

const newOrderButton =
    document.getElementById(
        "newOrderButton"
    );

const successHomeButton =
    document.getElementById(
        "successHomeButton"
    );


// ========================================
// BEARBEITEN
// ========================================

const adminBackButton =
    document.getElementById(
        "adminBackButton"
    );

const productsButton =
    document.getElementById(
        "productsButton"
    );

const inventoryButton =
    document.getElementById(
        "inventoryButton"
    );

const studentsButton =
    document.getElementById(
        "studentsButton"
    );

const editMenuTitle =
    document.getElementById(
        "editMenuTitle"
    );

const editMenuDescription =
    document.getElementById(
        "editMenuDescription"
    );

const inventoryMenuTitle =
    document.getElementById(
        "inventoryMenuTitle"
    );

const inventoryMenuDescription =
    document.getElementById(
        "inventoryMenuDescription"
    );


// ========================================
// PRODUCTS
// ========================================

const productsBackButton =
    document.getElementById(
        "productsBackButton"
    );

const adminProductsList =
    document.getElementById(
        "adminProductsList"
    );

const addProductButton =
    document.getElementById(
        "addProductButton"
    );

const productModal =
    document.getElementById(
        "productModal"
    );

const closeProductModalButton =
    document.getElementById(
        "closeProductModalButton"
    );

const cancelProductButton =
    document.getElementById(
        "cancelProductButton"
    );

const saveProductButton =
    document.getElementById(
        "saveProductButton"
    );

const productModalTitle =
    document.getElementById(
        "productModalTitle"
    );

const productNameInput =
    document.getElementById(
        "productNameInput"
    );

const productPriceInput =
    document.getElementById(
        "productPriceInput"
    );

const productCategoryInput =
    document.getElementById(
        "productCategoryInput"
    );

const productIconInput =
    document.getElementById(
        "productIconInput"
    );


// ========================================
// INVENTAR — LEHRKRAFT
// ========================================

const inventoryBackButton =
    document.getElementById(
        "inventoryBackButton"
    );

const inventoryList =
    document.getElementById(
        "inventoryList"
    );

const inventoryModal =
    document.getElementById(
        "inventoryModal"
    );

const closeInventoryModalButton =
    document.getElementById(
        "closeInventoryModalButton"
    );

const cancelInventoryButton =
    document.getElementById(
        "cancelInventoryButton"
    );

const saveInventoryButton =
    document.getElementById(
        "saveInventoryButton"
    );

const inventoryProductLabel =
    document.getElementById(
        "inventoryProductLabel"
    );

const inventoryAmountInput =
    document.getElementById(
        "inventoryAmountInput"
    );


// ========================================
// INVENTUR — SCHÜLER/IN
// ========================================

const inventoryCountBackButton =
    document.getElementById(
        "inventoryCountBackButton"
    );

const inventoryCountList =
    document.getElementById(
        "inventoryCountList"
    );

const submitInventoryButton =
    document.getElementById(
        "submitInventoryButton"
    );


// ========================================
// BERICHTE
// ========================================

const reportsBackButton =
    document.getElementById(
        "reportsBackButton"
    );

const periodTabs =
    document.querySelectorAll(
        ".period-tab"
    );

const reportDateLabel =
    document.getElementById(
        "reportDateLabel"
    );

const reportRevenue =
    document.getElementById(
        "reportRevenue"
    );

const reportTransactions =
    document.getElementById(
        "reportTransactions"
    );

const reportDrinks =
    document.getElementById(
        "reportDrinks"
    );

const reportBakery =
    document.getElementById(
        "reportBakery"
    );

const reportProducts =
    document.getElementById(
        "reportProducts"
    );

const exportReportButton =
    document.getElementById(
        "exportReportButton"
    );

const clearReportsButton =
    document.getElementById(
        "clearReportsButton"
    );


// ========================================
// STORAGE
// ========================================

const STORAGE_KEYS = {

    products:
        "lauterMacher_products_v1",

    sales:
        "lauterMacher_sales_v1",

    inventory:
        "lauterMacher_inventory_v1",

    inventorySubmissions:
        "lauterMacher_inventory_submissions_v1",

    shiftClosures:
        "lauterMacher_shift_closures_v1"
};


// ========================================
// DEFAULT PRODUCTS
// ========================================

const DEFAULT_PRODUCTS = [

    {
        id:
            "wasser",

        name:
            "Wasser",

        price:
            1.00,

        category:
            "drink",

        icon:
            "💧"
    },

    {
        id:
            "apfelsaft",

        name:
            "Apfelsaft",

        price:
            1.50,

        category:
            "drink",

        icon:
            "🧃"
    },

    {
        id:
            "capri-sun",

        name:
            "Capri-Sun",

        price:
            1.50,

        category:
            "drink",

        icon:
            "🧃"
    },

    {
        id:
            "fake-cola",

        name:
            "Fake Cola",

        price:
            1.50,

        category:
            "drink",

        icon:
            "🥤"
    },

    {
        id:
            "fake-fanta",

        name:
            "Fake Fanta",

        price:
            1.50,

        category:
            "drink",

        icon:
            "🥤"
    },

    {
        id:
            "fake-sprite",

        name:
            "Fake Sprite",

        price:
            1.50,

        category:
            "drink",

        icon:
            "🥤"
    },

    {
        id:
            "isodrink",

        name:
            "Isodrink",

        price:
            2.00,

        category:
            "drink",

        icon:
            "⚡"
    }
];


// ========================================
// LOCAL DATA
// ========================================

let products =
    loadProducts();

let sales =
    loadSales();

let inventory =
    loadInventory();


// ========================================
// INITIALISATION
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        renderProducts();

        updateCart();

        updateInventoryMenus();

        hideAppHeader();

        showScreen(
            identityScreen
        );

        await initialiseAuthentication();
    }
);


// ========================================
// AUTHENTIFIZIERUNG
// ========================================

async function initialiseAuthentication() {

    try {

        const {
            data: sessionData
        } =
            await supabaseClient.auth.getSession();

        if (
            sessionData &&
            sessionData.session
        ) {

            const restoredPerson =
                await loadCurrentPerson(
                    sessionData.session
                );

            if (restoredPerson) {

                applyLoggedInState(
                    restoredPerson
                );

                return;
            }

            await supabaseClient.auth.signOut();
        }

        await loadLoginPeople();

    } catch (error) {

        console.error(
            "Authentifizierung konnte nicht initialisiert werden.",
            error
        );

        identityError.textContent =
            "Die Anmeldung konnte nicht geladen werden.";

        await loadLoginPeople();
    }
}


async function loadLoginPeople() {

    identityError.textContent =
        "";

    peopleGrid.innerHTML =
        '<div class="login-loading">Personen werden geladen …</div>';

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "login_people"
            )
            .select(
                "id, first_name, last_name, person_type"
            )
            .order(
                "person_type"
            )
            .order(
                "last_name"
            )
            .order(
                "first_name"
            );

    if (error) {

        console.error(
            "Login-Personen konnten nicht geladen werden.",
            error
        );

        peopleGrid.innerHTML =
            "";

        identityError.textContent =
            "Personen konnten nicht geladen werden. Bitte Internetverbindung prüfen.";

        return;
    }

    peopleGrid.innerHTML =
        "";

    (data || []).forEach(
        function (person) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "person-login-card";

            const fullName =
                getFullName(
                    person
                );

            button.innerHTML = `

                <span class="person-login-icon">
                    ${
                        person.person_type ===
                        "lehrer"
                            ? "👨‍🏫"
                            : "👤"
                    }
                </span>

                <span class="person-login-name">
                    ${escapeHtml(fullName)}
                </span>

                <span class="person-login-type">
                    ${
                        person.person_type ===
                        "lehrer"
                            ? "Lehrkraft"
                            : "Schüler/in"
                    }
                </span>

            `;

            button.addEventListener(
                "click",
                function () {

                    selectLoginPerson(
                        person
                    );
                }
            );

            peopleGrid.appendChild(
                button
            );
        }
    );

    if (
        !data ||
        data.length === 0
    ) {

        identityError.textContent =
            "Keine aktiven Personen gefunden.";
    }
}


function selectLoginPerson(
    person
) {

    selectedLoginPerson =
        person;

    selectedPersonName.textContent =
        getFullName(
            person
        );

    pinLoginError.textContent =
        "";

    loginPinInput.value =
        "";

    showScreen(
        pinLoginScreen
    );

    window.setTimeout(
        function () {

            loginPinInput.focus();

        },
        50
    );
}


loginBackButton.addEventListener(
    "click",
    function () {

        selectedLoginPerson =
            null;

        loginPinInput.value =
            "";

        pinLoginError.textContent =
            "";

        showScreen(
            identityScreen
        );
    }
);


loginPinInput.addEventListener(
    "input",
    function () {

        loginPinInput.value =
            loginPinInput.value
                .replace(
                    /[^0-9]/g,
                    ""
                )
                .slice(
                    0,
                    4
                );

        pinLoginError.textContent =
            "";
    }
);


loginPinInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Enter"
        ) {

            loginConfirmButton.click();
        }
    }
);


loginConfirmButton.addEventListener(
    "click",
    loginWithPin
);


async function loginWithPin() {

    if (!selectedLoginPerson) {
        return;
    }

    const pin =
        loginPinInput.value;

    if (
        !/^[0-9]{4}$/.test(pin)
    ) {

        pinLoginError.textContent =
            "Bitte eine 4-stellige PIN eingeben.";

        loginPinInput.focus();

        return;
    }

    loginConfirmButton.disabled =
        true;

    loginConfirmButton.textContent =
        "Anmeldung …";

    pinLoginError.textContent =
        "";

    try {

        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                "login-with-pin",
                {
                    body: {

                        person_id:
                            selectedLoginPerson.id,

                        pin:
                            pin
                    }
                }
            );

        if (error) {
            throw error;
        }

        if (
            !data ||
            !data.success ||
            !data.token_hash ||
            !data.verification_type
        ) {

            throw new Error(
                "Ungültige Antwort vom Login-Service."
            );
        }

        const {
            data: otpData,
            error: otpError
        } =
            await supabaseClient.auth.verifyOtp(
                {
                    token_hash:
                        data.token_hash,

                    type:
                        data.verification_type
                }
            );

        if (otpError) {
            throw otpError;
        }

        const person =
            await loadCurrentPerson(
                otpData.session
            );

        if (!person) {

            throw new Error(
                "Person konnte nach der Anmeldung nicht geladen werden."
            );
        }

        applyLoggedInState(
            person
        );

    } catch (error) {

        console.error(
            "Login fehlgeschlagen.",
            error
        );

        pinLoginError.textContent =
            "Falsche PIN oder Anmeldung nicht möglich.";

        loginPinInput.value =
            "";

        loginPinInput.focus();

    } finally {

        loginConfirmButton.disabled =
            false;

        loginConfirmButton.textContent =
            "Einloggen";
    }
}


async function loadCurrentPerson(
    session
) {

    if (
        !session ||
        !session.user
    ) {

        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "people"
            )
            .select(
                "id, first_name, last_name, person_type, active"
            )
            .eq(
                "auth_user_id",
                session.user.id
            )
            .eq(
                "active",
                true
            )
            .single();

    if (error) {

        console.error(
            "Aktuelle Person konnte nicht geladen werden.",
            error
        );

        return null;
    }

    return data;
}


function applyLoggedInState(
    person
) {

    currentPerson =
        person;

    currentPersonName.textContent =
        getFullName(
            person
        );

    homeRoleLabel.textContent =
        isCurrentTeacher()
            ? "Lehrkraft"
            : "Schüler/in";

    updateHomeForPerson();

    updateInventoryMenus();

    updateNotificationBadge();

    showAppHeader();

    selectedLoginPerson =
        null;

    loginPinInput.value =
        "";

    pinLoginError.textContent =
        "";

    resetSale();

    showScreen(
        homeScreen
    );
}


logoutButton.addEventListener(
    "click",
    async function () {

        const {
            error
        } =
            await supabaseClient.auth.signOut();

        if (error) {

            console.error(
                "Abmeldung fehlgeschlagen.",
                error
            );

            alert(
                "Abmeldung war nicht möglich."
            );

            return;
        }

        currentPerson =
            null;

        selectedLoginPerson =
            null;

        currentPersonName.textContent =
            "-";

        notificationCount.hidden =
            true;

        notificationCount.textContent =
            "0";

        resetSale();

        hideAppHeader();

        showScreen(
            identityScreen
        );

        await loadLoginPeople();
    }
);


supabaseClient.auth.onAuthStateChange(
    function (
        _event,
        session
    ) {

        if (
            !session &&
            currentPerson
        ) {

            currentPerson =
                null;

            hideAppHeader();

            showScreen(
                identityScreen
            );
        }
    }
);


// ========================================
// HEADER
// ========================================

function showAppHeader() {

    appHeader.classList.add(
        "visible"
    );
}


function hideAppHeader() {

    appHeader.classList.remove(
        "visible"
    );
}


// ========================================
// HOME
// ========================================

function updateHomeForPerson() {

    const isTeacher =
        isCurrentTeacher();

    studentHomeMenu.hidden =
        isTeacher;

    teacherHomeMenu.hidden =
        !isTeacher;
}


function isCurrentTeacher() {

    return Boolean(
        currentPerson &&
        currentPerson.person_type ===
        "lehrer"
    );
}


function updateInventoryMenus() {

    const isTeacher =
        isCurrentTeacher();

    editMenuTitle.textContent =
        "Bearbeiten";

    if (isTeacher) {

        editMenuDescription.textContent =
            "Produkte, Preise, Inventar und Schüler verwalten.";

        inventoryMenuTitle.textContent =
            "Inventar";

        inventoryMenuDescription.textContent =
            "Bestand verwalten";

        studentsButton.hidden =
            false;

    } else {

        editMenuDescription.textContent =
            "Produkte und Preise selbstständig bearbeiten.";

        inventoryMenuTitle.textContent =
            "Inventur";

        inventoryMenuDescription.textContent =
            "Bestand zählen und an den Professor senden";

        studentsButton.hidden =
            true;
    }
}


function updateNotificationBadge() {

    if (
        !isCurrentTeacher()
    ) {

        notificationCount.hidden =
            true;

        notificationCount.textContent =
            "0";

        return;
    }

    const submissions =
        loadInventorySubmissions();

    if (
        submissions.length >
        0
    ) {

        notificationCount.hidden =
            false;

        notificationCount.textContent =
            String(
                submissions.length
            );

    } else {

        notificationCount.hidden =
            true;

        notificationCount.textContent =
            "0";
    }
}


notificationButton.addEventListener(
    "click",
    function () {

        // Die Glocke bleibt zunächst
        // bewusst nur visuell.
    }
);


// ========================================
// LOCAL STORAGE — PRODUCTS
// ========================================

function loadProducts() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.products
            );

        if (saved) {

            const parsed =
                JSON.parse(
                    saved
                );

            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed;
            }
        }

    } catch (error) {

        console.error(
            "Produkte konnten nicht geladen werden.",
            error
        );
    }

    const fallback =
        typeof PRODUCTS !==
            "undefined" &&
        Array.isArray(
            PRODUCTS
        )
            ? PRODUCTS
            : DEFAULT_PRODUCTS;

    return fallback.map(
        function (product) {

            return {
                ...product
            };
        }
    );
}


function saveProducts() {

    localStorage.setItem(
        STORAGE_KEYS.products,
        JSON.stringify(
            products
        )
    );
}


// ========================================
// LOCAL STORAGE — SALES
// ========================================

function loadSales() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.sales
            );

        if (saved) {

            const parsed =
                JSON.parse(
                    saved
                );

            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed;
            }
        }

    } catch (error) {

        console.error(
            "Verkaufsdaten konnten nicht geladen werden.",
            error
        );
    }

    return [];
}


function saveSales() {

    localStorage.setItem(
        STORAGE_KEYS.sales,
        JSON.stringify(
            sales
        )
    );
}


// ========================================
// LOCAL STORAGE — INVENTORY
// ========================================

function loadInventory() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.inventory
            );

        if (saved) {

            const parsed =
                JSON.parse(
                    saved
                );

            if (
                parsed &&
                typeof parsed ===
                "object"
            ) {

                return parsed;
            }
        }

    } catch (error) {

        console.error(
            "Inventar konnte nicht geladen werden.",
            error
        );
    }

    return {};
}


function saveInventory() {

    localStorage.setItem(
        STORAGE_KEYS.inventory,
        JSON.stringify(
            inventory
        )
    );
}


// ========================================
// LOCAL STORAGE — INVENTURMELDUNGEN
// ========================================

function loadInventorySubmissions() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.inventorySubmissions
            );

        const parsed =
            saved
                ? JSON.parse(
                    saved
                )
                : [];

        return Array.isArray(
            parsed
        )
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


function saveInventorySubmissions(
    submissions
) {

    localStorage.setItem(
        STORAGE_KEYS.inventorySubmissions,
        JSON.stringify(
            submissions
        )
    );
}


// ========================================
// LOCAL STORAGE — SCHICHTABSCHLÜSSE
// ========================================

function loadShiftClosures() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.shiftClosures
            );

        const parsed =
            saved
                ? JSON.parse(
                    saved
                )
                : [];

        return Array.isArray(
            parsed
        )
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


function saveShiftClosures(
    closures
) {

    localStorage.setItem(
        STORAGE_KEYS.shiftClosures,
        JSON.stringify(
            closures
        )
    );
}


// ========================================
// SCREEN NAVIGATION
// ========================================

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
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    "screen-visible"
                );

                item.style.display =
                    "none";
            }
        );

    screen.style.display =
        "block";

    screen.classList.add(
        "screen-visible"
    );

    window.scrollTo(
        {
            top:
                0,

            behavior:
                "auto"
        }
    );
}


// ========================================
// HOME NAVIGATION
// ========================================

saleButton.addEventListener(
    "click",
    openSaleScreen
);


teacherSaleButton.addEventListener(
    "click",
    openSaleScreen
);


function openSaleScreen() {

    saleTestMode =
        isCurrentTeacher();

    resetSale();

    showScreen(
        saleScreen,
        homeScreen
    );
}


bakeryButton.addEventListener(
    "click",
    openBakeryMenu
);


teacherBakeryButton.addEventListener(
    "click",
    openBakeryMenu
);


function openBakeryMenu() {

    showScreen(
        bakeryMenuScreen,
        homeScreen
    );
}


adminButton.addEventListener(
    "click",
    openEditMenu
);


teacherAdminButton.addEventListener(
    "click",
    openEditMenu
);


function openEditMenu() {

    updateInventoryMenus();

    showScreen(
        adminScreen,
        homeScreen
    );
}


eventButton.addEventListener(
    "click",
    openEventMenu
);


teacherEventButton.addEventListener(
    "click",
    openEventMenu
);


function openEventMenu() {

    showScreen(
        eventMenuScreen,
        homeScreen
    );
}


reportsHomeButton.addEventListener(
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {

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


// ========================================
// BÄCKEREI NAVIGATION
// ========================================

bakeryBackButton.addEventListener(
    "click",
    function () {

        showScreen(
            homeScreen
        );
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


// ========================================
// SONDERVERANSTALTUNG
// ========================================

eventBackButton.addEventListener(
    "click",
    function () {

        showScreen(
            homeScreen
        );
    }
);


futureFunctionButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                alert(
                    "Diese Funktion wird noch gemeinsam festgelegt."
                );
            }
        );
    }
);


// ========================================
// SALE — PRODUCTS
// ========================================

function renderProducts() {

    drinksGrid.innerHTML =
        "";

    bakeryGrid.innerHTML =
        "";

    products
        .filter(
            function (product) {

                return (
                    product.category ===
                    "drink"
                );
            }
        )
        .forEach(
            function (product) {

                drinksGrid.appendChild(
                    createProductButton(
                        product
                    )
                );
            }
        );

    products
        .filter(
            function (product) {

                return (
                    product.category ===
                    "bakery"
                );
            }
        )
        .forEach(
            function (product) {

                bakeryGrid.appendChild(
                    createProductButton(
                        product
                    )
                );
            }
        );

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

    if (
        bakeryGrid.children.length ===
        0
    ) {

        bakeryGrid.innerHTML = `
            <div class="coming-soon">
                Weitere Produkte folgen.
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

    const existingProduct =
        cart.find(
            function (item) {

                return (
                    item.id ===
                    product.id
                );
            }
        );

    if (
        existingProduct
    ) {

        existingProduct.quantity +=
            1;

    } else {

        cart.push(
            {
                id:
                    product.id,

                name:
                    product.name,

                price:
                    Number(
                        product.price
                    ),

                category:
                    product.category,

                quantity:
                    1
            }
        );
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
                Noch keine Produkte ausgewählt.
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

            const productTotal =
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
                            productTotal
                        )}
                    </span>

                </div>

                <div class="cart-controls">

                    <button
                        class="cart-control minus"
                        type="button"
                        data-index="${index}"
                    >
                        −
                    </button>

                    <span class="cart-quantity">
                        ${product.quantity}
                    </span>

                    <button
                        class="cart-control plus"
                        type="button"
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
            ".cart-control.minus"
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
                            !cart[index]
                        ) {

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
            ".cart-control.plus"
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
                            !cart[index]
                        ) {

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

            return (
                total +
                Number(
                    product.price
                ) *
                Number(
                    product.quantity
                )
            );

        },
        0
    );
}


// ========================================
// SALE — BACK
// ========================================

saleBackButton.addEventListener(
    "click",
    function () {

        resetSale();

        showScreen(
            homeScreen
        );
    }
);


// ========================================
// SCHICHT BEENDEN
// ========================================

saleShiftEndButton.addEventListener(
    "click",
    function () {

        endShift(
            "Getränke · Kasse"
        );
    }
);


bakeryCashShiftEndButton.addEventListener(
    "click",
    function () {

        endShift(
            "Bäckerei · Kasse"
        );
    }
);


bakeryOutputShiftEndButton.addEventListener(
    "click",
    function () {

        endShift(
            "Bäckerei · Ausgabe"
        );
    }
);


function endShift(
    source
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

    let message =
        "";

    if (isTest) {

        message =
            "Testumgebung\n\n" +
            "Heute: " +
            transactionCount +
            " Verkäufe\n" +
            "Umsatz: " +
            formatPrice(
                revenue
            ) +
            "\n\n" +
            "Diese Test-Schicht wird nicht als echter Schichtabschluss gespeichert.";

    } else {

        message =
            "Schicht beenden?\n\n" +
            "Heute: " +
            transactionCount +
            " Verkäufe\n" +
            "Umsatz: " +
            formatPrice(
                revenue
            );
    }

    const confirmed =
        confirm(
            message
        );

    if (!confirmed) {

        return;
    }

    if (!isTest) {

        const closures =
            loadShiftClosures();

        closures.push(
            {
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
            }
        );

        saveShiftClosures(
            closures
        );
    }

    resetSale();

    showScreen(
        homeScreen
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


function getLocalDateKey(
    date
) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
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


// ========================================
// PAYMENT
// ========================================

payButton.addEventListener(
    "click",
    function () {

        if (
            cart.length ===
            0
        ) {

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

        saveSale(
            total,
            received,
            change
        );

        successChange.textContent =
            formatPrice(
                change
            );

        showScreen(
            successScreen
        );
    }
);


function saveSale(
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
                item.category ===
                "drink"
            ) {

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
        }
    );

    saveInventory();
}


newOrderButton.addEventListener(
    "click",
    function () {

        resetSale();

        showScreen(
            saleScreen
        );
    }
);


successHomeButton.addEventListener(
    "click",
    function () {

        resetSale();

        showScreen(
            homeScreen
        );
    }
);


function resetSale() {

    cart = [];

    receivedAmount =
        "";

    updateCart();
}


// ========================================
// BEARBEITEN
// ========================================

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


// ========================================
// PRODUKTE
// ========================================

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
                        class="icon-action edit-product-button"
                        type="button"
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                        title="Bearbeiten"
                    >
                        ✏️
                    </button>

                    <button
                        class="icon-action delete delete-product-button"
                        type="button"
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

    window.setTimeout(
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


// ========================================
// INVENTAR — LEHRKRAFT
// ========================================

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

                <div
                    class="inventory-stock ${stockClass}"
                >
                    ${stock} Stück
                </div>

                <button
                    class="inventory-adjust-button"
                    type="button"
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

    if (!product) {

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

    window.setTimeout(
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


// ========================================
// INVENTUR — SCHÜLER
// ========================================

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
            isCurrentTeacher()
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

        submissions.push(
            {

                id:
                    Date.now(),

                submitted_at:
                    new Date().toISOString(),

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

                counts:
                    counts
            }
        );

        saveInventorySubmissions(
            submissions
        );

        alert(
            "Die Inventur wurde an den Professor übermittelt."
        );

        renderInventoryCount();

        updateNotificationBadge();
    }
);


// ========================================
// BERICHTE
// ========================================

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

    const transactionCount =
        filteredSales.length;

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
                        ] =
                            {

                                id:
                                    item.id,

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
        transactionCount;

    reportDrinks.textContent =
        drinkCount;

    reportBakery.textContent =
        bakeryCount;

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
        date >= start &&
        date < end
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


// ========================================
// CSV EXPORT
// ========================================

exportReportButton.addEventListener(
    "click",
    exportReportAsCSV
);


function exportReportAsCSV() {

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
                            )
                                .toLocaleString(
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


// ========================================
// CLEAR REPORTS
// ========================================

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

        if (!confirmed) {

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
// HELPERS
// ========================================

function parseGermanNumber(
    value
) {

    if (!value) {

        return 0;
    }

    return Number(
        String(
            value
        ).replace(
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


function createProductId(
    name
) {

    const base =
        name
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            ) ||
        "produkt";

    let id =
        base;

    let counter =
        2;

    while (
        products.some(
            function (product) {

                return (
                    product.id ===
                    id
                );
            }
        )
    ) {

        id =
            base +
            "-" +
            counter;

        counter +=
            1;
    }

    return id;
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


// ========================================
// END
// ========================================

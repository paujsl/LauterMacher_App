// ============================================================
// LAUTER MACHER
// APP.JS
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://gsbkfrjhierqopkwpqjc.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_xiM5w8RhiN0I0j5HSVPfnw_LhLQgozX";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ============================================================
// APPLICATION STATE
// ============================================================

let currentPerson = null;
let selectedLoginPerson = null;

let cart = [];
let receivedAmount = "";

let currentReturnScreen = null;

let saleTestMode = false;

let currentReportPeriod = "day";

let editingProductId = null;
let inventoryProductId = null;

let currentEventId = null;
let eventProductEditingId = null;

let eventSaleCart = [];
let currentEventSaleTestMode = false;

let eventStartInventoryRows = [];
let eventSetupInvoices = [];

let currentSuccessContext = "daily";

let siteMessageCallback = null;


// ============================================================
// STORAGE KEYS
// ============================================================

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
        "lauterMacher_shift_closures_v1",

    invoices:
        "lauterMacher_invoices_v1",

    purchases:
        "lauterMacher_purchases_v1",

    events:
        "lauterMacher_events_v1"
};


// ============================================================
// DEFAULT PRODUCTS
// ============================================================

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


// ============================================================
// DOM HELPERS
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}


function on(id, eventName, handler) {

    const element =
        getElement(id);

    if (element) {

        element.addEventListener(
            eventName,
            handler
        );
    }
}


function setText(id, value) {

    const element =
        getElement(id);

    if (element) {

        element.textContent =
            value;
    }
}


function setHidden(id, hidden) {

    const element =
        getElement(id);

    if (element) {

        element.hidden =
            hidden;
    }
}


// ============================================================
// DOM REFERENCES
// ============================================================

const identityScreen =
    getElement("identityScreen");

const pinLoginScreen =
    getElement("pinLoginScreen");

const homeScreen =
    getElement("homeScreen");

const saleScreen =
    getElement("saleScreen");

const paymentScreen =
    getElement("paymentScreen");

const successScreen =
    getElement("successScreen");

const bakeryMenuScreen =
    getElement("bakeryMenuScreen");

const bakeryCashScreen =
    getElement("bakeryCashScreen");

const bakeryOutputScreen =
    getElement("bakeryOutputScreen");

const adminScreen =
    getElement("adminScreen");

const reportsScreen =
    getElement("reportsScreen");

const inventoryScreen =
    getElement("inventoryScreen");

const inventoryCountScreen =
    getElement("inventoryCountScreen");

const inventoryInvoicesScreen =
    getElement("inventoryInvoicesScreen");

const productsScreen =
    getElement("productsScreen");

const eventListScreen =
    getElement("eventListScreen");

const eventCreateScreen =
    getElement("eventCreateScreen");

const eventStartSetupScreen =
    getElement("eventStartSetupScreen");

const eventProductsScreen =
    getElement("eventProductsScreen");

const eventWorkspaceScreen =
    getElement("eventWorkspaceScreen");

const eventCashScreen =
    getElement("eventCashScreen");

const eventOutputScreen =
    getElement("eventOutputScreen");

const eventEndInventoryScreen =
    getElement("eventEndInventoryScreen");


// ============================================================
// AUTH DOM
// ============================================================

const peopleGrid =
    getElement("peopleGrid");

const identityError =
    getElement("identityError");

const selectedPersonName =
    getElement("selectedPersonName");

const loginPinInput =
    getElement("loginPinInput");

const pinLoginError =
    getElement("pinLoginError");

const loginBackButton =
    getElement("loginBackButton");

const loginConfirmButton =
    getElement("loginConfirmButton");


// ============================================================
// HEADER
// ============================================================

const appHeader =
    getElement("appHeader");

const currentPersonName =
    getElement("currentPersonName");

const homeRoleLabel =
    getElement("homeRoleLabel");

const logoutButton =
    getElement("logoutButton");

const notificationButton =
    getElement("notificationButton");

const notificationCount =
    getElement("notificationCount");


// ============================================================
// HOME
// ============================================================

const studentHomeMenu =
    getElement("studentHomeMenu");

const teacherHomeMenu =
    getElement("teacherHomeMenu");

const saleButton =
    getElement("saleButton");

const teacherSaleButton =
    getElement("teacherSaleButton");

const bakeryButton =
    getElement("bakeryButton");

const teacherBakeryButton =
    getElement("teacherBakeryButton");

const adminButton =
    getElement("adminButton");

const teacherAdminButton =
    getElement("teacherAdminButton");

const reportsHomeButton =
    getElement("reportsHomeButton");

const eventButton =
    getElement("eventButton");

const teacherEventButton =
    getElement("teacherEventButton");


// ============================================================
// BÄCKEREI
// ============================================================

const bakeryBackButton =
    getElement("bakeryBackButton");

const bakeryCashButton =
    getElement("bakeryCashButton");

const bakeryServiceButton =
    getElement("bakeryServiceButton");

const bakeryCashBackButton =
    getElement("bakeryCashBackButton");

const bakeryOutputBackButton =
    getElement("bakeryOutputBackButton");

const bakeryCashShiftEndButton =
    getElement("bakeryCashShiftEndButton");

const bakeryOutputShiftEndButton =
    getElement("bakeryOutputShiftEndButton");


// ============================================================
// SALE
// ============================================================

const saleBackButton =
    getElement("saleBackButton");

const saleShiftEndButton =
    getElement("saleShiftEndButton");

const drinksGrid =
    getElement("drinksGrid");

const bakeryGrid =
    getElement("bakeryGrid");

const cartItems =
    getElement("cartItems");

const cartTotal =
    getElement("cartTotal");

const payButton =
    getElement("payButton");


// ============================================================
// PAYMENT
// ============================================================

const paymentBackButton =
    getElement("paymentBackButton");

const paymentTotal =
    getElement("paymentTotal");

const amountReceived =
    getElement("amountReceived");

const changeAmount =
    getElement("changeAmount");

const paidButton =
    getElement("paidButton");

const deletePaymentButton =
    getElement("deletePaymentButton");


// ============================================================
// SUCCESS
// ============================================================

const successTitle =
    getElement("successTitle");

const successDescription =
    getElement("successDescription");

const successChange =
    getElement("successChange");

const newOrderButton =
    getElement("newOrderButton");

const successShiftEndButton =
    getElement("successShiftEndButton");


// ============================================================
// EDIT
// ============================================================

const adminBackButton =
    getElement("adminBackButton");

const productsButton =
    getElement("productsButton");

const inventoryButton =
    getElement("inventoryButton");

const inventoryInvoicesButton =
    getElement("inventoryInvoicesButton");

const studentsButton =
    getElement("studentsButton");

const editMenuTitle =
    getElement("editMenuTitle");

const editMenuDescription =
    getElement("editMenuDescription");

const inventoryMenuTitle =
    getElement("inventoryMenuTitle");

const inventoryMenuDescription =
    getElement("inventoryMenuDescription");


// ============================================================
// PRODUCTS
// ============================================================

const productsBackButton =
    getElement("productsBackButton");

const adminProductsList =
    getElement("adminProductsList");

const addProductButton =
    getElement("addProductButton");

const productModal =
    getElement("productModal");

const closeProductModalButton =
    getElement("closeProductModalButton");

const cancelProductButton =
    getElement("cancelProductButton");

const saveProductButton =
    getElement("saveProductButton");

const productModalTitle =
    getElement("productModalTitle");

const productNameInput =
    getElement("productNameInput");

const productPriceInput =
    getElement("productPriceInput");

const productCategoryInput =
    getElement("productCategoryInput");

const productIconInput =
    getElement("productIconInput");


// ============================================================
// INVENTORY
// ============================================================

const inventoryBackButton =
    getElement("inventoryBackButton");

const inventoryList =
    getElement("inventoryList");

const inventoryModal =
    getElement("inventoryModal");

const closeInventoryModalButton =
    getElement(
        "closeInventoryModalButton"
    );

const cancelInventoryButton =
    getElement("cancelInventoryButton");

const saveInventoryButton =
    getElement("saveInventoryButton");

const inventoryProductLabel =
    getElement("inventoryProductLabel");

const inventoryAmountInput =
    getElement("inventoryAmountInput");


// ============================================================
// INVENTUR STUDENT
// ============================================================

const inventoryCountBackButton =
    getElement(
        "inventoryCountBackButton"
    );

const inventoryCountList =
    getElement("inventoryCountList");

const submitInventoryButton =
    getElement(
        "submitInventoryButton"
    );


// ============================================================
// INVOICES
// ============================================================

const inventoryInvoicesBackButton =
    getElement(
        "inventoryInvoicesBackButton"
    );

const invoiceContextInput =
    getElement("invoiceContextInput");

const invoiceDateInput =
    getElement("invoiceDateInput");

const invoiceSupplierInput =
    getElement("invoiceSupplierInput");

const invoiceNumberInput =
    getElement("invoiceNumberInput");

const invoiceProductInput =
    getElement("invoiceProductInput");

const invoiceQuantityInput =
    getElement("invoiceQuantityInput");

const invoiceAmountInput =
    getElement("invoiceAmountInput");

const saveInvoiceButton =
    getElement("saveInvoiceButton");

const purchaseContextInput =
    getElement("purchaseContextInput");

const purchaseProductInput =
    getElement("purchaseProductInput");

const purchaseQuantityInput =
    getElement("purchaseQuantityInput");

const savePurchaseButton =
    getElement("savePurchaseButton");

const invoiceList =
    getElement("invoiceList");


// ============================================================
// REPORTS
// ============================================================

const reportsBackButton =
    getElement("reportsBackButton");

const reportDateLabel =
    getElement("reportDateLabel");

const reportRevenue =
    getElement("reportRevenue");

const reportTransactions =
    getElement("reportTransactions");

const reportDrinks =
    getElement("reportDrinks");

const reportBakery =
    getElement("reportBakery");

const reportProducts =
    getElement("reportProducts");

const exportReportButton =
    getElement("exportReportButton");

const clearReportsButton =
    getElement("clearReportsButton");

const periodTabs =
    document.querySelectorAll(
        ".period-tab"
    );


// ============================================================
// EVENTS
// ============================================================

const eventListBackButton =
    getElement("eventListBackButton");

const eventListTitle =
    getElement("eventListTitle");

const eventListDescription =
    getElement("eventListDescription");

const createEventButton =
    getElement("createEventButton");

const eventList =
    getElement("eventList");


const eventCreateBackButton =
    getElement("eventCreateBackButton");

const eventNameInput =
    getElement("eventNameInput");

const eventDateInput =
    getElement("eventDateInput");

const eventStartInventoryYesButton =
    getElement(
        "eventStartInventoryYesButton"
    );

const eventStartInventoryNoButton =
    getElement(
        "eventStartInventoryNoButton"
    );


const eventStartSetupBackButton =
    getElement(
        "eventStartSetupBackButton"
    );

const eventStartSetupTitle =
    getElement("eventStartSetupTitle");

const eventStartInventoryList =
    getElement(
        "eventStartInventoryList"
    );

const addEventStartStockButton =
    getElement(
        "addEventStartStockButton"
    );

const eventInvoiceDateInput =
    getElement(
        "eventInvoiceDateInput"
    );

const eventInvoiceSupplierInput =
    getElement(
        "eventInvoiceSupplierInput"
    );

const eventInvoiceNumberInput =
    getElement(
        "eventInvoiceNumberInput"
    );

const eventInvoiceProductInput =
    getElement(
        "eventInvoiceProductInput"
    );

const eventInvoiceQuantityInput =
    getElement(
        "eventInvoiceQuantityInput"
    );

const eventInvoiceAmountInput =
    getElement(
        "eventInvoiceAmountInput"
    );

const addEventInvoiceButton =
    getElement(
        "addEventInvoiceButton"
    );

const eventInvoiceList =
    getElement(
        "eventInvoiceList"
    );

const eventStartSetupContinueButton =
    getElement(
        "eventStartSetupContinueButton"
    );


const eventProductsBackButton =
    getElement(
        "eventProductsBackButton"
    );

const eventProductsTitle =
    getElement(
        "eventProductsTitle"
    );

const addEventProductButton =
    getElement(
        "addEventProductButton"
    );

const eventProductsList =
    getElement(
        "eventProductsList"
    );

const eventProductsContinueButton =
    getElement(
        "eventProductsContinueButton"
    );


const eventProductModal =
    getElement(
        "eventProductModal"
    );

const closeEventProductModalButton =
    getElement(
        "closeEventProductModalButton"
    );

const cancelEventProductButton =
    getElement(
        "cancelEventProductButton"
    );

const saveEventProductButton =
    getElement(
        "saveEventProductButton"
    );

const eventProductModalTitle =
    getElement(
        "eventProductModalTitle"
    );

const eventProductNameInput =
    getElement(
        "eventProductNameInput"
    );

const eventProductPriceInput =
    getElement(
        "eventProductPriceInput"
    );

const eventProductIconInput =
    getElement(
        "eventProductIconInput"
    );


const eventWorkspaceBackButton =
    getElement(
        "eventWorkspaceBackButton"
    );

const eventWorkspaceName =
    getElement(
        "eventWorkspaceName"
    );

const eventWorkspaceDate =
    getElement(
        "eventWorkspaceDate"
    );

const eventWorkspaceStudentOptions =
    getElement(
        "eventWorkspaceStudentOptions"
    );

const eventWorkspaceTeacherOptions =
    getElement(
        "eventWorkspaceTeacherOptions"
    );

const studentEventCashButton =
    getElement(
        "studentEventCashButton"
    );

const studentEventOutputButton =
    getElement(
        "studentEventOutputButton"
    );

const teacherEventCashButton =
    getElement(
        "teacherEventCashButton"
    );

const teacherEventOutputButton =
    getElement(
        "teacherEventOutputButton"
    );

const teacherEventEndInventoryButton =
    getElement(
        "teacherEventEndInventoryButton"
    );


const eventCashBackButton =
    getElement(
        "eventCashBackButton"
    );

const eventCashTitle =
    getElement(
        "eventCashTitle"
    );

const eventCashProductHeading =
    getElement(
        "eventCashProductHeading"
    );

const eventCashProductsGrid =
    getElement(
        "eventCashProductsGrid"
    );

const eventCartItems =
    getElement(
        "eventCartItems"
    );

const eventCartTotal =
    getElement(
        "eventCartTotal"
    );

const eventPayButton =
    getElement(
        "eventPayButton"
    );

const eventCashShiftEndButton =
    getElement(
        "eventCashShiftEndButton"
    );


const eventOutputBackButton =
    getElement(
        "eventOutputBackButton"
    );

const eventOutputTitle =
    getElement(
        "eventOutputTitle"
    );

const eventOutputOrders =
    getElement(
        "eventOutputOrders"
    );

const eventOutputShiftEndButton =
    getElement(
        "eventOutputShiftEndButton"
    );


const eventEndInventoryBackButton =
    getElement(
        "eventEndInventoryBackButton"
    );

const eventEndInventoryTitle =
    getElement(
        "eventEndInventoryTitle"
    );

const eventEndInventoryList =
    getElement(
        "eventEndInventoryList"
    );

const saveEventEndInventoryButton =
    getElement(
        "saveEventEndInventoryButton"
    );


// ============================================================
// SITE MESSAGE
// ============================================================

const siteMessageModal =
    getElement(
        "siteMessageModal"
    );

const siteMessageIcon =
    getElement(
        "siteMessageIcon"
    );

const siteMessageTitle =
    getElement(
        "siteMessageTitle"
    );

const siteMessageText =
    getElement(
        "siteMessageText"
    );

const siteMessagePrimaryButton =
    getElement(
        "siteMessagePrimaryButton"
    );


// ============================================================
// LOCAL DATA
// ============================================================

let products =
    loadProducts();

let sales =
    loadSales();

let inventory =
    loadInventory();


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        setDefaultDates();

        renderProducts();

        updateCart();

        updateInventoryMenus();

        hideAppHeader();

        syncProductsFromSupabase();

        showScreen(
            identityScreen
        );

        await initialiseAuthentication();
    }
);


// ============================================================
// AUTH
// ============================================================

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

            const person =
                await loadCurrentPerson(
                    sessionData.session
                );

            if (
                person
            ) {

                applyLoggedInState(
                    person
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

        if (
            identityError
        ) {

            identityError.textContent =
                "Die Anmeldung konnte nicht geladen werden.";
        }

        await loadLoginPeople();
    }
}


async function loadLoginPeople() {

    if (
        !peopleGrid
    ) {

        return;
    }

    if (
        identityError
    ) {

        identityError.textContent =
            "";
    }

    peopleGrid.innerHTML =
        `
            <div class="login-loading">
                Personen werden geladen …
            </div>
        `;

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

    if (
        error
    ) {

        console.error(
            "Fehler beim Laden von login_people:",
            error
        );

        peopleGrid.innerHTML =
            "";

        if (
            identityError
        ) {

            identityError.textContent =
                "Die Personen konnten nicht geladen werden.";
        }

        return;
    }

    peopleGrid.innerHTML =
        "";

    (
        data ||
        []
    ).forEach(
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
                    ${escapeHtml(
                        fullName
                    )}
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
        data.length ===
        0
    ) {

        if (
            identityError
        ) {

            identityError.textContent =
                "Keine aktiven Personen gefunden.";
        }
    }
}


function selectLoginPerson(
    person
) {

    selectedLoginPerson =
        person;

    setText(
        "selectedPersonName",
        getFullName(
            person
        )
    );

    if (
        loginPinInput
    ) {

        loginPinInput.value =
            "";
    }

    if (
        pinLoginError
    ) {

        pinLoginError.textContent =
            "";
    }

    hideAppHeader();

    showScreen(
        pinLoginScreen
    );

    setTimeout(
        function () {

            if (
                loginPinInput
            ) {

                loginPinInput.focus();
            }

        },
        50
    );
}


on(
    "loginBackButton",
    "click",
    function () {

        selectedLoginPerson =
            null;

        if (
            loginPinInput
        ) {

            loginPinInput.value =
                "";
        }

        if (
            pinLoginError
        ) {

            pinLoginError.textContent =
                "";
        }

        hideAppHeader();

        showScreen(
            identityScreen
        );
    }
);


on(
    "loginPinInput",
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

        if (
            pinLoginError
        ) {

            pinLoginError.textContent =
                "";
        }
    }
);


on(
    "loginPinInput",
    "keydown",
    function (event) {

        if (
            event.key ===
            "Enter"
        ) {

            if (
                loginConfirmButton
            ) {

                loginConfirmButton.click();
            }
        }
    }
);


on(
    "loginConfirmButton",
    "click",
    loginWithPin
);


async function loginWithPin() {

    if (
        !selectedLoginPerson ||
        !loginPinInput
    ) {

        return;
    }

    const pin =
        loginPinInput.value;

    if (
        !/^[0-9]{4}$/.test(
            pin
        )
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

        if (
            error
        ) {

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

        if (
            otpError
        ) {

            throw otpError;
        }

        const person =
            await loadCurrentPerson(
                otpData.session
            );

        if (
            !person
        ) {

            throw new Error(
                "Person konnte nach der Anmeldung nicht geladen werden."
            );
        }

        applyLoggedInState(
            person
        );

    } catch (error) {

        console.error(
            "Login fehlgeschlagen:",
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

    if (
        error
    ) {

        console.error(
            "Aktuelle Person konnte nicht geladen werden:",
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

    selectedLoginPerson =
        null;

    setText(
        "currentPersonName",
        getFullName(
            person
        )
    );

    if (
        homeRoleLabel
    ) {

        homeRoleLabel.textContent =
            isCurrentTeacher()
                ? "Lehrkraft"
                : "";

        homeRoleLabel.hidden =
            !isCurrentTeacher();
    }

    updateHomeForPerson();

    updateInventoryMenus();

    updateNotificationBadge();

    showAppHeader();

    resetSale();

    showScreen(
        homeScreen
    );
}


on(
    "logoutButton",
    "click",
    async function () {

        try {

            await supabaseClient.auth.signOut();

        } catch (error) {

            console.error(
                "Abmeldung fehlgeschlagen:",
                error
            );
        }

        currentPerson =
            null;

        selectedLoginPerson =
            null;

        setText(
            "currentPersonName",
            "-"
        );

        hideAppHeader();

        resetSale();

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


// ============================================================
// HEADER
// ============================================================

function showAppHeader() {

    if (
        appHeader
    ) {

        appHeader.classList.add(
            "visible"
        );
    }
}


function hideAppHeader() {

    if (
        appHeader
    ) {

        appHeader.classList.remove(
            "visible"
        );
    }
}


on(
    "notificationButton",
    "click",
    function () {

        // Der eigentliche Benachrichtigungsbereich
        // wird später ergänzt.
    }
);


function updateNotificationBadge() {

    if (
        !isCurrentTeacher()
    ) {

        setHidden(
            "notificationCount",
            true
        );

        return;
    }

    const submissions =
        loadInventorySubmissions();

    if (
        submissions.length >
        0
    ) {

        const countElement =
            getElement(
                "notificationCount"
            );

        if (
            countElement
        ) {

            countElement.hidden =
                false;

            countElement.textContent =
                String(
                    submissions.length
                );
        }

    } else {

        setHidden(
            "notificationCount",
            true
        );
    }
}


// ============================================================
// HOME
// ============================================================

function updateHomeForPerson() {

    const teacher =
        isCurrentTeacher();

    setHidden(
        "studentHomeMenu",
        teacher
    );

    setHidden(
        "teacherHomeMenu",
        !teacher
    );
}


function isCurrentTeacher() {

    return Boolean(
        currentPerson &&
        currentPerson.person_type ===
        "lehrer"
    );
}


function updateInventoryMenus() {

    const teacher =
        isCurrentTeacher();

    if (
        editMenuTitle
    ) {

        editMenuTitle.textContent =
            "Bearbeiten";
    }

    if (
        teacher
    ) {

        if (
            editMenuDescription
        ) {

            editMenuDescription.textContent =
                "Produkte, Inventur, Rechnungen und Schüler verwalten.";
        }

        if (
            inventoryMenuTitle
        ) {

            inventoryMenuTitle.textContent =
                "Inventur & Rechnungen";
        }

        if (
            inventoryMenuDescription
        ) {

            inventoryMenuDescription.textContent =
                "Bestände, gekaufte Mengen und Kosten erfassen";
        }

        setHidden(
            "inventoryInvoicesButton",
            false
        );

        setHidden(
            "studentsButton",
            false
        );

    } else {

        if (
            editMenuDescription
        ) {

            editMenuDescription.textContent =
                "Produkte und Preise selbstständig bearbeiten.";
        }

        if (
            inventoryMenuTitle
        ) {

            inventoryMenuTitle.textContent =
                "Inventur";
        }

        if (
            inventoryMenuDescription
        ) {

            inventoryMenuDescription.textContent =
                "Bestand zählen und an den Lehrer schicken";
        }

        setHidden(
            "inventoryInvoicesButton",
            true
        );

        setHidden(
            "studentsButton",
            true
        );
    }
}


// ============================================================
// LOCAL STORAGE
// ============================================================

function loadProducts() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.products
            );

        if (
            saved
        ) {

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
            "Produkte konnten nicht geladen werden:",
            error
        );
    }

    const source =
        typeof PRODUCTS !==
            "undefined" &&
        Array.isArray(
            PRODUCTS
        )
            ? PRODUCTS
            : DEFAULT_PRODUCTS;

    return source.map(
        function (
            product
        ) {

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
// SUPABASE — PRODUITS
// ========================================

async function syncProductsFromSupabase() {

    try {

        const result =
            await supabaseClient
                .from("products")
                .select(
                    "id,name,price,purchase_price,category,icon,active"
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "category"
                )
                .order(
                    "name"
                );


        if (result.error) {
            throw result.error;
        }


        const data =
            result.data || [];


        products =
            data.map(function (product) {

                return {
                    id:
                        product.id,

                    name:
                        product.name,

                    price:
                        Number(product.price),

                    purchase_price:
                        product.purchase_price === null
                            ? null
                            : Number(
                                product.purchase_price
                            ),

                    category:
                        product.category === "getränke"
                            ? "drink"
                            : "bakery",

                    icon:
                        product.icon || "🥤"
                };

            });


        console.log(
            "Produkte aus Supabase geladen:",
            products.length
        );


        renderProducts();


        if (
            typeof renderAdminProducts ===
            "function"
        ) {

            renderAdminProducts();

        }


    } catch (error) {

        console.error(
            "Produkte konnten nicht aus Supabase geladen werden:",
            error
        );

    }
}

function loadSales() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.sales
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
            "Verkaufsdaten konnten nicht geladen werden:",
            error
        );

        return [];
    }
}


function saveSales() {

    localStorage.setItem(
        STORAGE_KEYS.sales,
        JSON.stringify(
            sales
        )
    );
}


function loadInventory() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.inventory
            );

        const parsed =
            saved
                ? JSON.parse(
                    saved
                )
                : {};

        return (
            parsed &&
            typeof parsed ===
            "object"
        )
            ? parsed
            : {};

    } catch (error) {

        console.error(
            "Inventar konnten nicht geladen werden:",
            error
        );

        return {};
    }
}


function saveInventory() {

    localStorage.setItem(
        STORAGE_KEYS.inventory,
        JSON.stringify(
            inventory
        )
    );
}


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
            "Inventurmeldungen konnten nicht geladen werden:",
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
            "Schichtabschlüsse konnten nicht geladen werden:",
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


function loadInvoices() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEYS.invoices
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
            "Rechnungen konnten nicht geladen werden:",
            error
        );

        return [];
    }
}


function saveInvoices(
    invoices
) {

    localStorage.setItem(
        STORAGE_KEYS.invoices,
        JSON.stringify(
            invoices
        )
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
            "Wareneingänge konnten nicht geladen werden:",
            error
        );

        return [];
    }
}


function savePurchases(
    purchases
) {

    localStorage.setItem(
        STORAGE_KEYS.purchases,
        JSON.stringify(
            purchases
        )
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
            "Veranstaltungen konnten nicht geladen werden:",
            error
        );

        return [];
    }
}


function saveEvents(
    events
) {

    localStorage.setItem(
        STORAGE_KEYS.events,
        JSON.stringify(
            events
        )
    );
}


// ============================================================
// SCREEN NAVIGATION
// ============================================================

function showScreen(
    screen,
    returnScreen = null
) {

    if (
        !screen
    ) {

        return;
    }

    if (
        returnScreen
    ) {

        currentReturnScreen =
            returnScreen;
    }

    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            function (
                item
            ) {

                item.style.display =
                    "none";

                item.classList.remove(
                    "screen-visible"
                );
            }
        );

    screen.style.display =
        "block";

    screen.classList.add(
        "screen-visible"
    );

    window.scrollTo(
        0,
        0
    );
}


// ============================================================
// HOME BUTTONS
// ============================================================

on(
    "saleButton",
    "click",
    function () {

        openDailyCash(
            false
        );
    }
);


on(
    "teacherSaleButton",
    "click",
    function () {

        openDailyCash(
            true
        );
    }
);


function openDailyCash(
    testMode
) {

    saleTestMode =
        Boolean(
            testMode
        );

    resetSale();

    showScreen(
        saleScreen,
        homeScreen
    );
}


on(
    "bakeryButton",
    "click",
    openBakeryMenu
);


on(
    "teacherBakeryButton",
    "click",
    openBakeryMenu
);


function openBakeryMenu() {

    showScreen(
        bakeryMenuScreen,
        homeScreen
    );
}


on(
    "adminButton",
    "click",
    openEditMenu
);


on(
    "teacherAdminButton",
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


on(
    "eventButton",
    "click",
    openEventList
);


on(
    "teacherEventButton",
    "click",
    openEventList
);


function openEventList() {

    renderEventList();

    showScreen(
        eventListScreen,
        homeScreen
    );
}


on(
    "reportsHomeButton",
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


// ============================================================
// BÄCKEREI
// ============================================================

on(
    "bakeryBackButton",
    "click",
    function () {

        showScreen(
            homeScreen
        );
    }
);


on(
    "bakeryCashButton",
    "click",
    function () {

        showScreen(
            bakeryCashScreen,
            bakeryMenuScreen
        );
    }
);


on(
    "bakeryServiceButton",
    "click",
    function () {

        showScreen(
            bakeryOutputScreen,
            bakeryMenuScreen
        );
    }
);


on(
    "bakeryCashBackButton",
    "click",
    function () {

        showScreen(
            bakeryMenuScreen
        );
    }
);


on(
    "bakeryOutputBackButton",
    "click",
    function () {

        showScreen(
            bakeryMenuScreen
        );
    }
);


on(
    "bakeryCashShiftEndButton",
    "click",
    function () {

        endDailyShift(
            "Bäckerei · Kasse"
        );
    }
);


on(
    "bakeryOutputShiftEndButton",
    "click",
    function () {

        endDailyShift(
            "Bäckerei · Ausgabe"
        );
    }
);


// ============================================================
// DRINKS
// ============================================================

function renderProducts() {

    if (
        !drinksGrid
    ) {

        return;
    }

    drinksGrid.innerHTML =
        "";

    products
        .filter(
            function (
                product
            ) {

                return (
                    product.category ===
                    "drink"
                );
            }
        )
        .forEach(
            function (
                product
            ) {

                drinksGrid.appendChild(
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
            function (
                item
            ) {

                return (
                    item.id ===
                    product.id
                );
            }
        );

    if (
        existing
    ) {

        existing.quantity +=
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

    if (
        !cartItems ||
        !cartTotal ||
        !payButton
    ) {

        return;
    }

    cartItems.innerHTML =
        "";

    if (
        cart.length ===
        0
    ) {

        cartItems.innerHTML =
            `
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

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "cart-item";

            const productTotal =
                Number(
                    product.price
                ) *
                Number(
                    product.quantity
                );

            row.innerHTML = `
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
                row
            );
        }
    );

    cartTotal.textContent =
        formatPrice(
            calculateTotal()
        );

    payButton.disabled =
        false;

    cartItems
        .querySelectorAll(
            ".cart-control.minus"
        )
        .forEach(
            function (
                button
            ) {

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

    cartItems
        .querySelectorAll(
            ".cart-control.plus"
        )
        .forEach(
            function (
                button
            ) {

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
            item
        ) {

            return (
                total +
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


on(
    "saleBackButton",
    "click",
    function () {

        resetSale();

        showScreen(
            homeScreen
        );
    }
);


// ============================================================
// PAYMENT
// ============================================================

on(
    "payButton",
    "click",
    function () {

        if (
            cart.length ===
            0
        ) {

            return;
        }

        setText(
            "paymentTotal",
            formatPrice(
                calculateTotal()
            )
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


on(
    "paymentBackButton",
    "click",
    function () {

        receivedAmount =
            "";

        showScreen(
            saleScreen
        );
    }
);


document
    .querySelectorAll(
        ".payment-key"
    )
    .forEach(
        function (
            button
        ) {

            if (
                button.id ===
                "deletePaymentButton"
            ) {

                return;
            }

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


on(
    "deletePaymentButton",
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

    let value =
        receivedAmount;

    if (
        value ===
        "" ||
        value ===
        ","
    ) {

        value =
            "0,00";
    }

    setText(
        "amountReceived",
        value +
        " €"
    );

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

        setText(
            "changeAmount",
            "0,00 €"
        );

        if (
            paidButton
        ) {

            paidButton.disabled =
                true;
        }

        return;
    }

    if (
        change <
        0
    ) {

        setText(
            "changeAmount",
            "Noch " +
            formatPrice(
                Math.abs(
                    change
                )
            )
        );

        if (
            paidButton
        ) {

            paidButton.disabled =
                true;
        }

        return;
    }

    setText(
        "changeAmount",
        formatPrice(
            change
        )
    );

    if (
        paidButton
    ) {

        paidButton.disabled =
            false;
    }
}


on(
    "paidButton",
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

        setText(
            "successTitle",
            "Zahlung erfolgreich!"
        );

        setText(
            "successDescription",
            saleTestMode
                ? "Testverkauf – nicht als echte Kassenbuchung gespeichert."
                : "Verkauf wurde gespeichert."
        );

        setText(
            "successChange",
            formatPrice(
                change
            )
        );

        currentSuccessContext =
            "daily";

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

    if (
        saleTestMode
    ) {

        return;
    }

    const saleItems =
        cart.map(
            function (
                item
            ) {

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
        function (
            item
        ) {

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


on(
    "newOrderButton",
    "click",
    function () {

        if (
            currentSuccessContext ===
            "event"
        ) {

            eventSaleCart =
                [];

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


function resetSale() {

    cart =
        [];

    receivedAmount =
        "";

    updateCart();
}


// ============================================================
// SCHICHT BEENDEN
// ============================================================

on(
    "saleShiftEndButton",
    "click",
    function () {

        endDailyShift(
            "Getränke · Kasse"
        );
    }
);


on(
    "successShiftEndButton",
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
            "Getränke · Kasse"
        );
    }
);


function endDailyShift(
    source
) {

    const today =
        new Date();

    const todaySales =
        getSalesForDay(
            today
        );

    const count =
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

    const text =
        isCurrentTeacher()
            ? "Testumgebung: Ihr habt heute " +
                count +
                " Verkäufe gemacht und " +
                formatPrice(
                    revenue
                ) +
                " Umsatz erzielt."
            : "Heute habt ihr " +
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
        "Weiter",
        function () {

            if (
                !isCurrentTeacher()
            ) {

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
                        count,

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
                homeScreen
            );
        }
    );
}


function getSalesForDay(
    date
) {

    return sales.filter(
        function (
            sale
        ) {

            return isSameDay(
                new Date(
                    sale.date
                ),
                date
            );
        }
    );
}


// ============================================================
// BEARBEITEN
// ============================================================

on(
    "adminBackButton",
    "click",
    function () {

        showScreen(
            homeScreen
        );
    }
);


on(
    "productsButton",
    "click",
    function () {

        renderAdminProducts();

        showScreen(
            productsScreen,
            adminScreen
        );
    }
);


on(
    "inventoryButton",
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


on(
    "inventoryInvoicesButton",
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


on(
    "studentsButton",
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


// ============================================================
// PRODUCTS ADMIN
// ============================================================

function renderAdminProducts() {

    if (
        !adminProductsList
    ) {

        return;
    }

    adminProductsList.innerHTML =
        "";

    if (
        products.length ===
        0
    ) {

        adminProductsList.innerHTML =
            `
                <div class="no-data">
                    Keine Produkte vorhanden.
                </div>
            `;

        return;
    }

    products.forEach(
        function (
            product
        ) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "admin-product-row";

            const category =
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
                        ${category}
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
                        data-product-id="${escapeAttribute(
                            product.id
                        )}"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="icon-action delete delete-product-button"
                        data-product-id="${escapeAttribute(
                            product.id
                        )}"
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

    adminProductsList
        .querySelectorAll(
            ".edit-product-button"
        )
        .forEach(
            function (
                button
            ) {

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

    adminProductsList
        .querySelectorAll(
            ".delete-product-button"
        )
        .forEach(
            function (
                button
            ) {

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


on(
    "addProductButton",
    "click",
    function () {

        openProductModal();
    }
);


function openProductModal(
    productId = null
) {

    if (
        !productModal
    ) {

        return;
    }

    editingProductId =
        productId;

    if (
        productId
    ) {

        const product =
            products.find(
                function (
                    item
                ) {

                    return (
                        item.id ===
                        productId
                    );
                }
            );

        if (
            !product
        ) {

            return;
        }

        if (
            productModalTitle
        ) {

            productModalTitle.textContent =
                "Produkt bearbeiten";
        }

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

        if (
            productModalTitle
        ) {

            productModalTitle.textContent =
                "Produkt hinzufügen";
        }

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

    if (
        !productModal
    ) {

        return;
    }

    productModal.style.display =
        "none";

    productModal.setAttribute(
        "aria-hidden",
        "true"
    );

    editingProductId =
        null;
}


on(
    "closeProductModalButton",
    "click",
    closeProductModal
);


on(
    "cancelProductButton",
    "click",
    closeProductModal
);


if (
    productModal
) {

    productModal.addEventListener(
        "click",
        function (
            event
        ) {

            if (
                event.target ===
                productModal
            ) {

                closeProductModal();
            }
        }
    );
}


on(
    "saveProductButton",
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

        if (
            !name
        ) {

            alert(
                "Bitte einen Produktnamen eingeben."
            );

            return;
        }

        if (
            !Number.isFinite(
                price
            ) ||
            price <
            0
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
                    function (
                        item
                    ) {

                        return (
                            item.id ===
                            editingProductId
                        );
                    }
                );

            if (
                !product
            ) {

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
                "drink"
            ) {

                if (
                    inventory[
                        newProduct.id
                    ] ===
                    undefined
                ) {

                    inventory[
                        newProduct.id
                    ] =
                        0;

                    saveInventory();
                }
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
            function (
                item
            ) {

                return (
                    item.id ===
                    productId
                );
            }
        );

    if (
        !product
    ) {

        return;
    }

    const confirmed =
        confirm(
            "Produkt „" +
            product.name +
            "“ wirklich löschen?"
        );

    if (
        !confirmed
    ) {

        return;
    }

    products =
        products.filter(
            function (
                item
            ) {

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
            function (
                item
            ) {

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


on(
    "productsBackButton",
    "click",
    function () {

        closeProductModal();

        showScreen(
            adminScreen
        );
    }
);


// ============================================================
// INVENTORY TEACHER
// ============================================================

function renderInventory() {

    if (
        !inventoryList
    ) {

        return;
    }

    inventoryList.innerHTML =
        "";

    const drinks =
        products.filter(
            function (
                product
            ) {

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
            `
                <div class="no-data">
                    Keine Getränke vorhanden.
                </div>
            `;

        return;
    }

    drinks.forEach(
        function (
            product
        ) {

            const stock =
                Number(
                    inventory[
                        product.id
                    ] ||
                    0
                );

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "inventory-card";

            row.innerHTML = `

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

                <div class="inventory-stock">
                    ${stock} Stück
                </div>

                <button
                    type="button"
                    class="inventory-adjust-button"
                    data-product-id="${escapeAttribute(
                        product.id
                    )}"
                >
                    ＋ Bestand
                </button>
            `;

            inventoryList.appendChild(
                row
            );
        }
    );

    inventoryList
        .querySelectorAll(
            ".inventory-adjust-button"
        )
        .forEach(
            function (
                button
            ) {

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

    if (
        !isCurrentTeacher()
    ) {

        return;
    }

    const product =
        products.find(
            function (
                item
            ) {

                return (
                    item.id ===
                    productId
                );
            }
        );

    if (
        !product
    ) {

        return;
    }

    inventoryProductId =
        productId;

    if (
        inventoryProductLabel
    ) {

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
    }

    if (
        inventoryAmountInput
    ) {

        inventoryAmountInput.value =
            "";
    }

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

    if (
        !inventoryModal
    ) {

        return;
    }

    inventoryModal.style.display =
        "none";

    inventoryModal.setAttribute(
        "aria-hidden",
        "true"
    );

    inventoryProductId =
        null;
}


on(
    "closeInventoryModalButton",
    "click",
    closeInventoryModal
);


on(
    "cancelInventoryButton",
    "click",
    closeInventoryModal
);


on(
    "saveInventoryButton",
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


on(
    "inventoryBackButton",
    "click",
    function () {

        closeInventoryModal();

        showScreen(
            adminScreen
        );
    }
);


// ============================================================
// INVENTUR STUDENT
// ============================================================

function renderInventoryCount() {

    if (
        !inventoryCountList
    ) {

        return;
    }

    inventoryCountList.innerHTML =
        "";

    const drinks =
        products.filter(
            function (
                product
            ) {

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
            `
                <div class="no-data">
                    Keine Getränke vorhanden.
                </div>
            `;

        return;
    }

    drinks.forEach(
        function (
            product
        ) {

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
                    data-product-id="${escapeAttribute(
                        product.id
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


on(
    "inventoryCountBackButton",
    "click",
    function () {

        showScreen(
            adminScreen
        );
    }
);


on(
    "submitInventoryButton",
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
            inventoryCountList
                .querySelectorAll(
                    ".inventory-count-input"
                );

        const counts =
            [];

        let invalid =
            false;

        inputs.forEach(
            function (
                input
            ) {

                if (
                    input.value.trim() ===
                    ""
                ) {

                    return;
                }

                const quantity =
                    Number(
                        input.value
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

                const product =
                    products.find(
                        function (
                            item
                        ) {

                            return (
                                item.id ===
                                input.dataset.productId
                            );
                        }
                    );

                if (
                    product
                ) {

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
            invalid
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
                    currentPerson.id,

                person_name:
                    getFullName(
                        currentPerson
                    ),

                counts:
                    counts
            }
        );

        saveInventorySubmissions(
            submissions
        );

        showSiteMessage(
            "📦",
            "Inventur gesendet",
            "Die Inventur wurde an den Lehrer geschickt.",
            "Weiter",
            function () {

                renderInventoryCount();

                updateNotificationBadge();

                showScreen(
                    homeScreen
                );
            }
        );
    }
);


// ============================================================
// INVENTUR & RECHNUNGEN
// ============================================================

function renderInvoiceContextOptions() {

    if (
        !invoiceContextInput ||
        !purchaseContextInput
    ) {

        return;
    }

    const events =
        loadEvents();

    [
        invoiceContextInput,
        purchaseContextInput
    ].forEach(
        function (
            select
        ) {

            const currentValue =
                select.value ||
                "getränke";

            select.innerHTML =
                "";

            const baseOption =
                document.createElement(
                    "option"
                );

            baseOption.value =
                "getränke";

            baseOption.textContent =
                "Getränke";

            select.appendChild(
                baseOption
            );

            events.forEach(
                function (
                    event
                ) {

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

            const exists =
                Array.from(
                    select.options
                ).some(
                    function (
                        option
                    ) {

                        return (
                            option.value ===
                            currentValue
                        );
                    }
                );

            select.value =
                exists
                    ? currentValue
                    : "getränke";
        }
    );
}


function getContextLabel(
    context
) {

    if (
        context ===
        "getränke"
    ) {

        return "Getränke";
    }

    if (
        String(
            context
        ).startsWith(
            "event:"
        )
    ) {

        const event =
            getEventById(
                String(
                    context
                ).slice(
                    6
                )
            );

        if (
            event
        ) {

            return (
                "Sonderveranstaltung: " +
                event.name
            );
        }
    }

    return context;
}


on(
    "saveInvoiceButton",
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

        const invoices =
            loadInvoices();

        invoices.push(
            {

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
                    currentPerson.id
            }
        );

        saveInvoices(
            invoices
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


on(
    "savePurchaseButton",
    "click",
    function () {

        if (
            !isCurrentTeacher()
        ) {

            return;
        }

        const context =
            purchaseContextInput.value;

        const productName =
            purchaseProductInput.value.trim();

        const quantity =
            Number(
                purchaseQuantityInput.value
            );

        if (
            !productName
        ) {

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

        const purchases =
            loadPurchases();

        purchases.push(
            {

                id:
                    Date.now(),

                context:
                    context,

                context_label:
                    getContextLabel(
                        context
                    ),

                product:
                    productName,

                quantity:
                    quantity,

                created_at:
                    new Date().toISOString(),

                person_id:
                    currentPerson.id
            }
        );

        savePurchases(
            purchases
        );

        if (
            context ===
            "getränke"
        ) {

            const product =
                products.find(
                    function (
                        item
                    ) {

                        return (
                            item.name.toLowerCase() ===
                            productName.toLowerCase() &&
                            item.category ===
                            "drink"
                        );
                    }
                );

            if (
                product
            ) {

                inventory[
                    product.id
                ] =
                    Number(
                        inventory[
                            product.id
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

    if (
        !invoiceList
    ) {

        return;
    }

    invoiceList.innerHTML =
        "";

    const invoices =
        loadInvoices()
            .slice()
            .reverse();

    const purchases =
        loadPurchases()
            .slice()
            .reverse();

    if (
        invoices.length ===
        0 &&
        purchases.length ===
        0
    ) {

        invoiceList.innerHTML =
            `
                <div class="no-data">
                    Noch keine Rechnungen oder Wareneingänge vorhanden.
                </div>
            `;

        return;
    }

    invoices
        .slice(
            0,
            15
        )
        .forEach(
            function (
                invoice
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
                                invoice.context_label
                            )}
                            ·
                            ${escapeHtml(
                                invoice.date
                            )}
                        </small>

                        <small>
                            ${invoice.quantity}
                            Stück
                            ·
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
            function (
                purchase
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


on(
    "inventoryInvoicesBackButton",
    "click",
    function () {

        showScreen(
            adminScreen
        );
    }
);


// ============================================================
// REPORTS
// ============================================================

on(
    "reportsBackButton",
    "click",
    function () {

        showScreen(
            homeScreen
        );
    }
);


periodTabs.forEach(
    function (
        tab
    ) {

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
        function (
            tab
        ) {

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

    let drinks =
        0;

    let bakery =
        0;

    const summary =
        {};

    filteredSales.forEach(
        function (
            sale
        ) {

            (
                sale.items ||
                []
            ).forEach(
                function (
                    item
                ) {

                    const quantity =
                        Number(
                            item.quantity ||
                            0
                        );

                    if (
                        item.category ===
                        "drink"
                    ) {

                        drinks +=
                            quantity;
                    }

                    if (
                        item.category ===
                        "bakery"
                    ) {

                        bakery +=
                            quantity;
                    }

                    if (
                        !summary[
                            item.id
                        ]
                    ) {

                        summary[
                            item.id
                        ] =
                            {

                                name:
                                    item.name,

                                quantity:
                                    0,

                                revenue:
                                    0
                            };
                    }

                    summary[
                        item.id
                    ].quantity +=
                        quantity;

                    summary[
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

    setText(
        "reportRevenue",
        formatPrice(
            revenue
        )
    );

    setText(
        "reportTransactions",
        filteredSales.length
    );

    setText(
        "reportDrinks",
        drinks
    );

    setText(
        "reportBakery",
        bakery
    );

    setText(
        "reportDateLabel",
        getReportLabel(
            currentReportPeriod
        )
    );

    renderReportProducts(
        summary
    );
}


function renderReportProducts(
    summary
) {

    if (
        !reportProducts
    ) {

        return;
    }

    reportProducts.innerHTML =
        "";

    const rows =
        Object.values(
            summary
        ).sort(
            function (
                a,
                b
            ) {

                return (
                    b.quantity -
                    a.quantity
                );
            }
        );

    if (
        rows.length ===
        0
    ) {

        reportProducts.innerHTML =
            `
                <div class="no-data">
                    Keine Verkäufe in diesem Zeitraum.
                </div>
            `;

        return;
    }

    rows.forEach(
        function (
            item
        ) {

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
        function (
            sale
        ) {

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


on(
    "exportReportButton",
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
        function (
            sale
        ) {

            (
                sale.items ||
                []
            ).forEach(
                function (
                    item
                ) {

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
                function (
                    row
                ) {

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
            value ??
            ""
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


on(
    "clearReportsButton",
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


// ============================================================
// SONDERVERANSTALTUNGEN
// ============================================================

on(
    "eventListBackButton",
    "click",
    function () {

        showScreen(
            homeScreen
        );
    }
);


on(
    "createEventButton",
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

    if (
        !eventList
    ) {

        return;
    }

    const teacher =
        isCurrentTeacher();

    const events =
        loadEvents()
            .slice()
            .sort(
                function (
                    a,
                    b
                ) {

                    return String(
                        a.event_date
                    ).localeCompare(
                        String(
                            b.event_date
                        )
                    );
                }
            );

    if (
        eventListTitle
    ) {

        eventListTitle.textContent =
            teacher
                ? "Veranstaltungen verwalten"
                : "Veranstaltungen";
    }

    if (
        eventListDescription
    ) {

        eventListDescription.textContent =
            teacher
                ? "Erstelle eine Veranstaltung oder öffne eine bestehende."
                : "Wähle eine Veranstaltung aus.";
    }

    if (
        createEventButton
    ) {

        createEventButton.hidden =
            !teacher;
    }

    eventList.innerHTML =
        "";

    if (
        events.length ===
        0
    ) {

        eventList.innerHTML =
            `
                <div class="no-data">
                    Noch keine Veranstaltungen vorhanden.
                </div>
            `;

        return;
    }

    events.forEach(
        function (
            event
        ) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "event-list-card";

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
                            ${formatEventDate(
                                event.event_date
                            )}
                        </small>

                    </div>

                </div>

                <button
                    type="button"
                    class="primary-action small-action event-open-button"
                    data-event-id="${escapeAttribute(
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

    eventList
        .querySelectorAll(
            ".event-open-button"
        )
        .forEach(
            function (
                button
            ) {

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


function getEventById(
    eventId
) {

    return loadEvents().find(
        function (
            event
        ) {

            return (
                event.id ===
                eventId
            );
        }
    ) || null;
}


function getCurrentEvent() {

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
            function (
                item
            ) {

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


function openEvent(
    eventId
) {

    const event =
        getEventById(
            eventId
        );

    if (
        !event
    ) {

        return;
    }

    currentEventId =
        eventId;

    if (
        isCurrentTeacher() &&
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
}


// ============================================================
// EVENT CREATE
// ============================================================

on(
    "eventCreateBackButton",
    "click",
    function () {

        showScreen(
            eventListScreen
        );
    }
);


on(
    "eventStartInventoryYesButton",
    "click",
    function () {

        createEvent(
            true
        );
    }
);


on(
    "eventStartInventoryNoButton",
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

    if (
        !name
    ) {

        alert(
            "Bitte einen Namen für die Veranstaltung eingeben."
        );

        return;
    }

    if (
        !date
    ) {

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


// ============================================================
// EVENT START INVENTORY
// ============================================================

function prepareEventStartSetup(
    event
) {

    if (
        eventStartSetupTitle
    ) {

        eventStartSetupTitle.textContent =
            "Anfangsbestand · " +
            event.name;
    }

    eventStartInventoryRows =
        Array.isArray(
            event.start_inventory
        )
            ? event.start_inventory.map(
                function (
                    item
                ) {

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
                function (
                    item
                ) {

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

    if (
        !eventStartInventoryList
    ) {

        return;
    }

    eventStartInventoryList.innerHTML =
        "";

    if (
        eventStartInventoryRows.length ===
        0
    ) {

        eventStartInventoryList.innerHTML =
            `
                <div class="no-data">
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
                >
                    🗑️
                </button>
            `;

            eventStartInventoryList.appendChild(
                row
            );
        }
    );

    eventStartInventoryList
        .querySelectorAll(
            ".event-stock-name"
        )
        .forEach(
            function (
                input
            ) {

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

    eventStartInventoryList
        .querySelectorAll(
            ".event-stock-quantity"
        )
        .forEach(
            function (
                input
            ) {

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

    eventStartInventoryList
        .querySelectorAll(
            ".event-remove-stock"
        )
        .forEach(
            function (
                button
            ) {

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


on(
    "addEventStartStockButton",
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
    }
);


function renderEventSetupInvoices() {

    if (
        !eventInvoiceList
    ) {

        return;
    }

    eventInvoiceList.innerHTML =
        "";

    if (
        eventSetupInvoices.length ===
        0
    ) {

        eventInvoiceList.innerHTML =
            `
                <div class="no-data">
                    Noch keine Rechnung hinzugefügt.
                </div>
            `;

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
                        )}
                        ·
                        ${invoice.quantity}
                        Stück
                        ·
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
                >
                    🗑️
                </button>
            `;

            eventInvoiceList.appendChild(
                row
            );
        }
    );

    eventInvoiceList
        .querySelectorAll(
            ".event-remove-invoice"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        eventSetupInvoices.splice(
                            Number(
                                button.dataset.index
                            ),
                            1
                        );

                        renderEventSetupInvoices();
                    }
                );
            }
        );
}


on(
    "addEventInvoiceButton",
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

        eventSetupInvoices.push(
            {

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
            }
        );

        eventInvoiceSupplierInput.value =
            "";

        eventInvoiceNumberInput.value =
            "";

        eventInvoiceProductInput.value =
            "";

        eventInvoiceQuantityInput.value =
            "";

        eventInvoiceAmountInput.value =
            "";

        renderEventSetupInvoices();
    }
);


on(
    "eventStartSetupBackButton",
    "click",
    function () {

        showScreen(
            eventListScreen
        );
    }
);


on(
    "eventStartSetupContinueButton",
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (
            !event
        ) {

            return;
        }

        event.start_inventory =
            eventStartInventoryRows
                .filter(
                    function (
                        item
                    ) {

                        return (
                            String(
                                item.product_name ||
                                ""
                            ).trim() !==
                            ""
                        );
                    }
                )
                .map(
                    function (
                        item
                    ) {

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

        event.invoices =
            eventSetupInvoices.map(
                function (
                    item
                ) {

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


// ============================================================
// EVENT PRODUCTS
// ============================================================

function prepareEventProducts(
    event
) {

    if (
        eventProductsTitle
    ) {

        eventProductsTitle.textContent =
            "Produkte & Preise · " +
            event.name;
    }

    renderEventProducts();
}


function renderEventProducts() {

    if (
        !eventProductsList
    ) {

        return;
    }

    const event =
        getCurrentEvent();

    eventProductsList.innerHTML =
        "";

    if (
        !event
    ) {

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

        eventProductsList.innerHTML =
            `
                <div class="no-data">
                    Noch keine Produkte für diese Veranstaltung.
                </div>
            `;

        return;
    }

    event.products.forEach(
        function (
            product
        ) {

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
                        data-product-id="${escapeAttribute(
                            product.id
                        )}"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="icon-action delete event-delete-product"
                        data-product-id="${escapeAttribute(
                            product.id
                        )}"
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

    eventProductsList
        .querySelectorAll(
            ".event-edit-product"
        )
        .forEach(
            function (
                button
            ) {

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

    eventProductsList
        .querySelectorAll(
            ".event-delete-product"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        const event =
                            getCurrentEvent();

                        if (
                            !event
                        ) {

                            return;
                        }

                        const product =
                            event.products.find(
                                function (
                                    item
                                ) {

                                    return (
                                        item.id ===
                                        button.dataset.productId
                                    );
                                }
                            );

                        if (
                            !product
                        ) {

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
                                    function (
                                        item
                                    ) {

                                        return (
                                            item.id !==
                                            product.id
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


on(
    "addEventProductButton",
    "click",
    function () {

        openEventProductModal();
    }
);


function openEventProductModal(
    productId = null
) {

    const event =
        getCurrentEvent();

    if (
        !eventProductModal ||
        !event
    ) {

        return;
    }

    eventProductEditingId =
        productId;

    if (
        productId
    ) {

        const product =
            event.products.find(
                function (
                    item
                ) {

                    return (
                        item.id ===
                        productId
                    );
                }
            );

        if (
            !product
        ) {

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
}


function closeEventProductModal() {

    if (
        !eventProductModal
    ) {

        return;
    }

    eventProductModal.style.display =
        "none";

    eventProductModal.setAttribute(
        "aria-hidden",
        "true"
    );

    eventProductEditingId =
        null;
}


on(
    "closeEventProductModalButton",
    "click",
    closeEventProductModal
);


on(
    "cancelEventProductButton",
    "click",
    closeEventProductModal
);


on(
    "saveEventProductButton",
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (
            !event
        ) {

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

        if (
            !name
        ) {

            alert(
                "Bitte einen Produktnamen eingeben."
            );

            return;
        }

        if (
            !Number.isFinite(
                price
            ) ||
            price <
            0
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
                    function (
                        item
                    ) {

                        return (
                            item.id ===
                            eventProductEditingId
                        );
                    }
                );

            if (
                !product
            ) {

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

            event.products.push(
                {

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
                }
            );
        }

        updateCurrentEvent(
            event
        );

        closeEventProductModal();

        renderEventProducts();
    }
);


on(
    "eventProductsBackButton",
    "click",
    function () {

        showScreen(
            eventListScreen
        );
    }
);


on(
    "eventProductsContinueButton",
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (
            !event
        ) {

            return;
        }

        if (
            !event.products ||
            event.products.length ===
            0
        ) {

            alert(
                "Bitte mindestens ein Produkt anlegen."
            );

            return;
        }

        renderEventWorkspace();

        showScreen(
            eventWorkspaceScreen
        );
    }
);


// ============================================================
// EVENT WORKSPACE
// ============================================================

function renderEventWorkspace() {

    const event =
        getCurrentEvent();

    if (
        !event
    ) {

        return;
    }

    setText(
        "eventWorkspaceName",
        event.name
    );

    setText(
        "eventWorkspaceDate",
        formatEventDate(
            event.event_date
        )
    );

    setHidden(
        "eventWorkspaceStudentOptions",
        isCurrentTeacher()
    );

    setHidden(
        "eventWorkspaceTeacherOptions",
        !isCurrentTeacher()
    );
}


on(
    "studentEventCashButton",
    "click",
    function () {

        openEventCash(
            false
        );
    }
);


on(
    "studentEventOutputButton",
    "click",
    function () {

        openEventOutput(
            false
        );
    }
);


on(
    "teacherEventCashButton",
    "click",
    function () {

        openEventCash(
            true
        );
    }
);


on(
    "teacherEventOutputButton",
    "click",
    function () {

        openEventOutput(
            true
        );
    }
);


on(
    "teacherEventEndInventoryButton",
    "click",
    function () {

        openEventEndInventory();
    }
);


on(
    "eventWorkspaceBackButton",
    "click",
    function () {

        showScreen(
            eventListScreen
        );
    }
);


// ============================================================
// EVENT CASH
// ============================================================

function openEventCash(
    testMode
) {

    const event =
        getCurrentEvent();

    if (
        !event
    ) {

        return;
    }

    currentEventSaleTestMode =
        Boolean(
            testMode
        );

    eventSaleCart =
        [];

    setText(
        "eventCashTitle",
        testMode
            ? "Kasse · Testumgebung"
            : "Kasse"
    );

    setText(
        "eventCashProductHeading",
        event.name
    );

    renderEventCashProducts();

    updateEventCart();

    showScreen(
        eventCashScreen,
        eventWorkspaceScreen
    );
}


function renderEventCashProducts() {

    if (
        !eventCashProductsGrid
    ) {

        return;
    }

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
        function (
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
}


function addEventProductToCart(
    product
) {

    const existing =
        eventSaleCart.find(
            function (
                item
            ) {

                return (
                    item.id ===
                    product.id
                );
            }
        );

    if (
        existing
    ) {

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
                    1
            }
        );
    }

    updateEventCart();
}


function updateEventCart() {

    if (
        !eventCartItems ||
        !eventCartTotal ||
        !eventPayButton
    ) {

        return;
    }

    eventCartItems.innerHTML =
        "";

    if (
        eventSaleCart.length ===
        0
    ) {

        eventCartItems.innerHTML =
            `
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
                        class="cart-control event-minus"
                        data-index="${index}"
                    >
                        −
                    </button>

                    <span class="cart-quantity">
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="cart-control event-plus"
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

    eventCartItems
        .querySelectorAll(
            ".event-minus"
        )
        .forEach(
            function (
                button
            ) {

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

    eventCartItems
        .querySelectorAll(
            ".event-plus"
        )
        .forEach(
            function (
                button
            ) {

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


on(
    "eventCashBackButton",
    "click",
    function () {

        eventSaleCart =
            [];

        showScreen(
            eventWorkspaceScreen
        );
    }
);


on(
    "eventPayButton",
    "click",
    function () {

        if (
            eventSaleCart.length ===
            0
        ) {

            return;
        }

        const event =
            getCurrentEvent();

        if (
            !event
        ) {

            return;
        }

        const total =
            calculateEventCartTotal();

        const amountInput =
            window.prompt(
                "Kunde gibt (Euro, z. B. 10,00):"
            );

        if (
            amountInput ===
            null
        ) {

            return;
        }

        const received =
            parseGermanNumber(
                amountInput
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
                            function (
                                item
                            ) {

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

        setText(
            "successTitle",
            "Zahlung erfolgreich!"
        );

        setText(
            "successDescription",
            currentEventSaleTestMode
                ? "Veranstaltung · Testumgebung"
                : "Veranstaltung · Verkauf gespeichert."
        );

        setText(
            "successChange",
            formatPrice(
                change
            )
        );

        currentSuccessContext =
            "event";

        showScreen(
            successScreen
        );
    }
);


on(
    "eventCashShiftEndButton",
    "click",
    function () {

        endEventShift();
    }
);


// ============================================================
// EVENT OUTPUT
// ============================================================

function openEventOutput(
    testMode
) {

    setText(
        "eventOutputTitle",
        testMode
            ? "Ausgabe · Testumgebung"
            : "Ausgabe"
    );

    renderEventOutput();

    showScreen(
        eventOutputScreen,
        eventWorkspaceScreen
    );
}


function renderEventOutput() {

    if (
        !eventOutputOrders
    ) {

        return;
    }

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

        eventOutputOrders.innerHTML =
            `
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

                row.innerHTML = `
                    <div>

                        <strong>
                            Bestellung ${
                                event.sales.length -
                                index
                            }
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


on(
    "eventOutputBackButton",
    "click",
    function () {

        showScreen(
            eventWorkspaceScreen
        );
    }
);


on(
    "eventOutputShiftEndButton",
    "click",
    function () {

        endEventShift();
    }
);


function endEventShift() {

    const event =
        getCurrentEvent();

    if (
        !event
    ) {

        return;
    }

    const eventSales =
        Array.isArray(
            event.sales
        )
            ? event.sales
            : [];

    const count =
        eventSales.length;

    const revenue =
        eventSales.reduce(
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

    const text =
        isCurrentTeacher()
            ? "Testumgebung: Ihr habt " +
                count +
                " Verkäufe gemacht und " +
                formatPrice(
                    revenue
                ) +
                " Umsatz erzielt."
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
        isCurrentTeacher()
            ? "Zur Veranstaltung"
            : "Weiter zur Endinventur",
        function () {

            if (
                isCurrentTeacher()
            ) {

                showScreen(
                    eventWorkspaceScreen
                );

            } else {

                openEventEndInventory();
            }
        }
    );
}


// ============================================================
// EVENT END INVENTORY
// ============================================================

function openEventEndInventory() {

    const event =
        getCurrentEvent();

    if (
        !event
    ) {

        return;
    }

    setText(
        "eventEndInventoryTitle",
        "Endinventur · " +
        event.name
    );

    renderEventEndInventory();

    showScreen(
        eventEndInventoryScreen,
        eventWorkspaceScreen
    );
}


function renderEventEndInventory() {

    if (
        !eventEndInventoryList
    ) {

        return;
    }

    const event =
        getCurrentEvent();

    eventEndInventoryList.innerHTML =
        "";

    if (
        !event
    ) {

        return;
    }

    const rows =
        [];

    (
        event.products ||
        []
    ).forEach(
        function (
            product
        ) {

            rows.push(
                {

                    name:
                        product.name,

                    icon:
                        product.icon ||
                        "🎪"
                }
            );
        }
    );

    (
        event.start_inventory ||
        []
    ).forEach(
        function (
            item
        ) {

            const exists =
                rows.some(
                    function (
                        row
                    ) {

                        return (
                            row.name.toLowerCase() ===
                            String(
                                item.product_name ||
                                ""
                            ).toLowerCase()
                        );
                    }
                );

            if (
                !exists
            ) {

                rows.push(
                    {

                        name:
                            item.product_name,

                        icon:
                            "📦"
                    }
                );
            }
        }
    );

    if (
        rows.length ===
        0
    ) {

        eventEndInventoryList.innerHTML =
            `
                <div class="no-data">
                    Keine Produkte vorhanden.
                </div>
            `;

        return;
    }

    rows.forEach(
        function (
            row
        ) {

            const previous =
                (
                    event.end_inventory ||
                    []
                ).find(
                    function (
                        item
                    ) {

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
                            row.icon
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


on(
    "eventEndInventoryBackButton",
    "click",
    function () {

        showScreen(
            eventWorkspaceScreen
        );
    }
);


on(
    "saveEventEndInventoryButton",
    "click",
    function () {

        const event =
            getCurrentEvent();

        if (
            !event ||
            !eventEndInventoryList
        ) {

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
            function (
                input
            ) {

                if (
                    input.value.trim() ===
                    ""
                ) {

                    return;
                }

                const quantity =
                    Number(
                        input.value
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
            "Die Endinventur wurde gespeichert.",
            "Weiter",
            function () {

                currentEventId =
                    null;

                eventSaleCart =
                    [];

                showScreen(
                    homeScreen
                );
            }
        );
    }
);


// ============================================================
// SITE POPUP
// ============================================================

function showSiteMessage(
    icon,
    title,
    text,
    buttonText,
    callback
) {

    if (
        !siteMessageModal
    ) {

        if (
            callback
        ) {

            callback();
        }

        return;
    }

    if (
        siteMessageIcon
    ) {

        siteMessageIcon.textContent =
            icon;
    }

    if (
        siteMessageTitle
    ) {

        siteMessageTitle.textContent =
            title;
    }

    if (
        siteMessageText
    ) {

        siteMessageText.textContent =
            text;
    }

    if (
        siteMessagePrimaryButton
    ) {

        siteMessagePrimaryButton.textContent =
            buttonText;
    }

    siteMessageCallback =
        callback || null;

    siteMessageModal.style.display =
        "flex";

    siteMessageModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


on(
    "siteMessagePrimaryButton",
    "click",
    function () {

        if (
            siteMessageModal
        ) {

            siteMessageModal.style.display =
                "none";

            siteMessageModal.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        const callback =
            siteMessageCallback;

        siteMessageCallback =
            null;

        if (
            callback
        ) {

            callback();
        }
    }
);


// ============================================================
// HELPERS
// ============================================================

function parseGermanNumber(
    value
) {

    if (
        !value
    ) {

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


function getFullName(
    person
) {

    if (
        !person
    ) {

        return "";
    }

    return [
        person.first_name,
        person.last_name
    ]
        .filter(
            Boolean
        )
        .join(
            " "
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


function formatEventDate(
    value
) {

    if (
        !value
    ) {

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


function setDefaultDates() {

    const today =
        getLocalDateKey(
            new Date()
        );

    if (
        invoiceDateInput &&
        !invoiceDateInput.value
    ) {

        invoiceDateInput.value =
            today;
    }

    if (
        eventInvoiceDateInput &&
        !eventInvoiceDateInput.value
    ) {

        eventInvoiceDateInput.value =
            today;
    }

    if (
        eventDateInput &&
        !eventDateInput.value
    ) {

        eventDateInput.value =
            today;
    }
}


function createId(
    prefix
) {

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(
                36
            )
            .slice(
                2,
                8
            )
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

    let number =
        2;

    while (
        products.some(
            function (
                product
            ) {

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
            number;

        number +=
            1;
    }

    return id;
}


function escapeHtml(
    value
) {

    return String(
        value ??
        ""
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


// ============================================================
// END
// ============================================================

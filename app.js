// ========================================
// LAUTER MACHER — APP.JS
// Version de réparation stable
// Compatible avec le index.html actuel
// ========================================

const SUPABASE_URL = "https://gsbkfrjhierqopkwpqjc.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiZ3Nia2ZyamllcnFvcGt3cHFqYyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzkwOTIyNzI4LCJleHAiOjIxMDY0OTg3Mjh9.BV5aYeAO2nE5SjiEOCs3GA1hwQpg0IJzEl5wizApUVU";

const supabaseClient =
    window.supabase?.createClient
        ? window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        )
        : null;


// ========================================
// DOM HELPERS
// ========================================

const $ = (id) =>
    document.getElementById(id);

function on(element, event, handler) {
    if (element) {
        element.addEventListener(
            event,
            handler
        );
    }
}

function setText(element, value) {
    if (element) {
        element.textContent =
            value ?? "";
    }
}

function setHidden(element, value) {
    if (element) {
        element.hidden =
            Boolean(value);
    }
}


// ========================================
// SCREENS
// ========================================

const screens =
    Array.from(
        document.querySelectorAll(
            ".screen"
        )
    );

const identityScreen =
    $("identityScreen");

const pinLoginScreen =
    $("pinLoginScreen");

const homeScreen =
    $("homeScreen");

const saleScreen =
    $("saleScreen");

const paymentScreen =
    $("paymentScreen");

const successScreen =
    $("successScreen");

const bakeryMenuScreen =
    $("bakeryMenuScreen");

const bakeryCashScreen =
    $("bakeryCashScreen");

const bakeryOutputScreen =
    $("bakeryOutputScreen");

const adminScreen =
    $("adminScreen");

const inventoryScreen =
    $("inventoryScreen");

const inventoryCountScreen =
    $("inventoryCountScreen");

const inventoryInvoicesScreen =
    $("inventoryInvoicesScreen");

const productsScreen =
    $("productsScreen");

const reportsScreen =
    $("reportsScreen");

const eventListScreen =
    $("eventListScreen");

const eventCreateScreen =
    $("eventCreateScreen");

const eventStartSetupScreen =
    $("eventStartSetupScreen");

const eventProductsScreen =
    $("eventProductsScreen");

const eventWorkspaceScreen =
    $("eventWorkspaceScreen");

const eventCashScreen =
    $("eventCashScreen");

const eventOutputScreen =
    $("eventOutputScreen");

const eventEndInventoryScreen =
    $("eventEndInventoryScreen");


let currentReturnScreen =
    homeScreen;


function showScreen(
    screen,
    returnScreen = homeScreen
) {
    if (!screen) {
        return;
    }

    screens.forEach(
        function (item) {
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

    if (returnScreen) {
        currentReturnScreen =
            returnScreen;
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


// ========================================
// HEADER / LOGIN
// ========================================

const appHeader =
    $("appHeader");

const currentPersonName =
    $("currentPersonName");

const notificationButton =
    $("notificationButton");

const notificationCount =
    $("notificationCount");

const logoutButton =
    $("logoutButton");

const peopleGrid =
    $("peopleGrid");

const identityError =
    $("identityError");

const selectedPersonName =
    $("selectedPersonName");

const loginPinInput =
    $("loginPinInput");

const pinLoginError =
    $("pinLoginError");

const loginBackButton =
    $("loginBackButton");

const loginConfirmButton =
    $("loginConfirmButton");

const studentHomeMenu =
    $("studentHomeMenu");

const teacherHomeMenu =
    $("teacherHomeMenu");

const homeRoleLabel =
    $("homeRoleLabel");


let currentPerson =
    null;

let selectedLoginPerson =
    null;


// ========================================
// HOME
// ========================================

const saleButton =
    $("saleButton");

const teacherSaleButton =
    $("teacherSaleButton");

const bakeryButton =
    $("bakeryButton");

const teacherBakeryButton =
    $("teacherBakeryButton");

const adminButton =
    $("adminButton");

const teacherAdminButton =
    $("teacherAdminButton");

const reportsHomeButton =
    $("reportsHomeButton");

const eventButton =
    $("eventButton");

const teacherEventButton =
    $("teacherEventButton");


function isTeacher() {
    return (
        currentPerson &&
        currentPerson.person_type ===
            "lehrer"
    );
}


function showHeader() {
    if (appHeader) {
        appHeader.classList.add(
            "visible"
        );
    }
}


function hideHeader() {
    if (appHeader) {
        appHeader.classList.remove(
            "visible"
        );
    }
}


function updateHome() {

    const teacher =
        isTeacher();

    setText(
        homeRoleLabel,
        teacher
            ? "Lehrkraft"
            : ""
    );

    setHidden(
        studentHomeMenu,
        teacher
    );

    setHidden(
        teacherHomeMenu,
        !teacher
    );

    setHidden(
        reportsHomeButton,
        !teacher
    );
}


function updateInventoryMenus() {

    const teacher =
        isTeacher();

    if (teacher) {

        setText(
            $("editMenuTitle"),
            "Bearbeiten"
        );

        setText(
            $("editMenuDescription"),
            "Produkte, Preise und Inventar verwalten."
        );

        setText(
            $("inventoryMenuTitle"),
            "Inventar"
        );

        setText(
            $("inventoryMenuDescription"),
            "Bestand verwalten"
        );

    } else {

        setText(
            $("editMenuTitle"),
            "Bearbeiten"
        );

        setText(
            $("editMenuDescription"),
            "Produkte und Preise selbstständig bearbeiten."
        );

        setText(
            $("inventoryMenuTitle"),
            "Inventur"
        );

        setText(
            $("inventoryMenuDescription"),
            "Bestand zählen und an den Lehrer schicken"
        );
    }
}


function updateNotificationBadge() {
    if (!isTeacher()) {
        setHidden(
            notificationCount,
            true
        );

        return;
    }

    const count =
        inventorySubmissions.length;

    setText(
        notificationCount,
        count
    );

    setHidden(
        notificationCount,
        count === 0
    );
}


// ========================================
// LOCAL STORAGE
// ========================================

const KEYS = {
    products:
        "lauterMacher_products_v1",

    sales:
        "lauterMacher_sales_v1",

    inventory:
        "lauterMacher_inventory_v1",

    submissions:
        "lauterMacher_inventory_submissions_v1"
};


function load(
    key,
    fallback
) {
    try {
        const value =
            localStorage.getItem(
                key
            );

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {
        console.error(
            "LocalStorage konnte nicht geladen werden:",
            key,
            error
        );

        return fallback;
    }
}


function save(
    key,
    value
) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch (error) {
        console.error(
            "LocalStorage konnte nicht gespeichert werden:",
            key,
            error
        );
    }
}


// ========================================
// FALLBACK PRODUKTE
// ========================================

const DEFAULT_PRODUCTS = [

    {
        id: "wasser",
        name: "Wasser",
        price: 1,
        category: "drink",
        icon: "💧",
        active: true
    },

    {
        id: "apfelsaft",
        name: "Apfelsaft",
        price: 1.5,
        category: "drink",
        icon: "🧃",
        active: true
    },

    {
        id: "capri-sun",
        name: "Capri-Sun",
        price: 1.5,
        category: "drink",
        icon: "🧃",
        active: true
    },

    {
        id: "fake-cola",
        name: "Fake Cola",
        price: 1.5,
        category: "drink",
        icon: "🥤",
        active: true
    },

    {
        id: "fake-fanta",
        name: "Fake Fanta",
        price: 1.5,
        category: "drink",
        icon: "🥤",
        active: true
    },

    {
        id: "fake-sprite",
        name: "Fake Sprite",
        price: 1.5,
        category: "drink",
        icon: "🥤",
        active: true
    },

    {
        id: "isodrink",
        name: "Isodrink",
        price: 2,
        category: "drink",
        icon: "⚡",
        active: true
    }

];


let products =
    load(
        KEYS.products,
        DEFAULT_PRODUCTS
    );


let sales =
    load(
        KEYS.sales,
        []
    );


let inventory =
    load(
        KEYS.inventory,
        {}
    );


let inventorySubmissions =
    load(
        KEYS.submissions,
        []
    );


// ========================================
// PRODUCTS — CATEGORY HELPERS
// ========================================

function appCategory(
    category
) {
    if (
        category ===
            "getränke"
    ) {
        return "drink";
    }

    if (
        category ===
            "bäckerei"
    ) {
        return "bakery";
    }

    return category;
}


function dbCategory(
    category
) {
    if (
        category ===
            "drink"
    ) {
        return "getränke";
    }

    if (
        category ===
            "bakery"
    ) {
        return "bäckerei";
    }

    return category;
}


function mapProduct(
    product
) {
    return {
        id:
            String(
                product.id
            ),

        name:
            String(
                product.name ||
                    ""
            ),

        price:
            Number(
                product.price ||
                    0
            ),

        category:
            appCategory(
                product.category
            ),

        icon:
            String(
                product.icon ||
                    "🥤"
            ),

        active:
            product.active !==
            false
    };
}


// ========================================
// SUPABASE — PRODUCTS
// ========================================

async function syncProducts() {

    if (
        !supabaseClient ||
        !currentPerson
    ) {
        return false;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "products"
                )
                .select(
                    "id,name,price,category,icon,active,created_at"
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                )
                .order(
                    "name",
                    {
                        ascending:
                            true
                    }
                );

        if (error) {
            throw error;
        }

        products =
            (
                data || []
            ).map(
                mapProduct
            );

        save(
            KEYS.products,
            products
        );

        renderProducts();

        if (
            productsScreen &&
            productsScreen.classList.contains(
                "screen-visible"
            )
        ) {
            renderAdminProducts();
        }

        return true;

    } catch (error) {

        console.error(
            "Produkte konnten nicht synchronisiert werden.",
            error
        );

        return false;
    }
}


// ========================================
// LOGIN — PERSONEN LADEN
// ========================================

async function loadPeople() {

    if (!peopleGrid) {
        return;
    }

    setText(
        identityError,
        ""
    );

    peopleGrid.innerHTML = `
        <div class="login-loading">
            Personen werden geladen …
        </div>
    `;

    try {

        const response = await fetch(
            SUPABASE_URL +
            "/rest/v1/login_people" +
            "?select=id,first_name,last_name,person_type" +
            "&order=person_type,last_name,first_name",
            {
                method: "GET",

                headers: {
                    "apikey":
                        SUPABASE_ANON_KEY,

                    "Authorization":
                        "Bearer " +
                        SUPABASE_ANON_KEY,

                    "Content-Type":
                        "application/json"
                }
            }
        );

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "HTTP " +
                response.status +
                " · " +
                errorText
            );
        }

        const people =
            await response.json();

        console.log(
            "Login-Personen geladen:",
            people
        );

        renderPeople(
            Array.isArray(people)
                ? people
                : []
        );

    } catch (error) {

        console.error(
            "Login-Personen konnten nicht geladen werden:",
            error
        );

        peopleGrid.innerHTML = "";

        setText(
            identityError,
            "Die Personen konnten nicht geladen werden."
        );
    }
}


function renderPeople(
    people
) {

    if (!peopleGrid) {
        return;
    }

    peopleGrid.innerHTML =
        "";

    people.forEach(
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
                [
                    person.first_name,
                    person.last_name
                ]
                    .filter(Boolean)
                    .join(" ");

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

            on(
                button,
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
        people.length ===
        0
    ) {
        setText(
            identityError,
            "Keine aktiven Personen gefunden."
        );
    }
}


function selectLoginPerson(
    person
) {

    selectedLoginPerson =
        person;

    setText(
        selectedPersonName,
        [
            person.first_name,
            person.last_name
        ]
            .filter(Boolean)
            .join(" ")
    );

    if (loginPinInput) {
        loginPinInput.value =
            "";
    }

    setText(
        pinLoginError,
        ""
    );

    hideHeader();

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


// ========================================
// LOGIN — PIN
// ========================================

on(
    loginBackButton,
    "click",
    function () {

        selectedLoginPerson =
            null;

        if (loginPinInput) {
            loginPinInput.value =
                "";
        }

        setText(
            pinLoginError,
            ""
        );

        hideHeader();

        showScreen(
            identityScreen
        );
    }
);


on(
    loginPinInput,
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

        setText(
            pinLoginError,
            ""
        );
    }
);


on(
    loginPinInput,
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
    loginConfirmButton,
    "click",
    loginWithPin
);


async function loginWithPin() {

    if (
        !selectedLoginPerson ||
        !supabaseClient
    ) {
        return;
    }

    const pin =
        loginPinInput
            ? loginPinInput.value
            : "";

    if (
        !/^[0-9]{4}$/.test(
            pin
        )
    ) {

        setText(
            pinLoginError,
            "Bitte eine 4-stellige PIN eingeben."
        );

        return;
    }

    loginConfirmButton.disabled =
        true;

    setText(
        loginConfirmButton,
        "Anmeldung …"
    );

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .functions
                .invoke(
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
            data:
                otpData,
            error:
                otpError
        } =
            await supabaseClient
                .auth
                .verifyOtp(
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
                "Person konnte nicht geladen werden."
            );
        }

        await setLoggedIn(
            person
        );

    } catch (error) {

        console.error(
            "Login fehlgeschlagen.",
            error
        );

        setText(
            pinLoginError,
            "Falsche PIN oder Anmeldung nicht möglich."
        );

        if (loginPinInput) {
            loginPinInput.value =
                "";

            loginPinInput.focus();
        }

    } finally {

        loginConfirmButton.disabled =
            false;

        setText(
            loginConfirmButton,
            "Einloggen"
        );
    }
}


async function loadCurrentPerson(
    session
) {

    if (
        !session ||
        !session.user ||
        !supabaseClient
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
                "id,first_name,last_name,person_type,active"
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


async function setLoggedIn(
    person
) {

    currentPerson =
        person;

    selectedLoginPerson =
        null;

    setText(
        currentPersonName,
        [
            person.first_name,
            person.last_name
        ]
            .filter(Boolean)
            .join(" ")
    );

    sessionSalesCount =
        0;

    sessionRevenue =
        0;

    updateHome();

    updateInventoryMenus();

    updateNotificationBadge();

    await syncProducts();

    showHeader();

    showScreen(
        homeScreen
    );
}


// ========================================
// LOGOUT
// ========================================

on(
    logoutButton,
    "click",
    async function () {

        try {

            if (
                supabaseClient
            ) {
                await supabaseClient
                    .auth
                    .signOut();
            }

        } catch (error) {

            console.error(
                "Abmeldung fehlgeschlagen.",
                error
            );
        }

        currentPerson =
            null;

        selectedLoginPerson =
            null;

        resetSale();

        setText(
            currentPersonName,
            "-"
        );

        hideHeader();

        showScreen(
            identityScreen
        );

        await loadPeople();
    }
);


if (
    supabaseClient
) {

    supabaseClient
        .auth
        .onAuthStateChange(
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

                    hideHeader();

                    showScreen(
                        identityScreen
                    );

                    loadPeople();
                }
            }
        );
}


// ========================================
// HOME NAVIGATION
// ========================================

on(
    saleButton,
    "click",
    function () {
        openSale(
            false
        );
    }
);


on(
    teacherSaleButton,
    "click",
    function () {
        openSale(
            true
        );
    }
);


async function openSale(
    testMode
) {

    saleTestMode =
        Boolean(
            testMode
        );

    await syncProducts();

    resetSale();

    saleTestMode =
        Boolean(
            testMode
        );

    showScreen(
        saleScreen,
        homeScreen
    );
}


on(
    bakeryButton,
    "click",
    function () {
        showScreen(
            bakeryMenuScreen,
            homeScreen
        );
    }
);


on(
    teacherBakeryButton,
    "click",
    function () {
        showScreen(
            bakeryMenuScreen,
            homeScreen
        );
    }
);


on(
    adminButton,
    "click",
    function () {
        openEditMenu();
    }
);


on(
    teacherAdminButton,
    "click",
    function () {
        openEditMenu();
    }
);


function openEditMenu() {
    updateInventoryMenus();

    showScreen(
        adminScreen,
        homeScreen
    );
}


on(
    reportsHomeButton,
    "click",
    function () {

        if (!isTeacher()) {
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
// BÄCKEREI
// Noch unverändert
// ========================================

on(
    bakeryBackButton,
    "click",
    function () {
        showScreen(
            homeScreen
        );
    }
);


on(
    bakeryCashButton,
    "click",
    function () {
        showScreen(
            bakeryCashScreen,
            bakeryMenuScreen
        );
    }
);


on(
    bakeryServiceButton,
    "click",
    function () {
        showScreen(
            bakeryOutputScreen,
            bakeryMenuScreen
        );
    }
);


on(
    $("bakeryCashBackButton"),
    "click",
    function () {
        showScreen(
            bakeryMenuScreen
        );
    }
);


on(
    $("bakeryOutputBackButton"),
    "click",
    function () {
        showScreen(
            bakeryMenuScreen
        );
    }
);


on(
    $("bakeryCashShiftEndButton"),
    "click",
    function () {
        openCompletionModal();
    }
);


on(
    $("bakeryOutputShiftEndButton"),
    "click",
    function () {
        openCompletionModal();
    }
);


// ========================================
// GETRÄNKE — PRODUKTE
// ========================================

function renderProducts() {

    const grid =
        $("drinksGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML =
        "";

    const drinks =
        products.filter(
            function (product) {
                return (
                    product.category ===
                        "drink" &&
                    product.active !==
                        false
                );
            }
        );

    drinks.forEach(
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
                    ${escapeHtml(product.icon)}
                </span>

                <span class="product-name">
                    ${escapeHtml(product.name)}
                </span>

                <span class="product-price">
                    ${formatPrice(product.price)}
                </span>
            `;

            on(
                button,
                "click",
                function () {
                    addToCart(
                        product
                    );
                }
            );

            grid.appendChild(
                button
            );
        }
    );

    if (
        drinks.length === 0
    ) {

        grid.innerHTML =
            `
                <div class="coming-soon">
                    Keine Getränke vorhanden.
                </div>
            `;
    }
}


// ========================================
// WARENKORB
// ========================================

let cart = [];

function addToCart(
    product
) {

    const existing =
        cart.find(
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


function calculateCartTotal() {

    return cart.reduce(
        function (
            totalValue,
            item
        ) {

            return (
                totalValue +
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


function updateCart() {

    const box =
        $("cartItems");

    if (!box) {
        return;
    }

    box.innerHTML =
        "";

    if (
        cart.length ===
        0
    ) {

        box.innerHTML =
            `
                <div class="empty-cart">
                    Noch keine Produkte ausgewählt.
                </div>
            `;

        setText(
            $("cartTotal"),
            "0,00 €"
        );

        if (
            $("payButton")
        ) {
            $("payButton")
                .disabled =
                true;
        }

        return;
    }

    cart.forEach(
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
                        ${escapeHtml(item.name)}
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
                        class="cart-control minus"
                        data-index="${index}"
                    >
                        −
                    </button>

                    <span class="cart-quantity">
                        ${item.quantity}
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

            box.appendChild(
                row
            );
        }
    );

    setText(
        $("cartTotal"),
        formatPrice(
            calculateCartTotal()
        )
    );

    $("payButton").disabled =
        false;

    box.querySelectorAll(
        ".cart-control.minus"
    ).forEach(
        function (button) {

            on(
                button,
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset
                                .index
                        );

                    if (
                        !cart[index]
                    ) {
                        return;
                    }

                    cart[index]
                        .quantity -=
                        1;

                    if (
                        cart[index]
                            .quantity <=
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

    box.querySelectorAll(
        ".cart-control.plus"
    ).forEach(
        function (button) {

            on(
                button,
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset
                                .index
                        );

                    if (
                        !cart[index]
                    ) {
                        return;
                    }

                    cart[index]
                        .quantity +=
                        1;

                    updateCart();
                }
            );
        }
    );
}


function resetSale() {

    cart =
        [];

    receivedAmount =
        "";

    sessionSalesCount =
        0;

    sessionRevenue =
        0;

    updateCart();
}


// ========================================
// PAYMENT
// ========================================

let receivedAmount =
    "";

let sessionSalesCount =
    0;

let sessionRevenue =
    0;

let saleTestMode =
    false;


on(
    $("saleBackButton"),
    "click",
    function () {
        resetSale();
        showScreen(
            homeScreen
        );
    }
);


on(
    $("payButton"),
    "click",
    function () {

        if (
            cart.length ===
            0
        ) {
            return;
        }

        setText(
            $("paymentTotal"),
            formatPrice(
                calculateCartTotal()
            )
        );

        receivedAmount =
            "";

        updatePayment();

        showScreen(
            paymentScreen,
            saleScreen
        );
    }
);


on(
    $("paymentBackButton"),
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
        function (button) {

            on(
                button,
                "click",
                function () {

                    const value =
                        button.textContent
                            .trim();

                    if (
                        value ===
                        ","
                    ) {

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

                    } else {

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
                                .split(
                                    ","
                                )[1]
                                .length >=
                                2
                        ) {
                            return;
                        }

                        receivedAmount +=
                            value;
                    }

                    updatePayment();
                }
            );
        }
    );


on(
    $("deletePaymentButton"),
    "click",
    function () {

        receivedAmount =
            receivedAmount.slice(
                0,
                -1
            );

        updatePayment();
    }
);


function updatePayment() {

    setText(
        $("amountReceived"),
        (
            receivedAmount ||
            "0,00"
        ) +
            " €"
    );

    const total =
        calculateCartTotal();

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
            $("changeAmount"),
            "0,00 €"
        );

        $("paidButton")
            .disabled =
            true;

        return;
    }

    if (
        change <
        0
    ) {

        setText(
            $("changeAmount"),
            "Noch " +
                formatPrice(
                    Math.abs(
                        change
                    )
                )
        );

        $("paidButton")
            .disabled =
            true;

        return;
    }

    setText(
        $("changeAmount"),
        formatPrice(change)
    );

    $("paidButton")
        .disabled =
        false;
}


on(
    $("paidButton"),
    "click",
    function () {

        const total =
            calculateCartTotal();

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

        sessionSalesCount +=
            1;

        sessionRevenue +=
            total;

        if (
            !saleTestMode
        ) {

            const sale =
                {
                    id:
                        Date.now(),

                    date:
                        new Date()
                            .toISOString(),

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
                        )
                };

            sales.push(
                sale
            );

            save(
                KEYS.sales,
                sales
            );

            cart.forEach(
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
                            ] || 0
                        ) -
                        Number(
                            item.quantity
                        );
                }
            );

            save(
                KEYS.inventory,
                inventory
            );
        }

        setText(
            $("successChange"),
            formatPrice(
                change
            )
        );

        setText(
            $("successTitle"),
            saleTestMode
                ? "Testzahlung erfolgreich!"
                : "Zahlung erfolgreich!"
        );

        setText(
            $("successDescription"),
            saleTestMode
                ? "Testverkauf in der Testumgebung."
                : "Verkauf wurde gespeichert."
        );

        showScreen(
            successScreen
        );
    }
);


on(
    $("newOrderButton"),
    "click",
    function () {

        const teacher =
            isTeacher();

        resetSale();

        saleTestMode =
            teacher;

        showScreen(
            saleScreen,
            homeScreen
        );
    }
);


// ========================================
// ABSCHLUSSMODAL
// ========================================

let messageAction =
    function () {};


function openCompletionModal() {

    setText(
        $("siteMessageIcon"),
        "🎉"
    );

    setText(
        $("siteMessageTitle"),
        "Well done heute, Team! 🎉"
    );

    setText(
        $("siteMessageText"),
        (
            isTeacher()
                ? "Testumgebung: "
                : ""
        ) +
            sessionSalesCount +
            " Verkäufe · " +
            formatPrice(
                sessionRevenue
            ) +
            " Umsatz."
    );

    setText(
        $("siteMessagePrimaryButton"),
        "Zur Startseite"
    );

    messageAction =
        function () {

            resetSale();

            showScreen(
                homeScreen
            );
        };

    const modal =
        $("siteMessageModal");

    if (modal) {

        modal.style.display =
            "flex";

        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    }
}


function closeMessageModal() {

    const modal =
        $("siteMessageModal");

    if (modal) {

        modal.style.display =
            "none";

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    const action =
        messageAction;

    messageAction =
        function () {};

    action();
}


on(
    $("successShiftEndButton"),
    "click",
    openCompletionModal
);


on(
    $("siteMessagePrimaryButton"),
    "click",
    closeMessageModal
);


on(
    $("siteMessageModal"),
    "click",
    function (event) {

        if (
            event.target ===
            $("siteMessageModal")
        ) {
            closeMessageModal();
        }
    }
);


// ========================================
// PRODUITS ADMIN
// ========================================

let editingProductId =
    null;


on(
    $("productsButton"),
    "click",
    async function () {

        await syncProducts();

        renderAdminProducts();

        showScreen(
            productsScreen,
            adminScreen
        );
    }
);


function renderAdminProducts() {

    const box =
        $("adminProductsList");

    if (!box) {
        return;
    }

    box.innerHTML =
        "";

    if (
        products.length ===
        0
    ) {

        box.innerHTML =
            `
                <div class="no-data">
                    Keine Produkte vorhanden.
                </div>
            `;

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
                        data-id="${escapeHtml(
                            product.id
                        )}"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="icon-action delete delete-product-button"
                        data-id="${escapeHtml(
                            product.id
                        )}"
                    >
                        🗑️
                    </button>

                </div>
            `;

            box.appendChild(
                row
            );
        }
    );

    box.querySelectorAll(
        ".edit-product-button"
    ).forEach(
        function (button) {

            on(
                button,
                "click",
                function () {
                    openProductModal(
                        button.dataset
                            .id
                    );
                }
            );
        }
    );

    box.querySelectorAll(
        ".delete-product-button"
    ).forEach(
        function (button) {

            on(
                button,
                "click",
                function () {
                    deleteProduct(
                        button.dataset
                            .id
                    );
                }
            );
        }
    );
}


on(
    $("addProductButton"),
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

    const product =
        productId
            ? products.find(
                function (
                    item
                ) {
                    return (
                        item.id ===
                        productId
                    );
                }
            )
            : null;

    setText(
        $("productModalTitle"),
        product
            ? "Produkt bearbeiten"
            : "Produkt hinzufügen"
    );

    if (
        $("productNameInput")
    ) {
        $("productNameInput")
            .value =
            product
                ? product.name
                : "";
    }

    if (
        $("productPriceInput")
    ) {
        $("productPriceInput")
            .value =
            product
                ? Number(
                    product.price
                ).toFixed(2)
                : "";
    }

    if (
        $("productCategoryInput")
    ) {
        $("productCategoryInput")
            .value =
            product
                ? product.category
                : "drink";
    }

    if (
        $("productIconInput")
    ) {
        $("productIconInput")
            .value =
            product
                ? product.icon
                : "🥤";
    }

    if (
        $("productModal")
    ) {

        $("productModal")
            .style.display =
            "flex";

        $("productModal")
            .setAttribute(
                "aria-hidden",
                "false"
            );
    }
}


function closeProductModal() {

    if (
        $("productModal")
    ) {

        $("productModal")
            .style.display =
            "none";

        $("productModal")
            .setAttribute(
                "aria-hidden",
                "true"
            );
    }

    editingProductId =
        null;
}


on(
    $("closeProductModalButton"),
    "click",
    closeProductModal
);


on(
    $("cancelProductButton"),
    "click",
    closeProductModal
);


on(
    $("productModal"),
    "click",
    function (event) {

        if (
            event.target ===
            $("productModal")
        ) {
            closeProductModal();
        }
    }
);


on(
    $("saveProductButton"),
    "click",
    async function () {

        const name =
            $("productNameInput")
                ?.value
                .trim() ||
            "";

        const price =
            Number(
                $("productPriceInput")
                    ?.value
            );

        const category =
            $("productCategoryInput")
                ?.value ||
            "";

        const icon =
            $("productIconInput")
                ?.value
                .trim() ||
            "🥤";

        if (
            !name ||
            !Number.isFinite(
                price
            ) ||
            price < 0 ||
            ![
                "drink",
                "bakery"
            ].includes(
                category
            )
        ) {

            alert(
                "Bitte gültige Produktdaten eingeben."
            );

            return;
        }

        if (
            !currentPerson ||
            !supabaseClient
        ) {

            alert(
                "Bitte zuerst anmelden."
            );

            return;
        }

        $("saveProductButton")
            .disabled =
            true;

        try {

            const payload =
                {
                    name:
                        name,

                    price:
                        roundMoney(
                            price
                        ),

                    category:
                        dbCategory(
                            category
                        ),

                    icon:
                        icon,

                    active:
                        true
                };

            if (
                editingProductId
            ) {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from(
                            "products"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            editingProductId
                        )
                        .select(
                            "id,name,price,category,icon,active,created_at"
                        )
                        .single();

                if (error) {
                    throw error;
                }

                const updated =
                    mapProduct(
                        data
                    );

                products =
                    products.map(
                        function (
                            product
                        ) {

                            return (
                                product.id ===
                                updated.id
                            )
                                ? updated
                                : product;
                        }
                    );

            } else {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from(
                            "products"
                        )
                        .insert(
                            {
                                id:
                                    createProductId(
                                        name
                                    ),

                                ...payload
                            }
                        )
                        .select(
                            "id,name,price,category,icon,active,created_at"
                        )
                        .single();

                if (error) {
                    throw error;
                }

                products.push(
                    mapProduct(
                        data
                    )
                );
            }

            save(
                KEYS.products,
                products
            );

            renderProducts();

            renderAdminProducts();

            closeProductModal();

        } catch (
            error
        ) {

            console.error(
                "Produkt konnte nicht gespeichert werden.",
                error
            );

            alert(
                "Das Produkt konnte nicht gespeichert werden."
            );

        } finally {

            $("saveProductButton")
                .disabled =
                false;
        }
    }
);


async function deleteProduct(
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
        !supabaseClient
    ) {
        return;
    }

    if (
        !confirm(
            "Produkt „" +
                product.name +
                "“ wirklich löschen?"
        )
    ) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "products"
                )
                .update(
                    {
                        active:
                            false
                    }
                )
                .eq(
                    "id",
                    productId
                );

        if (error) {
            throw error;
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

        save(
            KEYS.products,
            products
        );

        renderProducts();

        renderAdminProducts();

    } catch (
        error
    ) {

        console.error(
            "Produkt konnte nicht gelöscht werden.",
            error
        );

        alert(
            "Das Produkt konnte nicht gelöscht werden."
        );
    }
}


// ========================================
// INVENTUR
// ========================================

on(
    $("inventoryButton"),
    "click",
    function () {

        if (
            isTeacher()
        ) {

            renderTeacherInventory();

            showScreen(
                inventoryScreen,
                adminScreen
            );

        } else {

            renderStudentInventory();

            showScreen(
                inventoryCountScreen,
                adminScreen
            );
        }
    }
);


function renderTeacherInventory() {

    const box =
        $("inventoryList");

    if (!box) {
        return;
    }

    box.innerHTML =
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
                        ${
                            Number(
                                inventory[
                                    product.id
                                ] || 0
                            )
                        }
                        Stück
                    </div>

                    <button
                        type="button"
                        class="inventory-adjust-button"
                        data-id="${escapeHtml(
                            product.id
                        )}"
                    >
                        ＋ Bestand
                    </button>
                `;

                box.appendChild(
                    row
                );
            }
        );

    box
        .querySelectorAll(
            ".inventory-adjust-button"
        )
        .forEach(
            function (button) {

                on(
                    button,
                    "click",
                    function () {

                        openInventoryModal(
                            button.dataset
                                .id
                        );
                    }
                );
            }
        );
}


let inventoryProductId =
    null;


function openInventoryModal(
    productId
) {

    if (!isTeacher()) {
        return;
    }

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

    setText(
        $("inventoryProductLabel"),
        product.name +
            " · Aktueller Bestand: " +
            Number(
                inventory[
                    productId
                ] || 0
            ) +
            " Stück"
    );

    if (
        $("inventoryAmountInput")
    ) {
        $("inventoryAmountInput")
            .value =
            "";
    }

    if (
        $("inventoryModal")
    ) {

        $("inventoryModal")
            .style.display =
            "flex";

        $("inventoryModal")
            .setAttribute(
                "aria-hidden",
                "false"
            );
    }
}


function closeInventoryModal() {

    if (
        $("inventoryModal")
    ) {

        $("inventoryModal")
            .style.display =
            "none";

        $("inventoryModal")
            .setAttribute(
                "aria-hidden",
                "true"
            );
    }

    inventoryProductId =
        null;
}


on(
    $("closeInventoryModalButton"),
    "click",
    closeInventoryModal
);


on(
    $("cancelInventoryButton"),
    "click",
    closeInventoryModal
);


on(
    $("inventoryModal"),
    "click",
    function (event) {

        if (
            event.target ===
            $("inventoryModal")
        ) {
            closeInventoryModal();
        }
    }
);


on(
    $("saveInventoryButton"),
    "click",
    function () {

        if (
            !inventoryProductId ||
            !isTeacher()
        ) {
            return;
        }

        const amount =
            Number(
                $("inventoryAmountInput")
                    ?.value
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
                ] || 0
            ) +
            amount;

        save(
            KEYS.inventory,
            inventory
        );

        renderTeacherInventory();

        closeInventoryModal();
    }
);


// ========================================
// INVENTUR — SCHÜLER
// ========================================

function renderStudentInventory() {

    const box =
        $("inventoryCountList");

    if (!box) {
        return;
    }

    box.innerHTML =
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
                        data-product-id="${escapeHtml(
                            product.id
                        )}"
                        placeholder="0"
                    >
                `;

                box.appendChild(
                    row
                );
            }
        );
}


on(
    $("submitInventoryButton"),
    "click",
    function () {

        if (
            !currentPerson ||
            currentPerson.person_type !==
                "schüler"
        ) {
            return;
        }

        const counts =
            [];

        let invalid =
            false;

        $("inventoryCountList")
            ?.querySelectorAll(
                ".inventory-count-input"
            )
            .forEach(
                function (input) {

                    if (
                        input.value ===
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
                        quantity < 0
                    ) {

                        invalid =
                            true;

                        return;
                    }

                    counts.push(
                        {
                            product_id:
                                input.dataset
                                    .productId,

                            quantity:
                                quantity
                        }
                    );
                }
            );

        if (invalid) {

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

        inventorySubmissions.push(
            {
                id:
                    Date.now(),

                submitted_at:
                    new Date()
                        .toISOString(),

                person_id:
                    currentPerson.id,

                person_name:
                    [
                        currentPerson.first_name,
                        currentPerson.last_name
                    ]
                        .filter(Boolean)
                        .join(" "),

                counts:
                    counts
            }
        );

        save(
            KEYS.submissions,
            inventorySubmissions
        );

        updateNotificationBadge();

        renderStudentInventory();

        alert(
            "Die Inventur wurde an den Lehrer übermittelt."
        );
    }
);


// ========================================
// INVENTUR & RECHNUNGEN
// Vorläufiger stabiler Platzhalter
// ========================================

on(
    $("inventoryInvoicesButton"),
    "click",
    function () {

        if (
            !isTeacher()
        ) {
            return;
        }

        const list =
            $("invoiceList");

        if (list) {

            list.innerHTML =
                `
                    <div class="no-data">
                        Die gemeinsame Inventur- und Rechnungsverwaltung wird als nächster Backend-Schritt verbunden.
                    </div>
                `;
        }

        showScreen(
            inventoryInvoicesScreen,
            adminScreen
        );
    }
);


// ========================================
// REPORTS
// ========================================

let currentReportPeriod =
    "day";


const periodTabs =
    Array.from(
        document.querySelectorAll(
            ".period-tab"
        )
    );


periodTabs.forEach(
    function (tab) {

        on(
            tab,
            "click",
            function () {

                currentReportPeriod =
                    tab.dataset
                        .period;

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

    if (!isTeacher()) {
        return;
    }

    const now =
        new Date();

    let filtered =
        sales;

    if (
        currentReportPeriod ===
        "day"
    ) {

        filtered =
            sales.filter(
                function (sale) {
                    return sameDay(
                        new Date(
                            sale.date
                        ),
                        now
                    );
                }
            );
    }

    if (
        currentReportPeriod ===
        "week"
    ) {

        const start =
            getMonday(
                now
            );

        const end =
            new Date(
                start
            );

        end.setDate(
            end.getDate() +
                7
        );

        filtered =
            sales.filter(
                function (sale) {

                    const date =
                        new Date(
                            sale.date
                        );

                    return (
                        date >=
                            start &&
                        date <
                            end
                    );
                }
            );
    }

    if (
        currentReportPeriod ===
        "month"
    ) {

        filtered =
            sales.filter(
                function (sale) {

                    const date =
                        new Date(
                            sale.date
                        );

                    return (
                        date.getFullYear() ===
                            now.getFullYear() &&
                        date.getMonth() ===
                            now.getMonth()
                    );
                }
            );
    }

    const revenue =
        filtered.reduce(
            function (
                totalValue,
                sale
            ) {

                return (
                    totalValue +
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

    const summary =
        {};

    filtered.forEach(
        function (sale) {

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
        $("reportRevenue"),
        formatPrice(
            revenue
        )
    );

    setText(
        $("reportTransactions"),
        filtered.length
    );

    setText(
        $("reportDrinks"),
        drinkCount
    );

    setText(
        $("reportBakery"),
        bakeryCount
    );

    setText(
        $("reportDateLabel"),
        now.toLocaleDateString(
            "de-DE"
        )
    );

    const reportBox =
        $("reportProducts");

    if (
        reportBox
    ) {

        reportBox.innerHTML =
            "";

        const entries =
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
            entries.length ===
            0
        ) {

            reportBox.innerHTML =
                `
                    <div class="no-data">
                        Keine Verkäufe in diesem Zeitraum.
                    </div>
                `;

        } else {

            entries.forEach(
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

                    reportBox.appendChild(
                        row
                    );
                }
            );
        }
    }
}


on(
    $("clearReportsButton"),
    "click",
    function () {

        if (!isTeacher()) {
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

        if (
            !confirm(
                "Möchtest du wirklich ALLE Verkaufsdaten löschen?"
            )
        ) {
            return;
        }

        sales =
            [];

        save(
            KEYS.sales,
            sales
        );

        renderReport();
    }
);


// ========================================
// EVENTS
// ========================================

on(
    eventButton,
    "click",
    function () {
        openEvents();
    }
);


on(
    teacherEventButton,
    "click",
    function () {
        openEvents();
    }
);


function openEvents() {

    if (
        $("createEventButton")
    ) {
        $("createEventButton")
            .hidden =
            !isTeacher();
    }

    setText(
        $("eventListTitle"),
        isTeacher()
            ? "Veranstaltungen verwalten"
            : "Veranstaltungen"
    );

    setText(
        $("eventListDescription"),
        isTeacher()
            ? "Neue Veranstaltungen erstellen oder bestehende öffnen."
            : "Wähle eine Veranstaltung aus."
    );

    showScreen(
        eventListScreen,
        homeScreen
    );
}


on(
    $("eventListBackButton"),
    "click",
    function () {
        showScreen(
            homeScreen
        );
    }
);


on(
    $("createEventButton"),
    "click",
    function () {

        if (!isTeacher()) {
            return;
        }

        setText(
            $("eventNameInput"),
            ""
        );

        if (
            $("eventNameInput")
        ) {
            $("eventNameInput")
                .value =
                "";
        }

        if (
            $("eventDateInput")
        ) {
            $("eventDateInput")
                .value =
                getTodayInputDate();
        }

        showScreen(
            eventCreateScreen,
            eventListScreen
        );
    }
);


on(
    $("eventCreateBackButton"),
    "click",
    function () {
        showScreen(
            eventListScreen
        );
    }
);


// ========================================
// EVENT-PLACEHOLDER
// ========================================

[
    "eventStartInventoryYesButton",
    "eventStartInventoryNoButton",
    "eventStartSetupContinueButton",
    "addEventStartStockButton",
    "addEventInvoiceButton",
    "eventProductsContinueButton",
    "addEventProductButton",
    "studentEventCashButton",
    "studentEventOutputButton",
    "teacherEventCashButton",
    "teacherEventOutputButton",
    "teacherEventEndInventoryButton",
    "eventCashShiftEndButton",
    "eventOutputShiftEndButton",
    "saveEventEndInventoryButton"
].forEach(
    function (id) {

        on(
            $(id),
            "click",
            function () {

                showSimpleMessage(
                    "🎪",
                    "Sonderveranstaltung",
                    "Dieser Teil wird im nächsten Backend-Schritt mit Supabase verbunden."
                );
            }
        );
    }
);


[
    "eventStartSetupBackButton",
    "eventProductsBackButton",
    "eventWorkspaceBackButton",
    "eventCashBackButton",
    "eventOutputBackButton",
    "eventEndInventoryBackButton"
].forEach(
    function (id) {

        on(
            $(id),
            "click",
            function () {

                showScreen(
                    eventListScreen
                );
            }
        );
    }
);


function showSimpleMessage(
    icon,
    title,
    message
) {

    setText(
        $("siteMessageIcon"),
        icon
    );

    setText(
        $("siteMessageTitle"),
        title
    );

    setText(
        $("siteMessageText"),
        message
    );

    setText(
        $("siteMessagePrimaryButton"),
        "Schließen"
    );

    messageAction =
        function () {};

    const modal =
        $("siteMessageModal");

    if (
        modal
    ) {

        modal.style.display =
            "flex";

        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    }
}


// ========================================
// HELPERS
// ========================================

function sameDay(
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
    ) || 0;
}


function formatPrice(
    value
) {

    return (
        Number(
            value || 0
        )
            .toFixed(2)
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
            counter;

        counter +=
            1;
    }

    return id;
}


function getTodayInputDate() {

    const date =
        new Date();

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
// BOOT
// ========================================

async function boot() {

    /*
        Très important :
        l'écran de connexion est affiché
        AVANT toute opération réseau.
    */

    hideHeader();

    showScreen(
        identityScreen
    );

    updateHome();

    updateInventoryMenus();

    renderProducts();

    updateCart();

    try {

        if (
            !supabaseClient
        ) {

            setText(
                identityError,
                "Supabase konnte nicht geladen werden. Bitte die Seite neu laden."
            );

            return;
        }

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();

        if (error) {
            throw error;
        }

        if (
            data &&
            data.session
        ) {

            const person =
                await loadCurrentPerson(
                    data.session
                );

            if (person) {

                await setLoggedIn(
                    person
                );

                return;
            }

            await supabaseClient
                .auth
                .signOut();
        }

        await loadPeople();

    } catch (error) {

        console.error(
            "Boot fehlgeschlagen.",
            error
        );

        setText(
            identityError,
            "Die Anmeldung konnte nicht geladen werden. Bitte erneut versuchen."
        );
    }
}


// Lancement après chargement du DOM
if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        boot
    );

} else {

    boot();
}

/* =====================================================================
   LAUTERMACHER — APP.JS V2
   =====================================================================

   V2
   - Supabase = einzige Datenquelle
   - Realtime
   - Schüler / Lehrer Rollen
   - Schüler-Zugangszeiten
   - Breadcrumb Navigation
   - Klickbare Benachrichtigungen
   - Inventurvorschläge
   - Getränke / Bäckerei
   - Bäckerei Ausgabe + erledigte Bestellungen
   - Lehrer-Testumgebung
   - Produkte CRUD
   - Rechnungen
   - Schülerverwaltung
   - Berichte
   - Sonderveranstaltungen
   - Event Ausgabe + erledigte Bestellungen

   WICHTIG:
   Testumgebungen des Lehrers schreiben KEINE Geschäftsdaten
   in die echten Verkaufs-/Bestandsdaten.
   ===================================================================== */


/* =====================================================================
   SUPABASE
   ===================================================================== */

const SUPABASE_URL =
    "https://gsbkfrjhierqopkwpqjc.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_xiM5w8RhiN0I0j5HSVPfnw_LhLQgozX";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================================
   KONFIGURATION
   ===================================================================== */

/*
   Vorläufige Schulzeiten.
   Schüler dürfen die App zwischen 09:00 und 15:00 Uhr benutzen.
   Lehrer haben immer Zugriff.

   Sobald die endgültigen Zeiten feststehen, müssen nur diese beiden
   Werte geändert werden.
*/
const STUDENT_ACCESS_START_HOUR = 9;
const STUDENT_ACCESS_END_HOUR = 15;


/* =====================================================================
   STATE
   ===================================================================== */

const state = {

    session: null,
    currentPerson: null,
    selectedLoginPerson: null,

    products: [],
    inventory: {},

    drinksCart: {},
    bakeryCart: {},
    eventCart: {},

    events: [],
    currentEvent: null,
    eventProducts: [],

    notifications: [],

    invoices: [],
    students: [],

    currentInventoryInvoiceId: null,

    reportPeriod: "today",
    reportSort: "revenue",

    productFilter: "all",

    drinksReceived: "0",
    bakeryReceived: "0",
    eventReceived: "0",

    /* Lehrer-Testumgebung */
    test: {
        bakeryOrders: [],
        eventOrders: [],
        bakeryCounter: 101,
        eventCounter: 101
    },

    realtimeChannel: null,

    screenHistory: [],

    currentScreenId: "identityScreen"
};


/* =====================================================================
   HELPERS
   ===================================================================== */

function $(id) {
    return document.getElementById(id);
}


function all(selector) {
    return Array.from(
        document.querySelectorAll(selector)
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


function money(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString(
        "de-DE",
        {
            style: "currency",
            currency: "EUR"
        }
    );
}


function integer(value) {

    const number =
        Number.parseInt(value, 10);

    return Number.isFinite(number)
        ? number
        : 0;
}


function decimal(value) {

    const number =
        Number.parseFloat(
            String(value ?? "")
                .replace(",", ".")
        );

    return Number.isFinite(number)
        ? number
        : 0;
}


function fullName(person) {

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


function isTeacher() {

    return (
        state.currentPerson?.person_type ===
        "lehrer"
    );
}


function isStudent() {

    return (
        state.currentPerson?.person_type !==
        "lehrer"
    );
}


function todayISO() {

    const formatter =
        new Intl.DateTimeFormat(
            "sv-SE",
            {
                timeZone: "Europe/Berlin",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );

    return formatter.format(new Date());
}


function berlinHour() {

    return Number(
        new Intl.DateTimeFormat(
            "de-DE",
            {
                timeZone: "Europe/Berlin",
                hour: "2-digit",
                hour12: false
            }
        ).format(new Date())
    );
}


function studentAccessAllowed() {

    if (isTeacher()) {
        return true;
    }

    const hour =
        berlinHour();

    return (
        hour >= STUDENT_ACCESS_START_HOUR &&
        hour < STUDENT_ACCESS_END_HOUR
    );
}


function unwrapRpc(data) {

    if (
        Array.isArray(data) &&
        data.length === 1
    ) {
        return data[0];
    }

    return data;
}


function categoryLabel(category) {

    if (category === "getränke") {
        return "Getränke";
    }

    if (category === "bäckerei") {
        return "Bäckerei";
    }

    return category || "";
}


function eventTypeLabel(type) {

    return type === "other"
        ? "Anderes"
        : "Food";
}


function isPastEvent(event) {

    return (
        event?.event_date &&
        event.event_date < todayISO()
    );
}


function activeProducts(category = null) {

    return state.products.filter(
        product =>
            product.active !== false &&
            (
                !category ||
                product.category === category
            )
    );
}


function cartTotal(cart) {

    return Object.values(cart)
        .reduce(
            (sum, item) =>
                sum +
                Number(item.price || 0) *
                Number(item.quantity || 0),
            0
        );
}


function cartToRpcItems(cart) {

    return Object.values(cart)
        .filter(item => item.quantity > 0)
        .map(item => ({
            product_id: item.product_id || item.id,
            event_product_id:
                item.event_product_id || null,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: Number(item.price)
        }));
}


function showToast(
    message,
    type = "info"
) {

    const container =
        $("toastContainer");

    if (!container) {
        console.log(message);
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    window.setTimeout(
        () => toast.remove(),
        3500
    );
}


function setBusy(button, busy) {

    if (!button) {
        return;
    }

    button.disabled =
        Boolean(busy);
}


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}


function setHidden(id, hidden) {

    const element = $(id);

    if (element) {
        element.hidden = hidden;
    }
}


/* =====================================================================
   SCREEN NAVIGATION
   ===================================================================== */

const SCREEN_TITLES = {

    homeScreen: "Startseite",

    drinksSaleScreen: "Getränke · Kasse",
    drinksPaymentScreen: "Getränke · Bezahlen",
    drinksSuccessScreen: "Getränke · Fertig",
    freeDrinksScreen: "Kostenlose Getränke",

    bakeryMenuScreen: "Bäckerei",
    bakerySaleScreen: "Bäckerei · Kasse",
    bakeryPaymentScreen: "Bäckerei · Bezahlen",
    bakerySuccessScreen: "Bäckerei · Fertig",
    bakeryOutputScreen: "Bäckerei · Ausgabe",

    editMenuScreen: "Bearbeiten",
    productsScreen: "Produkte",
    studentInventoryScreen: "Inventur",
    teacherInventoryScreen: "Inventur",
    invoicesScreen: "Rechnungen",
    studentsScreen: "Schüler",

    reportsScreen: "Berichte",

    eventsScreen: "Sonderveranstaltungen",
    eventTypeScreen: "Veranstaltung erstellen",
    eventCreateScreen: "Veranstaltung erstellen",
    eventWorkspaceScreen: "Veranstaltung",
    eventProductsScreen: "Produkte & Preise",
    eventSaleScreen: "Kasse",
    eventPaymentScreen: "Bezahlen",
    eventSuccessScreen: "Fertig",
    eventOutputScreen: "Ausgabe",
    eventEndInventoryScreen: "Endinventur",

    notificationsScreen: "Benachrichtigungen"
};


function showScreen(
    screenOrId,
    options = {}
) {

    const screen =
        typeof screenOrId === "string"
            ? $(screenOrId)
            : screenOrId;

    if (!screen) {
        return;
    }

    const newId =
        screen.id;

    if (
        options.pushHistory !== false &&
        state.currentScreenId &&
        state.currentScreenId !== newId &&
        state.currentScreenId !== "identityScreen" &&
        state.currentScreenId !== "pinLoginScreen"
    ) {

        state.screenHistory.push(
            state.currentScreenId
        );
    }

    all(".screen").forEach(
        element => {

            element.style.display =
                "none";

            element.classList.remove(
                "screen-visible"
            );
        }
    );

    screen.style.display =
        screen.classList.contains(
            "success-screen"
        )
            ? "flex"
            : "block";

    screen.classList.add(
        "screen-visible"
    );

    state.currentScreenId =
        newId;

    updateBreadcrumb();

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


function goHome() {

    state.screenHistory = [];

    showScreen(
        "homeScreen",
        {
            pushHistory: false
        }
    );
}


function goBack() {

    const previous =
        state.screenHistory.pop();

    if (previous && $(previous)) {

        showScreen(
            previous,
            {
                pushHistory: false
            }
        );

        return;
    }

    goHome();
}


function updateBreadcrumb() {

    const container =
        $("breadcrumb");

    if (!container) {
        return;
    }

    const current =
        state.currentScreenId;

    if (
        !state.currentPerson ||
        current === "homeScreen"
    ) {

        container.innerHTML = `
            <button
                type="button"
                class="breadcrumb-item"
                data-breadcrumb-home
            >
                Startseite
            </button>
        `;

        return;
    }

    let parent = "";

    if (
        current.includes("drinks") ||
        current === "freeDrinksScreen"
    ) {
        parent = "Getränke";
    }

    if (
        current.includes("bakery")
    ) {
        parent = "Bäckerei";
    }

    if (
        [
            "editMenuScreen",
            "productsScreen",
            "studentInventoryScreen",
            "teacherInventoryScreen",
            "invoicesScreen",
            "studentsScreen"
        ].includes(current)
    ) {
        parent = "Bearbeiten";
    }

    if (
        current.includes("event") ||
        current === "eventsScreen"
    ) {
        parent = "Sonderveranstaltungen";
    }

    if (current === "reportsScreen") {
        parent = "Berichte";
    }

    if (current === "notificationsScreen") {
        parent = "Benachrichtigungen";
    }

    const title =
        SCREEN_TITLES[current] ||
        "LauterMacher";

    container.innerHTML = `
        <button
            type="button"
            class="breadcrumb-item"
            data-breadcrumb-home
        >
            Startseite
        </button>

        ${
            parent
                ? `
                    <span class="breadcrumb-separator">›</span>

                    <button
                        type="button"
                        class="breadcrumb-item"
                        data-breadcrumb-parent="${escapeHtml(parent)}"
                    >
                        ${escapeHtml(parent)}
                    </button>
                `
                : ""
        }

        ${
            title !== parent
                ? `
                    <span class="breadcrumb-separator">›</span>

                    <span class="breadcrumb-current">
                        ${escapeHtml(title)}
                    </span>
                `
                : ""
        }
    `;
}


function openBreadcrumbParent(name) {

    const map = {
        "Getränke": "drinksSaleScreen",
        "Bäckerei": "bakeryMenuScreen",
        "Bearbeiten": "editMenuScreen",
        "Berichte": "reportsScreen",
        "Sonderveranstaltungen": "eventsScreen",
        "Benachrichtigungen": "notificationsScreen"
    };

    if (map[name]) {
        showScreen(map[name]);
    }
}


/* =====================================================================
   AUTHENTICATION
   ===================================================================== */

async function initialiseAuthentication() {

    hideAppHeader();

    try {

        const {
            data
        } =
            await supabaseClient.auth.getSession();

        if (data?.session) {

            const person =
                await loadCurrentPerson(
                    data.session
                );

            if (person) {

                state.session =
                    data.session;

                await completeLogin(
                    person
                );

                return;
            }

            await supabaseClient.auth.signOut();
        }

    } catch (error) {

        console.error(
            "Session konnte nicht geladen werden.",
            error
        );
    }

    await loadLoginPeople();

    showScreen(
        "identityScreen",
        {
            pushHistory: false
        }
    );
}


async function loadLoginPeople() {

    const grid =
        $("peopleGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML =
        `<div class="login-loading">
            Personen werden geladen …
        </div>`;

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "get_login_people"
        );

    if (error) {

        console.error(error);

        grid.innerHTML = "";

        setText(
            "identityError",
            "Die Personen konnten nicht geladen werden."
        );

        return;
    }

    grid.innerHTML = "";

    (data || []).forEach(
        person => {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "person-login-card";

            button.innerHTML = `
                <span class="person-login-icon">
                    ${
                        person.person_type === "lehrer"
                            ? "👨‍🏫"
                            : "👤"
                    }
                </span>

                <span class="person-login-name">
                    ${escapeHtml(fullName(person))}
                </span>

                <span class="person-login-type">
                    ${
                        person.person_type === "lehrer"
                            ? "Lehrkraft"
                            : "Schüler/in"
                    }
                </span>
            `;

            button.addEventListener(
                "click",
                () => selectLoginPerson(person)
            );

            grid.appendChild(button);
        }
    );
}


function selectLoginPerson(person) {

    state.selectedLoginPerson =
        person;

    setText(
        "selectedPersonName",
        fullName(person)
    );

    const pin =
        $("loginPinInput");

    if (pin) {
        pin.value = "";
    }

    setText(
        "pinLoginError",
        ""
    );

    showScreen(
        "pinLoginScreen",
        {
            pushHistory: false
        }
    );

    pin?.focus();
}


async function confirmPinLogin() {

    const person =
        state.selectedLoginPerson;

    const pin =
        $("loginPinInput")?.value.trim();

    if (!person || !pin) {

        setText(
            "pinLoginError",
            "Bitte PIN eingeben."
        );

        return;
    }

    const button =
        $("loginConfirmButton");

    setBusy(button, true);

    try {

        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                "login-with-pin",
                {
                    body: {
                        person_id: person.id,
                        pin
                    }
                }
            );

        if (
            error ||
            !data?.success ||
            !data?.token_hash
        ) {

            throw new Error(
                data?.error ||
                "PIN ist nicht korrekt."
            );
        }

        const {
            data: verifyData,
            error: verifyError
        } =
            await supabaseClient.auth.verifyOtp({
                token_hash: data.token_hash,
                type: data.verification_type
            });

        if (verifyError) {
            throw verifyError;
        }

        state.session =
            verifyData.session;

        const loggedPerson =
            await loadCurrentPerson(
                verifyData.session
            );

        if (!loggedPerson) {
            throw new Error(
                "Person konnte nicht geladen werden."
            );
        }

        await completeLogin(
            loggedPerson
        );

    } catch (error) {

        console.error(error);

        setText(
            "pinLoginError",
            "PIN ist nicht korrekt."
        );

    } finally {

        setBusy(button, false);
    }
}


async function loadCurrentPerson(session) {

    if (!session?.user?.id) {
        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("people")
            .select(
                "id, first_name, last_name, person_type, active, auth_user_id"
            )
            .eq(
                "auth_user_id",
                session.user.id
            )
            .eq(
                "active",
                true
            )
            .maybeSingle();

    if (error) {
        console.error(error);
        return null;
    }

    return data;
}


async function completeLogin(person) {

    state.currentPerson =
        person;

    if (
        person.person_type !== "lehrer" &&
        !studentAccessAllowed()
    ) {

        await supabaseClient.auth.signOut();

        state.currentPerson = null;

        showSchoolClosedScreen();

        return;
    }

    document.body.classList.add(
        "authenticated"
    );

    showAppHeader();

    applyRoleVisibility();

    updateCurrentPersonHeader();

    await Promise.all([
        loadProducts(),
        loadInventory(),
        loadEvents(),
        loadNotifications()
    ]);

    startRealtime();

    goHome();
}


function updateCurrentPersonHeader() {

    setText(
        "currentPersonName",
        fullName(state.currentPerson)
    );

    setText(
        "currentPersonRole",
        isTeacher()
            ? "Lehrkraft"
            : "Schüler/in"
    );

    setText(
        "homeRoleLabel",
        isTeacher()
            ? "Lehrkraft"
            : "Schüler/in"
    );
}


function applyRoleVisibility() {

    all(".teacher-only").forEach(
        element => {
            element.hidden = !isTeacher();
        }
    );

    all(".student-only").forEach(
        element => {
            element.hidden = isTeacher();
        }
    );

    setHidden(
        "homeDrinksTestBadge",
        !isTeacher()
    );

    setHidden(
        "homeBakeryTestBadge",
        !isTeacher()
    );
}


function showAppHeader() {

    const header =
        $("appHeader");

    if (!header) {
        return;
    }

    header.hidden = false;

    header.classList.add(
        "visible"
    );
}


function hideAppHeader() {

    const header =
        $("appHeader");

    if (!header) {
        return;
    }

    header.hidden = true;

    header.classList.remove(
        "visible"
    );
}


async function logout() {

    stopRealtime();

    await supabaseClient.auth.signOut();

    state.session = null;
    state.currentPerson = null;
    state.selectedLoginPerson = null;
    state.screenHistory = [];

    document.body.classList.remove(
        "authenticated"
    );

    hideAppHeader();

    await loadLoginPeople();

    showScreen(
        "identityScreen",
        {
            pushHistory: false
        }
    );
}


/* =====================================================================
   SCHOOL CLOSED
   ===================================================================== */

function showSchoolClosedScreen() {

    hideAppHeader();

    let screen =
        $("schoolClosedScreen");

    if (!screen) {

        screen =
            document.createElement("section");

        screen.id =
            "schoolClosedScreen";

        screen.className =
            "school-closed-screen";

        screen.innerHTML = `
            <div class="school-closed-card">

                <div class="school-closed-icon">
                    🌙
                </div>

                <h1>
                    Deine Website genießt auch ihren Feierabend.
                </h1>

                <p>
                    LauterMacher ist für Schüler außerhalb
                    der Schulzeiten geschlossen.
                </p>

                <small>
                    Aktuell: 09:00 – 15:00 Uhr
                </small>

                <button
                    id="schoolClosedBackButton"
                    class="secondary-action"
                    type="button"
                    style="margin-top:22px"
                >
                    Zur Anmeldung
                </button>

            </div>
        `;

        document.body.appendChild(
            screen
        );

        $("schoolClosedBackButton")
            ?.addEventListener(
                "click",
                async () => {

                    screen.remove();

                    await loadLoginPeople();

                    showScreen(
                        "identityScreen",
                        {
                            pushHistory: false
                        }
                    );
                }
            );
    }

    all(".screen").forEach(
        item => item.style.display = "none"
    );
}


/* =====================================================================
   PRODUCTS
   ===================================================================== */

async function loadProducts() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .order("category")
            .order("name");

    if (error) {
        console.error(error);
        return;
    }

    state.products =
        data || [];

    renderAllProductViews();
}


function renderAllProductViews() {

    renderSaleProducts(
        "drinksProductGrid",
        "getränke",
        state.drinksCart,
        renderDrinksCart
    );

    renderSaleProducts(
        "bakeryProductGrid",
        "bäckerei",
        state.bakeryCart,
        renderBakeryCart
    );

    renderProductAdmin();
    renderStudentInventory();
    renderTeacherInventory();
    renderEventGlobalProductSelect();
}


function renderSaleProducts(
    elementId,
    category,
    cart,
    callback
) {

    const container =
        $(elementId);

    if (!container) {
        return;
    }

    const products =
        activeProducts(category);

    container.innerHTML =
        products.map(
            product => `
                <button
                    type="button"
                    class="product-card"
                    data-sale-product="${escapeHtml(product.id)}"
                    data-sale-cart="${elementId}"
                >
                    <span class="product-icon">
                        ${escapeHtml(product.icon || "🛒")}
                    </span>

                    <span class="product-name">
                        ${escapeHtml(product.name)}
                    </span>

                    <span class="product-price">
                        ${money(product.price)}
                    </span>
                </button>
            `
        ).join("");

    container
        .querySelectorAll(
            "[data-sale-product]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const product =
                            state.products.find(
                                item =>
                                    item.id ===
                                    button.dataset.saleProduct
                            );

                        if (!product) {
                            return;
                        }

                        addProductToCart(
                            cart,
                            product
                        );

                        callback();
                    }
                );
            }
        );
}


function renderProductAdmin() {

    const container =
        $("productAdminList");

    if (!container) {
        return;
    }

    let products =
        state.products.filter(
            product =>
                product.active !== false
        );

    if (
        state.productFilter !== "all"
    ) {

        products =
            products.filter(
                product =>
                    product.category ===
                    state.productFilter
            );
    }

    if (!products.length) {

        container.innerHTML =
            `<div class="empty-state">
                Keine Produkte.
            </div>`;

        return;
    }

    container.innerHTML =
        products.map(
            product => `
                <div class="product-admin-row">

                    <div class="product-admin-icon">
                        ${escapeHtml(product.icon || "🛒")}
                    </div>

                    <div class="product-admin-info">
                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <small>
                            ${escapeHtml(categoryLabel(product.category))}
                        </small>
                    </div>

                    <div class="product-admin-price">
                        ${money(product.price)}
                    </div>

                    <div class="product-admin-actions">

                        <button
                            type="button"
                            class="product-edit-button"
                            data-edit-product="${escapeHtml(product.id)}"
                        >
                            Bearbeiten
                        </button>

                        <button
                            type="button"
                            class="product-delete-button"
                            data-delete-product="${escapeHtml(product.id)}"
                        >
                            Löschen
                        </button>

                    </div>
                </div>
            `
        ).join("");
}


function openProductModal(product = null) {

    const modal =
        $("productModal");

    if (!modal) {
        return;
    }

    modal.hidden = false;

    if ($("productModalTitle")) {
        $("productModalTitle").textContent =
            product
                ? "Produkt bearbeiten"
                : "Produkt hinzufügen";
    }

    if ($("productIdInput")) {
        $("productIdInput").value =
            product?.id || "";
    }

    if ($("productNameInput")) {
        $("productNameInput").value =
            product?.name || "";
    }

    if ($("productPriceInput")) {
        $("productPriceInput").value =
            product?.price ?? "";
    }

    if ($("productCategoryInput")) {
        $("productCategoryInput").value =
            product?.category ||
            "getränke";
    }

    if ($("productIconInput")) {
        $("productIconInput").value =
            product?.icon || "";
    }
}


async function saveProduct(event) {

    event?.preventDefault();

    const existingId =
        $("productIdInput")?.value || null;

    const name =
        $("productNameInput")?.value.trim();

    const price =
        decimal(
            $("productPriceInput")?.value
        );

    const category =
        $("productCategoryInput")?.value;

    const icon =
        $("productIconInput")?.value.trim() ||
        "🛒";

    if (
        !name ||
        !category ||
        price < 0
    ) {

        showToast(
            "Bitte Produktdaten prüfen.",
            "error"
        );

        return;
    }

    try {

        if (existingId) {

            const {
                error
            } =
                await supabaseClient
                    .from("products")
                    .update({
                        name,
                        price,
                        category,
                        icon
                    })
                    .eq(
                        "id",
                        existingId
                    );

            if (error) {
                throw error;
            }

        } else {

            const id =
                `${category}-${Date.now()}`;

            const {
                error
            } =
                await supabaseClient
                    .from("products")
                    .insert({
                        id,
                        name,
                        price,
                        category,
                        icon,
                        active: true
                    });

            if (error) {
                throw error;
            }
        }

        setHidden(
            "productModal",
            true
        );

        await loadProducts();

        showToast(
            "Produkt gespeichert.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Produkt konnte nicht gespeichert werden.",
            "error"
        );
    }
}


async function deleteProduct(productId) {

    const product =
        state.products.find(
            item =>
                item.id === productId
        );

    if (!product) {
        return;
    }

    if (
        !window.confirm(
            `"${product.name}" wirklich löschen?`
        )
    ) {
        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from("products")
            .update({
                active: false
            })
            .eq(
                "id",
                productId
            );

    if (error) {

        console.error(error);

        showToast(
            "Produkt konnte nicht gelöscht werden.",
            "error"
        );

        return;
    }

    await loadProducts();

    showToast(
        "Produkt gelöscht.",
        "success"
    );
}


/* =====================================================================
   CART
   ===================================================================== */

function addProductToCart(
    cart,
    product
) {

    const id =
        product.id;

    if (!cart[id]) {

        cart[id] = {
            id,
            product_id:
                product.product_id ||
                product.id,
            event_product_id:
                product.event_product_id ||
                null,
            name: product.name,
            price: Number(product.price),
            icon: product.icon || "🛒",
            quantity: 0
        };
    }

    cart[id].quantity += 1;
}


function changeCartQuantity(
    cart,
    id,
    difference
) {

    if (!cart[id]) {
        return;
    }

    cart[id].quantity +=
        difference;

    if (
        cart[id].quantity <= 0
    ) {
        delete cart[id];
    }
}


function renderCart(
    containerId,
    totalId,
    payButtonId,
    cart,
    rerender
) {

    const container =
        $(containerId);

    if (!container) {
        return;
    }

    const items =
        Object.values(cart);

    if (!items.length) {

        container.innerHTML =
            `<div class="empty-cart">
                Noch keine Produkte.
            </div>`;

    } else {

        container.innerHTML =
            items.map(
                item => `
                    <div class="cart-item">

                        <div class="cart-product-info">
                            <span class="cart-product-name">
                                ${escapeHtml(item.name)}
                            </span>

                            <span class="cart-product-price">
                                ${money(item.price)}
                            </span>
                        </div>

                        <div class="cart-controls">

                            <button
                                type="button"
                                class="cart-control"
                                data-cart-minus="${escapeHtml(item.id)}"
                            >
                                −
                            </button>

                            <span class="cart-quantity">
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                class="cart-control"
                                data-cart-plus="${escapeHtml(item.id)}"
                            >
                                +
                            </button>

                        </div>

                    </div>
                `
            ).join("");

        container
            .querySelectorAll(
                "[data-cart-minus]"
            )
            .forEach(
                button =>
                    button.addEventListener(
                        "click",
                        () => {

                            changeCartQuantity(
                                cart,
                                button.dataset.cartMinus,
                                -1
                            );

                            rerender();
                        }
                    )
            );

        container
            .querySelectorAll(
                "[data-cart-plus]"
            )
            .forEach(
                button =>
                    button.addEventListener(
                        "click",
                        () => {

                            changeCartQuantity(
                                cart,
                                button.dataset.cartPlus,
                                1
                            );

                            rerender();
                        }
                    )
            );
    }

    const total =
        cartTotal(cart);

    setText(
        totalId,
        money(total)
    );

    const pay =
        $(payButtonId);

    if (pay) {
        pay.disabled = total <= 0;
    }
}


function renderDrinksCart() {

    renderCart(
        "drinksCartItems",
        "drinksCartTotal",
        "drinksPayButton",
        state.drinksCart,
        renderDrinksCart
    );
}


function renderBakeryCart() {

    renderCart(
        "bakeryCartItems",
        "bakeryCartTotal",
        "bakeryPayButton",
        state.bakeryCart,
        renderBakeryCart
    );
}


function renderEventCart() {

    renderCart(
        "eventCartItems",
        "eventCartTotal",
        "eventPayButton",
        state.eventCart,
        renderEventCart
    );
}


/* =====================================================================
   PAYMENT
   ===================================================================== */

function openPayment(area) {

    let cart;
    let screen;
    let totalId;

    if (area === "getränke") {

        cart =
            state.drinksCart;

        screen =
            "drinksPaymentScreen";

        totalId =
            "drinksPaymentTotal";

        state.drinksReceived =
            "0";

    } else if (area === "bäckerei") {

        cart =
            state.bakeryCart;

        screen =
            "bakeryPaymentScreen";

        totalId =
            "bakeryPaymentTotal";

        state.bakeryReceived =
            "0";

    } else {

        cart =
            state.eventCart;

        screen =
            "eventPaymentScreen";

        totalId =
            "eventPaymentTotal";

        state.eventReceived =
            "0";
    }

    if (
        cartTotal(cart) <= 0
    ) {
        return;
    }

    setText(
        totalId,
        money(cartTotal(cart))
    );

    updatePaymentDisplay(area);

    showScreen(screen);
}


function paymentReceived(area) {

    if (area === "getränke") {
        return state.drinksReceived;
    }

    if (area === "bäckerei") {
        return state.bakeryReceived;
    }

    return state.eventReceived;
}


function setPaymentReceived(
    area,
    value
) {

    if (area === "getränke") {
        state.drinksReceived = value;
    } else if (area === "bäckerei") {
        state.bakeryReceived = value;
    } else {
        state.eventReceived = value;
    }
}


function paymentCart(area) {

    if (area === "getränke") {
        return state.drinksCart;
    }

    if (area === "bäckerei") {
        return state.bakeryCart;
    }

    return state.eventCart;
}


function paymentIds(area) {

    if (area === "getränke") {

        return {
            received:
                "drinksAmountReceived",
            change:
                "drinksChangeAmount",
            paid:
                "drinksPaidButton"
        };
    }

    if (area === "bäckerei") {

        return {
            received:
                "bakeryAmountReceived",
            change:
                "bakeryChangeAmount",
            paid:
                "bakeryPaidButton"
        };
    }

    return {
        received:
            "eventAmountReceived",
        change:
            "eventChangeAmount",
        paid:
            "eventPaidButton"
    };
}


function updatePaymentDisplay(area) {

    const total =
        cartTotal(
            paymentCart(area)
        );

    const received =
        decimal(
            paymentReceived(area)
        );

    const change =
        Math.max(
            0,
            received - total
        );

    const ids =
        paymentIds(area);

    setText(
        ids.received,
        money(received)
    );

    setText(
        ids.change,
        money(change)
    );

    const button =
        $(ids.paid);

    if (button) {
        button.disabled =
            received < total;
    }
}


function paymentKey(
    area,
    key
) {

    let current =
        paymentReceived(area);

    if (key === "delete") {

        current =
            current.slice(
                0,
                -1
            );

        if (!current) {
            current = "0";
        }

    } else {

        let cents =
            Math.round(
                decimal(current) *
                100
            );

        cents =
            cents * 10 +
            Number(key);

        current =
            (cents / 100)
                .toFixed(2);
    }

    setPaymentReceived(
        area,
        current
    );

    updatePaymentDisplay(area);
}


/* =====================================================================
   SALES
   ===================================================================== */

async function completeDrinksSale() {

    const total =
        cartTotal(
            state.drinksCart
        );

    const received =
        decimal(
            state.drinksReceived
        );

    if (
        total <= 0 ||
        received < total
    ) {
        return;
    }

    if (isTeacher()) {

        state.drinksCart = {};

        setText(
            "drinksSuccessChange",
            money(received - total)
        );

        showScreen(
            "drinksSuccessScreen"
        );

        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "create_sale_order",
                {
                    p_area: "getränke",
                    p_items:
                        cartToRpcItems(
                            state.drinksCart
                        ),
                    p_payment_amount:
                        received
                }
            );

        if (error) {
            throw error;
        }

        state.drinksCart = {};

        await loadInventory();

        setText(
            "drinksSuccessChange",
            money(received - total)
        );

        showScreen(
            "drinksSuccessScreen"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Verkauf konnte nicht gespeichert werden.",
            "error"
        );
    }
}


async function completeBakerySale() {

    const total =
        cartTotal(
            state.bakeryCart
        );

    const received =
        decimal(
            state.bakeryReceived
        );

    if (
        total <= 0 ||
        received < total
    ) {
        return;
    }

    try {

        let orderNumber;

        if (isTeacher()) {

            orderNumber =
                state.test.bakeryCounter++;

            state.test.bakeryOrders.push({
                id:
                    `test-bakery-${Date.now()}`,
                order_number:
                    orderNumber,
                status:
                    "offen",
                created_at:
                    new Date().toISOString(),
                items:
                    cartToRpcItems(
                        state.bakeryCart
                    )
            });

        } else {

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "create_sale_order",
                    {
                        p_area: "bäckerei",
                        p_items:
                            cartToRpcItems(
                                state.bakeryCart
                            ),
                        p_payment_amount:
                            received
                    }
                );

            if (error) {
                throw error;
            }

            const result =
                unwrapRpc(data);

            orderNumber =
                result?.order_number ??
                result?.orderNumber ??
                data?.order_number ??
                "—";
        }

        state.bakeryCart = {};

        setText(
            "bakerySuccessChange",
            money(received - total)
        );

        setText(
            "bakerySuccessOrderNumber",
            String(orderNumber)
                .padStart(3, "0")
        );

        showScreen(
            "bakerySuccessScreen"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Bestellung konnte nicht gespeichert werden.",
            "error"
        );
    }
}


/* =====================================================================
   BAKERY OUTPUT
   ===================================================================== */

async function loadBakeryOrders() {

    if (isTeacher()) {

        renderBakeryOrders(
            state.test.bakeryOrders
        );

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("orders")
            .select(`
                id,
                order_number,
                status,
                created_at,
                served_at,
                order_items (
                    id,
                    product_name,
                    quantity
                )
            `)
            .eq(
                "area",
                "bäckerei"
            )
            .eq(
                "is_test",
                false
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(60);

    if (error) {

        console.error(error);

        return;
    }

    renderBakeryOrders(
        (data || []).map(
            order => ({
                ...order,
                items:
                    order.order_items || []
            })
        )
    );
}


function renderBakeryOrders(orders) {

    const openContainer =
        $("bakeryOutputOrders");

    const completedContainer =
        $("bakeryCompletedOrders") ||
        $("bakeryFinishedOrders");

    const open =
        orders.filter(
            order =>
                ![
                    "ausgegeben",
                    "fertig",
                    "served"
                ].includes(order.status)
        );

    const completed =
        orders.filter(
            order =>
                [
                    "ausgegeben",
                    "fertig",
                    "served"
                ].includes(order.status)
        );

    setText(
        "bakeryOpenOrderCount",
        String(open.length)
    );

    setText(
        "bakeryCompletedOrderCount",
        String(completed.length)
    );

    if (openContainer) {

        openContainer.innerHTML =
            open.length
                ? open.map(
                    order =>
                        orderCardHtml(
                            order,
                            "bakery"
                        )
                ).join("")
                : `
                    <div class="empty-state">
                        Keine offenen Bestellungen.
                    </div>
                `;
    }

    if (completedContainer) {

        completedContainer.innerHTML =
            completed.length
                ? completed.map(
                    completedOrderHtml
                ).join("")
                : `
                    <div class="empty-state">
                        Noch keine fertigen Bestellungen.
                    </div>
                `;
    }
}


function orderCardHtml(
    order,
    type
) {

    return `
        <div class="output-order-card">

            <strong class="output-order-number">
                ${String(order.order_number).padStart(3, "0")}
            </strong>

            <div class="output-order-items">
                ${
                    (order.items || [])
                        .map(
                            item => `
                                <div class="output-order-item">
                                    ${integer(item.quantity)} ×
                                    ${escapeHtml(item.product_name)}
                                </div>
                            `
                        )
                        .join("")
                }
            </div>

            <button
                type="button"
                class="primary-action"
                data-serve-${type}="${escapeHtml(order.id)}"
            >
                Ausgegeben
            </button>

        </div>
    `;
}


function completedOrderHtml(order) {

    return `
        <div class="completed-order-card">

            <strong>
                #${String(order.order_number).padStart(3, "0")}
            </strong>

            <small>
                ${
                    (order.items || [])
                        .map(
                            item =>
                                `${integer(item.quantity)}× ${escapeHtml(item.product_name)}`
                        )
                        .join(", ")
                }
            </small>

        </div>
    `;
}


async function serveBakeryOrder(orderId) {

    if (isTeacher()) {

        const order =
            state.test.bakeryOrders.find(
                item =>
                    item.id === orderId
            );

        if (order) {
            order.status =
                "ausgegeben";
        }

        renderBakeryOrders(
            state.test.bakeryOrders
        );

        return;
    }

    const {
        error
    } =
        await supabaseClient.rpc(
            "serve_bakery_order",
            {
                p_order_id:
                    orderId,
                order_id:
                    orderId
            }
        );

    /*
       Supabase rejects unknown arguments. Some older DB versions
       use order_id instead of p_order_id. Retry with the legacy
       signature if necessary.
    */
    if (error) {

        const retry =
            await supabaseClient.rpc(
                "serve_bakery_order",
                {
                    order_id:
                        orderId
                }
            );

        if (retry.error) {

            console.error(
                retry.error
            );

            showToast(
                "Bestellung konnte nicht abgeschlossen werden.",
                "error"
            );

            return;
        }
    }

    await loadBakeryOrders();
}


/* =====================================================================
   INVENTORY
   ===================================================================== */

async function loadInventory() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("inventory")
            .select(
                "product_id, quantity, updated_at"
            );

    if (error) {
        console.error(error);
        return;
    }

    state.inventory = {};

    (data || []).forEach(
        item => {

            state.inventory[
                item.product_id
            ] =
                integer(item.quantity);
        }
    );

    renderStudentInventory();
    renderTeacherInventory();
}


function renderStudentInventory() {

    const container =
        $("studentInventoryList");

    if (!container) {
        return;
    }

    container.innerHTML =
        activeProducts("getränke")
            .map(
                product => `
                    <div class="inventory-count-row">

                        <div class="inventory-count-product">
                            <div class="inventory-icon">
                                ${escapeHtml(product.icon || "🥤")}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHtml(product.name)}
                                </strong>

                                <small>
                                    Digitaler Bestand:
                                    ${integer(state.inventory[product.id])}
                                </small>
                            </div>
                        </div>

                        <input
                            class="inventory-count-input"
                            type="number"
                            min="0"
                            inputmode="numeric"
                            data-student-inventory="${escapeHtml(product.id)}"
                            placeholder="0"
                        >

                    </div>
                `
            ).join("");
}


async function submitStudentInventory() {

    const items =
        all("[data-student-inventory]")
            .map(
                input => ({
                    product_id:
                        input.dataset.studentInventory,
                    quantity:
                        integer(input.value)
                })
            );

    if (!items.length) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "submit_inventory_count",
                {
                    p_items: items,
                    p_context:
                        "getränke",
                    p_event_id:
                        null,
                    p_inventory_type:
                        "daily"
                }
            );

        if (error) {
            throw error;
        }

        showToast(
            "Inventur an Lehrer geschickt.",
            "success"
        );

        goHome();

    } catch (error) {

        console.error(error);

        showToast(
            "Inventur konnte nicht gesendet werden.",
            "error"
        );
    }
}


function renderTeacherInventory() {

    const container =
        $("teacherInventoryList");

    if (!container) {
        return;
    }

    container.innerHTML =
        activeProducts("getränke")
            .map(
                product => `
                    <div class="teacher-inventory-row">

                        <div class="teacher-inventory-product">

                            <div class="inventory-icon">
                                ${escapeHtml(product.icon || "🥤")}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHtml(product.name)}
                                </strong>

                                <small>
                                    Aktueller Bestand
                                </small>
                            </div>

                        </div>

                        <div class="inventory-current-stock">
                            <small>Bestand</small>
                            <strong>
                                ${integer(state.inventory[product.id])}
                            </strong>
                        </div>

                        <input
                            type="number"
                            min="0"
                            class="inventory-add-input"
                            data-stock-add="${escapeHtml(product.id)}"
                            placeholder="Menge hinzufügen"
                        >

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            class="inventory-price-input"
                            data-stock-price="${escapeHtml(product.id)}"
                            placeholder="Einkaufspreis €"
                        >

                        <button
                            type="button"
                            class="primary-action"
                            data-stock-save="${escapeHtml(product.id)}"
                        >
                            Hinzufügen
                        </button>

                    </div>
                `
            ).join("");
}


async function teacherAddStock(
    productId
) {

    if (!isTeacher()) {
        return;
    }

    const quantity =
        integer(
            document.querySelector(
                `[data-stock-add="${CSS.escape(productId)}"]`
            )?.value
        );

    const purchasePriceInput =
        document.querySelector(
            `[data-stock-price="${CSS.escape(productId)}"]`
        );

    const purchasePrice =
        purchasePriceInput?.value
            ? decimal(
                purchasePriceInput.value
            )
            : null;

    if (quantity <= 0) {

        showToast(
            "Bitte Menge eingeben.",
            "error"
        );

        return;
    }

    const {
        error
    } =
        await supabaseClient.rpc(
            "teacher_add_stock",
            {
                p_product_id:
                    productId,
                p_quantity:
                    quantity,
                p_invoice_id:
                    state.currentInventoryInvoiceId,
                p_purchase_price:
                    purchasePrice
            }
        );

    if (error) {

        console.error(error);

        showToast(
            "Bestand konnte nicht geändert werden.",
            "error"
        );

        return;
    }

    await loadInventory();

    showToast(
        "Bestand aktualisiert.",
        "success"
    );
}


/* =====================================================================
   INVENTORY SUBMISSIONS
   ===================================================================== */

async function loadInventorySubmissions() {

    if (!isTeacher()) {
        return;
    }

    const container =
        $("inventorySubmissionsList");

    if (!container) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "inventory_submissions"
            )
            .select(`
                *,
                people:submitted_by (
                    first_name,
                    last_name
                ),
                inventory_submission_items (
                    *
                )
            `)
            .eq(
                "status",
                "eingereicht"
            )
            .order(
                "submitted_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(error);

        return;
    }

    if (!data?.length) {

        container.innerHTML = `
            <div class="empty-state">
                Keine offenen Inventurvorschläge.
            </div>
        `;

        return;
    }

    container.innerHTML =
        data.map(
            submission => `
                <div class="inventory-submission-card">

                    <div>
                        <strong>
                            ${escapeHtml(
                                fullName(
                                    submission.people
                                ) ||
                                "Schüler/in"
                            )}
                        </strong>

                        <small>
                            ${
                                submission.submitted_at
                                    ? new Date(
                                        submission.submitted_at
                                    ).toLocaleString("de-DE")
                                    : ""
                            }
                        </small>
                    </div>

                    <span class="submission-status">
                        Vorschlag
                    </span>

                    <button
                        type="button"
                        class="secondary-action"
                        data-review-submission="${escapeHtml(submission.id)}"
                    >
                        Prüfen
                    </button>

                </div>
            `
        ).join("");

    data.forEach(
        submission => {

            const button =
                container.querySelector(
                    `[data-review-submission="${CSS.escape(submission.id)}"]`
                );

            button?.addEventListener(
                "click",
                () =>
                    renderInventoryReview(
                        submission
                    )
            );
        }
    );
}


function renderInventoryReview(
    submission
) {

    let container =
        $("inventoryReview");

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "inventoryReview";

        container.className =
            "content-card";

        $("inventorySubmissionsList")
            ?.parentElement
            ?.appendChild(container);
    }

    const items =
        submission.inventory_submission_items ||
        [];

    container.innerHTML = `
        <div class="section-heading">
            <div>
                <h2>
                    Inventurvorschlag
                </h2>

                <p>
                    ${escapeHtml(
                        fullName(
                            submission.people
                        )
                    )}
                </p>
            </div>
        </div>

        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Produkt</th>
                        <th>Digital</th>
                        <th>Vorschlag Schüler</th>
                        <th>Differenz</th>
                    </tr>
                </thead>

                <tbody>
                    ${
                        items.map(
                            item => {

                                const digital =
                                    integer(
                                        state.inventory[
                                            item.product_id
                                        ]
                                    );

                                const proposed =
                                    integer(
                                        item.quantity
                                    );

                                const difference =
                                    proposed - digital;

                                const differenceClass =
                                    difference > 0
                                        ? "positive"
                                        : difference < 0
                                            ? "negative"
                                            : "equal";

                                return `
                                    <tr>
                                        <td>
                                            ${escapeHtml(item.product_name)}
                                        </td>

                                        <td>
                                            ${digital}
                                        </td>

                                        <td>
                                            ${proposed}
                                        </td>

                                        <td class="inventory-difference ${differenceClass}">
                                            ${
                                                difference > 0
                                                    ? "+"
                                                    : ""
                                            }${difference}
                                        </td>
                                    </tr>
                                `;
                            }
                        ).join("")
                    }
                </tbody>
            </table>
        </div>

        <div class="review-actions">

            <button
                type="button"
                class="danger-action"
                data-reject-inventory="${escapeHtml(submission.id)}"
            >
                Ablehnen
            </button>

            <button
                type="button"
                class="primary-action"
                data-accept-inventory="${escapeHtml(submission.id)}"
            >
                Inventur übernehmen
            </button>

        </div>
    `;

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


async function resolveInventorySubmission(
    submissionId,
    accept
) {

    if (!isTeacher()) {
        return;
    }

    /*
       LM_V2_01 kann hierfür eine atomare RPC bereitstellen.
       Zuerst verwenden wir diese. Falls die Installation noch
       die V1-Struktur verwendet, wird sauber abgebrochen statt
       Bestände unsicher direkt zu überschreiben.
    */

    const candidates =
        accept
            ? [
                "accept_inventory_submission",
                "teacher_accept_inventory_submission"
            ]
            : [
                "reject_inventory_submission",
                "teacher_reject_inventory_submission"
            ];

    let lastError = null;

    for (const functionName of candidates) {

        const {
            error
        } =
            await supabaseClient.rpc(
                functionName,
                {
                    p_submission_id:
                        submissionId
                }
            );

        if (!error) {

            await Promise.all([
                loadInventory(),
                loadInventorySubmissions(),
                loadNotifications()
            ]);

            $("inventoryReview")
                ?.remove();

            showToast(
                accept
                    ? "Inventur übernommen."
                    : "Inventur abgelehnt.",
                "success"
            );

            return;
        }

        lastError =
            error;
    }

    console.error(lastError);

    showToast(
        "Inventur konnte nicht verarbeitet werden.",
        "error"
    );
}


/* =====================================================================
   FREE DRINKS
   ===================================================================== */

function renderFreeDrinks() {

    const container =
        $("freeDrinksList");

    if (!container) {
        return;
    }

    container.innerHTML =
        activeProducts("getränke")
            .map(
                product => `
                    <div class="quantity-product-row">

                        <div class="quantity-product-info">
                            <span>
                                ${escapeHtml(product.icon || "🥤")}
                            </span>

                            <strong>
                                ${escapeHtml(product.name)}
                            </strong>
                        </div>

                        <div class="quantity-controls">

                            <button
                                type="button"
                                class="cart-control"
                                data-free-minus="${escapeHtml(product.id)}"
                            >
                                −
                            </button>

                            <strong
                                data-free-count="${escapeHtml(product.id)}"
                            >
                                0
                            </strong>

                            <button
                                type="button"
                                class="cart-control"
                                data-free-plus="${escapeHtml(product.id)}"
                            >
                                +
                            </button>

                        </div>

                    </div>
                `
            ).join("");
}


function changeFreeDrink(
    productId,
    delta
) {

    const count =
        document.querySelector(
            `[data-free-count="${CSS.escape(productId)}"]`
        );

    if (!count) {
        return;
    }

    count.textContent =
        Math.max(
            0,
            integer(count.textContent) +
            delta
        );
}


async function saveFreeDrinks() {

    if (isTeacher()) {

        goHome();

        return;
    }

    const items =
        all("[data-free-count]")
            .map(
                element => ({
                    product_id:
                        element.dataset.freeCount,
                    quantity:
                        integer(
                            element.textContent
                        )
                })
            )
            .filter(
                item =>
                    item.quantity > 0
            );

    if (items.length) {

        const {
            error
        } =
            await supabaseClient.rpc(
                "record_free_drinks",
                {
                    p_items: items,
                    p_context:
                        state.currentEvent
                            ? "sonderveranstaltung"
                            : "getränke",
                    p_event_id:
                        state.currentEvent?.id ||
                        null
                }
            );

        if (error) {

            console.error(error);

            showToast(
                "Kostenlose Getränke konnten nicht gespeichert werden.",
                "error"
            );

            return;
        }
    }

    await loadInventory();

    goHome();
}


/* =====================================================================
   INVOICES
   ===================================================================== */

async function openInvoices() {

    if (!isTeacher()) {
        return;
    }

    showScreen(
        "invoicesScreen"
    );

    const date =
        $("invoiceDateInput");

    if (
        date &&
        !date.value
    ) {
        date.value =
            todayISO();
    }

    await Promise.all([
        refreshInvoiceNumber(),
        loadInvoices(),
        populateInvoiceEvents()
    ]);
}


async function refreshInvoiceNumber() {

    const input =
        $("invoiceNumberInput");

    if (!input) {
        return;
    }

    /*
       V2 uses Rechnung_01, Rechnung_02 ... Rechnung_100 ...
       The final number is generated transactionally by Supabase.
    */

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "preview_next_invoice_number",
            {
                p_invoice_date:
                    $("invoiceDateInput")?.value ||
                    todayISO()
            }
        );

    if (!error && data) {

        const raw =
            String(
                unwrapRpc(data)
            );

        if (
            raw.startsWith("Rechnung_")
        ) {

            input.value =
                raw;

        } else {

            const match =
                raw.match(
                    /(\d+)$/
                );

            input.value =
                match
                    ? `Rechnung_${String(Number(match[1])).padStart(2, "0")}`
                    : raw;
        }
    }
}


async function loadInvoices() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("invoices")
            .select(`
                id,
                invoice_number,
                context,
                event_id,
                invoice_date,
                supplier,
                total_amount,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    state.invoices =
        data || [];

    const container =
        $("latestInvoicesList");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.invoices.length
            ? state.invoices.map(
                invoice => `
                    <div class="invoice-row">

                        <div>
                            <strong>
                                ${escapeHtml(invoice.invoice_number || "Rechnung")}
                            </strong>

                            <small>
                                ${escapeHtml(invoice.invoice_date || "")}
                                ·
                                ${escapeHtml(invoice.supplier || "—")}
                            </small>
                        </div>

                        <strong class="invoice-amount">
                            ${money(invoice.total_amount)}
                        </strong>

                    </div>
                `
            ).join("")
            : `
                <div class="empty-state">
                    Noch keine Rechnungen.
                </div>
            `;
}


async function populateInvoiceEvents() {

    const select =
        $("invoiceEventSelect");

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">
            Veranstaltung wählen …
        </option>`;

    state.events.forEach(
        event => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                event.id;

            option.textContent =
                `${event.name} · ${event.event_date}`;

            select.appendChild(option);
        }
    );

    const other =
        document.createElement(
            "option"
        );

    other.value =
        "__new__";

    other.textContent =
        "Andere Veranstaltung";

    select.appendChild(other);
}


async function saveInvoice(event) {

    event.preventDefault();

    if (!isTeacher()) {
        return;
    }

    const context =
        $("invoiceContextSelect")?.value;

    const invoiceDate =
        $("invoiceDateInput")?.value;

    const supplier =
        $("invoiceSupplierInput")?.value.trim();

    const total =
        decimal(
            $("invoiceTotalInput")?.value
        );

    const eventId =
        context === "sonderveranstaltung"
            ? $("invoiceEventSelect")?.value
            : null;

    if (
        !context ||
        !invoiceDate ||
        total < 0
    ) {

        showToast(
            "Bitte Rechnungsdaten prüfen.",
            "error"
        );

        return;
    }

    if (eventId === "__new__") {

        showScreen(
            "eventTypeScreen"
        );

        showToast(
            "Bitte zuerst die Veranstaltung erstellen.",
            "info"
        );

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "create_invoice_with_number",
            {
                p_context:
                    context,
                p_invoice_date:
                    invoiceDate,
                p_supplier:
                    supplier || null,
                p_total_amount:
                    total,
                p_created_by:
                    null,
                p_event_id:
                    eventId || null
            }
        );

    if (error) {

        console.error(error);

        showToast(
            "Rechnung konnte nicht gespeichert werden.",
            "error"
        );

        return;
    }

    const result =
        unwrapRpc(data);

    showToast(
        "Rechnung gespeichert.",
        "success"
    );

    $("invoiceForm")?.reset();

    if ($("invoiceDateInput")) {
        $("invoiceDateInput").value =
            todayISO();
    }

    await loadInvoices();

    await refreshInvoiceNumber();

    if (context === "getränke") {

        state.currentInventoryInvoiceId =
            result?.id ||
            result?.invoice_id ||
            null;

        showScreen(
            "teacherInventoryScreen"
        );

        await loadInventory();
    }
}


/* =====================================================================
   STUDENTS
   ===================================================================== */

async function loadStudents() {

    if (!isTeacher()) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "get_login_people"
        );

    if (error) {
        console.error(error);
        return;
    }

    state.students =
        (data || []).filter(
            person =>
                person.person_type !==
                "lehrer"
        );

    const container =
        $("studentsList");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.students.map(
            student => `
                <div class="student-row">

                    <div>
                        <strong>
                            ${escapeHtml(fullName(student))}
                        </strong>
                    </div>

                    <div class="admin-product-actions">

                        <button
                            type="button"
                            class="product-edit-button"
                            data-edit-student="${escapeHtml(student.id)}"
                        >
                            Bearbeiten
                        </button>

                        <button
                            type="button"
                            class="product-delete-button"
                            data-delete-student="${escapeHtml(student.id)}"
                        >
                            Löschen
                        </button>

                    </div>

                </div>
            `
        ).join("");
}


function openStudentModal(
    student = null
) {

    setHidden(
        "studentModal",
        false
    );

    setText(
        "studentModalTitle",
        student
            ? "Schüler bearbeiten"
            : "Schüler hinzufügen"
    );

    if ($("studentIdInput")) {
        $("studentIdInput").value =
            student?.id || "";
    }

    if ($("studentFirstNameInput")) {
        $("studentFirstNameInput").value =
            student?.first_name || "";
    }

    if ($("studentLastNameInput")) {
        $("studentLastNameInput").value =
            student?.last_name || "";
    }

    if ($("studentNumberInput")) {
        $("studentNumberInput").value =
            student?.student_number || "";
    }

    if ($("studentPinInput")) {
        $("studentPinInput").value =
            "";
    }
}


async function saveStudent(event) {

    event.preventDefault();

    if (!isTeacher()) {
        return;
    }

    const id =
        $("studentIdInput")?.value;

    const firstName =
        $("studentFirstNameInput")?.value.trim();

    const lastName =
        $("studentLastNameInput")?.value.trim();

    const studentNumber =
        $("studentNumberInput")?.value.trim();

    const pin =
        $("studentPinInput")?.value.trim();

    if (!firstName) {

        showToast(
            "Vorname fehlt.",
            "error"
        );

        return;
    }

    let response;

    if (id) {

        response =
            await supabaseClient.rpc(
                "teacher_update_student",
                {
                    p_student_id:
                        id,
                    p_first_name:
                        firstName,
                    p_last_name:
                        lastName || null,
                    p_student_number:
                        studentNumber || null,
                    p_pin:
                        pin || null
                }
            );

    } else {

        if (!pin) {

            showToast(
                "Bitte PIN festlegen.",
                "error"
            );

            return;
        }

        response =
            await supabaseClient.rpc(
                "teacher_create_student",
                {
                    p_first_name:
                        firstName,
                    p_last_name:
                        lastName || null,
                    p_student_number:
                        studentNumber || null,
                    p_pin:
                        pin
                }
            );
    }

    if (response.error) {

        console.error(
            response.error
        );

        showToast(
            "Schüler konnte nicht gespeichert werden.",
            "error"
        );

        return;
    }

    setHidden(
        "studentModal",
        true
    );

    await loadStudents();

    showToast(
        "Schüler gespeichert.",
        "success"
    );
}


async function deleteStudent(id) {

    if (!isTeacher()) {
        return;
    }

    if (
        !window.confirm(
            "Schüler wirklich löschen?"
        )
    ) {
        return;
    }

    const {
        error
    } =
        await supabaseClient.rpc(
            "teacher_deactivate_student",
            {
                p_student_id:
                    id
            }
        );

    if (error) {

        console.error(error);

        showToast(
            "Schüler konnte nicht gelöscht werden.",
            "error"
        );

        return;
    }

    await loadStudents();

    showToast(
        "Schüler gelöscht.",
        "success"
    );
}


/* =====================================================================
   EVENTS
   ===================================================================== */

async function loadEvents() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("events")
            .select("*")
            .order(
                "event_date",
                {
                    ascending: true
                }
            );

    if (error) {
        console.error(error);
        return;
    }

    state.events =
        data || [];

    renderEvents();
}


function renderEvents() {

    const upcoming =
        $("upcomingEventsList");

    const past =
        $("pastEventsList");

    const currentEvents =
        state.events.filter(
            event =>
                !isPastEvent(event) &&
                event.status !==
                "abgeschlossen"
        );

    const pastEvents =
        state.events
            .filter(
                event =>
                    isPastEvent(event) ||
                    event.status ===
                    "abgeschlossen"
            )
            .sort(
                (a, b) =>
                    String(b.event_date)
                        .localeCompare(
                            String(a.event_date)
                        )
            )
            .slice(0, 5);

    if (upcoming) {

        upcoming.innerHTML =
            currentEvents.length
                ? currentEvents
                    .map(eventCardHtml)
                    .join("")
                : `
                    <div class="empty-state">
                        Keine kommenden Veranstaltungen.
                    </div>
                `;
    }

    if (past) {

        past.innerHTML =
            pastEvents.length
                ? pastEvents
                    .map(eventCardHtml)
                    .join("")
                : `
                    <div class="empty-state">
                        Noch keine vergangenen Veranstaltungen.
                    </div>
                `;
    }
}


function eventCardHtml(event) {

    return `
        <button
            type="button"
            class="event-list-card"
            data-open-event="${escapeHtml(event.id)}"
        >

            <div class="event-list-main">

                <span class="event-list-icon">
                    ${
                        event.event_type === "other"
                            ? "🎟️"
                            : "🍴"
                    }
                </span>

                <div>
                    <strong>
                        ${escapeHtml(event.name)}
                    </strong>

                    <small>
                        ${escapeHtml(event.event_date || "")}
                        ·
                        ${escapeHtml(eventTypeLabel(event.event_type))}
                    </small>
                </div>

            </div>

            <span class="home-menu-arrow">
                ›
            </span>

        </button>
    `;
}


async function openEvent(
    eventId
) {

    state.currentEvent =
        state.events.find(
            event =>
                event.id === eventId
        ) || null;

    if (!state.currentEvent) {
        return;
    }

    setText(
        "eventWorkspaceTitle",
        state.currentEvent.name
    );

    setText(
        "eventWorkspaceDate",
        state.currentEvent.event_date || ""
    );

    setText(
        "eventWorkspaceType",
        eventTypeLabel(
            state.currentEvent.event_type
        )
    );

    const food =
        state.currentEvent.event_type !==
        "other";

    setHidden(
        "eventFoodWorkspace",
        !food
    );

    setHidden(
        "eventOtherWorkspace",
        food
    );

    if (!food) {

        setText(
            "eventOtherRevenueAmount",
            money(
                state.currentEvent.direct_revenue
            )
        );
    }

    showScreen(
        "eventWorkspaceScreen"
    );
}


async function createEvent(event) {

    event.preventDefault();

    if (!isTeacher()) {
        return;
    }

    const name =
        $("eventNameInput")?.value.trim();

    const date =
        $("eventDateInput")?.value;

    const note =
        $("eventNoteInput")?.value.trim();

    const type =
        $("eventTypeInput")?.value ||
        "food";

    const revenue =
        decimal(
            $("eventDirectRevenueInput")?.value
        );

    if (!name || !date) {

        showToast(
            "Name und Datum fehlen.",
            "error"
        );

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "create_special_event",
            {
                p_name:
                    name,
                p_event_date:
                    date,
                p_event_type:
                    type,
                p_note:
                    note || null,
                p_direct_revenue:
                    type === "other"
                        ? revenue
                        : 0
            }
        );

    if (error) {

        console.error(error);

        showToast(
            "Veranstaltung konnte nicht erstellt werden.",
            "error"
        );

        return;
    }

    await loadEvents();

    const result =
        unwrapRpc(data);

    const createdId =
        result?.id ||
        result?.event_id;

    if (createdId) {

        await openEvent(
            createdId
        );

    } else {

        showScreen(
            "eventsScreen"
        );
    }
}


/* =====================================================================
   EVENT PRODUCTS
   ===================================================================== */

async function loadEventProducts() {

    if (!state.currentEvent) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("event_products")
            .select("*")
            .eq(
                "event_id",
                state.currentEvent.id
            )
            .order("name");

    if (error) {
        console.error(error);
        return;
    }

    state.eventProducts =
        data || [];

    renderEventProducts();
    renderEventSaleProducts();
}


function renderEventGlobalProductSelect() {

    const select =
        $("eventGlobalProductSelect");

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">
            Produkt wählen …
        </option>`;

    activeProducts()
        .forEach(
            product => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    product.id;

                option.textContent =
                    `${product.icon || "🛒"} ${product.name} · ${money(product.price)}`;

                select.appendChild(option);
            }
        );
}


function renderEventProducts() {

    const container =
        $("eventProductsList");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.eventProducts.length
            ? state.eventProducts.map(
                product => `
                    <div class="product-admin-row">

                        <div class="product-admin-icon">
                            ${escapeHtml(product.icon || "🎪")}
                        </div>

                        <div class="product-admin-info">
                            <strong>
                                ${escapeHtml(product.name)}
                            </strong>
                        </div>

                        <div class="product-admin-price">
                            ${money(product.price)}
                        </div>

                    </div>
                `
            ).join("")
            : `
                <div class="empty-state">
                    Noch keine Produkte.
                </div>
            `;
}


async function addGlobalProductToEvent(
    productId
) {

    const product =
        state.products.find(
            item =>
                item.id === productId
        );

    if (
        !product ||
        !state.currentEvent
    ) {
        return;
    }

    const {
        error
    } =
        await supabaseClient.rpc(
            "upsert_event_product",
            {
                p_event_id:
                    state.currentEvent.id,
                p_product_id:
                    product.id,
                p_name:
                    product.name,
                p_price:
                    Number(product.price),
                p_icon:
                    product.icon || "🛒"
            }
        );

    if (error) {

        console.error(error);

        showToast(
            "Produkt konnte nicht hinzugefügt werden.",
            "error"
        );

        return;
    }

    await loadEventProducts();
}


async function addAllDrinksToEvent() {

    if (!state.currentEvent) {
        return;
    }

    const drinks =
        activeProducts(
            "getränke"
        );

    for (const product of drinks) {

        const {
            error
        } =
            await supabaseClient.rpc(
                "upsert_event_product",
                {
                    p_event_id:
                        state.currentEvent.id,
                    p_product_id:
                        product.id,
                    p_name:
                        product.name,
                    p_price:
                        Number(product.price),
                    p_icon:
                        product.icon || "🥤"
                }
            );

        if (error) {

            console.error(error);

            showToast(
                "Nicht alle Getränke konnten hinzugefügt werden.",
                "error"
            );

            return;
        }
    }

    await loadEventProducts();

    showToast(
        "Alle Getränke hinzugefügt.",
        "success"
    );
}


function renderEventSaleProducts() {

    const container =
        $("eventProductGrid") ||
        $("eventSaleProductGrid");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.eventProducts.map(
            product => `
                <button
                    type="button"
                    class="product-card"
                    data-event-sale-product="${escapeHtml(product.id)}"
                >
                    <span class="product-icon">
                        ${escapeHtml(product.icon || "🎪")}
                    </span>

                    <span class="product-name">
                        ${escapeHtml(product.name)}
                    </span>

                    <span class="product-price">
                        ${money(product.price)}
                    </span>
                </button>
            `
        ).join("");
}


/* =====================================================================
   EVENT SALES / OUTPUT
   ===================================================================== */

async function completeEventSale() {

    if (!state.currentEvent) {
        return;
    }

    const total =
        cartTotal(
            state.eventCart
        );

    const received =
        decimal(
            state.eventReceived
        );

    if (
        total <= 0 ||
        received < total
    ) {
        return;
    }

    let orderNumber;

    try {

        if (isTeacher()) {

            orderNumber =
                state.test.eventCounter++;

            state.test.eventOrders.push({
                id:
                    `test-event-${Date.now()}`,
                event_id:
                    state.currentEvent.id,
                order_number:
                    orderNumber,
                status:
                    "offen",
                created_at:
                    new Date().toISOString(),
                items:
                    cartToRpcItems(
                        state.eventCart
                    )
            });

        } else {

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "create_event_sale_order",
                    {
                        p_event_id:
                            state.currentEvent.id,
                        p_items:
                            cartToRpcItems(
                                state.eventCart
                            ),
                        p_payment_amount:
                            received
                    }
                );

            if (error) {
                throw error;
            }

            const result =
                unwrapRpc(data);

            orderNumber =
                result?.order_number ??
                result?.orderNumber ??
                "—";
        }

        state.eventCart = {};

        setText(
            "eventSuccessOrderNumber",
            String(orderNumber)
                .padStart(3, "0")
        );

        showScreen(
            "eventSuccessScreen"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Bestellung konnte nicht gespeichert werden.",
            "error"
        );
    }
}


async function loadEventOrders() {

    if (!state.currentEvent) {
        return;
    }

    if (isTeacher()) {

        renderEventOrders(
            state.test.eventOrders.filter(
                order =>
                    order.event_id ===
                    state.currentEvent.id
            )
        );

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("event_orders")
            .select(`
                id,
                event_id,
                order_number,
                status,
                created_at,
                served_at,
                event_order_items (
                    id,
                    product_name,
                    quantity
                )
            `)
            .eq(
                "event_id",
                state.currentEvent.id
            )
            .eq(
                "is_test",
                false
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {
        console.error(error);
        return;
    }

    renderEventOrders(
        (data || []).map(
            order => ({
                ...order,
                items:
                    order.event_order_items ||
                    []
            })
        )
    );
}


function renderEventOrders(orders) {

    const openContainer =
        $("eventOutputOrders");

    const completedContainer =
        $("eventCompletedOrders") ||
        $("eventFinishedOrders");

    const open =
        orders.filter(
            order =>
                ![
                    "ausgegeben",
                    "fertig",
                    "served"
                ].includes(order.status)
        );

    const completed =
        orders.filter(
            order =>
                [
                    "ausgegeben",
                    "fertig",
                    "served"
                ].includes(order.status)
        );

    setText(
        "eventOpenOrderCount",
        String(open.length)
    );

    setText(
        "eventCompletedOrderCount",
        String(completed.length)
    );

    if (openContainer) {

        openContainer.innerHTML =
            open.length
                ? open.map(
                    order =>
                        orderCardHtml(
                            order,
                            "event"
                        )
                ).join("")
                : `
                    <div class="empty-state">
                        Keine offenen Bestellungen.
                    </div>
                `;
    }

    if (completedContainer) {

        completedContainer.innerHTML =
            completed.length
                ? completed.map(
                    completedOrderHtml
                ).join("")
                : `
                    <div class="empty-state">
                        Noch keine fertigen Bestellungen.
                    </div>
                `;
    }
}


async function serveEventOrder(
    orderId
) {

    if (isTeacher()) {

        const order =
            state.test.eventOrders.find(
                item =>
                    item.id === orderId
            );

        if (order) {
            order.status =
                "ausgegeben";
        }

        await loadEventOrders();

        return;
    }

    const {
        error
    } =
        await supabaseClient.rpc(
            "serve_event_order",
            {
                p_order_id:
                    orderId
            }
        );

    if (error) {

        const retry =
            await supabaseClient.rpc(
                "serve_event_order",
                {
                    order_id:
                        orderId
                }
            );

        if (retry.error) {

            console.error(
                retry.error
            );

            showToast(
                "Bestellung konnte nicht abgeschlossen werden.",
                "error"
            );

            return;
        }
    }

    await loadEventOrders();
}


/* =====================================================================
   EVENT END INVENTORY
   ===================================================================== */

function renderEventEndInventory() {

    const container =
        $("eventEndInventoryList");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.eventProducts.map(
            product => `
                <div class="event-inventory-editor-row">

                    <div>
                        <strong>
                            ${escapeHtml(product.icon || "🎪")}
                            ${escapeHtml(product.name)}
                        </strong>
                    </div>

                    <input
                        type="number"
                        min="0"
                        inputmode="numeric"
                        data-event-end-inventory="${escapeHtml(product.id)}"
                        placeholder="0"
                    >

                </div>
            `
        ).join("");
}


async function saveEventEndInventory() {

    if (!state.currentEvent) {
        return;
    }

    const items =
        all("[data-event-end-inventory]")
            .map(
                input => ({
                    event_product_id:
                        input.dataset.eventEndInventory,
                    quantity:
                        integer(input.value)
                })
            );

    /*
       Endinventur gehört zur echten Veranstaltungsverwaltung.
       Deshalb darf auch der Lehrer sie speichern.
       Testmodus gilt nur für Kasse/Ausgabe.
    */

    const {
        error
    } =
        await supabaseClient.rpc(
            "submit_event_end_inventory",
            {
                p_event_id:
                    state.currentEvent.id,
                p_items:
                    items
            }
        );

    if (error) {

        console.error(error);

        showToast(
            "Endinventur konnte nicht gespeichert werden.",
            "error"
        );

        return;
    }

    showToast(
        "Endinventur gespeichert.",
        "success"
    );

    await loadEvents();

    showScreen(
        "eventsScreen"
    );
}


/* =====================================================================
   OTHER EVENT REVENUE
   ===================================================================== */

async function saveOtherEventRevenue(
    amount
) {

    if (
        !isTeacher() ||
        !state.currentEvent
    ) {
        return;
    }

    const {
        error
    } =
        await supabaseClient.rpc(
            "update_other_event_revenue",
            {
                p_event_id:
                    state.currentEvent.id,
                p_direct_revenue:
                    decimal(amount)
            }
        );

    if (error) {

        console.error(error);

        showToast(
            "Umsatz konnte nicht gespeichert werden.",
            "error"
        );

        return;
    }

    await loadEvents();

    showToast(
        "Umsatz gespeichert.",
        "success"
    );
}


/* =====================================================================
   NOTIFICATIONS
   ===================================================================== */

async function loadNotifications() {

    if (!state.currentPerson) {
        return;
    }

    /*
       RLS decides which notifications this person may read.
    */

    const {
        data,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(100);

    if (error) {

        console.error(error);

        return;
    }

    state.notifications =
        data || [];

    renderNotifications();
}


function renderNotifications() {

    const unread =
        state.notifications.filter(
            notification =>
                !notification.read_at
        );

    setText(
        "notificationCount",
        String(unread.length)
    );

    setHidden(
        "notificationCount",
        unread.length === 0
    );

    const preview =
        $("notificationPreviewList");

    if (preview) {

        if (!state.notifications.length) {

            preview.innerHTML = `
                <div class="notification-popover-empty">
                    Keine Benachrichtigungen.
                </div>
            `;

        } else {

            preview.innerHTML =
                state.notifications
                    .slice(0, 5)
                    .map(
                        notification =>
                            notificationHtml(
                                notification,
                                true
                            )
                    )
                    .join("");
        }
    }

    const full =
        $("notificationsList");

    if (full) {

        full.innerHTML =
            state.notifications.length
                ? state.notifications
                    .map(
                        notification =>
                            notificationHtml(
                                notification,
                                false
                            )
                    )
                    .join("")
                : `
                    <div class="empty-state">
                        Keine Benachrichtigungen.
                    </div>
                `;
    }
}


function notificationHtml(
    notification,
    preview
) {

    return `
        <button
            type="button"
            class="${
                preview
                    ? "notification-preview-item"
                    : "notification-item"
            } ${
                notification.read_at
                    ? ""
                    : "unread"
            }"
            data-notification="${escapeHtml(notification.id)}"
        >

            <strong>
                ${escapeHtml(notification.title || "Benachrichtigung")}
            </strong>

            ${
                notification.message
                    ? `
                        <p>
                            ${escapeHtml(notification.message)}
                        </p>
                    `
                    : ""
            }

            <small>
                ${
                    notification.created_at
                        ? new Date(
                            notification.created_at
                        ).toLocaleString("de-DE")
                        : ""
                }
            </small>

        </button>
    `;
}


async function openNotification(
    notificationId
) {

    const notification =
        state.notifications.find(
            item =>
                item.id ===
                notificationId
        );

    if (!notification) {
        return;
    }

    if (!notification.read_at) {

        const {
            error
        } =
            await supabaseClient.rpc(
                "mark_notification_read",
                {
                    p_notification_id:
                        notification.id
                }
            );

        if (!error) {
            notification.read_at =
                new Date().toISOString();
        }
    }

    setHidden(
        "notificationPopover",
        true
    );

    renderNotifications();

    const target =
        String(
            notification.link_target ||
            ""
        ).toLowerCase();

    if (
        target.includes("invent")
    ) {

        showScreen(
            isTeacher()
                ? "teacherInventoryScreen"
                : "studentInventoryScreen"
        );

        if (isTeacher()) {

            await Promise.all([
                loadInventory(),
                loadInventorySubmissions()
            ]);
        }

        return;
    }

    if (
        target.includes("event") ||
        target.includes("veranstaltung")
    ) {

        showScreen(
            "eventsScreen"
        );

        await loadEvents();

        return;
    }

    if (
        target.includes("rechnung")
    ) {

        await openInvoices();

        return;
    }

    showScreen(
        "notificationsScreen"
    );
}


/* =====================================================================
   TEACHER SEND NOTIFICATIONS
   ===================================================================== */

async function ensureTeacherNotificationComposer() {

    if (!isTeacher()) {
        return;
    }

    const screen =
        $("notificationsScreen");

    if (
        !screen ||
        $("teacherNotificationComposer")
    ) {
        return;
    }

    if (!state.students.length) {
        await loadStudents();
    }

    const composer =
        document.createElement(
            "div"
        );

    composer.id =
        "teacherNotificationComposer";

    composer.className =
        "teacher-notification-composer";

    composer.innerHTML = `
        <h2>
            Benachrichtigung senden
        </h2>

        <p>
            An einzelne, mehrere oder alle Schüler.
        </p>

        <div class="notification-recipient-controls">

            <button
                type="button"
                class="notification-recipient-toggle active"
                data-notification-mode="all"
            >
                Alle Schüler
            </button>

            <button
                type="button"
                class="notification-recipient-toggle"
                data-notification-mode="selected"
            >
                Auswahl
            </button>

        </div>

        <div
            id="notificationStudentPicker"
            class="notification-student-picker"
            hidden
        >
            ${
                state.students.map(
                    student => `
                        <label class="notification-student-check">

                            <input
                                type="checkbox"
                                value="${escapeHtml(student.id)}"
                                data-notification-student
                            >

                            <span>
                                ${escapeHtml(fullName(student))}
                            </span>

                        </label>
                    `
                ).join("")
            }
        </div>

        <label class="form-field">
            <span>Titel</span>

            <input
                id="teacherNotificationTitle"
                type="text"
                maxlength="120"
                placeholder="Titel"
            >
        </label>

        <label class="form-field">
            <span>Nachricht</span>

            <textarea
                id="teacherNotificationMessage"
                maxlength="1000"
                placeholder="Nachricht"
            ></textarea>
        </label>

        <button
            id="sendTeacherNotificationButton"
            type="button"
            class="primary-action"
        >
            Senden
        </button>
    `;

    const content =
        screen.querySelector(
            ".admin-content, .content-card, .notifications-content"
        );

    if (content) {

        content.prepend(
            composer
        );

    } else {

        screen.appendChild(
            composer
        );
    }
}


async function sendTeacherNotification() {

    if (!isTeacher()) {
        return;
    }

    const title =
        $("teacherNotificationTitle")
            ?.value.trim();

    const message =
        $("teacherNotificationMessage")
            ?.value.trim();

    const selectedMode =
        document.querySelector(
            ".notification-recipient-toggle.active"
        )?.dataset.notificationMode ||
        "all";

    if (!title) {

        showToast(
            "Bitte Titel eingeben.",
            "error"
        );

        return;
    }

    let recipients = [];

    if (selectedMode === "selected") {

        recipients =
            all(
                "[data-notification-student]:checked"
            ).map(
                checkbox =>
                    checkbox.value
            );

        if (!recipients.length) {

            showToast(
                "Bitte mindestens einen Schüler auswählen.",
                "error"
            );

            return;
        }
    }

    /*
       LM_V2_01: first try the secure teacher RPC.
       The fallback insert is still protected by Supabase RLS.
    */

    let rpcResult =
        await supabaseClient.rpc(
            "teacher_send_notification",
            {
                p_recipient_ids:
                    selectedMode === "all"
                        ? null
                        : recipients,
                p_title:
                    title,
                p_message:
                    message || null,
                p_link_target:
                    null
            }
        );

    if (rpcResult.error) {

        const rows =
            selectedMode === "all"
                ? [{
                    recipient_person_id:
                        null,
                    recipient_type:
                        "student",
                    notification_type:
                        "teacher_message",
                    title,
                    message:
                        message || null,
                    link_target:
                        null,
                    created_by:
                        state.currentPerson.id
                }]
                : recipients.map(
                    personId => ({
                        recipient_person_id:
                            personId,
                        recipient_type:
                            null,
                        notification_type:
                            "teacher_message",
                        title,
                        message:
                            message || null,
                        link_target:
                            null,
                        created_by:
                            state.currentPerson.id
                    })
                );

        const insert =
            await supabaseClient
                .from("notifications")
                .insert(rows);

        if (insert.error) {

            console.error(
                rpcResult.error,
                insert.error
            );

            showToast(
                "Benachrichtigung konnte nicht gesendet werden.",
                "error"
            );

            return;
        }
    }

    if ($("teacherNotificationTitle")) {
        $("teacherNotificationTitle").value = "";
    }

    if ($("teacherNotificationMessage")) {
        $("teacherNotificationMessage").value = "";
    }

    all(
        "[data-notification-student]"
    ).forEach(
        checkbox =>
            checkbox.checked = false
    );

    showToast(
        "Benachrichtigung gesendet.",
        "success"
    );
}


/* =====================================================================
   REPORTS
   ===================================================================== */

function reportDateRange(period) {

    const now =
        new Date();

    const end =
        new Date();

    let start =
        new Date(now);

    if (period === "today") {

        start.setHours(
            0, 0, 0, 0
        );

    } else if (period === "week") {

        const day =
            (start.getDay() + 6) % 7;

        start.setDate(
            start.getDate() -
            day
        );

        start.setHours(
            0, 0, 0, 0
        );

    } else if (period === "month") {

        start =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

    } else {

        const year =
            now.getMonth() >= 8
                ? now.getFullYear()
                : now.getFullYear() - 1;

        start =
            new Date(
                year,
                8,
                1
            );
    }

    return {
        start:
            start.toISOString(),
        end:
            end.toISOString()
    };
}


async function loadReports() {

    if (!isTeacher()) {
        return;
    }

    const range =
        reportDateRange(
            state.reportPeriod
        );

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "report_sales_lines_v1"
            )
            .select("*")
            .gte(
                "sold_at",
                range.start
            )
            .lte(
                "sold_at",
                range.end
            );

    if (error) {

        console.error(error);

        showToast(
            "Berichte konnten nicht geladen werden.",
            "error"
        );

        return;
    }

    await renderReports(
        data || []
    );
}


async function renderReports(lines) {

    let revenue = 0;
    let costs = 0;
    let profit = 0;
    let drinksRevenue = 0;
    let bakeryRevenue = 0;
    let quantity = 0;

    let hasUnknownCosts = false;

    const products = {};

    lines.forEach(
        line => {

            const lineRevenue =
                decimal(
                    line.revenue ??
                    line.total_price
                );

            const lineCostRaw =
                line.estimated_cost ??
                line.cost;

            const knownCost =
                lineCostRaw !== null &&
                lineCostRaw !== undefined;

            const lineCost =
                knownCost
                    ? decimal(lineCostRaw)
                    : 0;

            const lineQuantity =
                integer(
                    line.quantity
                );

            revenue +=
                lineRevenue;

            quantity +=
                lineQuantity;

            if (knownCost) {
                costs += lineCost;
            } else if (
                line.area !== "bäckerei"
            ) {
                hasUnknownCosts = true;
            }

            if (
                line.area === "getränke"
            ) {

                drinksRevenue +=
                    lineRevenue;

                if (knownCost) {

                    profit +=
                        lineRevenue -
                        lineCost;
                }

            } else if (
                line.area === "bäckerei"
            ) {

                bakeryRevenue +=
                    lineRevenue;

            } else {

                if (knownCost) {

                    profit +=
                        lineRevenue -
                        lineCost;
                }
            }

            const key =
                line.product_id ||
                line.product_name;

            if (!products[key]) {

                products[key] = {
                    name:
                        line.product_name ||
                        "Produkt",
                    icon:
                        line.icon ||
                        "🛒",
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                    quantity: 0,
                    knownCost: true
                };
            }

            products[key].revenue +=
                lineRevenue;

            products[key].quantity +=
                lineQuantity;

            if (knownCost) {

                products[key].cost +=
                    lineCost;

                if (
                    line.area !==
                    "bäckerei"
                ) {

                    products[key].profit +=
                        lineRevenue -
                        lineCost;
                }

            } else {

                products[key].knownCost =
                    false;
            }
        }
    );

    setText(
        "reportRevenueValue",
        money(revenue)
    );

    setText(
        "reportCostsValue",
        hasUnknownCosts
            ? `${money(costs)}*`
            : money(costs)
    );

    setText(
        "reportProfitValue",
        hasUnknownCosts
            ? `${money(profit)}*`
            : money(profit)
    );

    setText(
        "reportDrinksValue",
        money(drinksRevenue)
    );

    setText(
        "reportBakeryValue",
        money(bakeryRevenue)
    );

    setText(
        "reportSalesCountValue",
        String(quantity)
    );

    setText(
        "reportsCurrentDate",
        new Date().toLocaleDateString(
            "de-DE"
        )
    );

    const productList =
        Object.values(products);

    const top =
        [...productList]
            .sort(
                (a, b) =>
                    b.quantity -
                    a.quantity
            )[0];

    setText(
        "topProductIcon",
        top?.icon || "—"
    );

    setText(
        "topProductName",
        top?.name || "—"
    );

    renderReportProductTable(
        productList
    );

    await renderSchoolYearChart();
}


function renderReportProductTable(
    products
) {

    const body =
        $("reportProductTableBody");

    if (!body) {
        return;
    }

    const sort =
        state.reportSort;

    products.sort(
        (a, b) => {

            if (sort === "profit") {
                return b.profit - a.profit;
            }

            if (sort === "quantity") {
                return b.quantity - a.quantity;
            }

            return b.revenue - a.revenue;
        }
    );

    body.innerHTML =
        products.map(
            product => {

                const globalProduct =
                    state.products.find(
                        item =>
                            item.name ===
                            product.name
                    );

                const stock =
                    globalProduct
                        ? state.inventory[
                            globalProduct.id
                        ]
                        : null;

                return `
                    <tr>
                        <td>
                            ${escapeHtml(product.icon)}
                            ${escapeHtml(product.name)}
                        </td>

                        <td>
                            ${
                                stock === null ||
                                stock === undefined
                                    ? "—"
                                    : integer(stock)
                            }
                        </td>

                        <td>
                            ${product.quantity}
                        </td>

                        <td>
                            ${money(product.revenue)}
                        </td>

                        <td>
                            ${
                                product.knownCost
                                    ? money(product.cost)
                                    : "—"
                            }
                        </td>

                        <td>
                            ${
                                product.knownCost
                                    ? money(product.profit)
                                    : "—"
                            }
                        </td>
                    </tr>
                `;
            }
        ).join("");
}


async function renderSchoolYearChart() {

    const container =
        $("schoolYearProfitChart");

    if (!container) {
        return;
    }

    const now =
        new Date();

    const schoolYear =
        now.getMonth() >= 8
            ? now.getFullYear()
            : now.getFullYear() - 1;

    const start =
        new Date(
            schoolYear,
            8,
            1
        );

    const end =
        new Date(
            schoolYear + 1,
            7,
            1
        );

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "report_sales_lines_v1"
            )
            .select("*")
            .gte(
                "sold_at",
                start.toISOString()
            )
            .lt(
                "sold_at",
                end.toISOString()
            );

    if (error) {

        console.error(error);

        return;
    }

    const months = [];

    for (
        let i = 0;
        i < 11;
        i += 1
    ) {

        const date =
            new Date(
                schoolYear,
                8 + i,
                1
            );

        months.push({
            year:
                date.getFullYear(),
            month:
                date.getMonth(),
            label:
                date.toLocaleDateString(
                    "de-DE",
                    {
                        month: "short",
                        year: "2-digit"
                    }
                )
                    .replace(".", ""),
            value: 0
        });
    }

    (data || []).forEach(
        line => {

            if (
                line.area ===
                "bäckerei"
            ) {
                return;
            }

            const date =
                new Date(
                    line.sold_at
                );

            const target =
                months.find(
                    month =>
                        month.year ===
                            date.getFullYear() &&
                        month.month ===
                            date.getMonth()
                );

            if (!target) {
                return;
            }

            const revenue =
                decimal(
                    line.revenue ??
                    line.total_price
                );

            const rawCost =
                line.estimated_cost ??
                line.cost;

            if (
                rawCost === null ||
                rawCost === undefined
            ) {
                return;
            }

            target.value +=
                revenue -
                decimal(rawCost);
        }
    );

    const maximum =
        Math.max(
            1,
            ...months.map(
                month =>
                    Math.abs(month.value)
            )
        );

    container.innerHTML = `
        <div class="profit-chart-inner">

            ${
                months.map(
                    month => {

                        const height =
                            Math.max(
                                4,
                                Math.round(
                                    Math.abs(
                                        month.value
                                    ) /
                                    maximum *
                                    100
                                )
                            );

                        return `
                            <div class="profit-chart-column">

                                <div class="profit-chart-bar-wrap">

                                    <div
                                        class="profit-chart-bar ${
                                            month.value >= 0
                                                ? "positive"
                                                : "negative"
                                        }"
                                        style="height:${height}%"
                                    >

                                        <span class="profit-chart-value">
                                            ${money(month.value)}
                                        </span>

                                    </div>

                                </div>

                                <span class="profit-chart-label">
                                    ${escapeHtml(month.label)}
                                </span>

                            </div>
                        `;
                    }
                ).join("")
            }

        </div>
    `;
}


/* =====================================================================
   EXCEL EXPORT
   ===================================================================== */

async function exportReportsExcel() {

    if (!window.XLSX) {

        await new Promise(
            (resolve, reject) => {

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

                script.onload =
                    resolve;

                script.onerror =
                    reject;

                document.head.appendChild(
                    script
                );
            }
        );
    }

    const range =
        reportDateRange(
            "schoolyear"
        );

    const [
        salesResponse,
        invoicesResponse
    ] =
        await Promise.all([

            supabaseClient
                .from(
                    "report_sales_lines_v1"
                )
                .select("*")
                .gte(
                    "sold_at",
                    range.start
                ),

            supabaseClient
                .from("invoices")
                .select("*")
                .gte(
                    "invoice_date",
                    range.start.slice(0, 10)
                )
        ]);

    if (
        salesResponse.error ||
        invoicesResponse.error
    ) {

        console.error(
            salesResponse.error,
            invoicesResponse.error
        );

        showToast(
            "Excel-Export fehlgeschlagen.",
            "error"
        );

        return;
    }

    const workbook =
        XLSX.utils.book_new();

    const salesSheet =
        XLSX.utils.json_to_sheet(
            salesResponse.data || []
        );

    const invoicesSheet =
        XLSX.utils.json_to_sheet(
            invoicesResponse.data || []
        );

    const inventorySheet =
        XLSX.utils.json_to_sheet(
            activeProducts(
                "getränke"
            ).map(
                product => ({
                    Produkt:
                        product.name,
                    Bestand:
                        integer(
                            state.inventory[
                                product.id
                            ]
                        )
                })
            )
        );

    XLSX.utils.book_append_sheet(
        workbook,
        salesSheet,
        "Verkäufe"
    );

    XLSX.utils.book_append_sheet(
        workbook,
        invoicesSheet,
        "Rechnungen"
    );

    XLSX.utils.book_append_sheet(
        workbook,
        inventorySheet,
        "Bestand"
    );

    XLSX.writeFile(
        workbook,
        `LauterMacher_Bericht_${todayISO()}.xlsx`
    );
}


/* =====================================================================
   REALTIME
   ===================================================================== */

function startRealtime() {

    stopRealtime();

    state.realtimeChannel =
        supabaseClient.channel(
            `lautermacher-v2-${state.currentPerson.id}`
        );

    const tables = [
        "products",
        "inventory",
        "orders",
        "order_items",
        "events",
        "event_products",
        "event_inventory",
        "event_orders",
        "event_order_items",
        "inventory_submissions",
        "inventory_submission_items",
        "invoices",
        "invoice_items",
        "employee_free_drinks",
        "notifications"
    ];

    tables.forEach(
        table => {

            state.realtimeChannel.on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table
                },
                payload =>
                    handleRealtime(
                        table,
                        payload
                    )
            );
        }
    );

    state.realtimeChannel.subscribe();
}


function stopRealtime() {

    if (!state.realtimeChannel) {
        return;
    }

    supabaseClient.removeChannel(
        state.realtimeChannel
    );

    state.realtimeChannel =
        null;
}


async function handleRealtime(
    table
) {

    try {

        if (table === "products") {
            await loadProducts();
        }

        if (table === "inventory") {
            await loadInventory();
        }

        if (
            table === "orders" ||
            table === "order_items"
        ) {

            if (
                state.currentScreenId ===
                "bakeryOutputScreen" &&
                !isTeacher()
            ) {

                await loadBakeryOrders();
            }
        }

        if (
            table === "event_orders" ||
            table === "event_order_items"
        ) {

            if (
                state.currentScreenId ===
                "eventOutputScreen" &&
                !isTeacher()
            ) {

                await loadEventOrders();
            }
        }

        if (
            table === "events"
        ) {

            await loadEvents();
        }

        if (
            table === "event_products" &&
            state.currentEvent
        ) {

            await loadEventProducts();
        }

        if (
            table === "notifications"
        ) {

            await loadNotifications();
        }

        if (
            (
                table ===
                    "inventory_submissions" ||
                table ===
                    "inventory_submission_items"
            ) &&
            isTeacher() &&
            state.currentScreenId ===
                "teacherInventoryScreen"
        ) {

            await loadInventorySubmissions();
        }

        if (
            (
                table === "invoices" ||
                table === "invoice_items"
            ) &&
            isTeacher() &&
            state.currentScreenId ===
                "invoicesScreen"
        ) {

            await loadInvoices();
        }

    } catch (error) {

        console.error(
            "Realtime refresh:",
            error
        );
    }
}


/* =====================================================================
   EVENT LIST — DATE REFRESH
   ===================================================================== */

function refreshEventDateClassification() {

    if (
        state.currentPerson &&
        state.events.length
    ) {

        renderEvents();
    }
}


/* =====================================================================
   GENERIC CLICK HANDLER
   ===================================================================== */

document.addEventListener(
    "click",
    async event => {

        const target =
            event.target.closest(
                "button, [data-action]"
            );

        if (!target) {
            return;
        }


        /* ---------------------------------------------------------
           GLOBAL NAV
           --------------------------------------------------------- */

        if (
            target.id ===
            "homeLogoButton"
        ) {
            goHome();
            return;
        }

        if (
            target.matches(
                "[data-breadcrumb-home]"
            )
        ) {
            goHome();
            return;
        }

        if (
            target.dataset.breadcrumbParent
        ) {

            openBreadcrumbParent(
                target.dataset.breadcrumbParent
            );

            return;
        }

        if (
            target.classList.contains(
                "back-button"
            )
        ) {

            goBack();
            return;
        }


        /* ---------------------------------------------------------
           LOGIN
           --------------------------------------------------------- */

        if (
            target.id ===
            "loginBackButton"
        ) {

            state.selectedLoginPerson =
                null;

            showScreen(
                "identityScreen",
                {
                    pushHistory: false
                }
            );

            return;
        }

        if (
            target.id ===
            "loginConfirmButton"
        ) {

            await confirmPinLogin();

            return;
        }

        if (
            target.id ===
            "logoutButton"
        ) {

            await logout();

            return;
        }


        /* ---------------------------------------------------------
           HOME
           --------------------------------------------------------- */

        const homeMap = {

            homeDrinksButton:
                "drinksSaleScreen",

            homeBakeryButton:
                "bakeryMenuScreen",

            homeEditButton:
                "editMenuScreen",

            homeReportsButton:
                "reportsScreen",

            homeEventsButton:
                "eventsScreen"
        };

        if (homeMap[target.id]) {

            const screen =
                homeMap[target.id];

            if (
                screen ===
                "drinksSaleScreen"
            ) {

                state.drinksCart = {};

                renderDrinksCart();

                renderSaleProducts(
                    "drinksProductGrid",
                    "getränke",
                    state.drinksCart,
                    renderDrinksCart
                );
            }

            if (
                screen ===
                "reportsScreen"
            ) {
                await loadReports();
            }

            if (
                screen ===
                "eventsScreen"
            ) {
                await loadEvents();
            }

            showScreen(screen);

            return;
        }


        /* ---------------------------------------------------------
           BAKERY
           --------------------------------------------------------- */

        if (
            [
                "bakeryCashButton",
                "bakeryKasseButton"
            ].includes(target.id)
        ) {

            state.bakeryCart = {};

            renderBakeryCart();

            showScreen(
                "bakerySaleScreen"
            );

            return;
        }

        if (
            [
                "bakeryOutputButton",
                "bakeryAusgabeButton"
            ].includes(target.id)
        ) {

            showScreen(
                "bakeryOutputScreen"
            );

            await loadBakeryOrders();

            return;
        }

        if (
            target.dataset.serveBakery
        ) {

            await serveBakeryOrder(
                target.dataset.serveBakery
            );

            return;
        }


        /* ---------------------------------------------------------
           PAYMENT
           --------------------------------------------------------- */

        if (
            target.id ===
            "drinksPayButton"
        ) {

            openPayment("getränke");
            return;
        }

        if (
            target.id ===
            "bakeryPayButton"
        ) {

            openPayment("bäckerei");
            return;
        }

        if (
            target.id ===
            "eventPayButton"
        ) {

            openPayment("event");
            return;
        }

        const paymentKeyButton =
            target.closest(
                "[data-payment-key]"
            );

        if (paymentKeyButton) {

            const area =
                paymentKeyButton.closest(
                    "[data-payment-area]"
                )?.dataset.paymentArea ||
                (
                    state.currentScreenId.includes(
                        "drinks"
                    )
                        ? "getränke"
                        : state.currentScreenId.includes(
                            "bakery"
                        )
                            ? "bäckerei"
                            : "event"
                );

            paymentKey(
                area,
                paymentKeyButton.dataset.paymentKey
            );

            return;
        }

        if (
            target.id ===
            "drinksPaidButton"
        ) {

            await completeDrinksSale();
            return;
        }

        if (
            target.id ===
            "bakeryPaidButton"
        ) {

            await completeBakerySale();
            return;
        }

        if (
            target.id ===
            "eventPaidButton"
        ) {

            await completeEventSale();
            return;
        }


        /* ---------------------------------------------------------
           NEW ORDER
           --------------------------------------------------------- */

        if (
            target.id ===
            "drinksNewOrderButton"
        ) {

            state.drinksCart = {};
            renderDrinksCart();

            showScreen(
                "drinksSaleScreen"
            );

            return;
        }

        if (
            target.id ===
            "bakeryNewOrderButton"
        ) {

            state.bakeryCart = {};
            renderBakeryCart();

            showScreen(
                "bakerySaleScreen"
            );

            return;
        }

        if (
            target.id ===
            "eventNewOrderButton"
        ) {

            state.eventCart = {};
            renderEventCart();

            showScreen(
                "eventSaleScreen"
            );

            return;
        }


        /* ---------------------------------------------------------
           SHIFT END
           --------------------------------------------------------- */

        if (
            [
                "drinksShiftEndButton",
                "drinksSuccessShiftEndButton",
                "eventShiftEndButton",
                "eventCashShiftEndButton"
            ].includes(target.id)
        ) {

            renderFreeDrinks();

            showScreen(
                "freeDrinksScreen"
            );

            return;
        }

        if (
            target.id ===
            "freeDrinksNoneButton"
        ) {

            goHome();
            return;
        }

        if (
            target.id ===
            "freeDrinksSaveButton"
        ) {

            await saveFreeDrinks();
            return;
        }

        if (
            target.dataset.freeMinus
        ) {

            changeFreeDrink(
                target.dataset.freeMinus,
                -1
            );

            return;
        }

        if (
            target.dataset.freePlus
        ) {

            changeFreeDrink(
                target.dataset.freePlus,
                1
            );

            return;
        }


        /* ---------------------------------------------------------
           EDIT MENU
           --------------------------------------------------------- */

        const editMap = {

            editProductsButton:
                "productsScreen",

            editInvoicesButton:
                "invoicesScreen",

            editInventoryButton:
                isTeacher()
                    ? "teacherInventoryScreen"
                    : "studentInventoryScreen",

            editStudentsButton:
                "studentsScreen"
        };

        if (editMap[target.id]) {

            const screen =
                editMap[target.id];

            if (
                screen ===
                "invoicesScreen"
            ) {

                await openInvoices();

                return;
            }

            if (
                screen ===
                "teacherInventoryScreen"
            ) {

                state.currentInventoryInvoiceId =
                    null;

                await Promise.all([
                    loadInventory(),
                    loadInventorySubmissions()
                ]);
            }

            if (
                screen ===
                "studentsScreen"
            ) {

                await loadStudents();
            }

            showScreen(screen);

            return;
        }


        /* ---------------------------------------------------------
           PRODUCTS
           --------------------------------------------------------- */

        if (
            target.id ===
            "addProductButton"
        ) {

            openProductModal();

            return;
        }

        if (
            target.dataset.editProduct
        ) {

            const product =
                state.products.find(
                    item =>
                        item.id ===
                        target.dataset.editProduct
                );

            openProductModal(product);

            return;
        }

        if (
            target.dataset.deleteProduct
        ) {

            await deleteProduct(
                target.dataset.deleteProduct
            );

            return;
        }


        /* ---------------------------------------------------------
           INVENTORY
           --------------------------------------------------------- */

        if (
            target.id ===
            "submitStudentInventoryButton"
        ) {

            await submitStudentInventory();

            return;
        }

        if (
            target.dataset.stockSave
        ) {

            await teacherAddStock(
                target.dataset.stockSave
            );

            return;
        }

        if (
            target.dataset.acceptInventory
        ) {

            await resolveInventorySubmission(
                target.dataset.acceptInventory,
                true
            );

            return;
        }

        if (
            target.dataset.rejectInventory
        ) {

            await resolveInventorySubmission(
                target.dataset.rejectInventory,
                false
            );

            return;
        }


        /* ---------------------------------------------------------
           STUDENTS
           --------------------------------------------------------- */

        if (
            target.id ===
            "addStudentButton"
        ) {

            openStudentModal();

            return;
        }

        if (
            target.dataset.editStudent
        ) {

            const student =
                state.students.find(
                    item =>
                        item.id ===
                        target.dataset.editStudent
                );

            openStudentModal(student);

            return;
        }

        if (
            target.dataset.deleteStudent
        ) {

            await deleteStudent(
                target.dataset.deleteStudent
            );

            return;
        }


        /* ---------------------------------------------------------
           EVENTS
           --------------------------------------------------------- */

        if (
            target.id ===
            "createEventButton"
        ) {

            showScreen(
                "eventTypeScreen"
            );

            return;
        }

        if (
            target.dataset.eventType
        ) {

            if ($("eventTypeInput")) {
                $("eventTypeInput").value =
                    target.dataset.eventType;
            }

            showScreen(
                "eventCreateScreen"
            );

            return;
        }

        if (
            target.dataset.openEvent
        ) {

            await openEvent(
                target.dataset.openEvent
            );

            return;
        }

        if (
            [
                "eventProductsButton",
                "eventWorkspaceProductsButton"
            ].includes(target.id)
        ) {

            await loadEventProducts();

            showScreen(
                "eventProductsScreen"
            );

            return;
        }

        if (
            [
                "eventCashButton",
                "eventWorkspaceCashButton"
            ].includes(target.id)
        ) {

            await loadEventProducts();

            state.eventCart = {};

            renderEventCart();

            showScreen(
                "eventSaleScreen"
            );

            return;
        }

        if (
            [
                "eventOutputButton",
                "eventWorkspaceOutputButton"
            ].includes(target.id)
        ) {

            showScreen(
                "eventOutputScreen"
            );

            await loadEventOrders();

            return;
        }

        if (
            [
                "eventEndInventoryButton",
                "eventWorkspaceEndInventoryButton"
            ].includes(target.id)
        ) {

            await loadEventProducts();

            renderEventEndInventory();

            showScreen(
                "eventEndInventoryScreen"
            );

            return;
        }

        if (
            target.id ===
            "addSelectedEventProductButton"
        ) {

            const productId =
                $("eventGlobalProductSelect")
                    ?.value;

            if (productId) {

                await addGlobalProductToEvent(
                    productId
                );
            }

            return;
        }

        if (
            target.id ===
            "addAllDrinksToEventButton"
        ) {

            await addAllDrinksToEvent();

            return;
        }

        if (
            [
                "eventProductsDoneButton",
                "eventProductsContinueButton",
                "eventProductsBackToEventButton"
            ].includes(target.id)
        ) {

            showScreen(
                "eventWorkspaceScreen"
            );

            return;
        }

        if (
            target.dataset.eventSaleProduct
        ) {

            const product =
                state.eventProducts.find(
                    item =>
                        item.id ===
                        target.dataset.eventSaleProduct
                );

            if (product) {

                addProductToCart(
                    state.eventCart,
                    {
                        ...product,
                        event_product_id:
                            product.id,
                        id:
                            product.id
                    }
                );

                renderEventCart();
            }

            return;
        }

        if (
            target.dataset.serveEvent
        ) {

            await serveEventOrder(
                target.dataset.serveEvent
            );

            return;
        }

        if (
            target.id ===
            "saveEventEndInventoryButton"
        ) {

            await saveEventEndInventory();

            return;
        }


        /* ---------------------------------------------------------
           NOTIFICATIONS
           --------------------------------------------------------- */

        if (
            target.id ===
            "notificationButton"
        ) {

            const popover =
                $("notificationPopover");

            if (popover) {

                popover.hidden =
                    !popover.hidden;

                target.setAttribute(
                    "aria-expanded",
                    String(!popover.hidden)
                );
            }

            return;
        }

        if (
            target.id ===
            "closeNotificationPopoverButton"
        ) {

            setHidden(
                "notificationPopover",
                true
            );

            return;
        }

        if (
            target.id ===
            "showAllNotificationsButton"
        ) {

            setHidden(
                "notificationPopover",
                true
            );

            showScreen(
                "notificationsScreen"
            );

            await ensureTeacherNotificationComposer();

            return;
        }

        if (
            target.dataset.notification
        ) {

            await openNotification(
                target.dataset.notification
            );

            return;
        }

        if (
            target.dataset.notificationMode
        ) {

            all(
                ".notification-recipient-toggle"
            ).forEach(
                button =>
                    button.classList.remove(
                        "active"
                    )
            );

            target.classList.add(
                "active"
            );

            setHidden(
                "notificationStudentPicker",
                target.dataset.notificationMode !==
                    "selected"
            );

            return;
        }

        if (
            target.id ===
            "sendTeacherNotificationButton"
        ) {

            await sendTeacherNotification();

            return;
        }


        /* ---------------------------------------------------------
           REPORTS
           --------------------------------------------------------- */

        if (
            target.dataset.reportPeriod
        ) {

            state.reportPeriod =
                target.dataset.reportPeriod;

            all(
                "[data-report-period]"
            ).forEach(
                button =>
                    button.classList.toggle(
                        "active",
                        button === target
                    )
            );

            await loadReports();

            return;
        }

        if (
            target.dataset.reportSort
        ) {

            state.reportSort =
                target.dataset.reportSort;

            all(
                "[data-report-sort]"
            ).forEach(
                button =>
                    button.classList.toggle(
                        "active",
                        button === target
                    )
            );

            await loadReports();

            return;
        }

        if (
            target.id ===
            "exportReportsButton"
        ) {

            await exportReportsExcel();

            return;
        }


        /* ---------------------------------------------------------
           MODALS
           --------------------------------------------------------- */

        if (
            target.dataset.closeModal
        ) {

            const modal =
                target.closest(
                    ".modal-overlay"
                );

            if (modal) {
                modal.hidden = true;
            }

            return;
        }
    }
);


/* =====================================================================
   FORM HANDLERS
   ===================================================================== */

document.addEventListener(
    "submit",
    async event => {

        if (
            event.target.id ===
            "productForm"
        ) {

            await saveProduct(event);
            return;
        }

        if (
            event.target.id ===
            "invoiceForm"
        ) {

            await saveInvoice(event);
            return;
        }

        if (
            event.target.id ===
            "studentForm"
        ) {

            await saveStudent(event);
            return;
        }

        if (
            event.target.id ===
            "eventCreateForm"
        ) {

            await createEvent(event);
            return;
        }
    }
);


/* =====================================================================
   CHANGE HANDLERS
   ===================================================================== */

document.addEventListener(
    "change",
    async event => {

        const target =
            event.target;

        if (
            target.id ===
            "invoiceDateInput"
        ) {

            await refreshInvoiceNumber();
        }

        if (
            target.id ===
            "invoiceContextSelect"
        ) {

            const isEvent =
                target.value ===
                "sonderveranstaltung";

            setHidden(
                "invoiceEventField",
                !isEvent
            );
        }
    }
);


/* =====================================================================
   FILTER BUTTONS
   ===================================================================== */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-product-filter]"
            );

        if (!button) {
            return;
        }

        state.productFilter =
            button.dataset.productFilter;

        all(
            "[data-product-filter]"
        ).forEach(
            item =>
                item.classList.toggle(
                    "active",
                    item === button
                )
        );

        renderProductAdmin();
    }
);


/* =====================================================================
   KEYBOARD LOGIN
   ===================================================================== */

$("loginPinInput")
    ?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                confirmPinLogin();
            }
        }
    );


/* =====================================================================
   EVENT PRODUCT MODAL
   ===================================================================== */

$("eventProductForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (!state.currentEvent) {
                return;
            }

            const name =
                $("eventProductNameInput")
                    ?.value.trim();

            const price =
                decimal(
                    $("eventProductPriceInput")
                        ?.value
                );

            const icon =
                $("eventProductIconInput")
                    ?.value.trim() ||
                "🎪";

            if (!name) {

                showToast(
                    "Produktname fehlt.",
                    "error"
                );

                return;
            }

            const {
                error
            } =
                await supabaseClient.rpc(
                    "upsert_event_product",
                    {
                        p_event_id:
                            state.currentEvent.id,
                        p_product_id:
                            null,
                        p_name:
                            name,
                        p_price:
                            price,
                        p_icon:
                            icon
                    }
                );

            if (error) {

                console.error(error);

                showToast(
                    "Produkt konnte nicht gespeichert werden.",
                    "error"
                );

                return;
            }

            setHidden(
                "eventProductModal",
                true
            );

            event.target.reset();

            await loadEventProducts();

            showToast(
                "Produkt hinzugefügt.",
                "success"
            );
        }
    );


/* =====================================================================
   OTHER EVENT REVENUE MODAL
   ===================================================================== */

$("otherEventRevenueForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveOtherEventRevenue(
                $("otherEventRevenueInput")
                    ?.value
            );

            setHidden(
                "otherEventRevenueModal",
                true
            );
        }
    );


/* =====================================================================
   INITIAL UI
   ===================================================================== */

function initialiseStaticUi() {

    const dateInputs = [
        "invoiceDateInput",
        "eventDateInput"
    ];

    dateInputs.forEach(
        id => {

            const input =
                $(id);

            if (
                input &&
                !input.value
            ) {

                input.value =
                    todayISO();
            }
        }
    );

    renderDrinksCart();
    renderBakeryCart();
    renderEventCart();

    /*
       V2 removes the old emoji picker.
       The normal input remains compatible with the native
       emoji keyboard on iPhone / iPad / Android.
    */
    all(".emoji-grid")
        .forEach(
            grid =>
                grid.hidden = true
        );
}

/* =====================================================================
   LAUTERMACHER V3.1
   Schüler-Korrekturen
   ===================================================================== */


/* =====================================================================
   V3.1 — HEADER
   ===================================================================== */

function ensureV31HeaderVisible() {

    if (!state.currentPerson) {
        return;
    }

    const header =
        $("appHeader");

    if (!header) {
        return;
    }

    header.hidden = false;

    header.removeAttribute(
        "hidden"
    );

    header.classList.add(
        "visible"
    );

    document.body.classList.add(
        "authenticated"
    );

    setText(
        "currentPersonName",
        fullName(
            state.currentPerson
        )
    );

    setText(
        "currentPersonRole",
        isTeacher()
            ? "Lehrkraft"
            : "Schüler/in"
    );
}


/* =====================================================================
   V3.1 — BÄCKEREI AUSGABE
   ===================================================================== */

function isBakeryOrderCompleted(order) {

    const status =
        String(
            order?.status || ""
        ).toLowerCase();

    return [
        "ausgegeben",
        "fertig",
        "served",
        "erledigt",
        "completed"
    ].includes(status);
}


function renderBakeryOrders(orders) {

    const openContainer =
        $("bakeryOutputOrders");

    const completedContainer =
        $("bakeryCompletedOrders");

    if (!openContainer) {
        return;
    }

    const safeOrders =
        Array.isArray(orders)
            ? orders
            : [];

    const openOrders =
        safeOrders.filter(
            order =>
                !isBakeryOrderCompleted(
                    order
                )
        );

    const completedOrders =
        safeOrders
            .filter(
                order =>
                    isBakeryOrderCompleted(
                        order
                    )
            )
            .slice(0, 20);


    setText(
        "bakeryOpenOrderCount",
        String(
            openOrders.length
        )
    );

    setText(
        "bakeryCompletedOrderCount",
        String(
            completedOrders.length
        )
    );


    /* ---------------------------------------------------------
       OFFENE BESTELLUNGEN
       --------------------------------------------------------- */

    if (!openOrders.length) {

        openContainer.innerHTML = `
            <div class="empty-state">
                Keine offenen Bestellungen.
            </div>
        `;

    } else {

        openContainer.innerHTML =
            openOrders
                .map(
                    order => {

                        const items =
                            order.items ||
                            order.order_items ||
                            [];

                        return `
                            <div class="output-order-card">

                                <strong class="output-order-number">
                                    #${String(
                                        order.order_number ?? "—"
                                    ).padStart(3, "0")}
                                </strong>

                                <div class="output-order-items">

                                    ${
                                        items
                                            .map(
                                                item => `
                                                    <div class="output-order-item">

                                                        <strong>
                                                            ${integer(
                                                                item.quantity
                                                            )}×
                                                        </strong>

                                                        ${escapeHtml(
                                                            item.product_name ||
                                                            item.name ||
                                                            ""
                                                        )}

                                                    </div>
                                                `
                                            )
                                            .join("")
                                    }

                                </div>

                                <button
                                    type="button"
                                    class="primary-action"
                                    data-serve-bakery="${escapeHtml(
                                        order.id
                                    )}"
                                >
                                    Ausgegeben
                                </button>

                            </div>
                        `;
                    }
                )
                .join("");
    }


    /* ---------------------------------------------------------
       FERTIGE BESTELLUNGEN
       --------------------------------------------------------- */

    if (!completedContainer) {
        return;
    }

    if (!completedOrders.length) {

        completedContainer.innerHTML = `
            <div class="empty-state">
                Noch keine fertigen Bestellungen.
            </div>
        `;

        return;
    }

    completedContainer.innerHTML =
        completedOrders
            .map(
                order => {

                    const items =
                        order.items ||
                        order.order_items ||
                        [];

                    return `
                        <div class="completed-order-card">

                            <strong>
                                #${String(
                                    order.order_number ?? "—"
                                ).padStart(3, "0")}
                            </strong>

                            <small>
                                ${
                                    items
                                        .map(
                                            item =>
                                                `${integer(
                                                    item.quantity
                                                )}× ${escapeHtml(
                                                    item.product_name ||
                                                    item.name ||
                                                    ""
                                                )}`
                                        )
                                        .join(", ")
                                }
                            </small>

                        </div>
                    `;
                }
            )
            .join("");
}


/* =====================================================================
   V3.1 — BÄCKEREI SCHICHTENDE
   ===================================================================== */

function showBakeryShiftFinished(
    role
) {

    const oldOverlay =
        $("bakeryShiftFinishedOverlay");

    oldOverlay?.remove();


    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "bakeryShiftFinishedOverlay";

    overlay.className =
        "team-finished-overlay";


    const description =
        role === "output"
            ? "Danke! Deine Schicht an der Ausgabe ist beendet."
            : "Danke! Deine Schicht an der Kasse ist beendet.";


    overlay.innerHTML = `
        <div
            class="team-finished-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bakeryShiftFinishedTitle"
        >

            <span class="team-finished-icon">
                🎉
            </span>

            <h2 id="bakeryShiftFinishedTitle">
                Gut gemacht heute, Team!
            </h2>

            <p>
                ${description}
            </p>

            <button
                id="bakeryShiftFinishedButton"
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


    $("bakeryShiftFinishedButton")
        ?.addEventListener(
            "click",
            () => {

                overlay.remove();

                state.bakeryCart = {};

                renderBakeryCart();

                goHome();
            }
        );
}


/* =====================================================================
   V3.1 — PRODUKT-AKTIONEN SICHERSTELLEN
   ===================================================================== */

function renderProductAdmin() {

    const container =
        $("productAdminList");

    if (!container) {
        return;
    }


    let products =
        state.products.filter(
            product =>
                product.active !== false
        );


    if (
        state.productFilter !==
        "all"
    ) {

        products =
            products.filter(
                product =>
                    product.category ===
                    state.productFilter
            );
    }


    if (!products.length) {

        container.innerHTML = `
            <div class="empty-state">
                Keine Produkte.
            </div>
        `;

        return;
    }


    container.innerHTML =
        products
            .map(
                product => `
                    <div class="product-admin-row">

                        <div class="product-admin-icon">
                            ${escapeHtml(
                                product.icon ||
                                "🛒"
                            )}
                        </div>

                        <div class="product-admin-info">

                            <strong>
                                ${escapeHtml(
                                    product.name
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    categoryLabel(
                                        product.category
                                    )
                                )}
                            </small>

                        </div>

                        <div class="product-admin-price">
                            ${money(
                                product.price
                            )}
                        </div>

                        <div class="product-admin-actions">

                            <button
                                type="button"
                                class="product-edit-button"
                                data-edit-product="${escapeHtml(
                                    product.id
                                )}"
                            >
                                ✏️ Bearbeiten
                            </button>

                            <button
                                type="button"
                                class="product-delete-button"
                                data-delete-product="${escapeHtml(
                                    product.id
                                )}"
                            >
                                🗑️ Löschen
                            </button>

                        </div>

                    </div>
                `
            )
            .join("");
}


/* =====================================================================
   V3.1 — BÄCKEREI BUTTONS
   ===================================================================== */

document.addEventListener(
    "click",
    async event => {

        const target =
            event.target.closest(
                "button"
            );

        if (!target) {
            return;
        }


        /* ---------------------------------------------------------
           Bäckerei Menü → Kasse
           HTML verwendet bakeryCashierButton.
           --------------------------------------------------------- */

        if (
            target.id ===
            "bakeryCashierButton"
        ) {

            state.bakeryCart = {};

            renderBakeryCart();

            renderSaleProducts(
                "bakeryProductGrid",
                "bäckerei",
                state.bakeryCart,
                renderBakeryCart
            );

            showScreen(
                "bakerySaleScreen"
            );

            return;
        }


        /* ---------------------------------------------------------
           Kasse → Schicht beenden
           Keine Gratisgetränke.
           --------------------------------------------------------- */

        if (
            target.id ===
            "bakeryCashShiftEndButton"
        ) {

            showBakeryShiftFinished(
                "cash"
            );

            return;
        }


        /* ---------------------------------------------------------
           Ausgabe → Schicht beenden
           Nur Information / Bestätigung.
           Keine Gratisgetränke.
           --------------------------------------------------------- */

        if (
            target.id ===
            "bakeryOutputShiftEndButton"
        ) {

            showBakeryShiftFinished(
                "output"
            );

            return;
        }
    },
    true
);


/* =====================================================================
   V3.1 — HEADER WATCHDOG
   ===================================================================== */

/*
   Der Header darf nach erfolgreichem Login nicht wieder verschwinden.
   Das ist absichtlich defensiv, damit Navigation und Realtime-Refreshes
   ihn nicht versehentlich ausblenden.
*/

const v31HeaderObserver =
    new MutationObserver(
        () => {

            if (
                state.currentPerson &&
                state.currentScreenId !==
                    "identityScreen" &&
                state.currentScreenId !==
                    "pinLoginScreen"
            ) {

                const header =
                    $("appHeader");

                if (
                    header &&
                    (
                        header.hidden ||
                        !header.classList.contains(
                            "visible"
                        )
                    )
                ) {

                    ensureV31HeaderVisible();
                }
            }
        }
    );


v31HeaderObserver.observe(
    document.body,
    {
        attributes: true,
        subtree: true,
        attributeFilter: [
            "hidden",
            "class"
        ]
    }
);


/* =====================================================================
   V3.1 — LOGIN HEADER REFRESH
   ===================================================================== */

window.setInterval(
    () => {

        if (
            state.currentPerson &&
            state.currentScreenId !==
                "identityScreen" &&
            state.currentScreenId !==
                "pinLoginScreen"
        ) {

            ensureV31HeaderVisible();
        }

    },
    1500
);

/* =====================================================================
   START
   ===================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            initialiseStaticUi();

            hideAppHeader();

            showScreen(
                "identityScreen",
                {
                    pushHistory: false
                }
            );

            await initialiseAuthentication();

            /*
               Reclassify events when the app remains open across midnight.
            */
            window.setInterval(
                refreshEventDateClassification,
                60 * 1000
            );

        } catch (error) {

            console.error(
                "LauterMacher konnte nicht gestartet werden:",
                error
            );

            showToast(
                "Die App konnte nicht vollständig geladen werden.",
                "error"
            );
        }
    }
);

/* =====================================================================
   LAUTERMACHER V3.2
   Patch ciblé — aucune régression volontaire des fonctions existantes
   ===================================================================== */


/* =====================================================================
   V3.2 — MODE PROFESSEUR VISUEL
   ===================================================================== */

function applyV32RoleAppearance() {

    document.body.classList.toggle(
        "teacher-mode",
        Boolean(
            state.currentPerson &&
            isTeacher()
        )
    );


    const roleElement =
        $("currentPersonRole") ||
        document.querySelector(
            ".current-person-role"
        );


    if (roleElement) {

        roleElement.classList.toggle(
            "teacher-role",
            Boolean(
                state.currentPerson &&
                isTeacher()
            )
        );
    }


    document
        .querySelectorAll(
            ".role-badge"
        )
        .forEach(
            element => {

                element.classList.toggle(
                    "teacher-role",
                    Boolean(
                        state.currentPerson &&
                        isTeacher()
                    )
                );
            }
        );
}


/* =====================================================================
   V3.2 — FIL D'ARIANE SOUS LE HEADER
   ===================================================================== */

function moveBreadcrumbBelowHeaderV32() {

    const header =
        $("appHeader");

    const breadcrumb =
        document.querySelector(
            ".breadcrumb"
        );

    if (
        !header ||
        !breadcrumb
    ) {
        return;
    }


    /*
       On sort physiquement le fil d'Ariane du header s'il s'y trouve.
       Il devient son frère direct, juste après.
    */

    if (
        header.contains(
            breadcrumb
        )
    ) {

        header.insertAdjacentElement(
            "afterend",
            breadcrumb
        );
    }
}


/* =====================================================================
   V3.2 — CALCULATRICES
   Getränke + Bäckerei
   Étudiant ET professeur
   ===================================================================== */


/*
   Important :
   le pavé numérique travaille uniquement sur la valeur reçue.
   Il ne crée aucune vente et ne touche pas à Supabase.
*/


function v32AppendPaymentDigit(
    currentCents,
    value
) {

    const current =
        String(
            Math.max(
                0,
                integer(
                    currentCents
                )
            )
        );


    const addition =
        String(
            value || ""
        ).replace(
            /\D/g,
            ""
        );


    if (!addition) {
        return integer(
            currentCents
        );
    }


    const combined =
        (
            current === "0"
                ? addition
                : current + addition
        )
        .replace(
            /^0+(?=\d)/,
            ""
        )
        .slice(
            0,
            7
        );


    return integer(
        combined || "0"
    );
}


function v32DeletePaymentDigit(
    currentCents
) {

    const text =
        String(
            Math.max(
                0,
                integer(
                    currentCents
                )
            )
        );


    if (
        text.length <= 1
    ) {
        return 0;
    }


    return integer(
        text.slice(
            0,
            -1
        )
    );
}


function v32FormatCents(
    cents
) {

    return money(
        Number(
            cents || 0
        ) / 100
    );
}


/* ---------------------------------------------------------------------
   GETRÄNKE
   --------------------------------------------------------------------- */

let v32DrinksReceivedCents =
    0;


function v32DrinksTotal() {

    return Object.values(
        state.drinksCart || {}
    ).reduce(
        (
            sum,
            item
        ) =>
            sum +
            (
                Number(
                    item.price || 0
                ) *
                integer(
                    item.quantity || 0
                )
            ),
        0
    );
}


function renderV32DrinksPayment() {

    const total =
        v32DrinksTotal();

    const received =
        v32DrinksReceivedCents /
        100;

    const change =
        Math.max(
            0,
            received - total
        );


    setText(
        "drinksPaymentTotal",
        money(
            total
        )
    );

    setText(
        "drinksAmountReceived",
        v32FormatCents(
            v32DrinksReceivedCents
        )
    );

    setText(
        "drinksChangeAmount",
        money(
            change
        )
    );


    const paidButton =
        $("drinksPaidButton");


    if (paidButton) {

        paidButton.disabled =
            total <= 0 ||
            received + 0.0001 <
                total;
    }
}


/* ---------------------------------------------------------------------
   BÄCKEREI
   --------------------------------------------------------------------- */

let v32BakeryReceivedCents =
    0;


function v32BakeryTotal() {

    return Object.values(
        state.bakeryCart || {}
    ).reduce(
        (
            sum,
            item
        ) =>
            sum +
            (
                Number(
                    item.price || 0
                ) *
                integer(
                    item.quantity || 0
                )
            ),
        0
    );
}


function renderV32BakeryPayment() {

    const total =
        v32BakeryTotal();

    const received =
        v32BakeryReceivedCents /
        100;

    const change =
        Math.max(
            0,
            received - total
        );


    setText(
        "bakeryPaymentTotal",
        money(
            total
        )
    );

    setText(
        "bakeryAmountReceived",
        v32FormatCents(
            v32BakeryReceivedCents
        )
    );

    setText(
        "bakeryChangeAmount",
        money(
            change
        )
    );


    const paidButton =
        $("bakeryPaidButton");


    if (paidButton) {

        paidButton.disabled =
            total <= 0 ||
            received + 0.0001 <
                total;
    }
}


/* =====================================================================
   V3.2 — KEYPAD EVENTS
   ===================================================================== */

document.addEventListener(
    "click",
    event => {

        const key =
            event.target.closest(
                ".payment-key"
            );

        if (!key) {
            return;
        }


        /*
           GETRÄNKE
        */

        const drinksKeypad =
            key.closest(
                "#drinksPaymentKeypad"
            );


        if (drinksKeypad) {

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            if (
                key.id ===
                "drinksDeletePaymentButton"
            ) {

                v32DrinksReceivedCents =
                    v32DeletePaymentDigit(
                        v32DrinksReceivedCents
                    );

            } else {

                v32DrinksReceivedCents =
                    v32AppendPaymentDigit(
                        v32DrinksReceivedCents,
                        key.dataset.value
                    );
            }


            renderV32DrinksPayment();

            return;
        }


        /*
           BÄCKEREI
        */

        const bakeryKeypad =
            key.closest(
                "#bakeryPaymentKeypad"
            );


        if (bakeryKeypad) {

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            if (
                key.id ===
                "bakeryDeletePaymentButton"
            ) {

                v32BakeryReceivedCents =
                    v32DeletePaymentDigit(
                        v32BakeryReceivedCents
                    );

            } else {

                v32BakeryReceivedCents =
                    v32AppendPaymentDigit(
                        v32BakeryReceivedCents,
                        key.dataset.value
                    );
            }


            renderV32BakeryPayment();
        }

    },
    true
);


/* =====================================================================
   V3.2 — RESET DES CALCULATRICES
   ===================================================================== */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button"
            );

        if (!button) {
            return;
        }


        if (
            button.id ===
            "drinksPayButton"
        ) {

            v32DrinksReceivedCents =
                0;

            window.setTimeout(
                renderV32DrinksPayment,
                0
            );
        }


        if (
            button.id ===
            "bakeryPayButton"
        ) {

            v32BakeryReceivedCents =
                0;

            window.setTimeout(
                renderV32BakeryPayment,
                0
            );
        }

    },
    true
);


/* =====================================================================
   V3.2 — BEARBEITEN PROFESSEUR
   ===================================================================== */


/*
   Certains anciens listeners utilisaient les anciens IDs.
   Ici on branche uniquement les IDs présents dans le HTML actuel.
*/


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button"
            );

        if (!button) {
            return;
        }


        /* PRODUKTE */

        if (
            button.id ===
            "productsButton"
        ) {

            event.preventDefault();

            renderProductAdmin();

            showScreen(
                "productsScreen"
            );

            return;
        }


        /* RECHNUNGEN */

        if (
            button.id ===
            "invoicesButton"
        ) {

            if (!isTeacher()) {
                return;
            }


            event.preventDefault();

            showScreen(
                "invoicesScreen"
            );

            return;
        }


        /* INVENTUR */

        if (
            button.id ===
            "inventoryButton" &&
            isTeacher()
        ) {

            event.preventDefault();

            showScreen(
                "teacherInventoryScreen"
            );

            return;
        }


        /* SCHÜLER */

        if (
            button.id ===
            "studentsButton"
        ) {

            if (!isTeacher()) {
                return;
            }


            event.preventDefault();

            showScreen(
                "studentsScreen"
            );

            return;
        }


        /* BENACHRICHTIGUNGEN */

        if (
            button.id ===
            "notificationsAdminButton"
        ) {

            if (!isTeacher()) {
                return;
            }


            event.preventDefault();

            openV32TeacherNotifications();

            return;
        }

    },
    true
);


/* =====================================================================
   V3.2 — BENACHRICHTIGUNGEN ALS 5. FUNKTION
   ===================================================================== */

function ensureV32NotificationAdminButton() {

    if (!isTeacher()) {
        return;
    }


    const grid =
        document.querySelector(
            "#editMenuScreen .edit-menu-grid"
        );


    if (!grid) {
        return;
    }


    if (
        $("notificationsAdminButton")
    ) {
        return;
    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "notificationsAdminButton";

    button.type =
        "button";

    button.className =
        "admin-menu-card teacher-only";


    button.innerHTML = `
        <span class="admin-menu-icon">
            🔔
        </span>

        <strong>
            Benachrichtigungen
        </strong>

        <small>
            Nachricht an Schüler senden
        </small>
    `;


    grid.appendChild(
        button
    );
}


/*
   On utilise l'écran Notifications existant.
   Pas de nouvelle table, pas de stockage parallèle.
*/

function openV32TeacherNotifications() {

    showScreen(
        "notificationsScreen"
    );


    const screen =
        $("notificationsScreen");


    if (!screen) {
        return;
    }


    let composer =
        $("teacherNotificationComposer");


    if (composer) {
        return;
    }


    composer =
        document.createElement(
            "section"
        );


    composer.id =
        "teacherNotificationComposer";

    composer.className =
        "content-card teacher-notification-composer";


    composer.innerHTML = `
        <div class="section-heading">

            <div>
                <h2>
                    🔔 Benachrichtigung senden
                </h2>

                <p>
                    Nachricht an die Schüler.
                </p>
            </div>

        </div>

        <div class="form-grid">

            <label>
                Empfänger

                <select
                    id="teacherNotificationRecipient"
                >
                    <option value="student">
                        Alle Schüler
                    </option>

                    <option value="all">
                        Alle
                    </option>
                </select>
            </label>

            <label>
                Titel

                <input
                    id="teacherNotificationTitle"
                    type="text"
                    maxlength="80"
                    placeholder="Titel"
                >
            </label>

            <label class="full-width-field">
                Nachricht

                <textarea
                    id="teacherNotificationMessage"
                    rows="4"
                    maxlength="500"
                    placeholder="Nachricht schreiben..."
                ></textarea>
            </label>

        </div>

        <div class="button-row">

            <button
                id="teacherSendNotificationButton"
                class="primary-action"
                type="button"
            >
                Senden
            </button>

        </div>
    `;


    const firstContent =
        screen.querySelector(
            ".notifications-content"
        ) ||
        screen.querySelector(
            "section"
        );


    if (firstContent) {

        firstContent.insertAdjacentElement(
            "beforebegin",
            composer
        );

    } else {

        screen.appendChild(
            composer
        );
    }
}


/* =====================================================================
   V3.2 — BERICHTE EXPORT
   ===================================================================== */

function moveV32ReportExportButton() {

    const reportScreen =
        $("reportsScreen");

    if (!reportScreen) {
        return;
    }


    const button =
        $("exportReportButton") ||
        $("reportExportButton") ||
        $("exportExcelButton");


    if (!button) {
        return;
    }


    let actions =
        reportScreen.querySelector(
            ".reports-top-actions"
        );


    if (!actions) {

        actions =
            document.createElement(
                "div"
            );

        actions.className =
            "reports-top-actions";


        const screenHeader =
            reportScreen.querySelector(
                ".screen-header"
            );


        if (screenHeader) {

            screenHeader.insertAdjacentElement(
                "afterend",
                actions
            );

        } else {

            reportScreen.prepend(
                actions
            );
        }
    }


    actions.appendChild(
        button
    );
}


/* =====================================================================
   V3.2 — MODE DÉVELOPPEMENT
   Désactivation TEMPORAIRE du blocage horaire élève.
   ===================================================================== */


/*
   IMPORTANT :
   ceci est volontairement temporaire pendant le développement.

   On ne supprime pas l'écran ni la logique existante.
   On force seulement le contrôle à autoriser l'accès.
*/


window.LAUTERMACHER_DEVELOPMENT_MODE =
    true;


function v32DevelopmentAccessAllowed() {

    return (
        window.LAUTERMACHER_DEVELOPMENT_MODE ===
        true
    );
}


/*
   Si le blocage horaire tente d'afficher son écran pendant
   le développement, on retourne à l'accueil.
*/

const v32SchoolHoursObserver =
    new MutationObserver(
        () => {

            if (
                !v32DevelopmentAccessAllowed()
            ) {
                return;
            }


            const closedScreen =
                $("schoolClosedScreen");


            if (
                closedScreen &&
                (
                    closedScreen.classList.contains(
                        "screen-visible"
                    ) ||
                    closedScreen.style.display ===
                        "block"
                )
            ) {

                closedScreen.classList.remove(
                    "screen-visible"
                );

                closedScreen.style.display =
                    "none";


                if (
                    state.currentPerson
                ) {

                    goHome();
                }
            }
        }
    );


v32SchoolHoursObserver.observe(
    document.body,
    {
        subtree: true,
        attributes: true,
        attributeFilter: [
            "class",
            "style"
        ]
    }
);


/* =====================================================================
   V3.2 — REFRESH UI
   ===================================================================== */

function applyV32Interface() {

    if (!state.currentPerson) {
        return;
    }


    applyV32RoleAppearance();

    moveBreadcrumbBelowHeaderV32();

    moveV32ReportExportButton();


    if (isTeacher()) {

        ensureV32NotificationAdminButton();
    }
}


/*
   Petit observateur uniquement pour les éléments d'interface
   injectés lors des changements d'écran.
*/

const v32InterfaceObserver =
    new MutationObserver(
        () => {

            window.requestAnimationFrame(
                applyV32Interface
            );
        }
    );


v32InterfaceObserver.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


window.setTimeout(
    applyV32Interface,
    0
);

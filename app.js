// ============================================================
// LAUTER MACHER — APP.JS V1
// Supabase = einzige fachliche Datenquelle
// ============================================================

"use strict";


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
// STATE
// ============================================================

const state = {

    currentPerson: null,
    selectedLoginPerson: null,

    products: [],
    inventory: {},
    events: [],
    notifications: [],

    drinksCart: new Map(),
    bakeryCart: new Map(),
    eventCart: new Map(),

    drinksPaymentCents: "",
    bakeryPaymentCents: "",
    eventPaymentCents: "",

    currentEvent: null,
    currentEventProducts: [],

    drinksTestMode: false,
    bakeryTestMode: false,
    eventTestMode: false,

    freeDrinksContext: "getränke",
    freeDrinksEventId: null,
    freeDrinkQuantities: {},

    invoiceForInventory: null,

    productFilter: "all",
    editingProductId: null,

    editingStudent: null,
    editingEventProduct: null,

    reportPeriod: "today",
    reportSort: "revenue",

    bakeryTestOrders: [],
    eventTestOrders: [],

    realtimeChannel: null,

    previousScreenId: "homeScreen",

    confirmAction: null
};


// ============================================================
// DOM HELPERS
// ============================================================

function el(id) {
    return document.getElementById(id);
}

function on(id, eventName, handler) {

    const element = el(id);

    if (element) {
        element.addEventListener(
            eventName,
            handler
        );
    }
}

function all(selector) {
    return Array.from(
        document.querySelectorAll(selector)
    );
}

function setHidden(id, hidden) {

    const element = el(id);

    if (element) {
        element.hidden = Boolean(hidden);
    }
}

function setText(id, value) {

    const element = el(id);

    if (element) {
        element.textContent =
            value === null ||
            value === undefined
                ? ""
                : String(value);
    }
}

function setHTML(id, value) {

    const element = el(id);

    if (element) {
        element.innerHTML = value;
    }
}

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function euro(value) {

    const number =
        Number(value || 0);

    return new Intl.NumberFormat(
        "de-DE",
        {
            style: "currency",
            currency: "EUR"
        }
    ).format(number);
}

function parseMoney(value) {

    const cleaned =
        String(value ?? "")
            .trim()
            .replace(/\s/g, "")
            .replace("€", "")
            .replace(",", ".");

    const number =
        Number(cleaned);

    return Number.isFinite(number)
        ? Math.round(number * 100) / 100
        : NaN;
}

function localDateKey(date = new Date()) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const parts =
        String(value)
            .slice(0, 10)
            .split("-");

    if (parts.length !== 3) {
        return String(value);
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "de-DE",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    ).format(new Date(value));
}

function personName(person) {

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

    return Boolean(
        state.currentPerson &&
        state.currentPerson.person_type === "lehrer"
    );
}

function activeProducts(category = null) {

    return state.products
        .filter(product => {

            if (!product.active) {
                return false;
            }

            if (
                category &&
                product.category !== category
            ) {
                return false;
            }

            return true;
        })
        .sort(
            (a, b) =>
                String(a.name)
                    .localeCompare(
                        String(b.name),
                        "de"
                    )
        );
}

function showToast(
    message,
    type = "info"
) {

    const container =
        el("toastContainer");

    if (!container) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    window.setTimeout(
        () => {
            toast.remove();
        },
        3500
    );
}

function errorMessage(error) {

    console.error(error);

    const raw =
        error?.message ||
        error?.error_description ||
        String(error || "");

    const translations = {

        teacher_required:
            "Diese Funktion ist nur für Lehrer verfügbar.",

        authentication_required:
            "Bitte erneut anmelden.",

        product_not_found:
            "Produkt wurde nicht gefunden.",

        drink_product_not_found:
            "Getränk wurde nicht gefunden.",

        invalid_quantity:
            "Die Menge ist ungültig.",

        payment_too_low:
            "Der erhaltene Betrag ist zu niedrig.",

        items_required:
            "Bitte mindestens ein Produkt auswählen.",

        event_required:
            "Bitte eine Veranstaltung auswählen.",

        event_not_found:
            "Veranstaltung wurde nicht gefunden.",

        food_event_not_found:
            "Food-Veranstaltung wurde nicht gefunden.",

        editable_food_event_not_found:
            "Diese Veranstaltung kann nicht mehr bearbeitet werden.",

        event_product_not_found:
            "Veranstaltungsprodukt wurde nicht gefunden.",

        pin_must_have_four_digits:
            "Der PIN muss aus genau 4 Ziffern bestehen.",

        first_name_required:
            "Bitte einen Vornamen eingeben.",

        direct_revenue_required:
            "Bitte einen gültigen Umsatz eingeben.",

        invalid_revenue:
            "Bitte einen gültigen Umsatz eingeben.",

        getraenke_invoice_not_found:
            "Die Getränke-Rechnung wurde nicht gefunden."
    };

    for (
        const [key, value]
        of Object.entries(translations)
    ) {

        if (raw.includes(key)) {
            return value;
        }
    }

    return raw ||
        "Es ist ein Fehler aufgetreten.";
}


// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showScreen(id) {

    const target =
        typeof id === "string"
            ? el(id)
            : id;

    if (!target) {
        return;
    }

    const current =
        all(".screen")
            .find(
                screen =>
                    screen.style.display !== "none" &&
                    !screen.hidden
            );

    if (
        current &&
        current.id !== target.id
    ) {
        state.previousScreenId =
            current.id;
    }

    all(".screen")
        .forEach(screen => {

            screen.style.display =
                "none";
        });

    target.hidden = false;
    target.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}

function goHome() {

    closeNotificationPopover();

    showScreen("homeScreen");
}

function updateRoleUI() {

    const teacher =
        isTeacher();

    all(".teacher-only")
        .forEach(element => {

            element.hidden =
                !teacher;
        });

    setText(
        "homeRoleLabel",
        teacher
            ? "Lehrer"
            : "Schüler"
    );

    setText(
        "homeDrinksDescription",
        teacher
            ? "Testumgebung"
            : "Kasse"
    );

    setText(
        "homeBakeryDescription",
        teacher
            ? "Testumgebung"
            : "Kasse & Ausgabe"
    );

    setHidden(
        "homeDrinksTestBadge",
        !teacher
    );

    setHidden(
        "homeBakeryTestBadge",
        !teacher
    );

    setText(
        "inventoryMenuDescription",
        teacher
            ? "Bestand und Wareneingänge verwalten"
            : "Bestand zählen und an Lehrer schicken"
    );
}


// ============================================================
// AUTHENTICATION
// ============================================================

async function loadLoginPeople() {

    setHTML(
        "peopleGrid",
        ""
    );

    setText(
        "identityError",
        ""
    );

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "get_login_people"
        );

    if (error) {

        setText(
            "identityError",
            "Personen konnten nicht geladen werden."
        );

        console.error(error);

        return;
    }

    const grid =
        el("peopleGrid");

    (data || [])
        .forEach(person => {

            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "person-card";

            button.innerHTML = `
                <span class="person-card-icon">
                    ${
                        person.person_type === "lehrer"
                            ? "👨‍🏫"
                            : "👩‍🎓"
                    }
                </span>

                <strong>
                    ${escapeHtml(personName(person))}
                </strong>

                <small>
                    ${
                        person.person_type === "lehrer"
                            ? "Lehrer"
                            : "Schüler"
                    }
                </small>
            `;

            button.addEventListener(
                "click",
                () => {

                    state.selectedLoginPerson =
                        person;

                    setText(
                        "selectedPersonName",
                        personName(person)
                    );

                    el("loginPinInput").value =
                        "";

                    setText(
                        "pinLoginError",
                        ""
                    );

                    showScreen(
                        "pinLoginScreen"
                    );

                    window.setTimeout(
                        () =>
                            el("loginPinInput")
                                ?.focus(),
                        50
                    );
                }
            );

            grid.appendChild(button);
        });
}

async function loginWithPin() {

    const person =
        state.selectedLoginPerson;

    const input =
        el("loginPinInput");

    const button =
        el("loginConfirmButton");

    if (
        !person ||
        !input
    ) {
        return;
    }

    const pin =
        input.value.trim();

    if (!/^[0-9]{4}$/.test(pin)) {

        setText(
            "pinLoginError",
            "Bitte eine 4-stellige PIN eingeben."
        );

        input.focus();

        return;
    }

    button.disabled = true;
    button.textContent =
        "Anmeldung …";

    setText(
        "pinLoginError",
        ""
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
                                person.id,
                            pin
                        }
                    }
                );

        if (error) {
            throw error;
        }

        if (
            !data?.success ||
            !data?.token_hash ||
            !data?.verification_type
        ) {
            throw new Error(
                "Ungültige Antwort vom Login-Service."
            );
        }

        const {
            data: otpData,
            error: otpError
        } =
            await supabaseClient
                .auth
                .verifyOtp({
                    token_hash:
                        data.token_hash,
                    type:
                        data.verification_type
                });

        if (otpError) {
            throw otpError;
        }

        const current =
            await loadCurrentPerson(
                otpData.session
            );

        if (!current) {
            throw new Error(
                "Person konnte nicht geladen werden."
            );
        }

        await applyLoggedInState(
            current
        );

    } catch (error) {

        console.error(error);

        setText(
            "pinLoginError",
            "Falsche PIN oder Anmeldung nicht möglich."
        );

        input.value = "";
        input.focus();

    } finally {

        button.disabled = false;
        button.textContent =
            "Einloggen";
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
                "id,person_type,student_number,first_name,last_name,active,auth_user_id"
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
        throw error;
    }

    return data || null;
}

async function applyLoggedInState(
    person
) {

    state.currentPerson =
        person;

    state.selectedLoginPerson =
        null;

    setText(
        "currentPersonName",
        personName(person)
    );

    el("appHeader").hidden =
        false;

    updateRoleUI();

    await Promise.all([
        loadProducts(),
        loadInventory(),
        loadEvents(),
        loadNotifications()
    ]);

    startRealtime();

    goHome();
}

async function initialiseAuthentication() {

    try {

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

        if (data?.session) {

            const person =
                await loadCurrentPerson(
                    data.session
                );

            if (person) {

                await applyLoggedInState(
                    person
                );

                return;
            }

            await supabaseClient
                .auth
                .signOut();
        }

    } catch (error) {

        console.error(
            "Initialisierung:",
            error
        );
    }

    el("appHeader").hidden =
        true;

    showScreen("identityScreen");

    await loadLoginPeople();
}

async function logout() {

    stopRealtime();

    await supabaseClient
        .auth
        .signOut();

    state.currentPerson = null;
    state.selectedLoginPerson = null;
    state.currentEvent = null;

    clearAllCarts();

    el("appHeader").hidden =
        true;

    setText(
        "currentPersonName",
        "-"
    );

    showScreen("identityScreen");

    await loadLoginPeople();
}


// ============================================================
// DATA LOADERS
// ============================================================

async function loadProducts() {

    if (!state.currentPerson) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .order("name");

    if (error) {
        throw error;
    }

    state.products =
        data || [];

    renderCurrentProductViews();
}

async function loadInventory() {

    if (!state.currentPerson) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("inventory")
            .select(
                "product_id,quantity,updated_at"
            );

    if (error) {
        throw error;
    }

    state.inventory = {};

    (data || [])
        .forEach(row => {

            state.inventory[
                row.product_id
            ] =
                Number(row.quantity || 0);
        });

    renderCurrentProductViews();
}

async function loadEvents() {

    if (!state.currentPerson) {
        return;
    }

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
        throw error;
    }

    state.events =
        data || [];

    renderEvents();
}

async function loadNotifications() {

    if (!state.currentPerson) {
        return;
    }

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

    renderNotificationBadge();
    renderNotificationPreview();
    renderNotifications();
}


// ============================================================
// REALTIME
// ============================================================

function startRealtime() {

    stopRealtime();

    state.realtimeChannel =
        supabaseClient
            .channel(
                `lauter-macher-v1-${state.currentPerson.id}`
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

    tables.forEach(table => {

        state.realtimeChannel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table
            },
            () => {
                handleRealtimeChange(
                    table
                );
            }
        );
    });

    state.realtimeChannel.subscribe();
}

function stopRealtime() {

    if (
        state.realtimeChannel
    ) {

        supabaseClient
            .removeChannel(
                state.realtimeChannel
            );

        state.realtimeChannel =
            null;
    }
}

async function handleRealtimeChange(
    table
) {

    try {

        if (table === "products") {
            await loadProducts();
        }

        if (table === "inventory") {
            await loadInventory();
        }

        if (table === "events") {
            await loadEvents();

            if (state.currentEvent) {

                const fresh =
                    state.events.find(
                        event =>
                            event.id ===
                            state.currentEvent.id
                    );

                if (fresh) {
                    state.currentEvent =
                        fresh;
                }
            }
        }

        if (
            table === "event_products" &&
            state.currentEvent
        ) {
            await loadCurrentEventProducts();
        }

        if (
            table === "orders" ||
            table === "order_items"
        ) {

            const screen =
                visibleScreenId();

            if (
                screen ===
                "bakeryOutputScreen"
            ) {
                await renderBakeryOutput();
            }
        }

        if (
            table === "event_orders" ||
            table === "event_order_items"
        ) {

            const screen =
                visibleScreenId();

            if (
                screen ===
                "eventOutputScreen"
            ) {
                await renderEventOutput();
            }
        }

        if (
            table === "notifications" ||
            table ===
                "inventory_submissions"
        ) {
            await loadNotifications();

            if (
                isTeacher() &&
                visibleScreenId() ===
                    "teacherInventoryScreen"
            ) {
                await renderInventorySubmissions();
            }
        }

        if (
            table === "invoices" &&
            isTeacher() &&
            visibleScreenId() ===
                "invoicesScreen"
        ) {
            await renderInvoices();
        }

    } catch (error) {

        console.error(
            "Realtime:",
            error
        );
    }
}

function visibleScreenId() {

    const screen =
        all(".screen")
            .find(
                item =>
                    item.style.display ===
                    "block"
            );

    return screen?.id || "";
}


// ============================================================
// NOTIFICATIONS
// ============================================================

function unreadNotifications() {

    return state.notifications
        .filter(
            notification =>
                !notification.read_at
        );
}

function renderNotificationBadge() {

    const count =
        unreadNotifications().length;

    setText(
        "notificationCount",
        count
    );

    setHidden(
        "notificationCount",
        count === 0
    );
}

function notificationHTML(
    notification
) {

    return `
        <article class="notification-item ${
            notification.read_at
                ? "read"
                : "unread"
        }">
            <div>
                <strong>
                    ${escapeHtml(
                        notification.title ||
                        "Benachrichtigung"
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        notification.message ||
                        ""
                    )}
                </p>

                <small>
                    ${escapeHtml(
                        formatDateTime(
                            notification.created_at
                        )
                    )}
                </small>
            </div>
        </article>
    `;
}

function renderNotificationPreview() {

    const container =
        el("notificationPreviewList");

    if (!container) {
        return;
    }

    const rows =
        state.notifications.slice(0, 5);

    container.innerHTML =
        rows.length
            ? rows
                .map(notificationHTML)
                .join("")
            : `
                <div class="empty-state">
                    Keine Benachrichtigungen
                </div>
            `;
}

function renderNotifications() {

    const container =
        el("notificationsList");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.notifications
            .map(notificationHTML)
            .join("");

    setHidden(
        "notificationsEmpty",
        state.notifications.length > 0
    );
}

async function markVisibleNotificationsRead() {

    const unread =
        unreadNotifications();

    if (!unread.length) {
        return;
    }

    await Promise.all(
        unread.map(
            notification =>
                supabaseClient.rpc(
                    "mark_notification_read",
                    {
                        p_notification_id:
                            notification.id
                    }
                )
        )
    );

    await loadNotifications();
}

function closeNotificationPopover() {

    setHidden(
        "notificationPopover",
        true
    );

    el("notificationButton")
        ?.setAttribute(
            "aria-expanded",
            "false"
        );
}


// ============================================================
// GENERIC CART
// ============================================================

function cartQuantity(
    cart,
    id
) {

    return Number(
        cart.get(id) || 0
    );
}

function changeCart(
    cart,
    id,
    delta
) {

    const next =
        Math.max(
            0,
            cartQuantity(cart, id) +
            delta
        );

    if (next === 0) {
        cart.delete(id);
    } else {
        cart.set(id, next);
    }
}

function clearAllCarts() {

    state.drinksCart.clear();
    state.bakeryCart.clear();
    state.eventCart.clear();

    state.drinksPaymentCents = "";
    state.bakeryPaymentCents = "";
    state.eventPaymentCents = "";
}

function productCartTotal(
    cart,
    products
) {

    let total = 0;

    cart.forEach(
        (quantity, id) => {

            const product =
                products.find(
                    item =>
                        item.id === id
                );

            if (product) {

                total +=
                    Number(product.price) *
                    quantity;
            }
        }
    );

    return Math.round(
        total * 100
    ) / 100;
}

function cartPayload(
    cart,
    idKey
) {

    return Array.from(
        cart.entries()
    )
        .filter(
            ([, quantity]) =>
                quantity > 0
        )
        .map(
            ([id, quantity]) => ({
                [idKey]: id,
                quantity
            })
        );
}


// ============================================================
// PRODUCT CARDS / CARTS
// ============================================================

function renderProductGrid(
    containerId,
    products,
    cart,
    rerender
) {

    const container =
        el(containerId);

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!products.length) {

        container.innerHTML = `
            <div class="empty-state">
                <span>📦</span>
                <strong>Keine Produkte</strong>
            </div>
        `;

        return;
    }

    products.forEach(product => {

        const quantity =
            cartQuantity(
                cart,
                product.id
            );

        const button =
            document.createElement(
                "button"
            );

        button.type = "button";
        button.className =
            "product-card";

        button.innerHTML = `
            <span class="product-card-icon">
                ${escapeHtml(
                    product.icon || "📦"
                )}
            </span>

            <strong>
                ${escapeHtml(product.name)}
            </strong>

            <small>
                ${euro(product.price)}
            </small>

            ${
                quantity
                    ? `<span class="product-quantity-badge">${quantity}</span>`
                    : ""
            }
        `;

        button.addEventListener(
            "click",
            () => {

                changeCart(
                    cart,
                    product.id,
                    1
                );

                rerender();
            }
        );

        container.appendChild(button);
    });
}

function renderCart(
    containerId,
    totalId,
    payButtonId,
    cart,
    products,
    rerender
) {

    const container =
        el(containerId);

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!cart.size) {

        container.innerHTML = `
            <div class="empty-state compact">
                Warenkorb ist leer.
            </div>
        `;
    }

    cart.forEach(
        (quantity, id) => {

            const product =
                products.find(
                    item =>
                        item.id === id
                );

            if (!product) {
                return;
            }

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "cart-item";

            row.innerHTML = `
                <div class="cart-item-main">
                    <span>
                        ${escapeHtml(
                            product.icon || "📦"
                        )}
                    </span>

                    <div>
                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <small>
                            ${euro(product.price)}
                        </small>
                    </div>
                </div>

                <div class="quantity-controls">
                    <button
                        type="button"
                        data-action="minus"
                    >−</button>

                    <strong>${quantity}</strong>

                    <button
                        type="button"
                        data-action="plus"
                    >+</button>
                </div>
            `;

            row.querySelector(
                '[data-action="minus"]'
            )
                .addEventListener(
                    "click",
                    () => {

                        changeCart(
                            cart,
                            id,
                            -1
                        );

                        rerender();
                    }
                );

            row.querySelector(
                '[data-action="plus"]'
            )
                .addEventListener(
                    "click",
                    () => {

                        changeCart(
                            cart,
                            id,
                            1
                        );

                        rerender();
                    }
                );

            container.appendChild(row);
        }
    );

    const total =
        productCartTotal(
            cart,
            products
        );

    setText(
        totalId,
        euro(total)
    );

    const pay =
        el(payButtonId);

    if (pay) {
        pay.disabled =
            total <= 0;
    }
}


// ============================================================
// GETRÄNKE
// ============================================================

function renderDrinksSale() {

    const products =
        activeProducts("getränke");

    renderProductGrid(
        "drinksProductGrid",
        products,
        state.drinksCart,
        renderDrinksSale
    );

    renderCart(
        "drinksCartItems",
        "drinksCartTotal",
        "drinksPayButton",
        state.drinksCart,
        products,
        renderDrinksSale
    );

    setHidden(
        "drinksTestBanner",
        !state.drinksTestMode
    );

    setHidden(
        "drinksSaleModeBadge",
        !state.drinksTestMode
    );
}

function openDrinks() {

    state.drinksTestMode =
        isTeacher();

    state.drinksCart.clear();
    state.drinksPaymentCents = "";

    renderDrinksSale();

    showScreen(
        "drinksSaleScreen"
    );
}


// ============================================================
// BÄCKEREI
// ============================================================

function renderBakerySale() {

    const products =
        activeProducts("bäckerei");

    renderProductGrid(
        "bakeryProductGrid",
        products,
        state.bakeryCart,
        renderBakerySale
    );

    renderCart(
        "bakeryCartItems",
        "bakeryCartTotal",
        "bakeryPayButton",
        state.bakeryCart,
        products,
        renderBakerySale
    );

    setHidden(
        "bakerySaleTestBanner",
        !state.bakeryTestMode
    );
}

function openBakery() {

    state.bakeryTestMode =
        isTeacher();

    setHidden(
        "bakeryMenuTestBanner",
        !state.bakeryTestMode
    );

    showScreen(
        "bakeryMenuScreen"
    );
}

function openBakerySale() {

    state.bakeryCart.clear();
    state.bakeryPaymentCents = "";

    renderBakerySale();

    showScreen(
        "bakerySaleScreen"
    );
}


// ============================================================
// PAYMENT KEYPADS
// ============================================================

function paymentAmount(
    centsString
) {

    if (!centsString) {
        return 0;
    }

    return Number(centsString) /
        100;
}

function appendPaymentDigit(
    current,
    value
) {

    let result =
        String(current || "") +
        String(value);

    result =
        result.replace(/^0+(?=\d)/, "");

    return result.slice(0, 8);
}

function renderPayment(
    context
) {

    let total = 0;
    let cents = "";

    if (context === "drinks") {

        total =
            productCartTotal(
                state.drinksCart,
                activeProducts("getränke")
            );

        cents =
            state.drinksPaymentCents;
    }

    if (context === "bakery") {

        total =
            productCartTotal(
                state.bakeryCart,
                activeProducts("bäckerei")
            );

        cents =
            state.bakeryPaymentCents;
    }

    if (context === "event") {

        total =
            productCartTotal(
                state.eventCart,
                state.currentEventProducts
            );

        cents =
            state.eventPaymentCents;
    }

    const received =
        paymentAmount(cents);

    const change =
        Math.max(
            0,
            received - total
        );

    setText(
        `${context}PaymentTotal`,
        euro(total)
    );

    setText(
        `${context}AmountReceived`,
        euro(received)
    );

    setText(
        `${context}ChangeAmount`,
        euro(change)
    );

    const paidButton =
        el(`${context}PaidButton`);

    if (paidButton) {

        paidButton.disabled =
            total <= 0 ||
            received < total;
    }
}

function setupPaymentKeypad(
    context
) {

    const keypad =
        el(`${context}PaymentKeypad`);

    if (!keypad) {
        return;
    }

    keypad.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-value]"
                );

            if (!button) {
                return;
            }

            const value =
                button.dataset.value;

            const key =
                context === "drinks"
                    ? "drinksPaymentCents"
                    : context === "bakery"
                        ? "bakeryPaymentCents"
                        : "eventPaymentCents";

            state[key] =
                appendPaymentDigit(
                    state[key],
                    value
                );

            renderPayment(context);
        }
    );

    on(
        `${context}DeletePaymentButton`,
        "click",
        () => {

            const key =
                context === "drinks"
                    ? "drinksPaymentCents"
                    : context === "bakery"
                        ? "bakeryPaymentCents"
                        : "eventPaymentCents";

            state[key] =
                String(state[key])
                    .slice(0, -1);

            renderPayment(context);
        }
    );
}

function openPayment(
    context
) {

    if (context === "drinks") {

        state.drinksPaymentCents =
            "";

        setHidden(
            "drinksPaymentTestBanner",
            !state.drinksTestMode
        );

        showScreen(
            "drinksPaymentScreen"
        );
    }

    if (context === "bakery") {

        state.bakeryPaymentCents =
            "";

        setHidden(
            "bakeryPaymentTestBanner",
            !state.bakeryTestMode
        );

        showScreen(
            "bakeryPaymentScreen"
        );
    }

    if (context === "event") {

        state.eventPaymentCents =
            "";

        setHidden(
            "eventPaymentTestBanner",
            !state.eventTestMode
        );

        showScreen(
            "eventPaymentScreen"
        );
    }

    renderPayment(context);
}


// ============================================================
// SAVE SALES
// ============================================================

async function completeDrinksSale() {

    const products =
        activeProducts("getränke");

    const total =
        productCartTotal(
            state.drinksCart,
            products
        );

    const payment =
        paymentAmount(
            state.drinksPaymentCents
        );

    const change =
        payment - total;

    const button =
        el("drinksPaidButton");

    button.disabled = true;

    try {

        if (!state.drinksTestMode) {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "create_sale_order",
                    {
                        p_area:
                            "getränke",

                        p_items:
                            cartPayload(
                                state.drinksCart,
                                "product_id"
                            ),

                        p_payment_amount:
                            payment
                    }
                );

            if (error) {
                throw error;
            }

            setText(
                "drinksSuccessDescription",
                "Verkauf wurde gespeichert."
            );

        } else {

            setText(
                "drinksSuccessDescription",
                "Testverkauf – keine Daten wurden gespeichert."
            );
        }

        setText(
            "drinksSuccessChange",
            euro(change)
        );

        state.drinksCart.clear();
        state.drinksPaymentCents = "";

        showScreen(
            "drinksSuccessScreen"
        );

    } catch (error) {

        showToast(
            errorMessage(error),
            "error"
        );

    } finally {

        button.disabled = false;
    }
}

async function completeBakerySale() {

    const products =
        activeProducts("bäckerei");

    const total =
        productCartTotal(
            state.bakeryCart,
            products
        );

    const payment =
        paymentAmount(
            state.bakeryPaymentCents
        );

    const change =
        payment - total;

    const button =
        el("bakeryPaidButton");

    button.disabled = true;

    try {

        let orderNumber;

        if (!state.bakeryTestMode) {

            const {
                data,
                error
            } =
                await supabaseClient.rpc(
                    "create_sale_order",
                    {
                        p_area:
                            "bäckerei",

                        p_items:
                            cartPayload(
                                state.bakeryCart,
                                "product_id"
                            ),

                        p_payment_amount:
                            payment
                    }
                );

            if (error) {
                throw error;
            }

            orderNumber =
                data.order_number;

        } else {

            orderNumber =
                randomTestOrderNumber(
                    state.bakeryTestOrders
                );

            state.bakeryTestOrders.push({
                id:
                    crypto.randomUUID(),

                order_number:
                    orderNumber,

                status:
                    "offen",

                created_at:
                    new Date().toISOString(),

                items:
                    cartPayload(
                        state.bakeryCart,
                        "product_id"
                    ).map(item => {

                        const product =
                            products.find(
                                p =>
                                    p.id ===
                                    item.product_id
                            );

                        return {
                            product_name:
                                product?.name || "",
                            quantity:
                                item.quantity
                        };
                    })
            });
        }

        setText(
            "bakerySuccessOrderNumber",
            String(orderNumber)
                .padStart(3, "0")
        );

        setText(
            "bakerySuccessChange",
            euro(change)
        );

        state.bakeryCart.clear();
        state.bakeryPaymentCents = "";

        showScreen(
            "bakerySuccessScreen"
        );

    } catch (error) {

        showToast(
            errorMessage(error),
            "error"
        );

    } finally {

        button.disabled = false;
    }
}

function randomTestOrderNumber(
    orders
) {

    const used =
        new Set(
            orders
                .filter(
                    order =>
                        order.status !==
                        "ausgegeben"
                )
                .map(
                    order =>
                        Number(
                            order.order_number
                        )
                )
        );

    for (
        let attempt = 0;
        attempt < 1000;
        attempt += 1
    ) {

        const number =
            Math.floor(
                100 +
                Math.random() * 900
            );

        if (!used.has(number)) {
            return number;
        }
    }

    return 999;
}


// ============================================================
// BÄCKEREI AUSGABE
// ============================================================

async function renderBakeryOutput() {

    setHidden(
        "bakeryOutputTestBanner",
        !state.bakeryTestMode
    );

    let orders = [];

    if (state.bakeryTestMode) {

        orders =
            state.bakeryTestOrders
                .filter(
                    order =>
                        order.status ===
                        "offen"
                );

    } else {

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
                .eq(
                    "status",
                    "offen"
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        orders =
            (data || [])
                .map(order => ({
                    ...order,
                    items:
                        order.order_items ||
                        []
                }));
    }

    setText(
        "bakeryOpenOrderCount",
        orders.length
    );

    setHidden(
        "bakeryOutputEmpty",
        orders.length > 0
    );

    const container =
        el("bakeryOutputOrders");

    container.innerHTML = "";

    orders.forEach(order => {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "output-order-card";

        card.innerHTML = `
            <div class="output-order-number">
                ${String(
                    order.order_number
                ).padStart(3, "0")}
            </div>

            <div class="output-order-items">
                ${(order.items || [])
                    .map(
                        item => `
                            <div>
                                <strong>
                                    ${item.quantity}×
                                </strong>
                                ${escapeHtml(
                                    item.product_name
                                )}
                            </div>
                        `
                    )
                    .join("")}
            </div>

            <button
                class="primary-action full-width-button"
                type="button"
            >
                ✓ Ausgegeben
            </button>
        `;

        card.querySelector("button")
            .addEventListener(
                "click",
                async () => {

                    try {

                        if (
                            state.bakeryTestMode
                        ) {

                            const test =
                                state.bakeryTestOrders
                                    .find(
                                        row =>
                                            row.id ===
                                            order.id
                                    );

                            if (test) {
                                test.status =
                                    "ausgegeben";
                            }

                        } else {

                            const {
                                error
                            } =
                                await supabaseClient.rpc(
                                    "serve_bakery_order",
                                    {
                                        p_order_id:
                                            order.id
                                    }
                                );

                            if (error) {
                                throw error;
                            }
                        }

                        await renderBakeryOutput();

                    } catch (error) {

                        showToast(
                            errorMessage(error),
                            "error"
                        );
                    }
                }
            );

        container.appendChild(card);
    });
}


// ============================================================
// FREE DRINKS
// ============================================================

function openFreeDrinks(
    context = "getränke",
    eventId = null
) {

    state.freeDrinksContext =
        context;

    state.freeDrinksEventId =
        eventId;

    state.freeDrinkQuantities =
        {};

    setHidden(
        "freeDrinksTestBanner",
        !(
            state.drinksTestMode ||
            state.eventTestMode
        )
    );

    renderFreeDrinks();

    showScreen(
        "freeDrinksScreen"
    );
}

function renderFreeDrinks() {

    const container =
        el("freeDrinksList");

    container.innerHTML = "";

    activeProducts("getränke")
        .forEach(product => {

            const quantity =
                Number(
                    state.freeDrinkQuantities[
                        product.id
                    ] || 0
                );

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "quantity-product-row";

            row.innerHTML = `
                <div class="quantity-product-main">
                    <span>
                        ${escapeHtml(
                            product.icon || "🥤"
                        )}
                    </span>

                    <strong>
                        ${escapeHtml(product.name)}
                    </strong>
                </div>

                <div class="quantity-controls">
                    <button
                        type="button"
                        data-minus
                    >−</button>

                    <strong>
                        ${quantity}
                    </strong>

                    <button
                        type="button"
                        data-plus
                    >+</button>
                </div>
            `;

            row.querySelector(
                "[data-minus]"
            )
                .addEventListener(
                    "click",
                    () => {

                        state.freeDrinkQuantities[
                            product.id
                        ] =
                            Math.max(
                                0,
                                quantity - 1
                            );

                        renderFreeDrinks();
                    }
                );

            row.querySelector(
                "[data-plus]"
            )
                .addEventListener(
                    "click",
                    () => {

                        state.freeDrinkQuantities[
                            product.id
                        ] =
                            quantity + 1;

                        renderFreeDrinks();
                    }
                );

            container.appendChild(row);
        });
}

async function saveFreeDrinks() {

    const items =
        Object.entries(
            state.freeDrinkQuantities
        )
            .filter(
                ([, quantity]) =>
                    quantity > 0
            )
            .map(
                ([product_id, quantity]) => ({
                    product_id,
                    quantity
                })
            );

    const testMode =
        state.freeDrinksContext ===
        "sonderveranstaltung"
            ? state.eventTestMode
            : state.drinksTestMode;

    try {

        if (
            !testMode &&
            items.length
        ) {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "record_free_drinks",
                    {
                        p_items:
                            items,

                        p_context:
                            state.freeDrinksContext,

                        p_event_id:
                            state.freeDrinksEventId
                    }
                );

            if (error) {
                throw error;
            }
        }

        state.freeDrinkQuantities =
            {};

        showToast(
            testMode
                ? "Testschicht beendet – keine Daten gespeichert."
                : "Schicht beendet.",
            "success"
        );

        if (
            state.freeDrinksContext ===
            "sonderveranstaltung" &&
            state.currentEvent
        ) {
            openEventWorkspace(
                state.currentEvent.id
            );
        } else {
            goHome();
        }

    } catch (error) {

        showToast(
            errorMessage(error),
            "error"
        );
    }
}


// ============================================================
// EDIT MENU
// ============================================================

function openEditMenu() {

    updateRoleUI();

    showScreen(
        "editMenuScreen"
    );
}


// ============================================================
// PRODUCTS ADMIN
// ============================================================

function renderCurrentProductViews() {

    if (
        visibleScreenId() ===
        "drinksSaleScreen"
    ) {
        renderDrinksSale();
    }

    if (
        visibleScreenId() ===
        "bakerySaleScreen"
    ) {
        renderBakerySale();
    }

    if (
        visibleScreenId() ===
        "productsScreen"
    ) {
        renderProductAdmin();
    }

    if (
        visibleScreenId() ===
        "studentInventoryScreen"
    ) {
        renderStudentInventory();
    }

    if (
        visibleScreenId() ===
        "teacherInventoryScreen"
    ) {
        renderTeacherInventory();
    }
}

function renderProductAdmin() {

    const container =
        el("productAdminList");

    if (!container) {
        return;
    }

    let products =
        state.products.slice();

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

    products.sort(
        (a, b) =>
            String(a.name)
                .localeCompare(
                    String(b.name),
                    "de"
                )
    );

    container.innerHTML = "";

    products.forEach(product => {

        const row =
            document.createElement(
                "article"
            );

        row.className =
            "product-admin-row";

        row.innerHTML = `
            <div class="product-admin-main">
                <span class="product-admin-icon">
                    ${escapeHtml(
                        product.icon || "📦"
                    )}
                </span>

                <div>
                    <strong>
                        ${escapeHtml(product.name)}
                    </strong>

                    <small>
                        ${escapeHtml(product.category)}
                        ·
                        ${euro(product.price)}
                        ${
                            product.active
                                ? ""
                                : " · Inaktiv"
                        }
                    </small>
                </div>
            </div>

            ${
                isTeacher()
                    ? `
                        <button
                            class="secondary-action"
                            type="button"
                        >
                            Bearbeiten
                        </button>
                    `
                    : ""
            }
        `;

        if (isTeacher()) {

            row.querySelector("button")
                .addEventListener(
                    "click",
                    () =>
                        openProductModal(
                            product
                        )
                );
        }

        container.appendChild(row);
    });
}

function openProductModal(
    product = null
) {

    if (!isTeacher()) {
        return;
    }

    state.editingProductId =
        product?.id || null;

    setText(
        "productModalTitle",
        product
            ? "Produkt bearbeiten"
            : "Produkt hinzufügen"
    );

    el("productIdInput").value =
        product?.id || "";

    el("productNameInput").value =
        product?.name || "";

    el("productPriceInput").value =
        product
            ? Number(product.price)
                .toFixed(2)
                .replace(".", ",")
            : "";

    el("productCategoryInput").value =
        product?.category ||
        "getränke";

    el("productIconInput").value =
        product?.icon || "🥤";

    el("productActiveInput").checked =
        product
            ? Boolean(product.active)
            : true;

    setText(
        "productFormMessage",
        ""
    );

    setHidden(
        "productModal",
        false
    );
}

function closeProductModal() {

    setHidden(
        "productModal",
        true
    );

    state.editingProductId =
        null;
}

function createProductId(
    name
) {

    const base =
        String(name)
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(/ß/g, "ss")
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );

    return (
        base ||
        `produkt-${Date.now()}`
    );
}

async function saveProduct(
    event
) {

    event.preventDefault();

    if (!isTeacher()) {
        return;
    }

    const name =
        el("productNameInput")
            .value
            .trim();

    const price =
        parseMoney(
            el("productPriceInput")
                .value
        );

    const category =
        el("productCategoryInput")
            .value;

    const icon =
        el("productIconInput")
            .value
            .trim() ||
        "📦";

    const active =
        el("productActiveInput")
            .checked;

    if (
        !name ||
        !Number.isFinite(price) ||
        price < 0
    ) {

        setText(
            "productFormMessage",
            "Bitte Name und gültigen Preis eingeben."
        );

        return;
    }

    try {

        if (state.editingProductId) {

            const {
                error
            } =
                await supabaseClient
                    .from("products")
                    .update({
                        name,
                        price,
                        category,
                        icon,
                        active
                    })
                    .eq(
                        "id",
                        state.editingProductId
                    );

            if (error) {
                throw error;
            }

        } else {

            let id =
                createProductId(name);

            if (
                state.products.some(
                    product =>
                        product.id === id
                )
            ) {
                id =
                    `${id}-${Date.now()
                        .toString()
                        .slice(-5)}`;
            }

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
                        active
                    });

            if (error) {
                throw error;
            }
        }

        closeProductModal();

        await loadProducts();

        showToast(
            "Produkt gespeichert.",
            "success"
        );

    } catch (error) {

        setText(
            "productFormMessage",
            errorMessage(error)
        );
    }
}


// ============================================================
// STUDENT INVENTORY
// ============================================================

function renderStudentInventory() {

    const container =
        el("studentInventoryList");

    container.innerHTML = "";

    activeProducts("getränke")
        .forEach(product => {

            const row =
                document.createElement(
                    "label"
                );

            row.className =
                "inventory-count-row";

            row.innerHTML = `
                <div>
                    <span>
                        ${escapeHtml(
                            product.icon || "🥤"
                        )}
                    </span>

                    <strong>
                        ${escapeHtml(product.name)}
                    </strong>
                </div>

                <input
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    data-product-id="${escapeHtml(product.id)}"
                    placeholder="0"
                >
            `;

            container.appendChild(row);
        });
}

async function submitStudentInventory() {

    const inputs =
        all(
            "#studentInventoryList [data-product-id]"
        );

    const items =
        inputs.map(input => ({
            product_id:
                input.dataset.productId,
            quantity:
                Math.max(
                    0,
                    Number(input.value || 0)
                )
        }));

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "submit_inventory_count",
                {
                    p_items:
                        items,

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

        setText(
            "studentInventoryMessage",
            "Inventur wurde an den Lehrer geschickt."
        );

        showToast(
            "Inventur gesendet.",
            "success"
        );

    } catch (error) {

        setText(
            "studentInventoryMessage",
            errorMessage(error)
        );
    }
}


// ============================================================
// TEACHER INVENTORY
// ============================================================

async function openTeacherInventory(
    invoice = null
) {

    if (!isTeacher()) {
        return;
    }

    state.invoiceForInventory =
        invoice;

    await loadInventory();

    renderTeacherInventory();

    await renderInventorySubmissions();

    showScreen(
        "teacherInventoryScreen"
    );
}

function renderTeacherInventory() {

    const invoice =
        state.invoiceForInventory;

    setHidden(
        "inventoryInvoiceContextCard",
        !invoice
    );

    if (invoice) {

        setText(
            "inventoryInvoiceNumber",
            invoice.invoice_number ||
            "—"
        );

        setText(
            "inventoryInvoiceSupplier",
            invoice.supplier ||
            "—"
        );
    }

    const container =
        el("teacherInventoryList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    activeProducts("getränke")
        .forEach(product => {

            const stock =
                Number(
                    state.inventory[
                        product.id
                    ] || 0
                );

            const row =
                document.createElement(
                    "article"
                );

            row.className =
                "teacher-inventory-row";

            row.innerHTML = `
                <div class="teacher-inventory-product">
                    <span>
                        ${escapeHtml(
                            product.icon || "🥤"
                        )}
                    </span>

                    <div>
                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <small>
                            Aktuell: ${stock}
                        </small>
                    </div>
                </div>

                <label>
                    <span>Menge hinzufügen</span>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        inputmode="numeric"
                        data-quantity
                        placeholder="0"
                    >
                </label>

                <label>
                    <span>Einkaufspreis / Stück</span>
                    <input
                        type="text"
                        inputmode="decimal"
                        data-price
                        placeholder="optional"
                    >
                </label>

                <button
                    type="button"
                    class="primary-action"
                >
                    Hinzufügen
                </button>
            `;

            row.querySelector("button")
                .addEventListener(
                    "click",
                    async () => {

                        const quantity =
                            Number(
                                row.querySelector(
                                    "[data-quantity]"
                                ).value
                            );

                        const priceText =
                            row.querySelector(
                                "[data-price]"
                            ).value.trim();

                        const price =
                            priceText
                                ? parseMoney(
                                    priceText
                                )
                                : null;

                        if (
                            !Number.isInteger(
                                quantity
                            ) ||
                            quantity <= 0
                        ) {

                            showToast(
                                "Bitte eine gültige Menge eingeben.",
                                "error"
                            );

                            return;
                        }

                        if (
                            priceText &&
                            (
                                !Number.isFinite(
                                    price
                                ) ||
                                price < 0
                            )
                        ) {

                            showToast(
                                "Bitte einen gültigen Einkaufspreis eingeben.",
                                "error"
                            );

                            return;
                        }

                        try {

                            const {
                                error
                            } =
                                await supabaseClient.rpc(
                                    "teacher_add_stock",
                                    {
                                        p_product_id:
                                            product.id,

                                        p_quantity:
                                            quantity,

                                        p_invoice_id:
                                            invoice?.id ||
                                            null,

                                        p_unit_purchase_price:
                                            price
                                    }
                                );

                            if (error) {
                                throw error;
                            }

                            row.querySelector(
                                "[data-quantity]"
                            ).value = "";

                            row.querySelector(
                                "[data-price]"
                            ).value = "";

                            await Promise.all([
                                loadInventory(),
                                loadProducts()
                            ]);

                            showToast(
                                "Wareneingang gespeichert.",
                                "success"
                            );

                        } catch (error) {

                            showToast(
                                errorMessage(error),
                                "error"
                            );
                        }
                    }
                );

            container.appendChild(row);
        });
}

async function renderInventorySubmissions() {

    if (!isTeacher()) {
        return;
    }

    const container =
        el(
            "inventorySubmissionsList"
        );

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
                id,
                context,
                inventory_type,
                status,
                submitted_at,
                submitted_by,
                inventory_submission_items (
                    product_name,
                    quantity
                )
            `)
            .order(
                "submitted_at",
                {
                    ascending: false
                }
            )
            .limit(20);

    if (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-state">
                Inventuren konnten nicht geladen werden.
            </div>
        `;

        return;
    }

    const submissions =
        data || [];

    container.innerHTML =
        submissions.length
            ? submissions
                .map(
                    submission => `
                        <article class="submission-card">
                            <div>
                                <strong>
                                    ${escapeHtml(
                                        formatDateTime(
                                            submission.submitted_at
                                        )
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        submission.status ||
                                        "eingereicht"
                                    )}
                                </small>
                            </div>

                            <div>
                                ${(submission.inventory_submission_items || [])
                                    .map(
                                        item => `
                                            <span>
                                                ${escapeHtml(
                                                    item.product_name
                                                )}: 
                                                <strong>
                                                    ${Number(
                                                        item.quantity
                                                    )}
                                                </strong>
                                            </span>
                                        `
                                    )
                                    .join(" · ")}
                            </div>
                        </article>
                    `
                )
                .join("")
            : `
                <div class="empty-state">
                    Noch keine Inventuren eingereicht.
                </div>
            `;
}


// ============================================================
// INVOICES
// ============================================================

async function openInvoices() {

    if (!isTeacher()) {
        return;
    }

    const dateInput =
        el("invoiceDateInput");

    if (!dateInput.value) {
        dateInput.value =
            localDateKey();
    }

    await populateInvoiceEvents();

    await updateInvoiceNumberPreview();

    await renderInvoices();

    showScreen(
        "invoicesScreen"
    );
}

async function updateInvoiceNumberPreview() {

    if (!isTeacher()) {
        return;
    }

    const date =
        el("invoiceDateInput")
            .value;

    if (!date) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "preview_next_invoice_number",
            {
                p_invoice_date:
                    date
            }
        );

    if (error) {

        console.error(error);

        setText(
            "invoiceNumberInput",
            ""
        );

        return;
    }

    el("invoiceNumberInput").value =
        data || "";
}

async function populateInvoiceEvents() {

    const select =
        el("invoiceEventSelect");

    if (!select) {
        return;
    }

    select.innerHTML = "";

    state.events
        .slice()
        .sort(
            (a, b) =>
                String(b.event_date)
                    .localeCompare(
                        String(a.event_date)
                    )
        )
        .forEach(event => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                event.id;

            option.textContent =
                `${event.name} – ${formatDate(
                    event.event_date
                )}`;

            select.appendChild(option);
        });

    const other =
        document.createElement(
            "option"
        );

    other.value =
        "__create__";

    other.textContent =
        "Andere Veranstaltung …";

    select.appendChild(other);
}

function updateInvoiceContextUI() {

    const special =
        el("invoiceContextSelect")
            .value ===
        "sonderveranstaltung";

    setHidden(
        "invoiceEventField",
        !special
    );
}

async function saveInvoice(
    event
) {

    event.preventDefault();

    if (!isTeacher()) {
        return;
    }

    const context =
        el("invoiceContextSelect")
            .value;

    const date =
        el("invoiceDateInput")
            .value;

    const supplier =
        el("invoiceSupplierInput")
            .value
            .trim();

    const total =
        parseMoney(
            el("invoiceTotalInput")
                .value
        );

    let eventId =
        null;

    if (
        context ===
        "sonderveranstaltung"
    ) {

        eventId =
            el("invoiceEventSelect")
                .value;

        if (
            eventId ===
            "__create__"
        ) {

            showToast(
                "Bitte zuerst die neue Veranstaltung erstellen.",
                "info"
            );

            showScreen(
                "eventTypeScreen"
            );

            return;
        }

        if (!eventId) {

            setText(
                "invoiceFormMessage",
                "Bitte eine Veranstaltung auswählen."
            );

            return;
        }
    }

    if (
        !date ||
        !Number.isFinite(total) ||
        total < 0
    ) {

        setText(
            "invoiceFormMessage",
            "Bitte Datum und gültige Gesamtkosten eingeben."
        );

        return;
    }

    const button =
        el("saveInvoiceButton");

    button.disabled = true;

    try {

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
                        date,

                    p_supplier:
                        supplier,

                    p_total_amount:
                        total,

                    p_created_by:
                        null,

                    p_event_id:
                        eventId
                }
            );

        if (error) {
            throw error;
        }

        el("invoiceSupplierInput").value =
            "";

        el("invoiceTotalInput").value =
            "";

        setText(
            "invoiceFormMessage",
            `Rechnung ${data.invoice_number} gespeichert.`
        );

        await updateInvoiceNumberPreview();
        await renderInvoices();

        showToast(
            "Rechnung gespeichert.",
            "success"
        );

        if (
            context ===
            "getränke"
        ) {

            await openTeacherInventory(
                data
            );
        }

    } catch (error) {

        setText(
            "invoiceFormMessage",
            errorMessage(error)
        );

    } finally {

        button.disabled = false;
    }
}

async function renderInvoices() {

    if (!isTeacher()) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("invoices")
            .select(`
                id,
                context,
                event_id,
                invoice_date,
                supplier,
                invoice_number,
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

    const container =
        el("invoiceList");

    if (error) {

        console.error(error);

        container.innerHTML =
            "Rechnungen konnten nicht geladen werden.";

        return;
    }

    container.innerHTML =
        (data || [])
            .map(invoice => `
                <article class="invoice-list-row">
                    <div>
                        <strong>
                            ${escapeHtml(
                                invoice.invoice_number ||
                                "—"
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                formatDate(
                                    invoice.invoice_date
                                )
                            )}
                            ·
                            ${escapeHtml(
                                invoice.context
                            )}
                        </small>
                    </div>

                    <div>
                        <span>
                            ${escapeHtml(
                                invoice.supplier ||
                                "—"
                            )}
                        </span>

                        <strong>
                            ${euro(
                                invoice.total_amount
                            )}
                        </strong>
                    </div>
                </article>
            `)
            .join("");
}


// ============================================================
// STUDENTS
// ============================================================

async function openStudents() {

    if (!isTeacher()) {
        return;
    }

    await renderStudents();

    showScreen(
        "studentsScreen"
    );
}

async function loadStudentList() {

    /*
     * get_login_people() gibt absichtlich keine PIN-Hashes zurück.
     * Das ist auch für die Schülerverwaltung die sichere Quelle.
     */

    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "get_login_people"
        );

    if (error) {
        throw error;
    }

    return (data || [])
        .filter(
            person =>
                person.person_type ===
                "schüler"
        );
}

async function renderStudents() {

    const container =
        el("studentsList");

    try {

        const students =
            await loadStudentList();

        container.innerHTML = "";

        students.forEach(student => {

            const row =
                document.createElement(
                    "article"
                );

            row.className =
                "student-row";

            row.innerHTML = `
                <div>
                    <strong>
                        ${escapeHtml(
                            personName(student)
                        )}
                    </strong>
                </div>

                <div class="button-row">
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
            `;

            row.querySelector(
                "[data-edit]"
            )
                .addEventListener(
                    "click",
                    () =>
                        openStudentModal(
                            student
                        )
                );

            row.querySelector(
                "[data-delete]"
            )
                .addEventListener(
                    "click",
                    () => {

                        openConfirm(
                            "Schüler löschen",
                            `${personName(student)} wirklich deaktivieren?`,
                            async () => {

                                const {
                                    error
                                } =
                                    await supabaseClient.rpc(
                                        "teacher_deactivate_student",
                                        {
                                            p_student_id:
                                                student.id
                                        }
                                    );

                                if (error) {
                                    throw error;
                                }

                                await renderStudents();

                                showToast(
                                    "Schüler deaktiviert.",
                                    "success"
                                );
                            }
                        );
                    }
                );

            container.appendChild(row);
        });

    } catch (error) {

        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    errorMessage(error)
                )}
            </div>
        `;
    }
}

function openStudentModal(
    student = null
) {

    state.editingStudent =
        student;

    setText(
        "studentModalTitle",
        student
            ? "Schüler bearbeiten"
            : "Schüler hinzufügen"
    );

    el("studentIdInput").value =
        student?.id || "";

    el("studentFirstNameInput").value =
        student?.first_name || "";

    el("studentLastNameInput").value =
        student?.last_name || "";

    /*
     * get_login_people() liefert student_number
     * absichtlich nicht. Bei bestehenden Schülern
     * wird das Feld deshalb leer gelassen.
     */
    el("studentNumberInput").value =
        student?.student_number || "";

    el("studentPinInput").value =
        "";

    setText(
        "studentPinHint",
        student
            ? "Leer lassen = PIN behalten"
            : "4 Ziffern"
    );

    setText(
        "studentFormMessage",
        ""
    );

    setHidden(
        "studentModal",
        false
    );
}

function closeStudentModal() {

    setHidden(
        "studentModal",
        true
    );

    state.editingStudent =
        null;
}

async function saveStudent(
    event
) {

    event.preventDefault();

    if (!isTeacher()) {
        return;
    }

    const firstName =
        el("studentFirstNameInput")
            .value
            .trim();

    const lastName =
        el("studentLastNameInput")
            .value
            .trim();

    const studentNumber =
        el("studentNumberInput")
            .value
            .trim();

    const pin =
        el("studentPinInput")
            .value
            .trim();

    if (!firstName) {

        setText(
            "studentFormMessage",
            "Bitte einen Vornamen eingeben."
        );

        return;
    }

    if (
        (
            !state.editingStudent &&
            !/^[0-9]{4}$/.test(pin)
        ) ||
        (
            state.editingStudent &&
            pin &&
            !/^[0-9]{4}$/.test(pin)
        )
    ) {

        setText(
            "studentFormMessage",
            "Der PIN muss aus genau 4 Ziffern bestehen."
        );

        return;
    }

    try {

        if (state.editingStudent) {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "teacher_update_student",
                    {
                        p_student_id:
                            state.editingStudent.id,

                        p_first_name:
                            firstName,

                        p_last_name:
                            lastName,

                        p_pin:
                            pin || null,

                        p_student_number:
                            studentNumber
                    }
                );

            if (error) {
                throw error;
            }

        } else {

            const {
                error
            } =
                await supabaseClient.rpc(
                    "teacher_create_student",
                    {
                        p_first_name:
                            firstName,

                        p_last_name:
                            lastName,

                        p_pin:
                            pin,

                        p_student_number:
                            studentNumber
                    }
                );

            if (error) {
                throw error;
            }
        }

        closeStudentModal();

        await renderStudents();

        showToast(
            "Schüler gespeichert.",
            "success"
        );

    } catch (error) {

        setText(
            "studentFormMessage",
            errorMessage(error)
        );
    }
}


// ============================================================
// EVENTS LIST
// ============================================================

function renderEvents() {

    const upcoming =
        el("upcomingEventsList");

    const past =
        el("pastEventsList");

    if (
        !upcoming ||
        !past
    ) {
        return;
    }

    const today =
        localDateKey();

    const current =
        state.events
            .filter(
                event =>
                    event.status !==
                    "abgeschlossen"
            )
            .sort(
                (a, b) =>
                    String(a.event_date)
                        .localeCompare(
                            String(b.event_date)
                        )
            );

    const completed =
        state.events
            .filter(
                event =>
                    event.status ===
                    "abgeschlossen" ||
                    (
                        event.event_date <
                        today &&
                        event.event_type ===
                        "other"
                    )
            )
            .sort(
                (a, b) =>
                    String(b.event_date)
                        .localeCompare(
                            String(a.event_date)
                        )
            )
            .slice(0, 5);

    upcoming.innerHTML = "";
    past.innerHTML = "";

    const createCard =
        event => {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";
            button.className =
                "event-list-card";

            button.innerHTML = `
                <span class="event-list-icon">
                    ${
                        event.event_type ===
                        "food"
                            ? "🍔"
                            : "🎟️"
                    }
                </span>

                <span class="event-list-main">
                    <strong>
                        ${escapeHtml(event.name)}
                    </strong>

                    <small>
                        ${formatDate(
                            event.event_date
                        )}
                        ·
                        ${
                            event.event_type ===
                            "food"
                                ? "Food"
                                : "Anderes"
                        }
                    </small>
                </span>

                <span>›</span>
            `;

            button.addEventListener(
                "click",
                () =>
                    openEventWorkspace(
                        event.id
                    )
            );

            return button;
        };

    current.forEach(
        event =>
            upcoming.appendChild(
                createCard(event)
            )
    );

    completed.forEach(
        event =>
            past.appendChild(
                createCard(event)
            )
    );

    if (!current.length) {

        upcoming.innerHTML = `
            <div class="empty-state">
                Keine aktuellen Veranstaltungen.
            </div>
        `;
    }

    if (!completed.length) {

        past.innerHTML = `
            <div class="empty-state">
                Noch keine abgeschlossenen Veranstaltungen.
            </div>
        `;
    }
}

async function openEvents() {

    await loadEvents();

    renderEvents();

    showScreen(
        "eventsScreen"
    );
}


// ============================================================
// EVENT CREATION
// ============================================================

function openEventCreate(
    type
) {

    if (!isTeacher()) {
        return;
    }

    el("eventCreateTypeInput").value =
        type;

    el("eventNameInput").value =
        "";

    el("eventDateInput").value =
        localDateKey();

    el("eventDescriptionInput").value =
        "";

    el("eventDirectRevenueInput").value =
        "";

    el("eventStartInventoryInput").checked =
        false;

    setText(
        "eventCreateTitle",
        type === "food"
            ? "🍔 Food-Veranstaltung"
            : "🎟️ Andere Veranstaltung"
    );

    setHidden(
        "eventDirectRevenueField",
        type !== "other"
    );

    setHidden(
        "eventStartInventoryField",
        type !== "food"
    );

    setText(
        "eventCreateMessage",
        ""
    );

    showScreen(
        "eventCreateScreen"
    );
}

async function saveEvent(
    event
) {

    event.preventDefault();

    if (!isTeacher()) {
        return;
    }

    const type =
        el("eventCreateTypeInput")
            .value;

    const name =
        el("eventNameInput")
            .value
            .trim();

    const date =
        el("eventDateInput")
            .value;

    const description =
        el("eventDescriptionInput")
            .value
            .trim();

    const directRevenue =
        type === "other"
            ? parseMoney(
                el("eventDirectRevenueInput")
                    .value
            )
            : null;

    const wantsStartInventory =
        type === "food" &&
        el("eventStartInventoryInput")
            .checked;

    if (
        !name ||
        !date
    ) {

        setText(
            "eventCreateMessage",
            "Bitte Name und Datum eingeben."
        );

        return;
    }

    if (
        type === "other" &&
        (
            !Number.isFinite(
                directRevenue
            ) ||
            directRevenue < 0
        )
    ) {

        setText(
            "eventCreateMessage",
            "Bitte einen gültigen Umsatz eingeben."
        );

        return;
    }

    try {

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

                    p_description:
                        description || null,

                    p_direct_revenue:
                        directRevenue
                }
            );

        if (error) {
            throw error;
        }

        await loadEvents();

        state.currentEvent =
            data;

        if (wantsStartInventory) {

            /*
             * LM_V1_01 enthält noch keine RPC,
             * mit der eine Startinventur geschrieben
             * werden kann. Deshalb wird hier bewusst
             * KEIN unsicherer Direkt-Write erfunden.
             */
            showToast(
                "Veranstaltung erstellt. Die Startinventur wird mit LM_V1_02 ergänzt.",
                "info"
            );

        } else {

            showToast(
                "Veranstaltung erstellt.",
                "success"
            );
        }

        await openEventWorkspace(
            data.id
        );

    } catch (error) {

        setText(
            "eventCreateMessage",
            errorMessage(error)
        );
    }
}


// ============================================================
// EVENT WORKSPACE
// ============================================================

async function openEventWorkspace(
    eventId
) {

    const event =
        state.events.find(
            row =>
                row.id === eventId
        );

    if (!event) {

        await loadEvents();

        state.currentEvent =
            state.events.find(
                row =>
                    row.id === eventId
            ) || null;

    } else {

        state.currentEvent =
            event;
    }

    if (!state.currentEvent) {

        showToast(
            "Veranstaltung wurde nicht gefunden.",
            "error"
        );

        return;
    }

    const current =
        state.currentEvent;

    setText(
        "eventWorkspaceName",
        current.name
    );

    setText(
        "eventWorkspaceDate",
        formatDate(
            current.event_date
        )
    );

    setHTML(
        "eventWorkspaceInfo",
        `
            <strong>
                ${
                    current.event_type ===
                    "food"
                        ? "🍔 Food"
                        : "🎟️ Anderes"
                }
            </strong>

            ${
                current.description
                    ? `<p>${escapeHtml(
                        current.description
                    )}</p>`
                    : ""
            }

            <small>
                Status:
                ${escapeHtml(
                    current.status || "offen"
                )}
            </small>
        `
    );

    const food =
        current.event_type ===
        "food";

    setHidden(
        "foodEventWorkspace",
        !food
    );

    setHidden(
        "otherEventWorkspace",
        food
    );

    if (food) {

        state.eventTestMode =
            isTeacher();

        setHidden(
            "eventCashierTestBadge",
            !state.eventTestMode
        );

        setHidden(
            "eventOutputTestBadge",
            !state.eventTestMode
        );

        setText(
            "eventCashierDescription",
            state.eventTestMode
                ? "Testumgebung – keine Speicherung"
                : "Bestellungen aufnehmen"
        );

        setText(
            "eventOutputDescription",
            state.eventTestMode
                ? "Testumgebung – keine Speicherung"
                : "Bestellungen ausgeben"
        );

        await loadCurrentEventProducts();

    } else {

        setText(
            "otherEventRevenueDisplay",
            euro(
                current.direct_revenue ||
                0
            )
        );

        setHidden(
            "editOtherEventRevenueButton",
            !isTeacher()
        );
    }

    showScreen(
        "eventWorkspaceScreen"
    );
}


// ============================================================
// EVENT PRODUCTS
// ============================================================

async function loadCurrentEventProducts() {

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
        throw error;
    }

    state.currentEventProducts =
        data || [];

    renderEventProducts();
}

async function openEventProducts() {

    if (!state.currentEvent) {
        return;
    }

    await loadCurrentEventProducts();

    const select =
        el(
            "globalProductForEventSelect"
        );

    select.innerHTML = "";

    activeProducts()
        .forEach(product => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                product.id;

            option.textContent =
                `${product.icon || "📦"} ${product.name} – ${euro(product.price)}`;

            select.appendChild(option);
        });

    showScreen(
        "eventProductsScreen"
    );
}

function renderEventProducts() {

    const container =
        el("eventProductsList");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.currentEventProducts.length
            ? ""
            : `
                <div class="empty-state">
                    Noch keine Produkte hinzugefügt.
                </div>
            `;

    state.currentEventProducts
        .forEach(product => {

            const row =
                document.createElement(
                    "article"
                );

            row.className =
                "product-admin-row";

            row.innerHTML = `
                <div class="product-admin-main">
                    <span class="product-admin-icon">
                        ${escapeHtml(
                            product.icon || "🎪"
                        )}
                    </span>

                    <div>
                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <small>
                            ${euro(product.price)}
                        </small>
                    </div>
                </div>

                <button
                    type="button"
                    class="secondary-action"
                >
                    Bearbeiten
                </button>
            `;

            row.querySelector("button")
                .addEventListener(
                    "click",
                    () =>
                        openEventProductModal(
                            product
                        )
                );

            container.appendChild(row);
        });
}

async function addGlobalProductToEvent() {

    if (!state.currentEvent) {
        return;
    }

    const productId =
        el(
            "globalProductForEventSelect"
        ).value;

    if (!productId) {
        return;
    }

    const product =
        state.products.find(
            row =>
                row.id === productId
        );

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "upsert_event_product",
                {
                    p_event_id:
                        state.currentEvent.id,

                    p_event_product_id:
                        null,

                    p_product_id:
                        productId,

                    p_name:
                        null,

                    p_price:
                        null,

                    p_icon:
                        product?.icon ||
                        "🎪"
                }
            );

        if (error) {
            throw error;
        }

        await loadCurrentEventProducts();

        showToast(
            "Produkt hinzugefügt.",
            "success"
        );

    } catch (error) {

        showToast(
            errorMessage(error),
            "error"
        );
    }
}

function openEventProductModal(
    product = null
) {

    state.editingEventProduct =
        product;

    setText(
        "eventProductModalTitle",
        product
            ? "Veranstaltungsprodukt bearbeiten"
            : "Eigenes Produkt"
    );

    el("eventProductIdInput").value =
        product?.id || "";

    el("eventProductNameInput").value =
        product?.name || "";

    el("eventProductPriceInput").value =
        product
            ? Number(product.price)
                .toFixed(2)
                .replace(".", ",")
            : "";

    el("eventProductIconInput").value =
        product?.icon || "🎪";

    setText(
        "eventProductFormMessage",
        ""
    );

    setHidden(
        "eventProductModal",
        false
    );
}

function closeEventProductModal() {

    setHidden(
        "eventProductModal",
        true
    );

    state.editingEventProduct =
        null;
}

async function saveEventProduct(
    event
) {

    event.preventDefault();

    if (!state.currentEvent) {
        return;
    }

    const name =
        el("eventProductNameInput")
            .value
            .trim();

    const price =
        parseMoney(
            el("eventProductPriceInput")
                .value
        );

    const icon =
        el("eventProductIconInput")
            .value
            .trim() ||
        "🎪";

    if (
        !name ||
        !Number.isFinite(price) ||
        price < 0
    ) {

        setText(
            "eventProductFormMessage",
            "Bitte Name und gültigen Preis eingeben."
        );

        return;
    }

    try {

        const existing =
            state.editingEventProduct;

        const {
            error
        } =
            await supabaseClient.rpc(
                "upsert_event_product",
                {
                    p_event_id:
                        state.currentEvent.id,

                    p_event_product_id:
                        existing?.id ||
                        null,

                    p_product_id:
                        existing?.product_id ||
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
            throw error;
        }

        closeEventProductModal();

        await loadCurrentEventProducts();

        showToast(
            "Veranstaltungsprodukt gespeichert.",
            "success"
        );

    } catch (error) {

        setText(
            "eventProductFormMessage",
            errorMessage(error)
        );
    }
}


// ============================================================
// EVENT SALE
// ============================================================

function renderEventSale() {

    renderProductGrid(
        "eventSaleProductGrid",
        state.currentEventProducts,
        state.eventCart,
        renderEventSale
    );

    renderCart(
        "eventCartItems",
        "eventCartTotal",
        "eventPayButton",
        state.eventCart,
        state.currentEventProducts,
        renderEventSale
    );

    setHidden(
        "eventSaleTestBanner",
        !state.eventTestMode
    );

    setText(
        "eventSaleTitle",
        `🎪 ${state.currentEvent?.name || ""} – Kasse`
    );
}

async function openEventSale() {

    if (!state.currentEvent) {
        return;
    }

    await loadCurrentEventProducts();

    state.eventCart.clear();
    state.eventPaymentCents = "";
    state.eventTestMode =
        isTeacher();

    renderEventSale();

    showScreen(
        "eventSaleScreen"
    );
}

async function completeEventSale() {

    if (!state.currentEvent) {
        return;
    }

    const total =
        productCartTotal(
            state.eventCart,
            state.currentEventProducts
        );

    const payment =
        paymentAmount(
            state.eventPaymentCents
        );

    const change =
        payment - total;

    const button =
        el("eventPaidButton");

    button.disabled = true;

    try {

        let orderNumber;

        if (!state.eventTestMode) {

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
                            cartPayload(
                                state.eventCart,
                                "event_product_id"
                            ),

                        p_payment_amount:
                            payment
                    }
                );

            if (error) {
                throw error;
            }

            orderNumber =
                data.order_number;

        } else {

            orderNumber =
                randomTestOrderNumber(
                    state.eventTestOrders
                );

            state.eventTestOrders.push({
                id:
                    crypto.randomUUID(),

                event_id:
                    state.currentEvent.id,

                order_number:
                    orderNumber,

                status:
                    "offen",

                created_at:
                    new Date().toISOString(),

                items:
                    cartPayload(
                        state.eventCart,
                        "event_product_id"
                    ).map(item => {

                        const product =
                            state.currentEventProducts
                                .find(
                                    p =>
                                        p.id ===
                                        item.event_product_id
                                );

                        return {
                            product_name:
                                product?.name ||
                                "",
                            quantity:
                                item.quantity
                        };
                    })
            });
        }

        setText(
            "eventSuccessOrderNumber",
            String(orderNumber)
                .padStart(3, "0")
        );

        setText(
            "eventSuccessChange",
            euro(change)
        );

        state.eventCart.clear();
        state.eventPaymentCents = "";

        showScreen(
            "eventSuccessScreen"
        );

    } catch (error) {

        showToast(
            errorMessage(error),
            "error"
        );

    } finally {

        button.disabled = false;
    }
}


// ============================================================
// EVENT OUTPUT
// ============================================================

async function renderEventOutput() {

    if (!state.currentEvent) {
        return;
    }

    setHidden(
        "eventOutputTestBanner",
        !state.eventTestMode
    );

    let orders = [];

    if (state.eventTestMode) {

        orders =
            state.eventTestOrders
                .filter(
                    order =>
                        order.event_id ===
                            state.currentEvent.id &&
                        order.status ===
                            "offen"
                );

    } else {

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
                .eq(
                    "status",
                    "offen"
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        orders =
            (data || [])
                .map(order => ({
                    ...order,
                    items:
                        order.event_order_items ||
                        []
                }));
    }

    setText(
        "eventOpenOrderCount",
        orders.length
    );

    setHidden(
        "eventOutputEmpty",
        orders.length > 0
    );

    const container =
        el("eventOutputOrders");

    container.innerHTML = "";

    orders.forEach(order => {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "output-order-card";

        card.innerHTML = `
            <div class="output-order-number">
                ${String(
                    order.order_number
                ).padStart(3, "0")}
            </div>

            <div class="output-order-items">
                ${(order.items || [])
                    .map(
                        item => `
                            <div>
                                <strong>
                                    ${item.quantity}×
                                </strong>

                                ${escapeHtml(
                                    item.product_name
                                )}
                            </div>
                        `
                    )
                    .join("")}
            </div>

            <button
                class="primary-action full-width-button"
                type="button"
            >
                ✓ Ausgegeben
            </button>
        `;

        card.querySelector("button")
            .addEventListener(
                "click",
                async () => {

                    try {

                        if (
                            state.eventTestMode
                        ) {

                            const test =
                                state.eventTestOrders
                                    .find(
                                        row =>
                                            row.id ===
                                            order.id
                                    );

                            if (test) {
                                test.status =
                                    "ausgegeben";
                            }

                        } else {

                            const {
                                error
                            } =
                                await supabaseClient.rpc(
                                    "serve_event_order",
                                    {
                                        p_order_id:
                                            order.id
                                    }
                                );

                            if (error) {
                                throw error;
                            }
                        }

                        await renderEventOutput();

                    } catch (error) {

                        showToast(
                            errorMessage(error),
                            "error"
                        );
                    }
                }
            );

        container.appendChild(card);
    });
}

async function openEventOutput() {

    state.eventTestMode =
        isTeacher();

    await renderEventOutput();

    showScreen(
        "eventOutputScreen"
    );
}


// ============================================================
// EVENT END INVENTORY
// ============================================================

async function openEventEndInventory() {

    if (!state.currentEvent) {
        return;
    }

    await loadCurrentEventProducts();

    const container =
        el("eventEndInventoryList");

    container.innerHTML = "";

    state.currentEventProducts
        .forEach(product => {

            const row =
                document.createElement(
                    "label"
                );

            row.className =
                "inventory-count-row";

            row.innerHTML = `
                <div>
                    <span>
                        ${escapeHtml(
                            product.icon || "🎪"
                        )}
                    </span>

                    <strong>
                        ${escapeHtml(product.name)}
                    </strong>
                </div>

                <input
                    type="number"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    data-event-product-id="${escapeHtml(
                        product.id
                    )}"
                    placeholder="0"
                >
            `;

            container.appendChild(row);
        });

    setText(
        "eventEndInventoryMessage",
        ""
    );

    showScreen(
        "eventEndInventoryScreen"
    );
}

async function saveEventEndInventory() {

    if (!state.currentEvent) {
        return;
    }

    if (state.eventTestMode) {

        showToast(
            "In der Testumgebung wird keine Endinventur gespeichert.",
            "info"
        );

        await openEventWorkspace(
            state.currentEvent.id
        );

        return;
    }

    const items =
        all(
            "#eventEndInventoryList [data-event-product-id]"
        )
            .map(input => ({
                event_product_id:
                    input.dataset
                        .eventProductId,

                quantity:
                    Math.max(
                        0,
                        Number(
                            input.value ||
                            0
                        )
                    )
            }));

    try {

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
            throw error;
        }

        setText(
            "eventEndInventoryMessage",
            "Endinventur gespeichert."
        );

        showToast(
            "Veranstaltung abgeschlossen.",
            "success"
        );

        await loadEvents();

        await openEvents();

    } catch (error) {

        setText(
            "eventEndInventoryMessage",
            errorMessage(error)
        );
    }
}


// ============================================================
// OTHER EVENT REVENUE
// ============================================================

function openOtherEventRevenueModal() {

    if (
        !isTeacher() ||
        !state.currentEvent
    ) {
        return;
    }

    el("otherEventRevenueInput").value =
        Number(
            state.currentEvent
                .direct_revenue ||
            0
        )
            .toFixed(2)
            .replace(".", ",");

    setText(
        "otherEventRevenueMessage",
        ""
    );

    setHidden(
        "otherEventRevenueModal",
        false
    );
}

function closeOtherEventRevenueModal() {

    setHidden(
        "otherEventRevenueModal",
        true
    );
}

async function saveOtherEventRevenue(
    event
) {

    event.preventDefault();

    if (
        !isTeacher() ||
        !state.currentEvent
    ) {
        return;
    }

    const amount =
        parseMoney(
            el(
                "otherEventRevenueInput"
            ).value
        );

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        setText(
            "otherEventRevenueMessage",
            "Bitte einen gültigen Umsatz eingeben."
        );

        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient.rpc(
                "update_other_event_revenue",
                {
                    p_event_id:
                        state.currentEvent.id,

                    p_direct_revenue:
                        amount
                }
            );

        if (error) {
            throw error;
        }

        closeOtherEventRevenueModal();

        await loadEvents();

        await openEventWorkspace(
            state.currentEvent.id
        );

        showToast(
            "Umsatz gespeichert.",
            "success"
        );

    } catch (error) {

        setText(
            "otherEventRevenueMessage",
            errorMessage(error)
        );
    }
}


// ============================================================
// REPORTS
// ============================================================

function reportRange(
    period
) {

    const now =
        new Date();

    let start =
        new Date(now);

    let end =
        new Date(now);

    end.setHours(
        23,
        59,
        59,
        999
    );

    if (period === "today") {

        start.setHours(
            0,
            0,
            0,
            0
        );
    }

    if (period === "week") {

        const day =
            start.getDay() || 7;

        start.setDate(
            start.getDate() -
            day +
            1
        );

        start.setHours(
            0,
            0,
            0,
            0
        );
    }

    if (period === "month") {

        start =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );
    }

    if (
        period ===
        "schoolyear"
    ) {

        const startYear =
            now.getMonth() >= 8
                ? now.getFullYear()
                : now.getFullYear() - 1;

        start =
            new Date(
                startYear,
                8,
                1
            );

        end =
            new Date(
                startYear + 1,
                6,
                31,
                23,
                59,
                59,
                999
            );
    }

    return {
        start,
        end
    };
}

async function loadReportLines(
    period
) {

    const {
        start,
        end
    } =
        reportRange(period);

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
            .lte(
                "sold_at",
                end.toISOString()
            );

    if (error) {
        throw error;
    }

    return data || [];
}

async function loadReportEvents(
    period
) {

    const {
        start,
        end
    } =
        reportRange(period);

    const startKey =
        localDateKey(start);

    const endKey =
        localDateKey(end);

    const {
        data,
        error
    } =
        await supabaseClient
            .from("events")
            .select("*")
            .gte(
                "event_date",
                startKey
            )
            .lte(
                "event_date",
                endKey
            )
            .order(
                "event_date",
                {
                    ascending: false
                }
            );

    if (error) {
        throw error;
    }

    return data || [];
}

function aggregateReportProducts(
    lines
) {

    const map =
        new Map();

    lines.forEach(line => {

        const key =
            line.product_id ||
            `name:${line.product_name}`;

        if (!map.has(key)) {

            map.set(
                key,
                {
                    key,
                    product_id:
                        line.product_id,

                    name:
                        line.product_name,

                    quantity:
                        0,

                    revenue:
                        0,

                    profit:
                        0
                }
            );
        }

        const item =
            map.get(key);

        item.quantity +=
            Number(
                line.quantity || 0
            );

        item.revenue +=
            Number(
                line.revenue || 0
            );

        item.profit +=
            Number(
                line.estimated_profit ||
                0
            );
    });

    return Array.from(
        map.values()
    );
}

async function renderReports() {

    if (!isTeacher()) {
        return;
    }

    try {

        setText(
            "reportCurrentDate",
            new Intl.DateTimeFormat(
                "de-DE",
                {
                    dateStyle: "full"
                }
            ).format(new Date())
        );

        const [
            lines,
            events
        ] =
            await Promise.all([
                loadReportLines(
                    state.reportPeriod
                ),
                loadReportEvents(
                    state.reportPeriod
                )
            ]);

        const otherRevenue =
            events
                .filter(
                    event =>
                        event.event_type ===
                        "other"
                )
                .reduce(
                    (sum, event) =>
                        sum +
                        Number(
                            event.direct_revenue ||
                            0
                        ),
                    0
                );

        const salesRevenue =
            lines.reduce(
                (sum, line) =>
                    sum +
                    Number(
                        line.revenue ||
                        0
                    ),
                0
            );

        const drinksRevenue =
            lines
                .filter(
                    line =>
                        line.area ===
                        "getränke"
                )
                .reduce(
                    (sum, line) =>
                        sum +
                        Number(
                            line.revenue ||
                            0
                        ),
                    0
                );

        const bakeryRevenue =
            lines
                .filter(
                    line =>
                        line.area ===
                        "bäckerei"
                )
                .reduce(
                    (sum, line) =>
                        sum +
                        Number(
                            line.revenue ||
                            0
                        ),
                    0
                );

        /*
         * Gewinn der Schule:
         * Bäckerei gehört wirtschaftlich nicht
         * LauterMacher.
         */
        const schoolProfit =
            lines
                .filter(
                    line =>
                        line.area !==
                        "bäckerei"
                )
                .reduce(
                    (sum, line) =>
                        sum +
                        Number(
                            line.estimated_profit ||
                            0
                        ),
                    0
                ) +
            otherRevenue;

        const orderIds =
            new Set(
                lines.map(
                    line =>
                        `${line.area}:${line.order_id}`
                )
            );

        setText(
            "reportRevenue",
            euro(
                salesRevenue +
                otherRevenue
            )
        );

        setText(
            "reportProfit",
            euro(schoolProfit)
        );

        setText(
            "reportDrinksRevenue",
            euro(drinksRevenue)
        );

        setText(
            "reportBakeryRevenue",
            euro(bakeryRevenue)
        );

        setText(
            "reportSalesCount",
            orderIds.size +
            events.filter(
                event =>
                    event.event_type ===
                    "other" &&
                    Number(
                        event.direct_revenue ||
                        0
                    ) > 0
            ).length
        );

        const products =
            aggregateReportProducts(
                lines
            );

        const top =
            products
                .slice()
                .sort(
                    (a, b) =>
                        b.quantity -
                        a.quantity
                )[0];

        const labels = {
            today:
                "Produkt des Tages",
            week:
                "Produkt der Woche",
            month:
                "Produkt des Monats",
            schoolyear:
                "Produkt des Schuljahres"
        };

        setText(
            "reportTopProductLabel",
            labels[
                state.reportPeriod
            ]
        );

        setText(
            "reportTopProductName",
            top?.name || "—"
        );

        const topProduct =
            top?.product_id
                ? state.products.find(
                    product =>
                        product.id ===
                        top.product_id
                )
                : null;

        setText(
            "reportTopProductIcon",
            topProduct?.icon ||
            "🏆"
        );

        renderReportProductTable(
            products
        );

        renderReportEvents(
            events,
            lines
        );

        await renderSchoolYearChart();

    } catch (error) {

        showToast(
            errorMessage(error),
            "error"
        );
    }
}

function renderReportProductTable(
    products
) {

    const sorted =
        products
            .slice()
            .sort(
                (a, b) =>
                    Number(
                        b[
                            state.reportSort
                        ] || 0
                    ) -
                    Number(
                        a[
                            state.reportSort
                        ] || 0
                    )
            );

    setHTML(
        "reportProductTableBody",
        sorted
            .map(item => {

                const stock =
                    item.product_id
                        ? state.inventory[
                            item.product_id
                        ]
                        : null;

                return `
                    <tr>
                        <td>
                            ${escapeHtml(
                                item.name
                            )}
                        </td>

                        <td>
                            ${item.quantity}
                        </td>

                        <td>
                            ${
                                stock ===
                                undefined ||
                                stock === null
                                    ? "—"
                                    : Number(stock)
                            }
                        </td>

                        <td>
                            ${euro(
                                item.revenue
                            )}
                        </td>

                        <td>
                            ${euro(
                                item.profit
                            )}
                        </td>
                    </tr>
                `;
            })
            .join("")
    );
}

function renderReportEvents(
    events,
    lines
) {

    const container =
        el("reportEventsList");

    container.innerHTML =
        events.length
            ? events
                .map(event => {

                    const eventLines =
                        lines.filter(
                            line =>
                                line.event_id ===
                                event.id
                        );

                    const revenue =
                        event.event_type ===
                        "other"
                            ? Number(
                                event.direct_revenue ||
                                0
                            )
                            : eventLines.reduce(
                                (sum, line) =>
                                    sum +
                                    Number(
                                        line.revenue ||
                                        0
                                    ),
                                0
                            );

                    const profit =
                        event.event_type ===
                        "other"
                            ? revenue
                            : eventLines.reduce(
                                (sum, line) =>
                                    sum +
                                    Number(
                                        line.estimated_profit ||
                                        0
                                    ),
                                0
                            );

                    return `
                        <article class="report-event-row">
                            <div>
                                <strong>
                                    ${escapeHtml(
                                        event.name
                                    )}
                                </strong>

                                <small>
                                    ${formatDate(
                                        event.event_date
                                    )}
                                </small>
                            </div>

                            <div>
                                <span>
                                    Umsatz:
                                    <strong>
                                        ${euro(revenue)}
                                    </strong>
                                </span>

                                <span>
                                    Ergebnis:
                                    <strong>
                                        ${euro(profit)}
                                    </strong>
                                </span>
                            </div>
                        </article>
                    `;
                })
                .join("")
            : `
                <div class="empty-state">
                    Keine Veranstaltungen im Zeitraum.
                </div>
            `;
}

async function renderSchoolYearChart() {

    const lines =
        await loadReportLines(
            "schoolyear"
        );

    const {
        start
    } =
        reportRange(
            "schoolyear"
        );

    const months = [];

    for (
        let offset = 0;
        offset < 11;
        offset += 1
    ) {

        const date =
            new Date(
                start.getFullYear(),
                start.getMonth() +
                    offset,
                1
            );

        months.push({
            year:
                date.getFullYear(),

            month:
                date.getMonth(),

            label:
                new Intl.DateTimeFormat(
                    "de-DE",
                    {
                        month: "short"
                    }
                ).format(date),

            profit:
                0
        });
    }

    lines
        .filter(
            line =>
                line.area !==
                "bäckerei"
        )
        .forEach(line => {

            const date =
                new Date(
                    line.sold_at
                );

            const month =
                months.find(
                    item =>
                        item.year ===
                            date.getFullYear() &&
                        item.month ===
                            date.getMonth()
                );

            if (month) {

                month.profit +=
                    Number(
                        line.estimated_profit ||
                        0
                    );
            }
        });

    const max =
        Math.max(
            1,
            ...months.map(
                item =>
                    Math.abs(
                        item.profit
                    )
            )
        );

    setHTML(
        "schoolYearProfitChart",
        months
            .map(item => {

                const height =
                    Math.max(
                        4,
                        Math.round(
                            Math.abs(
                                item.profit
                            ) /
                            max *
                            100
                        )
                    );

                return `
                    <div class="profit-chart-column">
                        <strong>
                            ${euro(
                                item.profit
                            )}
                        </strong>

                        <div class="profit-chart-bar-wrap">
                            <div
                                class="profit-chart-bar"
                                style="height:${height}%"
                            ></div>
                        </div>

                        <small>
                            ${escapeHtml(
                                item.label
                            )}
                        </small>
                    </div>
                `;
            })
            .join("")
    );
}


// ============================================================
// EXCEL EXPORT
// ============================================================

async function ensureXLSX() {

    if (window.XLSX) {
        return;
    }

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
                () =>
                    reject(
                        new Error(
                            "Excel-Bibliothek konnte nicht geladen werden."
                        )
                    );

            document.head
                .appendChild(script);
        }
    );
}

async function exportReportsExcel() {

    if (!isTeacher()) {
        return;
    }

    try {

        await ensureXLSX();

        const [
            lines,
            events
        ] =
            await Promise.all([
                loadReportLines(
                    "schoolyear"
                ),
                loadReportEvents(
                    "schoolyear"
                )
            ]);

        const products =
            aggregateReportProducts(
                lines
            );

        const workbook =
            XLSX.utils.book_new();

        const salesSheet =
            XLSX.utils.json_to_sheet(
                lines.map(line => ({
                    Datum:
                        formatDateTime(
                            line.sold_at
                        ),

                    Bereich:
                        line.area,

                    Veranstaltung:
                        line.event_id ||
                        "",

                    Produkt:
                        line.product_name,

                    Menge:
                        Number(
                            line.quantity ||
                            0
                        ),

                    Einzelpreis:
                        Number(
                            line.unit_price ||
                            0
                        ),

                    Umsatz:
                        Number(
                            line.revenue ||
                            0
                        ),

                    Kosten:
                        Number(
                            line.estimated_cost ||
                            0
                        ),

                    Gewinn:
                        Number(
                            line.estimated_profit ||
                            0
                        )
                }))
            );

        const productSheet =
            XLSX.utils.json_to_sheet(
                products.map(item => ({
                    Produkt:
                        item.name,

                    Menge:
                        item.quantity,

                    Bestand:
                        item.product_id
                            ? Number(
                                state.inventory[
                                    item.product_id
                                ] || 0
                            )
                            : "",

                    Umsatz:
                        item.revenue,

                    Gewinn:
                        item.profit
                }))
            );

        const eventSheet =
            XLSX.utils.json_to_sheet(
                events.map(event => ({
                    Name:
                        event.name,

                    Datum:
                        event.event_date,

                    Typ:
                        event.event_type,

                    Status:
                        event.status,

                    Direkter_Umsatz:
                        event.direct_revenue ??
                        "",

                    Notiz:
                        event.description ||
                        ""
                }))
            );

        const inventorySheet =
            XLSX.utils.json_to_sheet(
                activeProducts("getränke")
                    .map(product => ({
                        Produkt:
                            product.name,

                        Bestand:
                            Number(
                                state.inventory[
                                    product.id
                                ] || 0
                            ),

                        Verkaufspreis:
                            Number(
                                product.price ||
                                0
                            ),

                        Letzter_Einkaufspreis:
                            product.purchase_price ??
                            ""
                    }))
            );

        XLSX.utils.book_append_sheet(
            workbook,
            salesSheet,
            "Verkäufe"
        );

        XLSX.utils.book_append_sheet(
            workbook,
            productSheet,
            "Produkte"
        );

        XLSX.utils.book_append_sheet(
            workbook,
            inventorySheet,
            "Inventar"
        );

        XLSX.utils.book_append_sheet(
            workbook,
            eventSheet,
            "Veranstaltungen"
        );

        XLSX.writeFile(
            workbook,
            `LauterMacher_Bericht_${localDateKey()}.xlsx`
        );

    } catch (error) {

        showToast(
            errorMessage(error),
            "error"
        );
    }
}


// ============================================================
// CONFIRM MODAL
// ============================================================

function openConfirm(
    title,
    message,
    action
) {

    setText(
        "confirmModalTitle",
        title
    );

    setText(
        "confirmModalMessage",
        message
    );

    state.confirmAction =
        action;

    setHidden(
        "confirmModal",
        false
    );
}

function closeConfirm() {

    setHidden(
        "confirmModal",
        true
    );

    state.confirmAction =
        null;
}


// ============================================================
// EVENT LIST / TEST ENVIRONMENT HELPERS
// ============================================================

function openEventType() {

    if (!isTeacher()) {
        return;
    }

    showScreen(
        "eventTypeScreen"
    );
}


// ============================================================
// EVENT / PRODUCT EMOJI PICKERS
// ============================================================

function setupEmojiPicker(
    gridId,
    inputId
) {

    const grid =
        el(gridId);

    if (!grid) {
        return;
    }

    grid.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-emoji]"
                );

            if (!button) {
                return;
            }

            el(inputId).value =
                button.dataset.emoji;
        }
    );
}


// ============================================================
// GLOBAL EVENT LISTENERS
// ============================================================

function bindEvents() {

    // --------------------------------------------------------
    // LOGIN / HEADER
    // --------------------------------------------------------

    on(
        "loginBackButton",
        "click",
        () => {

            state.selectedLoginPerson =
                null;

            showScreen(
                "identityScreen"
            );
        }
    );

    on(
        "loginConfirmButton",
        "click",
        loginWithPin
    );

    on(
        "loginPinInput",
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {
                loginWithPin();
            }
        }
    );

    on(
        "logoutButton",
        "click",
        logout
    );

    on(
        "homeLogoButton",
        "click",
        goHome
    );

    on(
        "notificationButton",
        "click",
        async () => {

            const popover =
                el(
                    "notificationPopover"
                );

            const opening =
                popover.hidden;

            popover.hidden =
                !opening;

            el("notificationButton")
                .setAttribute(
                    "aria-expanded",
                    opening
                        ? "true"
                        : "false"
                );

            if (opening) {
                await loadNotifications();
            }
        }
    );

    on(
        "closeNotificationPopoverButton",
        "click",
        closeNotificationPopover
    );

    on(
        "showAllNotificationsButton",
        "click",
        async () => {

            closeNotificationPopover();

            await loadNotifications();

            showScreen(
                "notificationsScreen"
            );

            await markVisibleNotificationsRead();
        }
    );

    on(
        "notificationsBackButton",
        "click",
        goHome
    );


    // --------------------------------------------------------
    // HOME
    // --------------------------------------------------------

    on(
        "homeDrinksButton",
        "click",
        openDrinks
    );

    on(
        "homeBakeryButton",
        "click",
        openBakery
    );

    on(
        "homeEditButton",
        "click",
        openEditMenu
    );

    on(
        "homeReportsButton",
        "click",
        async () => {

            if (!isTeacher()) {
                return;
            }

            showScreen(
                "reportsScreen"
            );

            await renderReports();
        }
    );

    on(
        "homeEventsButton",
        "click",
        openEvents
    );


    // --------------------------------------------------------
    // GETRÄNKE
    // --------------------------------------------------------

    on(
        "drinksSaleBackButton",
        "click",
        goHome
    );

    on(
        "drinksPayButton",
        "click",
        () =>
            openPayment(
                "drinks"
            )
    );

    on(
        "drinksPaymentBackButton",
        "click",
        () => {

            renderDrinksSale();

            showScreen(
                "drinksSaleScreen"
            );
        }
    );

    on(
        "drinksPaidButton",
        "click",
        completeDrinksSale
    );

    on(
        "drinksNewOrderButton",
        "click",
        () => {

            renderDrinksSale();

            showScreen(
                "drinksSaleScreen"
            );
        }
    );

    on(
        "drinksShiftEndButton",
        "click",
        () =>
            openFreeDrinks(
                "getränke",
                null
            )
    );

    on(
        "drinksSuccessShiftEndButton",
        "click",
        () =>
            openFreeDrinks(
                "getränke",
                null
            )
    );

    on(
        "freeDrinksBackButton",
        "click",
        () => {

            if (
                state.freeDrinksContext ===
                "sonderveranstaltung"
            ) {

                showScreen(
                    "eventSaleScreen"
                );

            } else {

                showScreen(
                    "drinksSaleScreen"
                );
            }
        }
    );

    on(
        "freeDrinksNoneButton",
        "click",
        () => {

            state.freeDrinkQuantities =
                {};

            saveFreeDrinks();
        }
    );

    on(
        "freeDrinksSaveButton",
        "click",
        saveFreeDrinks
    );


    // --------------------------------------------------------
    // BÄCKEREI
    // --------------------------------------------------------

    on(
        "bakeryMenuBackButton",
        "click",
        goHome
    );

    on(
        "bakeryCashierButton",
        "click",
        openBakerySale
    );

    on(
        "bakeryOutputButton",
        "click",
        async () => {

            await renderBakeryOutput();

            showScreen(
                "bakeryOutputScreen"
            );
        }
    );

    on(
        "bakerySaleBackButton",
        "click",
        () =>
            showScreen(
                "bakeryMenuScreen"
            )
    );

    on(
        "bakeryPayButton",
        "click",
        () =>
            openPayment(
                "bakery"
            )
    );

    on(
        "bakeryPaymentBackButton",
        "click",
        () => {

            renderBakerySale();

            showScreen(
                "bakerySaleScreen"
            );
        }
    );

    on(
        "bakeryPaidButton",
        "click",
        completeBakerySale
    );

    on(
        "bakeryNewOrderButton",
        "click",
        openBakerySale
    );

    on(
        "bakeryOutputBackButton",
        "click",
        () =>
            showScreen(
                "bakeryMenuScreen"
            )
    );


    // --------------------------------------------------------
    // EDIT MENU
    // --------------------------------------------------------

    on(
        "editMenuBackButton",
        "click",
        goHome
    );

    on(
        "productsButton",
        "click",
        () => {

            renderProductAdmin();

            showScreen(
                "productsScreen"
            );
        }
    );

    on(
        "invoicesButton",
        "click",
        openInvoices
    );

    on(
        "inventoryButton",
        "click",
        async () => {

            if (isTeacher()) {

                await openTeacherInventory();

            } else {

                renderStudentInventory();

                setText(
                    "studentInventoryMessage",
                    ""
                );

                showScreen(
                    "studentInventoryScreen"
                );
            }
        }
    );

    on(
        "studentsButton",
        "click",
        openStudents
    );


    // --------------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------------

    on(
        "productsBackButton",
        "click",
        openEditMenu
    );

    on(
        "addProductButton",
        "click",
        () =>
            openProductModal()
    );

    all(
        "[data-product-filter]"
    )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.productFilter =
                        button.dataset
                            .productFilter;

                    all(
                        "[data-product-filter]"
                    )
                        .forEach(tab =>
                            tab.classList
                                .toggle(
                                    "active",
                                    tab ===
                                    button
                                )
                        );

                    renderProductAdmin();
                }
            );
        });

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

    on(
        "productForm",
        "submit",
        saveProduct
    );


    // --------------------------------------------------------
    // INVENTORY
    // --------------------------------------------------------

    on(
        "studentInventoryBackButton",
        "click",
        openEditMenu
    );

    on(
        "submitStudentInventoryButton",
        "click",
        submitStudentInventory
    );

    on(
        "teacherInventoryBackButton",
        "click",
        () => {

            state.invoiceForInventory =
                null;

            openEditMenu();
        }
    );


    // --------------------------------------------------------
    // INVOICES
    // --------------------------------------------------------

    on(
        "invoicesBackButton",
        "click",
        openEditMenu
    );

    on(
        "invoiceDateInput",
        "change",
        updateInvoiceNumberPreview
    );

    on(
        "invoiceContextSelect",
        "change",
        updateInvoiceContextUI
    );

    on(
        "invoiceEventSelect",
        "change",
        () => {

            if (
                el(
                    "invoiceEventSelect"
                ).value ===
                "__create__"
            ) {

                showToast(
                    "Neue Veranstaltung zuerst anlegen.",
                    "info"
                );
            }
        }
    );

    on(
        "invoiceForm",
        "submit",
        saveInvoice
    );


    // --------------------------------------------------------
    // STUDENTS
    // --------------------------------------------------------

    on(
        "studentsBackButton",
        "click",
        openEditMenu
    );

    on(
        "addStudentButton",
        "click",
        () =>
            openStudentModal()
    );

    on(
        "closeStudentModalButton",
        "click",
        closeStudentModal
    );

    on(
        "cancelStudentButton",
        "click",
        closeStudentModal
    );

    on(
        "studentForm",
        "submit",
        saveStudent
    );


    // --------------------------------------------------------
    // REPORTS
    // --------------------------------------------------------

    on(
        "reportsBackButton",
        "click",
        goHome
    );

    all(
        "[data-report-period]"
    )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    state.reportPeriod =
                        button.dataset
                            .reportPeriod;

                    all(
                        "[data-report-period]"
                    )
                        .forEach(tab =>
                            tab.classList
                                .toggle(
                                    "active",
                                    tab ===
                                    button
                                )
                        );

                    await renderReports();
                }
            );
        });

    all(
        "[data-report-sort]"
    )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    state.reportSort =
                        button.dataset
                            .reportSort;

                    all(
                        "[data-report-sort]"
                    )
                        .forEach(tab =>
                            tab.classList
                                .toggle(
                                    "active",
                                    tab ===
                                    button
                                )
                        );

                    await renderReports();
                }
            );
        });

    on(
        "exportReportsButton",
        "click",
        exportReportsExcel
    );


    // --------------------------------------------------------
    // EVENTS
    // --------------------------------------------------------

    on(
        "eventsBackButton",
        "click",
        goHome
    );

    on(
        "createEventButton",
        "click",
        openEventType
    );

    on(
        "eventTypeBackButton",
        "click",
        openEvents
    );

    on(
        "createFoodEventButton",
        "click",
        () =>
            openEventCreate(
                "food"
            )
    );

    on(
        "createOtherEventButton",
        "click",
        () =>
            openEventCreate(
                "other"
            )
    );

    on(
        "eventCreateBackButton",
        "click",
        openEventType
    );

    on(
        "eventCreateForm",
        "submit",
        saveEvent
    );

    on(
        "eventWorkspaceBackButton",
        "click",
        openEvents
    );

    on(
        "eventProductsButton",
        "click",
        openEventProducts
    );

    on(
        "eventCashierButton",
        "click",
        openEventSale
    );

    on(
        "eventOutputButton",
        "click",
        openEventOutput
    );

    on(
        "eventEndInventoryButton",
        "click",
        openEventEndInventory
    );

    on(
        "editOtherEventRevenueButton",
        "click",
        openOtherEventRevenueModal
    );


    // --------------------------------------------------------
    // EVENT PRODUCTS
    // --------------------------------------------------------

    on(
        "eventProductsBackButton",
        "click",
        () =>
            openEventWorkspace(
                state.currentEvent.id
            )
    );

    on(
        "addCustomEventProductButton",
        "click",
        () =>
            openEventProductModal()
    );

    on(
        "addGlobalProductToEventButton",
        "click",
        addGlobalProductToEvent
    );

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
        "eventProductForm",
        "submit",
        saveEventProduct
    );


    // --------------------------------------------------------
    // EVENT SALE
    // --------------------------------------------------------

    on(
        "eventSaleBackButton",
        "click",
        () =>
            openEventWorkspace(
                state.currentEvent.id
            )
    );

    on(
        "eventPayButton",
        "click",
        () =>
            openPayment(
                "event"
            )
    );

    on(
        "eventShiftEndButton",
        "click",
        () =>
            openFreeDrinks(
                "sonderveranstaltung",
                state.currentEvent.id
            )
    );

    on(
        "eventPaymentBackButton",
        "click",
        () => {

            renderEventSale();

            showScreen(
                "eventSaleScreen"
            );
        }
    );

    on(
        "eventPaidButton",
        "click",
        completeEventSale
    );

    on(
        "eventNewOrderButton",
        "click",
        openEventSale
    );

    on(
        "eventOutputBackButton",
        "click",
        () =>
            openEventWorkspace(
                state.currentEvent.id
            )
    );


    // --------------------------------------------------------
    // EVENT END INVENTORY
    // --------------------------------------------------------

    on(
        "eventEndInventoryBackButton",
        "click",
        () =>
            openEventWorkspace(
                state.currentEvent.id
            )
    );

    on(
        "saveEventEndInventoryButton",
        "click",
        saveEventEndInventory
    );


    // --------------------------------------------------------
    // OTHER EVENT REVENUE
    // --------------------------------------------------------

    on(
        "closeOtherEventRevenueModalButton",
        "click",
        closeOtherEventRevenueModal
    );

    on(
        "cancelOtherEventRevenueButton",
        "click",
        closeOtherEventRevenueModal
    );

    on(
        "otherEventRevenueForm",
        "submit",
        saveOtherEventRevenue
    );


    // --------------------------------------------------------
    // CONFIRM MODAL
    // --------------------------------------------------------

    on(
        "confirmModalCancelButton",
        "click",
        closeConfirm
    );

    on(
        "confirmModalConfirmButton",
        "click",
        async () => {

            const action =
                state.confirmAction;

            closeConfirm();

            if (!action) {
                return;
            }

            try {

                await action();

            } catch (error) {

                showToast(
                    errorMessage(error),
                    "error"
                );
            }
        }
    );


    // --------------------------------------------------------
    // EMOJI
    // --------------------------------------------------------

    setupEmojiPicker(
        "productEmojiGrid",
        "productIconInput"
    );

    setupEmojiPicker(
        "eventProductEmojiGrid",
        "eventProductIconInput"
    );


    // --------------------------------------------------------
    // MODAL BACKDROP
    // --------------------------------------------------------

    [
        [
            "productModal",
            closeProductModal
        ],
        [
            "studentModal",
            closeStudentModal
        ],
        [
            "eventProductModal",
            closeEventProductModal
        ],
        [
            "otherEventRevenueModal",
            closeOtherEventRevenueModal
        ]
    ]
        .forEach(
            ([id, close]) => {

                const modal =
                    el(id);

                modal?.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {
                            close();
                        }
                    }
                );
            }
        );
}


// ============================================================
// PAYMENT SETUP
// ============================================================

function setupPayments() {

    setupPaymentKeypad(
        "drinks"
    );

    setupPaymentKeypad(
        "bakery"
    );

    setupPaymentKeypad(
        "event"
    );
}


// ============================================================
// AUTH STATE CHANGE
// ============================================================

supabaseClient.auth.onAuthStateChange(
    (_event, session) => {

        if (
            !session &&
            state.currentPerson
        ) {

            stopRealtime();

            state.currentPerson =
                null;

            el("appHeader").hidden =
                true;

            showScreen(
                "identityScreen"
            );
        }
    }
);


// ============================================================
// BOOT
// ============================================================

async function boot() {

    try {

        bindEvents();
        setupPayments();

        updateInvoiceContextUI();

        await initialiseAuthentication();

    } catch (error) {

        console.error(
            "LauterMacher konnte nicht gestartet werden:",
            error
        );

        showToast(
            "Die App konnte nicht vollständig gestartet werden.",
            "error"
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    boot
);

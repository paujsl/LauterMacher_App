// ========================================
// LAUTER MACHER
// APP.JS — V1 PROPRE
// ========================================
//
// Cette version reconstruit volontairement
// le démarrage de l'application autour de :
//
// 1. chargement des personnes depuis Supabase
// 2. choix d'une personne
// 3. saisie du PIN
// 4. connexion via login-with-pin
// 5. affichage de la page d'accueil
//
// Les ventes, produits, inventaire, événements,
// rapports, etc. seront réintégrés après validation
// complète de cette base.
// ========================================


// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL =
    "https://gsbkfrjhierqopkwpqjc.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiZ3Nia2ZyamllcnFvcGt3cHFqYyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzkwOTIyNzI4LCJleHAiOjIxMDY0OTg3Mjh9.BV5aYeAO2nE5SjiEOCs3GA1hwQpg0IJzEl5wizApUVU";


// Vérifie que la bibliothèque Supabase est bien disponible.

if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {
    throw new Error(
        "Supabase JS wurde nicht geladen. In index.html muss supabase-js vor app.js stehen."
    );
}


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ========================================
// STATE
// ========================================

let currentPerson = null;
let selectedLoginPerson = null;


// ========================================
// DOM HELPERS
// ========================================

function $(id) {
    return document.getElementById(id);
}


function on(id, eventName, handler) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.addEventListener(
        eventName,
        handler
    );
}


function setHidden(id, hidden) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.hidden = hidden;
}


function setText(id, value) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "";
}


// ========================================
// SCREEN NAVIGATION
// ========================================

function showScreen(screenId) {

    const screens =
        document.querySelectorAll(".screen");

    screens.forEach(function (screen) {

        screen.style.display =
            "none";

    });


    const target =
        $(screenId);

    if (!target) {
        console.error(
            "Screen nicht gefunden:",
            screenId
        );

        return;
    }


    target.style.display =
        "block";
}


// ========================================
// HEADER
// ========================================

function showHeader(visible) {

    const header =
        $("appHeader");

    if (!header) {
        return;
    }

    header.style.display =
        visible
            ? "block"
            : "none";
}


// ========================================
// ERROR DISPLAY
// ========================================

function showIdentityError(message) {

    setText(
        "identityError",
        message
    );
}


function showPinError(message) {

    setText(
        "pinLoginError",
        message
    );
}


// ========================================
// GLOBAL DIAGNOSTIC ERRORS
// ========================================
//
// Très utile pendant cette phase :
// si quelque chose casse, l'erreur apparaît
// aussi sur la page de connexion.
// ========================================

window.addEventListener(
    "error",
    function (event) {

        console.error(
            "Lauter Macher Fehler:",
            event.error ||
            event.message
        );


        const identityScreen =
            $("identityScreen");


        if (
            identityScreen &&
            identityScreen.style.display !== "none"
        ) {

            showIdentityError(
                "Technischer Fehler: " +
                (
                    event.message ||
                    "Bitte Seite neu laden."
                )
            );

        }

    }
);


window.addEventListener(
    "unhandledrejection",
    function (event) {

        console.error(
            "Lauter Macher Promise-Fehler:",
            event.reason
        );


        const identityScreen =
            $("identityScreen");


        if (
            identityScreen &&
            identityScreen.style.display !== "none"
        ) {

            const reason =
                event.reason &&
                event.reason.message
                    ? event.reason.message
                    : String(
                        event.reason ||
                        "Unbekannter Fehler"
                    );


            showIdentityError(
                "Technischer Fehler: " +
                reason
            );

        }

    }
);


// ========================================
// LOGIN — PERSONEN LADEN
// ========================================

async function loadPeople() {

    const peopleGrid =
        $("peopleGrid");


    if (!peopleGrid) {

        console.error(
            "#peopleGrid wurde nicht gefunden."
        );

        return;
    }


    showIdentityError("");


    peopleGrid.innerHTML = `
        <div class="login-loading">
            Personen werden geladen …
        </div>
    `;


    try {

        const response =
            await fetch(
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


        if (!Array.isArray(people)) {

            throw new Error(
                "Die Antwort von login_people ist keine Liste."
            );
        }


        renderPeople(
            people
        );


    } catch (error) {

        console.error(
            "Personen konnten nicht geladen werden:",
            error
        );


        peopleGrid.innerHTML =
            "";


        showIdentityError(
            "Personen konnten nicht geladen werden. " +
            (
                error &&
                error.message
                    ? error.message
                    : "Bitte später erneut versuchen."
            )
        );
    }
}


// ========================================
// LOGIN — PERSONEN ANZEIGEN
// ========================================

function renderPeople(people) {

    const peopleGrid =
        $("peopleGrid");


    if (!peopleGrid) {
        return;
    }


    peopleGrid.innerHTML =
        "";


    if (people.length === 0) {

        showIdentityError(
            "Keine aktiven Personen gefunden."
        );

        return;
    }


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


            const icon =
                person.person_type === "teacher"
                    ? "👨‍🏫"
                    : "👩‍🎓";


            button.innerHTML = `
                <span class="person-login-icon">
                    ${icon}
                </span>

                <span class="person-login-name">
                    ${escapeHtml(
                        person.first_name +
                        " " +
                        person.last_name
                    )}
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
}


// ========================================
// LOGIN — PERSON AUSWÄHLEN
// ========================================

function selectLoginPerson(person) {

    selectedLoginPerson =
        person;


    showIdentityError(
        ""
    );


    showPinError(
        ""
    );


    setText(
        "selectedPersonName",
        person.first_name +
        " " +
        person.last_name
    );


    const pinInput =
        $("loginPinInput");


    if (pinInput) {

        pinInput.value =
            "";

    }


    showScreen(
        "pinLoginScreen"
    );


    if (pinInput) {

        setTimeout(
            function () {

                pinInput.focus();

            },
            50
        );

    }
}


// ========================================
// LOGIN — ZURÜCK ZU PERSONEN
// ========================================

function backToPeople() {

    selectedLoginPerson =
        null;


    showPinError(
        ""
    );


    const pinInput =
        $("loginPinInput");


    if (pinInput) {

        pinInput.value =
            "";

    }


    showScreen(
        "identityScreen"
    );
}


// ========================================
// LOGIN — PIN
// ========================================

async function handlePinLogin() {

    if (!selectedLoginPerson) {

        showPinError(
            "Bitte zuerst eine Person auswählen."
        );

        return;
    }


    const pinInput =
        $("loginPinInput");


    if (!pinInput) {

        showPinError(
            "PIN-Eingabe wurde nicht gefunden."
        );

        return;
    }


    const pin =
        pinInput.value.trim();


    if (!/^\d{4}$/.test(pin)) {

        showPinError(
            "Bitte eine 4-stellige PIN eingeben."
        );

        return;
    }


    const loginButton =
        $("loginConfirmButton");


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.textContent =
            "Einloggen …";
    }


    showPinError("");


    try {

        // ==================================
        // EDGE FUNCTION
        // ==================================

        const response =
            await fetch(
                SUPABASE_URL +
                "/functions/v1/login-with-pin",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "apikey":
                            SUPABASE_ANON_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_ANON_KEY
                    },

                    body: JSON.stringify({

                        person_id:
                            selectedLoginPerson.id,

                        pin:
                            pin

                    })
                }
            );


        const payloadText =
            await response.text();


        let payload =
            {};


        try {

            payload =
                payloadText
                    ? JSON.parse(
                        payloadText
                    )
                    : {};

        } catch (parseError) {

            throw new Error(
                "Antwort der Login-Funktion ist kein gültiges JSON."
            );
        }


        if (!response.ok) {

            throw new Error(

                payload.error ||
                payload.message ||
                "HTTP " +
                response.status

            );
        }


        if (
            !payload.token_hash ||
            !payload.verification_type
        ) {

            throw new Error(
                "Die Login-Funktion hat keinen gültigen token_hash zurückgegeben."
            );
        }


        // ==================================
        // SUPABASE OTP / TOKEN HASH
        // ==================================

        const {
            data,
            error
        } =
            await supabaseClient.auth.verifyOtp({

                token_hash:
                    payload.token_hash,

                type:
                    payload.verification_type

            });


        if (error) {
            throw error;
        }


        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "Supabase hat keinen Benutzer zurückgegeben."
            );
        }


        // ==================================
        // PERSON ZUR AUTH-IDENTITÄT LADEN
        // ==================================

        await loadCurrentPerson(
            data.user.id
        );


    } catch (error) {

        console.error(
            "Login fehlgeschlagen:",
            error
        );


        showPinError(

            error &&
            error.message

                ? error.message

                : "Einloggen nicht möglich."

        );


    } finally {

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "Einloggen";
        }

    }
}


// ========================================
// AUTH — PERSON LADEN
// ========================================

async function loadCurrentPerson(
    authUserId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("people")
            .select(
                "id,first_name,last_name,person_type,active,auth_user_id"
            )
            .eq(
                "auth_user_id",
                authUserId
            )
            .eq(
                "active",
                true
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    if (!data) {

        throw new Error(
            "Der angemeldete Benutzer ist keiner aktiven Person zugeordnet."
        );
    }


    currentPerson =
        data;


    selectedLoginPerson =
        null;


    setLoggedIn();
}


// ========================================
// AUTH — UI NACH LOGIN
// ========================================

function setLoggedIn() {

    showHeader(
        true
    );


    setText(

        "currentPersonName",

        currentPerson.first_name +
        " " +
        currentPerson.last_name

    );


    setText(

        "homeRoleLabel",

        currentPerson.person_type === "teacher"

            ? "Lehrkraft"

            : "Schüler"

    );


    updateHomeForPerson();


    showScreen(
        "homeScreen"
    );
}


// ========================================
// HOME — LEHRER / SCHÜLER
// ========================================

function updateHomeForPerson() {

    const isTeacher =
        currentPerson &&
        currentPerson.person_type === "teacher";


    setHidden(
        "studentHomeMenu",
        isTeacher
    );


    setHidden(
        "teacherHomeMenu",
        !isTeacher
    );


    // Ces éléments existent dans le HTML
    // et restent cachés pour les élèves.

    setHidden(
        "inventoryInvoicesButton",
        !isTeacher
    );


    setHidden(
        "studentsButton",
        !isTeacher
    );


    if (isTeacher) {

        setText(
            "editMenuDescription",
            "Produkte, Inventur, Rechnungen und Schüler verwalten."
        );

    } else {

        setText(
            "editMenuDescription",
            "Produkte und Inventur verwalten."
        );

    }
}


// ========================================
// AUTH — SESSION RESTAURIER
// ========================================

async function restoreSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {
            throw error;
        }


        if (
            !data ||
            !data.session ||
            !data.session.user
        ) {

            return false;
        }


        await loadCurrentPerson(
            data.session.user.id
        );


        return true;


    } catch (error) {

        console.error(
            "Session konnte nicht wiederhergestellt werden:",
            error
        );


        await supabaseClient.auth.signOut();


        return false;
    }
}


// ========================================
// LOGOUT
// ========================================

async function logout() {

    try {

        await supabaseClient.auth.signOut();

    } catch (error) {

        console.error(
            "Abmelden fehlgeschlagen:",
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


    setText(
        "homeRoleLabel",
        ""
    );


    showHeader(
        false
    );


    showPinError(
        ""
    );


    showIdentityError(
        ""
    );


    const pinInput =
        $("loginPinInput");


    if (pinInput) {

        pinInput.value =
            "";

    }


    showScreen(
        "identityScreen"
    );


    await loadPeople();
}


// ========================================
// SIMPLE NAVIGATION
// ========================================
//
// Diese Navigation permet de vérifier que
// le nouveau app.js n'interfère pas avec le HTML.
// Les fonctions métier seront ajoutées ensuite.
// ========================================

function openStudentDrinks() {

    showScreen(
        "saleScreen"
    );

}


function openTeacherDrinks() {

    showScreen(
        "saleScreen"
    );

}


function openBakery() {

    showScreen(
        "bakeryMenuScreen"
    );

}


function openEdit() {

    showScreen(
        "adminScreen"
    );

}


function openReports() {

    showScreen(
        "reportsScreen"
    );

}


function openEvents(
    isTeacher
) {

    setHidden(
        "createEventButton",
        !isTeacher
    );


    showScreen(
        "eventListScreen"
    );

}


function goHome() {

    if (currentPerson) {

        showScreen(
            "homeScreen"
        );

    } else {

        showScreen(
            "identityScreen"
        );

    }

}


// ========================================
// BUTTONS — LOGIN
// ========================================

on(
    "loginConfirmButton",
    "click",
    handlePinLogin
);


on(
    "loginBackButton",
    "click",
    backToPeople
);


on(
    "logoutButton",
    "click",
    logout
);


// ========================================
// BUTTONS — HOME
// ========================================

on(
    "saleButton",
    "click",
    openStudentDrinks
);


on(
    "teacherSaleButton",
    "click",
    openTeacherDrinks
);


on(
    "bakeryButton",
    "click",
    openBakery
);


on(
    "teacherBakeryButton",
    "click",
    openBakery
);


on(
    "adminButton",
    "click",
    openEdit
);


on(
    "teacherAdminButton",
    "click",
    openEdit
);


on(
    "reportsHomeButton",
    "click",
    openReports
);


on(
    "eventButton",
    "click",
    function () {

        openEvents(false);

    }
);


on(
    "teacherEventButton",
    "click",
    function () {

        openEvents(true);

    }
);


// ========================================
// BUTTONS — BÄCKEREI
// ========================================

on(
    "bakeryBackButton",
    "click",
    goHome
);


on(
    "bakeryCashBackButton",
    "click",
    openBakery
);


on(
    "bakeryOutputBackButton",
    "click",
    openBakery
);


// ========================================
// BUTTONS — BEARBEITEN
// ========================================

on(
    "adminBackButton",
    "click",
    goHome
);


on(
    "inventoryBackButton",
    "click",
    openEdit
);


on(
    "productsBackButton",
    "click",
    openEdit
);


on(
    "reportsBackButton",
    "click",
    goHome
);


// ========================================
// BUTTONS — EVENTS
// ========================================

on(
    "eventListBackButton",
    "click",
    goHome
);


on(
    "eventCreateBackButton",
    "click",
    function () {

        showScreen(
            "eventListScreen"
        );

    }
);


on(
    "eventWorkspaceBackButton",
    "click",
    function () {

        showScreen(
            "eventListScreen"
        );

    }
);


on(
    "eventCashBackButton",
    "click",
    function () {

        showScreen(
            "eventWorkspaceScreen"
        );

    }
);


on(
    "eventOutputBackButton",
    "click",
    function () {

        showScreen(
            "eventWorkspaceScreen"
        );

    }
);


on(
    "eventEndInventoryBackButton",
    "click",
    function () {

        showScreen(
            "eventWorkspaceScreen"
        );

    }
);


// ========================================
// PIN — TOUCHE ENTRÉE
// ========================================

on(
    "loginPinInput",
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            handlePinLogin();

        }

    }
);


// ========================================
// STARTUP
// ========================================

async function boot() {

    // Toujours commencer avec
    // la page d'identité.

    showHeader(
        false
    );


    showScreen(
        "identityScreen"
    );


    // Une seule restauration
    // de session.

    const restored =
        await restoreSession();


    if (restored) {

        return;

    }


    // Une seule fonction de chargement
    // des personnes.

    await loadPeople();
}


// ========================================
// LANCEMENT
// ========================================

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


// ========================================
// HELPERS
// ========================================

function escapeHtml(value) {

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

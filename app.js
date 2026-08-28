// ========================================
// LAUTER MACHER
// Application JavaScript
// ========================================


// ========================================
// 1. ELEMENTS DE LA PAGE
// ========================================

const adminButton = document.getElementById("adminButton");

const pinModal = document.getElementById("pinModal");

const cancelButton = document.getElementById("cancelButton");

const confirmButton = document.getElementById("confirmButton");

const deleteButton = document.getElementById("deleteButton");

const numberButtons = document.querySelectorAll(".number-button");


// ========================================
// 2. PIN ACTUELLEMENT SAISI
// ========================================

let enteredPin = "";


// ========================================
// 3. OUVRIR LA FENETRE ADMIN
// ========================================

adminButton.addEventListener("click", function () {

    pinModal.style.display = "flex";

});


// ========================================
// 4. FERMER LA FENETRE ADMIN
// ========================================

cancelButton.addEventListener("click", function () {

    pinModal.style.display = "none";

    enteredPin = "";

    updatePinDisplay();

});


// ========================================
// 5. CLIQUER SUR UN CHIFFRE
// ========================================

numberButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        if (enteredPin.length < 4) {

            enteredPin += button.textContent;

            updatePinDisplay();

        }

    });

});


// ========================================
// 6. SUPPRIMER UN CHIFFRE
// ========================================

deleteButton.addEventListener("click", function () {

    enteredPin = enteredPin.slice(0, -1);

    updatePinDisplay();

});


// ========================================
// 7. AFFICHER LES POINTS DU PIN
// ========================================

function updatePinDisplay() {

    const pin1 = document.getElementById("pin1");

    const pin2 = document.getElementById("pin2");

    const pin3 = document.getElementById("pin3");

    const pin4 = document.getElementById("pin4");


    const pins = [pin1, pin2, pin3, pin4];


    pins.forEach(function (pin, index) {

        if (index < enteredPin.length) {

            pin.textContent = "●";

        } else {

            pin.textContent = "○";

        }

    });

}


// ========================================
// 8. BOUTON OK
// ========================================

confirmButton.addEventListener("click", function () {

    if (enteredPin.length < 4) {

        alert("Bitte 4 Ziffern eingeben.");

        return;

    }


    alert("PIN eingegeben: " + enteredPin);

});

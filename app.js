// ========================================
// LAUTER MACHER
// JavaScript
// ========================================


// ========================================
// ELEMENTS
// ========================================

const adminButton = document.getElementById("adminButton");

const pinModal = document.getElementById("pinModal");

const cancelButton = document.getElementById("cancelButton");

const confirmButton = document.getElementById("confirmButton");

const deleteButton = document.getElementById("deleteButton");

const numberButtons = document.querySelectorAll(".number-button");


// ========================================
// PIN
// ========================================

let enteredPin = "";


// ========================================
// OUVRIR ADMIN
// ========================================

adminButton.addEventListener("click", function () {

    pinModal.style.display = "flex";

    pinModal.setAttribute("aria-hidden", "false");

});


// ========================================
// FERMER ADMIN
// ========================================

cancelButton.addEventListener("click", function () {

    closePinModal();

});


// ========================================
// FONCTION FERMER POP-UP
// ========================================

function closePinModal() {

    pinModal.style.display = "none";

    pinModal.setAttribute("aria-hidden", "true");

    enteredPin = "";

    updatePinDisplay();

}


// ========================================
// CHIFFRES
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
// SUPPRIMER
// ========================================

deleteButton.addEventListener("click", function () {

    enteredPin = enteredPin.slice(0, -1);

    updatePinDisplay();

});


// ========================================
// AFFICHAGE PIN
// ========================================

function updatePinDisplay() {

    const pins = [

        document.getElementById("pin1"),

        document.getElementById("pin2"),

        document.getElementById("pin3"),

        document.getElementById("pin4")

    ];


    pins.forEach(function (pin, index) {

        if (index < enteredPin.length) {

            pin.textContent = "●";

        } else {

            pin.textContent = "○";

        }

    });

}


// ========================================
// CONFIRMATION
// ========================================

confirmButton.addEventListener("click", function () {

    if (enteredPin.length < 4) {

        alert("Bitte 4 Ziffern eingeben.");

        return;

    }

    alert("PIN eingegeben.");

});

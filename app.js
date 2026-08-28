// ========================================
// LAUTER MACHER
// JavaScript
// ========================================


// ========================================
// ELEMENTS
// ========================================

const homeScreen = document.getElementById("homeScreen");

const saleScreen = document.getElementById("saleScreen");

const saleButton = document.getElementById("saleButton");

const saleBackButton = document.getElementById("saleBackButton");

const adminButton = document.getElementById("adminButton");

const pinModal = document.getElementById("pinModal");

const cancelButton = document.getElementById("cancelButton");

const confirmButton = document.getElementById("confirmButton");

const deleteButton = document.getElementById("deleteButton");

const numberButtons = document.querySelectorAll(".number-button");

const productButtons = document.querySelectorAll(".product-card");

const cartItems = document.getElementById("cartItems");

const cartTotal = document.getElementById("cartTotal");

const payButton = document.getElementById("payButton");


// ========================================
// PIN
// ========================================

let enteredPin = "";


// ========================================
// PANIER
// ========================================

let cart = [];


// ========================================
// OUVRIR VERKAUF
// ========================================

saleButton.addEventListener("click", function () {

    homeScreen.style.display = "none";

    saleScreen.style.display = "block";

});


// ========================================
// RETOUR ACCUEIL
// ========================================

saleBackButton.addEventListener("click", function () {

    saleScreen.style.display = "none";

    homeScreen.style.display = "block";

});


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
// FONCTION FERMER PIN
// ========================================

function closePinModal() {

    pinModal.style.display = "none";

    pinModal.setAttribute("aria-hidden", "true");

    enteredPin = "";

    updatePinDisplay();

}


// ========================================
// TOUCHES NUMERIQUES
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
// SUPPRIMER UN CHIFFRE
// ========================================

deleteButton.addEventListener("click", function () {

    enteredPin = enteredPin.slice(0, -1);

    updatePinDisplay();

});


// ========================================
// AFFICHER LE PIN
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
// CLIQUER SUR UN PRODUIT
// ========================================

productButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const name = button.dataset.name;

        const price = Number(button.dataset.price);

        addToCart(name, price);

    });

});


// ========================================
// AJOUTER AU PANIER
// ========================================

function addToCart(name, price) {

    const existingProduct = cart.find(function (product) {

        return product.name === name;

    });


    if (existingProduct) {

        existingProduct.quantity += 1;

    } else {

        cart.push({

            name: name,

            price: price,

            quantity: 1

        });

    }


    updateCart();

}


// ========================================
// METTRE A JOUR LE PANIER
// ========================================

function updateCart() {

    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Noch keine Produkte ausgewählt.
            </p>
        `;

        cartTotal.textContent = "0,00 €";

        return;

    }


    let total = 0;


    cart.forEach(function (product, index) {

        const productTotal =
            product.price * product.quantity;


        total += productTotal;


        const item = document.createElement("div");

        item.className = "cart-item";


        item.innerHTML = `

            <span class="cart-item-name">
                ${product.name}
            </span>

            <div class="cart-item-controls">

                <button
                    data-action="minus"
                    data-index="${index}"
                >
                    −
                </button>

                <span class="cart-item-quantity">
                    ${product.quantity}
                </span>

                <button
                    data-action="plus"
                    data-index="${index}"
                >
                    +
                </button>

            </div>

            <span class="cart-item-price">
                ${formatPrice(productTotal)}
            </span>

        `;


        cartItems.appendChild(item);

    });


    cartTotal.textContent = formatPrice(total);


    addCartButtonEvents();

}


// ========================================
// BOUTONS + ET - DU PANIER
// ========================================

function addCartButtonEvents() {

    const buttons =
        cartItems.querySelectorAll("button");


    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            const index =
                Number(button.dataset.index);

            const action =
                button.dataset.action;


            if (action === "plus") {

                cart[index].quantity += 1;

            }


            if (action === "minus") {

                cart[index].quantity -= 1;


                if (cart[index].quantity <= 0) {

                    cart.splice(index, 1);

                }

            }


            updateCart();

        });

    });

}


// ========================================
// FORMAT PRIX
// ========================================

function formatPrice(value) {

    return value
        .toFixed(2)
        .replace(".", ",") + " €";

}


// ========================================
// BOUTON BEZAHLEN
// ========================================

payButton.addEventListener("click", function () {

    if (cart.length === 0) {

        alert("Bitte zuerst ein Produkt auswählen.");

        return;

    }


    alert("Der Bezahlvorgang kommt als nächster Schritt.");

});

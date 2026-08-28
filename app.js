// ========================================
// LAUTER MACHER
// APP.JS
// ========================================


// ========================================
// SCREENS
// ========================================

const homeScreen =
    document.getElementById("homeScreen");

const saleScreen =
    document.getElementById("saleScreen");

const paymentScreen =
    document.getElementById("paymentScreen");

const successScreen =
    document.getElementById("successScreen");


// ========================================
// BUTTONS
// ========================================

const saleButton =
    document.getElementById("saleButton");

const saleBackButton =
    document.getElementById("saleBackButton");

const paymentBackButton =
    document.getElementById("paymentBackButton");

const payButton =
    document.getElementById("payButton");

const paidButton =
    document.getElementById("paidButton");

const newOrderButton =
    document.getElementById("newOrderButton");

const successHomeButton =
    document.getElementById("successHomeButton");


// ========================================
// PRODUCT GRIDS
// ========================================

const drinksGrid =
    document.getElementById("drinksGrid");

const bakeryGrid =
    document.getElementById("bakeryGrid");


// ========================================
// CART
// ========================================

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");


// ========================================
// PAYMENT
// ========================================

const paymentTotal =
    document.getElementById("paymentTotal");

const amountReceived =
    document.getElementById("amountReceived");

const changeAmount =
    document.getElementById("changeAmount");

const successChange =
    document.getElementById("successChange");

const paymentKeys =
    document.querySelectorAll(".payment-key");

const deletePaymentButton =
    document.getElementById(
        "deletePaymentButton"
    );


// ========================================
// ADMIN
// ========================================

const adminButton =
    document.getElementById("adminButton");

const pinModal =
    document.getElementById("pinModal");

const cancelButton =
    document.getElementById("cancelButton");

const confirmButton =
    document.getElementById("confirmButton");

const deleteButton =
    document.getElementById("deleteButton");

const numberButtons =
    document.querySelectorAll(
        ".number-button"
    );

const pinDisplay =
    document.querySelectorAll(
        "#pinDisplay span"
    );


// ========================================
// VARIABLES
// ========================================

let cart = [];

let receivedAmount = "";

let enteredPin = "";


// ========================================
// ADMIN PIN
// ========================================
//
// PIN provisoire : 1234
//
// Nous le modifierons plus tard.
// ========================================

const ADMIN_PIN = "1234";


// ========================================
// INITIALISATION
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderProducts();

        updateCart();

        showScreen(homeScreen);

    }
);


// ========================================
// AFFICHER UN ÉCRAN
// ========================================

function showScreen(screen) {

    const screens =
        document.querySelectorAll(".screen");


    screens.forEach(function (item) {

        item.style.display = "none";

    });


    screen.style.display = "block";

}


// ========================================
// AFFICHER LES PRODUITS
// ========================================

function renderProducts() {

    drinksGrid.innerHTML = "";

    bakeryGrid.innerHTML = "";


    PRODUCTS.forEach(function (product) {

        const button =
            createProductButton(product);


        if (product.category === "drink") {

            drinksGrid.appendChild(button);

        }


        if (product.category === "bakery") {

            bakeryGrid.appendChild(button);

        }

    });


    if (
        bakeryGrid.children.length === 0
    ) {

        bakeryGrid.innerHTML = `
            <div class="coming-soon">
                Weitere Produkte folgen.
            </div>
        `;

    }

}


// ========================================
// CRÉER CARTE PRODUIT
// ========================================

function createProductButton(product) {

    const button =
        document.createElement("button");


    button.className =
        "product-card";


    button.dataset.productId =
        product.id;


    button.innerHTML = `

        <span class="product-icon">
            ${product.icon}
        </span>

        <span class="product-name">
            ${product.name}
        </span>

        <span class="product-price">
            ${formatPrice(product.price)}
        </span>

    `;


    button.addEventListener(
        "click",
        function () {

            addToCart(product);

        }
    );


    return button;

}


// ========================================
// VERKAUF OUVRIR
// ========================================

saleButton.addEventListener(
    "click",
    function () {

        showScreen(saleScreen);

    }
);


// ========================================
// RETOUR HOME
// ========================================

saleBackButton.addEventListener(
    "click",
    function () {

        resetSale();

        showScreen(homeScreen);

    }
);


// ========================================
// AJOUTER AU PANIER
// ========================================

function addToCart(product) {

    const existingProduct =
        cart.find(function (item) {

            return item.id === product.id;

        });


    if (existingProduct) {

        existingProduct.quantity += 1;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: product.price,

            category: product.category,

            quantity: 1

        });

    }


    updateCart();

}


// ========================================
// AFFICHER PANIER
// ========================================

function updateCart() {

    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                Noch keine Produkte ausgewählt.

            </div>

        `;


        cartTotal.textContent =
            "0,00 €";


        payButton.disabled = true;

        return;

    }


    cart.forEach(
        function (product, index) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "cart-item";


            const productTotal =
                product.price *
                product.quantity;


            item.innerHTML = `

                <div class="cart-product-info">

                    <span class="cart-product-name">
                        ${product.name}
                    </span>

                    <span class="cart-product-price">
                        ${formatPrice(productTotal)}
                    </span>

                </div>


                <div class="cart-controls">

                    <button
                        class="cart-control minus"
                        data-index="${index}"
                    >
                        −
                    </button>


                    <span class="cart-quantity">
                        ${product.quantity}
                    </span>


                    <button
                        class="cart-control plus"
                        data-index="${index}"
                    >
                        +
                    </button>

                </div>

            `;


            cartItems.appendChild(item);

        }
    );


    const total =
        calculateTotal();


    cartTotal.textContent =
        formatPrice(total);


    payButton.disabled = false;


    attachCartEvents();

}


// ========================================
// PANIER BUTTONS
// ========================================

function attachCartEvents() {

    const minusButtons =
        document.querySelectorAll(
            ".cart-control.minus"
        );


    const plusButtons =
        document.querySelectorAll(
            ".cart-control.plus"
        );


    minusButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    cart[index].quantity -= 1;


                    if (
                        cart[index].quantity <= 0
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


    plusButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    cart[index].quantity += 1;


                    updateCart();

                }
            );

        }
    );

}


// ========================================
// TOTAL
// ========================================

function calculateTotal() {

    return cart.reduce(
        function (total, product) {

            return total +
                (
                    product.price *
                    product.quantity
                );

        },
        0
    );

}


// ========================================
// OUVRIR PAIEMENT
// ========================================

payButton.addEventListener(
    "click",
    function () {

        if (cart.length === 0) {

            return;

        }


        const total =
            calculateTotal();


        paymentTotal.textContent =
            formatPrice(total);


        receivedAmount = "";

        updatePaymentDisplay();


        showScreen(paymentScreen);

    }
);


// ========================================
// RETOUR VERKAUF
// ========================================

paymentBackButton.addEventListener(
    "click",
    function () {

        receivedAmount = "";

        showScreen(saleScreen);

    }
);


// ========================================
// PAYMENT KEYPAD
// ========================================

paymentKeys.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const value =
                    button.textContent.trim();


                if (value === ",") {

                    addDecimal();

                    return;

                }


                if (
                    receivedAmount === "0"
                ) {

                    receivedAmount = "";

                }


                receivedAmount += value;


                updatePaymentDisplay();

            }
        );

    }
);


// ========================================
// VIRGULE
// ========================================

function addDecimal() {

    if (
        receivedAmount === ""
    ) {

        receivedAmount = "0";

    }


    if (
        !receivedAmount.includes(",")
    ) {

        receivedAmount += ",";

    }


    updatePaymentDisplay();

}


// ========================================
// DELETE PAYMENT
// ========================================

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


// ========================================
// PAYMENT DISPLAY
// ========================================

function updatePaymentDisplay() {

    let displayValue =
        receivedAmount;


    if (
        displayValue === "" ||
        displayValue === ","
    ) {

        displayValue = "0,00";

    }


    amountReceived.textContent =
        displayValue + " €";


    calculateChange();

}


// ========================================
// CALCUL RÜCKGELD
// ========================================

function calculateChange() {

    const total =
        calculateTotal();


    const received =
        parseGermanNumber(
            receivedAmount
        );


    const change =
        received - total;


    if (
        receivedAmount === ""
    ) {

        changeAmount.textContent =
            "0,00 €";


        paidButton.disabled =
            true;


        return;

    }


    if (change < 0) {

        changeAmount.textContent =
            "Noch " +
            formatPrice(
                Math.abs(change)
            );


        paidButton.disabled =
            true;


        return;

    }


    changeAmount.textContent =
        formatPrice(change);


    paidButton.disabled =
        false;

}


// ========================================
// VALIDATION PAYMENT
// ========================================

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
            received < total
        ) {

            return;

        }


        const change =
            received - total;


        successChange.textContent =
            formatPrice(change);


        showScreen(
            successScreen
        );

    }
);


// ========================================
// NOUVELLE COMMANDE
// ========================================

newOrderButton.addEventListener(
    "click",
    function () {

        resetSale();

        showScreen(saleScreen);

    }
);


// ========================================
// RETOUR HOME APRÈS VENTE
// ========================================

successHomeButton.addEventListener(
    "click",
    function () {

        resetSale();

        showScreen(homeScreen);

    }
);


// ========================================
// RESET VENTE
// ========================================

function resetSale() {

    cart = [];

    receivedAmount = "";

    updateCart();

}


// ========================================
// CONVERTIR NOMBRE ALLEMAND
// ========================================

function parseGermanNumber(value) {

    if (!value) {

        return 0;

    }


    return Number(
        value.replace(",", ".")
    );

}


// ========================================
// FORMAT PRIX
// ========================================

function formatPrice(value) {

    return value
        .toFixed(2)
        .replace(".", ",") +
        " €";

}


// ========================================
// ADMIN MODAL
// ========================================

adminButton.addEventListener(
    "click",
    function () {

        enteredPin = "";

        updatePinDisplay();


        pinModal.style.display =
            "flex";


        pinModal.setAttribute(
            "aria-hidden",
            "false"
        );

    }
);


// ========================================
// FERMER MODAL
// ========================================

cancelButton.addEventListener(
    "click",
    closePinModal
);


function closePinModal() {

    pinModal.style.display =
        "none";


    pinModal.setAttribute(
        "aria-hidden",
        "true"
    );


    enteredPin = "";

    updatePinDisplay();

}


// ========================================
// PIN NUMBERS
// ========================================

numberButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                if (
                    enteredPin.length >= 4
                ) {

                    return;

                }


                enteredPin +=
                    button.textContent.trim();


                updatePinDisplay();

            }
        );

    }
);


// ========================================
// DELETE PIN
// ========================================

deleteButton.addEventListener(
    "click",
    function () {

        enteredPin =
            enteredPin.slice(
                0,
                -1
            );


        updatePinDisplay();

    }
);


// ========================================
// PIN DISPLAY
// ========================================

function updatePinDisplay() {

    pinDisplay.forEach(
        function (item, index) {

            if (
                index <
                enteredPin.length
            ) {

                item.textContent =
                    "●";

            } else {

                item.textContent =
                    "○";

            }

        }
    );

}


// ========================================
// CONFIRM PIN
// ========================================

confirmButton.addEventListener(
    "click",
    function () {

        if (
            enteredPin === ADMIN_PIN
        ) {

            closePinModal();


            alert(
                "Admin-Bereich folgt in der nächsten Version."
            );

        } else {

            alert(
                "Falsche PIN."
            );


            enteredPin = "";

            updatePinDisplay();

        }

    }
);


// ========================================
// FERMER MODAL EN CLIQUANT DEHORS
// ========================================

pinModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === pinModal
        ) {

            closePinModal();

        }

    }
);

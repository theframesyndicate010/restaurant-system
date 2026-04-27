document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-items-grid');
    const orderItemsTbody = document.getElementById('order-items-tbody');
    const subTotalElem = document.getElementById('sub-total');
    const totalDiscountElem = document.getElementById('total-discount');
    const grandTotalElem = document.getElementById('grand-total');
    const totalItemsBadge = document.getElementById('total-items-badge');
    const discFlatRadio = document.getElementById('discFlat');
    const discPercentRadio = document.getElementById('discPercent');
    const flatInput = document.getElementById('discount-flat-input');
    const percentInput = document.getElementById('discount-percent-input');
    const tableDropdownBtn = document.getElementById('tableSelectDropdown');
    const orderRowTemplate = document.getElementById('order-row-template');

    let cart = [];

    // 1. Add Item to Cart
    menuGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.menu-item-card');
        if (!card) return;

        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }

        renderCart();
    });

    // 2. Render Cart Table
    function renderCart() {
        orderItemsTbody.innerHTML = '';
        let subtotal = 0;
        let totalItems = 0;

        cart.forEach((item, index) => {
            const amount = item.price * item.quantity;
            subtotal += amount;
            totalItems += item.quantity;

            const row = orderRowTemplate.content.cloneNode(true);

            row.querySelector('.order-item-name').textContent = item.name;
            row.querySelector('.order-item-rate').textContent = item.price.toFixed(2);
            row.querySelector('.qty-value').textContent = item.quantity;
            row.querySelector('.order-item-amount').textContent = amount.toFixed(2);

            row.querySelector('.decrease-qty').dataset.index = index;
            row.querySelector('.increase-qty').dataset.index = index;
            row.querySelector('.delete-item').dataset.index = index;

            orderItemsTbody.appendChild(row);
        });

        subTotalElem.textContent = subtotal.toFixed(2);
        totalItemsBadge.textContent = totalItems;
        calculateTotals(subtotal);
    }

    // 3. Handle Cart Actions (Qty, Delete)
    orderItemsTbody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const index = parseInt(target.dataset.index);

        if (target.classList.contains('increase-qty')) {
            cart[index].quantity += 1;
        } else if (target.classList.contains('decrease-qty')) {
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
            } else {
                cart.splice(index, 1);
            }
        } else if (target.classList.contains('delete-item')) {
            cart.splice(index, 1);
        }

        renderCart();
    });

    // 4. Calculate Discounts & Grand Total
    function calculateTotals(subtotal) {
        let discount = 0;

        const flatVal = parseFloat(flatInput.value) || 0;
        const percentVal = parseFloat(percentInput.value) || 0;

        if (subtotal > 0) {
            if (discFlatRadio.checked) {
                discount = flatVal;
            } else {
                discount = (subtotal * percentVal) / 100;
            }
        }

        // Clip discount to subtotal
        if (discount > subtotal) discount = subtotal;

        totalDiscountElem.textContent = discount.toFixed(2);
        grandTotalElem.textContent = (subtotal - discount).toFixed(2);

        // Update mobile mirror displays if they exist
        const mobileTotalDisc = document.getElementById('mobile-total-discount');
        const mobileGrandTotal = document.getElementById('mobile-grand-total');
        if (mobileTotalDisc) mobileTotalDisc.textContent = discount.toFixed(2);
        if (mobileGrandTotal) mobileGrandTotal.textContent = (subtotal - discount).toFixed(2);
    }

    // Listen for discount input changes
    [flatInput, percentInput].forEach(input => {
        input.addEventListener('input', () => {
            const subtotal = parseFloat(subTotalElem.textContent);
            calculateTotals(subtotal);
        });
    });

    [discFlatRadio, discPercentRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            const subtotal = parseFloat(subTotalElem.textContent);
            calculateTotals(subtotal);
        });
    });

    // 5. Table selection logic
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const text = item.innerText.trim();
            if (tableDropdownBtn) {
                tableDropdownBtn.innerText = text;
            }
        });
    });

    // 6. POS Action Buttons (Checkout, Est. Bill, Void)
    const checkoutBtn = document.querySelector('.btn-checkout-main');
    const estBillBtn = document.querySelector('.btn-action-light');
    const voidBtn = document.querySelector('.btn-action-danger-light');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const total = grandTotalElem.textContent;
            if (total === "0.00") return alert("Cart is empty!");
            alert("Processing Checkout for Rs. " + total);
        });
    }

    if (estBillBtn) {
        estBillBtn.addEventListener('click', () => {
            alert("Generating Estimated Bill...");
        });
    }

    if (voidBtn) {
        voidBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the entire order?")) {
                cart = [];
                renderCart();
            }
        });
    }
});

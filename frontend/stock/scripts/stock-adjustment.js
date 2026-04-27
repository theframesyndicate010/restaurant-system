document.addEventListener("DOMContentLoaded", () => {
    const categorySelect = document.getElementById("adjustCategory");
    const productSelect = document.getElementById("adjustProduct");
    const currentStockInput = document.getElementById("currentStock");
    const unitSelect = document.getElementById("adjustUnit");
    const form = document.getElementById("stockAdjustmentForm");
    const messageBox = document.getElementById("stockAdjustmentMessage");

    const productMap = {
        beverages: [
            { name: "Balvenie 25Y", stock: 15, unit: "Bottle" },
            { name: "Coca Cola (250ml)", stock: 120, unit: "Bottle" },
            { name: "Fresh Milk (1L)", stock: 32, unit: "Liter" }
        ],
        supplies: [
            { name: "Refined Sugar (1Kg)", stock: 14, unit: "Kg" },
            { name: "Paper Cups (100pcs)", stock: 64, unit: "Piece" }
        ],
        "main course": [
            { name: "Chicken Breast", stock: 22, unit: "Kg" },
            { name: "White Flour (5kg)", stock: 6, unit: "Kg" }
        ],
        bakery: [
            { name: "Baking Powder", stock: 54, unit: "Piece" }
        ]
    };

    const showMessage = (text, type) => {
        if (!messageBox) return;
        messageBox.classList.remove("d-none", "alert-success", "alert-danger");
        messageBox.classList.add(type === "success" ? "alert-success" : "alert-danger");
        messageBox.textContent = text;
    };

    const resetMessage = () => {
        if (!messageBox) return;
        messageBox.classList.add("d-none");
        messageBox.textContent = "";
    };

    const renderProducts = (category) => {
        if (!productSelect) return;

        productSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Select Stock Item --";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        productSelect.appendChild(defaultOption);

        const items = productMap[category] || [];

        items.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.name;
            option.textContent = item.name;
            option.dataset.stock = String(item.stock);
            option.dataset.unit = item.unit;
            productSelect.appendChild(option);
        });

        if (currentStockInput) currentStockInput.value = "0";
    };

    const syncStockAndUnit = () => {
        const selected = productSelect && productSelect.options[productSelect.selectedIndex];
        if (!selected || !selected.dataset) {
            if (currentStockInput) currentStockInput.value = "0";
            return;
        }

        if (currentStockInput) {
            currentStockInput.value = selected.dataset.stock || "0";
        }

        if (unitSelect && selected.dataset.unit) {
            unitSelect.value = selected.dataset.unit;
        }
    };

    if (categorySelect) {
        categorySelect.addEventListener("change", () => {
            renderProducts(categorySelect.value);
            resetMessage();
        });
    }

    if (productSelect) {
        productSelect.addEventListener("change", () => {
            syncStockAndUnit();
            resetMessage();
        });
    }

    if (form) {
        form.addEventListener("reset", () => {
            setTimeout(() => {
                if (productSelect) {
                    productSelect.innerHTML = "";
                    const defaultOption = document.createElement("option");
                    defaultOption.value = "";
                    defaultOption.textContent = "-- Select Stock Item --";
                    defaultOption.disabled = true;
                    defaultOption.selected = true;
                    productSelect.appendChild(defaultOption);
                }
                if (currentStockInput) currentStockInput.value = "0";
                resetMessage();
            }, 0);
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const category = categorySelect ? categorySelect.value : "";
            const product = productSelect ? productSelect.value : "";
            const adjustmentType = document.getElementById("adjustType").value;
            const unit = unitSelect ? unitSelect.value : "";
            const quantity = document.getElementById("adjustQty").value;
            const remarks = document.getElementById("adjustRemarks").value.trim();

            if (!category || !product || !adjustmentType || !unit || !quantity || !remarks) {
                showMessage("Please complete all mandatory fields before saving.", "error");
                return;
            }

            showMessage("Stock adjustment entry is ready to be saved.", "success");
        });
    }
});
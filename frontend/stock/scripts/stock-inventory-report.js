document.addEventListener("DOMContentLoaded", () => {
    const fromDateInput = document.getElementById("summaryFromDate");
    const toDateInput = document.getElementById("summaryToDate");
    const itemSelect = document.getElementById("summaryItem");
    const loadBtn = document.getElementById("summaryLoadBtn");

    const availableFromLabel = document.getElementById("availableFromLabel");
    const openingLabel = document.getElementById("openingLabel");
    const availableToLabel = document.getElementById("availableToLabel");

    const availableFromQty = document.getElementById("availableFromQty");
    const openingQty = document.getElementById("openingQty");
    const purchasedQty = document.getElementById("purchasedQty");
    const purchasedReturnQty = document.getElementById("purchasedReturnQty");
    const sentToKitchenQty = document.getElementById("sentToKitchenQty");
    const damagedQty = document.getElementById("damagedQty");
    const personalUseQty = document.getElementById("personalUseQty");
    const movementTotalQty = document.getElementById("movementTotalQty");
    const totalConsumptionQty = document.getElementById("totalConsumptionQty");
    const stockAdjustmentQty = document.getElementById("stockAdjustmentQty");
    const availableToQty = document.getElementById("availableToQty");

    const summaryByItem = {
        "Balvenie 25Y": {
            openingDate: "2082-12-19",
            availableFrom: "0 Bottle",
            opening: "5 Bottle",
            purchased: "13 Bottle",
            purchasedReturn: "2 Bottle",
            sentToKitchen: "0",
            damaged: "0",
            personalUse: "0",
            movementTotal: "0",
            totalConsumption: "0 Bottle 450 Milliliter",
            stockAdjustment: "11 btl 610 ml",
            availableTo: "15 Bottle 550 Milliliter"
        },
        "Fresh Milk (1L)": {
            openingDate: "2082-12-15",
            availableFrom: "18 Bottle",
            opening: "25 Bottle",
            purchased: "48 Bottle",
            purchasedReturn: "1 Bottle",
            sentToKitchen: "36",
            damaged: "2",
            personalUse: "1",
            movementTotal: "39",
            totalConsumption: "39 Bottle",
            stockAdjustment: "-2 Bottle",
            availableTo: "32 Bottle"
        },
        "Refined Sugar (1Kg)": {
            openingDate: "2082-12-18",
            availableFrom: "6 Bag",
            opening: "9 Bag",
            purchased: "12 Bag",
            purchasedReturn: "0 Bag",
            sentToKitchen: "8",
            damaged: "0",
            personalUse: "0",
            movementTotal: "8",
            totalConsumption: "8 Bag",
            stockAdjustment: "1 Bag",
            availableTo: "14 Bag"
        },
        "Coca Cola (250ml)": {
            openingDate: "2082-12-10",
            availableFrom: "20 Bottle",
            opening: "30 Bottle",
            purchased: "40 Bottle",
            purchasedReturn: "3 Bottle",
            sentToKitchen: "22",
            damaged: "1",
            personalUse: "0",
            movementTotal: "23",
            totalConsumption: "23 Bottle",
            stockAdjustment: "2 Bottle",
            availableTo: "46 Bottle"
        }
    };

    const updateSummary = () => {
        const selectedItem = itemSelect.value;
        const summary = summaryByItem[selectedItem] || summaryByItem["Balvenie 25Y"];

        const fromDate = (fromDateInput.value || "2082-11-01").trim();
        const toDate = (toDateInput.value || "2082-12-29").trim();

        availableFromLabel.textContent = "Available Stock on [" + fromDate + "]";
        openingLabel.textContent = "Opening Stock on [" + summary.openingDate + "]";
        availableToLabel.textContent = "Available Stock on [" + toDate + "]";

        availableFromQty.textContent = summary.availableFrom;
        openingQty.textContent = summary.opening;
        purchasedQty.textContent = summary.purchased;
        purchasedReturnQty.textContent = summary.purchasedReturn;
        sentToKitchenQty.textContent = summary.sentToKitchen;
        damagedQty.textContent = summary.damaged;
        personalUseQty.textContent = summary.personalUse;
        movementTotalQty.textContent = summary.movementTotal;
        totalConsumptionQty.textContent = summary.totalConsumption;
        stockAdjustmentQty.textContent = summary.stockAdjustment;
        availableToQty.textContent = summary.availableTo;
    };

    if (loadBtn) {
        loadBtn.addEventListener("click", () => {
            loadBtn.disabled = true;
            const iconNode = loadBtn.querySelector("i");
            const originalIconClasses = iconNode ? iconNode.className : "";

            if (iconNode) {
                iconNode.className = "fa-solid fa-spinner fa-spin";
            }

            setTimeout(() => {
                updateSummary();
                loadBtn.disabled = false;

                if (iconNode) {
                    iconNode.className = originalIconClasses || "fa-solid fa-gear";
                }
            }, 220);
        });
    }

    updateSummary();
});
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("newStockIssueForm");
    const receiverStaff = document.getElementById("receiverStaff");
    const menuItem = document.getElementById("menuItem");
    const openingStock = document.getElementById("openingStock");
    const resetButton = document.getElementById("resetIssueForm");
    const messageBox = document.getElementById("issueFormMessage");

    const updateOpeningStock = () => {
        if (!menuItem || !openingStock) return;
        const selectedOption = menuItem.options[menuItem.selectedIndex];
        openingStock.value = selectedOption ? (selectedOption.getAttribute("data-opening-stock") || "0") : "0";
    };

    const showMessage = (text, type) => {
        if (!messageBox) return;
        messageBox.classList.remove("d-none", "alert-success", "alert-danger");
        messageBox.classList.add(type === "success" ? "alert-success" : "alert-danger");
        messageBox.textContent = text;
    };

    if (menuItem) {
        menuItem.addEventListener("change", updateOpeningStock);
    }

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            if (messageBox) {
                messageBox.classList.add("d-none");
                messageBox.textContent = "";
            }
            setTimeout(updateOpeningStock, 0);
        });
    }

    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!receiverStaff.value || !menuItem.value) {
                showMessage("Please select receiver and menu item before saving.", "error");
                return;
            }

            showMessage("Stock issue entry is ready to be saved.", "success");
        });
    }

    updateOpeningStock();
});
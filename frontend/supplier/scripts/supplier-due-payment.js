document.addEventListener("DOMContentLoaded", () => {
    const PAYMENT_HISTORY_KEY = "supplier_payment_history";

    const supplierName = document.getElementById("supplierName");
    const discountAmount = document.getElementById("discountAmount");
    const paidAmount = document.getElementById("paidAmount");
    const paymentType = document.getElementById("paymentType");
    const totalDueValue = document.getElementById("totalDueValue");
    const paymentForm = document.getElementById("supplierPaymentForm");
    const resetFormButton = document.getElementById("resetSupplierPaymentForm");
    const alertBox = document.getElementById("supplierPaymentAlert");

    if (!supplierName || !discountAmount || !paidAmount || !paymentType || !totalDueValue || !paymentForm || !resetFormButton || !alertBox) {
        return;
    }

    const supplierBills = {
        "Drinkers stop": [
            { billDate: "2026-04-12", invNo: "INV-8901", billAmt: 285047368.17, paidAmt: 0, dueAmt: 285047368.17 }
        ],
        "Varities Kirana": [
            { billDate: "2026-04-11", invNo: "INV-8852", billAmt: 11250, paidAmt: 2500, dueAmt: 8750 },
            { billDate: "2026-04-07", invNo: "INV-8799", billAmt: 6490, paidAmt: 1490, dueAmt: 5000 }
        ],
        "birtamod kirana": [
            { billDate: "2026-04-10", invNo: "INV-8841", billAmt: 7800, paidAmt: 1200, dueAmt: 6600 }
        ],
        "Bishal vegetables": [
            { billDate: "2026-04-09", invNo: "INV-8820", billAmt: 5400, paidAmt: 1400, dueAmt: 4000 },
            { billDate: "2026-04-03", invNo: "INV-8733", billAmt: 3100, paidAmt: 600, dueAmt: 2500 }
        ]
    };

    const numberFormat = (value) => {
        const num = Number(value);
        return Number.isFinite(num)
            ? num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "0.00";
    };

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const setAlert = (type, message) => {
        alertBox.classList.remove("d-none", "alert-success", "alert-warning", "alert-danger");

        const klass = type === "success" ? "alert-success" : type === "warning" ? "alert-warning" : "alert-danger";
        alertBox.classList.add(klass);
        alertBox.textContent = message;
    };

    const clearAlert = () => {
        alertBox.classList.add("d-none");
        alertBox.textContent = "";
        alertBox.classList.remove("alert-success", "alert-warning", "alert-danger");
    };

    const getCurrentBills = () => {
        const selectedSupplier = supplierName.value || "";
        return supplierBills[selectedSupplier] || [];
    };

    const getBaseDueTotal = () => {
        return getCurrentBills().reduce((sum, row) => sum + parseNumber(row.dueAmt), 0);
    };

    const fillSupplierOptions = () => {
        supplierName.innerHTML = '<option value="" selected disabled>Select Supplier</option>';

        Object.keys(supplierBills).forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            supplierName.appendChild(option);
        });
    };

    const getQuerySupplier = () => {
        const query = new URLSearchParams(window.location.search);
        return query.get("supplier") || "";
    };

    const applySupplierFromQuery = () => {
        const querySupplier = getQuerySupplier();
        if (!querySupplier) return;

        const options = Array.from(supplierName.options).map((option) => option.value);
        if (options.includes(querySupplier)) {
            supplierName.value = querySupplier;
        }
    };

    const updateTotalDue = () => {
        const baseDue = getBaseDueTotal();
        const discount = parseNumber(discountAmount.value);
        const paid = parseNumber(paidAmount.value);
        const adjustedDue = Math.max(baseDue - discount - paid, 0);

        const maxAllowedPaid = Math.max(baseDue - discount, 0);
        if (paid > maxAllowedPaid) {
            paidAmount.setCustomValidity("Paid amount cannot exceed due amount after discount.");
        } else {
            paidAmount.setCustomValidity("");
        }

        totalDueValue.textContent = numberFormat(adjustedDue);
    };

    const renderBills = () => {
        if (!window.jQuery || !jQuery.fn || !jQuery.fn.DataTable) {
            return;
        }

        if (!$.fn.DataTable.isDataTable("#supplierPaymentTable")) {
            return;
        }

        const rows = getCurrentBills();
        const table = $("#supplierPaymentTable").DataTable();

        table.clear();

        rows.forEach((row, index) => {
            table.row.add([
                '<span class="supplier-payment-sn">' + String(index + 1) + "</span>",
                row.billDate,
                row.invNo,
                '<span class="fw-semibold">' + numberFormat(row.billAmt) + "</span>",
                '<span class="fw-semibold text-success">' + numberFormat(row.paidAmt) + "</span>",
                '<span class="fw-semibold text-danger">' + numberFormat(row.dueAmt) + "</span>",
                '<button type="button" class="supplier-payment-view-btn" title="View Bill"><i class="fa-solid fa-eye"></i></button>'
            ]);
        });

        table.draw(false);
    };

    const waitForDataTable = () => {
        if (!window.jQuery || !jQuery.fn || !jQuery.fn.DataTable || !$.fn.DataTable.isDataTable("#supplierPaymentTable")) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        renderBills();
        updateTotalDue();
    };

    const persistPayment = () => {
        const paymentRecord = {
            id: "SP-" + Date.now(),
            date: new Date().toISOString(),
            supplier: supplierName.value,
            discountAmount: parseNumber(discountAmount.value),
            paidAmount: parseNumber(paidAmount.value),
            paymentType: paymentType.value,
            totalDueBefore: getBaseDueTotal(),
            totalDueAfter: Math.max(getBaseDueTotal() - parseNumber(discountAmount.value) - parseNumber(paidAmount.value), 0)
        };

        try {
            const raw = localStorage.getItem(PAYMENT_HISTORY_KEY);
            const existing = raw ? JSON.parse(raw) : [];
            const list = Array.isArray(existing) ? existing : [];
            list.push(paymentRecord);
            localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify(list));
            return true;
        } catch (error) {
            return false;
        }
    };

    supplierName.addEventListener("change", () => {
        renderBills();
        updateTotalDue();
        clearAlert();
    });

    discountAmount.addEventListener("input", () => {
        updateTotalDue();
        clearAlert();
    });

    paidAmount.addEventListener("input", () => {
        updateTotalDue();
        clearAlert();
    });

    resetFormButton.addEventListener("click", () => {
        setTimeout(() => {
            clearAlert();
            renderBills();
            updateTotalDue();
        }, 0);
    });

    paymentForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!paymentForm.checkValidity()) {
            paymentForm.reportValidity();
            return;
        }

        const saved = persistPayment();
        if (!saved) {
            setAlert("danger", "Unable to save payment in browser storage.");
            return;
        }

        setAlert("success", "Supplier payment saved successfully.");
    });

    fillSupplierOptions();
    applySupplierFromQuery();
    waitForDataTable();
});

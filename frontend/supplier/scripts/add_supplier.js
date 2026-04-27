document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "supplier_master_list";

    const form = document.getElementById("addSupplierForm");
    const resetButton = document.getElementById("addSupplierResetBtn");
    const alertBox = document.getElementById("addSupplierAlert");

    const fullNameInput = document.getElementById("supplierFullName");
    const permanentAddressInput = document.getElementById("supplierPermanentAddress");
    const primaryContactInput = document.getElementById("supplierPrimaryContact");
    const emailInput = document.getElementById("supplierEmail");
    const temporaryAddressInput = document.getElementById("supplierTemporaryAddress");
    const secondaryContactInput = document.getElementById("supplierSecondaryContact");
    const panNoInput = document.getElementById("supplierPanNo");
    const descriptionInput = document.getElementById("supplierDescription");

    if (!form || !resetButton || !alertBox || !fullNameInput || !permanentAddressInput || !primaryContactInput ||
        !emailInput || !temporaryAddressInput || !secondaryContactInput || !panNoInput || !descriptionInput) {
        return;
    }

    const normalizeText = (value, fallback = "") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizePhone = (value) => {
        return String(value || "").replace(/[^\d+\-\s()]/g, "").trim();
    };

    const parseStoredSuppliers = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    };

    const getNextSupplierId = (records) => {
        const maxNo = records.reduce((maxValue, item) => {
            const match = String(item && item.supplierId ? item.supplierId : "").match(/SUP-(\d+)/i);
            if (!match) return maxValue;

            const current = parseInt(match[1], 10);
            if (!Number.isFinite(current)) return maxValue;

            return Math.max(maxValue, current);
        }, 1000);

        return "SUP-" + String(maxNo + 1);
    };

    const showAlert = (type, message) => {
        alertBox.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");

        const klass = type === "success" ? "alert-success" : type === "warning" ? "alert-warning" : "alert-danger";
        alertBox.classList.add(klass);
        alertBox.textContent = message;
    };

    const hideAlert = () => {
        alertBox.classList.add("d-none");
        alertBox.textContent = "";
        alertBox.classList.remove("alert-success", "alert-danger", "alert-warning");
    };

    const validateForm = () => {
        const fullName = normalizeText(fullNameInput.value);
        const permanentAddress = normalizeText(permanentAddressInput.value);
        const primaryContact = normalizePhone(primaryContactInput.value);
        const email = normalizeText(emailInput.value);

        if (!fullName || !permanentAddress || !primaryContact) {
            showAlert("warning", "Please fill all mandatory fields marked with *.");
            return null;
        }

        if (primaryContact.length < 7) {
            showAlert("warning", "Primary Contact looks invalid.");
            return null;
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert("warning", "Please enter a valid email address.");
                return null;
            }
        }

        return {
            fullName,
            permanentAddress,
            primaryContact,
            email,
            temporaryAddress: normalizeText(temporaryAddressInput.value),
            secondaryContact: normalizePhone(secondaryContactInput.value),
            panNo: normalizeText(panNoInput.value),
            description: normalizeText(descriptionInput.value)
        };
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideAlert();

        const values = validateForm();
        if (!values) return;

        const suppliers = parseStoredSuppliers();

        suppliers.push({
            supplierId: getNextSupplierId(suppliers),
            name: values.fullName,
            address: values.permanentAddress,
            contactNo: values.primaryContact,
            status: "enabled",
            email: values.email,
            temporaryAddress: values.temporaryAddress,
            secondaryContact: values.secondaryContact,
            panNo: values.panNo,
            description: values.description
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
            showAlert("success", "Supplier saved successfully. Redirecting to Supplier list...");
            setTimeout(() => {
                window.location.href = "supplier.html";
            }, 750);
        } catch (error) {
            showAlert("danger", "Unable to save supplier in browser storage.");
        }
    });

    resetButton.addEventListener("click", () => {
        hideAlert();
    });
});

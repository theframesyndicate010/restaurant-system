document.addEventListener("DOMContentLoaded", () => {
    const CATEGORY_STORAGE_KEY = "office_expense_category_master_list";
    const EXPENSE_STORAGE_KEY = "office_expense_entry_list";
    const USER_STORAGE_KEY = "staff_user_master_list";

    const form = document.getElementById("addExpenseForm");
    const resetButton = document.getElementById("addExpenseResetBtn");
    const alertBox = document.getElementById("addExpenseAlert");

    const expenseTypeInputs = Array.from(document.querySelectorAll('input[name="expenseType"]'));
    const generalFields = document.getElementById("generalExpenseFields");
    const categorySelect = document.getElementById("expenseCategorySelect");
    const paymentMethodSelect = document.getElementById("expensePaymentMethodSelect");
    const amountInput = document.getElementById("expenseAmount");
    const remarksInput = document.getElementById("expenseRemarks");

    const salaryFields = document.getElementById("salaryPaymentFields");
    const salaryEmployeeSelect = document.getElementById("salaryEmployeeSelect");
    const salaryPaymentMethodSelect = document.getElementById("salaryPaymentMethodSelect");
    const salaryAmountInput = document.getElementById("salaryAmount");
    const salaryRemarksInput = document.getElementById("salaryRemarks");

    if (!form || !resetButton || !alertBox || !expenseTypeInputs.length || !generalFields || !categorySelect ||
        !paymentMethodSelect || !amountInput || !remarksInput || !salaryFields || !salaryEmployeeSelect ||
        !salaryPaymentMethodSelect || !salaryAmountInput || !salaryRemarksInput) {
        return;
    }

    const staticCategoryTitles = [
        "Electricity Bill",
        "Internet Charges",
        "Office Supplies",
        "Maintenance",
        "Cleaning Materials"
    ];

    const staticEmployeeNames = [
        "Admin",
        "Cashier",
        "Waiter"
    ];

    const normalizeText = (value, fallback = "") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const parseStoredList = (storageKey) => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
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

    const getSelectedExpenseType = () => {
        const selected = expenseTypeInputs.find((input) => input.checked);
        return selected ? normalizeText(selected.value) : "";
    };

    const getAllEmployeeNames = () => {
        const dynamicRows = parseStoredList(USER_STORAGE_KEY)
            .map((item) => {
                const fullName = normalizeText(item && item.fullName ? item.fullName : "");
                const name = normalizeText(item && item.name ? item.name : "");
                const username = normalizeText(item && item.username ? item.username : "");
                return fullName || name || username;
            })
            .filter(Boolean);

        const allNames = staticEmployeeNames.concat(dynamicRows);
        const unique = [];

        allNames.forEach((entry) => {
            if (!unique.some((name) => name.toLowerCase() === entry.toLowerCase())) {
                unique.push(entry);
            }
        });

        return unique;
    };

    const getAllCategoryTitles = () => {
        const dynamicRows = parseStoredList(CATEGORY_STORAGE_KEY)
            .map((item) => normalizeText(item && item.title ? item.title : ""))
            .filter(Boolean);

        const allTitles = staticCategoryTitles.concat(dynamicRows);
        const unique = [];

        allTitles.forEach((title) => {
            if (!unique.some((entry) => entry.toLowerCase() === title.toLowerCase())) {
                unique.push(title);
            }
        });

        return unique;
    };

    const populateCategorySelect = () => {
        const titles = getAllCategoryTitles();

        categorySelect.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "-- Select Expense Category --";
        categorySelect.appendChild(placeholder);

        titles.forEach((title) => {
            const option = document.createElement("option");
            option.value = title;
            option.textContent = title;
            categorySelect.appendChild(option);
        });
    };

    const populateEmployeeSelect = () => {
        const names = getAllEmployeeNames();

        salaryEmployeeSelect.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "-- Select Employee --";
        salaryEmployeeSelect.appendChild(placeholder);

        names.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            salaryEmployeeSelect.appendChild(option);
        });
    };

    const toggleExpenseTypeFields = () => {
        const expenseType = getSelectedExpenseType();
        const isSalary = expenseType === "Salary Payment";

        generalFields.classList.toggle("d-none", isSalary);
        salaryFields.classList.toggle("d-none", !isSalary);
    };

    const getNextExpenseId = (records) => {
        const maxNo = records.reduce((maxValue, item) => {
            const match = String(item && item.expenseId ? item.expenseId : "").match(/EXP-(\d+)/i);
            if (!match) {
                return maxValue;
            }

            const current = parseInt(match[1], 10);
            if (!Number.isFinite(current)) {
                return maxValue;
            }

            return Math.max(maxValue, current);
        }, 1000);

        return "EXP-" + String(maxNo + 1);
    };

    const validateForm = () => {
        const expenseType = getSelectedExpenseType();

        if (!expenseType) {
            showAlert("warning", "Please fill all mandatory fields marked with *.");
            return null;
        }

        if (expenseType === "Salary Payment") {
            const employee = normalizeText(salaryEmployeeSelect.value);
            const paymentMethod = normalizeText(salaryPaymentMethodSelect.value);
            const amount = Number.parseFloat(String(salaryAmountInput.value || "0").trim());
            const remarks = normalizeText(salaryRemarksInput.value);

            if (!employee || !paymentMethod) {
                showAlert("warning", "Please fill all mandatory fields marked with *.");
                return null;
            }

            if (!Number.isFinite(amount) || amount <= 0) {
                showAlert("warning", "Please enter a valid Salary Amount greater than 0.");
                return null;
            }

            return {
                expenseType,
                employee,
                expenseCategory: "",
                paymentMethod,
                amount: Number(amount.toFixed(2)),
                remarks
            };
        }

        const expenseCategory = normalizeText(categorySelect.value);
        const paymentMethod = normalizeText(paymentMethodSelect.value);
        const amount = Number.parseFloat(String(amountInput.value || "0").trim());
        const remarks = normalizeText(remarksInput.value);

        if (!expenseCategory || !paymentMethod) {
            showAlert("warning", "Please fill all mandatory fields marked with *.");
            return null;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showAlert("warning", "Please enter a valid Amount greater than 0.");
            return null;
        }

        return {
            expenseType,
            employee: "",
            expenseCategory,
            paymentMethod,
            amount: Number(amount.toFixed(2)),
            remarks
        };
    };

    populateCategorySelect();
    populateEmployeeSelect();
    toggleExpenseTypeFields();

    expenseTypeInputs.forEach((input) => {
        input.addEventListener("change", () => {
            hideAlert();
            toggleExpenseTypeFields();
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideAlert();

        const values = validateForm();
        if (!values) {
            return;
        }

        const entries = parseStoredList(EXPENSE_STORAGE_KEY);

        entries.push({
            expenseId: getNextExpenseId(entries),
            expenseType: values.expenseType,
            employee: values.employee,
            expenseCategory: values.expenseCategory,
            paymentMethod: values.paymentMethod,
            amount: values.amount,
            remarks: values.remarks,
            createdBy: "Admin",
            createdAt: new Date().toISOString().slice(0, 10)
        });

        try {
            localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(entries));
            showAlert("success", "Office expense saved successfully.");
            form.reset();
            amountInput.value = "0.00";
            salaryAmountInput.value = "0.00";
            populateCategorySelect();
            populateEmployeeSelect();
            const firstType = expenseTypeInputs[0];
            if (firstType) {
                firstType.checked = true;
            }
            toggleExpenseTypeFields();
        } catch (error) {
            showAlert("danger", "Unable to save office expense in browser storage.");
        }
    });

    resetButton.addEventListener("click", () => {
        hideAlert();

        setTimeout(() => {
            amountInput.value = "0.00";
            salaryAmountInput.value = "0.00";
            populateCategorySelect();
            populateEmployeeSelect();
            const firstType = expenseTypeInputs[0];
            if (firstType) {
                firstType.checked = true;
            }
            toggleExpenseTypeFields();
        }, 0);
    });
});

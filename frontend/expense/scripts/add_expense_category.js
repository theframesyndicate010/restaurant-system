document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "office_expense_category_master_list";

    const form = document.getElementById("addExpenseCategoryForm");
    const resetButton = document.getElementById("addExpenseCategoryResetBtn");
    const alertBox = document.getElementById("addExpenseCategoryAlert");
    const titleInput = document.getElementById("expenseCategoryTitle");

    if (!form || !resetButton || !alertBox || !titleInput) {
        return;
    }

    const staticTitles = [
        "Electricity Bill",
        "Internet Charges",
        "Office Supplies",
        "Maintenance",
        "Cleaning Materials"
    ];

    const normalizeText = (value, fallback = "") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const parseStoredCategories = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    };

    const getNextCategoryId = (records) => {
        const maxNo = records.reduce((maxValue, item) => {
            const match = String(item && item.categoryId ? item.categoryId : "").match(/EXP-CAT-(\d+)/i);
            if (!match) {
                return maxValue;
            }

            const current = parseInt(match[1], 10);
            if (!Number.isFinite(current)) {
                return maxValue;
            }

            return Math.max(maxValue, current);
        }, 1005);

        return "EXP-CAT-" + String(maxNo + 1);
    };

    const getNextCode = (records) => {
        const maxNo = records.reduce((maxValue, item) => {
            const match = String(item && item.code ? item.code : "").match(/EX-(\d+)/i);
            if (!match) {
                return maxValue;
            }

            const current = parseInt(match[1], 10);
            if (!Number.isFinite(current)) {
                return maxValue;
            }

            return Math.max(maxValue, current);
        }, 5);

        return "EX-" + String(maxNo + 1).padStart(3, "0");
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

    const validateForm = (storedRows) => {
        const title = normalizeText(titleInput.value);

        if (!title) {
            showAlert("warning", "Please enter expense category title.");
            return null;
        }

        const existsInStatic = staticTitles.some((item) => item.toLowerCase() === title.toLowerCase());
        const existsInStored = storedRows.some((item) => {
            const rowTitle = normalizeText(item && item.title ? item.title : "").toLowerCase();
            return rowTitle === title.toLowerCase();
        });

        if (existsInStatic || existsInStored) {
            showAlert("warning", "Expense category title already exists.");
            return null;
        }

        return {
            title
        };
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideAlert();

        const rows = parseStoredCategories();
        const values = validateForm(rows);
        if (!values) {
            return;
        }

        rows.push({
            categoryId: getNextCategoryId(rows),
            code: getNextCode(rows),
            title: values.title,
            createdBy: "Admin",
            createdAt: new Date().toISOString().slice(0, 10)
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
            showAlert("success", "Expense category saved successfully. Redirecting...");
            setTimeout(() => {
                window.location.href = "expense-category.html";
            }, 800);
        } catch (error) {
            showAlert("danger", "Unable to save expense category in browser storage.");
        }
    });

    resetButton.addEventListener("click", () => {
        hideAlert();
    });
});

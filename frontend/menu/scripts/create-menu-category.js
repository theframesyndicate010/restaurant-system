document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "menu_category_master_list";
    const defaultCategories = [
        { name: "beverage", displayName: "Beverages", position: 1, isVisible: true },
        { name: "main-course", displayName: "Main Course", position: 2, isVisible: true },
        { name: "dessert", displayName: "Dessert", position: 3, isVisible: false },
        { name: "snacks", displayName: "Snacks", position: 4, isVisible: true }
    ];

    const form = document.getElementById("createMenuCategoryForm");
    const nameInput = document.getElementById("menuCategoryName");
    const displayNameInput = document.getElementById("menuCategoryDisplayName");
    const messageEl = document.getElementById("createMenuCategoryMessage");
    const displayTargetInputs = Array.from(document.querySelectorAll('input[name="menuCategoryTarget"]'));

    if (!form || !nameInput || !displayNameInput || !messageEl) return;

    const showMessage = (type, text) => {
        messageEl.className = `alert alert-${type} mb-4`;
        messageEl.textContent = text;
        messageEl.classList.remove("d-none");
    };

    const syncDisplayTargetState = () => {
        displayTargetInputs.forEach((input) => {
            const wrapper = input.closest(".menu-category-target-item");
            if (!wrapper) return;
            wrapper.classList.toggle("is-active", input.checked);
        });
    };

    const toTitleCase = (value) => {
        return String(value)
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const normalizeCategory = (item, index) => {
        if (!item || typeof item !== "object") return null;

        const rawName = typeof item.name === "string" ? item.name.trim() : "";
        if (!rawName) return null;

        const rawDisplay = typeof item.displayName === "string" ? item.displayName.trim() : "";
        const parsedPosition = parseInt(item.position, 10);
        const position = Number.isFinite(parsedPosition) && parsedPosition > 0 ? parsedPosition : index + 1;

        return {
            name: rawName,
            displayName: rawDisplay || toTitleCase(rawName),
            position,
            isVisible: Boolean(item.isVisible)
        };
    };

    const sortCategories = (categories) => {
        categories.sort((a, b) => {
            if (a.position !== b.position) {
                return a.position - b.position;
            }
            return a.displayName.localeCompare(b.displayName);
        });
    };

    const getStoredCategories = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const initial = [...defaultCategories];
                sortCategories(initial);
                return initial;
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                const initial = [...defaultCategories];
                sortCategories(initial);
                return initial;
            }

            const seen = new Set();
            const cleaned = [];

            parsed.forEach((item, index) => {
                const normalized = normalizeCategory(item, index);
                if (!normalized) return;

                const key = normalized.name.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                cleaned.push(normalized);
            });

            if (!cleaned.length) {
                const initial = [...defaultCategories];
                sortCategories(initial);
                return initial;
            }

            sortCategories(cleaned);
            return cleaned;
        } catch (error) {
            const initial = [...defaultCategories];
            sortCategories(initial);
            return initial;
        }
    };

    const saveCategories = (categories) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const categoryName = nameInput.value.trim();
        if (!categoryName) {
            showMessage("danger", "Name is required.");
            nameInput.focus();
            return;
        }

        const selectedTarget = displayTargetInputs.find((item) => item.checked)?.value || "Kitchen";
        const displayName = displayNameInput.value.trim() || selectedTarget;

        const categories = getStoredCategories();
        const exists = categories.some((item) => item.name.toLowerCase() === categoryName.toLowerCase());
        if (exists) {
            showMessage("danger", "This menu category already exists.");
            nameInput.focus();
            return;
        }

        const nextPosition = categories.length
            ? Math.max(...categories.map((item) => item.position || 0)) + 1
            : 1;

        categories.push({
            name: categoryName,
            displayName,
            position: nextPosition,
            isVisible: true,
            displayTarget: selectedTarget
        });

        sortCategories(categories);
        saveCategories(categories);

        showMessage("success", `Menu category \"${categoryName}\" created successfully. Redirecting...`);
        setTimeout(() => {
            window.location.href = "menu-category.html";
        }, 700);
    });

    form.addEventListener("reset", () => {
        messageEl.classList.add("d-none");
        displayNameInput.value = "";
        displayTargetInputs.forEach((item) => {
            item.checked = item.value === "Kitchen";
        });
        syncDisplayTargetState();
        setTimeout(() => nameInput.focus(), 0);
    });

    displayTargetInputs.forEach((item) => {
        item.addEventListener("change", syncDisplayTargetState);
    });

    syncDisplayTargetState();

    nameInput.focus();
});

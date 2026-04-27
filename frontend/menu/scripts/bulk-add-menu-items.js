document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "menu_item_master_list";
    const CATEGORY_STORAGE_KEY = "menu_category_master_list";

    const fallbackFoodCategories = ["Beverages", "Main Course", "Dessert", "Snacks"];

    const defaultItems = [
        {
            name: "Chicken Momo",
            displayName: "Steam Momo",
            shortName: "CMO",
            menuUnit: "Plate",
            menuRate: 320,
            menuCategory: "Kitchen",
            status: "Active"
        },
        {
            name: "Virgin Mojito",
            displayName: "Mint Mojito",
            shortName: "VMJ",
            menuUnit: "Glass",
            menuRate: 280,
            menuCategory: "Bar",
            status: "Active"
        },
        {
            name: "Espresso Shot",
            displayName: "Espresso",
            shortName: "ESP",
            menuUnit: "Cup",
            menuRate: 190,
            menuCategory: "Bar",
            status: "Active"
        },
        {
            name: "Veg Club Sandwich",
            displayName: "Club Sandwich",
            shortName: "VCS",
            menuUnit: "Piece",
            menuRate: 240,
            menuCategory: "Counter",
            status: "Inactive"
        }
    ];

    const categorySelect = document.getElementById("bulkMenuCategory");
    const addRowButton = document.getElementById("bulkMenuAddRowBtn");
    const saveButton = document.getElementById("bulkMenuSaveBtn");
    const body = document.getElementById("bulkMenuItemsBody");
    const rowTemplate = document.getElementById("bulkMenuRowTemplate");
    const messageEl = document.getElementById("bulkMenuMessage");

    if (!categorySelect || !addRowButton || !saveButton || !body || !rowTemplate || !messageEl) return;

    const showMessage = (type, text) => {
        messageEl.className = `alert alert-${type} mt-3 mb-0`;
        messageEl.textContent = text;
        messageEl.classList.remove("d-none");
    };

    const hideMessage = () => {
        messageEl.classList.add("d-none");
        messageEl.textContent = "";
    };

    const toTitleCase = (value) => {
        return String(value)
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const getStoredFoodCategories = () => {
        try {
            const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
            if (!raw) return [...fallbackFoodCategories];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [...fallbackFoodCategories];

            const seen = new Set();
            const categories = [];

            parsed.forEach((item) => {
                if (!item || typeof item !== "object") return;
                if (item.isVisible === false) return;

                const rawName = typeof item.name === "string" ? item.name.trim() : "";
                const rawDisplay = typeof item.displayName === "string" ? item.displayName.trim() : "";
                const isServiceAreaDisplay = /^(kitchen|bar|counter)$/i.test(rawDisplay);

                const categoryLabel = rawDisplay && !isServiceAreaDisplay
                    ? rawDisplay
                    : toTitleCase(rawName || rawDisplay);

                if (!categoryLabel) return;

                const key = categoryLabel.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                categories.push(categoryLabel);
            });

            return categories.length ? categories : [...fallbackFoodCategories];
        } catch (error) {
            return [...fallbackFoodCategories];
        }
    };

    const populateCategoryOptions = () => {
        const selected = categorySelect.value;
        const categories = getStoredFoodCategories();

        categorySelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Select Category --";
        categorySelect.appendChild(defaultOption);

        categories.forEach((categoryName) => {
            const option = document.createElement("option");
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });

        const hasSelected = categories.some((categoryName) => categoryName === selected);
        categorySelect.value = hasSelected ? selected : "";
    };

    const normalizeMenuItem = (item) => {
        if (!item || typeof item !== "object") return null;

        const name = typeof item.name === "string" ? item.name.trim() : "";
        if (!name) return null;

        const displayName = typeof item.displayName === "string" && item.displayName.trim()
            ? item.displayName.trim()
            : toTitleCase(name);

        const shortName = typeof item.shortName === "string" && item.shortName.trim()
            ? item.shortName.trim()
            : name.slice(0, 3).toUpperCase();

        const menuUnit = typeof item.menuUnit === "string" && item.menuUnit.trim()
            ? item.menuUnit.trim()
            : "Plate";

        const parsedRate = parseFloat(item.menuRate);
        const menuRate = Number.isFinite(parsedRate) && parsedRate >= 0 ? parsedRate : 0;

        const menuCategory = typeof item.menuCategory === "string" && item.menuCategory.trim()
            ? item.menuCategory.trim()
            : "Kitchen";

        return {
            name,
            displayName,
            shortName,
            menuUnit,
            menuRate,
            menuCategory,
            status: "Active",
            code: typeof item.code === "string" ? item.code.trim() : ""
        };
    };

    const sortItems = (items) => {
        items.sort((a, b) => a.name.localeCompare(b.name));
    };

    const getStoredItems = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
                sortItems(initial);
                return initial;
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
                sortItems(initial);
                return initial;
            }

            const seen = new Set();
            const cleaned = [];

            parsed.forEach((item) => {
                const normalized = normalizeMenuItem(item);
                if (!normalized) return;

                const key = normalized.name.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                cleaned.push(normalized);
            });

            if (!cleaned.length) {
                const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
                sortItems(initial);
                return initial;
            }

            sortItems(cleaned);
            return cleaned;
        } catch (error) {
            const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
            sortItems(initial);
            return initial;
        }
    };

    const saveItems = (items) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    };

    const updateSerialNumbers = () => {
        Array.from(body.querySelectorAll("tr")).forEach((row, index) => {
            const sn = row.querySelector(".row-sn .sn-badge");
            if (sn) {
                sn.textContent = String(index + 1);
            }
        });
    };

    const attachLastColumnEnter = (row) => {
        const lastColumnInput = row.querySelector(".last-col");
        if (!lastColumnInput) return;

        lastColumnInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                addRow();
            }
        });
    };

    const addRow = () => {
        const row = rowTemplate.content.firstElementChild.cloneNode(true);
        body.appendChild(row);
        updateSerialNumbers();
        attachLastColumnEnter(row);

        const nameInput = row.querySelector('input[name="name"]');
        if (nameInput) nameInput.focus();
    };

    const removeRow = (target) => {
        const row = target.closest("tr");
        if (!row) return;

        if (body.querySelectorAll("tr").length <= 1) {
            showMessage("warning", "At least one row is required.");
            return;
        }

        row.remove();
        updateSerialNumbers();
    };

    const collectRows = () => {
        const selectedCategory = categorySelect.value.trim();
        if (!selectedCategory) {
            showMessage("danger", "Please select a food category.");
            categorySelect.focus();
            return null;
        }

        const rows = Array.from(body.querySelectorAll("tr"));
        const prepared = [];

        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const name = (row.querySelector('input[name="name"]')?.value || "").trim();
            const displayName = (row.querySelector('input[name="display_name"]')?.value || "").trim();
            const code = (row.querySelector('input[name="code"]')?.value || "").trim();
            const rateRaw = (row.querySelector('input[name="rate"]')?.value || "").trim();
            const unit = (row.querySelector('select[name="unit"]')?.value || "").trim();
            const shortName = (row.querySelector('input[name="short_name"]')?.value || "").trim();

            const isEmptyRow = !name && !displayName && !code && !rateRaw && !unit && !shortName;
            if (isEmptyRow) continue;

            if (!name) {
                showMessage("danger", `Row ${i + 1}: Name is required.`);
                row.querySelector('input[name="name"]')?.focus();
                return null;
            }

            const rate = parseFloat(rateRaw);
            if (!Number.isFinite(rate) || rate < 0) {
                showMessage("danger", `Row ${i + 1}: Rate must be a valid non-negative number.`);
                row.querySelector('input[name="rate"]')?.focus();
                return null;
            }

            if (!unit) {
                showMessage("danger", `Row ${i + 1}: Unit is required.`);
                row.querySelector('select[name="unit"]')?.focus();
                return null;
            }

            prepared.push({
                name,
                displayName: displayName || toTitleCase(name),
                code,
                menuRate: rate,
                menuUnit: unit,
                shortName: shortName || name.slice(0, 3).toUpperCase(),
                menuCategory: selectedCategory,
                status: "Active"
            });
        }

        if (!prepared.length) {
            showMessage("warning", "Please fill at least one valid row before saving.");
            return null;
        }

        return prepared;
    };

    const saveAllRows = () => {
        hideMessage();

        const preparedRows = collectRows();
        if (!preparedRows) return;

        const existingItems = getStoredItems();
        const itemMap = new Map(existingItems.map((item) => [item.name.toLowerCase(), item]));

        let createdCount = 0;
        let updatedCount = 0;

        preparedRows.forEach((item) => {
            const normalized = normalizeMenuItem(item);
            if (!normalized) return;

            const key = normalized.name.toLowerCase();
            if (itemMap.has(key)) {
                updatedCount += 1;
            } else {
                createdCount += 1;
            }

            itemMap.set(key, normalized);
        });

        const mergedItems = Array.from(itemMap.values());
        sortItems(mergedItems);
        saveItems(mergedItems);

        showMessage("success", `${preparedRows.length} row(s) saved. ${createdCount} added, ${updatedCount} updated. Redirecting to Menu Items...`);

        setTimeout(() => {
            window.location.href = "menu-items.html";
        }, 850);
    };

    addRowButton.addEventListener("click", () => {
        hideMessage();
        addRow();
    });

    saveButton.addEventListener("click", saveAllRows);

    body.addEventListener("click", (event) => {
        const deleteBtn = event.target.closest(".bulk-row-delete-btn");
        if (!deleteBtn) return;
        removeRow(deleteBtn);
    });

    categorySelect.addEventListener("change", hideMessage);

    populateCategoryOptions();

    // Start with three entry rows.
    addRow();
    addRow();
    addRow();
});

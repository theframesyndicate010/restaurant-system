document.addEventListener("DOMContentLoaded", () => {
    const MENU_ITEM_KEY = "menu_item_master_list";
    const MENU_INGREDIENT_KEY = "menu_ingredient_setup_map";
    const PRODUCT_KEYS = [
        "product_item_master_list",
        "product_items_master_list",
        "stock_item_master_list",
        "product_master_list"
    ];

    const defaultMenuItems = [
        { name: "Chicken Chowmein", displayName: "Chicken Chowmein", menuCategory: "Kitchen" },
        { name: "Chicken Momo", displayName: "Steam Momo", menuCategory: "Kitchen" },
        { name: "Virgin Mojito", displayName: "Mint Mojito", menuCategory: "Bar" }
    ];

    const defaultStockItems = [
        { id: "chicken", name: "chicken", mainUnit: "kilogram", subUnit: "gram", subPerMain: 1000, ratePerMain: 700000 },
        { id: "onion", name: "onion", mainUnit: "kilogram", subUnit: "gram", subPerMain: 1000, ratePerMain: 120000 },
        { id: "capsicum", name: "capsicum", mainUnit: "kilogram", subUnit: "gram", subPerMain: 1000, ratePerMain: 210000 },
        { id: "soy-sauce", name: "soy sauce", mainUnit: "liter", subUnit: "ml", subPerMain: 1000, ratePerMain: 260000 }
    ];

    const menuSelect = document.getElementById("setupMenuItemSelect");
    const addProductButton = document.getElementById("setupAddProductBtn");
    const tableBody = document.getElementById("setupIngredientRows");
    const rowTemplate = document.getElementById("setupIngredientRowTemplate");
    const otherExpensesInput = document.getElementById("setupOtherExpenses");
    const totalCostOutput = document.getElementById("setupTotalCost");
    const saveButton = document.getElementById("setupSaveBtn");
    const messageEl = document.getElementById("setupMessage");

    if (
        !menuSelect ||
        !addProductButton ||
        !tableBody ||
        !rowTemplate ||
        !otherExpensesInput ||
        !totalCostOutput ||
        !saveButton ||
        !messageEl
    ) {
        return;
    }

    let menuItems = [];
    let stockItems = [];
    let setupMap = {};

    const toTitleCase = (value) => {
        return String(value || "")
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const roundTwo = (value) => {
        return Math.round((parseNumber(value) + Number.EPSILON) * 100) / 100;
    };

    const formatMoney = (value) => {
        return roundTwo(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const firstString = (...values) => {
        for (const value of values) {
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
        return "";
    };

    const showMessage = (type, text) => {
        messageEl.className = "alert alert-" + type + " mx-3 mx-md-4 mt-3 mb-0";
        messageEl.textContent = text;
        messageEl.classList.remove("d-none");
    };

    const hideMessage = () => {
        messageEl.classList.add("d-none");
        messageEl.textContent = "";
    };

    const normalizeMenuItem = (item) => {
        if (!item || typeof item !== "object") return null;

        const name = firstString(item.name, item.itemName);
        if (!name) return null;

        const displayName = firstString(item.displayName) || toTitleCase(name);
        const menuCategory = firstString(item.menuCategory) || "Uncategorized";

        return {
            name,
            displayName,
            menuCategory
        };
    };

    const getStoredMenuItems = () => {
        const fallback = defaultMenuItems
            .map((item) => normalizeMenuItem(item))
            .filter(Boolean);

        try {
            const raw = localStorage.getItem(MENU_ITEM_KEY);
            if (!raw) return fallback;

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return fallback;

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

            if (!cleaned.length) return fallback;

            cleaned.sort((a, b) => a.displayName.localeCompare(b.displayName));
            return cleaned;
        } catch (error) {
            return fallback;
        }
    };

    const normalizeStockItem = (item, index) => {
        if (!item || typeof item !== "object") return null;

        const name = firstString(item.name, item.productName, item.displayName, item.itemName);
        if (!name) return null;

        const id = firstString(
            item.id ? String(item.id) : "",
            item.productId ? String(item.productId) : "",
            item.code,
            item.productCode
        ) || ("stock-" + index + "-" + name.toLowerCase().replace(/\s+/g, "-"));

        const mainUnit = firstString(item.mainUnit, item.unit, item.menuUnit, item.baseUnit) || "unit";
        const subUnit = firstString(item.subUnit, item.secondaryUnit, item.childUnit);

        const subPerMain = parseNumber(
            item.subPerMain ??
            item.mainToSub ??
            item.conversionFactor ??
            item.conversion ??
            0
        );

        const ratePerMain = parseNumber(
            item.ratePerMain ??
            item.purchaseRate ??
            item.unitRate ??
            item.cost ??
            item.rate ??
            item.price ??
            0
        );

        return {
            id,
            name,
            mainUnit,
            subUnit: subUnit && subPerMain > 0 ? subUnit : "",
            subPerMain: subUnit && subPerMain > 0 ? subPerMain : 0,
            ratePerMain
        };
    };

    const getStoredStockItems = () => {
        const fallback = defaultStockItems
            .map((item, index) => normalizeStockItem(item, index))
            .filter(Boolean);

        for (const key of PRODUCT_KEYS) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;

                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) continue;

                const seen = new Set();
                const cleaned = [];

                parsed.forEach((item, index) => {
                    const normalized = normalizeStockItem(item, index);
                    if (!normalized) return;

                    const itemKey = normalized.id.toLowerCase();
                    if (seen.has(itemKey)) return;

                    seen.add(itemKey);
                    cleaned.push(normalized);
                });

                if (cleaned.length) {
                    cleaned.sort((a, b) => a.name.localeCompare(b.name));
                    return cleaned;
                }
            } catch (error) {
                continue;
            }
        }

        return fallback;
    };

    const getSetupMap = () => {
        try {
            const raw = localStorage.getItem(MENU_INGREDIENT_KEY);
            if (!raw) return {};

            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            return {};
        }
    };

    const saveSetupMap = (map) => {
        localStorage.setItem(MENU_INGREDIENT_KEY, JSON.stringify(map));
    };

    const getStockById = (id) => {
        return stockItems.find((item) => item.id === id) || null;
    };

    const getStockByName = (name) => {
        const needle = String(name || "").trim().toLowerCase();
        if (!needle) return null;

        const exact = stockItems.find((item) => item.name.toLowerCase() === needle);
        if (exact) return exact;

        return stockItems.find((item) => item.name.toLowerCase().includes(needle)) || null;
    };

    const setStockOptions = (selectEl, selectedId) => {
        selectEl.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select Stock Item";
        selectEl.appendChild(placeholder);

        stockItems.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = toTitleCase(item.name);
            selectEl.appendChild(option);
        });

        const hasSelected = stockItems.some((item) => item.id === selectedId);
        if (hasSelected) {
            selectEl.value = selectedId;
            return;
        }

        if (stockItems.length) {
            selectEl.value = stockItems[0].id;
        }
    };

    const updateTotals = () => {
        const ingredientCost = Array.from(tableBody.querySelectorAll("tr")).reduce((sum, row) => {
            return sum + parseNumber(row.getAttribute("data-line-cost") || "0");
        }, 0);

        const otherExpenses = parseNumber(otherExpensesInput.value);
        const totalCost = roundTwo(ingredientCost + otherExpenses);
        totalCostOutput.textContent = formatMoney(totalCost);
    };

    const updateRowCost = (rowEl) => {
        const stockSelect = rowEl.querySelector(".setup-stock-select");
        const mainQtyInput = rowEl.querySelector(".setup-main-qty");
        const subQtyInput = rowEl.querySelector(".setup-sub-qty");
        const mainUnitBadge = rowEl.querySelector(".setup-main-unit");
        const subUnitBadge = rowEl.querySelector(".setup-sub-unit");
        const lineCostEl = rowEl.querySelector(".setup-line-cost");

        if (!stockSelect || !mainQtyInput || !subQtyInput || !mainUnitBadge || !subUnitBadge || !lineCostEl) {
            return;
        }

        const stockItem = getStockById(stockSelect.value);
        if (!stockItem) {
            mainUnitBadge.textContent = "-";
            subUnitBadge.textContent = "-";
            subQtyInput.disabled = true;
            subQtyInput.value = "0";
            lineCostEl.textContent = formatMoney(0);
            rowEl.setAttribute("data-line-cost", "0");
            updateTotals();
            return;
        }

        const mainQty = parseNumber(mainQtyInput.value);
        const hasSubUnit = stockItem.subUnit && stockItem.subPerMain > 0;

        let subQty = parseNumber(subQtyInput.value);
        if (!hasSubUnit) {
            subQty = 0;
            subQtyInput.value = "0";
            subQtyInput.disabled = true;
            subUnitBadge.textContent = stockItem.mainUnit;
        } else {
            subQtyInput.disabled = false;
            subUnitBadge.textContent = stockItem.subUnit;
        }

        mainUnitBadge.textContent = stockItem.mainUnit;

        const mainEquivalent = hasSubUnit
            ? mainQty + (subQty / stockItem.subPerMain)
            : mainQty;

        const lineCost = roundTwo(mainEquivalent * stockItem.ratePerMain);
        lineCostEl.textContent = formatMoney(lineCost);
        rowEl.setAttribute("data-line-cost", String(lineCost));

        updateTotals();
    };

    const addIngredientRow = (seed = {}) => {
        const rowEl = rowTemplate.content.firstElementChild.cloneNode(true);
        tableBody.appendChild(rowEl);

        const stockSelect = rowEl.querySelector(".setup-stock-select");
        const mainQtyInput = rowEl.querySelector(".setup-main-qty");
        const subQtyInput = rowEl.querySelector(".setup-sub-qty");
        const removeButton = rowEl.querySelector(".setup-remove-row");

        if (!stockSelect || !mainQtyInput || !subQtyInput || !removeButton) {
            updateTotals();
            return;
        }

        const selectedById = firstString(seed.stockItemId, seed.stockId, seed.itemId);
        const selectedByName = firstString(seed.stockItemName, seed.itemName);

        let selectedStock = getStockById(selectedById);
        if (!selectedStock && selectedByName) {
            selectedStock = getStockByName(selectedByName);
        }

        setStockOptions(stockSelect, selectedStock ? selectedStock.id : "");
        mainQtyInput.value = String(parseNumber(seed.mainQty ?? seed.mainQuantity ?? 0));
        subQtyInput.value = String(parseNumber(seed.subQty ?? seed.subQuantity ?? 0));

        stockSelect.addEventListener("change", () => updateRowCost(rowEl));
        mainQtyInput.addEventListener("input", () => updateRowCost(rowEl));
        subQtyInput.addEventListener("input", () => updateRowCost(rowEl));
        subQtyInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                addIngredientRow({ mainQty: 0, subQty: 0 });
            }
        });

        removeButton.addEventListener("click", () => {
            const rowCount = tableBody.querySelectorAll("tr").length;
            if (rowCount <= 1) {
                showMessage("warning", "At least one ingredient row is required.");
                return;
            }

            rowEl.remove();
            updateTotals();
        });

        updateRowCost(rowEl);
    };

    const getLegacyRows = (setup) => {
        if (!setup) return [];

        if (Array.isArray(setup.rows)) return setup.rows;
        if (Array.isArray(setup.items)) return setup.items;

        if (Array.isArray(setup.ingredients)) {
            return setup.ingredients.map((entry) => {
                if (typeof entry === "string") {
                    return { stockItemName: entry, mainQty: 0, subQty: 0 };
                }
                return entry;
            });
        }

        if (typeof setup.ingredients === "string") {
            return setup.ingredients
                .split(",")
                .map((name) => name.trim())
                .filter(Boolean)
                .map((name) => ({ stockItemName: name, mainQty: 0, subQty: 0 }));
        }

        return [];
    };

    const loadSetupForMenu = (menuName) => {
        tableBody.innerHTML = "";

        const key = String(menuName || "").trim().toLowerCase();
        const setup = key ? setupMap[key] : null;
        const rows = getLegacyRows(setup);

        if (rows.length) {
            rows.forEach((row) => addIngredientRow(row));
        } else {
            addIngredientRow({ mainQty: 0, subQty: 0 });
        }

        otherExpensesInput.value = String(parseNumber(setup?.otherExpenses ?? 0));
        updateTotals();
    };

    const collectRows = () => {
        return Array.from(tableBody.querySelectorAll("tr"))
            .map((rowEl) => {
                const stockSelect = rowEl.querySelector(".setup-stock-select");
                const mainQtyInput = rowEl.querySelector(".setup-main-qty");
                const subQtyInput = rowEl.querySelector(".setup-sub-qty");

                if (!stockSelect || !mainQtyInput || !subQtyInput) return null;

                const stockItem = getStockById(stockSelect.value);
                if (!stockItem) return null;

                const mainQty = parseNumber(mainQtyInput.value);
                const subQty = subQtyInput.disabled ? 0 : parseNumber(subQtyInput.value);
                const mainEquivalent = stockItem.subPerMain > 0
                    ? mainQty + (subQty / stockItem.subPerMain)
                    : mainQty;

                const lineCost = roundTwo(mainEquivalent * stockItem.ratePerMain);

                return {
                    stockItemId: stockItem.id,
                    stockItemName: stockItem.name,
                    mainQty,
                    subQty,
                    mainUnit: stockItem.mainUnit,
                    subUnit: stockItem.subUnit,
                    subPerMain: stockItem.subPerMain,
                    ratePerMain: stockItem.ratePerMain,
                    lineCost
                };
            })
            .filter(Boolean);
    };

    const saveSetup = () => {
        hideMessage();

        const menuName = menuSelect.value.trim();
        if (!menuName) {
            showMessage("warning", "Please select a menu item before saving.");
            menuSelect.focus();
            return;
        }

        const rows = collectRows();
        if (!rows.length) {
            showMessage("warning", "Please add at least one stock item row.");
            return;
        }

        const hasQty = rows.some((row) => row.mainQty > 0 || row.subQty > 0);
        if (!hasQty) {
            showMessage("warning", "Please enter quantity for at least one stock item.");
            return;
        }

        const ingredientCost = roundTwo(rows.reduce((sum, row) => sum + row.lineCost, 0));
        const otherExpenses = roundTwo(parseNumber(otherExpensesInput.value));
        const totalCost = roundTwo(ingredientCost + otherExpenses);

        const selectedMenu = menuItems.find((item) => item.name === menuName);
        const key = menuName.toLowerCase();

        setupMap[key] = {
            menuItemName: menuName,
            menuItemDisplayName: selectedMenu ? selectedMenu.displayName : menuName,
            rows,
            ingredients: rows.map((row) => toTitleCase(row.stockItemName)).join(", "),
            ingredientCost,
            otherExpenses,
            totalCost,
            updatedAt: new Date().toISOString()
        };

        saveSetupMap(setupMap);
        totalCostOutput.textContent = formatMoney(totalCost);
        showMessage("success", "Menu ingredient setup saved successfully.");
    };

    const populateMenuSelect = () => {
        menuSelect.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "-- Select Menu Item --";
        menuSelect.appendChild(placeholder);

        menuItems.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.name;
            option.textContent = item.displayName;
            menuSelect.appendChild(option);
        });
    };

    const menuFromQuery = () => {
        const params = new URLSearchParams(window.location.search);
        const queryValue = firstString(params.get("item"), params.get("menu"));
        if (!queryValue) return "";

        const needle = queryValue.toLowerCase();
        const matched = menuItems.find((item) => {
            return item.name.toLowerCase() === needle || item.displayName.toLowerCase() === needle;
        });

        return matched ? matched.name : "";
    };

    const init = () => {
        menuItems = getStoredMenuItems();
        stockItems = getStoredStockItems();
        setupMap = getSetupMap();

        populateMenuSelect();

        const initialFromQuery = menuFromQuery();
        const defaultMenuName = menuItems.length ? menuItems[0].name : "";
        const initialMenuName = initialFromQuery || defaultMenuName;

        if (initialMenuName) {
            menuSelect.value = initialMenuName;
        }

        loadSetupForMenu(menuSelect.value);

        menuSelect.addEventListener("change", () => {
            hideMessage();
            loadSetupForMenu(menuSelect.value);
        });

        addProductButton.addEventListener("click", () => {
            hideMessage();
            addIngredientRow({ mainQty: 0, subQty: 0 });

            const lastRow = tableBody.lastElementChild;
            const focusTarget = lastRow ? lastRow.querySelector(".setup-stock-select") : null;
            if (focusTarget) {
                focusTarget.focus();
            }
        });

        otherExpensesInput.addEventListener("input", updateTotals);
        saveButton.addEventListener("click", saveSetup);
    };

    init();
});

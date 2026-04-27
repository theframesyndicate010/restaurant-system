document.addEventListener("datatableLoaded", () => {
    const MENU_ITEM_KEY = "menu_item_master_list";
    const MENU_CATEGORY_KEY = "menu_category_master_list";
    const MENU_INGREDIENT_KEY = "menu_ingredient_setup_map";

    const categoryFilter = document.getElementById("menuCostCategoryFilter");
    const searchInput = document.getElementById("menuCostSearchInput");
    const pageLengthSelect = document.getElementById("menuCostPageLength");
    const refreshButton = document.getElementById("menuCostRefreshBtn");
    const tableElement = $(".menu-cost-table");
    const snTemplate = document.getElementById("menuCostSnTemplate");
    const itemTemplate = document.getElementById("menuCostItemTemplate");
    const amountTemplate = document.getElementById("menuCostAmountTemplate");
    const actionTemplate = document.getElementById("menuCostActionTemplate");

    if (!categoryFilter || !searchInput || !pageLengthSelect || !refreshButton || !tableElement.length ||
        !snTemplate || !itemTemplate || !amountTemplate || !actionTemplate) {
        return;
    }

    let allRows = [];
    let tableApi = null;

    const defaultItems = [
        { name: "Chicken Chowmein", displayName: "Chicken Chowmein", menuCategory: "Kitchen" },
        { name: "Chicken Momo", displayName: "Steam Momo", menuCategory: "Kitchen" },
        { name: "Virgin Mojito", displayName: "Mint Mojito", menuCategory: "Bar" },
        { name: "Espresso Shot", displayName: "Espresso", menuCategory: "Bar" }
    ];

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const toTitleCase = (value) => {
        return String(value || "")
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const formatMoney = (value) => {
        return parseNumber(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const renderTemplateHtml = (templateElement, bindFn) => {
        const fragment = templateElement.content.cloneNode(true);
        if (typeof bindFn === "function") {
            bindFn(fragment);
        }

        const container = document.createElement("div");
        container.appendChild(fragment);
        return container.innerHTML;
    };

    const normalizeMenuItem = (item) => {
        if (!item || typeof item !== "object") return null;

        const name = typeof item.name === "string" ? item.name.trim() : "";
        if (!name) return null;

        const displayName = typeof item.displayName === "string" && item.displayName.trim()
            ? item.displayName.trim()
            : toTitleCase(name);

        const menuCategory = typeof item.menuCategory === "string" && item.menuCategory.trim()
            ? item.menuCategory.trim()
            : "Uncategorized";

        return {
            name,
            displayName,
            menuCategory
        };
    };

    const getStoredMenuItems = () => {
        const fallback = defaultItems
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

    const computeTotalCost = (setup) => {
        if (!setup || typeof setup !== "object") return 0;

        const explicitTotal = parseNumber(setup.totalCost);
        if (explicitTotal > 0) return explicitTotal;

        const rows = Array.isArray(setup.rows)
            ? setup.rows
            : Array.isArray(setup.items)
                ? setup.items
                : [];

        const rowTotal = rows.reduce((sum, row) => {
            if (!row || typeof row !== "object") return sum;

            const lineCost = parseNumber(row.lineCost);
            if (lineCost > 0) return sum + lineCost;

            const mainQty = parseNumber(row.mainQty);
            const subQty = parseNumber(row.subQty);
            const subPerMain = parseNumber(row.subPerMain);
            const ratePerMain = parseNumber(row.ratePerMain);

            if (ratePerMain <= 0) return sum;

            const mainEquivalent = subPerMain > 0
                ? mainQty + (subQty / subPerMain)
                : mainQty;

            return sum + (mainEquivalent * ratePerMain);
        }, 0);

        return rowTotal + parseNumber(setup.otherExpenses);
    };

    const getStoredCategories = (rows) => {
        const categorySet = new Set(rows.map((item) => item.menuCategory));

        try {
            const raw = localStorage.getItem(MENU_CATEGORY_KEY);
            if (!raw) return Array.from(categorySet).sort((a, b) => a.localeCompare(b));

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return Array.from(categorySet).sort((a, b) => a.localeCompare(b));

            parsed.forEach((item) => {
                if (!item || typeof item !== "object") return;
                if (item.isVisible === false) return;

                const display = typeof item.displayName === "string" ? item.displayName.trim() : "";
                const name = typeof item.name === "string" ? item.name.trim() : "";
                const label = display || toTitleCase(name);
                if (label) categorySet.add(label);
            });

            return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
        } catch (error) {
            return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
        }
    };

    const buildRows = () => {
        const menuItems = getStoredMenuItems();
        const setupMap = getSetupMap();

        const rowsFromMenu = menuItems.map((item) => {
            const key = item.name.toLowerCase();
            const setup = setupMap[key] || null;

            return {
                name: item.name,
                displayName: item.displayName,
                menuCategory: item.menuCategory,
                totalCost: computeTotalCost(setup),
                hasSetup: Boolean(setup)
            };
        });

        const knownKeys = new Set(rowsFromMenu.map((row) => row.name.toLowerCase()));

        Object.keys(setupMap).forEach((key) => {
            if (knownKeys.has(key)) return;

            const setup = setupMap[key];
            rowsFromMenu.push({
                name: key,
                displayName: setup && typeof setup.menuItemDisplayName === "string" && setup.menuItemDisplayName.trim()
                    ? setup.menuItemDisplayName.trim()
                    : toTitleCase(key),
                menuCategory: "Uncategorized",
                totalCost: computeTotalCost(setup),
                hasSetup: true
            });
        });

        rowsFromMenu.sort((a, b) => a.displayName.localeCompare(b.displayName));
        return rowsFromMenu;
    };

    const populateCategoryFilter = () => {
        const previous = categoryFilter.value;
        const categories = getStoredCategories(allRows);

        categoryFilter.textContent = "";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "--Select Category--";
        categoryFilter.appendChild(defaultOption);

        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        categoryFilter.value = categories.includes(previous) ? previous : "";
    };

    const getFilteredRows = () => {
        const selectedCategory = categoryFilter.value.trim().toLowerCase();
        const keyword = searchInput.value.trim().toLowerCase();

        return allRows.filter((row) => {
            if (selectedCategory && row.menuCategory.toLowerCase() !== selectedCategory) {
                return false;
            }

            if (keyword) {
                const haystack = (row.displayName + " " + row.name + " " + row.menuCategory).toLowerCase();
                if (!haystack.includes(keyword)) {
                    return false;
                }
            }

            return true;
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const snNode = fragment.querySelector(".menu-cost-sn");
                if (snNode) snNode.textContent = "0";
            }),
            renderTemplateHtml(itemTemplate, (fragment) => {
                const nameNode = fragment.querySelector(".menu-cost-item-name");
                const categoryNode = fragment.querySelector(".menu-cost-item-category");
                if (nameNode) nameNode.textContent = row.displayName;
                if (categoryNode) categoryNode.textContent = row.menuCategory;
            }),
            renderTemplateHtml(amountTemplate, (fragment) => {
                const amountNode = fragment.querySelector(".menu-cost-amount");
                if (amountNode) amountNode.textContent = "Rs. " + formatMoney(row.totalCost);
            }),
            renderTemplateHtml(actionTemplate, (fragment) => {
                const viewButton = fragment.querySelector(".menu-cost-view-btn");
                if (!viewButton) return;

                viewButton.setAttribute("data-menu-display", row.displayName);
                viewButton.setAttribute("data-menu-category", row.menuCategory);
                viewButton.setAttribute("data-menu-cost", formatMoney(row.totalCost));
                viewButton.setAttribute("data-has-setup", row.hasSetup ? "true" : "false");
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;
            if (firstCell) {
                const snNode = firstCell.querySelector(".menu-cost-sn");
                if (snNode) {
                    snNode.textContent = String(rowIdx + 1);
                }
            }
        });
    };

    const renderRows = () => {
        const filteredRows = getFilteredRows();
        const dataRows = filteredRows.map((row) => buildDataTableRow(row));

        tableApi.clear();
        if (dataRows.length) {
            tableApi.rows.add(dataRows);
        }

        tableApi.draw(false);
        renumberRows();
    };

    const resetFilters = () => {
        categoryFilter.value = "";
        searchInput.value = "";
        pageLengthSelect.value = "50";

        tableApi.search("");
        tableApi.columns().search("");
        tableApi.page.len(50);

        renderRows();
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        tableApi = tableElement.DataTable();
        tableApi.search("");
        tableApi.columns().search("");
        tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
        tableApi.order([1, "asc"]).draw(false);

        allRows = buildRows();
        populateCategoryFilter();
        renderRows();

        categoryFilter.addEventListener("change", renderRows);
        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        tableElement.on("click", ".menu-cost-view-btn", function () {
            const displayName = this.getAttribute("data-menu-display") || "-";
            const category = this.getAttribute("data-menu-category") || "-";
            const cost = this.getAttribute("data-menu-cost") || "0.00";
            const hasSetup = this.getAttribute("data-has-setup") === "true";

            alert(
                "Menu Item: " + displayName +
                "\nCategory: " + category +
                "\nCost: Rs. " + cost +
                "\nSetup Status: " + (hasSetup ? "Configured" : "Not Setup")
            );
        });

        tableApi.on("draw", () => {
            renumberRows();
        });
    };

    waitForDataTable();
});

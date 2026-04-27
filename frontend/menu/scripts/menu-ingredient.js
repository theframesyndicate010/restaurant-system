document.addEventListener("datatableLoaded", () => {
    const MENU_ITEM_KEY = "menu_item_master_list";
    const MENU_CATEGORY_KEY = "menu_category_master_list";
    const MENU_INGREDIENT_KEY = "menu_ingredient_setup_map";

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

    const tableElement = $(".menu-ingredient-table");
    if (!tableElement.length) return;

    const setupButton = document.getElementById("menuIngredientSetupBtn");
    const categoryFilter = document.getElementById("menuIngredientCategory");
    const searchInput = document.getElementById("menuIngredientSearch");
    const pageLengthSelect = document.getElementById("menuIngredientPageLength");
    const refreshButton = document.getElementById("menuIngredientRefresh");
    const snTemplate = document.getElementById("menuIngredientSnTemplate");
    const displayTemplate = document.getElementById("menuIngredientDisplayTemplate");
    const setupActionTemplate = document.getElementById("menuIngredientSetupActionTemplate");

    if (!snTemplate || !displayTemplate || !setupActionTemplate) return;

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const toTitleCase = (value) => {
        return String(value)
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
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
        try {
            const raw = localStorage.getItem(MENU_ITEM_KEY);
            if (!raw) return defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);

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

            return cleaned.length
                ? cleaned
                : defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
        } catch (error) {
            return defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
        }
    };

    const getIngredientMap = () => {
        try {
            const raw = localStorage.getItem(MENU_INGREDIENT_KEY);
            if (!raw) return {};

            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            return {};
        }
    };

    const saveIngredientMap = (map) => {
        localStorage.setItem(MENU_INGREDIENT_KEY, JSON.stringify(map));
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

    const redirectToSetupPage = (itemName) => {
        const normalized = String(itemName || "").trim();
        const targetUrl = normalized
            ? "menu-ingredient-setup.html?item=" + encodeURIComponent(normalized)
            : "menu-ingredient-setup.html";

        window.location.href = targetUrl;
    };

    const getStoredCategories = () => {
        try {
            const raw = localStorage.getItem(MENU_CATEGORY_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            const categories = [];
            parsed.forEach((item) => {
                if (!item || typeof item !== "object") return;
                if (item.isVisible === false) return;

                const rawDisplay = typeof item.displayName === "string" ? item.displayName.trim() : "";
                const rawName = typeof item.name === "string" ? item.name.trim() : "";

                const label = rawDisplay || toTitleCase(rawName);
                if (label) categories.push(label);
            });

            return categories;
        } catch (error) {
            return [];
        }
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        const tableApi = tableElement.DataTable();

        let menuItems = [];
        let ingredientMap = {};

        const normalizeIngredientText = (value) => {
            return String(value || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
                .join(", ");
        };

        const renumberRows = () => {
            tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
                const node = this.node();
                const firstCell = node ? node.querySelector("td") : null;
                if (firstCell) {
                    const snNode = firstCell.querySelector(".sn-badge");
                    if (snNode) {
                        snNode.textContent = String(rowIdx + 1);
                    }
                }
            });
        };

        const populateCategoryFilter = () => {
            if (!categoryFilter) return;

            const previous = categoryFilter.value;
            const categorySet = new Set();

            getStoredCategories().forEach((category) => categorySet.add(category));
            menuItems.forEach((item) => {
                if (item.menuCategory) categorySet.add(item.menuCategory);
            });

            const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

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

        const buildRow = (item) => {
            const key = item.name.toLowerCase();
            const setupInfo = ingredientMap[key];
            const hasSetup = Boolean(setupInfo && normalizeIngredientText(setupInfo.ingredients));

            const buttonClass = hasSetup ? "btn-outline-primary" : "btn-outline-success";
            const buttonLabel = hasSetup ? "Edit Setup" : "Setup";

            return [
                renderTemplateHtml(snTemplate, (fragment) => {
                    const snNode = fragment.querySelector(".sn-badge");
                    if (snNode) snNode.textContent = "0";
                }),
                renderTemplateHtml(displayTemplate, (fragment) => {
                    const displayNode = fragment.querySelector(".fw-medium");
                    const categoryNode = fragment.querySelector(".ingredient-category");
                    if (displayNode) displayNode.textContent = item.displayName;
                    if (categoryNode) categoryNode.textContent = item.menuCategory;
                }),
                renderTemplateHtml(setupActionTemplate, (fragment) => {
                    const buttonNode = fragment.querySelector(".setup-row");
                    const labelNode = fragment.querySelector(".setup-label");
                    if (!buttonNode || !labelNode) return;

                    buttonNode.classList.add(buttonClass);
                    buttonNode.setAttribute("data-item-name", item.name);
                    labelNode.textContent = buttonLabel;
                })
            ];
        };

        const renderRows = () => {
            const rows = menuItems.map((item) => buildRow(item));
            tableApi.clear();
            tableApi.rows.add(rows).draw(false);
            renumberRows();
        };

        const seedData = () => {
            menuItems = getStoredMenuItems();
            ingredientMap = getIngredientMap();

            menuItems.sort((a, b) => a.displayName.localeCompare(b.displayName));
            populateCategoryFilter();
            renderRows();
        };

        const tableCategoryFilter = (settings, data, dataIndex) => {
            if (settings.nTable !== tableElement[0]) return true;

            const selectedCategory = categoryFilter ? categoryFilter.value.trim().toLowerCase() : "";
            if (!selectedCategory) return true;

            const rowNode = tableApi.row(dataIndex).node();
            if (!rowNode) return true;

            const categoryText = rowNode.querySelector(".ingredient-category")?.textContent.trim().toLowerCase() || "";
            return categoryText === selectedCategory;
        };

        $.fn.dataTable.ext.search.push(tableCategoryFilter);

        seedData();

        if (pageLengthSelect) {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
        }

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                tableApi.search(searchInput.value).draw();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener("change", () => {
                tableApi.draw();
            });
        }

        if (pageLengthSelect) {
            pageLengthSelect.addEventListener("change", () => {
                tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                if (categoryFilter) categoryFilter.value = "";
                if (searchInput) searchInput.value = "";
                if (pageLengthSelect) pageLengthSelect.value = "50";

                tableApi.search("");
                tableApi.page.len(50).draw();
                renumberRows();
            });
        }

        if (setupButton) {
            setupButton.addEventListener("click", () => {
                const visibleRows = tableApi.rows({ search: "applied" }).nodes().toArray();
                if (!visibleRows.length) {
                    alert("No menu item found for setup.");
                    return;
                }

                if (visibleRows.length === 1) {
                    const itemName = visibleRows[0].querySelector(".setup-row")?.getAttribute("data-item-name") || "";
                    redirectToSetupPage(itemName);
                    return;
                }

                redirectToSetupPage("");
            });
        }

        tableElement.on("click", ".setup-row", function () {
            const itemName = this.getAttribute("data-item-name") || "";
            redirectToSetupPage(itemName);
        });

        tableApi.on("draw", renumberRows);
        renumberRows();
    };

    waitForDataTable();
});

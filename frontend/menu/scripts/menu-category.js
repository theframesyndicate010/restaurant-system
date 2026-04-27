document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "menu_category_master_list";
    const defaultCategories = [
        { name: "beverage", displayName: "Beverages", position: 1, isVisible: true },
        { name: "main-course", displayName: "Main Course", position: 2, isVisible: true },
        { name: "dessert", displayName: "Dessert", position: 3, isVisible: false },
        { name: "snacks", displayName: "Snacks", position: 4, isVisible: true }
    ];

    const tableElement = $(".menu-category-table");
    if (!tableElement.length) return;

    const searchInput = document.getElementById("menuCategorySearch");
    const pageLengthSelect = document.getElementById("menuCategoryPageLength");
    const refreshButton = document.getElementById("menuCategoryRefresh");
    const snTemplate = document.getElementById("menuCategorySnTemplate");
    const nameTemplate = document.getElementById("menuCategoryNameTemplate");
    const displayNameTemplate = document.getElementById("menuCategoryDisplayNameTemplate");
    const positionTemplate = document.getElementById("menuCategoryPositionTemplate");
    const visibilityTemplate = document.getElementById("menuCategoryVisibilityTemplate");
    const actionsTemplate = document.getElementById("menuCategoryActionsTemplate");

    if (!snTemplate || !nameTemplate || !displayNameTemplate || !positionTemplate || !visibilityTemplate || !actionsTemplate) {
        return;
    }

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

    const renderTemplateHtml = (templateElement, bindFn) => {
        const fragment = templateElement.content.cloneNode(true);
        if (typeof bindFn === "function") {
            bindFn(fragment);
        }

        const container = document.createElement("div");
        container.appendChild(fragment);
        return container.innerHTML;
    };

    const visibilityBadgeHtml = (isVisible) => {
        return renderTemplateHtml(visibilityTemplate, (fragment) => {
            const badgeNode = fragment.querySelector(".menu-visibility-badge");
            if (!badgeNode) return;

            badgeNode.classList.add(isVisible ? "is-visible" : "is-hidden");
            badgeNode.textContent = isVisible ? "Visible" : "Hidden";
        });
    };

    const actionButtonsHtml = () => {
        return renderTemplateHtml(actionsTemplate);
    };

    const buildRow = (category) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const snNode = fragment.querySelector(".sn-badge");
                if (snNode) snNode.textContent = "0";
            }),
            renderTemplateHtml(nameTemplate, (fragment) => {
                const nameNode = fragment.querySelector(".fw-medium");
                if (nameNode) nameNode.textContent = category.name;
            }),
            renderTemplateHtml(displayNameTemplate, (fragment) => {
                const displayNode = fragment.querySelector(".fw-medium");
                if (displayNode) displayNode.textContent = category.displayName;
            }),
            renderTemplateHtml(positionTemplate, (fragment) => {
                const posNode = fragment.querySelector(".fw-semibold");
                if (posNode) posNode.textContent = String(category.position);
            }),
            visibilityBadgeHtml(category.isVisible),
            actionButtonsHtml()
        ];
    };

    const cellText = (value) => {
        const container = document.createElement("div");
        container.innerHTML = String(value || "");
        return (container.textContent || "").trim();
    };

    const rowToCategory = (rowData, indexHint) => {
        const name = cellText(rowData[1]);
        const displayName = cellText(rowData[2]);
        const parsedPosition = parseInt(cellText(rowData[3]), 10);
        const position = Number.isFinite(parsedPosition) && parsedPosition > 0 ? parsedPosition : indexHint + 1;
        const visibilityText = cellText(rowData[4]).toLowerCase();

        return {
            name,
            displayName,
            position,
            isVisible: visibilityText === "visible"
        };
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        const tableApi = tableElement.DataTable();

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

        const getCategoriesFromTable = () => {
            const categories = [];
            tableApi.rows().data().toArray().forEach((rowItem, index) => {
                const converted = rowToCategory(rowItem, index);
                if (converted.name) {
                    categories.push(converted);
                }
            });
            sortCategories(categories);
            return categories;
        };

        const renderCategories = (categories) => {
            tableApi.clear();
            tableApi.rows.add(categories.map((category) => buildRow(category))).draw(false);
            renumberRows();
        };

        const seedData = () => {
            const categories = getStoredCategories();
            renderCategories(categories);
            saveCategories(categories);
        };

        seedData();

        if (pageLengthSelect) {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
        }

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                tableApi.search(searchInput.value).draw();
            });
        }

        if (pageLengthSelect) {
            pageLengthSelect.addEventListener("change", () => {
                tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                if (searchInput) searchInput.value = "";
                if (pageLengthSelect) pageLengthSelect.value = "50";
                tableApi.search("");
                tableApi.page.len(50).draw();
                renumberRows();
            });
        }

        tableElement.on("click", ".view-row", function () {
            const rowNode = $(this).closest("tr")[0];
            if (!rowNode) return;

            const name = rowNode.querySelector("td:nth-child(2)")?.textContent.trim() || "";
            const displayName = rowNode.querySelector("td:nth-child(3)")?.textContent.trim() || "";
            const position = rowNode.querySelector("td:nth-child(4)")?.textContent.trim() || "";
            const visibility = rowNode.querySelector("td:nth-child(5)")?.textContent.trim() || "";

            alert("Name: " + name + "\nDisplay Name: " + displayName + "\nPosition: " + position + "\nMenu Visibility: " + visibility);
        });

        tableElement.on("click", ".edit-row", function () {
            const row = tableApi.row($(this).closest("tr"));
            const rowData = row.data();
            if (!rowData) return;

            const current = rowToCategory(rowData, 0);

            const updatedNameRaw = window.prompt("Edit category name", current.name);
            if (updatedNameRaw === null) return;
            const updatedName = updatedNameRaw.trim();
            if (!updatedName) {
                alert("Category name is required.");
                return;
            }

            const updatedDisplayRaw = window.prompt("Edit display name", current.displayName);
            if (updatedDisplayRaw === null) return;
            const updatedDisplayName = updatedDisplayRaw.trim() || toTitleCase(updatedName);

            const updatedPositionRaw = window.prompt("Edit position", String(current.position));
            if (updatedPositionRaw === null) return;
            const updatedPosition = parseInt(updatedPositionRaw, 10);
            if (!Number.isFinite(updatedPosition) || updatedPosition <= 0) {
                alert("Position must be a positive number.");
                return;
            }

            const updatedVisibilityRaw = window.prompt("Menu visibility (Visible/Hidden)", current.isVisible ? "Visible" : "Hidden");
            if (updatedVisibilityRaw === null) return;
            const updatedVisible = !/^(hidden|hide|no|n|false|0)$/i.test(updatedVisibilityRaw.trim());

            const allCategories = getCategoriesFromTable();
            const duplicate = allCategories.some((item) => {
                return item.name.toLowerCase() === updatedName.toLowerCase() && item.name.toLowerCase() !== current.name.toLowerCase();
            });

            if (duplicate) {
                alert("Another category already has this name.");
                return;
            }

            row.data(buildRow({
                name: updatedName,
                displayName: updatedDisplayName,
                position: updatedPosition,
                isVisible: updatedVisible
            })).draw(false);

            const updatedList = getCategoriesFromTable();
            renderCategories(updatedList);
            saveCategories(updatedList);
        });

        tableElement.on("click", ".delete-row", function () {
            const row = tableApi.row($(this).closest("tr"));
            const rowData = row.data();
            if (!rowData) return;

            const name = cellText(rowData[1]);
            const confirmed = window.confirm("Delete menu category \"" + name + "\"?");
            if (!confirmed) return;

            row.remove().draw(false);
            renumberRows();
            saveCategories(getCategoriesFromTable());
        });

        tableApi.on("draw", renumberRows);
        renumberRows();
    };

    waitForDataTable();
});

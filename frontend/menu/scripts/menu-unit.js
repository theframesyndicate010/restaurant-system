document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "menu_unit_master_list";
    const defaultUnits = ["Bottle", "Piece", "Kg", "Liter", "Milliliter"];

    const tableElement = $(".menu-unit-table");
    if (!tableElement.length) return;

    const searchInput = document.getElementById("menuUnitSearch");
    const pageLengthSelect = document.getElementById("menuUnitPageLength");
    const refreshButton = document.getElementById("menuUnitRefresh");
    const snTemplate = document.getElementById("menuUnitSnTemplate");
    const nameTemplate = document.getElementById("menuUnitNameTemplate");
    const actionsTemplate = document.getElementById("menuUnitActionsTemplate");

    if (!snTemplate || !nameTemplate || !actionsTemplate) {
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

    const getStoredUnits = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [...defaultUnits];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [...defaultUnits];

            const seen = new Set();
            const cleaned = [];

            parsed.forEach((item) => {
                if (typeof item !== "string") return;
                const trimmed = item.trim();
                if (!trimmed) return;

                const key = trimmed.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                cleaned.push(trimmed);
            });

            return cleaned.length ? cleaned : [...defaultUnits];
        } catch (error) {
            return [...defaultUnits];
        }
    };

    const saveUnits = (units) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
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

    const actionButtonsHtml = () => {
        return renderTemplateHtml(actionsTemplate);
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

        const getUnitsFromTable = () => {
            const units = [];
            tableApi.rows().data().toArray().forEach((rowItem) => {
                const container = document.createElement("div");
                container.innerHTML = String(rowItem[1] || "");
                const unitName = (container.textContent || "").trim();
                if (unitName) {
                    units.push(unitName);
                }
            });
            return units;
        };

        const seedData = () => {
            const units = getStoredUnits();
            const rows = units.map((name) => {
                return [
                    renderTemplateHtml(snTemplate, (fragment) => {
                        const snNode = fragment.querySelector(".sn-badge");
                        if (snNode) snNode.textContent = "0";
                    }),
                    renderTemplateHtml(nameTemplate, (fragment) => {
                        const nameNode = fragment.querySelector(".fw-medium");
                        if (nameNode) nameNode.textContent = name;
                    }),
                    actionButtonsHtml()
                ];
            });

            tableApi.clear();
            tableApi.rows.add(rows).draw(false);
            renumberRows();
            saveUnits(units);
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

        tableElement.on("click", ".delete-row", function () {
            const row = tableApi.row($(this).closest("tr"));
            row.remove().draw(false);
            renumberRows();
            saveUnits(getUnitsFromTable());
        });

        tableElement.on("click", ".view-row", function () {
            const rowNode = $(this).closest("tr")[0];
            if (!rowNode) return;
            const nameCell = rowNode.querySelector("td:nth-child(2)");
            const unitName = nameCell ? nameCell.textContent.trim() : "";
            alert("Menu Unit: " + unitName);
        });

        tableElement.on("click", ".edit-row", function () {
            const row = tableApi.row($(this).closest("tr"));
            const rowData = row.data();
            if (!rowData) return;

            const container = document.createElement("div");
            container.innerHTML = String(rowData[1] || "");
            const nameText = (container.textContent || "").trim();
            const updated = window.prompt("Edit Menu Unit", nameText);
            if (!updated || !updated.trim()) return;

            const cleanName = updated.trim();
            row.data([
                rowData[0],
                renderTemplateHtml(nameTemplate, (fragment) => {
                    const nameNode = fragment.querySelector(".fw-medium");
                    if (nameNode) nameNode.textContent = cleanName;
                }),
                rowData[2]
            ]).draw(false);
            renumberRows();
            saveUnits(getUnitsFromTable());
        });

        tableApi.on("draw", renumberRows);
        renumberRows();
    };

    waitForDataTable();
});
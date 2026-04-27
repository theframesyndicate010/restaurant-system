document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "office_expense_category_master_list";

    const addButton = document.getElementById("addExpenseCategoryBtn");
    const searchInput = document.getElementById("expenseCategorySearch");
    const pageLengthSelect = document.getElementById("expenseCategoryPageLength");
    const refreshButton = document.getElementById("expenseCategoryRefreshBtn");
    const tableElement = $(".expense-category-table");

    const snTemplate = document.getElementById("expenseCategoryCellSnTemplate");
    const codeTemplate = document.getElementById("expenseCategoryCellCodeTemplate");
    const titleTemplate = document.getElementById("expenseCategoryCellTitleTemplate");
    const createdByTemplate = document.getElementById("expenseCategoryCellCreatedByTemplate");
    const createdAtTemplate = document.getElementById("expenseCategoryCellCreatedAtTemplate");

    if (!searchInput || !pageLengthSelect || !refreshButton || !tableElement.length || !snTemplate ||
        !codeTemplate || !titleTemplate || !createdByTemplate || !createdAtTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const defaultRows = [
        {
            categoryId: "EXP-CAT-1001",
            code: "EX-001",
            title: "Electricity Bill",
            createdBy: "Admin",
            createdAt: "2026-04-01"
        },
        {
            categoryId: "EXP-CAT-1002",
            code: "EX-002",
            title: "Internet Charges",
            createdBy: "Admin",
            createdAt: "2026-04-02"
        },
        {
            categoryId: "EXP-CAT-1003",
            code: "EX-003",
            title: "Office Supplies",
            createdBy: "Cashier",
            createdAt: "2026-04-03"
        },
        {
            categoryId: "EXP-CAT-1004",
            code: "EX-004",
            title: "Maintenance",
            createdBy: "Admin",
            createdAt: "2026-04-04"
        },
        {
            categoryId: "EXP-CAT-1005",
            code: "EX-005",
            title: "Cleaning Materials",
            createdBy: "Cashier",
            createdAt: "2026-04-05"
        }
    ];

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeRecord = (item, index) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        return {
            categoryId: normalizeText(item.categoryId, "EXP-CAT-" + String(1001 + index)),
            code: normalizeText(item.code, "-"),
            title: normalizeText(item.title, "-"),
            createdBy: normalizeText(item.createdBy, "-"),
            createdAt: normalizeText(item.createdAt, "-")
        };
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

    const getStaticRows = () => {
        return defaultRows
            .map((item, index) => normalizeRecord(item, index))
            .filter(Boolean);
    };

    const getStoredRows = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed
                .map((item, index) => normalizeRecord(item, 2001 + index))
                .filter(Boolean);
        } catch (error) {
            return [];
        }
    };

    const getCombinedRows = () => {
        const staticRows = getStaticRows();
        const storedRows = getStoredRows();

        if (!storedRows.length) {
            return staticRows;
        }

        return staticRows.concat(storedRows);
    };

    const getFilteredRows = () => {
        const keyword = searchInput.value.trim().toLowerCase();

        if (!keyword) {
            return allRows;
        }

        return allRows.filter((row) => {
            const haystack = [row.code, row.title, row.createdBy, row.createdAt].join(" ").toLowerCase();
            return haystack.includes(keyword);
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-category-sn");
                if (node) {
                    node.textContent = "0";
                }
            }),
            renderTemplateHtml(codeTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-category-code");
                if (node) {
                    node.textContent = row.code;
                }
            }),
            renderTemplateHtml(titleTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-category-title");
                if (node) {
                    node.textContent = row.title;
                }
            }),
            renderTemplateHtml(createdByTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-category-created-by");
                if (node) {
                    node.textContent = row.createdBy;
                }
            }),
            renderTemplateHtml(createdAtTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-category-created-at");
                if (node) {
                    node.textContent = row.createdAt;
                }
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;

            if (!firstCell) {
                return;
            }

            const badge = firstCell.querySelector(".expense-category-sn");
            if (badge) {
                badge.textContent = String(rowIdx + 1);
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
        searchInput.value = "";
        pageLengthSelect.value = "10";

        tableApi.search("");
        tableApi.columns().search("");
        tableApi.page.len(10);

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
        tableApi.page.len(Number.parseInt(pageLengthSelect.value, 10) || 10).draw(false);
        tableApi.order([1, "asc"]).draw(false);

        allRows = getCombinedRows();
        renderRows();

        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(Number.parseInt(pageLengthSelect.value, 10) || 10).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        if (addButton) {
            addButton.addEventListener("click", () => {
                window.location.href = "add-expense-category.html";
            });
        }

        tableApi.on("draw", () => {
            renumberRows();
        });
    };

    waitForDataTable();
});

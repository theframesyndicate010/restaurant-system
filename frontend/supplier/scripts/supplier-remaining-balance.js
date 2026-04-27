document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "supplier_remaining_balance_list";

    const supplierFilter = document.getElementById("supplierBalanceFilter");
    const pageLengthSelect = document.getElementById("supplierBalancePageLength");
    const refreshButton = document.getElementById("supplierBalanceRefreshBtn");
    const totalValueNode = document.getElementById("supplierBalanceTotalValue");

    const tableElement = $(".supplier-balance-table");
    const snTemplate = document.getElementById("supplierBalanceCellSnTemplate");
    const supplierTemplate = document.getElementById("supplierBalanceCellSupplierTemplate");
    const amountTemplate = document.getElementById("supplierBalanceCellAmountTemplate");
    const actionTemplate = document.getElementById("supplierBalanceCellActionTemplate");

    if (!supplierFilter || !pageLengthSelect || !refreshButton || !totalValueNode || !tableElement.length ||
        !snTemplate || !supplierTemplate || !amountTemplate || !actionTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const defaultRows = [
        {
            balanceId: "SRB-1001",
            supplier: "Drinkers stop",
            amount: 285047368.17,
            status: "due"
        }
    ];

    const parseAmount = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const formatAmount = (value) => {
        return parseAmount(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeStatus = (value) => {
        const status = String(value || "").trim().toLowerCase();
        return status === "clear" ? "clear" : "due";
    };

    const normalizeRecord = (item, index) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        return {
            balanceId: normalizeText(item.balanceId, "SRB-" + String(1001 + index)),
            supplier: normalizeText(item.supplier, "Unknown Supplier"),
            amount: parseAmount(item.amount),
            status: normalizeStatus(item.status)
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

    const getStoredRows = () => {
        const fallback = defaultRows
            .map((item, index) => normalizeRecord(item, index))
            .filter(Boolean);

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return fallback;
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return fallback;
            }

            const normalized = parsed
                .map((item, index) => normalizeRecord(item, index))
                .filter(Boolean);

            return normalized.length ? normalized : fallback;
        } catch (error) {
            return fallback;
        }
    };

    const persistRows = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allRows));
        } catch (error) {
            // Ignore storage write errors.
        }
    };

    const fillSupplierFilter = () => {
        const selected = supplierFilter.value;
        const uniqueNames = Array.from(new Set(allRows.map((row) => row.supplier))).sort((a, b) => a.localeCompare(b));

        supplierFilter.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Select Supplier --";
        supplierFilter.appendChild(defaultOption);

        uniqueNames.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            supplierFilter.appendChild(option);
        });

        supplierFilter.value = uniqueNames.includes(selected) ? selected : "";
    };

    const getFilteredRows = () => {
        const selectedSupplier = normalizeText(supplierFilter.value, "");

        if (!selectedSupplier) {
            return allRows;
        }

        return allRows.filter((row) => row.supplier === selectedSupplier);
    };

    const updateTotal = (rows) => {
        const total = rows.reduce((sum, row) => sum + parseAmount(row.amount), 0);
        totalValueNode.textContent = formatAmount(total);
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-balance-sn");
                if (node) node.textContent = "0";
            }),
            renderTemplateHtml(supplierTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-balance-name");
                if (node) node.textContent = row.supplier;
            }),
            renderTemplateHtml(amountTemplate, (fragment) => {
                const badge = fragment.querySelector(".supplier-balance-due-badge");
                const amountNode = fragment.querySelector(".supplier-balance-amount");

                if (badge) {
                    badge.textContent = row.status === "due" ? "Due" : "Clear";
                }

                if (amountNode) {
                    amountNode.textContent = formatAmount(row.amount);
                }
            }),
            renderTemplateHtml(actionTemplate, (fragment) => {
                const button = fragment.querySelector(".supplier-balance-pay-btn");
                if (!button) return;
                button.setAttribute("data-balance-id", row.balanceId);
                button.setAttribute("data-supplier", row.supplier);
                button.setAttribute("data-amount", String(parseAmount(row.amount)));
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;
            if (!firstCell) return;

            const badge = firstCell.querySelector(".supplier-balance-sn");
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
        updateTotal(filteredRows);
    };

    const resetFilters = () => {
        supplierFilter.value = "";
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

        allRows = getStoredRows();
        persistRows();
        fillSupplierFilter();
        renderRows();

        supplierFilter.addEventListener("change", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        tableElement.on("click", ".supplier-balance-pay-btn", function () {
            const supplier = this.getAttribute("data-supplier") || "";
            const target = "supplier-due-payment.html?supplier=" + encodeURIComponent(supplier);
            window.location.href = target;
        });

        tableApi.on("draw", () => {
            renumberRows();
        });
    };

    waitForDataTable();
});

document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "supplier_payment_history";

    const supplierFilter = document.getElementById("supplierHistoryFilter");
    const fromDateInput = document.getElementById("supplierHistoryFromDate");
    const toDateInput = document.getElementById("supplierHistoryToDate");
    const pageLengthSelect = document.getElementById("supplierHistoryPageLength");
    const refreshButton = document.getElementById("supplierHistoryRefreshBtn");
    const netTotalNode = document.getElementById("supplierHistoryNetTotal");
    const discountTotalNode = document.getElementById("supplierHistoryDiscountTotal");

    const tableElement = $(".supplier-history-table");
    const snTemplate = document.getElementById("supplierHistorySnTemplate");
    const dateTemplate = document.getElementById("supplierHistoryDateTemplate");
    const supplierTemplate = document.getElementById("supplierHistorySupplierTemplate");
    const paidTemplate = document.getElementById("supplierHistoryPaidTemplate");
    const discountTemplate = document.getElementById("supplierHistoryDiscountTemplate");
    const modeTemplate = document.getElementById("supplierHistoryModeTemplate");

    if (!supplierFilter || !fromDateInput || !toDateInput || !pageLengthSelect || !refreshButton || !netTotalNode || !discountTotalNode || !tableElement.length ||
        !snTemplate || !dateTemplate || !supplierTemplate || !paidTemplate || !discountTemplate || !modeTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const parseAmount = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
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

    const toDateKey = (value) => {
        const text = String(value || "").trim();
        if (!text) return "";

        const normalized = text.replace(/\//g, "-");
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) return "";

        const y = String(date.getFullYear());
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + d;
    };

    const toDisplayDate = (value) => {
        const key = toDateKey(value);
        if (!key) return "-";
        return key.replace(/-/g, "/");
    };

    const normalizeRecord = (item) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        const dateRaw = normalizeText(item.date, "");
        const dateKey = toDateKey(dateRaw);

        return {
            id: normalizeText(item.id, "SP-" + Date.now()),
            dateKey,
            dateDisplay: dateKey ? dateKey.replace(/-/g, "/") : "-",
            supplier: normalizeText(item.supplier, "Unknown Supplier"),
            paidAmount: parseAmount(item.paidAmount),
            discountAmount: parseAmount(item.discountAmount),
            paymentMode: normalizeText(item.paymentType, "-")
        };
    };

    const renderTemplateHtml = (templateElement, bindFn) => {
        const fragment = templateElement.content.cloneNode(true);

        if (typeof bindFn === "function") {
            bindFn(fragment);
        }

        const wrapper = document.createElement("div");
        wrapper.appendChild(fragment);
        return wrapper.innerHTML;
    };

    const getStoredRows = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed.map(normalizeRecord).filter(Boolean);
        } catch (error) {
            return [];
        }
    };

    const fillSupplierFilter = () => {
        const selected = supplierFilter.value;
        const uniqueSuppliers = Array.from(new Set(allRows.map((row) => row.supplier))).sort((a, b) => a.localeCompare(b));

        supplierFilter.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "--Select Supplier--";
        supplierFilter.appendChild(defaultOption);

        uniqueSuppliers.forEach((supplier) => {
            const option = document.createElement("option");
            option.value = supplier;
            option.textContent = supplier;
            supplierFilter.appendChild(option);
        });

        supplierFilter.value = uniqueSuppliers.includes(selected) ? selected : "";
    };

    const getFilteredRows = () => {
        const supplier = normalizeText(supplierFilter.value, "");
        const fromDate = toDateKey(fromDateInput.value);
        const toDate = toDateKey(toDateInput.value);

        return allRows.filter((row) => {
            if (supplier && row.supplier !== supplier) {
                return false;
            }

            if (fromDate && (!row.dateKey || row.dateKey < fromDate)) {
                return false;
            }

            if (toDate && (!row.dateKey || row.dateKey > toDate)) {
                return false;
            }

            return true;
        });
    };

    const updateNetTotal = (rows) => {
        const paidTotal = rows.reduce((sum, row) => sum + parseAmount(row.paidAmount), 0);
        const discountTotal = rows.reduce((sum, row) => sum + parseAmount(row.discountAmount), 0);

        netTotalNode.textContent = formatAmount(paidTotal);
        discountTotalNode.textContent = formatAmount(discountTotal);
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-history-sn");
                if (node) node.textContent = "0";
            }),
            renderTemplateHtml(dateTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-history-date");
                if (node) node.textContent = row.dateDisplay;
            }),
            renderTemplateHtml(supplierTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-history-supplier");
                if (node) node.textContent = row.supplier;
            }),
            renderTemplateHtml(paidTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-history-paid");
                if (node) node.textContent = formatAmount(row.paidAmount);
            }),
            renderTemplateHtml(discountTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-history-discount");
                if (node) node.textContent = formatAmount(row.discountAmount);
            }),
            renderTemplateHtml(modeTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-history-mode");
                if (node) node.textContent = row.paymentMode;
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const rowNode = this.node();
            const firstCell = rowNode ? rowNode.querySelector("td") : null;
            if (!firstCell) return;

            const badge = firstCell.querySelector(".supplier-history-sn");
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
        updateNetTotal(filteredRows);
    };

    const resetFilters = () => {
        supplierFilter.value = "";
        fromDateInput.value = "";
        toDateInput.value = "";
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
        tableApi.order([1, "desc"]).draw(false);

        allRows = getStoredRows();
        fillSupplierFilter();
        renderRows();

        supplierFilter.addEventListener("change", renderRows);
        fromDateInput.addEventListener("input", renderRows);
        toDateInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        tableApi.on("draw", () => {
            renumberRows();
        });
    };

    waitForDataTable();
});

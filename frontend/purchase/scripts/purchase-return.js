document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "purchase_return_master_list";

    const addButton = document.getElementById("addPurchaseReturnBtn");
    const searchInput = document.getElementById("purchaseReturnSearch");
    const pageLengthSelect = document.getElementById("purchaseReturnPageLength");
    const refreshButton = document.getElementById("purchaseReturnRefreshBtn");
    const tableElement = $(".purchase-return-table");
    const snTemplate = document.getElementById("purchaseReturnCellSnTemplate");
    const dateTemplate = document.getElementById("purchaseReturnCellDateTemplate");
    const supplierTemplate = document.getElementById("purchaseReturnCellSupplierTemplate");
    const amountTemplate = document.getElementById("purchaseReturnCellAmountTemplate");
    const remarksTemplate = document.getElementById("purchaseReturnCellRemarksTemplate");
    const actionsTemplate = document.getElementById("purchaseReturnCellActionsTemplate");

    if (!addButton || !searchInput || !pageLengthSelect || !refreshButton || !tableElement.length ||
        !snTemplate || !dateTemplate || !supplierTemplate || !amountTemplate || !remarksTemplate || !actionsTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const defaultRows = [
        {
            returnNo: "PR-1001",
            date: "2082-12-29",
            supplier: "Fresh Mart Traders",
            amount: 2680,
            remarks: "Damaged canned products"
        },
        {
            returnNo: "PR-1002",
            date: "2082-12-29",
            supplier: "Everest Beverage House",
            amount: 1450,
            remarks: "Broken bottle crates"
        },
        {
            returnNo: "PR-1003",
            date: "2082-12-28",
            supplier: "Annapurna Agro Suppliers",
            amount: 1960,
            remarks: "Over-supplied onions returned"
        },
        {
            returnNo: "PR-1004",
            date: "2082-12-27",
            supplier: "Dairy Hub Pvt. Ltd.",
            amount: 820,
            remarks: "Short expiry cheese packs"
        },
        {
            returnNo: "PR-1005",
            date: "2082-12-26",
            supplier: "Metro Dry Foods",
            amount: 2370,
            remarks: "Incorrect invoice delivery"
        },
        {
            returnNo: "PR-1006",
            date: "2082-12-25",
            supplier: "Sunrise Wholesale",
            amount: 980,
            remarks: "Quality issue in flour batch"
        }
    ];

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const formatMoney = (value) => {
        return parseNumber(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const normalizeDate = (value) => {
        const text = String(value || "").trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "2082-12-29";
    };

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeRecord = (item, index) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        return {
            returnNo: normalizeText(item.returnNo, "PR-" + String(1000 + index + 1)),
            date: normalizeDate(item.date),
            supplier: normalizeText(item.supplier, "Unknown Supplier"),
            amount: parseNumber(item.amount),
            remarks: normalizeText(item.remarks, "-")
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
            if (!raw) return fallback;

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return fallback;

            const normalized = parsed
                .map((item, index) => normalizeRecord(item, index))
                .filter(Boolean);

            if (!normalized.length) return fallback;
            return normalized;
        } catch (error) {
            return fallback;
        }
    };

    const persistRows = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allRows));
        } catch (error) {
            // Ignore localStorage write errors.
        }
    };

    const getFilteredRows = () => {
        const keyword = searchInput.value.trim().toLowerCase();

        if (!keyword) {
            return allRows;
        }

        return allRows.filter((row) => {
            const haystack = (row.returnNo + " " + row.date + " " + row.supplier + " " + row.remarks).toLowerCase();
            return haystack.includes(keyword);
        });
    };

    const buildDataTableRow = (row) => {
        const returnNo = row.returnNo;

        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-sn");
                if (node) node.textContent = "0";
            }),
            renderTemplateHtml(dateTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-date");
                if (node) node.textContent = row.date;
            }),
            renderTemplateHtml(supplierTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-supplier");
                if (node) node.textContent = row.supplier;
            }),
            renderTemplateHtml(amountTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-amount");
                if (node) node.textContent = "Rs. " + formatMoney(row.amount);
            }),
            renderTemplateHtml(remarksTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-remarks");
                if (node) node.textContent = row.remarks;
            }),
            renderTemplateHtml(actionsTemplate, (fragment) => {
                fragment.querySelectorAll(".action-btn").forEach((button) => {
                    button.setAttribute("data-return-no", returnNo);
                });
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;

            if (firstCell) {
                const badge = firstCell.querySelector(".purchase-return-sn");
                if (badge) {
                    badge.textContent = String(rowIdx + 1);
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

    const openPurchaseReturnDetail = (returnNo) => {
        const id = String(returnNo || "").trim();
        if (!id) return;
        alert("Open detail page for purchase return " + id + ".");
    };

    const resetFilters = () => {
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
        tableApi.order([1, "desc"]).draw(false);

        allRows = getStoredRows();
        persistRows();
        renderRows();

        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        tableElement.on("click", "tbody tr", function (event) {
            if ($(event.target).closest(".action-btn").length) {
                return;
            }

            const viewButton = this.querySelector(".purchase-return-view-btn");
            const returnNo = viewButton ? viewButton.getAttribute("data-return-no") : "";
            openPurchaseReturnDetail(returnNo);
        });

        tableElement.on("click", ".purchase-return-view-btn", function () {
            const returnNo = this.getAttribute("data-return-no") || "";
            openPurchaseReturnDetail(returnNo);
        });

        tableElement.on("click", ".purchase-return-edit-btn", function () {
            const returnNo = this.getAttribute("data-return-no") || "";
            alert("Open edit form for purchase return " + returnNo + ".");
        });

        tableElement.on("click", ".purchase-return-delete-btn", function () {
            const returnNo = this.getAttribute("data-return-no") || "";
            const shouldDelete = confirm("Delete purchase return " + returnNo + "?");
            if (!shouldDelete) return;

            allRows = allRows.filter((item) => item.returnNo !== returnNo);
            persistRows();
            renderRows();
        });

        addButton.addEventListener("click", (event) => {
            event.preventDefault();
            window.location.href = "add-purchase-return.html";
        });

        tableApi.on("draw", () => {
            renumberRows();
        });
    };

    waitForDataTable();
});

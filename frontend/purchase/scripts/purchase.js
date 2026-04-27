document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "purchase_master_list";

    const fromDateInput = document.getElementById("purchaseFromDate");
    const toDateInput = document.getElementById("purchaseToDate");
    const taxTypeSelect = document.getElementById("purchaseTaxType");
    const statusSelect = document.getElementById("purchaseStatus");
    const searchInput = document.getElementById("purchaseSearch");
    const pageLengthSelect = document.getElementById("purchasePageLength");
    const refreshButton = document.getElementById("purchaseRefreshBtn");
    const tableElement = $(".purchase-table");
    const snTemplate = document.getElementById("purchaseCellSnTemplate");
    const dateTemplate = document.getElementById("purchaseCellDateTemplate");
    const supplierTemplate = document.getElementById("purchaseCellSupplierTemplate");
    const invoiceTemplate = document.getElementById("purchaseCellInvoiceTemplate");
    const billTemplate = document.getElementById("purchaseCellBillTemplate");
    const paymentTemplate = document.getElementById("purchaseCellPaymentTemplate");
    const paidTemplate = document.getElementById("purchaseCellPaidTemplate");
    const statusTemplate = document.getElementById("purchaseCellStatusTemplate");
    const actionsTemplate = document.getElementById("purchaseCellActionsTemplate");

    if (!fromDateInput || !toDateInput || !taxTypeSelect || !statusSelect || !searchInput || !pageLengthSelect || !refreshButton || !tableElement.length ||
        !snTemplate || !dateTemplate || !supplierTemplate || !invoiceTemplate || !billTemplate || !paymentTemplate || !paidTemplate || !statusTemplate || !actionsTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const defaultRows = [
        {
            date: "2082-12-29",
            supplier: "Fresh Mart Traders",
            invoiceNo: "INV-3021",
            billAmount: 25840,
            paymentType: "Cash",
            paidAmount: 25840,
            status: "Paid",
            remarks: "Kitchen dry stock",
            taxType: "Tax",
            items: [
                { item: "Basmati Rice", qty: 120, rate: 105, amount: 12600 },
                { item: "Refined Oil", qty: 40, rate: 185, amount: 7400 },
                { item: "Spice Mix", qty: 24, rate: 175, amount: 4200 },
                { item: "Salt", qty: 20, rate: 82, amount: 1640 }
            ]
        },
        {
            date: "2082-12-29",
            supplier: "Everest Beverage House",
            invoiceNo: "INV-3019",
            billAmount: 14200,
            paymentType: "Card",
            paidAmount: 9000,
            status: "Partial",
            remarks: "Soft drinks and juices",
            taxType: "Tax",
            items: [
                { item: "Orange Juice", qty: 30, rate: 150, amount: 4500 },
                { item: "Cola", qty: 60, rate: 85, amount: 5100 },
                { item: "Soda Water", qty: 40, rate: 70, amount: 2800 },
                { item: "Mineral Water", qty: 30, rate: 60, amount: 1800 }
            ]
        },
        {
            date: "2082-12-28",
            supplier: "Annapurna Agro Suppliers",
            invoiceNo: "INV-3014",
            billAmount: 18500,
            paymentType: "Credit",
            paidAmount: 0,
            status: "Pending",
            remarks: "Vegetables weekly supply",
            taxType: "No Tax",
            items: [
                { item: "Tomato", qty: 90, rate: 75, amount: 6750 },
                { item: "Onion", qty: 110, rate: 62, amount: 6820 },
                { item: "Potato", qty: 120, rate: 41, amount: 4920 },
                { item: "Capsicum", qty: 6, rate: 145, amount: 870 }
            ]
        },
        {
            date: "2082-12-27",
            supplier: "Dairy Hub Pvt. Ltd.",
            invoiceNo: "INV-3008",
            billAmount: 9600,
            paymentType: "Cash",
            paidAmount: 9600,
            status: "Paid",
            remarks: "Milk and cheese",
            taxType: "Tax",
            items: [
                { item: "Milk", qty: 120, rate: 55, amount: 6600 },
                { item: "Cheese", qty: 12, rate: 180, amount: 2160 },
                { item: "Butter", qty: 7, rate: 120, amount: 840 }
            ]
        }
    ];

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const escapeHtml = (value) => {
        return String(value == null ? "" : value)
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

    const normalizeDate = (value) => {
        const text = String(value || "").trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
    };

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizePaymentType = (value) => {
        const text = String(value || "").trim().toLowerCase();
        if (text === "cash") return "Cash";
        if (text === "card") return "Card";
        if (text === "credit") return "Credit";
        return "Cash";
    };

    const normalizeStatus = (value) => {
        const text = String(value || "").trim().toLowerCase();
        if (text === "paid") return "Paid";
        if (text === "partial") return "Partial";
        return "Pending";
    };

    const normalizeTaxType = (value) => {
        const text = String(value || "").trim().toLowerCase();
        if (text === "no tax") return "No Tax";
        return "Tax";
    };

    const normalizeItemRows = (value, fallbackAmount, fallbackLabel) => {
        if (Array.isArray(value) && value.length) {
            const normalized = value
                .map((item, index) => {
                    if (!item || typeof item !== "object") return null;

                    const itemName = normalizeText(item.item || item.name, "Item " + (index + 1));
                    const qty = parseNumber(item.qty || item.quantity);
                    const rate = parseNumber(item.rate);
                    const amount = parseNumber(item.amount) || (qty * rate);

                    return {
                        item: itemName,
                        qty,
                        rate,
                        amount
                    };
                })
                .filter(Boolean);

            if (normalized.length) {
                return normalized;
            }
        }

        const fallbackRate = parseNumber(fallbackAmount);
        return [{
            item: normalizeText(fallbackLabel, "Purchase Item"),
            qty: 1,
            rate: fallbackRate,
            amount: fallbackRate
        }];
    };

    const normalizeRecord = (item) => {
        if (!item || typeof item !== "object") return null;

        const billAmount = parseNumber(item.billAmount);
        const remarks = normalizeText(item.remarks, "-");

        return {
            date: normalizeDate(item.date) || "2082-12-29",
            supplier: normalizeText(item.supplier, "Unknown Supplier"),
            invoiceNo: normalizeText(item.invoiceNo, "N/A"),
            billAmount,
            paymentType: normalizePaymentType(item.paymentType),
            paidAmount: parseNumber(item.paidAmount),
            status: normalizeStatus(item.status),
            remarks,
            taxType: normalizeTaxType(item.taxType),
            items: normalizeItemRows(item.items, billAmount, remarks)
        };
    };

    const getStoredRows = () => {
        const fallback = defaultRows.map((item) => normalizeRecord(item)).filter(Boolean);

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return fallback;

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return fallback;

            const normalized = parsed
                .map((item) => normalizeRecord(item))
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
            // Ignore storage errors; UI still remains usable.
        }
    };

    const statusClassMap = {
        Paid: "paid",
        Partial: "partial",
        Pending: "pending"
    };

    const paymentClassMap = {
        Cash: "cash",
        Card: "card",
        Credit: "credit"
    };

    const matchesDateRange = (rowDate, fromDate, toDate) => {
        const current = normalizeDate(rowDate);
        if (!current) return true;

        const from = normalizeDate(fromDate);
        const to = normalizeDate(toDate);

        if (from && current < from) return false;
        if (to && current > to) return false;
        return true;
    };

    const getFilteredRows = () => {
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;
        const taxType = taxTypeSelect.value.trim().toLowerCase();
        const status = statusSelect.value.trim().toLowerCase();
        const keyword = searchInput.value.trim().toLowerCase();

        return allRows.filter((row) => {
            if (!matchesDateRange(row.date, fromDate, toDate)) {
                return false;
            }

            if (taxType && row.taxType.toLowerCase() !== taxType) {
                return false;
            }

            if (status && row.status.toLowerCase() !== status) {
                return false;
            }

            if (keyword) {
                const haystack = (row.supplier + " " + row.invoiceNo + " " + row.remarks).toLowerCase();
                if (!haystack.includes(keyword)) {
                    return false;
                }
            }

            return true;
        });
    };

    const buildDataTableRow = (row) => {
        const paymentClass = paymentClassMap[row.paymentType] || "cash";
        const statusClass = statusClassMap[row.status] || "pending";
        const invoice = row.invoiceNo;

        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-sn");
                if (node) node.textContent = "0";
            }),
            renderTemplateHtml(dateTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-date");
                if (node) node.textContent = row.date;
            }),
            renderTemplateHtml(supplierTemplate, (fragment) => {
                const supplierNode = fragment.querySelector(".purchase-supplier");
                const remarksNode = fragment.querySelector(".purchase-remarks");
                if (supplierNode) supplierNode.textContent = row.supplier;
                if (remarksNode) remarksNode.textContent = row.remarks;
            }),
            renderTemplateHtml(invoiceTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-invoice");
                if (node) node.textContent = row.invoiceNo;
            }),
            renderTemplateHtml(billTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-bill-amount");
                if (node) node.textContent = "Rs. " + formatMoney(row.billAmount);
            }),
            renderTemplateHtml(paymentTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-payment-pill");
                if (!node) return;
                node.classList.add(paymentClass);
                node.textContent = row.paymentType;
            }),
            renderTemplateHtml(paidTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-paid-amount");
                if (node) node.textContent = "Rs. " + formatMoney(row.paidAmount);
            }),
            renderTemplateHtml(statusTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-status-pill");
                if (!node) return;
                node.classList.add(statusClass);
                node.textContent = row.status;
            }),
            renderTemplateHtml(actionsTemplate, (fragment) => {
                fragment.querySelectorAll(".action-btn").forEach((button) => {
                    button.setAttribute("data-invoice", invoice);
                });
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;
            if (firstCell) {
                const badge = firstCell.querySelector(".purchase-sn");
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

    const openPurchaseDetail = (invoice) => {
        const id = String(invoice || "").trim();
        if (!id) return;
        window.location.href = "purchase-detailed-view.html?invoice=" + encodeURIComponent(id);
    };

    const resetFilters = () => {
        fromDateInput.value = "2082-12-29";
        toDateInput.value = "2082-12-29";
        taxTypeSelect.value = "";
        statusSelect.value = "";
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

        fromDateInput.addEventListener("input", renderRows);
        toDateInput.addEventListener("input", renderRows);
        taxTypeSelect.addEventListener("change", renderRows);
        statusSelect.addEventListener("change", renderRows);
        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        tableElement.on("click", "tbody tr", function (event) {
            if ($(event.target).closest(".action-btn").length) {
                return;
            }

            const invoiceNode = this.querySelector(".purchase-invoice");
            const invoice = invoiceNode ? invoiceNode.textContent.trim() : "";
            if (!invoice) {
                return;
            }

            openPurchaseDetail(invoice);
        });

        tableElement.on("click", ".purchase-view-btn", function () {
            const invoice = this.getAttribute("data-invoice") || "-";
            openPurchaseDetail(invoice);
        });

        tableElement.on("click", ".purchase-edit-btn", function () {
            const invoice = this.getAttribute("data-invoice") || "-";
            alert("Open edit form for invoice " + invoice + ".");
        });

        tableElement.on("click", ".purchase-delete-btn", function () {
            const invoice = this.getAttribute("data-invoice") || "-";
            const shouldDelete = confirm("Delete purchase invoice " + invoice + "?");
            if (!shouldDelete) return;

            allRows = allRows.filter((item) => item.invoiceNo !== invoice);
            persistRows();
            renderRows();
        });

        const newPurchaseLinks = document.querySelectorAll("#purchaseNewDropdown + .dropdown-menu .dropdown-item");
        newPurchaseLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                alert("Purchase entry form can be connected here.");
            });
        });

        tableApi.on("draw", () => {
            renumberRows();
        });
    };

    waitForDataTable();
});

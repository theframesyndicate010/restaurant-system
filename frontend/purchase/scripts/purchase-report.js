document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "purchase_master_list";

    const fromDateInput = document.getElementById("purchaseReportFromDate");
    const toDateInput = document.getElementById("purchaseReportToDate");
    const supplierSelect = document.getElementById("purchaseReportSupplier");
    const loadButton = document.getElementById("purchaseReportLoadBtn");
    const printButton = document.getElementById("purchaseReportPrintBtn");
    const pdfButton = document.getElementById("purchaseReportPdfBtn");
    const tableElement = $(".purchase-report-table");

    const totalAmountElement = document.getElementById("purchaseReportTotalAmount");
    const totalDiscountElement = document.getElementById("purchaseReportTotalDiscount");
    const totalPaidElement = document.getElementById("purchaseReportTotalPaid");
    const totalDueElement = document.getElementById("purchaseReportTotalDue");

    const snTemplate = document.getElementById("purchaseReportCellSnTemplate");
    const dateTemplate = document.getElementById("purchaseReportCellDateTemplate");
    const supplierTemplate = document.getElementById("purchaseReportCellSupplierTemplate");
    const invoiceTemplate = document.getElementById("purchaseReportCellInvoiceTemplate");
    const amountTemplate = document.getElementById("purchaseReportCellAmountTemplate");
    const discountTemplate = document.getElementById("purchaseReportCellDiscountTemplate");
    const paidTemplate = document.getElementById("purchaseReportCellPaidTemplate");
    const dueTemplate = document.getElementById("purchaseReportCellDueTemplate");
    const remarksTemplate = document.getElementById("purchaseReportCellRemarksTemplate");

    const printPageTemplate = document.getElementById("purchaseReportPrintPageTemplate");
    const printRowTemplate = document.getElementById("purchaseReportPrintRowTemplate");
    const printEmptyRowTemplate = document.getElementById("purchaseReportPrintEmptyRowTemplate");

    if (!fromDateInput || !toDateInput || !supplierSelect || !loadButton || !printButton || !pdfButton || !tableElement.length ||
        !totalAmountElement || !totalDiscountElement || !totalPaidElement || !totalDueElement ||
        !snTemplate || !dateTemplate || !supplierTemplate || !invoiceTemplate || !amountTemplate || !discountTemplate || !paidTemplate || !dueTemplate || !remarksTemplate ||
        !printPageTemplate || !printRowTemplate || !printEmptyRowTemplate) {
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
            discount: 500,
            paidAmount: 25840,
            remarks: "Kitchen dry stock"
        },
        {
            date: "2082-12-29",
            supplier: "Everest Beverage House",
            invoiceNo: "INV-3019",
            billAmount: 14200,
            discount: 0,
            paidAmount: 9000,
            remarks: "Soft drinks and juices"
        },
        {
            date: "2082-12-28",
            supplier: "Annapurna Agro Suppliers",
            invoiceNo: "INV-3014",
            billAmount: 18500,
            discount: 300,
            paidAmount: 0,
            remarks: "Vegetables weekly supply"
        },
        {
            date: "2082-12-27",
            supplier: "Dairy Hub Pvt. Ltd.",
            invoiceNo: "INV-3008",
            billAmount: 9600,
            discount: 0,
            paidAmount: 9600,
            remarks: "Milk and cheese"
        }
    ];

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatMoney = (value) => {
        return parseNumber(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const normalizeDate = (value) => {
        const text = String(value || "").trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
    };

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeRecord = (item, index) => {
        if (!item || typeof item !== "object") return null;

        const amount = parseNumber(item.billAmount != null ? item.billAmount : item.amount);
        const discount = Math.max(0, parseNumber(item.discount));
        const paid = Math.max(0, parseNumber(item.paidAmount));

        const computedDue = amount - discount - paid;
        const due = item.dueAmount != null ? parseNumber(item.dueAmount) : Math.max(0, computedDue);

        return {
            id: String(index + 1),
            date: normalizeDate(item.date) || "2082-12-29",
            supplier: normalizeText(item.supplier, "Unknown Supplier"),
            invoiceNo: normalizeText(item.invoiceNo, "N/A"),
            amount,
            discount,
            paidAmount: paid,
            dueAmount: Math.max(0, due),
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

    const populateSupplierFilter = () => {
        const previousValue = supplierSelect.value;
        const supplierSet = new Set(allRows.map((row) => row.supplier));
        const suppliers = Array.from(supplierSet).sort((a, b) => a.localeCompare(b));

        supplierSelect.textContent = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Supplier";
        supplierSelect.appendChild(defaultOption);

        suppliers.forEach((supplier) => {
            const option = document.createElement("option");
            option.value = supplier;
            option.textContent = supplier;
            supplierSelect.appendChild(option);
        });

        supplierSelect.value = suppliers.includes(previousValue) ? previousValue : "";
    };

    const matchesDateRange = (rowDate, fromDate, toDate) => {
        const current = normalizeDate(rowDate);
        const from = normalizeDate(fromDate);
        const to = normalizeDate(toDate);

        if (from && current < from) return false;
        if (to && current > to) return false;
        return true;
    };

    const getFilteredRows = () => {
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;
        const supplier = supplierSelect.value.trim().toLowerCase();

        return allRows.filter((row) => {
            if (!matchesDateRange(row.date, fromDate, toDate)) {
                return false;
            }

            if (supplier && row.supplier.toLowerCase() !== supplier) {
                return false;
            }

            return true;
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-sn");
                if (node) node.textContent = "0";
            }),
            renderTemplateHtml(dateTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-date");
                if (node) node.textContent = row.date;
            }),
            renderTemplateHtml(supplierTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-supplier");
                if (node) node.textContent = row.supplier;
            }),
            renderTemplateHtml(invoiceTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-invoice");
                if (node) node.textContent = row.invoiceNo;
            }),
            renderTemplateHtml(amountTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-amount");
                if (node) node.textContent = formatMoney(row.amount);
            }),
            renderTemplateHtml(discountTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-discount");
                if (node) node.textContent = formatMoney(row.discount);
            }),
            renderTemplateHtml(paidTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-paid");
                if (node) node.textContent = formatMoney(row.paidAmount);
            }),
            renderTemplateHtml(dueTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-due");
                if (node) node.textContent = formatMoney(row.dueAmount);
            }),
            renderTemplateHtml(remarksTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-report-remarks");
                if (node) node.textContent = row.remarks;
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;
            if (firstCell) {
                const badge = firstCell.querySelector(".purchase-report-sn");
                if (badge) {
                    badge.textContent = String(rowIdx + 1);
                }
            }
        });
    };

    const calculateTotals = (rows) => {
        return rows.reduce((acc, row) => {
            acc.amount += parseNumber(row.amount);
            acc.discount += parseNumber(row.discount);
            acc.paid += parseNumber(row.paidAmount);
            acc.due += parseNumber(row.dueAmount);
            return acc;
        }, {
            amount: 0,
            discount: 0,
            paid: 0,
            due: 0
        });
    };

    const updateTotals = (rows) => {
        const totals = calculateTotals(rows);

        totalAmountElement.textContent = formatMoney(totals.amount);
        totalDiscountElement.textContent = formatMoney(totals.discount);
        totalPaidElement.textContent = formatMoney(totals.paid);
        totalDueElement.textContent = formatMoney(totals.due);
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
        updateTotals(filteredRows);
    };

    const renderPrintRows = (rows, bodyElement) => {
        bodyElement.textContent = "";

        if (!rows.length) {
            const emptyFragment = printEmptyRowTemplate.content.cloneNode(true);
            bodyElement.appendChild(emptyFragment);
            return;
        }

        rows.forEach((row, index) => {
            const fragment = printRowTemplate.content.cloneNode(true);

            const snNode = fragment.querySelector("[data-col-sn]");
            const dateNode = fragment.querySelector("[data-col-date]");
            const supplierNode = fragment.querySelector("[data-col-supplier]");
            const invoiceNode = fragment.querySelector("[data-col-invoice]");
            const amountNode = fragment.querySelector("[data-col-amount]");
            const discountNode = fragment.querySelector("[data-col-discount]");
            const paidNode = fragment.querySelector("[data-col-paid]");
            const dueNode = fragment.querySelector("[data-col-due]");
            const remarksNode = fragment.querySelector("[data-col-remarks]");

            if (snNode) snNode.textContent = String(index + 1);
            if (dateNode) dateNode.textContent = row.date;
            if (supplierNode) supplierNode.textContent = row.supplier;
            if (invoiceNode) invoiceNode.textContent = row.invoiceNo;
            if (amountNode) amountNode.textContent = formatMoney(row.amount);
            if (discountNode) discountNode.textContent = formatMoney(row.discount);
            if (paidNode) paidNode.textContent = formatMoney(row.paidAmount);
            if (dueNode) dueNode.textContent = formatMoney(row.dueAmount);
            if (remarksNode) remarksNode.textContent = row.remarks;

            bodyElement.appendChild(fragment);
        });
    };

    const openPrintWindow = (mode) => {
        const filteredRows = getFilteredRows();
        const pageFragment = printPageTemplate.content.cloneNode(true);
        const root = pageFragment.querySelector("html");

        if (!root) return;

        const totals = calculateTotals(filteredRows);

        const titleNode = root.querySelector("[data-report-title]");
        const headingNode = root.querySelector("[data-report-heading]");
        const fromNode = root.querySelector("[data-report-from]");
        const toNode = root.querySelector("[data-report-to]");
        const supplierNode = root.querySelector("[data-report-supplier]");
        const generatedNode = root.querySelector("[data-report-generated-on]");
        const bodyNode = root.querySelector("[data-report-body]");

        const totalAmountNode = root.querySelector("[data-report-total-amount]");
        const totalDiscountNode = root.querySelector("[data-report-total-discount]");
        const totalPaidNode = root.querySelector("[data-report-total-paid]");
        const totalDueNode = root.querySelector("[data-report-total-due]");

        const supplierLabel = supplierSelect.value || "All Suppliers";

        if (titleNode) titleNode.textContent = mode === "pdf" ? "Purchase Report (PDF)" : "Purchase Report";
        if (headingNode) headingNode.textContent = mode === "pdf" ? "Purchase Report (PDF)" : "Purchase Report";
        if (fromNode) fromNode.textContent = fromDateInput.value.trim() || "-";
        if (toNode) toNode.textContent = toDateInput.value.trim() || "-";
        if (supplierNode) supplierNode.textContent = supplierLabel;
        if (generatedNode) generatedNode.textContent = new Date().toLocaleString();

        if (bodyNode) {
            renderPrintRows(filteredRows, bodyNode);
        }

        if (totalAmountNode) totalAmountNode.textContent = formatMoney(totals.amount);
        if (totalDiscountNode) totalDiscountNode.textContent = formatMoney(totals.discount);
        if (totalPaidNode) totalPaidNode.textContent = formatMoney(totals.paid);
        if (totalDueNode) totalDueNode.textContent = formatMoney(totals.due);

        const reportWindow = window.open("", "_blank", "width=1100,height=760");
        if (!reportWindow) {
            alert("Please allow popups to print or export the report.");
            return;
        }

        reportWindow.document.open();
        reportWindow.document.write("<!DOCTYPE html>" + root.outerHTML);
        reportWindow.document.close();
        reportWindow.focus();

        setTimeout(() => {
            reportWindow.print();
        }, 250);
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        tableApi = tableElement.DataTable();
        tableApi.search("");
        tableApi.columns().search("");
        tableApi.page.len(50).draw(false);
        tableApi.order([1, "desc"]).draw(false);

        allRows = getStoredRows();
        populateSupplierFilter();
        renderRows();

        loadButton.addEventListener("click", renderRows);
        fromDateInput.addEventListener("change", renderRows);
        toDateInput.addEventListener("change", renderRows);
        supplierSelect.addEventListener("change", renderRows);

        fromDateInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                renderRows();
            }
        });

        toDateInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                renderRows();
            }
        });

        printButton.addEventListener("click", () => openPrintWindow("print"));
        pdfButton.addEventListener("click", () => openPrintWindow("pdf"));

        tableApi.on("draw", renumberRows);
    };

    waitForDataTable();
});

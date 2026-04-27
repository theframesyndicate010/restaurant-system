document.addEventListener("datatableLoaded", () => {
    const fromDateInput = document.getElementById("purchaseReturnReportFromDate");
    const toDateInput = document.getElementById("purchaseReturnReportToDate");
    const supplierSelect = document.getElementById("purchaseReturnReportSupplier");
    const loadButton = document.getElementById("purchaseReturnReportLoadBtn");
    const loadIcon = loadButton ? loadButton.querySelector("i") : null;
    const printButton = document.getElementById("purchaseReturnReportPrintBtn");
    const pdfButton = document.getElementById("purchaseReturnReportPdfBtn");
    const tableElement = $(".purchase-return-report-table");

    const snTemplate = document.getElementById("purchaseReturnReportCellSnTemplate");
    const dateTemplate = document.getElementById("purchaseReturnReportCellDateTemplate");
    const supplierTemplate = document.getElementById("purchaseReturnReportCellSupplierTemplate");
    const amountTemplate = document.getElementById("purchaseReturnReportCellAmountTemplate");
    const remarksTemplate = document.getElementById("purchaseReturnReportCellRemarksTemplate");

    const printPageTemplate = document.getElementById("purchaseReturnReportPrintPageTemplate");
    const printRowTemplate = document.getElementById("purchaseReturnReportPrintRowTemplate");
    const printEmptyRowTemplate = document.getElementById("purchaseReturnReportPrintEmptyRowTemplate");

    if (!fromDateInput || !toDateInput || !supplierSelect || !loadButton || !printButton || !pdfButton || !tableElement.length ||
        !snTemplate || !dateTemplate || !supplierTemplate || !amountTemplate || !remarksTemplate ||
        !printPageTemplate || !printRowTemplate || !printEmptyRowTemplate) {
        return;
    }

    const allRows = [
        {
            displayDate: "19-2082-12",
            sortDate: "2082-12-19",
            supplier: "Drinkers stop",
            amountText: "25376796.10",
            remarks: "dherai stock bhayeko karan return gareyeko ho"
        },
        {
            displayDate: "19-2082-12",
            sortDate: "2082-12-19",
            supplier: "Drinkers stop",
            amountText: "131304",
            remarks: ""
        },
        {
            displayDate: "19-2082-12",
            sortDate: "2082-12-19",
            supplier: "Drinkers stop",
            amountText: "65652",
            remarks: ""
        },
        {
            displayDate: "19-2082-12",
            sortDate: "2082-12-19",
            supplier: "Drinkers stop",
            amountText: "65652",
            remarks: ""
        }
    ];

    let tableApi = null;

    const normalizeDate = (value) => {
        const text = String(value || "").trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
    };

    const populateSuppliers = () => {
        const previous = supplierSelect.value;
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

        supplierSelect.value = suppliers.includes(previous) ? previous : "";
    };

    const matchesDateRange = (rowDate, fromDate, toDate) => {
        const from = normalizeDate(fromDate);
        const to = normalizeDate(toDate);

        if (from && rowDate < from) return false;
        if (to && rowDate > to) return false;
        return true;
    };

    const getFilteredRows = () => {
        const supplier = supplierSelect.value.trim().toLowerCase();
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;

        return allRows.filter((row) => {
            if (!matchesDateRange(row.sortDate, fromDate, toDate)) {
                return false;
            }

            if (supplier && row.supplier.toLowerCase() !== supplier) {
                return false;
            }

            return true;
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

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-report-sn");
                if (node) node.textContent = "0";
            }),
            renderTemplateHtml(dateTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-report-date");
                if (node) node.textContent = row.displayDate;
            }),
            renderTemplateHtml(supplierTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-report-supplier");
                if (node) node.textContent = row.supplier;
            }),
            renderTemplateHtml(amountTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-report-amount");
                if (node) node.textContent = row.amountText;
            }),
            renderTemplateHtml(remarksTemplate, (fragment) => {
                const node = fragment.querySelector(".purchase-return-report-remarks");
                if (node) node.textContent = row.remarks || "";
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;
            if (firstCell) {
                const badge = firstCell.querySelector(".purchase-return-report-sn");
                if (badge) {
                    badge.textContent = String(rowIdx + 1);
                }
            }
        });
    };

    const renderRows = () => {
        if (!tableApi) return;

        const rows = getFilteredRows();
        const dataRows = rows.map((row) => buildDataTableRow(row));

        tableApi.clear();

        if (dataRows.length) {
            tableApi.rows.add(dataRows);
        }

        tableApi.draw(false);
        renumberRows();
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
            const amountNode = fragment.querySelector("[data-col-amount]");
            const remarksNode = fragment.querySelector("[data-col-remarks]");

            if (snNode) snNode.textContent = String(index + 1);
            if (dateNode) dateNode.textContent = row.displayDate;
            if (supplierNode) supplierNode.textContent = row.supplier;
            if (amountNode) amountNode.textContent = row.amountText;
            if (remarksNode) remarksNode.textContent = row.remarks || "";

            bodyElement.appendChild(fragment);
        });
    };

    const openPrintWindow = (mode) => {
        const filteredRows = getFilteredRows();
        const pageFragment = printPageTemplate.content.cloneNode(true);
        const root = pageFragment.querySelector("html");

        if (!root) return;

        const titleNode = root.querySelector("[data-report-title]");
        const headingNode = root.querySelector("[data-report-heading]");
        const fromNode = root.querySelector("[data-report-from]");
        const toNode = root.querySelector("[data-report-to]");
        const supplierNode = root.querySelector("[data-report-supplier]");
        const generatedNode = root.querySelector("[data-report-generated-on]");
        const bodyNode = root.querySelector("[data-report-body]");

        if (titleNode) titleNode.textContent = mode === "pdf" ? "Purchase Return Report (PDF)" : "Purchase Return Report";
        if (headingNode) headingNode.textContent = mode === "pdf" ? "Purchase Return Report (PDF)" : "Purchase Return Report";
        if (fromNode) fromNode.textContent = fromDateInput.value.trim() || "-";
        if (toNode) toNode.textContent = toDateInput.value.trim() || "-";
        if (supplierNode) supplierNode.textContent = supplierSelect.value || "All Suppliers";
        if (generatedNode) generatedNode.textContent = new Date().toLocaleString();

        if (bodyNode) {
            renderPrintRows(filteredRows, bodyNode);
        }

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
        tableApi.page.len(10).draw(false);
        tableApi.order([1, "desc"]).draw(false);

        populateSuppliers();
        renderRows();

        tableApi.on("draw", renumberRows);

        if (loadButton && loadIcon) {
            loadButton.addEventListener("click", () => {
                loadIcon.classList.add("fa-spin");
                renderRows();
                setTimeout(() => {
                    loadIcon.classList.remove("fa-spin");
                }, 500);
            });
        }

        fromDateInput.addEventListener("change", renderRows);
        toDateInput.addEventListener("change", renderRows);
        supplierSelect.addEventListener("change", renderRows);

        if (printButton) {
            printButton.addEventListener("click", () => {
                openPrintWindow("print");
            });
        }

        if (pdfButton) {
            pdfButton.addEventListener("click", () => {
                openPrintWindow("pdf");
            });
        }
    };

    waitForDataTable();
});

document.addEventListener("datatableLoaded", () => {
    const fromDateInput = document.getElementById("itemWiseReportFromDate");
    const toDateInput = document.getElementById("itemWiseReportToDate");
    const itemSelect = document.getElementById("itemWiseReportItem");
    const loadButton = document.getElementById("itemWiseReportLoadBtn");
    const loadIcon = loadButton ? loadButton.querySelector("i") : null;
    const printButton = document.getElementById("itemWiseReportPrintBtn");
    const pdfButton = document.getElementById("itemWiseReportPdfBtn");
    const tableElement = $(".item-wise-report-table");

    if (!fromDateInput || !toDateInput || !itemSelect || !tableElement.length) {
        return;
    }

    const allRows = [
        {
            item: "Balvenie 25Y",
            purchasedDate: "2082-10-05",
            quantity: 2,
            stockUnit: "Bottle"
        },
        {
            item: "Balvenie 25Y",
            purchasedDate: "2082-10-22",
            quantity: 1,
            stockUnit: "Bottle"
        },
        {
            item: "Balvenie 25Y",
            purchasedDate: "2082-11-14",
            quantity: 3,
            stockUnit: "Bottle"
        },
        {
            item: "Balvenie 25Y",
            purchasedDate: "2082-12-03",
            quantity: 2,
            stockUnit: "Bottle"
        },
        {
            item: "Balvenie 25Y",
            purchasedDate: "2082-12-27",
            quantity: 1,
            stockUnit: "Bottle"
        }
    ];

    let tableApi = null;

    const escapeHtml = (value) => {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const normalizeDate = (value) => {
        const text = String(value || "").trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
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
        const selectedItem = itemSelect.value.trim().toLowerCase();
        const fromDate = fromDateInput.value;
        const toDate = toDateInput.value;

        return allRows.filter((row) => {
            const itemMatched = selectedItem ? String(row.item || "").toLowerCase() === selectedItem : true;
            const dateMatched = matchesDateRange(row.purchasedDate, fromDate, toDate);
            return itemMatched && dateMatched;
        });
    };

    const buildDataTableRow = (row) => {
        return [
            '<span class="item-wise-report-sn">0</span>',
            '<span class="item-wise-report-date">' + escapeHtml(row.purchasedDate || "-") + '</span>',
            '<span class="item-wise-report-qty fw-semibold">' + escapeHtml(String(row.quantity || "-")) + '</span>',
            '<span class="item-wise-report-unit">' + escapeHtml(row.stockUnit || "-") + '</span>'
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;
            if (firstCell) {
                const badge = firstCell.querySelector(".item-wise-report-sn");
                if (badge) {
                    badge.textContent = String(rowIdx + 1);
                }
            }
        });
    };

    const renderRows = () => {
        if (!tableApi) {
            return;
        }

        const rows = getFilteredRows();
        const dataRows = rows.map((row) => buildDataTableRow(row));

        tableApi.clear();

        if (dataRows.length) {
            tableApi.rows.add(dataRows);
        }

        tableApi.draw(false);
        renumberRows();
    };

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
    itemSelect.addEventListener("change", renderRows);

    if (printButton) {
        printButton.addEventListener("click", () => {
            window.print();
        });
    }

    if (pdfButton) {
        pdfButton.addEventListener("click", () => {
            window.print();
        });
    }

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

        renderRows();
        tableApi.on("draw", renumberRows);
    };

    waitForDataTable();
});

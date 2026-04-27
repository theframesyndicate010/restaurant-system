document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "office_expense_entry_list";

    const dateFromInput = document.getElementById("expenseDateFrom");
    const dateToInput = document.getElementById("expenseDateTo");
    const expenseTypeFilter = document.getElementById("expenseTypeFilter");
    const expenseStatusFilter = document.getElementById("expenseStatusFilter");
    const searchInput = document.getElementById("expenseSearch");
    const pageLengthSelect = document.getElementById("expensePageLength");
    const refreshButton = document.getElementById("expenseRefreshBtn");
    const tableElement = $(".expense-report-table");

    const dateTemplate = document.getElementById("expenseDateTemplate");
    const particularsTemplate = document.getElementById("expenseParticularsTemplate");
    const amountTemplate = document.getElementById("expenseAmountTemplate");
    const paymentModeTemplate = document.getElementById("expensePaymentModeTemplate");
    const remarksTemplate = document.getElementById("expenseRemarksTemplate");
    const statusTemplate = document.getElementById("expenseStatusTemplate");
    const actionsTemplate = document.getElementById("expenseActionsTemplate");

    if (!dateFromInput || !dateToInput || !expenseTypeFilter || !expenseStatusFilter || !searchInput ||
        !pageLengthSelect || !refreshButton || !tableElement.length || !dateTemplate || !particularsTemplate ||
        !amountTemplate || !paymentModeTemplate || !remarksTemplate || !statusTemplate || !actionsTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const DEFAULT_FROM_DATE = "10/05/2082";
    const DEFAULT_TO_DATE = "12/30/2082";

    const defaultRows = [
        {
            expenseId: "EXP-1001",
            date: "2082-10-05",
            expenseType: "General Expense",
            particulars: "Office Supplies",
            amount: 2200,
            paymentMode: "Cash",
            remarks: "Stationery purchase",
            status: "Paid"
        },
        {
            expenseId: "EXP-1002",
            date: "2082-10-12",
            expenseType: "Salary Payment",
            particulars: "Cashier",
            amount: 18000,
            paymentMode: "Bank Transfer",
            remarks: "Monthly salary",
            status: "Paid"
        },
        {
            expenseId: "EXP-1003",
            date: "2082-10-18",
            expenseType: "General Expense",
            particulars: "Internet Charges",
            amount: 3500,
            paymentMode: "Online Wallet",
            remarks: "Fiber renewal",
            status: "Pending"
        },
        {
            expenseId: "EXP-1004",
            date: "2082-10-21",
            expenseType: "General Expense",
            particulars: "Maintenance",
            amount: 5100,
            paymentMode: "Cash",
            remarks: "Kitchen repair",
            status: "Cancelled"
        }
    ];

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeStatus = (value) => {
        const status = String(value || "Paid").trim().toLowerCase();
        if (status === "pending") {
            return "Pending";
        }
        if (status === "cancelled") {
            return "Cancelled";
        }
        return "Paid";
    };

    const parseDateLike = (value) => {
        const text = String(value || "").trim();
        if (!text) {
            return null;
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            const parsedIso = new Date(text + "T00:00:00");
            return Number.isNaN(parsedIso.getTime()) ? null : parsedIso;
        }

        const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!slash) {
            return null;
        }

        const month = Number.parseInt(slash[1], 10) - 1;
        const day = Number.parseInt(slash[2], 10);
        const year = Number.parseInt(slash[3], 10);
        const parsed = new Date(year, month, day);

        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const normalizeRecord = (item, index) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        const expenseType = normalizeText(item.expenseType, "General Expense");
        const particulars = normalizeText(
            item.particulars || (expenseType === "Salary Payment" ? item.employee : item.expenseCategory),
            "-"
        );

        const amountNo = Number.parseFloat(String(item.amount || 0));
        const amount = Number.isFinite(amountNo) ? amountNo : 0;

        return {
            expenseId: normalizeText(item.expenseId, "EXP-" + String(1001 + index)),
            date: normalizeText(item.date || item.createdAt, "-"),
            expenseType,
            particulars,
            amount,
            paymentMode: normalizeText(item.paymentMode || item.paymentMethod, "-"),
            remarks: normalizeText(item.remarks, "-"),
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
            const payload = allRows.map((row) => ({
                expenseId: row.expenseId,
                expenseType: row.expenseType,
                employee: row.expenseType === "Salary Payment" ? row.particulars : "",
                expenseCategory: row.expenseType === "General Expense" ? row.particulars : "",
                paymentMethod: row.paymentMode,
                amount: row.amount,
                remarks: row.remarks,
                status: row.status,
                createdAt: row.date
            }));

            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            // Ignore storage write errors.
        }
    };

    const getFilteredRows = () => {
        const fromDate = parseDateLike(dateFromInput.value);
        const toDate = parseDateLike(dateToInput.value);
        const typeFilter = String(expenseTypeFilter.value || "all").trim().toLowerCase();
        const statusFilter = String(expenseStatusFilter.value || "all").trim().toLowerCase();
        const keyword = searchInput.value.trim().toLowerCase();

        return allRows.filter((row) => {
            if (typeFilter !== "all" && row.expenseType.toLowerCase() !== typeFilter) {
                return false;
            }

            if (statusFilter !== "all" && row.status.toLowerCase() !== statusFilter) {
                return false;
            }

            const rowDate = parseDateLike(row.date);
            if (fromDate && rowDate && rowDate < fromDate) {
                return false;
            }

            if (toDate && rowDate && rowDate > toDate) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            const haystack = [
                row.date,
                row.particulars,
                row.amount,
                row.paymentMode,
                row.remarks,
                row.status,
                row.expenseType
            ].join(" ").toLowerCase();

            return haystack.includes(keyword);
        });
    };

    const buildStatusHtml = (status) => {
        const cls = status === "Pending"
            ? "expense-status-pending"
            : status === "Cancelled"
                ? "expense-status-cancelled"
                : "expense-status-paid";

        return renderTemplateHtml(statusTemplate, (fragment) => {
            const node = fragment.querySelector(".expense-status-badge");
            if (!node) {
                return;
            }

            node.textContent = status;
            node.classList.add(cls);
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(dateTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-date");
                if (node) node.textContent = row.date;
            }),
            renderTemplateHtml(particularsTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-particulars");
                if (node) node.textContent = row.particulars;
            }),
            renderTemplateHtml(amountTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-amount");
                if (node) node.textContent = row.amount.toFixed(2);
            }),
            renderTemplateHtml(paymentModeTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-payment-mode");
                if (node) node.textContent = row.paymentMode;
            }),
            renderTemplateHtml(remarksTemplate, (fragment) => {
                const node = fragment.querySelector(".expense-remarks");
                if (node) node.textContent = row.remarks;
            }),
            buildStatusHtml(row.status),
            renderTemplateHtml(actionsTemplate, (fragment) => {
                const deleteBtn = fragment.querySelector(".expense-delete-btn");
                if (deleteBtn) {
                    deleteBtn.setAttribute("data-expense-id", row.expenseId);
                }
            })
        ];
    };

    const renderRows = () => {
        const filteredRows = getFilteredRows();
        const dataRows = filteredRows.map((row) => buildDataTableRow(row));

        tableApi.clear();
        if (dataRows.length) {
            tableApi.rows.add(dataRows);
        }

        tableApi.draw(false);
    };

    const resetFilters = () => {
        dateFromInput.value = DEFAULT_FROM_DATE;
        dateToInput.value = DEFAULT_TO_DATE;
        expenseTypeFilter.value = "all";
        expenseStatusFilter.value = "all";
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
        tableApi.order([0, "desc"]).draw(false);

        allRows = getStoredRows();
        renderRows();

        dateFromInput.addEventListener("input", renderRows);
        dateToInput.addEventListener("input", renderRows);
        expenseTypeFilter.addEventListener("change", renderRows);
        expenseStatusFilter.addEventListener("change", renderRows);
        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(Number.parseInt(pageLengthSelect.value, 10) || 10).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        tableElement.on("click", ".expense-delete-btn", function () {
            const expenseId = this.getAttribute("data-expense-id") || "";
            if (!expenseId) {
                return;
            }

            const item = allRows.find((row) => row.expenseId === expenseId);
            if (!item) {
                return;
            }

            const shouldDelete = window.confirm("Delete expense record " + expenseId + "?");
            if (!shouldDelete) {
                return;
            }

            allRows = allRows.filter((row) => row.expenseId !== expenseId);
            persistRows();
            renderRows();
        });
    };

    waitForDataTable();
});

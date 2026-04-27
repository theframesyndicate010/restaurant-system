document.addEventListener("datatableLoaded", () => {
    const tableElement = $(".stock-movement-table");
    if (!tableElement.length) return;

    const fromDateInput = document.getElementById("stockFromDate");
    const toDateInput = document.getElementById("stockToDate");
    const movementTypeSelect = document.getElementById("stockMovementType");
    const searchInput = document.getElementById("stockSearchInput");
    const pageLengthSelect = document.getElementById("stockPageLength");
    const refreshButton = document.getElementById("stockRefreshFilters");

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        const tableApi = tableElement.DataTable();

        if (pageLengthSelect) {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
        }

        const dateRangeFilter = (settings, data) => {
            if (settings.nTable !== tableElement[0]) return true;

            const dateText = (data[1] || "").trim();
            if (!dateText) return true;

            const rowDate = new Date(dateText + "T00:00:00");
            if (Number.isNaN(rowDate.getTime())) return true;

            const fromValue = fromDateInput && fromDateInput.value
                ? new Date(fromDateInput.value + "T00:00:00")
                : null;
            const toValue = toDateInput && toDateInput.value
                ? new Date(toDateInput.value + "T23:59:59")
                : null;

            if (fromValue && rowDate < fromValue) return false;
            if (toValue && rowDate > toValue) return false;
            return true;
        };

        $.fn.dataTable.ext.search.push(dateRangeFilter);

        if (fromDateInput) {
            fromDateInput.addEventListener("change", () => tableApi.draw());
        }

        if (toDateInput) {
            toDateInput.addEventListener("change", () => tableApi.draw());
        }

        if (movementTypeSelect) {
            movementTypeSelect.addEventListener("change", () => {
                const value = movementTypeSelect.value;
                if (!value) {
                    tableApi.column(3).search("").draw();
                    return;
                }

                const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                tableApi.column(3).search("^" + escaped + "$", true, false).draw();
            });
        }

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                tableApi.search(searchInput.value).draw();
            });
        }

        if (pageLengthSelect) {
            pageLengthSelect.addEventListener("change", () => {
                const size = parseInt(pageLengthSelect.value, 10);
                tableApi.page.len(size).draw();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                if (fromDateInput) fromDateInput.value = "2026-04-01";
                if (toDateInput) toDateInput.value = "2026-04-12";
                if (movementTypeSelect) movementTypeSelect.value = "";
                if (searchInput) searchInput.value = "";
                if (pageLengthSelect) pageLengthSelect.value = "50";

                tableApi.search("");
                tableApi.column(3).search("");
                tableApi.page.len(50).draw();
            });
        }

        tableApi.draw();
    };

    waitForDataTable();
});
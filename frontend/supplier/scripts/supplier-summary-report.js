document.addEventListener("datatableLoaded", () => {
    const supplierSelect = document.getElementById("supplierSummarySupplier");
    const fromDateInput = document.getElementById("supplierSummaryFromDate");
    const toDateInput = document.getElementById("supplierSummaryToDate");
    const rowsSelect = document.getElementById("supplierSummaryRows");
    const searchButton = document.getElementById("supplierSummarySearchBtn");
    const tableElement = $(".supplier-summary-table");

    if (!supplierSelect || !fromDateInput || !toDateInput || !rowsSelect || !searchButton || !tableElement.length) {
        return;
    }

    let tableApi = null;

    const toDateKey = (value) => {
        const text = String(value || "").trim();
        const parts = text.split("-");
        if (parts.length !== 3) return null;

        const year = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10);
        const day = Number.parseInt(parts[2], 10);

        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
            return null;
        }

        return year * 10000 + month * 100 + day;
    };

    const buildSupplierOptions = () => {
        const current = supplierSelect.value;
        const allRows = Array.from(tableElement[0].querySelectorAll("tbody tr[data-supplier]"));

        const suppliers = Array.from(
            new Set(allRows.map((row) => String(row.dataset.supplier || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));

        supplierSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Select Supplier --";
        supplierSelect.appendChild(defaultOption);

        suppliers.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            supplierSelect.appendChild(option);
        });

        if (suppliers.includes(current)) {
            supplierSelect.value = current;
        }
    };

    const supplierDateFilter = (settings, _data, dataIndex) => {
        if (!tableApi) {
            return true;
        }

        if (settings.nTable !== tableApi.table().node()) {
            return true;
        }

        const rowNode = tableApi.row(dataIndex).node();
        if (!rowNode) {
            return true;
        }

        const selectedSupplier = String(supplierSelect.value || "").trim().toLowerCase();
        const fromKey = toDateKey(fromDateInput.value);
        const toKey = toDateKey(toDateInput.value);

        const rowSupplier = String(rowNode.dataset.supplier || "").trim().toLowerCase();
        const rowDateKey = toDateKey(rowNode.dataset.date);

        const matchesSupplier = !selectedSupplier || rowSupplier === selectedSupplier;
        const matchesFrom = !fromKey || !rowDateKey || rowDateKey >= fromKey;
        const matchesTo = !toKey || !rowDateKey || rowDateKey <= toKey;

        return matchesSupplier && matchesFrom && matchesTo;
    };

    const applyFilters = () => {
        if (!tableApi) {
            return;
        }

        const selectedLimit = Number.parseInt(rowsSelect.value, 10);
        const safeLimit = Number.isFinite(selectedLimit) && selectedLimit > 0 ? selectedLimit : 50;

        tableApi.page.len(safeLimit).draw(false);
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        tableApi = tableElement.DataTable();
        tableApi.search("");
        tableApi.columns().search("");
        tableApi.page.len(Number.parseInt(rowsSelect.value, 10) || 50).draw(false);

        $.fn.dataTable.ext.search.push(supplierDateFilter);

        buildSupplierOptions();
        applyFilters();

        searchButton.addEventListener("click", applyFilters);
        rowsSelect.addEventListener("change", applyFilters);
        supplierSelect.addEventListener("change", applyFilters);
        fromDateInput.addEventListener("change", applyFilters);
        toDateInput.addEventListener("change", applyFilters);

        tableElement.on("click", ".supplier-summary-expand", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const row = this.closest("tr[data-supplier]");
            const supplier = row ? String(row.dataset.supplier || "").trim() : "";
            if (!supplier) return;

            window.location.href = "supplier-payment-history.html?supplier=" + encodeURIComponent(supplier);
        });

        window.addEventListener("beforeunload", () => {
            const index = $.fn.dataTable.ext.search.indexOf(supplierDateFilter);
            if (index > -1) {
                $.fn.dataTable.ext.search.splice(index, 1);
            }
        });
    };

    waitForDataTable();
});
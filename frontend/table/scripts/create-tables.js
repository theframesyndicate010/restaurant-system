document.addEventListener("datatableLoaded", () => {
    const tableElement = $(".create-tables-table");
    if (!tableElement.length) return;

    const searchInput = document.getElementById("createTablesSearch");
    const pageLengthSelect = document.getElementById("createTablesPageLength");
    const refreshButton = document.getElementById("createTablesRefresh");

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        const tableApi = tableElement.DataTable();

        if (pageLengthSelect) {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
        }

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                tableApi.search(searchInput.value).draw();
            });
        }

        if (pageLengthSelect) {
            pageLengthSelect.addEventListener("change", () => {
                tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                if (searchInput) {
                    searchInput.value = "";
                }
                if (pageLengthSelect) {
                    pageLengthSelect.value = "50";
                    tableApi.page.len(50);
                }

                tableApi.search("").draw();
            });
        }
    };

    waitForDataTable();
});

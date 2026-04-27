document.addEventListener("datatableLoaded", () => {
    const tableElement = $(".product-status-table");
    if (!tableElement.length) return;

    const categoryFilter = document.getElementById("productStatusCategory");
    const searchInput = document.getElementById("productStatusSearch");
    const sortSelect = document.getElementById("productStatusSort");
    const pageLengthSelect = document.getElementById("productStatusPageLength");
    const refreshButton = document.getElementById("productStatusRefresh");
    const printButton = document.getElementById("productStatusPrint");
    const pdfButton = document.getElementById("productStatusPdf");
    const reportPageTemplate = document.getElementById("productStatusReportPageTemplate");
    const reportRowTemplate = document.getElementById("productStatusReportRowTemplate");
    const reportEmptyRowTemplate = document.getElementById("productStatusReportEmptyRowTemplate");

    if (!reportPageTemplate || !reportRowTemplate || !reportEmptyRowTemplate) return;

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        const tableApi = tableElement.DataTable();

        if (pageLengthSelect) {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
        }

        const tableCategoryFilter = (settings, data, dataIndex) => {
            if (settings.nTable !== tableElement[0]) return true;

            const selectedCategory = categoryFilter ? categoryFilter.value.trim().toLowerCase() : "";
            if (!selectedCategory) return true;

            const rowNode = tableApi.row(dataIndex).node();
            if (!rowNode) return true;

            const rowCategory = (rowNode.getAttribute("data-category") || "").trim().toLowerCase();
            return rowCategory === selectedCategory;
        };

        $.fn.dataTable.ext.search.push(tableCategoryFilter);

        const applySort = () => {
            const value = sortSelect ? sortSelect.value : "all";

            switch (value) {
                case "product_asc":
                    tableApi.order([1, "asc"]).draw();
                    break;
                case "product_desc":
                    tableApi.order([1, "desc"]).draw();
                    break;
                case "qty_asc":
                    tableApi.order([3, "asc"]).draw();
                    break;
                case "qty_desc":
                    tableApi.order([3, "desc"]).draw();
                    break;
                case "valuation_asc":
                    tableApi.order([4, "asc"]).draw();
                    break;
                case "valuation_desc":
                    tableApi.order([4, "desc"]).draw();
                    break;
                case "status":
                    tableApi.order([5, "asc"]).draw();
                    break;
                case "all":
                default:
                    tableApi.order([0, "asc"]).draw();
                    break;
            }
        };

        const applyAllFilters = () => {
            if (searchInput) {
                tableApi.search(searchInput.value).draw();
            } else {
                tableApi.draw();
            }
        };

        if (categoryFilter) {
            categoryFilter.addEventListener("change", applyAllFilters);
        }

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                tableApi.search(searchInput.value).draw();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener("change", applySort);
        }

        if (pageLengthSelect) {
            pageLengthSelect.addEventListener("change", () => {
                tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                if (categoryFilter) categoryFilter.value = "";
                if (searchInput) searchInput.value = "";
                if (sortSelect) sortSelect.value = "all";
                if (pageLengthSelect) pageLengthSelect.value = "50";

                tableApi.search("");
                tableApi.order([0, "asc"]);
                tableApi.page.len(50).draw();
            });
        }

        const openReport = (title) => {
            const rows = tableApi.rows({ search: "applied" }).nodes().toArray().map((rowNode) => {
                const cells = rowNode.querySelectorAll("td");
                return {
                    sn: cells[0] ? cells[0].innerText.trim() : "",
                    product: cells[1] ? cells[1].innerText.trim() : "",
                    code: cells[2] ? cells[2].innerText.trim() : "",
                    quantity: cells[3] ? cells[3].innerText.trim() : "",
                    valuation: cells[4] ? cells[4].innerText.trim() : "",
                    status: cells[5] ? cells[5].innerText.trim() : ""
                };
            });

            const reportWindow = window.open("", "_blank");
            if (!reportWindow) return;

            const selectedCategoryText = categoryFilter && categoryFilter.value
                ? categoryFilter.options[categoryFilter.selectedIndex].text
                : "All Categories";

            const reportFragment = reportPageTemplate.content.cloneNode(true);
            const titleNode = reportFragment.querySelector("[data-report-title]");
            const headingNode = reportFragment.querySelector("[data-report-heading]");
            const categoryNode = reportFragment.querySelector("[data-report-category]");
            const searchNode = reportFragment.querySelector("[data-report-search]");
            const generatedNode = reportFragment.querySelector("[data-report-generated-on]");
            const bodyNode = reportFragment.querySelector("[data-report-body]");

            if (titleNode) titleNode.textContent = title;
            if (headingNode) headingNode.textContent = title;
            if (categoryNode) categoryNode.textContent = selectedCategoryText;
            if (searchNode) searchNode.textContent = searchInput ? (searchInput.value || "-") : "-";
            if (generatedNode) generatedNode.textContent = new Date().toLocaleString();

            if (bodyNode) {
                if (rows.length) {
                    rows.forEach((row) => {
                        const rowFragment = reportRowTemplate.content.cloneNode(true);

                        const snNode = rowFragment.querySelector("[data-col-sn]");
                        const productNode = rowFragment.querySelector("[data-col-product]");
                        const codeNode = rowFragment.querySelector("[data-col-code]");
                        const qtyNode = rowFragment.querySelector("[data-col-qty]");
                        const valuationNode = rowFragment.querySelector("[data-col-valuation]");
                        const statusNode = rowFragment.querySelector("[data-col-status]");

                        if (snNode) snNode.textContent = row.sn;
                        if (productNode) productNode.textContent = row.product;
                        if (codeNode) codeNode.textContent = row.code;
                        if (qtyNode) qtyNode.textContent = row.quantity;
                        if (valuationNode) valuationNode.textContent = row.valuation;
                        if (statusNode) statusNode.textContent = row.status;

                        bodyNode.appendChild(rowFragment);
                    });
                } else {
                    bodyNode.appendChild(reportEmptyRowTemplate.content.cloneNode(true));
                }
            }

            const reportContainer = document.createElement("div");
            reportContainer.appendChild(reportFragment);
            const reportHtml = reportContainer.innerHTML;

            reportWindow.document.open();
            reportWindow.document.write(reportHtml);
            reportWindow.document.close();
            setTimeout(() => reportWindow.print(), 250);
        };

        if (printButton) {
            printButton.addEventListener("click", () => openReport("Product Status - Print View"));
        }

        if (pdfButton) {
            pdfButton.addEventListener("click", () => openReport("Product Status - PDF Export"));
        }

        tableApi.draw();
    };

    waitForDataTable();
});
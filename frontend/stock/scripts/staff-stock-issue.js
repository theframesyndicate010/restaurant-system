document.addEventListener("DOMContentLoaded", () => {
    const newIssueButton = document.getElementById("openNewIssuePage");
    if (!newIssueButton) return;

    newIssueButton.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "add-staff-stock-issue.html";
    });
});

document.addEventListener("datatableLoaded", () => {
    const tableElement = $(".staff-stock-issue-table");
    if (!tableElement.length) return;

    const staffFilter = document.getElementById("staffFilter");
    const issuerFilter = document.getElementById("issuerFilter");
    const fromDateInput = document.getElementById("staffFromDate");
    const toDateInput = document.getElementById("staffToDate");
    const applyFiltersButton = document.getElementById("applyStaffFilters");
    const reportButton = document.getElementById("viewStaffIssueReport");
    const reportPageTemplate = document.getElementById("staffIssueReportPageTemplate");
    const reportRowTemplate = document.getElementById("staffIssueReportRowTemplate");
    const reportEmptyRowTemplate = document.getElementById("staffIssueReportEmptyRowTemplate");

    if (!reportPageTemplate || !reportRowTemplate || !reportEmptyRowTemplate) return;

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const parseDate = (value, endOfDay = false) => {
        if (!value) return null;
        const date = new Date(value + (endOfDay ? "T23:59:59" : "T00:00:00"));
        if (Number.isNaN(date.getTime())) return null;
        return date;
    };

    const formatDateLabel = (value) => {
        const parsed = parseDate(value);
        if (!parsed) return "All";
        return parsed.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        const tableApi = tableElement.DataTable();

        const customFilter = (settings, data, dataIndex) => {
            if (settings.nTable !== tableElement[0]) return true;

            const selectedStaff = (staffFilter ? staffFilter.value : "").trim().toLowerCase();
            if (selectedStaff) {
                const rowStaff = (data[1] || "").trim().toLowerCase();
                if (rowStaff !== selectedStaff) return false;
            }

            const selectedIssuer = (issuerFilter ? issuerFilter.value : "").trim().toLowerCase();
            if (selectedIssuer) {
                const rowNode = tableApi.row(dataIndex).node();
                const rowIssuer = rowNode
                    ? (rowNode.getAttribute("data-issuer") || "").trim().toLowerCase()
                    : "";
                if (rowIssuer !== selectedIssuer) return false;
            }

            const rowDate = parseDate((data[0] || "").trim());
            const fromDate = parseDate(fromDateInput ? fromDateInput.value : "");
            const toDate = parseDate(toDateInput ? toDateInput.value : "", true);

            if (rowDate) {
                if (fromDate && rowDate < fromDate) return false;
                if (toDate && rowDate > toDate) return false;
            }

            return true;
        };

        $.fn.dataTable.ext.search.push(customFilter);

        const applyFilters = () => {
            tableApi.draw();
        };

        if (applyFiltersButton) {
            applyFiltersButton.addEventListener("click", applyFilters);
        }

        [staffFilter, issuerFilter, fromDateInput, toDateInput].forEach((inputEl) => {
            if (!inputEl) return;
            inputEl.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    applyFilters();
                }
            });
        });

        if (reportButton) {
            reportButton.addEventListener("click", () => {
                applyFilters();

                const rows = tableApi.rows({ search: "applied" }).nodes().toArray().map((rowNode) => {
                    const cells = rowNode.querySelectorAll("td");
                    return {
                        dateIssued: cells[0] ? cells[0].innerText.trim() : "",
                        staff: cells[1] ? cells[1].innerText.trim() : "",
                        item: cells[2] ? cells[2].innerText.trim() : "",
                        issuedQty: cells[3] ? cells[3].innerText.trim() : "",
                        addedQty: cells[4] ? cells[4].innerText.trim() : "",
                        returnedQty: cells[5] ? cells[5].innerText.trim() : "",
                        status: cells[6] ? cells[6].innerText.trim() : "",
                        issuer: rowNode.getAttribute("data-issuer") || ""
                    };
                });

                const selectedStaff = staffFilter && staffFilter.value ? staffFilter.value : "All";
                const selectedIssuer = issuerFilter && issuerFilter.value ? issuerFilter.value : "All";
                const fromDateLabel = formatDateLabel(fromDateInput ? fromDateInput.value : "");
                const toDateLabel = formatDateLabel(toDateInput ? toDateInput.value : "");

                const reportWindow = window.open("", "_blank");
                if (!reportWindow) return;

                const reportFragment = reportPageTemplate.content.cloneNode(true);
                const titleNode = reportFragment.querySelector("[data-report-title]");
                const headingNode = reportFragment.querySelector("[data-report-heading]");
                const staffNode = reportFragment.querySelector("[data-report-staff]");
                const issuerNode = reportFragment.querySelector("[data-report-issuer]");
                const fromNode = reportFragment.querySelector("[data-report-from-date]");
                const toNode = reportFragment.querySelector("[data-report-to-date]");
                const generatedNode = reportFragment.querySelector("[data-report-generated-on]");
                const bodyNode = reportFragment.querySelector("[data-report-body]");

                if (titleNode) titleNode.textContent = "Staff Stock Issue Report";
                if (headingNode) headingNode.textContent = "Staff Stock Issue Report";
                if (staffNode) staffNode.textContent = selectedStaff;
                if (issuerNode) issuerNode.textContent = selectedIssuer;
                if (fromNode) fromNode.textContent = fromDateLabel;
                if (toNode) toNode.textContent = toDateLabel;
                if (generatedNode) generatedNode.textContent = new Date().toLocaleString();

                if (bodyNode) {
                    if (rows.length) {
                        rows.forEach((row, index) => {
                            const rowFragment = reportRowTemplate.content.cloneNode(true);

                            const snNode = rowFragment.querySelector("[data-col-sn]");
                            const dateNode = rowFragment.querySelector("[data-col-date-issued]");
                            const staffCell = rowFragment.querySelector("[data-col-staff]");
                            const itemNode = rowFragment.querySelector("[data-col-item]");
                            const issuedNode = rowFragment.querySelector("[data-col-issued-qty]");
                            const addedNode = rowFragment.querySelector("[data-col-added-qty]");
                            const returnedNode = rowFragment.querySelector("[data-col-returned-qty]");
                            const statusNode = rowFragment.querySelector("[data-col-status]");
                            const issuerCell = rowFragment.querySelector("[data-col-issuer]");

                            if (snNode) snNode.textContent = String(index + 1);
                            if (dateNode) dateNode.textContent = row.dateIssued;
                            if (staffCell) staffCell.textContent = row.staff;
                            if (itemNode) itemNode.textContent = row.item;
                            if (issuedNode) issuedNode.textContent = row.issuedQty;
                            if (addedNode) addedNode.textContent = row.addedQty;
                            if (returnedNode) returnedNode.textContent = row.returnedQty;
                            if (statusNode) statusNode.textContent = row.status;
                            if (issuerCell) issuerCell.textContent = row.issuer;

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
            });
        }

        tableApi.draw();
    };

    waitForDataTable();
});
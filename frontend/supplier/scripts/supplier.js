document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "supplier_master_list";

    const addButton = document.getElementById("addSupplierBtn");
    const searchInput = document.getElementById("supplierSearch");
    const pageLengthSelect = document.getElementById("supplierPageLength");
    const refreshButton = document.getElementById("supplierRefreshBtn");
    const tableElement = $(".supplier-table");

    const snTemplate = document.getElementById("supplierCellSnTemplate");
    const nameTemplate = document.getElementById("supplierCellNameTemplate");
    const addressTemplate = document.getElementById("supplierCellAddressTemplate");
    const contactTemplate = document.getElementById("supplierCellContactTemplate");
    const statusTemplate = document.getElementById("supplierCellStatusTemplate");
    const actionsTemplate = document.getElementById("supplierCellActionsTemplate");

    if (!addButton || !searchInput || !pageLengthSelect || !refreshButton || !tableElement.length ||
        !snTemplate || !nameTemplate || !addressTemplate || !contactTemplate || !statusTemplate || !actionsTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const defaultRows = [
        {
            supplierId: "SUP-1001",
            name: "Varities Kirana",
            address: "BTM",
            contactNo: "9812345678",
            status: "enabled"
        },
        {
            supplierId: "SUP-1002",
            name: "birtamod kirana",
            address: "btm",
            contactNo: "9744321234",
            status: "enabled"
        },
        {
            supplierId: "SUP-1003",
            name: "Bishal vegetables",
            address: "birtamode",
            contactNo: "9898982569",
            status: "enabled"
        },
        {
            supplierId: "SUP-1004",
            name: "Ritik and sons",
            address: "jhapa road",
            contactNo: "1234569870",
            status: "enabled"
        },
        {
            supplierId: "SUP-1005",
            name: "Metro Agro Link",
            address: "charpane",
            contactNo: "9801987654",
            status: "disabled"
        }
    ];

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeContact = (value) => {
        const text = String(value || "").replace(/[^\d+\-\s()]/g, "").trim();
        return text || "-";
    };

    const normalizeStatus = (value) => {
        const status = String(value || "").trim().toLowerCase();
        return status === "disabled" ? "disabled" : "enabled";
    };

    const normalizeRecord = (item, index) => {
        if (!item || typeof item !== "object") return null;

        return {
            supplierId: normalizeText(item.supplierId, "SUP-" + String(1001 + index)),
            name: normalizeText(item.name, "Unknown Supplier"),
            address: normalizeText(item.address, "-"),
            contactNo: normalizeContact(item.contactNo),
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
            if (!raw) return fallback;

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return fallback;

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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allRows));
        } catch (error) {
            // Ignore storage write errors.
        }
    };

    const getFilteredRows = () => {
        const keyword = searchInput.value.trim().toLowerCase();

        if (!keyword) return allRows;

        return allRows.filter((row) => {
            const haystack = (row.name + " " + row.address + " " + row.contactNo + " " + row.status).toLowerCase();
            return haystack.includes(keyword);
        });
    };

    const buildStatusHtml = (status) => {
        const isEnabled = status === "enabled";
        const text = isEnabled ? "Enabled" : "Disabled";
        const cls = isEnabled ? "supplier-status-enabled" : "supplier-status-disabled";

        return renderTemplateHtml(statusTemplate, (fragment) => {
            const badge = fragment.querySelector(".supplier-status-badge");
            if (!badge) return;
            badge.textContent = text;
            badge.classList.add(cls);
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-sn");
                if (node) node.textContent = "0";
            }),
            renderTemplateHtml(nameTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-name");
                if (node) node.textContent = row.name;
            }),
            renderTemplateHtml(addressTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-address");
                if (node) node.textContent = row.address;
            }),
            renderTemplateHtml(contactTemplate, (fragment) => {
                const node = fragment.querySelector(".supplier-contact");
                if (node) node.textContent = row.contactNo;
            }),
            buildStatusHtml(row.status),
            renderTemplateHtml(actionsTemplate, (fragment) => {
                fragment.querySelectorAll(".action-btn").forEach((button) => {
                    button.setAttribute("data-supplier-id", row.supplierId);
                });

                const toggleBtn = fragment.querySelector(".supplier-toggle-btn");
                const toggleIcon = fragment.querySelector(".supplier-toggle-btn i");

                if (toggleBtn) {
                    toggleBtn.setAttribute("data-status", row.status);
                    toggleBtn.setAttribute("title", row.status === "enabled" ? "Disable" : "Enable");
                }

                if (toggleIcon) {
                    toggleIcon.className = row.status === "enabled"
                        ? "fa-regular fa-thumbs-down"
                        : "fa-regular fa-thumbs-up";
                }
            })
        ];
    };

    const renumberRows = () => {
        tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
            const node = this.node();
            const firstCell = node ? node.querySelector("td") : null;

            if (!firstCell) return;
            const badge = firstCell.querySelector(".supplier-sn");
            if (badge) badge.textContent = String(rowIdx + 1);
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

    const openSupplierDetail = (supplierId) => {
        const item = allRows.find((row) => row.supplierId === supplierId);
        if (!item) return;
        alert("Open supplier detail: " + item.name + ".");
    };

    const resetFilters = () => {
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
        tableApi.order([1, "asc"]).draw(false);

        allRows = getStoredRows();
        persistRows();
        renderRows();

        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);

        addButton.addEventListener("click", () => {
            window.location.href = "add-supplier.html";
        });

        tableElement.on("click", "tbody tr", function (event) {
            if ($(event.target).closest(".action-btn").length) return;

            const viewButton = this.querySelector(".supplier-view-btn");
            const supplierId = viewButton ? viewButton.getAttribute("data-supplier-id") : "";
            openSupplierDetail(supplierId);
        });

        tableElement.on("click", ".supplier-view-btn", function () {
            const supplierId = this.getAttribute("data-supplier-id") || "";
            openSupplierDetail(supplierId);
        });

        tableElement.on("click", ".supplier-edit-btn", function () {
            const supplierId = this.getAttribute("data-supplier-id") || "";
            const item = allRows.find((row) => row.supplierId === supplierId);
            if (!item) return;
            alert("Open edit form for: " + item.name + ".");
        });

        tableElement.on("click", ".supplier-delete-btn", function () {
            const supplierId = this.getAttribute("data-supplier-id") || "";
            const item = allRows.find((row) => row.supplierId === supplierId);
            if (!item) return;

            const shouldDelete = confirm("Delete supplier " + item.name + "?");
            if (!shouldDelete) return;

            allRows = allRows.filter((row) => row.supplierId !== supplierId);
            persistRows();
            renderRows();
        });

        tableElement.on("click", ".supplier-toggle-btn", function () {
            const supplierId = this.getAttribute("data-supplier-id") || "";
            const rowIndex = allRows.findIndex((row) => row.supplierId === supplierId);
            if (rowIndex < 0) return;

            allRows[rowIndex].status = allRows[rowIndex].status === "enabled" ? "disabled" : "enabled";
            persistRows();
            renderRows();
        });

        tableApi.on("draw", () => {
            renumberRows();
        });
    };

    waitForDataTable();
});

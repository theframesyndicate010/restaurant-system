document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "staff_role_master_list";

    const addButton = document.getElementById("addRoleBtn");
    const searchInput = document.getElementById("roleSearch");
    const pageLengthSelect = document.getElementById("rolePageLength");
    const refreshButton = document.getElementById("roleRefreshBtn");
    const tableElement = $(".roles-table");

    const snTemplate = document.getElementById("roleCellSnTemplate");
    const nameTemplate = document.getElementById("roleCellNameTemplate");
    const statusTemplate = document.getElementById("roleCellStatusTemplate");
    const actionsTemplate = document.getElementById("roleCellActionsTemplate");

    if (!addButton || !searchInput || !pageLengthSelect || !refreshButton || !tableElement.length ||
        !snTemplate || !nameTemplate || !statusTemplate || !actionsTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const defaultRows = [
        {
            roleId: "ROL-1001",
            name: "Cashier",
            status: "enabled"
        },
        {
            roleId: "ROL-1002",
            name: "Waiter",
            status: "enabled"
        },
        {
            roleId: "ROL-1003",
            name: "Admin",
            status: "enabled"
        }
    ];

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeStatus = (value) => {
        const status = String(value || "").trim().toLowerCase();
        return status === "disabled" ? "disabled" : "enabled";
    };

    const normalizeRecord = (item, index) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        const permissions = Array.isArray(item.permissions)
            ? item.permissions
            : [];

        return {
            roleId: normalizeText(item.roleId, "ROL-" + String(1001 + index)),
            name: normalizeText(item.name, "Untitled Role"),
            status: normalizeStatus(item.status),
            permissions,
            createdAt: normalizeText(item.createdAt, ""),
            updatedAt: normalizeText(item.updatedAt, "")
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allRows));
        } catch (error) {
            // Ignore storage write errors.
        }
    };

    const getFilteredRows = () => {
        const keyword = searchInput.value.trim().toLowerCase();

        if (!keyword) {
            return allRows;
        }

        return allRows.filter((row) => {
            const haystack = (row.name + " " + row.status).toLowerCase();
            return haystack.includes(keyword);
        });
    };

    const buildStatusHtml = (status) => {
        const isEnabled = status === "enabled";
        const text = isEnabled ? "Enabled" : "Disabled";
        const cls = isEnabled ? "role-status-enabled" : "role-status-disabled";

        return renderTemplateHtml(statusTemplate, (fragment) => {
            const badge = fragment.querySelector(".role-status-badge");
            if (!badge) {
                return;
            }

            badge.textContent = text;
            badge.classList.add(cls);
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const node = fragment.querySelector(".role-sn");
                if (node) {
                    node.textContent = "0";
                }
            }),
            renderTemplateHtml(nameTemplate, (fragment) => {
                const node = fragment.querySelector(".role-name");
                if (node) {
                    node.textContent = row.name;
                }
            }),
            buildStatusHtml(row.status),
            renderTemplateHtml(actionsTemplate, (fragment) => {
                fragment.querySelectorAll(".action-btn").forEach((button) => {
                    button.setAttribute("data-role-id", row.roleId);
                });

                const toggleBtn = fragment.querySelector(".role-toggle-btn");
                const toggleIcon = fragment.querySelector(".role-toggle-btn i");

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

            if (!firstCell) {
                return;
            }

            const badge = firstCell.querySelector(".role-sn");
            if (badge) {
                badge.textContent = String(rowIdx + 1);
            }
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

    const resetFilters = () => {
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
        tableApi.order([1, "asc"]).draw(false);

        allRows = getStoredRows();
        persistRows();
        renderRows();

        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(Number.parseInt(pageLengthSelect.value, 10) || 10).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);
        addButton.addEventListener("click", () => {
            window.location.href = "add-role.html";
        });

        tableElement.on("click", ".role-edit-btn", function () {
            const roleId = this.getAttribute("data-role-id") || "";
            const rowIndex = allRows.findIndex((row) => row.roleId === roleId);
            if (rowIndex < 0) {
                return;
            }

            const entered = window.prompt("Edit role name:", allRows[rowIndex].name);
            const name = String(entered || "").trim();
            if (!name) {
                return;
            }

            const duplicate = allRows.some((row, index) => index !== rowIndex && row.name.toLowerCase() === name.toLowerCase());
            if (duplicate) {
                window.alert("Role name already exists.");
                return;
            }

            allRows[rowIndex].name = name;
            persistRows();
            renderRows();
        });

        tableElement.on("click", ".role-delete-btn", function () {
            const roleId = this.getAttribute("data-role-id") || "";
            const item = allRows.find((row) => row.roleId === roleId);
            if (!item) {
                return;
            }

            const shouldDelete = window.confirm("Delete role " + item.name + "?");
            if (!shouldDelete) {
                return;
            }

            allRows = allRows.filter((row) => row.roleId !== roleId);
            persistRows();
            renderRows();
        });

        tableElement.on("click", ".role-toggle-btn", function () {
            const roleId = this.getAttribute("data-role-id") || "";
            const rowIndex = allRows.findIndex((row) => row.roleId === roleId);
            if (rowIndex < 0) {
                return;
            }

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
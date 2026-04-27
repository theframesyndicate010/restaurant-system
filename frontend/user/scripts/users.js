document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "staff_user_master_list";

    const addButton = document.getElementById("addUserBtn");
    const statusFilter = document.getElementById("userStatusFilter");
    const searchInput = document.getElementById("userSearch");
    const pageLengthSelect = document.getElementById("userPageLength");
    const refreshButton = document.getElementById("userRefreshBtn");
    const tableElement = $(".users-table");

    const nameTemplate = document.getElementById("userCellNameTemplate");
    const address1Template = document.getElementById("userCellAddress1Template");
    const address2Template = document.getElementById("userCellAddress2Template");
    const contactTemplate = document.getElementById("userCellContactTemplate");
    const emailTemplate = document.getElementById("userCellEmailTemplate");
    const dateTemplate = document.getElementById("userCellDateTemplate");
    const usernameTemplate = document.getElementById("userCellUsernameTemplate");
    const roleTemplate = document.getElementById("userCellRoleTemplate");
    const statusTemplate = document.getElementById("userCellStatusTemplate");
    const actionsTemplate = document.getElementById("userCellActionsTemplate");

    if (!addButton || !statusFilter || !searchInput || !pageLengthSelect || !refreshButton || !tableElement.length ||
        !nameTemplate || !address1Template || !address2Template || !contactTemplate || !emailTemplate ||
        !dateTemplate || !usernameTemplate || !roleTemplate || !statusTemplate || !actionsTemplate) {
        return;
    }

    let tableApi = null;
    let allRows = [];

    const defaultRows = [
        {
            userId: "USR-1001",
            fullName: "Admin",
            address1: "BTM",
            address2: "",
            contact: "9800000000,",
            email: "admin@gmail.com",
            createdDate: "2081-09-17",
            username: "admin",
            role: "Admin",
            status: "enabled"
        },
        {
            userId: "USR-1002",
            fullName: "waiter",
            address1: "birtamode",
            address2: "",
            contact: "1234567892,",
            email: "waiter@gmail.com",
            createdDate: "2082-09-18",
            username: "waiter",
            role: "Waiter",
            status: "enabled"
        },
        {
            userId: "USR-1003",
            fullName: "Cashier",
            address1: "birtamode",
            address2: "",
            contact: "12398745660,",
            email: "cahier@gmail.com",
            createdDate: "2082-09-18",
            username: "cashier",
            role: "Cashier",
            status: "enabled"
        }
    ];

    const normalizeText = (value, fallback = "") => {
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

        return {
            userId: normalizeText(item.userId, "USR-" + String(1001 + index)),
            fullName: normalizeText(item.fullName || item.name, "Unknown"),
            address1: normalizeText(item.address1 || item.primaryAddress, ""),
            address2: normalizeText(item.address2 || item.secondaryAddress, ""),
            contact: normalizeText(item.contact || item.primaryContact, ""),
            email: normalizeText(item.email || item.emailAddress, ""),
            createdDate: normalizeText(item.createdDate, ""),
            username: normalizeText(item.username, ""),
            role: normalizeText(item.role || item.roles, ""),
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allRows));
        } catch (error) {
            // Ignore storage write errors.
        }
    };

    const getFilteredRows = () => {
        const keyword = searchInput.value.trim().toLowerCase();
        const selectedStatus = String(statusFilter.value || "").trim().toLowerCase();

        return allRows.filter((row) => {
            const matchesStatus = !selectedStatus || row.status === selectedStatus;

            if (!matchesStatus) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            const haystack = [
                row.fullName,
                row.address1,
                row.address2,
                row.contact,
                row.email,
                row.createdDate,
                row.username,
                row.role,
                row.status
            ].join(" ").toLowerCase();

            return haystack.includes(keyword);
        });
    };

    const buildStatusHtml = (status) => {
        const isEnabled = status === "enabled";
        const text = isEnabled ? "Enabled" : "Disabled";
        const cls = isEnabled ? "user-status-enabled" : "user-status-disabled";

        return renderTemplateHtml(statusTemplate, (fragment) => {
            const badge = fragment.querySelector(".user-status-badge");
            if (!badge) {
                return;
            }

            badge.textContent = text;
            badge.classList.add(cls);
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(nameTemplate, (fragment) => {
                const node = fragment.querySelector(".user-full-name");
                if (node) node.textContent = row.fullName;
            }),
            renderTemplateHtml(address1Template, (fragment) => {
                const node = fragment.querySelector(".user-address1");
                if (node) node.textContent = row.address1;
            }),
            renderTemplateHtml(address2Template, (fragment) => {
                const node = fragment.querySelector(".user-address2");
                if (node) node.textContent = row.address2;
            }),
            renderTemplateHtml(contactTemplate, (fragment) => {
                const node = fragment.querySelector(".user-contact");
                if (node) node.textContent = row.contact;
            }),
            renderTemplateHtml(emailTemplate, (fragment) => {
                const node = fragment.querySelector(".user-email");
                if (node) node.textContent = row.email;
            }),
            renderTemplateHtml(dateTemplate, (fragment) => {
                const node = fragment.querySelector(".user-created-date");
                if (node) node.textContent = row.createdDate;
            }),
            renderTemplateHtml(usernameTemplate, (fragment) => {
                const node = fragment.querySelector(".user-username");
                if (node) node.textContent = row.username;
            }),
            renderTemplateHtml(roleTemplate, (fragment) => {
                const node = fragment.querySelector(".user-role");
                if (node) node.textContent = row.role;
            }),
            buildStatusHtml(row.status),
            renderTemplateHtml(actionsTemplate, (fragment) => {
                fragment.querySelectorAll(".action-btn").forEach((button) => {
                    button.setAttribute("data-user-id", row.userId);
                });

                const toggleBtn = fragment.querySelector(".user-toggle-btn");
                const toggleIcon = fragment.querySelector(".user-toggle-btn i");

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
        statusFilter.value = "enabled";
        searchInput.value = "";
        pageLengthSelect.value = "10";

        tableApi.search("");
        tableApi.columns().search("");
        tableApi.page.len(10);

        renderRows();
    };

    const openAddUserPage = () => {
        window.location.href = "add-user.html";
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
        tableApi.order([0, "asc"]).draw(false);

        allRows = getStoredRows();
        persistRows();
        renderRows();

        statusFilter.addEventListener("change", renderRows);
        searchInput.addEventListener("input", renderRows);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(Number.parseInt(pageLengthSelect.value, 10) || 10).draw(false);
        });

        refreshButton.addEventListener("click", resetFilters);
        addButton.addEventListener("click", openAddUserPage);

        tableElement.on("click", ".user-edit-btn", function () {
            const userId = this.getAttribute("data-user-id") || "";
            const rowIndex = allRows.findIndex((row) => row.userId === userId);
            if (rowIndex < 0) {
                return;
            }

            const fullName = normalizeText(window.prompt("Edit full name:", allRows[rowIndex].fullName), allRows[rowIndex].fullName);
            const username = normalizeText(window.prompt("Edit username:", allRows[rowIndex].username), allRows[rowIndex].username);
            const role = normalizeText(window.prompt("Edit role:", allRows[rowIndex].role), allRows[rowIndex].role);

            const duplicate = allRows.some((row, index) => index !== rowIndex && row.username.toLowerCase() === username.toLowerCase());
            if (duplicate) {
                window.alert("Username already exists.");
                return;
            }

            allRows[rowIndex].fullName = fullName;
            allRows[rowIndex].username = username;
            allRows[rowIndex].role = role;

            persistRows();
            renderRows();
        });

        tableElement.on("click", ".user-password-btn", function () {
            const userId = this.getAttribute("data-user-id") || "";
            const item = allRows.find((row) => row.userId === userId);
            if (!item) {
                return;
            }

            window.alert("Password reset initiated for " + item.username + ".");
        });

        tableElement.on("click", ".user-delete-btn", function () {
            const userId = this.getAttribute("data-user-id") || "";
            const item = allRows.find((row) => row.userId === userId);
            if (!item) {
                return;
            }

            const shouldDelete = window.confirm("Delete user " + item.username + "?");
            if (!shouldDelete) {
                return;
            }

            allRows = allRows.filter((row) => row.userId !== userId);
            persistRows();
            renderRows();
        });

        tableElement.on("click", ".user-toggle-btn", function () {
            const userId = this.getAttribute("data-user-id") || "";
            const rowIndex = allRows.findIndex((row) => row.userId === userId);
            if (rowIndex < 0) {
                return;
            }

            allRows[rowIndex].status = allRows[rowIndex].status === "enabled" ? "disabled" : "enabled";
            persistRows();
            renderRows();
        });
    };

    waitForDataTable();
});
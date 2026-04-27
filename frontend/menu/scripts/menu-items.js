document.addEventListener("datatableLoaded", () => {
    const STORAGE_KEY = "menu_item_master_list";
    const defaultItems = [
        {
            name: "Chicken Momo",
            displayName: "Steam Momo",
            shortName: "CMO",
            menuUnit: "Plate",
            menuRate: 320,
            menuCategory: "Kitchen",
            status: "Active"
        },
        {
            name: "Virgin Mojito",
            displayName: "Mint Mojito",
            shortName: "VMJ",
            menuUnit: "Glass",
            menuRate: 280,
            menuCategory: "Bar",
            status: "Active"
        },
        {
            name: "Espresso Shot",
            displayName: "Espresso",
            shortName: "ESP",
            menuUnit: "Cup",
            menuRate: 190,
            menuCategory: "Bar",
            status: "Active"
        },
        {
            name: "Veg Club Sandwich",
            displayName: "Club Sandwich",
            shortName: "VCS",
            menuUnit: "Piece",
            menuRate: 240,
            menuCategory: "Counter",
            status: "Inactive"
        }
    ];

    const tableElement = $(".menu-items-table");
    if (!tableElement.length) return;

    const bulkEditButton = document.getElementById("menuItemsBulkEditBtn");
    const searchInput = document.getElementById("menuItemsSearch");
    const categoryFilter = document.getElementById("menuItemsCategoryFilter");
    const pageLengthSelect = document.getElementById("menuItemsPageLength");
    const refreshButton = document.getElementById("menuItemsRefresh");
    const printButton = document.getElementById("menuItemsPrint");
    const pdfButton = document.getElementById("menuItemsPdf");
    const snTemplate = document.getElementById("menuItemsSnTemplate");
    const strongTextTemplate = document.getElementById("menuItemsStrongTextTemplate");
    const textTemplate = document.getElementById("menuItemsTextTemplate");
    const rateTemplate = document.getElementById("menuItemsRateTemplate");
    const statusTemplate = document.getElementById("menuItemsStatusTemplate");
    const actionsTemplate = document.getElementById("menuItemsActionsTemplate");
    const reportPageTemplate = document.getElementById("menuItemsReportPageTemplate");
    const reportRowTemplate = document.getElementById("menuItemsReportRowTemplate");
    const reportEmptyRowTemplate = document.getElementById("menuItemsReportEmptyRowTemplate");

    if (!snTemplate || !strongTextTemplate || !textTemplate || !rateTemplate || !statusTemplate || !actionsTemplate || !reportPageTemplate || !reportRowTemplate || !reportEmptyRowTemplate) {
        return;
    }

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const toTitleCase = (value) => {
        return String(value)
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
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

    const normalizeStatus = (value) => {
        return String(value).trim().toLowerCase() === "inactive" ? "Inactive" : "Active";
    };

    const normalizeMenuItem = (item) => {
        if (!item || typeof item !== "object") return null;

        const name = typeof item.name === "string" ? item.name.trim() : "";
        if (!name) return null;

        const displayName = typeof item.displayName === "string" && item.displayName.trim()
            ? item.displayName.trim()
            : toTitleCase(name);

        const shortName = typeof item.shortName === "string" && item.shortName.trim()
            ? item.shortName.trim()
            : name.slice(0, 3).toUpperCase();

        const menuUnit = typeof item.menuUnit === "string" && item.menuUnit.trim()
            ? item.menuUnit.trim()
            : "Plate";

        const parsedRate = parseFloat(item.menuRate);
        const menuRate = Number.isFinite(parsedRate) && parsedRate >= 0 ? parsedRate : 0;

        const menuCategory = typeof item.menuCategory === "string" && item.menuCategory.trim()
            ? item.menuCategory.trim()
            : "Kitchen";

        const status = normalizeStatus(item.status || "Active");

        return {
            name,
            displayName,
            shortName,
            menuUnit,
            menuRate,
            menuCategory,
            status
        };
    };

    const sortItems = (items) => {
        items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    };

    const getStoredItems = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
                sortItems(initial);
                return initial;
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
                sortItems(initial);
                return initial;
            }

            const seen = new Set();
            const cleaned = [];

            parsed.forEach((item) => {
                const normalized = normalizeMenuItem(item);
                if (!normalized) return;

                const key = normalized.name.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                cleaned.push(normalized);
            });

            if (!cleaned.length) {
                const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
                sortItems(initial);
                return initial;
            }

            sortItems(cleaned);
            return cleaned;
        } catch (error) {
            const initial = defaultItems.map((item) => normalizeMenuItem(item)).filter(Boolean);
            sortItems(initial);
            return initial;
        }
    };

    const saveItems = (items) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    };

    const statusHtml = (status) => {
        const normalized = normalizeStatus(status);
        return renderTemplateHtml(statusTemplate, (fragment) => {
            const statusNode = fragment.querySelector(".menu-item-status");
            if (!statusNode) return;

            statusNode.classList.add(normalized === "Inactive" ? "is-inactive" : "is-active");
            statusNode.textContent = normalized;
        });
    };

    const actionButtonsHtml = () => {
        return renderTemplateHtml(actionsTemplate);
    };

    const buildRow = (item) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const snNode = fragment.querySelector(".sn-badge");
                if (snNode) snNode.textContent = "0";
            }),
            renderTemplateHtml(strongTextTemplate, (fragment) => {
                const node = fragment.querySelector(".fw-medium");
                if (node) node.textContent = item.name;
            }),
            renderTemplateHtml(strongTextTemplate, (fragment) => {
                const node = fragment.querySelector(".fw-medium");
                if (node) node.textContent = item.displayName;
            }),
            renderTemplateHtml(textTemplate, (fragment) => {
                const node = fragment.querySelector(".text-dark");
                if (node) node.textContent = item.shortName;
            }),
            renderTemplateHtml(textTemplate, (fragment) => {
                const node = fragment.querySelector(".text-dark");
                if (node) node.textContent = item.menuUnit;
            }),
            renderTemplateHtml(rateTemplate, (fragment) => {
                const node = fragment.querySelector(".fw-semibold");
                if (node) node.textContent = "Rs. " + item.menuRate.toFixed(2);
            }),
            renderTemplateHtml(textTemplate, (fragment) => {
                const node = fragment.querySelector(".text-dark");
                if (node) node.textContent = item.menuCategory;
            }),
            statusHtml(item.status),
            actionButtonsHtml()
        ];
    };

    const cellText = (value) => {
        const container = document.createElement("div");
        container.innerHTML = String(value || "");
        return (container.textContent || "").trim();
    };

    const rowToMenuItem = (rowData) => {
        const rateText = cellText(rowData[5]).replace(/[^0-9.]/g, "");
        const parsedRate = parseFloat(rateText);

        return {
            name: cellText(rowData[1]),
            displayName: cellText(rowData[2]),
            shortName: cellText(rowData[3]),
            menuUnit: cellText(rowData[4]),
            menuRate: Number.isFinite(parsedRate) ? parsedRate : 0,
            menuCategory: cellText(rowData[6]),
            status: normalizeStatus(cellText(rowData[7]))
        };
    };

    const waitForDataTable = () => {
        if (!$.fn.DataTable.isDataTable(tableElement[0])) {
            setTimeout(waitForDataTable, 80);
            return;
        }

        const tableApi = tableElement.DataTable();
        const editableColumns = new Set([1, 2, 3, 4, 5, 6, 7]);
        const bulkButtonIcon = bulkEditButton ? bulkEditButton.querySelector("i") : null;
        const bulkButtonLabel = bulkEditButton ? bulkEditButton.querySelector(".menu-items-bulk-label") : null;

        let isBulkEditMode = false;
        let activeEditor = null;

        const renumberRows = () => {
            tableApi.rows({ search: "applied", order: "applied" }).every(function (rowIdx) {
                const node = this.node();
                const firstCell = node ? node.querySelector("td") : null;
                if (firstCell) {
                    const snNode = firstCell.querySelector(".sn-badge");
                    if (snNode) {
                        snNode.textContent = String(rowIdx + 1);
                    }
                }
            });
        };

        const getItemsFromTable = () => {
            const items = [];
            tableApi.rows().data().toArray().forEach((rowItem) => {
                const parsed = normalizeMenuItem(rowToMenuItem(rowItem));
                if (parsed) {
                    items.push(parsed);
                }
            });
            sortItems(items);
            return items;
        };

        const renderItems = (items) => {
            tableApi.clear();
            tableApi.rows.add(items.map((item) => buildRow(item))).draw(false);
            renumberRows();
        };

        const seedData = () => {
            const items = getStoredItems();
            renderItems(items);
            saveItems(items);
        };

        const setBulkButtonState = (saveMode) => {
            if (!bulkEditButton) return;

            if (saveMode) {
                bulkEditButton.classList.add("is-save-mode");
                if (bulkButtonIcon) {
                    bulkButtonIcon.className = "fa-solid fa-floppy-disk";
                }
                if (bulkButtonLabel) {
                    bulkButtonLabel.textContent = "Save";
                }
                return;
            }

            bulkEditButton.classList.remove("is-save-mode");
            if (bulkButtonIcon) {
                bulkButtonIcon.className = "fa-solid fa-plus";
            }
            if (bulkButtonLabel) {
                bulkButtonLabel.textContent = "Bulk Edit";
            }
        };

        const updateBulkEditClass = () => {
            tableElement.toggleClass("bulk-edit-mode", isBulkEditMode);
        };

        const getCategoryOptions = () => {
            const options = new Set(["Kitchen", "Bar", "Counter"]);

            if (categoryFilter) {
                Array.from(categoryFilter.options).forEach((option) => {
                    const value = option.value.trim();
                    if (value) options.add(value);
                });
            }

            tableApi.rows().data().toArray().forEach((rowData) => {
                const category = cellText(rowData[6]);
                if (category) options.add(category);
            });

            return Array.from(options);
        };

        const cellHtmlForColumn = (columnIndex, value) => {
            if (columnIndex === 1 || columnIndex === 2) {
                return renderTemplateHtml(strongTextTemplate, (fragment) => {
                    const node = fragment.querySelector(".fw-medium");
                    if (node) node.textContent = value;
                });
            }

            if (columnIndex === 3 || columnIndex === 4 || columnIndex === 6) {
                return renderTemplateHtml(textTemplate, (fragment) => {
                    const node = fragment.querySelector(".text-dark");
                    if (node) node.textContent = value;
                });
            }

            if (columnIndex === 5) {
                const parsedRate = parseFloat(value);
                const rate = Number.isFinite(parsedRate) && parsedRate >= 0 ? parsedRate : 0;
                return renderTemplateHtml(rateTemplate, (fragment) => {
                    const node = fragment.querySelector(".fw-semibold");
                    if (node) node.textContent = "Rs. " + rate.toFixed(2);
                });
            }

            if (columnIndex === 7) {
                return statusHtml(value);
            }

            return escapeHtml(value);
        };

        const validateItemNameUniqueness = (items) => {
            const seen = new Set();

            for (const item of items) {
                const key = item.name.toLowerCase();
                if (seen.has(key)) {
                    alert("Duplicate menu item names are not allowed.");
                    return false;
                }
                seen.add(key);
            }

            return true;
        };

        const stopCellEditing = (saveChanges) => {
            if (!activeEditor) return true;

            const { cellNode, columnIndex, editor, originalHtml } = activeEditor;
            const cellApi = tableApi.cell(cellNode);

            const cleanup = () => {
                cellNode.classList.remove("bulk-cell-editing");
                activeEditor = null;
            };

            if (!saveChanges) {
                cellApi.data(originalHtml);
                cleanup();
                return true;
            }

            let nextValue = (editor.value || "").trim();

            if (columnIndex === 5) {
                const parsedRate = parseFloat(nextValue);
                if (!Number.isFinite(parsedRate) || parsedRate < 0) {
                    alert("Menu rate must be a valid non-negative number.");
                    editor.focus();
                    if (typeof editor.select === "function") editor.select();
                    return false;
                }

                cellApi.data(cellHtmlForColumn(columnIndex, parsedRate));
                cleanup();
                return true;
            }

            if (columnIndex === 7) {
                nextValue = normalizeStatus(nextValue || "Active");
                cellApi.data(cellHtmlForColumn(columnIndex, nextValue));
                cleanup();
                return true;
            }

            if (!nextValue) {
                alert("This field cannot be empty.");
                editor.focus();
                if (typeof editor.select === "function") editor.select();
                return false;
            }

            cellApi.data(cellHtmlForColumn(columnIndex, nextValue));
            cleanup();
            return true;
        };

        const startCellEditor = (cellNode) => {
            if (!isBulkEditMode) return;

            const cellIndex = tableApi.cell(cellNode).index();
            if (!cellIndex) return;

            const columnIndex = cellIndex.column;
            if (!editableColumns.has(columnIndex)) return;

            if (activeEditor && activeEditor.cellNode === cellNode) return;
            if (!stopCellEditing(true)) return;

            const cellApi = tableApi.cell(cellNode);
            const originalHtml = cellApi.data();
            const currentText = cellText(originalHtml);

            let editor;

            if (columnIndex === 6 || columnIndex === 7) {
                editor = document.createElement("select");
                editor.className = "form-select form-select-sm bulk-inline-editor";

                const options = columnIndex === 6 ? getCategoryOptions() : ["Active", "Inactive"];
                options.forEach((optionValue) => {
                    const option = document.createElement("option");
                    option.value = optionValue;
                    option.textContent = optionValue;
                    editor.appendChild(option);
                });

                editor.value = currentText || (columnIndex === 6 ? "Kitchen" : "Active");
            } else {
                editor = document.createElement("input");
                editor.className = "form-control form-control-sm bulk-inline-editor";
                editor.type = columnIndex === 5 ? "number" : "text";
                if (columnIndex === 5) {
                    editor.min = "0";
                    editor.step = "0.01";
                    editor.value = currentText.replace(/[^0-9.]/g, "");
                } else {
                    editor.value = currentText;
                }
            }

            cellNode.classList.add("bulk-cell-editing");
            cellNode.innerHTML = "";
            cellNode.appendChild(editor);

            activeEditor = {
                cellNode,
                columnIndex,
                editor,
                originalHtml
            };

            editor.addEventListener("mousedown", (event) => event.stopPropagation());
            editor.addEventListener("click", (event) => event.stopPropagation());

            editor.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    stopCellEditing(true);
                }

                if (event.key === "Escape") {
                    event.preventDefault();
                    stopCellEditing(false);
                }
            });

            editor.addEventListener("blur", () => {
                setTimeout(() => {
                    if (!activeEditor || activeEditor.editor !== editor) return;
                    stopCellEditing(true);
                }, 0);
            });

            if (editor.tagName === "SELECT") {
                editor.addEventListener("change", () => {
                    stopCellEditing(true);
                });
            }

            editor.focus();
            if (typeof editor.select === "function") {
                editor.select();
            }
        };

        const enterBulkEditMode = () => {
            isBulkEditMode = true;
            setBulkButtonState(true);
            updateBulkEditClass();
        };

        const saveBulkEditMode = () => {
            if (!isBulkEditMode) return;
            if (!stopCellEditing(true)) return;

            const updatedItems = getItemsFromTable();
            if (!validateItemNameUniqueness(updatedItems)) return;

            sortItems(updatedItems);
            renderItems(updatedItems);
            saveItems(updatedItems);

            isBulkEditMode = false;
            setBulkButtonState(false);
            updateBulkEditClass();

            tableApi.rows().invalidate().draw(false);
            renumberRows();
        };

        const tableCategoryFilter = (settings, data, dataIndex) => {
            if (settings.nTable !== tableElement[0]) return true;

            const selectedCategory = categoryFilter ? categoryFilter.value.trim().toLowerCase() : "";
            if (!selectedCategory) return true;

            const rowNode = tableApi.row(dataIndex).node();
            if (!rowNode) return true;

            const categoryCell = rowNode.querySelector("td:nth-child(7)");
            const rowCategory = categoryCell ? categoryCell.textContent.trim().toLowerCase() : "";
            return rowCategory === selectedCategory;
        };

        $.fn.dataTable.ext.search.push(tableCategoryFilter);

        seedData();

        if (pageLengthSelect) {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
        }

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                tableApi.search(searchInput.value).draw();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener("change", () => {
                tableApi.draw();
            });
        }

        if (pageLengthSelect) {
            pageLengthSelect.addEventListener("change", () => {
                tableApi.page.len(parseInt(pageLengthSelect.value, 10)).draw();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                if (isBulkEditMode) {
                    alert("Save bulk edits first by clicking Save.");
                    return;
                }

                if (searchInput) searchInput.value = "";
                if (categoryFilter) categoryFilter.value = "";
                if (pageLengthSelect) pageLengthSelect.value = "50";

                tableApi.search("");
                tableApi.page.len(50).draw();
                renumberRows();
            });
        }

        if (bulkEditButton) {
            bulkEditButton.addEventListener("click", () => {
                if (!isBulkEditMode) {
                    enterBulkEditMode();
                    return;
                }

                saveBulkEditMode();
            });
        }

        tableElement.on("dblclick", "tbody td", function (event) {
            if (!isBulkEditMode) return;
            if ($(event.target).closest(".action-btn").length) return;

            startCellEditor(this);
        });

        tableElement.on("click", ".view-row", function () {
            if (isBulkEditMode) {
                alert("Save bulk edits before using row actions.");
                return;
            }

            const row = tableApi.row($(this).closest("tr"));
            const rowData = row.data();
            if (!rowData) return;

            const item = rowToMenuItem(rowData);
            alert(
                "Name: " + item.name +
                "\nDisplay Name: " + item.displayName +
                "\nShort Name: " + item.shortName +
                "\nMenu Unit: " + item.menuUnit +
                "\nMenu Rate: Rs. " + item.menuRate.toFixed(2) +
                "\nMenu Category: " + item.menuCategory +
                "\nStatus: " + item.status
            );
        });

        tableElement.on("click", ".edit-row", function () {
            if (isBulkEditMode) {
                alert("Save bulk edits before using row actions.");
                return;
            }

            const row = tableApi.row($(this).closest("tr"));
            const rowData = row.data();
            if (!rowData) return;

            const current = rowToMenuItem(rowData);

            const nameRaw = window.prompt("Edit menu item name", current.name);
            if (nameRaw === null) return;
            const name = nameRaw.trim();
            if (!name) {
                alert("Name is required.");
                return;
            }

            const allItems = getItemsFromTable();
            const duplicate = allItems.some((item) => {
                return item.name.toLowerCase() === name.toLowerCase() && item.name.toLowerCase() !== current.name.toLowerCase();
            });

            if (duplicate) {
                alert("Another menu item already has this name.");
                return;
            }

            const displayNameRaw = window.prompt("Edit display name", current.displayName);
            if (displayNameRaw === null) return;
            const displayName = displayNameRaw.trim() || toTitleCase(name);

            const shortNameRaw = window.prompt("Edit short name", current.shortName);
            if (shortNameRaw === null) return;
            const shortName = shortNameRaw.trim() || name.slice(0, 3).toUpperCase();

            const menuUnitRaw = window.prompt("Edit menu unit", current.menuUnit);
            if (menuUnitRaw === null) return;
            const menuUnit = menuUnitRaw.trim() || current.menuUnit;

            const menuRateRaw = window.prompt("Edit menu rate", String(current.menuRate));
            if (menuRateRaw === null) return;
            const menuRate = parseFloat(menuRateRaw);
            if (!Number.isFinite(menuRate) || menuRate < 0) {
                alert("Menu rate must be a valid non-negative number.");
                return;
            }

            const menuCategoryRaw = window.prompt("Edit menu category", current.menuCategory);
            if (menuCategoryRaw === null) return;
            const menuCategory = menuCategoryRaw.trim() || current.menuCategory;

            const statusRaw = window.prompt("Edit status (Active/Inactive)", current.status);
            if (statusRaw === null) return;
            const status = normalizeStatus(statusRaw);

            row.data(buildRow({
                name,
                displayName,
                shortName,
                menuUnit,
                menuRate,
                menuCategory,
                status
            })).draw(false);

            const updated = getItemsFromTable();
            renderItems(updated);
            saveItems(updated);
        });

        tableElement.on("click", ".delete-row", function () {
            if (isBulkEditMode) {
                alert("Save bulk edits before deleting rows.");
                return;
            }

            const row = tableApi.row($(this).closest("tr"));
            const rowData = row.data();
            if (!rowData) return;

            const item = rowToMenuItem(rowData);
            const confirmed = window.confirm("Delete menu item \"" + item.name + "\"?");
            if (!confirmed) return;

            row.remove().draw(false);
            renumberRows();
            saveItems(getItemsFromTable());
        });

        const openReport = (title) => {
            const rows = tableApi.rows({ search: "applied" }).nodes().toArray().map((rowNode) => {
                const cells = rowNode.querySelectorAll("td");
                return {
                    sn: cells[0] ? cells[0].innerText.trim() : "",
                    name: cells[1] ? cells[1].innerText.trim() : "",
                    displayName: cells[2] ? cells[2].innerText.trim() : "",
                    shortName: cells[3] ? cells[3].innerText.trim() : "",
                    menuUnit: cells[4] ? cells[4].innerText.trim() : "",
                    menuRate: cells[5] ? cells[5].innerText.trim() : "",
                    menuCategory: cells[6] ? cells[6].innerText.trim() : "",
                    status: cells[7] ? cells[7].innerText.trim() : ""
                };
            });

            const reportWindow = window.open("", "_blank");
            if (!reportWindow) return;

            const selectedCategoryText = categoryFilter && categoryFilter.value
                ? categoryFilter.value
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
                        const nameNode = rowFragment.querySelector("[data-col-name]");
                        const displayNode = rowFragment.querySelector("[data-col-display-name]");
                        const shortNode = rowFragment.querySelector("[data-col-short-name]");
                        const unitNode = rowFragment.querySelector("[data-col-menu-unit]");
                        const rateNode = rowFragment.querySelector("[data-col-menu-rate]");
                        const categoryCell = rowFragment.querySelector("[data-col-menu-category]");
                        const statusNode = rowFragment.querySelector("[data-col-status]");

                        if (snNode) snNode.textContent = row.sn;
                        if (nameNode) nameNode.textContent = row.name;
                        if (displayNode) displayNode.textContent = row.displayName;
                        if (shortNode) shortNode.textContent = row.shortName;
                        if (unitNode) unitNode.textContent = row.menuUnit;
                        if (rateNode) rateNode.textContent = row.menuRate;
                        if (categoryCell) categoryCell.textContent = row.menuCategory;
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
            printButton.addEventListener("click", () => {
                if (!stopCellEditing(true)) return;
                openReport("Menu Items - Print View");
            });
        }

        if (pdfButton) {
            pdfButton.addEventListener("click", () => {
                if (!stopCellEditing(true)) return;
                openReport("Menu Items - PDF Export");
            });
        }

        tableApi.on("draw", () => {
            if (activeEditor) {
                activeEditor = null;
            }
            renumberRows();
            updateBulkEditClass();
        });
        setBulkButtonState(false);
        updateBulkEditClass();
        renumberRows();
        tableApi.draw();
    };

    waitForDataTable();
});

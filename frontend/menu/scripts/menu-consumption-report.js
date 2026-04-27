document.addEventListener("datatableLoaded", () => {
    const MENU_INGREDIENT_KEY = "menu_ingredient_setup_map";
    const PRODUCT_KEYS = [
        "product_item_master_list",
        "product_items_master_list",
        "stock_item_master_list",
        "product_master_list"
    ];

    const stockCategorySelect = document.getElementById("consumptionStockCategory");
    const menuItemSelect = document.getElementById("consumptionMenuItem");
    const fromDateInput = document.getElementById("consumptionFromDate");
    const toDateInput = document.getElementById("consumptionToDate");
    const pageLengthSelect = document.getElementById("consumptionPageLength");
    const refreshButton = document.getElementById("consumptionRefreshBtn");
    const printButton = document.getElementById("consumptionPrintBtn");
    const pdfButton = document.getElementById("consumptionPdfBtn");
    const footnote = document.getElementById("consumptionFootnote");
    const tableElement = $(".consumption-table");
    const snTemplate = document.getElementById("consumptionSnTemplate");
    const stockTemplate = document.getElementById("consumptionStockTemplate");
    const menuTemplate = document.getElementById("consumptionMenuTemplate");
    const qtyTemplate = document.getElementById("consumptionQtyTemplate");
    const multiplierTemplate = document.getElementById("consumptionMultiplierTemplate");
    const reportPageTemplate = document.getElementById("consumptionReportPageTemplate");
    const reportRowTemplate = document.getElementById("consumptionReportRowTemplate");
    const reportEmptyRowTemplate = document.getElementById("consumptionReportEmptyRowTemplate");

    if (
        !stockCategorySelect ||
        !menuItemSelect ||
        !fromDateInput ||
        !toDateInput ||
        !pageLengthSelect ||
        !refreshButton ||
        !printButton ||
        !pdfButton ||
        !footnote ||
        !tableElement.length ||
        !snTemplate ||
        !stockTemplate ||
        !menuTemplate ||
        !qtyTemplate ||
        !multiplierTemplate ||
        !reportPageTemplate ||
        !reportRowTemplate ||
        !reportEmptyRowTemplate
    ) {
        return;
    }

    let allRecords = [];
    let tableApi = null;

    const escapeHtml = (value) => {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const formatNumber = (value) => {
        const n = parseNumber(value);
        if (Number.isInteger(n)) return String(n);
        return n.toFixed(2).replace(/\.00$/, "");
    };

    const firstString = (...values) => {
        for (const value of values) {
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
        return "";
    };

    const normalizeDateInput = (value) => {
        const raw = String(value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;

        const date = new Date(raw + "T00:00:00");
        if (Number.isNaN(date.getTime())) return null;
        return date;
    };

    const dateOnly = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const dateToText = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + d;
    };

    const titleCase = (value) => {
        return String(value || "")
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

    const getProductCategoryMap = () => {
        const mapById = new Map();
        const mapByName = new Map();

        PRODUCT_KEYS.forEach((key) => {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return;

                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return;

                parsed.forEach((item, index) => {
                    if (!item || typeof item !== "object") return;

                    const id = firstString(
                        item.id ? String(item.id) : "",
                        item.productId ? String(item.productId) : "",
                        item.code,
                        item.productCode
                    ) || "row-" + index;

                    const name = firstString(item.name, item.productName, item.displayName, item.itemName);
                    const category = firstString(
                        item.productCategory,
                        item.product_category,
                        item.category,
                        item.menuCategory
                    ) || "General";

                    mapById.set(id.toLowerCase(), category);
                    if (name) {
                        mapByName.set(name.toLowerCase(), category);
                    }
                });
            } catch (error) {
                return;
            }
        });

        return { mapById, mapByName };
    };

    const parseSetupRows = (setup) => {
        if (!setup || typeof setup !== "object") return [];

        if (Array.isArray(setup.rows)) return setup.rows;
        if (Array.isArray(setup.items)) return setup.items;

        if (Array.isArray(setup.ingredients)) {
            return setup.ingredients.map((entry) => {
                if (typeof entry === "string") {
                    return { stockItemName: entry, mainQty: 0, subQty: 0 };
                }
                return entry;
            });
        }

        if (typeof setup.ingredients === "string") {
            return setup.ingredients
                .split(",")
                .map((name) => name.trim())
                .filter(Boolean)
                .map((name) => ({ stockItemName: name, mainQty: 0, subQty: 0 }));
        }

        return [];
    };

    const getSetupMap = () => {
        try {
            const raw = localStorage.getItem(MENU_INGREDIENT_KEY);
            if (!raw) return {};

            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            return {};
        }
    };

    const formatConsumedQty = (row) => {
        const mainQty = formatNumber(row.mainQty);
        const subQty = formatNumber(row.subQty);
        const mainUnit = firstString(row.mainUnit) || "unit";
        const subUnit = firstString(row.subUnit);

        if (subUnit && parseNumber(row.subQty) > 0) {
            if (parseNumber(row.mainQty) > 0) {
                return mainQty + " " + mainUnit + " + " + subQty + " " + subUnit;
            }
            return subQty + " " + subUnit;
        }

        return mainQty + " " + mainUnit;
    };

    const formatMultiplier = (row) => {
        const mainUnit = firstString(row.mainUnit) || "unit";
        const subUnit = firstString(row.subUnit);
        const subPerMain = parseNumber(row.subPerMain);

        if (subUnit && subPerMain > 0) {
            return "1 " + mainUnit + " = " + formatNumber(subPerMain) + " " + subUnit;
        }

        return "-";
    };

    const buildRecords = () => {
        const setupMap = getSetupMap();
        const { mapById, mapByName } = getProductCategoryMap();
        const records = [];

        Object.keys(setupMap).forEach((mapKey) => {
            const setup = setupMap[mapKey] || {};
            const menuItem = firstString(setup.menuItemDisplayName, setup.menuItemName) || titleCase(mapKey);
            const updatedAtDate = setup.updatedAt ? new Date(setup.updatedAt) : null;
            const rows = parseSetupRows(setup);

            rows.forEach((row) => {
                const stockItemName = firstString(row.stockItemName, row.itemName, row.stockName) || "-";
                const stockItemId = firstString(row.stockItemId, row.itemId, row.stockId).toLowerCase();

                let category = firstString(row.stockCategory, row.category);
                if (!category && stockItemId && mapById.has(stockItemId)) {
                    category = mapById.get(stockItemId);
                }
                if (!category && mapByName.has(stockItemName.toLowerCase())) {
                    category = mapByName.get(stockItemName.toLowerCase());
                }
                if (!category) {
                    category = "General";
                }

                records.push({
                    stockItem: titleCase(stockItemName),
                    menuItem,
                    consumedQty: formatConsumedQty(row),
                    multiplier: formatMultiplier(row),
                    stockCategory: category,
                    updatedAt: updatedAtDate && !Number.isNaN(updatedAtDate.getTime()) ? updatedAtDate : null
                });
            });
        });

        if (records.length) {
            records.sort((a, b) => {
                const aTime = a.updatedAt ? a.updatedAt.getTime() : 0;
                const bTime = b.updatedAt ? b.updatedAt.getTime() : 0;
                if (bTime !== aTime) return bTime - aTime;
                return a.stockItem.localeCompare(b.stockItem);
            });
            return records;
        }

        return [
            {
                stockItem: "Chicken",
                menuItem: "Chicken Chowmein",
                consumedQty: "0 kilogram + 50 gram",
                multiplier: "1 kilogram = 1000 gram",
                stockCategory: "Kitchen",
                updatedAt: new Date()
            }
        ];
    };

    const populateSelect = (select, options, defaultLabel) => {
        const previous = select.value;

        select.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = defaultLabel;
        select.appendChild(defaultOption);

        options.forEach((optionValue) => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue;
            select.appendChild(option);
        });

        const keepPrevious = options.some((item) => item === previous);
        select.value = keepPrevious ? previous : "";
    };

    const populateFilters = () => {
        const categoryList = Array.from(new Set(allRecords.map((row) => row.stockCategory))).sort((a, b) => a.localeCompare(b));
        const menuList = Array.from(new Set(allRecords.map((row) => row.menuItem))).sort((a, b) => a.localeCompare(b));

        populateSelect(stockCategorySelect, categoryList, "-- Select --");
        populateSelect(menuItemSelect, menuList, "-- Select --");
    };

    const getFilteredRecords = () => {
        const selectedCategory = stockCategorySelect.value.trim().toLowerCase();
        const selectedMenuItem = menuItemSelect.value.trim().toLowerCase();
        const fromDate = normalizeDateInput(fromDateInput.value);
        const toDate = normalizeDateInput(toDateInput.value);

        const fromOnly = fromDate ? dateOnly(fromDate) : null;
        const toOnly = toDate ? dateOnly(toDate) : null;

        return allRecords.filter((row) => {
            if (selectedCategory && row.stockCategory.toLowerCase() !== selectedCategory) {
                return false;
            }

            if (selectedMenuItem && row.menuItem.toLowerCase() !== selectedMenuItem) {
                return false;
            }

            if ((fromOnly || toOnly) && !row.updatedAt) {
                return false;
            }

            if (fromOnly && row.updatedAt && dateOnly(row.updatedAt).getTime() < fromOnly.getTime()) {
                return false;
            }

            if (toOnly && row.updatedAt && dateOnly(row.updatedAt).getTime() > toOnly.getTime()) {
                return false;
            }

            return true;
        });
    };

    const buildDataTableRow = (row) => {
        return [
            renderTemplateHtml(snTemplate, (fragment) => {
                const snNode = fragment.querySelector(".sn-badge");
                if (snNode) snNode.textContent = "0";
            }),
            renderTemplateHtml(stockTemplate, (fragment) => {
                const stockNode = fragment.querySelector(".stock-name");
                if (stockNode) stockNode.textContent = row.stockItem;
            }),
            renderTemplateHtml(menuTemplate, (fragment) => {
                const menuNode = fragment.querySelector(".menu-name");
                if (menuNode) menuNode.textContent = row.menuItem;
            }),
            renderTemplateHtml(qtyTemplate, (fragment) => {
                const qtyNode = fragment.querySelector(".qty-badge");
                if (qtyNode) qtyNode.textContent = row.consumedQty;
            }),
            renderTemplateHtml(multiplierTemplate, (fragment) => {
                const mulNode = fragment.querySelector(".multiplier-badge");
                if (mulNode) mulNode.textContent = row.multiplier;
            })
        ];
    };

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

    const updateFootnote = () => {
        const info = tableApi.page.info();
        const shown = info.end - info.start;
        footnote.textContent = "Showing " + shown + " of " + info.recordsDisplay + " records";
    };

    const renderTable = () => {
        const filtered = getFilteredRecords();
        const dataRows = filtered.map((row) => buildDataTableRow(row));

        tableApi.clear();
        if (dataRows.length) {
            tableApi.rows.add(dataRows);
        }

        tableApi.draw(false);
        renumberRows();
        updateFootnote();
    };

    const openReportWindow = (titleText) => {
        const records = getFilteredRecords();
        const reportWindow = window.open("", "_blank");
        if (!reportWindow) return;

        const reportFragment = reportPageTemplate.content.cloneNode(true);
        const reportTitleNode = reportFragment.querySelector("[data-report-title]");
        const reportHeadingNode = reportFragment.querySelector("[data-report-heading]");
        const reportCategoryNode = reportFragment.querySelector("[data-report-category]");
        const reportMenuNode = reportFragment.querySelector("[data-report-menu-item]");
        const reportFromNode = reportFragment.querySelector("[data-report-from-date]");
        const reportToNode = reportFragment.querySelector("[data-report-to-date]");
        const reportGeneratedNode = reportFragment.querySelector("[data-report-generated-on]");
        const reportBodyNode = reportFragment.querySelector("[data-report-body]");

        if (reportTitleNode) reportTitleNode.textContent = titleText;
        if (reportHeadingNode) reportHeadingNode.textContent = titleText;
        if (reportCategoryNode) reportCategoryNode.textContent = stockCategorySelect.value || "All";
        if (reportMenuNode) reportMenuNode.textContent = menuItemSelect.value || "All";
        if (reportFromNode) reportFromNode.textContent = fromDateInput.value || "-";
        if (reportToNode) reportToNode.textContent = toDateInput.value || "-";
        if (reportGeneratedNode) reportGeneratedNode.textContent = new Date().toLocaleString();

        if (reportBodyNode) {
            if (records.length) {
                records.forEach((row, index) => {
                    const rowFragment = reportRowTemplate.content.cloneNode(true);
                    const snNode = rowFragment.querySelector("[data-col-sn]");
                    const stockNode = rowFragment.querySelector("[data-col-stock-item]");
                    const menuNode = rowFragment.querySelector("[data-col-menu-item]");
                    const qtyNode = rowFragment.querySelector("[data-col-consumed-qty]");
                    const mulNode = rowFragment.querySelector("[data-col-multiplier]");

                    if (snNode) snNode.textContent = String(index + 1);
                    if (stockNode) stockNode.textContent = row.stockItem;
                    if (menuNode) menuNode.textContent = row.menuItem;
                    if (qtyNode) qtyNode.textContent = row.consumedQty;
                    if (mulNode) mulNode.textContent = row.multiplier;

                    reportBodyNode.appendChild(rowFragment);
                });
            } else {
                reportBodyNode.appendChild(reportEmptyRowTemplate.content.cloneNode(true));
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

    const resetFilters = () => {
        stockCategorySelect.value = "";
        menuItemSelect.value = "";
        fromDateInput.value = "";
        toDateInput.value = "";
        pageLengthSelect.value = "50";

        tableApi.search("");
        tableApi.columns().search("");
        tableApi.page.len(50);

        renderTable();
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

        allRecords = buildRecords();
        populateFilters();

        const latestDate = allRecords
            .map((row) => row.updatedAt)
            .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
            .sort((a, b) => b.getTime() - a.getTime())[0];

        if (latestDate) {
            toDateInput.value = dateToText(latestDate);
        }

        renderTable();

        stockCategorySelect.addEventListener("change", renderTable);
        menuItemSelect.addEventListener("change", renderTable);
        fromDateInput.addEventListener("input", renderTable);
        toDateInput.addEventListener("input", renderTable);

        pageLengthSelect.addEventListener("change", () => {
            tableApi.page.len(parseInt(pageLengthSelect.value, 10) || 50).draw(false);
            updateFootnote();
        });

        refreshButton.addEventListener("click", resetFilters);
        printButton.addEventListener("click", () => openReportWindow("Ingredient Consumption Report - Print View"));
        pdfButton.addEventListener("click", () => openReportWindow("Ingredient Consumption Report - PDF Export"));

        tableApi.on("draw", () => {
            renumberRows();
            updateFootnote();
        });
    };

    waitForDataTable();
});

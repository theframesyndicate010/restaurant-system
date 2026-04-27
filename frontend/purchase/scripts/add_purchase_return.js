document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "purchase_return_master_list";

    const supplierSelect = document.getElementById("prSupplierSelect");
    const invoiceSelect = document.getElementById("prInvoiceSelect");
    const itemSelect = document.getElementById("prItemSelect");
    const addItemButton = document.getElementById("prAddItemBtn");
    const tableBody = document.getElementById("prEntryTableBody");
    const rowTemplate = document.getElementById("prEntryRowTemplate");
    const totalItemsBadge = document.getElementById("prTotalItemsBadge");
    const subTotalInput = document.getElementById("prSubTotal");
    const taxReturnInput = document.getElementById("prTaxReturn");
    const grandTotalInput = document.getElementById("prGrandTotal");
    const dateInput = document.getElementById("prReturnDate");
    const remarksInput = document.getElementById("prRemarks");
    const saveButton = document.getElementById("prSaveBtn");
    const messageBox = document.getElementById("purchaseReturnEntryMessage");

    if (!supplierSelect || !invoiceSelect || !itemSelect || !addItemButton || !tableBody || !rowTemplate ||
        !totalItemsBadge || !subTotalInput || !taxReturnInput || !grandTotalInput || !dateInput || !remarksInput || !saveButton || !messageBox) {
        return;
    }

    const supplierCatalog = [
        {
            id: "SUP-001",
            name: "Fresh Mart Traders",
            invoices: [
                {
                    id: "INV-3021",
                    items: [
                        { id: "ITEM-001", code: "RIC-100", name: "Basmati Rice", unit: "Kg", rate: 105, taxPercent: 0.13 },
                        { id: "ITEM-002", code: "OIL-220", name: "Refined Oil", unit: "Ltr", rate: 185, taxPercent: 0.13 },
                        { id: "ITEM-003", code: "SPC-410", name: "Spice Mix", unit: "Pkt", rate: 175, taxPercent: 0.13 }
                    ]
                },
                {
                    id: "INV-3040",
                    items: [
                        { id: "ITEM-004", code: "SUG-120", name: "Sugar", unit: "Kg", rate: 88, taxPercent: 0.13 },
                        { id: "ITEM-005", code: "FLO-510", name: "Flour", unit: "Kg", rate: 72, taxPercent: 0.13 }
                    ]
                }
            ]
        },
        {
            id: "SUP-002",
            name: "Everest Beverage House",
            invoices: [
                {
                    id: "INV-3019",
                    items: [
                        { id: "ITEM-006", code: "COL-250", name: "Cola", unit: "Bottle", rate: 85, taxPercent: 0.13 },
                        { id: "ITEM-007", code: "ORG-150", name: "Orange Juice", unit: "Bottle", rate: 150, taxPercent: 0.13 },
                        { id: "ITEM-008", code: "SOD-090", name: "Soda Water", unit: "Bottle", rate: 70, taxPercent: 0.13 }
                    ]
                },
                {
                    id: "INV-3052",
                    items: [
                        { id: "ITEM-009", code: "MIN-100", name: "Mineral Water", unit: "Bottle", rate: 60, taxPercent: 0.13 },
                        { id: "ITEM-010", code: "LEM-130", name: "Lemon Soda", unit: "Bottle", rate: 95, taxPercent: 0.13 }
                    ]
                }
            ]
        },
        {
            id: "SUP-003",
            name: "Annapurna Agro Suppliers",
            invoices: [
                {
                    id: "INV-3014",
                    items: [
                        { id: "ITEM-011", code: "TOM-500", name: "Tomato", unit: "Kg", rate: 75, taxPercent: 0 },
                        { id: "ITEM-012", code: "ONI-450", name: "Onion", unit: "Kg", rate: 62, taxPercent: 0 },
                        { id: "ITEM-013", code: "POT-300", name: "Potato", unit: "Kg", rate: 41, taxPercent: 0 }
                    ]
                }
            ]
        }
    ];

    const defaultRows = [
        {
            returnNo: "PR-1001",
            date: "2082-12-29",
            supplier: "Fresh Mart Traders",
            amount: 2680,
            remarks: "Damaged canned products"
        },
        {
            returnNo: "PR-1002",
            date: "2082-12-29",
            supplier: "Everest Beverage House",
            amount: 1450,
            remarks: "Broken bottle crates"
        },
        {
            returnNo: "PR-1003",
            date: "2082-12-28",
            supplier: "Annapurna Agro Suppliers",
            amount: 1960,
            remarks: "Over-supplied onions returned"
        },
        {
            returnNo: "PR-1004",
            date: "2082-12-27",
            supplier: "Dairy Hub Pvt. Ltd.",
            amount: 820,
            remarks: "Short expiry cheese packs"
        },
        {
            returnNo: "PR-1005",
            date: "2082-12-26",
            supplier: "Metro Dry Foods",
            amount: 2370,
            remarks: "Incorrect invoice delivery"
        },
        {
            returnNo: "PR-1006",
            date: "2082-12-25",
            supplier: "Sunrise Wholesale",
            amount: 980,
            remarks: "Quality issue in flour batch"
        }
    ];

    let entryRows = [];
    let rowCounter = 0;

    const parseNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };

    const formatMoney = (value) => {
        return parseNumber(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const normalizeText = (value, fallback = "-") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizeDate = (value) => {
        const text = String(value || "").trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "2082-12-30";
    };

    const normalizeReturnRecord = (item, index) => {
        if (!item || typeof item !== "object") {
            return null;
        }

        return {
            returnNo: normalizeText(item.returnNo, "PR-" + String(1000 + index + 1)),
            date: normalizeDate(item.date),
            supplier: normalizeText(item.supplier, "Unknown Supplier"),
            amount: parseNumber(item.amount),
            remarks: normalizeText(item.remarks, "-")
        };
    };

    const getStoredReturnList = () => {
        const fallback = defaultRows.map((item, index) => normalizeReturnRecord(item, index)).filter(Boolean);

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return fallback;
            }

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return fallback;
            }

            const normalized = parsed.map((item, index) => normalizeReturnRecord(item, index)).filter(Boolean);
            if (!normalized.length) {
                return fallback;
            }

            return normalized;
        } catch (error) {
            return fallback;
        }
    };

    const saveReturnList = (rows) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
        } catch (error) {
            showMessage("Could not save purchase return data in browser storage.", "danger");
        }
    };

    const showMessage = (text, type) => {
        messageBox.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");
        messageBox.classList.add(type === "success" ? "alert-success" : type === "warning" ? "alert-warning" : "alert-danger");
        messageBox.textContent = text;
    };

    const hideMessage = () => {
        messageBox.classList.add("d-none");
        messageBox.textContent = "";
    };

    const getSelectedSupplier = () => {
        const supplierId = supplierSelect.value;
        return supplierCatalog.find((supplier) => supplier.id === supplierId) || null;
    };

    const getSelectedInvoice = () => {
        const supplier = getSelectedSupplier();
        if (!supplier) return null;

        const invoiceId = invoiceSelect.value;
        return supplier.invoices.find((invoice) => invoice.id === invoiceId) || null;
    };

    const getSelectedItem = () => {
        const invoice = getSelectedInvoice();
        if (!invoice) return null;

        const itemId = itemSelect.value;
        return invoice.items.find((item) => item.id === itemId) || null;
    };

    const addDefaultOption = (selectElement, text) => {
        selectElement.innerHTML = "";

        const option = document.createElement("option");
        option.value = "";
        option.textContent = text;
        selectElement.appendChild(option);
    };

    const populateSuppliers = () => {
        addDefaultOption(supplierSelect, "---Select Supplier---");

        supplierCatalog.forEach((supplier) => {
            const option = document.createElement("option");
            option.value = supplier.id;
            option.textContent = supplier.name;
            supplierSelect.appendChild(option);
        });
    };

    const populateInvoices = (supplier) => {
        addDefaultOption(invoiceSelect, "--- Select Invoice ---");
        addDefaultOption(itemSelect, "--- Select Item ---");

        if (!supplier) {
            return;
        }

        supplier.invoices.forEach((invoice) => {
            const option = document.createElement("option");
            option.value = invoice.id;
            option.textContent = invoice.id;
            invoiceSelect.appendChild(option);
        });
    };

    const populateItems = (invoice) => {
        addDefaultOption(itemSelect, "--- Select Item ---");

        if (!invoice) {
            return;
        }

        invoice.items.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.name;
            itemSelect.appendChild(option);
        });
    };

    const calculateRowValues = (row) => {
        const qty = parseNumber(row.qty);
        const rate = parseNumber(row.rate);
        const subTotal = qty * rate;
        const taxReturn = subTotal * parseNumber(row.taxPercent);

        return {
            subTotal,
            taxReturn
        };
    };

    const getTotals = () => {
        return entryRows.reduce((acc, row) => {
            const values = calculateRowValues(row);
            acc.subTotal += values.subTotal;
            acc.taxReturn += values.taxReturn;
            return acc;
        }, { subTotal: 0, taxReturn: 0 });
    };

    const syncSummary = () => {
        const totals = getTotals();
        const total = totals.subTotal + totals.taxReturn;

        subTotalInput.value = formatMoney(totals.subTotal);
        taxReturnInput.value = formatMoney(totals.taxReturn);
        grandTotalInput.value = formatMoney(total);
        totalItemsBadge.textContent = String(entryRows.length);
    };

    const renderEmptyRow = () => {
        tableBody.innerHTML = "";

        const tr = document.createElement("tr");
        tr.className = "pr-empty-row";

        const td = document.createElement("td");
        td.colSpan = 7;
        td.className = "text-center";
        td.textContent = "Choose supplier, invoice, and item to start adding purchase return rows.";

        tr.appendChild(td);
        tableBody.appendChild(tr);
    };

    const renderRows = () => {
        if (!entryRows.length) {
            renderEmptyRow();
            syncSummary();
            return;
        }

        tableBody.innerHTML = "";

        entryRows.forEach((row) => {
            const fragment = rowTemplate.content.cloneNode(true);
            const tr = fragment.querySelector("tr");
            tr.setAttribute("data-row-id", row.rowId);

            const codeNode = tr.querySelector(".pr-item-code");
            const nameNode = tr.querySelector(".pr-item-name");
            const unitNode = tr.querySelector(".pr-item-unit");
            const qtyInput = tr.querySelector(".pr-qty-input");
            const rateInput = tr.querySelector(".pr-rate-input");
            const subTotalNode = tr.querySelector(".pr-subtotal");
            const taxReturnNode = tr.querySelector(".pr-tax-return");
            const removeButton = tr.querySelector(".pr-remove-item");

            const values = calculateRowValues(row);

            if (codeNode) codeNode.textContent = row.code;
            if (nameNode) nameNode.textContent = row.name;
            if (unitNode) unitNode.textContent = row.unit;
            if (qtyInput) qtyInput.value = String(row.qty);
            if (rateInput) rateInput.value = String(parseNumber(row.rate));
            if (subTotalNode) subTotalNode.textContent = formatMoney(values.subTotal);
            if (taxReturnNode) taxReturnNode.textContent = formatMoney(values.taxReturn);
            if (removeButton) removeButton.setAttribute("data-row-id", row.rowId);

            tableBody.appendChild(fragment);
        });

        syncSummary();
    };

    const clearEntryRows = () => {
        entryRows = [];
        renderRows();
    };

    const addItemRow = () => {
        hideMessage();

        const supplier = getSelectedSupplier();
        if (!supplier) {
            showMessage("Select a supplier first.", "warning");
            return;
        }

        const invoice = getSelectedInvoice();
        if (!invoice) {
            showMessage("Select an invoice before adding items.", "warning");
            return;
        }

        const item = getSelectedItem();
        if (!item) {
            showMessage("Select an item to add into the return list.", "warning");
            return;
        }

        const existingRow = entryRows.find((row) => row.itemId === item.id);
        if (existingRow) {
            existingRow.qty = parseNumber(existingRow.qty) + 1;
            renderRows();
            showMessage(item.name + " quantity increased by 1.", "success");
            return;
        }

        rowCounter += 1;
        entryRows.push({
            rowId: "ROW-" + rowCounter,
            itemId: item.id,
            code: item.code,
            name: item.name,
            qty: 1,
            unit: item.unit,
            rate: parseNumber(item.rate),
            taxPercent: parseNumber(item.taxPercent)
        });

        renderRows();
        showMessage(item.name + " added to purchase return.", "success");
    };

    const updateRowFromInput = (rowId, field, value) => {
        const row = entryRows.find((entry) => entry.rowId === rowId);
        if (!row) {
            return;
        }

        if (field === "qty") {
            row.qty = Math.max(1, Math.floor(parseNumber(value) || 1));
        }

        if (field === "rate") {
            row.rate = parseNumber(value);
        }

        syncSummary();

        const rowElement = tableBody.querySelector('tr[data-row-id="' + rowId + '"]');
        if (!rowElement) {
            return;
        }

        const values = calculateRowValues(row);
        const qtyInput = rowElement.querySelector(".pr-qty-input");
        const rateInput = rowElement.querySelector(".pr-rate-input");
        const subTotalNode = rowElement.querySelector(".pr-subtotal");
        const taxReturnNode = rowElement.querySelector(".pr-tax-return");

        if (qtyInput) qtyInput.value = String(row.qty);
        if (rateInput) rateInput.value = String(parseNumber(row.rate));
        if (subTotalNode) subTotalNode.textContent = formatMoney(values.subTotal);
        if (taxReturnNode) taxReturnNode.textContent = formatMoney(values.taxReturn);
    };

    const removeRow = (rowId) => {
        entryRows = entryRows.filter((row) => row.rowId !== rowId);
        renderRows();
    };

    const getNextReturnNo = (records) => {
        const maxNo = records.reduce((max, row) => {
            const match = String(row.returnNo || "").match(/PR-(\d+)/i);
            if (!match) return max;

            const current = parseInt(match[1], 10);
            return Number.isFinite(current) ? Math.max(max, current) : max;
        }, 1000);

        return "PR-" + String(maxNo + 1);
    };

    const onSave = () => {
        hideMessage();

        const supplier = getSelectedSupplier();
        if (!supplier) {
            showMessage("Please select supplier before saving.", "warning");
            return;
        }

        const invoice = getSelectedInvoice();
        if (!invoice) {
            showMessage("Please select invoice before saving.", "warning");
            return;
        }

        if (!entryRows.length) {
            showMessage("Add at least one item in purchase return list.", "warning");
            return;
        }

        const totals = getTotals();
        const total = totals.subTotal + totals.taxReturn;

        const records = getStoredReturnList();
        const returnNo = getNextReturnNo(records);

        const payload = {
            returnNo,
            date: normalizeDate(dateInput.value),
            supplier: supplier.name,
            amount: parseNumber(total),
            remarks: normalizeText(remarksInput.value, "-"),
            invoiceNo: invoice.id,
            subTotal: parseNumber(totals.subTotal),
            taxReturn: parseNumber(totals.taxReturn),
            items: entryRows.map((row) => {
                const values = calculateRowValues(row);
                return {
                    code: row.code,
                    name: row.name,
                    qty: parseNumber(row.qty),
                    unit: row.unit,
                    rate: parseNumber(row.rate),
                    subTotal: parseNumber(values.subTotal),
                    taxReturn: parseNumber(values.taxReturn)
                };
            })
        };

        records.unshift(payload);
        saveReturnList(records);

        showMessage("Purchase return " + returnNo + " saved successfully.", "success");

        setTimeout(() => {
            window.location.href = "purchase-return.html";
        }, 600);
    };

    supplierSelect.addEventListener("change", () => {
        const supplier = getSelectedSupplier();
        populateInvoices(supplier);
        clearEntryRows();
        hideMessage();
    });

    invoiceSelect.addEventListener("change", () => {
        const invoice = getSelectedInvoice();
        populateItems(invoice);
        clearEntryRows();
        hideMessage();
    });

    addItemButton.addEventListener("click", addItemRow);

    tableBody.addEventListener("input", (event) => {
        const target = event.target;
        const rowElement = target.closest("tr[data-row-id]");
        if (!rowElement) return;

        const rowId = rowElement.getAttribute("data-row-id");

        if (target.classList.contains("pr-qty-input")) {
            updateRowFromInput(rowId, "qty", target.value);
        }

        if (target.classList.contains("pr-rate-input")) {
            updateRowFromInput(rowId, "rate", target.value);
        }
    });

    tableBody.addEventListener("click", (event) => {
        const removeButton = event.target.closest(".pr-remove-item");
        if (!removeButton) return;

        const rowId = removeButton.getAttribute("data-row-id");
        if (!rowId) return;

        removeRow(rowId);
        hideMessage();
    });

    saveButton.addEventListener("click", onSave);

    populateSuppliers();
    renderRows();
});

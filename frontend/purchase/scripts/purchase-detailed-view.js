document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "purchase_master_list";

    const titleNode = document.getElementById("purchaseDetailTitle");
    const subtitleNode = document.getElementById("purchaseDetailSubtitle");
    const supplierNode = document.getElementById("purchaseDetailSupplier");
    const dateNode = document.getElementById("purchaseDetailDate");
    const statusNode = document.getElementById("purchaseDetailStatus");
    const paymentNode = document.getElementById("purchaseDetailPayment");
    const billNode = document.getElementById("purchaseDetailBill");
    const paidNode = document.getElementById("purchaseDetailPaid");
    const bodyNode = document.getElementById("purchaseDetailBody");
    const totalNode = document.getElementById("purchaseDetailTotal");
    const detailRowTemplate = document.getElementById("purchaseDetailRowTemplate");
    const emptyRowTemplate = document.getElementById("purchaseDetailEmptyRowTemplate");

    if (!titleNode || !subtitleNode || !supplierNode || !dateNode || !statusNode || !paymentNode || !billNode || !paidNode || !bodyNode || !totalNode || !detailRowTemplate || !emptyRowTemplate) {
        return;
    }

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

    const normalizeItemRows = (value, fallbackAmount, fallbackLabel) => {
        if (Array.isArray(value) && value.length) {
            const normalized = value
                .map((item, index) => {
                    if (!item || typeof item !== "object") return null;

                    const itemName = normalizeText(item.item || item.name, "Item " + (index + 1));
                    const qty = parseNumber(item.qty || item.quantity);
                    const rate = parseNumber(item.rate);
                    const amount = parseNumber(item.amount) || (qty * rate);

                    return {
                        item: itemName,
                        qty,
                        rate,
                        amount
                    };
                })
                .filter(Boolean);

            if (normalized.length) {
                return normalized;
            }
        }

        const fallbackRate = parseNumber(fallbackAmount);
        return [{
            item: normalizeText(fallbackLabel, "Purchase Item"),
            qty: 1,
            rate: fallbackRate,
            amount: fallbackRate
        }];
    };

    const normalizeRecord = (value) => {
        if (!value || typeof value !== "object") return null;

        const billAmount = parseNumber(value.billAmount);
        const remarks = normalizeText(value.remarks, "-");

        return {
            invoiceNo: normalizeText(value.invoiceNo, "N/A"),
            supplier: normalizeText(value.supplier, "Unknown Supplier"),
            date: normalizeText(value.date, "-") ,
            status: normalizeText(value.status, "Pending"),
            paymentType: normalizeText(value.paymentType, "Cash"),
            billAmount,
            paidAmount: parseNumber(value.paidAmount),
            items: normalizeItemRows(value.items, billAmount, remarks)
        };
    };

    const defaultRows = [
        {
            date: "2082-12-29",
            supplier: "Fresh Mart Traders",
            invoiceNo: "INV-3021",
            billAmount: 25840,
            paymentType: "Cash",
            paidAmount: 25840,
            status: "Paid",
            remarks: "Kitchen dry stock",
            items: [
                { item: "Basmati Rice", qty: 120, rate: 105, amount: 12600 },
                { item: "Refined Oil", qty: 40, rate: 185, amount: 7400 },
                { item: "Spice Mix", qty: 24, rate: 175, amount: 4200 },
                { item: "Salt", qty: 20, rate: 82, amount: 1640 }
            ]
        },
        {
            date: "2082-12-29",
            supplier: "Everest Beverage House",
            invoiceNo: "INV-3019",
            billAmount: 14200,
            paymentType: "Card",
            paidAmount: 9000,
            status: "Partial",
            remarks: "Soft drinks and juices",
            items: [
                { item: "Orange Juice", qty: 30, rate: 150, amount: 4500 },
                { item: "Cola", qty: 60, rate: 85, amount: 5100 },
                { item: "Soda Water", qty: 40, rate: 70, amount: 2800 },
                { item: "Mineral Water", qty: 30, rate: 60, amount: 1800 }
            ]
        },
        {
            date: "2082-12-28",
            supplier: "Annapurna Agro Suppliers",
            invoiceNo: "INV-3014",
            billAmount: 18500,
            paymentType: "Credit",
            paidAmount: 0,
            status: "Pending",
            remarks: "Vegetables weekly supply",
            items: [
                { item: "Tomato", qty: 90, rate: 75, amount: 6750 },
                { item: "Onion", qty: 110, rate: 62, amount: 6820 },
                { item: "Potato", qty: 120, rate: 41, amount: 4920 },
                { item: "Capsicum", qty: 6, rate: 145, amount: 870 }
            ]
        },
        {
            date: "2082-12-27",
            supplier: "Dairy Hub Pvt. Ltd.",
            invoiceNo: "INV-3008",
            billAmount: 9600,
            paymentType: "Cash",
            paidAmount: 9600,
            status: "Paid",
            remarks: "Milk and cheese",
            items: [
                { item: "Milk", qty: 120, rate: 55, amount: 6600 },
                { item: "Cheese", qty: 12, rate: 180, amount: 2160 },
                { item: "Butter", qty: 7, rate: 120, amount: 840 }
            ]
        }
    ];

    const getStoredRows = () => {
        const fallback = defaultRows.map((item) => normalizeRecord(item)).filter(Boolean);

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return fallback;

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return fallback;

            const normalized = parsed
                .map((item) => normalizeRecord(item))
                .filter(Boolean);

            if (!normalized.length) return fallback;
            return normalized;
        } catch (error) {
            return fallback;
        }
    };

    const renderItems = (record) => {
        const items = Array.isArray(record.items) ? record.items : [];
        bodyNode.textContent = "";

        if (!items.length) {
            bodyNode.appendChild(emptyRowTemplate.content.cloneNode(true));
            totalNode.textContent = "Rs. 0.00";
            return;
        }

        let total = 0;
        const rowsFragment = document.createDocumentFragment();

        items.forEach((item, index) => {
            const qty = parseNumber(item.qty);
            const rate = parseNumber(item.rate);
            const amount = parseNumber(item.amount) || (qty * rate);
            total += amount;

            const rowFragment = detailRowTemplate.content.cloneNode(true);
            const snNode = rowFragment.querySelector(".purchase-detail-sn");
            const itemNode = rowFragment.querySelector(".purchase-detail-item");
            const qtyNode = rowFragment.querySelector(".purchase-detail-qty");
            const rateNode = rowFragment.querySelector(".purchase-detail-rate");
            const amountNode = rowFragment.querySelector(".purchase-detail-amount");

            if (snNode) snNode.textContent = String(index + 1);
            if (itemNode) itemNode.textContent = item.item;
            if (qtyNode) qtyNode.textContent = String(qty);
            if (rateNode) rateNode.textContent = "Rs. " + formatMoney(rate);
            if (amountNode) amountNode.textContent = "Rs. " + formatMoney(amount);

            rowsFragment.appendChild(rowFragment);
        });

        bodyNode.appendChild(rowsFragment);

        totalNode.textContent = "Rs. " + formatMoney(total);
    };

    const records = getStoredRows();
    const params = new URLSearchParams(window.location.search);
    const invoiceParam = String(params.get("invoice") || "").trim().toLowerCase();

    let selected = records.find((row) => row.invoiceNo.toLowerCase() === invoiceParam);
    if (!selected && records.length) {
        selected = records[0];
    }

    if (!selected) {
        titleNode.textContent = "Purchase Details";
        subtitleNode.textContent = "Invoice data is not available.";
        renderItems({ items: [] });
        return;
    }

    titleNode.textContent = "Purchase Details - " + selected.invoiceNo;
    subtitleNode.textContent = "S.N., Item, Qty, Rate, Amount";

    supplierNode.textContent = selected.supplier;
    dateNode.textContent = selected.date;
    statusNode.textContent = selected.status;
    paymentNode.textContent = selected.paymentType;
    billNode.textContent = "Rs. " + formatMoney(selected.billAmount);
    paidNode.textContent = "Rs. " + formatMoney(selected.paidAmount);

    renderItems(selected);

    document.title = selected.invoiceNo + " - Purchase Details";
});

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'menu_unit_master_list';
    const defaultUnits = ['Bottle', 'Piece', 'Kg', 'Liter', 'Milliliter'];

    const form = document.getElementById('createMenuUnitForm');
    const nameInput = document.getElementById('menuUnitName');
    const messageEl = document.getElementById('createMenuUnitMessage');

    if (!form || !nameInput || !messageEl) return;

    const getStoredUnits = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [...defaultUnits];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [...defaultUnits];

            const seen = new Set();
            const cleaned = [];
            parsed.forEach((item) => {
                if (typeof item !== 'string') return;
                const trimmed = item.trim();
                if (!trimmed) return;

                const key = trimmed.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                cleaned.push(trimmed);
            });

            return cleaned.length ? cleaned : [...defaultUnits];
        } catch (error) {
            return [...defaultUnits];
        }
    };

    const saveUnits = (units) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
    };

    const showMessage = (type, text) => {
        messageEl.className = `alert alert-${type} mb-4`;
        messageEl.textContent = text;
        messageEl.classList.remove('d-none');
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const unitName = nameInput.value.trim();
        if (!unitName) {
            showMessage('danger', 'Name is required.');
            nameInput.focus();
            return;
        }

        const units = getStoredUnits();
        const exists = units.some((item) => item.toLowerCase() === unitName.toLowerCase());
        if (exists) {
            showMessage('danger', 'This menu unit already exists.');
            nameInput.focus();
            return;
        }

        units.push(unitName);
        saveUnits(units);

        showMessage('success', `Menu unit "${unitName}" created successfully. Redirecting...`);
        setTimeout(() => {
            window.location.href = 'menu-unit.html';
        }, 700);
    });

    form.addEventListener('reset', () => {
        messageEl.classList.add('d-none');
        setTimeout(() => nameInput.focus(), 0);
    });

    nameInput.focus();
});

// Customer JavaScript Code
document.addEventListener("DOMContentLoaded", () => {
    // Add logic to toggle the status badge between "Active" and "Not Active" dynamically
    const switches = document.querySelectorAll('.custom-switch-green .form-check-input');

    switches.forEach(toggleFn => {
        toggleFn.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            // Go up to the table row (tr), then find the status badge
            const row = e.target.closest('tr');
            if (row) {
                const statusBadgeContainer = row.querySelector('.badge');
                if (statusBadgeContainer) {
                    if (isChecked) {
                        statusBadgeContainer.textContent = 'Active';
                        statusBadgeContainer.classList.remove('bg-secondary-subtle', 'text-secondary');
                        statusBadgeContainer.classList.add('bg-success-subtle', 'text-success');
                    } else {
                        statusBadgeContainer.textContent = 'Not Active';
                        statusBadgeContainer.classList.remove('bg-success-subtle', 'text-success');
                        statusBadgeContainer.classList.add('bg-secondary-subtle', 'text-secondary');
                    }
                }
            }
        });
    });
});

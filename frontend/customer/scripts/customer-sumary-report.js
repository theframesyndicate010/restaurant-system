// Initialize Customer Summary Report scripts
document.addEventListener('DOMContentLoaded', () => {
    console.log("Customer Summary Report initialized");

    // Add click listeners to table rows to navigate to Detailed View
    const tableRows = document.querySelectorAll('#reportTableBody tr');
    tableRows.forEach(row => {
        // Add hover pointer logically
        row.style.cursor = 'pointer';
        
        row.addEventListener('click', () => {
            // Get customer name from the second column
            const customerNameCell = row.querySelector('td:nth-child(2)');
            if (customerNameCell) {
                const customerName = encodeURIComponent(customerNameCell.textContent.trim());
                window.location.href = `customer-detailed-view.html?name=${customerName}`;
            }
        });
    });
});

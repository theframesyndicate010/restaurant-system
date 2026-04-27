// Initialize Customer Detailed View
document.addEventListener('DOMContentLoaded', () => {
    // Extract customer name from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const customerName = urlParams.get('name');
    
    // Set the title dynamically if parameter exists
    if (customerName) {
        const titleElement = document.getElementById('dynamicCustomerName');
        const breadcrumbElement = document.getElementById('dynamicCustomerBreadcrumb');
        if (titleElement) titleElement.textContent = customerName;
        if (breadcrumbElement) breadcrumbElement.textContent = customerName;
        
        // Update document title
        document.title = `${customerName} - Detailed View`;
    }
});

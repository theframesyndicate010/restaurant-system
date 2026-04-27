$(document).ready(function () {
    const $tbody = $('#movementGridBody');
    const $template = $('#movementRowTemplate');
    let rowCount = 0;

    // Function to add a new row
    window.addNewRow = function () {
        rowCount++;
        const $newRow = $($template.html());
        
        // Set SN
        $newRow.find('.row-sn').text(rowCount);
        
        // Append to table
        $tbody.append($newRow);
        
        // Setup listeners for this specific row
        setupRowListeners($newRow);
    };

    // Initialize with 3 empty rows
    for(let i=0; i<3; i++) {
        addNewRow();
    }

    // Row-specific event listeners
    function setupRowListeners($row) {
        // Item selection auto-fill
        $row.find('.item-select').on('change', function() {
            const $option = $(this).find(':selected');
            const code = $option.data('code') || '';
            const unit = $option.data('unit') || '';
            const rate = $option.data('rate') || '';

            $row.find('.item-code').val(code);
            $row.find('.item-unit').val(unit);
            $row.find('.rate-input').val(rate);
            
            calculateRow($row);
        });

        // Calculation on qty/rate change
        $row.find('.qty-input, .rate-input').on('input change', function() {
            calculateRow($row);
        });

        // Enter key on rate input (last editable column)
        $row.find('.rate-input').on('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewRow();
            }
        });
    }

    // Calculate row sub-total
    function calculateRow($row) {
        const qty = parseFloat($row.find('.qty-input').val()) || 0;
        const rate = parseFloat($row.find('.rate-input').val()) || 0;
        const subTotal = qty * rate;

        $row.find('.sub-total-input').val(subTotal.toFixed(2));
        updateOverallTotals();
    }

    // Update global footer stats
    function updateOverallTotals() {
        let totalItems = 0;
        let grandTotal = 0;

        $tbody.find('tr').each(function() {
            const $row = $(this);
            const subTotal = parseFloat($row.find('.sub-total-input').val()) || 0;
            const itemId = $row.find('.item-select').val();

            if (itemId) {
                totalItems++;
                grandTotal += subTotal;
            }
        });

        $('#totalItemsDisplay').text(totalItems);
        $('#grandTotalDisplay').text('Rs. ' + grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    }

    // Row deletion
    $tbody.on('click', '.delete-row-btn', function () {
        if ($tbody.find('tr').length > 1) {
            $(this).closest('tr').remove();
            updateSerialNumbers();
            updateOverallTotals();
        } else {
            alert("You must have at least one entry row.");
        }
    });

    // Reset loop for Serial Numbers
    function updateSerialNumbers() {
        rowCount = 0;
        $tbody.find('tr').each(function () {
            rowCount++;
            $(this).find('.row-sn').text(rowCount);
        });
    }
});

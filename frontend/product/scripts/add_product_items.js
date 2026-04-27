$(document).ready(function () {
    const $tbody = $('#batchProductTable');
    const $template = $('#batchRowTemplate');
    let rowCount = 0;

    // Function to add a new row
    window.addNewRow = function () {
        rowCount++;
        const $newRow = $($template.html());
        
        // Set SN
        $newRow.find('.row-sn').text(rowCount);
        
        // Append to table
        $tbody.append($newRow);
        
        // Focus first input of new row
        $newRow.find('input[name="name"]').focus();
        
        // Re-calculate focus/enter behavior
        setupEnterKey();
    };

    // Initialize with 3 empty rows
    for(let i=0; i<3; i++) {
        addNewRow();
    }

    // Handle Enter key on the last column
    function setupEnterKey() {
        $('.last-col').off('keydown').on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewRow();
            }
        });
    }

    // Handle row deletion
    $tbody.on('click', '.delete-row-btn', function () {
        if ($tbody.find('tr').length > 1) {
            $(this).closest('tr').remove();
            updateSerialNumbers();
        } else {
            alert("You must have at least one product row.");
        }
    });

    // Update SN after deletion
    function updateSerialNumbers() {
        rowCount = 0;
        $tbody.find('tr').each(function () {
            rowCount++;
            $(this).find('.row-sn').text(rowCount);
        });
    }

    // Helper: Bulk data capture (for future use)
    window.getGridData = function() {
        const data = [];
        $tbody.find('tr').each(function() {
            const row = {};
            $(this).find('input, select').each(function() {
                const name = $(this).attr('name');
                const val = $(this).is(':checkbox') ? $(this).is(':checked') : $(this).val();
                if(name) row[name] = val;
            });
            data.push(row);
        });
        return data;
    };
});

// JavaScript for report export functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get references to export buttons
    const exportCsvBtn = document.getElementById('export-csv');
    const exportPdfBtn = document.getElementById('export-pdf');
    
    // Set up event listeners for export buttons if they exist
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportReport('csv');
        });
    }
    
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportReport('pdf');
        });
    }
    
    // Function to handle report export
    function exportReport(format) {
        // Get current filter values
        const startDate = document.getElementById('start_date').value;
        const endDate = document.getElementById('end_date').value;
        const userId = document.getElementById('user_id').value;
        
        // Build export URL with query parameters
        let exportUrl = '';
        if (format === 'csv') {
            exportUrl = `/admin/export-csv?start_date=${startDate}&end_date=${endDate}&user_id=${userId}`;
        } else if (format === 'pdf') {
            exportUrl = `/admin/export-pdf?start_date=${startDate}&end_date=${endDate}&user_id=${userId}`;
        }
        
        // Navigate to export URL to trigger download
        if (exportUrl) {
            window.location.href = exportUrl;
        }
    }
    
    // Initialize date pickers with default values if empty
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');
    
    if (startDateInput && !startDateInput.value) {
        // Set default start date to 7 days ago
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 7);
        startDateInput.value = formatDate(defaultStartDate);
    }
    
    if (endDateInput && !endDateInput.value) {
        // Set default end date to today
        const defaultEndDate = new Date();
        endDateInput.value = formatDate(defaultEndDate);
    }
    
    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});

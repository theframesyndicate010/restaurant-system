document.addEventListener("DOMContentLoaded", () => {
    // Colors for the charts
    const colors = {
        kitchenGreen: '#66bb6a', // Green
        barYellow: '#ffca28',    // Yellow
        barLightGreen: '#a5d6a7' // Lighter Green for Sales chart
    };

    // Set dashboard date dynamically
    const dashDateEl = document.getElementById('dash-date');
    if (dashDateEl) {
        const d = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dashDateEl.textContent = d.toLocaleDateString('en-US', options);
    }

    // 1. No. Of Orders Chart
    const ordersChartEl = document.getElementById('ordersChart');
    if (ordersChartEl) {
        const ctxOrders = ordersChartEl.getContext('2d');
        new Chart(ctxOrders, {
            type: 'bar',
            data: {
                labels: ['Hourly', 'Hour 1', 'Hour 2', 'Hour 3', 'Hour 4', 'Hour 5', 'Hour 6'],
                datasets: [
                    {
                        label: 'Kitchen Order',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: colors.kitchenGreen,
                        borderRadius: 3,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    },
                    {
                        label: 'Bar Order',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: colors.barYellow,
                        borderRadius: 3,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { family: "'Inter', sans-serif", size: 13 }, bodyFont: { family: "'Inter', sans-serif", size: 12 }, padding: 10, cornerRadius: 8, displayColors: true },
                    legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { family: "'Inter', sans-serif", size: 11 } } }
                },
                scales: {
                    y: { beginAtZero: true, max: 5, ticks: { stepSize: 1, font: { family: "'Inter', sans-serif" } }, grid: { color: '#f0f0f0' } },
                    x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", size: 10 } } }
                }
            }
        });
    }

    // 2. Kitchen & Bar Sales Chart
    const salesChartEl = document.getElementById('salesChart');
    if (salesChartEl) {
        const ctxSales = salesChartEl.getContext('2d');
        new Chart(ctxSales, {
            type: 'bar',
            data: {
                labels: ['1', '2', '3', '4', '5'],
                datasets: [
                    { label: 'Kitchen', data: [0, 0, 0, 0, 0], backgroundColor: colors.kitchenGreen, borderRadius: 3, barPercentage: 0.6, categoryPercentage: 0.8 },
                    { label: 'Bar', data: [0, 0, 0, 0, 0], backgroundColor: colors.barLightGreen, borderRadius: 3, barPercentage: 0.6, categoryPercentage: 0.8 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: { duration: 1500, easing: 'easeOutQuart' },
                indexAxis: 'y',
                plugins: { tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { family: "'Inter', sans-serif", size: 13 }, bodyFont: { family: "'Inter', sans-serif", size: 12 }, padding: 10, cornerRadius: 8, displayColors: true }, legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { family: "'Inter', sans-serif", size: 11 } } } },
                scales: {
                    x: { beginAtZero: true, ticks: { callback: function(value) { if (value === 0) return 'Rs 0'; return 'Rs ' + (value); }, font: { family: "'Inter', sans-serif", size: 10 } }, grid: { color: '#f0f0f0' } },
                    y: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" } } }
                }
            }
        });
    }
});

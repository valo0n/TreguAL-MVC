const API = "http://localhost:5104";
const COLORS = ['#112D4E', '#3F72AF', '#DBE2EF', '#F9F7F7', '#4E7FFF', '#48BB78'];

// State variables (si useState)
let currentToken = localStorage.getItem("token");
let salesChart = null;
let yearChart = null;

document.addEventListener("DOMContentLoaded", () => {
    // Event Listener për ndryshimin e Range
    const rangeSelect = document.getElementById("rangeSelect");
    rangeSelect.addEventListener("change", (e) => {
        loadSales(e.target.value);
    });

    // Token Refresh Listener (Logjika nga React useEffect i parë)
    window.addEventListener("token-refreshed", (e) => {
        console.log("📱 Token refresh event received in UserDashboard JS:", e.detail);
        if (e.detail && e.detail.token) {
            currentToken = e.detail.token;
            // Opsionale: Mund të rifreskosh të dhënat kur ndryshon tokeni
            // loadSales(rangeSelect.value); 
        }
    });

    // Initial Load
    loadSales("daily");
    loadYearly();
});

/* ---------------- MAIN SALES CHART LOGIC ---------------- */

async function loadSales(range) {
    // 1. Update UI State -> Loading
    setMainLoading(true);
    document.getElementById("rangeLabel").textContent = range;

    try {
        const res = await fetch(`${API}/api/chart/sales/${range}`, {
            headers: { Authorization: `Bearer ${currentToken}` }
        });

        if (!res.ok) throw new Error("Chart data fetch failed");

        const data = await res.json();
        
        // Calculate Total Sales
        const total = data.reduce((sum, item) => sum + item.total, 0);
        document.getElementById("totalSales").textContent = formatCurrency(total);
        document.getElementById("chartTitle").textContent = getChartTitle(range);

        // 2. Render Chart or No Data
        if (data.length === 0) {
            toggleMainChartData(false); // Show No Data message
        } else {
            toggleMainChartData(true); // Show Chart Canvas
            renderSalesChart(data, range);
        }

    } catch (err) {
        console.error("Failed to fetch chart data:", err);
        // Mund të shtosh një UI për error këtu nëse dëshiron
        toggleMainChartData(false);
    } finally {
        setMainLoading(false);
    }
}

function renderSalesChart(data, range) {
    const ctx = document.getElementById("salesChart").getContext('2d');
    
    if (salesChart) {
        salesChart.destroy();
    }

    // Përcaktimi i tipit të grafikut bazuar në React logic:
    // React: if weekly or monthly -> Line, else -> Bar
    // Vini re: opsioni "yearly" në select ka tekstin "Monthly", pra nëse range == "yearly" (Monthly),
    // React kodi shkonte tek "else" -> BarChart. Do e ruajmë këtë logjikë.
    
    const isLineChart = (range === 'weekly' || range === 'monthly');
    const chartType = isLineChart ? 'line' : 'bar';

    salesChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: "Sales",
                data: data.map(d => d.total),
                backgroundColor: "#112D4E",
                borderColor: "#112D4E",
                borderWidth: 2,
                // Për Line chart, bëje 'monotone' (të lakuar) si në React
                tension: isLineChart ? 0.4 : 0, 
                pointRadius: isLineChart ? 3 : 0,
                pointHoverRadius: 6,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // React nuk kishte legjendë tek main chart
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#000',
                    bodyColor: '#112D4E',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `Sales: ${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                },
                y: {
                    grid: { color: '#eee', borderDash: [3, 3] }, // CartesianGrid strokeDasharray="3 3"
                    ticks: {
                        font: { size: 10 },
                        callback: (value) => formatCurrency(value, true) // Compact version for axis
                    }
                }
            }
        }
    });
}

/* ---------------- YEARLY COMPARISON LOGIC ---------------- */

async function loadYearly() {
    setYearlyLoading(true);
    
    try {
        const res = await fetch(`${API}/api/chart/sales/yearscomparison`, {
            headers: { Authorization: `Bearer ${currentToken}` }
        });

        if (!res.ok) throw new Error("Yearly comparison data fetch failed");

        let data = await res.json();
        // React Logic: map 0 to "All Years"
        data = data.map(item => item.year === 0 ? { ...item, year: "All Years" } : item);

        if (data.length === 0) {
            toggleYearlyData(false); // Show No Data
        } else {
            toggleYearlyData(true); // Show Chart
            renderYearChart(data);
        }

    } catch (err) {
        console.error("Failed to fetch yearly comparison data:", err);
        toggleYearlyData(false);
    } finally {
        setYearlyLoading(false);
    }
}

function renderYearChart(data) {
    const ctx = document.getElementById("yearChart").getContext('2d');
    
    if (yearChart) {
        yearChart.destroy();
    }

    yearChart = new Chart(ctx, {
        type: "doughnut", // Ose "pie", por Recharts Pie shpesh duket si Doughnut nëse ka radius
        data: {
            labels: data.map(d => d.year.toString()),
            datasets: [{
                data: data.map(d => d.total),
                backgroundColor: COLORS,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '0%', // Bëje 0% për Pie, ose 50% për Doughnut. React përdor Pie.
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20 }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.chart._metasets[context.datasetIndex].total;
                            const percentage = ((value / total) * 100).toFixed(0) + '%';
                            return `${label}: ${formatCurrency(value)} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

/* ---------------- UI STATE HELPERS ---------------- */

function setMainLoading(isLoading) {
    const loader = document.getElementById("mainChartLoader");
    const content = document.getElementById("mainChartContainer");
    
    if (isLoading) {
        loader.classList.remove("hidden");
        content.classList.add("hidden");
    } else {
        loader.classList.add("hidden");
        content.classList.remove("hidden");
    }
}

function toggleMainChartData(hasData) {
    const noData = document.getElementById("mainChartNoData");
    const canvas = document.getElementById("mainChartCanvasWrapper");
    
    if (hasData) {
        noData.classList.add("hidden");
        canvas.classList.remove("hidden");
    } else {
        noData.classList.remove("hidden");
        canvas.classList.add("hidden");
    }
}

function setYearlyLoading(isLoading) {
    const loader = document.getElementById("yearChartLoader");
    const content = document.getElementById("yearChartContainer");
    const noData = document.getElementById("yearChartNoData");

    if (isLoading) {
        loader.classList.remove("hidden");
        content.classList.add("hidden");
        noData.classList.add("hidden");
    } else {
        loader.classList.add("hidden");
        // Content display varet nga data check
    }
}

function toggleYearlyData(hasData) {
    const content = document.getElementById("yearChartContainer");
    const noData = document.getElementById("yearChartNoData");
    
    if (hasData) {
        content.classList.remove("hidden");
        noData.classList.add("hidden");
    } else {
        content.classList.add("hidden");
        noData.classList.remove("hidden");
    }
}

/* ---------------- FORMATTERS ---------------- */

function getChartTitle(range) {
    switch(range) {
        case 'daily': return "Today's Sales (Hourly)";
        case 'weekly': return 'Last 7 Days Sales';
        case 'monthly': return 'Last 30 Days Sales';
        case 'yearly': return 'Last 12 Months Sales'; // React option text thotë "Monthly" por value eshte "yearly"
        default: return 'Sales Data';
    }
}

function formatCurrency(val, compact = false) {
    const options = {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    };
    
    // Për boshtin Y nëse duam numra të shkurtër (p.sh. 1k)
    if (compact) {
       // Chart.js e bën vetë zakonisht, por mund të kthejmë thjesht numrin
       // ose të përdorim notation: "compact"
       // options.notation = "compact"; 
    }

    return new Intl.NumberFormat("de-DE", options).format(val);
}
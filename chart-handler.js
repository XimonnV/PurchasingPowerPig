/**
 * ChartHandler - Plotly.js Chart Management
 *
 * Responsibilities:
 * - Initialize Plotly.js chart in chart panel
 * - Update chart data in real-time as simulation runs
 * - Plot savings value and PP value over time (monthly)
 * - Clear/reset chart when simulation restarts
 *
 * Dependencies:
 * - config.js (CONFIG constants)
 * - state-manager.js (state values)
 * - plotly.js (loaded via CDN)
 *
 * Example:
 * ```javascript
 * const chartHandler = new ChartHandler(CONFIG, stateManager);
 * chartHandler.initialize();
 * ```
 */
class ChartHandler {
    /**
     * Create a new ChartHandler
     * @param {Object} config - Configuration object (CONFIG from config.js)
     * @param {Object} stateManager - State manager instance
     */
    constructor(config, stateManager) {
        this.config = config;
        this.state = stateManager;

        // Chart data arrays (month 0 to 360)
        this.months = [0]; // X-axis: months elapsed
        this.savingsData = []; // Y-axis: total nominal savings (USD)
        this.ppData = []; // Y-axis: purchasing power value (USD equivalent)

        // Chart element
        this.chartElement = null;

        // Chart initialized flag
        this.isChartReady = false;

        // Colors from savings display
        this.SAVINGS_COLOR = '#2196F3'; // Blue
        this.PP_COLOR = '#4CAF50'; // Green (dollar color)

        // Background shading colors (20% opacity)
        this.USD_BACKGROUND = 'rgba(76, 175, 80, 0.2)'; // Green for USD mode
        this.BTC_BACKGROUND = 'rgba(247, 147, 26, 0.2)'; // Bitcoin orange for BTC mode

        // Track vehicle mode periods for background shading
        // Array of {startMonth, endMonth, vehicle}
        this.vehiclePeriods = [];
    }

    /**
     * Initialize the chart handler
     * Creates Plotly chart and sets up state subscriptions
     */
    initialize() {
        // Get chart panel element
        this.chartElement = document.querySelector('.chart-panel');

        if (!this.chartElement) {
            console.warn('Chart panel element not found');
            return;
        }

        // Wait for Plotly to be loaded
        if (typeof Plotly === 'undefined') {
            console.warn('Plotly.js not loaded yet, retrying in 100ms...');
            setTimeout(() => this.initialize(), 100);
            return;
        }

        // Initialize chart with starting data point
        this.initializeStartingDataPoint();

        // Create initial chart
        this.createChart();

        // Subscribe to date changes to update chart (every month)
        this.state.subscribe('currentSimDate', () => {
            const currentMonth = this.getMonthsElapsed();
            const lastMonth = this.months[this.months.length - 1];

            // Detect restart: if month goes backwards, clear chart first
            if (currentMonth < lastMonth) {
                this.clearChart();
            }

            this.updateChart();
        });

        console.log('✓ ChartHandler initialized');
    }

    /**
     * Initialize chart with starting data point (month 0)
     */
    initializeStartingDataPoint() {
        // Month 0 data
        this.months = [0];

        // At month 0, both savings and PP equal the starting amount (no inflation yet)
        const startingAmount = this.state.getStartingAmount();

        this.savingsData = [startingAmount];
        this.ppData = [startingAmount];

        // Initialize vehicle periods with starting vehicle at month 0
        const vehicle = this.state.getSavingsVehicle();
        this.vehiclePeriods = [{
            startMonth: 0,
            endMonth: 0,
            vehicle: vehicle
        }];
    }

    /**
     * Calculate months elapsed since simulation started
     * @returns {number} Number of months elapsed
     */
    getMonthsElapsed() {
        return this.state.getMonthsElapsed();
    }

    /**
     * Build Plotly shapes for background shading
     * Creates rectangles for each vehicle period
     * @returns {Array} Array of Plotly shape objects
     */
    buildBackgroundShapes() {
        return this.vehiclePeriods.map(period => {
            const color = period.vehicle === this.config.savingsVehicle.options.BTC
                ? this.BTC_BACKGROUND
                : this.USD_BACKGROUND;

            return {
                type: 'rect',
                xref: 'x',
                yref: 'paper', // Use paper coordinates for full height
                x0: period.startMonth,
                x1: period.endMonth,
                y0: 0,
                y1: 1,
                fillcolor: color,
                line: { width: 0 },
                layer: 'below' // Draw behind data
            };
        });
    }

    /**
     * Create the initial Plotly chart
     */
    createChart() {
        const savingsTrace = {
            x: this.months,
            y: this.savingsData,
            type: 'scatter',
            mode: 'lines',
            name: 'Savings',
            line: {
                color: this.SAVINGS_COLOR,
                width: 2
            }
        };

        const ppTrace = {
            x: this.months,
            y: this.ppData,
            type: 'scatter',
            mode: 'lines',
            name: 'PP Value',
            line: {
                color: this.PP_COLOR,
                width: 2
            }
        };

        const layout = {
            title: {
                text: 'Savings vs Purchasing Power',
                font: { size: 14 }
            },
            xaxis: {
                title: 'Month',
                range: [0, 360],
                fixedrange: true // Disable zoom
            },
            yaxis: {
                title: 'USD',
                rangemode: 'tozero',
                fixedrange: true // Disable zoom
            },
            margin: {
                l: 60,
                r: 20,
                t: 40,
                b: 40
            },
            showlegend: true,
            legend: {
                x: 0,
                y: 1,
                orientation: 'h'
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(255,255,255,0.4)',
            shapes: this.buildBackgroundShapes() // Add background shading
        };

        const config = {
            displayModeBar: false, // Hide Plotly toolbar
            responsive: true
        };

        Plotly.newPlot(this.chartElement, [savingsTrace, ppTrace], layout, config);
        this.isChartReady = true;
    }

    /**
     * Update chart with latest data point
     * Called every month when simulation advances
     */
    updateChart() {
        if (!this.isChartReady || !this.chartElement) {
            return;
        }

        // Get current month
        const currentMonth = this.getMonthsElapsed();

        // Only add new point if month increased (prevent duplicates)
        if (currentMonth <= this.months[this.months.length - 1]) {
            return;
        }

        // Get savings value (matches savings display logic exactly)
        const vehicle = this.state.getSavingsVehicle();
        let savingsValue;

        if (vehicle === this.config.savingsVehicle.options.BTC) {
            // BTC mode: convert BTC to USD using power law for current date
            const currentDate = this.state.get('currentSimDate');
            const btcAmount = this.state.get('totalSavingsBtc');
            savingsValue = convertBtcToUsd(btcAmount, currentDate);
        } else {
            // USD mode: total nominal savings
            savingsValue = this.state.get('totalSavings');
        }

        // Get PP value (matches savings display logic exactly)
        const ppValue = this.state.getPPValue();

        // Add new data point
        this.months.push(currentMonth);
        this.savingsData.push(savingsValue);
        this.ppData.push(ppValue);

        // Update vehicle periods for background shading
        this.updateVehiclePeriods(currentMonth, vehicle);

        // Update Plotly chart with new data and background shapes
        Plotly.update(this.chartElement, {
            x: [this.months, this.months],
            y: [this.savingsData, this.ppData]
        }, {
            shapes: this.buildBackgroundShapes()
        }, [0, 1]);
    }

    /**
     * Update vehicle periods for background shading
     * Extends current period or creates new period if vehicle changed
     * @param {number} currentMonth - Current month
     * @param {string} vehicle - Current vehicle mode ('usd' or 'btc')
     */
    updateVehiclePeriods(currentMonth, vehicle) {
        const lastPeriod = this.vehiclePeriods[this.vehiclePeriods.length - 1];

        if (lastPeriod.vehicle === vehicle) {
            // Same vehicle: extend current period
            lastPeriod.endMonth = currentMonth;
        } else {
            // Vehicle changed: create new period
            this.vehiclePeriods.push({
                startMonth: currentMonth,
                endMonth: currentMonth,
                vehicle: vehicle
            });
        }
    }

    /**
     * Clear chart and reset to initial state
     * Called when simulation restarts
     */
    clearChart() {
        if (!this.isChartReady || !this.chartElement) {
            return;
        }

        // Reset data to starting point
        this.initializeStartingDataPoint();

        // Update chart with reset data and shapes
        Plotly.update(this.chartElement, {
            x: [this.months, this.months],
            y: [this.savingsData, this.ppData]
        }, {
            shapes: this.buildBackgroundShapes()
        }, [0, 1]);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ChartHandler = ChartHandler;
}

// Support direct exports if using as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartHandler };
}

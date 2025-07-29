// Debug utility for testing all tabs functionality
const TabDebugger = {
    async testAllTabs() {
        console.log('🔍 Starting comprehensive tab testing...');
        
        const results = {
            dashboard: await this.testDashboard(),
            players: await this.testPlayers(),
            collection: await this.testCollection(),
            expenses: await this.testExpenses(),
            reports: await this.testReports(),
            logs: await this.testLogs(),
            admin: await this.testAdmin()
        };
        
        console.log('📊 Tab Test Results:', results);
        return results;
    },
    
    async testDashboard() {
        try {
            console.log('Testing Dashboard...');
            const response = await API.getDashboardStats();
            console.log('Dashboard API Response:', response);
            
            if (response.success && response.data) {
                console.log('✅ Dashboard API working');
                console.log('Dashboard Data:', response.data);
                return { status: 'working', data: response.data };
            } else {
                console.log('❌ Dashboard API failed:', response.message);
                return { status: 'failed', error: response.message };
            }
        } catch (error) {
            console.log('❌ Dashboard error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    async testPlayers() {
        try {
            console.log('Testing Players...');
            const response = await API.getPlayers();
            console.log('Players API Response:', response);
            
            if (response.success && response.data) {
                console.log('✅ Players API working');
                console.log('Players count:', response.data.length);
                return { status: 'working', count: response.data.length };
            } else {
                console.log('❌ Players API failed:', response.message);
                return { status: 'failed', error: response.message };
            }
        } catch (error) {
            console.log('❌ Players error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    async testCollection() {
        try {
            console.log('Testing Collection...');
            const response = await API.getIncome();
            console.log('Collection API Response:', response);
            
            if (response.success && response.data) {
                console.log('✅ Collection API working');
                console.log('Collection count:', response.data.length);
                return { status: 'working', count: response.data.length };
            } else {
                console.log('❌ Collection API failed:', response.message);
                return { status: 'failed', error: response.message };
            }
        } catch (error) {
            console.log('❌ Collection error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    async testExpenses() {
        try {
            console.log('Testing Expenses...');
            const response = await API.getExpenses();
            console.log('Expenses API Response:', response);
            
            if (response.success && response.data) {
                console.log('✅ Expenses API working');
                console.log('Expenses count:', response.data.length);
                return { status: 'working', count: response.data.length };
            } else {
                console.log('❌ Expenses API failed:', response.message);
                return { status: 'failed', error: response.message };
            }
        } catch (error) {
            console.log('❌ Expenses error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    async testReports() {
        try {
            console.log('Testing Reports...');
            const currentMonth = DateUtils.getMonthKey(new Date());
            const response = await API.makeRequest('get_monthly_report', { month: currentMonth });
            console.log('Reports API Response:', response);
            
            if (response.success && response.data) {
                console.log('✅ Reports API working');
                return { status: 'working', data: response.data };
            } else {
                console.log('❌ Reports API failed:', response.message);
                return { status: 'failed', error: response.message };
            }
        } catch (error) {
            console.log('❌ Reports error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    async testLogs() {
        try {
            console.log('Testing Logs...');
            const response = await API.getLogs();
            console.log('Logs API Response:', response);
            
            if (response.success && response.data) {
                console.log('✅ Logs API working');
                console.log('Logs count:', response.data.length);
                return { status: 'working', count: response.data.length };
            } else {
                console.log('❌ Logs API failed:', response.message);
                return { status: 'failed', error: response.message };
            }
        } catch (error) {
            console.log('❌ Logs error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    async testAdmin() {
        try {
            console.log('Testing Admin...');
            const response = await API.getUsers();
            console.log('Admin/Users API Response:', response);
            
            if (response.success && response.data) {
                console.log('✅ Admin API working');
                console.log('Users count:', response.data.length);
                return { status: 'working', count: response.data.length };
            } else {
                console.log('❌ Admin API failed:', response.message);
                return { status: 'failed', error: response.message };
            }
        } catch (error) {
            console.log('❌ Admin error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    // Quick fix for undefined dashboard
    async fixDashboard() {
        console.log('🔧 Attempting to fix dashboard...');
        try {
            // Force clear cache
            if (API.clearCache) {
                API.clearCache('dashboard');
            }
            
            // Get fresh data
            const response = await API.getDashboardStats();
            
            if (response.success && response.data) {
                // Manually update the dashboard elements
                const activePlayersElement = document.getElementById('activePlayersCount');
                const totalCollectionElement = document.getElementById('totalCollectionAmount');
                const totalExpenseElement = document.getElementById('totalExpenseAmount');
                const finalBalanceElement = document.getElementById('finalBalanceAmount');
                
                if (activePlayersElement) {
                    activePlayersElement.textContent = response.data.activePlayersCount || 0;
                }
                if (totalCollectionElement) {
                    totalCollectionElement.textContent = CurrencyUtils.format(response.data.totalCollection || 0);
                }
                if (totalExpenseElement) {
                    totalExpenseElement.textContent = CurrencyUtils.format(response.data.totalExpenses || 0);
                }
                if (finalBalanceElement) {
                    finalBalanceElement.textContent = CurrencyUtils.format(response.data.finalBalance || 0);
                }
                
                console.log('✅ Dashboard manually updated with:', response.data);
                return true;
            } else {
                console.log('❌ Failed to get dashboard data');
                return false;
            }
        } catch (error) {
            console.log('❌ Error fixing dashboard:', error);
            return false;
        }
    }
};

// Add to global scope for console access
window.TabDebugger = TabDebugger;

// Auto-run test when page loads (for debugging)
if (CONFIG.DEBUG) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('🚀 Auto-running tab tests...');
            TabDebugger.testAllTabs();
        }, 3000);
    });
}
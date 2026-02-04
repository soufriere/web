/*
 * BUDGET TRACKER - SEGMENT LOGIC DOCUMENTATION
 *
 * This app manages three distinct budget segments, each with different calculation logic:
 *
 * 1. DAILY SEGMENT
 *    Purpose: Track day-to-day discretionary spending
 *    Calculation: 30-day rolling average with smooth budget transition
 *    - Uses only transactions from the last 30 days
 *    - Smooth extrapolation that transitions from budget to actual data:
 *      * No data: Returns budget * 30 (initial estimate)
 *      * < 30 days: Returns (budget * remaining_days) + actual_total
 *      * >= 30 days: Returns actual_total (full data available)
 *    - This creates a moving average that avoids wild swings from single transactions
 *    Labels: NO labels required (uses category buttons: In Food, Out Food, Shopping, Entertainment, Others)
 *    Income/Expense: Both supported - income reduces net spending
 *
 * 2. BILLS SEGMENT
 *    Purpose: Track recurring monthly bills and subscriptions
 *    Calculation: Static sum of all bill transactions (not time-based)
 *    - Running total of all bill transactions ever recorded
 *    - Represents monthly recurring costs
 *    Labels: REQUIRED - each transaction must have a description
 *    Income/Expense: Both supported - income reduces net bills
 *
 * 3. SPECIALS SEGMENT
 *    Purpose: Track large expenses (>€100) like travel, shopping, etc.
 *    Calculation: Annual expenses divided by 12 to get monthly average
 *    - Sums all special transactions across the entire year
 *    - Divides by 12 months to get monthly average
 *    - Answers: "How much do special expenses cost me per month on average?"
 *    Labels: REQUIRED - each transaction must have a description
 *    Income/Expense: Both supported - income reduces net specials
 */

// Data structure
let data = {
    bills: 0,
    specials: 0,
    daily: 0,
    expenses: []
};

// Current state
let selectedSegment = 'daily';
let currentAmount = '';
let transactionType = 'expense'; // 'expense' or 'income'

// Load data
function loadData() {
    const saved = localStorage.getItem('budgetTrackerData');
    if (saved) {
        data = JSON.parse(saved);
        // Migrate old data without type field
        if (data.expenses) {
            data.expenses = data.expenses.map(exp => {
                if (!exp.type) {
                    exp.type = 'expense'; // Default to expense for old data
                }
                return exp;
            });
        }
    }

    // Check for URL hash data and import if present
    importFromURLHash();

    render();
}

// Save data
function saveData() {
    localStorage.setItem('budgetTrackerData', JSON.stringify(data));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

// Event listeners
function setupEventListeners() {
    // Segment selection
    document.querySelectorAll('.budget-segment').forEach(segment => {
        segment.addEventListener('click', () => {
            selectSegment(segment.dataset.segment);
        });
    });

    // Digit buttons
    document.querySelectorAll('.digit-button').forEach(button => {
        button.addEventListener('click', () => {
            appendDigit(button.dataset.digit);
        });
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', clearAmount);

    // Transaction type toggle
    document.getElementById('expenseBtn').addEventListener('click', () => setTransactionType('expense'));
    document.getElementById('incomeBtn').addEventListener('click', () => setTransactionType('income'));

    // Category buttons
    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', () => {
            addExpense(button.dataset.category);
        });
    });

    // Label button
    document.getElementById('labelButton').addEventListener('click', openLabelModal);

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Label modal
    document.getElementById('closeLabelModal').addEventListener('click', closeLabelModal);
    document.getElementById('saveLabelExpense').addEventListener('click', saveLabelExpense);

    // Close modals on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSettings();
    });
    document.getElementById('labelModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeLabelModal();
    });
}

// Set transaction type
function setTransactionType(type) {
    transactionType = type;

    // Update toggle buttons
    document.getElementById('expenseBtn').classList.toggle('active', type === 'expense');
    document.getElementById('incomeBtn').classList.toggle('active', type === 'income');

    // Update segment label
    updateSegmentLabel();
}

// Update segment label based on selected segment and transaction type
function updateSegmentLabel() {
    const labels = {
        bills: transactionType === 'income' ? 'Bills Income' : 'Bills Expense',
        specials: transactionType === 'income' ? 'Special Income' : 'Special Expense',
        daily: transactionType === 'income' ? 'Daily Income' : 'Daily Expense'
    };
    document.getElementById('selectedLabel').textContent = labels[selectedSegment];
}

// Select budget segment
function selectSegment(segment) {
    selectedSegment = segment;

    // Update UI
    document.querySelectorAll('.budget-segment').forEach(seg => {
        seg.classList.remove('active');
    });
    document.getElementById(`${segment}-segment`).classList.add('active');

    // Update label
    updateSegmentLabel();

    // Update input field background color based on active segment
    const amountInput = document.getElementById('amountInput');
    const segmentColors = {
        bills: '#3b82f6',
        specials: '#8b5cf6',
        daily: '#10b981'
    };
    amountInput.style.background = segmentColors[segment];

    // Show/hide category buttons vs label button
    if (segment === 'daily') {
        document.getElementById('categoryButtons').style.display = 'grid';
        document.getElementById('labelButton').style.display = 'none';
    } else {
        document.getElementById('categoryButtons').style.display = 'none';
        document.getElementById('labelButton').style.display = 'block';
    }

    // Re-render expenses list to show only the selected segment
    renderExpenses();
}

// Digit pad
function appendDigit(digit) {
    if (currentAmount === '0' || currentAmount === '') {
        currentAmount = digit;
    } else {
        currentAmount += digit;
    }
    document.getElementById('amountInput').value = currentAmount;
}

function clearAmount() {
    currentAmount = '';
    document.getElementById('amountInput').value = '';
}

// Add expense
function addExpense(category) {
    const amount = parseFloat(currentAmount);
    if (!amount || amount === 0) return;

    const expense = {
        id: Date.now(),
        amount: amount,
        segment: selectedSegment,
        category: category,
        label: category,
        date: Date.now(),
        type: transactionType // 'expense' or 'income'
    };

    data.expenses.unshift(expense);
    saveData();
    render();
    clearAmount();
}

// Label modal
function openLabelModal() {
    const amount = parseFloat(currentAmount);
    if (!amount || amount === 0) return;

    const typeText = transactionType === 'income' ? 'Income' : 'Expense';
    const titles = {
        bills: `Add Bills ${typeText} Description`,
        specials: `Add Specials ${typeText} Description`
    };
    document.getElementById('labelModalTitle').textContent = titles[selectedSegment];
    document.getElementById('labelInput').value = '';
    document.getElementById('labelModal').classList.add('active');
    document.getElementById('labelInput').focus();
}

function closeLabelModal() {
    document.getElementById('labelModal').classList.remove('active');
}

function saveLabelExpense() {
    const amount = parseFloat(currentAmount);
    const label = document.getElementById('labelInput').value.trim();

    if (!amount || !label) {
        alert('Please enter a description');
        return;
    }

    const expense = {
        id: Date.now(),
        amount: amount,
        segment: selectedSegment,
        category: selectedSegment,
        label: label,
        date: Date.now(),
        type: transactionType // 'expense' or 'income'
    };

    data.expenses.unshift(expense);
    saveData();
    render();
    clearAmount();
    closeLabelModal();
}

// Delete expense (make it global for onclick)
window.deleteExpense = function(id) {
    if (confirm('Delete this expense?')) {
        data.expenses = data.expenses.filter(exp => exp.id !== id);
        saveData();
        render();
    }
}

// Settings
function openSettings() {
    document.getElementById('billsInput').value = data.bills;
    document.getElementById('specialsInput').value = data.specials;
    document.getElementById('dailyInput').value = data.daily;
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    data.bills = parseFloat(document.getElementById('billsInput').value) || 0;
    data.specials = parseFloat(document.getElementById('specialsInput').value) || 0;
    data.daily = parseFloat(document.getElementById('dailyInput').value) || 0;
    saveData();
    render();
    closeSettings();
}

// Calculate total spending for a segment
function calculateSegmentSpending(segment) {
    const segmentExpenses = data.expenses.filter(exp => exp.segment === segment);

    if (segmentExpenses.length === 0) return 0;

    // BILLS: Static sum of all bill transactions
    if (segment === 'bills') {
        return segmentExpenses.reduce((sum, exp) => {
            const multiplier = exp.type === 'income' ? -1 : 1;
            return sum + (exp.amount * multiplier);
        }, 0);
    }

    // SPECIALS: Annual expenses divided by 12 for monthly average
    if (segment === 'specials') {
        const total = segmentExpenses.reduce((sum, exp) => {
            const multiplier = exp.type === 'income' ? -1 : 1;
            return sum + (exp.amount * multiplier);
        }, 0);

        // Divide by 12 months to get monthly average from annual data
        return total / 12;
    }

    // DAILY: 30-day rolling average with smooth budget transition
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const recentExpenses = segmentExpenses.filter(exp => exp.date >= thirtyDaysAgo);

    // No transactions yet - use budget as initial estimate
    if (recentExpenses.length === 0) {
        return data.daily * 30;
    }

    const actualTotal = recentExpenses.reduce((sum, exp) => {
        const multiplier = exp.type === 'income' ? -1 : 1;
        return sum + (exp.amount * multiplier);
    }, 0);
    const oldestExpense = Math.min(...recentExpenses.map(exp => exp.date));
    const daysOfData = Math.max(1, (now - oldestExpense) / (24 * 60 * 60 * 1000));

    // Smooth transition: budget for remaining days + actual for days with data
    if (daysOfData >= 30) {
        // Full 30 days of data available - use actual data only
        return actualTotal;
    } else {
        // Blend budget estimate with actual data
        // For each day that passes, replace one day of budget with actual spending
        const budgetEstimate = data.daily * (30 - daysOfData);
        return budgetEstimate + actualTotal;
    }
}

// Calculate 30-day spend
function calculate30DaySpend() {
    return calculateSegmentSpending('daily');
}

// Calculate category breakdown
function getCategoryBreakdown() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const dailyExpenses = data.expenses.filter(exp =>
        exp.segment === 'daily' && exp.date >= thirtyDaysAgo
    );

    const categories = {
        'In Food': 0,
        'Out Food': 0,
        'Shopping': 0,
        'Entertainment': 0,
        'Others': 0
    };

    dailyExpenses.forEach(exp => {
        if (categories.hasOwnProperty(exp.category)) {
            // Income reduces the total, expenses increase it
            const multiplier = exp.type === 'income' ? -1 : 1;
            categories[exp.category] += exp.amount * multiplier;
        }
    });

    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

    return Object.entries(categories).map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
    })).filter(item => item.percentage > 0);
}

// Format number
function fmt(n) {
    return Math.round(n);
}

// Render
function render() {
    // Calculate actual spending for each segment
    const billsSpending = calculateSegmentSpending('bills');
    const specialsSpending = calculateSegmentSpending('specials');
    const dailySpending = calculateSegmentSpending('daily');

    // Use the higher of budget or actual spending for each segment
    const billsDisplay = Math.max(data.bills, billsSpending);
    const specialsDisplay = Math.max(data.specials, specialsSpending);
    const dailyDisplay = Math.max(data.daily * 30, dailySpending);

    // Calculate total for percentages
    const totalBudget = billsDisplay + specialsDisplay + dailyDisplay;
    document.getElementById('totalBudget').textContent = fmt(totalBudget);

    // Calculate percentages
    const billsPercent = totalBudget > 0 ? (billsDisplay / totalBudget) * 100 : 33;
    const specialsPercent = totalBudget > 0 ? (specialsDisplay / totalBudget) * 100 : 33;
    const dailyPercent = totalBudget > 0 ? (dailyDisplay / totalBudget) * 100 : 34;

    // Update segment widths
    document.getElementById('bills-segment').style.width = `max(80px, ${billsPercent}%)`;
    document.getElementById('specials-segment').style.width = `max(80px, ${specialsPercent}%)`;
    document.getElementById('daily-segment').style.width = `max(80px, ${dailyPercent}%)`;

    // Update amounts
    document.getElementById('bills-segment').querySelector('.seg-amount').textContent = `€${fmt(billsDisplay)}`;
    document.getElementById('specials-segment').querySelector('.seg-amount').textContent = `€${fmt(specialsDisplay)}`;
    document.getElementById('daily-segment').querySelector('.seg-amount').textContent = `€${fmt(dailyDisplay)}`;

    // Update 30-day spend
    const spendElement = document.getElementById('thirtyDaySpend');
    spendElement.textContent = `€${fmt(dailySpending)}`;
    spendElement.className = dailySpending > (data.daily * 30) ? 'over-budget' : 'under-budget';

    // Render category breakdown
    renderCategoryBreakdown();

    // Render expenses list
    renderExpenses();
}

// Render category breakdown
function renderCategoryBreakdown() {
    const breakdown = getCategoryBreakdown();
    const container = document.getElementById('categoryBreakdown');

    if (breakdown.length === 0) {
        container.innerHTML = '';
        return;
    }

    const categoryClasses = {
        'In Food': 'in-food',
        'Out Food': 'out-food',
        'Shopping': 'shopping',
        'Entertainment': 'entertainment',
        'Others': 'others'
    };

    container.innerHTML = breakdown
        .map(item => `
            <div class="category-bar ${categoryClasses[item.category]}"
                 style="width: ${item.percentage}%"
                 title="${item.category}: €${fmt(item.amount)}">
            </div>
        `)
        .join('');
}

// Render expenses
function renderExpenses() {
    const container = document.getElementById('expensesList');

    // Filter expenses by active segment
    const filteredExpenses = data.expenses.filter(exp => exp.segment === selectedSegment);

    if (filteredExpenses.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = filteredExpenses
        .map(exp => {
            const isIncome = exp.type === 'income';
            const prefix = isIncome ? '+' : '';
            const typeClass = isIncome ? 'income' : 'expense';
            return `
                <div class="expense-item ${exp.segment} ${typeClass}">
                    <div class="expense-info">
                        <span class="expense-amount">${prefix}€${fmt(exp.amount)}</span>
                        <span class="expense-meta">${exp.label} • ${new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                    <button class="delete-button" onclick="deleteExpense(${exp.id})">✕</button>
                </div>
            `;
        })
        .join('');
}

// URL Hash Sync Functions
function getFilteredDataForSync() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Filter transactions based on segment rules
    const filteredExpenses = data.expenses.filter(exp => {
        // Include all transactions for bills and specials
        if (exp.segment === 'bills' || exp.segment === 'specials') {
            return true;
        }
        // Include only last 30 days for daily
        if (exp.segment === 'daily') {
            return exp.date >= thirtyDaysAgo;
        }
        return false;
    });

    return {
        bills: data.bills,
        specials: data.specials,
        daily: data.daily,
        expenses: filteredExpenses
    };
}

function exportToURLHash() {
    const syncData = getFilteredDataForSync();
    const jsonString = JSON.stringify(syncData);
    const encoded = btoa(encodeURIComponent(jsonString));

    const url = window.location.origin + window.location.pathname + '#' + encoded;

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            alert('Sync URL copied to clipboard!\n\nShare this URL to sync your budget data to another device.');
        }).catch(() => {
            // Fallback
            showURLInModal(url);
        });
    } else {
        // Fallback for older browsers
        showURLInModal(url);
    }
}

function showURLInModal(url) {
    // Fallback for browsers without clipboard API - use prompt to display URL
    prompt('Copy this sync URL to share your budget data:', url);
}

function importFromURLHash() {
    const hash = window.location.hash.substring(1);
    if (!hash) return false;

    try {
        const jsonString = decodeURIComponent(atob(hash));
        const importedData = JSON.parse(jsonString);

        // Validate data structure
        if (typeof importedData.bills === 'number' &&
            typeof importedData.specials === 'number' &&
            typeof importedData.daily === 'number' &&
            Array.isArray(importedData.expenses)) {

            // Check if we already have local data
            const hasLocalData = data.expenses && data.expenses.length > 0;

            if (hasLocalData) {
                if (confirm('Found data in URL. Merge with existing data or replace?\n\nOK = Merge (recommended)\nCancel = Skip import')) {
                    mergeData(importedData);
                    render();
                    // Clear hash after import
                    window.location.hash = '';
                    alert('Data merged successfully!');
                    return true;
                }
            } else {
                // No local data, just import
                data = importedData;
                // Migrate old data without type field
                if (data.expenses) {
                    data.expenses = data.expenses.map(exp => {
                        if (!exp.type) {
                            exp.type = 'expense';
                        }
                        return exp;
                    });
                }
                saveData();
                render();
                // Clear hash after import
                window.location.hash = '';
                alert('Data imported successfully!');
                return true;
            }
        }
    } catch (e) {
        console.error('Failed to import from URL hash:', e);
    }
    return false;
}

function mergeData(importedData) {
    // Update budgets to the imported values
    data.bills = importedData.bills;
    data.specials = importedData.specials;
    data.daily = importedData.daily;

    // Merge expenses - avoid duplicates based on id
    const existingIds = new Set(data.expenses.map(exp => exp.id));
    const newExpenses = importedData.expenses.filter(exp => !existingIds.has(exp.id));

    // Migrate old data without type field
    const migratedNew = newExpenses.map(exp => {
        if (!exp.type) {
            exp.type = 'expense';
        }
        return exp;
    });

    data.expenses = [...data.expenses, ...migratedNew];

    // Sort by date (newest first)
    data.expenses.sort((a, b) => b.date - a.date);

    saveData();
}

// Make exportToURLHash global for onclick
window.exportToURLHash = exportToURLHash;

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

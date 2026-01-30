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

// Load data
function loadData() {
    const saved = localStorage.getItem('budgetTrackerData');
    if (saved) {
        data = JSON.parse(saved);
    }
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

    // Import/Export
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', importData);
    document.getElementById('closeImportExport').addEventListener('click', closeImportExport);

    // Close modals on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSettings();
    });
    document.getElementById('labelModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeLabelModal();
    });
    document.getElementById('importExportModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeImportExport();
    });
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
    const labels = {
        bills: 'Bills Expense',
        specials: 'Special Expense',
        daily: 'Daily Expense'
    };
    document.getElementById('selectedLabel').textContent = labels[segment];

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
        date: Date.now()
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

    const titles = {
        bills: 'Add Bills Description',
        specials: 'Add Specials Description'
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
        date: Date.now()
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
    // For bills and specials, use total of all transactions
    if (segment === 'bills' || segment === 'specials') {
        const segmentExpenses = data.expenses.filter(exp => exp.segment === segment);
        return segmentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }

    // For daily, use 30-day calculation
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const segmentExpenses = data.expenses.filter(exp =>
        exp.segment === segment && exp.date >= thirtyDaysAgo
    );

    if (segmentExpenses.length === 0) return 0;

    const total = segmentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const oldestExpense = Math.min(...segmentExpenses.map(exp => exp.date));
    const daysOfData = Math.max(1, (now - oldestExpense) / (24 * 60 * 60 * 1000));

    return daysOfData < 30 ? (total / daysOfData) * 30 : total;
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
            categories[exp.category] += exp.amount;
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
    const dailyDisplay = Math.max(data.daily, dailySpending);

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
    spendElement.className = dailySpending > data.daily ? 'over-budget' : 'under-budget';

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
        .map(exp => `
            <div class="expense-item ${exp.segment}">
                <div class="expense-info">
                    <span class="expense-amount">€${fmt(exp.amount)}</span>
                    <span class="expense-meta">${exp.label} • ${new Date(exp.date).toLocaleDateString()}</span>
                </div>
                <button class="delete-button" onclick="deleteExpense(${exp.id})">✕</button>
            </div>
        `)
        .join('');
}

// Import/Export functions
function exportData() {
    const jsonData = JSON.stringify(data, null, 2);
    document.getElementById('importExportText').value = jsonData;
    document.getElementById('importExportModal').classList.add('active');
    document.getElementById('importExportText').select();
}

function importData() {
    document.getElementById('importExportText').value = '';
    document.getElementById('importExportModal').classList.add('active');
    document.getElementById('importExportText').focus();

    // Change behavior to import mode
    const saveBtn = document.getElementById('saveImportExport');
    saveBtn.textContent = 'Import Data';
    saveBtn.onclick = () => {
        try {
            const jsonData = document.getElementById('importExportText').value.trim();
            if (!jsonData) {
                alert('Please paste data to import');
                return;
            }
            const importedData = JSON.parse(jsonData);

            // Validate data structure
            if (typeof importedData.bills === 'number' &&
                typeof importedData.specials === 'number' &&
                typeof importedData.daily === 'number' &&
                Array.isArray(importedData.expenses)) {

                if (confirm('This will replace all current data. Continue?')) {
                    data = importedData;
                    saveData();
                    render();
                    closeImportExport();
                    alert('Data imported successfully!');
                }
            } else {
                alert('Invalid data format');
            }
        } catch (e) {
            alert('Invalid JSON format');
        }
    };
}

function closeImportExport() {
    document.getElementById('importExportModal').classList.remove('active');
    // Reset to export mode
    const saveBtn = document.getElementById('saveImportExport');
    saveBtn.textContent = 'Copy to Clipboard';
    saveBtn.onclick = copyToClipboard;
}

function copyToClipboard() {
    const textArea = document.getElementById('importExportText');
    textArea.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
}

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

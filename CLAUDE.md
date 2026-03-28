# CLAUDE.md - AI Assistant Guide

This document provides essential context for AI assistants working with this codebase. Last updated: 2026-02-15

## Repository Overview

This repository contains two Progressive Web Applications (PWAs) built with vanilla JavaScript:

1. **Budget Tracker** (root directory) - A personal finance tracking application
2. **12 Week Challenge** (`12w/` directory) - A goal tracking application

Both applications are designed as mobile-first PWAs with offline capabilities.

## Project Structure

```
/home/user/web/
├── index.html              # Budget Tracker main HTML
├── app.js                  # Budget Tracker logic (654 lines)
├── styles.css              # Budget Tracker styles (638 lines)
├── sw.js                   # Service Worker for PWA (54 lines)
├── manifest.json           # PWA manifest for Budget Tracker
├── README.md               # Basic project readme
├── combined_editor_translator JAN 2026.html  # Standalone editor tool
└── 12w/                    # 12 Week Challenge app directory
    ├── index.html          # Challenge tracker main file
    ├── manifest.json       # PWA manifest for 12w app
    ├── sw.js               # Service worker for 12w app
    ├── icon-192.png        # App icon (192x192)
    ├── icon-512.png        # App icon (512x512)
    └── blank               # Placeholder file
```

## Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Data Persistence**: LocalStorage API
- **Offline Support**: Service Worker with cache-first strategy
- **PWA Features**: Web App Manifest, iOS-specific meta tags
- **Build Tools**: None - direct browser execution

## Budget Tracker Application

### Core Concept

The Budget Tracker manages three distinct budget segments with different calculation logic:

#### 1. DAILY Segment
- **Purpose**: Track day-to-day discretionary spending
- **Calculation**: 30-day rolling average with smooth budget transition
  - No data: Returns `budget × 30` (initial estimate)
  - < 30 days: Returns `(budget × remaining_days) + actual_total`
  - ≥ 30 days: Returns `actual_total` (full data available)
- **Categories**: In Food, Out Food, Shopping, Entertainment, Others
- **Labels**: NOT required (category buttons handle classification)
- **Income/Expense**: Both supported

#### 2. BILLS Segment
- **Purpose**: Track recurring monthly bills and subscriptions
- **Calculation**: Static sum of all bill transactions (not time-based)
- **Labels**: REQUIRED for each transaction
- **Income/Expense**: Both supported

#### 3. SPECIALS Segment
- **Purpose**: Track large expenses (>€100) like travel, shopping
- **Calculation**: Annual expenses ÷ 12 for monthly average
- **Labels**: REQUIRED for each transaction
- **Income/Expense**: Both supported

### Key Features

1. **URL Hash Sync**: Export/import data via URL hash for cross-device sync
2. **Transaction Types**: Support for both expenses and income
3. **Category-based Tracking**: Visual categorization for daily expenses
4. **30-Day Analysis**: Rolling window for daily budget calculation
5. **Mobile-First Design**: Optimized for iOS with safe area insets

### Data Structure

```javascript
{
  bills: Number,      // Monthly bills budget
  specials: Number,   // Monthly specials budget
  daily: Number,      // Daily discretionary budget
  expenses: [         // Array of all transactions
    {
      segment: String,     // 'bills' | 'specials' | 'daily'
      category: String,    // Category name (for daily)
      label: String,       // Description (required for bills/specials)
      amount: Number,      // Transaction amount
      type: String,        // 'expense' | 'income'
      timestamp: Number    // Unix timestamp
    }
  ]
}
```

### Important Business Logic

**Daily Segment Calculation** (`app.js:200-240`):
- Uses only transactions from last 30 days
- Smooth extrapolation prevents wild swings from single transactions
- Creates moving average that transitions from estimated to actual data

**Specials Segment Calculation** (`app.js:240-260`):
- Sums all special transactions across entire year
- Divides by 12 to get monthly average
- Answers: "How much do special expenses cost me per month on average?"

**Bills Segment Calculation** (`app.js:260-280`):
- Running total of all bill transactions
- Represents monthly recurring costs
- Simple sum without time-based logic

## 12 Week Challenge Application

Located in `12w/` directory. A simpler goal-tracking PWA for managing weekly challenges.

### Features
- Grid-based goal tracking
- Checkbox-style completion tracking
- LocalStorage persistence
- Offline PWA support

## Development Workflows

### Code Style & Conventions

1. **No Build Process**: All code runs directly in the browser
2. **Vanilla JavaScript**: No frameworks or transpilation
3. **ES6+ Features**: Use modern JavaScript (arrow functions, template literals, etc.)
4. **Mobile-First**: Always consider mobile viewport and touch interactions
5. **Progressive Enhancement**: App works offline after first load

### Important Patterns

**Service Worker Strategy** (`sw.js`):
- Cache version: `budget-tracker-v5`
- Strategy: Cache-first for performance
- Immediate activation: `skipWaiting()` and `clients.claim()`

**Data Persistence**:
- Primary: `localStorage.getItem('budgetTrackerData')`
- Backup/Sync: URL hash encoding/decoding
- Migration: Old data without `type` field defaults to 'expense'

**Event Handling**:
- Direct event listeners (no delegation framework)
- Modal interactions: click outside to close
- Touch-optimized: `-webkit-tap-highlight-color: transparent`

### File Modification Guidelines

When editing files in this repository:

1. **app.js**:
   - Respect the three-segment calculation logic (see documentation at top of file)
   - Maintain data migration for backward compatibility
   - Test localStorage persistence after changes
   - Verify 30-day rolling calculation still works correctly

2. **styles.css**:
   - Maintain mobile-first responsive design
   - Preserve iOS safe area insets (`env(safe-area-inset-*)`)
   - Keep dark theme colors consistent (`#0f172a`, `#1e293b`)
   - Test on mobile viewports

3. **sw.js**:
   - Increment `CACHE_NAME` version when updating cached files
   - Maintain cache-first strategy for performance
   - Test offline functionality after changes

4. **index.html**:
   - Preserve PWA meta tags for iOS compatibility
   - Keep inline critical CSS for fast first render
   - Maintain viewport settings for mobile

### Testing Checklist

When making changes, verify:

- [ ] Data persists to localStorage correctly
- [ ] Service worker caches updates (increment version)
- [ ] Mobile viewport renders correctly (test at 375px width)
- [ ] iOS safe areas respected (no content behind notch)
- [ ] All three segments calculate correctly
- [ ] URL hash sync works for import/export
- [ ] Modals open/close properly
- [ ] Transaction type toggle (expense/income) works
- [ ] Offline functionality maintained

### Common Tasks

**Adding a new feature**:
1. Update data structure in `loadData()` if needed
2. Add migration logic for existing users
3. Update `saveData()` if structure changed
4. Implement UI in `index.html`
5. Add styles to `styles.css`
6. Implement logic in `app.js`
7. Test data persistence and migration
8. Increment service worker cache version

**Fixing a bug**:
1. Identify which segment logic is affected (daily/bills/specials)
2. Review calculation documentation in `app.js:1-34`
3. Check transaction filtering (30-day vs all-time)
4. Verify income/expense type handling
5. Test with edge cases (no data, single transaction, >30 days)

**Updating styles**:
1. Maintain mobile-first approach
2. Test on narrow viewports (320px-375px)
3. Verify safe area insets on iOS
4. Check dark theme consistency
5. Test touch target sizes (minimum 44px)

## Git Workflow

### Branch Naming Convention
- Claude branches: `claude/<description>-<sessionId>`
- Example: `claude/add-claude-documentation-Hu7Ad`

### Commit Messages
Based on git history, the project uses clear, descriptive commits:
- Format: `<Action> <description>`
- Examples:
  - "Fix daily budget calculation bug"
  - "Add URL hash sync & improve iOS PWA compatibility"
  - "Implement editor performance and robustness improvements"

### Recent Development History
The project has recently focused on:
- Budget calculation accuracy fixes
- iOS PWA compatibility improvements
- URL hash-based sync (replacing JSONbin.io)
- Editor performance enhancements
- UI/UX improvements (moving buttons, modals)

## Key Architectural Decisions

1. **No Backend**: Completely client-side to avoid hosting costs
2. **LocalStorage**: Simple, synchronous persistence (trade-off: 5MB limit)
3. **URL Hash Sync**: Clever workaround for cross-device sync without backend
4. **Vanilla JS**: No framework overhead, faster load times, simpler debugging
5. **Service Worker**: Cache-first for instant offline access
6. **Three-Segment Design**: Different calculation strategies for different expense types

## Performance Considerations

- **First Load**: Inline critical CSS for instant render
- **Offline**: Service worker with cache-first strategy
- **Data Size**: LocalStorage 5MB limit (monitor expense array growth)
- **Calculations**: All budget math runs synchronously (acceptable for small datasets)
- **Mobile**: Touch-optimized, no 300ms click delay

## Security Notes

- No authentication (single-user app)
- Data stored in plaintext localStorage
- URL hash may expose data in browser history/logs
- Consider warning users about sharing URLs with sensitive data

## Browser Compatibility

- **Primary Target**: Modern mobile browsers (iOS Safari, Chrome Android)
- **PWA Support**: iOS 11.3+, Android Chrome 40+
- **LocalStorage**: All modern browsers
- **Service Worker**: All modern browsers except IE11

## Common Pitfalls to Avoid

1. **Don't break the 30-day calculation**: Daily segment logic is complex and critical
2. **Don't skip data migration**: Old users rely on backward compatibility
3. **Don't forget cache version**: Service worker won't update without version bump
4. **Don't ignore iOS safe areas**: Content can hide behind notch
5. **Don't add dependencies**: Keep it vanilla for performance and simplicity
6. **Don't break offline mode**: Test service worker after any file changes

## Useful Code References

- Daily calculation: `app.js:200-240`
- Specials calculation: `app.js:240-260`
- Bills calculation: `app.js:260-280`
- URL hash export: `app.js:450-480`
- URL hash import: `app.js:480-520`
- Data persistence: `app.js:50-75`
- Service worker cache: `sw.js:1-55`

## Questions to Ask Before Changes

1. Does this affect any of the three segment calculations?
2. Do existing users need data migration?
3. Will this work offline?
4. Does the service worker cache need updating?
5. Is this mobile-friendly and touch-optimized?
6. Does this respect iOS safe areas?
7. Will this fit in the 5MB localStorage limit?
8. Can this be done without adding dependencies?

## Future Considerations

Based on git history, potential areas for enhancement:
- Budget forecasting and predictions
- Export to CSV or other formats
- Category customization for daily expenses
- Budget alerts and notifications
- Data visualization improvements
- Multi-currency support

---

**Note for AI Assistants**: This is a personal finance app with real user data. Prioritize data integrity and backward compatibility in all changes. When in doubt, ask the user before modifying calculation logic or data structures.

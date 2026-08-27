# Testing Guide: Looking Ahead Feature

Manual test steps for the existing diary "Looking Ahead" feature.
For overall testing priorities and strategy, see [testing.md](testing.md).

## Quick Testing Steps

### Option 1: Manual Date Manipulation (Fastest)

1. **Create an entry with "Looking Ahead" for yesterday:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Run this to create a test entry for yesterday:
   ```javascript
   // Get yesterday's date
   const yesterday = new Date();
   yesterday.setDate(yesterday.getDate() - 1);
   const yesterdayStr = yesterday.toISOString().split('T')[0];
   console.log('Yesterday date:', yesterdayStr);
   ```
   - Create a new entry and set the date to yesterday (use the date from console)
   - Fill in the "Looking Ahead" field with test text
   - Save the entry

2. **Clear the dismissal flag:**
   - In DevTools, go to Application tab (Chrome) or Storage tab (Firefox)
   - Navigate to Local Storage → your app's domain
   - Delete the key `lookingAheadReminderDismissed` (or set it to yesterday's date)
   - Refresh the page

3. **Verify the reminder appears:**
   - The popup should show immediately after page load
   - It should display yesterday's "Looking Ahead" content
   - Test dismissing it with the X button or "Got it" button

### Option 2: Real-time Testing (More Realistic)

1. **Day 1 - Create entry with "Looking Ahead":**
   - Create a new entry for today
   - Fill in "Looking Ahead" field: "Test task 1, Test task 2"
   - Save the entry

2. **Day 2 - Test the reminder:**
   - The next day, when you first visit the app
   - The reminder popup should automatically appear
   - It should show yesterday's "Looking Ahead" items
   - Dismiss it and verify it doesn't show again that day

3. **Verify dismissal persistence:**
   - Refresh the page
   - The reminder should NOT appear again (already dismissed today)
   - Check localStorage: `lookingAheadReminderDismissed` should be today's date

## Testing Checklist

### Form Field Testing
- [ ] "Looking Ahead" field appears in Quick Entry form
- [ ] "Looking Ahead" field appears in New Entry form
- [ ] "Looking Ahead" field appears in Edit Entry form
- [ ] Placeholder text shows: "let's tackle this tomorrow"
- [ ] Can enter and save text in the field
- [ ] Saved text persists when viewing entry details
- [ ] Saved text persists when editing entry

### Reminder Popup Testing
- [ ] Popup appears on first visit of the day (if yesterday had "Looking Ahead")
- [ ] Popup shows correct date (yesterday)
- [ ] Popup displays the "Looking Ahead" content correctly
- [ ] Popup can be dismissed with X button
- [ ] Popup can be dismissed with "Got it" button
- [ ] Popup doesn't appear again after dismissal (same day)
- [ ] Popup appears again the next day (if new "Looking Ahead" exists)

### Edge Cases
- [ ] No popup if yesterday had no entries
- [ ] No popup if yesterday's entry had empty "Looking Ahead"
- [ ] No popup if yesterday's entry had only whitespace in "Looking Ahead"
- [ ] Multiple entries yesterday - popup shows the one with "Looking Ahead"
- [ ] Popup works correctly across day boundaries (midnight)

## Browser DevTools Commands

### Check if reminder should show:
```javascript
const today = new Date().toISOString().split('T')[0];
const dismissed = localStorage.getItem('lookingAheadReminderDismissed');
console.log('Today:', today);
console.log('Dismissed date:', dismissed);
console.log('Should show:', dismissed !== today);
```

### Force show reminder (for testing):
```javascript
localStorage.removeItem('lookingAheadReminderDismissed');
// Then refresh the page
```

### Check yesterday's entries:
```javascript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];
console.log('Check entries for:', yesterdayStr);
// Then check your entries API or database
```

## Common Issues & Solutions

**Issue: Reminder doesn't appear**
- Check: Is there an entry from yesterday with "Looking Ahead"?
- Check: Was the reminder already dismissed today? (check localStorage)
- Check: Browser console for errors

**Issue: Reminder appears every time**
- Check: localStorage key `lookingAheadReminderDismissed` is being set
- Check: Date format matches (YYYY-MM-DD)

**Issue: Wrong content in reminder**
- Check: Multiple entries yesterday - it shows the first one with "Looking Ahead"
- Check: Entry date is correct (should be yesterday)



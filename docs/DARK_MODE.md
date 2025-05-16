# Dark Mode Implementation Guide for Elevee Admin

This guide explains how to ensure all pages in the admin panel properly support dark mode.

## Overview

The dark mode infrastructure is already set up with:

- Theme context provider
- ThemeToggle component
- Theme initializer for preventing flash
- Proper CSS variables
- Basic integration with navigation

However, not all pages properly support dark mode yet. Here's how to update them.

## Using Pre-built Dark Mode Components

We've created several components to make dark mode support easier:

1. **In `my-app/app/components/ui/dark-mode-wrapper.tsx`**:
   - `DarkModePanel`: A wrapper for cards/panels with proper dark mode styles
   - `DarkModeStatus`: For status badges/labels
   - `DarkModeText`: For text that needs dark mode support
   - And many more utility components

2. **CSS Classes in `globals.css`**:
   - `.dark-mode-compatible`: General purpose dark mode styles
   - `.dark-mode-card`: For card elements
   - `.dark-mode-text`: For text content
   - `.dark-mode-subtle-text`: For secondary text
   - `.dark-mode-link`: For links
   - `.dark-mode-bg`: Just for background colors

## How to Update Pages

### 1. Replace Background Colors

```diff
- <div className="bg-white">
+ <div className="bg-white dark:bg-gray-800">
```

Or use the utility class:

```diff
- <div className="bg-white">
+ <div className="dark-mode-bg">
```

### 2. Update Text Colors

```diff
- <p className="text-gray-500">
+ <p className="text-gray-500 dark:text-gray-400">
```

Or use the utility class:

```diff
- <p className="text-gray-500">
+ <p className="dark-mode-subtle-text">
```

### 3. Update Cards/Panels

Instead of:
```jsx
<Card className="bg-white border border-gray-200">
  {/* content */}
</Card>
```

Use:
```jsx
<DarkModePanel>
  {/* content */}
</DarkModePanel>
```

Or add classes:
```jsx
<Card className="dark-mode-card">
  {/* content */}
</Card>
```

### 4. Update Status Indicators

Instead of:
```jsx
<span className={`${status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
  {status}
</span>
```

Use:
```jsx
<DarkModeStatus status={status === 'active' ? 'success' : 'error'}>
  {status}
</DarkModeStatus>
```

### 5. Update Links

```diff
- <a className="text-blue-600 hover:text-blue-800">Link</a>
+ <a className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Link</a>
```

Or use the utility class:
```jsx
<a className="dark-mode-link">Link</a>
```

## Testing Dark Mode Support

1. Toggle between light and dark mode using the theme toggle in the navigation
2. Check all pages for proper contrast
3. Ensure all text is legible in both modes
4. Verify that all UI elements (buttons, cards, inputs) adapt properly

## Common Elements That Need Dark Mode Support

- Table headers: `bg-gray-100 dark:bg-gray-700`
- Table rows: `hover:bg-gray-50 dark:hover:bg-gray-800`
- Borders: `border-gray-200 dark:border-gray-700`
- Inputs: `bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600`
- Buttons: Need hover states for dark mode
- Status indicators: Need dark variants
- Dropdowns and popover menus

## Important CSS Variables

Use these CSS variables when possible as they automatically support dark mode:

- `bg-background`: Primary background
- `text-foreground`: Primary text color
- `bg-card`: Card background
- `text-card-foreground`: Card text
- `bg-muted`: Subtle background
- `text-muted-foreground`: Subtle text

## Recommended Process

1. Start with the most frequently used pages (Dashboard, Products, Orders)
2. Update shared components first for maximum impact
3. Use the utility components and classes whenever possible
4. Test frequently by toggling between light and dark mode 
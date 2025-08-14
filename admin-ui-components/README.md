# Admin UI Components for Price Range Management

This folder contains React components for managing category price ranges in the admin dashboard.

## Components

### CategoryPriceRanges

A modal component for viewing and editing price ranges for categories.

#### Features

- **View existing price ranges** for a category
- **Add/remove price ranges** dynamically
- **Edit price range details** (name, label, min/max prices, query)
- **Configure scraping settings** (max products per range, max pages, status)
- **Reset to default ranges** functionality
- **Real-time validation** and error handling
- **Responsive design** for mobile and desktop

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `categoryId` | string | Yes | The ID of the category to manage |
| `onClose` | function | Yes | Callback function when modal is closed |

#### Usage Example

```jsx
import React, { useState } from 'react';
import CategoryPriceRanges from './CategoryPriceRanges';

const CategoryManagement = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showPriceRanges, setShowPriceRanges] = useState(false);

  const handleManagePriceRanges = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setShowPriceRanges(true);
  };

  const handleClosePriceRanges = () => {
    setShowPriceRanges(false);
    setSelectedCategoryId(null);
  };

  return (
    <div>
      {/* Your category list */}
      <div className="category-list">
        {categories.map(category => (
          <div key={category._id} className="category-item">
            <h3>{category.title}</h3>
            <button 
              onClick={() => handleManagePriceRanges(category._id)}
              className="btn btn-primary"
            >
              Manage Price Ranges
            </button>
          </div>
        ))}
      </div>

      {/* Price ranges modal */}
      {showPriceRanges && (
        <CategoryPriceRanges
          categoryId={selectedCategoryId}
          onClose={handleClosePriceRanges}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
```

#### Integration with Existing Admin Dashboard

1. **Copy the component files** to your admin project:
   - `CategoryPriceRanges.jsx`
   - `CategoryPriceRanges.css`

2. **Update your category management page** to include the price range button:

```jsx
// In your existing category table/list component
<button 
  className="btn btn-sm btn-outline-primary"
  onClick={() => openPriceRangesModal(category._id)}
  title="Manage Price Ranges"
>
  💰 Price Ranges
</button>
```

3. **Add the modal to your page state**:

```jsx
const [priceRangeModal, setPriceRangeModal] = useState({
  show: false,
  categoryId: null
});

const openPriceRangesModal = (categoryId) => {
  setPriceRangeModal({ show: true, categoryId });
};

const closePriceRangesModal = () => {
  setPriceRangeModal({ show: false, categoryId: null });
};
```

## API Endpoints

The component uses these API endpoints:

### Get Price Ranges
```
GET /api/categories/:id/price-ranges
Authorization: Bearer {admin_token}
```

### Update Price Ranges
```
PUT /api/categories/:id/price-ranges
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "priceRanges": [
    {
      "name": "under_10k",
      "label": "₹5,000 - ₹10,000",
      "min": 5000,
      "max": 10000,
      "query": "under 10000"
    }
  ],
  "scrapingConfig": {
    "maxProductsPerRange": 20,
    "maxPages": 2,
    "scrapingStatus": "pending"
  }
}
```

### Reset to Default
```
POST /api/categories/:id/price-ranges/reset
Authorization: Bearer {admin_token}
```

## Price Range Object Structure

```javascript
{
  name: "under_10k",           // Unique identifier for the range
  label: "₹5,000 - ₹10,000",   // Display label for users
  min: 5000,                   // Minimum price in rupees
  max: 10000,                  // Maximum price in rupees
  query: "under 10000"         // Search query for scraping
}
```

## Scraping Configuration Structure

```javascript
{
  maxProductsPerRange: 20,     // Maximum products to scrape per range
  maxPages: 2,                 // Maximum pages to scrape
  scrapingStatus: "pending"    // Status: pending|in_progress|completed|failed
}
```

## Styling

The component uses Bootstrap-inspired CSS classes. You can:

1. **Use the provided CSS file** as-is
2. **Customize the CSS** to match your admin theme
3. **Replace with your CSS framework** (Tailwind, Material-UI, etc.)

## Dependencies

- React 16.8+ (uses hooks)
- Modern browser with fetch API support
- Admin authentication system

## Error Handling

The component handles:
- Network errors
- Authentication errors
- Validation errors
- Loading states
- Success feedback

## Responsive Design

The component is fully responsive and works on:
- Desktop screens (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (< 768px)

## Future Enhancements

- Bulk import/export of price ranges
- Price range templates for different category types
- Historical tracking of price range changes
- Integration with scraping job status

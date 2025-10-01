# Technical Documentation - Dashboard Application

## Overview

A React-based dashboard application for managing vehicles, home rents, and electricity bills. The application provides a unified interface for tracking expirations, payments, and statuses across different types of assets and bills.

## Technology Stack

- **Frontend Framework**: React with Vite
- **Styling**: TailwindCSS
- **State Management**: React Hooks + Local Storage
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure Explained

### 1. Core Components

#### App.jsx - Main Application Component

```jsx
// The root component that manages:
// - Tab state (which section is active)
// - Item counts for each section
// - Renders the main layout

const App = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('vehicles');

  // State for item counts
  const [counts, setCounts] = useState({
    vehicles: getDataCount('vehicles'),
    homeRents: getDataCount('homeRents'),
    electricity: getDataCount('electricity')
  });

  // Update counts every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts({...}); // Updates counts from localStorage
    }, 1000);
    return () => clearInterval(interval);
  }, []);
}
```

#### Container Components (e.g., VehiclesContainer.jsx)

```jsx
// Manages the data and logic for each section:
// - Filtering
// - Search
// - CRUD operations
// - Dialog states

const VehiclesContainer = ({ initialData = [] }) => {
  // Form dialog state
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Data management hook
  const { data: items, addItem, updateItem, deleteItem } = useDataManagement(initialData, 'vehicle');

  // Filtering logic
  const filteredItems = items.filter((item) => {
    const matchSearch = /* Search logic */;
    const matchStatus = /* Status filter logic */;
    return matchSearch && matchStatus;
  });
}
```

### 2. Custom Hooks

#### useDataManagement.js

```jsx
// Custom hook for managing CRUD operations and data persistence
export const useDataManagement = (initialData, type = "vehicle") => {
  // Load data from localStorage or use initialData
  const [data, setData] = useState(() => loadSavedData(type, initialData));

  // Add new item
  const addItem = (newItem) => {
    const id =
      data.length > 0 ? Math.max(...data.map((item) => item.id)) + 1 : 1;
    const itemWithStatus = updateItemStatus({ ...newItem, id });
    const newData = [...data, itemWithStatus];
    setData(newData);
    updateMockData(type, newData); // Save to localStorage
  };

  // Update existing item
  const updateItem = (id, updatedItem) => {
    const newData = data.map((item) =>
      item.id === id ? updateItemStatus({ ...updatedItem, id }) : item
    );
    setData(newData);
    updateMockData(type, newData);
  };

  // Delete item
  const deleteItem = (id) => {
    const newData = data.filter((item) => item.id !== id);
    setData(newData);
    updateMockData(type, newData);
  };

  return { data, addItem, updateItem, deleteItem };
};
```

### 3. Utility Functions

#### storageUtils.js

```javascript
// Handles all localStorage operations
const LOCAL_STORAGE_KEYS = {
  vehicle: "savedVehicles",
  homeRent: "savedHomeRents",
  electricity: "savedElectricity",
};

// Load data from localStorage
export const loadSavedData = (type, initialData) => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEYS[type]);
    return savedData ? JSON.parse(savedData) : initialData;
  } catch (error) {
    return initialData;
  }
};

// Save data to localStorage
export const updateMockData = (type, data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS[type], JSON.stringify(data));
    return true;
  } catch (error) {
    return false;
  }
};
```

#### dateUtils.js

```javascript
// Date-related utility functions
export const isExpired = (date) => {
  return new Date(date) < new Date();
};

export const getExpiryStatus = (date) => {
  const today = new Date();
  const expiryDate = new Date(date);
  const daysUntilExpiry = Math.ceil(
    (expiryDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 10) return "warning";
  return "valid";
};
```

### 4. Reusable Components

#### FormDialog.jsx

```jsx
// Reusable dialog component for forms
const FormDialog = ({ isOpen, onClose, title, children }) => {
  // Click outside handler
  const handleClickOutside = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={handleClickOutside} className="fixed inset-0 ...">
      <div className="bg-white rounded-lg ...">
        <div className="flex items-center justify-between ...">
          <h3>{title}</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
```

#### ConfirmDialog.jsx

```jsx
// Confirmation dialog for delete operations
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 ...">
      <div className="bg-white rounded-lg ...">
        <div className="flex items-center ...">
          <h3>{title}</h3>
          <button onClick={onCancel}>
            <X />
          </button>
        </div>
        <div className="p-6">
          <p>{message}</p>
        </div>
        <div className="flex gap-3 ...">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Confirm Delete</button>
        </div>
      </div>
    </div>
  );
};
```

### 5. Data Flow

1. **Initial Load**

   ```javascript
   // 1. App.jsx loads with initial mock data
   // 2. Container components initialize with useDataManagement hook
   // 3. Hook checks localStorage for existing data
   // 4. If found, uses localStorage data; if not, uses mock data
   ```

2. **Adding Items**

   ```javascript
   // 1. User clicks "Add" button -> Opens FormDialog
   // 2. User submits form -> handleSubmit called
   // 3. addItem function in useDataManagement called
   // 4. New item added to state and saved to localStorage
   // 5. UI updates automatically through React state
   ```

3. **Editing Items**

   ```javascript
   // 1. User clicks edit icon -> Opens FormDialog with item data
   // 2. User modifies and submits -> handleSubmit called
   // 3. updateItem function in useDataManagement called
   // 4. Item updated in state and localStorage
   // 5. UI updates with new data
   ```

4. **Deleting Items**

   ```javascript
   // 1. User clicks delete icon -> Opens ConfirmDialog
   // 2. User confirms -> confirmDelete called
   // 3. deleteItem function in useDataManagement called
   // 4. Item removed from state and localStorage
   // 5. UI updates to remove item
   ```

5. **Search and Filtering**
   ```javascript
   // 1. User enters search term or selects filter
   // 2. Container component's filter function runs
   // 3. filteredItems updated based on search/filter criteria
   // 4. UI updates to show filtered results
   ```

### 6. State Management

1. **Local Component State**

   - Form dialog state (open/closed, current item)
   - Delete dialog state (open/closed, item id)
   - Search term and filter status

2. **Shared State**

   - Item data (managed by useDataManagement)
   - Tab selection (managed by App.jsx)
   - Item counts (managed by App.jsx)

3. **Persistent State**
   - All data changes saved to localStorage
   - Loaded on component mount
   - Updated after every CRUD operation

### 7. Key Features Implementation

1. **Real-time Item Counts**

   ```javascript
   // App.jsx maintains counts with setInterval
   useEffect(() => {
     const updateCounts = () => {
       setCounts({
         vehicles: getDataCount("vehicles"),
         homeRents: getDataCount("homeRents"),
         electricity: getDataCount("electricity"),
       });
     };
     const interval = setInterval(updateCounts, 1000);
     return () => clearInterval(interval);
   }, []);
   ```

2. **Status Updates**

   ```javascript
   // Regular status checks in useDataManagement
   useEffect(() => {
     const checkAndUpdateStatus = () => {
       const updatedData = data.map(updateItemStatus);
       if (JSON.stringify(updatedData) !== JSON.stringify(data)) {
         setData(updatedData);
       }
     };

     checkAndUpdateStatus();
     const interval = setInterval(checkAndUpdateStatus, 3600000);
     return () => clearInterval(interval);
   }, [data, updateItemStatus]);
   ```

### 8. Performance Considerations

1. **Optimizations**

   - Memoized filter functions
   - Debounced search functionality
   - Efficient localStorage updates
   - Status checks at reasonable intervals
   - Lazy loading of components
   - Optimized re-rendering with useMemo and useCallback

2. **Memory Management**
   - Cleanup of intervals in useEffect
   - Proper unmounting of dialogs
   - Careful management of event listeners
   - Efficient data structure updates

### 9. Color Coding System

The application uses a consistent color-coding system across all tabs for visual clarity:

1. **Status Colors**

   - Red (`bg-red-100 border-l-4 border-red-500`): Expired items
   - Yellow/Orange (`bg-yellow-100 border-l-4 border-orange-500`): Warning status
   - White (`bg-white border-l-4 border-transparent`): Normal/Valid status

2. **Implementation**
   ```javascript
   // Consistent styling through getRowColorClass utility
   export const getRowColorClass = (item, type) => {
     // Check type-specific conditions
     if (isExpired(item)) {
       return "bg-red-100 border-l-4 border-red-500";
     }
     if (isWarning(item)) {
       return "bg-yellow-100 border-l-4 border-orange-500";
     }
     return "bg-white border-l-4 border-transparent";
   };
   ```

### 10. Error Handling

1. **Form Validation**

   - Required field validation
   - Date format validation
   - Numeric value validation
   - Duplicate entry prevention

2. **Data Operations**

   ```javascript
   try {
     // Attempt data operation
     await performOperation();
   } catch (error) {
     // Handle specific error types
     handleError(error);
   }
   ```

3. **Local Storage Fallbacks**
   - Graceful degradation when storage is full
   - Data integrity checks
   - Recovery mechanisms

### 11. Testing Considerations

1. **Unit Tests**

   - Component rendering tests
   - Utility function tests
   - Hook behavior tests
   - Form validation tests

2. **Integration Tests**

   - Data flow tests
   - User interaction flows
   - Storage integration tests

3. **E2E Tests**
   - Critical path testing
   - Cross-browser compatibility
   - Mobile responsiveness

### 12. Deployment

1. **Build Process**

   ```bash
   # Development
   npm install        # Install dependencies
   npm run dev       # Start development server

   # Production
   npm run build    # Create production build
   npm run preview  # Preview production build
   ```

2. **Environment Configuration**
   - Development vs Production settings
   - Environment variables management
   - Feature flags

### 13. Future Enhancements

1. **Planned Features**

   - Data export functionality
   - Advanced filtering options
   - Batch operations
   - Data visualization
   - Push notifications

2. **Technical Improvements**
   - State management optimization
   - Performance monitoring
   - Automated testing
   - Progressive Web App features

This documentation covers the technical implementation details of the application. Each section explains how different parts work together and how data flows through the system. For any specific implementation details or clarification, refer to the inline comments in the respective code files.

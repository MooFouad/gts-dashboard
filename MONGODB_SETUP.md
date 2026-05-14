# MongoDB Integration Guide for Windows Server

## Prerequisites

1. **Windows Server Requirements**
   - Windows Server 2019 or later
   - Administrator privileges
   - PowerShell 5.1 or later
   - Node.js 16.x or later
   - MongoDB 6.0 or later

## MongoDB Installation on Windows Server

### 1. Install MongoDB Community Edition

```powershell
# Create MongoDB data and log directories
New-Item -ItemType Directory -Path "C:\data\db"
New-Item -ItemType Directory -Path "C:\data\log"

# Download MongoDB installer (adjust version as needed)
Invoke-WebRequest -Uri "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.0-signed.msi" -OutFile "mongodb.msi"

# Install MongoDB (Run as Administrator)
msiexec.exe /i mongodb.msi ADDLOCAL="ServerService" /qn
```

### 2. Configure MongoDB as a Windows Service

1. Create MongoDB configuration file:

```powershell
# Create mongod.cfg file
@"
systemLog:
    destination: file
    path: C:\data\log\mongod.log
storage:
    dbPath: C:\data\db
net:
    bindIp: 127.0.0.1
    port: 27017
security:
    authorization: enabled
"@ | Out-File -FilePath "C:\Program Files\MongoDB\Server\6.0\mongod.cfg" -Encoding UTF8
```

2. Install and start MongoDB service:

```powershell
# Install service
& "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\6.0\mongod.cfg" --install

# Start service
Start-Service MongoDB
```

## Application Setup

### 1. Install Required Dependencies

```bash
# Install MongoDB driver and other dependencies
npm install mongodb mongoose dotenv
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```plaintext
MONGODB_URI=mongodb://username:password@localhost:27017/dashboard
MONGODB_DB_NAME=dashboard
```

### 3. MongoDB Connection Setup

Create a new file `src/config/database.js`:

```javascript
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
```

### 4. Create MongoDB Schemas

Create `src/models/` directory with the following schema files:

`src/models/Vehicle.js`:

```javascript
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    unique: true,
  },
  licenseExpiryDate: {
    type: Date,
    required: true,
  },
  inspectionExpiryDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Vehicle", vehicleSchema);
```

`src/models/HomeRent.js`:

```javascript
import mongoose from "mongoose";

const homeRentSchema = new mongoose.Schema({
  propertyName: {
    type: String,
    required: true,
  },
  firstPaymentDate: Date,
  secondPaymentDate: Date,
  thirdPaymentDate: Date,
  fourthPaymentDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("HomeRent", homeRentSchema);
```

`src/models/Electricity.js`:

```javascript
import mongoose from "mongoose";

const electricitySchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Unpaid"],
    default: "Unpaid",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Electricity", electricitySchema);
```

### 5. Update Data Management Hook

Modify `src/hooks/useDataManagement.js` to use MongoDB:

```javascript
import { useState, useEffect } from "react";
import Vehicle from "../models/Vehicle";
import HomeRent from "../models/HomeRent";
import Electricity from "../models/Electricity";

const modelMap = {
  vehicle: Vehicle,
  homeRent: HomeRent,
  electricity: Electricity,
};

export const useDataManagement = (type) => {
  const [data, setData] = useState([]);
  const Model = modelMap[type];

  // Fetch data
  const fetchData = async () => {
    try {
      const items = await Model.find({});
      setData(items);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    }
  };

  // Add item
  const addItem = async (newItem) => {
    try {
      const item = new Model(newItem);
      const savedItem = await item.save();
      setData([...data, savedItem]);
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      throw error;
    }
  };

  // Update item
  const updateItem = async (id, updatedItem) => {
    try {
      const updated = await Model.findByIdAndUpdate(id, updatedItem, {
        new: true,
      });
      setData(data.map((item) => (item._id === id ? updated : item)));
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      throw error;
    }
  };

  // Delete item
  const deleteItem = async (id) => {
    try {
      await Model.findByIdAndDelete(id);
      setData(data.filter((item) => item._id !== id));
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      throw error;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [type]);

  return { data, addItem, updateItem, deleteItem };
};
```

### 6. Update Main Application

Update `src/main.jsx`:

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import connectDB from "./config/database";
import "./index.css";

// Connect to MongoDB before rendering
connectDB().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

## Security Considerations

1. **MongoDB Security**

   - Enable authentication
   - Create specific database user
   - Configure firewall rules
   - Regular security updates

2. **Create MongoDB User**

```javascript
use dashboard
db.createUser({
    user: "dashboardUser",
    pwd: "secure_password",
    roles: [{ role: "readWrite", db: "dashboard" }]
})
```

3. **Firewall Configuration**

```powershell
# Allow MongoDB port
New-NetFirewallRule -DisplayName "MongoDB" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 27017
```

## Backup Configuration

1. **Automated Backups**
   Create a backup script `backup.ps1`:

```powershell
$date = Get-Date -Format "yyyy-MM-dd"
$backupPath = "C:\MongoBackups\$date"
New-Item -ItemType Directory -Force -Path $backupPath
mongodump --uri="mongodb://username:password@localhost:27017/dashboard" --out=$backupPath
```

2. **Schedule Daily Backups**

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "MongoDBBackup" -Description "Daily MongoDB backup"
```

## Monitoring

1. **Install MongoDB Compass**

   - Download and install MongoDB Compass for GUI-based monitoring
   - Connect using: `mongodb://username:password@localhost:27017/dashboard`

2. **Basic Monitoring Commands**

```javascript
// Check database status
db.serverStatus();

// Monitor connections
db.currentOp();

// Check collection statistics
db.getCollection("vehicles").stats();
```

## Troubleshooting

1. **Common Issues**

   - Connection refused: Check MongoDB service status
   - Authentication failed: Verify credentials
   - Disk space issues: Monitor available space

2. **Logging**

   - Check MongoDB logs: `C:\data\log\mongod.log`
   - Application logs: Implement Winston or similar logging
   - Windows Event Viewer for service issues

3. **Service Commands**

```powershell
# Restart MongoDB service
Restart-Service MongoDB

# Check service status
Get-Service MongoDB

# View logs
Get-Content -Path "C:\data\log\mongod.log" -Tail 100
```

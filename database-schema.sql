-- ============================================
-- SALES RETURN SYSTEM SCHEMA
-- ============================================

-- 1. Sales Return Table
CREATE TABLE SalesReturn (
    id INT PRIMARY KEY AUTO_INCREMENT,
    returnNo VARCHAR(50) UNIQUE NOT NULL,
    invoiceId INT NOT NULL,
    carId INT NOT NULL,
    vin VARCHAR(100) NOT NULL,
    salePrice DECIMAL(15, 2) NOT NULL,
    vatAmount DECIMAL(15, 2) NOT NULL,
    depositAmount DECIMAL(15, 2) DEFAULT 0,
    refundableAmount DECIMAL(15, 2) NOT NULL,
    depositRefundable BOOLEAN DEFAULT FALSE,
    reason TEXT,
    status ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'DRAFT',
    returnDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    approvedBy INT NULL,
    approvedDate DATETIME NULL,
    rejectionReason TEXT NULL,
    createdBy INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoiceId) REFERENCES Invoices(id),
    FOREIGN KEY (carId) REFERENCES Cars(id),
    FOREIGN KEY (approvedBy) REFERENCES Users(id),
    FOREIGN KEY (createdBy) REFERENCES Users(id),
    INDEX idx_status (status),
    INDEX idx_invoiceId (invoiceId),
    INDEX idx_carId (carId),
    INDEX idx_returnDate (returnDate)
);

-- 2. Journal Entry Table
CREATE TABLE JournalEntry (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salesReturnId INT NOT NULL,
    accountCode VARCHAR(50) NOT NULL,
    accountName VARCHAR(255) NOT NULL,
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    entryDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(100),
    description TEXT,
    
    FOREIGN KEY (salesReturnId) REFERENCES SalesReturn(id) ON DELETE CASCADE,
    INDEX idx_salesReturnId (salesReturnId),
    INDEX idx_entryDate (entryDate),
    INDEX idx_accountCode (accountCode)
);

-- 3. Purchase Return Table
CREATE TABLE PurchaseReturn (
    id INT PRIMARY KEY AUTO_INCREMENT,
    returnNo VARCHAR(50) UNIQUE NOT NULL,
    purchaseInvoiceId INT NOT NULL,
    carId INT NOT NULL,
    vin VARCHAR(100) NOT NULL,
    purchasePrice DECIMAL(15, 2) NOT NULL,
    vatAmount DECIMAL(15, 2) NOT NULL,
    depositAmount DECIMAL(15, 2) DEFAULT 0,
    refundableAmount DECIMAL(15, 2) NOT NULL,
    depositRefundable BOOLEAN DEFAULT FALSE,
    reason TEXT,
    status ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'DRAFT',
    returnDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    approvedBy INT NULL,
    approvedDate DATETIME NULL,
    supplierId INT NOT NULL,
    createdBy INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (purchaseInvoiceId) REFERENCES PurchaseInvoices(id),
    FOREIGN KEY (carId) REFERENCES Cars(id),
    FOREIGN KEY (supplierId) REFERENCES Suppliers(id),
    FOREIGN KEY (approvedBy) REFERENCES Users(id),
    FOREIGN KEY (createdBy) REFERENCES Users(id),
    INDEX idx_status (status),
    INDEX idx_purchaseInvoiceId (purchaseInvoiceId),
    INDEX idx_carId (carId),
    INDEX idx_supplierId (supplierId),
    INDEX idx_returnDate (returnDate)
);

-- 4. Purchase Return Journal Entries
CREATE TABLE PurchaseReturnJournalEntry (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchaseReturnId INT NOT NULL,
    accountCode VARCHAR(50) NOT NULL,
    accountName VARCHAR(255) NOT NULL,
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    entryDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(100),
    description TEXT,
    
    FOREIGN KEY (purchaseReturnId) REFERENCES PurchaseReturn(id) ON DELETE CASCADE,
    INDEX idx_purchaseReturnId (purchaseReturnId),
    INDEX idx_entryDate (entryDate),
    INDEX idx_accountCode (accountCode)
);

-- 5. Extend Cars table if needed
ALTER TABLE Cars ADD COLUMN IF NOT EXISTS returnStatus ENUM('AVAILABLE', 'RETURNED', 'RESTOCKING') DEFAULT 'AVAILABLE';
ALTER TABLE Cars ADD COLUMN IF NOT EXISTS lastReturnDate DATETIME NULL;

-- 6. Account Chart (Reference Table for Accounting)
CREATE TABLE IF NOT EXISTS ChartOfAccounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    accountCode VARCHAR(50) UNIQUE NOT NULL,
    accountName VARCHAR(255) NOT NULL,
    accountType ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    
    INDEX idx_accountCode (accountCode),
    INDEX idx_accountType (accountType)
);

-- 7. Insert Standard Accounts
INSERT INTO ChartOfAccounts (accountCode, accountName, accountType) VALUES
('1010', 'Cash - Bank', 'ASSET'),
('1020', 'Cash - POS Terminal', 'ASSET'),
('1030', 'Customer Deposits', 'ASSET'),
('4010', 'Sales Revenue', 'REVENUE'),
('4020', 'Sales Returns & Allowances', 'REVENUE'),
('2010', 'VAT Payable', 'LIABILITY'),
('2020', 'VAT Receivable', 'ASSET'),
('2030', 'Supplier Payables', 'LIABILITY'),
('1040', 'Inventory - Cars', 'ASSET'),
('3010', 'Opening Balance', 'EQUITY');

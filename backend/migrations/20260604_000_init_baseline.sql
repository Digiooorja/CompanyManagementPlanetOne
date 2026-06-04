-- Migration: 20260604_000_init_baseline.sql
-- ===========================================
-- Creates all baseline tables for the PlanetOne Dashboard.
-- Uses IF NOT EXISTS so this runs safely on both new and existing databases.
-- This is the foundation that all future migrations build on.

-- Departments (no timestamps — matches model)
CREATE TABLE IF NOT EXISTS departments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL UNIQUE,
  description   TEXT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  firstName     VARCHAR(255) NULL,
  lastName      VARCHAR(255) NULL,
  departmentId  INT NULL,
  role          ENUM('Admin', 'Manager', 'User') NOT NULL DEFAULT 'User',
  active        TINYINT(1) NOT NULL DEFAULT 1,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES departments(id)
);

-- Blocks (concession blocks / licence areas)
CREATE TABLE IF NOT EXISTS blocks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  status          ENUM('Active', 'Inactive', 'Completed') NOT NULL DEFAULT 'Active',
  licenceStart    DATETIME NULL,
  licenceExpiry   DATETIME NULL,
  operator        VARCHAR(255) NULL,
  workingInterest VARCHAR(255) NULL,
  area            VARCHAR(255) NULL,
  location        VARCHAR(255) NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  status        ENUM('In Progress', 'Completed', 'On Hold', 'Planning', 'Active', 'Cancelled') NOT NULL DEFAULT 'In Progress',
  blockId       INT NULL,
  block         VARCHAR(255) NULL,
  manager       VARCHAR(255) NULL,
  budget        DECIMAL(15,2) NULL DEFAULT 0,
  spent         DECIMAL(15,2) NULL DEFAULT 0,
  completion    INT NULL DEFAULT 0,
  startDate     DATETIME NULL,
  endDate       DATETIME NULL,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (blockId) REFERENCES blocks(id)
);

-- Activities (supports sub-activities via parentActivityId self-reference)
CREATE TABLE IF NOT EXISTS activities (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  description       TEXT NULL,
  status            ENUM('Active', 'Inactive', 'Completed') DEFAULT 'Active',
  parentActivityId  INT NULL,
  projectId         INT NULL,
  priority          ENUM('Low', 'Medium', 'High', 'Critical') NULL,
  assignedTo        VARCHAR(255) NULL,
  dueDate           DATETIME NULL,
  progress          INT DEFAULT 0,
  plannedStartDate  DATETIME NULL,
  plannedEndDate    DATETIME NULL,
  actualStartDate   DATETIME NULL,
  actualEndDate     DATETIME NULL,
  plannedCost       DECIMAL(15,2) NULL DEFAULT 0,
  actualCost        DECIMAL(15,2) NULL DEFAULT 0,
  `order`           INT NULL DEFAULT 0,
  createdAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parentActivityId) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- Documents (with file upload support and version chains)
CREATE TABLE IF NOT EXISTS documents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  content         TEXT NOT NULL,
  author          VARCHAR(255) NOT NULL,
  activityId      INT NULL,
  activityIds     TEXT NULL COMMENT 'JSON array of tagged activity IDs',
  filename        VARCHAR(255) NULL,
  s3Key           VARCHAR(255) NULL,
  mimeType        VARCHAR(255) NULL,
  size            INT NULL,
  rootDocumentId  INT NULL,
  versionNumber   INT NOT NULL DEFAULT 1,
  projectId       INT NULL,
  documentType    ENUM('Technical', 'HSE', 'Finance', 'Report') DEFAULT 'Report',
  uploadDate      DATETIME DEFAULT CURRENT_TIMESTAMP,
  status          ENUM('Approved', 'Review', 'Rejected') DEFAULT 'Review',
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (activityId) REFERENCES activities(id),
  FOREIGN KEY (rootDocumentId) REFERENCES documents(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- Finance / AFE records
CREATE TABLE IF NOT EXISTS finances (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  item                VARCHAR(255) NOT NULL,
  amount              DECIMAL(15,2) NOT NULL DEFAULT 0,
  category            VARCHAR(255) NOT NULL,
  type                ENUM('Income', 'Expense') NOT NULL,
  recordType          ENUM('Entry', 'Invoice', 'AFE') NOT NULL DEFAULT 'Entry',
  activityId          INT NULL,
  approvalDepartment  VARCHAR(255) NULL,
  status              ENUM('Pending', 'Under Review', 'Approved', 'Paid', 'Rejected') NOT NULL DEFAULT 'Pending',
  invoiceNumber       VARCHAR(255) NULL,
  afeNumber           VARCHAR(255) NULL,
  transactionDetails  TEXT NULL,
  transactionDate     DATETIME NULL,
  approvedBy          VARCHAR(255) NULL,
  actionComment       TEXT NULL,
  date                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (activityId) REFERENCES activities(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  message     TEXT NOT NULL,
  type        ENUM('Info', 'Warning', 'Error', 'Success') DEFAULT 'Info',
  `read`      TINYINT(1) NOT NULL DEFAULT 0,
  userId      INT NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Registers (key-value store for operational data)
CREATE TABLE IF NOT EXISTS registers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(255) NOT NULL,
  value       JSON NOT NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  content         TEXT NOT NULL,
  generatedDate   DATETIME DEFAULT CURRENT_TIMESTAMP,
  type            ENUM('Project', 'Finance', 'Activity', 'Custom') DEFAULT 'Custom',
  createdBy       INT NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  type          VARCHAR(255) NULL,
  submittedBy   VARCHAR(255) NULL,
  submitDate    VARCHAR(255) NULL,
  currentStep   VARCHAR(255) NULL,
  priority      VARCHAR(255) NULL,
  dueDate       VARCHAR(255) NULL,
  description   TEXT NULL,
  amount        INT NULL,
  steps         JSON NOT NULL,
  status        VARCHAR(255) NULL DEFAULT 'Awaiting Action',
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Comments (activity discussion threads)
CREATE TABLE IF NOT EXISTS comments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  content         TEXT NOT NULL,
  activityId      INT NOT NULL,
  userId          INT NOT NULL,
  departmentId    INT NOT NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (activityId) REFERENCES activities(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (departmentId) REFERENCES departments(id)
);

-- Risks (project risk register)
CREATE TABLE IF NOT EXISTS risks (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  projectId     INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NULL,
  severity      ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
  probability   ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
  status        ENUM('Active', 'Mitigated', 'Closed') DEFAULT 'Active',
  owner         VARCHAR(255) NULL,
  mitigation    TEXT NULL,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id)
)

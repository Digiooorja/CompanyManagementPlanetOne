-- PostgreSQL schema for DOS Planet One Project Tracking backend
-- Run this file against your PostgreSQL database to create the required tables.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Manager', 'User')),
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('In Progress', 'Completed', 'On Hold', 'Cancelled')),
  "blockId" INTEGER REFERENCES blocks(id),
  block VARCHAR(255),
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Completed')),
  "parentActivityId" INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  "projectId" INTEGER REFERENCES projects(id),
  priority VARCHAR(50) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  "assignedTo" VARCHAR(255),
  "dueDate" TIMESTAMPTZ,
  "plannedStartDate" TIMESTAMPTZ,
  "plannedEndDate" TIMESTAMPTZ,
  "actualStartDate" TIMESTAMPTZ,
  "actualEndDate" TIMESTAMPTZ,
  "plannedCost" NUMERIC(15,2) DEFAULT 0,
  "actualCost" NUMERIC(15,2) DEFAULT 0,
  progress INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Completed')),
  "licenceStart" TIMESTAMPTZ,
  "licenceExpiry" TIMESTAMPTZ,
  operator VARCHAR(255),
  "workingInterest" VARCHAR(255),
  area VARCHAR(255),
  location VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finances (
  id SERIAL PRIMARY KEY,
  item VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  category VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Income', 'Expense')),
  "date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Info', 'Warning', 'Error', 'Success')),
  "read" BOOLEAN NOT NULL DEFAULT false,
  "userId" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  "generatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('Project', 'Finance', 'Activity', 'Custom')),
  "createdBy" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  steps TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Completed')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

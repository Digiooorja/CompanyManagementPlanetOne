CREATE DATABASE  IF NOT EXISTS `planetonedashboard` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `planetonedashboard`;
-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: localhost    Database: planetonedashboard
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_migrations`
--

DROP TABLE IF EXISTS `_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `filename` (`filename`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_migrations`
--

LOCK TABLES `_migrations` WRITE;
/*!40000 ALTER TABLE `_migrations` DISABLE KEYS */;
INSERT INTO `_migrations` VALUES (1,'20260604_000_init_baseline.sql','2026-06-05 10:46:25'),(2,'20260604_001_create_licences_table.sql','2026-06-05 10:46:25'),(3,'20260604_002_remove_expired_from_licence_status.sql','2026-06-05 10:46:25'),(4,'20260604_003_drop_licence_fields_from_blocks.sql','2026-06-05 10:54:02'),(5,'20260604_004_add_delegation_to_finance.sql','2026-06-05 10:54:26'),(6,'20260604_007_add_licence_to_documents.sql','2026-06-05 10:57:03'),(7,'20260604_008_create_audit_logs_table.sql','2026-07-04 16:08:43'),(8,'20260604_009_notification_engine.sql','2026-07-04 16:16:26'),(9,'20260604_010_add_linked_milestone_to_activities.sql','2026-07-04 16:24:48'),(10,'20260604_011_new_registers.sql','2026-07-04 16:34:31'),(11,'20260604_012_rbac_matrix.sql','2026-07-04 17:05:05'),(12,'20260604_013_task_enhancements.sql','2026-07-04 17:30:16'),(13,'20260604_014_org_structure_profiles.sql','2026-07-04 17:46:57'),(14,'20260604_015_budget_lines.sql','2026-07-04 18:04:32'),(15,'20260604_016_afe_tracking.sql','2026-07-04 18:40:18'),(16,'20260604_017_document_repository.sql','2026-07-04 19:57:49'),(17,'20260604_018_finance_approval_fields.sql','2026-07-05 04:47:06'),(18,'20260604_019_risk_matrix.sql','2026-07-05 12:31:43'),(19,'20260604_020_insurance_register.sql','2026-07-05 13:57:52'),(20,'20260604_021_environmental_permits.sql','2026-07-05 13:57:53'),(21,'20260604_022_nda_data_room.sql','2026-07-05 13:57:53'),(22,'20260604_023_vendor_payment_aging.sql','2026-07-05 14:12:02'),(23,'20260604_024_forex_banking_workflow.sql','2026-07-05 14:12:02'),(24,'20260604_025_local_content_tracking.sql','2026-07-05 14:33:28'),(25,'20260604_026_hse_register.sql','2026-07-05 14:54:34'),(26,'20260604_027_report_definitions.sql','2026-07-06 18:33:57'),(27,'20260604_028_hse_exposure_hours.sql','2026-07-07 01:40:20');
/*!40000 ALTER TABLE `_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `status` enum('Active','Inactive','Completed') COLLATE utf8mb4_general_ci DEFAULT 'Active',
  `parentActivityId` int DEFAULT NULL COMMENT 'Parent activity ID for sub-activities',
  `projectId` int DEFAULT NULL,
  `priority` enum('Low','Medium','High','Critical') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `assignedTo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `progress` int DEFAULT '0',
  `plannedStartDate` datetime DEFAULT NULL COMMENT 'Planned start date for the activity',
  `plannedEndDate` datetime DEFAULT NULL COMMENT 'Planned end date for the activity',
  `actualStartDate` datetime DEFAULT NULL COMMENT 'Actual start date for the activity',
  `actualEndDate` datetime DEFAULT NULL COMMENT 'Actual end date for the activity',
  `plannedCost` decimal(15,2) DEFAULT '0.00' COMMENT 'Planned cost for the activity',
  `actualCost` decimal(15,2) DEFAULT '0.00' COMMENT 'Actual cost for the activity',
  `order` int DEFAULT '0' COMMENT 'Display order for activities in the same project/parent',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `linkedMilestone` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `parentActivityId` (`parentActivityId`),
  KEY `projectId` (`projectId`),
  CONSTRAINT `activities_ibfk_31` FOREIGN KEY (`parentActivityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activities_ibfk_32` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,'Drilling Programme Approval','Regulatory and internal approval of the JUB-P3-07 drilling programme.','Inactive',NULL,1,'High','Kwame Appiah','2025-11-01 00:00:00',60,'2025-09-01 00:00:00','2025-11-01 00:00:00','2025-09-05 00:00:00','2025-10-28 00:00:00',150000.00,142000.00,1,'2026-07-05 04:47:21','2026-07-06 05:18:44','Drilling Commencement'),(2,'Rig Mobilisation','Mobilisation of the Atwood Explorer rig to WCTP.','Completed',NULL,1,'Critical','Samuel Darko','2025-11-15 00:00:00',100,'2025-10-01 00:00:00','2025-11-15 00:00:00','2025-10-10 00:00:00','2025-11-12 00:00:00',2200000.00,2350000.00,2,'2026-07-05 04:47:21','2026-07-05 04:47:21','Drilling Commencement'),(3,'Well Testing Phase','Overall well-testing phase for JUB-P3-07.','Active',NULL,1,'High','Samuel Darko','2026-08-01 00:00:00',45,'2026-05-01 00:00:00','2026-08-01 00:00:00','2026-05-10 00:00:00',NULL,900000.00,410000.00,3,'2026-07-05 04:47:21','2026-07-05 04:47:21','First Oil'),(4,'Flow Test - JUB-P3-07','Multi-rate flow test to establish deliverability.','Active',3,1,'High','Samuel Darko','2026-07-20 00:00:00',60,'2026-06-01 00:00:00','2026-07-20 00:00:00','2026-06-03 00:00:00',NULL,300000.00,180000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(5,'Pressure Build-Up Test','Extended PBU test following the flow test.','Active',3,1,'Medium','Samuel Darko','2026-08-01 00:00:00',20,'2026-07-15 00:00:00','2026-08-01 00:00:00',NULL,NULL,150000.00,20000.00,2,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(6,'Infill Well WCTP-14 Design','Well design and engineering for the WCTP-14 infill well.','Active',NULL,2,'High','Kwame Appiah','2026-09-01 00:00:00',35,'2026-03-01 00:00:00','2026-09-01 00:00:00',NULL,NULL,500000.00,175000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21','Spud Date'),(7,'Long-lead Equipment Procurement','Procurement of long-lead subsea and wellhead equipment.','Active',NULL,2,'Critical','Nana Asante','2026-08-15 00:00:00',55,'2026-02-15 00:00:00','2026-08-15 00:00:00',NULL,NULL,4200000.00,2300000.00,2,'2026-07-05 04:47:21','2026-07-05 04:47:21','Spud Date'),(8,'FPSO Topsides Inspection','Full topsides integrity inspection.','Completed',NULL,3,'High','Samuel Darko','2025-12-01 00:00:00',100,'2025-10-01 00:00:00','2025-12-01 00:00:00','2025-10-02 00:00:00','2025-11-28 00:00:00',650000.00,610000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(9,'FPSO Turret Bearing Replacement','Replacement of the main turret bearing assembly.','Active',NULL,3,'Critical','Samuel Darko','2026-10-15 00:00:00',30,'2026-04-01 00:00:00','2026-10-15 00:00:00',NULL,NULL,8000000.00,2100000.00,2,'2026-07-05 04:47:21','2026-07-05 04:47:21','Life Extension Sign-off'),(10,'Subsea Tieback FEED Study','Front-end engineering design study for the subsea tieback.','Active',NULL,4,'Medium','Kwame Appiah','2026-11-30 00:00:00',10,'2026-05-01 00:00:00','2026-11-30 00:00:00',NULL,NULL,3000000.00,350000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(11,'ST-04 Environmental Permit Application','EPA permit application for the ST-04 appraisal well.','Inactive',NULL,5,'Medium','Doris Kufuor','2026-06-01 00:00:00',40,'2025-09-01 00:00:00','2026-06-01 00:00:00',NULL,NULL,120000.00,65000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(12,'3D Seismic Reprocessing QC','Quality control review of the reprocessed seismic volume.','Completed',NULL,6,'Low','Samuel Darko','2024-11-15 00:00:00',100,'2024-09-01 00:00:00','2024-11-15 00:00:00','2024-09-01 00:00:00','2024-11-10 00:00:00',400000.00,385000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(13,'CTP Site Restoration Works','Physical restoration works at the CTP onshore site.','Completed',NULL,7,'High','Kwame Appiah','2024-12-01 00:00:00',100,'2023-06-01 00:00:00','2024-12-01 00:00:00','2023-06-15 00:00:00','2024-11-20 00:00:00',6800000.00,6700000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(14,'Local Content Training Pilot','Pilot vocational training programme for local content development.','Inactive',NULL,8,'Low','Tawiah Agyeman','2025-09-01 00:00:00',15,'2025-03-01 00:00:00','2025-09-30 00:00:00',NULL,NULL,200000.00,45000.00,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL);
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL COMMENT 'Id of the user who performed the action (null for system/guest)',
  `userEmail` varchar(255) DEFAULT NULL,
  `userRole` varchar(255) DEFAULT NULL,
  `module` varchar(255) NOT NULL COMMENT 'Logical module / model the action belongs to',
  `entityType` varchar(255) NOT NULL,
  `entityId` varchar(255) DEFAULT NULL COMMENT 'Primary key of the affected record',
  `action` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `oldValue` longtext,
  `newValue` longtext,
  `ipAddress` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_module` (`module`),
  KEY `audit_logs_entity_type_entity_id` (`entityType`,`entityId`),
  KEY `audit_logs_user_id` (`userId`),
  KEY `audit_logs_action` (`action`),
  KEY `audit_logs_created_at` (`createdAt`)
) ENGINE=InnoDB AUTO_INCREMENT=223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'admin@enquest-demo.com','Admin','User','User','13','UPDATE','{\"active\":true}','{\"active\":false}','10.0.0.15','2026-06-01 09:12:00'),(2,6,'finance@enquest-demo.com','Finance/Accounts','FinanceAFE','Finance','1','CREATE',NULL,'{\"afeNumber\":\"AFE-2026-014\",\"amount\":8000000}','10.0.0.22','2026-03-01 14:05:00'),(3,2,'ceo@enquest-demo.com','CEO/Country Manager','FinanceAFE','Finance','1','UPDATE','{\"status\":\"Pending\"}','{\"status\":\"Approved\"}','10.0.0.5','2026-03-05 10:30:00'),(4,4,'ops.manager@enquest-demo.com','Project/Operations Manager','BudgetLine','BudgetLine','3','UPDATE','{\"revisionStatus\":\"None\"}','{\"revisionStatus\":\"PendingApproval\",\"pendingApprovedBudget\":4600000}','10.0.0.30','2026-06-25 11:47:00'),(5,5,'legal@enquest-demo.com','Legal/Compliance Officer','Contract','Contract','5','DELETE','{\"title\":\"Legacy Catering Services Contract\",\"status\":\"Expired\"}',NULL,'10.0.0.18','2025-12-31 16:00:00'),(6,9,'staff1@enquest-demo.com','Team Member/Staff','Task','Task','1','CREATE',NULL,'{\"title\":\"Review flow test results\",\"status\":\"Not Started\"}','10.0.0.41','2026-06-01 08:00:00'),(7,1,'psingh@planetone-group.com','Manager','Task','Task','4','UPDATE','{\"status\":\"In Progress\"}','{\"status\":\"Overdue\"}','::1','2026-07-05 04:51:51'),(8,1,'psingh@planetone-group.com','Manager','Task','Task','10','UPDATE','{\"status\":\"Not Started\"}','{\"status\":\"Overdue\"}','::1','2026-07-05 04:51:51'),(9,1,'psingh@planetone-group.com','Manager','Task','Task','4','UPDATE','{\"status\":\"In Progress\"}','{\"status\":\"Overdue\"}','::1','2026-07-05 04:51:51'),(10,1,'psingh@planetone-group.com','Manager','Task','Task','10','UPDATE','{\"status\":\"Not Started\"}','{\"status\":\"Overdue\"}','::1','2026-07-05 04:51:51'),(11,NULL,NULL,NULL,'Notification','Notification','9','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":9,\"message\":\"Activity \\\"ST-04 Environmental Permit Application\\\" is overdue (was due Mon Jun 01 2026)\",\"type\":\"Error\",\"userId\":7,\"module\":\"Activity\",\"entityType\":\"Activity\",\"entityId\":\"11\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-01T00:00:00.000Z\",\"dedupeKey\":\"Activity|Activity|11|DateBased|overdue|7\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:38.036Z\",\"updatedAt\":\"2026-07-05T07:58:38.043Z\",\"createdAt\":\"2026-07-05T07:58:38.043Z\"}',NULL,'2026-07-05 07:58:38'),(12,NULL,NULL,NULL,'Notification','Notification','10','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":10,\"message\":\"Activity \\\"Local Content Training Pilot\\\" is overdue (was due Mon Sep 01 2025)\",\"type\":\"Error\",\"userId\":9,\"module\":\"Activity\",\"entityType\":\"Activity\",\"entityId\":\"14\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2025-09-01T00:00:00.000Z\",\"dedupeKey\":\"Activity|Activity|14|DateBased|overdue|9\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:38.072Z\",\"updatedAt\":\"2026-07-05T07:58:38.074Z\",\"createdAt\":\"2026-07-05T07:58:38.074Z\"}',NULL,'2026-07-05 07:58:38'),(13,NULL,NULL,NULL,'Notification','Notification','11','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":11,\"message\":\"Task \\\"Draft long-lead procurement RFQ\\\" is overdue (was due Sat Jun 20 2026)\",\"type\":\"Error\",\"userId\":9,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"3\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-20T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|3|DateBased|overdue|9\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:38.090Z\",\"updatedAt\":\"2026-07-05T07:58:38.092Z\",\"createdAt\":\"2026-07-05T07:58:38.092Z\"}',NULL,'2026-07-05 07:58:38'),(14,NULL,NULL,NULL,'Notification','Notification','12','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":12,\"message\":\"Task \\\"Obtain vendor quotes\\\" is overdue (was due Thu Jun 25 2026)\",\"type\":\"Error\",\"userId\":9,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"4\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-25T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|4|DateBased|overdue|9\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:38.191Z\",\"updatedAt\":\"2026-07-05T07:58:38.194Z\",\"createdAt\":\"2026-07-05T07:58:38.194Z\"}',NULL,'2026-07-05 07:58:38'),(15,NULL,NULL,NULL,'Notification','Notification','13','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":13,\"message\":\"Task \\\"Local content pilot wind-down report\\\" is overdue (was due Wed Oct 01 2025)\",\"type\":\"Error\",\"userId\":9,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"10\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2025-10-01T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|10|DateBased|overdue|9\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:38.541Z\",\"updatedAt\":\"2026-07-05T07:58:38.554Z\",\"createdAt\":\"2026-07-05T07:58:38.554Z\"}',NULL,'2026-07-05 07:58:39'),(16,NULL,NULL,NULL,'Notification','Notification','14','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":14,\"message\":\"Exploration PC-EXP-2021-014 is due in 46 day(s) (Thu Aug 20 2026)\",\"type\":\"Warning\",\"userId\":1,\"module\":\"Licence\",\"entityType\":\"Licence\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":\"2026-08-20T00:00:00.000Z\",\"dedupeKey\":\"Licence|Licence|1|DateBased|lead90|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.339Z\",\"updatedAt\":\"2026-07-05T07:58:39.341Z\",\"createdAt\":\"2026-07-05T07:58:39.341Z\"}',NULL,'2026-07-05 07:58:39'),(17,NULL,NULL,NULL,'Notification','Notification','15','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":15,\"message\":\"Exploration PC-EXP-2021-014 is due in 46 day(s) (Thu Aug 20 2026)\",\"type\":\"Warning\",\"userId\":12,\"module\":\"Licence\",\"entityType\":\"Licence\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":\"2026-08-20T00:00:00.000Z\",\"dedupeKey\":\"Licence|Licence|1|DateBased|lead90|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.339Z\",\"updatedAt\":\"2026-07-05T07:58:39.355Z\",\"createdAt\":\"2026-07-05T07:58:39.355Z\"}',NULL,'2026-07-05 07:58:39'),(18,NULL,NULL,NULL,'Notification','Notification','16','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":16,\"message\":\"Environmental EPA-ENV-2024-102 is due in 87 day(s) (Wed Sep 30 2026)\",\"type\":\"Warning\",\"userId\":1,\"module\":\"Licence\",\"entityType\":\"Licence\",\"entityId\":\"3\",\"triggerType\":\"DateBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":\"2026-09-30T00:00:00.000Z\",\"dedupeKey\":\"Licence|Licence|3|DateBased|lead90|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.369Z\",\"updatedAt\":\"2026-07-05T07:58:39.371Z\",\"createdAt\":\"2026-07-05T07:58:39.371Z\"}',NULL,'2026-07-05 07:58:39'),(19,NULL,NULL,NULL,'Notification','Notification','17','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":17,\"message\":\"Environmental EPA-ENV-2024-102 is due in 87 day(s) (Wed Sep 30 2026)\",\"type\":\"Warning\",\"userId\":12,\"module\":\"Licence\",\"entityType\":\"Licence\",\"entityId\":\"3\",\"triggerType\":\"DateBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":\"2026-09-30T00:00:00.000Z\",\"dedupeKey\":\"Licence|Licence|3|DateBased|lead90|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.369Z\",\"updatedAt\":\"2026-07-05T07:58:39.442Z\",\"createdAt\":\"2026-07-05T07:58:39.442Z\"}',NULL,'2026-07-05 07:58:39'),(20,NULL,NULL,NULL,'Notification','Notification','18','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":18,\"message\":\"Contract \\\"Rig Charter Agreement - Atwood Explorer\\\" (Atwood Oceanics) is due in 27 day(s) (Sat Aug 01 2026)\",\"type\":\"Error\",\"userId\":5,\"module\":\"Contract\",\"entityType\":\"Contract\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-08-01T00:00:00.000Z\",\"dedupeKey\":\"Contract|Contract|1|DateBased|lead30|5\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.500Z\",\"updatedAt\":\"2026-07-05T07:58:39.502Z\",\"createdAt\":\"2026-07-05T07:58:39.502Z\"}',NULL,'2026-07-05 07:58:39'),(21,NULL,NULL,NULL,'Notification','Notification','19','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":19,\"message\":\"Compliance obligation \\\"GNPC Local Content Plan Filing 2026\\\" (GNPC) is overdue (was due Tue Mar 31 2026)\",\"type\":\"Error\",\"userId\":4,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"6\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-03-31T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|6|DateBased|overdue|4\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.577Z\",\"updatedAt\":\"2026-07-05T07:58:39.579Z\",\"createdAt\":\"2026-07-05T07:58:39.579Z\"}',NULL,'2026-07-05 07:58:39'),(22,NULL,NULL,NULL,'Notification','Notification','20','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":20,\"message\":\"Compliance obligation \\\"Surface Rental Fee - CTP Onshore\\\" (Petroleum Commission) is overdue (was due Fri May 01 2026)\",\"type\":\"Error\",\"userId\":5,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"3\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-05-01T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|3|DateBased|overdue|5\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.606Z\",\"updatedAt\":\"2026-07-05T07:58:39.608Z\",\"createdAt\":\"2026-07-05T07:58:39.608Z\"}',NULL,'2026-07-05 07:58:39'),(23,NULL,NULL,NULL,'Notification','Notification','21','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":21,\"message\":\"Compliance obligation \\\"Annual Petroleum Income Tax Filing 2025\\\" (Ghana Revenue Authority) is overdue (was due Tue Jun 30 2026)\",\"type\":\"Error\",\"userId\":6,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"2\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-30T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|2|DateBased|overdue|6\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.663Z\",\"updatedAt\":\"2026-07-05T07:58:39.665Z\",\"createdAt\":\"2026-07-05T07:58:39.665Z\"}',NULL,'2026-07-05 07:58:39'),(24,NULL,NULL,NULL,'Notification','Notification','22','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":22,\"message\":\"Compliance obligation \\\"Q2 2026 Royalty Payment - WCTP\\\" (Ghana Revenue Authority) is due in 10 day(s) (Wed Jul 15 2026)\",\"type\":\"Error\",\"userId\":6,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-15T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|1|DateBased|lead14|6\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.697Z\",\"updatedAt\":\"2026-07-05T07:58:39.698Z\",\"createdAt\":\"2026-07-05T07:58:39.698Z\"}',NULL,'2026-07-05 07:58:39'),(25,NULL,NULL,NULL,'Notification','Notification','23','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":23,\"message\":\"Compliance obligation \\\"Environmental Monitoring Report Filing\\\" (Environmental Protection Agency) is due in 26 day(s) (Fri Jul 31 2026)\",\"type\":\"Error\",\"userId\":7,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"5\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-31T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|5|DateBased|lead30|7\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.718Z\",\"updatedAt\":\"2026-07-05T07:58:39.721Z\",\"createdAt\":\"2026-07-05T07:58:39.721Z\"}',NULL,'2026-07-05 07:58:39'),(26,NULL,NULL,NULL,'Notification','Notification','24','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":24,\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 5 day(s) (Fri Jul 10 2026)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Correspondence\",\"entityType\":\"Correspondence\",\"entityId\":\"6\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-10T00:00:00.000Z\",\"dedupeKey\":\"Correspondence|Correspondence|6|DateBased|lead7|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.742Z\",\"updatedAt\":\"2026-07-05T07:58:39.744Z\",\"createdAt\":\"2026-07-05T07:58:39.744Z\"}',NULL,'2026-07-05 07:58:39'),(27,NULL,NULL,NULL,'Notification','Notification','25','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":25,\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 5 day(s) (Fri Jul 10 2026)\",\"type\":\"Error\",\"userId\":12,\"module\":\"Correspondence\",\"entityType\":\"Correspondence\",\"entityId\":\"6\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-10T00:00:00.000Z\",\"dedupeKey\":\"Correspondence|Correspondence|6|DateBased|lead7|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.742Z\",\"updatedAt\":\"2026-07-05T07:58:39.762Z\",\"createdAt\":\"2026-07-05T07:58:39.762Z\"}',NULL,'2026-07-05 07:58:39'),(28,NULL,NULL,NULL,'Notification','Notification','26','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":26,\"message\":\"Budget line \\\"Well Testing Programme\\\" — absVariancePercent crossed 10\",\"type\":\"Warning\",\"userId\":8,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"2\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|2|ThresholdBased|threshold10|8\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.783Z\",\"updatedAt\":\"2026-07-05T07:58:39.785Z\",\"createdAt\":\"2026-07-05T07:58:39.785Z\"}',NULL,'2026-07-05 07:58:39'),(29,NULL,NULL,NULL,'Notification','Notification','27','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":27,\"message\":\"Budget line \\\"Long-lead Equipment Procurement\\\" — absVariancePercent crossed 10\",\"type\":\"Warning\",\"userId\":6,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"3\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|3|ThresholdBased|threshold10|6\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.802Z\",\"updatedAt\":\"2026-07-05T07:58:39.804Z\",\"createdAt\":\"2026-07-05T07:58:39.804Z\"}',NULL,'2026-07-05 07:58:39'),(30,NULL,NULL,NULL,'Notification','Notification','28','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":28,\"message\":\"Budget line \\\"FPSO Turret Bearing Replacement\\\" — absVariancePercent crossed 10\",\"type\":\"Warning\",\"userId\":8,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"4\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|4|ThresholdBased|threshold10|8\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.822Z\",\"updatedAt\":\"2026-07-05T07:58:39.824Z\",\"createdAt\":\"2026-07-05T07:58:39.824Z\"}',NULL,'2026-07-05 07:58:39'),(31,NULL,NULL,NULL,'Notification','Notification','29','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":29,\"message\":\"Budget line \\\"FPSO O&M Annual Budget\\\" — absVariancePercent crossed 10\",\"type\":\"Warning\",\"userId\":6,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"5\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|5|ThresholdBased|threshold10|6\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.840Z\",\"updatedAt\":\"2026-07-05T07:58:39.841Z\",\"createdAt\":\"2026-07-05T07:58:39.841Z\"}',NULL,'2026-07-05 07:58:39'),(32,NULL,NULL,NULL,'Notification','Notification','30','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":30,\"message\":\"Budget line \\\"ST-04 Environmental Permitting\\\" — absVariancePercent crossed 10\",\"type\":\"Warning\",\"userId\":7,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"6\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|6|ThresholdBased|threshold10|7\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.859Z\",\"updatedAt\":\"2026-07-05T07:58:39.861Z\",\"createdAt\":\"2026-07-05T07:58:39.861Z\"}',NULL,'2026-07-05 07:58:39'),(33,NULL,NULL,NULL,'Notification','Notification','31','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":31,\"message\":\"Budget line \\\"Infill Well WCTP-14 Design\\\" — absVariancePercent crossed 10\",\"type\":\"Warning\",\"userId\":4,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"8\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|8|ThresholdBased|threshold10|4\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.878Z\",\"updatedAt\":\"2026-07-05T07:58:39.880Z\",\"createdAt\":\"2026-07-05T07:58:39.880Z\"}',NULL,'2026-07-05 07:58:39'),(34,NULL,NULL,NULL,'Notification','Notification','32','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":32,\"message\":\"Budget line \\\"Well Testing Programme\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":8,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"2\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|2|ThresholdBased|threshold100|8\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.928Z\",\"updatedAt\":\"2026-07-05T07:58:39.929Z\",\"createdAt\":\"2026-07-05T07:58:39.929Z\"}',NULL,'2026-07-05 07:58:39'),(35,NULL,NULL,NULL,'Notification','Notification','33','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":33,\"message\":\"Budget line \\\"Long-lead Equipment Procurement\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":6,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"3\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|3|ThresholdBased|threshold100|6\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.951Z\",\"updatedAt\":\"2026-07-05T07:58:39.953Z\",\"createdAt\":\"2026-07-05T07:58:39.953Z\"}',NULL,'2026-07-05 07:58:39'),(36,NULL,NULL,NULL,'Notification','Notification','34','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":34,\"message\":\"Budget line \\\"FPSO Turret Bearing Replacement\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":8,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"4\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|4|ThresholdBased|threshold100|8\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:39.971Z\",\"updatedAt\":\"2026-07-05T07:58:39.973Z\",\"createdAt\":\"2026-07-05T07:58:39.973Z\"}',NULL,'2026-07-05 07:58:39'),(37,NULL,NULL,NULL,'Notification','Notification','35','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":35,\"message\":\"Budget line \\\"FPSO O&M Annual Budget\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":6,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"5\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|5|ThresholdBased|threshold100|6\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.008Z\",\"updatedAt\":\"2026-07-05T07:58:40.010Z\",\"createdAt\":\"2026-07-05T07:58:40.010Z\"}',NULL,'2026-07-05 07:58:40'),(38,NULL,NULL,NULL,'Notification','Notification','36','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":36,\"message\":\"Budget line \\\"ST-04 Environmental Permitting\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":7,\"module\":\"BudgetLine\",\"entityType\":\"BudgetLine\",\"entityId\":\"6\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"BudgetLine|BudgetLine|6|ThresholdBased|threshold100|7\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.034Z\",\"updatedAt\":\"2026-07-05T07:58:40.036Z\",\"createdAt\":\"2026-07-05T07:58:40.036Z\"}',NULL,'2026-07-05 07:58:40'),(39,NULL,NULL,NULL,'Notification','Notification','37','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":37,\"message\":\"AFE \\\"AFE-2026-014\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":1,\"module\":\"FinanceAFE\",\"entityType\":\"FinanceAFE\",\"entityId\":\"1\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"FinanceAFE|FinanceAFE|1|ThresholdBased|threshold100|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.058Z\",\"updatedAt\":\"2026-07-05T07:58:40.059Z\",\"createdAt\":\"2026-07-05T07:58:40.059Z\"}',NULL,'2026-07-05 07:58:40'),(40,NULL,NULL,NULL,'Notification','Notification','38','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":38,\"message\":\"AFE \\\"AFE-2026-014\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":12,\"module\":\"FinanceAFE\",\"entityType\":\"FinanceAFE\",\"entityId\":\"1\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"FinanceAFE|FinanceAFE|1|ThresholdBased|threshold100|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.058Z\",\"updatedAt\":\"2026-07-05T07:58:40.074Z\",\"createdAt\":\"2026-07-05T07:58:40.074Z\"}',NULL,'2026-07-05 07:58:40'),(41,NULL,NULL,NULL,'Notification','Notification','39','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":39,\"message\":\"AFE \\\"AFE-2026-014-S1\\\" — utilisationPercent crossed 80\",\"type\":\"Warning\",\"userId\":1,\"module\":\"FinanceAFE\",\"entityType\":\"FinanceAFE\",\"entityId\":\"2\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"FinanceAFE|FinanceAFE|2|ThresholdBased|threshold80|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.095Z\",\"updatedAt\":\"2026-07-05T07:58:40.097Z\",\"createdAt\":\"2026-07-05T07:58:40.097Z\"}',NULL,'2026-07-05 07:58:40'),(42,NULL,NULL,NULL,'Notification','Notification','40','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":40,\"message\":\"AFE \\\"AFE-2026-014-S1\\\" — utilisationPercent crossed 80\",\"type\":\"Warning\",\"userId\":12,\"module\":\"FinanceAFE\",\"entityType\":\"FinanceAFE\",\"entityId\":\"2\",\"triggerType\":\"ThresholdBased\",\"priority\":\"High\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"FinanceAFE|FinanceAFE|2|ThresholdBased|threshold80|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.095Z\",\"updatedAt\":\"2026-07-05T07:58:40.114Z\",\"createdAt\":\"2026-07-05T07:58:40.114Z\"}',NULL,'2026-07-05 07:58:40'),(43,NULL,NULL,NULL,'Notification','Notification','41','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":41,\"message\":\"AFE \\\"AFE-2026-009\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":1,\"module\":\"FinanceAFE\",\"entityType\":\"FinanceAFE\",\"entityId\":\"7\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"FinanceAFE|FinanceAFE|7|ThresholdBased|threshold100|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.134Z\",\"updatedAt\":\"2026-07-05T07:58:40.136Z\",\"createdAt\":\"2026-07-05T07:58:40.136Z\"}',NULL,'2026-07-05 07:58:40'),(44,NULL,NULL,NULL,'Notification','Notification','42','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":42,\"message\":\"AFE \\\"AFE-2026-009\\\" — utilisationPercent crossed 100\",\"type\":\"Error\",\"userId\":12,\"module\":\"FinanceAFE\",\"entityType\":\"FinanceAFE\",\"entityId\":\"7\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"FinanceAFE|FinanceAFE|7|ThresholdBased|threshold100|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T07:58:40.134Z\",\"updatedAt\":\"2026-07-05T07:58:40.180Z\",\"createdAt\":\"2026-07-05T07:58:40.180Z\"}',NULL,'2026-07-05 07:58:40'),(45,NULL,NULL,NULL,'Notification','Notification','6','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(46,NULL,NULL,NULL,'Notification','Notification','43','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":43,\"message\":\"ESCALATION: Task \\\"Draft long-lead procurement RFQ\\\" is overdue. (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"3\",\"triggerType\":\"StatusBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-20T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|3|StatusBased|Overdue|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.220Z\",\"createdAt\":\"2026-07-05T07:58:40.220Z\"}',NULL,'2026-07-05 07:58:40'),(47,NULL,NULL,NULL,'Notification','Notification','9','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(48,NULL,NULL,NULL,'Notification','Notification','44','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":44,\"message\":\"ESCALATION: Activity \\\"ST-04 Environmental Permit Application\\\" is overdue (was due Mon Jun 01 2026) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Activity\",\"entityType\":\"Activity\",\"entityId\":\"11\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-01T00:00:00.000Z\",\"dedupeKey\":\"Activity|Activity|11|DateBased|overdue|7|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.253Z\",\"createdAt\":\"2026-07-05T07:58:40.253Z\"}',NULL,'2026-07-05 07:58:40'),(49,NULL,NULL,NULL,'Notification','Notification','10','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(50,NULL,NULL,NULL,'Notification','Notification','45','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":45,\"message\":\"ESCALATION: Activity \\\"Local Content Training Pilot\\\" is overdue (was due Mon Sep 01 2025) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Activity\",\"entityType\":\"Activity\",\"entityId\":\"14\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2025-09-01T00:00:00.000Z\",\"dedupeKey\":\"Activity|Activity|14|DateBased|overdue|9|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.281Z\",\"createdAt\":\"2026-07-05T07:58:40.281Z\"}',NULL,'2026-07-05 07:58:40'),(51,NULL,NULL,NULL,'Notification','Notification','11','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(52,NULL,NULL,NULL,'Notification','Notification','46','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":46,\"message\":\"ESCALATION: Task \\\"Draft long-lead procurement RFQ\\\" is overdue (was due Sat Jun 20 2026) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"3\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-20T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|3|DateBased|overdue|9|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.325Z\",\"createdAt\":\"2026-07-05T07:58:40.325Z\"}',NULL,'2026-07-05 07:58:40'),(53,NULL,NULL,NULL,'Notification','Notification','12','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(54,NULL,NULL,NULL,'Notification','Notification','47','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":47,\"message\":\"ESCALATION: Task \\\"Obtain vendor quotes\\\" is overdue (was due Thu Jun 25 2026) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"4\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-25T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|4|DateBased|overdue|9|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.356Z\",\"createdAt\":\"2026-07-05T07:58:40.356Z\"}',NULL,'2026-07-05 07:58:40'),(55,NULL,NULL,NULL,'Notification','Notification','13','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(56,NULL,NULL,NULL,'Notification','Notification','48','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":48,\"message\":\"ESCALATION: Task \\\"Local content pilot wind-down report\\\" is overdue (was due Wed Oct 01 2025) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"10\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2025-10-01T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|10|DateBased|overdue|9|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.383Z\",\"createdAt\":\"2026-07-05T07:58:40.383Z\"}',NULL,'2026-07-05 07:58:40'),(57,NULL,NULL,NULL,'Notification','Notification','19','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(58,NULL,NULL,NULL,'Notification','Notification','49','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":49,\"message\":\"ESCALATION: Compliance obligation \\\"GNPC Local Content Plan Filing 2026\\\" (GNPC) is overdue (was due Tue Mar 31 2026) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"6\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-03-31T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|6|DateBased|overdue|4|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.423Z\",\"createdAt\":\"2026-07-05T07:58:40.423Z\"}',NULL,'2026-07-05 07:58:40'),(59,NULL,NULL,NULL,'Notification','Notification','20','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(60,NULL,NULL,NULL,'Notification','Notification','50','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":50,\"message\":\"ESCALATION: Compliance obligation \\\"Surface Rental Fee - CTP Onshore\\\" (Petroleum Commission) is overdue (was due Fri May 01 2026) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"3\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-05-01T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|3|DateBased|overdue|5|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.460Z\",\"createdAt\":\"2026-07-05T07:58:40.460Z\"}',NULL,'2026-07-05 07:58:40'),(61,NULL,NULL,NULL,'Notification','Notification','21','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T07:58:40.201Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 07:58:40'),(62,NULL,NULL,NULL,'Notification','Notification','51','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":51,\"message\":\"ESCALATION: Compliance obligation \\\"Annual Petroleum Income Tax Filing 2025\\\" (Ghana Revenue Authority) is overdue (was due Tue Jun 30 2026) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"ComplianceObligation\",\"entityType\":\"ComplianceObligation\",\"entityId\":\"2\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-06-30T00:00:00.000Z\",\"dedupeKey\":\"ComplianceObligation|ComplianceObligation|2|DateBased|overdue|6|escalation\",\"lastSentAt\":\"2026-07-05T07:58:40.201Z\",\"updatedAt\":\"2026-07-05T07:58:40.483Z\",\"createdAt\":\"2026-07-05T07:58:40.483Z\"}',NULL,'2026-07-05 07:58:40'),(63,NULL,NULL,NULL,'RiskMatrixSetting','RiskMatrixSetting','1','CREATE',NULL,'{\"lowWeight\":1,\"mediumWeight\":2,\"highWeight\":3,\"mediumThreshold\":4,\"highThreshold\":7,\"id\":1,\"updatedAt\":\"2026-07-05T12:31:57.783Z\",\"createdAt\":\"2026-07-05T12:31:57.783Z\"}',NULL,'2026-07-05 12:31:57'),(64,NULL,NULL,NULL,'Department','Department','6','CREATE',NULL,'{\"id\":6,\"name\":\"Procurement\"}',NULL,'2026-07-05 12:31:57'),(65,NULL,NULL,NULL,'Department','Department','7','CREATE',NULL,'{\"id\":7,\"name\":\"Accounts\"}',NULL,'2026-07-05 12:31:57'),(66,NULL,NULL,NULL,'Department','Department','8','CREATE',NULL,'{\"id\":8,\"name\":\"Commercial\"}',NULL,'2026-07-05 12:31:57'),(67,NULL,NULL,NULL,'Department','Department','9','CREATE',NULL,'{\"id\":9,\"name\":\"HR\"}',NULL,'2026-07-05 12:31:57'),(68,NULL,NULL,NULL,'NotificationRule','NotificationRule','11','CREATE',NULL,'{\"leadTimeDays\":[14,7,1],\"thresholdValues\":[],\"channels\":[\"InApp\"],\"active\":true,\"id\":11,\"name\":\"Risk review-date reminders\",\"module\":\"Risk\",\"triggerType\":\"DateBased\",\"dateField\":\"reviewDate\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":72,\"priority\":\"Medium\",\"updatedAt\":\"2026-07-05T12:31:57.943Z\",\"createdAt\":\"2026-07-05T12:31:57.943Z\"}',NULL,'2026-07-05 12:31:57'),(69,NULL,NULL,NULL,'NotificationRule','NotificationRule','12','CREATE',NULL,'{\"leadTimeDays\":[],\"thresholdValues\":[7],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":12,\"name\":\"Risk high-band escalation\",\"module\":\"Risk\",\"triggerType\":\"ThresholdBased\",\"thresholdField\":\"riskScore\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"Critical\",\"updatedAt\":\"2026-07-05T12:31:57.952Z\",\"createdAt\":\"2026-07-05T12:31:57.952Z\"}',NULL,'2026-07-05 12:31:57'),(70,NULL,NULL,NULL,'Notification','Notification','52','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":52,\"message\":\"Risk \\\"FPSO turret bearing failure\\\" (High severity / High probability) — riskScore crossed 7\",\"type\":\"Error\",\"userId\":8,\"module\":\"Risk\",\"entityType\":\"Risk\",\"entityId\":\"3\",\"triggerType\":\"ThresholdBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":null,\"dedupeKey\":\"Risk|Risk|3|ThresholdBased|threshold7|8\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-05T12:31:58.387Z\",\"updatedAt\":\"2026-07-05T12:31:58.388Z\",\"createdAt\":\"2026-07-05T12:31:58.388Z\"}',NULL,'2026-07-05 12:31:58'),(71,NULL,NULL,NULL,'Notification','Notification','43','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(72,NULL,NULL,NULL,'Notification','Notification','44','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(73,NULL,NULL,NULL,'Notification','Notification','45','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(74,NULL,NULL,NULL,'Notification','Notification','46','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(75,NULL,NULL,NULL,'Notification','Notification','47','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(76,NULL,NULL,NULL,'Notification','Notification','48','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(77,NULL,NULL,NULL,'Notification','Notification','49','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(78,NULL,NULL,NULL,'Notification','Notification','50','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(79,NULL,NULL,NULL,'Notification','Notification','51','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-05T12:31:58.401Z\",\"escalatedToUserId\":1}',NULL,'2026-07-05 12:31:58'),(80,1,'psingh@planetone-group.com','Manager','Notification','Notification','37','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null,\"snoozeReason\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T13:28:50.421Z\",\"snoozeReason\":\"discussion is pending\"}','::1','2026-07-05 13:28:50'),(81,1,'psingh@planetone-group.com','Manager','Notification','Notification','41','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null,\"snoozeReason\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T13:29:08.629Z\",\"snoozeReason\":\"wait for 1 day\"}','::1','2026-07-05 13:29:08'),(82,1,'psingh@planetone-group.com','Manager','Notification','Notification','24','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null,\"snoozeReason\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T13:29:26.774Z\",\"snoozeReason\":\"discussion pending\"}','::1','2026-07-05 13:29:26'),(83,1,'psingh@planetone-group.com','Manager','Notification','Notification','39','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null,\"snoozeReason\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T13:29:47.957Z\",\"snoozeReason\":\"discussion pending\"}','::1','2026-07-05 13:29:47'),(84,1,'psingh@planetone-group.com','Manager','Notification','Notification','14','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null,\"snoozeReason\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T13:29:52.283Z\",\"snoozeReason\":\"discussion pending\"}','::1','2026-07-05 13:29:52'),(85,1,'psingh@planetone-group.com','Manager','Notification','Notification','16','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null,\"snoozeReason\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T13:30:01.666Z\",\"snoozeReason\":\"discussion pending\"}','::1','2026-07-05 13:30:01'),(86,NULL,NULL,NULL,'NotificationRule','NotificationRule','13','CREATE',NULL,'{\"leadTimeDays\":[90,60,30,7],\"thresholdValues\":[],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":13,\"name\":\"Insurance policy expiry\",\"module\":\"InsurancePolicy\",\"triggerType\":\"DateBased\",\"dateField\":\"expiryDate\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"High\",\"updatedAt\":\"2026-07-05T13:58:29.446Z\",\"createdAt\":\"2026-07-05T13:58:29.446Z\"}',NULL,'2026-07-05 13:58:29'),(87,NULL,NULL,NULL,'NotificationRule','NotificationRule','14','CREATE',NULL,'{\"leadTimeDays\":[180,90,30],\"thresholdValues\":[],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":14,\"name\":\"Environmental permit expiry\",\"module\":\"EnvironmentalPermit\",\"triggerType\":\"DateBased\",\"dateField\":\"expiryDate\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"High\",\"updatedAt\":\"2026-07-05T13:58:29.467Z\",\"createdAt\":\"2026-07-05T13:58:29.467Z\"}',NULL,'2026-07-05 13:58:29'),(88,NULL,NULL,NULL,'NotificationRule','NotificationRule','15','CREATE',NULL,'{\"leadTimeDays\":[30,7,1],\"thresholdValues\":[],\"channels\":[\"InApp\"],\"active\":true,\"id\":15,\"name\":\"NDA expiry reminder\",\"module\":\"Nda\",\"triggerType\":\"DateBased\",\"dateField\":\"expiryDate\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"Medium\",\"updatedAt\":\"2026-07-05T13:58:29.478Z\",\"createdAt\":\"2026-07-05T13:58:29.478Z\"}',NULL,'2026-07-05 13:58:29'),(89,NULL,NULL,NULL,'Permission','Permission','25','CREATE',NULL,'{\"id\":25,\"key\":\"insurance.manage\",\"module\":\"Insurance Register\",\"description\":\"Create, edit and delete insurance policies\",\"updatedAt\":\"2026-07-05T13:58:29.565Z\",\"createdAt\":\"2026-07-05T13:58:29.565Z\"}',NULL,'2026-07-05 13:58:29'),(90,NULL,NULL,NULL,'Permission','Permission','26','CREATE',NULL,'{\"id\":26,\"key\":\"env_permits.manage\",\"module\":\"Environmental Permit Tracker\",\"description\":\"Create, edit and delete environmental permits\",\"updatedAt\":\"2026-07-05T13:58:29.576Z\",\"createdAt\":\"2026-07-05T13:58:29.576Z\"}',NULL,'2026-07-05 13:58:29'),(91,NULL,NULL,NULL,'Permission','Permission','27','CREATE',NULL,'{\"id\":27,\"key\":\"nda.manage\",\"module\":\"NDA & Data Room Tracker\",\"description\":\"Create, edit and delete NDAs and data-room grants\",\"updatedAt\":\"2026-07-05T13:58:29.588Z\",\"createdAt\":\"2026-07-05T13:58:29.588Z\"}',NULL,'2026-07-05 13:58:29'),(92,NULL,NULL,NULL,'RolePermission','RolePermission','60','CREATE',NULL,'{\"id\":60,\"roleId\":2,\"permissionId\":25,\"updatedAt\":\"2026-07-05T13:58:29.624Z\",\"createdAt\":\"2026-07-05T13:58:29.624Z\"}',NULL,'2026-07-05 13:58:29'),(93,NULL,NULL,NULL,'RolePermission','RolePermission','61','CREATE',NULL,'{\"id\":61,\"roleId\":2,\"permissionId\":26,\"updatedAt\":\"2026-07-05T13:58:29.634Z\",\"createdAt\":\"2026-07-05T13:58:29.634Z\"}',NULL,'2026-07-05 13:58:29'),(94,NULL,NULL,NULL,'RolePermission','RolePermission','62','CREATE',NULL,'{\"id\":62,\"roleId\":2,\"permissionId\":27,\"updatedAt\":\"2026-07-05T13:58:29.642Z\",\"createdAt\":\"2026-07-05T13:58:29.642Z\"}',NULL,'2026-07-05 13:58:29'),(95,NULL,NULL,NULL,'RolePermission','RolePermission','63','CREATE',NULL,'{\"id\":63,\"roleId\":7,\"permissionId\":27,\"updatedAt\":\"2026-07-05T13:58:29.692Z\",\"createdAt\":\"2026-07-05T13:58:29.692Z\"}',NULL,'2026-07-05 13:58:29'),(96,NULL,NULL,NULL,'RolePermission','RolePermission','64','CREATE',NULL,'{\"id\":64,\"roleId\":7,\"permissionId\":25,\"updatedAt\":\"2026-07-05T13:58:29.702Z\",\"createdAt\":\"2026-07-05T13:58:29.702Z\"}',NULL,'2026-07-05 13:58:29'),(97,NULL,NULL,NULL,'RolePermission','RolePermission','65','CREATE',NULL,'{\"id\":65,\"roleId\":7,\"permissionId\":26,\"updatedAt\":\"2026-07-05T13:58:29.710Z\",\"createdAt\":\"2026-07-05T13:58:29.710Z\"}',NULL,'2026-07-05 13:58:29'),(98,NULL,NULL,NULL,'RolePermission','RolePermission','66','CREATE',NULL,'{\"id\":66,\"roleId\":8,\"permissionId\":25,\"updatedAt\":\"2026-07-05T13:58:29.726Z\",\"createdAt\":\"2026-07-05T13:58:29.726Z\"}',NULL,'2026-07-05 13:58:29'),(99,NULL,NULL,NULL,'RolePermission','RolePermission','67','CREATE',NULL,'{\"id\":67,\"roleId\":9,\"permissionId\":26,\"updatedAt\":\"2026-07-05T13:58:29.738Z\",\"createdAt\":\"2026-07-05T13:58:29.738Z\"}',NULL,'2026-07-05 13:58:29'),(100,NULL,NULL,NULL,'NotificationRule','NotificationRule','16','CREATE',NULL,'{\"leadTimeDays\":[],\"thresholdValues\":[30,60,90],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":16,\"name\":\"Vendor payment aging\",\"module\":\"VendorInvoice\",\"triggerType\":\"ThresholdBased\",\"thresholdField\":\"daysOutstanding\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"High\",\"updatedAt\":\"2026-07-05T14:18:18.842Z\",\"createdAt\":\"2026-07-05T14:18:18.842Z\"}',NULL,'2026-07-05 14:18:18'),(101,NULL,NULL,NULL,'NotificationRule','NotificationRule','17','CREATE',NULL,'{\"leadTimeDays\":[3,1],\"thresholdValues\":[],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":17,\"name\":\"Forex settlement due\",\"module\":\"ForexTransaction\",\"triggerType\":\"DateBased\",\"dateField\":\"settlementDate\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"High\",\"updatedAt\":\"2026-07-05T14:18:18.867Z\",\"createdAt\":\"2026-07-05T14:18:18.867Z\"}',NULL,'2026-07-05 14:18:18'),(102,NULL,NULL,NULL,'Permission','Permission','28','CREATE',NULL,'{\"id\":28,\"key\":\"vendor_payments.manage\",\"module\":\"Vendor Payment Aging\",\"description\":\"Create, edit and delete vendor invoices\",\"updatedAt\":\"2026-07-05T14:18:18.934Z\",\"createdAt\":\"2026-07-05T14:18:18.934Z\"}',NULL,'2026-07-05 14:18:18'),(103,NULL,NULL,NULL,'Permission','Permission','29','CREATE',NULL,'{\"id\":29,\"key\":\"forex.manage\",\"module\":\"Forex & Banking Workflow\",\"description\":\"Create, edit and action forex transactions (request/approve/reject/settle)\",\"updatedAt\":\"2026-07-05T14:18:18.943Z\",\"createdAt\":\"2026-07-05T14:18:18.943Z\"}',NULL,'2026-07-05 14:18:18'),(104,NULL,NULL,NULL,'RolePermission','RolePermission','68','CREATE',NULL,'{\"id\":68,\"roleId\":2,\"permissionId\":28,\"updatedAt\":\"2026-07-05T14:18:18.977Z\",\"createdAt\":\"2026-07-05T14:18:18.977Z\"}',NULL,'2026-07-05 14:18:18'),(105,NULL,NULL,NULL,'RolePermission','RolePermission','69','CREATE',NULL,'{\"id\":69,\"roleId\":2,\"permissionId\":29,\"updatedAt\":\"2026-07-05T14:18:18.988Z\",\"createdAt\":\"2026-07-05T14:18:18.988Z\"}',NULL,'2026-07-05 14:18:18'),(106,NULL,NULL,NULL,'RolePermission','RolePermission','70','CREATE',NULL,'{\"id\":70,\"roleId\":8,\"permissionId\":28,\"updatedAt\":\"2026-07-05T14:18:19.051Z\",\"createdAt\":\"2026-07-05T14:18:19.051Z\"}',NULL,'2026-07-05 14:18:19'),(107,NULL,NULL,NULL,'RolePermission','RolePermission','71','CREATE',NULL,'{\"id\":71,\"roleId\":8,\"permissionId\":29,\"updatedAt\":\"2026-07-05T14:18:19.060Z\",\"createdAt\":\"2026-07-05T14:18:19.060Z\"}',NULL,'2026-07-05 14:18:19'),(108,NULL,NULL,NULL,'NotificationRule','NotificationRule','18','CREATE',NULL,'{\"leadTimeDays\":[],\"thresholdValues\":[5,10],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":18,\"name\":\"Local content shortfall\",\"module\":\"LocalContentRecord\",\"triggerType\":\"ThresholdBased\",\"thresholdField\":\"shortfallPercent\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"High\",\"updatedAt\":\"2026-07-05T15:14:04.766Z\",\"createdAt\":\"2026-07-05T15:14:04.766Z\"}',NULL,'2026-07-05 15:14:04'),(109,NULL,NULL,NULL,'NotificationRule','NotificationRule','19','CREATE',NULL,'{\"leadTimeDays\":[7,3,1],\"thresholdValues\":[],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":19,\"name\":\"HSE incident action due\",\"module\":\"HseIncident\",\"triggerType\":\"DateBased\",\"dateField\":\"actionDueDate\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":48,\"priority\":\"High\",\"updatedAt\":\"2026-07-05T15:14:04.796Z\",\"createdAt\":\"2026-07-05T15:14:04.796Z\"}',NULL,'2026-07-05 15:14:04'),(110,NULL,NULL,NULL,'NotificationRule','NotificationRule','20','CREATE',NULL,'{\"leadTimeDays\":[],\"thresholdValues\":[1],\"channels\":[\"InApp\",\"Email\"],\"active\":true,\"id\":20,\"name\":\"HSE overdue-action escalation\",\"module\":\"HseIncident\",\"triggerType\":\"ThresholdBased\",\"thresholdField\":\"daysOverdue\",\"recurrenceIntervalHours\":24,\"escalationGraceHours\":null,\"priority\":\"Critical\",\"updatedAt\":\"2026-07-05T15:14:04.807Z\",\"createdAt\":\"2026-07-05T15:14:04.807Z\"}',NULL,'2026-07-05 15:14:04'),(111,NULL,NULL,NULL,'Permission','Permission','30','CREATE',NULL,'{\"id\":30,\"key\":\"local_content.manage\",\"module\":\"Local Content Tracking\",\"description\":\"Create, edit and delete local-content tracking records\",\"updatedAt\":\"2026-07-05T15:14:04.871Z\",\"createdAt\":\"2026-07-05T15:14:04.871Z\"}',NULL,'2026-07-05 15:14:04'),(112,NULL,NULL,NULL,'Permission','Permission','31','CREATE',NULL,'{\"id\":31,\"key\":\"hse.manage\",\"module\":\"HSE Register\",\"description\":\"Create, edit, close and delete HSE incidents\",\"updatedAt\":\"2026-07-05T15:14:04.882Z\",\"createdAt\":\"2026-07-05T15:14:04.882Z\"}',NULL,'2026-07-05 15:14:04'),(113,NULL,NULL,NULL,'RolePermission','RolePermission','72','CREATE',NULL,'{\"id\":72,\"roleId\":2,\"permissionId\":30,\"updatedAt\":\"2026-07-05T15:14:04.914Z\",\"createdAt\":\"2026-07-05T15:14:04.914Z\"}',NULL,'2026-07-05 15:14:04'),(114,NULL,NULL,NULL,'RolePermission','RolePermission','73','CREATE',NULL,'{\"id\":73,\"roleId\":2,\"permissionId\":31,\"updatedAt\":\"2026-07-05T15:14:04.925Z\",\"createdAt\":\"2026-07-05T15:14:04.925Z\"}',NULL,'2026-07-05 15:14:04'),(115,NULL,NULL,NULL,'RolePermission','RolePermission','74','CREATE',NULL,'{\"id\":74,\"roleId\":7,\"permissionId\":30,\"updatedAt\":\"2026-07-05T15:14:04.963Z\",\"createdAt\":\"2026-07-05T15:14:04.963Z\"}',NULL,'2026-07-05 15:14:04'),(116,NULL,NULL,NULL,'RolePermission','RolePermission','75','CREATE',NULL,'{\"id\":75,\"roleId\":8,\"permissionId\":30,\"updatedAt\":\"2026-07-05T15:14:04.978Z\",\"createdAt\":\"2026-07-05T15:14:04.978Z\"}',NULL,'2026-07-05 15:14:04'),(117,NULL,NULL,NULL,'RolePermission','RolePermission','76','CREATE',NULL,'{\"id\":76,\"roleId\":9,\"permissionId\":31,\"updatedAt\":\"2026-07-05T15:14:04.992Z\",\"createdAt\":\"2026-07-05T15:14:04.992Z\"}',NULL,'2026-07-05 15:14:04'),(118,1,'admin@enquest-demo.com','Admin','Notification','Notification','52','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:44:33.366Z\"}','::1','2026-07-05 15:14:33'),(119,1,'admin@enquest-demo.com','Admin','Notification','Notification','35','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:44:34.549Z\"}','::1','2026-07-05 15:14:34'),(120,1,'admin@enquest-demo.com','Admin','Notification','Notification','36','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:44:35.418Z\"}','::1','2026-07-05 15:14:35'),(121,1,'admin@enquest-demo.com','Admin','Notification','Notification','38','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:44:37.241Z\"}','::1','2026-07-05 15:14:37'),(122,1,'admin@enquest-demo.com','Admin','Notification','Notification','42','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.271Z\"}','::1','2026-07-05 15:20:22'),(123,1,'admin@enquest-demo.com','Admin','Notification','Notification','34','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.272Z\"}','::1','2026-07-05 15:20:22'),(124,1,'admin@enquest-demo.com','Admin','Notification','Notification','33','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.271Z\"}','::1','2026-07-05 15:20:22'),(125,1,'admin@enquest-demo.com','Admin','Notification','Notification','32','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.271Z\"}','::1','2026-07-05 15:20:22'),(126,1,'admin@enquest-demo.com','Admin','Notification','Notification','4','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.272Z\"}','::1','2026-07-05 15:20:22'),(127,1,'admin@enquest-demo.com','Admin','Notification','Notification','25','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.272Z\"}','::1','2026-07-05 15:20:22'),(128,1,'admin@enquest-demo.com','Admin','Notification','Notification','22','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.272Z\"}','::1','2026-07-05 15:20:22'),(129,1,'admin@enquest-demo.com','Admin','Notification','Notification','23','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.273Z\"}','::1','2026-07-05 15:20:22'),(130,1,'admin@enquest-demo.com','Admin','Notification','Notification','18','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.273Z\"}','::1','2026-07-05 15:20:22'),(131,1,'admin@enquest-demo.com','Admin','Notification','Notification','40','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.273Z\"}','::1','2026-07-05 15:20:22'),(132,1,'admin@enquest-demo.com','Admin','Notification','Notification','26','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.273Z\"}','::1','2026-07-05 15:20:22'),(133,1,'admin@enquest-demo.com','Admin','Notification','Notification','27','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.274Z\"}','::1','2026-07-05 15:20:22'),(134,1,'admin@enquest-demo.com','Admin','Notification','Notification','28','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.274Z\"}','::1','2026-07-05 15:20:22'),(135,1,'admin@enquest-demo.com','Admin','Notification','Notification','29','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.275Z\"}','::1','2026-07-05 15:20:22'),(136,1,'admin@enquest-demo.com','Admin','Notification','Notification','31','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.275Z\"}','::1','2026-07-05 15:20:22'),(137,1,'admin@enquest-demo.com','Admin','Notification','Notification','30','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.275Z\"}','::1','2026-07-05 15:20:22'),(138,1,'admin@enquest-demo.com','Admin','Notification','Notification','15','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.275Z\"}','::1','2026-07-05 15:20:22'),(139,1,'admin@enquest-demo.com','Admin','Notification','Notification','17','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.276Z\"}','::1','2026-07-05 15:20:22'),(140,1,'admin@enquest-demo.com','Admin','Notification','Notification','1','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.276Z\"}','::1','2026-07-05 15:20:22'),(141,1,'admin@enquest-demo.com','Admin','Notification','Notification','7','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-05T15:50:22.276Z\"}','::1','2026-07-05 15:20:22'),(142,NULL,NULL,NULL,'Notification','Notification','53','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":53,\"message\":\"Correspondence \\\"Request for WCTP Exploration Licence Extension Documentation\\\" (Petroleum Commission) — awaiting response is due in 14 day(s) (Mon Jul 20 2026)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Correspondence\",\"entityType\":\"Correspondence\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-20T00:00:00.000Z\",\"dedupeKey\":\"Correspondence|Correspondence|1|DateBased|lead14|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-06T00:52:59.070Z\",\"updatedAt\":\"2026-07-06T00:52:59.115Z\",\"createdAt\":\"2026-07-06T00:52:59.115Z\"}',NULL,'2026-07-06 00:52:59'),(143,NULL,NULL,NULL,'Notification','Notification','54','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":54,\"message\":\"Correspondence \\\"Request for WCTP Exploration Licence Extension Documentation\\\" (Petroleum Commission) — awaiting response is due in 14 day(s) (Mon Jul 20 2026)\",\"type\":\"Error\",\"userId\":12,\"module\":\"Correspondence\",\"entityType\":\"Correspondence\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-20T00:00:00.000Z\",\"dedupeKey\":\"Correspondence|Correspondence|1|DateBased|lead14|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-06T00:52:59.070Z\",\"updatedAt\":\"2026-07-06T00:52:59.284Z\",\"createdAt\":\"2026-07-06T00:52:59.284Z\"}',NULL,'2026-07-06 00:52:59'),(144,1,'admin@enquest-demo.com','Admin','Notification','Notification','54','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T04:10:50.476Z\"}','::1','2026-07-06 03:40:50'),(145,1,'admin@enquest-demo.com','Admin','Notification','Notification','53','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":null}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T04:10:50.475Z\"}','::1','2026-07-06 03:40:50'),(146,1,'admin@enquest-demo.com','Admin','Activity','Activity','1','UPDATE','{\"progress\":100,\"plannedCost\":\"150000.00\",\"actualCost\":\"142000.00\"}','{\"progress\":60,\"plannedCost\":150000,\"actualCost\":142000}','::1','2026-07-06 05:18:44'),(147,1,'admin@enquest-demo.com','Admin','Task','Task','13','CREATE',NULL,'{\"dependencyTaskIds\":[],\"progress\":0,\"id\":13,\"title\":\"Activity Assignment: Drilling Programme Approval\",\"description\":\"Regulatory and internal approval of the JUB-P3-07 drilling programme.\",\"status\":\"Completed\",\"priority\":\"High\",\"dueDate\":\"2025-11-01T00:00:00.000Z\",\"assignedToId\":4,\"relatedType\":\"Activity\",\"relatedId\":1,\"updatedAt\":\"2026-07-06T05:18:44.022Z\",\"createdAt\":\"2026-07-06T05:18:44.022Z\"}','::1','2026-07-06 05:18:44'),(148,1,'admin@enquest-demo.com','Admin','Activity','Activity','1','UPDATE','{\"status\":\"Completed\",\"plannedCost\":\"150000.00\",\"actualCost\":\"142000.00\"}','{\"status\":\"Active\",\"plannedCost\":150000,\"actualCost\":142000}','::1','2026-07-06 05:18:44'),(149,1,'admin@enquest-demo.com','Admin','Activity','Activity','1','UPDATE','{\"status\":\"Active\",\"plannedCost\":\"150000.00\",\"actualCost\":\"142000.00\"}','{\"status\":\"Inactive\",\"plannedCost\":150000,\"actualCost\":142000}','::1','2026-07-06 05:18:44'),(150,NULL,NULL,NULL,'Notification','Notification','55','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":55,\"message\":\"Activity \\\"Drilling Programme Approval\\\" is overdue (was due Sat Nov 01 2025)\",\"type\":\"Error\",\"userId\":4,\"module\":\"Activity\",\"entityType\":\"Activity\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2025-11-01T00:00:00.000Z\",\"dedupeKey\":\"Activity|Activity|1|DateBased|overdue|4\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-06T05:52:57.909Z\",\"updatedAt\":\"2026-07-06T05:52:57.911Z\",\"createdAt\":\"2026-07-06T05:52:57.911Z\"}',NULL,'2026-07-06 05:52:57'),(151,NULL,NULL,NULL,'Notification','Notification','55','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-06T05:52:57.998Z\",\"escalatedToUserId\":1}',NULL,'2026-07-06 05:52:58'),(152,NULL,NULL,NULL,'Notification','Notification','56','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":56,\"message\":\"ESCALATION: Activity \\\"Drilling Programme Approval\\\" is overdue (was due Sat Nov 01 2025) (unacknowledged past grace period)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Activity\",\"entityType\":\"Activity\",\"entityId\":\"1\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2025-11-01T00:00:00.000Z\",\"dedupeKey\":\"Activity|Activity|1|DateBased|overdue|4|escalation\",\"lastSentAt\":\"2026-07-06T05:52:57.998Z\",\"updatedAt\":\"2026-07-06T05:52:58.009Z\",\"createdAt\":\"2026-07-06T05:52:58.009Z\"}',NULL,'2026-07-06 05:52:58'),(153,NULL,NULL,NULL,'Notification','Notification','56','UPDATE','{\"status\":\"Pending\",\"escalatedAt\":null,\"escalatedToUserId\":null}','{\"status\":\"Escalated\",\"escalatedAt\":\"2026-07-06T07:14:04.606Z\",\"escalatedToUserId\":1}',NULL,'2026-07-06 07:14:04'),(154,NULL,NULL,NULL,'Notification','Notification','9','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:38.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.452Z\"}',NULL,'2026-07-06 08:14:04'),(155,NULL,NULL,NULL,'Notification','Notification','10','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:38.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.479Z\"}',NULL,'2026-07-06 08:14:04'),(156,NULL,NULL,NULL,'Notification','Notification','11','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:38.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.487Z\"}',NULL,'2026-07-06 08:14:04'),(157,NULL,NULL,NULL,'Notification','Notification','12','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:38.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.496Z\"}',NULL,'2026-07-06 08:14:04'),(158,NULL,NULL,NULL,'Notification','Notification','13','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:38.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.505Z\"}',NULL,'2026-07-06 08:14:04'),(159,NULL,NULL,NULL,'Notification','Notification','15','UPDATE','{\"message\":\"Exploration PC-EXP-2021-014 is due in 46 day(s) (Thu Aug 20 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Exploration PC-EXP-2021-014 is due in 45 day(s) (Thu Aug 20 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.516Z\"}',NULL,'2026-07-06 08:14:04'),(160,NULL,NULL,NULL,'Notification','Notification','17','UPDATE','{\"message\":\"Environmental EPA-ENV-2024-102 is due in 87 day(s) (Wed Sep 30 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Environmental EPA-ENV-2024-102 is due in 86 day(s) (Wed Sep 30 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.527Z\"}',NULL,'2026-07-06 08:14:04'),(161,NULL,NULL,NULL,'Notification','Notification','18','UPDATE','{\"message\":\"Contract \\\"Rig Charter Agreement - Atwood Explorer\\\" (Atwood Oceanics) is due in 27 day(s) (Sat Aug 01 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Contract \\\"Rig Charter Agreement - Atwood Explorer\\\" (Atwood Oceanics) is due in 26 day(s) (Sat Aug 01 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.537Z\"}',NULL,'2026-07-06 08:14:04'),(162,NULL,NULL,NULL,'Notification','Notification','19','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.551Z\"}',NULL,'2026-07-06 08:14:04'),(163,NULL,NULL,NULL,'Notification','Notification','20','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.561Z\"}',NULL,'2026-07-06 08:14:04'),(164,NULL,NULL,NULL,'Notification','Notification','21','UPDATE','{\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"lastSentAt\":\"2026-07-06T08:14:04.571Z\"}',NULL,'2026-07-06 08:14:04'),(165,NULL,NULL,NULL,'Notification','Notification','22','UPDATE','{\"message\":\"Compliance obligation \\\"Q2 2026 Royalty Payment - WCTP\\\" (Ghana Revenue Authority) is due in 10 day(s) (Wed Jul 15 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Compliance obligation \\\"Q2 2026 Royalty Payment - WCTP\\\" (Ghana Revenue Authority) is due in 9 day(s) (Wed Jul 15 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.581Z\"}',NULL,'2026-07-06 08:14:04'),(166,NULL,NULL,NULL,'Notification','Notification','23','UPDATE','{\"message\":\"Compliance obligation \\\"Environmental Monitoring Report Filing\\\" (Environmental Protection Agency) is due in 26 day(s) (Fri Jul 31 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Compliance obligation \\\"Environmental Monitoring Report Filing\\\" (Environmental Protection Agency) is due in 25 day(s) (Fri Jul 31 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.592Z\"}',NULL,'2026-07-06 08:14:04'),(167,NULL,NULL,NULL,'Notification','Notification','25','UPDATE','{\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 5 day(s) (Fri Jul 10 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 4 day(s) (Fri Jul 10 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.601Z\"}',NULL,'2026-07-06 08:14:04'),(168,NULL,NULL,NULL,'Notification','Notification','26','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.617Z\"}',NULL,'2026-07-06 08:14:04'),(169,NULL,NULL,NULL,'Notification','Notification','27','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.628Z\"}',NULL,'2026-07-06 08:14:04'),(170,NULL,NULL,NULL,'Notification','Notification','28','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.639Z\"}',NULL,'2026-07-06 08:14:04'),(171,NULL,NULL,NULL,'Notification','Notification','29','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.650Z\"}',NULL,'2026-07-06 08:14:04'),(172,NULL,NULL,NULL,'Notification','Notification','30','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.659Z\"}',NULL,'2026-07-06 08:14:04'),(173,NULL,NULL,NULL,'Notification','Notification','31','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.668Z\"}',NULL,'2026-07-06 08:14:04'),(174,NULL,NULL,NULL,'Notification','Notification','32','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.677Z\"}',NULL,'2026-07-06 08:14:04'),(175,NULL,NULL,NULL,'Notification','Notification','33','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.686Z\"}',NULL,'2026-07-06 08:14:04'),(176,NULL,NULL,NULL,'Notification','Notification','34','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.695Z\"}',NULL,'2026-07-06 08:14:04'),(177,NULL,NULL,NULL,'Notification','Notification','35','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.704Z\"}',NULL,'2026-07-06 08:14:04'),(178,NULL,NULL,NULL,'Notification','Notification','36','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.714Z\"}',NULL,'2026-07-06 08:14:04'),(179,NULL,NULL,NULL,'Notification','Notification','38','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.727Z\"}',NULL,'2026-07-06 08:14:04'),(180,NULL,NULL,NULL,'Notification','Notification','40','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.749Z\"}',NULL,'2026-07-06 08:14:04'),(181,NULL,NULL,NULL,'Notification','Notification','42','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T08:14:04.771Z\"}',NULL,'2026-07-06 08:14:04'),(182,NULL,NULL,NULL,'Notification','Notification','14','UPDATE','{\"message\":\"Exploration PC-EXP-2021-014 is due in 46 day(s) (Thu Aug 20 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Exploration PC-EXP-2021-014 is due in 45 day(s) (Thu Aug 20 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T15:19:43.672Z\"}',NULL,'2026-07-06 15:19:43'),(183,NULL,NULL,NULL,'Notification','Notification','16','UPDATE','{\"message\":\"Environmental EPA-ENV-2024-102 is due in 87 day(s) (Wed Sep 30 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Environmental EPA-ENV-2024-102 is due in 86 day(s) (Wed Sep 30 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T15:19:43.718Z\"}',NULL,'2026-07-06 15:19:43'),(184,NULL,NULL,NULL,'Notification','Notification','24','UPDATE','{\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 5 day(s) (Fri Jul 10 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:39.000Z\"}','{\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 4 day(s) (Fri Jul 10 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T15:19:43.761Z\"}',NULL,'2026-07-06 15:19:43'),(185,NULL,NULL,NULL,'Notification','Notification','37','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T15:19:43.816Z\"}',NULL,'2026-07-06 15:19:43'),(186,NULL,NULL,NULL,'Notification','Notification','39','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T15:19:43.835Z\"}',NULL,'2026-07-06 15:19:43'),(187,NULL,NULL,NULL,'Notification','Notification','41','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T07:58:40.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T15:19:43.846Z\"}',NULL,'2026-07-06 15:19:43'),(188,NULL,NULL,NULL,'Notification','Notification','52','UPDATE','{\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-05T12:31:58.000Z\"}','{\"status\":\"Pending\",\"lastSentAt\":\"2026-07-06T15:19:43.872Z\"}',NULL,'2026-07-06 15:19:43'),(189,1,'admin@enquest-demo.com','Admin','Notification','Notification','52','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:44:33.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.862Z\"}','::1','2026-07-06 17:15:04'),(190,1,'admin@enquest-demo.com','Admin','Notification','Notification','36','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:44:35.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.864Z\"}','::1','2026-07-06 17:15:04'),(191,1,'admin@enquest-demo.com','Admin','Notification','Notification','37','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-06T13:28:50.000Z\",\"snoozeReason\":\"discussion is pending\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.865Z\",\"snoozeReason\":null}','::1','2026-07-06 17:15:04'),(192,1,'admin@enquest-demo.com','Admin','Notification','Notification','35','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:44:34.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.863Z\"}','::1','2026-07-06 17:15:04'),(193,1,'admin@enquest-demo.com','Admin','Notification','Notification','41','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-06T13:29:08.000Z\",\"snoozeReason\":\"wait for 1 day\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.867Z\",\"snoozeReason\":null}','::1','2026-07-06 17:15:04'),(194,1,'admin@enquest-demo.com','Admin','Notification','Notification','38','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:44:37.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.866Z\"}','::1','2026-07-06 17:15:04'),(195,1,'admin@enquest-demo.com','Admin','Notification','Notification','42','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.868Z\"}','::1','2026-07-06 17:15:04'),(196,1,'admin@enquest-demo.com','Admin','Notification','Notification','32','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.869Z\"}','::1','2026-07-06 17:15:04'),(197,1,'admin@enquest-demo.com','Admin','Notification','Notification','33','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.870Z\"}','::1','2026-07-06 17:15:04'),(198,1,'admin@enquest-demo.com','Admin','Notification','Notification','34','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.871Z\"}','::1','2026-07-06 17:15:04'),(199,1,'admin@enquest-demo.com','Admin','Notification','Notification','24','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-06T13:29:26.000Z\",\"snoozeReason\":\"discussion pending\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.871Z\",\"snoozeReason\":null}','::1','2026-07-06 17:15:04'),(200,1,'admin@enquest-demo.com','Admin','Notification','Notification','25','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.871Z\"}','::1','2026-07-06 17:15:05'),(201,1,'admin@enquest-demo.com','Admin','Notification','Notification','23','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.872Z\"}','::1','2026-07-06 17:15:05'),(202,1,'admin@enquest-demo.com','Admin','Notification','Notification','22','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.872Z\"}','::1','2026-07-06 17:15:05'),(203,1,'admin@enquest-demo.com','Admin','Notification','Notification','18','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.872Z\"}','::1','2026-07-06 17:15:05'),(204,1,'admin@enquest-demo.com','Admin','Notification','Notification','40','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.873Z\"}','::1','2026-07-06 17:15:05'),(205,1,'admin@enquest-demo.com','Admin','Notification','Notification','39','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-06T13:29:47.000Z\",\"snoozeReason\":\"discussion pending\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.873Z\",\"snoozeReason\":null}','::1','2026-07-06 17:15:05'),(206,1,'admin@enquest-demo.com','Admin','Notification','Notification','26','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.873Z\"}','::1','2026-07-06 17:15:05'),(207,1,'admin@enquest-demo.com','Admin','Notification','Notification','27','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.873Z\"}','::1','2026-07-06 17:15:05'),(208,1,'admin@enquest-demo.com','Admin','Notification','Notification','28','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.874Z\"}','::1','2026-07-06 17:15:05'),(209,1,'admin@enquest-demo.com','Admin','Notification','Notification','29','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.874Z\"}','::1','2026-07-06 17:15:05'),(210,1,'admin@enquest-demo.com','Admin','Notification','Notification','30','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.874Z\"}','::1','2026-07-06 17:15:05'),(211,1,'admin@enquest-demo.com','Admin','Notification','Notification','31','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.875Z\"}','::1','2026-07-06 17:15:05'),(212,1,'admin@enquest-demo.com','Admin','Notification','Notification','14','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-06T13:29:52.000Z\",\"snoozeReason\":\"discussion pending\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.875Z\",\"snoozeReason\":null}','::1','2026-07-06 17:15:05'),(213,1,'admin@enquest-demo.com','Admin','Notification','Notification','15','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.875Z\"}','::1','2026-07-06 17:15:05'),(214,1,'admin@enquest-demo.com','Admin','Notification','Notification','17','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-05T15:50:22.000Z\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.876Z\"}','::1','2026-07-06 17:15:05'),(215,1,'admin@enquest-demo.com','Admin','Notification','Notification','16','UPDATE','{\"status\":\"Pending\",\"snoozeUntil\":\"2026-07-06T13:30:01.000Z\",\"snoozeReason\":\"discussion pending\"}','{\"status\":\"Snoozed\",\"snoozeUntil\":\"2026-07-06T17:45:04.876Z\",\"snoozeReason\":null}','::1','2026-07-06 17:15:05'),(216,NULL,NULL,NULL,'Notification','Notification','57','CREATE',NULL,'{\"channels\":[\"InApp\"],\"read\":false,\"id\":57,\"message\":\"Task \\\"Legal review of RFQ terms\\\" is due in 3 day(s) (Fri Jul 10 2026)\",\"type\":\"Error\",\"userId\":5,\"module\":\"Task\",\"entityType\":\"Task\",\"entityId\":\"5\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-10T00:00:00.000Z\",\"dedupeKey\":\"Task|Task|5|DateBased|lead3|5\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-07T00:48:12.486Z\",\"updatedAt\":\"2026-07-07T00:48:12.509Z\",\"createdAt\":\"2026-07-07T00:48:12.509Z\"}',NULL,'2026-07-07 00:48:12'),(217,NULL,NULL,NULL,'Notification','Notification','58','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":58,\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 3 day(s) (Fri Jul 10 2026)\",\"type\":\"Error\",\"userId\":1,\"module\":\"Correspondence\",\"entityType\":\"Correspondence\",\"entityId\":\"6\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-10T00:00:00.000Z\",\"dedupeKey\":\"Correspondence|Correspondence|6|DateBased|lead3|1\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-07T00:48:12.656Z\",\"updatedAt\":\"2026-07-07T00:48:12.660Z\",\"createdAt\":\"2026-07-07T00:48:12.660Z\"}',NULL,'2026-07-07 00:48:12'),(218,NULL,NULL,NULL,'Notification','Notification','59','CREATE',NULL,'{\"channels\":[\"InApp\",\"Email\"],\"read\":false,\"id\":59,\"message\":\"Correspondence \\\"CTP Onshore Drilling Licence Renewal Application\\\" (Petroleum Commission) — awaiting response is due in 3 day(s) (Fri Jul 10 2026)\",\"type\":\"Error\",\"userId\":12,\"module\":\"Correspondence\",\"entityType\":\"Correspondence\",\"entityId\":\"6\",\"triggerType\":\"DateBased\",\"priority\":\"Critical\",\"status\":\"Pending\",\"dueAt\":\"2026-07-10T00:00:00.000Z\",\"dedupeKey\":\"Correspondence|Correspondence|6|DateBased|lead3|12\",\"recurrenceIntervalHours\":24,\"lastSentAt\":\"2026-07-07T00:48:12.656Z\",\"updatedAt\":\"2026-07-07T00:48:12.681Z\",\"createdAt\":\"2026-07-07T00:48:12.681Z\"}',NULL,'2026-07-07 00:48:12'),(219,NULL,NULL,NULL,'Permission','Permission','32','CREATE',NULL,'{\"id\":32,\"key\":\"reports.manage\",\"module\":\"Reports\",\"description\":\"Create, edit and delete report catalogue definitions\",\"updatedAt\":\"2026-07-07T01:55:57.732Z\",\"createdAt\":\"2026-07-07T01:55:57.732Z\"}',NULL,'2026-07-07 01:55:57'),(220,NULL,NULL,NULL,'RolePermission','RolePermission','77','CREATE',NULL,'{\"id\":77,\"roleId\":1,\"permissionId\":32,\"updatedAt\":\"2026-07-07T01:55:57.876Z\",\"createdAt\":\"2026-07-07T01:55:57.876Z\"}',NULL,'2026-07-07 01:55:57'),(221,NULL,NULL,NULL,'Notification','Notification','53','UPDATE','{\"message\":\"Correspondence \\\"Request for WCTP Exploration Licence Extension Documentation\\\" (Petroleum Commission) — awaiting response is due in 14 day(s) (Mon Jul 20 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-06T00:52:59.000Z\"}','{\"message\":\"Correspondence \\\"Request for WCTP Exploration Licence Extension Documentation\\\" (Petroleum Commission) — awaiting response is due in 13 day(s) (Mon Jul 20 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-07T01:55:57.980Z\"}',NULL,'2026-07-07 01:55:57'),(222,NULL,NULL,NULL,'Notification','Notification','54','UPDATE','{\"message\":\"Correspondence \\\"Request for WCTP Exploration Licence Extension Documentation\\\" (Petroleum Commission) — awaiting response is due in 14 day(s) (Mon Jul 20 2026)\",\"status\":\"Snoozed\",\"lastSentAt\":\"2026-07-06T00:52:59.000Z\"}','{\"message\":\"Correspondence \\\"Request for WCTP Exploration Licence Extension Documentation\\\" (Petroleum Commission) — awaiting response is due in 13 day(s) (Mon Jul 20 2026)\",\"status\":\"Pending\",\"lastSentAt\":\"2026-07-07T01:55:57.980Z\"}',NULL,'2026-07-07 01:55:58');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blocks`
--

DROP TABLE IF EXISTS `blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('Active','Inactive','Completed') COLLATE utf8mb4_general_ci DEFAULT 'Active',
  `operator` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `workingInterest` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `area` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocks`
--

LOCK TABLES `blocks` WRITE;
/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT INTO `blocks` VALUES (1,'West Cape Three Points (WCTP)','Offshore exploration and production block in the Western Basin, home of the Jubilee field.','Active','EnQuest Ghana Ltd','30%','540 km²','Western Region, Offshore Ghana','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'Deepwater Tano (DWT)','Deepwater block with active FPSO production.','Active','EnQuest Ghana Ltd','17.5%','1,100 km²','Tano Basin, Offshore Ghana','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'South Tano','Appraisal-stage offshore block.','Active','EnQuest Ghana Ltd','45%','620 km²','Tano Basin, Offshore Ghana','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'Cape Three Points Onshore','Onshore block; exploration phase concluded, decommissioning complete.','Completed','EnQuest Ghana Ltd','25%','210 km²','Western Region, Onshore Ghana','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budget_lines`
--

DROP TABLE IF EXISTS `budget_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `blockId` int NOT NULL,
  `activityId` int DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `budgetCategory` varchar(255) DEFAULT NULL,
  `plannedStartDate` datetime DEFAULT NULL,
  `plannedEndDate` datetime DEFAULT NULL,
  `actualStartDate` datetime DEFAULT NULL,
  `actualEndDate` datetime DEFAULT NULL,
  `currency` enum('GHS','USD') NOT NULL DEFAULT 'USD',
  `approvedBudget` decimal(15,2) NOT NULL DEFAULT '0.00',
  `committed` decimal(15,2) NOT NULL DEFAULT '0.00',
  `actualSpend` decimal(15,2) NOT NULL DEFAULT '0.00',
  `variancePercent` decimal(8,2) NOT NULL DEFAULT '0.00',
  `responsiblePerson` varchar(255) DEFAULT NULL,
  `status` enum('Draft','Active','Closed') NOT NULL DEFAULT 'Draft',
  `revisionStatus` enum('None','PendingApproval','Approved','Rejected') NOT NULL DEFAULT 'None',
  `pendingApprovedBudget` decimal(15,2) DEFAULT NULL,
  `revisionRequestedById` int DEFAULT NULL,
  `revisionRequestedAt` datetime DEFAULT NULL,
  `revisionDecidedById` int DEFAULT NULL,
  `revisionDecidedAt` datetime DEFAULT NULL,
  `revisionComment` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_budgetlines_activity` (`activityId`),
  KEY `fk_budgetlines_requestedBy` (`revisionRequestedById`),
  KEY `fk_budgetlines_decidedBy` (`revisionDecidedById`),
  KEY `idx_budgetlines_block` (`blockId`),
  KEY `idx_budgetlines_status` (`status`),
  CONSTRAINT `fk_budgetlines_activity` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_budgetlines_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_budgetlines_decidedBy` FOREIGN KEY (`revisionDecidedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_budgetlines_requestedBy` FOREIGN KEY (`revisionRequestedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_lines`
--

LOCK TABLES `budget_lines` WRITE;
/*!40000 ALTER TABLE `budget_lines` DISABLE KEYS */;
INSERT INTO `budget_lines` VALUES (1,1,2,'Rig Mobilisation Budget','Drilling','2025-10-01 00:00:00','2025-11-15 00:00:00','2025-10-10 00:00:00','2025-11-12 00:00:00','USD',2200000.00,2350000.00,2350000.00,6.82,'Kwame Appiah','Closed','None',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,1,3,'Well Testing Programme','Operations','2026-05-01 00:00:00','2026-08-01 00:00:00',NULL,NULL,'USD',900000.00,500000.00,410000.00,-54.44,'Samuel Darko','Active','None',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,1,7,'Long-lead Equipment Procurement','Procurement','2026-02-15 00:00:00','2026-08-15 00:00:00',NULL,NULL,'USD',4200000.00,3900000.00,2300000.00,-45.24,'Nana Asante','Active','PendingApproval',4600000.00,6,'2026-06-25 00:00:00',NULL,NULL,'Requesting increase due to steel price escalation.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,2,9,'FPSO Turret Bearing Replacement','Maintenance','2026-04-01 00:00:00','2026-10-15 00:00:00',NULL,NULL,'USD',8000000.00,6000000.00,2100000.00,-73.75,'Samuel Darko','Active','Approved',NULL,6,'2026-03-01 00:00:00',2,'2026-03-05 00:00:00','Approved additional contingency for critical maintenance.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(5,2,NULL,'FPSO O&M Annual Budget','Operations','2026-01-01 00:00:00','2026-12-31 00:00:00',NULL,NULL,'USD',21000000.00,12000000.00,11500000.00,-45.24,'Nana Asante','Active','None',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 04:47:21','2026-07-05 04:47:21'),(6,3,11,'ST-04 Environmental Permitting','Regulatory','2025-09-01 00:00:00','2026-06-01 00:00:00',NULL,NULL,'USD',120000.00,90000.00,65000.00,-45.83,'Doris Kufuor','Active','None',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 04:47:21','2026-07-05 04:47:21'),(7,4,13,'CTP Site Restoration','Decommissioning','2023-06-01 00:00:00','2024-12-01 00:00:00','2023-06-15 00:00:00','2024-11-20 00:00:00','GHS',82000000.00,82000000.00,81500000.00,-0.61,'Kwame Appiah','Closed','None',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 04:47:21','2026-07-05 04:47:21'),(8,1,6,'Infill Well WCTP-14 Design','Engineering','2026-03-01 00:00:00','2026-09-01 00:00:00',NULL,NULL,'GHS',6000000.00,2500000.00,2100000.00,-65.00,'Kwame Appiah','Draft','None',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `budget_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `activityId` int DEFAULT NULL,
  `userId` int NOT NULL,
  `departmentId` int NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `taskId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activityId` (`activityId`),
  KEY `userId` (`userId`),
  KEY `departmentId` (`departmentId`),
  KEY `fk_comments_task` (`taskId`),
  CONSTRAINT `comments_ibfk_46` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_47` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_48` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,'Flow test rates exceeded forecast by 12% — good result.',4,8,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(2,'Please expedite vendor quotes, rig slot at risk if RFQ slips further.',NULL,4,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',4),(3,'Legal terms reviewed, awaiting redlines from counterparty.',NULL,5,3,'2026-07-05 04:47:21','2026-07-05 04:47:21',5),(4,'Budget line approved at Finance committee meeting.',9,6,2,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(5,'EPA has requested additional biodiversity survey data before proceeding.',11,7,4,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(6,'Critical: rig contract signature required by Friday to avoid penalty.',NULL,4,1,'2026-07-05 04:47:21','2026-07-05 04:47:21',3);
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compliance_obligations`
--

DROP TABLE IF EXISTS `compliance_obligations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compliance_obligations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `regulatoryBody` varchar(255) DEFAULT NULL,
  `category` enum('Tax','Licence Fee','Royalty','Filing','Other') NOT NULL DEFAULT 'Other',
  `frequency` enum('One-off','Monthly','Quarterly','Annual') NOT NULL DEFAULT 'One-off',
  `blockId` int DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `amountDue` decimal(15,2) DEFAULT '0.00',
  `amountPaid` decimal(15,2) DEFAULT '0.00',
  `paymentDate` datetime DEFAULT NULL,
  `referenceNo` varchar(255) DEFAULT NULL,
  `evidenceDocumentId` int DEFAULT NULL,
  `status` enum('Pending','Paid','Overdue','Closed') NOT NULL DEFAULT 'Pending',
  `responsibleOfficer` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_compliance_block` (`blockId`),
  KEY `fk_compliance_evidence` (`evidenceDocumentId`),
  KEY `idx_compliance_due` (`dueDate`),
  CONSTRAINT `fk_compliance_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_compliance_evidence` FOREIGN KEY (`evidenceDocumentId`) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compliance_obligations`
--

LOCK TABLES `compliance_obligations` WRITE;
/*!40000 ALTER TABLE `compliance_obligations` DISABLE KEYS */;
INSERT INTO `compliance_obligations` VALUES (1,'Q2 2026 Royalty Payment - WCTP','Ghana Revenue Authority','Royalty','Quarterly',1,'2026-07-15 00:00:00',1250000.00,0.00,NULL,NULL,NULL,'Pending','Nana Asante','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'Annual Petroleum Income Tax Filing 2025','Ghana Revenue Authority','Tax','Annual',NULL,'2026-06-30 00:00:00',8400000.00,8400000.00,'2026-06-25 00:00:00','GRA-PIT-2025-0092',9,'Paid','Nana Asante','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'Surface Rental Fee - CTP Onshore','Petroleum Commission','Licence Fee','Annual',4,'2026-05-01 00:00:00',45000.00,0.00,NULL,NULL,NULL,'Overdue','Ewurabena Boateng','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'Q1 2026 Royalty Payment - Tano FPSO','Ghana Revenue Authority','Royalty','Quarterly',2,'2026-04-15 00:00:00',3200000.00,3200000.00,'2026-04-10 00:00:00','GRA-ROY-2026-Q1',NULL,'Closed','Nana Asante','2026-07-05 04:47:21','2026-07-05 04:47:21'),(5,'Environmental Monitoring Report Filing','Environmental Protection Agency','Filing','Quarterly',3,'2026-07-31 00:00:00',0.00,0.00,NULL,NULL,NULL,'Pending','Doris Kufuor','2026-07-05 04:47:21','2026-07-05 04:47:21'),(6,'GNPC Local Content Plan Filing 2026','GNPC','Filing','Annual',1,'2026-03-31 00:00:00',0.00,0.00,NULL,NULL,NULL,'Overdue','Kwame Appiah','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `compliance_obligations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `counterparty` varchar(255) DEFAULT NULL,
  `contractType` enum('Service','JV','Rig','Supply','Other') NOT NULL DEFAULT 'Service',
  `blockId` int DEFAULT NULL,
  `effectiveDate` datetime DEFAULT NULL,
  `expiryDate` datetime DEFAULT NULL,
  `value` decimal(15,2) DEFAULT '0.00',
  `renewalNoticePeriodDays` int DEFAULT NULL,
  `autoRenew` tinyint(1) NOT NULL DEFAULT '0',
  `owner` varchar(255) DEFAULT NULL,
  `status` enum('Draft','Active','Expired','Terminated','Renewed') NOT NULL DEFAULT 'Draft',
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_contracts_block` (`blockId`),
  KEY `idx_contracts_expiry` (`expiryDate`),
  CONSTRAINT `fk_contracts_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` VALUES (1,'Rig Charter Agreement - Atwood Explorer','Atwood Oceanics','Rig',1,'2025-06-01 00:00:00','2026-08-01 00:00:00',45000000.00,60,0,'Ewurabena Boateng','Active','Renewal negotiation ongoing for extension to Q4 2026.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'FPSO O&M Services Agreement','MODEC Production Services','Service',2,'2016-05-01 00:00:00','2028-05-01 00:00:00',210000000.00,180,1,'Nana Asante','Active','Long-term operations & maintenance contract for the Tano FPSO.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'Joint Venture Agreement - WCTP Partners','GNPC Exploration & Production','JV',1,'2014-01-01 00:00:00',NULL,0.00,NULL,0,'Ewurabena Boateng','Active','Governs the WCTP joint venture participation.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'Subsea Equipment Supply Contract','TechnipFMC','Supply',2,'2026-01-01 00:00:00','2027-06-30 00:00:00',38000000.00,90,0,'Kwame Appiah','Active','Supply of subsea trees and manifolds for the tieback project.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(5,'Legacy Catering Services Contract','Tropical Catering Services','Service',4,'2018-01-01 00:00:00','2024-12-31 00:00:00',1200000.00,30,0,'Ewurabena Boateng','Expired','Not renewed following CTP onshore decommissioning.','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correspondences`
--

DROP TABLE IF EXISTS `correspondences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correspondences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `direction` enum('Inbound','Outbound') NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fromParty` varchar(255) DEFAULT NULL,
  `toParty` varchar(255) DEFAULT NULL,
  `regulator` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `referenceNo` varchar(255) DEFAULT NULL,
  `summary` text,
  `blockId` int DEFAULT NULL,
  `awaitingResponse` tinyint(1) NOT NULL DEFAULT '0',
  `responseDueDate` datetime DEFAULT NULL,
  `documentId` int DEFAULT NULL,
  `status` enum('Open','Closed') NOT NULL DEFAULT 'Open',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_correspondence_block` (`blockId`),
  KEY `fk_correspondence_document` (`documentId`),
  KEY `idx_correspondence_response_due` (`responseDueDate`),
  CONSTRAINT `fk_correspondence_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_correspondence_document` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correspondences`
--

LOCK TABLES `correspondences` WRITE;
/*!40000 ALTER TABLE `correspondences` DISABLE KEYS */;
INSERT INTO `correspondences` VALUES (1,'Inbound','2026-06-20 00:00:00','Petroleum Commission of Ghana','EnQuest Ghana Ltd','Petroleum Commission','Request for WCTP Exploration Licence Extension Documentation','PC-2026-0456','PC requests supplementary technical data to support the extension application.',1,1,'2026-07-20 00:00:00',6,'Open','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'Outbound','2026-06-01 00:00:00','EnQuest Ghana Ltd','Petroleum Commission of Ghana','Petroleum Commission','WCTP Exploration Licence Extension Request','EQ-OUT-2026-118','Formal request for a 12-month extension of the exploration licence.',1,1,'2026-08-01 00:00:00',6,'Open','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'Inbound','2025-11-05 00:00:00','GNPC','EnQuest Ghana Ltd','GNPC','Approval of 2026 Work Programme and Budget','GNPC-2025-0871','GNPC approves the submitted 2026 WCTP work programme and budget.',1,0,NULL,5,'Closed','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'Outbound','2026-05-15 00:00:00','EnQuest Ghana Ltd','Environmental Protection Agency','EPA','South Tano Appraisal Drilling - EIA Submission','EQ-OUT-2026-095','Submission of the environmental impact assessment for the ST-04 appraisal well.',3,1,'2026-07-25 00:00:00',11,'Open','2026-07-05 04:47:21','2026-07-05 04:47:21'),(5,'Inbound','2026-04-10 00:00:00','Ghana Revenue Authority','EnQuest Ghana Ltd','Ghana Revenue Authority','Q1 2026 Royalty Assessment Confirmation','GRA-2026-0334','Confirmation of royalty assessment receipt for Q1 2026.',2,0,NULL,NULL,'Closed','2026-07-05 04:47:21','2026-07-05 04:47:21'),(6,'Outbound','2026-01-20 00:00:00','EnQuest Ghana Ltd','Petroleum Commission of Ghana','Petroleum Commission','CTP Onshore Drilling Licence Renewal Application','EQ-OUT-2026-011','Application to renew the suspended drilling licence for CTP onshore.',4,1,'2026-07-10 00:00:00',NULL,'Open','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `correspondences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_room_grants`
--

DROP TABLE IF EXISTS `data_room_grants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_room_grants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ndaId` int NOT NULL,
  `documentId` int NOT NULL,
  `accessLevel` enum('View','Download') NOT NULL DEFAULT 'View',
  `grantedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revokedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_datarooomgrants_document` (`documentId`),
  KEY `idx_datarooomgrants_nda` (`ndaId`),
  CONSTRAINT `fk_datarooomgrants_document` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_datarooomgrants_nda` FOREIGN KEY (`ndaId`) REFERENCES `ndas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_room_grants`
--

LOCK TABLES `data_room_grants` WRITE;
/*!40000 ALTER TABLE `data_room_grants` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_room_grants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `decisions`
--

DROP TABLE IF EXISTS `decisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `decisions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `meetingContext` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `decisionMakers` varchar(255) DEFAULT NULL,
  `rationale` text,
  `linkedRiskId` int DEFAULT NULL,
  `linkedActivityId` int DEFAULT NULL,
  `linkedTaskId` int DEFAULT NULL,
  `status` enum('Open','In Progress','Closed') NOT NULL DEFAULT 'Open',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_decisions_risk` (`linkedRiskId`),
  KEY `fk_decisions_activity` (`linkedActivityId`),
  KEY `fk_decisions_task` (`linkedTaskId`),
  CONSTRAINT `fk_decisions_activity` FOREIGN KEY (`linkedActivityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_decisions_risk` FOREIGN KEY (`linkedRiskId`) REFERENCES `risks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_decisions_task` FOREIGN KEY (`linkedTaskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `decisions`
--

LOCK TABLES `decisions` WRITE;
/*!40000 ALTER TABLE `decisions` DISABLE KEYS */;
INSERT INTO `decisions` VALUES (1,'2026-06-15 00:00:00','Executive Committee Meeting','Approved secondary rig contingency option for the WCTP campaign.','James Mensah, Kwame Appiah','Mitigates the rig availability delay risk identified in the risk register.',1,2,NULL,'Closed','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'2026-05-20 00:00:00','Board Meeting Q2 2026','Approved the FPSO turret bearing replacement AFE.','Akosua Owusu, James Mensah','Bearing wear risk assessed as high probability of unplanned shutdown.',3,9,6,'Closed','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'2026-06-28 00:00:00','Operations Review','Deferred subsea tieback FEED contract award pending steel price review.','Kwame Appiah','Cost overrun risk requires further commercial evaluation.',4,10,NULL,'In Progress','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'2026-07-01 00:00:00','Legal & Compliance Review','Agreed to escalate the CTP drilling licence renewal directly with Petroleum Commission leadership.','Ewurabena Boateng, James Mensah','Licence has been suspended for an extended period, risking asset value.',NULL,NULL,NULL,'Open','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `decisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Operations','Field operations, drilling, project delivery and asset management'),(2,'Finance & Accounts','Budgeting, AFE tracking, payments and financial reporting'),(3,'Legal & Compliance','Contracts, statutory compliance and regulatory correspondence'),(4,'HSE','Health, safety and environmental oversight'),(5,'Executive Management','Chairman, CEO and executive leadership'),(6,'Procurement',NULL),(7,'Accounts',NULL),(8,'Commercial',NULL),(9,'HR',NULL);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `activityId` int DEFAULT NULL COMMENT 'Link document to a primary activity',
  `activityIds` text COLLATE utf8mb4_general_ci COMMENT 'JSON array of tagged activity IDs for this document',
  `filename` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `s3Key` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mimeType` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `size` int DEFAULT NULL,
  `rootDocumentId` int DEFAULT NULL COMMENT 'Root document in a version chain',
  `versionNumber` int NOT NULL DEFAULT '1',
  `projectId` int DEFAULT NULL COMMENT 'Link document to a project',
  `documentType` enum('Technical','HSE','Finance','Report','Licence','Legal') COLLATE utf8mb4_general_ci DEFAULT 'Report',
  `uploadDate` datetime DEFAULT NULL,
  `status` enum('Draft','Under Review','Final','Superseded') COLLATE utf8mb4_general_ci DEFAULT 'Draft',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `licenceId` int DEFAULT NULL,
  `contractId` int DEFAULT NULL,
  `taskId` int DEFAULT NULL,
  `blockId` int DEFAULT NULL,
  `ownerId` int DEFAULT NULL,
  `category` enum('Contract','Letter','Notice','Report','Other') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Other',
  `tags` text COLLATE utf8mb4_general_ci,
  `awaitingResponseFrom` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `responseDueDate` datetime DEFAULT NULL,
  `confidentialityLevel` enum('Public','Internal','Confidential') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Public',
  `allowedRoles` text COLLATE utf8mb4_general_ci,
  `insurancePolicyId` int DEFAULT NULL,
  `environmentalPermitId` int DEFAULT NULL,
  `hseIncidentId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activityId` (`activityId`),
  KEY `rootDocumentId` (`rootDocumentId`),
  KEY `projectId` (`projectId`),
  KEY `fk_documents_licence` (`licenceId`),
  KEY `fk_documents_contract` (`contractId`),
  KEY `fk_documents_task` (`taskId`),
  KEY `fk_documents_block` (`blockId`),
  KEY `fk_documents_owner` (`ownerId`),
  KEY `idx_documents_responseDueDate` (`responseDueDate`),
  KEY `fk_documents_insurancePolicyId` (`insurancePolicyId`),
  KEY `fk_documents_environmentalPermitId` (`environmentalPermitId`),
  KEY `fk_documents_hseIncidentId` (`hseIncidentId`),
  CONSTRAINT `documents_ibfk_46` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`),
  CONSTRAINT `documents_ibfk_47` FOREIGN KEY (`rootDocumentId`) REFERENCES `documents` (`id`),
  CONSTRAINT `documents_ibfk_48` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_documents_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_contract` FOREIGN KEY (`contractId`) REFERENCES `contracts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_environmentalPermitId` FOREIGN KEY (`environmentalPermitId`) REFERENCES `environmental_permits` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_hseIncidentId` FOREIGN KEY (`hseIncidentId`) REFERENCES `hse_incidents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_insurancePolicyId` FOREIGN KEY (`insurancePolicyId`) REFERENCES `insurance_policies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_licence` FOREIGN KEY (`licenceId`) REFERENCES `licences` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_owner` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'WCTP Drilling Programme v1','Approved drilling programme for Jubilee Phase 3 well JUB-P3-07.','Samuel Darko',1,'[1,2]','WCTP-Drilling-Programme-v1.pdf','west-cape-three-points/jubilee-phase-3-development/drilling-programme-approval/1725430000-WCTP-Drilling-Programme-v1.pdf','application/pdf',2456000,NULL,1,1,'Technical','2025-09-04 00:00:00','Superseded','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,1,8,'Report','[\"drilling\",\"phase-3\",\"approved\"]',NULL,NULL,'Internal','[]',NULL,NULL,NULL),(2,'WCTP Drilling Programme v2','Revised programme incorporating geomechanics update.','Samuel Darko',1,'[1,2]','WCTP-Drilling-Programme-v2.pdf','west-cape-three-points/jubilee-phase-3-development/drilling-programme-approval/1726790000-WCTP-Drilling-Programme-v2.pdf','application/pdf',2510000,1,2,1,'Technical','2025-09-20 00:00:00','Superseded','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,1,8,'Report','[\"drilling\",\"phase-3\"]',NULL,NULL,'Internal','[]',NULL,NULL,NULL),(3,'WCTP Drilling Programme v3 (Final)','Final approved programme incorporating all regulator comments.','Samuel Darko',1,'[1,2]','WCTP-Drilling-Programme-v3-Final.pdf','west-cape-three-points/jubilee-phase-3-development/drilling-programme-approval/1727990000-WCTP-Drilling-Programme-v3-Final.pdf','application/pdf',2544000,1,3,1,'Technical','2025-10-01 00:00:00','Final','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,1,8,'Report','[\"drilling\",\"phase-3\",\"final\"]',NULL,NULL,'Internal','[]',NULL,NULL,NULL),(4,'Jubilee Field Development Plan - HSE Annex','HSE annex to the field development plan.','Doris Kufuor',NULL,NULL,'HSE-Annex-FDP.docx','west-cape-three-points/jubilee-phase-3-development/general/1722500000-HSE-Annex-FDP.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',890000,NULL,1,1,'HSE','2025-08-01 00:00:00','Under Review','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,1,7,'Report','[\"hse\",\"fdp\"]',NULL,NULL,'Confidential','[\"Admin\",\"HSE Officer\",\"Project/Operations Manager\"]',NULL,NULL,NULL),(5,'GNPC Notice - WCTP Work Programme Approval','GNPC notice approving the 2026 WCTP work programme and budget.','Ewurabena Boateng',NULL,NULL,'GNPC-Notice-WCTP-2026.pdf','general/1736900000-GNPC-Notice-WCTP-2026.pdf','application/pdf',340000,NULL,1,NULL,'Legal','2026-01-15 00:00:00','Final','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,1,5,'Notice','[\"gnpc\",\"regulatory\"]',NULL,NULL,'Public','[]',NULL,NULL,NULL),(6,'Letter to Petroleum Commission - Extension Request','Formal letter requesting exploration licence extension.','Ewurabena Boateng',NULL,NULL,'PC-Extension-Request-Letter.pdf','general/1748740000-PC-Extension-Request-Letter.pdf','application/pdf',210000,NULL,1,1,'Legal','2026-06-01 00:00:00','Under Review','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,3,5,'Letter','[\"petroleum-commission\",\"extension\"]','Petroleum Commission','2026-08-15 00:00:00','Internal','[]',NULL,NULL,NULL),(7,'Rig Charter Agreement - Atwood Explorer','Executed rig charter agreement.','Ewurabena Boateng',NULL,NULL,'Rig-Charter-Atwood-Explorer.pdf','general/1719800000-Rig-Charter-Atwood-Explorer.pdf','application/pdf',1250000,NULL,1,1,'Legal','2025-07-01 00:00:00','Final','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,1,NULL,1,5,'Contract','[\"rig\",\"charter\"]',NULL,NULL,'Confidential','[\"Admin\",\"Legal/Compliance Officer\",\"CEO/Country Manager\"]',NULL,NULL,NULL),(8,'AFE Support Documentation - Turret Bearing Replacement','Cost breakdown supporting the turret bearing AFE.','Nana Asante',NULL,NULL,'AFE-Support-Turret-Bearing.xlsx','general/1743500000-AFE-Support-Turret-Bearing.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',178000,NULL,1,1,'Finance','2026-04-01 00:00:00','Final','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,2,6,'Report','[\"afe\",\"finance\"]',NULL,NULL,'Internal','[]',NULL,NULL,NULL),(9,'Licence Compliance Evidence - Royalty Payment Q2 2026','Payment confirmation evidence for Q2 royalty obligation.','Nana Asante',NULL,NULL,'Royalty-Payment-Evidence-Q2.pdf','general/1751200000-Royalty-Payment-Evidence-Q2.pdf','application/pdf',96000,NULL,1,1,'Finance','2026-06-28 00:00:00','Final','2026-07-05 04:47:21','2026-07-05 04:47:21',1,NULL,NULL,NULL,6,'Report','[\"royalty\",\"evidence\"]',NULL,NULL,'Internal','[]',NULL,NULL,NULL),(10,'Task Attachment - Vendor Quotes Comparison','Comparison spreadsheet of long-lead equipment vendor quotes.','Tawiah Agyeman',NULL,NULL,'Vendor-Quotes-Comparison.xlsx','general/1750500000-Vendor-Quotes-Comparison.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',64000,NULL,1,NULL,'Report','2026-06-20 00:00:00','Draft','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,4,NULL,9,'Other','[\"procurement\"]',NULL,NULL,'Internal','[]',NULL,NULL,NULL),(11,'South Tano Environmental Permit Draft','Draft EIA and permit application for ST-04.','Doris Kufuor',NULL,NULL,'ST04-EPA-Permit-Draft.pdf','general/1746900000-ST04-EPA-Permit-Draft.pdf','application/pdf',3120000,NULL,1,NULL,'HSE','2026-05-10 00:00:00','Under Review','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,3,7,'Notice','[\"epa\",\"permit\"]','Environmental Protection Agency','2026-07-25 00:00:00','Internal','[]',NULL,NULL,NULL),(12,'CTP Decommissioning Close-Out Report','Final close-out report for the CTP onshore decommissioning project.','Kwame Appiah',NULL,NULL,'CTP-Decommissioning-CloseOut.pdf','cape-three-points-onshore/ctp-onshore-site-decommissioning/general/1733400000-CTP-Decommissioning-CloseOut.pdf','application/pdf',1870000,NULL,1,7,'Report','2024-12-05 00:00:00','Final','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,4,4,'Report','[\"decommissioning\",\"closeout\"]',NULL,NULL,'Public','[]',NULL,NULL,NULL);
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `environmental_permits`
--

DROP TABLE IF EXISTS `environmental_permits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `environmental_permits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permitNumber` varchar(255) NOT NULL,
  `permitType` enum('EIA','EPAPermit','DischargeConsent','WasteDisposal','Other') NOT NULL DEFAULT 'EPAPermit',
  `regulator` varchar(255) NOT NULL DEFAULT 'EPA Ghana',
  `blockId` int DEFAULT NULL,
  `issueDate` datetime DEFAULT NULL,
  `expiryDate` datetime DEFAULT NULL,
  `conditions` text,
  `owner` varchar(255) DEFAULT NULL,
  `status` enum('Active','Expired','Suspended','Renewed') NOT NULL DEFAULT 'Active',
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_envpermits_block` (`blockId`),
  KEY `idx_envpermits_expiry` (`expiryDate`),
  CONSTRAINT `fk_envpermits_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `environmental_permits`
--

LOCK TABLES `environmental_permits` WRITE;
/*!40000 ALTER TABLE `environmental_permits` DISABLE KEYS */;
/*!40000 ALTER TABLE `environmental_permits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finances`
--

DROP TABLE IF EXISTS `finances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `category` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('Income','Expense') COLLATE utf8mb4_general_ci NOT NULL,
  `recordType` enum('Entry','Invoice','AFE') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Entry',
  `activityId` int DEFAULT NULL,
  `approvalDepartment` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('Pending','Under Review','Approved','Paid','Rejected','Closed') COLLATE utf8mb4_general_ci DEFAULT 'Pending',
  `invoiceNumber` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `afeNumber` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transactionDetails` text COLLATE utf8mb4_general_ci,
  `transactionDate` datetime DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `delegatedTo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'The name or department currently holding responsibility',
  `delegationHistory` json DEFAULT NULL COMMENT 'Append-only log of delegation actions (Delegated, Approved, Rejected)',
  `afeId` int DEFAULT NULL,
  `parentAfeId` int DEFAULT NULL,
  `supplementNumber` int NOT NULL DEFAULT '0',
  `committedAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `actualToDate` decimal(15,2) NOT NULL DEFAULT '0.00',
  `variancePercent` decimal(8,2) NOT NULL DEFAULT '0.00',
  `approvalDate` datetime DEFAULT NULL,
  `approvingAuthority` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reconciledById` int DEFAULT NULL,
  `reconciledAt` datetime DEFAULT NULL,
  `approvedBy` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `actionComment` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `activityId` (`activityId`),
  KEY `fk_finances_reconciledById` (`reconciledById`),
  KEY `idx_finances_afeId` (`afeId`),
  KEY `idx_finances_parentAfeId` (`parentAfeId`),
  CONSTRAINT `finances_ibfk_1` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_finances_afeId` FOREIGN KEY (`afeId`) REFERENCES `finances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_finances_parentAfeId` FOREIGN KEY (`parentAfeId`) REFERENCES `finances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_finances_reconciledById` FOREIGN KEY (`reconciledById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finances`
--

LOCK TABLES `finances` WRITE;
/*!40000 ALTER TABLE `finances` DISABLE KEYS */;
INSERT INTO `finances` VALUES (1,'AFE - FPSO Turret Bearing Replacement',8000000.00,'Maintenance','Expense','AFE',9,'Finance & Accounts','Approved',NULL,'AFE-2026-014','Original AFE for the turret bearing replacement programme.','2026-03-01 00:00:00','2026-03-01 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,NULL,0,6000000.00,2100000.00,-73.75,'2026-03-05 00:00:00','James Mensah (CEO)',NULL,NULL,'James Mensah',NULL),(2,'AFE Supplement 1 - Turret Bearing Replacement',1500000.00,'Maintenance','Expense','AFE',9,'Finance & Accounts','Approved',NULL,'AFE-2026-014-S1','Supplementary AFE for additional contingency spares.','2026-05-28 00:00:00','2026-05-28 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,1,1,1200000.00,0.00,0.00,'2026-06-01 00:00:00','James Mensah (CEO)',NULL,NULL,'James Mensah',NULL),(3,'Bearing Assembly Supply Invoice',2100000.00,'Maintenance','Expense','Invoice',9,'Finance & Accounts','Paid','INV-2026-3301',NULL,'Payment for replacement bearing assembly from vendor.','2026-06-12 00:00:00','2026-06-05 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,1,NULL,0,0.00,0.00,0.00,'2026-06-10 00:00:00','Nana Asante',NULL,NULL,'Nana Asante',NULL),(4,'AFE - Rig Mobilisation WCTP Campaign',2200000.00,'Drilling','Expense','AFE',2,'Finance & Accounts','Closed',NULL,'AFE-2025-042','Rig mobilisation AFE — closed after reconciliation.','2025-09-25 00:00:00','2025-09-25 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,NULL,0,2350000.00,2350000.00,6.82,'2025-09-20 00:00:00','James Mensah (CEO)',6,'2025-11-20 00:00:00','James Mensah',NULL),(5,'Rig Mobilisation Invoice - Atwood',2350000.00,'Drilling','Expense','Invoice',2,'Finance & Accounts','Paid','INV-2025-2890',NULL,'Final rig mobilisation invoice.','2025-11-15 00:00:00','2025-11-10 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,4,NULL,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,'Nana Asante',NULL),(6,'AFE - Subsea Tieback FEED Contract',3000000.00,'Engineering','Expense','AFE',10,'Finance & Accounts','Pending',NULL,'AFE-2026-021','Awaiting CEO approval for FEED contract award.','2026-06-30 00:00:00','2026-06-30 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,NULL,0,350000.00,350000.00,-88.33,NULL,NULL,NULL,NULL,NULL,NULL),(7,'AFE - South Tano Environmental Studies',120000.00,'Regulatory','Expense','AFE',11,'Legal & Compliance','Under Review',NULL,'AFE-2026-009','Delegated to Legal & Compliance for review of permit costs.','2026-05-05 00:00:00','2026-05-05 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21','Legal & Compliance','[{\"date\": \"2026-05-05\", \"comment\": \"Please review environmental cost breakdown.\", \"delegatedBy\": \"James Mensah\", \"delegatedTo\": \"Legal & Compliance\"}]',NULL,NULL,0,90000.00,65000.00,-45.83,NULL,NULL,NULL,NULL,NULL,NULL),(8,'Community Event Sponsorship Request',25000.00,'Community Relations','Expense','Entry',NULL,'Executive Management','Rejected',NULL,NULL,'Requested sponsorship for a community festival.','2026-05-20 00:00:00','2026-05-18 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,NULL,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,'Not aligned with approved 2026 budget; resubmit under the CSR programme once established.'),(9,'Crude Oil Lifting Revenue - June 2026',42000000.00,'Revenue','Income','Entry',NULL,'Finance & Accounts','Approved',NULL,NULL,'Monthly lifting revenue from the Tano FPSO field.','2026-06-30 00:00:00','2026-06-30 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,NULL,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,'Nana Asante',NULL),(10,'Office Supplies - Accra HQ',3200.00,'Administration','Expense','Entry',NULL,'Finance & Accounts','Pending',NULL,NULL,'Quarterly office supplies restock.','2026-07-02 00:00:00','2026-07-02 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,NULL,NULL,NULL,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `finances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forex_transactions`
--

DROP TABLE IF EXISTS `forex_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forex_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) DEFAULT NULL,
  `transactionType` enum('Spot','Forward','Transfer') NOT NULL DEFAULT 'Spot',
  `fromCurrency` enum('GHS','USD') NOT NULL DEFAULT 'USD',
  `toCurrency` enum('GHS','USD') NOT NULL DEFAULT 'GHS',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `rate` decimal(12,6) NOT NULL DEFAULT '0.000000',
  `bank` varchar(255) DEFAULT NULL,
  `valueDate` datetime DEFAULT NULL,
  `settlementDate` datetime DEFAULT NULL,
  `purpose` text,
  `status` enum('Draft','PendingApproval','Approved','Rejected','Settled') NOT NULL DEFAULT 'Draft',
  `requestedById` int DEFAULT NULL,
  `requestedAt` datetime DEFAULT NULL,
  `approvedById` int DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `settledById` int DEFAULT NULL,
  `settledAt` datetime DEFAULT NULL,
  `decisionComment` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_forex_requestedBy` (`requestedById`),
  KEY `fk_forex_approvedBy` (`approvedById`),
  KEY `fk_forex_settledBy` (`settledById`),
  KEY `idx_forex_settlement` (`settlementDate`),
  CONSTRAINT `fk_forex_approvedBy` FOREIGN KEY (`approvedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_forex_requestedBy` FOREIGN KEY (`requestedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_forex_settledBy` FOREIGN KEY (`settledById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forex_transactions`
--

LOCK TABLES `forex_transactions` WRITE;
/*!40000 ALTER TABLE `forex_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `forex_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hse_exposure_records`
--

DROP TABLE IF EXISTS `hse_exposure_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hse_exposure_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `blockId` int DEFAULT NULL,
  `periodLabel` varchar(100) NOT NULL,
  `periodStart` date DEFAULT NULL,
  `periodEnd` date DEFAULT NULL,
  `manHours` decimal(12,2) NOT NULL DEFAULT '0.00',
  `recordedById` int DEFAULT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_hseexposure_recordedBy` (`recordedById`),
  KEY `idx_hseexposure_block` (`blockId`),
  CONSTRAINT `fk_hseexposure_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_hseexposure_recordedBy` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hse_exposure_records`
--

LOCK TABLES `hse_exposure_records` WRITE;
/*!40000 ALTER TABLE `hse_exposure_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `hse_exposure_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hse_incidents`
--

DROP TABLE IF EXISTS `hse_incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hse_incidents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `blockId` int DEFAULT NULL,
  `incidentType` enum('Injury','NearMiss','Spill','Observation','Fire','Other') NOT NULL DEFAULT 'Observation',
  `severity` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Low',
  `occurredAt` datetime DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text,
  `reportedBy` varchar(255) DEFAULT NULL,
  `immediateAction` text,
  `rootCause` text,
  `correctiveAction` text,
  `actionOwner` varchar(255) DEFAULT NULL,
  `actionDueDate` datetime DEFAULT NULL,
  `status` enum('Open','UnderInvestigation','ActionPending','Closed') NOT NULL DEFAULT 'Open',
  `manHoursLost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `isRecordable` tinyint(1) NOT NULL DEFAULT '0',
  `closedById` int DEFAULT NULL,
  `closedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_hseincidents_block` (`blockId`),
  KEY `fk_hseincidents_closedBy` (`closedById`),
  KEY `idx_hseincidents_status` (`status`),
  KEY `idx_hseincidents_actiondue` (`actionDueDate`),
  CONSTRAINT `fk_hseincidents_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_hseincidents_closedBy` FOREIGN KEY (`closedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hse_incidents`
--

LOCK TABLES `hse_incidents` WRITE;
/*!40000 ALTER TABLE `hse_incidents` DISABLE KEYS */;
/*!40000 ALTER TABLE `hse_incidents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_policies`
--

DROP TABLE IF EXISTS `insurance_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_policies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `policyNumber` varchar(255) NOT NULL,
  `insurer` varchar(255) DEFAULT NULL,
  `broker` varchar(255) DEFAULT NULL,
  `policyType` enum('Property','Liability','WellControl','Marine','BusinessInterruption','Other') NOT NULL DEFAULT 'Other',
  `blockId` int DEFAULT NULL,
  `coverageAmount` decimal(15,2) DEFAULT '0.00',
  `currency` enum('GHS','USD') NOT NULL DEFAULT 'USD',
  `premium` decimal(15,2) DEFAULT '0.00',
  `effectiveDate` datetime DEFAULT NULL,
  `expiryDate` datetime DEFAULT NULL,
  `renewalNoticePeriodDays` int DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `status` enum('Active','Expired','Cancelled','Renewed') NOT NULL DEFAULT 'Active',
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_insurance_block` (`blockId`),
  KEY `idx_insurance_expiry` (`expiryDate`),
  CONSTRAINT `fk_insurance_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_policies`
--

LOCK TABLES `insurance_policies` WRITE;
/*!40000 ALTER TABLE `insurance_policies` DISABLE KEYS */;
/*!40000 ALTER TABLE `insurance_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licences`
--

DROP TABLE IF EXISTS `licences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `licenceNumber` varchar(255) NOT NULL COMMENT 'Official regulatory reference number for this licence',
  `licenceType` enum('Exploration','Production','Environmental','Drilling','Contract') NOT NULL DEFAULT 'Exploration',
  `blockIds` text COMMENT 'JSON array of block IDs covered by this licence',
  `issuedBy` varchar(255) DEFAULT NULL COMMENT 'Regulatory authority or government body that issued this licence',
  `startDate` datetime DEFAULT NULL,
  `expiryDate` datetime DEFAULT NULL,
  `status` enum('Active','Suspended','Renewed') NOT NULL DEFAULT 'Active',
  `notes` text COMMENT 'Renewal conditions, regulatory notes, or other relevant information',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licences`
--

LOCK TABLES `licences` WRITE;
/*!40000 ALTER TABLE `licences` DISABLE KEYS */;
INSERT INTO `licences` VALUES (1,'PC-EXP-2021-014','Exploration','[1]','Petroleum Commission of Ghana','2021-08-01 00:00:00','2026-08-20 00:00:00','Active','First renewal period; extension application submitted 2026-06-01.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'PC-PROD-2016-005','Production','[2]','Petroleum Commission of Ghana','2016-05-01 00:00:00','2031-05-01 00:00:00','Active','Production licence for the Tano FPSO field.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'EPA-ENV-2024-102','Environmental','[3]','Environmental Protection Agency','2024-01-15 00:00:00','2026-09-30 00:00:00','Active','Environmental permit covering the South Tano appraisal drilling campaign.','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'PC-DRILL-2019-071','Drilling','[1,4]','Petroleum Commission of Ghana','2019-02-01 00:00:00','2025-02-01 00:00:00','Suspended','Drilling licence suspended pending renewal paperwork for CTP onshore.','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `licences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `local_content_records`
--

DROP TABLE IF EXISTS `local_content_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `local_content_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `blockId` int DEFAULT NULL,
  `period` varchar(32) NOT NULL,
  `metric` enum('LocalSpend','LocalEmployment','LocalProcurement','Training','TechnologyTransfer') NOT NULL DEFAULT 'LocalSpend',
  `committedPercent` decimal(8,2) NOT NULL DEFAULT '0.00',
  `actualPercent` decimal(8,2) NOT NULL DEFAULT '0.00',
  `committedValue` decimal(15,2) DEFAULT '0.00',
  `actualValue` decimal(15,2) DEFAULT '0.00',
  `currency` enum('GHS','USD') NOT NULL DEFAULT 'GHS',
  `narrative` text,
  `reportingStatus` enum('Draft','Submitted','Approved') NOT NULL DEFAULT 'Draft',
  `regulator` varchar(255) NOT NULL DEFAULT 'Petroleum Commission',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_localcontent_block` (`blockId`),
  KEY `idx_localcontent_period` (`period`),
  CONSTRAINT `fk_localcontent_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `local_content_records`
--

LOCK TABLES `local_content_records` WRITE;
/*!40000 ALTER TABLE `local_content_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `local_content_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ndas`
--

DROP TABLE IF EXISTS `ndas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ndas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `counterparty` varchar(255) NOT NULL,
  `ndaType` enum('Mutual','OneWay','Standstill') NOT NULL DEFAULT 'Mutual',
  `purpose` text,
  `blockId` int DEFAULT NULL,
  `effectiveDate` datetime DEFAULT NULL,
  `expiryDate` datetime DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `status` enum('Draft','Active','Expired','Terminated') NOT NULL DEFAULT 'Draft',
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ndas_block` (`blockId`),
  KEY `idx_ndas_expiry` (`expiryDate`),
  CONSTRAINT `fk_ndas_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ndas`
--

LOCK TABLES `ndas` WRITE;
/*!40000 ALTER TABLE `ndas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ndas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_rules`
--

DROP TABLE IF EXISTS `notification_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `module` varchar(255) NOT NULL,
  `triggerType` enum('DateBased','ThresholdBased','StatusBased','Recurring') NOT NULL,
  `dateField` varchar(255) DEFAULT NULL,
  `leadTimeDays` text,
  `thresholdField` varchar(255) DEFAULT NULL,
  `thresholdValues` text,
  `statusField` varchar(255) DEFAULT NULL,
  `statusValue` varchar(255) DEFAULT NULL,
  `recurrenceIntervalHours` int DEFAULT '24',
  `escalationGraceHours` int DEFAULT NULL,
  `priority` enum('Critical','High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `channels` text,
  `messageTemplate` varchar(500) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_rules`
--

LOCK TABLES `notification_rules` WRITE;
/*!40000 ALTER TABLE `notification_rules` DISABLE KEYS */;
INSERT INTO `notification_rules` VALUES (1,'Activity due-date reminders','Activity','DateBased','dueDate','[7,3,1]',NULL,NULL,NULL,NULL,24,48,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(2,'Task due-date reminders','Task','DateBased','dueDate','[3,1]',NULL,NULL,NULL,NULL,24,72,'Medium','[\"InApp\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(3,'Licence expiry countdown','Licence','DateBased','expiryDate','[180,90,30]',NULL,NULL,NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(4,'Contract expiry/renewal reminders','Contract','DateBased','expiryDate','[90,60,30]',NULL,NULL,NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(5,'Compliance obligation due-date reminders','ComplianceObligation','DateBased','dueDate','[30,14,7,1]',NULL,NULL,NULL,NULL,24,24,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(6,'PC/GNPC correspondence response-due reminders','Correspondence','DateBased','responseDueDate','[14,7,3,1]',NULL,NULL,NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(7,'Budget line variance threshold','BudgetLine','ThresholdBased',NULL,NULL,'absVariancePercent','[10]',NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(8,'Budget line utilisation alert','BudgetLine','ThresholdBased',NULL,NULL,'utilisationPercent','[90,100]',NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(9,'AFE utilisation alert','FinanceAFE','ThresholdBased',NULL,NULL,'utilisationPercent','[80,100]',NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(10,'Document awaiting-response reminders','Document','DateBased','responseDueDate','[7,3,1]',NULL,NULL,NULL,NULL,24,72,'Medium','[\"InApp\",\"Email\"]',NULL,1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(11,'Risk review-date reminders','Risk','DateBased','reviewDate','[14,7,1]',NULL,NULL,NULL,NULL,24,72,'Medium','[\"InApp\"]',NULL,1,'2026-07-05 12:31:57','2026-07-05 12:31:57'),(12,'Risk high-band escalation','Risk','ThresholdBased',NULL,NULL,'riskScore','[7]',NULL,NULL,24,NULL,'Critical','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 12:31:57','2026-07-05 12:31:57'),(13,'Insurance policy expiry','InsurancePolicy','DateBased','expiryDate','[90,60,30,7]',NULL,NULL,NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(14,'Environmental permit expiry','EnvironmentalPermit','DateBased','expiryDate','[180,90,30]',NULL,NULL,NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(15,'NDA expiry reminder','Nda','DateBased','expiryDate','[30,7,1]',NULL,NULL,NULL,NULL,24,NULL,'Medium','[\"InApp\"]',NULL,1,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(16,'Vendor payment aging','VendorInvoice','ThresholdBased',NULL,NULL,'daysOutstanding','[30,60,90]',NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 14:18:18','2026-07-05 14:18:18'),(17,'Forex settlement due','ForexTransaction','DateBased','settlementDate','[3,1]',NULL,NULL,NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 14:18:18','2026-07-05 14:18:18'),(18,'Local content shortfall','LocalContentRecord','ThresholdBased',NULL,NULL,'shortfallPercent','[5,10]',NULL,NULL,24,NULL,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 15:14:04','2026-07-05 15:14:04'),(19,'HSE incident action due','HseIncident','DateBased','actionDueDate','[7,3,1]',NULL,NULL,NULL,NULL,24,48,'High','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 15:14:04','2026-07-05 15:14:04'),(20,'HSE overdue-action escalation','HseIncident','ThresholdBased',NULL,NULL,'daysOverdue','[1]',NULL,NULL,24,NULL,'Critical','[\"InApp\",\"Email\"]',NULL,1,'2026-07-05 15:14:04','2026-07-05 15:14:04');
/*!40000 ALTER TABLE `notification_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('Info','Warning','Error','Success') COLLATE utf8mb4_general_ci DEFAULT 'Info',
  `read` tinyint(1) DEFAULT '0',
  `userId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `module` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `entityType` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `entityId` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `triggerType` enum('DateBased','ThresholdBased','StatusBased','Recurring','Manual') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Manual',
  `priority` enum('Critical','High','Medium','Low') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Medium',
  `channels` text COLLATE utf8mb4_general_ci,
  `status` enum('Pending','Acknowledged','Snoozed','Escalated','Dismissed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pending',
  `dueAt` datetime DEFAULT NULL,
  `dedupeKey` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `recurrenceIntervalHours` int DEFAULT NULL,
  `lastSentAt` datetime DEFAULT NULL,
  `snoozeUntil` datetime DEFAULT NULL,
  `snoozeReason` text COLLATE utf8mb4_general_ci,
  `acknowledgedAt` datetime DEFAULT NULL,
  `acknowledgedBy` int DEFAULT NULL,
  `escalatedAt` datetime DEFAULT NULL,
  `escalatedToUserId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `fk_notifications_escalatedTo` (`escalatedToUserId`),
  KEY `idx_notifications_user_status` (`userId`,`status`),
  KEY `idx_notifications_module_entity` (`module`,`entityType`,`entityId`),
  KEY `idx_notifications_dedupeKey` (`dedupeKey`),
  KEY `idx_notifications_status_priority` (`status`,`priority`),
  KEY `notifications_user_id_status` (`userId`,`status`),
  KEY `notifications_module_entity_type_entity_id` (`module`,`entityType`,`entityId`),
  KEY `notifications_dedupe_key` (`dedupeKey`),
  KEY `notifications_status_priority` (`status`,`priority`),
  CONSTRAINT `fk_notifications_escalatedTo` FOREIGN KEY (`escalatedToUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'Licence PC-EXP-2021-014 (West Cape Three Points) expires in 46 days.','Warning',0,5,'2026-07-05 04:47:21','2026-07-05 15:20:22','Licence','Licence','1','DateBased','High','[\"InApp\",\"Email\"]','Snoozed','2026-08-20 00:00:00','Licence|Licence|1|DateBased|45',24,'2026-07-04 00:00:00','2026-07-05 15:50:22',NULL,NULL,NULL,NULL,NULL),(2,'Compliance obligation \"Surface Rental Fee - CTP Onshore\" is overdue.','Error',0,5,'2026-07-05 04:47:21','2026-07-05 04:47:21','ComplianceObligation','ComplianceObligation','3','StatusBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-05-01 00:00:00','ComplianceObligation|ComplianceObligation|3|StatusBased|Overdue',24,'2026-07-03 00:00:00',NULL,NULL,NULL,NULL,'2026-06-05 00:00:00',2),(3,'Budget line \"Long-lead Equipment Procurement\" variance is -45.2%, exceeding the ±10% threshold.','Warning',1,6,'2026-07-05 04:47:21','2026-07-05 04:47:21','BudgetLine','BudgetLine','3','ThresholdBased','High','[\"InApp\"]','Acknowledged','2026-06-25 00:00:00','BudgetLine|BudgetLine|3|ThresholdBased|10',24,NULL,NULL,NULL,'2026-06-26 00:00:00',6,NULL,NULL),(4,'AFE-2026-014 utilisation has reached 101%.','Error',0,6,'2026-07-05 04:47:21','2026-07-05 15:20:22','FinanceAFE','Finance','1','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed','2026-07-01 00:00:00','FinanceAFE|Finance|1|ThresholdBased|100',24,'2026-07-04 00:00:00','2026-07-05 15:50:22',NULL,NULL,NULL,NULL,NULL),(5,'Correspondence \"WCTP Exploration Licence Extension Request\" is awaiting response — due in 8 days.','Warning',0,5,'2026-07-05 04:47:21','2026-07-05 04:47:21','Correspondence','Correspondence','2','DateBased','Medium','[\"InApp\"]','Snoozed','2026-08-01 00:00:00','Correspondence|Correspondence|2|DateBased|7',24,NULL,'2026-07-10 00:00:00','Awaiting PC feedback call scheduled for next week.',NULL,NULL,NULL,NULL),(6,'Task \"Draft long-lead procurement RFQ\" is overdue.','Error',0,9,'2026-07-05 04:47:21','2026-07-05 07:58:40','Task','Task','3','StatusBased','High','[\"InApp\"]','Escalated','2026-06-20 00:00:00','Task|Task|3|StatusBased|Overdue',24,'2026-07-05 00:00:00',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(7,'Document \"Letter to Petroleum Commission - Extension Request\" — awaiting response from Petroleum Commission, due in 41 days.','Info',0,5,'2026-07-05 04:47:21','2026-07-05 15:20:22','Document','Document','6','DateBased','Medium','[\"InApp\",\"Email\"]','Snoozed','2026-08-15 00:00:00','Document|Document|6|DateBased|14',24,NULL,'2026-07-05 15:50:22',NULL,NULL,NULL,NULL,NULL),(8,'Welcome to the EnQuest PMS platform.','Success',1,9,'2026-07-05 04:47:21','2026-07-05 04:47:21','Manual',NULL,NULL,'Manual','Low','[\"InApp\"]','Dismissed',NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-19 00:00:00',9,NULL,NULL),(9,'Activity \"ST-04 Environmental Permit Application\" is overdue (was due Mon Jun 01 2026)','Error',0,7,'2026-07-05 07:58:38','2026-07-06 08:14:04','Activity','Activity','11','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-06-01 00:00:00','Activity|Activity|11|DateBased|overdue|7',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(10,'Activity \"Local Content Training Pilot\" is overdue (was due Mon Sep 01 2025)','Error',0,9,'2026-07-05 07:58:38','2026-07-06 08:14:04','Activity','Activity','14','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2025-09-01 00:00:00','Activity|Activity|14|DateBased|overdue|9',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(11,'Task \"Draft long-lead procurement RFQ\" is overdue (was due Sat Jun 20 2026)','Error',0,9,'2026-07-05 07:58:38','2026-07-06 08:14:04','Task','Task','3','DateBased','Critical','[\"InApp\"]','Escalated','2026-06-20 00:00:00','Task|Task|3|DateBased|overdue|9',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(12,'Task \"Obtain vendor quotes\" is overdue (was due Thu Jun 25 2026)','Error',0,9,'2026-07-05 07:58:38','2026-07-06 08:14:04','Task','Task','4','DateBased','Critical','[\"InApp\"]','Escalated','2026-06-25 00:00:00','Task|Task|4|DateBased|overdue|9',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(13,'Task \"Local content pilot wind-down report\" is overdue (was due Wed Oct 01 2025)','Error',0,9,'2026-07-05 07:58:38','2026-07-06 08:14:04','Task','Task','10','DateBased','Critical','[\"InApp\"]','Escalated','2025-10-01 00:00:00','Task|Task|10|DateBased|overdue|9',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(14,'Exploration PC-EXP-2021-014 is due in 45 day(s) (Thu Aug 20 2026)','Warning',0,1,'2026-07-05 07:58:39','2026-07-06 17:15:05','Licence','Licence','1','DateBased','High','[\"InApp\",\"Email\"]','Snoozed','2026-08-20 00:00:00','Licence|Licence|1|DateBased|lead90|1',24,'2026-07-06 15:19:43','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(15,'Exploration PC-EXP-2021-014 is due in 45 day(s) (Thu Aug 20 2026)','Warning',0,12,'2026-07-05 07:58:39','2026-07-06 17:15:05','Licence','Licence','1','DateBased','High','[\"InApp\",\"Email\"]','Snoozed','2026-08-20 00:00:00','Licence|Licence|1|DateBased|lead90|12',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(16,'Environmental EPA-ENV-2024-102 is due in 86 day(s) (Wed Sep 30 2026)','Warning',0,1,'2026-07-05 07:58:39','2026-07-06 17:15:05','Licence','Licence','3','DateBased','High','[\"InApp\",\"Email\"]','Snoozed','2026-09-30 00:00:00','Licence|Licence|3|DateBased|lead90|1',24,'2026-07-06 15:19:43','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(17,'Environmental EPA-ENV-2024-102 is due in 86 day(s) (Wed Sep 30 2026)','Warning',0,12,'2026-07-05 07:58:39','2026-07-06 17:15:05','Licence','Licence','3','DateBased','High','[\"InApp\",\"Email\"]','Snoozed','2026-09-30 00:00:00','Licence|Licence|3|DateBased|lead90|12',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(18,'Contract \"Rig Charter Agreement - Atwood Explorer\" (Atwood Oceanics) is due in 26 day(s) (Sat Aug 01 2026)','Error',0,5,'2026-07-05 07:58:39','2026-07-06 17:15:05','Contract','Contract','1','DateBased','Critical','[\"InApp\",\"Email\"]','Snoozed','2026-08-01 00:00:00','Contract|Contract|1|DateBased|lead30|5',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(19,'Compliance obligation \"GNPC Local Content Plan Filing 2026\" (GNPC) is overdue (was due Tue Mar 31 2026)','Error',0,4,'2026-07-05 07:58:39','2026-07-06 08:14:04','ComplianceObligation','ComplianceObligation','6','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-03-31 00:00:00','ComplianceObligation|ComplianceObligation|6|DateBased|overdue|4',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(20,'Compliance obligation \"Surface Rental Fee - CTP Onshore\" (Petroleum Commission) is overdue (was due Fri May 01 2026)','Error',0,5,'2026-07-05 07:58:39','2026-07-06 08:14:04','ComplianceObligation','ComplianceObligation','3','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-05-01 00:00:00','ComplianceObligation|ComplianceObligation|3|DateBased|overdue|5',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(21,'Compliance obligation \"Annual Petroleum Income Tax Filing 2025\" (Ghana Revenue Authority) is overdue (was due Tue Jun 30 2026)','Error',0,6,'2026-07-05 07:58:39','2026-07-06 08:14:04','ComplianceObligation','ComplianceObligation','2','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-06-30 00:00:00','ComplianceObligation|ComplianceObligation|2|DateBased|overdue|6',24,'2026-07-06 08:14:04',NULL,NULL,NULL,NULL,'2026-07-05 07:58:40',1),(22,'Compliance obligation \"Q2 2026 Royalty Payment - WCTP\" (Ghana Revenue Authority) is due in 9 day(s) (Wed Jul 15 2026)','Error',0,6,'2026-07-05 07:58:39','2026-07-06 17:15:05','ComplianceObligation','ComplianceObligation','1','DateBased','Critical','[\"InApp\",\"Email\"]','Snoozed','2026-07-15 00:00:00','ComplianceObligation|ComplianceObligation|1|DateBased|lead14|6',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(23,'Compliance obligation \"Environmental Monitoring Report Filing\" (Environmental Protection Agency) is due in 25 day(s) (Fri Jul 31 2026)','Error',0,7,'2026-07-05 07:58:39','2026-07-06 17:15:05','ComplianceObligation','ComplianceObligation','5','DateBased','Critical','[\"InApp\",\"Email\"]','Snoozed','2026-07-31 00:00:00','ComplianceObligation|ComplianceObligation|5|DateBased|lead30|7',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(24,'Correspondence \"CTP Onshore Drilling Licence Renewal Application\" (Petroleum Commission) — awaiting response is due in 4 day(s) (Fri Jul 10 2026)','Error',0,1,'2026-07-05 07:58:39','2026-07-06 17:15:04','Correspondence','Correspondence','6','DateBased','Critical','[\"InApp\",\"Email\"]','Snoozed','2026-07-10 00:00:00','Correspondence|Correspondence|6|DateBased|lead7|1',24,'2026-07-06 15:19:43','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(25,'Correspondence \"CTP Onshore Drilling Licence Renewal Application\" (Petroleum Commission) — awaiting response is due in 4 day(s) (Fri Jul 10 2026)','Error',0,12,'2026-07-05 07:58:39','2026-07-06 17:15:04','Correspondence','Correspondence','6','DateBased','Critical','[\"InApp\",\"Email\"]','Snoozed','2026-07-10 00:00:00','Correspondence|Correspondence|6|DateBased|lead7|12',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(26,'Budget line \"Well Testing Programme\" — absVariancePercent crossed 10','Warning',0,8,'2026-07-05 07:58:39','2026-07-06 17:15:05','BudgetLine','BudgetLine','2','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|2|ThresholdBased|threshold10|8',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(27,'Budget line \"Long-lead Equipment Procurement\" — absVariancePercent crossed 10','Warning',0,6,'2026-07-05 07:58:39','2026-07-06 17:15:05','BudgetLine','BudgetLine','3','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|3|ThresholdBased|threshold10|6',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(28,'Budget line \"FPSO Turret Bearing Replacement\" — absVariancePercent crossed 10','Warning',0,8,'2026-07-05 07:58:39','2026-07-06 17:15:05','BudgetLine','BudgetLine','4','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|4|ThresholdBased|threshold10|8',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(29,'Budget line \"FPSO O&M Annual Budget\" — absVariancePercent crossed 10','Warning',0,6,'2026-07-05 07:58:39','2026-07-06 17:15:05','BudgetLine','BudgetLine','5','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|5|ThresholdBased|threshold10|6',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(30,'Budget line \"ST-04 Environmental Permitting\" — absVariancePercent crossed 10','Warning',0,7,'2026-07-05 07:58:39','2026-07-06 17:15:05','BudgetLine','BudgetLine','6','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|6|ThresholdBased|threshold10|7',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(31,'Budget line \"Infill Well WCTP-14 Design\" — absVariancePercent crossed 10','Warning',0,4,'2026-07-05 07:58:39','2026-07-06 17:15:05','BudgetLine','BudgetLine','8','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|8|ThresholdBased|threshold10|4',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(32,'Budget line \"Well Testing Programme\" — utilisationPercent crossed 100','Error',0,8,'2026-07-05 07:58:39','2026-07-06 17:15:04','BudgetLine','BudgetLine','2','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|2|ThresholdBased|threshold100|8',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(33,'Budget line \"Long-lead Equipment Procurement\" — utilisationPercent crossed 100','Error',0,6,'2026-07-05 07:58:39','2026-07-06 17:15:04','BudgetLine','BudgetLine','3','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|3|ThresholdBased|threshold100|6',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(34,'Budget line \"FPSO Turret Bearing Replacement\" — utilisationPercent crossed 100','Error',0,8,'2026-07-05 07:58:39','2026-07-06 17:15:04','BudgetLine','BudgetLine','4','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|4|ThresholdBased|threshold100|8',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(35,'Budget line \"FPSO O&M Annual Budget\" — utilisationPercent crossed 100','Error',0,6,'2026-07-05 07:58:40','2026-07-06 17:15:04','BudgetLine','BudgetLine','5','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|5|ThresholdBased|threshold100|6',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(36,'Budget line \"ST-04 Environmental Permitting\" — utilisationPercent crossed 100','Error',0,7,'2026-07-05 07:58:40','2026-07-06 17:15:04','BudgetLine','BudgetLine','6','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'BudgetLine|BudgetLine|6|ThresholdBased|threshold100|7',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(37,'AFE \"AFE-2026-014\" — utilisationPercent crossed 100','Error',0,1,'2026-07-05 07:58:40','2026-07-06 17:15:04','FinanceAFE','FinanceAFE','1','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'FinanceAFE|FinanceAFE|1|ThresholdBased|threshold100|1',24,'2026-07-06 15:19:43','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(38,'AFE \"AFE-2026-014\" — utilisationPercent crossed 100','Error',0,12,'2026-07-05 07:58:40','2026-07-06 17:15:04','FinanceAFE','FinanceAFE','1','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'FinanceAFE|FinanceAFE|1|ThresholdBased|threshold100|12',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(39,'AFE \"AFE-2026-014-S1\" — utilisationPercent crossed 80','Warning',0,1,'2026-07-05 07:58:40','2026-07-06 17:15:05','FinanceAFE','FinanceAFE','2','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'FinanceAFE|FinanceAFE|2|ThresholdBased|threshold80|1',24,'2026-07-06 15:19:43','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(40,'AFE \"AFE-2026-014-S1\" — utilisationPercent crossed 80','Warning',0,12,'2026-07-05 07:58:40','2026-07-06 17:15:05','FinanceAFE','FinanceAFE','2','ThresholdBased','High','[\"InApp\",\"Email\"]','Snoozed',NULL,'FinanceAFE|FinanceAFE|2|ThresholdBased|threshold80|12',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(41,'AFE \"AFE-2026-009\" — utilisationPercent crossed 100','Error',0,1,'2026-07-05 07:58:40','2026-07-06 17:15:04','FinanceAFE','FinanceAFE','7','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'FinanceAFE|FinanceAFE|7|ThresholdBased|threshold100|1',24,'2026-07-06 15:19:43','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(42,'AFE \"AFE-2026-009\" — utilisationPercent crossed 100','Error',0,12,'2026-07-05 07:58:40','2026-07-06 17:15:04','FinanceAFE','FinanceAFE','7','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'FinanceAFE|FinanceAFE|7|ThresholdBased|threshold100|12',24,'2026-07-06 08:14:04','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(43,'ESCALATION: Task \"Draft long-lead procurement RFQ\" is overdue. (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','Task','Task','3','StatusBased','Critical','[\"InApp\"]','Escalated','2026-06-20 00:00:00','Task|Task|3|StatusBased|Overdue|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(44,'ESCALATION: Activity \"ST-04 Environmental Permit Application\" is overdue (was due Mon Jun 01 2026) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','Activity','Activity','11','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-06-01 00:00:00','Activity|Activity|11|DateBased|overdue|7|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(45,'ESCALATION: Activity \"Local Content Training Pilot\" is overdue (was due Mon Sep 01 2025) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','Activity','Activity','14','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2025-09-01 00:00:00','Activity|Activity|14|DateBased|overdue|9|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(46,'ESCALATION: Task \"Draft long-lead procurement RFQ\" is overdue (was due Sat Jun 20 2026) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','Task','Task','3','DateBased','Critical','[\"InApp\"]','Escalated','2026-06-20 00:00:00','Task|Task|3|DateBased|overdue|9|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(47,'ESCALATION: Task \"Obtain vendor quotes\" is overdue (was due Thu Jun 25 2026) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','Task','Task','4','DateBased','Critical','[\"InApp\"]','Escalated','2026-06-25 00:00:00','Task|Task|4|DateBased|overdue|9|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(48,'ESCALATION: Task \"Local content pilot wind-down report\" is overdue (was due Wed Oct 01 2025) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','Task','Task','10','DateBased','Critical','[\"InApp\"]','Escalated','2025-10-01 00:00:00','Task|Task|10|DateBased|overdue|9|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(49,'ESCALATION: Compliance obligation \"GNPC Local Content Plan Filing 2026\" (GNPC) is overdue (was due Tue Mar 31 2026) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','ComplianceObligation','ComplianceObligation','6','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-03-31 00:00:00','ComplianceObligation|ComplianceObligation|6|DateBased|overdue|4|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(50,'ESCALATION: Compliance obligation \"Surface Rental Fee - CTP Onshore\" (Petroleum Commission) is overdue (was due Fri May 01 2026) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','ComplianceObligation','ComplianceObligation','3','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-05-01 00:00:00','ComplianceObligation|ComplianceObligation|3|DateBased|overdue|5|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(51,'ESCALATION: Compliance obligation \"Annual Petroleum Income Tax Filing 2025\" (Ghana Revenue Authority) is overdue (was due Tue Jun 30 2026) (unacknowledged past grace period)','Error',0,1,'2026-07-05 07:58:40','2026-07-05 12:31:58','ComplianceObligation','ComplianceObligation','2','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2026-06-30 00:00:00','ComplianceObligation|ComplianceObligation|2|DateBased|overdue|6|escalation',NULL,'2026-07-05 07:58:40',NULL,NULL,NULL,NULL,'2026-07-05 12:31:58',1),(52,'Risk \"FPSO turret bearing failure\" (High severity / High probability) — riskScore crossed 7','Error',0,8,'2026-07-05 12:31:58','2026-07-06 17:15:04','Risk','Risk','3','ThresholdBased','Critical','[\"InApp\",\"Email\"]','Snoozed',NULL,'Risk|Risk|3|ThresholdBased|threshold7|8',24,'2026-07-06 15:19:43','2026-07-06 17:45:04',NULL,NULL,NULL,NULL,NULL),(53,'Correspondence \"Request for WCTP Exploration Licence Extension Documentation\" (Petroleum Commission) — awaiting response is due in 13 day(s) (Mon Jul 20 2026)','Error',0,1,'2026-07-06 00:52:59','2026-07-07 01:55:57','Correspondence','Correspondence','1','DateBased','Critical','[\"InApp\",\"Email\"]','Pending','2026-07-20 00:00:00','Correspondence|Correspondence|1|DateBased|lead14|1',24,'2026-07-07 01:55:57','2026-07-06 04:10:50',NULL,NULL,NULL,NULL,NULL),(54,'Correspondence \"Request for WCTP Exploration Licence Extension Documentation\" (Petroleum Commission) — awaiting response is due in 13 day(s) (Mon Jul 20 2026)','Error',0,12,'2026-07-06 00:52:59','2026-07-07 01:55:57','Correspondence','Correspondence','1','DateBased','Critical','[\"InApp\",\"Email\"]','Pending','2026-07-20 00:00:00','Correspondence|Correspondence|1|DateBased|lead14|12',24,'2026-07-07 01:55:57','2026-07-06 04:10:50',NULL,NULL,NULL,NULL,NULL),(55,'Activity \"Drilling Programme Approval\" is overdue (was due Sat Nov 01 2025)','Error',0,4,'2026-07-06 05:52:57','2026-07-06 05:52:57','Activity','Activity','1','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2025-11-01 00:00:00','Activity|Activity|1|DateBased|overdue|4',24,'2026-07-06 05:52:57',NULL,NULL,NULL,NULL,'2026-07-06 05:52:57',1),(56,'ESCALATION: Activity \"Drilling Programme Approval\" is overdue (was due Sat Nov 01 2025) (unacknowledged past grace period)','Error',0,1,'2026-07-06 05:52:58','2026-07-06 07:14:04','Activity','Activity','1','DateBased','Critical','[\"InApp\",\"Email\"]','Escalated','2025-11-01 00:00:00','Activity|Activity|1|DateBased|overdue|4|escalation',NULL,'2026-07-06 05:52:57',NULL,NULL,NULL,NULL,'2026-07-06 07:14:04',1),(57,'Task \"Legal review of RFQ terms\" is due in 3 day(s) (Fri Jul 10 2026)','Error',0,5,'2026-07-07 00:48:12','2026-07-07 00:48:12','Task','Task','5','DateBased','Critical','[\"InApp\"]','Pending','2026-07-10 00:00:00','Task|Task|5|DateBased|lead3|5',24,'2026-07-07 00:48:12',NULL,NULL,NULL,NULL,NULL,NULL),(58,'Correspondence \"CTP Onshore Drilling Licence Renewal Application\" (Petroleum Commission) — awaiting response is due in 3 day(s) (Fri Jul 10 2026)','Error',0,1,'2026-07-07 00:48:12','2026-07-07 00:48:12','Correspondence','Correspondence','6','DateBased','Critical','[\"InApp\",\"Email\"]','Pending','2026-07-10 00:00:00','Correspondence|Correspondence|6|DateBased|lead3|1',24,'2026-07-07 00:48:12',NULL,NULL,NULL,NULL,NULL,NULL),(59,'Correspondence \"CTP Onshore Drilling Licence Renewal Application\" (Petroleum Commission) — awaiting response is due in 3 day(s) (Fri Jul 10 2026)','Error',0,12,'2026-07-07 00:48:12','2026-07-07 00:48:12','Correspondence','Correspondence','6','DateBased','Critical','[\"InApp\",\"Email\"]','Pending','2026-07-10 00:00:00','Correspondence|Correspondence|6|DateBased|lead3|12',24,'2026-07-07 00:48:12',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operations_updates`
--

DROP TABLE IF EXISTS `operations_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operations_updates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `blockId` int DEFAULT NULL,
  `wellName` varchar(255) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `summary` text NOT NULL,
  `keyIssues` text,
  `nextSteps` text,
  `attachmentDocumentIds` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_opsupdate_block` (`blockId`),
  KEY `idx_opsupdate_date` (`date`),
  CONSTRAINT `fk_opsupdate_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operations_updates`
--

LOCK TABLES `operations_updates` WRITE;
/*!40000 ALTER TABLE `operations_updates` DISABLE KEYS */;
INSERT INTO `operations_updates` VALUES (1,'2026-07-01 00:00:00',1,'JUB-P3-07','Samuel Darko','Flow testing continuing on JUB-P3-07; rates tracking above forecast.','Minor sand production observed; monitoring closely.','Complete pressure build-up test by end of July.','[1,3]','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'2026-06-25 00:00:00',2,NULL,'Samuel Darko','FPSO turret bearing replacement preparation on schedule.','Vendor lead time for spare bearing assembly is tight.','Confirm vendor delivery date by 15 July.','[8]','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'2026-06-10 00:00:00',3,'ST-04','Doris Kufuor','EPA review of the environmental impact assessment ongoing.','EPA requested additional biodiversity survey data.','Submit supplementary survey data by 25 July.','[11]','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'2026-01-10 00:00:00',4,NULL,'Kwame Appiah','CTP onshore site restoration substantially complete.','Final community sign-off pending.','Obtain community sign-off and close out the project.','[12]','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `operations_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(150) NOT NULL,
  `module` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'blocks.manage','Blocks & Assets','Create, edit and delete blocks','2026-07-04 19:10:25','2026-07-04 19:10:25'),(2,'projects.manage','Projects','Create, edit and delete projects','2026-07-04 19:10:25','2026-07-04 19:10:25'),(3,'activities.manage','Activities','Create, edit and delete activities','2026-07-04 19:10:25','2026-07-04 19:10:25'),(4,'tasks.manage','Tasks','Create, edit and delete tasks','2026-07-04 19:10:25','2026-07-04 19:10:25'),(5,'documents.manage','Documents','Upload, edit and delete documents','2026-07-04 19:10:25','2026-07-04 19:10:25'),(6,'finance.manage','Finance & Budget','Create and edit budget/finance line items','2026-07-04 19:10:25','2026-07-04 19:10:25'),(7,'finance.approve','Finance & Budget','Approve or reject AFEs and budget revisions','2026-07-04 19:10:25','2026-07-04 19:10:25'),(8,'contracts.manage','Contract Register','Create, edit and delete contracts','2026-07-04 19:10:25','2026-07-04 19:10:25'),(9,'compliance.manage','Compliance Tracker','Create, edit and close compliance obligations','2026-07-04 19:10:25','2026-07-04 19:10:25'),(10,'correspondence.manage','Correspondence Log','Create and edit correspondence entries','2026-07-04 19:10:25','2026-07-04 19:10:25'),(11,'decisions.manage','Decision Log','Create and edit decisions','2026-07-04 19:10:25','2026-07-04 19:10:25'),(12,'operations_updates.manage','Operations Update','Create and edit operations updates','2026-07-04 19:10:26','2026-07-04 19:10:26'),(13,'budget.manage','Work Programme & Budget Tracker','Create and edit budget lines; request/approve budget revisions','2026-07-04 19:10:26','2026-07-04 19:10:26'),(14,'licences.manage','Licences','Create and edit licences','2026-07-04 19:10:26','2026-07-04 19:10:26'),(15,'risks.manage','Risk Register','Create and edit risks','2026-07-04 19:10:26','2026-07-04 19:10:26'),(16,'workflows.manage','Workflows','Create and edit workflows','2026-07-04 19:10:26','2026-07-04 19:10:26'),(17,'registers.manage','Registers','Create and edit registers','2026-07-04 19:10:26','2026-07-04 19:10:26'),(18,'reports.view','Reports','View reports','2026-07-04 19:10:26','2026-07-04 19:10:26'),(19,'dashboards.view','Dashboards','View operational dashboards','2026-07-04 19:10:26','2026-07-04 19:10:26'),(20,'chairman_view.access','Chairman View','Access the executive Chairman View','2026-07-04 19:10:26','2026-07-04 19:10:26'),(21,'audit.view','Audit Log','View and export the audit log','2026-07-04 19:10:26','2026-07-04 19:10:26'),(22,'admin.manage_users','Administration','Create, edit and deactivate user accounts','2026-07-04 19:10:26','2026-07-04 19:10:26'),(23,'admin.manage_rbac','Administration','Configure roles and the permission matrix','2026-07-04 19:10:26','2026-07-04 19:10:26'),(24,'notifications.manage_rules','Notifications','Configure notification & alert engine rules','2026-07-04 19:10:26','2026-07-04 19:10:26'),(25,'insurance.manage','Insurance Register','Create, edit and delete insurance policies','2026-07-05 13:58:29','2026-07-05 13:58:29'),(26,'env_permits.manage','Environmental Permit Tracker','Create, edit and delete environmental permits','2026-07-05 13:58:29','2026-07-05 13:58:29'),(27,'nda.manage','NDA & Data Room Tracker','Create, edit and delete NDAs and data-room grants','2026-07-05 13:58:29','2026-07-05 13:58:29'),(28,'vendor_payments.manage','Vendor Payment Aging','Create, edit and delete vendor invoices','2026-07-05 14:18:18','2026-07-05 14:18:18'),(29,'forex.manage','Forex & Banking Workflow','Create, edit and action forex transactions (request/approve/reject/settle)','2026-07-05 14:18:18','2026-07-05 14:18:18'),(30,'local_content.manage','Local Content Tracking','Create, edit and delete local-content tracking records','2026-07-05 15:14:04','2026-07-05 15:14:04'),(31,'hse.manage','HSE Register','Create, edit, close and delete HSE incidents','2026-07-05 15:14:04','2026-07-05 15:14:04'),(32,'reports.manage','Reports','Create, edit and delete report catalogue definitions','2026-07-07 01:55:57','2026-07-07 01:55:57');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('In Progress','Completed','On Hold','Planning','Active','Cancelled') COLLATE utf8mb4_general_ci DEFAULT 'In Progress',
  `blockId` int DEFAULT NULL COMMENT 'Foreign key to the Block containing this project',
  `block` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `manager` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT '0.00',
  `spent` decimal(15,2) DEFAULT '0.00',
  `completion` int DEFAULT '0',
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `blockId` (`blockId`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Jubilee Phase 3 Development','Phase 3 infill drilling and well-testing programme for the Jubilee field.','In Progress',1,'West Cape Three Points (WCTP)','Kwame Appiah',85000000.00,52000000.00,61,'2025-01-15 00:00:00','2027-03-31 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'WCTP 2026 Infill Drilling Campaign','Additional infill wells to sustain WCTP plateau production.','Active',1,'West Cape Three Points (WCTP)','Kwame Appiah',32000000.00,9000000.00,28,'2026-02-01 00:00:00','2026-12-15 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'Tano FPSO Life Extension','Life-extension works on the Deepwater Tano FPSO facility.','In Progress',2,'Deepwater Tano (DWT)','Samuel Darko',47000000.00,30500000.00,65,'2024-09-01 00:00:00','2026-09-30 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'Deepwater Tano Subsea Tieback','New subsea tieback development to the Tano FPSO.','Planning',2,'Deepwater Tano (DWT)','Kwame Appiah',120000000.00,4500000.00,4,'2026-05-01 00:00:00','2028-06-30 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21'),(5,'South Tano Appraisal Well ST-04','Appraisal drilling to confirm South Tano reserves.','On Hold',3,'South Tano','Samuel Darko',18000000.00,6200000.00,34,'2025-06-01 00:00:00','2026-10-31 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21'),(6,'South Tano 3D Seismic Reprocessing','Reprocessing of legacy 3D seismic to refine the appraisal model.','Completed',3,'South Tano','Samuel Darko',5200000.00,5100000.00,100,'2024-01-10 00:00:00','2024-11-30 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21'),(7,'CTP Onshore Site Decommissioning','Decommissioning and site restoration of the CTP onshore facility.','Completed',4,'Cape Three Points Onshore','Kwame Appiah',7500000.00,7350000.00,100,'2023-02-01 00:00:00','2024-12-01 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21'),(8,'Community Local Content Pilot','Pilot local-content training programme, discontinued.','Cancelled',1,'West Cape Three Points (WCTP)','Kwame Appiah',1200000.00,300000.00,15,'2025-03-01 00:00:00','2025-09-30 00:00:00','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registers`
--

DROP TABLE IF EXISTS `registers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `registers_chk_1` CHECK (json_valid(`value`))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registers`
--

LOCK TABLES `registers` WRITE;
/*!40000 ALTER TABLE `registers` DISABLE KEYS */;
INSERT INTO `registers` VALUES (1,'Legacy Risk Register Snapshot','risk','{\"note\": \"Superseded by the dedicated Risk model/API — kept for backward-compatibility demo.\"}','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'Legacy HSE Incident Register Snapshot','hse','{\"note\": \"Phase 2 HSE Register not yet implemented; placeholder generic register entry.\"}','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'Legacy Vendor Register Snapshot','vendor','{\"vendors\": [\"Atwood Oceanics\", \"MODEC Production Services\", \"TechnipFMC\"]}','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `registers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_definitions`
--

DROP TABLE IF EXISTS `report_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_definitions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category` enum('Operations','Financial','HSE','Performance') NOT NULL DEFAULT 'Operations',
  `description` varchar(255) DEFAULT NULL,
  `frequency` enum('Weekly','Monthly','Quarterly') NOT NULL DEFAULT 'Monthly',
  `formats` json NOT NULL,
  `block` varchar(255) DEFAULT 'All Blocks',
  `lastGeneratedDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_definitions`
--

LOCK TABLES `report_definitions` WRITE;
/*!40000 ALTER TABLE `report_definitions` DISABLE KEYS */;
INSERT INTO `report_definitions` VALUES (1,'Monthly Production Report','Operations','Detailed production metrics for all blocks','Monthly','[\"PDF\", \"Excel\"]','All Blocks','2026-05-01 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57'),(2,'Financial Summary Report','Financial','AFE status and budget variance analysis','Monthly','[\"PDF\", \"Excel\"]','All Blocks','2026-05-01 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57'),(3,'HSE Incident Report','HSE','Safety incidents and compliance status','Weekly','[\"PDF\"]','All Blocks','2026-04-30 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57'),(4,'Well Performance Analysis','Operations','Production rates and well efficiency','Quarterly','[\"PDF\", \"Excel\"]','Block A, Block B','2026-04-01 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57'),(5,'Risk Assessment Summary','HSE','Active risks and mitigation status','Monthly','[\"PDF\"]','All Blocks','2026-04-30 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57'),(6,'Project Progress Dashboard','Performance','All active projects status and completion','Weekly','[\"PDF\", \"Excel\"]','All Blocks','2026-05-01 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57'),(7,'Vendor Performance Report','Financial','Vendor payments and contract compliance','Quarterly','[\"Excel\"]','All Blocks','2026-04-01 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57'),(8,'Compliance Status Report','HSE','Regulatory compliance and permit status','Monthly','[\"PDF\"]','All Blocks','2026-04-28 09:00:00','2026-07-06 18:33:57','2026-07-06 18:33:57');
/*!40000 ALTER TABLE `report_definitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `generatedDate` datetime DEFAULT NULL,
  `type` enum('Project','Finance','Activity','Custom') COLLATE utf8mb4_general_ci DEFAULT 'Custom',
  `createdBy` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `definitionId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  KEY `fk_reports_definitionId` (`definitionId`),
  CONSTRAINT `fk_reports_definitionId` FOREIGN KEY (`definitionId`) REFERENCES `report_definitions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (1,'Q2 2026 Project Portfolio Report','Summary of project completion, budget utilisation and key milestones across all blocks for Q2 2026.','2026-07-01 00:00:00','Project',4,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(2,'June 2026 Finance & AFE Summary','Monthly finance report covering AFE utilisation, budget variance and cash flow.','2026-07-02 00:00:00','Finance',6,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(3,'H1 2026 Activity Progress Report','Half-year progress summary of all tracked activities across the portfolio.','2026-07-03 00:00:00','Activity',4,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL);
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `risk_matrix_settings`
--

DROP TABLE IF EXISTS `risk_matrix_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `risk_matrix_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lowWeight` int NOT NULL DEFAULT '1',
  `mediumWeight` int NOT NULL DEFAULT '2',
  `highWeight` int NOT NULL DEFAULT '3',
  `mediumThreshold` int NOT NULL DEFAULT '4',
  `highThreshold` int NOT NULL DEFAULT '7',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `risk_matrix_settings`
--

LOCK TABLES `risk_matrix_settings` WRITE;
/*!40000 ALTER TABLE `risk_matrix_settings` DISABLE KEYS */;
INSERT INTO `risk_matrix_settings` VALUES (1,1,2,3,4,7,'2026-07-05 12:31:57','2026-07-05 12:31:57');
/*!40000 ALTER TABLE `risk_matrix_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `risks`
--

DROP TABLE IF EXISTS `risks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `risks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL COMMENT 'Link risk to a project',
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `severity` enum('Low','Medium','High') COLLATE utf8mb4_general_ci DEFAULT 'Medium',
  `probability` enum('Low','Medium','High') COLLATE utf8mb4_general_ci DEFAULT 'Medium',
  `status` enum('Active','Mitigated','Closed') COLLATE utf8mb4_general_ci DEFAULT 'Active',
  `owner` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Risk owner name',
  `mitigation` text COLLATE utf8mb4_general_ci COMMENT 'Mitigation strategy',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `reviewDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `projectId` (`projectId`),
  CONSTRAINT `risks_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `risks`
--

LOCK TABLES `risks` WRITE;
/*!40000 ALTER TABLE `risks` DISABLE KEYS */;
INSERT INTO `risks` VALUES (1,1,'Rig availability delay','Contracted rig may be delayed due to prior campaign overrun.','High','Medium','Active','Kwame Appiah','Secondary rig option identified with 45-day mobilisation.','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(2,1,'Well control incident','Potential well control event during flow testing.','High','Low','Mitigated','Samuel Darko','Enhanced BOP testing and HSE oversight implemented.','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(3,3,'FPSO turret bearing failure','Bearing wear could force an unplanned shutdown.','High','High','Active','Samuel Darko','Replacement programme underway; interim monitoring in place.','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(4,4,'Subsea tieback cost overrun','FEED estimate may increase due to steel price volatility.','Medium','Medium','Active','Kwame Appiah','Locking in steel prices via forward contract under review.','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(5,5,'EPA permit delay','Permit approval could delay the appraisal well spud date.','Medium','High','Active','Doris Kufuor','Weekly liaison meetings with EPA scheduled.','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL),(6,2,'Community relations dispute','Land access dispute with local community near the WCTP shore facility.','Low','Low','Closed','Kwame Appiah','Resolved via community liaison committee agreement.','2026-07-05 04:47:21','2026-07-05 04:47:21',NULL);
/*!40000 ALTER TABLE `risks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roleId` int NOT NULL,
  `permissionId` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_permission` (`roleId`,`permissionId`),
  UNIQUE KEY `role_permissions_role_id_permission_id` (`roleId`,`permissionId`),
  KEY `fk_role_permissions_permission` (`permissionId`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,2,1,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(2,2,2,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(3,2,3,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(4,2,4,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(5,2,15,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(6,2,16,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(7,2,17,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(8,2,8,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(9,2,9,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(10,2,10,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(11,2,11,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(12,2,12,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(13,2,14,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(14,2,13,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(15,2,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(16,2,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(17,3,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(18,3,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(19,4,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(20,4,20,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(21,4,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(22,5,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(23,5,20,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(24,5,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(25,5,7,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(26,5,11,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(27,5,3,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(28,6,1,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(29,6,2,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(30,6,4,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(31,6,3,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(32,6,12,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(33,6,16,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(34,6,13,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(35,6,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(36,6,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(37,7,8,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(38,7,9,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(39,7,10,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(40,7,5,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(41,7,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(42,7,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(43,8,6,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(44,8,7,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(45,8,13,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(46,8,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(47,8,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(48,9,15,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(49,9,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(50,9,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(51,10,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(52,10,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(53,11,19,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(54,11,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(55,12,18,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(56,1,22,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(57,1,23,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(58,1,24,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(59,1,21,'2026-07-04 19:10:26','2026-07-04 19:10:26'),(60,2,25,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(61,2,26,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(62,2,27,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(63,7,27,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(64,7,25,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(65,7,26,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(66,8,25,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(67,9,26,'2026-07-05 13:58:29','2026-07-05 13:58:29'),(68,2,28,'2026-07-05 14:18:18','2026-07-05 14:18:18'),(69,2,29,'2026-07-05 14:18:18','2026-07-05 14:18:18'),(70,8,28,'2026-07-05 14:18:19','2026-07-05 14:18:19'),(71,8,29,'2026-07-05 14:18:19','2026-07-05 14:18:19'),(72,2,30,'2026-07-05 15:14:04','2026-07-05 15:14:04'),(73,2,31,'2026-07-05 15:14:04','2026-07-05 15:14:04'),(74,7,30,'2026-07-05 15:14:04','2026-07-05 15:14:04'),(75,8,30,'2026-07-05 15:14:04','2026-07-05 15:14:04'),(76,9,31,'2026-07-05 15:14:04','2026-07-05 15:14:04'),(77,1,32,'2026-07-07 01:55:57','2026-07-07 01:55:57');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin','Admin / IT — technical superuser: user management, RBAC configuration, system settings.',1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(2,'Manager','Legacy operational manager — broad create/edit rights across core operational modules.',1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(3,'User','Legacy standard user — view access plus document/comment contributions.',1,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(4,'Chairman/Board','Ultimate oversight of the venture. Chairman View, read-only summaries, one-click export — no edit rights.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(5,'CEO/Country Manager','Overall executive management. Full read access; approval authority on budgets, decisions, AFEs.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(6,'Project/Operations Manager','Day-to-day project & operations delivery. Full access to tasks, activities, work programme, operations updates.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(7,'Legal/Compliance Officer','Regulatory, contractual and correspondence oversight. Full access to contracts, compliance tracker, correspondence log, NDA tracker.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(8,'Finance/Accounts','Budget, AFE and payment management. Full access to budget tracker, AFE tracking, vendor payment aging, forex workflow.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(9,'HSE Officer','Health, safety and environment oversight. Full access to HSE register, environmental permit tracker.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(10,'Geologist/Drilling Engineer','Technical operations reporting. Full access to daily drilling/geological reports, reserves tracker.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(11,'Team Member/Staff','General contributor. Access limited to assigned tasks, activities and documents.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25'),(12,'External Partner','JV partner / auditor with limited visibility. Read-only access to specifically shared documents or reports.',0,'2026-07-04 19:10:25','2026-07-04 19:10:25');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('Not Started','In Progress','Completed','Blocked','Overdue') DEFAULT 'Not Started',
  `priority` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  `dueDate` datetime DEFAULT NULL,
  `assignedToId` int DEFAULT NULL,
  `assignedById` int DEFAULT NULL,
  `relatedType` enum('Activity','Workflow','Document','Project','Block','Decision','General') DEFAULT 'General',
  `relatedId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `startDate` datetime DEFAULT NULL,
  `progress` int NOT NULL DEFAULT '0',
  `parentTaskId` int DEFAULT NULL,
  `dependencyTaskIds` text,
  PRIMARY KEY (`id`),
  KEY `assignedById` (`assignedById`),
  KEY `idx_tasks_parentTaskId` (`parentTaskId`),
  KEY `idx_tasks_assignedToId_status` (`assignedToId`,`status`),
  CONSTRAINT `fk_tasks_parentTask` FOREIGN KEY (`parentTaskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`assignedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,'Review flow test results','Analyse flow-test rates against pre-drill forecast.','Completed','High','2026-06-10 00:00:00',8,4,'Activity',4,'2026-07-05 04:47:21','2026-07-05 04:47:21','2026-06-01 00:00:00',100,NULL,NULL),(2,'Prepare pressure build-up test procedure','Draft the PBU test procedure and safety case.','In Progress','Medium','2026-07-18 00:00:00',8,4,'Activity',5,'2026-07-05 04:47:21','2026-07-05 04:47:21','2026-07-01 00:00:00',55,NULL,'[1]'),(3,'Draft long-lead procurement RFQ','Prepare RFQ package for long-lead subsea equipment.','Overdue','Critical','2026-06-20 00:00:00',9,4,'Activity',7,'2026-07-05 04:47:21','2026-07-05 04:47:21','2026-05-01 00:00:00',40,NULL,NULL),(4,'Obtain vendor quotes','Collect and compare quotes from three approved vendors.','Overdue','High','2026-06-25 00:00:00',9,4,'Activity',7,'2026-07-05 04:47:21','2026-07-05 04:51:51','2026-06-01 00:00:00',70,3,NULL),(5,'Legal review of RFQ terms','Legal & Compliance review of RFQ commercial terms.','Not Started','Medium','2026-07-10 00:00:00',5,4,'Activity',7,'2026-07-05 04:47:21','2026-07-05 04:47:21',NULL,0,3,NULL),(6,'Approve FPSO turret bearing budget line','Finance committee approval of the turret bearing AFE.','Completed','Critical','2026-04-15 00:00:00',6,2,'Activity',9,'2026-07-05 04:47:21','2026-07-05 04:47:21','2026-03-01 00:00:00',100,NULL,NULL),(7,'Submit ST-04 EPA permit documents','Submit supplementary biodiversity survey data to EPA.','Blocked','High','2026-08-01 00:00:00',7,4,'Activity',11,'2026-07-05 04:47:21','2026-07-05 04:47:21','2026-05-01 00:00:00',25,NULL,NULL),(8,'Chase JV partner sign-off on FEED study','Follow up with JV partner representative for FEED sign-off.','In Progress','Medium','2026-11-15 00:00:00',4,2,'Activity',10,'2026-07-05 04:47:21','2026-07-05 04:47:21','2026-06-01 00:00:00',20,NULL,NULL),(9,'Complete decommissioning close-out report','Finalise and file the CTP decommissioning close-out report.','Completed','Medium','2024-12-15 00:00:00',9,4,'Activity',13,'2026-07-05 04:47:21','2026-07-05 04:47:21','2024-11-01 00:00:00',100,NULL,NULL),(10,'Local content pilot wind-down report','Prepare wind-down report for the cancelled pilot programme.','Overdue','Low','2025-10-01 00:00:00',9,4,'Activity',14,'2026-07-05 04:47:21','2026-07-05 04:51:51',NULL,0,NULL,NULL),(11,'Action Required: AFE Approval Workflow (Executive Management)','Executive approval required for AFE supplement workflow.','In Progress','High','2026-07-15 00:00:00',6,NULL,'Workflow',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','2026-05-28 00:00:00',10,NULL,NULL),(12,'General onboarding checklist - Doris Kufuor','HR/Admin onboarding checklist completion.','Completed','Low','2019-11-15 00:00:00',4,1,'General',NULL,'2026-07-05 04:47:21','2026-07-05 04:47:21','2019-10-15 00:00:00',100,NULL,NULL),(13,'Activity Assignment: Drilling Programme Approval','Regulatory and internal approval of the JUB-P3-07 drilling programme.','Completed','High','2025-11-01 00:00:00',4,NULL,'Activity',1,'2026-07-06 05:18:44','2026-07-06 05:18:44',NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `firstName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lastName` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `departmentId` int DEFAULT NULL,
  `role` varchar(100) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'User',
  `active` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `employeeId` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `designation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reportingManagerId` int DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `photoUrl` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `qualifications` text COLLATE utf8mb4_general_ci,
  `startDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `username_12` (`username`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `username_13` (`username`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `username_14` (`username`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `username_15` (`username`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `username_16` (`username`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `employeeId` (`employeeId`),
  KEY `departmentId` (`departmentId`),
  KEY `idx_users_reportingManagerId` (`reportingManagerId`),
  CONSTRAINT `fk_users_reportingManager` FOREIGN KEY (`reportingManagerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','System','Administrator',5,'Admin',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0001','System Administrator',NULL,'+233 20 000 0001',NULL,'BSc Information Systems','2019-01-07 00:00:00'),(2,'j.mensah','ceo@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','James','Mensah',5,'CEO/Country Manager',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0002','Country Manager & CEO',NULL,'+233 20 000 0002',NULL,'MBA, MSc Petroleum Economics','2015-03-10 00:00:00'),(3,'a.owusu','chairman@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Akosua','Owusu',5,'Chairman/Board',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0003','Chairman of the Board',NULL,'+233 20 000 0003',NULL,'MSc Petroleum Engineering, FCA','2014-01-01 00:00:00'),(4,'k.appiah','ops.manager@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Kwame','Appiah',1,'Project/Operations Manager',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0004','Project & Operations Manager',2,'+233 20 000 0004',NULL,'BSc Petroleum Engineering','2017-06-01 00:00:00'),(5,'e.boateng','legal@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Ewurabena','Boateng',3,'Legal/Compliance Officer',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0005','Legal & Compliance Officer',2,'+233 20 000 0005',NULL,'LLB, BL','2018-09-15 00:00:00'),(6,'n.asante','finance@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Nana','Asante',2,'Finance/Accounts',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0006','Finance & Accounts Lead',2,'+233 20 000 0006',NULL,'ACCA, BSc Accounting','2016-02-20 00:00:00'),(7,'d.kufuor','hse@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Doris','Kufuor',4,'HSE Officer',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0007','HSE Officer',4,'+233 20 000 0007',NULL,'NEBOSH IGC, BSc Environmental Science','2019-11-01 00:00:00'),(8,'s.darko','geologist@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Samuel','Darko',1,'Geologist/Drilling Engineer',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0008','Senior Geologist / Drilling Engineer',4,'+233 20 000 0008',NULL,'MSc Geology','2018-04-12 00:00:00'),(9,'t.agyeman','staff1@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Tawiah','Agyeman',1,'Team Member/Staff',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0009','Operations Officer',4,'+233 20 000 0009',NULL,'BSc Petroleum Engineering','2021-01-18 00:00:00'),(10,'p.addo','staff2@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Priscilla','Addo',2,'Team Member/Staff',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0010','Accounts Officer',6,'+233 20 000 0010',NULL,'BCom Accounting','2020-07-01 00:00:00'),(11,'r.johnson','partner@jvpartner-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Robert','Johnson',NULL,'External Partner',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-EXT-01','JV Partner Representative',NULL,'+1 555 010 1234',NULL,'MBA','2020-01-01 00:00:00'),(12,'legacy.manager','legacy.manager@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Legacy','Manager',1,'Manager',1,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0011','Operations Manager (Legacy)',2,'+233 20 000 0011',NULL,'BSc Engineering','2016-05-05 00:00:00'),(13,'legacy.user','legacy.user@enquest-demo.com','$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou','Legacy','User',1,'User',0,'2026-07-05 04:47:21','2026-07-05 04:47:21','EMP-0012','Field Technician (Offboarded)',4,'+233 20 000 0012',NULL,'HND Mechanical Engineering','2015-08-20 00:00:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_invoices`
--

DROP TABLE IF EXISTS `vendor_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor` varchar(255) NOT NULL,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  `blockId` int DEFAULT NULL,
  `financeId` int DEFAULT NULL,
  `invoiceDate` datetime DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `currency` enum('GHS','USD') NOT NULL DEFAULT 'USD',
  `amountPaid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('Open','PartiallyPaid','Paid','Disputed') NOT NULL DEFAULT 'Open',
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_vendorinvoices_block` (`blockId`),
  KEY `fk_vendorinvoices_finance` (`financeId`),
  KEY `idx_vendorinvoices_due` (`dueDate`),
  CONSTRAINT `fk_vendorinvoices_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_vendorinvoices_finance` FOREIGN KEY (`financeId`) REFERENCES `finances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_invoices`
--

LOCK TABLES `vendor_invoices` WRITE;
/*!40000 ALTER TABLE `vendor_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflows`
--

DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `submittedBy` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `submitDate` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `currentStep` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `priority` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `dueDate` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `amount` int DEFAULT NULL,
  `steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'Awaiting Action',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `workflows_chk_1` CHECK (json_valid(`steps`))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflows`
--

LOCK TABLES `workflows` WRITE;
/*!40000 ALTER TABLE `workflows` DISABLE KEYS */;
INSERT INTO `workflows` VALUES (1,'AFE Approval - Turret Bearing Replacement Supplement','AFE Approval','Nana Asante','2026-05-28','Executive Management','Critical','2026-07-15','Approval required for AFE-2026-014-S1 supplementary amount.',1500000,'[{\"step\":\"Finance & Accounts\",\"status\":\"Completed\",\"date\":\"2026-05-28\"},{\"step\":\"Executive Management\",\"status\":\"In Progress\",\"date\":null}]','Awaiting Action','2026-07-05 04:47:21','2026-07-05 04:47:21'),(2,'Contract Renewal Review - Rig Charter Extension','Contract Review','Ewurabena Boateng','2026-06-10','Legal & Compliance','High','2026-07-25','Review of proposed extension terms for the Atwood Explorer rig charter.',45000000,'[{\"step\":\"Legal & Compliance\",\"status\":\"In Progress\",\"date\":\"2026-06-10\"}]','Review Required','2026-07-05 04:47:21','2026-07-05 04:47:21'),(3,'Community Sponsorship Request - Rejected Resubmission','Finance Approval','Kwame Appiah','2026-05-18','Executive Management','Low','2026-07-01','Resubmission of community sponsorship request under the CSR programme.',25000,'[{\"step\":\"Finance & Accounts\",\"status\":\"Rejected\",\"date\":\"2026-05-20\"},{\"step\":\"Executive Management\",\"status\":\"Pending\",\"date\":null}]','Pending','2026-07-05 04:47:21','2026-07-05 04:47:21'),(4,'HSE Incident Review - Turret Bearing Monitoring','HSE Review','Doris Kufuor','2026-04-02','HSE','Medium','2026-04-20','Review of the interim monitoring plan for turret bearing wear.',NULL,'[{\"step\":\"HSE\",\"status\":\"Completed\",\"date\":\"2026-04-05\"},{\"step\":\"Manager Review\",\"status\":\"Completed\",\"date\":\"2026-04-10\"}]','Completed','2026-07-05 04:47:21','2026-07-05 04:47:21');
/*!40000 ALTER TABLE `workflows` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-07 11:04:01

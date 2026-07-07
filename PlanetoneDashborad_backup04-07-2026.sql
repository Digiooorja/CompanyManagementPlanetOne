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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_migrations`
--

LOCK TABLES `_migrations` WRITE;
/*!40000 ALTER TABLE `_migrations` DISABLE KEYS */;
INSERT INTO `_migrations` VALUES (1,'20260604_000_init_baseline.sql','2026-06-05 10:46:25'),(2,'20260604_001_create_licences_table.sql','2026-06-05 10:46:25'),(3,'20260604_002_remove_expired_from_licence_status.sql','2026-06-05 10:46:25'),(4,'20260604_003_drop_licence_fields_from_blocks.sql','2026-06-05 10:54:02'),(5,'20260604_004_add_delegation_to_finance.sql','2026-06-05 10:54:26'),(6,'20260604_007_add_licence_to_documents.sql','2026-06-05 10:57:03');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `parentActivityId` (`parentActivityId`),
  KEY `projectId` (`projectId`),
  CONSTRAINT `activities_ibfk_31` FOREIGN KEY (`parentActivityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activities_ibfk_32` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,'Subsurface Study','Subsurface Study activity.','Active',NULL,1,'High',NULL,'2026-01-01 00:00:00',30,'2026-03-01 00:00:00','2026-12-31 00:00:00','2026-04-01 00:00:00',NULL,1608000.00,0.00,0,'2026-05-28 05:46:53','2026-06-27 10:52:07'),(2,'Peer Review','Peer Review activity.','Active',NULL,1,'High','','2026-01-01 00:00:00',0,'2026-09-15 00:00:00','2026-10-15 00:00:00',NULL,NULL,200000.00,0.00,1,'2026-05-28 05:46:53','2026-06-01 10:59:43'),(3,'Seabed Survey assuming with Tullow vessel','Seabed Survey assuming with Tullow vessel activity.','Inactive',NULL,1,'High','','2026-01-01 00:00:00',0,'2026-11-01 00:00:00','2026-11-30 00:00:00',NULL,NULL,300000.00,0.00,2,'2026-05-28 05:46:53','2026-05-28 05:46:53'),(4,'Procurement Process','Procurement Process activity.','Active',NULL,1,'High','','2026-01-01 00:00:00',29,'2026-03-01 00:00:00','2026-11-30 00:00:00',NULL,NULL,315000.00,253.00,3,'2026-05-28 05:46:53','2026-06-01 11:48:04'),(5,'Well Design & Program','Well Design & Program activity.','Inactive',NULL,1,'High','','2026-01-01 00:00:00',0,'2026-03-01 00:00:00','2026-07-31 00:00:00',NULL,NULL,192000.00,0.00,4,'2026-05-28 05:46:53','2026-05-28 05:46:53'),(6,'Wellhead/Tubulars (Purchasing from Tullow)','Wellhead/Tubulars purchasing from Tullow.','Inactive',NULL,1,'High','','2026-01-01 00:00:00',0,'2026-03-01 00:00:00','2026-06-30 00:00:00',NULL,NULL,5040000.00,0.00,5,'2026-05-28 05:46:53','2026-05-28 05:46:53'),(7,'Tendering & Contract','Tendering & Contract activity.','Active',NULL,1,'High','','2026-01-01 00:00:00',0,'2026-03-12 17:00:00','2026-12-25 17:00:00',NULL,NULL,1.00,0.00,6,'2026-05-28 05:46:53','2026-05-28 11:20:49'),(8,'Drilling Well','Assuming Tullow supply base','Inactive',NULL,1,'High','','2026-01-01 00:00:00',0,'2027-01-01 00:00:00','2027-01-31 00:00:00',NULL,NULL,39940000.00,0.00,7,'2026-05-28 05:46:53','2026-05-28 06:21:20'),(11,'Testing Operations','Testing Operations activity.','Inactive',NULL,1,'High','','2026-01-01 00:00:00',0,'2027-02-01 00:00:00','2027-02-28 00:00:00',NULL,NULL,8000000.00,0.00,8,'2026-05-28 05:46:53','2026-05-28 05:46:53'),(12,'Contracting Rig','Rig hiring for drilling','Active',8,NULL,'Medium','',NULL,0,'2027-01-01 00:00:00','2027-01-31 00:00:00',NULL,NULL,17200000.00,0.00,1,'2026-05-28 06:11:31','2026-05-28 06:21:20'),(13,'Drilling Services','Performing Drilling Services','Active',8,NULL,'Medium','',NULL,0,'2027-01-01 00:00:00','2027-01-31 00:00:00',NULL,NULL,7400000.00,0.00,2,'2026-05-28 06:17:43','2026-05-28 06:18:13'),(14,'Kick-off Meeting','Presentation with PlanetOne and Antira Engineering','Completed',4,NULL,'Medium','',NULL,46,'2026-03-12 00:00:00','2026-03-12 00:00:00',NULL,NULL,0.00,0.00,1,'2026-05-28 06:25:42','2026-06-01 11:03:57'),(15,'Procurement Strategy','Share the Procurement Strategy with PlanetOne','Active',4,NULL,'Critical','Procurement - Yash Vardhan Varshney',NULL,100,'2026-03-16 00:00:00','2026-03-19 00:00:00',NULL,NULL,0.00,253.00,2,'2026-05-28 06:33:22','2026-06-01 10:45:24'),(16,'Batch-1 (Tangibles and LL Items)','Share the Procurement Strategy with PlanetOne','Completed',4,1,'Medium',NULL,NULL,78,'2026-03-16 00:00:00','2026-03-19 00:00:00',NULL,NULL,0.00,0.00,1,'2026-05-28 06:33:22','2026-06-01 11:48:04'),(17,'Procurement of Casing & Tubing','','Active',16,1,'Medium',NULL,NULL,62,'2026-03-13 08:00:00','2026-06-16 17:00:00',NULL,NULL,0.00,0.00,1,'2026-05-29 06:33:22','2026-06-01 11:48:04'),(18,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',17,1,'Medium',NULL,NULL,67,'2026-03-13 08:00:00','2026-06-03 17:00:00',NULL,NULL,0.00,0.00,2,'2026-05-30 06:33:22','2026-06-01 10:26:13'),(19,'Preparation of SOW','','Active',17,1,'Medium',NULL,NULL,81,'2026-03-13 08:00:00','2026-03-20 17:00:00',NULL,NULL,0.00,0.00,3,'2026-05-31 06:33:22','2026-06-01 10:27:26'),(20,'Planet One Approval','','Active',17,1,'Medium',NULL,NULL,100,'2026-03-13 08:00:00','2026-03-25 17:00:00',NULL,NULL,0.00,0.00,4,'2026-06-01 06:33:22','2026-06-01 11:48:03'),(21,'Issue NIT (e-tender) & bid Submission','','Active',17,1,'Medium',NULL,NULL,84,'2026-03-26 08:00:00','2026-03-27 17:00:00',NULL,NULL,0.00,0.00,5,'2026-06-02 06:33:22','2026-06-01 10:26:44'),(22,'Techno-Commercial Evaluation of Bids','','Active',17,1,'Medium',NULL,NULL,78,'2026-03-28 08:00:00','2026-05-01 17:00:00',NULL,NULL,0.00,0.00,6,'2026-06-03 06:33:22','2026-06-01 10:26:58'),(23,'Contract Award','','Active',17,1,'Medium',NULL,NULL,0,'2026-05-02 08:00:00','2026-05-27 17:00:00',NULL,NULL,0.00,0.00,7,'2026-06-04 06:33:22','2026-06-04 06:34:35'),(24,'Procurement of Subsea Well Head & Conductor','','Active',16,1,'Medium','',NULL,100,'2026-03-28 00:00:00','2026-06-03 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-05 06:33:22','2026-05-31 09:06:58'),(25,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',24,1,'Medium',NULL,NULL,100,'2026-03-21 08:00:00','2026-06-16 17:00:00',NULL,NULL,0.00,0.00,1,'2026-06-06 06:33:22','2026-05-31 08:30:24'),(26,'Preparation of SOW','','Active',24,1,'Medium',NULL,NULL,100,'2026-03-21 08:00:00','2026-03-28 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-07 06:33:22','2026-05-30 10:53:52'),(27,'Planet One Approval','','Active',24,1,'Medium',NULL,NULL,100,'2026-03-26 08:00:00','2026-04-06 17:00:00',NULL,NULL,0.00,0.00,3,'2026-06-08 06:33:22','2026-05-30 10:55:28'),(28,'Issue NIT (e-tender) & bid Submission','','Active',24,1,'Medium',NULL,NULL,100,'2026-04-06 08:00:00','2026-04-07 17:00:00',NULL,NULL,0.00,0.00,4,'2026-06-09 06:33:22','2026-05-30 10:54:03'),(29,'Techno-Commercial Evaluation of Bids','','Active',24,1,'Medium',NULL,NULL,100,'2026-04-08 08:00:00','2026-05-12 17:00:00',NULL,NULL,0.00,0.00,5,'2026-06-10 06:33:22','2026-05-30 10:55:33'),(30,'Contract Award','','Active',24,1,'Medium',NULL,NULL,100,'2026-05-13 08:00:00','2026-06-09 17:00:00',NULL,NULL,0.00,0.00,6,'2026-06-11 06:33:22','2026-05-30 10:54:13'),(31,'Batch-2 (Bundled Services)','','Active',4,1,'Medium',NULL,NULL,0,'2026-06-10 08:00:00','2026-06-16 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-12 06:33:22','2026-06-12 06:34:35'),(32,'Bundled Services of drilling fluid, cementing, mud logging, coring, DD/MWD/LWD, drill bits, drilling tools, fishing tools, TCR, Liner, well testing, wire line logging','','Active',31,1,'Medium',NULL,NULL,7,'2026-03-30 08:00:00','2026-08-08 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-13 06:33:22','2026-06-13 06:34:35'),(33,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',32,1,'Medium',NULL,NULL,7,'2026-03-30 08:00:00','2026-08-08 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-14 06:33:22','2026-06-14 06:34:35'),(34,'Preparation of SOW','','Active',32,1,'Medium',NULL,NULL,30,'2026-03-30 08:00:00','2026-04-06 17:00:00',NULL,NULL,0.00,0.00,3,'2026-06-15 06:33:22','2026-06-15 06:34:35'),(35,'Planet One Approval','','Active',32,1,'Medium',NULL,NULL,20,'2026-04-07 08:00:00','2026-05-11 17:00:00',NULL,NULL,0.00,0.00,4,'2026-06-16 06:33:22','2026-06-16 06:34:35'),(36,'Issue NIT (e-tender) & bid Submission','','Active',32,1,'Medium',NULL,NULL,0,'2026-05-12 08:00:00','2026-05-13 17:00:00',NULL,NULL,0.00,0.00,5,'2026-06-17 06:33:22','2026-06-17 06:34:35'),(37,'Techno-Commercial Evaluation of Bids','','Active',32,1,'Medium',NULL,NULL,0,'2026-05-14 08:00:00','2026-06-17 17:00:00',NULL,NULL,0.00,0.00,6,'2026-06-18 06:33:22','2026-06-18 06:34:35'),(38,'Contract Award','','Active',32,1,'Medium',NULL,NULL,0,'2026-06-18 08:00:00','2026-08-01 17:00:00',NULL,NULL,0.00,0.00,7,'2026-06-19 06:33:22','2026-06-19 06:34:35'),(39,'Batch-3 (Independent Services)','','Active',4,1,'Medium',NULL,NULL,0,'2026-08-03 08:00:00','2026-08-08 17:00:00',NULL,NULL,0.00,0.00,3,'2026-06-20 06:33:22','2026-06-20 06:34:35'),(40,'Helicopter Services/Air Logistics','','Active',39,1,'Medium',NULL,NULL,0,'2026-04-07 08:00:00','2026-12-25 17:00:00',NULL,NULL,0.00,0.00,1,'2026-06-21 06:33:22','2026-06-21 06:34:35'),(41,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',40,1,'Medium',NULL,NULL,0,'2026-04-07 08:00:00','2026-07-28 17:00:00',NULL,NULL,0.00,0.00,1,'2026-06-22 06:33:22','2026-06-22 06:34:35'),(42,'Preparation of SOW','','Active',40,1,'Medium',NULL,NULL,0,'2026-04-07 08:00:00','2026-04-14 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-23 06:33:22','2026-06-23 06:34:35'),(43,'Planet One Approval','','Active',40,1,'Medium',NULL,NULL,0,'2026-05-12 08:00:00','2026-05-28 17:00:00',NULL,NULL,0.00,0.00,3,'2026-06-24 06:33:22','2026-06-24 06:34:35'),(44,'Issue NIT (e-tender) & bid Submission','','Active',40,1,'Medium',NULL,NULL,0,'2026-05-28 08:00:00','2026-05-29 17:00:00',NULL,NULL,0.00,0.00,4,'2026-06-25 06:33:22','2026-06-25 06:34:35'),(45,'Techno-Commercial Evaluation of Bids','','Active',40,1,'Medium',NULL,NULL,0,'2026-05-30 08:00:00','2026-07-03 17:00:00',NULL,NULL,0.00,0.00,5,'2026-06-26 06:33:22','2026-06-26 06:34:35'),(46,'Contract Award','','Active',40,1,'Medium',NULL,NULL,0,'2026-07-04 08:00:00','2026-07-21 17:00:00',NULL,NULL,0.00,0.00,6,'2026-06-27 06:33:22','2026-06-27 06:34:35'),(47,'Marine Vessels (AHTS/OSV)/Sea Logistics','','Active',39,1,'Medium',NULL,NULL,0,'2026-07-22 08:00:00','2026-07-28 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-28 06:33:22','2026-06-28 06:34:35'),(48,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',47,1,'Medium',NULL,NULL,0,'2026-04-15 08:00:00','2026-09-12 17:00:00',NULL,NULL,0.00,0.00,1,'2026-06-29 06:33:22','2026-06-29 06:34:35'),(49,'Preparation of SOW','','Active',47,1,'Medium',NULL,NULL,0,'2026-04-15 08:00:00','2026-04-22 17:00:00',NULL,NULL,0.00,0.00,2,'2026-06-30 06:33:22','2026-06-30 06:34:35'),(50,'Planet One Approval','','Active',47,1,'Medium',NULL,NULL,0,'2026-05-29 08:00:00','2026-07-02 17:00:00',NULL,NULL,0.00,0.00,3,'2026-07-01 06:33:22','2026-07-01 06:34:35'),(51,'Issue NIT (e-tender) & bid Submission','','Active',47,1,'Medium',NULL,NULL,0,'2026-07-02 08:00:00','2026-07-03 17:00:00',NULL,NULL,0.00,0.00,4,'2026-07-02 06:33:22','2026-07-02 06:34:35'),(52,'Techno-Commercial Evaluation of Bids','','Active',47,1,'Medium',NULL,NULL,0,'2026-07-04 08:00:00','2026-08-07 17:00:00',NULL,NULL,0.00,0.00,5,'2026-07-03 06:33:22','2026-07-03 06:34:35'),(53,'Contract Award','','Active',47,1,'Medium',NULL,NULL,0,'2026-08-10 08:00:00','2026-09-05 17:00:00',NULL,NULL,0.00,0.00,6,'2026-07-04 06:33:22','2026-07-04 06:34:35'),(54,'Shore Base - Logistics supply base','','Active',39,1,'Medium',NULL,NULL,0,'2026-09-07 08:00:00','2026-09-12 17:00:00',NULL,NULL,0.00,0.00,3,'2026-07-05 06:33:22','2026-07-05 06:34:35'),(55,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',54,1,'Medium',NULL,NULL,0,'2026-04-23 08:00:00','2026-10-16 17:00:00',NULL,NULL,0.00,0.00,1,'2026-07-06 06:33:22','2026-07-06 06:34:35'),(56,'Preparation of SOW','','Active',54,1,'Medium',NULL,NULL,0,'2026-04-23 08:00:00','2026-04-30 17:00:00',NULL,NULL,0.00,0.00,2,'2026-07-07 06:33:22','2026-07-07 06:34:35'),(57,'Planet One Approval','','Active',54,1,'Medium',NULL,NULL,0,'2026-07-03 08:00:00','2026-08-06 17:00:00',NULL,NULL,0.00,0.00,3,'2026-07-08 06:33:22','2026-07-08 06:34:35'),(58,'Issue NIT (e-tender) & bid Submission','','Active',54,1,'Medium',NULL,NULL,0,'2026-08-06 08:00:00','2026-08-07 17:00:00',NULL,NULL,0.00,0.00,4,'2026-07-09 06:33:22','2026-07-09 06:34:35'),(59,'Techno-Commercial Evaluation of Bids','','Active',54,1,'Medium',NULL,NULL,0,'2026-08-08 08:00:00','2026-09-11 17:00:00',NULL,NULL,0.00,0.00,5,'2026-07-10 06:33:22','2026-07-10 06:34:35'),(60,'Contract Award','','Active',54,1,'Medium',NULL,NULL,0,'2026-09-12 08:00:00','2026-10-09 17:00:00',NULL,NULL,0.00,0.00,6,'2026-07-11 06:33:22','2026-07-11 06:34:35'),(61,'Supply of HSD and Water','','Active',39,1,'Medium',NULL,NULL,0,'2026-10-10 08:00:00','2026-10-16 17:00:00',NULL,NULL,0.00,0.00,4,'2026-07-12 06:33:22','2026-07-12 06:34:35'),(62,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',61,1,'Medium',NULL,NULL,0,'2026-05-01 08:00:00','2026-11-20 17:00:00',NULL,NULL,0.00,0.00,1,'2026-07-13 06:33:22','2026-07-13 06:34:35'),(63,'Preparation of SOW','','Active',61,1,'Medium',NULL,NULL,0,'2026-05-01 08:00:00','2026-05-08 17:00:00',NULL,NULL,0.00,0.00,2,'2026-07-14 06:33:22','2026-07-14 06:34:35'),(64,'Planet One Approval','','Active',61,1,'Medium',NULL,NULL,0,'2026-08-07 08:00:00','2026-09-10 17:00:00',NULL,NULL,0.00,0.00,3,'2026-07-15 06:33:22','2026-07-15 06:34:35'),(65,'Issue NIT (e-tender) & bid Submission','','Active',61,1,'Medium',NULL,NULL,0,'2026-09-10 08:00:00','2026-09-11 17:00:00',NULL,NULL,0.00,0.00,4,'2026-07-16 06:33:22','2026-07-16 06:34:35'),(66,'Techno-Commercial Evaluation of Bids','','Active',61,1,'Medium',NULL,NULL,0,'2026-09-12 08:00:00','2026-10-16 17:00:00',NULL,NULL,0.00,0.00,5,'2026-07-17 06:33:22','2026-07-17 06:34:35'),(67,'Contract Award','','Active',61,1,'Medium',NULL,NULL,0,'2026-10-17 08:00:00','2026-11-13 17:00:00',NULL,NULL,0.00,0.00,6,'2026-07-18 06:33:22','2026-07-18 06:34:35'),(68,'Third Party Inspection and ROB Survey','','Active',39,1,'Medium',NULL,NULL,0,'2026-11-14 08:00:00','2026-11-20 17:00:00',NULL,NULL,0.00,0.00,5,'2026-07-19 06:33:22','2026-07-19 06:34:35'),(69,'Preparation of ITT/BEC/GCC/SCC/SOR','','Active',68,1,'Medium',NULL,NULL,0,'2026-05-09 08:00:00','2026-12-25 17:00:00',NULL,NULL,0.00,0.00,1,'2026-07-20 06:33:22','2026-07-20 06:34:35'),(70,'Preparation of SOW','','Active',68,1,'Medium',NULL,NULL,0,'2026-05-09 08:00:00','2026-05-16 17:00:00',NULL,NULL,0.00,0.00,2,'2026-07-21 06:33:22','2026-07-21 06:34:35'),(71,'Planet One Approval','','Active',68,1,'Medium',NULL,NULL,0,'2026-09-11 08:00:00','2026-10-15 17:00:00',NULL,NULL,0.00,0.00,3,'2026-07-22 06:33:22','2026-07-22 06:34:35'),(72,'Issue NIT (e-tender) & bid Submission','','Active',68,1,'Medium',NULL,NULL,0,'2026-10-15 08:00:00','2026-10-16 17:00:00',NULL,NULL,0.00,0.00,4,'2026-07-23 06:33:22','2026-07-23 06:34:35'),(73,'Techno-Commercial Evaluation of Bids','','Active',68,1,'Medium',NULL,NULL,0,'2026-10-17 08:00:00','2026-11-20 17:00:00',NULL,NULL,0.00,0.00,5,'2026-07-24 06:33:22','2026-07-24 06:34:35'),(74,'Contract Award','','Active',68,1,'Medium',NULL,NULL,0,'2026-11-21 08:00:00','2026-12-18 17:00:00',NULL,NULL,0.00,0.00,6,'2026-07-25 06:33:22','2026-07-25 06:34:35');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocks`
--

LOCK TABLES `blocks` WRITE;
/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT INTO `blocks` VALUES (1,'Deep Water','Deep Water Block','Active','Antira Engineering','Exploration','Aston','Ghana','2026-05-28 04:20:25','2026-05-28 04:20:25');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;
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
  `activityId` int NOT NULL,
  `userId` int NOT NULL,
  `departmentId` int NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activityId` (`activityId`),
  KEY `userId` (`userId`),
  KEY `departmentId` (`departmentId`),
  CONSTRAINT `comments_ibfk_46` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_47` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_48` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,'Test Comment',7,1,1,'2026-05-28 07:30:15','2026-05-28 07:30:15');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Executive Management',NULL),(2,'Procurement',NULL),(3,'Accounts',NULL),(4,'Operations',NULL),(5,'Finance & Accounts',NULL),(6,'HSE',NULL),(7,'Commercial',NULL),(8,'HR',NULL);
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
  `status` enum('Approved','Review','Rejected') COLLATE utf8mb4_general_ci DEFAULT 'Review',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `licenceId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activityId` (`activityId`),
  KEY `rootDocumentId` (`rootDocumentId`),
  KEY `projectId` (`projectId`),
  KEY `fk_documents_licence` (`licenceId`),
  CONSTRAINT `documents_ibfk_46` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`),
  CONSTRAINT `documents_ibfk_47` FOREIGN KEY (`rootDocumentId`) REFERENCES `documents` (`id`),
  CONSTRAINT `documents_ibfk_48` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_documents_licence` FOREIGN KEY (`licenceId`) REFERENCES `licences` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'test doc','','Rahul Rahul',25,'[25]','CodeEdit.pdf','deep-water/dwtcp/preparation-of-ittbecgccsccsor/1780310010560-CodeEdit.pdf','application/pdf',80949,NULL,1,1,'Technical','2026-06-01 10:33:30','Review','2026-06-01 10:33:30','2026-06-01 10:33:30',NULL),(2,'test 2','','Prashant Singh',49,'[49]','GODigETenderingUserGuide (2).pdf','deep-water/dwtcp/preparation-of-sow/1780314637375-GODigETenderingUserGuide__2_.pdf','application/pdf',2421865,NULL,1,1,'HSE','2026-06-01 11:50:37','Review','2026-06-01 11:50:38','2026-06-01 11:50:38',NULL),(3,'Farmin Agreement Executed_6 Dec 2023','','Prashant Singh',NULL,'[]','Farmin Agreement Executed_6 Dec 2023.pdf','general/general/general/1782467943248-Farmin_Agreement_Executed_6_Dec_2023.pdf','application/pdf',20902234,NULL,1,NULL,'Finance','2026-06-26 09:59:06','Review','2026-06-26 09:59:06','2026-06-26 10:04:50',NULL),(4,'Final DWTCP Budget 2026_','','Prashant Singh',NULL,NULL,'Final DWTCP Budget 2026_.pdf','general/general/general/1782467974256-Final_DWTCP_Budget_2026_.pdf','application/pdf',180821,NULL,1,NULL,'Technical','2026-06-26 09:59:34','Review','2026-06-26 09:59:34','2026-06-26 09:59:34',NULL),(5,'GOIL PA ocr','','Prashant Singh',NULL,NULL,'GOIL PA ocr.pdf','general/general/general/1782468027393-GOIL_PA_ocr.pdf','application/pdf',24728253,NULL,1,NULL,'Technical','2026-06-26 10:00:30','Review','2026-06-26 10:00:30','2026-06-26 10:00:30',NULL),(6,'JMC RESOLUTION Nov 2025','','Prashant Singh',NULL,NULL,'JMC RESOLUTION Nov 2025.pdf','deep-water/dwtcp/general/1782468065915-JMC_RESOLUTION_Nov_2025.pdf','application/pdf',130832,NULL,1,1,'Technical','2026-06-26 10:01:06','Review','2026-06-26 10:01:06','2026-06-26 10:01:06',NULL),(7,'JOA Executed_6th Dec 2023','','Prashant Singh',NULL,NULL,'JOA Executed_6th Dec 2023 1.pdf','deep-water/dwtcp/general/1782468100185-JOA_Executed_6th_Dec_2023_1.pdf','application/pdf',20370274,NULL,1,1,'Technical','2026-06-26 10:01:43','Review','2026-06-26 10:01:43','2026-06-26 10:01:43',NULL),(8,'PE118_Well Name','','Prashant Singh',NULL,NULL,'PE118_Well Name.pdf','deep-water/dwtcp/general/1782468133804-PE118_Well_Name.pdf','application/pdf',489817,NULL,1,1,'Technical','2026-06-26 10:02:15','Review','2026-06-26 10:02:15','2026-06-26 10:02:15',NULL),(9,'PE119_IEP Extension','','Prashant Singh',NULL,NULL,'PE119_IEP Extension.pdf','deep-water/dwtcp/general/1782468275303-PE119_IEP_Extension.pdf','application/pdf',584370,NULL,1,1,'Legal','2026-06-26 10:04:36','Review','2026-06-26 10:04:36','2026-06-26 10:04:36',NULL);
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
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
  `status` enum('Pending','Under Review','Approved','Paid','Rejected') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Pending',
  `invoiceNumber` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `afeNumber` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transactionDetails` text COLLATE utf8mb4_general_ci,
  `transactionDate` datetime DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `delegatedTo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'The name or department currently holding responsibility',
  `delegationHistory` json DEFAULT NULL COMMENT 'Append-only log of delegation actions (Delegated, Approved, Rejected)',
  PRIMARY KEY (`id`),
  KEY `activityId` (`activityId`),
  CONSTRAINT `finances_ibfk_1` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finances`
--

LOCK TABLES `finances` WRITE;
/*!40000 ALTER TABLE `finances` DISABLE KEYS */;
INSERT INTO `finances` VALUES (1,'test ',23456.00,'aksd','Expense','AFE',16,'Procurement','Approved',NULL,NULL,NULL,NULL,NULL,'2026-05-31 17:49:09','2026-06-01 03:52:57',NULL,NULL),(2,'test 2 afe',23443.00,'unknown','Expense','AFE',8,'Procurement','Pending',NULL,'DWTCP-DRILL-001',NULL,NULL,NULL,'2026-06-01 10:48:04','2026-06-01 10:48:04',NULL,NULL),(3,'twreeqrg  hgffgh',2344233.00,'well head','Expense','AFE',6,'Operations','Pending',NULL,'DWTCP-WELLH-001',NULL,NULL,NULL,'2026-06-01 10:49:50','2026-06-01 10:49:50',NULL,NULL),(4,'2nd wellhead test',54656.00,'trtrw','Expense','AFE',6,'Procurement','Pending',NULL,'DWTCP-WELLH-002',NULL,NULL,NULL,'2026-06-01 10:50:20','2026-06-01 10:50:20',NULL,NULL);
/*!40000 ALTER TABLE `finances` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licences`
--

LOCK TABLES `licences` WRITE;
/*!40000 ALTER TABLE `licences` DISABLE KEYS */;
/*!40000 ALTER TABLE `licences` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'DWTCP','Deep Water Project','In Progress',1,'Deep Water','Kallole Ghosh',0.00,0.00,0,'2025-04-01 00:00:00','2027-12-31 00:00:00','2026-05-28 04:21:25','2026-05-28 04:21:25');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registers`
--

LOCK TABLES `registers` WRITE;
/*!40000 ALTER TABLE `registers` DISABLE KEYS */;
/*!40000 ALTER TABLE `registers` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `projectId` (`projectId`),
  CONSTRAINT `risks_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `risks`
--

LOCK TABLES `risks` WRITE;
/*!40000 ALTER TABLE `risks` DISABLE KEYS */;
/*!40000 ALTER TABLE `risks` ENABLE KEYS */;
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
  `status` enum('Not Started','In Progress','Completed','Blocked') DEFAULT 'Not Started',
  `priority` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  `dueDate` datetime DEFAULT NULL,
  `assignedToId` int DEFAULT NULL,
  `assignedById` int DEFAULT NULL,
  `relatedType` enum('Activity','Workflow','Document','Project','General') DEFAULT 'General',
  `relatedId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `assignedToId` (`assignedToId`),
  KEY `assignedById` (`assignedById`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`assignedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,'Download Query List OTCG','Share the query list with Sunil Sir and Prashant Sir','Not Started','High','2026-05-31 00:00:00',2,2,'General',NULL,'2026-06-09 09:00:14','2026-06-09 09:00:14'),(2,'Upload Query Response Submission','','Not Started','Medium','2026-06-03 00:00:00',2,2,'General',NULL,'2026-06-09 09:23:11','2026-06-09 09:23:11'),(3,'TEST TASK 1','TASK 1 DESCRIPTION ','In Progress','Medium','2026-06-30 00:00:00',1,1,'General',NULL,'2026-06-26 09:54:56','2026-06-26 09:55:09');
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
  `role` enum('Admin','Manager','User') COLLATE utf8mb4_general_ci DEFAULT 'User',
  `active` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
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
  KEY `departmentId` (`departmentId`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Prashant','psingh@planetone-group.com','$2a$10$FmUAMQBVI6J27aEJP97wluJcxV87K2lHPzcwmHk5rOkIAMXA5LTSy','Prashant','Singh',4,'Manager',1,'2026-05-28 04:19:30','2026-05-28 04:19:30'),(2,'Yash Vardhan','yash.vardhan@enquest.co.in','$2a$10$/D2Z.23VuGcIlfT6KOpcDuonZdImfkKNyY0oFv8ghfTecPFUm390a','Yash Vardhan','Varshney',2,'Manager',1,'2026-05-31 10:14:02','2026-05-31 10:14:02'),(3,'Rahul','rahul@planetone-group.com','$2a$10$91L3vuSCKDa8KQuHXq2Muuaf9.LeF4ITfSjlRkEU8UZ/lYtp/Xn76','Rahul','',5,'Manager',1,'2026-05-31 10:15:01','2026-05-31 10:15:01');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflows`
--

LOCK TABLES `workflows` WRITE;
/*!40000 ALTER TABLE `workflows` DISABLE KEYS */;
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

-- Dump completed on 2026-07-04 21:32:36

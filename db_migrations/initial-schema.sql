-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: doritobot
-- ------------------------------------------------------
-- Server version	11.7.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `banned_users`
--

DROP TABLE IF EXISTS `banned_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banned_users` (
  `guild_id` varchar(100) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `banned_until` timestamp NOT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guild_settings`
--

DROP TABLE IF EXISTS `guild_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_settings` (
  `guild_id` varchar(100) NOT NULL,
  `logging` tinyint(1) NOT NULL DEFAULT 0,
  `moderation` tinyint(1) NOT NULL DEFAULT 1,
  `utility` tinyint(1) NOT NULL DEFAULT 1,
  `fun` tinyint(1) NOT NULL DEFAULT 1,
  `leveling` tinyint(1) NOT NULL DEFAULT 0,
  `botonly_logging` tinyint(1) NOT NULL DEFAULT 1,
  `modlog_channel` varchar(100) DEFAULT NULL,
  `no_xp_channels` longtext DEFAULT NULL,
  `cmd_channel` varchar(100) DEFAULT NULL,
  `restrict_cmds` tinyint(1) NOT NULL DEFAULT 0,
  `level_rewards` longtext DEFAULT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `levels`
--

DROP TABLE IF EXISTS `levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `levels` (
  `guild_id` varchar(100) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `xp` int(10) unsigned NOT NULL DEFAULT 0,
  `level` int(10) unsigned NOT NULL DEFAULT 0,
  UNIQUE KEY `guild_id` (`guild_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `snippet_triggers`
--

DROP TABLE IF EXISTS `snippet_triggers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `snippet_triggers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(100) NOT NULL,
  `channels` longtext DEFAULT NULL,
  `snippet_id` int(11) DEFAULT NULL,
  `trigger` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_guild_trigger` (`guild_id`,`trigger`,`snippet_id`),
  KEY `fk_snippet_id` (`snippet_id`),
  CONSTRAINT `fk_guild_i` FOREIGN KEY (`guild_id`) REFERENCES `snippets` (`guild_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_snippet_id` FOREIGN KEY (`snippet_id`) REFERENCES `snippets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `snippets`
--

DROP TABLE IF EXISTS `snippets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `snippets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(100) NOT NULL,
  `author_id` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `content` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_guild_snippet` (`guild_id`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `warnings`
--

DROP TABLE IF EXISTS `warnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warnings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(100) NOT NULL,
  `mod_id` varchar(100) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `reason` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'doritobot'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-24 18:15:34

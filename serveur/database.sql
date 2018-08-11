SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `chouettes` (
  `chouette_id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `chouette_name` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `current_back_user` smallint(5) unsigned NOT NULL,
  `last_update` datetime NOT NULL,
  PRIMARY KEY (`chouette_id`),
  KEY `current_back_user` (`current_back_user`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=2 ;

CREATE TABLE IF NOT EXISTS `log_webservices` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `back_user_id` smallint(5) unsigned NOT NULL,
  `action` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1597501 ;

CREATE TABLE IF NOT EXISTS `users` (
  `back_user_id` smallint(5) unsigned NOT NULL,
  `name` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `last_update` datetime NOT NULL,
  PRIMARY KEY (`back_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
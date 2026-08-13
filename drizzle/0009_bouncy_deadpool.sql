CREATE TABLE `officialSourceCatalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`title` varchar(260) NOT NULL,
	`issuer` varchar(180) NOT NULL,
	`sourceType` enum('norma','orientacao_tecnica') NOT NULL,
	`jurisdiction` varchar(140) NOT NULL,
	`authorityLevel` enum('federal','estadual','municipal','setorial','outro') NOT NULL,
	`identifier` varchar(180) NOT NULL,
	`sourceVersionLabel` varchar(80),
	`sourceUrl` varchar(700) NOT NULL,
	`catalogScope` text NOT NULL,
	`importLimitNote` text NOT NULL,
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`validationStatus` enum('verificada','arquivada') NOT NULL DEFAULT 'verificada',
	`lastValidatedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `officialSourceCatalog_id` PRIMARY KEY(`id`),
	CONSTRAINT `official_catalog_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `official_catalog_identifier_unique` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `organizationOfficialSourceImports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`catalogSourceId` int NOT NULL,
	`requirementSourceId` int NOT NULL,
	`scopeConfirmation` text NOT NULL,
	`status` enum('importada','em_revisao','confirmada','arquivada') NOT NULL DEFAULT 'importada',
	`importedByUserId` int NOT NULL,
	`confirmedByUserId` int,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationOfficialSourceImports_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_catalog_import_unique` UNIQUE(`organizationId`,`catalogSourceId`),
	CONSTRAINT `organization_import_source_unique` UNIQUE(`requirementSourceId`)
);
--> statement-breakpoint
ALTER TABLE `organizationOfficialSourceImports` ADD CONSTRAINT `organization_catalog_import_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationOfficialSourceImports` ADD CONSTRAINT `organization_catalog_import_catalog_fk` FOREIGN KEY (`catalogSourceId`) REFERENCES `officialSourceCatalog`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationOfficialSourceImports` ADD CONSTRAINT `organization_catalog_import_source_fk` FOREIGN KEY (`requirementSourceId`) REFERENCES `requirementSources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationOfficialSourceImports` ADD CONSTRAINT `organization_catalog_import_user_fk` FOREIGN KEY (`importedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationOfficialSourceImports` ADD CONSTRAINT `organization_catalog_import_confirmer_fk` FOREIGN KEY (`confirmedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `official_catalog_status_idx` ON `officialSourceCatalog` (`validationStatus`,`authorityLevel`);--> statement-breakpoint
CREATE INDEX `organization_catalog_import_status_idx` ON `organizationOfficialSourceImports` (`organizationId`,`status`);
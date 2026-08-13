CREATE TABLE `organizationOnboarding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`sourceCatalogReady` boolean NOT NULL DEFAULT false,
	`assetContextReady` boolean NOT NULL DEFAULT false,
	`evidencePackageReady` boolean NOT NULL DEFAULT false,
	`technicalReviewReady` boolean NOT NULL DEFAULT false,
	`currentStep` enum('fontes','ativo','evidencias','revisao') NOT NULL DEFAULT 'fontes',
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationOnboarding_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_onboarding_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `requirementSourceConflicts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`primarySourceId` int NOT NULL,
	`conflictingSourceId` int NOT NULL,
	`conflictTopic` varchar(260) NOT NULL,
	`hierarchyNote` text NOT NULL,
	`status` enum('pendente_revisao','resolvido','nao_aplicavel') NOT NULL DEFAULT 'pendente_revisao',
	`resolutionRationale` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirementSourceConflicts_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_conflict_unique_pair` UNIQUE(`organizationId`,`primarySourceId`,`conflictingSourceId`)
);
--> statement-breakpoint
ALTER TABLE `requirementSources` ADD `jurisdiction` varchar(140);--> statement-breakpoint
ALTER TABLE `requirementSources` ADD `authorityLevel` enum('federal','estadual','municipal','setorial','organizacional','outro') DEFAULT 'outro' NOT NULL;--> statement-breakpoint
ALTER TABLE `requirementSources` ADD `officialOriginStatus` enum('oficial','documento_organizacao','pendente') DEFAULT 'pendente' NOT NULL;--> statement-breakpoint
ALTER TABLE `requirementSources` ADD `sourceVersionLabel` varchar(80);--> statement-breakpoint
ALTER TABLE `requirementVersions` ADD `sourceLocator` varchar(220) NOT NULL;--> statement-breakpoint
ALTER TABLE `requirements` ADD `applicabilityCriteria` text NOT NULL;--> statement-breakpoint
ALTER TABLE `requirements` ADD `applicabilityStatus` enum('pendente_revisao_tecnica','aplicavel_confirmada','nao_aplicavel') DEFAULT 'pendente_revisao_tecnica' NOT NULL;--> statement-breakpoint
ALTER TABLE `requirements` ADD `recurrenceLabel` varchar(120);--> statement-breakpoint
ALTER TABLE `requirements` ADD `expectedEvidenceDescription` text;--> statement-breakpoint
ALTER TABLE `organizationOnboarding` ADD CONSTRAINT `onboarding_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationOnboarding` ADD CONSTRAINT `onboarding_user_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSourceConflicts` ADD CONSTRAINT `source_conflict_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSourceConflicts` ADD CONSTRAINT `source_conflict_primary_source_fk` FOREIGN KEY (`primarySourceId`) REFERENCES `requirementSources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSourceConflicts` ADD CONSTRAINT `source_conflict_conflicting_source_fk` FOREIGN KEY (`conflictingSourceId`) REFERENCES `requirementSources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSourceConflicts` ADD CONSTRAINT `source_conflict_reviewer_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSourceConflicts` ADD CONSTRAINT `source_conflict_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `source_conflict_org_status_idx` ON `requirementSourceConflicts` (`organizationId`,`status`);
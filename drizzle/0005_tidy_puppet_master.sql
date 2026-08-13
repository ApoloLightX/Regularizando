CREATE TABLE `obligationDecisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`obligationId` int NOT NULL,
	`requirementVersionId` int NOT NULL,
	`decision` enum('cumprida','nao_cumprida','nao_aplicavel','requer_revisao') NOT NULL,
	`rationale` text NOT NULL,
	`decidedByUserId` int NOT NULL,
	`decidedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationDecisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obligationEvidenceLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`obligationId` int NOT NULL,
	`evidenceId` int NOT NULL,
	`evidenceRole` enum('comprovacao','fonte','complemento') NOT NULL DEFAULT 'comprovacao',
	`linkedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationEvidenceLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `obligation_evidence_unique` UNIQUE(`obligationId`,`evidenceId`)
);
--> statement-breakpoint
CREATE TABLE `obligationInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`requirementVersionId` int NOT NULL,
	`siteId` int,
	`licenseId` int,
	`scopeJustification` text NOT NULL,
	`dueDate` timestamp,
	`responsibleUserId` int,
	`status` enum('pendente_validacao','aberta','em_andamento','aguardando_revisao','cumprida','nao_aplicavel') NOT NULL DEFAULT 'pendente_validacao',
	`evidenceStatus` enum('ausente','enviada','verificada','rejeitada') NOT NULL DEFAULT 'ausente',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obligationInstances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirementSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`title` varchar(260) NOT NULL,
	`issuer` varchar(180) NOT NULL,
	`sourceType` enum('norma','licenca','condicionante','termo_referencia','oficio','orientacao_tecnica','outro') NOT NULL,
	`identifier` varchar(180) NOT NULL,
	`sourceUrl` varchar(700),
	`publicationDate` timestamp,
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`verificationStatus` enum('rascunho','em_revisao','verificada','arquivada') NOT NULL DEFAULT 'rascunho',
	`verifiedByUserId` int,
	`verifiedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirementSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `requirement_source_org_identifier_unique` UNIQUE(`organizationId`,`identifier`)
);
--> statement-breakpoint
CREATE TABLE `requirementVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`requirementId` int NOT NULL,
	`versionLabel` varchar(48) NOT NULL,
	`sourceExcerpt` text NOT NULL,
	`interpretationNotes` text,
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`reviewStatus` enum('rascunho','em_revisao','verificada','obsoleta') NOT NULL DEFAULT 'rascunho',
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirementVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `requirement_version_unique` UNIQUE(`requirementId`,`versionLabel`)
);
--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`sourceId` int NOT NULL,
	`sectorProfileId` int,
	`code` varchar(100) NOT NULL,
	`title` varchar(260) NOT NULL,
	`applicabilityScope` text NOT NULL,
	`status` enum('rascunho','em_revisao','ativo','arquivado') NOT NULL DEFAULT 'rascunho',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `requirement_org_code_unique` UNIQUE(`organizationId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `sectorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`sector` enum('telecom','infraestrutura','industria','consultoria','outro') NOT NULL,
	`name` varchar(160) NOT NULL,
	`versionLabel` varchar(48) NOT NULL,
	`scopeDescription` text NOT NULL,
	`status` enum('rascunho','ativo','arquivado') NOT NULL DEFAULT 'rascunho',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sectorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `sector_profile_org_version_unique` UNIQUE(`organizationId`,`sector`,`versionLabel`)
);
--> statement-breakpoint
ALTER TABLE `obligationDecisions` ADD CONSTRAINT `obligation_decision_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationDecisions` ADD CONSTRAINT `obligation_decision_obligation_fk` FOREIGN KEY (`obligationId`) REFERENCES `obligationInstances`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationDecisions` ADD CONSTRAINT `obligation_decision_version_fk` FOREIGN KEY (`requirementVersionId`) REFERENCES `requirementVersions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationDecisions` ADD CONSTRAINT `obligation_decision_user_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationEvidenceLinks` ADD CONSTRAINT `obligation_evidence_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationEvidenceLinks` ADD CONSTRAINT `obligation_evidence_obligation_fk` FOREIGN KEY (`obligationId`) REFERENCES `obligationInstances`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationEvidenceLinks` ADD CONSTRAINT `obligation_evidence_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `evidences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationEvidenceLinks` ADD CONSTRAINT `obligation_evidence_linker_fk` FOREIGN KEY (`linkedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationInstances` ADD CONSTRAINT `obligation_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationInstances` ADD CONSTRAINT `obligation_requirement_version_fk` FOREIGN KEY (`requirementVersionId`) REFERENCES `requirementVersions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationInstances` ADD CONSTRAINT `obligation_site_fk` FOREIGN KEY (`siteId`) REFERENCES `sites`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationInstances` ADD CONSTRAINT `obligation_license_fk` FOREIGN KEY (`licenseId`) REFERENCES `licenses`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationInstances` ADD CONSTRAINT `obligation_responsible_fk` FOREIGN KEY (`responsibleUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationInstances` ADD CONSTRAINT `obligation_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSources` ADD CONSTRAINT `requirement_source_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSources` ADD CONSTRAINT `requirement_source_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementSources` ADD CONSTRAINT `requirement_source_verifier_fk` FOREIGN KEY (`verifiedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementVersions` ADD CONSTRAINT `requirement_version_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementVersions` ADD CONSTRAINT `requirement_version_requirement_fk` FOREIGN KEY (`requirementId`) REFERENCES `requirements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementVersions` ADD CONSTRAINT `requirement_version_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirementVersions` ADD CONSTRAINT `requirement_version_reviewer_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirements` ADD CONSTRAINT `requirement_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirements` ADD CONSTRAINT `requirement_source_fk` FOREIGN KEY (`sourceId`) REFERENCES `requirementSources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirements` ADD CONSTRAINT `requirement_profile_fk` FOREIGN KEY (`sectorProfileId`) REFERENCES `sectorProfiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirements` ADD CONSTRAINT `requirement_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sectorProfiles` ADD CONSTRAINT `sector_profile_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sectorProfiles` ADD CONSTRAINT `sector_profile_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `obligation_decision_org_idx` ON `obligationDecisions` (`organizationId`,`decidedAt`);--> statement-breakpoint
CREATE INDEX `obligation_evidence_org_idx` ON `obligationEvidenceLinks` (`organizationId`);--> statement-breakpoint
CREATE INDEX `obligation_org_status_due_idx` ON `obligationInstances` (`organizationId`,`status`,`dueDate`);--> statement-breakpoint
CREATE INDEX `obligation_requirement_version_idx` ON `obligationInstances` (`requirementVersionId`);--> statement-breakpoint
CREATE INDEX `requirement_source_org_status_idx` ON `requirementSources` (`organizationId`,`verificationStatus`);--> statement-breakpoint
CREATE INDEX `requirement_version_org_status_idx` ON `requirementVersions` (`organizationId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `requirement_org_status_idx` ON `requirements` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `requirement_source_idx` ON `requirements` (`sourceId`);--> statement-breakpoint
CREATE INDEX `sector_profile_org_status_idx` ON `sectorProfiles` (`organizationId`,`status`);
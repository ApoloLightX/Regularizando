CREATE TABLE `publicValidationCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`title` varchar(260) NOT NULL,
	`purpose` text NOT NULL,
	`classification` enum('caso_publico_validacao_tecnica') NOT NULL DEFAULT 'caso_publico_validacao_tecnica',
	`status` enum('ativo','arquivado') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicValidationCases_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_validation_case_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `publicValidationFindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`conditionCode` varchar(96) NOT NULL,
	`sourceLocator` varchar(220) NOT NULL,
	`sourceExcerpt` text NOT NULL,
	`structuredObligation` text NOT NULL,
	`dueText` varchar(240),
	`recurrenceLabel` varchar(120),
	`expectedEvidenceDescription` text,
	`evidenceBasis` enum('expressa_na_fonte','nao_identificada_na_fonte') NOT NULL DEFAULT 'nao_identificada_na_fonte',
	`applicabilityStatus` enum('pendente_revisao_tecnica') NOT NULL DEFAULT 'pendente_revisao_tecnica',
	`reviewStatus` enum('pendente_revisao_humana','aprovada','corrigida','rejeitada','solicitada_revisao') NOT NULL DEFAULT 'pendente_revisao_humana',
	`extractionConfidence` enum('texto_verificado','ocr_exige_conferencia_visual') NOT NULL,
	`reviewRationale` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicValidationFindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_validation_finding_source_condition_unique` UNIQUE(`sourceId`,`conditionCode`)
);
--> statement-breakpoint
CREATE TABLE `publicValidationSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`slug` varchar(140) NOT NULL,
	`title` varchar(260) NOT NULL,
	`issuer` varchar(180) NOT NULL,
	`documentType` enum('licenca_operacao','orientacao_tecnica') NOT NULL,
	`identifier` varchar(180) NOT NULL,
	`jurisdiction` varchar(140) NOT NULL,
	`sourceUrl` varchar(700) NOT NULL,
	`sourceHash` varchar(128),
	`publicationDate` timestamp,
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`extractionMethod` enum('texto_nativo','ocr','referencia_manual') NOT NULL,
	`sourceQualityStatus` enum('verificada','ocr_exige_conferencia_visual') NOT NULL DEFAULT 'verificada',
	`importedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicValidationSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_validation_source_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `public_validation_case_source_identifier_unique` UNIQUE(`caseId`,`identifier`)
);
--> statement-breakpoint
ALTER TABLE `publicValidationFindings` ADD CONSTRAINT `public_validation_finding_source_fk` FOREIGN KEY (`sourceId`) REFERENCES `publicValidationSources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publicValidationFindings` ADD CONSTRAINT `public_validation_finding_reviewer_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publicValidationSources` ADD CONSTRAINT `public_validation_source_case_fk` FOREIGN KEY (`caseId`) REFERENCES `publicValidationCases`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `public_validation_case_status_idx` ON `publicValidationCases` (`status`);--> statement-breakpoint
CREATE INDEX `public_validation_finding_source_review_idx` ON `publicValidationFindings` (`sourceId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `public_validation_source_case_idx` ON `publicValidationSources` (`caseId`,`documentType`);
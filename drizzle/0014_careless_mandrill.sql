CREATE TABLE `publicValidationRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`findingId` int NOT NULL,
	`code` varchar(140) NOT NULL,
	`title` varchar(260) NOT NULL,
	`applicabilityScope` text NOT NULL,
	`applicabilityCriteria` text NOT NULL,
	`expectedEvidenceDescription` text,
	`applicabilityStatus` enum('pendente_revisao_tecnica') NOT NULL DEFAULT 'pendente_revisao_tecnica',
	`status` enum('rascunho','em_revisao','verificado','arquivado') NOT NULL DEFAULT 'em_revisao',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicValidationRequirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_validation_requirement_finding_unique` UNIQUE(`findingId`),
	CONSTRAINT `public_validation_requirement_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `publicValidationRequirements` ADD CONSTRAINT `public_validation_requirement_finding_fk` FOREIGN KEY (`findingId`) REFERENCES `publicValidationFindings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `public_validation_requirement_status_idx` ON `publicValidationRequirements` (`status`,`applicabilityStatus`);
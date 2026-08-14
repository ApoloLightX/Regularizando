CREATE TABLE `dataRetentionPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`dataCategory` enum('evidencia','lead','auditoria','conta','operacional') NOT NULL,
	`retentionDays` int,
	`legalBasisNote` text NOT NULL,
	`disposalMethod` enum('revisao_manual','anonimizacao_revisada','exclusao_revisada') NOT NULL DEFAULT 'revisao_manual',
	`status` enum('rascunho','em_revisao','ativa','substituida') NOT NULL DEFAULT 'rascunho',
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataRetentionPolicies_id` PRIMARY KEY(`id`),
	CONSTRAINT `retention_policy_org_category_unique` UNIQUE(`organizationId`,`dataCategory`)
);
--> statement-breakpoint
CREATE TABLE `dataSubjectRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`subjectReferenceHash` varchar(64) NOT NULL,
	`requestType` enum('acesso','exportacao','correcao','eliminacao','anonimizacao','oposicao') NOT NULL,
	`status` enum('recebida','em_revisao','aguardando_controlador','atendida','recusada','cancelada') NOT NULL DEFAULT 'recebida',
	`scopeNote` text NOT NULL,
	`decisionRationale` text,
	`handledByUserId` int,
	`handledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataSubjectRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD CONSTRAINT `retention_policy_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicies` ADD CONSTRAINT `retention_policy_approver_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD CONSTRAINT `subject_request_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD CONSTRAINT `subject_request_handler_fk` FOREIGN KEY (`handledByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `retention_policy_org_status_idx` ON `dataRetentionPolicies` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `subject_request_org_status_idx` ON `dataSubjectRequests` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `subject_request_reference_idx` ON `dataSubjectRequests` (`subjectReferenceHash`,`createdAt`);
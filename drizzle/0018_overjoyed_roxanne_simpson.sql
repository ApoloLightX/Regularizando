CREATE TABLE `dataRetentionPolicyVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyId` int NOT NULL,
	`organizationId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`dataCategory` enum('evidencia','lead','auditoria','conta','operacional') NOT NULL,
	`retentionDays` int,
	`legalBasisNote` text NOT NULL,
	`disposalMethod` enum('revisao_manual','anonimizacao_revisada','exclusao_revisada') NOT NULL,
	`status` enum('rascunho','em_revisao','ativa','substituida') NOT NULL,
	`recordedByUserId` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataRetentionPolicyVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `retention_policy_version_unique` UNIQUE(`policyId`,`versionNumber`)
);
--> statement-breakpoint
ALTER TABLE `dataRetentionPolicyVersions` ADD CONSTRAINT `retention_policy_version_policy_fk` FOREIGN KEY (`policyId`) REFERENCES `dataRetentionPolicies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicyVersions` ADD CONSTRAINT `retention_policy_version_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataRetentionPolicyVersions` ADD CONSTRAINT `retention_policy_version_recorder_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `retention_policy_version_org_idx` ON `dataRetentionPolicyVersions` (`organizationId`,`dataCategory`,`recordedAt`);
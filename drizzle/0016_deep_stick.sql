CREATE TABLE `rateLimitBuckets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bucketKey` varchar(128) NOT NULL,
	`scope` varchar(40) NOT NULL,
	`windowStart` timestamp NOT NULL,
	`requestCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rateLimitBuckets_id` PRIMARY KEY(`id`),
	CONSTRAINT `rateLimitBuckets_bucketKey_unique` UNIQUE(`bucketKey`)
);
--> statement-breakpoint
ALTER TABLE `evidences` ADD `observedMimeType` varchar(120);--> statement-breakpoint
ALTER TABLE `evidences` ADD `sha256` varchar(64);--> statement-breakpoint
ALTER TABLE `evidences` ADD `quarantineStatus` enum('uploaded','quarantined_unscanned','validated','approved_for_processing','blocked') DEFAULT 'uploaded' NOT NULL;--> statement-breakpoint
ALTER TABLE `evidences` ADD `structuralValidationStatus` enum('pendente','aprovada','rejeitada') DEFAULT 'pendente' NOT NULL;--> statement-breakpoint
ALTER TABLE `evidences` ADD `quarantineNote` varchar(500);--> statement-breakpoint
ALTER TABLE `evidences` ADD `processingAuthorizedByUserId` int;--> statement-breakpoint
ALTER TABLE `evidences` ADD `processingAuthorizedAt` timestamp;--> statement-breakpoint
CREATE INDEX `rate_limit_expiry_idx` ON `rateLimitBuckets` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `rate_limit_scope_expiry_idx` ON `rateLimitBuckets` (`scope`,`expiresAt`);--> statement-breakpoint
ALTER TABLE `evidences` ADD CONSTRAINT `evidence_processing_authorizer_fk` FOREIGN KEY (`processingAuthorizedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `evidence_quarantine_idx` ON `evidences` (`organizationId`,`quarantineStatus`);
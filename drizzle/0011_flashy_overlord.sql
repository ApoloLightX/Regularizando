CREATE TABLE `governanceMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`milestoneId` varchar(64) NOT NULL,
	`milestoneKey` varchar(128) NOT NULL,
	`milestoneType` enum('checkpoint','publication','security_review','schema_change','operational_review') NOT NULL,
	`sourceReference` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`scope` text,
	`occurredAt` timestamp NOT NULL,
	`syncStatus` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
	`syncAttempts` int NOT NULL DEFAULT 0,
	`nextAttemptAt` timestamp,
	`lastErrorCode` varchar(120),
	`syncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governanceMilestones_id` PRIMARY KEY(`id`),
	CONSTRAINT `governanceMilestones_milestoneId_unique` UNIQUE(`milestoneId`),
	CONSTRAINT `governanceMilestones_milestoneKey_unique` UNIQUE(`milestoneKey`)
);
--> statement-breakpoint
CREATE TABLE `governanceSyncControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`controlKey` varchar(96) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `governanceSyncControls_id` PRIMARY KEY(`id`),
	CONSTRAINT `governanceSyncControls_controlKey_unique` UNIQUE(`controlKey`)
);
--> statement-breakpoint
CREATE TABLE `governanceSyncEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(64) NOT NULL,
	`sourceEventKey` varchar(128) NOT NULL,
	`category` enum('site','authentication','cybersecurity','lead','data_governance','release','integration','operational') NOT NULL,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(96) NOT NULL,
	`entityId` varchar(96),
	`organizationId` int,
	`actorUserId` int,
	`metadata` text,
	`occurredAt` timestamp NOT NULL,
	`syncStatus` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
	`syncAttempts` int NOT NULL DEFAULT 0,
	`nextAttemptAt` timestamp,
	`lastErrorCode` varchar(120),
	`syncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governanceSyncEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `governanceSyncEvents_eventId_unique` UNIQUE(`eventId`),
	CONSTRAINT `governanceSyncEvents_sourceEventKey_unique` UNIQUE(`sourceEventKey`)
);
--> statement-breakpoint
ALTER TABLE `governanceSyncEvents` ADD CONSTRAINT `governance_sync_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `governanceSyncEvents` ADD CONSTRAINT `governance_sync_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `governance_milestone_pending_idx` ON `governanceMilestones` (`syncStatus`,`nextAttemptAt`);--> statement-breakpoint
CREATE INDEX `governance_milestone_occurred_idx` ON `governanceMilestones` (`occurredAt`);--> statement-breakpoint
CREATE INDEX `governance_sync_pending_idx` ON `governanceSyncEvents` (`syncStatus`,`nextAttemptAt`);--> statement-breakpoint
CREATE INDEX `governance_sync_occurred_idx` ON `governanceSyncEvents` (`occurredAt`);--> statement-breakpoint
CREATE INDEX `governance_sync_category_idx` ON `governanceSyncEvents` (`category`,`action`);
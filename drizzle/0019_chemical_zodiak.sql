CREATE TABLE `dataSubjectRequestEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`organizationId` int NOT NULL,
	`eventType` enum('evidencia','nota','decisao') NOT NULL,
	`evidenceReference` varchar(500),
	`note` text NOT NULL,
	`recordedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataSubjectRequestEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dataSubjectRequestEvents` ADD CONSTRAINT `subject_request_event_request_fk` FOREIGN KEY (`requestId`) REFERENCES `dataSubjectRequests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataSubjectRequestEvents` ADD CONSTRAINT `subject_request_event_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataSubjectRequestEvents` ADD CONSTRAINT `subject_request_event_recorder_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subject_request_event_request_idx` ON `dataSubjectRequestEvents` (`requestId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `subject_request_event_org_idx` ON `dataSubjectRequestEvents` (`organizationId`,`createdAt`);
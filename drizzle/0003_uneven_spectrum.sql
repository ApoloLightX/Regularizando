CREATE TABLE `pilotRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(180) NOT NULL,
	`role` varchar(120),
	`sector` enum('telecom','infraestrutura','industria','consultoria','outro') NOT NULL,
	`portfolioSize` varchar(80),
	`challenge` text,
	`consentedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilotRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pilot_request_created_idx` ON `pilotRequests` (`createdAt`);--> statement-breakpoint
CREATE INDEX `pilot_request_email_idx` ON `pilotRequests` (`email`);
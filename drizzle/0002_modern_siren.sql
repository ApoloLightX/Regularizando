CREATE TABLE `organizationInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('admin','analyst','reviewer','viewer') NOT NULL DEFAULT 'analyst',
	`tokenHash` varchar(64) NOT NULL,
	`status` enum('pendente','aceito','revogado','expirado') NOT NULL DEFAULT 'pendente',
	`createdByUserId` int NOT NULL,
	`acceptedByUserId` int,
	`acceptedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizationInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizationInvites_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `capaActions` ADD `responsibleUserId` int;--> statement-breakpoint
ALTER TABLE `organizationInvites` ADD CONSTRAINT `invite_organization_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationInvites` ADD CONSTRAINT `invite_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationInvites` ADD CONSTRAINT `invite_acceptor_fk` FOREIGN KEY (`acceptedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `invite_organization_status_idx` ON `organizationInvites` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `invite_email_status_idx` ON `organizationInvites` (`email`,`status`);--> statement-breakpoint
ALTER TABLE `capaActions` ADD CONSTRAINT `capa_responsible_user_fk` FOREIGN KEY (`responsibleUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
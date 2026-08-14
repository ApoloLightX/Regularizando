ALTER TABLE `evidences` ADD `downloadAuthorizedByUserId` int;--> statement-breakpoint
ALTER TABLE `evidences` ADD `downloadAuthorizedAt` timestamp;--> statement-breakpoint
ALTER TABLE `evidences` ADD `downloadAuthorizationNote` varchar(500);--> statement-breakpoint
ALTER TABLE `evidences` ADD CONSTRAINT `evidence_download_authorizer_fk` FOREIGN KEY (`downloadAuthorizedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
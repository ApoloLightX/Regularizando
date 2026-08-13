ALTER TABLE `pilotRequests` ADD `leadOrigin` enum('website','referral','event','partner','outbound','other') DEFAULT 'website' NOT NULL;--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD `qualificationStage` enum('captured','mql','sql','disqualified','converted') DEFAULT 'captured' NOT NULL;--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD `qualifiedByUserId` int;--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD `qualifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD `qualificationNote` varchar(500);--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD CONSTRAINT `pilot_request_qualifier_fk` FOREIGN KEY (`qualifiedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pilot_request_stage_idx` ON `pilotRequests` (`qualificationStage`,`createdAt`);
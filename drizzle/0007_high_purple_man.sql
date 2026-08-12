ALTER TABLE `requirements` ADD `applicabilityReviewNote` text;--> statement-breakpoint
ALTER TABLE `requirements` ADD `applicabilityReviewedByUserId` int;--> statement-breakpoint
ALTER TABLE `requirements` ADD `applicabilityReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `requirements` ADD CONSTRAINT `requirement_applicability_reviewer_fk` FOREIGN KEY (`applicabilityReviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
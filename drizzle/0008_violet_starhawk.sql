ALTER TABLE `requirementVersions` ADD `applicabilityCriteria` text NOT NULL;--> statement-breakpoint
ALTER TABLE `requirementVersions` ADD `recurrenceLabel` varchar(120);--> statement-breakpoint
ALTER TABLE `requirementVersions` ADD `expectedEvidenceDescription` text;

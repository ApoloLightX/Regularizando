CREATE TABLE `capaActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`title` varchar(260) NOT NULL,
	`sourceType` enum('incidente','inspecao','auditoria','condicionante','outro') NOT NULL DEFAULT 'inspecao',
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`status` enum('aberta','em_andamento','aguardando_validacao','concluida') NOT NULL DEFAULT 'aberta',
	`ownerName` varchar(160),
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capaActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`licenseId` int NOT NULL,
	`siteId` int,
	`code` varchar(80),
	`title` varchar(260) NOT NULL,
	`status` enum('em_dia','em_analise','atrasada','bloqueada') NOT NULL DEFAULT 'em_analise',
	`evidenceStatus` enum('ausente','enviada','verificada','rejeitada') NOT NULL DEFAULT 'ausente',
	`ownerName` varchar(160),
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `esgMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`title` varchar(220) NOT NULL,
	`category` enum('ambiental','social','governanca') NOT NULL DEFAULT 'ambiental',
	`value` decimal(14,3) NOT NULL,
	`target` decimal(14,3),
	`unit` varchar(40) NOT NULL,
	`periodLabel` varchar(40) NOT NULL,
	`sourceDescription` varchar(240),
	`status` enum('rascunho','em_revisao','verificado') NOT NULL DEFAULT 'rascunho',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `esgMetrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `esg_metric_org_code_period_unique` UNIQUE(`organizationId`,`code`,`periodLabel`)
);
--> statement-breakpoint
CREATE TABLE `evidences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`entityType` enum('licenca','condicionante','capa','incidente','esg','site','outro') NOT NULL DEFAULT 'outro',
	`entityId` int,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(700) NOT NULL,
	`fileName` varchar(260) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`reviewStatus` enum('enviada','verificada','rejeitada') NOT NULL DEFAULT 'enviada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidences_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidences_fileKey_unique` UNIQUE(`fileKey`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`title` varchar(260) NOT NULL,
	`incidentType` enum('incidente','quase_acidente','condicao_insegura','ambiental') NOT NULL DEFAULT 'quase_acidente',
	`severity` enum('baixa','moderada','alta','critica') NOT NULL DEFAULT 'baixa',
	`status` enum('aberto','em_investigacao','encerrado') NOT NULL DEFAULT 'aberto',
	`occurredAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`siteId` int,
	`title` varchar(220) NOT NULL,
	`licenseType` enum('LP','LI','LO','outorga','autorizacao','outro') NOT NULL DEFAULT 'LO',
	`authority` varchar(160),
	`licenseNumber` varchar(120),
	`status` enum('vigente','em_renovacao','pendente','vencida','suspensa') NOT NULL DEFAULT 'pendente',
	`expiryDate` timestamp,
	`riskLevel` enum('baixo','moderado','alto','critico') NOT NULL DEFAULT 'moderado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `licenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizationMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','analyst','reviewer','viewer') NOT NULL DEFAULT 'analyst',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizationMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_member_unique` UNIQUE(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(96) NOT NULL,
	`sector` enum('telecom','infraestrutura','industria','consultoria','outro') NOT NULL DEFAULT 'telecom',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`code` varchar(80) NOT NULL,
	`city` varchar(100),
	`state` varchar(2),
	`operationalStatus` enum('operacao','implantacao','manutencao','desmobilizado') NOT NULL DEFAULT 'operacao',
	`riskLevel` enum('baixo','moderado','alto','critico') NOT NULL DEFAULT 'moderado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_org_code_unique` UNIQUE(`organizationId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `capa_organization_idx` ON `capaActions` (`organizationId`);--> statement-breakpoint
CREATE INDEX `capa_status_idx` ON `capaActions` (`status`);--> statement-breakpoint
CREATE INDEX `condition_organization_idx` ON `conditions` (`organizationId`);--> statement-breakpoint
CREATE INDEX `condition_license_idx` ON `conditions` (`licenseId`);--> statement-breakpoint
CREATE INDEX `condition_due_idx` ON `conditions` (`dueDate`);--> statement-breakpoint
CREATE INDEX `esg_metric_org_category_idx` ON `esgMetrics` (`organizationId`,`category`);--> statement-breakpoint
CREATE INDEX `evidence_organization_idx` ON `evidences` (`organizationId`);--> statement-breakpoint
CREATE INDEX `evidence_entity_idx` ON `evidences` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `incident_organization_idx` ON `incidents` (`organizationId`);--> statement-breakpoint
CREATE INDEX `incident_occurred_idx` ON `incidents` (`occurredAt`);--> statement-breakpoint
CREATE INDEX `license_organization_idx` ON `licenses` (`organizationId`);--> statement-breakpoint
CREATE INDEX `license_site_idx` ON `licenses` (`siteId`);--> statement-breakpoint
CREATE INDEX `license_expiry_idx` ON `licenses` (`expiryDate`);--> statement-breakpoint
CREATE INDEX `organization_member_user_idx` ON `organizationMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `site_organization_idx` ON `sites` (`organizationId`);
ALTER TABLE `dataSubjectRequestEvents` MODIFY COLUMN `eventType` enum('evidencia','nota','decisao','atribuicao','execucao','encerramento') NOT NULL;--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` MODIFY COLUMN `status` enum('recebida','em_revisao','aguardando_controlador','atendida','recusada','cancelada','nova','em_analise','aguardando_informacoes','aprovada','rejeitada','executada','encerrada') NOT NULL DEFAULT 'nova';--> statement-breakpoint
ALTER TABLE `pilotRequests` MODIFY COLUMN `company` varchar(180);--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD `assignedToUserId` int;--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD `assignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD `executionNote` text;--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD `executedAt` timestamp;--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD `closedAt` timestamp;--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD `requestCategory` enum('pilot','privacy') DEFAULT 'pilot' NOT NULL;--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD `privacyRequestType` enum('acesso','confirmacao_tratamento','correcao','exportacao','eliminacao','anonimizacao','oposicao','duvida');--> statement-breakpoint
ALTER TABLE `pilotRequests` ADD `privacyNoticeVersion` varchar(32);--> statement-breakpoint
ALTER TABLE `dataSubjectRequests` ADD CONSTRAINT `subject_request_assignee_fk` FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`mode` text NOT NULL,
	`assigned_analyst_id` text,
	`handoff_reason` text,
	`handoff_summary` text,
	`contact_due_at` integer,
	`ticket_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_analyst_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `conversations_employee_idx` ON `conversations` (`employee_id`);--> statement-breakpoint
CREATE INDEX `conversations_mode_idx` ON `conversations` (`mode`,`updated_at`);--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`intent` text NOT NULL,
	`understood` text NOT NULL,
	`action` text NOT NULL,
	`confidence` integer NOT NULL,
	`rationale` text NOT NULL,
	`signals` text NOT NULL,
	`tool_calls` text,
	`tokens_in` integer,
	`tokens_out` integer,
	`latency_ms` integer,
	`model` text NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `decisions_message_idx` ON `decisions` (`message_id`);--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`mode` text NOT NULL,
	`target_ticket_id` text,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `drafts_conversation_status_idx` ON `drafts` (`conversation_id`,`status`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`department` text NOT NULL,
	`role` text NOT NULL,
	`level` text,
	`availability` text,
	`password_changed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE TABLE `help_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`tags` text NOT NULL,
	`conditions` text
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`author_kind` text NOT NULL,
	`author_id` text,
	`content` text NOT NULL,
	`parts` text,
	`created_at` integer NOT NULL,
	`delivered_at` integer,
	`read_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_idx` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`remember` integer NOT NULL,
	`user_message_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_employee_idx` ON `sessions` (`employee_id`);--> statement-breakpoint
CREATE TABLE `ticket_events` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`kind` text NOT NULL,
	`actor` text NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ticket_events_ticket_idx` ON `ticket_events` (`ticket_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`subcategory` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`owner_id` text NOT NULL,
	`affected` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`due_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_number_idx` ON `tickets` (`number`);--> statement-breakpoint
CREATE INDEX `tickets_owner_status_idx` ON `tickets` (`owner_id`,`status`);
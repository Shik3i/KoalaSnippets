CREATE TABLE `site_statistics` (
	`id` integer PRIMARY KEY NOT NULL,
	`total_users_created` integer DEFAULT 0 NOT NULL,
	`total_snippets_created` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'USER' NOT NULL;
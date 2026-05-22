CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`registration_enabled` integer DEFAULT true NOT NULL,
	`global_announcement` text,
	`max_snippets_per_user` integer DEFAULT 1000 NOT NULL,
	`max_chars_per_snippet` integer DEFAULT 250000 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `snippet_files` (
	`id` text PRIMARY KEY NOT NULL,
	`snippet_id` text NOT NULL,
	`filename` text NOT NULL,
	`code` text NOT NULL,
	`language` text NOT NULL,
	FOREIGN KEY (`snippet_id`) REFERENCES `snippets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `snippets` ADD `is_pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `snippets` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `snippets` ADD `collection_id` text REFERENCES collections(id);--> statement-breakpoint
INSERT INTO `snippet_files` (`id`, `snippet_id`, `filename`, `code`, `language`) SELECT lower(hex(randomblob(16))), `id`, 'index', `code`, `language` FROM `snippets`;--> statement-breakpoint
INSERT INTO `site_settings` (`id`, `registration_enabled`, `global_announcement`, `max_snippets_per_user`, `max_chars_per_snippet`) VALUES (1, 1, NULL, 1000, 250000);
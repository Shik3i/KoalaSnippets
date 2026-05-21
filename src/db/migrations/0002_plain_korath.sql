PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "user_id", "token_hash", "expires_at", "created_at") SELECT "id", "user_id", "token_hash", "expires_at", "created_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_snippets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`code` text NOT NULL,
	`language` text NOT NULL,
	`tags` text,
	`author_id` text NOT NULL,
	`visibility` text DEFAULT 'PRIVATE' NOT NULL,
	`share_token` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_snippets`("id", "title", "description", "code", "language", "tags", "author_id", "visibility", "share_token", "created_at", "updated_at") SELECT "id", "title", "description", "code", "language", "tags", "author_id", "visibility", "share_token", "created_at", "updated_at" FROM `snippets`;--> statement-breakpoint
DROP TABLE `snippets`;--> statement-breakpoint
ALTER TABLE `__new_snippets` RENAME TO `snippets`;--> statement-breakpoint
CREATE UNIQUE INDEX `snippets_share_token_unique` ON `snippets` (`share_token`);
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_snippets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tags` text,
	`author_id` text NOT NULL,
	`visibility` text DEFAULT 'PRIVATE' NOT NULL,
	`share_token` text,
	`is_pinned` integer DEFAULT false NOT NULL,
	`expires_at` integer,
	`collection_id` text,
	`total_lines` integer DEFAULT 0 NOT NULL,
	`content_hash` text,
	`password_hash` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`forked_from_id` text,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_snippets`("id", "title", "description", "tags", "author_id", "visibility", "share_token", "is_pinned", "expires_at", "collection_id", "total_lines", "content_hash", "password_hash", "created_at", "updated_at", "deleted_at", "forked_from_id") SELECT "id", "title", "description", "tags", "author_id", "visibility", "share_token", "is_pinned", "expires_at", "collection_id", "total_lines", "content_hash", "password_hash", "created_at", "updated_at", "deleted_at", "forked_from_id" FROM `snippets`;--> statement-breakpoint
DROP TABLE `snippets`;--> statement-breakpoint
ALTER TABLE `__new_snippets` RENAME TO `snippets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `snippets_share_token_unique` ON `snippets` (`share_token`);--> statement-breakpoint
CREATE INDEX `snippet_created_at_idx` ON `snippets` (`created_at`);--> statement-breakpoint
CREATE INDEX `snippet_author_created_at_idx` ON `snippets` (`author_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `snippet_visibility_idx` ON `snippets` (`visibility`);--> statement-breakpoint
CREATE INDEX `snippet_collection_idx` ON `snippets` (`collection_id`);
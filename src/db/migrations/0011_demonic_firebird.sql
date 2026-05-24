CREATE INDEX `collection_user_idx` ON `collections` (`user_id`);--> statement-breakpoint
CREATE INDEX `file_snippet_idx` ON `snippet_files` (`snippet_id`);--> statement-breakpoint
CREATE INDEX `file_language_idx` ON `snippet_files` (`language`);--> statement-breakpoint
CREATE INDEX `snippet_created_at_idx` ON `snippets` (`created_at`);--> statement-breakpoint
CREATE INDEX `snippet_author_created_at_idx` ON `snippets` (`author_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `snippet_visibility_idx` ON `snippets` (`visibility`);--> statement-breakpoint
CREATE INDEX `snippet_collection_idx` ON `snippets` (`collection_id`);--> statement-breakpoint
CREATE INDEX `favorite_user_idx` ON `user_favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorite_snippet_idx` ON `user_favorites` (`snippet_id`);
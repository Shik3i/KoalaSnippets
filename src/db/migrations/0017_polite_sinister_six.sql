CREATE INDEX `snippet_updated_at_idx` ON `snippets` (`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `favorite_user_snippet_unique` ON `user_favorites` (`user_id`,`snippet_id`);
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`created_at` integer NOT NULL,
	`preferences` text DEFAULT '{"appTheme":"theme-midnight","snippetDensity":"preview","syntaxTheme":"github-dark","bgPattern":"matrix","showLineNumbers":true}' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password_hash", "role", "created_at", "preferences") SELECT "id", "username", "password_hash", "role", "created_at", "preferences" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `snippet_updated_at_idx` ON `snippets` (`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `favorite_user_snippet_unique` ON `user_favorites` (`user_id`,`snippet_id`);
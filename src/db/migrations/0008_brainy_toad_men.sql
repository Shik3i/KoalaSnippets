CREATE TABLE `snippet_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`snippet_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`snippet_id`) REFERENCES `snippets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`created_at` integer NOT NULL,
	`preferences` text DEFAULT '{"appTheme":"theme-midnight","snippetDensity":"preview","syntaxTheme":"github-dark","bgPattern":"matrix"}' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password_hash", "role", "created_at", "preferences") SELECT "id", "username", "password_hash", "role", "created_at", "preferences" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
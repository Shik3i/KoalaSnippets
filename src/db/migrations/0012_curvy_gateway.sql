CREATE TABLE `crash_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`error_message` text NOT NULL,
	`stack_trace` text,
	`user_id` text,
	`route` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

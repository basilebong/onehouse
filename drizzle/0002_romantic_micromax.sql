CREATE TABLE `grocery_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status_json` text NOT NULL,
	`added_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`purchased_at` integer,
	FOREIGN KEY (`added_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `grocery_items_purchased_at_idx` ON `grocery_items` (`purchased_at`);--> statement-breakpoint
CREATE INDEX `grocery_items_created_at_idx` ON `grocery_items` (`created_at`);
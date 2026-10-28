CREATE TABLE "match_details" (
	"match_id" text PRIMARY KEY,
	"team_id" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"time" text DEFAULT '' NOT NULL
);

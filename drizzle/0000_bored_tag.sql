CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"word_list" text[] NOT NULL,
	"foil_list" text[] NOT NULL,
	"free_recall_words" text[] NOT NULL,
	"free_recall_hits" integer NOT NULL,
	"free_recall_intrusions" text[] NOT NULL,
	"recognition_answers" jsonb NOT NULL,
	"recognition_hits" integer NOT NULL,
	"recognition_false_alarms" integer NOT NULL,
	"discrimination_score" integer NOT NULL
);

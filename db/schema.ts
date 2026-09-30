import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { RecognitionAnswers } from "@/lib/types";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  wordList: text("word_list").array().notNull(),
  foilList: text("foil_list").array().notNull(),
  freeRecallWords: text("free_recall_words").array().notNull(),
  freeRecallHits: integer("free_recall_hits").notNull(),
  freeRecallIntrusions: text("free_recall_intrusions").array().notNull(),
  recognitionAnswers: jsonb("recognition_answers").$type<RecognitionAnswers>().notNull(),
  recognitionHits: integer("recognition_hits").notNull(),
  recognitionFalseAlarms: integer("recognition_false_alarms").notNull(),
  discriminationScore: integer("discrimination_score").notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

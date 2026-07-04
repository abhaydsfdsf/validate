import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Users table (maps to Firebase Auth UID)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent subscriptions table to let users buy AI agent subscriptions
export const agentSubscriptions = pgTable("agent_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  agentId: text("agent_id").notNull(), // e.g. "email_sorter", "travel_planner", etc.
  planName: text("plan_name").notNull(), // e.g. "Monthly Starter", "Annual Professional"
  status: text("status").notNull(), // e.g. "Active", "Cancelled"
  licenseKey: text("license_key").notNull(), // A simulated unique token
  priceCharged: text("price_charged").notNull(), // e.g. "$49/mo"
  createdAt: timestamp("created_at").defaultNow(),
});

// Travel itineraries table
export const travelItineraries = pgTable("travel_itineraries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  destination: text("destination").notNull(),
  budget: text("budget").notNull(),
  durationDays: text("duration_days").notNull(),
  itineraryText: text("itinerary_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study plans table
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  syllabus: text("syllabus").notNull(),
  planText: text("plan_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patient triages table
export const patientTriages = pgTable("patient_triages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  patientName: text("patient_name").notNull(),
  symptoms: text("symptoms").notNull(),
  urgency: text("urgency").notNull(), // e.g. "Low", "Medium", "High"
  triageDetails: text("triage_details").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email billings table
export const emailBillings = pgTable("email_billings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  clientName: text("client_name").notNull(),
  amount: text("amount").notNull(),
  services: text("services").notNull(),
  emailSubject: text("email_subject").notNull(),
  emailBody: text("email_body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations setup
export const usersRelations = relations(users, ({ many }) => ({
  travelItineraries: many(travelItineraries),
  studyPlans: many(studyPlans),
  patientTriages: many(patientTriages),
  emailBillings: many(emailBillings),
  agentSubscriptions: many(agentSubscriptions),
}));

export const subscriptionRelations = relations(agentSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [agentSubscriptions.userId],
    references: [users.id],
  }),
}));

export const travelRelations = relations(travelItineraries, ({ one }) => ({
  user: one(users, {
    fields: [travelItineraries.userId],
    references: [users.id],
  }),
}));

export const studyRelations = relations(studyPlans, ({ one }) => ({
  user: one(users, {
    fields: [studyPlans.userId],
    references: [users.id],
  }),
}));

export const triageRelations = relations(patientTriages, ({ one }) => ({
  user: one(users, {
    fields: [patientTriages.userId],
    references: [users.id],
  }),
}));

export const billingRelations = relations(emailBillings, ({ one }) => ({
  user: one(users, {
    fields: [emailBillings.userId],
    references: [users.id],
  }),
}));

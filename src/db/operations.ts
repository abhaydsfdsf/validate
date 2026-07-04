import { eq } from "drizzle-orm";
import { db } from "./index.ts";
import { users, travelItineraries, studyPlans, patientTriages, emailBillings, agentSubscriptions } from "./schema.ts";

/**
 * Syncs user profile in the database upon authentication.
 */
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database error in getOrCreateUser:", error);
    throw new Error("Failed to synchronize user profile.", { cause: error });
  }
}

/**
 * Travel Itineraries
 */
export async function saveTravelItinerary(
  uid: string,
  destination: string,
  budget: string,
  durationDays: string,
  itineraryText: string
) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) throw new Error("User record not found");

    const result = await db
      .insert(travelItineraries)
      .values({
        userId: userRecord.id,
        destination,
        budget,
        durationDays,
        itineraryText,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database error in saveTravelItinerary:", error);
    throw new Error("Failed to preserve travel itinerary.", { cause: error });
  }
}

export async function getTravelItineraries(uid: string) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) return [];

    return await db
      .select()
      .from(travelItineraries)
      .where(eq(travelItineraries.userId, userRecord.id))
      .orderBy(travelItineraries.createdAt);
  } catch (error) {
    console.error("Database error in getTravelItineraries:", error);
    throw new Error("Failed to retrieve travel itineraries.", { cause: error });
  }
}

/**
 * Study Plans
 */
export async function saveStudyPlan(uid: string, syllabus: string, planText: string) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) throw new Error("User record not found");

    const result = await db
      .insert(studyPlans)
      .values({
        userId: userRecord.id,
        syllabus,
        planText,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database error in saveStudyPlan:", error);
    throw new Error("Failed to preserve study plan.", { cause: error });
  }
}

export async function getStudyPlans(uid: string) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) return [];

    return await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.userId, userRecord.id))
      .orderBy(studyPlans.createdAt);
  } catch (error) {
    console.error("Database error in getStudyPlans:", error);
    throw new Error("Failed to retrieve study plans.", { cause: error });
  }
}

/**
 * Patient Triages
 */
export async function savePatientTriage(
  uid: string,
  patientName: string,
  symptoms: string,
  urgency: string,
  triageDetails: string
) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) throw new Error("User record not found");

    const result = await db
      .insert(patientTriages)
      .values({
        userId: userRecord.id,
        patientName,
        symptoms,
        urgency,
        triageDetails,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database error in savePatientTriage:", error);
    throw new Error("Failed to preserve patient triage.", { cause: error });
  }
}

export async function getPatientTriages(uid: string) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) return [];

    return await db
      .select()
      .from(patientTriages)
      .where(eq(patientTriages.userId, userRecord.id))
      .orderBy(patientTriages.createdAt);
  } catch (error) {
    console.error("Database error in getPatientTriages:", error);
    throw new Error("Failed to retrieve patient triages.", { cause: error });
  }
}

/**
 * Email Billings
 */
export async function saveEmailBilling(
  uid: string,
  clientName: string,
  amount: string,
  services: string,
  emailSubject: string,
  emailBody: string
) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) throw new Error("User record not found");

    const result = await db
      .insert(emailBillings)
      .values({
        userId: userRecord.id,
        clientName,
        amount,
        services,
        emailSubject,
        emailBody,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database error in saveEmailBilling:", error);
    throw new Error("Failed to preserve email billing.", { cause: error });
  }
}

export async function getEmailBillings(uid: string) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) return [];

    return await db
      .select()
      .from(emailBillings)
      .where(eq(emailBillings.userId, userRecord.id))
      .orderBy(emailBillings.createdAt);
  } catch (error) {
    console.error("Database error in getEmailBillings:", error);
    throw new Error("Failed to retrieve email billings.", { cause: error });
  }
}

/**
 * Agent Subscriptions
 */
export async function createAgentSubscription(
  uid: string,
  agentId: string,
  planName: string,
  priceCharged: string
) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) throw new Error("User record not found");

    // Generate a secure high-contrast simulated license token
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("").toUpperCase();
    const licenseKey = `VAL-AGNT-${agentId.toUpperCase()}-${randomHex}`;

    const result = await db
      .insert(agentSubscriptions)
      .values({
        userId: userRecord.id,
        agentId,
        planName,
        status: "Active",
        licenseKey,
        priceCharged,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database error in createAgentSubscription:", error);
    throw new Error("Failed to provision subscription node.", { cause: error });
  }
}

export async function getAgentSubscriptions(uid: string) {
  try {
    const userRecord = await getOrCreateUser(uid, "user@temp.com");
    if (!userRecord) return [];

    return await db
      .select()
      .from(agentSubscriptions)
      .where(eq(agentSubscriptions.userId, userRecord.id))
      .orderBy(agentSubscriptions.createdAt);
  } catch (error) {
    console.error("Database error in getAgentSubscriptions:", error);
    throw new Error("Failed to retrieve active subscription nodes.", { cause: error });
  }
}


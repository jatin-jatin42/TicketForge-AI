import bcrypt from "bcrypt";
import { db } from "./index";
import { users, venues, sections, events, seats, eventSeats, orders, tickets } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Helper for generating random numbers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const VENUES_DATA = [
  { name: "Madison Square Garden", location: "New York, NY, USA", capacity: 19500 },
  { name: "Wembley Stadium", location: "London, UK", capacity: 90000 },
  { name: "Staples Center", location: "Los Angeles, CA, USA", capacity: 20000 },
  { name: "O2 Arena", location: "London, UK", capacity: 20000 },
  { name: "Sydney Opera House", location: "Sydney, Australia", capacity: 5738 },
  { name: "Red Rocks Amphitheatre", location: "Morrison, CO, USA", capacity: 9545 },
  { name: "Tokyo Dome", location: "Tokyo, Japan", capacity: 55000 },
  { name: "Accor Arena", location: "Paris, France", capacity: 20300 },
  { name: "Barclays Center", location: "Brooklyn, NY, USA", capacity: 19000 },
  { name: "Mercedes-Benz Stadium", location: "Atlanta, GA, USA", capacity: 71000 }
];

const EVENTS_DATA = [
  { name: "Taylor Swift - The Eras Tour", imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000", daysFromNow: 30 },
  { name: "Coldplay - Music of the Spheres", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1000", daysFromNow: 45 },
  { name: "Beyoncé - Renaissance Tour", imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000", daysFromNow: 15 },
  { name: "Ed Sheeran - Mathematics Tour", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000", daysFromNow: 60 },
  { name: "The Weeknd - After Hours", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c090be5f5be?auto=format&fit=crop&q=80&w=1000", daysFromNow: 10 },
  { name: "Harry Styles - Love On Tour", imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000", daysFromNow: 75 },
  { name: "Drake - It's All A Blur", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1000", daysFromNow: 5 },
  { name: "Morgan Wallen - One Night At A Time", imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000", daysFromNow: 90 },
  { name: "Luke Combs - World Tour", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000", daysFromNow: 120 },
  { name: "Adele - Weekends with Adele", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c090be5f5be?auto=format&fit=crop&q=80&w=1000", daysFromNow: 25 },
  { name: "Bad Bunny - Most Wanted Tour", imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000", daysFromNow: 40 },
  { name: "SZA - SOS Tour", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1000", daysFromNow: 55 },
  { name: "Metallica - M72 World Tour", imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000", daysFromNow: 80 },
  { name: "Bruce Springsteen - 2026 Tour", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000", daysFromNow: 110 },
  { name: "P!NK - Summer Carnival", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c090be5f5be?auto=format&fit=crop&q=80&w=1000", daysFromNow: 35 },
  { name: "Eagles - The Long Goodbye", imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000", daysFromNow: 50 },
  { name: "U2 - UV Achtung Baby", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1000", daysFromNow: 65 },
  { name: "Red Hot Chili Peppers - Global Tour", imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000", daysFromNow: 85 },
  { name: "Post Malone - If Y'all Weren't Here", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000", daysFromNow: 100 },
  { name: "Karol G - Mañana Será Bonito", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c090be5f5be?auto=format&fit=crop&q=80&w=1000", daysFromNow: 20 },
  
  // Past events for user history
  { name: "Arctic Monkeys - The Car Tour", imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000", daysFromNow: -30, status: "COMPLETED" },
  { name: "Dua Lipa - Future Nostalgia", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1000", daysFromNow: -60, status: "COMPLETED" },
  { name: "Kendrick Lamar - The Big Steppers", imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000", daysFromNow: -120, status: "COMPLETED" }
];

const SECTION_NAMES = ["VIP Floor", "Lower Bowl", "Upper Deck", "General Admission", "Club Level", "Balcony", "Orchestra"];

async function createOrGetUser(email: string, fullName: string, passwordPlain: string, role: "ADMIN" | "USER") {
  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const [newUser] = await db.insert(users).values({
      fullName,
      email,
      passwordHash,
      role,
    }).returning();
    user = newUser;
    console.log(`✅ ${role} user created: ${email}`);
  } else {
    // Update password just to be sure it matches requested
    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const [updatedUser] = await db.update(users).set({ passwordHash }).where(eq(users.email, email)).returning();
    user = updatedUser;
    console.log(`✅ ${role} user updated: ${email}`);
  }
  return user;
}

async function seed() {
  console.log("🌱 Starting advanced database seeding...\n");

  // 1. Create Users
  const adminUser = await createOrGetUser("admin@tf.com", "System Admin", "admin@tf", "ADMIN");
  const normalUser = await createOrGetUser("user@tf.com", "Demo User", "12345678", "USER");

  // Check if we already seeded venues
  const existingVenues = await db.select().from(venues).limit(1);
  if (existingVenues.length > 0) {
    console.log("\n⚠️  Database already contains venues. Skipping venue/event generation to avoid duplicates.");
    console.log("If you want a fresh seed, run `npm run db:reset` or manually drop the tables first.\n");
    process.exit(0);
  }

  // 2. Create Venues, Sections, and Seats
  console.log("\n🏟️  Creating 10 Real-World Venues with sections and seats...");
  const createdVenues = [];
  const allSections = [];
  
  for (const vData of VENUES_DATA) {
    const [venue] = await db.insert(venues).values({
      name: vData.name,
      location: vData.location,
      capacity: vData.capacity,
      description: `Experience live events at the legendary ${vData.name}.`
    }).returning();
    createdVenues.push(venue);

    // Pick 2-7 random sections
    const numSections = randomInt(2, 7);
    const shuffledNames = [...SECTION_NAMES].sort(() => 0.5 - Math.random());
    const selectedSectionNames = shuffledNames.slice(0, numSections);

    for (const secName of selectedSectionNames) {
      const isGA = secName === "General Admission";
      const sectionCapacity = randomInt(100, 500);
      const basePrice = randomInt(2500, 25000); // $25.00 to $250.00 in cents

      const [section] = await db.insert(sections).values({
        venueId: venue.id,
        name: secName,
        capacity: sectionCapacity,
        basePrice,
        type: isGA ? "GENERAL_ADMISSION" : "ASSIGNED"
      }).returning();
      allSections.push(section);

      // Generate Seats for this section
      const seatsToInsert = [];
      const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];
      
      for (let i = 0; i < sectionCapacity; i++) {
        const row = isGA ? null : rows[Math.floor(i / 50) % rows.length];
        const num = (i % 50) + 1;
        seatsToInsert.push({
          sectionId: section.id,
          row,
          number: `${num}`,
          x: randomInt(0, 100),
          y: randomInt(0, 100)
        });
      }

      // Batch insert seats (chunks of 500)
      for (let i = 0; i < seatsToInsert.length; i += 500) {
        await db.insert(seats).values(seatsToInsert.slice(i, i + 500));
      }
    }
    console.log(`   - Created ${venue.name} with ${numSections} sections`);
  }

  // 3. Create Events
  console.log("\n🎸 Creating 20+ Global Events...");
  const createdEvents = [];
  
  for (const eData of EVENTS_DATA) {
    // Randomly assign a venue
    const randomVenue = createdVenues[Math.floor(Math.random() * createdVenues.length)];
    
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + eData.daysFromNow);
    
    const [event] = await db.insert(events).values({
      name: eData.name,
      description: `Don't miss out on ${eData.name} live at ${randomVenue.name}!`,
      venueId: randomVenue.id,
      date: eventDate,
      status: (eData as any).status || "PUBLISHED",
      imageUrl: eData.imageUrl
    }).returning();
    createdEvents.push(event);

    // Populate eventSeats for this event
    // Find all sections and seats for this venue
    const venueSections = allSections.filter(s => s.venueId === randomVenue.id);
    for (const section of venueSections) {
      const sectionSeats = await db.query.seats.findMany({ where: eq(seats.sectionId, section.id) });
      
      const eventSeatsToInsert = sectionSeats.map(seat => ({
        eventId: event.id,
        seatId: seat.id,
        sectionId: section.id,
        status: "AVAILABLE" as const
      }));

      // Batch insert event seats
      for (let i = 0; i < eventSeatsToInsert.length; i += 500) {
        // Use try-catch to ignore partition errors if any weirdness happens
        try {
           await db.insert(eventSeats).values(eventSeatsToInsert.slice(i, i + 500));
        } catch (e: any) {
           console.log(`     Warning: Failed to insert some event seats (likely missing partition): ${e.message}`);
           break; // skip rest for this section if partition is missing
        }
      }
    }
    console.log(`   - Scheduled: ${event.name} @ ${randomVenue.name}`);
  }

  // 4. Create Past Activities for normalUser
  console.log("\n🎟️  Creating past booking history for user@tf.com...");
  const pastEvents = createdEvents.filter(e => e.status === "COMPLETED");
  
  for (const pastEvent of pastEvents) {
    // Find available seats for this past event
    const availableSeats = await db.query.eventSeats.findMany({
      where: eq(eventSeats.eventId, pastEvent.id),
      limit: 2
    });

    if (availableSeats.length === 0) continue;

    // Create an order
    const totalAmount = 15000 * availableSeats.length; // $150 per ticket roughly
    const idempotencyKey = crypto.randomUUID();
    
    const [order] = await db.insert(orders).values({
      userId: normalUser.id,
      eventId: pastEvent.id,
      totalAmount,
      status: "COMPLETED",
      paymentIntentId: `pi_mock_${crypto.randomBytes(8).toString('hex')}`,
      idempotencyKey
    }).returning();

    // Create tickets and update seat status
    for (const es of availableSeats) {
      // get seat details
      const seatDetails = await db.query.seats.findFirst({ where: eq(seats.id, es.seatId) });
      const sectionDetails = allSections.find(s => s.id === es.sectionId);
      
      await db.insert(tickets).values({
        orderId: order.id,
        eventId: pastEvent.id,
        seatId: es.seatId,
        sectionName: sectionDetails?.name || "General",
        row: seatDetails?.row,
        number: seatDetails?.number || "1",
        price: sectionDetails?.basePrice || 15000,
        qrCode: `QR_${crypto.randomUUID()}`
      });

      // Update seat status
      await db.update(eventSeats)
        .set({ status: "BOOKED", userId: normalUser.id })
        .where(
           require("drizzle-orm").and(
             eq(eventSeats.eventId, pastEvent.id),
             eq(eventSeats.seatId, es.seatId)
           )
        );
    }
    console.log(`   - Booked ${availableSeats.length} tickets for ${pastEvent.name}`);
  }

  console.log("\n✨ Database advanced seeding completely finished!\n");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});

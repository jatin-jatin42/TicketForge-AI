import { db } from "./src/db/index";
import { seatService } from "./src/events/seats.service";
import { users, events, seats } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function testLock() {
  try {
    // 1. Get a user
    const user = await db.query.users.findFirst();
    if (!user) throw new Error("No user found");

    // 2. Get an event
    const event = await db.query.events.findFirst();
    if (!event) throw new Error("No event found");

    // 3. Get an available seat for that event
    const seat = await db.query.eventSeats.findFirst({
        where: (es, { eq, and }) => and(eq(es.eventId, event.id), eq(es.status, "AVAILABLE"))
    });
    if (!seat) throw new Error("No available seat found");

    console.log(`Testing lock for Event: ${event.id}, Seat: ${seat.seatId}, User: ${user.id}`);
    
    const result = await seatService.lockSeat(event.id, seat.seatId, user.id);
    console.log("Lock Success:", result);
    
    // Unlock to clean up
    await seatService.unlockSeat(event.id, seat.seatId, user.id);
    console.log("Unlocked Successfully.");
  } catch (error) {
    console.error("Lock Failed:", error);
  }
  process.exit(0);
}

testLock();

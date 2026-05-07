import { db } from '../db';
import { users, orders } from '../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export class UserService {
  // Get user by ID
  async getUserById(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  // Get all users (Admin only)
  async getUsers(limit: number = 50, offset: number = 0, searchTerm?: string) {
    let queryConditions = undefined;
    if (searchTerm) {
        // ILIKE is Postgres specific
        queryConditions = sql`${users.fullName} ILIKE ${'%' + searchTerm + '%'} OR ${users.email} ILIKE ${'%' + searchTerm + '%'}`;
    }

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(queryConditions);
    
    const userList = await db
      .select({
        id: users.id,
        name: users.fullName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(queryConditions)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`);

    return {
      users: userList.map(u => ({
        ...u,
        createdAt: u.createdAt?.toISOString() || new Date().toISOString()
      })),
      totalCount: Number(countResult.count)
    };
  }

  // Update user role (Admin only)
  async updateUserRole(userId: string, role: 'ADMIN' | 'USER') {
    const [updated] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return {
      id: updated.id,
      name: updated.fullName,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt?.toISOString() || new Date().toISOString()
    };
  }

  // Update user profile
  async updateProfile(userId: string, input: { name?: string; email?: string }) {
    const updateData: any = {};
    
    if (input.name) updateData.fullName = input.name;
    if (input.email) updateData.email = input.email;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  // Get wallet balance (calculated from orders)
  async getWallet(userId: string) {
    // Get all completed orders for the user
    const completedOrders = await db
      .select({
        totalAmount: orders.totalAmount,
        status: orders.status,
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, 'COMPLETED')
      ));

    const totalSpent = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Get refunded orders
    const refundedOrders = await db
      .select({
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, 'REFUNDED')
      ));

    const totalRefunds = refundedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Get pending orders
    const pendingOrders = await db
      .select({
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, 'PENDING')
      ));

    const pending = pendingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // For this example, balance = totalRefunds (money returned to wallet)
    // In a real system, this would track actual wallet deposits/withdrawals
    const balance = totalRefunds;

    return {
      balance: balance / 100, // Convert cents to dollars
      totalSpent: totalSpent / 100,
      totalRefunds: totalRefunds / 100,
      pending: pending / 100,
    };
  }

  // Get transaction history (from orders)
  async getTransactions(userId: string, limit: number = 10, offset: number = 0) {
    const userOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        eventId: orders.eventId,
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        inArray(orders.status, ['COMPLETED', 'REFUNDED'])
      ))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Map orders to transactions
    return userOrders.map((order) => ({
      id: order.id,
      type: order.status === 'REFUNDED' ? 'CREDIT' : 'DEBIT',
      amount: (order.totalAmount || 0) / 100, // Convert to dollars
      description: order.status === 'REFUNDED' 
        ? `Refund - Order ${order.id.substring(0, 8)}`
        : `Purchase - Order ${order.id.substring(0, 8)}`,
      createdAt: order.createdAt?.getTime().toString() || Date.now().toString(),
    }));
  }

  // Get user settings (stored in localStorage for now)
  // In a real app, this would be a separate settings table
  async getSettings(userId: string) {
    // For now, return default settings
    // In production, create a user_settings table
    return {
      emailNotifications: true,
      pushNotifications: true,
      eventReminders: true,
    };
  }

  // Update user settings
  async updateSettings(userId: string, input: any) {
    // For now, just return the input
    // In production, save to user_settings table
    return {
      emailNotifications: input.emailNotifications ?? true,
      pushNotifications: input.pushNotifications ?? true,
      eventReminders: input.eventReminders ?? true,
    };
  }
}

export const userService = new UserService();

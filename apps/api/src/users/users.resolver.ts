import { userService } from './users.service';
import { GraphQLError } from 'graphql';

// --- Security Helpers ---
const requireAuth = (context: any) => {
  if (!context.user || !context.user.id) {
    throw new GraphQLError('Unauthorized: You must be logged in to perform this action.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user.id;
};

const requireAdmin = (context: any) => {
  const userId = requireAuth(context);
  if (context.user.role !== 'ADMIN') {
    throw new GraphQLError('Forbidden: Admin access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return userId;
};

export const userResolvers = {
  Query: {
    me: async (args: any, context: any) => {
      // buildSchema pattern: context is passed inside args object
      const userId = requireAuth({ user: context.user });
      const user = await userService.getUserById(userId);
      
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return {
        id: user.id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt?.getTime().toString() || '',
      };
    },

    myWallet: async (args: any, context: any) => {
      const userId = requireAuth({ user: context.user });
      return await userService.getWallet(userId);
    },

    myTransactions: async (args: any, context: any) => {
      const { limit = 10, offset = 0 } = args;
      const { user } = context;
      const userId = requireAuth({ user });
      return await userService.getTransactions(userId, limit, offset);
    },

    mySettings: async (args: any, context: any) => {
      const userId = requireAuth({ user: context.user });
      return await userService.getSettings(userId);
    },

    users: async (args: any, context: any) => {
      requireAdmin(context);
      const { limit = 50, offset = 0, search } = args;
      return await userService.getUsers(limit, offset, search);
    },
  },

  Mutation: {
    updateProfile: async (args: any, context: any) => {
      const { input } = args;
      const { user } = context;
      const userId = requireAuth({ user });
      
      const updated = await userService.updateProfile(userId, input);
      
      return {
        id: updated.id,
        name: updated.fullName,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        createdAt: updated.createdAt?.getTime().toString() || '',
      };
    },

    deleteUser: async (args: any, context: any) => {
      const currentAdminId = requireAdmin(context);
      const { userId } = args;

      if (currentAdminId === userId) {
        throw new GraphQLError('Forbidden: You cannot delete your own admin account.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return await userService.deleteUser(userId);
    },

    updateSettings: async (args: any, context: any) => {
      const { input } = args;
      const { user } = context;
      const userId = requireAuth({ user });
      
      return await userService.updateSettings(userId, input);
    },
  },
};

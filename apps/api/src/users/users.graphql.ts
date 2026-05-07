// GraphQL Type Definitions for User Wallet and Settings

export const userTypeDefs = `
  # Extend existing User type with new fields
  extend type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String!
  }

  type UsersResponse {
    users: [User!]!
    totalCount: Int!
  }

  type Wallet {
    balance: Float!
    totalSpent: Float!
    totalRefunds: Float!
    pending: Float!
  }

  type Transaction {
    id: ID!
    type: TransactionType!
    amount: Float!
    description: String!
    createdAt: String!
  }

  enum TransactionType {
    CREDIT
    DEBIT
  }

  type UserSettings {
    emailNotifications: Boolean!
    pushNotifications: Boolean!
    eventReminders: Boolean!
  }

  input UpdateProfileInput {
    name: String
    email: String
  }

  input UpdateSettingsInput {
    emailNotifications: Boolean
    pushNotifications: Boolean
    eventReminders: Boolean
  }

  extend type Query {
    me: User!
    myWallet: Wallet
    myTransactions(limit: Int, offset: Int): [Transaction!]!
    mySettings: UserSettings!
    users(limit: Int, offset: Int, search: String): UsersResponse!
  }

  extend type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    updateSettings(input: UpdateSettingsInput!): UserSettings!
    updateUserRole(userId: ID!, role: String!): User!
  }
`;

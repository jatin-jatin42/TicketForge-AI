"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql";
import { gql } from "graphql-request";
import { Shield, ShieldAlert, User, MoreVertical, Search, CheckCircle2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";

// --- GraphQL Operations ---
const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int, $search: String) {
    users(limit: $limit, offset: $offset, search: $search) {
      users {
        id
        name
        email
        role
        createdAt
      }
      totalCount
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`;

// --- Types ---
interface UserModel {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch Users
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin_users", page, searchTerm],
    queryFn: async () => 
      graphqlClient.request<{ users: { users: UserModel[]; totalCount: number } }>(GET_USERS, {
        limit,
        offset: page * limit,
        search: searchTerm || null,
      }),
  });

  const users = data?.users.users || [];
  const totalCount = data?.users.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (vars: { userId: string }) => graphqlClient.request(DELETE_USER, vars),
    onSuccess: () => {
      addToast("User deleted successfully.", "success");
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    },
    onError: () => {
      addToast("Failed to delete user.", "error");
    },
  });

  const handleDeleteUser = (user: UserModel) => {
    // Safety check - admin cannot delete themselves
    if (user.id === currentUser?.id) {
      addToast("You cannot delete your own admin account.", "error");
      return;
    }

    if (confirm(`Are you absolutely sure you want to permanently delete ${user.name}? This action cannot be undone.`)) {
      deleteMutation.mutate({ userId: user.id });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your platform's users, roles, and access permissions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0); // Reset to first page on search
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading users...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">Error loading users. Please make sure you have Admin access.</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No users found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-4">
                      {user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <User className="w-3.5 h-3.5" />
                          User
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(parseInt(user.createdAt) || user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={deleteMutation.isPending || user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? "You cannot delete yourself" : "Delete User"}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors border border-red-200 dark:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
            <span className="text-sm text-slate-500">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, totalCount)} of {totalCount} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 dark:bg-surface-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 dark:bg-surface-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

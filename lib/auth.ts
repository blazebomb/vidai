// lib/auth.ts

import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import User from "@/models/User"; // Import your User model

export const authOptions: NextAuthOptions = {
  providers: [
    // GitHub OAuth provider
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    // Email and password login using Credentials Provider
    CredentialsProvider({
      name: "Credentials", // Display name on the login page
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Check if email and password are provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          // Connect to MongoDB
          await connectToDatabase();

          // Find the user by email
          const user = await User.findOne({ email: credentials.email });

          // If user not found, throw error
          if (!user) {
            throw new Error("User not found");
          }

          // Compare entered password with hashed password in database
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          // If password is invalid, throw error
          if (!isValid) {
            throw new Error("Invalid password");
          }

          // Return user object if authentication is successful
          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (error) {
          // Log and throw a generic error
          console.error("Error during authentication:", error);
          throw new Error("Error during authentication");
        }
      },
    }),
  ],

  // Callbacks to customize JWT and session behavior
  callbacks: {
    // This callback runs when a JWT token is created or updated
    async jwt({ token, user }) {
      if (user) {
        // Attach user ID to the token (only available during login)
        token.id = user.id;
      }
      return token;
    },

    // This callback runs whenever a session is accessed or created
    async session({ session, token }) {
      if (session.user) {
        // Attach the user ID from token to session object
        session.user.id = token.id as string;
      }
      return session; // Important: return session, not token
    },
  },
  pages:{
    signIn: "/auth/signin", // Custom sign-in page
    error: "/login"
  },
  session: {
    strategy: "jwt", // Use JWT for session management
    maxAge: 30 * 24 * 60 * 60, 
    
  },
  secret: process.env.NEXTAUTH_SECRET, // Secret for signing the JWT
};

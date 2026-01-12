"use server"

import { createServerClient } from "../database/supabase.client"
import { logger } from "../utils/logger"
import { AuthError } from "../utils/errors"

export async function signUp(email: string, password: string, username: string) {
  try {
    const supabase = await createServerClient()

    // Check if username is available
    const { data: existingUser } = await supabase.from("profiles").select("id").eq("username", username).single()

    if (existingUser) {
      throw new AuthError("Username already taken")
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      logger.error("Sign up failed", "AUTH", error)
      throw new AuthError(error.message)
    }

    logger.info("User signed up", "AUTH", { userId: data.user?.id })

    return { success: true, user: data.user }
  } catch (error) {
    if (error instanceof AuthError) throw error
    logger.error("Unexpected sign up error", "AUTH", error)
    throw new AuthError("Sign up failed")
  }
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.error("Sign in failed", "AUTH", error)
      throw new AuthError("Invalid credentials")
    }

    logger.info("User signed in", "AUTH", { userId: data.user?.id })

    return { success: true, user: data.user }
  } catch (error) {
    if (error instanceof AuthError) throw error
    logger.error("Unexpected sign in error", "AUTH", error)
    throw new AuthError("Sign in failed")
  }
}

export async function signOut() {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error("Sign out failed", "AUTH", error)
      throw new AuthError(error.message)
    }

    logger.info("User signed out", "AUTH")

    return { success: true }
  } catch (error) {
    logger.error("Unexpected sign out error", "AUTH", error)
    throw new AuthError("Sign out failed")
  }
}

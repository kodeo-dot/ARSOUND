"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Database, CheckCircle2, Copy } from 'lucide-react'
import { useState } from "react"

export function DbInitGuide() {
  const [copied, setCopied] = useState(false)

  const copyScript = () => {
    const script = `-- ARSOUND Complete Database Initialization
-- Copy and run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  bio text,
  avatar_url text,
  plan text DEFAULT 'free',
  followers_count integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_plays_count integer DEFAULT 0,
  total_likes_received integer DEFAULT 0,
  packs_count integer DEFAULT 0,
  mp_connected boolean DEFAULT false,
  mp_access_token text,
  mp_user_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);`

    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6 rounded-3xl border-border bg-amber-500/10 border-2 border-amber-500/20">
      <div className="flex gap-4">
        <AlertCircle className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-amber-600 text-lg mb-2">Database Not Initialized</h3>
          <p className="text-amber-600/80 text-sm mb-4">
            Your Supabase database appears to be empty. You need to run the initialization SQL script to create all required tables.
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-2">Step 1: Go to Supabase Dashboard</p>
                <p className="text-xs text-muted-foreground">Open your Supabase project and go to SQL Editor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-2">Step 2: Copy the SQL Script</p>
                <Button 
                  onClick={copyScript}
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy SQL Script"}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-2">Step 3: Run the Script</p>
                <p className="text-xs text-muted-foreground">Paste in SQL Editor and click Run</p>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-4">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-600">What gets created:</p>
                  <p className="text-xs text-green-600/80 mt-1">Tables for profiles, packs, purchases, payments, and more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

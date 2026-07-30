import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SB_URL || 'https://kkeneagaoflkcvfqtout.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SB_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW5lYWdhb2Zsa2N2ZnF0b3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDE1MjgsImV4cCI6MjEwMDk3NzUyOH0.kZt-OvoxuRv8QpiZ4u-67RyYa8MCf-YCbJe5yIoWiKE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
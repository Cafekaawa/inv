import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smpuqcowurznhuntjoeo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcHVxY293dXJ6bmh1bnRqb2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MjQ2OTksImV4cCI6MjA3MTUwMDY5OX0.jGHLdFdpyhhTnyeO5fI1xM2LAb3D2scAU6FRMipENXA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
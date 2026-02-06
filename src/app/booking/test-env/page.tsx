'use client';

/**
 * This page demonstrates the difference between NEXT_PUBLIC_ and non-public env vars
 * Delete this file after understanding the concept
 */
export default function TestEnvPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Environment Variable Test</h1>
        
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold mb-2">In Browser (Client-Side):</h2>
          <pre className="text-sm">
            {JSON.stringify({
              'NEXT_SUPABASE_URL (no PUBLIC)': process.env.NEXT_SUPABASE_URL || '❌ undefined - Hidden from browser!',
              'NEXT_PUBLIC_SUPABASE_URL (with PUBLIC)': process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ undefined',
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h2 className="font-semibold mb-2">Why?</h2>
          <p className="text-sm">
            Next.js <strong>intentionally hides</strong> environment variables from the browser for security.
            Only variables starting with <code className="bg-muted px-1 rounded">NEXT_PUBLIC_</code> are exposed to client-side code.
          </p>
          <p className="text-sm mt-2">
            This prevents accidentally exposing secrets like database passwords or API keys.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="font-semibold mb-2">Solution:</h2>
          <p className="text-sm">
            Use <code className="bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> in your .env file.
            The Supabase anon key is <strong>designed to be public</strong>, so this is safe.
          </p>
        </div>
      </div>
    </div>
  );
}

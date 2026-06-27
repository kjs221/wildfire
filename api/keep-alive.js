// api/keep-alive.js
// Vercel serverless function that pings Supabase daily to prevent project pausing

export default async function handler(req, res) {
  const SUPABASE_URL = 'https://mrmjzthkzikgzumhxeig.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_9KN8kzjDwjbZN41zuVBgfA_snMIEjnH';

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/streams?select=id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );

    if (response.ok) {
      res.status(200).json({ ok: true, pinged: new Date().toISOString() });
    } else {
      res.status(500).json({ ok: false, status: response.status });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

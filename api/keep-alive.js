// api/keep-alive.js
// Vercel serverless function that pings Supabase twice daily to prevent project pausing
 
module.exports = async function handler(req, res) {
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
 
    res.status(200).json({ ok: response.ok, time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

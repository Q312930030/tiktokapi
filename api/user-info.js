// api/user-info.js  —— 纯 Serverless 函数（无框架）
// Vercel 默认 Node 18+，无需 package.json
export default async function handler(req, res) {
  try {
    const { username } = req.method === 'GET' ? req.query : (req.body || {});
    if (!username) return res.status(400).json({ error: 'username required' });

    // 1) 获取 access_token（带 scope）
    const tokResp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TT_CLIENT_KEY,
        client_secret: process.env.TT_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'research.data.basic',
      }),
    });
    const tok = await tokResp.json();
    if (!tokResp.ok || !tok.access_token) {
      return res.status(tokResp.status || 500).json({ error: 'token_failed', detail: tok });
    }

    // 2) 调 Research API: user/info
    const fields = 'display_name,bio_description,avatar_url,is_verified,follower_count,following_count,likes_count,video_count,bio_url';
    const userResp = await fetch(
      `https://open.tiktokapis.com/v2/research/user/info/?fields=${encodeURIComponent(fields)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tok.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      }
    );

    const data = await userResp.json();
    return res.status(userResp.ok ? 200 : userResp.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'server_error', message: String(e) });
  }
}

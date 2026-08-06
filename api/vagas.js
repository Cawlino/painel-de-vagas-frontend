export default async function handler(req, res) {
  try {
    const googleUrl = process.env.GOOGLE_SCRIPT_URL;
    
    if (!googleUrl) {
      return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL not configured' });
    }

    const response = await fetch(googleUrl);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

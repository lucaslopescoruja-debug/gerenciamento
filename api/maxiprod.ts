import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // We expect a POST request wrapping the actual Maxiprod request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpointPath, targetMethod, payload, token } = req.body || {};

  if (!endpointPath || !targetMethod || !token) {
    return res.status(400).json({ error: 'Parâmetros incorretos no proxy (endpointPath, targetMethod, token)' });
  }

  try {
    const url = `https://api.maxiprod.com.br/api/v3${endpointPath}`;
    
    const options: RequestInit = {
      method: targetMethod,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (payload && (targetMethod === 'POST' || targetMethod === 'PUT' || targetMethod === 'PATCH')) {
      options.body = JSON.stringify(payload);
    }

    const maxiprodRes = await fetch(url, options);

    const contentType = maxiprodRes.headers.get('content-type');
    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await maxiprodRes.json();
    } else {
      responseData = { text: await maxiprodRes.text() };
    }

    if (!maxiprodRes.ok) {
      // Repassa o erro exato do Maxiprod para o frontend ler
      return res.status(maxiprodRes.status).json({ 
        isMaxiprodError: true, 
        status: maxiprodRes.status, 
        statusText: maxiprodRes.statusText, 
        data: responseData 
      });
    }

    return res.status(200).json(responseData);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro interno no proxy Maxiprod', details: error.message });
  }
}

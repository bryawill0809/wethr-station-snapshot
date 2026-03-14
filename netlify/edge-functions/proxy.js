export default async (request, context) => {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Grab the query string from the incoming request
  const url = new URL(request.url);
  const params = url.searchParams.toString();

  // Build the real wethr.net API URL
  const upstream = `https://wethr.net/api/v2/observations.php${params ? '?' + params : ''}`;

  // Fetch from wethr.net using the key stored in Netlify env vars (never exposed to browser)
  const response = await fetch(upstream, {
    headers: {
      'Authorization': 'Bearer ' + Deno.env.get('WETHR_API_KEY'),
      'Content-Type': 'application/json',
    },
  });

  const data = await response.text();

  return new Response(data, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const config = {
  path: '/api/proxy',
};


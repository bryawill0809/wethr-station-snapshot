export default async (request, context) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const params = url.searchParams;

  const endpoint = params.get('endpoint') || 'observations';
  params.delete('endpoint');

  let upstreamUrl;

  if (endpoint === 'mesonet') {
    // Mesonet API — token already in params passed from client
    upstreamUrl = 'https://api.synopticdata.com/v2/stations/nearesttime?' + params.toString();
    const resp = await fetch(upstreamUrl, { headers: { 'Accept': 'application/json' } });
    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Kalshi — no auth needed, just proxy for CORS
  if (endpoint === 'kalshi') {
    const city = params.get('city');
    const lastSec = params.get('last_sec') || '3000';
    const detailed = params.get('detailed') || 'true';
    const kalshiUrl = 'https://external-api.kalshi.com/trade-api/v2/live_data/weather/' + city
      + '?detailed=' + detailed + '&last_sec=' + lastSec;
    const kalshiResp = await fetch(kalshiUrl, {
      headers: { 'Accept': 'application/json' }
    });
    const kalshiData = await kalshiResp.text();
    return new Response(kalshiData, {
      status: kalshiResp.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const upstreamPath = endpoint === 'forecasts'
    ? 'https://wethr.net/api/v2/forecasts.php'
    : endpoint === 'accuracy'
    ? 'https://wethr.net/api/v2/model_accuracy.php'
    : endpoint === 'nws'
    ? 'https://wethr.net/api/v2/nws_forecasts.php'
    : 'https://wethr.net/api/v2/observations.php';

  const upstream = upstreamPath + '?' + params.toString();

  const response = await fetch(upstream, {
    headers: {
      'Authorization': 'Bearer ' + Deno.env.get('WETHR_API_KEY'),
      'Content-Type': 'application/json',
    },
  });

  const data = await response.text();

  return new Response(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const config = {
  path: '/api/proxy',
};


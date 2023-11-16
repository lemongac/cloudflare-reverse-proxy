const PROXY_PATH = '/proxy/';
const TPROXY_PATH = '/tproxy/';

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function handleRequest(request, env) {
  let url = new URL(request.url);
  let isProxy = url.pathname.startsWith(PROXY_PATH) || url.pathname.startsWith(TPROXY_PATH);
  if (isProxy) {
    let urlsStr = url.pathname.replace(PROXY_PATH, "").replace(TPROXY_PATH, "");
    let urls = urlsStr.split(',');
    shuffleArray(urls);

    const domain = url.searchParams.get('domain');

    for (let actualUrlStr of urls) {
      let actualUrl = new URL(actualUrlStr);
      let modifiedRequest = createModifiedRequest(request, actualUrl, domain);

      try {
        let response = await fetch(modifiedRequest);
        return createModifiedResponse(response, actualUrlStr);
      } catch (error) {
        console.error(`Error fetching ${actualUrlStr}: ${error.message}`);
      }
    }
  }

  return new Response('All URLs failed', { status: 500 });
}

function createModifiedRequest(originalRequest, actualUrl, domain) {
  return new Request(actualUrl, {
    headers: { ...originalRequest.headers, domain },
    method: originalRequest.method,
    body: originalRequest.body,
    redirect: 'follow'
  });
}

function createModifiedResponse(originalResponse, actualUrlStr) {
  return new Response(originalResponse.body, {
    ...originalResponse,
    headers: { ...originalResponse.headers, 'Access-Control-Allow-Origin': '*', 'actualUrl': actualUrlStr }
  });
}

export default { fetch: handleRequest };

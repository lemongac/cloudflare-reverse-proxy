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
  let isProxy = url.pathname.startsWith(PROXY_PATH);
  let isTProxy = url.pathname.startsWith(TPROXY_PATH);
  let urlsStr = isProxy ? url.pathname.replace(PROXY_PATH, "") : url.pathname.replace(TPROXY_PATH, "");
  let urls = urlsStr.split(',');

  shuffleArray(urls);

  const domain = url.searchParams.get('domain');

  if (isProxy || isTProxy) {
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
  let modifiedRequest = new Request(actualUrl, {
    headers: originalRequest.headers,
    method: originalRequest.method,
    body: originalRequest.body,
    redirect: 'follow'
  });

  if (domain) {
    modifiedRequest.headers.set('domain', domain);
  }

  return modifiedRequest;
}

function createModifiedResponse(originalResponse, actualUrlStr) {
  let modifiedResponse = new Response(originalResponse.body, originalResponse);
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
  modifiedResponse.headers.set('actualUrl', actualUrlStr);
  return modifiedResponse;
}

export default { fetch: handleRequest };

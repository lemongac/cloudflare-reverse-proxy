async function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  return array;
}

export default {
  async fetch(request, env) {
    const { url } = new URL(request.url);

    if (url.pathname.startsWith('/proxy/') || url.pathname.startsWith('/tproxy/')) {
      const remainingPath = url.pathname.replace('/proxy/', '').replace('/tproxy/', '');
      const urls = remainingPath.split('/');
      const shuffledUrls = await shuffleArray(urls);

      const responses = [];
      for (const url of shuffledUrls) {
        const modifiedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: request.redirect
        });

        const domainParam = new URLSearchParams(url).get('domain');
        if (domainParam) {
          modifiedRequest.headers.set('domain', domainParam);
        }

        try {
          const response = await fetch(modifiedRequest);
          responses.push(response);
        } catch (error) {
          console.error(error);
        }
      }

      if (responses.length > 0) {
        const finalResponse = responses.find(response => response.ok);
        if (finalResponse) {
          const responseHeaders = new Headers(finalResponse.headers);
          responseHeaders.set('Access-Control-Allow-Origin', '*');
          return new Response(await finalResponse.text(), {
            status: finalResponse.status,
            statusText: finalResponse.statusText,
            headers: responseHeaders
          });
        }
      }

      return new Response('All URLs failed', { status: 500 });
    }

    // Handle other cases
    // ...
  }
};

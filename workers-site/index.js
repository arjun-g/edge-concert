import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

import { getEvent, getNearbyEvents, randomNumber } from "./ds";

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = {}

  const deviceType = getDeviceType(event.request.headers.get('user-agent'));

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  options.mapRequestToAsset = handlePath();

  console.log("CF", event.request.cf);

  let location = {};

  if(event.request.cf){
    const cf = event.request.cf;
    location = {
      country: cf.country,
      region: cf.region,
      regionCode: cf.regionCode,
      city: cf.city,
      lat: cf.latitude,
      lon: cf.longitude
    }
  }
  else{
    location = {
      country: "IN",
      region: "Tamil Nadu",
      regionCode: "TN",
      city: "Chennai",
      lat: 0,
      lon: 0
    }
  }

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      }
    }

    const page = await getAssetFromKV(event, options)

    // allow headers to be altered
    const response = new Response(page.body, page)

    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'unsafe-url')
    response.headers.set('Feature-Policy', 'none')
    response.headers.set('X-UA', event.request.headers.get('user-agent'));
    response.headers.set('X-DT', deviceType);

    const parsedPath = parsePath(url.pathname);

    if(parsedPath.path === "events"){
      const events = getNearbyEvents(location);
      class EventListHandler{
        element(element){
          element.setInnerContent(events.map(event => {
            return `<div class="event" onclick="javascript:navigate('/event/${event.id}')">
              <div class="banner" style="background-image: url(${event.banner});"></div>
              <div class="details">
                  <h3>${event.name}</h3>
                  <span>${Math.floor(event.distance)} km</span>
                  <span>${event.date}</span>
              </div>
          </div>`;
          }).join(""), { html: true });
        }
      }
      return new HTMLRewriter().on("div.event-list", new EventListHandler()).transform(response);
    }
    else if(parsedPath.path === "event"){
      const event = getEvent(parsedPath.id);
      class EventDetailsHandler{
        element(element){
          console.log("ELE", element.getAttribute("class"));
          switch(element.getAttribute("class")){
            case "banner-image":
              element.setAttribute("src", event.banner);
              break;
            case "name":
              element.setInnerContent(event.name);
              break;
            case "date":
              element.setInnerContent(event.date);
              break;
            case "location":
              element.setInnerContent(event.location.address);
              break;
            case "time":
              element.setInnerContent(event.time);
              break;
            case "buy-button":
              element.setAttribute("onclick", `javascript:navigate('/event/${event.id}/ticket')`);
              break;
          }
        }
      }
      return new HTMLRewriter().on(".banner img,.name,.date,.time,.buy button,.location", new EventDetailsHandler()).transform(response);
    }
    else if(parsedPath.path === "ticket"){
      const event = getEvent(parsedPath.id);
      class EventDetailsHandler{
        element(element){
          console.log("ELE", element.getAttribute("class"));
          switch(element.getAttribute("class")){
            case "banner-image":
              element.setAttribute("src", event.banner);
              break;
            case "name":
              element.setInnerContent(event.name);
              break;
            case "date":
              element.setInnerContent(event.date);
              break;
            case "time":
              element.setInnerContent(event.time);
              break;
            case "barcode":
              element.setInnerContent(`<span>${randomNumber(100000000, 999999999)}</span>`, { html: true });
              break;
          }
        }
      }
      return new HTMLRewriter().on(".banner img,.name,.date,.time,.barcode", new EventDetailsHandler()).transform(response);
    }

    return response

  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 })
  }
}


function getDeviceType(UA){
  // return "mobile";
  return /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
  /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA) ? "mobile" : "web"
}

function parsePath(pathname){
  const detailsRegex = /\/event\/([0-9a-z]*)/m;
  const ticketRegex = /\/event\/([0-9a-z]*)\/ticket/m;
  if(pathname === "/"){
    return { path: "events" };
  }
  else if(ticketRegex.test(pathname)){
    const result = pathname.match(ticketRegex);
    return { path: "ticket", id: result[1] };
  }
  else if(detailsRegex.test(pathname)){
    const result = pathname.match(detailsRegex);
    return { path: "event", id: result[1] };
  }
  return {};
}

function handlePath(){
  return request => {
    const navurl = new URL(request.url)
    const deviceType = getDeviceType(request.headers.get('user-agent'));
    
    // compute the default (e.g. / -> index.html)
    let defaultAssetKey = mapRequestToAsset(request)
    let url = new URL(defaultAssetKey.url)

    const parsedPath = parsePath(navurl.pathname);

    if(parsedPath.path === "events"){
      url.pathname = `/${deviceType}/index.html`;
    }
    else if(parsedPath.path === "event"){
      url.pathname = `/${deviceType}/details.html`;
    }
    else if(parsedPath.path === "ticket"){
      url.pathname = `/${deviceType}/ticket.html`;
    }
    else{
      url.pathname = `/${deviceType}/${url.pathname}`;
    }
    // inherit all other props from the default request
    return new Request(url.toString(), defaultAssetKey)
  }
}

/**
 * Here's one example of how to modify a request to
 * remove a specific prefix, in this case `/docs` from
 * the url. This can be useful if you are deploying to a
 * route on a zone, or if you only want your static content
 * to exist at a specific path.
 */
function handlePrefix(prefix) {
  return request => {
    // compute the default (e.g. / -> index.html)
    let defaultAssetKey = mapRequestToAsset(request)
    let url = new URL(defaultAssetKey.url)

    // strip the prefix from the path for lookup
    url.pathname = url.pathname.replace(prefix, '/')

    // inherit all other props from the default request
    return new Request(url.toString(), defaultAssetKey)
  }
}

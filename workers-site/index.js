import { express } from "cfw-express";
import { siteRenderer } from "cfw-express-static";

import { getDeviceType, calculateDistance, randomNumber } from "./utils";
import { getNearby, getEvent } from "./ds";

const app = express();

app.use(siteRenderer());

app.use((req) => {
  if (req.cf) {
    const cf = req.cf;
    req.location = {
      country: cf.country,
      region: cf.region,
      regionCode: cf.regionCode,
      city: cf.city,
      lat: Number(cf.latitude),
      lon: Number(cf.longitude),
    };
  } else {
    req.location = {
      country: "IN",
      region: "Tamil Nadu",
      regionCode: "TN",
      city: "Chennai",
      lat: 13.067439,
      lon: 80.237617,
    };
  }
  req.deviceType = getDeviceType(req.headers.get("user-agent"));
  req.org = req.url.hostname.replace(".pesu.in", "");
});

app.get("/", async (req, res) => {
  const events = await getNearbyEvents(req.location);
  class EventListHandler {
    element(element) {
      const org = req.org;
      if (element.tagName === "nav") {
        if (org === "blue") {
          if (req.deviceType === "web")
            element.setAttribute(
              "style",
              "background-image: url('/img/blue-banner.jpg'); color: #001737;"
            );
          element.setInnerContent("<span>Blue Pill Concerts</span>", {
            html: true,
          });
        } else if (org === "red") {
          if (req.deviceType === "web")
            element.setAttribute(
              "style",
              "background-image: url('/img/red-banner.jpg'); color: #46202B;"
            );
          element.setInnerContent("<span>Red Pill Concerts</span>", {
            html: true,
          });
        } else {
          if (req.deviceType === "web")
            element.setAttribute(
              "style",
              "background-image: url('/img/red-banner.jpg'); color: #46202B;"
            );
        }
      } else if (element.getAttribute("class") === "event-list") {
        element.setInnerContent(
          events
            .map((event) => {
              return `<div class="event" onclick="javascript:navigate('/event/${
                event.id
              }')">
                <div class="banner" style="background-image: url(${
                  event.banner
                });"></div>
                <div class="details">
                    <h3>${event.name}</h3>
                    <span>${Math.floor(event.distance)} km</span>
                    <span>${event.date}</span>
                </div>
            </div>`;
            })
            .join(""),
          { html: true }
        );
      } else if (element.tagName === "title") {
        element.setInnerContent(
          org === "red"
            ? "Red Pill Concerts"
            : org === "blue"
            ? "Blue Pill Concerts"
            : "Concert Booking"
        );
      }
    }
  }
  await res.render(`${req.deviceType}/index.html`, (response) => {
    return new HTMLRewriter()
      .on("nav,div.event-list,title", new EventListHandler())
      .transform(response);
  });
});

app.get("/event/:eventId", async (req, res) => {
  const event = await getEvent({
    eventId: req.params.eventId,
    ...req.location,
  });
  event.banner = `/img/banner/${event.bannerId}.jpg`;
  class EventDetailsHandler {
    element(element) {
      console.log("ELE", element.getAttribute("class"));
      switch (element.getAttribute("class")) {
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
          element.setAttribute(
            "onclick",
            `javascript:navigate('/event/${event.id}/ticket')`
          );
          element.setInnerContent(`Buy Ticket $${event.price}`);
          break;
      }
      if (element.tagName === "title") {
        element.setInnerContent(
          req.org === "red"
            ? "Red Pill Concerts"
            : org === "blue"
            ? "Blue Pill Concerts"
            : "Concert Booking"
        );
      }
    }
  }
  await res.render(`${req.deviceType}/details.html`, (response) => {
    return new HTMLRewriter()
      .on(
        "title,.banner img,.name,.date,.time,.buy button,.location",
        new EventDetailsHandler()
      )
      .transform(response);
  });
});

app.get("/event/:eventId/ticket", async (req, res) => {
  const event = await getEvent({
    eventId: req.params.eventId,
    ...req.location,
  });
  event.banner = `/img/banner/${event.bannerId}.jpg`;
  class EventDetailsHandler {
    element(element) {
      console.log("ELE", element.getAttribute("class"));
      switch (element.getAttribute("class")) {
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
        case "location":
          element.setInnerContent(event.location.address);
          break;
        case "barcode":
          element.setInnerContent(
            `<span>${randomNumber(100000000, 999999999)}</span>`,
            { html: true }
          );
          break;
      }
      if (element.tagName === "title") {
        element.setInnerContent(
          req.org === "red"
            ? "Red Pill Concerts"
            : org === "blue"
            ? "Blue Pill Concerts"
            : "Concert Booking"
        );
      }
    }
  }
  await res.render(`${req.deviceType}/ticket.html`, (response) => {
    return new HTMLRewriter()
      .on(
        "title,.banner img,.name,.location,.date,.time,.barcode",
        new EventDetailsHandler()
      )
      .transform(response);
  });
});

app.get("*", async (req, res) => {
  await res.render(`${req.deviceType}/${req.url.pathname}`);
});

app.listen();

export async function getNearbyEvents(location) {
  const events = await getNearby(location);
  return events
    .map((event) => {
      event.distance = calculateDistance(
        location.lat,
        location.lon,
        event.location.lat,
        event.location.lon
      );
      event.banner = `/img/banner/${event.bannerId}.jpg`;
      return event;
    })
    .sort((a, b) => {
      return a.distance - b.distance;
    });
}

const events = [
    {
        id: "one",
      name: "Electric Daisy Carnival",
      location: {
        address: "EDC Las Vegas, NV",
        lat: 36.114647,
        lon: -115.172813,
      },
      date: "May 31, 2021",
      time: "10:00 AM to 03:00 PM",
      bannerId: 1
    },
    {
        id: "two",
      name: "Opry at the Ryman",
      location: {
        address: "Nashville, TN",
        lat: 36.174465,
        lon: -86.767960,
      },
      date: "Apr 17, 2021",
      time: "05:00 PM to 10:00 PM",
      bannerId: 2
    },
    {
      id: "three",
    name: "Rolling Loud Music Festival",
    location: {
      address: "Miami Gardens, FL",
      lat: 25.942122,
      lon: -80.269920,
    },
    date: "Apr 17, 2021",
    time: "05:00 PM to 10:00 PM",
    bannerId: 3
  },
  ];

export function getNearbyEvents(location) {
  return events.map((event) => {
    event.distance = calculateDistance(
      location.lat,
      location.lon,
      event.location.lat,
      event.location.lon
    );
    event.banner = `/img/banner/${event.bannerId}.jpg`;
    return event;
  }).sort((a, b) => {
      return a.distance - b.distance;
  });
}

export function getEvent(id){
    const event = events.find(event => event.id === id);
    event.banner = `/img/banner/${event.bannerId}.jpg`;
    return event;
}

export function randomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    return dist * 1.609344;
  }
}

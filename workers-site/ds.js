import { randomNumber, random } from "./utils";

const EVENTS_SEED = [
    {
        name: "Electric Daisy Carnival",
        country: "US",
        time: "01:00 PM to 08:00 PM"
    },
    {
        name: "Rolling Loud Music Festival",
        country: "US",
        time: "05:00 PM to 10:00 PM"
    },
    {
        name: "Opry at the Ryman",
        country: "US",
        time: "09:00 AM to 01:00 PM"
    },
    {
        name: "Tallest Man on Earth",
        country: "US",
        time: "06:00 PM to 09:00 PM"
    },
    {
        name: "Carolina Country Music Festival",
        country: "US",
        time: "08:00 AM to 11:00 AM"
    },
    {
        name: "Boots in the Park",
        country: "US",
        time: "03:00 PM to 07:00 PM"
    },
    {
        name: "Usha Uthup's Original",
        country: "IN",
        time: "01:00 PM to 08:00 PM"
    },
    {
        name: "Melody Us",
        country: "IN",
        time: "04:00 PM to 08:00 PM"
    },
    {
        name: "Indian Music Experience",
        country: "IN",
        time: "10:00 AM to 05:00 PM"
    },
    {
        name: "Akil Sachdeva Live",
        country: "IN",
        time: "05:00 PM to 07:00 PM"
    },
    {
        name: "Darshan Raval Night",
        country: "IN",
        time: "07:00 PM to 10:00 PM"
    },
    {
        name: "Ibadat e Mausiqi",
        country: "IN",
        time: "06:00 PM to 09:00 PM"
    }
]

function randomDate(){
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + randomNumber(2, 15));
    return `${months[eventDate.getMonth()]} ${eventDate.getDate()}, ${eventDate.getFullYear()}`;
}

function randomLoc(lat, lon){
    return {
        lat: lat + (randomNumber(10000, 100000) / 1000000),
        lon: lon + (randomNumber(10000, 100000) / 1000000)
    }
}

async function generateEvents({
    country,
    region,
    regionCode,
    city,
    lat,
    lon
}){
    const key = `${country}:${regionCode || region}:${city}`;
    const events = JSON.parse(await CONCERTS_LIST.get(key));
    if(events){
        return events;
    }
    const seed = EVENTS_SEED.filter(event => {
        return ["US", "IN"].includes(country) ? event.country === country : event.country === "US";
    }).map(event => Object.assign({}, event));
    const newEvents = seed.map(event => {
        event.id = randomNumber(1000, 9999).toString();
        event.location = {
            address: `${city}, ${region || regionCode}`,
            ...randomLoc(lat, lon)
        };
        event.date = randomDate();
        event.bannerId = randomNumber(1, 6);
        event.price = random([500, 350, 1250, 100, 1000, 750]);
        return event;
    });
    await CONCERTS_LIST.put(key, JSON.stringify(newEvents));
    return newEvents;
}

export async function getNearby({
    country,
    region,
    regionCode,
    city,
    lat,
    lon
}){
    return await generateEvents({
        country,
        region,
        regionCode,
        city,
        lat,
        lon
    });
}

export async function getEvent({
    country,
    region,
    regionCode,
    city,
    eventId
}){
    const key = `${country}:${regionCode || region}:${city}`;
    const events = JSON.parse(await CONCERTS_LIST.get(key));
    return events.find(event => event.id === eventId);
}
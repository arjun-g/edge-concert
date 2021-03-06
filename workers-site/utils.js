export function randomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

export function random(arr){
  const rIndex = randomNumber(0, arr.length);
  return arr[rIndex];
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

export function getDeviceType(UA){
  return /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
  /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA) ? "mobile" : "web"
}
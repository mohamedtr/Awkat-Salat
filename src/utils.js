import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from 'adhan';
import { addMinutes, format, parse, setHours, setMinutes, differenceInMinutes, startOfDay } from 'date-fns';

export const calculatePrayerTimes = (date, lat, lng, adjustments, settings) => {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague(); // Can be changed based on region
  
  // Create pure Adhan object
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  const tzOffset = parseInt(settings.timezoneOffset || 0) * 60;

  // Apply logic for adjustments
  let calcFajr = addMinutes(prayerTimes.fajr, (parseInt(adjustments.fajr) || 0) + tzOffset);
  let calcShuruq = addMinutes(prayerTimes.sunrise, (parseInt(adjustments.shuruq) || 0) + tzOffset);
  let calcDhuhr = addMinutes(prayerTimes.dhuhr, (parseInt(adjustments.dhuhr) || 0) + tzOffset);
  let calcAsr = addMinutes(prayerTimes.asr, (parseInt(adjustments.asr) || 0) + tzOffset);
  let calcMaghrib = addMinutes(prayerTimes.maghrib, (parseInt(adjustments.maghrib) || 0) + tzOffset);
  let calcIsha = addMinutes(prayerTimes.isha, (parseInt(adjustments.isha) || 0) + tzOffset);

  // Apply fixed dhuhr rule
  if (settings.fixedDhuhr && settings.dhuhrFixedTime) {
    const [h, m] = settings.dhuhrFixedTime.split(':');
    calcDhuhr = setMinutes(setHours(date, parseInt(h)), parseInt(m));
  } else if (settings.dhuhrAlwaysBeforeAsr) {
    calcDhuhr = addMinutes(calcAsr, -(settings.dhuhrBeforeAsrMins || 15));
  }

  return {
    fajr: calcFajr,
    shuruq: calcShuruq,
    dhuhr: calcDhuhr,
    asr: calcAsr,
    maghrib: calcMaghrib,
    isha: calcIsha
  };
};

export const calculateIqama = (athanTime, delayOrTime) => {
  if (!delayOrTime) return athanTime;
  if (delayOrTime.includes(':')) {
    // It's a fixed time e.g. "05:30"
    const [h, m] = delayOrTime.split(':');
    return setMinutes(setHours(athanTime, parseInt(h)), parseInt(m));
  }
  // It's a delay in minutes
  return addMinutes(athanTime, parseInt(delayOrTime));
};

export const getNextPrayer = (timesObj, now) => {
  // Convert object to array sorted by time
  const prayers = [
    { name: 'fajr', time: timesObj.fajr },
    { name: 'dhuhr', time: timesObj.dhuhr }, // Ignore shuruq for next prayer
    { name: 'asr', time: timesObj.asr },
    { name: 'maghrib', time: timesObj.maghrib },
    { name: 'isha', time: timesObj.isha },
  ];
  
  for (let prayer of prayers) {
    if (now < prayer.time) {
      return prayer;
    }
  }
  return { name: 'fajr', time: addMinutes(timesObj.fajr, 24 * 60) }; // next day fajr dummy
}

export const getClosestCity = (lat, lng, cities) => {
  if (!lat || !lng || !cities || cities.length === 0) return null;
  let closest = cities[0];
  let minDiff = Math.pow(cities[0].lat - lat, 2) + Math.pow(cities[0].lng - lng, 2);
  
  for (let i = 1; i < cities.length; i++) {
    const diff = Math.pow(cities[i].lat - lat, 2) + Math.pow(cities[i].lng - lng, 2);
    if (diff < minDiff) {
      minDiff = diff;
      closest = cities[i];
    }
  }
  return closest;
};

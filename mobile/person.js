import { S3_URL } from './App.js';

// Maps nextInterval -> next due time in seconds
// First few are special cases handled in the code
const DUE_INTERVALS = [
  0, // Immediate
  60, // 1 min
  300, // 5 mins
  3600, // 1 hr
]
const DAY_IN_SECONDS = 86400;

export default class Person {
  constructor(id, displayname, images, nextInterval, dueDate) {
    this.displayname = displayname;
    this.id = id;
    this.images = images;
    this.nextInterval = nextInterval === undefined ? 0 : nextInterval;
    this.dueDate = dueDate === undefined ? new Date() : dueDate;
  }

  advance() {
    // Figure out when this card is due next
    const now = new Date();
    if (this.nextInterval < DUE_INTERVALS.length) {
      const secsUntilDue = DUE_INTERVALS[this.nextInterval];
      this.dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()+secsUntilDue);
    } else {
      const daysUntilDue = Math.pow(2, this.nextInterval-DUE_INTERVALS.length); // After the custom due intervals, just double the number of days
      this.dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+daysUntilDue, 4); // 4 am on that day
    }

    this.nextInterval++;
  }

  reset() {
    this.nextInterval = 0;
  }

  currentImage() {
    let imageIndex = this.nextInterval;
    imageIndex = Math.max(0, imageIndex);
    imageIndex %= this.images.length;
    return this.images[imageIndex];
  }
}

export async function getAllPeople() {

  const url = S3_URL + '/profiles.json';
  console.log('getAllPeople requesting: ' + url);

  const response = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  const json = await response.json();
  const people = deserializeFromS3(json);
  return people;
}

export function deserializeFromS3(json) {
  const people = new Map();
  for (let p of json) {
    const person = new Person(p.id, p.displayname, p.images);
    if (p.nextInterval !== undefined) {
      throw 'UNEXPECTED';
    }
    if (p.dueDate !== undefined) {
      throw 'UNEXPECTED';
    }
    people.set(p.id, person);
  }
  return people;
}

// seen: Map of seen people
export function summarizePeople(seen) {
  return [...seen.keys()].reduce((acc, k) => {
    let cur = seen.get(k);
    acc[k] = {id: cur.id,
              dueDate: cur.dueDate,
              nextInterval: cur.nextInterval, };
    return acc;
  }, {});
}

// seen: Object of seen people
// all: Map of all people
export function desummarizePeople(seen, all) {
  let result = Object.keys(seen).reduce((acc, k) => {
    if (!all.has(k)) {
      return acc;
    }

    let cur = all.get(k); // XXX: modifies entry in all list
    cur.dueDate = new Date(seen[k].dueDate);
    cur.nextInterval = seen[k].nextInterval;
    acc.set(k, cur);
    return acc;
  }, new Map());
  return result;
}

import { S3_URL } from './App.js';
//const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

// Maps nextInterval -> next due time in milliseconds
// First few are special cases handled in the code
const DUE_INTERVALS = [NaN, NaN, NaN, 1, 3, 8, 21, 49, 109, 245];
const NUM_INITIAL = 3;

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
    if (this.nextInterval < NUM_INITIAL) {
      this.nextInterval++;
      this.dueDate = now;
    } else {
      const dueIntervalIndex = Math.min(this.nextInterval, DUE_INTERVALS.length);
      const daysUntilDue = DUE_INTERVALS[dueIntervalIndex];
      this.nextInterval++;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+daysUntilDue, 4); // 4 am on that day
      this.dueDate = dueDate;
    }
  }

  reset() {
    this.nextInterval = 0;
  }

  currentImage() {
    let imageIndex = this.nextInterval - NUM_INITIAL;
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

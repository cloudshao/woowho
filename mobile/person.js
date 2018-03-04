import { S3_URL } from './App.js';
//const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

export default class Person {
  constructor(id, displayname, images, nextInterval, dueDate) {
    this.displayname = displayname;
    this.id = id;
    this.images = images;
    this.nextInterval = nextInterval === undefined ? 0 : nextInterval;
    this.dueDate = dueDate === undefined ? new Date() : dueDate;
  }
}

export async function getAllPeople() {
  return fetch(S3_URL + '/profiles.json', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }).then(
    (response) => {
      console.log(response);
      return response.json();
    }
  ).then(
    (blob) => {
      console.log(blob);
      people = deserializeFromS3(blob);
      return people;
    }
  ).catch((error) => { console.error(error); });
}

export function deserializeFromS3(json) {
  let people = {};
  for (let p of json) {
    let person = new Person(p.id, p.displayname, p.images);
    if (p.nextInterval !== undefined) {
      throw 'UNEXPECTED';
    }
    if (p.dueDate!== undefined) {
      throw 'UNEXPECTED';
    }
    people[p.id] = person;
  }
  return people;
}

export function summarizePeople(seen) {
  return [...seen.keys()].reduce((acc, k) => {
    let cur = seen.get(k);
    acc[k] = {id: cur.id,
              dueDate: cur.dueDate,
              nextInterval: cur.nextInterval, };
    return acc;
  }, {});
}

export function desummarizePeople(seen, all) {
  let result = Object.keys(seen).reduce((acc, k) => {
    if (!(k in all)) {
      return acc;
    }

    let cur = all[k]; // XXX cshao: modifies entry in all list
    cur.dueDate = new Date(seen[k].dueDate);
    cur.nextInterval = seen[k].nextInterval;
    acc.set(k, cur);
    return acc;
  }, new Map());
  return result;
}

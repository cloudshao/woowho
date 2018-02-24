
export default class Person {
  constructor(id, name, images, nextInterval, dueDate) {
    this.name = name;
    this.id = id;
    this.images = images;
    this.nextInterval = nextInterval === undefined ? null : nextInterval;
    this.dueDate = dueDate === undefined ? Date.now() : dueDate;
  }
}

export let allPeople = [
  new Person("patrickstewart", "Patrick Stewart", ["faces/patrickstewart1.png"]),
  new Person("britneyspears", "Britney Spears", ["faces/patrickstewart1.png"]),
  new Person("hyori", "Hyori", ["faces/patrickstewart1.png",
    "faces/patrickstewart1.png",
    "faces/patrickstewart1.png"]),
];

export function deserializePeople(json) {
  const obj = JSON.parse(json);
  const arr = obj.seen;
  let seenPeople = [];
  for (let p of arr) {
    seenPeople.push(new Person(p.id, p.name, p.images, p.nextInterval, p.dueDate));
  }
  return seenPeople;
}

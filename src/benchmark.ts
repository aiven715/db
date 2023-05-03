import * as idb from "idb";
import { faker } from "@faker-js/faker";
import { deserialize, serialize } from "./core/automerge";

const COUNT = 1;
faker.seed(1);
const people = generatePeople();

export async function main() {
  // benchmark("json", () => filterData("json"));
  // benchmark("binary", () => filterData("binary"));
  // await insertData("json");
  // await insertData("binary");
}

function generatePeople() {
  const people = [];
  for (let i = 0; i < COUNT; i++) {
    people.push({
      id: faker.datatype.uuid(),
      name: faker.name.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.address.streetAddress(),
      city: faker.address.city(),
      state: faker.address.state(),
      zip: faker.address.zipCode(),
    });
  }
  return people;
}

export async function filterData(format: "json" | "binary") {
  const db = await idb.openDB(`test:${format}`, 1);
  const tx = db.transaction("people", "readonly");
  const store = tx.objectStore("people");

  // let cursor = await store.openCursor();
  // while (true) {
  //   if (!cursor) {
  //     break;
  //   }
  //   const record = format === "json" ? cursor.value : deserialize(cursor.value);
  //   if (record.state === "California") {
  //     results.push(record);
  //   }
  //   cursor = await cursor.continue();
  // }
  // return results;
  return await store.getAll();
}

async function insertData(format: "json" | "binary") {
  const db = await idb.openDB(`test:${format}`, 1, {
    upgrade(db) {
      db.createObjectStore("people", {
        autoIncrement: true,
      });
    },
  });
  const tx = db.transaction("people", "readwrite");
  const store = tx.objectStore("people");
  for (const person of people) {
    await store.put(format === "json" ? person : serialize(person));
  }
  await tx.done;
  db.close();
}

async function benchmark(type: "json" | "binary", fn: () => Promise<any>) {
  console.time(type);
  await fn();
  console.timeEnd(type);
}

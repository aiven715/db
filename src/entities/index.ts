import { init } from "~/database";

export const database = init(["todos"]);

// import * as Automerge from "@automerge/automerge";
// import localForage from "localforage";
//
// // let doc = Automerge.init();
//
// function addItem(text, doc) {
//   return Automerge.change(doc, (doc) => {
//     if (!doc.items) doc.items = [];
//     doc.items.push({ text, done: false });
//   });
// }
//
// function toggle(index, doc) {
//   return Automerge.change(doc, (doc) => {
//     doc.items[index].done = !doc.items[index].done;
//   });
// }
//
// // let nextDoc = addItem("test", doc);
// // let binary = Automerge.save(nextDoc);
// // localForage.setItem("doc", binary).catch((err) => console.log(err));
//
// localForage.getItem("doc").then((binary) => {
//   const doc = Automerge.load(binary);
//   console.log(doc.items);
// });

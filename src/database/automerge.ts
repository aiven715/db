import * as Automerge from "@automerge/automerge";
import { Entry } from "~/database/types";

export const serialize = <T extends Entry>(value: T) => {
  const doc = Automerge.from(value);
  return Automerge.save(doc);
};

export const deserialize = <T extends Entry>(binary: Uint8Array) => {
  return Automerge.load<T>(binary) as T;
};

export const compact = (binary: Uint8Array) => {
  return serialize(deserialize(binary));
};

export const update = <T extends Entry>(
  binary: Uint8Array,
  data: Partial<T>
) => {
  const doc = Automerge.load<T>(binary);
  const nextDoc = Automerge.change(doc, (props) => {
    Object.assign(props, data);
  });
  return Automerge.save(nextDoc);
};

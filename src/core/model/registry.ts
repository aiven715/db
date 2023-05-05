import { Model } from "./index";
import { Entry } from "../types";

export const registry: (typeof Model<Entry>)[] = [];

export const register = (Class: typeof Model<Entry>) => {
  registry.push(Class);
};

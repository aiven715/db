import LocalForage from "localforage";

export class Storage {
  private instance = LocalForage.createInstance({ name: this.name });

  constructor(private name: string) {}

  async list() {
    const keys = await this.instance.keys();
    return await Promise.all(
      keys.map(async (key) => {
        const item = await this.instance.getItem<Uint8Array>(key);
        return item!;
      })
    );
  }

  async get(id: string) {
    const binary = await this.instance.getItem<Uint8Array>(id);
    if (!binary) {
      throw new Error("Document not found");
    }
    return binary;
  }

  async set(id: string, binary: Uint8Array) {
    await this.instance.setItem(id, binary);
  }

  async remove(id: string) {
    await this.instance.removeItem(id);
  }
}

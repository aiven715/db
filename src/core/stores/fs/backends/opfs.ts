import { FsStoreBackend } from "./index";

export class OpfsFsStoreBackend implements FsStoreBackend {
  constructor(private root: FileSystemDirectoryHandle) {}

  async listDirectory(directory: string): Promise<string[]> {
    const dir = await this.root.getDirectoryHandle(directory);
    const names: string[] = [];
    for await (const entry of dir as any) {
      names.push(entry.name);
    }
    return names;
  }

  async createDirectory(directory: string): Promise<void> {
    await this.root.getDirectoryHandle(directory, { create: true });
  }

  async readFile(directory: string, name: string): Promise<Uint8Array> {
    const file = await this.root.getFileHandle(`${directory}/${name}`);
    const fileHandle = await file.getFile();
    const fileBlob = await fileHandle.slice();
    return new Uint8Array(await fileBlob.arrayBuffer());
  }

  async writeFile(
    directory: string,
    name: string,
    data: Uint8Array
  ): Promise<void> {
    // const dir = await this.root.getDirectoryHandle(directory, { create: true });
    // const file = await dir.getFileHandle(name, { create: true });
    // const writable = await file.createWritable();
    // await writable.write(data);
    // await writable.close();
  }

  async removeFile(directory: string, name: string): Promise<void> {
    // const file = await this.root.getFileHandle(`${directory}/${name}`);
    // await file.removeEntry(name, { recursive: true });
  }

  static async create() {
    const fs = await navigator.storage.getDirectory();
    return new OpfsFsStoreBackend(fs);
  }
}

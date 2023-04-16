// TODO: backends - fs, opfs, ipfs, s3, etc
export type FsStoreBackend = {
  listDirectory: (directory: string) => Promise<string[]>;
  createDirectory: (directory: string) => Promise<void>;
  readFile: (directory: string, name: string) => Promise<Uint8Array>;
  writeFile: (
    directory: string,
    name: string,
    data: Uint8Array
  ) => Promise<void>;
  removeFile: (directory: string, name: string) => Promise<void>;
};

export interface Closable {
  close(): Promise<void>;
}
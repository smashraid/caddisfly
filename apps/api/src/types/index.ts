export interface Closable {
  disconnect: () => Promise<void>;
}
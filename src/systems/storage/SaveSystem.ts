import type { IStorage } from './IStorage';
import type { DayStats } from '../../data/types';

const SAVE_KEY = 'bungeo_save_v1';

export class SaveSystem {
  constructor(private storage: IStorage) {}

  async save(data: DayStats): Promise<void> {
    try {
      await this.storage.set(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch {
      // silent fail
    }
  }

  async load(): Promise<DayStats | null> {
    try {
      const raw = await this.storage.get(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DayStats;
      return parsed.version === 'v1' ? parsed : null;
    } catch {
      return null;
    }
  }

  async remove(): Promise<void> {
    await this.storage.remove(SAVE_KEY);
  }
}

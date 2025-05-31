// Временное хранение кодов в памяти для одноразового использования
interface CodeEntry {
  code: string;
  phone: string;
  messageId?: number;
  createdAt: Date;
  expiresAt: Date;
}

class MemoryCodeStorage {
  private telegramCodes = new Map<string, CodeEntry>();
  private smsCodes = new Map<string, CodeEntry>();

  // Очистка истекших кодов каждые 5 минут
  constructor() {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Telegram коды
  saveTelegramCode(phone: string, code: string, messageId?: number): void {
    const key = `${phone}:${code}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    this.telegramCodes.set(key, {
      code,
      phone,
      messageId,
      createdAt: new Date(),
      expiresAt,
    });

    console.log(`Telegram code saved: ${code} for ${phone}, expires at ${expiresAt.toISOString()}`);
  }

  verifyTelegramCode(phone: string, code: string): boolean {
    const key = `${phone}:${code}`;
    const entry = this.telegramCodes.get(key);

    if (!entry) {
      console.log(`Telegram code not found: ${code} for ${phone}`);
      return false;
    }

    if (new Date() > entry.expiresAt) {
      console.log(`Telegram code expired: ${code} for ${phone}`);
      this.telegramCodes.delete(key);
      return false;
    }

    // Код используется один раз, удаляем после проверки
    this.telegramCodes.delete(key);
    console.log(`Telegram code verified and removed: ${code} for ${phone}`);
    return true;
  }

  // SMS коды
  saveSmsCode(phone: string, code: string): void {
    const key = `${phone}:${code}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    this.smsCodes.set(key, {
      code,
      phone,
      createdAt: new Date(),
      expiresAt,
    });

    console.log(`SMS code saved: ${code} for ${phone}, expires at ${expiresAt.toISOString()}`);
  }

  verifySmsCode(phone: string, code: string): boolean {
    const key = `${phone}:${code}`;
    const entry = this.smsCodes.get(key);

    if (!entry) {
      console.log(`SMS code not found: ${code} for ${phone}`);
      return false;
    }

    if (new Date() > entry.expiresAt) {
      console.log(`SMS code expired: ${code} for ${phone}`);
      this.smsCodes.delete(key);
      return false;
    }

    // Код используется один раз, удаляем после проверки
    this.smsCodes.delete(key);
    console.log(`SMS code verified and removed: ${code} for ${phone}`);
    return true;
  }

  // Очистка истекших кодов
  private cleanup(): void {
    const now = new Date();
    let telegramCleaned = 0;
    let smsCleaned = 0;

    // Очищаем Telegram коды
    for (const [key, entry] of this.telegramCodes.entries()) {
      if (now > entry.expiresAt) {
        this.telegramCodes.delete(key);
        telegramCleaned++;
      }
    }

    // Очищаем SMS коды
    for (const [key, entry] of this.smsCodes.entries()) {
      if (now > entry.expiresAt) {
        this.smsCodes.delete(key);
        smsCleaned++;
      }
    }

    if (telegramCleaned > 0 || smsCleaned > 0) {
      console.log(`Cleanup: removed ${telegramCleaned} telegram codes, ${smsCleaned} SMS codes`);
    }
  }

  // Статистика для отладки
  getStats(): { telegramCodes: number; smsCodes: number } {
    return {
      telegramCodes: this.telegramCodes.size,
      smsCodes: this.smsCodes.size,
    };
  }
}

export const memoryCodeStorage = new MemoryCodeStorage();
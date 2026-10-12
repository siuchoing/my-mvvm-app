import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
/**
 * [類別作用] 全域輕量級本地持久化儲存服務 (Persistent Storage Service)
 * 
 * 1. 統一資料存取介面 (Unified Wrapper)：
 *    封裝 Capacitor 的 `@capacitor/preferences` 插件。在行動裝置（iOS/Android）上會自動呼叫
 *    原生的 Key-Value 儲存系統（UserDefaults / SharedPreferences）；在網頁環境（Web/Browser）
 *    下則會自動降級（Fallback）使用瀏覽器的 `window.localStorage`。
 * 
 * 2. 自動化序列化與型別安全 (Serialization & Type Safety)：
 *    統一處理複雜物件與 JSON 字串之間的轉換。利用 TypeScript 泛型（Generics）機制 `<T>`，
 *    讓外部元件或倉庫（Repository）在讀取資料時，能直接獲得 100% 精準的程式碼強型別自動提示。
 * 
 * 3. 系統隔離與版本演進：
 *    透過 Capacitor 套件寫入的資料，底層在 Web 環境會自動被加上系統前綴字（如新版的 `_cap_` 
 *    或舊版本的 `CapacitorStorage.`），有效防止與網頁其他第三方套件或原生 LocalStorage 
 *    的 Key 值發生碰撞。
 */

// 宣告此類別為全域單例服務，負責操作手機原生持久化儲存空間，為全專案提供輕量級本地快取支援。
@Injectable({ providedIn: 'root' })
export class StorageService {
  /**
   * 將傳入的資料進行 JSON 序列化（將物件轉為純文字字串）後，非同步持久化寫入手機原生的 Key-Value 儲存區。
   * • 由於原生手機硬碟只能儲存字串，因此必須透過 JSON.stringify 進行轉型。
   * 
   * 💡【使用範例 / Use Example】：
   * 外部呼叫：storage.set('user_1', { name: '少明', email: 'sm@example.com' })
   * 晶片硬碟實際儲存的純文字："{"name":"少明","email":"sm@example.com"}"
   */
  async set(key: string, value: any) {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }

  /**
  * 自手機硬碟非同步讀取純文字快取，並透過 JSON 反序列化（將純文字轉回物件）與型別斷言，回傳強型別物件或 null。
  * • 使用 TypeScript 泛型（Generics）機制 <T>，允許外部調用時動態指定回傳的資料模型型別。
  * 
  * 💡【使用範例 / Use Example】：
  * 外部呼叫：const data = await storage.get<UserModel>('user_1');
  * 1. 底層先從硬碟拔出純文字字串："{"name":"少明","email":"sm@example.com"}"
  * 2. 透過 JSON.parse 重新還原解鎖成 TypeScript 可操作的強型別物件物件。
  * 3. 外部的 data 變數立刻獲得 100% 精準的屬性自動提示（如 data.name、data.email）。
  */
  async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) as T : null;
  }
}

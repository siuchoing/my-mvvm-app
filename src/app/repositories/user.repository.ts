import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserModel } from '../models/user.model';
import { StorageService } from '../services/storage.service';
import { UserService } from '../services/user.service';
/**
 * [類別作用] 使用者資料數據倉庫 (User Repository)
 * 
 * 1. 職責分離 (Repository Pattern)：
 *    作為全 App 的「使用者資料單一真實來源 (Single Source of Truth)」。封裝了底層 API 網路請求
 *    與本地持久化儲存 (Storage) 的細節，讓 UI 元件不必關心資料是從網路還是快取取得。
 * 
 * 2. 數據更新策略 (Stale-While-Revalidate / 快取優先)：
 *    呼叫 `loadUser` 時，會立即推送本地快取資料讓畫面秒開 (零延遲體驗)，同時在背景發送 API 
 *    撈取後端最新資料。當網路資料回傳後，會自動覆蓋快取並即時廣播刷新 UI。
 * 
 * 3. 響應式狀態管理 (Reactive State Management)：
 *    利用 RxJS 的 BehaviorSubject 持有當前狀態，並曝露唯讀的 Observable (`user$`) 供各個
 *    頁面 (如個人資料頁、設定頁) 訂閱。一旦資料發生異動，全 App 的相關畫面將同步動態更新。
 */
@Injectable({ providedIn: 'root' })
export class UserRepository {
  // 使用 inject 函數進行屬性注入，獲取所需的服務執行個體
  private http = inject(HttpClient);
  private userService = inject(UserService); 
  private storageService = inject(StorageService);

  // 定義儲存於本地 Preferences / localStorage 時使用的唯一字串 Key 值前綴。
  private readonly CACHE_KEY = 'user_data';

  // 建立一個具有「當前資料記憶功能」的全域狀態廣播器，用來儲存使用者資料（若尚未載入則為空值 null），並在資料變更時即時通知所有訂閱的畫面同步更新。
  // • BehaviorSubject（可讀、可寫）：具備「收聽（Subscribe）」和「更新內部狀態（Update）及全域廣播（Broadcast））」的雙重能力。
  // • 例如, 使用this.userSubject.next(newUserData) 來Update data, then Broadcast。
  private userSubject = new BehaviorSubject<UserModel | null>(null);

  // 外部元件（如 UserProfilePage）只能透過這個通道來「訂閱」最新的使用者資料，而無法直接從外部修改它。
  // • Observable（純唯讀）：它只有「收聽（Subscribe）」的能力，底層完全沒有 .next() 方法。
  // • 由於這個是唯讀資料流廣播通道的 Getter 屬性, 因此在外部呼叫時不需要加括號，直接透過 .user$ 即可取得此資料流。
  // • 例如 this.userRepo.user$.subscribe() in user.repository.ts
  get user$(): Observable<UserModel | null> {
    return this.userSubject.asObservable();
  }
  
  /**
   * 核心功能：先讀取「快取」(Cache)，同時在背景撈取最新網路 API 資料
   */
  async loadUser(id: string): Promise<void> {
    // 1. 讀取本地快取
    const cached = await this.storageService.get<UserModel>([this.CACHE_KEY, id].join('_'));
    if (cached) {
      this.userSubject.next(cached); // 快取存在，立刻廣播讓畫面秒開
    }

    // 2. 背景發送網路請求更新
    this.userService.fetchUser(id).subscribe({
      next: async (remote) => {
        if (remote) {
          this.userSubject.next(remote); // 網路拿到最新資料，再次廣播刷新畫面
          await this.storageService.set([this.CACHE_KEY, id].join('_'), remote); // 更新快取
        }
      },
      error: (err) => {
        console.error('後端 API 請求失敗，維持使用快取或預設狀態。', err);
        
        // 防禦機制：若沒快取、網路又失敗，推送一個安全的基礎空模型，防止畫面白一片
        if (!this.userSubject.value) {
          this.userSubject.next({
            id: id,
            name: '新用戶 (未同步)',
            email: 'exmaple@gmail.com',
            avatarUrl: 'https://www.svgrepo.com/show/384670/account-avatar-profile-user.svg'
          });
        }
      }
    });

  }

  /**
   * 供 SettingsPage 儲存時呼叫：同時寫入快取並向全 App 發送即時畫面更新廣播
   */
  async updateUserLocal(id: string, updatedUser: UserModel): Promise<void> {
    await this.storageService.set(`${this.CACHE_KEY}_${id}`, updatedUser);
    this.userSubject.next(updatedUser); // 觸發響應式即時同步
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel } from '../models/user.model';

// 宣告此類別為全域單例服務，專門負責封裝底層向雲端伺服器（API）索取真實資料的外部網路接口（HTTP Client）。
@Injectable({ providedIn: 'root' })
export class UserService {
    // 使用 inject 函數進行屬性注入，獲取 Angular 內建用來發送網路請求的 HttpClient 工具執行個體。
  private http = inject(HttpClient); 

  /**
   * 根據使用者 ID 發送非同步 HTTP GET 請求，向後端雲端 API 撈取最新資料，並回傳一個強型別的 Observable 資料流。
   * • 透過型別泛型 <UserModel>，強制將 API 回傳的 JSON 資料解析並包裝成完全符合 UserModel 規格的物件。
   * 
   * 💡【使用範例 / Use Example】：
   * 外部呼叫：this.userService.fetchUser('1').subscribe({ next: (user) => console.log(user.name) });
   * 1. 執行時會對外發出網路請求，真實網址為：https://example.com
   * 2. 後端伺服器處理完畢後，會回傳資料物件，並經由 RxJS Observable 通道精確推送給訂閱端（如 UserRepository）。
   */
  fetchUser(id: string): Observable<UserModel> {
    return this.http.get<UserModel>(`https://api.example.com/users/${id}`);
  }
}
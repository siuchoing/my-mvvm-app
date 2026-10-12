import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonItem, IonInput, IonButton, 
  IonAvatar
} from '@ionic/angular';
import { Router } from '@angular/router';
import { UserRepository } from '../../repositories/user.repository';
import { UserModel } from '../../models/user.model';
import { Subscription } from 'rxjs';

/**
 * [類別作用] 使用者設定編輯頁面 (User Settings Edit Component)
 * 
 * 1. 雙向狀態維護 (Two-Way Data Binding)：
 *    做為資料的編輯者（Data Mutator），透過 Angular `FormsModule` 的 `[(ngModel)]` 控制三個內部屬性，
 *    負責收集使用者在 UI 表單上修改的最新數值（姓名、Email、大頭貼網址）。
 * 
 * 2. 狀態監聽與自動回填 (State Synchronization)：
 *    在初始化 `ngOnInit` 時，主動訂閱 `UserRepository` 的廣播流。只要進入此頁面，便能同步取得
 *    當前的最新快取資料，並自動反填至編輯欄位中，確保表單顯示的是目前最新的狀態。
 * 
 * 3. 觸發狀態廣播與本地持久化：
 *    當點擊儲存時，直接將新物件交付給 `UserRepository.updateUserLocal()` 進行資料寫入。
 *    此動作會同步改寫本地持久化快取，並同步觸發全 App 響應式廣播，使得被卸載在後台的 
 *    `UserProfilePage` 能夠在「完全不需重新整理」的情況下自動刷新資料。
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonItem, 
    IonInput, 
    IonButton,
    IonAvatar
  ]
})

export class SettingsPage implements OnInit, OnDestroy {
  private userRepo = inject(UserRepository);
  private router = inject(Router);
  private sub!: Subscription; 

  // 雙向綁定所需要的屬性
  newName: string = '';
  newEmail: string = '';
  avatarUrl: string = 'https://www.svgrepo.com/show/384670/account-avatar-profile-user.svg';
  readonly DEFAULT_AVATAR = 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'
  
  ngOnInit() {
    // 訂閱全域 Repo 響應式資料流，將目前擁有的使用者資訊回填至輸入框中
    this.sub = this.userRepo.user$.subscribe((user: UserModel | null) => {
      if (user) {
        this.newName = user.name;
        this.newEmail = user.email;
        this.avatarUrl = user.avatarUrl; // 回填現有的大頭貼網址
      }
    });
  }
  
  
  ngOnDestroy() {
    // 生命週期安全防禦：頁面切換銷毀時，必須立即退訂，避免記憶體洩漏
    if (this.sub) {
      this.sub.unsubscribe(); // 安全釋放訂閱
    }
  }

  // 執行表單儲存：整合新資料、更新本機倉庫快取，並導回原頁面 (user-profile)
  async saveData() {
    const userId: string = "1";
    const updated: UserModel = {
      id: userId,
      name: this.newName,
      email: this.newEmail,
      // 防禦機制：若使用者把網址刪光了，預設給予萬用 SVG 圖片網址
      avatarUrl: this.avatarUrl.trim() || 'https://www.svgrepo.com/show/384670/account-avatar-profile-user.svg'
    };
    
    // 統一交付 Repo 進行本地快取更新與全 App 響應式廣播
    await this.userRepo.updateUserLocal(userId, updated);
    
    // 透過元件抽換渲染 (Component Render) 的路由切換，毫秒級平滑返回個人主頁
    this.router.navigate(['/user-profile']);
  }

  // 🟢 核心防禦機制：當 HTML 端的 <img> 載入發生 404 或解析出錯時自動觸發
  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src !== this.DEFAULT_AVATAR) {
      imgElement.src = this.DEFAULT_AVATAR; // 即時更換為安全圖示，防止碎裂圖案
    }
  }
}

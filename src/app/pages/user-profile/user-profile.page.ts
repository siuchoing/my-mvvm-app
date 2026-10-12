import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonAvatar, IonButton, IonSpinner } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserRepository } from '../../repositories/user.repository';
import { UserModel } from '../../models/user.model';
import { Subscription } from 'rxjs';
/**
 * [類別作用] 使用者個人資料檢視頁面 (User Profile View Component)
 * 
 * 1. 響應式資料渲染 (Reactive UI Rendering)：
 *    本身不直接與後端 API 或本地快取（Storage）互動。而是作為數據消費者（Data Consumer），
 *    在 `ngOnInit` 時「訂閱」`UserRepository` 的唯讀廣播通道 `user$`。一旦全域狀態發生任何
 *    改變（例如從 SettingsPage 修改了姓名），此畫面會自動響應並同步即時更新。
 * 
 * 2. 驅動資料載入 (Data Fetch Trigger)：
 *    初始化時主動呼叫 `userRepo.loadUser('1')`，驅動資料仓库啟動「快取優先、背景更新」的
 *    雙軌載入機制，確保使用者一進來就能以最快速度看到快取畫面。
 * 
 * 3. 記憶體防禦機制 (Memory Leak Prevention)：
 *    實作 Angular `OnDestroy` 介面，在頁面銷毀、切換路由時，主動取消 RxJS 的訂閱（`unsubscribe`），
 *    徹底釋放記憶體參考，防止全域廣播通道因為殘留無效的監聽器而導致系統效能下滑。
 */
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
  standalone: true,
  imports: [ IonContent, IonHeader, IonTitle, IonToolbar, IonAvatar, IonButton, IonSpinner, CommonModule, FormsModule ]
})
export class UserProfilePage implements OnInit, OnDestroy {
  private userRepo = inject(UserRepository);
  private router = inject(Router);
  private sub!: Subscription;

  user: UserModel | null = null;
  userId: string = "1";

  ngOnInit() {
    // 1. 訂閱全域廣播
    this.sub = this.userRepo.user$.subscribe((data: UserModel | null) => {
      this.user = data;
    });

    // 2. 觸發自動調度載入流程
    this.userRepo.loadUser(this.userId); 
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  /**
   * 路由導向觸發器：將畫面切換至設定頁面
   * 
   * 【底層渲染機制說明 / Render Behavior】：
   * 此處觸發的是單頁應用程式（SPA）的高效能「元件渲染 (Component Render)」，而非傳統網頁的整頁刷新 (Page Render)。
   * 1. 網頁並不會變白重新整理，而是透過 HTML5 History API 默默改變網址列為 '/settings'。
   * 2. Angular 路由器會將當前的 UserProfilePage 元件從 DOM 樹上卸載（同時觸發 ngOnDestroy 以銷毀 RxJS 訂閱、釋放記憶體）。
   * 3. 隨即在同一個舞台（ion-router-outlet 插槽）內，直接動態插入並渲染出 SettingsPage 元件，達到毫秒級的原生 App 換頁流暢體驗。
   */
  goToSettings() { 
    this.router.navigate(['/settings']); 
  }
}

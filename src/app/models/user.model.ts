/**
 * [資料模型] 全域使用者核心資料結構定義 (User Core Data Model)
 * 
 * 1. 職責規範 (Single Contract)：
 *    做為全專案的「使用者資料唯一規格書」。不論是從後端 API 撈回來的 JSON 網路數據、
 *    持久化儲存於硬碟的本地快取（Storage）、還是要在各個畫面（UI Component）之間流轉的響應式資料，
 *    都必須百分之百嚴格遵守此介面所規定的欄位名稱與型別。
 * 
 * 2. 擴充指引：
 *    未來若需要增加使用者屬性（例如：手機號碼、權限群組等），必須優先在此介面進行欄位宣告，
 *    以確保全系統能第一時間獲得編譯期的型別安全檢查與編輯器（VS Code）的自動補全提示。
 */
export interface UserModel {
  id: string; // 例如："1"、"usr_9b1deb4d"
  name: string; // 例如："Console神祕用戶"、"本機測試高手"
  email: string; // 例如："peter@gmail.com"
  avatarUrl: string; // 例如："https://ionicframework.com"
}

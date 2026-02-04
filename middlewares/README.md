# Middleware 使用說明

是「請求進來後、真正進 controller 前，用來做『通用流程處理』的中介層」。

- middleware 的價值 =「可插拔、可重用；與單一業務無關、可重複使用」
- middleware 不負責「業務資料計算或提供與資料計算相關的參數」，只負責「請求流程的控制與前置條件準備」。
  ✔ 有沒有登入
  ✔ 欄位齊不齊
  ✔ 格式對不對
  ✔ 要不要直接擋下

=====================

# 判斷標準（超重要）

「如果未來換一個功能，這段程式還能直接用嗎？」

- 能 → middleware
- 不能 → 放在其他地方

=====================

# Middleware 常見用法

✔ 驗證與授權（auth / role check）  
✔ 請求資料格式轉換（parse / normalize）  
✔ 防呆與欄位檢查（validate）  
✔ 共用流程控制（logging / rate limit）

=====================

# Middleware 設計原則

1. Middleware **不得直接回傳業務資料（計算資料）**
2. Middleware 若修改 req，需明確標示新增欄位
3. Middleware 應保持「可插拔、可移除」
4. 若移除此 middleware，controller 仍能正常運作

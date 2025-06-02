1. 在 index.html 中，用 get 呼叫 /api/prices api ，最下方用 table 顯示 alchol_prices 所有資料
2. 在 index.html 中，支援POST，產生 可以輸入 日期 price_14價錢 price_133價錢 price_134價錢 price_135價錢 price_136價錢 (date, price_14, price_133, price_134, price_135, price_136) 的表單，不使用 action
3. 在 index.html 中，將上面表單的資料，透過 fetch async await 來發送 POST 請求到 /api/insert ，並在成功後，用 p 顯示伺服器回傳的【純文字】訊息，不是 json 
4. 在 index.html 中，支援POST，產生 可以查詢 日期 price_14價錢 price_133價錢 price_134價錢 price_135價錢 price_136價錢 (date, price_14, price_133, price_134, price_135, price_136) 的表單
5. 在 index.html 中，支援POST，產生 可以刪除 日期 price_14價錢 price_133價錢 price_134價錢 price_135價錢 price_136價錢 (date, price_14, price_133, price_134, price_135, price_136) 的表單
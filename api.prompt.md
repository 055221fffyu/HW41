1. 在 app.js 中，使用 sqlite3 來操作資料庫，並開啟位置在 db/sqlite.db 的資料庫，需要確認是否成功打開資料庫。不要用匯入 db.js的方式。
2. 在 app.js 中，撰寫 /api/prices 路由，使用 SQL 來查詢 alchol_prices table 所有的price資料，回傳 json 格式的資料就好。
3. 在 app.js 中，撰寫 post /api/insert 路由，使用 SQLite 新增一筆酒的價錢資料 (date, price_14, price_133, price_134, price_135, price_136)，alchol_prices 中，回傳文字的訊息，不要 json。 
4. 在 app.js 中，撰寫 post /api/delete 路由，使用 SQLite 刪除一筆酒的價錢資料 (date, price_14, price_133, price_134, price_135, price_136)，alchol_prices 中，回傳文字的訊息，不要 json。
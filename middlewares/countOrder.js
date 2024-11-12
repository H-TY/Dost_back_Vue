import MbookingOrderData from '../models/bookingOrder.js'

// 計算 4 個月內的訂單，訂單數量最多的前 3 名狗狗
export default async (req, res, next) => {
  try {
    // console.log('req', req)
    // console.log('req.query.reNowDate', req.query.reNowDate)

    const reNowDate = Number(req.query.reNowDate)
    // console.log('reNowDate', reNowDate)

    const FourMonth = []

    // 從當天月份往回推 4 個月，並把它放置 FourMonth 的空陣列
    // .toString() 轉為文字，方便後續作關鍵字搜尋用
    for (let i = 0; i < 4; i++) {
      FourMonth.push((reNowDate - i).toString())
    }
    // console.log('FourMonth', FourMonth)

    // 若要用正則表達式的搜尋多個關鍵字，關鍵字間需用 | 作分隔
    // 正則表達式的 | 表示"或"，用來匹配多個關鍵字
    const reFourMonth = FourMonth.join('|')
    // console.log('reFourMonth', reFourMonth)

    // 用 reFourMonth 作為關鍵字
    const regex = new RegExp(reFourMonth, 'i')

    // .find 指定搜尋訂單狀態有效，且訂單編號用 regex 做關鍵字搜尋
    const data = await MbookingOrderData
      .find({
        orderStatus: true,
        bookingOrderNumber: regex
      })
    // console.log('data', data)

    // 計算狗狗名字在 data 個別出現的次數
    // 用 reduce 做迴圈累加
    // 輸出的資料是物件
    const countDogName = data.reduce((acc, el) => {
      acc[el.dogName] = (acc[el.dogName] || 0) + 1
      return acc
    }, {})
    // console.log('countDogName', countDogName)

    // 排序並取前 3 位的資料，並轉成正則表達式做為搜尋的關鍵字
    const TopThree = Object.entries(countDogName)
      .sort((a, b) => {
        // console.log('a', a)
        // console.log('a[1]', a[1])
        return b[1] - a[1]
      })
      // 取前 3 位元素
      .splice(0, 3)
      // 將資料轉成自己想要的資料樣式
      .map(([dogName, counter]) => {
        return { dogName, counter }
      })
    // console.log('TopThree', TopThree)

    // 有多個關鍵字要搜尋用 | 隔開
    const regexTopThree = new RegExp(TopThree.map(el => el.dogName).join('|'), 'i')
    // console.log('regexTopThree', regexTopThree)

    // 利用上述關鍵字 TopThree 將 data 過濾出含關鍵字的資料，建立新陣列
    const getTopThreeData = data.filter(el => regexTopThree.test(el.dogName))
    // console.log('getTopThreeData', getTopThreeData)

    // 要回傳前端的資料
    const result = []

    // 儲存已有紀錄的 key 值
    const dogNameSet = new Set()

    // 用 forEach 跑陣列迴圈，刪掉重複的 dogName 資料
    // 利用 dogNameSet 判斷是否已有紀錄，沒有紀錄就將該值 el.dogName 存入 dogNameSet，且將該元素 el 整筆放入 result 陣列中
    getTopThreeData.forEach(el => {
      // .has() 是 Set 物件的專屬方法，用來檢查 Set 中是否已經包含某個值。
      if (!dogNameSet.has(el.dogName)) {
        // .add() 是 Set 物件的專屬方法，用來向 Set 中添加新的元素。
        dogNameSet.add(el.dogName)
        result.push(el)
      }
    })
    // console.log('dogNameSet', dogNameSet)

    const addResult = TopThree.map(el => {
      // JSON.parse(JSON.stringify(要拷貝的東西)) 深拷貝，完整拷貝資料，包含資料的內部結構也會完整拷貝下來
      // 原來的 result 為 Mongoose 的資料結構格式
      // 深拷貝後，會創建一個完全獨立的副本，與原資料不相干
      const deepConeResult = JSON.parse(JSON.stringify(result))

      // 用 TopThree 的 dogName 尋找在 deepConeResult 的哪一個索引位置
      const resultIndex = deepConeResult.findIndex(Item => Item.dogName === el.dogName)
      // console.log('resultIndex', resultIndex)

      if (resultIndex === -1) {
        return result
      } else {
        // 因使用深拷貝的資料，不用再加上 _doc 來取得內部的資料
        return Object.assign(deepConeResult[resultIndex], { counter: el.counter })
      }
    })
    // console.log('addResult', addResult)

    req.body = addResult
    next()
  } catch (error) {
    console.log('error', error)
  }
}

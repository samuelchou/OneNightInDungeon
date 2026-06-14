// 道具共用池，依類型分為傷害 / 回血 / 狀態
// 每個道具一次性使用，存入道具欄（上限 3 格）

export const ITEMS = {
    // TODO: 設計具體道具
    // 範例結構：
    // potion: {
    //     id: 'potion',
    //     name: '回復藥水',
    //     type: 'heal',        // 'damage' | 'heal' | 'status'
    //     description: '恢復 30 點生命值。',
    //     effect: { healAmount: 30 }
    // }
};

// 各層的道具獎池（id 陣列，可重複出現代表較高機率）
export const ITEM_POOLS = {
    1: [], // TODO
    2: [], // TODO
    3: []  // TODO
};

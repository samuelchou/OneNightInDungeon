import { ITEM_POOLS } from '../data/items.js';

/**
 * 從陣列中隨機抽取 n 個不重複元素
 */
function pickRandom(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * 產生勝利獎勵選項（固定三選一：技能加成、屬性加成、道具）
 * @param {number} floor - 當前層級
 * @param {object} playerState - 玩家當前狀態（用於判斷可強化技能）
 * @returns {Array} 三張獎勵卡資料
 */
export function generateVictoryRewards(floor, playerState) {
    const skillReward = generateSkillEnhancement(playerState);
    const attributeReward = generateAttributeBuff();
    const itemReward = generateItemReward(floor);

    return [skillReward, attributeReward, itemReward];
}

/**
 * 產生逃跑獎勵（0 或 1 個道具，各 50%）
 */
export function generateEscapeReward(floor) {
    if (Math.random() < 0.5) return [];
    return [generateItemReward(floor)];
}

function generateSkillEnhancement(playerState) {
    // TODO: 從玩家現有技能中隨機選一個可強化的技能與強化效果
    return { type: 'skill_enhancement', skillId: null, enhancement: null };
}

function generateAttributeBuff() {
    const attributes = ['maxHp', 'attack', 'defense', 'agility'];
    const attr = attributes[Math.floor(Math.random() * attributes.length)];
    // TODO: 依屬性類型決定加成數值
    return { type: 'attribute_buff', attribute: attr, value: null };
}

function generateItemReward(floor) {
    const pool = ITEM_POOLS[floor] ?? [];
    if (pool.length === 0) return { type: 'item', itemId: null };
    const [itemId] = pickRandom(pool, 1);
    return { type: 'item', itemId };
}

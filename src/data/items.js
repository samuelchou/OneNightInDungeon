// 道具定義，依 spec 分為三層各 3 件
// 類型：heal / damage / status / stat_boost

export const ITEMS = {

    // ── 第 1 層獎池 ──────────────────────────────────────

    recovery_potion: {
        id: 'recovery_potion',
        name: '恢復藥劑',
        type: 'heal',
        description: '飲下藥劑，恢復 30 點生命值。',
        effect: { healAmount: 30 },
    },
    burning_seal: {
        id: 'burning_seal',
        name: '燃燒符咒',
        type: 'damage',
        description: '點燃符咒投出，對敵人造成 15 點傷害（無視防禦）。',
        effect: { damage: 15, bypassDefense: true },
    },
    guardian_idol: {
        id: 'guardian_idol',
        name: '守護神像',
        type: 'status',
        description: '召喚守護之力，自身防禦 +5（3 回合）。',
        effect: { applyStatus: 'guardian_shield', statusTarget: 'self', duration: 3 },
    },

    // ── 第 2 層獎池 ──────────────────────────────────────

    healing_herb: {
        id: 'healing_herb',
        name: '療癒草藥',
        type: 'heal',
        description: '嚼食療癒草藥，恢復 50 點生命值。',
        effect: { healAmount: 50 },
    },
    weakness_potion: {
        id: 'weakness_potion',
        name: '虛弱藥水',
        type: 'status',
        description: '對怪物潑灑虛弱藥水，使其攻擊 -10（3 回合）。',
        effect: { applyStatus: 'weakened', statusTarget: 'enemy', duration: 3 },
    },
    power_ring: {
        id: 'power_ring',
        name: '力量戒指',
        type: 'stat_boost',
        description: '配戴此戒指，永久提升攻擊 +3。',
        effect: { stat: 'attack', value: 3 },
    },

    // ── 第 3 層獎池 ──────────────────────────────────────

    angel_breath: {
        id: 'angel_breath',
        name: '天使的氣息',
        type: 'heal',
        description: '聖光氣息降臨，完全恢復生命值。',
        effect: { healAmount: 9999 },
    },
    lightning_blade: {
        id: 'lightning_blade',
        name: '閃電飛刀',
        type: 'damage',
        description: '投出電光飛刀，造成 30 點傷害（無視防禦與閃躲）。',
        effect: { damage: 30, bypassDefense: true, bypassEvasion: true },
    },
    golden_armor: {
        id: 'golden_armor',
        name: '黃金鎧甲',
        type: 'stat_boost',
        description: '穿上黃金鎧甲，永久提升防禦 +5。',
        effect: { stat: 'defense', value: 5 },
    },
};

// 各層固定 3 件道具，從中隨機抽一件作為獎勵
export const ITEM_POOLS = {
    1: ['recovery_potion', 'burning_seal', 'guardian_idol'],
    2: ['healing_herb', 'weakness_potion', 'power_ring'],
    3: ['angel_breath', 'lightning_blade', 'golden_armor'],
};

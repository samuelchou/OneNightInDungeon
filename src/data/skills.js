// 每個技能定義基礎行為與可附加的強化拼圖（enhancements）
// enhancements 陣列內每一項是一片「拼圖」，透過獎勵逐步解鎖

export const SKILLS = {

    // ── 戰士 ──────────────────────────────────────────

    momentum_slash: {
        id: 'momentum_slash',
        name: '氣勢斬擊',
        description: '造成攻擊 ×1 的傷害。若成功造成傷害，獲得「氣勢」狀態。',
        multiplier: 1,
        onHit: [{ applyStatus: 'momentum', target: 'self' }],
        enhancements: [] // TODO
    },
    follow_up: {
        id: 'follow_up',
        name: '乘勝追擊',
        description: '必須擁有「氣勢」才能使用。造成攻擊 ×3 的傷害，消除「氣勢」。',
        multiplier: 3,
        requireStatus: 'momentum',
        onUse: [{ removeStatus: 'momentum', target: 'self' }],
        enhancements: [] // TODO
    },
    guard: {
        id: 'guard',
        name: '警戒',
        description: '宣告警戒。若怪物本回合發動攻擊，防禦 ×1.5 並獲得「氣勢」。',
        isReactive: true,
        enhancements: [] // TODO
    },
    war_cry: {
        id: 'war_cry',
        name: '戰吼',
        description: '套用狀態：攻擊 ×1.5（本回合），並獲得「氣勢」狀態。',
        onUse: [
            { applyStatus: 'attack_up_1_5', target: 'self' },
            { applyStatus: 'momentum', target: 'self' }
        ],
        enhancements: [] // TODO
    },
    tackle: {
        id: 'tackle',
        name: '撲身',
        description: '造成攻擊 ×0.5 的傷害。若命中，對方下一回合敏捷 ×0.5。',
        multiplier: 0.5,
        onHit: [{ applyStatus: 'agility_down', target: 'enemy', duration: 1 }],
        enhancements: [] // TODO
    },

    // ── 法師 ──────────────────────────────────────────

    fireball: {
        id: 'fireball',
        name: '火球術',
        description: '造成攻擊 ×1 的傷害。若未被閃躲，下回合燃燒（攻擊 ×0.5，無視防禦與閃躲）。',
        multiplier: 1,
        onHit: [{ applyStatus: 'burning', target: 'enemy', duration: 1 }],
        enhancements: [] // TODO
    },
    flash: {
        id: 'flash',
        name: '閃光術',
        description: '以敏捷判定嘗試干擾對方。判定成功時，對方下一回合敏捷 ×0.2。',
        usesAgilityCheck: true,
        onSuccess: [{ applyStatus: 'agility_down_severe', target: 'enemy', duration: 1 }],
        enhancements: [] // TODO
    },
    chant: {
        id: 'chant',
        name: '詠唱',
        description: '下一回合使用的技能傷害 ×2。',
        onUse: [{ applyStatus: 'chant_buff', target: 'self', duration: 1 }],
        enhancements: [] // TODO
    },
    ice_bind: {
        id: 'ice_bind',
        name: '冰縛術',
        description: '造成攻擊 ×0.5 的傷害。若命中，對方獲得「凍縛」（2 回合）：敏捷 -30。',
        multiplier: 0.5,
        onHit: [{ applyStatus: 'frozen', target: 'enemy', duration: 2 }],
        enhancements: [] // TODO
    },
    mana_drain: {
        id: 'mana_drain',
        name: '魔力汲取',
        description: '造成攻擊 ×0.5 的傷害。若命中，對方攻擊 ×0.8（2 回合），自身下次傷害 ×1.2。',
        multiplier: 0.5,
        onHit: [
            { applyStatus: 'attack_down', target: 'enemy', duration: 2 },
            { applyStatus: 'drain_buff', target: 'self', duration: 1 }
        ],
        enhancements: [] // TODO
    },

    // ── 遊俠 ──────────────────────────────────────────

    rapid_shot: {
        id: 'rapid_shot',
        name: '連射',
        description: '連續射出 2 次，各造成攻擊 ×1 的傷害。',
        hits: 2,
        multiplier: 1,
        enhancements: [] // TODO
    },
    disengage: {
        id: 'disengage',
        name: '拉開距離',
        description: '下一回合敏捷計算 ×2（含閃躲與逃跑）。',
        onUse: [{ applyStatus: 'agility_double', target: 'self', duration: 1 }],
        enhancements: [] // TODO
    },
    ambush: {
        id: 'ambush',
        name: '暗算',
        description: '造成攻擊 ×1 的傷害。若自身敏捷高於對方，略過對方閃躲判定。',
        multiplier: 1,
        conditionalBypassEvasion: 'selfAgilityHigher',
        enhancements: [] // TODO：略過防禦判定
    },
    all_in: {
        id: 'all_in',
        name: '豪賭一擲',
        description: '50% 機率造成攻擊 ×3 的傷害；50% 機率落空且自身下回合跳過行動。',
        successChance: 0.5,
        multiplier: 3,
        onFail: [{ applyStatus: 'staggered', target: 'self', duration: 1 }],
        enhancements: [] // TODO：成功率提升、失敗懲罰減輕
    },
    poison_blade: {
        id: 'poison_blade',
        name: '毒刃',
        description: '造成攻擊 ×0.5 的傷害。若命中，對方「中毒」（3 回合）：每回合攻擊 ×0.2 傷害。',
        multiplier: 0.5,
        onHit: [{ applyStatus: 'poisoned', target: 'enemy', duration: 3 }],
        enhancements: [] // TODO：持續回合增加、毒傷無視防禦
    }
};

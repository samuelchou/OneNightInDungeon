import { ITEM_POOLS } from '../data/items.js';
import { SKILLS } from '../data/skills.js';

function pickRandom(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// 勝利獎勵（技能加成 × 1、屬性加成 × 1、道具 × 1）
export function generateVictoryRewards(floor, playerState) {
    let skillCard = generateSkillEnhancement(playerState);
    if (skillCard === null) {
        // 所有技能皆已達階段 3 → 改為額外屬性加成
        skillCard = generateAttributeBuff(floor);
    }

    const rewards = [
        skillCard,
        generateAttributeBuff(floor),
        generateItemReward(floor),
    ];

    // 遊俠被動「觀察」：多一個道具選項
    if (playerState.playerClass === 'ranger') {
        const extra = generateItemReward(floor);
        if (extra.itemId) rewards.push({ ...extra, isBonus: true });
    }

    return rewards.filter(r => r !== null);
}

// 逃跑獎勵（0 或 1 個道具，各 50%）
export function generateEscapeReward(floor) {
    if (Math.random() < 0.5) return [];
    const reward = generateItemReward(floor);
    return reward.itemId ? [reward] : [];
}

// ── 技能加成（升階系統）──────────────────────────────────

// 每個技能各階段的效果描述（升至該階段時顯示）
export const SKILL_STAGE_DESCS = {
    // 戰士
    momentum_slash: {
        2: '傷害倍率提升至 ×1.5。',
        3: '「氣勢」狀態持續至回合結束，不因受擊消耗。',
    },
    follow_up: {
        2: '傷害倍率提升至 ×4。',
        3: '此技能無視防禦。',
    },
    guard: {
        2: '防禦倍率提升至 ×2，且警戒觸發時獲得「氣勢」。',
        3: '警戒觸發後，下一回合可免費使用「乘勝追擊」。',
    },
    war_cry: {
        2: '攻擊強化延長至 2 回合，並獲得「氣勢」。',
        3: '同時套用「防禦強化」狀態（1 回合）：防禦 ×1.2。',
    },
    tackle: {
        2: '傷害倍率提升至 ×1.0，且攻擊必定命中（無視閃躲）。',
        3: '命中時額外封鎖對方一個技能（1 回合）。',
    },
    // 法師
    fireball: {
        2: '基礎傷害倍率提升至 ×1.5。',
        3: '燃燒持續 2 回合。',
    },
    flash: {
        2: '效果必定生效（不受敏捷判定影響），且持續 2 回合。',
        3: '效果生效時額外封鎖對方攻擊型技能（1 回合）。',
    },
    chant: {
        2: '詠唱加成提升至 ×2.5。',
        3: '詠唱加成同時套用至下回合觸發的燃燒 DoT。',
    },
    ice_bind: {
        2: '傷害倍率提升至 ×1.0。',
        3: '凍縛持續 3 回合。',
    },
    mana_drain: {
        2: '對方攻擊削減加深至 ×0.5。',
        3: '自身傷害加成提升至 ×1.5。',
    },
    // 遊俠
    rapid_shot: {
        2: '攻擊次數增加至 3 次。',
        3: '無視防禦。',
    },
    disengage: {
        2: '敏捷倍增效果持續 2 回合。',
        3: '敏捷倍率提升至 ×3。',
    },
    ambush: {
        2: '若自身敏捷高於對方，同時略過防禦判定。',
        3: '傷害倍率提升至 ×1.5。',
    },
    all_in: {
        2: '成功機率提升至 65%。',
        3: '失敗時不再獲得「失衡」狀態。',
    },
    poison_blade: {
        2: '中毒持續 5 回合。',
        3: '中毒傷害無視防禦。',
    },
};

function generateSkillEnhancement(playerState) {
    const skills = playerState.skills || [];
    if (skills.length === 0) return null;

    // 找出尚可升階的技能（stage < 3）
    const upgradeable = skills.filter(s => (s.stage || 1) < 3);
    if (upgradeable.length === 0) return null;

    const skill = upgradeable[Math.floor(Math.random() * upgradeable.length)];
    const currentStage = skill.stage || 1;
    const nextStage = currentStage + 1;
    const stageDesc = SKILL_STAGE_DESCS[skill.id]?.[nextStage] || '技能效果強化。';
    const skillName = SKILLS[skill.id]?.name || skill.id;

    return {
        type: 'skill_enhancement',
        skillId: skill.id,
        skillName,
        targetStage: nextStage,
        label: `強化「${skillName}」→ 階段 ${nextStage}`,
        desc: `階段 ${nextStage}：${stageDesc}`,
    };
}

// ── 屬性加成（spec 規定的固定數值）────────────────────────

const ATTRIBUTE_BUFFS_PER_FLOOR = {
    1: [
        { attribute: 'maxHp',   label: '最大生命值', value: 15 },
        { attribute: 'attack',  label: '攻擊',       value: 2  },
        { attribute: 'defense', label: '防禦',       value: 3  },
        { attribute: 'agility', label: '敏捷',       value: 3  },
    ],
    2: [
        { attribute: 'maxHp',   label: '最大生命值', value: 20 },
        { attribute: 'attack',  label: '攻擊',       value: 3  },
        { attribute: 'defense', label: '防禦',       value: 4  },
        { attribute: 'agility', label: '敏捷',       value: 5  },
    ],
    3: [
        { attribute: 'maxHp',   label: '最大生命值', value: 25 },
        { attribute: 'attack',  label: '攻擊',       value: 5  },
        { attribute: 'defense', label: '防禦',       value: 6  },
        { attribute: 'agility', label: '敏捷',       value: 8  },
    ],
};

function generateAttributeBuff(floor) {
    const pool = ATTRIBUTE_BUFFS_PER_FLOOR[floor] ?? ATTRIBUTE_BUFFS_PER_FLOOR[3];
    const buff = pool[Math.floor(Math.random() * pool.length)];
    return {
        type: 'attribute_buff',
        attribute: buff.attribute,
        value: buff.value,
        label: `屬性加成：${buff.label}`,
        desc: buff.attribute === 'maxHp'
            ? `最大 HP +${buff.value}（立即回復 ${buff.value} 點 HP）`
            : `${buff.label} +${buff.value}`,
    };
}

// ── 道具獎勵 ──────────────────────────────────────────────

function generateItemReward(floor) {
    const pool = ITEM_POOLS[floor] ?? ITEM_POOLS[3];
    if (!pool || pool.length === 0) return { type: 'item', itemId: null, label: '（無道具）', desc: '' };
    const [itemId] = pickRandom(pool, 1);
    return {
        type: 'item',
        itemId,
        label: null,
        desc: null,
    };
}

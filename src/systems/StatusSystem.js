// 狀態效果管理
// 每個狀態需定義：效果類型、持續時間、疊加行為

export function applyStatus(entity, statusId, statusDef) {
    if (!entity.statuses) entity.statuses = {};

    const existing = entity.statuses[statusId];

    if (!existing) {
        entity.statuses[statusId] = { ...statusDef, stacks: 1 };
        return;
    }

    switch (statusDef.stackBehavior) {
        case 'refresh':
            existing.duration = statusDef.duration;
            break;
        case 'stack':
            existing.stacks = (existing.stacks ?? 1) + 1;
            existing.duration = statusDef.duration;
            break;
        case 'override':
        default:
            entity.statuses[statusId] = { ...statusDef, stacks: 1 };
    }
}

export function removeStatus(entity, statusId) {
    if (entity.statuses) delete entity.statuses[statusId];
}

export function hasStatus(entity, statusId) {
    return !!(entity.statuses && entity.statuses[statusId]);
}

export function tickStatuses(entity) {
    if (!entity.statuses) return;
    for (const [id, status] of Object.entries(entity.statuses)) {
        if (status.duration === 'permanent') continue;
        status.duration -= 1;
        if (status.duration <= 0) delete entity.statuses[id];
    }
}

export function clearBattleStatuses(entity) {
    if (!entity.statuses) return;
    for (const [id, status] of Object.entries(entity.statuses)) {
        if (!status.persistAcrossBattle) delete entity.statuses[id];
    }
}

// 取得狀態清單（用於 UI 顯示）
export function getStatusNames(entity) {
    if (!entity.statuses) return [];
    return Object.values(entity.statuses).map(s => {
        const stacks = s.stacks > 1 ? ` ×${s.stacks}` : '';
        const dur = s.duration === 'permanent' ? '' : ` (${s.duration})`;
        return `${s.name}${stacks}${dur}`;
    });
}

// ── 狀態定義表 ──────────────────────────────────────────

export const STATUS_DEFS = {

    // ── 已有 ──────────────────────────────────────────────

    momentum: {
        id: 'momentum',
        name: '氣勢',
        stackBehavior: 'override',
        duration: 'permanent',
        persistAcrossBattle: false,
    },
    burning: {
        id: 'burning',
        name: '燃燒',
        stackBehavior: 'refresh',
        duration: 1,
        persistAcrossBattle: false,
        tickDamageMultiplier: 0.5,
        bypassDefenseOnTick: true,
        bypassEvasionOnTick: true,
    },
    poisoned: {
        id: 'poisoned',
        name: '中毒',
        stackBehavior: 'refresh',
        duration: 3,
        persistAcrossBattle: false,
        tickDamageMultiplier: 0.2,
    },
    frozen: {
        id: 'frozen',
        name: '凍縛',
        stackBehavior: 'refresh',
        duration: 2,
        persistAcrossBattle: false,
        agilityFlat: -30,
    },
    staggered: {
        id: 'staggered',
        name: '失衡',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        skipTurn: true,
    },

    // ── 屬性倍率 ──────────────────────────────────────────

    attack_up_1_5: {
        id: 'attack_up_1_5',
        name: '攻擊強化',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        attackMult: 1.5,
    },
    attack_down: {
        id: 'attack_down',
        name: '力竭',
        stackBehavior: 'refresh',
        duration: 2,
        persistAcrossBattle: false,
        attackMult: 0.8,
    },
    agility_down: {
        id: 'agility_down',
        name: '遲緩',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        agilityMult: 0.5,
    },
    agility_down_severe: {
        id: 'agility_down_severe',
        name: '嚴重遲緩',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        agilityMult: 0.2,
    },
    agility_double: {
        id: 'agility_double',
        name: '敏捷倍增',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        agilityMult: 2,
    },
    shield: {
        id: 'shield',
        name: '舉盾',
        stackBehavior: 'override',
        duration: 2,
        persistAcrossBattle: false,
        defenseMult: 2.0,
    },

    // ── 傷害加成（對外，consumeOnDamage → 命中後消耗） ───

    chant_buff: {
        id: 'chant_buff',
        name: '詠唱',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        outgoingDamageMult: 2.0,
        consumeOnDamage: true,
    },
    drain_buff: {
        id: 'drain_buff',
        name: '強化',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        outgoingDamageMult: 1.2,
        consumeOnDamage: true,
    },
    charge_ready: {
        id: 'charge_ready',
        name: '蓄能爆發',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        outgoingDamageMult: 1.5,
        consumeOnDamage: true,
    },
    insight_buff: {
        id: 'insight_buff',
        name: '洞察',
        stackBehavior: 'override',
        duration: 'permanent',
        persistAcrossBattle: false,
        outgoingDamageMult: 1.2,
    },
    fighting_spirit_buff: {
        id: 'fighting_spirit_buff',
        name: '奮鬥',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        outgoingDamageMult: 2.0,
        consumeOnDamage: true,
    },

    // ── 受傷加成（受到傷害時的倍率） ────────────────────

    defense_broken: {
        id: 'defense_broken',
        name: '防禦崩潰',
        stackBehavior: 'refresh',
        duration: 2,
        persistAcrossBattle: false,
        incomingDamageMult: 1.5,
    },
    mirror_shield: {
        id: 'mirror_shield',
        name: '鏡盾',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        incomingDamageMult: 0.4,
        consumeOnHit: true,
    },

    // ── 技能封鎖 ──────────────────────────────────────────

    skill_locked_attack: {
        id: 'skill_locked_attack',
        name: '攻擊封鎖',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        lockSkillType: 'attack',
    },
    skill_locked_random: {
        id: 'skill_locked_random',
        name: '技能封鎖',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        lockRandomSkill: true,
        lockedSkillId: null,
    },
    items_locked: {
        id: 'items_locked',
        name: '道具封鎖',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        lockItems: true,
    },

    // ── 特殊怪物狀態 ──────────────────────────────────────

    blessed: {
        id: 'blessed',
        name: '暗禱加持',
        stackBehavior: 'override',
        duration: 2,
        persistAcrossBattle: false,
        bypassDefenseOnAttack: true,
        outgoingDamageMult: 1.5,
    },
    dodge_stance: {
        id: 'dodge_stance',
        name: '閃避架勢',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        agilityFlat: 30,
    },
    spore: {
        id: 'spore',
        name: '孢子',
        stackBehavior: 'stack',
        duration: 'permanent',
        persistAcrossBattle: false,
        agilityFlat: -5,
        maxStacks: 3,
    },
    blood_oath: {
        id: 'blood_oath',
        name: '血誓',
        stackBehavior: 'override',
        duration: 'permanent',
        persistAcrossBattle: false,
        attackMult: 1.5,
        selfDamagePerTurn: 3,
    },
    guilty: {
        id: 'guilty',
        name: '有罪',
        stackBehavior: 'refresh',
        duration: 3,
        persistAcrossBattle: false,
        damageOnNonAttack: 8,
    },
    berserk: {
        id: 'berserk',
        name: '狂暴',
        stackBehavior: 'override',
        duration: 'permanent',
        persistAcrossBattle: false,
        attackMult: 1.6,
        agilityMult: 0.7,
    },
    scale_armor: {
        id: 'scale_armor',
        name: '深淵鱗甲',
        stackBehavior: 'override',
        duration: 'permanent',
        persistAcrossBattle: false,
        incomingDamageMult: 0.4,
    },

    // ── 道具狀態 ──────────────────────────────────────────

    guardian_shield: {
        id: 'guardian_shield',
        name: '守護之盾',
        stackBehavior: 'override',
        duration: 3,
        persistAcrossBattle: false,
        defenseFlat: 5,
    },
    weakened: {
        id: 'weakened',
        name: '虛弱',
        stackBehavior: 'refresh',
        duration: 3,
        persistAcrossBattle: false,
        attackFlat: -10,
    },

    // ── 技能強化衍生狀態 ──────────────────────────────────

    chant_buff_enhanced: {
        id: 'chant_buff_enhanced',
        name: '強化詠唱',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        outgoingDamageMult: 2.5,
        consumeOnDamage: true,
    },
    attack_down_heavy: {
        id: 'attack_down_heavy',
        name: '重度力竭',
        stackBehavior: 'refresh',
        duration: 2,
        persistAcrossBattle: false,
        attackMult: 0.5,
    },
    drain_buff_enhanced: {
        id: 'drain_buff_enhanced',
        name: '深度汲取',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        outgoingDamageMult: 1.5,
        consumeOnDamage: true,
    },
    defense_up_1_2: {
        id: 'defense_up_1_2',
        name: '防禦強化',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        defenseMult: 1.2,
    },
    agility_triple: {
        id: 'agility_triple',
        name: '敏捷三倍',
        stackBehavior: 'override',
        duration: 2,
        persistAcrossBattle: false,
        agilityMult: 3,
    },
};

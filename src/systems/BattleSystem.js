// 核心戰鬥計算邏輯

export function rollEvasion(attackerAgility, defenderAgility) {
    const chance = Math.max(0, defenderAgility - attackerAgility);
    return Math.random() * 100 < chance;
}

export function calcDamage(attacker, skillMultiplier, statusMultiplier, defenderDefense) {
    const raw = attacker.attack * skillMultiplier * statusMultiplier;
    return Math.max(1, Math.floor(raw - defenderDefense));
}

export function executeAttack(attacker, defender, skillMultiplier, options = {}) {
    const { bypassEvasion = false, bypassDefense = false, statusMultiplier = 1 } = options;

    const evaded = bypassEvasion ? false : rollEvasion(attacker.agility, defender.agility);
    if (evaded) return { hit: false, damage: 0 };

    const defense = bypassDefense ? 0 : defender.defense;
    const damage = calcDamage(attacker, skillMultiplier, statusMultiplier, defense);

    return { hit: true, damage };
}

export function rollEscape(playerAgility, monsterAgility) {
    const chance = Math.max(0, playerAgility - monsterAgility);
    return Math.random() * 100 < chance;
}

export function applyDamage(entity, damage) {
    entity.hp = Math.max(0, entity.hp - damage);
    return entity.hp === 0;
}

export function applyHeal(entity, amount) {
    entity.hp = Math.min(entity.maxHp, entity.hp + amount);
}

// ── 狀態加成計算 ─────────────────────────────────────────

// 取得考慮狀態後的有效屬性（用於傷害公式）
export function getEffectiveStats(entity) {
    const stats = {
        attack: entity.attack,
        defense: entity.defense,
        agility: entity.agility,
    };
    if (!entity.statuses) return stats;

    for (const status of Object.values(entity.statuses)) {
        if (status.attackMult !== undefined) stats.attack *= status.attackMult;
        if (status.defenseMult !== undefined) stats.defense *= status.defenseMult;
        if (status.agilityMult !== undefined) stats.agility *= status.agilityMult;
        if (status.agilityFlat !== undefined) {
            stats.agility += status.agilityFlat * (status.stacks || 1);
        }
        if (status.attackFlat !== undefined) stats.attack += status.attackFlat;
        if (status.defenseFlat !== undefined) stats.defense += status.defenseFlat;
    }
    stats.attack = Math.max(0, stats.attack);
    stats.defense = Math.max(0, stats.defense);
    stats.agility = Math.max(0, stats.agility);
    return stats;
}

// 取得傷害輸出倍率（如詠唱 ×2、奮鬥 ×2）
export function getOutgoingDamageMult(entity) {
    let mult = 1;
    if (!entity.statuses) return mult;
    for (const status of Object.values(entity.statuses)) {
        if (status.outgoingDamageMult !== undefined) mult *= status.outgoingDamageMult;
    }
    return mult;
}

// 取得受傷倍率（如防禦崩潰 ×1.5、鏡盾 ×0.4）
export function getIncomingDamageMult(entity) {
    let mult = 1;
    if (!entity.statuses) return mult;
    for (const status of Object.values(entity.statuses)) {
        if (status.incomingDamageMult !== undefined) mult *= status.incomingDamageMult;
    }
    return mult;
}

// 判斷技能是否被封鎖
export function isSkillLocked(entity, skillId, skillDef) {
    if (!entity.statuses) return false;
    for (const status of Object.values(entity.statuses)) {
        if (status.lockSkillType === 'attack' && skillDef && skillDef.multiplier) return true;
        if (status.lockRandomSkill && status.lockedSkillId === skillId) return true;
    }
    return false;
}

// 判斷道具是否被封鎖
export function areItemsLocked(entity) {
    if (!entity.statuses) return false;
    return Object.values(entity.statuses).some(s => s.lockItems);
}

// 判斷攻擊是否無視防禦（含狀態）
export function shouldBypassDefense(entity, skillBypassDefense = false) {
    if (skillBypassDefense) return true;
    if (!entity.statuses) return false;
    return Object.values(entity.statuses).some(s => s.bypassDefenseOnAttack);
}

// 消耗「造成傷害後消耗」的狀態（chant_buff, drain_buff 等）
export function consumeDamageBuffs(entity) {
    if (!entity.statuses) return;
    for (const [id, status] of Object.entries(entity.statuses)) {
        if (status.consumeOnDamage) delete entity.statuses[id];
    }
}

// 消耗「被命中後消耗」的狀態（mirror_shield）
export function consumeHitDebuffs(entity) {
    if (!entity.statuses) return;
    for (const [id, status] of Object.entries(entity.statuses)) {
        if (status.consumeOnHit) delete entity.statuses[id];
    }
}

// 計算每回合 tick 傷害總量（burning, poisoned）
// attacker = 施加狀態者的攻擊力；此處 entity 是受 tick 影響的實體
export function calcTickDamage(entity, attackerAttack) {
    if (!entity.statuses) return 0;
    let total = 0;
    for (const status of Object.values(entity.statuses)) {
        if (!status.tickDamageMultiplier) continue;
        const dmg = Math.max(1, Math.floor(attackerAttack * status.tickDamageMultiplier));
        total += dmg;
    }
    return total;
}

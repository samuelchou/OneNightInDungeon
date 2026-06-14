// 核心戰鬥計算邏輯

/**
 * 計算閃避判定
 * 閃避機率 = max(0, 防禦方敏捷 - 攻擊方敏捷)%
 * @returns {boolean} 是否閃避成功
 */
export function rollEvasion(attackerAgility, defenderAgility) {
    const chance = Math.max(0, defenderAgility - attackerAgility);
    return Math.random() * 100 < chance;
}

/**
 * 計算實際傷害
 * 實際傷害 = max(1, 攻擊 × 技能倍率 × 狀態倍率 - 防禦)
 */
export function calcDamage(attacker, skillMultiplier, statusMultiplier, defenderDefense) {
    const raw = attacker.attack * skillMultiplier * statusMultiplier;
    return Math.max(1, Math.floor(raw - defenderDefense));
}

/**
 * 執行一次攻擊
 * @param {object} attacker - 攻擊方戰鬥實體
 * @param {object} defender - 防禦方戰鬥實體
 * @param {number} skillMultiplier - 技能倍率
 * @param {object} options - { bypassEvasion, bypassDefense, statusMultiplier }
 * @returns {{ hit: boolean, damage: number }}
 */
export function executeAttack(attacker, defender, skillMultiplier, options = {}) {
    const { bypassEvasion = false, bypassDefense = false, statusMultiplier = 1 } = options;

    const evaded = bypassEvasion ? false : rollEvasion(attacker.agility, defender.agility);
    if (evaded) return { hit: false, damage: 0 };

    const defense = bypassDefense ? 0 : defender.defense;
    const damage = calcDamage(attacker, skillMultiplier, statusMultiplier, defense);

    return { hit: true, damage };
}

/**
 * 計算逃跑成功率
 * 逃跑成功率 = max(0, 玩家敏捷 - 怪物敏捷)%
 * @returns {boolean} 是否逃跑成功
 */
export function rollEscape(playerAgility, monsterAgility) {
    const chance = Math.max(0, playerAgility - monsterAgility);
    return Math.random() * 100 < chance;
}

/**
 * 套用傷害至戰鬥實體
 * @returns {boolean} 是否死亡
 */
export function applyDamage(entity, damage) {
    entity.hp = Math.max(0, entity.hp - damage);
    return entity.hp === 0;
}

/**
 * 套用回復至戰鬥實體
 */
export function applyHeal(entity, amount) {
    entity.hp = Math.min(entity.maxHp, entity.hp + amount);
}

// 狀態效果管理
// 每個狀態需定義：效果類型、持續時間、疊加行為

/**
 * 為戰鬥實體附加狀態
 * @param {object} entity - 目標戰鬥實體
 * @param {string} statusId - 狀態 id
 * @param {object} statusDef - 狀態定義（從 STATUS_DEFS 取得）
 */
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

/**
 * 移除指定狀態
 */
export function removeStatus(entity, statusId) {
    if (entity.statuses) delete entity.statuses[statusId];
}

/**
 * 檢查實體是否持有某狀態
 */
export function hasStatus(entity, statusId) {
    return !!(entity.statuses && entity.statuses[statusId]);
}

/**
 * 回合結束時，將所有狀態持續時間 -1，移除到期狀態
 */
export function tickStatuses(entity) {
    if (!entity.statuses) return;
    for (const [id, status] of Object.entries(entity.statuses)) {
        if (status.duration === 'permanent') continue;
        status.duration -= 1;
        if (status.duration <= 0) delete entity.statuses[id];
    }
}

/**
 * 戰鬥結束時清除所有非跨戰鬥狀態
 */
export function clearBattleStatuses(entity) {
    if (!entity.statuses) return;
    for (const [id, status] of Object.entries(entity.statuses)) {
        if (!status.persistAcrossBattle) delete entity.statuses[id];
    }
}

// 狀態定義表
// TODO: 根據技能設計補完所有狀態
export const STATUS_DEFS = {
    momentum: {
        id: 'momentum',
        name: '氣勢',
        stackBehavior: 'override',
        duration: 'permanent',
        persistAcrossBattle: false
    },
    burning: {
        id: 'burning',
        name: '燃燒',
        stackBehavior: 'refresh',
        duration: 1,
        persistAcrossBattle: false,
        // 每回合造成 攻擊×0.5 傷害，無視防禦與閃躲
        tickDamageMultiplier: 0.5,
        bypassDefense: true,
        bypassEvasion: true
    },
    poisoned: {
        id: 'poisoned',
        name: '中毒',
        stackBehavior: 'refresh',
        duration: 3,
        persistAcrossBattle: false,
        tickDamageMultiplier: 0.2
    },
    frozen: {
        id: 'frozen',
        name: '凍縛',
        stackBehavior: 'refresh',
        duration: 2,
        persistAcrossBattle: false,
        agilityFlat: -30
    },
    staggered: {
        id: 'staggered',
        name: '失衡',
        stackBehavior: 'override',
        duration: 1,
        persistAcrossBattle: false,
        skipTurn: true
    }
    // TODO: 補完其餘狀態
};

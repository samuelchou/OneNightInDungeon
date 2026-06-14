import { CLASSES } from '../data/classes.js';
import { FLOOR_POOLS, BOSS_POOL, MONSTERS, BOSSES } from '../data/monsters.js';

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const GameState = {
    // ── 玩家核心屬性 ──────────────────────────────────────
    playerClass: null,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 0,
    agility: 10,

    // 技能欄：[{ id: 'skill_id', stage: 1 }]（最多 5 個，stage 1~3）
    skills: [],

    // 道具欄：[{ itemId: 'item_id', count: 1 }]（最多 3 格）
    items: [],

    // 跨戰鬥保留的狀態（如遊俠養精蓄銳）
    crossBattleStatuses: {},

    // ── 被動狀態追蹤 ──────────────────────────────────────
    passiveState: {
        // 戰士
        followUpCount: 0,       // 乘勝追擊累積次數（達 2 次觸發奮鬥）
        fightingSpiritReady: false,
        // 法師
        chargeStacks: 0,        // 蓄能層數（達 4 觸發）
        // 遊俠
        recuperateStacks: 0,    // 養精蓄銳疊加層數
        practiceBonus: 0,       // 熟能生巧累積的敏捷加成
    },

    // ── 地城進度 ──────────────────────────────────────────
    floor: 1,           // 1 | 2 | 3 | 'boss'
    battleIndex: 0,     // 0-2（該層第幾戰）
    floorMonsters: [],  // 本層隨機抽選的 3 隻怪物 id 陣列
    bossId: null,       // 已選定的 boss id

    // ── 本局統計 ──────────────────────────────────────────
    battlesWon: 0,
    battlesEscaped: 0,
    totalDamageDealt: 0,

    // ─────────────────────────────────────────────────────
    // 初始化 / 重置
    // ─────────────────────────────────────────────────────

    reset() {
        this.playerClass = null;
        this.hp = 100;
        this.maxHp = 100;
        this.attack = 10;
        this.defense = 0;
        this.agility = 10;
        this.skills = [];
        this.items = [];
        this.crossBattleStatuses = {};
        this.passiveState = {
            followUpCount: 0,
            fightingSpiritReady: false,
            chargeStacks: 0,
            recuperateStacks: 0,
            practiceBonus: 0,
        };
        this.floor = 1;
        this.battleIndex = 0;
        this.floorMonsters = [];
        this.bossId = null;
        this.battlesWon = 0;
        this.battlesEscaped = 0;
        this.totalDamageDealt = 0;
    },

    init(playerClass) {
        this.reset();
        this.playerClass = playerClass;
        const cls = CLASSES[playerClass];
        Object.assign(this, { ...cls.stats });
        this.hp = cls.stats.maxHp;
        // 所有技能初始解鎖（帶初始技能）
        this.skills = cls.skills.map(id => ({ id, stage: 1 }));
        this._generateFloorMonsters();
        this.bossId = pickRandom(BOSS_POOL);
    },

    // ── 地城進度 ──────────────────────────────────────────

    _generateFloorMonsters() {
        const pool = FLOOR_POOLS[this.floor];
        if (!pool) return;
        this.floorMonsters = shuffle(pool);
        this.battleIndex = 0;
    },

    getCurrentMonsterData() {
        if (this.floor === 'boss') {
            return BOSSES[this.bossId];
        }
        const monsterId = this.floorMonsters[this.battleIndex];
        return MONSTERS[monsterId];
    },

    // 前進到下一戰，回傳目前狀態
    // 回傳 'next_battle' | 'next_floor' | 'boss' | 'victory'
    advanceBattle(escaped = false) {
        if (escaped) {
            this.battlesEscaped++;
        } else {
            this.battlesWon++;
        }

        if (this.floor === 'boss') {
            return 'victory';
        }

        this.battleIndex++;

        if (this.battleIndex >= 3) {
            // 本層清完
            if (this.floor >= 3) {
                this.floor = 'boss';
                return 'boss';
            }
            this.floor++;
            this._generateFloorMonsters();
            return 'next_floor';
        }

        return 'next_battle';
    },

    // ── 獎勵套用 ──────────────────────────────────────────

    applyReward(reward) {
        if (!reward) return;
        switch (reward.type) {
            case 'attribute_buff':
                this[reward.attribute] += reward.value;
                if (reward.attribute === 'maxHp') {
                    this.hp = Math.min(this.hp + reward.value, this.maxHp);
                }
                break;
            case 'skill_enhancement':
                if (reward.skillId) {
                    const skill = this.skills.find(s => s.id === reward.skillId);
                    if (skill && (skill.stage || 1) < 3) skill.stage = (skill.stage || 1) + 1;
                }
                break;
            case 'item':
                if (reward.itemId) this.addItem(reward.itemId);
                break;
        }
    },

    addItem(itemId) {
        const existing = this.items.find(i => i.itemId === itemId);
        if (existing) {
            existing.count++;
            return true;
        }
        if (this.items.length >= 3) return false;
        this.items.push({ itemId, count: 1 });
        return true;
    },

    useItem(index) {
        const slot = this.items[index];
        if (!slot) return null;
        const itemId = slot.itemId;
        slot.count--;
        if (slot.count <= 0) this.items.splice(index, 1);
        return itemId;
    },

    hasItem(itemId) {
        return this.items.some(i => i.itemId === itemId && i.count > 0);
    },

    // HP 管理（戰鬥中由 BattleScene 直接操作 combat state，
    // 勝利後呼叫此方法同步回 GameState）
    syncHpFromBattle(currentHp) {
        this.hp = Math.max(0, currentHp);
    },

    // 戰鬥勝利後玩家 HP 回滿
    restoreHp() {
        this.hp = this.maxHp;
    },

    // 判斷是否可以新增技能
    canAddSkill() {
        return this.skills.length < 5;
    },

    // 判斷是否可以新增道具
    canAddItem() {
        return this.items.length < 3;
    },

    // 獲取進度字串
    getProgressText() {
        if (this.floor === 'boss') return 'Boss 戰';
        return `第 ${this.floor} 層 · 第 ${this.battleIndex + 1}/3 戰`;
    },
};

export default GameState;

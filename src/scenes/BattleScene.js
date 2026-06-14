import Phaser from 'phaser';
import GameState from '../state/GameState.js';
import { SKILLS } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { STATUS_DEFS, applyStatus, removeStatus, hasStatus, tickStatuses, clearBattleStatuses, getStatusNames } from '../systems/StatusSystem.js';
import {
    executeAttack, applyDamage, applyHeal, rollEscape,
    getEffectiveStats, getOutgoingDamageMult, getIncomingDamageMult,
    isSkillLocked, areItemsLocked, shouldBypassDefense,
    consumeDamageBuffs, consumeHitDebuffs, calcTickDamage,
} from '../systems/BattleSystem.js';

// ── UI 常數 ──────────────────────────────────────────────

const C = {
    BG:         0x0d0d1a,
    PANEL_P:    0x12122a,
    PANEL_M:    0x1a1010,
    BTN:        0x2a2a5a,
    BTN_HOV:    0x3a3a7a,
    BTN_DIS:    0x1a1a2a,
    BTN_ACT:    0x3a5a3a,
    HP_GREEN:   0x22aa44,
    HP_YELLOW:  0xaaaa00,
    HP_RED:     0xaa2222,
    BORDER_P:   0x4444aa,
    BORDER_M:   0xaa2222,
    LOG_BG:     0x08080f,
    TEXT_H:     '#e8d5a3',
    TEXT_BODY:  '#dddddd',
    TEXT_DIM:   '#888888',
    TEXT_LOG:   '#b8b8cc',
    TEXT_BAD:   '#ff6666',
    TEXT_GOOD:  '#66ff88',
    TEXT_INFO:  '#88aaff',
};

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    // ── 初始化 ───────────────────────────────────────────

    create() {
        this._initCombatState();
        this._createUI();
        this._updateUI();
        this._startPlayerTurn();
    }

    _initCombatState() {
        // 玩家戰鬥狀態（從 GameState 複製，戰鬥中可變動）
        this.player = {
            hp: GameState.hp,
            maxHp: GameState.maxHp,
            attack: GameState.attack,
            defense: GameState.defense,
            agility: GameState.agility,
            statuses: { ...GameState.crossBattleStatuses },
        };

        // 被動狀態（引用 GameState）
        this.passiveState = GameState.passiveState;

        // 套用法師蓄能跨戰鬥狀態
        if (GameState.playerClass === 'mage' && this.passiveState.chargeStacks >= 4) {
            applyStatus(this.player, 'charge_ready', STATUS_DEFS.charge_ready);
            this.passiveState.chargeStacks = 0;
        }

        // 怪物戰鬥狀態
        const md = GameState.getCurrentMonsterData();
        this.monster = {
            id: md.id,
            name: md.name,
            hp: md.stats.maxHp,
            maxHp: md.stats.maxHp,
            attack: md.stats.attack,
            defense: md.stats.defense,
            agility: md.stats.agility,
            statuses: {},
            actions: md.actions,
            selectAction: md.selectAction.bind(md),
            flags: md.flags || {},
            isBoss: !!md.isBoss,
            // 特殊怪物旗標
            crownShards: 0,
            oathActive: false,
            berserkTriggered: false,
        };

        // 深淵龍蜥：開場有鱗甲
        if (md.id === 'abyssal_drake') {
            applyStatus(this.monster, 'scale_armor', STATUS_DEFS.scale_armor);
        }

        this.turnCount = 0;
        this.guardDeclared = false;
        this.monsterContext = {};
        this.playerLastActionType = null;
        this.vengeanceReady = false;
        this.rustCracks = 0;
        this.sporeCount = 0;
        this.isPlayerTurn = false;
        this.logMessages = [];
        this.isBoss = this.monster.isBoss;

        // 計算本戰的 locked skill（skill_locked_random 需在套用時決定目標技能）
        this.lockedSkillId = null;
    }

    // ── UI 建立 ──────────────────────────────────────────

    _createUI() {
        const W = 960, H = 640;
        this.add.rectangle(W / 2, H / 2, W, H, C.BG);

        this._createHeader();
        this._createPlayerPanel();
        this._createMonsterPanel();
        this._createBattleLog();
        this._createSkillPanel();
        this._createItemPanel();
        this._createFleeButton();
        this._createPhaseIndicator();
    }

    _createHeader() {
        const progress = GameState.getProgressText();
        this.add.text(20, 14, progress, { fontSize: '15px', color: C.TEXT_DIM, fontFamily: 'sans-serif' });

        const clsName = { warrior: '戰士', mage: '法師', ranger: '遊俠' }[GameState.playerClass] || '';
        this.add.text(940, 14, clsName, {
            fontSize: '15px',
            color: C.TEXT_H,
            fontFamily: 'serif',
        }).setOrigin(1, 0);

        // 分隔線
        this.add.rectangle(480, 38, 920, 1, 0x333355);
    }

    _createPlayerPanel() {
        // 背景
        this.add.rectangle(210, 190, 400, 290, C.PANEL_P, 0.6).setStrokeStyle(1, C.BORDER_P);

        // 立繪佔位符
        this.add.rectangle(85, 190, 140, 200, 0x1a1a3a).setStrokeStyle(1, C.BORDER_P);
        this.add.text(85, 190, '玩家', { fontSize: '13px', color: '#555577' }).setOrigin(0.5, 0.5);

        // 名稱
        const name = { warrior: '戰士', mage: '法師', ranger: '遊俠' }[GameState.playerClass] || '';
        this.add.text(205, 55, name, { fontSize: '18px', color: C.TEXT_H, fontFamily: 'serif', fontStyle: 'bold' });

        // HP 文字
        this.playerHpText = this.add.text(205, 82, '', { fontSize: '13px', color: C.TEXT_BAD, fontFamily: 'monospace' });

        // HP 條
        const hpBarX = 205, hpBarY = 102, hpBarW = 180;
        this.add.rectangle(hpBarX + hpBarW / 2, hpBarY, hpBarW, 12, 0x2a2a2a);
        this.playerHpBarFg = this.add.rectangle(hpBarX, hpBarY, hpBarW, 12, C.HP_GREEN).setOrigin(0, 0.5);
        this.playerHpBarMaxW = hpBarW;
        this.playerHpBarX = hpBarX;

        // 屬性
        this.playerStatsText = this.add.text(205, 118, '', {
            fontSize: '12px',
            color: C.TEXT_DIM,
            fontFamily: 'monospace',
            lineSpacing: 2,
        });

        // 狀態列
        this.playerStatusText = this.add.text(20, 280, '', {
            fontSize: '11px',
            color: '#bb88ff',
            wordWrap: { width: 420 },
            lineSpacing: 2,
        });
    }

    _createMonsterPanel() {
        this.add.rectangle(750, 190, 400, 290, C.PANEL_M, 0.6).setStrokeStyle(1, C.BORDER_M);

        // 立繪佔位符
        this.add.rectangle(875, 190, 140, 200, 0x2a1010).setStrokeStyle(1, C.BORDER_M);
        this.monsterPortraitText = this.add.text(875, 190, '', {
            fontSize: '12px',
            color: '#775555',
            align: 'center',
            wordWrap: { width: 130 },
        }).setOrigin(0.5, 0.5);

        // 名稱
        this.monsterNameText = this.add.text(540, 55, '', { fontSize: '18px', color: '#ff9999', fontFamily: 'serif', fontStyle: 'bold' });

        // HP 文字
        this.monsterHpText = this.add.text(540, 82, '', { fontSize: '13px', color: C.TEXT_BAD, fontFamily: 'monospace' });

        // HP 條
        const hpBarX = 540, hpBarY = 102, hpBarW = 200;
        this.add.rectangle(hpBarX + hpBarW / 2, hpBarY, hpBarW, 12, 0x2a2a2a);
        this.monsterHpBarFg = this.add.rectangle(hpBarX, hpBarY, hpBarW, 12, C.HP_RED).setOrigin(0, 0.5);
        this.monsterHpBarMaxW = hpBarW;
        this.monsterHpBarX = hpBarX;

        // 屬性
        this.monsterStatsText = this.add.text(540, 118, '', {
            fontSize: '12px',
            color: C.TEXT_DIM,
            fontFamily: 'monospace',
            lineSpacing: 2,
        });

        // 狀態列
        this.monsterStatusText = this.add.text(540, 280, '', {
            fontSize: '11px',
            color: '#ffaa88',
            wordWrap: { width: 400 },
            lineSpacing: 2,
        });
    }

    _createBattleLog() {
        this.add.rectangle(480, 350, 920, 96, C.LOG_BG, 0.95).setStrokeStyle(1, 0x222244);
        this.logTexts = [];
        for (let i = 0; i < 4; i++) {
            this.logTexts.push(
                this.add.text(30, 314 + i * 22, '', {
                    fontSize: '12px',
                    color: C.TEXT_LOG,
                    fontFamily: 'monospace',
                })
            );
        }
    }

    _createSkillPanel() {
        this.add.rectangle(480, 447, 920, 74, 0x0f0f20, 0.8);
        this.add.text(18, 413, '技能', { fontSize: '13px', color: '#8888cc' });

        const skills = GameState.skills;
        const btnW = 170, btnH = 60, gap = 8;
        const totalW = skills.length * btnW + (skills.length - 1) * gap;
        const startX = (960 - totalW) / 2;

        this.skillBtns = [];
        skills.forEach((skill, i) => {
            const sx = SKILLS[skill.id];
            const x = startX + i * (btnW + gap) + btnW / 2;
            const y = 448;

            const bg = this.add.rectangle(x, y, btnW, btnH, C.BTN)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(1, C.BORDER_P);

            const nameText = this.add.text(x, y - 11, sx ? sx.name : skill.id, {
                fontSize: '13px',
                color: C.TEXT_BODY,
                align: 'center',
                wordWrap: { width: btnW - 12 },
            }).setOrigin(0.5, 0.5);

            // 階段指示（Lv.2 / Lv.3）
            const stage = skill.stage || 1;
            const enhText = this.add.text(x, y + 14, stage > 1 ? `Lv.${stage}` : '', {
                fontSize: '10px',
                color: '#aa88ff',
            }).setOrigin(0.5, 0.5);

            bg.on('pointerover', () => { if (bg.active && bg.input) bg.setFillStyle(C.BTN_HOV); });
            bg.on('pointerout', () => { if (bg.active && bg.input) bg.setFillStyle(C.BTN); });
            bg.on('pointerdown', () => this._onSkillClick(skill.id));

            this.skillBtns.push({ bg, nameText, enhText, skillId: skill.id });
        });
    }

    _createItemPanel() {
        this.add.rectangle(380, 547, 680, 58, 0x0f0f20, 0.8);
        this.add.text(18, 520, '道具', { fontSize: '13px', color: '#cc9966' });

        this.itemBtns = [];
        for (let i = 0; i < 3; i++) {
            const x = 28 + i * 170 + 80;
            const y = 547;
            const bg = this.add.rectangle(x, y, 155, 50, C.BTN).setStrokeStyle(1, 0x554422);
            const lbl = this.add.text(x, y, '（空）', {
                fontSize: '12px',
                color: C.TEXT_DIM,
                align: 'center',
                wordWrap: { width: 145 },
            }).setOrigin(0.5, 0.5);
            this.itemBtns.push({ bg, lbl, index: i });
        }
        this._refreshItemButtons();
    }

    _createFleeButton() {
        const x = 870, y = 547;
        this.fleeBtnBg = this.add.rectangle(x, y, 140, 50, 0x2a1a1a)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x884422);
        this.fleeBtnText = this.add.text(x, y, '逃跑', { fontSize: '15px', color: '#cc8866' }).setOrigin(0.5, 0.5);

        this.fleeBtnBg.on('pointerover', () => this.fleeBtnBg.setFillStyle(0x3a2a1a));
        this.fleeBtnBg.on('pointerout', () => this.fleeBtnBg.setFillStyle(0x2a1a1a));
        this.fleeBtnBg.on('pointerdown', () => this._onFleeClick());

        if (this.isBoss) {
            this.fleeBtnBg.setFillStyle(0x1a1a1a).disableInteractive();
            this.fleeBtnText.setColor('#444444');
            this.add.text(x, y + 16, 'Boss 戰不可逃', { fontSize: '9px', color: '#444444' }).setOrigin(0.5, 0.5);
        }
    }

    _createPhaseIndicator() {
        this.phaseText = this.add.text(480, 620, '', {
            fontSize: '13px',
            color: C.TEXT_DIM,
        }).setOrigin(0.5, 0.5);
    }

    // ── UI 更新 ──────────────────────────────────────────

    _updateUI() {
        const p = this.player;
        const m = this.monster;

        // 玩家 HP
        this.playerHpText.setText(`HP: ${p.hp} / ${p.maxHp}`);
        this._updateHpBar(this.playerHpBarFg, this.playerHpBarMaxW, p.hp, p.maxHp, C.HP_GREEN);

        // 玩家屬性（有效值）
        const ps = getEffectiveStats(p);
        this.playerStatsText.setText(`ATK ${Math.floor(ps.attack)}  DEF ${Math.floor(ps.defense)}  AGI ${Math.floor(ps.agility)}`);

        // 玩家狀態
        const pStatuses = getStatusNames(p);
        this.playerStatusText.setText(pStatuses.length > 0 ? '狀態：' + pStatuses.join('  ') : '');

        // 怪物
        this.monsterNameText.setText(m.name + (m.isBoss ? ' ★' : ''));
        this.monsterPortraitText.setText(m.name);
        this.monsterHpText.setText(`HP: ${m.hp} / ${m.maxHp}`);
        this._updateHpBar(this.monsterHpBarFg, this.monsterHpBarMaxW, m.hp, m.maxHp, C.HP_RED);

        const ms = getEffectiveStats(m);
        this.monsterStatsText.setText(`ATK ${Math.floor(ms.attack)}  DEF ${Math.floor(ms.defense)}  AGI ${Math.floor(ms.agility)}`);

        // 怪物狀態（含 Boss 特殊）
        const mStatuses = getStatusNames(m);
        if (m.flags.hasCrownShards && m.crownShards > 0) mStatuses.push(`王冠碎片 ×${m.crownShards}`);
        if (m.flags.hasScaleArmor && hasStatus(m, 'scale_armor')) mStatuses.push('深淵鱗甲');
        this.monsterStatusText.setText(mStatuses.length > 0 ? '狀態：' + mStatuses.join('  ') : '');

        // 技能按鈕啟用狀態
        this._refreshSkillButtons();
        this._refreshItemButtons();
    }

    _updateHpBar(bar, maxW, current, max, baseColor) {
        const pct = Math.max(0, current / max);
        bar.setSize(maxW * pct, 12);
        const color = pct > 0.5 ? baseColor : (pct > 0.25 ? C.HP_YELLOW : C.HP_RED);
        bar.setFillStyle(color);
    }

    _refreshSkillButtons() {
        this.skillBtns.forEach(({ bg, nameText, skillId }) => {
            const skillDef = SKILLS[skillId];
            const locked = !this.isPlayerTurn || isSkillLocked(this.player, skillId, skillDef);
            const missingReq = skillDef?.requireStatus && !hasStatus(this.player, skillDef.requireStatus);

            if (locked || missingReq) {
                bg.setFillStyle(C.BTN_DIS).disableInteractive();
                nameText.setAlpha(0.35);
            } else {
                bg.setFillStyle(C.BTN).setInteractive({ useHandCursor: true });
                nameText.setAlpha(1);
            }
        });
    }

    _refreshItemButtons() {
        const items = GameState.items;
        const locked = areItemsLocked(this.player);

        this.itemBtns.forEach(({ bg, lbl, index }) => {
            const slot = items[index];
            if (slot && this.isPlayerTurn && !locked) {
                lbl.setText(`${ITEMS[slot.itemId]?.name || slot.itemId}\n×${slot.count}`);
                lbl.setColor('#ddaa88');
                bg.setFillStyle(0x2a1a10).setInteractive({ useHandCursor: true });
                bg.removeAllListeners('pointerdown');
                bg.removeAllListeners('pointerover');
                bg.removeAllListeners('pointerout');
                bg.on('pointerover', () => bg.setFillStyle(0x3a2a18));
                bg.on('pointerout', () => bg.setFillStyle(0x2a1a10));
                bg.on('pointerdown', () => this._onItemClick(slot.itemId, index));
            } else if (slot) {
                lbl.setText(`${ITEMS[slot.itemId]?.name || slot.itemId}\n×${slot.count}`);
                lbl.setColor(C.TEXT_DIM);
                bg.setFillStyle(C.BTN_DIS).disableInteractive();
            } else {
                lbl.setText('（空）').setColor(C.TEXT_DIM);
                bg.setFillStyle(C.BTN_DIS).disableInteractive();
            }
        });
    }

    // ── 戰鬥日誌 ─────────────────────────────────────────

    _addLog(msg, color = C.TEXT_LOG) {
        this.logMessages.unshift(msg);
        if (this.logMessages.length > 4) this.logMessages.pop();
        this.logTexts.forEach((t, i) => {
            const line = this.logMessages[i] || '';
            t.setText(line ? `> ${line}` : '');
            t.setAlpha(Math.max(0.3, 1 - i * 0.22));
            if (i === 0) t.setColor(color);
            else t.setColor(C.TEXT_LOG);
        });
    }

    _setPhase(text) {
        this.phaseText.setText(text);
    }

    // ── 玩家回合 ─────────────────────────────────────────

    _startPlayerTurn() {
        this.isPlayerTurn = true;
        this.monsterContext = {};
        this.guardDeclared = false;

        // 法師被動：蓄能
        if (GameState.playerClass === 'mage') {
            this.passiveState.chargeStacks = (this.passiveState.chargeStacks || 0) + 1;
            if (this.passiveState.chargeStacks >= 4) {
                applyStatus(this.player, 'charge_ready', STATUS_DEFS.charge_ready);
                this.passiveState.chargeStacks = 0;
                this._addLog('【蓄能】達到 4 層，下一次技能傷害 ×1.5！', C.TEXT_GOOD);
            }
        }

        // 「有罪」狀態：每回合提醒
        if (hasStatus(this.player, 'guilty')) {
            const guilty = this.player.statuses.guilty;
            this._addLog(`【有罪】使用非攻擊技能將受到 ${guilty.damageOnNonAttack} 點傷害。`, '#ffaa44');
        }

        this._setPhase('▶ 你的回合 — 選擇行動');
        this._updateUI();
    }

    _disableAllInputs() {
        this.isPlayerTurn = false;
        this._refreshSkillButtons();
        this.itemBtns.forEach(({ bg }) => bg.disableInteractive());
        this.fleeBtnBg.disableInteractive();
    }

    // ── 技能點擊 ─────────────────────────────────────────

    _onSkillClick(skillId) {
        if (!this.isPlayerTurn) return;
        const skillDef = SKILLS[skillId];
        if (!skillDef) return;

        // 檢查需求狀態
        if (skillDef.requireStatus && !hasStatus(this.player, skillDef.requireStatus)) {
            this._addLog(`無法使用「${skillDef.name}」—— 需要「${skillDef.requireStatus}」狀態。`, C.TEXT_BAD);
            return;
        }
        // 檢查封鎖
        if (isSkillLocked(this.player, skillId, skillDef)) {
            this._addLog(`「${skillDef.name}」目前被封鎖，無法使用。`, C.TEXT_BAD);
            return;
        }

        // 「有罪」狀態 + 非攻擊技能 → 受到傷害
        if (hasStatus(this.player, 'guilty') && !skillDef.multiplier && !skillDef.hits) {
            const guilt = this.player.statuses.guilty;
            const dmg = guilt.damageOnNonAttack || 8;
            applyDamage(this.player, dmg);
            this._addLog(`【有罪】使用非攻擊技能，受到 ${dmg} 點懲戒傷害！`, '#ff6633');
            if (this._checkPlayerDead()) return;
        }

        // 宣告式技能（警戒）
        if (skillDef.isReactive) {
            this.guardDeclared = true;
            this._addLog(`你宣告「${skillDef.name}」，警戒怪物的攻擊。`, C.TEXT_INFO);
            this.playerLastActionType = 'status';
            this._disableAllInputs();
            this.time.delayedCall(600, () => this._startMonsterTurn());
            return;
        }

        // 敏捷判定技能（閃光術）
        if (skillDef.usesAgilityCheck) {
            const effects = this._getSkillEffects(skillId);
            const ps = getEffectiveStats(this.player);
            const ms = getEffectiveStats(this.monster);
            const evaded = effects.guaranteed ? false :
                (ms.agility > ps.agility ? Math.random() * 100 < (ms.agility - ps.agility) : false);
            if (!evaded) {
                (effects.onSuccess || []).forEach(eff => this._applyEffect(eff, this.player, this.monster));
                this._addLog(`你使用「${skillDef.name}」成功！對方下回合大幅遲緩。`, C.TEXT_GOOD);
            } else {
                this._addLog(`你使用「${skillDef.name}」，但對方閃開了！`, C.TEXT_DIM);
            }
            (effects.onUse || []).forEach(eff => this._applyEffect(eff, this.player, this.monster));
            this.playerLastActionType = 'status';
            this._disableAllInputs();
            this.time.delayedCall(600, () => this._startMonsterTurn());
            return;
        }

        // 機率技能（豪賭一擲）
        if (skillDef.successChance !== undefined) {
            const effects = this._getSkillEffects(skillId);
            const luck = Math.random();
            if (luck < effects.successChance) {
                this._dealDamageToMonster(effects, skillId, effects.multiplier);
                this._addLog(`豪賭一擲！幸運爆發，造成強力傷害！`, C.TEXT_GOOD);
                consumeDamageBuffs(this.player);
            } else {
                if ((effects.onFail || []).length > 0) {
                    effects.onFail.forEach(eff => this._applyEffect(eff, this.player, this.monster));
                    this._addLog(`豪賭一擲……失敗了！你下回合無法行動。`, C.TEXT_BAD);
                } else {
                    this._addLog(`豪賭一擲……失敗，但你及時反應，沒有失衡。`, C.TEXT_DIM);
                }
            }
            this.playerLastActionType = 'attack';
            this._disableAllInputs();
            this.time.delayedCall(700, () => this._afterPlayerAct());
            return;
        }

        // 純 buff 技能（無傷害）
        if (!skillDef.multiplier && !skillDef.hits) {
            const effects = this._getSkillEffects(skillId);
            (effects.onUse || []).forEach(eff => this._applyEffect(eff, this.player, this.monster));
            this._addLog(`你使用「${skillDef.name}」。`, C.TEXT_INFO);
            this.playerLastActionType = 'status';
            this._disableAllInputs();
            this.time.delayedCall(600, () => this._afterPlayerAct());
            return;
        }

        // 標準攻擊技能
        const effects = this._getSkillEffects(skillId);
        (effects.onUse || []).forEach(eff => this._applyEffect(eff, this.player, this.monster));
        for (let h = 0; h < effects.hits; h++) {
            this._dealDamageToMonster(effects, skillId, effects.multiplier);
            if (this.monster.hp <= 0) break;
        }

        // 乘勝追擊計數（戰士被動「奮鬥」）
        if (skillId === 'follow_up' && GameState.playerClass === 'warrior') {
            this.passiveState.followUpCount = (this.passiveState.followUpCount || 0) + 1;
            if (this.passiveState.followUpCount >= 2) {
                this.passiveState.followUpCount = 0;
                applyStatus(this.player, 'fighting_spirit_buff', STATUS_DEFS.fighting_spirit_buff);
                this._addLog('【奮鬥】連續追擊激發鬥志，下次攻擊傷害 ×2！', C.TEXT_GOOD);
            }
        }

        // 「強化效果消耗後」清理
        consumeDamageBuffs(this.player);
        this.playerLastActionType = 'attack';

        if (this._checkMonsterDead()) return;

        this._disableAllInputs();
        this.time.delayedCall(700, () => this._afterPlayerAct());
    }

    _dealDamageToMonster(effects, skillId, multiplier) {
        const ps = getEffectiveStats(this.player);
        const ms = getEffectiveStats(this.monster);

        const outMult = getOutgoingDamageMult(this.player);
        // 遊俠養精蓄銳
        const recuperateMult = GameState.playerClass === 'ranger'
            ? 1 + (this.passiveState.recuperateStacks || 0) * 0.5 : 1;

        // 閃避判定
        let bypassEvasion = effects.bypassEvasion || false;
        if (effects.conditionalBypassEvasion === 'selfAgilityHigher' && ps.agility > ms.agility) {
            bypassEvasion = true;
        }
        // 防禦判定（含條件性略過，如暗算 stage 2）
        let bypassDef = shouldBypassDefense(this.player, effects.bypassDefense || false);
        if (effects.conditionalBypassDefense === 'selfAgilityHigher' && ps.agility > ms.agility) {
            bypassDef = true;
        }

        const result = executeAttack(
            { attack: Math.floor(ps.attack * recuperateMult), agility: ps.agility },
            { agility: ms.agility, defense: bypassDef ? 0 : Math.floor(ms.defense) },
            multiplier,
            { bypassEvasion, bypassDefense: bypassDef, statusMultiplier: outMult }
        );

        if (!result.hit) {
            this._addLog(`你使用「${SKILLS[skillId]?.name || skillId}」，但被閃避了！`, C.TEXT_DIM);
            return;
        }

        // 受傷倍率（怪物有 mirror_shield 等）
        const inMult = getIncomingDamageMult(this.monster);
        const finalDmg = Math.max(1, Math.floor(result.damage * inMult));

        // mirror_shield 消耗
        consumeHitDebuffs(this.monster);

        applyDamage(this.monster, finalDmg);
        GameState.totalDamageDealt += finalDmg;
        this._addLog(`你使用「${SKILLS[skillId]?.name || skillId}」，造成 ${finalDmg} 點傷害！`, C.TEXT_GOOD);

        // onHit 效果
        (effects.onHit || []).forEach(eff => this._applyEffect(eff, this.player, this.monster));

        // 養精蓄銳重置（遊俠攻擊命中後）
        if (GameState.playerClass === 'ranger' && this.passiveState.recuperateStacks > 0) {
            this.passiveState.recuperateStacks = 0;
        }

        // 血誓騎士：玩家攻擊時觸發復仇
        if (this.monster.id === 'blood_oath_knight' && this.monster.oathActive) {
            this.monsterContext.vengeanceReady = true;
        }

        // 鏽甲魔像：裂紋累積
        if (this.monster.id === 'rustbound_golem') {
            this.rustCracks++;
            if (this.rustCracks >= 3) {
                this.rustCracks = 0;
                applyStatus(this.monster, 'defense_broken', STATUS_DEFS.defense_broken);
                this._addLog('【裂紋】鏽甲崩潰！魔像防禦大幅降低（2 回合）。', C.TEXT_GOOD);
            }
        }

        // 深淵龍蜥：鱗裂累積
        if (this.monster.id === 'abyssal_drake' && hasStatus(this.monster, 'scale_armor')) {
            if (!this.monster.scaleCracks) this.monster.scaleCracks = 0;
            this.monster.scaleCracks++;
            if (this.monster.scaleCracks >= 4) {
                removeStatus(this.monster, 'scale_armor');
                this.monster.scaleCracks = 0;
                applyStatus(this.monster, 'defense_broken', STATUS_DEFS.defense_broken);
                this._addLog('【裂鱗】深淵鱗甲破裂！龍蜥防禦崩潰（2 回合）！', C.TEXT_GOOD);
            } else {
                this._addLog(`【裂鱗 ${this.monster.scaleCracks}/4】鱗甲出現裂縫…`, C.TEXT_DIM);
            }
        }

        this._updateUI();
    }

    // ── 道具點擊 ─────────────────────────────────────────

    _onItemClick(itemId, index) {
        if (!this.isPlayerTurn) return;
        if (areItemsLocked(this.player)) {
            this._addLog('你的道具被封鎖了，無法使用！', C.TEXT_BAD);
            return;
        }

        const itemDef = ITEMS[itemId];
        if (!itemDef) return;

        GameState.useItem(index);
        const eff = itemDef.effect;

        if (itemDef.type === 'heal') {
            const healed = Math.min(eff.healAmount, this.player.maxHp - this.player.hp);
            applyHeal(this.player, eff.healAmount);
            GameState.syncHpFromBattle(this.player.hp);
            this._addLog(`你使用「${itemDef.name}」，恢復 ${healed} 點 HP！`, C.TEXT_GOOD);
        } else if (itemDef.type === 'damage') {
            const dmg = eff.damage;
            const bypassDef = eff.bypassDefense || false;
            const bypassEva = eff.bypassEvasion || false;
            // 道具傷害不受閃避影響（直接命中）
            const inMult = getIncomingDamageMult(this.monster);
            const finalDmg = Math.max(1, Math.floor(dmg * inMult));
            consumeHitDebuffs(this.monster);
            applyDamage(this.monster, finalDmg);
            GameState.totalDamageDealt += finalDmg;
            this._addLog(`你使用「${itemDef.name}」，對怪物造成 ${finalDmg} 點傷害！`, C.TEXT_GOOD);
            if (eff.applyStatus) {
                const target = eff.statusTarget === 'enemy' ? this.monster : this.player;
                const def = STATUS_DEFS[eff.applyStatus];
                if (def) applyStatus(target, eff.applyStatus, def);
            }
            if (this._checkMonsterDead()) return;
        } else if (itemDef.type === 'status') {
            const target = eff.statusTarget === 'enemy' ? this.monster : this.player;
            const def = { ...STATUS_DEFS[eff.applyStatus] };
            if (eff.duration) def.duration = eff.duration;
            if (def) applyStatus(target, eff.applyStatus, def);
            this._addLog(`你使用「${itemDef.name}」！`, C.TEXT_INFO);
        } else if (itemDef.type === 'stat_boost') {
            const { stat, value } = eff;
            GameState[stat] += value;
            this.player[stat] = (this.player[stat] || 0) + value;
            const statName = { attack: '攻擊', defense: '防禦', agility: '敏捷', maxHp: '最大生命值' }[stat] || stat;
            this._addLog(`你使用「${itemDef.name}」，${statName} 永久 +${value}！`, C.TEXT_GOOD);
        }

        this.playerLastActionType = 'item';
        this._updateUI();
        this._disableAllInputs();
        this.time.delayedCall(600, () => this._afterPlayerAct());
    }

    // ── 逃跑 ─────────────────────────────────────────────

    _onFleeClick() {
        if (!this.isPlayerTurn || this.isBoss) return;

        const ps = getEffectiveStats(this.player);
        const ms = getEffectiveStats(this.monster);
        const success = rollEscape(ps.agility, ms.agility);

        this.playerLastActionType = 'flee';
        this._disableAllInputs();

        if (success) {
            // 遊俠被動「養精蓄銳」：逃跑成功疊加
            if (GameState.playerClass === 'ranger') {
                this.passiveState.recuperateStacks = (this.passiveState.recuperateStacks || 0) + 1;
                this._addLog(`【養精蓄銳】攻擊倍率 +50%（共 ×${1 + this.passiveState.recuperateStacks * 0.5}）。`, C.TEXT_INFO);
            }

            GameState.syncHpFromBattle(this.player.hp);
            clearBattleStatuses(this.player);
            GameState.crossBattleStatuses = {};
            this._addLog('你成功逃跑了！', C.TEXT_GOOD);
            this.time.delayedCall(800, () => {
                this.scene.start('RewardScene', { escaped: true });
            });
        } else {
            this._addLog('逃跑失敗！', C.TEXT_BAD);
            this.monsterContext.escapeFailed = true;
            this.time.delayedCall(600, () => this._startMonsterTurn());
        }
    }

    // ── 怪物回合 ─────────────────────────────────────────

    _afterPlayerAct() {
        this._updateUI();
        this._startMonsterTurn();
    }

    _startMonsterTurn() {
        this._setPhase('⚔ 怪物的回合…');

        // 怪物是否被失衡？
        if (hasStatus(this.monster, 'staggered')) {
            this._addLog(`${this.monster.name} 失衡，跳過行動。`, C.TEXT_DIM);
            this.time.delayedCall(600, () => this._endTurn());
            return;
        }

        // 選擇怪物行動
        this.monsterContext.playerLastActionType = this.playerLastActionType;
        this.monsterContext.vengeanceReady = this.vengeanceReady;
        const actionId = this.monster.selectAction(this.monster, this.player, this.turnCount, this.monsterContext);
        this.vengeanceReady = false;

        this.time.delayedCall(400, () => {
            this._executeMonsterAction(actionId);
        });
    }

    _executeMonsterAction(actionId) {
        const action = this.monster.actions[actionId];
        if (!action) {
            this._addLog(`${this.monster.name} 沉默不語…`, C.TEXT_DIM);
            this.time.delayedCall(400, () => this._endTurn());
            return;
        }

        // 自訂日誌優先
        if (action.logMessage) this._addLog(action.logMessage, C.TEXT_BAD);

        switch (action.type) {

            case 'attack':
            case 'multi_attack': {
                const hits = action.type === 'multi_attack' ? (action.hits || 2) : 1;
                for (let h = 0; h < hits; h++) {
                    this._monsterAttackHit(action);
                    if (this.player.hp <= 0) break;
                }
                break;
            }

            case 'self_buff': {
                const def = STATUS_DEFS[action.applyStatus];
                if (def) {
                    // 地穴侍僧暗禱：玩家有負面狀態時效果翻倍
                    let statusDef = { ...def };
                    if (action.amplifyIfPlayerDebuffed) {
                        const debuffs = Object.values(this.player.statuses || {}).filter(
                            s => s.attackMult < 1 || s.agilityMult < 1 || s.agilityFlat < 0 || s.skipTurn || s.lockSkillType || s.lockRandomSkill
                        );
                        if (debuffs.length > 0) {
                            statusDef = { ...statusDef, outgoingDamageMult: (statusDef.outgoingDamageMult || 1) * 1.4 };
                            this._addLog(`${this.monster.name} 感覺到你的弱點，祈禱威力加倍！`, '#ff8844');
                        }
                    }
                    applyStatus(this.monster, action.applyStatus, statusDef);
                }
                if (!action.logMessage) this._addLog(`${this.monster.name} 使用「${action.name}」。`, C.TEXT_DIM);
                break;
            }

            case 'debuff': {
                const target = action.target === 'player' ? this.player : this.monster;
                let def = { ...STATUS_DEFS[action.applyStatus] };
                if (action.duration) def.duration = action.duration;

                // skill_locked_random：隨機鎖定一個技能
                if (action.applyStatus === 'skill_locked_random') {
                    const skillIds = GameState.skills.map(s => s.id);
                    const lockId = skillIds[Math.floor(Math.random() * skillIds.length)];
                    def.lockedSkillId = lockId;
                    this.lockedSkillId = lockId;
                    applyStatus(target, action.applyStatus, def);
                    const lockedName = SKILLS[lockId]?.name || lockId;
                    this._addLog(`${this.monster.name} 使用「${action.name}」，你的「${lockedName}」被封鎖！`, C.TEXT_BAD);
                } else {
                    applyStatus(target, action.applyStatus, def);
                    if (!action.logMessage) this._addLog(`${this.monster.name} 使用「${action.name}」！`, C.TEXT_BAD);
                }
                break;
            }

            case 'heal_self': {
                const healed = Math.min(action.healAmount, this.monster.maxHp - this.monster.hp);
                applyHeal(this.monster, action.healAmount);
                if (!action.logMessage) this._addLog(`${this.monster.name} 恢復了 ${healed} 點 HP！`, C.TEXT_BAD);
                break;
            }

            case 'special_indictment': {
                // 符文審判者：根據玩家上一回合行動決定效果
                this._handleIndictment();
                break;
            }

            case 'copy_buff': {
                // 鏡中聖女：複製玩家正面狀態
                const positive = Object.entries(this.player.statuses || {})
                    .filter(([, s]) => s.outgoingDamageMult > 1 || s.attackMult > 1 || s.defenseMult > 1);
                if (positive.length > 0) {
                    const [id, s] = positive[0];
                    applyStatus(this.monster, id, { ...s });
                    this._addLog(`${this.monster.name} 複製了你的「${s.name}」！`, C.TEXT_BAD);
                } else {
                    this._addLog(`${this.monster.name} 試圖複製你的力量，但你沒有強化狀態。`, C.TEXT_DIM);
                }
                break;
            }

            default:
                if (!action.logMessage) this._addLog(`${this.monster.name} 使用了「${action.name}」。`, C.TEXT_DIM);
        }

        // 無冠巫王：王冠碎片累積
        if (this.monster.id === 'uncrowned_lich' && actionId !== 'crown_fall') {
            this.monster.crownShards = (this.monster.crownShards || 0) + 1;
            if (this.monster.crownShards >= 3 && actionId !== 'crown_fall') {
                this._addLog(`無冠巫王積累了 ${this.monster.crownShards} 片王冠碎片！下回合將爆發！`, '#ff8844');
            }
        }
        if (actionId === 'crown_fall') {
            this.monster.crownShards = 0;
        }

        if (this._checkPlayerDead()) return;
        this.time.delayedCall(400, () => this._endTurn());
    }

    _monsterAttackHit(action) {
        const ms = getEffectiveStats(this.monster);
        const ps = getEffectiveStats(this.player);

        const monsterOutMult = getOutgoingDamageMult(this.monster);
        const bypassEvasion = action.bypassEvasion || false;
        const bypassDef = action.bypassDefense || shouldBypassDefense(this.monster);

        // 警戒：stage 1 → 防禦 ×1.5；stage 2+ → 防禦 ×2.0 且獲得「氣勢」
        let extraDefenseMult = 1;
        if (this.guardDeclared && !bypassEvasion) {
            const guardStage = this._getSkillStage('guard');
            extraDefenseMult = guardStage >= 2 ? 2.0 : 1.5;
            if (guardStage >= 2) {
                applyStatus(this.player, 'momentum', STATUS_DEFS.momentum);
                this._addLog('【警戒】觸發！防禦大幅提高，並獲得「氣勢」。', C.TEXT_GOOD);
            } else {
                this._addLog('【警戒】觸發！防禦提高。', C.TEXT_GOOD);
            }
        }

        // 戰士堅定：HP < 20% 時防禦提高
        if (GameState.playerClass === 'warrior' && this.player.hp / this.player.maxHp < 0.2) {
            extraDefenseMult *= 1.5;
        }

        const effectiveDef = bypassDef ? 0 : Math.floor(ps.defense * extraDefenseMult);
        const result = executeAttack(
            { attack: Math.floor(ms.attack), agility: ms.agility },
            { agility: ps.agility, defense: effectiveDef },
            action.multiplier || 1,
            { bypassEvasion, bypassDefense: bypassDef, statusMultiplier: monsterOutMult }
        );

        if (!result.hit) {
            this._addLog(`${this.monster.name} 使用「${action.name}」，你閃避了！`, C.TEXT_GOOD);
            return;
        }

        // 受傷倍率
        const inMult = getIncomingDamageMult(this.player);
        let finalDmg = Math.max(1, Math.floor(result.damage * inMult));

        // 深井女妖靈爪：玩家有技能封鎖時額外傷害
        if (action.bonusDamageIfSkillLocked && this.lockedSkillId) {
            finalDmg = Math.floor(finalDmg * (1 + action.bonusDamageIfSkillLocked));
        }

        consumeHitDebuffs(this.player);
        applyDamage(this.player, finalDmg);
        this._addLog(`${this.monster.name} 使用「${action.name}」，你受到 ${finalDmg} 點傷害！`, C.TEXT_BAD);

        // 法師洞察被動：受傷後傷害加成
        if (GameState.playerClass === 'mage') {
            applyStatus(this.player, 'insight_buff', STATUS_DEFS.insight_buff);
        }

        // onHit
        (action.onHit || []).forEach(eff => {
            // 方向是對 player
            const effFull = { ...eff, target: 'player' };
            this._applyEffect(effFull, this.monster, this.player);
        });

        this._updateUI();
    }

    _handleIndictment() {
        const last = this.playerLastActionType;
        if (last === 'attack' || last === null) {
            this._addLog('你攻擊打斷了詠唱！符文審判者受到額外傷害。', C.TEXT_GOOD);
            applyDamage(this.monster, 10);
        } else if (last === 'status') {
            applyStatus(this.player, 'guilty', STATUS_DEFS.guilty);
            this._addLog('罪名宣告完成！你獲得「有罪」狀態（3 回合）。', C.TEXT_BAD);
        } else if (last === 'item') {
            applyStatus(this.player, 'items_locked', STATUS_DEFS.items_locked);
            this._addLog('罪名宣告完成！你的道具被封鎖 1 回合。', C.TEXT_BAD);
        }
    }

    // ── 回合結束 ─────────────────────────────────────────

    _endTurn() {
        // 怪物 tick 傷害（burning 等）
        if (this.monster.statuses) {
            const tickDmg = calcTickDamage(this.monster, this.player.attack);
            if (tickDmg > 0) {
                applyDamage(this.monster, tickDmg);
                this._addLog(`${this.monster.name} 受到持續傷害 ${tickDmg} 點。`, C.TEXT_GOOD);
                if (this._checkMonsterDead()) return;
            }
        }

        // 玩家 tick 傷害（poisoned 等）
        if (this.player.statuses) {
            const tickDmg = calcTickDamage(this.player, this.monster.attack);
            if (tickDmg > 0) {
                applyDamage(this.player, tickDmg);
                this._addLog(`你受到持續傷害 ${tickDmg} 點。`, C.TEXT_BAD);
                if (this._checkPlayerDead()) return;
            }
        }

        // 血誓騎士血誓自傷
        if (this.monster.oathActive) {
            const selfDmg = 3;
            applyDamage(this.monster, selfDmg);
            if (this._checkMonsterDead()) return;
        }

        // 孢子達到 3 層 → 轉化技能封鎖
        if (hasStatus(this.player, 'spore')) {
            const spore = this.player.statuses.spore;
            if ((spore.stacks || 1) >= 3) {
                removeStatus(this.player, 'spore');
                const skillIds = GameState.skills.map(s => s.id);
                const lockId = skillIds[Math.floor(Math.random() * skillIds.length)];
                const lockDef = { ...STATUS_DEFS.skill_locked_random, lockedSkillId: lockId };
                applyStatus(this.player, 'skill_locked_random', lockDef);
                const lockedName = SKILLS[lockId]?.name || lockId;
                this._addLog(`孢子爆發！你的「${lockedName}」下回合被封鎖！`, C.TEXT_BAD);
            }
        }

        // Tick 狀態計時
        tickStatuses(this.player);
        tickStatuses(this.monster);

        this.turnCount++;
        this.guardDeclared = false;
        this.lockedSkillId = null;

        this._updateUI();
        this.time.delayedCall(300, () => this._startPlayerTurn());
    }

    // ── 勝負判定 ─────────────────────────────────────────

    _checkMonsterDead() {
        if (this.monster.hp > 0) return false;
        this._onVictory();
        return true;
    }

    _checkPlayerDead() {
        if (this.player.hp > 0) return false;
        this._onDefeat();
        return true;
    }

    _onVictory() {
        this._setPhase('勝利！');
        this._addLog(`你擊敗了 ${this.monster.name}！`, C.TEXT_GOOD);
        this._disableAllInputs();
        this.fleeBtnBg.disableInteractive();

        // 遊俠熟能生巧：+10 敏捷
        if (GameState.playerClass === 'ranger') {
            GameState.agility += 10;
            this.passiveState.practiceBonus = (this.passiveState.practiceBonus || 0) + 10;
            this._addLog('【熟能生巧】敏捷 +10！', C.TEXT_GOOD);
        }

        GameState.syncHpFromBattle(this.player.hp);

        // 戰鬥結束：清除戰鬥內狀態，保留跨戰鬥狀態
        clearBattleStatuses(this.player);
        GameState.crossBattleStatuses = Object.fromEntries(
            Object.entries(this.player.statuses || {}).filter(([, s]) => s.persistAcrossBattle)
        );

        // 勝利後 HP 回滿
        GameState.restoreHp();

        this.time.delayedCall(1000, () => {
            if (this.monster.isBoss) {
                // Boss 擊敗 → 直接勝利（advanceBattle 在 RewardScene 呼叫）
                this.scene.start('RewardScene', { escaped: false });
            } else {
                this.scene.start('RewardScene', { escaped: false });
            }
        });
    }

    _onDefeat() {
        this._setPhase('你已倒下…');
        this._addLog('你的 HP 歸零，戰鬥失敗！', C.TEXT_BAD);
        this._disableAllInputs();
        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', { victory: false });
        });
    }

    // ── 工具方法 ─────────────────────────────────────────

    // 套用技能效果（onHit / onUse 中的效果描述）
    _applyEffect(eff, caster, target) {
        const effTarget = eff.target === 'self' ? caster : target;
        if (eff.applyStatus) {
            const def = { ...STATUS_DEFS[eff.applyStatus] };
            if (eff.duration !== undefined) def.duration = eff.duration;
            applyStatus(effTarget, eff.applyStatus, def);
        }
        if (eff.removeStatus) {
            removeStatus(effTarget, eff.removeStatus);
        }
    }

    _getSkillStage(skillId) {
        const skill = GameState.skills.find(s => s.id === skillId);
        return skill ? (skill.stage || 1) : 1;
    }

    _getSkillEffects(skillId) {
        const base = SKILLS[skillId];
        if (!base) return { hits: 1, multiplier: 1, onHit: [], onUse: [], onSuccess: [], onFail: [], bypassDefense: false, bypassEvasion: false, conditionalBypassEvasion: null, conditionalBypassDefense: null, successChance: undefined, guaranteed: false };
        const stage = this._getSkillStage(skillId);

        const effects = {
            name: base.name,
            multiplier: base.multiplier || 1,
            hits: base.hits || 1,
            bypassDefense: base.bypassDefense || false,
            bypassEvasion: base.bypassEvasion || false,
            conditionalBypassEvasion: base.conditionalBypassEvasion || null,
            conditionalBypassDefense: null,
            onHit: [...(base.onHit || [])],
            onUse: [...(base.onUse || [])],
            onSuccess: [...(base.onSuccess || [])],
            onFail: [...(base.onFail || [])],
            successChance: base.successChance,
            guaranteed: false,
        };

        switch (skillId) {
            // ── 戰士 ──────────────────────────────────────
            case 'momentum_slash':
                if (stage >= 2) effects.multiplier = 1.5;
                break;
            case 'follow_up':
                if (stage >= 2) effects.multiplier = 4;
                if (stage >= 3) effects.bypassDefense = true;
                break;
            case 'guard':
                // Stage effects handled in _monsterAttackHit via _getSkillStage('guard')
                break;
            case 'war_cry':
                // Stage 1: attack buff only (override base which mistakenly includes momentum)
                effects.onUse = [{ applyStatus: 'attack_up_1_5', target: 'self', duration: 1 }];
                if (stage >= 2) {
                    effects.onUse = [
                        { applyStatus: 'attack_up_1_5', target: 'self', duration: 2 },
                        { applyStatus: 'momentum', target: 'self' },
                    ];
                }
                if (stage >= 3) {
                    effects.onUse = [
                        { applyStatus: 'attack_up_1_5', target: 'self', duration: 2 },
                        { applyStatus: 'momentum', target: 'self' },
                        { applyStatus: 'defense_up_1_2', target: 'self', duration: 1 },
                    ];
                }
                break;
            case 'tackle':
                if (stage >= 2) {
                    effects.multiplier = 1.0;
                    effects.bypassEvasion = true;
                }
                // stage 3: skill lock — complex (monster has no skill system), omitted
                break;

            // ── 法師 ──────────────────────────────────────
            case 'fireball':
                if (stage >= 2) effects.multiplier = 1.5;
                if (stage >= 3) effects.onHit = [{ applyStatus: 'burning', target: 'enemy', duration: 2 }];
                break;
            case 'flash':
                if (stage >= 2) {
                    effects.guaranteed = true;
                    effects.onSuccess = [{ applyStatus: 'agility_down_severe', target: 'enemy', duration: 2 }];
                }
                if (stage >= 3) {
                    effects.onSuccess = [
                        { applyStatus: 'agility_down_severe', target: 'enemy', duration: 2 },
                        { applyStatus: 'skill_locked_attack', target: 'enemy', duration: 1 },
                    ];
                }
                break;
            case 'chant':
                if (stage >= 2) effects.onUse = [{ applyStatus: 'chant_buff_enhanced', target: 'self', duration: 1 }];
                // stage 3: buff also applies to DoT — complex, omitted
                break;
            case 'ice_bind':
                if (stage >= 2) effects.multiplier = 1.0;
                if (stage >= 3) effects.onHit = [{ applyStatus: 'frozen', target: 'enemy', duration: 3 }];
                break;
            case 'mana_drain':
                if (stage >= 2) {
                    effects.onHit = [
                        { applyStatus: 'attack_down_heavy', target: 'enemy', duration: 2 },
                        { applyStatus: 'drain_buff', target: 'self', duration: 1 },
                    ];
                }
                if (stage >= 3) {
                    effects.onHit = [
                        { applyStatus: 'attack_down_heavy', target: 'enemy', duration: 2 },
                        { applyStatus: 'drain_buff_enhanced', target: 'self', duration: 1 },
                    ];
                }
                break;

            // ── 遊俠 ──────────────────────────────────────
            case 'rapid_shot':
                if (stage >= 2) effects.hits = 3;
                if (stage >= 3) effects.bypassDefense = true;
                break;
            case 'disengage':
                if (stage >= 2) effects.onUse = [{ applyStatus: 'agility_double', target: 'self', duration: 2 }];
                if (stage >= 3) effects.onUse = [{ applyStatus: 'agility_triple', target: 'self', duration: 2 }];
                break;
            case 'ambush':
                if (stage >= 2) effects.conditionalBypassDefense = 'selfAgilityHigher';
                if (stage >= 3) effects.multiplier = 1.5;
                break;
            case 'all_in':
                if (stage >= 2) effects.successChance = 0.65;
                if (stage >= 3) effects.onFail = [];
                break;
            case 'poison_blade':
                if (stage >= 2) effects.onHit = [{ applyStatus: 'poisoned', target: 'enemy', duration: 5 }];
                // stage 3: tick damage already bypasses defense in calcTickDamage
                break;
        }
        return effects;
    }
}

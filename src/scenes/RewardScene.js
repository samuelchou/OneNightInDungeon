import Phaser from 'phaser';
import GameState from '../state/GameState.js';
import { ITEMS } from '../data/items.js';
import { generateVictoryRewards, generateEscapeReward } from '../systems/RewardSystem.js';

const CARD_COLORS = {
    skill_enhancement: { bg: 0x1a1a3a, border: 0x7755dd, label: '#aa88ff' },
    attribute_buff:    { bg: 0x1a2a1a, border: 0x44aa66, label: '#88ddaa' },
    item:              { bg: 0x2a1a10, border: 0xcc7733, label: '#ffaa66' },
};

export default class RewardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RewardScene' });
    }

    init(data) {
        this.escaped = data.escaped ?? false;
    }

    create() {
        const W = 960, H = 640;
        this.add.image(W / 2, H / 2, 'bg_menu').setDisplaySize(W, H);
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55);

        // 標題
        const title = this.escaped ? '逃跑獎勵' : '戰鬥獎勵';
        this.add.text(W / 2, 55, title, {
            fontSize: '28px',
            fontFamily: 'serif',
            color: '#e8d5a3',
        }).setOrigin(0.5, 0.5);

        const sub = this.escaped
            ? '逃跑成功，或許撿到了什麼…'
            : '選擇一個獎勵，繼續你的征途。';
        this.add.text(W / 2, 95, sub, {
            fontSize: '15px',
            color: '#888888',
        }).setOrigin(0.5, 0.5);

        // 產生獎勵
        const floor = typeof GameState.floor === 'number' ? GameState.floor : 3;
        this.rewards = this.escaped
            ? generateEscapeReward(floor)
            : generateVictoryRewards(floor, GameState);

        if (this.rewards.length === 0) {
            // 逃跑 50% 機率無獎勵
            this.add.text(W / 2, H / 2, '什麼都沒有…', {
                fontSize: '22px',
                color: '#666666',
            }).setOrigin(0.5, 0.5);
            this._createContinueButton(W, H);
            return;
        }

        // 排列卡片
        const cardW = 220, cardH = 340, gap = 30;
        const totalW = this.rewards.length * cardW + (this.rewards.length - 1) * gap;
        const startX = (W - totalW) / 2;

        this.rewards.forEach((reward, i) => {
            const cx = startX + i * (cardW + gap) + cardW / 2;
            this._createRewardCard(cx, H / 2 + 20, cardW, cardH, reward, i);
        });

        // 道具欄提示
        this._createInventoryHint(W, H);
    }

    _createRewardCard(cx, cy, w, h, reward, index) {
        const col = CARD_COLORS[reward.type] || CARD_COLORS.item;
        const frameKey = { skill_enhancement: 'ui_frame_skill', attribute_buff: 'ui_frame_attr', item: 'ui_frame_item' }[reward.type] || 'ui_frame_item';

        // 卡片底色（帶互動）
        const bg = this.add.rectangle(cx, cy, w, h, col.bg, 0.85)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, col.border);

        bg.on('pointerover', () => { bg.setAlpha(1); bg.setStrokeStyle(3, col.border); });
        bg.on('pointerout', () => { bg.setAlpha(0.85); bg.setStrokeStyle(2, col.border); });
        bg.on('pointerdown', () => this._selectReward(reward));

        // 獎勵框架圖（疊在底色上）
        this.add.image(cx, cy, frameKey).setDisplaySize(w, h).setAlpha(0.7);

        const top = cy - h / 2;

        // 類型標籤
        const typeLabel = { skill_enhancement: '技能加成', attribute_buff: '屬性加成', item: '道具' }[reward.type] || '？';
        this.add.text(cx, top + 22, typeLabel, {
            fontSize: '13px',
            color: col.label,
            fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0.5);

        this.add.rectangle(cx, top + 40, w - 20, 1, col.border, 0.5);

        // 道具圖示（item 型）
        if (reward.type === 'item' && reward.itemId) {
            const iconKey = `item_${reward.itemId}`;
            this.add.image(cx, top + 80, iconKey).setDisplaySize(64, 64);
        }

        // 名稱 / 標題
        const labelText = reward.label || this._getRewardLabel(reward);
        const nameY = (reward.type === 'item' && reward.itemId) ? top + 125 : top + 75;
        this.add.text(cx, nameY, labelText, {
            fontSize: '15px',
            color: '#ffffff',
            fontFamily: 'serif',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: w - 20 },
            lineSpacing: 4,
        }).setOrigin(0.5, 0.5);

        // 說明
        const descText = reward.desc || this._getRewardDesc(reward);
        const descY = (reward.type === 'item' && reward.itemId) ? cy + 40 : cy + 20;
        this.add.text(cx, descY, descText, {
            fontSize: '12px',
            color: '#cccccc',
            fontFamily: 'sans-serif',
            align: 'center',
            wordWrap: { width: w - 24 },
            lineSpacing: 5,
        }).setOrigin(0.5, 0.5);

        // 選擇按鈕
        const btnY = cy + h / 2 - 26;
        const btnBg = this.add.rectangle(cx, btnY, w - 16, 34, col.border, 0.2)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, col.border);
        this.add.text(cx, btnY, '選擇', {
            fontSize: '14px',
            color: col.label,
        }).setOrigin(0.5, 0.5);

        btnBg.on('pointerover', () => btnBg.setFillStyle(col.border, 0.5));
        btnBg.on('pointerout', () => btnBg.setFillStyle(col.border, 0.2));
        btnBg.on('pointerdown', () => this._selectReward(reward));
    }

    _getRewardLabel(reward) {
        if (reward.type === 'item' && reward.itemId) {
            return ITEMS[reward.itemId]?.name || reward.itemId;
        }
        return '未知獎勵';
    }

    _getRewardDesc(reward) {
        if (reward.type === 'item' && reward.itemId) {
            return ITEMS[reward.itemId]?.description || '';
        }
        return '';
    }

    _selectReward(reward) {
        // 道具欄滿時不能拿道具
        if (reward.type === 'item' && reward.itemId) {
            const existing = GameState.items.find(i => i.itemId === reward.itemId);
            if (!existing && GameState.items.length >= 3) {
                this._showMessage('道具欄已滿（最多 3 格），無法攜帶！');
                return;
            }
        }

        GameState.applyReward(reward);
        this._proceedToNext();
    }

    _proceedToNext() {
        const result = GameState.advanceBattle(this.escaped);

        switch (result) {
            case 'victory':
                this.scene.start('GameOverScene', { victory: true });
                break;
            case 'boss':
            case 'next_floor':
            case 'next_battle':
                this.scene.start('BattleScene');
                break;
            default:
                this.scene.start('BattleScene');
        }
    }

    _createContinueButton(W, H) {
        const btnY = H - 80;
        const btn = this.add.rectangle(W / 2, btnY, 180, 50, 0x2a2a4a)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x5544aa);
        this.add.text(W / 2, btnY, '繼續前進', {
            fontSize: '18px',
            color: '#aaaacc',
        }).setOrigin(0.5, 0.5);

        btn.on('pointerover', () => btn.setFillStyle(0x3a3a6a));
        btn.on('pointerout', () => btn.setFillStyle(0x2a2a4a));
        btn.on('pointerdown', () => this._proceedToNext());
    }

    _createInventoryHint(W, H) {
        const items = GameState.items;
        const parts = items.map(i => `${ITEMS[i.itemId]?.name || i.itemId} ×${i.count}`).join('  |  ');
        const hint = items.length > 0 ? `道具欄（${items.length}/3）：${parts}` : '道具欄（0/3）：空';
        this.add.text(W / 2, H - 30, hint, {
            fontSize: '12px',
            color: '#666666',
        }).setOrigin(0.5, 0.5);
    }

    _showMessage(msg) {
        const W = 960, H = 640;
        const box = this.add.rectangle(W / 2, H / 2, 400, 80, 0x2a2a2a)
            .setStrokeStyle(2, 0xaa5533)
            .setDepth(10);
        const txt = this.add.text(W / 2, H / 2, msg, {
            fontSize: '15px',
            color: '#ffaa66',
            align: 'center',
            wordWrap: { width: 380 },
        }).setOrigin(0.5, 0.5).setDepth(11);
        this.time.delayedCall(2000, () => { box.destroy(); txt.destroy(); });
    }
}

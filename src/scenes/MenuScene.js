import Phaser from 'phaser';
import GameState from '../state/GameState.js';
import { CLASSES } from '../data/classes.js';
import { SKILLS } from '../data/skills.js';

const CLASS_COLORS = {
    warrior: { card: 0x3a2020, border: 0xcc5533, title: '#ff9966' },
    mage:    { card: 0x1a1a3a, border: 0x5533cc, title: '#9966ff' },
    ranger:  { card: 0x1a2a1a, border: 0x33aa55, title: '#66cc88' },
};

const CLASS_PHILOSOPHY = {
    warrior: '以傷換傷，越打越強。\n透過格擋與戰吼展現強大，\n「氣勢」系統讓每次連擊更致命。',
    mage:    '鬥法也鬥智，算準時機。\n詠唱與元素效果疊加優勢，\n「蓄能」被動每 4 回合爆發一次。',
    ranger:  '將命運交託給自信與機率。\n速度優先，逃跑也是流派，\n每場勝利都能讓你更敏捷。',
};

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const W = 960, H = 640;

        // 背景圖
        this.add.image(W / 2, H / 2, 'bg_menu').setDisplaySize(W, H);
        // 暗色疊層，讓文字可讀
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.4);

        // Logo
        this.add.image(W / 2, 68, 'ui_logo').setDisplaySize(320, 72);

        this.add.text(W / 2, 118, '選擇你的職業，開始地下城之夜', {
            fontSize: '16px',
            fontFamily: 'sans-serif',
            color: '#aaaacc',
        }).setOrigin(0.5, 0.5);

        // 職業卡片
        const classes = ['warrior', 'mage', 'ranger'];
        const cardW = 260, cardH = 430, gap = 30;
        const totalW = classes.length * cardW + (classes.length - 1) * gap;
        const startX = (W - totalW) / 2;

        classes.forEach((cls, i) => {
            const cx = startX + i * (cardW + gap) + cardW / 2;
            const cy = 385;
            this._createClassCard(cx, cy, cardW, cardH, cls);
        });

        // 版本提示
        this.add.text(W / 2, H - 20, 'v0.1  —  滑鼠點擊操作', {
            fontSize: '12px',
            color: '#444466',
        }).setOrigin(0.5, 0.5);
    }

    _createClassCard(cx, cy, w, h, clsId) {
        const col = CLASS_COLORS[clsId];
        const cls = CLASSES[clsId];

        // 卡片背景
        const bg = this.add.rectangle(cx, cy, w, h, col.card)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, col.border);

        bg.on('pointerover', () => {
            bg.setFillStyle(Phaser.Display.Color.ValueToColor(col.card).brighten(20).color);
            bg.setStrokeStyle(3, col.border);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(col.card);
            bg.setStrokeStyle(2, col.border);
        });
        bg.on('pointerdown', () => this._selectClass(clsId));

        const top = cy - h / 2;
        const portraitKey = `char_${clsId}`;

        // 職業立繪
        this.add.image(cx, top + 90, portraitKey).setDisplaySize(160, 160);

        // 職業名稱
        this.add.text(cx, top + 185, cls.name, {
            fontSize: '22px',
            fontFamily: 'serif',
            color: col.title,
            fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // 分隔線
        this.add.rectangle(cx, top + 203, w - 30, 1, col.border, 0.5);

        // 流派說明
        this.add.text(cx, top + 238, CLASS_PHILOSOPHY[clsId], {
            fontSize: '11px',
            fontFamily: 'sans-serif',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: w - 30 },
            lineSpacing: 4,
        }).setOrigin(0.5, 0.5);

        // 技能清單
        this.add.text(cx, top + 295, '【技能】', {
            fontSize: '11px',
            color: col.title,
            fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0.5);

        cls.skills.forEach((skillId, idx) => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            this.add.text(cx, top + 313 + idx * 21, `· ${skill.name}`, {
                fontSize: '12px',
                color: '#aaaaaa',
                fontFamily: 'sans-serif',
                wordWrap: { width: w - 20 },
            }).setOrigin(0.5, 0.5);
        });

        // 底部「選擇」按鈕
        const btnY = cy + h / 2 - 28;
        const btnBg = this.add.rectangle(cx, btnY, w - 20, 36, col.border, 0.2)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, col.border);
        this.add.text(cx, btnY, '選擇此職業', {
            fontSize: '14px',
            color: col.title,
            fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0.5);

        btnBg.on('pointerover', () => btnBg.setFillStyle(col.border, 0.5));
        btnBg.on('pointerout', () => btnBg.setFillStyle(col.border, 0.2));
        btnBg.on('pointerdown', () => this._selectClass(clsId));
    }

    _selectClass(clsId) {
        GameState.init(clsId);
        this.scene.start('BattleScene');
    }
}

import Phaser from 'phaser';
import GameState from '../state/GameState.js';
import { CLASSES } from '../data/classes.js';
import { SKILLS } from '../data/skills.js';
import { SKILL_STAGE_DESCS } from '../systems/RewardSystem.js';
import { showInfoPopup, createInfoButton } from '../ui/InfoPopup.js';
import { createHelpButton } from '../ui/TutorialPopup.js';

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

const CLASS_PASSIVES = {
    warrior: [
        { name: '堅定', desc: '成功警戒後，下一回合開始時回復 5 點 HP。' },
        { name: '奮鬥', desc: '「乘勝追擊」連續使用 2 次後觸發，下次攻擊傷害 ×2。' },
    ],
    mage: [
        { name: '蓄能', desc: '每回合開始時蓄積 1 層，達到 4 層時觸發，下次技能傷害 ×1.5。' },
        { name: '洞察', desc: '若發動技能前怪物已有「燃燒」狀態，傷害額外 ×1.2。' },
    ],
    ranger: [
        { name: '熟能生巧', desc: '每場戰鬥勝利後，永久獲得敏捷 +1。' },
        { name: '養精蓄銳', desc: '逃跑或休息後，下一場戰鬥開始時攻擊 ×1.3（1 回合）。' },
        { name: '觀察', desc: '每場勝利後的道具獎勵中，多出現一個選項。' },
    ],
};

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const W = 960, H = 640;

        this.add.image(W / 2, H / 2, 'bg_menu').setDisplaySize(W, H);
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.4);

        this.add.image(W / 2, 68, 'ui_logo').setDisplaySize(320, 72);

        this.add.text(W / 2, 118, '選擇你的職業，開始地下城之夜', {
            fontSize: '16px',
            fontFamily: 'sans-serif',
            color: '#aaaacc',
        }).setOrigin(0.5, 0.5);

        const classes = ['warrior', 'mage', 'ranger'];
        const cardW = 260, cardH = 430, gap = 30;
        const totalW = classes.length * cardW + (classes.length - 1) * gap;
        const startX = (W - totalW) / 2;

        classes.forEach((cls, i) => {
            const cx = startX + i * (cardW + gap) + cardW / 2;
            this._createClassCard(cx, 385, cardW, cardH, cls);
        });

        createHelpButton(this);

        this.add.text(W / 2, H - 20, 'v0.1  —  滑鼠點擊操作', {
            fontSize: '12px',
            color: '#444466',
        }).setOrigin(0.5, 0.5);
    }

    _createClassCard(cx, cy, w, h, clsId) {
        const col = CLASS_COLORS[clsId];
        const cls = CLASSES[clsId];

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

        // 立繪
        this.add.image(cx, top + 90, `char_${clsId}`).setDisplaySize(160, 160);

        // 職業名稱
        this.add.text(cx, top + 185, cls.name, {
            fontSize: '22px', fontFamily: 'serif', color: col.title, fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);

        // 被動 [i]
        const { circle: passiveBtn, label: passiveLbl } = createInfoButton(
            this, cx + w / 2 - 14, top + 185,
            () => this._showClassInfo(clsId),
        );

        this.add.rectangle(cx, top + 203, w - 30, 1, col.border, 0.5);

        // 流派說明
        this.add.text(cx, top + 238, CLASS_PHILOSOPHY[clsId], {
            fontSize: '11px', fontFamily: 'sans-serif', color: '#cccccc',
            align: 'center', wordWrap: { width: w - 30 }, lineSpacing: 4,
        }).setOrigin(0.5, 0.5);

        // 技能清單標題
        this.add.text(cx, top + 295, '【技能】', {
            fontSize: '11px', color: col.title, fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0.5);

        // 技能列（每項右側有 [i]）
        cls.skills.forEach((skillId, idx) => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            const y = top + 313 + idx * 21;

            this.add.text(cx - 10, y, `· ${skill.name}`, {
                fontSize: '12px', color: '#aaaaaa', fontFamily: 'sans-serif',
            }).setOrigin(0.5, 0.5);

            createInfoButton(this, cx + w / 2 - 14, y,
                () => this._showSkillInfo(skillId),
            );
        });

    }

    _showSkillInfo(skillId) {
        const skill = SKILLS[skillId];
        if (!skill) return;
        const stageDescs = SKILL_STAGE_DESCS[skillId] || {};
        const sections = [
            {
                lines: [{ text: skill.description, color: '#dddddd' }],
            },
        ];
        if (stageDescs[2] || stageDescs[3]) {
            sections.push({
                header: '升階效果',
                lines: [
                    stageDescs[2] && { text: `★ Lv.2：${stageDescs[2]}`, color: '#aa88ff' },
                    stageDescs[3] && { text: `★★ Lv.3：${stageDescs[3]}`, color: '#ddaaff' },
                ].filter(Boolean),
            });
        }
        showInfoPopup(this, {
            title: skill.name,
            iconKey: `skill_${skillId}`,
            sections,
        });
    }

    _showClassInfo(clsId) {
        const cls = CLASSES[clsId];
        const passives = CLASS_PASSIVES[clsId] || [];
        showInfoPopup(this, {
            title: `${cls.name}  被動能力`,
            iconKey: `char_${clsId}`,
            sections: passives.map(p => ({
                header: p.name,
                lines: [{ text: p.desc }],
            })),
        });
    }

    _selectClass(clsId) {
        GameState.init(clsId);
        this.scene.start('BattleScene');
    }
}

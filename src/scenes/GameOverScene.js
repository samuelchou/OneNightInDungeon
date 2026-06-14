import Phaser from 'phaser';
import GameState from '../state/GameState.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory ?? false;
    }

    create() {
        const W = 960, H = 640;

        // 背景
        const bgColor = this.victory ? 0x0d1a0d : 0x1a0d0d;
        this.add.rectangle(W / 2, H / 2, W, H, bgColor);

        if (this.victory) {
            this._createVictoryScreen(W, H);
        } else {
            this._createDefeatScreen(W, H);
        }

        // 統計數字
        this._createStats(W, H);

        // 再玩一次按鈕
        this._createReplayButton(W, H);
    }

    _createVictoryScreen(W, H) {
        this.add.text(W / 2, 120, '勝利！', {
            fontSize: '56px',
            fontFamily: 'serif',
            color: '#ffe066',
            stroke: '#886600',
            strokeThickness: 4,
        }).setOrigin(0.5, 0.5);

        this.add.text(W / 2, 200, '你在地下城度過了難忘的一夜，\n打倒了 Boss，凱旋而歸！', {
            fontSize: '18px',
            fontFamily: 'sans-serif',
            color: '#cccc88',
            align: 'center',
            lineSpacing: 8,
        }).setOrigin(0.5, 0.5);

        // 裝飾線
        this.add.rectangle(W / 2, 248, 400, 1, 0x886600);
    }

    _createDefeatScreen(W, H) {
        this.add.text(W / 2, 120, '死亡', {
            fontSize: '56px',
            fontFamily: 'serif',
            color: '#cc3333',
            stroke: '#440000',
            strokeThickness: 4,
        }).setOrigin(0.5, 0.5);

        this.add.text(W / 2, 200, '黑暗將你吞噬，\n地下城深處埋葬了你的遺夢…', {
            fontSize: '18px',
            fontFamily: 'sans-serif',
            color: '#cc8888',
            align: 'center',
            lineSpacing: 8,
        }).setOrigin(0.5, 0.5);

        this.add.rectangle(W / 2, 248, 400, 1, 0x440000);
    }

    _createStats(W, H) {
        const stats = [
            ['職業', { warrior: '戰士', mage: '法師', ranger: '遊俠' }[GameState.playerClass] || '—'],
            ['抵達層數', GameState.floor === 'boss' ? 'Boss' : `第 ${GameState.floor} 層`],
            ['擊敗怪物', `${GameState.battlesWon} 場`],
            ['成功逃跑', `${GameState.battlesEscaped} 次`],
            ['最終屬性', `HP ${GameState.maxHp}  ATK ${GameState.attack}  DEF ${GameState.defense}  AGI ${GameState.agility}`],
        ];

        const startY = 280;
        this.add.text(W / 2, startY - 20, '本局統計', {
            fontSize: '15px',
            color: '#888888',
            fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0.5);

        stats.forEach(([label, value], i) => {
            const y = startY + 15 + i * 36;
            this.add.text(W / 2 - 160, y, label, {
                fontSize: '14px',
                color: '#888888',
                fontFamily: 'sans-serif',
            }).setOrigin(0, 0.5);
            this.add.text(W / 2 + 160, y, String(value), {
                fontSize: '14px',
                color: '#dddddd',
                fontFamily: 'monospace',
            }).setOrigin(1, 0.5);
            // 分隔線
            if (i < stats.length - 1) {
                this.add.rectangle(W / 2, y + 18, 360, 1, 0x333344);
            }
        });
    }

    _createReplayButton(W, H) {
        const btnY = H - 80;
        const btnW = 200, btnH = 50;

        const btn = this.add.rectangle(W / 2, btnY, btnW, btnH, 0x2a2a5a)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x5544aa);

        const txt = this.add.text(W / 2, btnY, '再玩一次', {
            fontSize: '20px',
            fontFamily: 'serif',
            color: '#ddddff',
        }).setOrigin(0.5, 0.5);

        btn.on('pointerover', () => btn.setFillStyle(0x3a3a7a));
        btn.on('pointerout', () => btn.setFillStyle(0x2a2a5a));
        btn.on('pointerdown', () => {
            GameState.reset();
            this.scene.start('MenuScene');
        });
    }
}

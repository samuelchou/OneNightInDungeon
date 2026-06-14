import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory ?? false;
    }

    create() {
        // TODO: 顯示勝利或失敗畫面
        // 提供「再玩一次」按鈕，返回 MenuScene
    }
}

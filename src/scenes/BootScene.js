import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 未來可從 manifest.json 載入圖片素材
        // 目前使用 Phaser 繪製的純色矩形作為佔位符
    }

    create() {
        this.scene.start('MenuScene');
    }
}

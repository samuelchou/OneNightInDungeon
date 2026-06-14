import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // TODO: 從 manifest.json 讀取並載入所有圖片素材
    }

    create() {
        this.scene.start('MenuScene');
    }
}

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // TODO: 顯示職業選擇畫面（戰士 / 法師 / 遊俠）
        // 選擇後呼叫：
        // this.scene.start('BattleScene', { playerClass: 'warrior', floor: 1 });
    }
}

import Phaser from 'phaser';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerClass = data.playerClass;
        this.floor = data.floor;
    }

    create() {
        // TODO: 建立戰鬥 UI（HP 條、技能欄、道具欄、行動按鈕）
        // TODO: 初始化玩家與怪物狀態
        // TODO: 處理回合流程
    }
}

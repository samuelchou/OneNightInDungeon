import Phaser from 'phaser';

export default class RewardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RewardScene' });
    }

    init(data) {
        this.playerState = data.playerState;
        this.floor = data.floor;
        this.escaped = data.escaped ?? false;
    }

    create() {
        // TODO: 顯示三選一獎勵卡片（技能加成 / 屬性加成 / 道具）
        // 逃跑時只顯示 0-1 個道具獎勵
        // 選擇後返回 BattleScene 進行下一場
    }
}

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const W = 960, H = 640;
        this.add.text(W / 2, H / 2 - 16, 'Loading...', {
            fontSize: '18px', color: '#888888', fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0.5);
        const barBg = this.add.rectangle(W / 2, H / 2 + 16, 400, 14, 0x222244);
        const bar   = this.add.rectangle(W / 2 - 200, H / 2 + 16, 0, 10, 0x7755dd).setOrigin(0, 0.5);
        this.load.on('progress', v => bar.setSize(400 * v, 10));

        // ── 背景 ───────────────────────────────────────────
        this.load.image('bg_menu',   'assets/images/background/menu.png');
        this.load.image('bg_level1', 'assets/images/background/level_1.png');
        this.load.image('bg_level2', 'assets/images/background/level_2.png');
        this.load.image('bg_level3', 'assets/images/background/level_3.png');
        this.load.image('bg_boss',   'assets/images/background/level_4.png');
        this.load.image('bg_result', 'assets/images/background/result.png');

        // ── 職業立繪 ───────────────────────────────────────
        this.load.image('char_warrior', 'assets/images/characters/01_warrior.png');
        this.load.image('char_mage',    'assets/images/characters/02_mage.png');
        this.load.image('char_ranger',  'assets/images/characters/03_ranger.png');

        // ── 怪物圖 ─────────────────────────────────────────
        this.load.image('monster_dungeon_rats',      'assets/images/monsters/04_DungeonRats.png');
        this.load.image('monster_skeleton_guard',    'assets/images/monsters/05_SkeletonGuard.png');
        this.load.image('monster_hexcap_fungus',     'assets/images/monsters/06_HexcapFungus.png');
        this.load.image('monster_grave_robber',      'assets/images/monsters/07_GraveRobber.png');
        this.load.image('monster_crypt_acolyte',     'assets/images/monsters/08_CryptAcolyte.png');
        this.load.image('monster_rustbound_golem',   'assets/images/monsters/09_RustBoundGolem.png');
        this.load.image('monster_well_wraith',       'assets/images/monsters/10_WellWraith.png');
        this.load.image('monster_blood_oath_knight', 'assets/images/monsters/11_BloodOathKnight.png');
        this.load.image('monster_rune_inquisitor',   'assets/images/monsters/12_RuneInquisitor.png');
        this.load.image('monster_uncrowned_lich',    'assets/images/monsters/13_TheUncrownedLich.png');
        this.load.image('monster_abyssal_drake',     'assets/images/monsters/14_AbyssalDrake.png');
        this.load.image('monster_saint_black_mirror','assets/images/monsters/15_SaintOfTheBlackMirror.png');

        // ── 技能圖示 ───────────────────────────────────────
        this.load.image('skill_momentum_slash', 'assets/images/skills/warrior/01_Slash.png');
        this.load.image('skill_follow_up',      'assets/images/skills/warrior/02_PressOn.png');
        this.load.image('skill_guard',          'assets/images/skills/warrior/03_Guard.png');
        this.load.image('skill_war_cry',        'assets/images/skills/warrior/04_WarCry.png');
        this.load.image('skill_tackle',         'assets/images/skills/warrior/05_Tackle.png');
        this.load.image('skill_fireball',       'assets/images/skills/mage/01_Fireball.png');
        this.load.image('skill_flash',          'assets/images/skills/mage/02_Flash.png');
        this.load.image('skill_chant',          'assets/images/skills/mage/03_Incantation.png');
        this.load.image('skill_ice_bind',       'assets/images/skills/mage/04_IceBind.png');
        this.load.image('skill_mana_drain',     'assets/images/skills/mage/05_ManaDrain.png');
        this.load.image('skill_rapid_shot',     'assets/images/skills/ranger/01_RapidFire.png');
        this.load.image('skill_disengage',      'assets/images/skills/ranger/02_Disengage.png');
        this.load.image('skill_ambush',         'assets/images/skills/ranger/03_Ambush.png');
        this.load.image('skill_all_in',         'assets/images/skills/ranger/04_AllIn.png');
        this.load.image('skill_poison_blade',   'assets/images/skills/ranger/05_PoisonBlade.png');

        // ── 道具圖示 ───────────────────────────────────────
        this.load.image('item_recovery_potion', 'assets/images/items/01_heal_potion.png');
        this.load.image('item_burning_seal',    'assets/images/items/02_fire_scroll.png');
        this.load.image('item_guardian_idol',   'assets/images/items/03_guardian_statue.png');
        this.load.image('item_healing_herb',    'assets/images/items/04_herbs.png');
        this.load.image('item_weakness_potion', 'assets/images/items/05_poison_potion.png');
        this.load.image('item_power_ring',      'assets/images/items/06_ruby_ring.png');
        this.load.image('item_angel_breath',    'assets/images/items/07_angel_breath.png');
        this.load.image('item_lightning_blade', 'assets/images/items/08_bolt_knife.png');
        this.load.image('item_golden_armor',    'assets/images/items/09_golden_armor.png');

        // ── UI ─────────────────────────────────────────────
        this.load.image('ui_logo',        'assets/images/ui/logo.png');
        this.load.image('ui_action_bar',  'assets/images/ui/action_bar.png');
        this.load.image('ui_frame_skill', 'assets/images/ui/prize_frame_skill.png');
        this.load.image('ui_frame_attr',  'assets/images/ui/prize_frame_attr.png');
        this.load.image('ui_frame_item',  'assets/images/ui/prize_frame_item.png');

        // ── 狀態圖示 ───────────────────────────────────────
        this.load.image('status_momentum',        'assets/images/ui/status/01_momentum.png');
        this.load.image('status_silence',         'assets/images/ui/status/02_silence.png');
        this.load.image('status_guilty',          'assets/images/ui/status/03_Guilty.png');
        this.load.image('status_blood_oath',      'assets/images/ui/status/04_BloodOath.png');
        this.load.image('status_spore',           'assets/images/ui/status/05_Spores.png');
        this.load.image('status_frozen',          'assets/images/ui/status/06_FrozenBind.png');
        this.load.image('status_poisoned',        'assets/images/ui/status/07_Poison.png');
        this.load.image('status_scale_crack',     'assets/images/ui/status/08_CrackedScale.png');
        this.load.image('status_shield',          'assets/images/ui/status/09_ShieldRaise.png');
        this.load.image('status_dodge',           'assets/images/ui/status/10_Evasion.png');
        this.load.image('status_steadfast',       'assets/images/ui/status/11_Steadfast.png');
        this.load.image('status_fighting_spirit', 'assets/images/ui/status/12_FightingSpirit.png');
        this.load.image('status_charge',          'assets/images/ui/status/13_Charge.png');
        this.load.image('status_insight',         'assets/images/ui/status/14_Insight.png');
        this.load.image('status_recuperate',      'assets/images/ui/status/15_Prepared.png');
        this.load.image('status_staggered',       'assets/images/ui/status/16_OffBalance.png');
        this.load.image('status_blessed',         'assets/images/ui/status/17_Benediction.png');
        this.load.image('status_crown_shard',     'assets/images/ui/status/18_CrownFragment.png');
        this.load.image('status_exhausted',       'assets/images/ui/status/19_Exhausted.png');
        this.load.image('status_rust_crack',      'assets/images/ui/status/20_RustCrack.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}

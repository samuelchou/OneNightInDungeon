// 各層標準數值：HP / ATK / DEF / AGI
// Floor 1: HP 40, ATK 15, DEF  0, AGI  8
// Floor 2: HP 60, ATK 20, DEF  3, AGI 12
// Floor 3: HP 80, ATK 26, DEF  6, AGI 16
// Boss:   HP120, ATK 32, DEF 10, AGI 20
//
// selectAction(monster, player, turnCount, ctx) → action id
// ctx: { escapeFailed, vengeanceReady, scaleBroken, playerLastActionType }

export const MONSTERS = {

    // ── 第一層：教學與基礎壓力 ────────────────────────────

    dungeon_rats: {
        id: 'dungeon_rats',
        name: '地牢鼠群',
        stats: { maxHp: 40, attack: 15, defense: 0, agility: 8 },
        actions: {
            normal_attack: {
                id: 'normal_attack',
                name: '撕咬',
                type: 'attack',
                multiplier: 0.8,
            },
            group_bite: {
                id: 'group_bite',
                name: '群咬',
                type: 'multi_attack',
                hits: 2,
                multiplier: 0.65,
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            return turnCount % 3 === 2 ? 'group_bite' : 'normal_attack';
        },
    },

    skeleton_guard: {
        id: 'skeleton_guard',
        name: '骷髏守衛',
        stats: { maxHp: 44, attack: 15, defense: 2, agility: 8 },
        actions: {
            raise_shield: {
                id: 'raise_shield',
                name: '舉盾',
                type: 'self_buff',
                applyStatus: 'shield',
                target: 'self',
                logMessage: '骷髏守衛舉起盾牌！防禦大幅提升。',
            },
            normal_attack: {
                id: 'normal_attack',
                name: '長槍刺擊',
                type: 'attack',
                multiplier: 1.0,
            },
            shield_bash: {
                id: 'shield_bash',
                name: '盾擊',
                type: 'attack',
                multiplier: 1.2,
                onHit: [{ applyStatus: 'skill_locked_attack', target: 'player', duration: 1 }],
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            const cycle = turnCount % 3;
            if (cycle === 0) return 'raise_shield';
            if (cycle === 1) return 'normal_attack';
            return 'shield_bash';
        },
    },

    hexcap_fungus: {
        id: 'hexcap_fungus',
        name: '蕈菇咒菌',
        stats: { maxHp: 36, attack: 14, defense: 0, agility: 5 },
        actions: {
            spore_attack: {
                id: 'spore_attack',
                name: '孢子噴射',
                type: 'attack',
                multiplier: 0.8,
                onHit: [{ applyStatus: 'spore', target: 'player' }],
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            return 'spore_attack';
        },
    },

    // ── 第二層：開始針對流派 ──────────────────────────────

    grave_robber: {
        id: 'grave_robber',
        name: '盜墓賊',
        stats: { maxHp: 60, attack: 20, defense: 3, agility: 18 },
        flags: { counterOnEscapeFail: true },
        actions: {
            normal_attack: {
                id: 'normal_attack',
                name: '飛刀',
                type: 'attack',
                multiplier: 1.0,
                onHit: [{ applyStatus: 'dodge_stance', target: 'self' }],
            },
            counter_attack: {
                id: 'counter_attack',
                name: '追擊',
                type: 'attack',
                multiplier: 0.7,
                bypassEvasion: true,
                logMessage: '盜墓賊趁你逃跑失敗追了上來！',
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            if (ctx && ctx.escapeFailed) return 'counter_attack';
            return 'normal_attack';
        },
    },

    crypt_acolyte: {
        id: 'crypt_acolyte',
        name: '地穴侍僧',
        stats: { maxHp: 55, attack: 20, defense: 3, agility: 12 },
        actions: {
            normal_attack: {
                id: 'normal_attack',
                name: '黑焰擊',
                type: 'attack',
                multiplier: 0.9,
            },
            dark_prayer: {
                id: 'dark_prayer',
                name: '暗禱',
                type: 'self_buff',
                applyStatus: 'blessed',
                target: 'self',
                amplifyIfPlayerDebuffed: true,
                logMessage: '地穴侍僧低聲詠唱，神秘力量環繞其身。',
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            return turnCount % 3 === 2 ? 'dark_prayer' : 'normal_attack';
        },
    },

    rustbound_golem: {
        id: 'rustbound_golem',
        name: '鏽甲魔像',
        stats: { maxHp: 65, attack: 18, defense: 8, agility: 3 },
        flags: { trackRustCracks: true },
        actions: {
            normal_attack: {
                id: 'normal_attack',
                name: '鐵拳',
                type: 'attack',
                multiplier: 0.9,
            },
            heavy_stomp: {
                id: 'heavy_stomp',
                name: '重踏',
                type: 'attack',
                multiplier: 0.8,
                bypassEvasion: true,
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            return turnCount % 2 === 1 ? 'heavy_stomp' : 'normal_attack';
        },
    },

    // ── 第三層：決戰前的 build 檢定 ───────────────────────

    well_wraith: {
        id: 'well_wraith',
        name: '深井女妖',
        stats: { maxHp: 80, attack: 26, defense: 6, agility: 16 },
        actions: {
            wail: {
                id: 'wail',
                name: '哀嚎',
                type: 'debuff',
                applyStatus: 'skill_locked_random',
                target: 'player',
                duration: 1,
                logMessage: '深井女妖發出淒厲嚎叫！你腦中一片空白。',
            },
            spirit_claw: {
                id: 'spirit_claw',
                name: '靈爪',
                type: 'attack',
                multiplier: 1.0,
                bonusDamageIfSkillLocked: 0.5,
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            return turnCount % 2 === 0 ? 'wail' : 'spirit_claw';
        },
    },

    blood_oath_knight: {
        id: 'blood_oath_knight',
        name: '血誓騎士',
        stats: { maxHp: 80, attack: 26, defense: 6, agility: 16 },
        flags: { reactToPlayerAttackDuringOath: true },
        actions: {
            normal_attack: {
                id: 'normal_attack',
                name: '聖劍斬',
                type: 'attack',
                multiplier: 1.0,
            },
            blood_oath_attack: {
                id: 'blood_oath_attack',
                name: '血誓斬',
                type: 'attack',
                multiplier: 1.3,
            },
            vengeance_slash: {
                id: 'vengeance_slash',
                name: '復仇斬',
                type: 'attack',
                multiplier: 2.0,
                logMessage: '血誓騎士怒火中燒，發動了復仇斬！',
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            if (ctx && ctx.vengeanceReady) return 'vengeance_slash';
            if (monster.hp / monster.maxHp < 0.5) {
                if (!monster.oathActive) {
                    monster.oathActive = true;
                }
                return 'blood_oath_attack';
            }
            return 'normal_attack';
        },
    },

    rune_inquisitor: {
        id: 'rune_inquisitor',
        name: '符文審判者',
        stats: { maxHp: 80, attack: 26, defense: 6, agility: 16 },
        flags: { firstTurnReactive: true },
        actions: {
            indictment: {
                id: 'indictment',
                name: '罪名宣告',
                type: 'special_indictment',
                logMessage: '符文審判者展開法陣，開始詠唱罪名宣告！',
            },
            normal_attack: {
                id: 'normal_attack',
                name: '審判之焰',
                type: 'attack',
                multiplier: 1.0,
            },
            re_chant: {
                id: 're_chant',
                name: '再次宣告',
                type: 'debuff',
                applyStatus: 'guilty',
                target: 'player',
                duration: 2,
                logMessage: '符文審判者再次宣告你的罪名！「有罪」。',
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            if (turnCount === 0) return 'indictment';
            if (turnCount % 3 === 0) return 're_chant';
            return 'normal_attack';
        },
    },
};

// ── Boss ─────────────────────────────────────────────────

export const BOSSES = {
    uncrowned_lich: {
        id: 'uncrowned_lich',
        name: '無冠巫王',
        isBoss: true,
        stats: { maxHp: 120, attack: 32, defense: 10, agility: 20 },
        flags: { hasCrownShards: true },
        actions: {
            whisper: {
                id: 'whisper',
                name: '亡者低語',
                type: 'attack',
                multiplier: 0.8,
                onHit: [{ applyStatus: 'skill_locked_random', target: 'player', duration: 1 }],
            },
            cursed_crown: {
                id: 'cursed_crown',
                name: '黑冠詛咒',
                type: 'attack',
                multiplier: 1.0,
                scaledByPlayerDebuffs: true,
            },
            bone_mend: {
                id: 'bone_mend',
                name: '骸骨重組',
                type: 'heal_self',
                healAmount: 18,
                logMessage: '無冠巫王吸收亡者之力，恢復了生命值。',
            },
            crown_fall: {
                id: 'crown_fall',
                name: '王座崩落',
                type: 'attack',
                multiplier: 2.5,
                bypassDefense: true,
                consumesCrownShards: true,
                logMessage: '無冠巫王爆發所有王冠碎片的力量！',
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            if ((monster.crownShards || 0) >= 3) return 'crown_fall';
            const pattern = ['whisper', 'cursed_crown', 'bone_mend'];
            return pattern[turnCount % 3];
        },
    },

    abyssal_drake: {
        id: 'abyssal_drake',
        name: '深淵龍蜥',
        isBoss: true,
        stats: { maxHp: 120, attack: 32, defense: 15, agility: 12 },
        flags: { hasScaleArmor: true },
        actions: {
            rock_bite: {
                id: 'rock_bite',
                name: '裂石咬擊',
                type: 'attack',
                multiplier: 1.5,
            },
            tail_sweep: {
                id: 'tail_sweep',
                name: '尾掃',
                type: 'attack',
                multiplier: 0.7,
                bypassEvasion: true,
            },
            abyss_breath: {
                id: 'abyss_breath',
                name: '深淵吐息',
                type: 'attack',
                multiplier: 1.2,
                bypassDefense: true,
                logMessage: '深淵龍蜥張開巨口噴出深淵之息！',
            },
            berserk_molt: {
                id: 'berserk_molt',
                name: '狂暴蛻皮',
                type: 'self_buff',
                applyStatus: 'berserk',
                target: 'self',
                logMessage: '深淵龍蜥進入狂暴狀態！攻擊大幅提升。',
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            if (monster.hp / monster.maxHp < 0.5 && !monster.berserkTriggered) {
                monster.berserkTriggered = true;
                return 'berserk_molt';
            }
            if (turnCount % 4 === 3) return 'abyss_breath';
            return turnCount % 2 === 0 ? 'rock_bite' : 'tail_sweep';
        },
    },

    saint_black_mirror: {
        id: 'saint_black_mirror',
        name: '鏡中聖女',
        isBoss: true,
        stats: { maxHp: 120, attack: 28, defense: 10, agility: 20 },
        flags: { mirrorsPlayerAction: true },
        actions: {
            mirror_strike: {
                id: 'mirror_strike',
                name: '鏡影衝',
                type: 'attack',
                multiplier: 1.2,
            },
            get_mirror_shield: {
                id: 'get_mirror_shield',
                name: '鏡盾',
                type: 'self_buff',
                applyStatus: 'mirror_shield',
                target: 'self',
                logMessage: '鏡中聖女舉起黑鏡，下一擊將被反射。',
            },
            shatter_mirror: {
                id: 'shatter_mirror',
                name: '碎鏡',
                type: 'attack',
                multiplier: 0.9,
                onHit: [{ applyStatus: 'items_locked', target: 'player', duration: 1 }],
            },
            piercing_gaze: {
                id: 'piercing_gaze',
                name: '凝視',
                type: 'debuff',
                applyStatus: 'agility_down',
                target: 'player',
                duration: 1,
                logMessage: '鏡中聖女的目光穿透你，速度大幅下降。',
            },
        },
        selectAction(monster, player, turnCount, ctx) {
            const last = ctx && ctx.playerLastActionType;
            if (last === 'attack') return 'get_mirror_shield';
            if (last === 'item') return 'shatter_mirror';
            if (last === 'flee') return 'piercing_gaze';
            return 'mirror_strike';
        },
    },
};

// 每層的怪物池
export const FLOOR_POOLS = {
    1: ['dungeon_rats', 'skeleton_guard', 'hexcap_fungus'],
    2: ['grave_robber', 'crypt_acolyte', 'rustbound_golem'],
    3: ['well_wraith', 'blood_oath_knight', 'rune_inquisitor'],
};

export const BOSS_POOL = ['uncrowned_lich', 'abyssal_drake', 'saint_black_mirror'];

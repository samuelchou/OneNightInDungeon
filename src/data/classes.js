// 所有職業共用相同初始屬性，差異來自技能與被動
const BASE_STATS = {
    maxHp: 100,
    attack: 10,
    defense: 0,
    agility: 10
};

export const CLASSES = {
    warrior: {
        id: 'warrior',
        name: '戰士',
        stats: { ...BASE_STATS },
        skills: ['momentum_slash', 'follow_up', 'guard', 'war_cry', 'tackle'],
        passives: ['steadfast', 'fighting_spirit']
    },
    mage: {
        id: 'mage',
        name: '法師',
        stats: { ...BASE_STATS },
        skills: ['fireball', 'flash', 'chant', 'ice_bind', 'mana_drain'],
        passives: ['charge', 'insight']
    },
    ranger: {
        id: 'ranger',
        name: '遊俠',
        stats: { ...BASE_STATS },
        skills: ['rapid_shot', 'disengage', 'ambush', 'all_in', 'poison_blade'],
        passives: ['practice', 'recuperate', 'observe']
    }
};

// 多頁教學彈窗
// 使用方式：showTutorialPopup(scene)  /  createHelpButton(scene)

const PAGES = [
    {
        title: '基本流程',
        content: [
            { text: '選擇職業後，進入三層地下城。' },
            { text: '每層有 3 隻隨機怪物，全數擊敗後前往下一層。' },
            { text: '通過第三層，挑戰最終 Boss。' },
            { text: '' },
            { text: '每場戰鬥勝利後，HP 完全回復。', color: '#88ffaa' },
        ],
    },
    {
        title: '屬性說明',
        content: [
            { text: '❤ 最大生命值', bold: true, color: '#ff9999' },
            { text: '決定戰鬥開始時的初始 HP。歸零即戰敗。每場勝利後 HP 完全回復。' },
            { text: '' },
            { text: '⚔ 攻擊', bold: true, color: '#ffbb66' },
            { text: '技能傷害的計算基準。' },
            { text: '傷害 = 攻擊 × 技能倍率 × 狀態倍率 − 防禦', color: '#ccccaa' },
            { text: '' },
            { text: '🛡 防禦', bold: true, color: '#88aaff' },
            { text: '受到攻擊時減免傷害。起始值為 0。部分技能或狀態效果可省略防禦判定。' },
            { text: '' },
            { text: '💨 敏捷', bold: true, color: '#88ddff' },
            { text: '影響閃避率與逃跑成功率。' },
            { text: '防禦方敏捷 − 攻擊方敏捷（%）= 閃避機率', color: '#ccccaa' },
            { text: '玩家敏捷 − 怪物敏捷（%）= 逃跑成功率', color: '#ccccaa' },
            { text: '' },
            { text: '所有屬性皆可透過「屬性加成」獎勵永久提升。', color: '#88ffaa' },
        ],
    },
    {
        title: '戰鬥規則',
        content: [
            { text: '玩家固定先手，每回合選擇一個行動：', color: '#e8d5a3' },
            { text: '' },
            { text: '⚔ 使用技能', bold: true, color: '#aaaaff' },
            { text: '消耗本回合行動，發動技能效果。' },
            { text: '' },
            { text: '🎒 使用道具', bold: true, color: '#ffaa66' },
            { text: '每回合限用一件，不消耗行動回合。' },
            { text: '' },
            { text: '🏃 嘗試逃跑', bold: true, color: '#88ddaa' },
            { text: '敏捷差距越大，成功率越高。逃跑成功後有 50% 機率獲得道具。' },
            { text: '' },
            { text: '傷害公式：攻擊 × 倍率 × 狀態倍率 − 防禦（最低 1）', color: '#ccccaa' },
            { text: '閃避機率：防禦方敏捷 − 攻擊方敏捷（%）', color: '#ccccaa' },
            { text: '狀態效果在戰鬥結束後全數重置。', color: '#888888' },
        ],
    },
    {
        title: '獎勵系統',
        content: [
            { text: '每場戰鬥勝利後，從三張獎勵卡中選擇一張：', color: '#e8d5a3' },
            { text: '' },
            { text: '🔧 技能加成', bold: true, color: '#aa88ff' },
            { text: '升階一個技能，解鎖新效果。最高可升至階段 3。' },
            { text: '' },
            { text: '📈 屬性加成', bold: true, color: '#88ffaa' },
            { text: '永久提升 HP、攻擊、防禦或敏捷。層數越深，數值越高。' },
            { text: '' },
            { text: '🎒 道具', bold: true, color: '#ffaa66' },
            { text: '從當前層道具池隨機獲得一件道具，最多持有 3 件。' },
            { text: '' },
            { text: '逃跑時只有 50% 機率獲得道具，無技能或屬性獎勵。', color: '#888888' },
            { text: '遊俠被動「觀察」：道具獎勵額外多一個選項。', color: '#66cc88' },
        ],
    },
    {
        title: '職業特色',
        content: [
            { text: '⚔ 戰士', bold: true, color: '#ff9966' },
            { text: '累積「氣勢」，配合乘勝追擊造成爆發傷害。\n善用警戒，將防禦轉化為反攻機會。' },
            { text: '' },
            { text: '🔥 法師', bold: true, color: '#9966ff' },
            { text: '被動蓄能每回合自動累積。\n搭配詠唱與燃燒、冰縛、汲取打出高倍傷害。' },
            { text: '' },
            { text: '🏹 遊俠', bold: true, color: '#66cc88' },
            { text: '靠敏捷閃躲、毒刃持久戰、豪賭一擲求爆發。\n逃跑也是策略——養精蓄銳讓下次攻擊更強。' },
            { text: '' },
            { text: '技能各有 3 個階段，透過「技能加成」獎勵逐步解鎖。\n點擊技能旁的 i 圖示可查看升階效果。', color: '#aaaaaa' },
        ],
    },
];

// ── 彈窗主體 ─────────────────────────────────────────────

export function showTutorialPopup(scene, startPage = 0) {
    const W = 960, H = 640;
    const PW = 580, PH = 440;
    const px = W / 2, py = H / 2;

    let currentPage = startPage;
    const objs = [];

    // 遮罩
    const overlay = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72)
        .setDepth(60).setInteractive();
    objs.push(overlay);

    // 面板
    const panel = scene.add.rectangle(px, py, PW, PH, 0x0e0e22)
        .setStrokeStyle(2, 0x7755dd).setDepth(61);
    objs.push(panel);

    const left  = px - PW / 2;
    const top   = py - PH / 2;
    const HEADER_H = 54;
    const FOOTER_H = 48;
    const CONTENT_W = PW - 40;
    const CONTENT_TOP = top + HEADER_H + 8;
    const CONTENT_BOTTOM = py + PH / 2 - FOOTER_H - 8;

    // ── 헤더 영역 ──
    const titleBg = scene.add.rectangle(px, top + HEADER_H / 2, PW, HEADER_H, 0x1a1a3a).setDepth(62);
    objs.push(titleBg);

    const titleText = scene.add.text(px, top + HEADER_H / 2, '', {
        fontSize: '18px', fontFamily: 'serif', color: '#e8d5a3', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(63);
    objs.push(titleText);

    const pageNumText = scene.add.text(left + PW - 14, top + HEADER_H / 2, '', {
        fontSize: '12px', fontFamily: 'sans-serif', color: '#888888',
    }).setOrigin(1, 0.5).setDepth(63);
    objs.push(pageNumText);

    scene.add.rectangle(px, top + HEADER_H, PW, 1, 0x7755dd, 0.5).setDepth(62);
    objs.push();

    // 關閉按鈕
    const closeHit = scene.add.rectangle(left + PW - 22, top + 22, 30, 30, 0, 0)
        .setDepth(63).setInteractive({ useHandCursor: true });
    const closeTxt = scene.add.text(left + PW - 22, top + 22, '×', {
        fontSize: '22px', color: '#aa88ff',
    }).setOrigin(0.5, 0.5).setDepth(63);
    closeHit.on('pointerover', () => closeTxt.setColor('#ffffff'));
    closeHit.on('pointerout', () => closeTxt.setColor('#aa88ff'));
    objs.push(closeHit, closeTxt);

    // ── 內容行物件池 ──
    const lineObjs = [];

    // ── 頁腳導覽 ──
    const footerY = top + PH - FOOTER_H / 2;

    scene.add.rectangle(px, top + PH - FOOTER_H, PW, 1, 0x7755dd, 0.3).setDepth(62);

    const prevBg = scene.add.rectangle(left + 60, footerY, 100, 34, 0x1a1a3a)
        .setStrokeStyle(1, 0x5544aa).setDepth(62).setInteractive({ useHandCursor: true });
    const prevTxt = scene.add.text(left + 60, footerY, '◀ 上一頁', {
        fontSize: '13px', color: '#8877cc',
    }).setOrigin(0.5, 0.5).setDepth(63);
    objs.push(prevBg, prevTxt);

    const nextBg = scene.add.rectangle(left + PW - 60, footerY, 100, 34, 0x1a1a3a)
        .setStrokeStyle(1, 0x5544aa).setDepth(62).setInteractive({ useHandCursor: true });
    const nextTxt = scene.add.text(left + PW - 60, footerY, '下一頁 ▶', {
        fontSize: '13px', color: '#8877cc',
    }).setOrigin(0.5, 0.5).setDepth(63);
    objs.push(nextBg, nextTxt);

    // ── 換頁函式 ──
    function render(page) {
        // 清除舊行
        lineObjs.forEach(o => o.destroy());
        lineObjs.length = 0;

        const p = PAGES[page];
        titleText.setText(`📖  ${p.title}`);
        pageNumText.setText(`${page + 1} / ${PAGES.length}`);

        let y = CONTENT_TOP;
        p.content.forEach(line => {
            if (!line.text) { y += 8; return; }
            const t = scene.add.text(left + 20, y, line.text, {
                fontSize: line.bold ? '14px' : '13px',
                fontFamily: line.bold ? 'serif' : 'sans-serif',
                fontStyle: line.bold ? 'bold' : 'normal',
                color: line.color || '#cccccc',
                wordWrap: { width: CONTENT_W },
                lineSpacing: 3,
            }).setDepth(63);
            lineObjs.push(t);
            y += t.height + (line.bold ? 4 : 2);
            if (y > CONTENT_BOTTOM) t.setAlpha(0.3); // overflow 警告（不應發生）
        });

        // 導覽按鈕狀態
        const hasPrev = page > 0;
        const hasNext = page < PAGES.length - 1;
        prevBg.setAlpha(hasPrev ? 1 : 0.3);
        prevTxt.setAlpha(hasPrev ? 1 : 0.3);
        nextBg.setAlpha(hasNext ? 1 : 0.3);
        nextTxt.setAlpha(hasNext ? 1 : 0.3);
        if (hasPrev) {
            prevBg.setInteractive({ useHandCursor: true });
        } else {
            prevBg.disableInteractive();
        }
        if (hasNext) {
            nextBg.setInteractive({ useHandCursor: true });
        } else {
            nextBg.disableInteractive();
        }
    }

    prevBg.on('pointerover', () => { if (currentPage > 0) prevBg.setFillStyle(0x2a2a5a); });
    prevBg.on('pointerout', () => prevBg.setFillStyle(0x1a1a3a));
    prevBg.on('pointerdown', () => { if (currentPage > 0) { currentPage--; render(currentPage); } });

    nextBg.on('pointerover', () => { if (currentPage < PAGES.length - 1) nextBg.setFillStyle(0x2a2a5a); });
    nextBg.on('pointerout', () => nextBg.setFillStyle(0x1a1a3a));
    nextBg.on('pointerdown', () => { if (currentPage < PAGES.length - 1) { currentPage++; render(currentPage); } });

    const dismiss = () => {
        lineObjs.forEach(o => o.destroy());
        objs.forEach(o => { if (o?.active) o.destroy(); });
    };
    closeHit.on('pointerdown', dismiss);
    overlay.on('pointerdown', dismiss);

    render(currentPage);
}

// ── ？ 按鈕 ──────────────────────────────────────────────

export function createHelpButton(scene) {
    const x = 938, y = 22;

    const circle = scene.add.circle(x, y, 13, 0x1a1a3a)
        .setStrokeStyle(1.5, 0x7755dd)
        .setDepth(20)
        .setInteractive({ useHandCursor: true });

    const label = scene.add.text(x, y, '?', {
        fontSize: '14px',
        fontFamily: 'serif',
        fontStyle: 'bold',
        color: '#aa88ff',
    }).setOrigin(0.5, 0.5).setDepth(20);

    circle.on('pointerover', () => { circle.setFillStyle(0x2a2a5a); label.setColor('#ffffff'); });
    circle.on('pointerout',  () => { circle.setFillStyle(0x1a1a3a); label.setColor('#aa88ff'); });
    circle.on('pointerdown', () => showTutorialPopup(scene));
}

// 共用資訊彈窗
// showInfoPopup(scene, { title, iconKey, sections })
// sections: [{ header?, lines: [{ text, color?, bold? }] }]

export function showInfoPopup(scene, { title, iconKey, sections = [] }) {
    const W = 960, H = 640;
    const PW = 420;
    const objs = [];

    // 先算出內容高度
    const TITLE_H = 60;
    const SECTION_GAP = 10;
    let contentH = TITLE_H;
    sections.forEach(sec => {
        if (sec.header) contentH += 20;
        sec.lines.forEach(l => {
            const chars = (l.text || '').length;
            const lineH = Math.ceil(chars * 7.5 / (PW - 48)) * 17 + 4;
            contentH += Math.max(17, lineH);
        });
        contentH += SECTION_GAP;
    });
    const PH = Math.min(Math.max(contentH + 60, 180), 500);
    const px = W / 2, py = H / 2;

    // 暗色遮罩
    const overlay = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
        .setDepth(50).setInteractive();
    objs.push(overlay);

    // 面板背景
    const panel = scene.add.rectangle(px, py, PW, PH, 0x12122a)
        .setStrokeStyle(2, 0x7755dd).setDepth(51);
    objs.push(panel);

    const top = py - PH / 2;
    const left = px - PW / 2;

    // 圖示
    let titleX = px;
    if (iconKey && scene.textures.exists(iconKey)) {
        const icon = scene.add.image(left + 36, top + 32, iconKey)
            .setDisplaySize(44, 44).setDepth(52);
        objs.push(icon);
        titleX = left + 70 + (PW - 70) / 2;
    }

    // 標題
    const titleObj = scene.add.text(titleX, top + 32, title, {
        fontSize: '18px',
        fontFamily: 'serif',
        color: '#e8d5a3',
        fontStyle: 'bold',
        wordWrap: { width: iconKey ? PW - 80 : PW - 30 },
        align: iconKey ? 'left' : 'center',
    }).setOrigin(iconKey ? 0 : 0.5, 0.5).setDepth(52);
    objs.push(titleObj);

    // 分隔線
    objs.push(scene.add.rectangle(px, top + TITLE_H, PW - 24, 1, 0x7755dd, 0.5).setDepth(52));

    // 內容區
    let curY = top + TITLE_H + 12;
    sections.forEach(sec => {
        if (sec.header) {
            const h = scene.add.text(left + 16, curY, sec.header, {
                fontSize: '12px',
                fontFamily: 'sans-serif',
                color: '#aa88ff',
                fontStyle: 'bold',
            }).setDepth(52);
            objs.push(h);
            curY += 20;
        }
        sec.lines.forEach(l => {
            const t = scene.add.text(left + 16, curY, l.text || '', {
                fontSize: l.bold ? '13px' : '12px',
                fontFamily: 'sans-serif',
                color: l.color || '#dddddd',
                fontStyle: l.bold ? 'bold' : 'normal',
                wordWrap: { width: PW - 32 },
                lineSpacing: 3,
            }).setDepth(52);
            objs.push(t);
            curY += t.height + 4;
        });
        curY += SECTION_GAP;
    });

    // 關閉按鈕
    const closeArea = scene.add.rectangle(px + PW / 2 - 20, top + 20, 30, 30, 0x000000, 0)
        .setDepth(52).setInteractive({ useHandCursor: true });
    const closeText = scene.add.text(px + PW / 2 - 20, top + 20, '×', {
        fontSize: '22px',
        color: '#aa88ff',
    }).setOrigin(0.5, 0.5).setDepth(52);
    closeArea.on('pointerover', () => closeText.setColor('#ffffff'));
    closeArea.on('pointerout', () => closeText.setColor('#aa88ff'));
    objs.push(closeArea, closeText);

    const dismiss = () => { objs.forEach(o => { if (o?.active) o.destroy(); }); };
    closeArea.on('pointerdown', dismiss);
    overlay.on('pointerdown', dismiss);
}

// 建立小型 [i] 圓形按鈕，回傳 { circle, text } 兩個物件
export function createInfoButton(scene, x, y, onClickFn) {
    const circle = scene.add.circle(x, y, 9, 0x2a2a5a)
        .setStrokeStyle(1, 0x8866dd)
        .setInteractive({ useHandCursor: true });
    const label = scene.add.text(x, y, 'i', {
        fontSize: '11px',
        fontFamily: 'serif',
        fontStyle: 'italic',
        color: '#aa88ff',
    }).setOrigin(0.5, 0.5);

    circle.on('pointerover', () => circle.setFillStyle(0x3a2a7a));
    circle.on('pointerout', () => circle.setFillStyle(0x2a2a5a));
    circle.on('pointerdown', (ptr, lx, ly, evt) => {
        evt.stopPropagation();
        onClickFn();
    });
    return { circle, label };
}

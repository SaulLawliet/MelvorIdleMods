export async function setup(ctx) {
    const lang = {
        'SETTING_1_LABEL': {
            'en' : 'Click Header Title to Show',
            'zh-CN': '点击技能文字展示',
            'zh-TW': '點擊技能文字展示',
        },
        'SETTING_1_HINT': {
            'en': 'Hidden Book Icon (Need Refresh)',
            'zh-CN': '隐藏图书图标(需要刷新)',
            'zh-TW': '隱藏圖書圖標(需要刷新)',
        },
        'SETTING_2_LABEL': {
            'en' : 'Show Mastery Pool Checkpoints',
            'zh-CN': '显示专精池检查点',
            'zh-TW': '顯示專精池檢查點',
        },
        'SETTING_3_LABEL': {
            'en' : 'Show Locked or Inactivated Item',
            'zh-CN': '显示锁住或未激活的属性',
            'zh-TW': '顯示鎖住或未激活的屬性',
        },
        'SETTING_4_LABEL': {
            'en' : 'Hidden More Button',
            'zh-CN': '隐藏more按钮',
            'zh-TW': '隱藏more按鈕',
        },
        'TIPS_1': {
            'en': 'Click icon to view (by Mod)',
            'zh-CN': '点击图标查看 (by Mod)',
            'zh-TW': '點擊圖標查看 (by Mod)',
        }
    }

    const getLang = (key) => {
        if (!lang[key]) {
            return 'UNDEFINED LANG'
        }
        return lang[key][setLang] ? lang[key][setLang] : lang[key]['en'];
    };

    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: 'switch',
        name: 'hidden-book-icon',
        label: getLang('SETTING_1_LABEL'),
        hint: getLang('SETTING_1_HINT'),
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'show-checkpoints',
        label: getLang('SETTING_2_LABEL'),
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'show-locked-checkpoints',
        label: getLang('SETTING_3_LABEL'),
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'hidden-more-button',
        label: getLang('SETTING_4_LABEL'),
        default: false
    });

    const appendTooltip = (value) => {
        if (game && game.openPage && ['Woodcutting', 'Mining'].includes(game.openPage._localID)) {
            return value;
        }
        return `${value}
        <h5 class="font-w400 font-size-sm mb-1 text-center text-info">
        <small>${getLang('TIPS_1')}</small>
        </h5>
        `;
    }

    const intervalTooltip = appendTooltip(`<div class="text-center text-warning">${getLangString('MENU_TEXT_TOOLTIP_INTERVAL')}<br><small>${getLangString('MENU_TEXT_INCLUSIVE_OF_BONUSES')}</small></div>`);

    ctx.patch(XPIcon, 'getTooltipContent').after(function (returnValue) {
        return appendTooltip(returnValue);
    });
    ctx.patch(MasteryXPIcon, 'getTooltipContent').after(function (returnValue) {
        return appendTooltip(returnValue);
    });

    const replaceTooltip = (value) => {
        const arr = value.split('</h5>');
        if (arr.length >= 4) {
            arr[3] = arr[3].replace('<small>', '<small><del>').replace('</small>', '</del></small>')
        }
        return appendTooltip(arr.join('</h5>'));
    }

    ctx.patch(DoublingIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });
    ctx.patch(PreservationIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });
    ctx.patch(PerfectCookIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });
    ctx.patch(CookingSuccessIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });

    const {
        showModifiersComeFrom,
        showSkillModifiers,
        showSkillItems,
    } = await ctx.loadModule('src/show-skill-modifiers.mjs');

    const {
        showXP,
        showMasteryXP,
        showInterval,
        showDoubling,
        showPreservation,
        showPerfectCook,
        showCookingSuccess,
    } = await ctx.loadModule('src/click-icon.mjs');

    const {
        IHerblore,
        ISmithing,
        IRunecrafting,
        ICrafting,
        IFletching,
        ISummoning,
        ICooking,
        IThieving,
        IAltMagic,
        IAstrology,
        IFishing,
        IFiremaking,
        ICartography,
        IArchaeology,
    } = await ctx.loadModule('src/skill.mjs');

    ctx.api({
        showModifiersComeFrom,
        showSkillItems,
    });

    ctx.onInterfaceReady(async (ctx) => {
        const headerTitle = document.getElementById('header-title');
        if (generalSettings.get('hidden-book-icon')) {
            headerTitle.onclick = () => showSkillModifiers();
        } else {
            const button = document.createElement('button');
            button.className = 'btn';
            button.onclick = () => showSkillModifiers();
            button.innerHTML = '<i class="fa fa-book-open mr-1 font-size-lg" style="color:white;"></i>';
            headerTitle.parentNode.parentNode.appendChild(button);
        }

        const registerGrants = (grants, iSkill) => {
            grants.xpIcon.container.onclick = () => showXP(iSkill);
            grants.masteryXPIcon.container.onclick = () => showMasteryXP(iSkill);
        }

        const registerInterval = (interval, iSkill) => {
            interval.container.onclick = () => showInterval(iSkill);
            interval.tooltip.setContent(intervalTooltip);
        }

        const registerArtisanMenu = (artisanMenu, iSkill) => {
            registerGrants(artisanMenu.grants, iSkill);
            registerInterval(artisanMenu.interval, iSkill);
            artisanMenu.productPreservation.container.onclick = () => showPreservation(iSkill);
            artisanMenu.productDoubling.container.onclick = () => showDoubling(iSkill);
        }

        registerArtisanMenu(herbloreArtisanMenu, new IHerblore());
        registerArtisanMenu(smithingArtisanMenu, new ISmithing());
        registerArtisanMenu(runecraftingArtisanMenu, new IRunecrafting());
        registerArtisanMenu(craftingArtisanMenu, new ICrafting());
        registerArtisanMenu(fletchingArtisanMenu, new IFletching());
        registerArtisanMenu(summoningArtisanMenu, new ISummoning());

        const iFiremaking = new IFiremaking();
        firemakingMenu.xpIcon.container.onclick = () => showXP(iFiremaking);
        firemakingMenu.masteryIcon.container.onclick = () => showMasteryXP(iFiremaking);
        registerInterval(firemakingMenu.intervalIcon, iFiremaking);

        cookingMenus.forEach((cookingMenu, category) => {
            const iSkill = new ICooking(category);
            registerGrants(cookingMenu.grants, iSkill);
            cookingMenu.bonuses.preserve.container.onclick = () => showPreservation(iSkill);
            cookingMenu.bonuses.double.container.onclick = () => showDoubling(iSkill);
            cookingMenu.bonuses.perfect.container.onclick = () => showPerfectCook(iSkill);
            cookingMenu.bonuses.success.container.onclick = () => showCookingSuccess(iSkill);
        });

        thievingMenu.areaPanels.forEach((panel) => {
            const iSkill = new IThieving(panel);
            panel.infoBox.xp.container.onclick = () => showXP(iSkill);
            panel.infoBox.masteryXP.container.onclick = () => showMasteryXP(iSkill);
            registerInterval(panel.infoBox.interval, iSkill);
            panel.infoBox.double.container.onclick = () => showDoubling(iSkill);
        });

        const iAltMagic = new IAltMagic();
        altMagicMenu.grants.xpIcon.container.onclick = () => showXP(iAltMagic);
        registerInterval(altMagicMenu.interval, iAltMagic);
        altMagicMenu.doublingIcon.container.onclick = () => showDoubling(iAltMagic);

        astrologyMenus.infoPanel.doublingChance.container.onclick = () => showDoubling(new IAstrology());
        astrologyMenus.constellations.forEach((menu, constellation) => {
            const iSkill = new IAstrology(constellation);
            menu.xpIcon.container.onclick = () => showXP(iSkill);
            menu.masteryIcon.container.onclick = () => showMasteryXP(iSkill);
            registerInterval(menu.intervalIcon, iSkill);
        });

        fishingAreaMenus.forEach((menu, area) => {
            const iSkill = new IFishing(area);
            menu.xpIcon.container.onclick = () => showXP(iSkill);
            menu.masteryIcon.container.onclick = () => showMasteryXP(iSkill);
        });


        // only AoD can access
        if (cloudManager.hasAoDEntitlement) {
            archaeologyMenus.digSites.forEach((menu, digSite) => {
                const iSkill = new IArchaeology(digSite);
                menu.xpIcon.container.onclick = () => showXP(iSkill);
                menu.masteryIcon.container.onclick = () => showMasteryXP(iSkill);
                menu.doublingIcon.container.onclick = () => showDoubling(iSkill);
                registerInterval(menu.intervalIcon, iSkill);
            });


            const iCartographyHex = new ICartography();
            let menu = cartographyMap.surveyOverview;
            menu.xpIcon.container.onclick = () => showXP(iCartographyHex);
            registerInterval(menu.intervalIcon, iCartographyHex);

            const iCartographyPaperMaking = new ICartography('PaperMaking');
            menu = cartographyMapCreateMenu.paperMakingMenu;
            menu.grants.xpIcon.container.onclick = () => showXP(iCartographyPaperMaking);
            menu.doublingIcon.container.onclick = () => showDoubling(iCartographyPaperMaking);
            menu.preserveIcon.container.onclick = () => showPreservation(iCartographyPaperMaking);
            registerInterval(menu.intervalIcon, iCartographyPaperMaking);

            const iCartographyMapUpgrade = new ICartography('MapUpgrade');
            menu = cartographyMapCreateMenu.mapUpgradeMenu
            menu.grants.xpIcon.container.onclick = () => showXP(iCartographyMapUpgrade);
            menu.preserveIcon.container.onclick = () => showPreservation(iCartographyMapUpgrade);
            registerInterval(menu.intervalIcon, iCartographyMapUpgrade);
        }
    });
}

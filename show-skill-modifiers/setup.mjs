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

    const {
        showSkillModifiers,
        showSources,
    } = await ctx.loadModule('beta/show-skill-modifiers.mjs');

    ctx.api({
        showSkillModifiers,
        showSources,
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
    });
}

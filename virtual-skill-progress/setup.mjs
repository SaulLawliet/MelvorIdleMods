export function setup(ctx) {

    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: 'switch',
        name: 'skill-progress',
        label: 'Modify Skill progress',
        default: true
    });

    generalSettings.add({
        type: 'switch',
        name: 'mastery-progress',
        label: 'Modify Master progress',
        default: true
    });

    ctx.patch(SkillHeaderElement, "updateXP").replace(function (o, game, skill) {
        if (!generalSettings.get("skill-progress")) {
          o(skill);
          return;
        }

        const xp = skill.xp;
        const level = skill.virtualLevel;
        this.skillXp.textContent = `${numberWithCommas(Math.floor(xp))} / ${numberWithCommas(exp.levelToXP(level + 1))}`;

        const currentLevelXP = exp.level_to_xp(level);
        const nextLevelXP = exp.level_to_xp(level + 1);
        const progress = (100 * (xp - currentLevelXP)) / (nextLevelXP - currentLevelXP);
        this.skillProgressBar.style.width = `${progress}%`;
    });

    ctx.patch(SkillHeaderElement, "updateAbyssalXP").replace(function (o, game, skill) {
        if (!generalSettings.get("skill-progress")) {
            o(skill);
            return;
        }

        const xp = skill.abyssalXP;
        const level = skill.virtualAbyssalLevel;
        this.abyssalXp.textContent = `${numberWithCommas(Math.floor(xp))} / ${numberWithCommas(abyssalExp.levelToXP(level + 1))}`;

        const currentLevelXP = abyssalExp.levelToXP(level);
        const nextLevelXP = abyssalExp.levelToXP(level + 1);
        const progress = (100 * (xp - currentLevelXP)) / (nextLevelXP - currentLevelXP);
        this.abyssalProgressBar.style.width = `${progress}%`;
    });


    ctx.patch(SkillWithMastery, 'getMasteryProgress').replace(function (o, action) {
        if (!generalSettings.get('mastery-progress')) {
            return o(action);
        }

        const xp = this.getMasteryXP(action);
        const level = exp.xpToLevel(xp);
        const nextLevelXP = exp.level_to_xp(level + 1);
        const currentLevelXP = exp.level_to_xp(level);
        const percent = (100 * (xp - currentLevelXP)) / (nextLevelXP - currentLevelXP);

        return {
            xp,
            level,
            percent,
            nextLevelXP
        };
    });

    ctx.patch(MasteryDisplayElement, 'updateValues').after(function (returnValue, progress) {
        if (!generalSettings.get('mastery-progress')) {
            return;
        }
        this.xpProgress.textContent = `${numberWithCommas(Math.floor(progress.xp))} / ${numberWithCommas(progress.nextLevelXP)}`;
    });

    ctx.patch(SpendMasteryMenuItemElement, 'updateProgress').after(function(returnValue, skill, action, spendAmount) {
        if (!generalSettings.get('mastery-progress')) {
            return;
        }
        const progress = skill.getMasteryProgress(action);
        if (progress.level >= 99) {
            this.xpRequired.textContent = `${numberWithCommas(Math.floor(progress.xp))} / ${numberWithCommas(progress.nextLevelXP)}`;
            showElement(this.xpRequired);
        }
    });
}


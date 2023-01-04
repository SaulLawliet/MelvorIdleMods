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


    ctx.patch(SkillProgressDisplay, 'updateXP').replace(function (o, skill) {
        if (!generalSettings.get('skill-progress')) {
            o(skill);
            return;
        }
        const skillElems = this.getSkillElements(skill);
        const xp = skill.xp;
        const level = skill.virtualLevel;
        const xpText = `${numberWithCommas(Math.floor(xp))} / ${numberWithCommas(exp.level_to_xp(level+1))}`;

        const currentLevelXP = exp.level_to_xp(level);
        const nextLevelXP = exp.level_to_xp(level + 1);
        const progress = (100 * (xp - currentLevelXP)) / (nextLevelXP - currentLevelXP);

        skillElems.percent.forEach((elem) => (elem.textContent = formatPercent(Math.floor(progress))));
        skillElems.xp.forEach((elem) => (elem.textContent = xpText));
        skillElems.progress.forEach((elem) => (elem.style.width = `${progress}%`));
        skillElems.tooltip.forEach((elem) => elem.setContent(this.createTooltipHTML(skill)));
    });

    ctx.patch(SkillProgressDisplay, 'updateLevel').replace(function (o, skill) {
        if (!generalSettings.get('skill-progress')) {
            o(skill);
            return;
        }
        const skillElems = this.getSkillElements(skill);
        skillElems.level.forEach((elem) => (elem.textContent = `${skill.virtualLevel} / ${skill.levelCap}`));
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

    ctx.patch(MasteryDisplay, 'updateValues').after(function (returnValue, progress) {
        if (!generalSettings.get('mastery-progress')) {
            return;
        }
        this.xpProgress.textContent = `${numberWithCommas(Math.floor(progress.xp))} / ${numberWithCommas(progress.nextLevelXP)}`;
    });

    ctx.patch(SpendMasteryMenuItem, 'updateProgress').after(function(returnValue, skill, action, spendAmount) {
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


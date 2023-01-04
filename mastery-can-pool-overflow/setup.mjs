export function setup(ctx) {
    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: 'number',
        name: 'increasedMasteryPoolCap',
        label: '+xx% Mastery Pool XP Cap (Not Globally, Not a Modifier)',
        hint: 'Default: +900%. Min: 0/25/50. Depends on your real modifier',
        min: 0,
        default: 900
    });

    generalSettings.add({
        type: 'switch',
        name: 'show-percent',
        label: 'Show Percent in Spend Mastery XP',
        default: true
    });

    ctx.patch(SkillWithMastery, "addMasteryPoolXP").replace(function (o, xp) {
        // replace old 'masteryPoolCap'
        let increasedMasteryPoolCap = generalSettings.get('increasedMasteryPoolCap');
        if (increasedMasteryPoolCap < this.game.modifiers.increasedMasteryPoolCap) {
            increasedMasteryPoolCap = this.game.modifiers.increasedMasteryPoolCap;
            generalSettings.set('increasedMasteryPoolCap', increasedMasteryPoolCap);
        }
        const masteryPoolCap = Math.floor(this.baseMasteryPoolCap * (100 + increasedMasteryPoolCap) / 100);

        const oldBonusLevel = this.getMasteryCheckPointLevel(this._masteryPoolXP);
        this._masteryPoolXP += xp;
        this._masteryPoolXP = Math.min(this._masteryPoolXP, masteryPoolCap);
        this.renderQueue.masteryPool = true;
        const newBonusLevel = this.getMasteryCheckPointLevel(this._masteryPoolXP);
        if (oldBonusLevel !== newBonusLevel) {
            this.onMasteryPoolBonusChange(oldBonusLevel, newBonusLevel);
        }
    });

    ctx.patch(Bank, "claimItemOnClick").replace(function (o, item, quantity) {
        if (item.modifiers.masteryToken != undefined) {
            const skill = item.modifiers.masteryToken[0].skill;
            if ((skill instanceof SkillWithMastery) && skill.hasMastery) {
                // If overflow, abort.
                if (skill.masteryPoolXP >= skill.masteryPoolCap) { // like source code, here using 'masteryPoolCap'
                    notifyPlayer(skill, "Abort! It's overflow.", "danger");
                    return;
                }
            }
        }

        o(item, quantity);
    });

    // add percent in spend mastery pool
    ctx.patch(SpendMasteryMenuItem, 'updateProgress').after(function(returnValue, skill, action, spendAmount) {
        if (!generalSettings.get('show-percent')) {
            return;
        }
        const progress = skill.getMasteryProgress(action);
        if (progress.level < 99) {
            const nextLevel = Math.min(progress.level + spendAmount, 99);
            const xpRequired = exp.level_to_xp(nextLevel) - progress.xp + 1;
            const percent = (100 * xpRequired / skill.baseMasteryPoolCap).toFixed(2);
            this.xpRequired.textContent += ` (${percent}%)`
        }
    });
}

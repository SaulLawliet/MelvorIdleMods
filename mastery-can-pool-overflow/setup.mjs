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

    ctx.patch(SkillWithMastery, "addMasteryPoolXP").replace(function (o, realm, xp) {
        let increasedMasteryPoolCap = generalSettings.get('increasedMasteryPoolCap');
        if (increasedMasteryPoolCap < this.game.modifiers.masteryPoolCap) {
            increasedMasteryPoolCap = this.game.modifiers.masteryPoolCap;
            generalSettings.set('increasedMasteryPoolCap', increasedMasteryPoolCap);
        }
        const xpCap = Math.floor((this.getBaseMasteryPoolCap(realm) * (100 + increasedMasteryPoolCap)) / 100);

        // copy by SkillWithMastery.addMasteryPoolXP
        const oldXP = this._masteryPoolXP.get(realm);
        // const xpCap = this.getMasteryPoolCap(realm);
        const newXP = Math.min(oldXP + xp, xpCap);
        this._masteryPoolXP.set(realm, newXP);
        const oldBonusLevel = this.getActiveMasteryPoolBonusCount(realm, oldXP);
        const newBonusLevel = this.getActiveMasteryPoolBonusCount(realm, newXP);
        if (oldBonusLevel !== newBonusLevel) {
          this.onMasteryPoolBonusChange(realm, oldBonusLevel, newBonusLevel);
        }
        this.renderQueue.masteryPool.add(realm);
    })

    ctx.patch(Bank, "claimMasteryTokenOnClick").replace(function (o, item, quantity) {
        const skill = item.skill;

        if (skill.hasMastery) {
            // If overflow, abort.
            if (skill.getMasteryPoolXP(item.realm) >= skill.getMasteryPoolCap(item.realm)) { // like source code, here using 'masteryPoolCap'
                notifyPlayer(skill, "Abort! It's overflow.", "danger", 0);
                return;
            }
        }

        o(item, quantity);
    });

    // // add percent in spend mastery pool
    // ctx.patch(SpendMasteryMenuItem, 'updateProgress').after(function(returnValue, skill, action, spendAmount) {
    //     if (!generalSettings.get('show-percent')) {
    //         return;
    //     }
    //     const progress = skill.getMasteryProgress(action);
    //     if (progress.level < 99) {
    //         const nextLevel = Math.min(progress.level + spendAmount, 99);
    //         const xpRequired = exp.level_to_xp(nextLevel) - progress.xp + 1;
    //         const percent = (100 * xpRequired / skill.baseMasteryPoolCap).toFixed(2);
    //         this.xpRequired.textContent += ` (${percent}%)`
    //     }
    // });
}

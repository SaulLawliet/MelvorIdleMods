export function setup(ctx) {

    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: 'switch',
        name: 'slayer-follow',
        label: 'Slayer Task Will Follow Your Enemies',
        hint: 'If at the Same Tier',
        default: true
    });

    // generalSettings.add({
    //     type: 'switch',
    //     name: 'agility-cost-reductions',
    //     label: 'Agility Cost Reductions Are Capped at 100%. (Need Reload)',
    //     hint: '95% => 100%',
    //     default: true
    // });

    ctx.onCharacterLoaded(ctx => {
        // copy from: SlayerTask.getMonsterSelection
        const canSlayer = (tier, monster) => {
            const data = SlayerTask.data[tier];
            const combatLevel = monster.combatLevel;
            const monsterArea = game.getMonsterArea(monster);
            let slayerLevelReq = 0;
            if (monsterArea instanceof SlayerArea)
                slayerLevelReq = monsterArea.slayerLevelRequired;
            return (monster.canSlayer && combatLevel >= data.minLevel && combatLevel <= data.maxLevel);
        }

        ctx.patch(CombatManager, 'spawnEnemy').after(function () {
            if (generalSettings.get('slayer-follow')) {
                if (this.selectedArea && !(this.selectedArea instanceof Dungeon) && this.enemy.monster != this.slayerTask.monster) {
                    if (canSlayer(this.slayerTask.tier, this.enemy.monster)) {
                        this.slayerTask.monster = this.enemy.monster;
                        this.slayerTask.renderRequired = true;
                        this.slayerTask.render();
                    }
                }
            }
        });
    });
}

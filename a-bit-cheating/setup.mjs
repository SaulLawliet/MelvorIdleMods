export function setup(ctx) {

    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: 'switch',
        name: 'slayer-follow',
        label: 'Slayer Task Will Follow Your Enemies',
        hint: 'If at the Same Tier',
        default: true
    });

    ctx.onCharacterLoaded(ctx => {
        ctx.patch(CombatManager, 'spawnEnemy').after(function () {
            if (generalSettings.get('slayer-follow')) {
                if (this.selectedArea && !(this.selectedArea instanceof Dungeon) && this.enemy.monster != this.slayerTask.monster) {
                    if (this.slayerTask.getMonsterSelection(this.slayerTask.category).includes(this.enemy.monster)) {
                        this.slayerTask.monster = this.enemy.monster;
                        this.slayerTask.renderRequired = true;
                        this.slayerTask.render();
                    }
                }
            }
        });
    });
}

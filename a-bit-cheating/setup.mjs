export function setup(ctx) {

    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: 'switch',
        name: 'slayer-follow',
        label: 'Slayer Task Will Follow Your Enemies',
        hint: 'If at the Same Tier',
        default: true
    });

    generalSettings.add({
        type: 'switch',
        name: 'agility-cost-reductions',
        label: 'Agility Cost Reductions Are Capped at 100%. (Need Reload)',
        hint: '95% => 100%',
        default: true
    });

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

        if (generalSettings.get('agility-cost-reductions')) {
            const agilityObstacleInfo = document.getElementById('agility-obstacle-info-1');
            if (agilityObstacleInfo) {
                document.getElementById('agility-obstacle-info-1').textContent = templateLangString('MENU_TEXT', 'OBSTACLE_INFO_1', {
                    reductionCap: `100`
                });
            }

            ctx.patch(Agility, 'onLoad').after(function() {
                document.getElementById('agility-obstacle-info-1').textContent = templateLangString('MENU_TEXT', 'OBSTACLE_INFO_1', {
                    reductionCap: `100`
                });
            });

            ctx.patch(Agility, 'getObstacleCostModifier').replace(function(o, obstacle) {
                let modifier = this.game.modifiers.increasedAgilityObstacleCost - this.game.modifiers.decreasedAgilityObstacleCost;
                const masteryLevel = this.getMasteryLevel(obstacle);
                if (masteryLevel >= 80)
                    modifier -= 10;
                if (masteryLevel >= 95)
                    modifier -= 10;
                if (this.isPoolTierActive(2))
                    modifier -= 10;
                return Math.max(modifier, -100); // change this line
            });

            ctx.patch(Agility, 'getObstacleItemCostModifier').replace(function(o, obstacle) {
                let modifier = this.getObstacleCostModifier(obstacle);
                if (this.isPoolTierActive(3))
                    modifier -= 15;
                let buildCount = this.obstacleBuildCount.get(obstacle);
                if (buildCount !== undefined) {
                    buildCount = Math.min(buildCount, 10);
                    modifier -= 4 * buildCount;
                }
                return Math.max(modifier, -100); // change this line
            });
        }
    });
}

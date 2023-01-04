export function setup(ctx) {

    const undiscoveredMark = (item) => {
        return game.stats.itemFindCount(item) > 0 ? '' : ' <small style="color: red;">X</small>';
    }

    ctx.onInterfaceReady(async (ctx) => {
        // Monster
        const getMonsterDropsHTML = eval(
            game.combat.getMonsterDropsHTML.toString()
                .replace("getMonsterDropsHTML(monster,respectArea)", "(monster, respectArea)=>")
                .replaceAll("this.", "game.combat.")
                .replaceAll("DEBUGENABLED", "true")
                .replace('return dropText;', 'return `${dropText}${undiscoveredMark(drop.item)}`;')
        );

        ctx.patch(CombatManager, "getMonsterDropsHTML").replace(function (o, monster, respectArea) {
            return getMonsterDropsHTML(monster, respectArea);
        });

        // Thieving
        const showNPCDropsString = thievingMenu.showNPCDrops.toString()
                .replace(/^[^{]*{/, '')
                .replace(/}$/, '')
                .replaceAll("DEBUGENABLED", "true")
                .replace('return text;', 'return `${text}${undiscoveredMark(item)}`;');

        ctx.patch(ThievingMenu, "showNPCDrops").replace(function (o, npc, area) {
            eval(showNPCDropsString);
        });

        // Item
        const viewItemContentsString = viewItemContents.toString()
            .replace('drop.item.name', 'drop.item.name + ` (${(100*drop.weight/item.dropTable.totalWeight).toFixed(2)}%)${undiscoveredMark(drop.item)}`')
            .replace(/^function (\w+)/, "window.$1 = function");
        eval(viewItemContentsString);
    });

    ctx.patch(Bank, 'fireItemUpgradeModal').after(function(returnValue, upgrade, rootItem) {
        $('#item-view-name-upgrade').html(`${upgrade.upgradedItem.name}${undiscoveredMark(upgrade.upgradedItem)}`);
    });

    ctx.patch(ArtisanMenu, 'setProduct').after(function(returnValue, item, qty) {
        if (item && game.stats.itemFindCount(item) <= 0) {
            const platform = isSteam() ? 'Steam' : isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'Browser';
            if (platform == 'Browser') {
                this.productName.setHTML(`${this.productName.innerHTML}${undiscoveredMark(item)}`)
            } else {
                this.productName.textContent += ' (X)';
            }
        }
    });

}

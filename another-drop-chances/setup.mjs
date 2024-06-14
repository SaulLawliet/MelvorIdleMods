export function setup(ctx) {

    const undiscoveredMark = (item) => {
        return game.stats.itemFindCount(item) > 0 ? '' : ' ❌';
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
        const showNPCDropsString = game.thieving.fireNPCDropsModal.toString()
                .replace(/^[^{]*{/, '')
                .replace(/}$/, '')
                .replaceAll("DEBUGENABLED", "true")
                .replace('return text;', 'return `${text}${undiscoveredMark(item)}`;');

        ctx.patch(Thieving, "fireNPCDropsModal").replace(function (o, area, npc) {
            eval(showNPCDropsString);
        });

        // Item
        const viewItemContentsString = viewItemContents.toString()
            .replace('drop.item.name', 'drop.item.name + ` (${(100*drop.weight/item.dropTable.totalWeight).toFixed(2)}%)${undiscoveredMark(drop.item)}`')
            .replace(/^function (\w+)/, "window.$1 = function");
        eval(viewItemContentsString);
    });

    ctx.patch(Bank, 'fireItemUpgradeModal').after(function(returnValue, upgrade, rootItem) {
        itemUpgradeMenu.itemName.innerHTML += undiscoveredMark(upgrade.upgradedItem);
    });

    ctx.patch(ArtisanMenuElement, 'setProduct').after(function(returnValue, item, qty) {
        if (item && game.stats.itemFindCount(item) <= 0) {
            this.productName.textContent += ' ❌';
        }
    });

    // archaeology
    ctx.patch(ArtefactDropListElement, 'setList').replace(function(o, digSite) {
        const formatWeight = (weight, totalWeight) => {
            return ` (${(100*weight/totalWeight).toFixed(2)}%)`;
        }

        digSite.containsDigSiteRequirement
            ? this.hasItemRequirement.classList.remove("d-none")
            : this.hasItemRequirement.classList.add("d-none");
        digSite.artefacts.tiny.sortedDropsArray.map(
            ({ item, weight, minQuantity, maxQuantity }) => {
                const el = createElement("div");
                el.innerHTML =this.getItemDrop(item, maxQuantity, weight) + formatWeight(weight, digSite.artefacts.tiny.totalWeight);
                this.artefactsTiny.appendChild(el);
            }
        );
        digSite.artefacts.small.sortedDropsArray.map(
            ({ item, weight, minQuantity, maxQuantity }) => {
                const el = createElement("div");
                el.innerHTML = this.getItemDrop(item, maxQuantity, weight) + formatWeight(weight, digSite.artefacts.small.totalWeight);
                this.artefactsSmall.appendChild(el);
            }
        );
        digSite.artefacts.medium.sortedDropsArray.map(
            ({ item, weight, minQuantity, maxQuantity }) => {
                const el = createElement("div");
                el.innerHTML = this.getItemDrop(item, maxQuantity, weight) + formatWeight(weight, digSite.artefacts.medium.totalWeight);
                this.artefactsMedium.appendChild(el);
            }
        );
        digSite.artefacts.large.sortedDropsArray.map(
            ({ item, weight, minQuantity, maxQuantity }) => {
                const el = createElement("div");
                el.innerHTML = this.getItemDrop(item, maxQuantity, weight) + formatWeight(weight, digSite.artefacts.large.totalWeight);
                this.artefactsLarge.appendChild(el);
            }
        );

        // const createAverageValue = (parent, dropTable) => {
        //     const el = createElement("span");
        //     el.innerHTML = `Average Value: ${dropTable.averageDropValue.toFixed(2)} GP`;
        //     parent.appendChild(el);
        // }

        // createAverageValue(this.artefactsTiny, digSite.artefacts.tiny);
        // createAverageValue(this.artefactsSmall, digSite.artefacts.small);
        // createAverageValue(this.artefactsMedium, digSite.artefacts.medium);
        // createAverageValue(this.artefactsLarge, digSite.artefacts.large);
    });
}

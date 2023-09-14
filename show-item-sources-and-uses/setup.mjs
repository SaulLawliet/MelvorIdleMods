export function setup(ctx) {

    const getObj = (obj, attrs) => {
        for (let attr of attrs.split('.')) {
            if (!(attr in obj)) return undefined;
            obj = obj[attr];
        }
        return obj;
    }

    const dropItem = (itemID, dropTable) => dropTable?.drops?.some(x => x.item.id == itemID);

    const find = (itemID, obj) => itemID == obj.id;
    const findObj = (itemID, obj) => obj && itemID == obj.item.id;
    const findArray = (itemID, array) => array.some((x) => x.id == itemID);
    const findArrayObj = (itemID, array) => array?.some((x) => x.item.id == itemID)
    const findAlternativeCosts = (itemID, alternativeCosts) => alternativeCosts?.some((x) => findArrayObj(itemID, x.itemCosts));
    const findArtefacts = (itemID, artefacts) => Object.values(artefacts).some((x) => dropItem(itemID, x));

    const qtyArrayObj = (itemID, array) => {
        let qty = array?.find((x) => x.item.id == itemID)?.quantity;
        if (qty == 0) qty = -1;
        return qty;
    }

    const showItem = (item) => {
        let done = false;
        let data = item.name;
        if (item instanceof TownshipTask) {
            data = item._name;
            done = game.township.tasks.completedTasks.has(item);
        } else if (item instanceof ShopPurchase) {
            done = game.shop.isUpgradePurchased(item);
        } else if (item instanceof ArchaeologyMuseumReward) {
            data = `${getLangString('ARCHAEOLOGY_MUSEUM_ARTEFACTS_DONATED')} ${item.localID}`;
            done = item.awarded;
        } else if (item instanceof PointOfInterest) {
            const coords = item.hex.to_oddq();
            data += ` (${coords.col}, ${coords.row})`;
            done = item.isDiscovered;
        } else if (item instanceof RandomTravelEvent) {
            data = item.localID;
        }

        if (item.media) {
            data = `<img class="skill-icon-xxs" src="${item.media}"> ${data}`;
        }
        if (item instanceof Item) {
            data = `<a href="javascript:mod.api.ShowItemSourcesAndUses.showList('${item.id}');">${data}</a>`;
        }
        if (done) {
            data = `<del>${data}</del>`;
        }
        return data;
    }

    const appendQty = (itemID, item, func, obj, verb) => {
        let desc = showItem(item);
        if (func == findArrayObj) {
            let qty = qtyArrayObj(itemID, obj);
            if (qty) {
                if (qty < 0) qty = 0;
                desc += ` ${verb} ${qty}`;
            }
        }
        return desc;
    }

    const buildSkillData = () => {
        // No Astrology
        const skillData = [
            ['Item(Open)', game.items, {}, {'dropTable': dropItem}],
            ['Dungeon', game.dungeons, {}, {'rewards': findArray}],
            ['Shop', game.shop.purchases, {'costs.items': findArrayObj}, {'contains.items': findArrayObj}],
            [game.township.name, game.township.tasks.tasks, {'goals.items': findArrayObj}, {'rewards.items': findArrayObj}],
            [game.farming.name, game.farming.actions, {'seedCost': findObj}, {'product': find}],
            [game.woodcutting.name, game.woodcutting.actions, {}, {'product': find}],
            [game.fishing.name, game.fishing.actions, {}, {'product': find}],
            [game.firemaking.name, game.firemaking.actions, {'log': find}, {}],
            [game.cooking.name, game.cooking.actions, {'itemCosts': findArrayObj}, {'product': find, 'perfectItem': find}],
            [game.mining.name, game.mining.actions, {}, {'product': find}],
            [game.thieving.name, game.thieving.actions, {}, {'lootTable': dropItem, 'uniqueDrop': findObj}],
            [`${game.thieving.name}(Area)`, game.thieving.areas, {}, {'uniqueDrops': findArrayObj}],
            [game.agility.name, game.agility.actions, {'itemCosts': findArrayObj}, {}],
            [game.agility.name, game.agility.pillars, {'itemCosts': findArrayObj}, {}],
            [game.agility.name, game.agility.elitePillars, {'itemCosts': findArrayObj}, {}],


            [game.smithing.name, game.smithing.actions, {'itemCosts': findArrayObj}, {'product': find}],
            [game.fletching.name, game.fletching.actions, {'alternativeCosts': findAlternativeCosts, 'itemCosts': findArrayObj}, {'product': find}],
            [game.crafting.name, game.crafting.actions, {'itemCosts': findArrayObj}, {'product': find}],
            [game.runecrafting.name, game.runecrafting.actions, {'itemCosts': findArrayObj}, {'product': find}],
            [game.herblore.name, game.herblore.actions, {'itemCosts': findArrayObj}, {'potions': findArray}],
            [game.summoning.name, game.summoning.actions, {'itemCosts': findArrayObj, 'nonShardItemCosts': findArray}, {'product': find}],
            [game.altMagic.name, game.altMagic.actions, {'runesRequired': findArrayObj, 'runesRequiredAlt': findArrayObj}, {}],
        ];
        if (cloudManager.hasAoDEntitlement) {
            skillData.push([game.cartography.name, game.cartography.paperRecipes, {'costs.items': findArrayObj}, {'product': find}]);
            skillData.push([`${game.cartography.name}(Event)`, game.cartography.travelEventRegistry, {}, {'rewards.items': findArrayObj}]);

            skillData.push([game.archaeology.name, game.archaeology.actions, {}, {'artefacts': findArtefacts}]);
            skillData.push([`${game.archaeology.name}(Museum)`, game.archaeology.museumRewards, {}, {'items': findArrayObj}]);
        }
        return skillData;
    }

    const calcList = (itemID) => {
        const sources = [];
        const uses = [];

        buildSkillData().forEach((data) => {
            data[1].allObjects.forEach((obj) => {
                [
                    [uses, 'uses', data[2]],
                    [sources, 'gives', data[3]]
                ].forEach((logic) => {
                    Object.entries(logic[2]).forEach((entry) => {
                        const tmpObj = getObj(obj, entry[0]);
                        if (entry[1](itemID, tmpObj)) {
                            logic[0].push([data[0], appendQty(itemID, obj, entry[1], tmpObj, logic[1])]);
                        }
                    });
                });
            });
        });

        // monster
        game.monsters.allObjects.forEach((monster) => {
            if ((monster.bones && monster.bones.item.id == itemID) || (!monster.isBoss && monster.lootTable && dropItem(itemID, monster.lootTable))) {
                sources.push(['Monster', showItem(monster)]);
            }
        });

        // Item
        game.bank.itemUpgrades.forEach((itemUpgrades, key) => {
            itemUpgrades.forEach((itemUpgrade) => {
                if (itemUpgrade.upgradedItem.id == itemID) {
                    sources.push(['Item(Upgrade)', showItem(key)]);
                }

                if (findArrayObj(itemID, itemUpgrade.itemCosts)) {
                    uses.push(['Item(Upgrade)', appendQty(itemID, itemUpgrade.upgradedItem, findArrayObj, itemUpgrade.itemCosts, 'uses')]);
                }
            });
        });

        // Township
        game.township.itemConversions.fromTownship.forEach((conversions, resource) => {
            if (findArrayObj(itemID, conversions)) {
                sources.push([`${game.township.name}(Conversion)`, showItem(resource)]);
            }
        });

        // Thieving
        if (findArrayObj(itemID, game.thieving.generalRareItems)) {
            sources.push([game.thieving.name, "Most NPC"]);
        }

        if (cloudManager.hasAoDEntitlement) {
            // Cartography
            game.cartography.worldMaps.allObjects.forEach((map) => {
                map.pointsOfInterest.allObjects.forEach((poi) => {
                    if (poi.discoveryRewards && findArrayObj(itemID, poi.discoveryRewards.items)) {
                        sources.push([game.cartography.name, appendQty(itemID, poi, findArrayObj, poi.discoveryRewards.items, 'gives')]);
                    }

                    if (poi.hidden?.itemsWorn.length > 0) {
                        if (findArray(itemID, poi.hidden.itemsWorn)) {
                            uses.push([game.cartography.name, showItem(poi)]);
                        }
                    }
                });
            });
        }

        return {sources, uses}
    }

    const showList = (itemID) => {
        let { sources, uses } = calcList(itemID);

        const item = game.items.getObjectByID(itemID);

        let html = `<h5 class="font-w400 mb-1">${item.name}</h5>`;
        html += `<img src="${item.media}" style="width: 48px; height: 48px;"></img>`;
        html += '<p></p>';

        html += '<h5 class="font-w600 font-size-sm mb-1 text-success">SOURCES</h5>';
        if (sources.length > 0) {
            html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
            sources.forEach((line) => {
                html += `<tr style="text-align: left;"><td class="text-info">${line[0]}: </td><td class="${line[1].startsWith('<del>') ? 'text-warning' : ''}">${line[1]}</td></tr>`;
            })
            html += '</table><br>'
        } else {
            html += '<h5 class="font-w600 font-size-sm mb-1">none</h5>';
        }


        html += '<h5 class="font-w600 font-size-sm mb-1 text-success">USES</h5>';
        if (uses.length > 0) {
            html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
            uses.forEach((line) => {
                html += `<tr style="text-align: left;"><td class="text-info">${line[0]}: </td><td class="${line[1].startsWith('<del>') ? 'text-warning' : ''}">${line[1]}</td></tr>`;
            })
            html += '</table><br>'
        } else {
            html += '<h5 class="font-w600 font-size-sm mb-1">none</h5>';
        }

        SwalLocale.fire({
            html: html,
        });
    }

    ctx.api({
        showList
    });

    ctx.patch(ItemCompletionElement, 'updateItem').replace(function (o, item, game) {
        o(item, game);

        if (game.stats.itemFindCount(item) == 0) {
            if (!this.itemImage.onclick) {
                this.itemImage.onclick = () => showList(item.id);
            }
        }
    });

    ctx.patch(BankSideBarMenu, 'initialize').after(function(returnValue, game) {
        const img = createElement("img", {
            classList: ["skill-icon-xxs"],
            attributes: [["src", "https://cdn.melvor.net/core/v018/assets/media/main/question.svg"]],
        });

        const button = createElement('button', {
            className: 'btn btn-sm btn-outline-secondary p-0 ml-2'
        });
        button.onclick = () => showList(game.bank.selectedBankItem.item.id);
        button.appendChild(img);

        bankSideBarMenu.selectedMenu.itemWikiLink.parentNode.append(button);
    });

}

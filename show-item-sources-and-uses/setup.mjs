export function setup(ctx) {

    const getObj = (obj, attrs) => {
        for (let attr of attrs.split('.')) {
            if (attr.endsWith('()')) {
                switch (attr) {
                    case 'ObjectValues()': obj = Object.values(obj); break;
                    default: console.error('[MOD]ShowItemSourcesAndUses: getObj()');
                }
            } else {
                if (!(attr in obj)) return undefined;
                obj = obj[attr];
            }
        }
        return obj;
    }

    const find = (itemID, obj) => typeof(obj) === 'object' && itemID == obj.id;
    const findObj = (itemID, obj) => obj && itemID == obj.item.id;
    const findArray = (itemID, array) => array.some((x) => x.id == itemID);
    const findArrayObj = (itemID, array) => array?.some((x) => x.item.id == itemID)

    const findDrop = (itemID, dropTable) => dropTable?.drops?.some(x => x.item.id == itemID);
    const findDropArray = (itemID, array) => array.some((x) => findDrop(itemID, x));


    const findAlternativeCosts = (itemID, alternativeCosts) => alternativeCosts?.some((x) => findArrayObj(itemID, x.itemCosts));

    const qtyArrayObj = (itemID, array) => {
        let qty = array?.find((x) => x.item.id == itemID)?.quantity;
        if (qty == 0) qty = -1;
        return qty;
    }

    const chancePercent = (weight, totalWeight) => `${(100 * weight / totalWeight).toFixed(2)}%`;

    const qtyDropTable = (itemID, dropTable, item) => {
        if (dropTable instanceof Array) {
            dropTable = dropTable.find((y) => y.drops.some((x) => x.item.id == itemID));
        }
        const drop = dropTable?.drops.find((x) => x.item.id == itemID);
        if (drop) {
            let qty = drop.minQuantity;
            if (drop.minQuantity < drop.maxQuantity) {
                qty += `~${drop.maxQuantity}`;
            }
            qty += ` (${chancePercent(drop.weight * ((item instanceof Monster) ? (item.lootChance / 100) : 1), dropTable.totalWeight)})`;
            return qty;
        }
        return undefined;
    }

    const showItem = (item) => {
        let done = false;
        let data = item.name;
        if (item instanceof TownshipTask) {
            data = item._localID;
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
        } else if (item instanceof WorldMapMasteryBonus) {
            data = `${getLangString('HEX_MASTERY')} ${item.localID}`;
            done = item.awarded;
        } else if (item instanceof BasicSkillRecipe) {
            if (item.skill instanceof SkillWithMastery) {
                const masteryLevel = item.skill.getMasteryLevel(item)
                data += ` (Lv.${masteryLevel})`;
            }
        }

        if (item.media) {
            data = `<img class="skill-icon-xxs" src="${item.media}"> ${data}`;
        }
        if (item instanceof Item) {
            data = `<a href="javascript:mod.api.ShowItemSourcesAndUses.showList('${item.id}');">${data}</a>`;
            if (item instanceof EquipmentItem) {
                done = game.stats.itemFindCount(item) > 0;
            }
        }
        if (done) {
            data = `<del>${data}</del>`;
        }
        return data;
    }

    const appendQty = (itemID, item, func, obj, verb, itemExtra='') => {
        let desc = showItem(item);
        if (itemExtra) {
            if (item instanceof Stronghold) {
                desc += `<span class="text-success">[${itemExtra}]</span>`
            }
        }

        let qty = undefined;
        if (func == findArrayObj) {
            qty = qtyArrayObj(itemID, obj);
        } else if (func == findObj) {
            qty = obj.quantity;
        } else if (func == findDrop || func == findDropArray) {
            qty = qtyDropTable(itemID, obj, item);
        }

        if (item instanceof RandomTravelEvent) {
            qty = `(${chancePercent(item.weight, game.cartography.totalTravelEventWeight)})`;
        }

        if (qty) {
            if (qty < 0) qty = 0;

            if (itemExtra) {
                if (item instanceof Stronghold) {
                    qty += ` (${item.tiers[itemExtra].rewards.chance}%)`;
                }
            }
            desc += ` ${verb} ${qty}`;
        }
        return desc;
    }

    const buildSkillData = () => {
        // No Astrology
        const skillData = [
            // name, objects, uses, gives
            ['Skill(Rare Drop)', game.skills, {}, {'rareDrops': findArrayObj}],
            ['Item(Open)', game.items, {'keyItem': findObj}, {'dropTable': findDrop}],
            ['Dungeon', game.dungeons, {}, {'rewards': findArray, 'oneTimeReward': find}],
            ['Shop', game.shop.purchases, {'costs.items': findArrayObj}, {'contains.items': findArrayObj}],
            [`${game.township.name}(Task)`, game.township.tasks.tasks, {'goals.itemGoals': findArrayObj}, {'rewards.items': findArrayObj}],
            [game.farming.name, game.farming.actions, {'seedCost': findObj}, {'product': find}],
            [game.woodcutting.name, game.woodcutting.actions, {}, {'product': find}],
            [game.fishing.name, game.fishing.actions, {}, {'product': find}],
            [game.firemaking.name, game.firemaking.actions, {'log': find}, {}],
            [game.cooking.name, game.cooking.actions, {'itemCosts': findArrayObj}, {'product': find, 'perfectItem': find}],
            [game.mining.name, game.mining.actions, {}, {'product': find}],
            [game.thieving.name, game.thieving.actions, {}, {'lootTable': findDrop, 'uniqueDrop': findObj}],
            [`${game.thieving.name}(Area)`, game.thieving.areas, {}, {'uniqueDrops': findArrayObj}],
            [game.agility.name, game.agility.actions, {'itemCosts': findArrayObj}, {}],
            [game.agility.name, game.agility.pillars, {'itemCosts': findArrayObj}, {}],

            [game.smithing.name, game.smithing.actions, {'itemCosts': findArrayObj}, {'product': find}],
            [game.fletching.name, game.fletching.actions, {'alternativeCosts': findAlternativeCosts, 'itemCosts': findArrayObj}, {'product': find}],
            [game.crafting.name, game.crafting.actions, {'itemCosts': findArrayObj}, {'product': find}],
            [game.runecrafting.name, game.runecrafting.actions, {'itemCosts': findArrayObj}, {'product': find}],
            [game.herblore.name, game.herblore.actions, {'itemCosts': findArrayObj}, {'potions': findArray}],
            [game.summoning.name, game.summoning.actions, {'itemCosts': findArrayObj, 'nonShardItemCosts': findArray}, {'product': find}],
            [getLangString('PAGE_NAME_AltMagic'), game.altMagic.actions, {'runesRequired': findArrayObj, 'runesRequiredAlt': findArrayObj, 'fixedItemCosts': findArrayObj}, {'produces': find}],
        ];
        if (cloudManager.hasAoDEntitlementAndIsEnabled) {
            skillData.push([game.cartography.name, game.cartography.paperRecipes, {'costs.items': findArrayObj}, {'product': find}]);
            skillData.push([game.cartography.name, game.cartography.travelEventRegistry, {}, {'rewards.items': findArrayObj}]);

            skillData.push([game.archaeology.name, game.archaeology.actions, {}, {'artefacts.ObjectValues()': findDropArray}]);
            skillData.push([game.archaeology.name, game.archaeology.museumRewards, {}, {'items': findArrayObj}]);
        }

        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            skillData.push([getLangString('THE_ABYSS_ENTER_DEPTH'), game.abyssDepths, {}, {'rewards': findArray}]);

            skillData.push([game.harvesting.name, game.harvesting.actions, {}, {'products': findArrayObj, 'uniqueProduct': findObj}]);
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
            if ((monster.bones && monster.bones.item.id == itemID) || (monster.lootTable && findDrop(itemID, monster.lootTable))) {
                sources.push(['Monster', appendQty(itemID, monster, findDrop, monster.lootTable, 'gives')]);
            }
        });

        // stronghold
        game.strongholds.allObjects.forEach((stronghold) => {
            Object.entries(stronghold.tiers).forEach((entry) => {
                if (findArrayObj(itemID, entry[1].rewards.items)) {
                    sources.push(['Stronghold', appendQty(itemID, stronghold, findArrayObj, entry[1].rewards.items, 'gives', entry[0])])
                }
            })
        })

        // Item
        game.bank.itemUpgrades.forEach((itemUpgrades, key) => {
            itemUpgrades.forEach((itemUpgrade) => {
                if (itemUpgrade.upgradedItem.id == itemID) {
                    sources.push([itemUpgrade.isDowngrade ? 'Item(Downgrade)' : 'Item(Upgrade)', showItem(key)]);
                }

                if (findArrayObj(itemID, itemUpgrade.itemCosts)) {
                    uses.push([itemUpgrade.isDowngrade ? 'Item(Downgrade)' : 'Item(Upgrade)', appendQty(itemID, itemUpgrade.upgradedItem, findArrayObj, itemUpgrade.itemCosts, 'uses')]);
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

        // Fishing
        game.fishing.specialItemTables.forEach((drop, realm) => {
            if (findDrop(itemID, drop)) {
                sources.push([`${game.fishing.name}(Special)`, appendQty(itemID, realm, findDrop, drop, 'gives')]);
            }
        })

        if (cloudManager.hasAoDEntitlementAndIsEnabled) {
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

                map.masteryBonuses.allObjects.forEach((bonus) => {
                    if (findArrayObj(itemID, bonus.items)) {
                        sources.push([game.cartography.name, appendQty(itemID, bonus, findArrayObj, bonus.items, 'gives')]);
                    }
                });
            });
        }

        return {sources, uses}
    }

    const undiscoveredMark = (item) => {
        return game.stats.itemFindCount(item) > 0 ? '' : ' <small style="color: red;">X</small>';
    }

    const textClass = (data) => {
        if (data.startsWith('<del>')) {
            return 'text-warning'
        } else if (data.indexOf('Lv.99') >= 0) {
            return 'text-success'
        }
        return ''
    }

    const showList = (itemID, backFunction, ...backArgs) => {
        let { sources, uses } = calcList(itemID);

        const item = game.items.getObjectByID(itemID);

        let maybeBugCount = 0;

        let html = `<h5 class="font-w400 mb-1">${item.name} ${undiscoveredMark(item)}</h5>`;
        html += `<img src="${item.media}" style="width: 48px; height: 48px;"></img>`;
        html += '<p></p>';

        html += '<h5 class="font-w600 font-size-sm mb-1 text-success">SOURCES</h5>';
        if (sources.length > 0) {
            html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
            sources.forEach((line) => {
                html += `<tr style="text-align: left;"><td class="text-info">${line[0]}: </td><td class="${textClass(line[1])}">${line[1]}</td></tr>`;
            })
            html += '</table><br>'
        } else {
            html += '<h5 class="font-w600 font-size-sm mb-1">none</h5>';
            maybeBugCount += 1;
        }


        html += '<h5 class="font-w600 font-size-sm mb-1 text-success">USES</h5>';
        if (uses.length > 0) {
            html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
            uses.forEach((line) => {
                html += `<tr style="text-align: left;"><td class="text-info">${line[0]}: </td><td class="${textClass(line[1])}">${line[1]}</td></tr>`;
            })
            html += '</table><br>'
        } else {
            html += '<h5 class="font-w600 font-size-sm mb-1">none</h5>';
            maybeBugCount += 1;
        }

        if (maybeBugCount == 2) {
            html += `<br><span class="font-w600 font-size-sm text-warning">No sources and uses.<br>Doesn't look right.<br>If you know what I'm missing.<br>Please report bugs if you like, thx.</span>`;
        }

        if (backFunction) {
            SwalLocale.fire({
                html: html,
                showCancelButton: true,
                confirmButtonText: getLangString('ASTROLOGY_BTN_2'),
                cancelButtonText: getLangString('FARMING_MISC_24'),
            }).then((result) => {
                if (result.value) {
                    backFunction(...backArgs);
                }
            });
        } else {
            SwalLocale.fire({
                html: html
            });
        }
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

    ctx.patch(BankSidebarMenuElement, 'initialize').after(function(returnValue, game) {
        const img = createElement("img", {
            classList: ["skill-icon-xxs"],
            attributes: [["src", "https://cdn.melvor.net/core/v018/assets/media/main/question.svg"]],
        });

        const button = createElement('button', {
            id: 'sources-and-uses',
            className: 'btn btn-sm btn-outline-secondary p-0 ml-2'
        });
        button.onclick = () => showList(game.bank.selectedBankItem.item.id);
        button.appendChild(img);

        bankSideBarMenu.selectedMenu.itemWikiLink.parentNode.append(button);

        tippy('#sources-and-uses', {
            content: 'Click to View',
        });
    });

}

export function setup(ctx) {
    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: "number",
        name: "equip-set",
        label: "Which Equipment Sets to Equip?",
        hint: "1 through 5(Default: 1)",
        default: 1
    });

    generalSettings.add({
        type: 'text',
        name: 'custom-icon',
        label: 'Custom Icon (Default: FEZ)',
        hint: "Full icon's URL (Need to reload the game)."
    });

    generalSettings.add({
        type: "switch",
        name: "hidden-fez",
        label: "Click Gear Icon to Equip, Hidden FEZ.",
        hint: "Doesn't work in mobile (Need to reload the game).",
        default: false
    });

    generalSettings.add({
        type: "switch",
        name: "old-style",
        label: "Click Equipment Image to unequip. Remove Select Equipment Tooltip ",
        hint: "Doesn't work in mobile (Need to reload the game).",
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'auto-remove',
        label: 'Auto Remove? (Default: false)',
        hint: 'Remove from Quick-Equip, If item not in bank.(Emergency use)',
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'half-mark',
        label: 'Quick Equip Synergy Uses Half of the Marks',
        default: false
    });

    const arrayRemove = (array, value) => {
        const index = array.indexOf(value);
        if (index !== -1) {
            array.splice(index, 1);
        }
    };

    // maybe in bank or equipment
    const findItem = (item) => {
        if (game.combat.bank.hasItem(item)) {
            return true;
        }

        for (const equipmentSet of game.combat.player.equipmentSets) {
            if (equipmentSet.equipment.slotMap.has(item)) {
                return true;
            }
        }

        return false;
    }

    const removeFromQuickEquip = (skill) => {
        const items = game.minibar.getCustomItemsForSkill(skill);

        const names = [];
        items.filter((x) => game.stats.itemFindCount(x) > 0).forEach((item) => {
            if (!findItem(item)) {
                names.push(item.name);
                game.minibar.toggleCustomItem(skill, item);
            }
        });
        if (names.length > 0) {
            notifyPlayer(skill, `Removed: ${names.join(' / ')}`, "success");
            game.minibar.setSkill(skill);
        } else {
            notifyPlayer(skill, `Nothing to remove. You can turn it off in the Mod Settings.`, "danger");
        }
    }

    // change from: Player.quickEquipItem(item, skill)
    const quickEquipItem = (item, skill, slot) => {
        let quantity = game.combat.player.manager.bank.getQty(item);
        const templateData = {
            itemName: item.name,
            quantity: `${quantity}`
        };
        if (quantity > 0) {
            if (!equipmentSlotData[item.validSlots[0]].allowQuantity)
                quantity = 1;
            game.combat.player.equipItem(item, game.combat.player.selectedEquipmentSet, slot, quantity);
            if (game.combat.player.equipment.checkForItem(item)) {
                if (quantity > 1) {
                    notifyPlayer(skill, templateLangString('TOASTS_ITEM_QTY_EQUIPPED', templateData), 'success');
                } else {
                    notifyPlayer(skill, templateLangString('TOASTS_ITEM_EQUIPPED', templateData), 'success');
                }
            } else
                notifyPlayer(skill, templateLangString('TOASTS_CANT_EQUIP_ITEM', templateData), 'danger');
        } else if (game.combat.player.equipment.checkForItem(item))
            notifyPlayer(skill, templateLangString('TOASTS_ITEM_ALREADY_EQUIPPED', templateData), 'info');
        else
            notifyPlayer(skill, templateLangString('TOASTS_ITEM_NOT_IN_BANK', templateData), 'danger');
    }

    const quickEquip = () => {
        const skill = game.minibar.activeSkill;

        if (game.activeAction == game.combat) {
            notifyPlayer(skill, `You are in battle.`, "danger");
            return;
        }

        if (generalSettings.get('auto-remove')) {
            removeFromQuickEquip(skill);
            return;
        }

        // 换到第一个装备位
        game.combat.player.changeEquipmentSet(Math.max(1, generalSettings.get('equip-set')) - 1);

        const itemMap = {}; // key: id, value: item
        const equipment = {};
        const passive = [];

        const items = game.minibar.getCustomItemsForSkill(skill);

        items.filter((x) => game.stats.itemFindCount(x) > 0).forEach((item) => {
            const itemID = item.id;
            itemMap[itemID] = item;

            const slot = item.validSlots[0];
            if (equipment[slot]) {
                equipment[slot].push(itemID);
            } else {
                equipment[slot] = [itemID];
            }
            if (item.occupiesSlots.length > 0) {
                const occupiesSlot = item.occupiesSlots[0];
                if (equipment[occupiesSlot]) {
                    equipment[occupiesSlot].push(itemID);
                } else {
                    equipment[occupiesSlot] = [itemID];
                }
            }
            if (item.validSlots.includes('Passive')) {
                passive.push(itemID);
            }
        });

        // 尝试计算被动格
        if (passive.length > 0 && game.combat.player.isEquipmentSlotUnlocked('Passive')) {
            // 移除不冲突的物品
            Object.values(equipment).forEach((itemIDs) => {
                if (itemIDs.length == 1 && passive.includes(itemIDs[0])) {
                    arrayRemove(passive, itemIDs[0]);
                }
            });

            // 2个的时候, 被动格内物品可能是同装备位的
            if (passive.length == 2) {
                Object.values(equipment).forEach((itemIDs) => {
                    if (itemIDs.toString() == passive.toString()) {
                        passive.splice(0, 1);
                        itemIDs.splice(1, 1);
                    }
                });
            }

            if (passive.length > 0) {
                if (passive.length == 1) {
                    equipment['Passive'] = [passive[0]];
                } else {
                    notifyPlayer(skill, `${templateLangString('EQUIP_SLOT_11')} conflict: ${passive.map((x) => itemMap[x].name).join(' / ')}`, "danger");
                    return;
                }
            }

            // 如果被动格只有一个, 删掉这个物品从其他的格子中
            if (equipment['Passive']) {
                Object.values(equipment).forEach((itemIDs) => {
                    if (itemIDs.length > 1) {
                        arrayRemove(itemIDs, equipment['Passive'][0]);
                    }
                });
            }
        }

        if (equipment['Summon1'] && equipment['Summon1'].length == 2) {
            // 如果有两个, 那么一边放一个, 不需要关心顺序
            equipment['Summon2'] = [equipment['Summon1'].pop()];
        }

        // console.log(equipment);

        Object.entries(equipment).forEach(([slot, itemIDs]) => {
            if (itemIDs.length == 1) {
                const item = itemMap[itemIDs[0]];
                if (item.occupiesSlots.length == 0 || slot != item.occupiesSlots[0]) {
                    const oldSlot = game.combat.player.equipment.slotMap.get(item);
                    if (oldSlot) {
                        if (oldSlot != slot) {
                            // 位置不一样先脱再穿
                            if (game.combat.player.unequipCallback(oldSlot)()) {
                                quickEquipItem(item, skill, slot);
                            }
                        }
                    } else {
                        quickEquipItem(item, skill, slot);
                    }
                }
            } else {
                notifyPlayer(skill, `conflict: ${itemIDs.map((x) => itemMap[x].name).join(' / ')}`, "danger");
            }
        });

        if (skill.id !== 'melvorD:Township') {
            // 如果没有配置, 那么自动脱掉板子
            if (!equipment['Summon1'] || equipment['Summon1'].length > 1) {
                if (game.combat.player.equipment.slots['Summon1'].quantity > 0) {
                    game.combat.player.unequipCallback('Summon1')();
                }
            }
            if (!equipment['Summon2']) {
                if (game.combat.player.equipment.slots['Summon2'].quantity > 0) {
                    game.combat.player.unequipCallback('Summon2')();
                }
            }
        }
    };

    ctx.patch(Minibar, 'initialize').after(() => {
        const quickEquipReal = game.minibar.createMinibarItem('minibar-quick-equip-real', `${CDNDIR()}assets/media/bank/fez_amulet.png`, '<div class="text-center"><small>Click to Equip All</small></div>', {
            onClick: ()=>quickEquip(),
        });

        const minibarElement = document.getElementById('skill-footer-minibar');
        minibarElement.prepend(quickEquipReal.element);
    });

    ctx.onInterfaceReady(async (ctx) => {
        // Minibar.initialize cannot read settings.

        const hiddenFez = generalSettings.get('hidden-fez') && !nativeManager.isMobile;
        if (hiddenFez) {
            window.displayQuickItemEquip = () => quickEquip();
        }

        const button = document.getElementById('minibar-quick-equip-real');
        if (button) {
            if (hiddenFez) {
                button.remove();
            } else if (generalSettings.get('custom-icon')) {
                button.children[0].src = generalSettings.get('custom-icon');
            }
        }

        // Click Equipment Image to unequip. (Old Style)
        if (generalSettings.get('old-style') && !nativeManager.isMobile) {
            Object.entries(equipmentSlotData).forEach((entry, id) => {
                entry[1].imageElements = getEquipmentImageElements(entry[1].id);
                entry[1].imageElements.map((imageElem) => {
                    if (imageElem._tippy) {
                        imageElem._tippy.destroy();
                        imageElem.addEventListener("click", function() {
                            if (game.combat.player.equipment.slotArray[id].quantity > 0) {
                                game.combat.player.unequipCallback(Object.keys(equipmentSlotData)[id])();
                            }
                        });
                    }
                });
            });
        }
    });

    const equipAmmo = () => {
        const player = game.combat.player;
        const ammoType = player.equipment.slots.Weapon.item.ammoTypeRequired;

        const items = game.bank.filterItems((bankItem) => {
            if (bankItem.locked) return false;
            return bankItem.item instanceof EquipmentItem && bankItem.item.ammoType == ammoType && game.checkRequirements(bankItem.item.equipRequirements);
        });

        if (items.length > 0) {
            items.sort((a, b) => b.equipmentStats[0].value - a.equipmentStats[0].value);
            const set = player.equipmentSets.findIndex((x) => x.equipment === player.equipment)
            player.equipItem(items[0], set, 'Quiver', Infinity);
        }
    };

    ctx.patch(Player, 'onRangedAttackFailure').after(function (returnValue, quiver) {
        equipAmmo();
    });

    const quickEquipSynergyString = game.combat.player.quickEquipSynergy.toString()
        .replace(/^[^{]*{/, '')
        .replace(/}$/, '')
        .replace('return ownedQuantity>0;', 'arg[3]=parseInt(ownedQuantity/2);return ownedQuantity>0;')
    ctx.patch(Player, 'quickEquipSynergy').replace(function(o,synergy) {
        if (!generalSettings.get('half-mark')) {
            o(synergy);
            return;
        }
        eval(quickEquipSynergyString);
    });

}

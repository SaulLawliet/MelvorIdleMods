export class ModifiersComeFrom {
    constructor(modifier, skill) {
        this._skill = skill;
        this._map = new Map();

        // modifier: String or Array
        if (modifier.constructor.name === 'Array') {
            modifier.forEach((x) => {
                this._map.set(x, new Map());
            });
        } else {
            this._modifier = modifier;
            this._map.set(modifier, new Map());
        }
    }

    get modifiers() {
        return this._modifier ? this._map.get(this._modifier) : null;
    }

    get modifiersMap() {
        return this._map;
    }

    isSkillKey(key) {
        return modifierData[key].isSkill;
    }

    format(value, count) {
        return count > 1 ? `${value} * ${count}` : value;
    }

    addModifier(source, key, value, count = 1) {
        if (this._map.has(key)) {
            const map = this._map.get(key);
            if (this.isSkillKey(key)) {
                if (value.constructor.name == 'Map') {
                    if (value.has(this._skill)) {
                        map.set(source, this.format(value.get(this._skill)), count);
                    }
                } else {
                    value.forEach((v) => {
                        if (this._skill == v.skill) {
                            map.set(source, this.format(v.value, count));
                        }
                    });
                }
            } else {
                map.set(source, this.format(value, count));
            }
        }
    }

    addModifiers(source, modifiers, count = 1) {
        if (modifiers.constructor.name == 'Map') {
            modifiers.forEach((value, key) => {
                this.addModifier(source, key, value, count);
            });
        } else {
            Object.entries(modifiers).forEach((e) => {
                this.addModifier(source, e[0], e[1], count);
            });
        }
    }

    addArrayModifiers(source, modArray) {
        modArray.forEach((modElement) => {
            if ('values' in modElement) {
                this.addModifier(source, modElement.key, modElement.values);
            } else {
                this.addModifier(source, modElement.key, modElement.value);
            }
        });
    }

    addMappedModifiers(source, modifiers) {
        this.addModifiers(source, modifiers.skillModifiers)
        this.addModifiers(source, modifiers.standardModifiers);
    }

    compute() {
        // computeProvidedStats()
        this.computeAgility();
        this.computeAstrology();
        this.computeFiremaking();
        this.computeTownship();
        this.computePetManager();
        this.computePosionManager();
        this.computeShop();

        // - character.computeAllStats()
        //   - computeAttackType(): ignore
        //   - computeModifiers(): player.computeModifiers()
        //   - computeAttackSelection()
        //   - computeLevels()
        //   - computeEquipmentStats()
        //   - computeCombatStats()

        // - player.computeModifiers()
        //   - addEquippedItemModifiers: this.computeEquippedItem()
        //   - addSummonSynergyModifiers: this.this.computeEquippedItem()
        //   - addConditionalModifiers: this.computeConditional()
        //   - addPrayerModifiers: this.computePrayer()
        //   - addMiscModifiers: this.computeMisc()
        //   - addAttackStyleModifiers: this.computeAttackStyle();
        //   - addAuroraModifiers: this.computeAurora();
        //   - addCombatAreaEffectModifiers: this.computeCombatAreaEffect();

        this.computeEquippedItem();
        this.computeConditional();
        this.computePrayer();
        this.computeMisc();
        this.computeAttackStyle();
        this.computeAurora();
        this.computeCombatAreaEffect();
    }

    computeAgility() {
        const skill = game.skills.registeredObjects.get("melvorD:Agility");
        const maxTier = skill.numObstaclesUnlocked;
        let all10Active = true;
        let all15Active = true;
        for (let tier = 0; tier < maxTier; tier++) {
            const obstacle = skill.builtObstacles.get(tier);
            const badObstacle = obstacle === undefined || obstacle instanceof DummyObstacle;
            if (tier < 10 && badObstacle) {
                all10Active = false;
                all15Active = false;
                break;
            } else if (badObstacle) {
                all15Active = false;
                break;
            } else {
                const modifiers = skill.getObstacleModifiers(obstacle);
                this.addMappedModifiers(`${skill.name}: ${obstacle.category + 1} ${obstacle.name}`, modifiers);
            }
        }
        if (skill.passivePillarUnlocked && all10Active && skill.builtPassivePillar !== undefined) {
            this.addMappedModifiers(`${skill.name}: ${skill.builtPassivePillar.name}`, skill.getPillarModifiers(skill.builtPassivePillar));
        }
        if (skill.elitePassivePillarUnlocked && all15Active && skill.builtElitePassivePillar !== undefined) {
            this.addMappedModifiers(`${skill.name}: ${skill.builtElitePassivePillar.name}`, skill.getPillarModifiers(skill.builtElitePassivePillar));
        }
    }

    computeAstrology() {
        const getModifierElement = (modifier, value) => {
            return modifier.modifiers.map((mod) => {
                if ('skill' in mod) {
                    return {
                        key: mod.key,
                        values: [{
                            skill: mod.skill,
                            value,
                        }, ],
                    };
                } else {
                    return {
                        key: mod.key,
                        value,
                    };
                }
            });
        };

        const skill = game.skills.registeredObjects.get("melvorD:Astrology");
        skill.actions.forEach((recipe) => {
            recipe.standardModifiers.forEach((astroMod, modID) => {
                const bought = recipe.standardModsBought[modID];
                if (bought <= 0)
                    return;
                const value = bought * astroMod.incrementValue;
                this.addArrayModifiers(`${skill.name}: ${recipe.name}`, getModifierElement(astroMod, value));
            });
            recipe.uniqueModifiers.forEach((astroMod, modID) => {
                const bought = recipe.uniqueModsBought[modID];
                if (bought <= 0)
                    return;
                const value = bought * astroMod.incrementValue;
                this.addArrayModifiers(`${skill.name}: ${recipe.name}`, getModifierElement(astroMod, value));
            });
        });
    }

    computeFiremaking() {
        const skill = game.skills.registeredObjects.get("melvorD:Firemaking");
        let value = 0;
        if (skill.isPoolTierActive(3)) {
            value += 5;
        }
        const maxLogs = skill.actions.reduce((prev, log) => {
            if (skill.getMasteryLevel(log) >= 99)
                prev += 1;
            return prev;
        }, 0);
        if (maxLogs > 0) {
            value += maxLogs * 0.25;
        }
        if (value > 0) {
            this.addModifier(skill.name, 'increasedGlobalMasteryXP', value);
        }
    }

    computeTownship() {
        const skill = game.skills.registeredObjects.get("melvorD:Township");
        this.addModifiers(`${skill.name}: ${getLangString('TOWNSHIP_MENU_WORSHIP')}`, skill.townData.worship.modifiers);
        skill.WORSHIP_CHECKPOINTS.forEach((checkpoint, id) => {
            if (skill.worshipPercent >= checkpoint)
                this.addModifiers(`${skill.name}: ${getLangString('TOWNSHIP_MENU_WORSHIP')} at ${checkpoint}%`, skill.townData.worship.checkpoints[id]);
        });

        skill.buildings.forEach((building) => {
            if (building.providedModifiers !== undefined)
                this.addMappedModifiers(`${skill.name}: ${building.name}`, building.providedModifiers);
        });
    }

    computePetManager() {
        game.petManager.unlocked.forEach((pet) => {
            if (!pet.activeInRaid) {
                this.addModifiers(`${getLangString('PAGE_NAME_CompletionLog_SUBCATEGORY_4')}: ${pet.name}`, pet.modifiers);
            }
        });
    }

    computePosionManager() {
        game.potions.activePotions.forEach(({
            item
        }) => {
            this.addModifiers(item.name, item.modifiers);
        });
    }

    computeShop() {
        game.shop.upgradesPurchased.forEach((count, purchase) => {
            if (purchase.contains.modifiers !== undefined) {
                if (!purchase.category.isGolbinRaid) {
                    let purchaseName = purchase.name;
                    if (purchase._localID.startsWith('Extra_Equipment_Set_')) {
                        purchaseName += ` ${purchase._localID.replace('Extra_Equipment_Set_', '')}`
                    }
                    this.addModifiers(`${getLangString('PAGE_NAME_Shop')}: ${purchaseName}`, purchase.contains.modifiers, count);
                }
            }
        });
    }

    computeEquippedItem() {
        const player = game.combat.player;
        player.equipment.slotArray.forEach((slot) => {
            const item = slot.item;
            if (slot.providesStats) {
                if (item.modifiers !== undefined)
                    this.addModifiers(`${getLangString('PAGE_NAME_CompletionLog_SUBCATEGORY_2')}: ${item.name}`, item.modifiers);
            }
        });

        player.activeItemSynergies.forEach((synergy) => {
            if (synergy.playerModifiers !== undefined)
                this.addModifiers(`ItemSynergy: ${synergy.items.length}/${synergy.items.length}`, synergy.playerModifiers);
        });

        const synergy = player.activeSummoningSynergy;
        if (synergy !== undefined) {
            this.addModifiers(`SummoningSynergy: ${synergy.summons[0].name}-${synergy.summons[1].name}`, synergy.modifiers);
        }
    }

    computeConditional() {
        game.combat.player.conditionalListeners.All.forEach((conditional) => {
            if (conditional.isActive) {
                let source = conditional.condition.type;
                if (source == 'ItemCharge' || source == 'BankItem') {
                    source += `: ${conditional.condition.item.name}`
                }
                this.addModifiers(source, conditional.modifiers);
            }
        });
    }

    computePrayer() {
        game.combat.player.activePrayers.forEach((prayer) => {
            this.addModifiers(`${getLangString('SKILL_NAME_Prayer')}: ${prayer.name}`, prayer.modifiers);
        });
    }

    computeMisc() {
        const bankSlotTokenItem = game.items.getObjectByID('melvorF:Bank_Slot_Token');
        const bankSlotTokenClaimed = game.stats.itemFindCount(bankSlotTokenItem) -
                game.stats.Items.get(bankSlotTokenItem, ItemStats.TimesSold) -
                game.stats.Items.get(bankSlotTokenItem, ItemStats.TimesTransformed) -
                game.bank.getQty(bankSlotTokenItem);
        if (bankSlotTokenClaimed > 0) {
            this.addModifiers(`${getLangString('PAGE_NAME_CompletionLog_SUBCATEGORY_2')}: ${bankSlotTokenItem.name}`, bankSlotTokenItem.modifiers, bankSlotTokenClaimed);
        }

        if (game.combat.player.equipment.checkForItemID("melvorF:Knights_Defender") && game.combat.player.attackType === 'melee') {
            this.addModifiers(`${getLangString('PAGE_NAME_CompletionLog_SUBCATEGORY_2')}: ${game.items.getObjectByID('melvorF:Knights_Defender').name}`, {
                decreasedAttackInterval: 100,
                decreasedDamageReduction: 3,
            });
        }
    }

    computeAttackStyle() {
        if (game.combat.player.attackStyle !== undefined)
            this.addModifiers(`${getLangString('COMBAT_MISC_31')}`, game.combat.player.attackStyle.modifiers);
    }

    computeAurora() {
        if (game.combat.player.canAurora) {
            const aurora = game.combat.player.spellSelection.aurora;
            if (aurora !== undefined) {
                this.addModifiers(`${getLangString('COMBAT_MISC_AURORA_SPELLBOOK_NAME')}: ${aurora.name}`, aurora.modifiers);
            }
        }
    }

    computeCombatAreaEffect() {
        const manager = game.combat;
        if (manager.fightInProgress) {
            const area = game.combat.selectedArea;
            const name = area ? area.name : 'unknown';
            this.addModifiers(name, manager.playerAreaModifiers);
        }
    }

}

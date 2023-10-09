/**
 * It's has issues with Steam(Mac, Linux(?)).
 * So I put all in ones.
 */
class ISkill {
    skill = null;

    checkPoolTierActive(extra, tier, value) {
        if (this.skill.isPoolTierActive(tier)) {
            extra.sum += value;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY_POOL_CHECKPOINTS')}: ${masteryCheckpoints[tier]}%`, value]);
        }
    }

    getAction() { return this.skill.masteryAction; }
    getMasteryLevel() { return this.skill.getMasteryLevel(this.getAction()); }
    getMasteryModifiedInterval() { return this.skill.masteryModifiedInterval; }

    // XP
    getBaseXP() { return this.getAction().baseExperience; }
    getActualXP() { return this.skill.modifyXP(this.getBaseXP(), this.getAction()); }
    appendModifiersForXP(modifiers) {}
    appendGroupForXP(extra) {}

    // MasteryXP
    getBaseMasteryXP() {
        return (((this.skill.totalUnlockedMasteryActions * this.skill.totalCurrentMasteryLevel) / this.skill.trueMaxTotalMasteryLevel +
            this.getMasteryLevel() * (this.skill.trueTotalMasteryActions / 10)) * (this.getMasteryModifiedInterval() / 1000)) / 2;
    }
    getActualMasteryXP() { return this.skill.getMasteryXPToAddForAction(this.getAction(), this.getMasteryModifiedInterval()); }
    appendModifiersForMasteryXP(modifiers) {}
    appendGroupForMasteryXPWithAstrology(extra) {
        game.astrology.masteryXPConstellations.forEach((constellation) => {
            const modValue = game.modifiers.getSkillModifierValue(constellation.masteryXPModifier, this.skill);
            if (modValue > 0) {
                extra.sum += modValue * constellation.maxValueModifiers;
                const text = printPlayerModifier(constellation.masteryXPModifier, { skill: this.skill, value: modValue }, shouldRoundModifier(constellation.masteryXPModifier, modValue) ? 2 : 0);
                extra.descriptions.push([text[0], `${modValue} * ${constellation.maxValueModifiers}`]);
            }
        });
        this.appendGroupForMasteryXP(extra);
    }
    appendGroupForMasteryXP(extra) {} // getMasteryXPModifier

    // Interval
    getBaseInterval() { return this.skill.baseInterval; }
    getActualInterval() { return this.skill.actionInterval; }
    appendModifiersForInterval(modifiers) {}
    appendGroupForPercentageInterval(extra) {} // getPercentageIntervalModifier
    appendGroupForFlatInterval(extra) {} // DONE: getFlatIntervalModifier

    // Doubling
    getActualDoubling() { return this.skill.getDoublingChance(); }
    appendModifiersForDoubling(modifiers) {}
    appendGroupForDoubling(extra) {}

    // Preservation
    appendModifiersForPreservation(modifiers) {}
    appendGroupForPreservation(extra) {}
}

class ISkillWithMastery extends ISkill {

}

class IGatheringSkill extends ISkillWithMastery {

}

class IThieving extends IGatheringSkill {
    skill = game.thieving;

    constructor(panel) {
        super();
        this.panel = panel;
    }

    getAction() { return this.panel.selectedNPC; }
    getMasteryModifiedInterval() { return this.getActualInterval(); }

    appendGroupForXP(extra) {
        this.checkPoolTierActive(extra, 0, 3);
    }

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 1, 3);
    }

    getActualInterval() { return this.skill.getNPCInterval(this.getAction()); }

    appendGroupForFlatInterval(extra) {
        if (this.getMasteryLevel() >= 50) {
            extra.sum += 200;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 50`, 200]);
        }
        this.checkPoolTierActive(extra, 1, 200);
    }

    getActualDoubling() { return this.skill.getNPCDoublingChance(this.getAction()); }

    appendGroupForDoubling(extra) {
        const npcSleightOfHand = this.skill.getNPCSleightOfHand(this.getAction());
        extra.sum += npcSleightOfHand;
        extra.descriptions.push([templateLangString('GAME_GUIDE_90').replace(':', '<br>').replace('：', '<br>'), npcSleightOfHand]);
    }
}

class IAstrology extends IGatheringSkill {
    skill = game.astrology;

    constructor(constellation = null) {
        super();
        this.constellation = constellation;
    }

    getAction() { return this.constellation; }

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    getBaseInterval() { return Astrology.baseInterval; }
}

class IFishing extends IGatheringSkill {
    skill = game.fishing;

    constructor(area) {
        super();
        this.area = area;
    }

    getAction() { return this.skill.selectedAreaFish.get(this.area); }
    getMasteryModifiedInterval() { return (this.skill.getMaxFishInterval(this.getAction()) + this.skill.getMinFishInterval(this.getAction())) / 2;}

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }
}

class ICraftingSkill extends IGatheringSkill {
    getActualPreservation() { return this.skill.actionPreservationChance; }
}

class IArtisanSkill extends ICraftingSkill {
    getBaseXP() { return this.skill.actionXP; }
    getActualDoubling() { return this.skill.actionDoublingChance; }
}

class IAltMagic extends ICraftingSkill {
    skill = game.altMagic;
}

class IHerblore extends IArtisanSkill {
    skill = game.herblore;

    appendGroupForXP(extra) {
        this.checkPoolTierActive(extra, 1, 3);
    }

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    appendGroupForDoubling(extra) {
        this.checkPoolTierActive(extra, 3, 10);
    }

    appendGroupForPreservation(extra) {
        const masteryLevel = this.getMasteryLevel();
        if (masteryLevel > 1) {
            extra.sum += (masteryLevel - 1) * 0.2;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 2 ~ ${masteryLevel}`, (masteryLevel - 1) * 0.2]);
            if (masteryLevel >= 99) {
                extra.sum += 5;
                extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 99`, 5]);
            }
        }
        this.checkPoolTierActive(extra, 2, 5);
    }
}

class ISmithing extends IArtisanSkill {
    skill = game.smithing;

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    appendGroupForDoubling(extra) {
        const masteryLevel = this.getMasteryLevel();
        const times = Math.floor((masteryLevel + 10) / 20);
        for (let i = 0; i < times; i++) {
            extra.sum += 5;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: ${10 + 20 * (i)}`, 5]);
        }
        if (masteryLevel >= 99) {
            extra.sum += 10;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 99`, 10]);
        }
        this.checkPoolTierActive(extra, 3, 10);
    }

    appendModifiersForPreservation(modifiers) {
        if (this.getAction().category.id === "melvorD:DragonGear") {
            modifiers.push('increasedSmithingDragonGearPreservation');
        }
    }

    appendGroupForPreservation(extra) {
        const masteryLevel = this.getMasteryLevel();
        const times = Math.floor(masteryLevel / 20);
        if (times > 0) {
            for (let i = 0; i < times; i++) {
                extra.sum += 5;
                extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: ${20 * (i + 1)}`, 5]);
            }
            if (masteryLevel >= 99) {
                extra.sum += 10;
                extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 99`, 10]);
            }
        }

        this.checkPoolTierActive(extra, 1, 5);
        this.checkPoolTierActive(extra, 2, 5);
    }
}

class IRunecrafting extends IArtisanSkill {
    skill = game.runecrafting;

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    appendModifiersForPreservation(modifiers) {
        const action = this.getAction();
        if (action.product.type === 'Magic Staff') {
            modifiers.push('increasedRunecraftingStavePreservation');
        }
        if (action.category.id === "melvorF:StandardRunes" || action.category.id === "melvorF:CombinationRunes") {
            modifiers.push('increasedRunecraftingEssencePreservation');
        }
    }

    appendGroupForPreservation(extra) {
        this.checkPoolTierActive(extra, 2, 10);
    }

}

class ICrafting extends IArtisanSkill {
    skill = game.crafting;

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    appendGroupForFlatInterval(extra) {
        this.checkPoolTierActive(extra, 2, 200);
    }

    appendModifiersForDoubling(modifiers) {
        const action = this.getAction();
        if (action.category.id === "melvorF:LeatherArmour" || action.category.id === "melvorF:Dragonhide") {
            modifiers.push('increasedChanceToDoubleLeatherDragonhideCrafting');
        }
    }

    appendModifiersForPreservation(modifiers) {
        const action = this.getAction();
        if (action.category.id === "melvorF:Necklaces" || action.category.id === "melvorF:Rings") {
            modifiers.push('increasedCraftingJewelryPreservation');
        }
    }

    appendGroupForPreservation(extra) {
        const masteryLevel = this.getMasteryLevel();
        if (masteryLevel > 1) {
            extra.sum += (masteryLevel - 1) * 0.2;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 2 ~ ${masteryLevel}`, (masteryLevel - 1) * 0.2]);
            if (masteryLevel >= 99) {
                extra.sum += 5;
                extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 99`, 5]);
            }
        }
        this.checkPoolTierActive(extra, 1, 5);
    }

}

class IFletching extends IArtisanSkill {
    skill = game.fletching;

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    appendGroupForFlatInterval(extra) {
        this.checkPoolTierActive(extra, 3, 200);
    }

    appendGroupForPreservation(extra) {
        const masteryLevel = this.getMasteryLevel();
        if (masteryLevel > 1) {
            extra.sum += (masteryLevel - 1) * 0.2;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 2 ~ ${masteryLevel}`, (masteryLevel - 1) * 0.2]);
            if (masteryLevel >= 99) {
                extra.sum += 5;
                extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 99`, 5]);
            }
        }
    }
}

class ISummoning extends IArtisanSkill {
    skill = game.summoning;

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    appendGroupForPreservation(extra) {
        this.checkPoolTierActive(extra, 2, 10);
    }
}

class ICooking extends ICraftingSkill {
    skill = game.cooking;

    constructor(category) {
        super();
        this.category = category;
    }

    getAction() { return this.skill.selectedRecipes.get(this.category); }
    getMasteryModifiedInterval() { return this.skill.getRecipeMasteryModifiedInterval(this.getAction()); }

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    getActualDoubling() { return this.skill.getDoublingChance(this.getAction()); }

    appendGroupForDoubling(extra) {
        this.checkPoolTierActive(extra, 1, 5);
    }

    getActualPreservation() { return this.skill.getPreservationChance(this.getAction(), 0); }

    appendGroupForPreservation(extra) {
        this.checkPoolTierActive(extra, 2, 10);
    }

    getActualPerfectCook() { return this.skill.getRecipePerfectChance(this.getAction()) }

    appendModifiersForPerfectCook(modifiers) {
        const action = this.getAction();
        switch (action.category.id) {
            case "melvorD:Fire":
                modifiers.push('increasedChancePerfectCookFire', 'decreasedChancePerfectCookFire');
                break;
            case "melvorD:Furnace":
                modifiers.push('increasedChancePerfectCookFurnace', 'decreasedChancePerfectCookFurnace');
                break;
            case "melvorD:Pot":
                modifiers.push('increasedChancePerfectCookPot', 'decreasedChancePerfectCookPot');
                break;
        }
    }

    appendGroupForPerfectCook(extra) {
        if (this.getAction().hasMastery) {
            const masteryLevel = this.getMasteryLevel();
            const times = Math.floor(masteryLevel / 10);
            if (times > 0) {
                for (let i = 0; i < times; i++) {
                    extra.sum += 5;
                    extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: ${10 * (i + 1)}`, 5]);
                }
                if (masteryLevel >= 99) {
                    extra.sum += 50;
                    extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 99`, 50]);
                }
            }
        }
    }

    getActualCookingSuccess() { return this.skill.getRecipeSuccessChance(this.getAction()); }

    appendGroupForCookingSuccess(extra) {
        extra.sum += Cooking.baseSuccessChance;
        extra.descriptions.push([`${templateLangString('SKILL_CATEGORY_Cooking_Fire')}`, Cooking.baseSuccessChance]);

        if (this.getAction().hasMastery) {
            const masteryLevel = this.getMasteryLevel();
            extra.sum += masteryLevel * 0.6;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 1 ~ ${masteryLevel}`, masteryLevel * 0.6]);
        }
    }
}

class IFiremaking extends ICraftingSkill {
    skill = game.firemaking;

    getBaseInterval() {
        return this.skill.activeRecipe.baseInterval;
    }

    appendGroupForXP(extra) {
        if (this.skill.isBearDevilActive) {
            extra.sum += 5;
            const description = `${game.items.getObjectByID('melvorF:Summoning_Familiar_Bear').name}
              + ${game.items.getObjectByID('melvorF:Summoning_Familiar_Devil').name}
              + ${templateLangString('POTION_NAME_Controlled_Heat_Potion')}`
            extra.descriptions.push([description, 5]);
        }
    }

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    appendGroupForPercentageInterval(extra) {
        this.checkPoolTierActive(extra, 1, 10);
        const masteryLevel = this.getMasteryLevel();
        extra.sum += masteryLevel * 0.1;
        extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 1 ~ ${masteryLevel}`, masteryLevel * 0.1]);
    }
}

class ICartography extends ISkill {
    skill = game.cartography;

    constructor(type = null) {
        super();
        this.type = type;
    }

    getAction() {
        switch (this.type) {
            case 'PaperMaking': return this.skill.selectedPaperRecipe;
            case 'MapUpgrade': return this.skill.selectedMapUpgradeDigsite.selectedUpgradeMap.digSite;
            default: return this.skill.activeMap.selectedHex;
        }
    }

    getBaseXP() {
        switch (this.type) {
            case 'PaperMaking': return super.getBaseXP();
            case 'MapUpgrade': return this.skill.getMapUpgradeBaseXP(this.getAction().selectedMap);
            default: return this.skill.getSkillXPForHexSurveyAction(this.getAction());
        }
    }

    getBaseInterval() {
        switch (this.type) {
            case 'PaperMaking': return this.skill.BASE_PAPER_MAKING_INTERVAL;
            case 'MapUpgrade': return this.skill.BASE_MAP_UPGRADE_INTERVAL;
            default: return this.skill.BASE_SURVEY_INTERVAL;
        }
    }
    getActualInterval() {
        switch (this.type) {
            case 'PaperMaking': return this.skill.getPaperMakingInterval(this.getAction());
            case 'MapUpgrade': return this.skill.getMapUpgradeInterval(this.getAction());
            default: return this.skill.surveyInterval;
        }
    }
    appendModifiersForInterval(modifiers) {
        if (this.getAction() instanceof PaperMakingRecipe) {
            modifiers[0].push('increasedPaperMakingInterval', 'decreasedPaperMakingInterval');
        } else if (this.getAction() instanceof ArchaeologyDigSite) {
            modifiers[0].push('increasedMapUpgradeInterval', 'decreasedMapUpgradeInterval');
        } else {
            modifiers[0].push('increasedSurveyInterval', 'decreasedSurveyInterval');
        }
    }

    getActualPreservation() {
        switch (this.type) {
            case 'PaperMaking':
            case 'MapUpgrade':
                return this.skill.getPreservationChance(this.getAction(), 0);

            default: return super.getActualPreservation();
        }
    }
}

class IArchaeology extends IGatheringSkill {
    skill = game.archaeology;

    constructor(digSite = null) {
        super();
        this.digSite = digSite;
    }

    getAction() { return this.digSite; }
    getMasteryModifiedInterval() { return this.getActualInterval(); }

    getBaseXP() { return this.skill.getArtefactSkillXPForDigSite(this.digSite); }
    appendGroupForXP(extra) {
        if (
            game.modifiers.increasedArchaeologyCommonItemSkillXP > 0 &&
            this.skill.lastRarityLocated >= ArtefactWeightRange.COMMON &&
            this.skill.lastRarityLocated < ArtefactWeightRange.NOTHING
        ) {
            const value = game.modifiers.increasedArchaeologyCommonItemSkillXP
            extra.sum += value;
            extra.descriptions.push([getLangString('GAME_GUIDE_CARTOGRAPHY_35'), value]);
        }
    }

    appendGroupForMasteryXP(extra) {
        this.checkPoolTierActive(extra, 0, 5);
    }

    getActualInterval() { return this.skill.getDigSiteInterval(this.digSite); }

    getActualDoubling() { return this.skill.getDoublingChance(this.getAction()); }
    appendGroupForDoubling(extra) {
        const masteryLevel = this.getMasteryLevel();
        if (masteryLevel >= 50) {
            extra.sum += 10;
            extra.descriptions.push([`${templateLangString('MENU_TEXT_MASTERY')} Lv: 50`, 10]);
        }
    }

}

class ModifiersComeFrom {
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

    // posMult, negMult: order different from source code.
    addModifier(source, key, value, posMult = 1, negMult = 1) {
        if (this._map.has(key)) {
            const count = modifierData[key].isNegative ? negMult : posMult;

            const map = this._map.get(key);
            while (map.has(source)) {
                source = source + '+';
            }
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

    addModifiers(source, modifiers, posMult = 1, negMult = 1) {
        if (!modifiers) return; // some is undefined.
        if (modifiers.constructor.name == 'Map') {
            modifiers.forEach((value, key) => {
                this.addModifier(source, key, value, posMult, negMult);
            });
        } else {
            Object.entries(modifiers).forEach((e) => {
                this.addModifier(source, e[0], e[1], posMult, negMult);
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
        if (game.registeredNamespaces.hasNamespace('melvorAoD')) {
            this.computeArchaeology();
            this.computeCartography();
        }

        // - player.computeModifiers()

        // addProviderModifiers(): go computeProvidedStats()
        this.computeEquippedItem(); // addEquippedItemModifiers
        this.computeConditional(); // addConditionalModifiers
        this.computeAttackStyle(); // addAttackStyleModifiers
        // addPassiveModifiers
        // addTargetModifiers
        this.computePrayer(); // addPrayerModifiers
        this.computeGameMode(); // addGamemodeModifiers
        this.computeAurora(); // addAuroraModifiers
        // addCurseModifiers
        this.computeMisc();
        this.computeSummonSynergy();
        // addEffectModifiers
        // addMiscSummoningModifiers
        this.computeCombatAreaEffect();
        this.computeAncientRelic();
        // addInheretedModifiers: see computeEquippedItem
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
            const multi = skill.hasMasterRelic && skill.isConstellationComplete(recipe) ? 2 : 1;

            recipe.standardModifiers.forEach((astroMod, modID) => {
                const bought = recipe.standardModsBought[modID];
                if (bought <= 0)
                    return;
                const value = bought * astroMod.incrementValue * multi;
                this.addArrayModifiers(`${skill.name}: ${recipe.name}`, getModifierElement(astroMod, value));
            });
            recipe.uniqueModifiers.forEach((astroMod, modID) => {
                const bought = recipe.uniqueModsBought[modID];
                if (bought <= 0)
                    return;
                const value = bought * astroMod.incrementValue * multi;
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
        let worshipModifierMulti = 1;

        const season = skill.townData.season;
        if (season !== undefined) {
            this.addModifiers(`${skill.name}: ${getLangString('TOWNSHIP_MENU_SEASON_MODIFIERS')}: ${season.name}`, season.modifiers);
            const seasonMultiplier = skill.townData.worship.seasonMultiplier.get(season);
            if (seasonMultiplier !== undefined)
                worshipModifierMulti = seasonMultiplier;
        }

        this.addModifiers(`${skill.name}: ${getLangString('TOWNSHIP_MENU_WORSHIP')}`, skill.townData.worship.modifiers, worshipModifierMulti, 1);
        skill.WORSHIP_CHECKPOINTS.forEach((checkpoint, id) => {
            if (skill.worshipPercent >= checkpoint)
                this.addModifiers(`${skill.name}: ${getLangString('TOWNSHIP_MENU_WORSHIP')} at ${checkpoint}%`, skill.townData.worship.checkpoints[id], worshipModifierMulti, 1);
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

    computeArchaeology() {
        const skill = game.skills.registeredObjects.get("melvorAoD:Archaeology");

        if (skill.isActive && skill.currentDigSite !== undefined && skill.currentDigSite.selectedMap !== undefined) {
            this.addArrayModifiers(getLangString('GAME_GUIDE_CARTOGRAPHY_35'), skill.currentDigSite.selectedMap.refinements);
        }
        skill.museumRewards.forEach((bonus) => {
            if (bonus.modifiers !== undefined && bonus.awarded) {
                this.addModifiers(`${getLangString('ARCHAEOLOGY_MUSEUM_ARTEFACTS_DONATED')}: ${bonus.museumCount}`, bonus.modifiers);
            }
        });
    }

    computeCartography() {
        const skill = game.skills.registeredObjects.get("melvorAoD:Cartography");

        skill.worldMaps.forEach((map) => {
            map.pointsOfInterest.forEach((poi) => {
                if (!poi.isDiscovered) return;
                if (poi.discoveryModifiers !== undefined && poi.discoveryModifiers.movesLeft > 0) {
                    this.addModifiers(`${getLangString('POINT_OF_INTEREST')}: ${poi.name}`, poi.discoveryModifiers.modifiers);
                }
            });
            map.sortedMasteryBonuses.forEach((bonus) => {
                if (map.masteredHexes >= bonus.masteredHexes && bonus.modifiers !== undefined) {
                    this.addModifiers(`${skill.name}: ${templateLangString('HEX_COUNT', {count: bonus.masteredHexes})}`, bonus.modifiers);
                }
            });
        });

        if (skill.lastTravelEvent?.tempBonuses) {
            this.addModifiers(getLangString('RANDOM_TRAVEL_EVENT'), skill.lastTravelEvent.tempBonuses);
        }

        if (skill.activeMap?.playerPosition) {
            const poi = skill.activeMap.playerPosition.pointOfInterest;
            if (poi?.activeModifiers) {
                const posMult = skill.hasCarthuluPet ? 2 : 1;
                this.addModifiers(`${getLangString('POINT_OF_INTEREST')}: ${poi.name}`, poi.activeModifiers, posMult);
            }
        }
    }

    computeEquippedItem() {
        const player = game.combat.player;
        player.equipment.slotArray.forEach((slot) => {
            const item = slot.item;
            if (slot.providesStats) {
                if (item.modifiers !== undefined) {
                    this.addModifiers(`${getLangString('PAGE_NAME_CompletionLog_SUBCATEGORY_2')}: ${item.name}`, item.modifiers);
                    // AoD skill cape inherited
                    if (game.registeredNamespaces.hasNamespace('melvorAoD')) {
                        switch (item.id) {
                            case "melvorF:Max_Skillcape":
                            case "melvorTotH:Superior_Max_Skillcape":
                            case "melvorTotH:Superior_Cape_Of_Completion":
                            case "melvorF:Cape_of_Completion": {
                                [
                                    [game.archaeology, 'melvorAoD:Archaeology_Skillcape', 'melvorAoD:Superior_Archaeology_Skillcape'],
                                    [game.cartography, 'melvorAoD:Cartography_Skillcape', 'melvorAoD:Superior_Cartography_Skillcape'],
                                ].forEach((data) => {
                                    let cape = undefined;
                                    if (data[0].level >= 120) {
                                        cape = game.items.getObjectByID(data[2]);
                                    } else if (data[0].level >= 99) {
                                        cape = game.items.getObjectByID(data[1]);
                                    }
                                    if (cape?.modifiers) {
                                        this.addModifiers(`${getLangString('PAGE_NAME_CompletionLog_SUBCATEGORY_2')}: ${item.name}`, cape.modifiers);
                                    }
                                });
                                break;
                            }
                        }
                    }
                }
            }
        });

        player.activeItemSynergies.forEach((synergy) => {
            if (synergy.playerModifiers !== undefined)
                this.addModifiers(`ItemSynergy: ${synergy.items.length}/${synergy.items.length}`, synergy.playerModifiers);
        });
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

    computeAttackStyle() {
        if (game.combat.player.attackStyle !== undefined)
            this.addModifiers(`${getLangString('COMBAT_MISC_31')}`, game.combat.player.attackStyle.modifiers);
    }

    computePrayer() {
        game.combat.player.activePrayers.forEach((prayer) => {
            this.addModifiers(`${getLangString('SKILL_NAME_Prayer')}: ${prayer.name}`, prayer.modifiers);
        });
    }

    computeGameMode() {
        this.addModifiers('GAME MODE', game.currentGamemode.playerModifiers);
    }

    computeAurora() {
        if (game.combat.player.canAurora) {
            const aurora = game.combat.player.spellSelection.aurora;
            if (aurora !== undefined) {
                this.addModifiers(`${getLangString('COMBAT_MISC_AURORA_SPELLBOOK_NAME')}: ${aurora.name}`, aurora.modifiers);
            }
        }
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

    computeSummonSynergy() {
        const synergy = game.combat.player.activeSummoningSynergy;
        if (synergy !== undefined) {
            this.addModifiers(`SummoningSynergy: ${synergy.summons[0].name}-${synergy.summons[1].name}`, synergy.modifiers);
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

    computeAncientRelic() {
        game.skills.forEach((skill) => {
            skill.ancientRelicsFound.forEach((_, relic) => {
                if (relic.modifiers !== undefined) {
                    this.addModifiers(relic.name, relic.modifiers);
                }
            });
            if (
                skill.ancientRelicsFound.size >= skill.ancientRelics.length &&
                skill.completedAncientRelic !== undefined
            ) {
                this.addModifiers(skill.completedAncientRelic.name, skill.completedAncientRelic.modifiers);
            }
        });
    }

}


export async function setup(ctx) {
    const lang = {
        'SETTING_1_LABEL': {
            'en' : 'Click Header Title to Show',
            'zh-CN': '点击技能文字展示',
            'zh-TW': '點擊技能文字展示',
        },
        'SETTING_1_HINT': {
            'en': 'Hidden Book Icon (Need Refresh)',
            'zh-CN': '隐藏图书图标(需要刷新)',
            'zh-TW': '隱藏圖書圖標(需要刷新)',
        },
        'SETTING_2_LABEL': {
            'en' : 'Show Mastery Pool Checkpoints',
            'zh-CN': '显示专精池检查点',
            'zh-TW': '顯示專精池檢查點',
        },
        'SETTING_3_LABEL': {
            'en' : 'Show Locked or Inactivated Item',
            'zh-CN': '显示锁住或未激活的属性',
            'zh-TW': '顯示鎖住或未激活的屬性',
        },
        'SETTING_4_LABEL': {
            'en' : 'Hidden More Button',
            'zh-CN': '隐藏more按钮',
            'zh-TW': '隱藏more按鈕',
        },
        'TIPS_1': {
            'en': 'Click icon to view (by Mod)',
            'zh-CN': '点击图标查看 (by Mod)',
            'zh-TW': '點擊圖標查看 (by Mod)',
        }
    }

    const getLang = (key) => {
        if (!lang[key]) {
            return 'UNDEFINED LANG'
        }
        return lang[key][setLang] ? lang[key][setLang] : lang[key]['en'];
    };

    const generalSettings = ctx.settings.section('General');

    generalSettings.add({
        type: 'switch',
        name: 'hidden-book-icon',
        label: getLang('SETTING_1_LABEL'),
        hint: getLang('SETTING_1_HINT'),
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'show-checkpoints',
        label: getLang('SETTING_2_LABEL'),
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'show-locked-checkpoints',
        label: getLang('SETTING_3_LABEL'),
        default: false
    });

    generalSettings.add({
        type: 'switch',
        name: 'hidden-more-button',
        label: getLang('SETTING_4_LABEL'),
        default: false
    });

    const appendTooltip = (value) => {
        if (game && game.openPage && ['Woodcutting', 'Mining'].includes(game.openPage._localID)) {
            return value;
        }
        return `${value}
        <h5 class="font-w400 font-size-sm mb-1 text-center text-info">
        <small>${getLang('TIPS_1')}</small>
        </h5>
        `;
    }

    const intervalTooltip = appendTooltip(`<div class="text-center text-warning">${getLangString('MENU_TEXT_TOOLTIP_INTERVAL')}<br><small>${getLangString('MENU_TEXT_INCLUSIVE_OF_BONUSES')}</small></div>`);

    ctx.patch(XPIcon, 'getTooltipContent').after(function (returnValue) {
        return appendTooltip(returnValue);
    });
    ctx.patch(MasteryXPIcon, 'getTooltipContent').after(function (returnValue) {
        return appendTooltip(returnValue);
    });

    const replaceTooltip = (value) => {
        const arr = value.split('</h5>');
        if (arr.length >= 4) {
            arr[3] = arr[3].replace('<small>', '<small><del>').replace('</small>', '</del></small>')
        }
        return appendTooltip(arr.join('</h5>'));
    }

    ctx.patch(DoublingIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });
    ctx.patch(PreservationIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });
    ctx.patch(PerfectCookIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });
    ctx.patch(CookingSuccessIcon, 'getTooltipContent').after(function (returnValue) {
        return replaceTooltip(returnValue);
    });

    const showModifiersComeFrom = (modifier, modifierValue, skillId, backFunction = undefined) => {
        const skill = game.skills.registeredObjects.get(skillId);
        const mcf = new ModifiersComeFrom(modifier, skill);
        mcf.compute();
    
        let description;
        if (modifierData[modifier].isSkill) {
            description = printPlayerModifier(modifier, { skill, value: modifierValue }, shouldRoundModifier(modifier, modifierValue) ? 2 : 0);
        } else {
            description = printPlayerModifier(modifier, modifierValue, shouldRoundModifier(modifier, modifierValue) ? 2 : 0);
        }
    
        let html = `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke ${description[1]}">${description[0]}</h5>`;
        html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
    
        let sum = 0;
        mcf.modifiers.forEach((value, key) => {
            if (typeof value === 'number') {
                sum += value;
            } else {
                sum += Number(eval(value));
            }
    
            html += `<tr style="text-align: left;"><td class="text-info">${key}</td><td class="${description[1]}">${value}</td></tr>`;
        });
        if (sum !== modifierValue) {
            html += `<tr><td>&nbsp</td></tr>`
            html += `<tr style="text-align: left;"><td class="text-warning">Some sources were not found.</td><td></td></tr>`;
            html += `<tr style="text-align: left;"><td class="text-warning">Please report bugs if you like, thx.</td><td></td></tr>`;
        }
        html += '</table>'
        if (backFunction) {
            SwalLocale.fire({
                html: html,
                showCancelButton: true,
                confirmButtonText: getLangString('ASTROLOGY_BTN_2'),
                cancelButtonText: getLangString('FARMING_MISC_24'),
            }).then((result) => {
                if (result.value) {
                    backFunction();
                }
            });
        } else {
            SwalLocale.fire({
                html: html
            });
        }
    }
    
    const viewModifiers = (name, skill, descriptions) => {
        let passives = `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke">${name}</h5>`;
        if (skill && !skill.isCombat) {
            passives += ` <button class="btn-info font-w600 font-size-sm" style="border: 0px;" onclick="mod.api.ShowSkillModifiers.showSkillItems('${skill.id}', mod.api.ShowSkillModifiers.showSkillModifiers)">${getLangString('MENU_TEXT_ITEMS')} ${getLangString('SEARCH')}</button>`
        }
        passives += `<h5 class="font-w600 font-size-sm mb-3 text-warning"><small></small></h5>`;
        if (!generalSettings.get('show-checkpoints') && skill && skill.hasMastery) {
            passives += `<h5 class="font-w600 font-size-sm mb-3 text-warning"><small>(Does not include ${getLangString('MENU_TEXT_MASTERY_POOL_CHECKPOINTS')})</small></h5>`;
        }
        passives += descriptions.map(([text, textClass, key, value, skill]) => {
            let html = `<h5 class="font-w400 font-size-sm mb-1 ${textClass}">${text}`;
            if (key && !generalSettings.get('hidden-more-button')) {
                html += ` <button class="btn-primary" style="border: 0px;" onclick="mod.api.ShowSkillModifiers.showModifiersComeFrom('${key}', ${value}, '${skill ? skill.id : null}', mod.api.ShowSkillModifiers.showSkillModifiers);">more</button>`
            }
            html += '</h5>';
            return html;
        }).join('');
        SwalLocale.fire({
            html: passives,
        });
    };
    
    class MyMappedModifiers extends MappedModifiers {
        // Rewrite: need key and value
        getActiveModifierDescriptions() {
            const descriptions = [];
            this.standardModifiers.forEach((value, key) => {
                if (value > 0) {
                    const arr = printPlayerModifier(key, value, shouldRoundModifier(key, value) ? 2 : 0);
                    arr.push(...[key, value]);
                    descriptions.push(arr);
                }
            });
            this.skillModifiers.forEach((skillMap, key) => {
                skillMap.forEach((value, skill) => {
                    if (value > 0) {
                        const arr = printPlayerModifier(key, { skill,value }, shouldRoundModifier(key, value) ? 2 : 0);
                        arr.push(...[key, value, skill]);
                        descriptions.push(arr);
                    }
                });
            });
            return descriptions;
        }
    }
    
    /*
        - Skill
            - Township
            - Cartography
            - CombatSkill
                - ...
            - SkillWithMastery
                - Farming
                - GatheringSkill
                    - Agility
                    - Astrology
                    - Fishing
                    - Mining
                    - Thieving
                    - Woodcutting
                    - Archaeology
                    - CraftingSKill
                        - AltMagic
                        - Cooking
                        - Firemaking
                        - ArtisanSkill
                            - Crafting
                            - Fletching
                            - Herblore
                            - Runecrafting
                            - Smithing
                            - Summoning
    */
    const getGlobalModifiers = (skill, localID) => {
        const cares = Object.entries(modifierData).filter((x) => {
            var show = false;
            if (skill || localID === 'Combat') {
                if (localID !== 'Township' && localID !== 'AltMagic' && localID !== 'Cartography' && localID !== 'Archaeology') {
                    show ||= x[0].indexOf('PreservePotionCharge') >= 0;
                    if (localID !== 'Farming' && localID !== 'Cartography' && localID !== 'Archaeology') {
                        show ||= x[0].indexOf('SummoningChargePreservation') >= 0;
                    }
                }
    
                if (!show) {
                    if (x[0].indexOf('GlobalSkillXP') >= 0) {
                        show = true;
                    } else if (x[0].indexOf('NonCombatSkillXP') >= 0) {
                        show = skill != null;
                    } else if (x[0].indexOf('GlobalMasteryXP') >= 0 || x[0].indexOf('GlobalSkillInterval') >= 0) {
                        show = skill && skill.hasMastery;
                    } else if (x[0].indexOf('ChanceToDoubleItemsGlobal') >= 0) {
                        show = localID !== 'Agility' && localID !== 'Township';
                    } else if (x[0].indexOf('GPGlobal') >= 0) {
                        // https://wiki.melvoridle.com/w/Aorpheat%27s_Signet_Ring
                        show = !skill || localID === 'Agility' || localID === 'Firemaking' || localID === 'Thieving' || localID === 'AltMagic';
                    } else if (x[0].indexOf('GlobalPreservationChance') >= 0) {
                        if (skill) {
                            const parentName = Object.getPrototypeOf(skill.constructor).name;
                            show = parentName === 'CraftingSkill' || parentName === 'ArtisanSkill';
                        }
                    }
                }
            }
    
            if (!show && localID === 'AltMagic' && x[0].indexOf('RunePreservation') >= 0) { // increasedRunePreservation
                show = true;
            }
            return show;
        }).map((x) => x[0]);
    
        const modifiers = new MyMappedModifiers();
        Object.entries(game.modifiers).forEach((entry) => {
            if (cares.includes(entry[0])) {
                modifiers.standardModifiers.set(entry[0], entry[1]);
            }
        });
        return modifiers
    }
    
    const getSkillModifiers = (skill, localID) => {
        const modifiers = new MyMappedModifiers();
        if (skill) {
            game.modifiers.skillModifiers.forEach((value, key) => {
                if (key !== 'masteryToken' && value.has(skill)) {
                    const skillMap = new Map();
                    skillMap.set(skill, value.get(skill));
                    modifiers.skillModifiers.set(key, skillMap);
                }
            });
        } else if (localID === 'Combat') {
            const combatSkills = game.pages.registeredObjects.get('melvorD:Combat').skills;
            game.modifiers.skillModifiers.forEach((value, key) => {
                if (key !== 'increasedChanceToDoubleItemsSkill') {
                    for (let combatSkill of combatSkills) {
                        if (value.has(combatSkill)) {
                            let map = modifiers.skillModifiers.get(key);
                            if (!map) {
                                map = new Map();
                                modifiers.skillModifiers.set(key, map);
                            }
                            map.set(combatSkill, value.get(combatSkill));
                        }
                    }
                }
            });
        }
        return modifiers;
    }
    
    const getSkillOtherModifiers = (skill, localID) => {
        if (localID == 'Cooking') {
            localID = 'Cook'
        }
        // not include Summoning
        const nonCombatSkills = ['Woodcutting', 'Fishing', 'Firemaking', 'Cooking', 'Mining', 'Smithing', 'Thieving', 'Farming', 'Fletching', 'Crafting', 'Runecrafting', 'Herblore', 'Agility', 'Astrology', 'Township', 'Cartography', 'Archaeology'];
    
        const cares = Object.entries(modifierData).filter((x) => {
            var show = false;
            if (localID !== 'Township' && x[0].indexOf('Township') >= 0) {
                show = false;
            } else if (localID === 'Summoning' && x[0].indexOf('SummoningChargePreservation') >= 0) { // avoid duplication
                show = false;
            } else if (localID === 'Archaeology' && (x[0].indexOf('ChanceToPreserveMapCharges') >= 0 || x[0].indexOf('DigSiteMapSlots') >= 0)) {
                show = true;
            } else if (x[1].description) {
                show = x[1].description.indexOf(localID) >= 0;
                if (show && localID === 'Combat' && x[1].description.indexOf('Non-Combat') >= 0) {
                    show = false;
                }
                if (!show && skill && x[0] === 'increasedOffItemChance' && skill.hasMastery) {
                    show = true; // Items: Clue Chasers Insignia
                }
            }
            if (!show) {
                if (localID === 'Combat') {
                    // const attackType = game.combat.player.attackType;
                    show = x[1].tags.includes('combat') && x[1].description !== 'No description';
                    if (show) {
                        for (let skillName of nonCombatSkills) {
                            if (x[1].description.indexOf(skillName) >= 0) {
                                show = false;
                                break;
                            }
                        }
                    }
                } else {
                    show = x[1].tags.includes(localID.toLocaleLowerCase());
                }
            }
            return show;
        }).map((x) => x[0]);
    
        const modifiers = new MyMappedModifiers();
        Object.entries(game.modifiers).forEach((entry) => {
            if (cares.includes(entry[0])) {
                modifiers.standardModifiers.set(entry[0], entry[1]);
            }
        });
        return modifiers;
    }
    
    const groupCombat = (descriptions) => {
        return descriptions.reduce((group, description) => {
            let category = 'None';
            const desc = modifierData[description[2]].description;
            if (desc.indexOf('Auto Eat') >= 0) category = 'Auto Eat';
            else if (desc.indexOf('Slayer') >= 0) category = 'Slayer';
            else if (desc.indexOf('Prayer') >= 0) category = 'Prayer';
            else if (desc.indexOf('Hitpoints') >= 0 || desc.indexOf('Food') >= 0) category = 'Hitpoints';
            else if (desc.indexOf('Melee') >= 0) category = 'Melee';
            else if (desc.indexOf('Ranged') >= 0 || desc.indexOf('Ammo') >= 0) category = 'Ranged';
            else if (desc.indexOf('Magic') >= 0 || desc.indexOf('Rune') >= 0) category = 'Magic';
            else if (desc.indexOf('Hit') >= 0) category = 'Hit';
            else if (desc.indexOf('Damage To') >= 0) category = 'Damage To';
            else if (desc.indexOf('Loot') >= 0 || desc.indexOf('GP') >= 0) category = 'Loot';
            group[category] = group[category] ?? [];
            group[category].push(description);
            return group;
          }, {});
    }
    
    const makeDescription = (str, status) => {
        if (status) {
            return [`<del>${str}</del> (${status})`, 'text-warning'];
        } else {
            return [str, 'text-success'];
        }
    }
    
    const getMasteryPoolCheckpointsDescriptions = (skill, localID) => {
        var descriptions = [];
        if (skill && skill.hasMastery) {
            for (let i = 0; i < 4; i++) {
                let status = null;
                if (skill.isPoolTierActive(i)) {
                    status = localID === 'Firemaking' && i === 3 ? 'Duplicate' : '';
                } else if (generalSettings.get('show-locked-checkpoints')) {
                    status = 'Inactivated'
                }
                if (status !== null) {
                    descriptions.push(makeDescription(getLangString(`MASTERY_CHECKPOINT_${localID}_${i}`), status));
                }
            }
        }
        return descriptions;
    };
    
    const appendDescriptions = (oldD, newD) => {
        if (oldD.length > 0 && newD.length > 0) {
            oldD.push(['<br>', '']);
        }
        if (newD.length) {
            oldD = oldD.concat(newD);
        }
        return oldD;
    };
    
    const showSkillModifiers = () => {
        var localID = game.openPage._localID;
        if (localID === 'CompletionLog' || localID === 'Lore' || localID === 'Statistics' || localID === 'Settings') {
            return;
        }
    
        const skills = game.openPage.skills;
        const skill = skills && skills.length == 1 ? skills[0]: null;
    
        var descriptions = [];
        if (generalSettings.get('show-checkpoints')) {
            descriptions = appendDescriptions(descriptions, getMasteryPoolCheckpointsDescriptions(skill, localID));
        }
    
        descriptions = appendDescriptions(descriptions, getGlobalModifiers(skill, localID).getActiveModifierDescriptions());
        descriptions = appendDescriptions(descriptions, getSkillModifiers(skill, localID).getActiveModifierDescriptions());
        if (localID === 'Combat') {
            Object.values(groupCombat(getSkillOtherModifiers(skill, localID).getActiveModifierDescriptions())).forEach((value) => {
                descriptions = appendDescriptions(descriptions, value);
            });
        } else {
            descriptions = appendDescriptions(descriptions, getSkillOtherModifiers(skill, localID).getActiveModifierDescriptions());
        }
    
        const showLocked = generalSettings.get('show-locked-checkpoints')
        switch (localID) {
            case 'Fishing':
                if (skill.secretAreaUnlocked || showLocked) {
                    descriptions.push(makeDescription(getLangString('MISC_STRING_MESSAGE_IN_BOTTLE_UNLOCK'), skill.secretAreaUnlocked ? '' : 'Locked'));
                }
                break;
            case 'Shop':
                if (game.merchantsPermitRead || showLocked) {
                    descriptions.push(makeDescription(getLangString('MISC_STRING_MERCHANTS_PERMIT_UNLOCK'), game.merchantsPermitRead ? '' : 'Locked'));
                }
                break;
        }
    
        viewModifiers(game.openPage.name, skill, descriptions);
    }
    
    const findSkillItems = (skill) => {
        const list = [];
        const localID = skill.localID;
        game.items.allObjects.forEach((item) => {
            if (item instanceof EquipmentItem && item.modifiers) {
                for (let entry of Object.entries(item.modifiers)) {
                    if (entry[1] instanceof Array) {
                        if (entry[1].some((x) => x.skill == skill)) {
                            list.push(item);
                            break;
                        }
                    } else {
                        if (entry[0].indexOf(localID) >= 0 || modifierData[entry[0]].tags.includes(localID.toLocaleLowerCase())) {
                            list.push(item);
                            break;
                        }
    
                    }
                }
            }
        });
        return list;
    }
    
    const showSkillItems = (skillID, backFunction = undefined) => {
        const skill = game.skills.getObjectByID(skillID);
        const items = findSkillItems(skill);
        let html = `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke">${skill.name}</h5>`;
        html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
        items.forEach((item) => {
            html += `<tr style="text-align: left;">
                <td class="text-info"><img class="skill-icon-xxs" src="${item.media}"> ${item.name}: </td>
                <td>
                    <button class="btn-primary" style="border: 0px;" onclick="viewItemStats(game.items.getObjectByID('${item.id}'), game.combat.player.equipToSetEquipment)">View</button>`;
            if (game.stats.itemFindCount(item) <= 0) {
                if (mod.api.ShowItemSourcesAndUses) {
                    html += ` <button class="btn-info" style="border: 0px;" onclick="mod.api.ShowItemSourcesAndUses.showList('${item.id}', mod.api.ShowSkillModifiers.showSkillItems, '${skillID}');">How</button>`;
                }
            html += ' <span class="font-w400 text-danger">X</span>';
        } else if (game.combat.player.equipment.slotMap.has(item)) {
            html += ' <span class="font-w400 text-success">Y</span>';
        }
            html += '</td></tr>';
        });
        html += '</table>'
        html += '<span class="font-w400 font-size-sm mb-1"><small class="text-success">Y</small> means wearing</span>'
        html += '<br><span class="font-w400 font-size-sm mb-1"><small class="text-danger">X</small> means not found</span>'
        if (backFunction) {
            SwalLocale.fire({
                html: html,
                showCancelButton: true,
                confirmButtonText: getLangString('ASTROLOGY_BTN_2'),
                cancelButtonText: getLangString('FARMING_MISC_24'),
            }).then((result) => {
                if (result.value) {
                    backFunction();
                }
            });
        } else {
            SwalLocale.fire({
                html: html
            });
        }
    }

    const numToStr = (num) => {
        if (num.toFixed) {
            const a = num.toString();
            const b = num.toFixed(2);
            return a.length < b.length ? a : b;
        }
        return num;
    }

    const createDescriptionsGroup = (careModifiers, skill) => {
        return createDescriptionsGroups([careModifiers], skill)[0];
    };
    
    // careModifiersArray: 2-dimensional
    const createDescriptionsGroups = (careModifiersArray, skill) => {
        const mcf = new ModifiersComeFrom(Array.prototype.concat.apply([], careModifiersArray), skill);
        mcf.compute();
    
        const groups = [];
        careModifiersArray.forEach((_, i) => {
            groups.push({sum: 0, block: []});
        });
    
        const findIndex = (modifier) => {
            return careModifiersArray.findIndex((x) => x.includes(modifier));
        }
    
        mcf.modifiersMap.forEach((map, modifier) => {
            const group = groups[findIndex(modifier)]
            if (map.size > 0) {
                const descriptions = [];
                let description = ['', ''];
                if (modifierData[modifier].isSkill) {
                    const value = game.modifiers.skillModifiers.get(modifier).get(skill);
                    description = printPlayerModifier(modifier, { skill, value }, shouldRoundModifier(modifier, value) ? 2 : 0);
                } else {
                    const value = game.modifiers[modifier];
                    description = printPlayerModifier(modifier, value, shouldRoundModifier(modifier, value) ? 2 : 0);
                }
                descriptions.push(description);

                map.forEach((value, key) => {
                    if (modifierData[modifier].isNegative) {
                        value *= -1;
                    }
                    if (typeof value === 'number') {
                        group.sum += value;
                    } else {
                        group.sum += Number(eval(value));
                    }
                    descriptions.push([key, value]);
                });
                group.block.push(descriptions);
            }
        });
        return groups;
    };
    
    const showBonuses = (title, block, final, actual, forCompare, afterTitleHtml = null) => {
        let html;
        if (afterTitleHtml) {
            html =  `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke text-success">${title}</h5> ${afterTitleHtml}`;
        } else {
            html =  `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke ${final > 0 ? 'text-success' : ''} ${final < 0 ? 'text-danger' : ''}">${final > 0 ? '+' : ''}${numToStr(final)}% ${title}</h5>`;
        }
        html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
    
        block.forEach((descriptions, i) => {
            if (i > 0) {
                html += '<tr><td><br></td><td></td></tr>'
            }
    
            const base = descriptions[0];
            html += `<tr style="text-align: left;"><td colspan="2" class="${base[1]}">${base[0]}</td></tr>`;
            descriptions.forEach((description, j) => {
                if (j > 0) {
                    html += `<tr style="text-align: left;"><td class="text-info">${description[0]}</td><td class="${base[1]}">${numToStr(description[1])}</td></tr>`;
                }
            });
        });
    
        // issues #3: new condition
        if (actual !== forCompare && numToStr(actual) !== forCompare) {
            html += `<tr><td>&nbsp</td></tr>`
            html += `<tr style="text-align: left;"><td class="text-warning">${actual} vs ${forCompare}</td><td></td></tr>`;
            html += `<tr style="text-align: left;"><td class="text-warning">Some sources were not found.</td><td></td></tr>`;
            html += `<tr style="text-align: left;"><td class="text-warning">Please report bugs if you like, thx.</td><td></td></tr>`;
        }
    
        html += '</table>'
    
        SwalLocale.fire({
            html: html
        });
    };
    
    const showBonusesNormal = (title, block, final, base, actual, percent) => {
        let html = '';
        html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
        html += `<tr style="text-align: left;"><td colspan="2" class="font-w600 font-size-sm mb-1 text-warning">Final = Base * (1 + %)</span></td></tr>`;
        html += `<tr style="text-align: left;"><td class="text-info">Final</td><td>${numToStr(final)}</td></tr>`;
        html += `<tr style="text-align: left;"><td class="text-info">Base</td><td>${numToStr(base)}</td></tr>`;
        html += `<tr style="text-align: left;"><td class="text-info">%</td><td>${percent}</td></tr>`;
        html += '</table>';
    
        showBonuses(title, block, 0, actual, final, html);
    };
    
    const showBonusesInterval = (title, block, final, base, actual, percent, flat) => {
        let html = '';
        html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
        html += `<tr style="text-align: left;"><td colspan="2" class="font-w600 font-size-sm mb-1 text-warning">Final = Base * (1 - %) - Flat</span></td></tr>`;
        html += `<tr style="text-align: left;"><td class="text-info">Final (Min: 250)</td><td>${final}</td></tr>`;
        html += `<tr style="text-align: left;"><td class="text-info">Base</td><td>${base}</td></tr>`;
        html += `<tr style="text-align: left;"><td class="text-info">%</td><td>${percent}</td></tr>`;
        html += `<tr style="text-align: left;"><td class="text-info">Flat</td><td>${flat}</td></tr>`;
    
        html += '</table>';
    
        showBonuses(title, block, 0, final, actual, html);
    };
    
    const percentTitle = '+__V__%';
    const secondTitle = '-__V__s';
    
    const appendGroup = (group, func, title) => {
        const extra = {
            sum: 0,
            descriptions: [[null, 'text-success']]
        };
    
        func(extra);
    
        if (extra.sum > 0) {
            group.sum += extra.sum;
            extra.descriptions[0][0] = `${templateLangString('PAGE_NAME_MISC_2')}: ${title.replace('__V__', title.endsWith('s') ? (extra.sum / 1000).toFixed(2) : numToStr(extra.sum))}`;
            group.block.push(extra.descriptions);
        }
    };
    
    // updateGrants
    const showXP = (iSkill) => {
        const careModifiers = [
            'increasedGlobalSkillXP', 'decreasedGlobalSkillXP',
            'increasedNonCombatSkillXP', 'decreasedNonCombatSkillXP',
            'increasedSkillXP', 'decreasedSkillXP',
        ];
        iSkill.appendModifiersForXP(careModifiers);
        const group = createDescriptionsGroup(careModifiers, iSkill.skill);
    
        appendGroup(group, iSkill.appendGroupForXP.bind(iSkill), percentTitle);
    
        const base = iSkill.getBaseXP();
        const final = base * (1 + group.sum / 100);
        const actual = iSkill.getActualXP();
    
        showBonusesNormal(templateLangString('MENU_TEXT_TOOLTIP_SKILL_XP',{xp:`${numToStr(final)}`}), group.block, final, base, actual, group.sum);
    };
    
    const showMasteryXP = (iSkill) => {
        const careModifiers = [
            'increasedGlobalMasteryXP', 'decreasedGlobalMasteryXP',
            'increasedMasteryXP', 'decreasedMasteryXP',
        ];
        iSkill.appendModifiersForMasteryXP(careModifiers);
        const group = createDescriptionsGroup(careModifiers, iSkill.skill);
    
        appendGroup(group, iSkill.appendGroupForMasteryXPWithAstrology.bind(iSkill), percentTitle);
    
        const base = iSkill.getBaseMasteryXP();
        const final = base * (1 + group.sum / 100);
        const actual = iSkill.getActualMasteryXP();
    
        showBonusesNormal(templateLangString('MENU_TEXT_TOOLTIP_MASTERY_XP',{value:`${numToStr(final)}`}), group.block, final, base, actual, group.sum);
    };
    
    const showInterval = (iSkill) => {
        const careModifiers = [
            ['increasedSkillIntervalPercent', 'decreasedSkillIntervalPercent', 'increasedGlobalSkillIntervalPercent', 'decreasedGlobalSkillIntervalPercent'],
            ['increasedSkillInterval', 'decreasedSkillInterval']
        ];
        iSkill.appendModifiersForInterval(careModifiers);

        const groups = createDescriptionsGroups(careModifiers, iSkill.skill);
    
        appendGroup(groups[0], iSkill.appendGroupForPercentageInterval.bind(iSkill), secondTitle);
        appendGroup(groups[1], iSkill.appendGroupForFlatInterval.bind(iSkill), secondTitle);
    
        const percent = groups[0].sum;
        const flat = groups[1].sum;
    
        const base = iSkill.getBaseInterval();
        const final = Math.max(250, roundToTickInterval(base * (1 - percent / 100) - flat));
        const actual = iSkill.getActualInterval();
    
        const block = Array.prototype.concat.apply([], [groups[0].block, groups[1].block]);
        showBonusesInterval(`${formatFixed(final/1000, 2)}s. ${getLangString('MENU_TEXT_TOOLTIP_INTERVAL')}`, block, final, base, actual, percent, flat);
    };
    
    const showDoubling = (iSkill) => {
        const careModifiers = [
            'increasedChanceToDoubleItemsGlobal', 'decreasedChanceToDoubleItemsGlobal',
            'increasedChanceToDoubleItemsSkill', 'decreasedChanceToDoubleItemsSkill',
        ];
        iSkill.appendModifiersForDoubling(careModifiers);
        const group = createDescriptionsGroup(careModifiers, iSkill.skill);
    
        appendGroup(group, iSkill.appendGroupForDoubling.bind(iSkill), percentTitle);
    
        const actual = iSkill.getActualDoubling();
    
        showBonuses(getLangString('MENU_TEXT_TOOLTIP_DOUBLE'), group.block, group.sum, actual, clampValue(group.sum, 0, 100));
    };
    
    const showPreservation = (iSkill) => {
        const careModifiers = [
            'increasedGlobalPreservationChance', 'decreasedGlobalPreservationChance',
            'increasedSkillPreservationChance', 'decreasedSkillPreservationChance',
        ];
        iSkill.appendModifiersForPreservation(careModifiers);
        const group = createDescriptionsGroup(careModifiers, iSkill.skill);
    
        appendGroup(group, iSkill.appendGroupForPreservation.bind(iSkill), percentTitle);
    
        const actual = iSkill.getActualPreservation();
    
        showBonuses(getLangString('MENU_TEXT_TOOLTIP_PRESERVE'), group.block, group.sum, actual, clampValue(group.sum, 0, 80)); // TODO
    };
    
    const showPerfectCook = (iSkill) => {
        if (!game.settings.enablePerfectCooking) {
            showBonuses(getLangString('MENU_TEXT_TOOLTIP_PERFECT_COOK'), [], 0, 0, 0);
            return;
        }
    
        const careModifiers = [
            'increasedChancePerfectCookGlobal', 'decreasedChancePerfectCookGlobal',
        ];
        iSkill.appendModifiersForPerfectCook(careModifiers);
        const group = createDescriptionsGroup(careModifiers, iSkill.skill);
    
        appendGroup(group, iSkill.appendGroupForPerfectCook.bind(iSkill), percentTitle);
    
        const actual = iSkill.getActualPerfectCook();
    
        showBonuses(getLangString('MENU_TEXT_TOOLTIP_PERFECT_COOK'), group.block, group.sum, actual, clampValue(group.sum, 0, 100));
    };
    
    const showCookingSuccess = (iSkill) => {
        const careModifiers = [
            'increasedChanceSuccessfulCook', 'decreasedChanceSuccessfulCook',
        ];
    
        const group = createDescriptionsGroup(careModifiers, iSkill.skill);
    
        appendGroup(group, iSkill.appendGroupForCookingSuccess.bind(iSkill), percentTitle);
    
        const actual = iSkill.getActualCookingSuccess();
    
        const chanceCap = 100 - game.modifiers.decreasedCookingSuccessCap;
    
        showBonuses(getLangString('MENU_TEXT_TOOLTIP_SUCCESSFUL_COOK'), group.block, group.sum, actual, clampValue(group.sum, 0, chanceCap));
    };

    ctx.api({
        showModifiersComeFrom,
        showSkillModifiers,
        showSkillItems,
    });

    ctx.onInterfaceReady(async (ctx) => {
        const headerTitle = document.getElementById('header-title');
        if (generalSettings.get('hidden-book-icon')) {
            headerTitle.onclick = () => showSkillModifiers();
        } else {
            const button = document.createElement('button');
            button.className = 'btn';
            button.onclick = () => showSkillModifiers();
            button.innerHTML = '<i class="fa fa-book-open mr-1 font-size-lg" style="color:white;"></i>';
            headerTitle.parentNode.parentNode.appendChild(button);
        }

        const registerGrants = (grants, iSkill) => {
            grants.xpIcon.container.onclick = () => showXP(iSkill);
            grants.masteryXPIcon.container.onclick = () => showMasteryXP(iSkill);
        }

        const registerInterval = (interval, iSkill) => {
            interval.container.onclick = () => showInterval(iSkill);
            interval.tooltip.setContent(intervalTooltip);
        }

        const registerArtisanMenu = (artisanMenu, iSkill) => {
            registerGrants(artisanMenu.grants, iSkill);
            registerInterval(artisanMenu.interval, iSkill);
            artisanMenu.productPreservation.container.onclick = () => showPreservation(iSkill);
            artisanMenu.productDoubling.container.onclick = () => showDoubling(iSkill);
        }

        registerArtisanMenu(herbloreArtisanMenu, new IHerblore());
        registerArtisanMenu(smithingArtisanMenu, new ISmithing());
        registerArtisanMenu(runecraftingArtisanMenu, new IRunecrafting());
        registerArtisanMenu(craftingArtisanMenu, new ICrafting());
        registerArtisanMenu(fletchingArtisanMenu, new IFletching());
        registerArtisanMenu(summoningArtisanMenu, new ISummoning());

        const iFiremaking = new IFiremaking();
        firemakingMenu.xpIcon.container.onclick = () => showXP(iFiremaking);
        firemakingMenu.masteryIcon.container.onclick = () => showMasteryXP(iFiremaking);
        registerInterval(firemakingMenu.intervalIcon, iFiremaking);

        cookingMenus.forEach((cookingMenu, category) => {
            const iSkill = new ICooking(category);
            registerGrants(cookingMenu.grants, iSkill);
            cookingMenu.bonuses.preserve.container.onclick = () => showPreservation(iSkill);
            cookingMenu.bonuses.double.container.onclick = () => showDoubling(iSkill);
            cookingMenu.bonuses.perfect.container.onclick = () => showPerfectCook(iSkill);
            cookingMenu.bonuses.success.container.onclick = () => showCookingSuccess(iSkill);
        });

        thievingMenu.areaPanels.forEach((panel) => {
            const iSkill = new IThieving(panel);
            panel.infoBox.xp.container.onclick = () => showXP(iSkill);
            panel.infoBox.masteryXP.container.onclick = () => showMasteryXP(iSkill);
            registerInterval(panel.infoBox.interval, iSkill);
            panel.infoBox.double.container.onclick = () => showDoubling(iSkill);
        });

        const iAltMagic = new IAltMagic();
        altMagicMenu.grants.xpIcon.container.onclick = () => showXP(iAltMagic);
        registerInterval(altMagicMenu.interval, iAltMagic);
        altMagicMenu.doublingIcon.container.onclick = () => showDoubling(iAltMagic);

        astrologyMenus.infoPanel.doublingChance.container.onclick = () => showDoubling(new IAstrology());
        astrologyMenus.constellations.forEach((menu, constellation) => {
            const iSkill = new IAstrology(constellation);
            menu.xpIcon.container.onclick = () => showXP(iSkill);
            menu.masteryIcon.container.onclick = () => showMasteryXP(iSkill);
            registerInterval(menu.intervalIcon, iSkill);
        });

        fishingAreaMenus.forEach((menu, area) => {
            const iSkill = new IFishing(area);
            menu.xpIcon.container.onclick = () => showXP(iSkill);
            menu.masteryIcon.container.onclick = () => showMasteryXP(iSkill);
        });


        // only AoD can access
        if (cloudManager.hasAoDEntitlement) {
            archaeologyMenus.digSites.forEach((menu, digSite) => {
                const iSkill = new IArchaeology(digSite);
                menu.xpIcon.container.onclick = () => showXP(iSkill);
                menu.masteryIcon.container.onclick = () => showMasteryXP(iSkill);
                menu.doublingIcon.container.onclick = () => showDoubling(iSkill);
                registerInterval(menu.intervalIcon, iSkill);
            });


            const iCartographyHex = new ICartography();
            let menu = cartographyMap.surveyOverview;
            menu.xpIcon.container.onclick = () => showXP(iCartographyHex);
            registerInterval(menu.intervalIcon, iCartographyHex);

            const iCartographyPaperMaking = new ICartography('PaperMaking');
            menu = cartographyMapCreateMenu.paperMakingMenu;
            menu.grants.xpIcon.container.onclick = () => showXP(iCartographyPaperMaking);
            menu.doublingIcon.container.onclick = () => showDoubling(iCartographyPaperMaking);
            menu.preserveIcon.container.onclick = () => showPreservation(iCartographyPaperMaking);
            registerInterval(menu.intervalIcon, iCartographyPaperMaking);

            const iCartographyMapUpgrade = new ICartography('MapUpgrade');
            menu = cartographyMapCreateMenu.mapUpgradeMenu
            menu.grants.xpIcon.container.onclick = () => showXP(iCartographyMapUpgrade);
            menu.preserveIcon.container.onclick = () => showPreservation(iCartographyMapUpgrade);
            registerInterval(menu.intervalIcon, iCartographyMapUpgrade);
        }
    });
}

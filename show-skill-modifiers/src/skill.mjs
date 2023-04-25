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

export {
    IHerblore,
    ISmithing,
    IRunecrafting,
    ICrafting,
    IFletching,
    ISummoning,
    ICooking,
    IThieving,
    IAltMagic,
    IAstrology,
    IFishing,
    IFiremaking,
}

const ctx = mod.getContext(import.meta);
const generalSettings = ctx.settings.section("General");

// const generalSettings = new Map()

const queryCache = new Map();

const showSkillModifiers = () => {
  var localID = game.openPage._localID;
  if (localID === "CompletionLog" || localID === "Lore" || localID === "Statistics" || localID === "Settings") {
    return;
  }

  const skills = game.openPage.skills;
  const skill = skills && skills.length == 1 ? skills[0] : null;

  console.log(skill, localID);
  queryCache.clear();

  var groups = [];

  groups.push(makeCharge(skill, localID));
  groups.push(makeXP(skill, localID));

  if (skill) {
    groups.push(makeMasteryXP(skill, localID));
    groups.push(makeDouble(skill, localID));
    groups.push(makeAdditionalItems(skill, localID));
    groups.push(makeInterval(skill, localID));
    groups.push(makePreservation(skill, localID));
    groups.push(makeCurrency(skill, localID))
  }

  if (localID == 'Combat') {
    groups.push(makeForCombatDoubleAndCurrency())
    groups.push(makeForCombatFood())
    groups.push(makeForCombatDamage())
  }

  groups.push(makeOthers(skill, localID));

  viewModifiers(game.openPage.name, skill, groups);
};

const showSources = (text, isNegative, isDisabled, backFunction = undefined) => {
  text = decodeURIComponent(text)
  const description = { text, isNegative, isDisabled };
  const entries = queryCache.get(text);
  let html = getElementHTMLDescriptionFormatter("h5", "font-w400 font-size-sm mb-1", false)(description);
  html += '<table class="font-w400 font-size-sm mb-1" style="margin: auto; border-collapse: unset;">';
  entries.forEach((x) => {
    let textClass = "";
    let textClassFlag = x.data.value > 0 ? 1 : x.data.value < 0 ? -1 : 0;
    if (textClassFlag != 0) {
      if (x.modValue.modifier.inverted) {
        textClassFlag *= -1;
      }
      textClass = textClassFlag > 0 ? "text-success" : "text-warning";
    }

    let objectName = x.data.source.constructor.name;
    if (objectName == "Object") {
      objectName = "-";
    }
    html += `<tr style="text-align: left;"><td>${objectName}</td><td class="text-info">${x.data.source.name}</td><td class="${textClass}">${x.data.value}</td></tr>`;
  });
  html += "</table>";
  if (backFunction) {
    SwalLocale.fire({
      html: html,
      showCancelButton: true,
      confirmButtonText: getLangString("ASTROLOGY_BTN_2"),
      cancelButtonText: getLangString("FARMING_MISC_24"),
    }).then((result) => {
      if (result.value) {
        backFunction();
      }
    });
  } else {
    SwalLocale.fire({
      html: html,
    });
  }
};

function viewModifiers(name, skill, groups) {
  let html = `<h5 class="font-w600 font-size-sm mb-1 text-combat-smoke">${name}</h5>`;
  if (skill && skill.hasMastery) {
    if (generalSettings.get("show-checkpoints")) {
      skill.getRealmsWithMastery().forEach((realm) => {
        const bonuses = skill.getMasteryPoolBonusesInRealm(realm);
        if (bonuses.length > 0) {
          const progress = skill.getMasteryPoolProgress(realm);
          bonuses.forEach((bonus) => {
            const active = progress >= bonus.percent;
            const show = active || generalSettings.get("show-locked-checkpoints");
            if (show) {
              html += getSpansFromModifierObject(
                bonus.modifiers,
                1,
                1,
                `font-w400 font-size-sm mb-1 ${active ? "" : "text-warning"}`
              )
                .map(
                  (x) =>
                    x.outerHTML + `${active ? "" : '<span class="font-w600 font-size-sm text-danger"> Locked</span>'}`
                )
                .join("<br>");
              html += "<br>";
            }
          });
          html += "<br>";
        }
      });
    } else {
      html += `<h5 class="font-w600 font-size-sm mb-3 text-warning"><small>(Does not include ${getLangString(
        "MENU_TEXT_MASTERY_POOL_CHECKPOINTS"
      )})</small></h5>`;
    }
  }

  let todoFlag = true;

  groups.forEach((group) => {
    if (group && group.length > 0) {
      todoFlag = false;
      group.forEach((description) => {
        const line = getElementHTMLDescriptionFormatter("h5", "font-w400 font-size-sm mb-1", false)(description);
        html += line.replace("</h5>", "");
        html += ` <button class="btn-primary" style="border: 0px;" onclick="mod.api.ShowSkillModifiers.showSources('${encodeURIComponent(description.text)}', ${description.isNegative}, ${description.isDisabled}, mod.api.ShowSkillModifiers.showSkillModifiers);">more</button></h5>`;
      });
      html += "<br>";
    }
  });

  if (todoFlag) {
    html += `<h5 class="font-w600 font-size-sm mb-3 text-warning">TODO</h5>`;
  }

  SwalLocale.fire({
    html: html,
  });
}

class MyModifierValue {
  constructor(modValue) {
    this.modValue = modValue;
    this.entries = [];
  }
}

function mergedModifierID(modifierID) {
  const idEntries = game.modifiers.entriesByID.get(modifierID);
  if (!idEntries) return null;

  const merged = new Map();
  idEntries.forEach((entry) => {
    const queryKey = ModifierTable.getQueryKey(entry.data.scope);
    let myValue = merged.get(queryKey);
    if (myValue === undefined) {
      myValue = new MyModifierValue(new ModifierValue(entry.data.modifier, entry.data.value, entry.data.scope));
      merged.set(queryKey, myValue);
    } else {
      myValue.modValue.value += entry.data.value;
    }
    myValue.entries.push(entry);
  });
  return merged;
}

// 0: options.skill,
// 1: options.damageType,
// 2: options.realm,
// 3: options.currency,
// 4: options.category,
// 5: options.action,
// 6: options.subcategory,
// 7: options.item,
// 8: options.effectGroup,
function filterModifiers(modifierID, skills) {
  const descriptions = [];
  const merged = mergedModifierID(modifierID);
  if (merged) {
    Array.from(merged.keys())
      .sort()
      .forEach((key) => {
        const queryArr = key.split("-");

        let care = false;
        if (queryArr[5].length == 0) {
          // except ACTION.
          // filter SKILL
          if (key.startsWith("-")) {
            care = true;
          } else if (skills && skills.length > 0) {
            for (let skill of skills) {
              if (skill && key.startsWith(skill.id)) {
                care = true
                break
              }
            }
          }
        }

        // console.log(care, key, merged.get(key), merged.get(key).modValue.print())

        if (care) {
          const myModValue = merged.get(key);
          if (myModValue.modValue.value != 0) {
            const description = myModValue.modValue.print();
            queryCache.set(description.text, myModValue.entries);
            descriptions.push(description);
          }
        }
      });
  }
  return descriptions;
}

// skillData: skill or skills
function caresToDescriptions(cares, skillData) {
  const descriptions = [];
  let skills = []
  if (skillData) {
    if (skillData instanceof Array) {
      skills = skillData
    } else {
      skills.push(skillData)
    }
  }

  cares.forEach((care) => {
    descriptions.push(...filterModifiers(care, skills));
  });

  return descriptions;
}

function makeXP(skill, localID) {
  const inCombat = localID === 'Combat' 
  const isCombat = inCombat || (skill && skill.isCombat)

  const cares = [];
  cares.push("melvorD:skillXP");
  if (!isCombat) {
    cares.push("melvorD:nonCombatSkillXP");
  }

  if (skill == game.runecrafting) {
    cares.push("melvorD:runecraftingBaseXPForRunes");
  }
  if (skill == game.agility) {
    cares.push("melvorD:xpFromNegativeObstacles");
  } else if (skill == game.archaeology) {
    cares.push("melvorD:archaeologyCommonItemSkillXP");
  } else if (localID == "AltMagic") {
    cares.push("melvorD:nonCombatSkillXP");
    cares.push("melvorD:altMagicSkillXP");
  }

  cares.push("melvorD:halveSkillXP");

  // A XP
  cares.push("melvorD:abyssalSkillXP");
  if (isCombat) {
    cares.push("melvorD:abyssalCombatSkillXP");
  }
  if (skill == game.runecrafting) {
    cares.push("melvorD:runecraftingBaseAXPForRunes");
  }

  if (inCombat) {
    return caresToDescriptions(cares, [game.attack, game.strength, game.defence, game.hitpoints, game.ranged, game.altMagic, game.prayer, game.slayer, game.corruption])
  }

  return caresToDescriptions(cares, skill);
}

function makeMasteryXP(skill, localID) {
  const cares = [];
  if (skill && skill.hasMastery) {
    cares.push("melvorD:masteryPoolCap");
    cares.push("melvorD:masteryXP");
    cares.push("melvorD:halveMasteryXP")
    // TODO: astrology
    if (skill == game.agility) {
      cares.push("melvorD:masteryXPFromNegativeObstacles");
    }
  }
  return caresToDescriptions(cares, skill);
}

function makeCurrency(skill, localID) {
  const cares = [];
  if (skill) {
    if (skill == game.agility || skill == game.thieving) {
      cares.push(...["melvorD:currencyGainBasedOnProduct", "melvorD:currencyGain", "melvorD:flatCurrencyGain"]);
    }
  }
  return caresToDescriptions(cares, skill);
}

function makeInterval(skill, localID) {
  const cares = [];
  cares.push("melvorD:flatSkillInterval");
  cares.push("melvorD:skillInterval");
  cares.push("melvorD:halveSkillInterval");
  return caresToDescriptions(cares, skill);
}

function makePreservation(skill, localID) {
  const cares = [];
  if (skill instanceof CraftingSkill) {
    if (localID != "AltMagic") {
      cares.push("melvorD:skillPreservationChance");
      cares.push("melvorD:bypassGlobalPreservationChance");
    }
    cares.push("melvorD:skillPreservationCap");

    // CostReduction
    cares.push("melvorD:skillCostReduction");

    if (skill == game.runecrafting) {
      cares.push("melvorD:runecraftingRuneCostReduction");
    } else if (skill == game.smithing) {
      cares.push(...["melvorD:smithingCoalCost", "melvorD:flatSmithingCoalCost", "melvorD:removeSmithingCoalCosts"]);
    } else if (skill == game.summoning) {
      cares.push("melvorD:nonShardSummoningCostReduction");
    }
  }
  return caresToDescriptions(cares, skill);
}

function makeDouble(skill, localID) {
  const cares = [];
  cares.push("melvorD:globalItemDoublingChance");
  cares.push("melvorD:skillItemDoublingChance");
  if (skill == game.woodcutting) {
    cares.push("melvorD:halveWoodcuttingDoubleChance");
  }

  if (skill) {
    cares.push(
      ...[
        "melvorD:flatBasePrimaryProductQuantity",
        "melvorD:flatBasePrimaryProductQuantityChance",
        "melvorD:basePrimaryProductQuantity",
        "melvorD:additionalPrimaryProductChance",
        "melvorD:additional2PrimaryProductChance",
        "melvorD:additional3PrimaryProductChance",
        "melvorD:additional5PrimaryProductChance",
        "melvorD:additional8PrimaryProductChance",
        "melvorD:flatAdditionalPrimaryProductQuantity",
        "melvorD:doubleItemsSkill",
        "melvorD:bypassDoubleItemsSkill",
      ]
    );
  }
  return caresToDescriptions(cares, skill);
}

function makeAdditionalItems(skill, localID) {
  const cares = [];
  cares.push(
    ...[
      "melvorD:additionalRandomSkillItemChance",
      "melvorD:additionalRandomSkillItemChancePerInterval",
      "melvorD:flatAdditionalSkillItem",
      "melvorD:additionalRandomGemChance",
      "melvorD:additionalRandomAbyssalGemChance",
      "melvorD:additionalRandomAbyssalGemChancePerInterval",
      "melvorD:additionalRandomFragmentChance",
      "melvorD:additionalRandomFiremakingOilChance",
    ]
  );
  return caresToDescriptions(cares, skill);
}

function makeCharge(skill, localID) {
  const cares = [];
  let potion = false
  let summoning = false

  if (skill) {
    potion = skill != game.township
    summoning = potion && skill != game.farming
  } else if (localID === 'Combat') {
    potion = true
    summoning = true
  }
  if (potion) {
    cares.push("melvorD:flatPotionCharges");
    cares.push("melvorD:potionChargePreservationChance");
  }

  if (summoning) {
    cares.push("melvorD:summoningChargePreservationChance");
    cares.push("melvorD:summoningChargePreservationChanceBypass");
  }

  if (localID === 'Combat') {
    cares.push(...[
      "melvorD:foodPreservationChance",
      "melvorD:flatPrayerPointCost",
      "melvorD:prayerPointPreservationChance",
      "melvorD:unholyPrayerPointPreservationChance",
      "melvorD:flatSoulPointsPerMonsterKill",
      "melvorD:flatSoulPointCost",
      "melvorD:soulPointCost",
      "melvorD:soulPointPreservationChance",
      "melvorD:soulPointPreservationChanceBypass",
      "melvorD:permanentCorruptionCost",
      "melvorD:ammoPreservationChance",
      "melvorD:runePreservationChance"
    ])
  }

  return caresToDescriptions(cares, skill);
}

function makeOthers(skill, localID) {
  const cares = [];

  // RandomProduct
  if (skill == game.woodcutting || skill == game.astrology || skill == game.firemaking) {
    cares.push(...["melvorD:randomProductChance", "melvorD:flatBaseRandomProductQuantity"]);
  }

  if (skill && skill.hasMastery) {
    cares.push("melvorD:offItemChance");
    cares.push("melvorD:flatMasteryTokens")
  }

  switch (skill) {
    case game.woodcutting:
      cares.push(
        ...[
          "melvorD:treeCutLimit",
          "melvorD:woodcuttingXPAddedAsFiremakingXP",
          "melvorD:woodcuttingAXPAddedAsFiremakingAXP",
          "melvorD:woodcuttingArrowShaftChance",
          "melvorD:woodcuttingJewelryChance",
          "melvorD:woodcuttingDrakeNestJewelryChance",
          "melvorD:additionalItemBasedOnPrimaryQuantityChance",
        ]
      );
      break;
    case game.fishing:
      cares.push(
        ...[
          "melvorD:fishingSpecialChance",
          "melvorD:cannotFishJun",
          "melvorD:bonusFishingSpecialChance",
          "melvorD:fishingMasteryDoublingChance",
          "melvorD:fishingCurrencyGainChance",
          "melvorD:fishingAdditionalSpecialItemChance",
          "melvorD:additionalSameAreaFishChance",
          "melvorD:summoningSynergy_4_5",
          "melvorD:fishingCookedChance",
        ]
      );
      break;
    case game.firemaking:
      cares.push(...["melvorD:firemakingLogCurrencyGain", "melvorD:firemakingBonfireInterval", "melvorD:freeBonfires"]);
      break;
    case game.cooking:
      cares.push(
        ...[
          "melvorD:passiveCookingInterval",
          "melvorD:successfulCookChance",
          "melvorD:cookingSuccessCap",
          "melvorD:perfectCookChance",
          "melvorD:additionalPerfectItemChance",
          "melvorD:autoEquipFoodUnlocked",
          "melvorD:flatCoalGainedOnCookingFailure",
          "melvorD:flatAbyssalGemsGainedOnCookingFailure",
        ]
      );
      break;
    case game.mining:
      cares.push(
        ...[
          "melvorD:miningGemChance",
          "melvorD:qualitySuperiorGemChance",
          "melvorD:abyssalGemChance",
          "melvorD:summoningSynergy_4_5",
          "melvorD:bonusCoalMining",
          "melvorD:miningBarChance",
          "melvorD:noMiningNodeDamageChance",
          "melvorD:flatMiningNodeHP",
          "melvorD:miningNodeRespawnInterval",
          "melvorD:gemVeinChance",
          "melvorD:abyssalGemVeinChanceIncrease",
        ]
      );
      break;
    case game.smithing:
      // No
      break;
    case game.thieving:
      cares.push(
        ...[
          "melvorD:thievingAreaUniqueChance",
          "melvorD:thievingAreaUniqueChancePercent",
          "melvorD:thievingStunAvoidanceChance",
          "melvorD:thievingStunInterval",
          "melvorD:thievingStealth",
          "melvorD:summoningSynergy_Octopus_Leprechaun",
          "melvorD:minThievingCurrencyGain",
          "melvorD:flatThievingCurrencyGain",
          "melvorD:summoningSynergy_Abyssal_Leprechaun_Devil",
          "melvorD:summoningSynergy_Leprechaun_Devil",
          "melvorD:summoningSynergy_Ent_Leprechaun",
          "melvorD:flatDrakeNestsFromThievingTreant",
          "melvorD:thievingAutoSellPrice",
          "melvorD:flatAdditionalThievingCommonDropQuantity",
          "melvorD:thievingMinerRandomBarChance",
          "melvorD:thievingFarmerHerbSackChance",
          "melvorD:randomBarThievingWitheringRuinsChance",
          "melvorD:ignoreThievingDamage",
          "melvorD:ignoreThievingDamageChance",
        ]
      );
      break;
    case game.fletching:
      cares.push(...["melvorD:fletchingItemToCurrencyChance"]);
      break;
    case game.crafting:
      cares.push(
        ...[
          "melvorD:flatCraftingDragonhideCost",
          "melvorD:craftingEnchantedUrnChance",
          "melvorD:crafting30CurrencyGainChance",
        ]
      );
      break;
    case game.runecrafting:
      cares.push(
        ...[
          "melvorD:runecraftingRuneCostReduction",
          "melvorD:elementalRuneChance",
          "melvorD:elementalRuneQuantity",
          "melvorD:giveRandomComboRunesRunecrafting",
        ]
      );
      break;
    case game.herblore:
      cares.push(...["melvorD:randomHerblorePotionChance"]);
      break;
    case game.agility:
      cares.push(
        ...[
          "melvorD:agilityPillarCost",
          "melvorD:currencyGainFromNegativeObstacles",
          "melvorD:currencyGainFromAgilityPerActiveObstacle",
          "melvorD:halveAgilityObstacleNegatives",
          "melvorD:agilityObstacleCost",
          "melvorD:agilityObstacleCurrencyCost",
          "melvorD:agilityObstacleItemCost",
          "melvorD:agilityItemCostReductionCanReach100",
        ]
      );
      break;
    case game.summoning:
      cares.push(
        ...[
          "melvorD:disableSalamanderItemReduction",
          "melvorD:nonShardSummoningCostReduction",
          "melvorD:flatSummoningShardCost",
          "melvorD:flatTier1SummoningShardCost",
          "melvorD:flatTier2SummoningShardCost",
          "melvorD:flatTier3SummoningShardCost",
          "melvorD:unlockAllSummoningSynergies",
        ]
      );
      break;

    case game.astrology:
      cares.push(...["melvorD:meteoriteLocationChance", "melvorD:starFallChance", "melvorD:astrologyModifierCost"]);
      break;
    case game.cartography:
      cares.push(
        ...[
          "melvorD:cartographyPaperMakingInterval",
          "melvorD:cartographyMapUpgradeInterval",
          "melvorD:cartographySurveyInterval",
          "melvorD:cartographyTravelCost",
          "melvorD:cartographySurveyXP",
          "melvorD:mapRefinementCost",
          "melvorD:travelEventChance",

          "melvorD:mapUpgradeActions",
          "melvorD:initialMapArtefactValues",
          "melvorD:tinyArtefactChance",
          "melvorD:smallArtefactChance",
          "melvorD:mediumArtefactChance",
          "melvorD:largeArtefactChance",
        ]
      );
      break;
    case game.archaeology:
      cares.push(
        ...[
          "melvorD:sieveToolLevel",
          "melvorD:trowelToolLevel",
          "melvorD:brushToolLevel",
          "melvorD:shovelToolLevel",
          "melvorAoD:digSiteMapSlots",
          "doubleConsumablesArchaeology",
          "melvorD:flatCurrencyGainPerArchaeologyLevelNoArtefact",
          "melvorD:archaeologyCommonItemSkillXP",
          "melvorAoD:artefactValue",
          "melvorAoD:mapChargePreservationChance",
          "melvorD:archaeologyVeryRareMapPreservation",
        ]
      );
      break;
    case game.harvesting:
      cares.push(
        ...[
          "melvorD:harvestingUniqueProductChance",
          "melvorD:summoningSynergy_Imp_Devil",
          "melvorD:currencyFromHarvestingChanceBasedOnLevel",
          "melvorD:flatHarvestingIntensity",
          "melvorD:doubleHarvestingIntensityChance",
          "melvorItA:noHarvestingIntensityDecay",
          "melvorD:minimumHarvestingIntensity",
          "melvorItA:maxHarvestingIntensity",
        ]
      );

      break;
    case game.farming:
      cares.push(
        ...[
          "melvorD:farmingSeedCost",
          "melvorD:flatFarmingSeedCost",
          "melvorD:farmingCropsCannotDie",
          "melvorD:farmingSeedReturn",
          "melvorD:regainAbyssalTreeSeedChance",
          "melvorD:compostPreservationChance",
          "melvorD:bypassCompostPreservationChance",
          "melvorD:freeCompost",
        ]
      );
      break;
    case game.township:
      cares.push(
        ...[
          "melvorD:minimumTownshipBuildingEfficiency",
          "melvorD:enableNightfallSeason",
          "melvorD:enableSolarEclipseSeason",
          "melvorD:enableLemonSeason",
          "melvorD:enableEternalDarknessSeason",
          "melvorD:townshipTaxPerCitizen",
          "melvorD:townshipHealth",
          "melvorD:disableTownshipHealthDegradation",
          "melvorD:flatTownshipHappiness",
          "melvorD:townshipHealth",
          "melvorD:flatTownshipEducation",
          "melvorD:flatTownshipPopulation",
          "melvorD:townshipMaxStorage",
          "melvorD:townshipMaxSoulStorage",
          "melvorD:townshipBuildingCost",
          "melvorD:townshipRepairCost",
          "melvorD:townshipGPProduction",
          "melvorD:abyssalWaveAPGain",
          "melvorD:abyssalWaveASCGain",
          "melvorD:townshipBuildingProduction",
          "melvorD:townshipResourceProduction",
          "melvorD:townshipTraderCost",
        ]
      );
      break;
    default:
      break;
  }

  switch (localID) {
    case "AltMagic":
      cares.push(
        ...[
          "melvorD:runePreservationChance",
          "melvorD:altMagicRunePreservationChance",
          "melvorD:gpFromItemAlchemy",
          "melvorD:flatAdditionalHolyDustFromBlessedOffering",
        ]
      );
      break;
    case "Bank":
      cares.push(
        ...[
          "melvorD:bankSpace",
          "melvorD:itemSaleCurrencyGain",
          "melvorD:currencyGainFromLogSales",
          "melvorD:currencyGainFromRawFishSales",
          "melvorD:flatPrayerPointsFromBurying",
          "melvorD:prayerPointsFromBurying",
          "melvorD:flatSoulPointsFromReleasing",
          "melvorD:xpFromMasteryTokens",
        ]
      );
      break;

    default:
      break;
  }

  return caresToDescriptions(cares, skill);
}

function makeForCombatDoubleAndCurrency() {
  const cares = [];
  cares.push(...["melvorD:globalItemDoublingChance", "melvorD:combatLootDoublingChance"]);
  cares.push(...["melvorD:currencyGainBasedOnProduct", "melvorD:currencyGain", "melvorD:flatCurrencyGain"]);

  return caresToDescriptions(cares, null);
}

function makeForCombatFood() {
  const cares = [];

  cares.push(
    ...["melvorD:autoEatEfficiency", "melvorD:autoEatThreshold", "melvorD:autoEatHPLimit", "melvorD:foodHealingValue"]
  );
  return caresToDescriptions(cares, null);
}

function makeForCombatDamage() {
  const cares = [];

  cares.push(
    ...[
      "melvorD:damageDealtToBosses",
      "melvorD:damageDealtToSlayerTasks",
      "melvorD:damageDealtToAllMonsters",
      // "melvorD:meleeStrengthBonus",
      // "melvorD:rangedStrengthBonus",
      // "melvorD:magicDamageBonus",
      // "melvorD:rangedStrengthBonusWith2HWeapon",
      // "melvorD:magicDamageBonusWith2HWeapon",
    ]
  );
  return caresToDescriptions(cares, null);
}

export { showSkillModifiers, showSources };

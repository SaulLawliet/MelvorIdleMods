const ctx = mod.getContext(import.meta);
const generalSettings = ctx.settings.section('General');

const { ModifiersComeFrom } = await ctx.loadModule('src/modifiers-come-from.mjs');

const showModifiersComeFrom = (modifier, modifierValue, skillId, showBackButton = false) => {
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
    if (showBackButton) {
        SwalLocale.fire({
            html: html,
            showCancelButton: true,
            confirmButtonText: getLangString('ASTROLOGY_BTN_2'),
            cancelButtonText: getLangString('FARMING_MISC_24'),
        }).then((result) => {
            if (result.value) {
                showSkillModifiers();
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
    passives += `<h5 class="font-w600 font-size-sm mb-3 text-warning"><small></small></h5>`;
    if (!generalSettings.get('show-checkpoints') && skill && skill.hasMastery) {
        passives += `<h5 class="font-w600 font-size-sm mb-3 text-warning"><small>(Does not include ${getLangString('MENU_TEXT_MASTERY_POOL_CHECKPOINTS')})</small></h5>`;
    }
    passives += descriptions.map(([text, textClass, key, value, skill]) => {
        let html = `<h5 class="font-w400 font-size-sm mb-1 ${textClass}">${text}`;
        if (key && !generalSettings.get('hidden-more-button')) {
            html += ` <button class="btn-primary" style="border: 0px;" onclick="mod.api.ShowSkillModifiers.showModifiersComeFrom('${key}', ${value}, '${skill ? skill.id : null}', true);">more</button>`
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

export {
    showModifiersComeFrom,
    showSkillModifiers,
}

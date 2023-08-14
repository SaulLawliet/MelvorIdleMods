const ctx = mod.getContext(import.meta);

const { ModifiersComeFrom } = await ctx.loadModule('src/modifiers-come-from.mjs');

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
                group.sum += value;
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

export {
    showXP,
    showMasteryXP,
    showInterval,
    showDoubling,
    showPreservation,
    showPerfectCook,
    showCookingSuccess,
}

export function setup(ctx) {
    // 2022-11-02: Fixed by official
    // PalladiumPot: increasedSkillIntervalPercent => decreasedSkillIntervalPercent
    // ctx.patch(Shop, "postDataRegistration").after(function () {
    //     const palladiumPot = game.shop.purchases.registeredObjects.get('melvorTotH:PalladiumPot');
    //     if (palladiumPot) {
    //         const modifiers = palladiumPot.contains.modifiers;
    //         if (modifiers && 'increasedSkillIntervalPercent' in modifiers) {
    //             modifiers.decreasedSkillIntervalPercent = modifiers.increasedSkillIntervalPercent;
    //             delete(modifiers.increasedSkillIntervalPercent);
    //         }
    //     }
    // });

    // Top-Right Equipment List Show: Suit's color.
    ctx.onInterfaceReady(async (ctx) => {
        for (const data of Object.values(equipmentSlotData)) {
            for (const elem of getEquipmentImageElements(data.id)) {
                if (elem) {
                    elem.classList.add('border-combat-outline');
                }
            }
        }
    });

    // Load Blueprint Elite Pillar error
    ctx.patch(Agility, 'replaceCourseWithBlueprint').replace(function(o, blueprint) {
        const numUnlocked = this.numObstaclesUnlocked;
        for (let tier = 0; tier < numUnlocked; tier++) {
            const obstacle = blueprint.obstacles.get(tier);
            if (obstacle !== undefined) {
                if (!this.isObstacleBuilt(obstacle))
                    this.buildObstacle(obstacle);
            } else {
                this.destroyObstacle(tier);
            }
        }
        if (blueprint.pillar !== undefined && !this.isPillarBuilt(blueprint.pillar))
            this.buildPillar(blueprint.pillar);
        if (blueprint.elitePillar !== undefined && !this.isElitePillarBuilt(blueprint.elitePillar))
            // this.buildPillar(blueprint.elitePillar);
            this.buildElitePillar(blueprint.elitePillar); // change this line
    });

    // Mining Gloves: Consumed only by mining Ore
    ctx.onCharacterLoaded(async (ctx) => {
        const consumesChargesOn = game.items.getObjectByID('melvorD:Mining_Gloves').consumesChargesOn
        if (consumesChargesOn && consumesChargesOn.length == 1 && consumesChargesOn[0] instanceof MiningActionEventMatcher && !consumesChargesOn[0].oreTypes) {
            consumesChargesOn[0].oreTypes = new Set(['Ore']);
        }
    });
}

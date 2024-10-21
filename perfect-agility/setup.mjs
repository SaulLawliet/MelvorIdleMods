export function setup(ctx) {

  // 1. No debuffs
  ctx.patch(Agility, "getObstacleNegMult").replace(function (o, obstacle, checkSelfModifiers) {
    return 0;
  });

  // 2. Add all obstacles. (You need to build at least once)
  ctx.patch(Agility, "forEachActiveObstacle").replace(function (o, obstacleCallback, pillarCallback) {
    this.courses.forEach((course) => {
      const maxTier = course.numObstaclesUnlocked;
      let numSequentiallybuilt = 0;
      for (let tier = 0; tier < maxTier; tier++) {
        const obstacle = course.builtObstacles.get(tier);
        if (obstacle === undefined || obstacle instanceof DummyObstacle) {
          break;
        } else {
          numSequentiallybuilt++;

          // Edit here
          // obstacleCallback(obstacle);
          this.actions.allObjects.forEach((x) => {
            if (x.category == obstacle.category && x.realm.id == obstacle.realm.id) {
              if (this.getObstacleBuildCount(x) > 0) {
                obstacleCallback(x);
              }
            }
          });
        }
      }
      course.pillarSlots.forEach((slot, tier) => {
        const builtPillar = course.builtPillars.get(tier);
        if (this.isSlotUnlocked(slot) && numSequentiallybuilt >= slot.obstacleCount && builtPillar !== undefined) {

          // Edit here
          // pillarCallback(builtPillar);
          this.pillars.allObjects.forEach((x) => {
            if (x.category == builtPillar.category && x.realm.id == builtPillar.realm.id) {
              pillarCallback(x);
            }
          });
        }
      });
    });
  });

  // Show active Count
  ctx.patch(BuiltAgilityObstacleElement, 'setBuiltObstacle').after(function (returnValue, obstacle) {
    let totalCount = 0;
    let activeCount = 0;
    game.agility.actions.allObjects.forEach((x) => {
      if (x.category == obstacle.category && x.realm.id == obstacle.realm.id) {
        totalCount++;
        if (game.agility.getObstacleBuildCount(x) > 0) {
          activeCount++;
        }
      }
    });

    this.tierName.textContent += ` (${activeCount} / ${totalCount})`;
    if (activeCount >= totalCount) {
      this.tierName.classList.add('text-success');
    } else {
      this.tierName.classList.remove('text-success');
    }
  });
}

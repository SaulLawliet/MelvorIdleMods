export function setup(ctx) {

    const calcPrice = (altRecipe) => {
        let shopPrice = 0;
        let itemPrice = 0;
        let qtyStr = '';
        altRecipe.items.forEach(({
            item,
            quantity
        }) => {
            const purchase = game.shop.getQuickBuyPurchase(item);
            if (purchase) {
                shopPrice += purchase.costs.gp.cost * quantity; // must be gp?
            } else {
                itemPrice += item.sellsFor * quantity;
                if (qtyStr.length > 0) qtyStr += ' | ';
                qtyStr += `${numberWithCommas(game.bank.getQty(item))} Qty`
            }
        });
        let ret = ''
        if (shopPrice > 0 && itemPrice == 0) {
            ret = `${numberWithCommas(shopPrice)} GP`;
        }
        if (itemPrice > 0) {
            if (ret.length > 0) ret += ' | ';
            ret += `${numberWithCommas(itemPrice)} GP`;
        }
        if (qtyStr.length > 0) {
            if (ret.length > 0) ret += ' # ';
            ret += qtyStr;
        }
        return ret;
    }

    ctx.patch(ArtisanMenu, "setRecipeDropdown").after(function (returnValue, altRecipeIngredients, selectCallback, displayOrder) {
        this.recipeDropdown.optionsContainer.children.forEach((a, i) => {
            const div = a.getElementsByClassName('gutters-tiny')[0];
            const span = document.createElement('span');
            span.style.cssText = "display: flex; align-items: center;";
            span.innerText = calcPrice(altRecipeIngredients[i]);
            div.appendChild(span);
        });
    });

    // Show Agility Cost Item
    ctx.patch(AgilityObstacleSelection, 'setCosts').replace(function (o, items, gpReq, scReq) {
        this.costContainer.textContent = '';
        const addReq = (media, qty, name, currentQty, item=null) => {
            const newReq = this.createInlineRequirement(currentQty >= qty ? 'text-success' : 'text-danger');
            this.costContainer.append(newReq);
            if (item) {
                newReq.setContent(media, `${numberWithCommas(currentQty)} / ${formatNumber(qty)}`, name);
            } else {
                newReq.setContent(media, formatNumber(qty), name);
            }
        };
        items.forEach(({
            item,
            quantity
        }) => {
            addReq(item.media, quantity, item.name, game.bank.getQty(item), item);
        });
        if (gpReq > 0) {
            addReq(cdnMedia('assets/media/main/coins.svg'), gpReq, getLangString('MENU_TEXT', 'GP'), game.gp.amount);
        }
        if (scReq > 0) {
            addReq(cdnMedia('assets/media/main/slayer_coins.svg'), scReq, getLangString('MENU_TEXT', 'SLAYER_COINS'), game.slayerCoins.amount);
        }
    });

    // Show Food Item CP in Bank
    ctx.patch(BankSelectedItemMenu, 'setItem').after(function(returnValue, bankItem, bank) {
        const item = bankItem.item;
        if (item instanceof FoodItem) {
            let hpValue = game.combat.player.getFoodHealing(item);
            this.itemHealing.innerHTML += `<br><br>Current: ${item.sellsFor} / ${hpValue} = <span class="text-bank-desc">${(item.sellsFor/hpValue).toFixed(2)}</span>`;
            hpValue = (item.healsFor * numberMultiplier).toFixed(0);
            this.itemHealing.innerHTML += `<br><br>Base: ${item.sellsFor} / ${hpValue} = <span class="text-bank-desc">${(item.sellsFor/hpValue).toFixed(2)}</span>`;
        }
    });
}

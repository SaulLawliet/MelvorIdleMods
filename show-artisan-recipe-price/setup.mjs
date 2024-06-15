export function setup(ctx) {

    const calcPrice = (altRecipe) => {
        let shopGP = 0;
        let itemGP = 0;
        let shopAP = 0;
        let itemAP = 0;

        let qtyStr = '';
        altRecipe.items.forEach(({
            item,
            quantity
        }) => {
            const purchase = game.shop.getQuickBuyPurchase(item);
            if (purchase) {
                purchase.costs.currencies.forEach((currency) => {
                    if (currency.currency.localID == 'GP') {
                        shopGP += currency.cost * quantity
                    } else if (currency.currency.localID == 'AbyssalPieces') {
                        shopAP += currency.cost * quantity
                    }
                })
            } else {
                if (item.sellsFor.currency.localID == 'GP') {
                    itemGP += item.sellsFor.quantity * quantity;
                } else if (item.sellsFor.currency.localID == 'AbyssalPieces') {
                    itemAP += item.sellsFor.quantity * quantity;
                }
                if (qtyStr.length > 0) qtyStr += ' | ';
                qtyStr += `${numberWithCommas(game.bank.getQty(item))} Qty`
            }
        });

        let ret = ''
        if (shopGP > 0 && itemGP == 0) {
            ret = `${numberWithCommas(shopGP)} GP`;
        }
        if (itemGP > 0) {
            if (ret.length > 0) ret += ' | ';
            ret += `${numberWithCommas(itemGP)} GP`;
        }

        if (shopAP > 0 && itemAP == 0) {
            if (ret.length > 0) ret += ' | ';
            ret += `${numberWithCommas(shopAP)} AP`;
        }
        if (itemAP > 0) {
            if (ret.length > 0) ret += ' | ';
            ret += `${numberWithCommas(itemAP)} AP`;
        }

        if (qtyStr.length > 0) {
            if (ret.length > 0) ret += ' # ';
            ret += qtyStr;
        }
        return ret;
    }

    ctx.patch(ArtisanMenuElement, "setRecipeDropdown").after(function (returnValue, altRecipeIngredients, selectCallback, displayOrder) {
        this.recipeDropdownItems.forEach((item, i) => {
            const span = document.createElement('span');
            span.style.cssText = "display: flex; align-items: center;";
            span.innerText = calcPrice(altRecipeIngredients[i]);
            item.appendChild(span);
        });
    });

    // Show Agility Cost Item
    ctx.patch(AgilityObstacleSelectionElement, 'setCosts').replace(function (o, items, currencies) {
        this.costContainer.textContent = "";
        const addReq = (media, qty, name, currentQty, item=null) => {
          const newReq = this.createInlineRequirement(currentQty >= qty ? "text-success" : "text-danger");
          this.costContainer.append(newReq);
          if (item) {
            newReq.setContent(media, `${numberWithCommas(currentQty)} / ${formatNumber(qty)}`, name);
          } else {
            newReq.setContent(media, formatNumber(qty), name);
          }
        };
        items.forEach(({ item, quantity }) => {
          addReq(item.media, quantity, item.name, game.bank.getQty(item), item);
        });
        currencies.forEach(({ currency, quantity }) => {
          addReq(currency.media, quantity, currency.name, currency.amount);
        });
    });

    // Show Food Item CP in Bank
    ctx.patch(BankSelectedItemMenuElement, 'setItem').after(function(returnValue, bankItem, bank) {
        const item = bankItem.item;
        if (item instanceof FoodItem) {
            let hpValue = game.combat.player.getFoodHealing(item);
            this.itemHealing.innerHTML += `<br><br>Current: ${item.sellsFor.quantity} / ${hpValue} = <span class="text-bank-desc">${(item.sellsFor.quantity/hpValue).toFixed(2)}</span>`;
            hpValue = (item.healsFor * numberMultiplier).toFixed(0);
            this.itemHealing.innerHTML += `<br><br>Base: ${item.sellsFor.quantity} / ${hpValue} = <span class="text-bank-desc">${(item.sellsFor.quantity/hpValue).toFixed(2)}</span>`;
        }
    });
}

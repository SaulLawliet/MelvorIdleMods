export function setup({ patch }) {

    // Currency Stat
    // 0: add
    // 1: remove
    // 2: combat get
    // 


    const process = (item, quantity = Number.MAX_VALUE) => {
        const timesSold = game.stats.Items.get(item, ItemStats.TimesSold);
        quantity = Math.min(quantity, timesSold);
        if (quantity <= 0) return;

        const sellsFor = item.sellsFor
        const isGP = sellsFor.currency == game.gp

        let price = quantity * sellsFor.quantity;
        if (isGP) {
            let gpFromSale = game.stats.Items.get(item, ItemStats.GpFromSale);
            if (quantity !== timesSold) {
                if (timesSold * sellsFor.quantity !== gpFromSale) {
                    imageNotify(cdnMedia('assets/media/main/bank_header.svg'), 'Price error. You must undo all.', 'danger');
                    return;
                }
                gpFromSale = quantity * sellsFor.quantity;
            }
            price = gpFromSale
        }

        if (price > 0 && !sellsFor.currency.canAfford(price)) {
            imageNotify(cdnMedia('assets/media/main/bank_header.svg'), 'You can not afford this.', 'danger');
            return;
        }

        // 1. Add item, Delete stats
        if (game.bank.addItem(item, quantity, false, false)) {
            game.stats.Items.add(item, ItemStats.TimesSold, -quantity);
            if (isGP) {
                game.stats.Items.add(item, ItemStats.GpFromSale, -price);
            }

            // 2. remove money, delete stats
            if (price > 0) {
                sellsFor.currency.remove(price)
                if (isGP) {
                    game.stats.General.add(GeneralStats.TotalGPEarned, -price);
                }
                game.stats.General.add(GeneralStats.TotalItemsSold, -quantity);
            }

            if (game.bank.selectedBankItem && game.bank.selectedBankItem.item == item) {
                bankSideBarMenu.statsMenu.setItem(game.bank.selectedBankItem, game);
            }
        }
    };

    const undoSell = (item) => {
        if (!item) {
            fireBottomToast('item not found.')
            return;
        }
        const sellsFor = item.sellsFor
        const isGP = sellsFor.currency == game.gp

        const quantity = game.stats.Items.get(item, ItemStats.TimesSold);
        let salePrice = isGP ? game.stats.Items.get(item, ItemStats.GpFromSale) : sellsFor.quantity * quantity;

        const mustAll = isGP && item.type === 'Logs';
        const arg = {
            title: "Undo Sell Item?",
            html: `<span class='text-dark'>
            Receive ${numberWithCommas(quantity)} x ${item.name}<br>
            Send back <img class='skill-icon-xs mr-2' src='${sellsFor.currency.media}'>${numberWithCommas(salePrice)}
            </span>`,
            imageUrl: item.media,
            imageWidth: 64,
            imageHeight: 64,
            imageAlt: item.name,
            showCancelButton: true,
            confirmButtonText: "Undo",
        };
        if (!mustAll) {
            Object.assign(arg, {
                input: 'number',
                inputValue: quantity,
                customClass: {
                    input: 'text-combat-smoke',
                    container: 'swal-infront',
                    confirmButton: 'btn btn-primary m-1',
                    denyButton: 'btn btn-secondary m-1',
                    cancelButton: 'btn btn-danger m-1',
                },
            });
        }
        SwalLocale.fire(arg).then((result) => {
            if (result.isConfirmed) {
                if (mustAll) {
                    process(item);
                } else if (result.value) {
                    process(item, Number(result.value));
                }
            }
        });
    };

    patch(BankSidebarMenuElement, 'initialize').after((returnValue, game) => {
        const button = createElement('button', {
            className: 'btn btn-danger'
        });
        button.innerText = 'Undo Sell';
        button.onclick = () => undoSell(game.bank.selectedBankItem.item);

        const div = createElement('div', {
            className: 'col-12'
        });
        div.appendChild(button);

        const element = bankSideBarMenu.settingsMenu.children[0];
        element.insertBefore(div, element.children[3]);
    });

    patch(ItemCompletionElement, 'updateItem').replace(function (o, item, game) {
        o(item, game);

        if (game.stats.Items.get(item, ItemStats.TimesSold) > 0) {
            if (!this.itemImage.onclick) {
                this.itemImage.onclick = () => undoSell(item);
            }
        }
    });
}


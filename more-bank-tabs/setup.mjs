export function setup(ctx) {

    ctx.patch(Bank, 'decode').before(function (reader, version)  {
        console.log('Before');
        this.maxTabs = 14;
        this.itemsByTab = [];
        for (let i = 0; i < this.maxTabs; i++) {
            this.itemsByTab.push([]);
        }
        return [reader, version];
    });

}

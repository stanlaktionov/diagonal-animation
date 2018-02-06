const bannerElement = document.getElementById('splitBanner');

const banner = new SplitBanner({
    banner: bannerElement,
});

if (window.innerWidth > 1023) {
    banner.init({type: 'horizontal'});
} else {
    banner.init({type: 'vertical'});
}


enquire.register('screen and (max-width: 1023px)', {
    match: function () {
        banner.destroy();
        banner.init({type: 'vertical'});
    },
    unmatch: function () {
        banner.destroy();
        banner.init({type: 'horizontal'});
    }
});
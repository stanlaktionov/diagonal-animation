class SplitBanner {
    constructor(config) {
        this.config = config;
        this.magicConstants = {
            IMAGE_SLICE_VALUE: {
                horizontal: 'translate(-80, 0)',
                vertical: 'translate(0, -290)'
            },
            IMG_PARAMS: {
                horizontal: {
                    width: '640',
                    height: '360',
                },
                vertical: {
                    width: '1280',
                    height: '720',
                }
            },
            SVG_PARAMS: {
                viewBox: {
                    horizontal: '0 0 1280 360',
                    vertical: '0 0 1280 1150'
                },
                width: {
                    horizontal: '106.6667%',
                    vertical: '100%'
                }
            },
            IMAGE_COORDS: {
                horizontal: {
                    left: '0 0, 640 0, 560 360, 0 360',
                    right: '720 0, 1280 0, 1280 360, 640 360',
                },
                vertical: {
                    left: '0 0, 1280 0, 1280 430, 0 720',
                    right: '1280 720, 0 1010, 0 1440, 1280 1440',
                }
            },
            ANIMATION_VALUES: {
                horizontal: {
                    vertical: {
                        left: 'translate(-80, 360)',
                        right: 'translate(0, -360)'
                    },
                    horizontal: {
                        left: 'translate(-800, 0)',
                        right: 'translate(720, 0)'
                    }
                },
                vertical: {
                    vertical: {
                        left: 'translate(1280, -290)',
                        right: 'translate(-1280, 0)'
                    },
                    horizontal: {
                        left: 'translate(0, -720)',
                        right: 'translate(0, 720)'
                    }
                }
            }
        };
    }

    _getInitialCounter() {
        const {images: {left: {length: leftLength}, right: {length: rightLength}}} = this.config;

        this.config.initialCounter = leftLength === rightLength ? rightLength : false;
    }

    _prepareConfig(options) {
        const {banner} = this.config;
        const config = this.config;
        const internalConfig = {
            svg: banner.querySelector('svg'),
            images: {
                left: {
                    length: banner.querySelectorAll('[data-position="left"]').length,
                    count: banner.querySelectorAll('[data-position="left"]').length,
                },
                right: {
                    length: banner.querySelectorAll('[data-position="right"]').length,
                    count: banner.querySelectorAll('[data-position="right"]').length,
                }
            },
            isAnimated: JSON.parse(banner.dataset.isAnimated)
        };

        this.config = {...config, ...internalConfig, ...options}
    }

    _prepareImages() {
        const {svg, type} = this.config;
        const {height, width} = this.magicConstants.IMG_PARAMS[type];
        const defs = svg.querySelectorAll('defs');
        const addDimensionAttributesToSVGNodes = this._addDimensionAttributesToSVGNodes.bind(this);

        defs.forEach(function (item) {
            const pattern = item.querySelector('pattern');
            const image = item.querySelector('image');

            addDimensionAttributesToSVGNodes(pattern, {height, width});
            addDimensionAttributesToSVGNodes(image, {height, width});
        });
    }

    _addDimensionAttributesToSVGNodes(node, options) {
        const {height, width} = options;
        node.setAttribute('width', width);
        node.setAttribute('height', height);
    }

    _updateSvg() {
        const {type, svg} = this.config;

        d3.select(svg)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', this.magicConstants.SVG_PARAMS.viewBox[type])
            .attr('width', this.magicConstants.SVG_PARAMS.width[type])
            .classed("svg-content", true);
    }

    _appendGroupToSvg() {
        const {svg} = this.config;
        this.config.g = d3.select(svg)
            .append('g');
    }

    _drawPolygon(options) {
        const {g, side, coords, idNumber, isFirst, type, imagesLength: totalCount} = options;
        const imageNumber = isFirst ? totalCount : idNumber;
        const id = isFirst ? 0 : idNumber;
        const polygon = g.append('polygon')
            .attr('id', `${side}_split_${id}`)
            .attr('points', coords)
            .attr('fill', 'url(#img_' + side + imageNumber + ')');

        if (side === 'right') {
            polygon
                .attr('transform', this.magicConstants.IMAGE_SLICE_VALUE[type]);
        }

    }

    _appendImages(options) {
        for (let i = 0; i < options.imagesLength; i++) {
            const idNumber = i + 1;

            if (i === 0) {
                this._drawPolygon({...options, ...{isFirst: true, idNumber}});
                this._drawPolygon({...options, ...{isFirst: false, idNumber}});
            } else {
                this._drawPolygon({...options, ...{isFirst: false, idNumber}});
            }
        }
    }

    _animateImages(side, counter, type) {
        const animationDirection = this.magicConstants.ANIMATION_VALUES[type].vertical[side];
        const sideAnimationHandler = this._sideAnimationEndHandler.bind(this, side, type, counter);
        const {animationStart, animationEnd, isAnimated} = this.config;

        d3.select(`#${side}_split_${counter}`)
            .transition()
            .ease(d3.easePolyInOut)
            .duration(3000)
            .attr('transform', animationDirection)
            .on('start', () => {
                if (animationStart) {
                    animationStart();
                }
            })
            .on('end', () => {
                d3.select(this).remove();
                const {isAnimated} = this.config;

                if (!isAnimated) return;

                if (animationEnd) {
                    animationEnd();
                }
                sideAnimationHandler();
            });
    }

    _applyAnimation(count, type) {
        this._animateImages('left', count, type);
        this._animateImages('right', count, type);
    }

    _sideAnimationEndHandler(side, type, count) {
        let {length} = this.config.images[side];

        count--;

        if (count === 0) {
            count = length;
            this._startAnimation(count, true, type);
        } else {
            this._startAnimation(count, false, type);
        }
    }

    _startAnimation(count, isLast) {
        const { type } = this.config;
        const applyAnimation = this._applyAnimation.bind(this, count, type);

        if (!isLast) {
            this.config.timer = d3.timeout(applyAnimation, 1500);
        } else {
            this._destroyBanner();
            this._startBanner();
        }
    }

    _getImagesOptions(side) {
        const {g, type, images} = this.config;
        const imagesLength = images[side].length;
        const coords = this.magicConstants.IMAGE_COORDS[type][side];

        return {
            g,
            imagesLength,
            coords,
            side,
            type
        }
    }

    _getSvgHeight() {
        const {svg} = this.config;
        return d3.select(svg).style('height');
    }

    _initializeEventHandlers() {
        const setBannerHeight = this._setBannerHeight.bind(this);

        window.addEventListener('resize', setBannerHeight);
    }

    _setBannerHeight() {
        const {banner} = this.config;

        banner.style.height = this._getSvgHeight();
    }

    _destroyBanner() {
        const {banner, timer} = this.config;
        const bannerSelector = banner.getAttribute('id');

        timer.stop();
        d3.select(`#${bannerSelector} svg g`).remove();
    }

    _startBanner() {
        this._getInitialCounter();

        const {isAnimated, initialCounter } = this.config;
        this._appendGroupToSvg();
        this._appendImages(this._getImagesOptions('left'));
        this._appendImages(this._getImagesOptions('right'));
        if (isAnimated) {
            this._startAnimation(initialCounter, false);
        }
    }

    init(options) {
        this._prepareConfig(options);
        this._updateSvg();
        this._prepareImages();
        this._startBanner();
        this._setBannerHeight();
        this._initializeEventHandlers();
    }

    animate() {
        const { initialCount } = this.config;
        this.config.isAnimated = true;
        this._startAnimation(initialCount, false);
    }

    stopAnimation() {
        this.config.isAnimated = false;
    }

    destroy() {
        const destroy = this._destroyBanner.bind(this);

        this.config.isAnimated = false;
        setTimeout(destroy, 0);

    }
}
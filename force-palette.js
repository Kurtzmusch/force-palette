const SATURATION_THRESHOLD = 0.3 // any lower uses the lowSatPalette
const DELTA_LUMA_THRESHOLD = 0.333 // any higher uses the lowSatPalette
const CSS_COLOR_PROPERTIES = [
	'background-color',
	//'background',
	//'border',
	//'border-color',
	'border-bottom-color',
	'border-left-color',
	'border-right-color',
	'border-top-color',
	//'box-shadow',
	'caret-color',
	'color',
	//'column-rule-color', //so rare and should not even exist
	//'outline-color',
	//'text-decoration',
	'text-decoration-color',
	'fill'
	//'text-shadow'
]

for( var rgbString of palette.rgbStrings ) {
	var rgbColor = getDecomposedRGBFromString(rgbString)
	var hsvColor = RGBToHSV(rgbColor)
	palette.hsvComponents.push(hsvColor)
}

for( var rgbString of lowSaturationPalette.rgbStrings ) {
	var rgbColor = getDecomposedRGBFromString(rgbString)
	var hsvColor = RGBToHSV(rgbColor)
	lowSaturationPalette.hsvComponents.push(hsvColor)
}

domUpdates = 0

function RGBToHSV( color ) {
	var r = color.r/255
	var g = color.g/255
	var b = color.b/255

	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var hue, saturation, luma = (max + min) / 2;

	if (max == min) {
		hue = saturation = 0; // achueromatic
	} else {
		var d = max - min;
		saturation = luma > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
			case g: hue = (b - r) / d + 2; break;
			case b: hue = (r - g) / d + 4; break;
		}

		hue /= 6;
	}

	convertedColor = {
		h: hue,
		s: saturation,
		l: luma
	}

	return convertedColor
}

function getDecomposedRGBFromString( rgbString ) {
	let decomposedRGB = rgbString.slice(
		rgbString.indexOf("(") + 1,
		rgbString.indexOf(")")
	).split(", ");

	return {
		r: parseInt(decomposedRGB[0]),
		g: parseInt(decomposedRGB[1]),
		b: parseInt(decomposedRGB[2])
	}
}

function forEachDOMNodeRecursive(startingNode, callback) {
    callback(startingNode);
    var node = startingNode.firstChild;
    while (node) {
        forEachDOMNodeRecursive(node, callback);
        node = node.nextSibling;
    }
}

function findClosestLuma(hsvColor, aPalette) {
	var closestColorIndex = 0
	var lastLumaDelta = 1.0
	var hsvPalette = aPalette.hsvComponents
	// TODO check if there is any performance improvement in caching this result in a color
	// lookup table
	for( var index = 0; index < hsvPalette.length; index += 1 ) {
		var lumaDelta = Math.abs(hsvColor.l-hsvPalette[index].l)
		if( lumaDelta < lastLumaDelta ) {
			lastLumaDelta = lumaDelta
			closestColorIndex = index
		}
	}
	return aPalette.rgbStrings[closestColorIndex]
}

function findClosestHue(hsvColor, aPalette) {
	var closestColorIndex = 0
	var lastHueDelta = 1.0
	var hsvPalette = aPalette.hsvComponents
	// TODO check if there is any performance improvement in caching this result in a color
	// lookup table
	for( var index = 0; index < hsvPalette.length; index += 1 ) {
		var hueDelta = Math.abs(hsvColor.h-hsvPalette[index].h)
		if( hueDelta > 0.5 ) { hueDelta = 1.0-hueDelta } // wrap around since hue is cyclical
		if( hueDelta < lastHueDelta ) {
			lastHueDelta = hueDelta
			closestColorIndex = index
		}
	}
	return aPalette.rgbStrings[closestColorIndex]
}

function changeColorsNew(currentNode) {
	if (currentNode.nodeType == 7) { return }

	if(!currentNode.style) { return }

	var computedStyle = window.getComputedStyle(currentNode)
	for( colorProperty of CSS_COLOR_PROPERTIES ) {
		var computedProperty = computedStyle[colorProperty]
		if( computedProperty.length && computedProperty.startsWith('rgb') && !computedProperty.startsWith('rgba') ) {
			var decomposedRGB = getDecomposedRGBFromString(computedProperty)
			var decomposedHSV = RGBToHSV(decomposedRGB)
			var deltaLuma = Math.abs(decomposedHSV.l-0.5)
			var replaceColor
			if( decomposedHSV.s >= SATURATION_THRESHOLD && deltaLuma < DELTA_LUMA_THRESHOLD ) {
				replaceColor = findClosestHue(decomposedHSV, palette)
			} else {
				replaceColor = findClosestLuma(decomposedHSV, lowSaturationPalette)
			}
			if( replaceColor != computedProperty ) {
				currentNode.style.setProperty(colorProperty, replaceColor, 'important')
				domUpdates += 1
			}
		}
	}
}

function changeColors(currentNode) {
	if (currentNode.nodeType == 7) { return }

	if(currentNode.style) {
		// TODO consider writing a generic function for any property if no property-specific
		// optimisations are possible
		// FIXME correct logic would be to only skip if alpha = 0, currenyl skips if RGBA
		var computedStyle = window.getComputedStyle(currentNode)
		var computedFill = computedStyle.fill
		var computedColor = computedStyle.color
		var computedBackground = computedStyle.backgroundColor
		var computedBorder = computedStyle.borderColor
		// TODO maybe remove backgorund images, apply css filter or replace with colors
		/*
		var computedBackgroundImage = computedStyle.background
		if( computedBackgroundImage.length && !computedBackgroundImage.startsWith('rgb')) { console.log(computedBackgroundImage) }
		*/
		// TEXT COLOR
		if( computedColor.length && computedColor.startsWith('rgb') ) {
			var decomposedRGB = getDecomposedRGBFromString(computedColor)
			var decomposedHSV = RGBToHSV(decomposedRGB)
			var deltaLuma = Math.abs(decomposedHSV.l-0.5)
			if( decomposedHSV.s >= SATURATION_THRESHOLD && deltaLuma < DELTA_LUMA_THRESHOLD ) {
				var replaceColor = findClosestHue(decomposedHSV, palette)
			} else {
				var replaceColor = findClosestLuma(decomposedHSV, lowSaturationPalette)
			}
			currentNode.style.setProperty('color', replaceColor, 'important')
			domUpdates += 1
		}
		// TODO if background color is defined in the background attrib, remove the color from it
		// BACKGROUND COLOR
		if( computedBackground.length && computedBackground.startsWith('rgb') && !computedBackground.startsWith('rgba') ) {
			var decomposedRGB = getDecomposedRGBFromString(computedBackground)
			var decomposedHSV = RGBToHSV(decomposedRGB)
			var deltaLuma = Math.abs(decomposedHSV.l-0.5)
			if( decomposedHSV.s >= SATURATION_THRESHOLD && deltaLuma < DELTA_LUMA_THRESHOLD ) {
				var replaceColor = findClosestHue(decomposedHSV, palette)
			} else {
				var replaceColor = findClosestLuma(decomposedHSV, lowSaturationPalette)
			}
			currentNode.style.setProperty('background-color', replaceColor, 'important')
			domUpdates += 1
		}
		// TODO if border color is defined in the border attrib, remove the color from it
		// BORDER COLOR
		if( computedBorder.length && computedBorder.startsWith('rgb') && !computedBorder.startsWith('rgba') ) {
			var decomposedRGB = getDecomposedRGBFromString(computedBorder)
			var decomposedHSV = RGBToHSV(decomposedRGB)
			var deltaLuma = Math.abs(decomposedHSV.l-0.5)
			if( decomposedHSV.s >= SATURATION_THRESHOLD && deltaLuma < DELTA_LUMA_THRESHOLD ) {
				var replaceColor = findClosestHue(decomposedHSV, palette)
			} else {
				var replaceColor = findClosestLuma(decomposedHSV, lowSaturationPalette)
			}
			currentNode.style.setProperty('border-color', replaceColor, 'important')
			domUpdates += 1
		}
		// SVG FILL COLOR
		if( computedFill.length && computedFill.startsWith('rgb') ) {
			var decomposedRGB = getDecomposedRGBFromString(computedFill)
			var decomposedHSV = RGBToHSV(decomposedRGB)
			var deltaLuma = Math.abs(decomposedHSV.l-0.5)
			if( decomposedHSV.s >= SATURATION_THRESHOLD && deltaLuma < DELTA_LUMA_THRESHOLD ) {
				var replaceColor = findClosestHue(decomposedHSV, palette)
			} else {
				var replaceColor = findClosestLuma(decomposedHSV, lowSaturationPalette)
			}
			currentNode.style.setProperty('fill', replaceColor, 'important')
			domUpdates += 1
		}
	}
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const newNode = mutation.addedNodes[i];
        forEachDOMNodeRecursive(newNode, changeColors);
      }
    }
		// if a class attribute was changed: remove style and recolor the changed element
		if( mutation.type === 'attributes' ) {
			if( mutation.attributeName == 'class' ) {
				var node = mutation.target
				node.removeAttribute('style') // FIXME CANT REMOVE STYLE WITHOUT LOOSING POSITION
				changeColorsNew(node)
			}
		}
  });
});

observer.observe(document.body, {
	attributes: true,
	//attributeFilter: ['class'],
  childList: true,
  subtree: true
});

console.log('compiled')

forEachDOMNodeRecursive(document.body, changeColorsNew)

console.log('done')
console.log(domUpdates)

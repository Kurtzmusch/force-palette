
const SATURATION_THRESHOLD = 0.5

var lowSaturationPalette = {
	rgbStrings: [
		'rgb(255, 255, 255)',
		'rgb(63, 63, 63)',
		'rgb(242, 242, 242)',
		'rgb(139, 139, 139)'
	],
	hsvComponents: []
}

var palette = {
	rgbStrings: [
		'rgb(183, 5, 5)',
		'rgb(67, 179, 123)',
		'rgb(221, 119, 0)',
		'rgb(64, 133, 203)',
		'rgb(187, 98, 159)',
		'rgb(0, 166, 173)'
	],
	hsvComponents: []
}

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

function changeColors(currentNode) {
	if (currentNode.nodeType == 7) { return }

	if(currentNode.style) {
		var computedStyle = window.getComputedStyle(currentNode)
		if( computedStyle.color.length && computedStyle.color.startsWith('rgb') && !computedStyle.color.startsWith('rgba') ) {
			currentNode.style.setProperty('color', 'rgb(0, 0, 0)', 'important')
		}
		if( computedStyle.backgroundColor.length && computedStyle.backgroundColor.startsWith('rgb') && !computedStyle.backgroundColor.startsWith('rgba') ) {
			currentNode.style.setProperty('background-color', 'rgb(255, 255, 255)', 'important')
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
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('compiled')

forEachDOMNodeRecursive(document.body, changeColors)

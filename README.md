# GBemu
 GameBoy and GameBoy Color emulator built using pure JavaScript, HTML, and CSS.

### [Available Here](https://itIsBrando.github.io/GBemu)

## Features
 - Full compatibility with Chrome, Firefox, Edge, and Safari.
 - Installable as a PWA with offline support for an application-like feel
 - Full mobile support

## Emulation Features
 - Support for MBCs 1-5 & 7
 - Saving and loading .sav files and savestates.
 - Saving in browser with [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
 - Palette customization (DMG) & Color Correction (GBC)
 - Graphical upscaling
 - Partial audio support (channels 1 & 2)
 - Keyboard, touch, and controller support
 - GBC double speed mode
 - Support for the rumble pack & Accelerometer on supported devices
 - Debugger and disassembler


 ## Future Plans
 - Link Cable
 - MBC 6
 - Multi-cart memory controllers


## Color Correction Modes
In order to account for modern screens, there are a few different color modes described below:
### Prescaled
Linearly scales the intensity of colors. Often causes games to be oversaturated.

### Desaturate
Desaturates colors, probably looks the best of all options.

### Gamma
This is a gamma filter coupled with accurate color balancing.
_@todo needs more investigation_

## Rumble pack & Accelerometer
Both futures are supported on devices that support them.
If your device supports the **Vibration API**, then games supporting rumble pack will automatically vibrate. This feature can usually be disabled within the game itself.

When starting a game with _MBC7_, a prompt will appear informing you whether your device supports access to/presence of an accelerometer. No calibration is necessary as the game will do so by default.

## Shaders
There is support for _scale2x_ and _scale3x_ filters if your device can handle it. If you see a green icon next to the **Shader Type** section in the settings, then your device will use the compiled Web Assembly version of the shaders that have significant performance benefits over the JavaScript variants.

The _LCD_ shader simulates the GameBoy Color's screen. Subpixels may be visible and are a result of canvas rendering :( This is something that will be fixed in the future.

The _Monochrome_ shader is similar to the LCD filter but works better on poorly performant devices and does not affect coloration.
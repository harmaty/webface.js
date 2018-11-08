import { extend_as }       from '../../lib/utils/mixin.js'
import { PositionManager } from '../../lib/position_manager.js'

var pos = new PositionManager();

["placeByCenter", "placeByTopLeft", "placeByTopRight", "placeByBottomLeft", "placeByBottomRight", "placeAboveTopLeft", "placeBelowBottomLeft", "placeAboveTopRight", "placeBelowBottomRight", "placeAboveTopRightCorner", "placeAboveTopLeftCorner", "placeBelowBottomLeftCorner", "placeBelowBottomRightCorner"].forEach((i) => {
  pos[i](document.querySelector(`#${i}_el`), document.querySelector(`#${i}_container`));
});

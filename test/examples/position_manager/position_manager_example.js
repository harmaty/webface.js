import { extend_as }       from '../../lib/utils/mixin.js'
import { PositionManager } from '../../lib/position_manager.js'

["placeByCenter", "placeByTopLeft", "placeByTopRight", "placeByBottomLeft", "placeByBottomRight", "placeAboveTopLeft", "placeBelowBottomLeft", "placeAboveTopRight", "placeBelowBottomRight", "placeAboveTopRightCorner", "placeAboveTopLeftCorner", "placeBelowBottomLeftCorner", "placeBelowBottomRightCorner"].forEach((method) => {
  PositionManager[method](document.querySelector(`#${method}_el`), document.querySelector(`#${method}_container`));
});

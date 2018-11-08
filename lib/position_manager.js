export class PositionManager {

  constructor() {
    this.base_offset = { "x": 0, "y": 0 };
  }

  getPosition(el) {
    var pos = el.getBoundingClientRect();
    return { 'x': pos.left, 'y': pos.top };
  }

  getRelPosition(el1, el2) {
    var pos1 = this.getPosition(el1);
    var pos2 = this.getPosition(el2);
    return { 'x' : pos1.x - pos2.x, "y" : pos1.y - pos2.y };
  }

  getDimensions(el) {
    var pos = el.getBoundingClientRect();
    return { 'x': pos.width, 'y': pos.height };
  }
  
  placeAt(el,x,y) {

    el.style.top  = (`${y}px`);
    el.style.left = (`${x}px`);
  }

  placeBy(el1, el2, { left=0.0, top=0.0, gravity_top=0.0, gravity_left=0.0 }={}) {
    
    var el2_pos = this.getRelPosition(el1, el2);
    var el1_dim = this.getDimensions(el1);
    var el2_dim = this.getDimensions(el2);

    var pos_offset     = { 'x': el2_dim['x']*left, 'y': el2_dim['y']*top };
    var gravity_offset = { 'x': el1_dim['x']*gravity_left , 'y': el1_dim['y']*gravity_top };
    var new_pos        = { 'x': pos_offset['x']+el2_pos['x']-gravity_offset['x'], 'y': pos_offset['y']+el2_pos['y']-gravity_offset['y'] };

    var base_offset_for_el;
    if(this.base_offset["units"] == "px")
      base_offset_for_el = { "x": this.base_offset["x"], "y": this.base_offset["y"] };
    else
      base_offset_for_el = { "x": this.base_offset["x"]*el1_dim["x"], "y": this.base_offset["y"]*el1_dim["y"] };

    if(new_pos.x < el2_pos.x)
      base_offset_for_el.x = -base_offset_for_el.x;
    if(new_pos.x < el2_pos.x)
      base_offset_for_el.y = -base_offset_for_el.y;

    new_pos = { "x" : new_pos.x + base_offset_for_el.x, "y" : new_pos.y + base_offset_for_el.y };

    this.placeAt(el1, new_pos['x'], new_pos['y']);

  }

  placeByCenter(el1, el2) {
    this.placeBy(el1, el2, { top: 0.5, left: 0.5, gravity_top: 0.5, gravity_left: 0.5 });
  }

  placeByTopLeft(el1, el2) {
    this.placeBy(el1, el2);
  }

  placeByTopRight(el1, el2) {
    this.placeBy(el1, el2, { left: 1.0, gravity_left: 1.0 });
  }

  placeByBottomLeft(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, gravity_top: 1.0 });
  }

  placeByBottomRight(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, left: 1.0, gravity_left: 1.0, gravity_top: 1.0 });
  }

  placeAboveTopLeft(el1, el2) {
    this.placeBy(el1, el2, { gravity_top: 1.0 });
  }

  placeBelowBottomLeft(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0 });
  }

  placeAboveTopRight(el1, el2) {
    this.placeBy(el1, el2, { left: 1.0, gravity_left: 1.0, gravity_top: 1.0 });
  }

  placeBelowBottomRight(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, left: 1.0, gravity_left: 1.0 });
  }

  placeAboveTopRightCorner(el1, el2) {
    this.placeBy(el1, el2, { left: 1.0, gravity_top: 1.0 });
  }

  placeAboveTopLeftCorner(el1, el2) {
    this.placeBy(el1, el2, { gravity_top: 1.0, gravity_left: 1.0 });
  }

  placeBelowBottomLeftCorner(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, gravity_left: 1.0 });
  }

  placeBelowBottomRightCorner(el1, el2) {
    this.placeBy(el1, el2, { top: 1.0, left: 1.0 });
  }

}

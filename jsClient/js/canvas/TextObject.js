"use strict";

/**
 * @class TextObject description
 * @param {object} options - object with all options for the text object
 * @param	options.x {required} - x position of the text object
 * @param	options.y {required} - x position of the text object		
 * @param	options.fillStyle {required} - fillStyle can be "stoke" or "fill". 
 *									   1.stroke will convert to strokeText function
 *									   2.fill will convert to fillText function
 */
function TextObject(options){
	/*
	Required options are set explicitly so we know they are required.
	*/
	if (typeof(options)=="undefined"){
		options={};
	}
	this.y=null;
	this.x=null;
	this.text=null;
	this.fillStyle =typeof(options.fillStyle)!="undefined"?options.fillStyle.toLowerCase():"fill"; // would use a simple callback type parameter, but it would be hell to mantain if the canvas API changes (which it wont... but still,you know?)	
	this.parent=null;
	/*
	simple initialization method for text objects
	*/
	for (var o in options) {
		if(options.hasOwnProperty(o)){
			this[o]=options[o];
		}
	};
	return this;
}

/**
 * contains Determine if a point is inside the shape's bounds
 * @param  {float} mx Mouse X coordinate
 * @param  {float} my Mouse Y coordinate
 * @return {boolean}    is the mouse contained in this object?
 */
TextObject.prototype.contains = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Height) and its Y and (Y + Height)
  var parentX=this.parent.x?this.parent.x:0;
  var parentY=this.parent.y?this.parent.y:0;
  var parentWidth=this.parent.width;
  var parentHeight=this.parent.height;
  return  (parentX+this.x <= mx) && (parentX+this.x + parentWidth >= mx) &&
          (parentY+this.y <= my) && (parentY+this.y + parentHeight >= my);
}

/**
 * draw Draws text in a canvas. 
 * @param  {object} options 
 * Can write with two text fill functions, strokeText or  fillText.
 * @return {TextObject} the textobject that we just drew
 *	 
 */
TextObject.prototype.draw = function(options){	
	var fillFunctions = {
		"stroke": function(object){
			object.parent.context.strokeText(object.text, object.parent.x+object.x,object.parent.y+object.y);
		},
		"fill": function(object){
			object.parent.context.fillText(object.text,object.parent.x+object.x,object.parent.y+object.y);
		}
	}
	try{
		if (typeof(fillFunctions[this.fillStyle])=="function"){
			fillFunctions[this.fillStyle](this);
		}
		if(typeof(options)=="object" && typeof(options.replace)!="undefined"){
			this.parent.children[this.parent.children.indexOf(this)]=this;
		}else{
			this.parent.children.push(this);	
		}
		return this;
	}catch (e){
		if (Configuration.debug===true){
			alert("Error"+e.message);
		}else{
			console.log("Error"+e.message);
		}
	}
};

/**
 * redraw Redraws the text object, will always be relative to parent
 * @return {undefined} 
 */
TextObject.prototype.redraw = function(){
	try{			
		this.draw({replace:this});
		for(var childKey in this.children){
			if (this.children.hasOwnProperty(childKey)){
				this.children[childKey].redraw();
			}
		}
	}catch(e){
		if (Configuration.debug===true){
			alert("Error"+e.message);
		}else{
			console.log("Error"+e.message);
		}	
	}
};
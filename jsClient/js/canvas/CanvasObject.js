"use strict";
/**
 * @class CanvasObject Creates a canvas element in the dom element passed by id (elementId)
 * @param {string} elementId id of the canvas element to create this object for
 * @param {string} context   type of context -2d,webgl-
 */
function CanvasObject(elementId,context){
	this.canvasElement=this.canvasElement=document.getElementById(elementId);
	this.context = this.canvasElement.getContext(context);
	this.children= new Array();
	this.moving=false;
	this.dragging=false;
	this.dragoffx=false;
	this.dragoffy=false;
	this.selection = null;  	
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;	
	// Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
	// They will mess up mouse coordinates and this fixes that
	this.htmlTop = document.body.parentNode.offsetTop;
	this.htmlLeft = document.body.parentNode.offsetLeft;
	//if this is null, do nothing. If this is an object and mouse leaves it, we will redraw the whole canvas witouth this object
	this.activeContextualHelper=null;
	if (document.defaultView && document.defaultView.getComputedStyle) {
		this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(this.canvasElement, null)['paddingLeft'], 10)      || 0;
		this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(this.canvasElement, null)['paddingTop'], 10)       || 0;
		this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(this.canvasElement, null)['borderLeftWidth'], 10)  || 0;
		this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(this.canvasElement, null)['borderTopWidth'], 10)   || 0;
	}
	this.startMouseListeners(); 
	return this;
}

/**
 * startMouseListeners Starts listeners for mousedown, mouseup and mousemove, making it possible to move rects around
 * @method
 * @return {undefined}
 */
CanvasObject.prototype.startMouseListeners=function(){
	var self=this;
	this.mouseDownEvent();
	this.mouseUpEvent();
	this.mouseMoveEvent();
	this.onClickEvent();
}
/*
WIP WIP WIP
*/
CanvasObject.prototype.onClickEvent = function(){

	var self=this;
	$(self.canvasElement).on('click', function(e) { 
		var mouse=self.getMouse();
		var currentChild=self.findMouseEventObject(mouse);
		if (currentChild !==null){
			if (currentChild.hasOwnProperty("onClick") && typeof(currentChild["onClick"])!=="undefined"){
				currentChild["onClick"];
			}
		}
	});
	
}


/**
 * mouseDownEvent When mouse is down, we will initialize the variables we need to move it as long as the mouse is over an object 
 * @return {undefined}
 */
CanvasObject.prototype.mouseDownEvent=function(){
	var self=this;
	/*
	Avoid the bug of text being selected on mousedown
	*/
	$(self.canvasElement).on('selectstart', function(e) { event.preventDefault(); return false; });
	/*
	Canvas element now listens to mousedown
	*/
	$(self.canvasElement).on('mousedown', function(e) {		
		var mouse=self.getMouse();
		var currentChild=self.findMouseEventObject(mouse);			
		// havent returned means we have failed to select anything.
	    // If there was an object selected, we deselect it	  
		if (currentChild===null){
			self.selection = null;		
		}else if (currentChild instanceof ContextualHelper){
			currentChild.executeClickAction();
		}else{
			self.dragoffx=mouse.x-currentChild.x;
			self.dragoffy=mouse.y-currentChild.y
			self.dragging=true;
			currentChild.moving=true;
			self.selection=currentChild;			
		}
	});
};

/**
 * findMouseEventObject Find the object interacting with the pointer
 * @param  {type} mouse
 * @return {object} what object is the mouse target?
 */
CanvasObject.prototype.findMouseEventObject = function(mouse){	
	var currentChild=null;
	var returnChild=null;

	for(var childKey in this.children){
		if(this.children.hasOwnProperty(childKey)){
			currentChild=this.children[childKey];
			if(currentChild.contains(mouse.x,mouse.y,{instanceOf:Square})){				
				returnChild= currentChild;
			}
		}
	}
	/*
	As the contextual helper is not in the canvas structure, we look for it specifically
	*/
	if (typeof(this.activeContextualHelper) !="undefined" && this.activeContextualHelper!==null && this.activeContextualHelper.element.contains(mouse.x,mouse.y)){		
		returnChild= this.activeContextualHelper;		
	}
	return returnChild;
}
/**
 * contains Determine if a point is inside the shape's bounds
 * @param  {float} mx Mouse X coordinate
 * @param  {float} my Mouse Y coordinate
 * @return {boolean}    is the mouse contained in this object?
 */
CanvasObject.prototype.contains = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Height) and its Y and (Y + Height)
  return  (this.x <= mx) && (this.x + this.width >= mx) &&
          (this.y <= my) && (this.y + this.height >= my);
}
/**
 * mouseMoveEvent When mouse moves, redraw the canvas elements to reflect the change
 * @return {undefined} 
 */
CanvasObject.prototype.mouseMoveEvent = function(){
	var self=this;
	$(self.canvasElement).on('mousemove', function(e) {
		var mouse=self.getMouse();
		if (self.dragging){
		  // We don't want to drag the object by its top-left corner,
		  // we want to drag from where we clicked.
		  // Thats why we saved the offset and use it here
		  self.selection.x = mouse.x - self.dragoffx;
		  self.selection.y = mouse.y - self.dragoffy;   
		  self.activeContextualHelper=null;
		  self.redraw();
		}else{
			var currentChild=self.findMouseEventObject(mouse);
			if (currentChild && self.activeContextualHelper==null){
				self.activeContextualHelper=new ContextualHelper(currentChild, self,{type:"deleteBar"});
			}else if (self.activeContextualHelper!==null && typeof(self.activeContextualHelper)=="object"){
				if(self.activeContextualHelper.target!=currentChild){
					self.redraw();
				}
				self.activeContextualHelper=null;
			}else if(!currentChild){
					self.activeContextualHelper=null;
					self.redraw();
			}
		}
	});
};
/**
 * mouseUpEvent When mouse is up, set dragging to false
 * @return {undefined}
 */
CanvasObject.prototype.mouseUpEvent = function(){
	var self=this;
	$(self.canvasElement).on("mouseup", function(e){
		if(_.falsy(self.selection)){
			self.dragging=false;
			return false;
		}
		if (self.selection.forbidOverlap===null||self.selection.overlapping()===false){			
			self.dragging=false;
		}else if (self.selection.forbidOverlap===null && self.selection.overlapping()===true){
			/**
			 * should change element color
			 */
			
		}
	});
};

/**
 * drawSquare Draws a square in this canvas
 * @param  {object} options Object with the canvas rect() parameters. 
		options.x - numeric
		options.y - numeric
		options.height -  numeric
		options.width - numeric
 * @return {Square}  
 */
CanvasObject.prototype.drawSquare = function(options){		
	options.context=this.context;
	options.parent=this;
	return new Square(options).draw();
};
/**
 * drawText
 * @param  {type} options 
 *              text {required} - {string}
				x {absolute} {required} - {integer} x position of text
				y {absolute} {required} - {integer } y position of text
				fillStyle {required} - {string} will determine the text function to use
 * @return {TextObject}
 */
CanvasObject.prototype.drawText = function(options){
	return new TextObject({
		x:options.x,
		y:options.y,
		text:options.text,
		fillStyle:options.fillStyle,
		context: this.context,
		parent:this
	}).draw();

};
/**
 * clear Clear the canvas of all elements 
 * @return {CanvasObject} the instance of canvasobject cleared
 */
CanvasObject.prototype.clear = function(){
	this.canvasElement.width=this.canvasElement.width;
	return this;
};

/**
 * redraw Redraws the canvas and all its children. Children will redraw themselves and their children as well.
			Text position will be kept relative to parents
 * @return {CanvasObject}
 */
CanvasObject.prototype.redraw = function(){	
	this.clear();
	var child=null;
	for (var childKey in this.children){
		child=this.children[childKey];
		if(child){
			if (!(child.x>this.width || child.y > this.height||child.x+child.width<0 || child.y+child.height<0)){
				child.redraw(this.context);
			}	
		}
		
	}
	return this;
};

/**
 * getMouse description
 * @param  {event} e Creates an object with x and y defined, set to the mouse position relative to the state's canvas
 * @return {object}   an object with the x and y coordinates of the mouse pointer
 */
CanvasObject.prototype.getMouse = function(e) {
  var element = this.canvasElement, offsetX = 0, offsetY = 0, mx, my;
  
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = event.pageX - offsetX;
  my = event.pageY - offsetY;
  
  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}
/**
 * drawLine draws a line from one square to another
 * @param  {Square} options.from the starting point square
 * @param  {Square} options.to   the ending point square
 * @return {Line} the drawn line      
 */
CanvasObject.prototype.drawLine = function(options){
	return new Line({
		parent:this, 
		from:options.from, 
		to:options.to		
	}).draw();
}
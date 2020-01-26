var canvas, ctx;
var mouseXY = [0,0], mouseDown = 0;
var touchXY = [0,0];
var canv_w, canv_h;
var color_list = [[176,23,31],[0,205,102],[28,134,238],[255,215,0],[208,32,144]];
var classes_list = []; // classes or labels of bounding box
var curr_bbox_id = null; // current bounding box id // set to zero is a ploy
var bbox_list; // list of all bounding box element
// var filename is setted in html

$(document).ready(function (){
// create sketchpad
  // json_obj defined in html file
  canv_w = json_obj.size.width;
  canv_h = json_obj.size.height;

  // create Canvas element
  canvas = document.createElement("canvas");
  canvas.setAttribute("id","bbox-canvas");
  canvas.setAttribute("height",canv_h);
  canvas.setAttribute("width",canv_w);
  $("#canvas-container")[0].appendChild(canvas);

  ctx = canvas.getContext('2d');

  // add event listener on canvas //-> use jquery
  initMouseEvent();
  initTouchEvent();

  // create bbox_list object
  bbox_list = {
    list : {}, // id : bbox
    id_counter : 0, // increment only
    newBBox : function(name,x0,y0,x1,y1){
      addButton(this.id_counter, name); //createButtonBox -> button to select bbox, input text, delete bbox
      this.list[this.id_counter] = new BBox(name,x0,y0,x1,y1);
      this.id_counter ++;
    },
    remove : function(id){
      delete this.list[id];
    },
    loadFromJson : function(json_obj){
      classes_list = json_obj.classes; // [{id : name}]
      var i;
      for(i=0;i<json_obj.obj.length;i++){
        let class_tag_id = json_obj.obj[i].class_tag_id;
        // convert coordinates from yolo notation
        let name = classes_list.find(obj => obj.id == class_tag_id).name;
        let x0 = Math.round(json_obj.obj[i].x * canv_w);
        let y0 = Math.round(json_obj.obj[i].y * canv_h);
        let x1 = x0 + Math.round(json_obj.obj[i].width * canv_w);
        let y1 = y0 + Math.round(json_obj.obj[i].height * canv_h);
        this.newBBox(name,x0,y0,x1,y1);
      };
      drawAllRects();
    },
    exportJsonData : function(){
      //export bbox coordinates
      //invert xy0-xy1 if xy0 > xy1
      let obj_data = [];
      for(i in this.list){
        let name = this.list[i].name;
        let class_tag_id = classes_list.find(obj => obj.name == name).id;
        let xy_min = this.list[i].xy0;
        let xy_max = this.list[i].xy1;
        obj_data.push({
          // convert in yolo notation
          'class_tag_id' : class_tag_id,
          'x' : xy_min[0] / canv_w,
          'y' : xy_min[1] / canv_h,
          'width' : (xy_max[0] - xy_min[0]) / canv_w,
          'height' : (xy_max[1] - xy_min[1]) / canv_h
        })
      };
      json_data = JSON.stringify({'filename' : filename, 'obj': obj_data}); // obj -> json string
      $.ajax({
        type: 'POST',
        url: '/img_bbox',
        contentType: 'application/json', //neccessary to use .get_json() in backend
        data: json_data,
        cache: false,
        processData: false,
        async: true,
        success: function(data){
          window.location.href = data;
        },
      });
    }
  };

  //load data from json_obj
  bbox_list.loadFromJson(json_obj);

  //add list of classes to dropdown dropdownMenu
  var list_elem = "";
  $.each(classes_list, function(i,item){
    list_elem += '<a class="dropdown-item class-label">' + item.name + '</a>';
  });
  $("#dropdown-classes").append(list_elem);
  $(".class-label").click(function(){ // change bbox name
    let class_name = this.innerHTML;
    $("#dropdownMenuButton").html(class_name); // change on dropdown menu
    bbox_list.list[curr_bbox_id].name = class_name; // change on bbox element
    $("#btn_"+curr_bbox_id).html(class_name); // change on button inner
    drawAllRects(); // change on drawn rect
  });

  // ad event listener on buttons
    // main buttons
  $("#newbbox-btn").click(function(){
    bbox_list.newBBox('--select--',10,10,100,100);
    curr_bbox_id = bbox_list.id_counter - 1;
    showSettingBody(curr_bbox_id);
  });

  $("#next-btn").click(function(){
    bbox_list.exportJsonData();
  });

  $("#delimg-btn").click(function(){
    var r = confirm("Are you sure?");
    if(r==true){
      json_data = JSON.stringify({'filename' : filename, 'delete' : true});
      $.ajax({
        type: 'POST',
        url: '/img_bbox',
        contentType: 'application/json', //neccessary to use .get_json() in backend
        data: json_data,
        cache: false,
        processData: false,
        async: true,
        success: function(data){
          window.location.href = data;
        },
      });
    }
  });

    // setting buttons
  $("#newbbox-btn-s").click(function(){
    bbox_list.newBBox('--select--',10,10,100,100);
    curr_bbox_id = bbox_list.id_counter - 1;
    $("#dropdownMenuButton").html('--select--');
  });

  $("#delbbox-btn-s").click(function(){
    bbox_list.remove(curr_bbox_id);
    $("#btn_"+curr_bbox_id).remove();
    drawAllRects();
    showMainBody();
  });

  $("#savebbox-btn-s").click(function(){
    curr_bbox_id = null;
    showMainBody();
  });

});

// BBox object
function BBox(name,x0,y0,x1,y1){
  var _x0 = x0 || 10;
  var _y0 = y0 || 10;
  var _x1 = x1 || 50;
  var _y1 = y1 || 50;
  var _w = _x1 - _x0;
  var _h = _y1 - _y0;

  var _name = name || "";
  var color;

  function setWidthHeight(){
    _w = _x1 - _x0;
    _h = _y1 - _y0;
  }

  Object.defineProperties(this, {
    "name" : {
      // convert class_tag_id to name  !!!!!
      get : function(){ return _name },
      set : function(name){ _name = name }
    },
    "xywh" : {
      get : function(){ return [_x0, _y0, _w, _h] }
    },
    "xy0" : {
      get : function(){ return [_x0, _y0] },
      set : function(xy){ _x0=xy[0]; _y0=xy[1] }
    },
    "xy1" : {
      get : function(){ return [_x1, _y1] },
      set : function(xy){ _x1=xy[0]; _y1=xy[1];
        setWidthHeight();
        //invert xy0-xy1 if xy0 > xy1
        if(_x0>_x1){
          let _x0_temp = _x0;
          _x0 = _x1;
          _x1 = _x0_temp;
        };
        if(_y0>_y1){
          let _y0_temp = _y0;
          _y0 = _y1;
          _y1 = _y0_temp;
        }
      }
    }
  });
};

function addButton(id,name){
  let btn = document.createElement('li');
  btn.className = 'list-group-item';
  btn.setAttribute('id', 'btn_' + id);
  btn.setAttribute('style','cursor: pointer');
  btn.textContent = name;
  btn.addEventListener("click", function(){
    showSettingBody(id);
    curr_bbox_id = id;
  });
  $("#buttons-list").append(btn);
}

function showMainBody(){
  $(".setting-body").addClass('d-none');
  $(".main-body").removeClass('d-none');
}

function showSettingBody(id){
  $(".main-body").addClass('d-none');
  $(".setting-body").removeClass('d-none');
  $("#dropdownMenuButton").html(bbox_list.list[id].name);
}

function deleteButton(id){
  var id_button = "button_" + id;
  var button = document.getElementById(id_button);
  button.parentNode.removeChild(button);
}

function drawRect(ctx,id,bbox,color) {
  xywh = bbox.xywh
  name = bbox.name
  ctx.fillStyle = "rgb("+color[0]+","+color[1]+","+color[2]+")";
  ctx.font = "16px Verdana";
  ctx.fillText(name, xywh[0]+6, xywh[1]+20);

  ctx.strokeStyle = "rgb("+color[0]+","+color[1]+","+color[2]+")";
  ctx.lineWidth = "2";
  ctx.beginPath();
  ctx.rect(xywh[0], xywh[1], xywh[2], xywh[3]);
  ctx.stroke();
}

function drawAllRects(){
  ctx.clearRect(0, 0, canv_w, canv_h);
  var i;
  for(i in bbox_list.list){
    drawRect(ctx,i+1,bbox_list.list[i],color_list[i%color_list.length]);
  }
}
// handle canvas mouse event
function initMouseEvent(){
  canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
  canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
  window.addEventListener('mouseup', sketchpad_mouseUp, false);
}

function getMousePos(e) {
  if (!e){
    var e = event;
  }
  if (e.offsetX) {
    mouseXY = [e.offsetX, e.offsetY];
  }
  else if (e.layerX) {
    mouseXY = [e.layerX, e.layerY];
  }

  mouseXY = [ mouseXY[0]*canv_w/$("#bbox-canvas").width(), mouseXY[1]*canv_h/$("#bbox-canvas").height() ];
}

function sketchpad_mouseDown(){
  if(curr_bbox_id != null){ // decorator?
    mouseDown = 1;
    bbox_list.list[curr_bbox_id].xy0 = mouseXY;
  }

}

function sketchpad_mouseMove(e){
  getMousePos(e);
  if(curr_bbox_id != null){ // decorator?
    if(mouseDown){
      bbox_list.list[curr_bbox_id].xy1 = mouseXY;
      drawAllRects(ctx,bbox_list.list[curr_bbox_id].xywh);
    }
  }
}

function sketchpad_mouseUp(){
  mouseDown = 0;
}

// handle canvas touch event
function initTouchEvent(){
  canvas.addEventListener('touchstart', sketchpad_touchStart, false);
  canvas.addEventListener('touchmove', sketchpad_touchMove, false);
}

function getTouchPos(e) {
  if (!e){
    var e = event;
  }
  if(e.touches) {
    if (e.touches.length == 1) { // Only deal with one finger
      var touch = e.touches[0]; // Get the information for finger #1
      touchXY=[touch.pageX-touch.target.offsetLeft, touch.pageY-touch.target.offsetTop];
      touchXY=[touchXY[0]*canv_w/$("#bbox-canvas").width(), touchXY[1]*canv_h/$("#bbox-canvas").height()]
    }
  }
}

function sketchpad_touchStart(){
  if(curr_bbox_id != null){ // decorator?
    getTouchPos();
    bbox_list.list[curr_bbox_id].xy0 = touchXY;
    event.preventDefault();
  }
}

function sketchpad_touchMove(e){
  if(curr_bbox_id != null){ // decorator?
    getTouchPos(e);
    bbox_list.list[curr_bbox_id].xy1 = touchXY;
    event.preventDefault();

    drawAllRects(ctx,bbox_list.list[curr_bbox_id].xywh);
  }
}

'use strict';
(function(){
  var table = {};  var append = function(array, key, constructor) {    var len = array.length / 2;    var u8 = new Uint8Array(len);    for (var i = 0; i < len; i++) {      u8[i] = (array.charCodeAt(i * 2) - 0x40) + ((array.charCodeAt(i * 2 + 1) - 0x40) << 4);    }    var typed = new constructor(u8.buffer);    table[key] = typed;  };
})();
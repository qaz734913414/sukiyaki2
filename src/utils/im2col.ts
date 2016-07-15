// utility for convolution / pooling of 2d image
// based on chainer's conv.py implementation

import $M = require('milsushi2');

export function conv_outsize(size: number, k: number, s: number, p: number, cover_all: boolean): number {
  if(cover_all) {
    return Math.floor((size + p * 2 - k + s - 1) / s) + 1
  } else {
    return Math.floor((size + p * 2 - k) / s) + 1
  }
}

export function im2col_cpu(img: $M.Matrix, ksize: number[], stride: number[], pad: number[], pad_val: number = 0, cover_all: boolean =false): $M.Matrix {
  var h: number, w: number, c: number, n: number;
  var img_size = $M.sizejsa(img);
  h = img_size[0];
  w = img_size[1];
  c = img_size[2] || 1;//maybe img_size.length < 4
  n = img_size[3] || 1;

  var [kh, kw] = ksize;
  var [sy, sx] = stride;
  var [ph, pw] = pad;

  var out_h = conv_outsize(h, kh, sy, ph, cover_all);
  var out_w = conv_outsize(w, kw, sx, pw, cover_all);

  var col = $M.zeros(out_h, out_w, kh, kw, c, n);

  var padded_img = $M.zeros(h + ph * 2 + sy - 1, w + pw * 2 + sx - 1, c, n);
  if (pad_val) {
    padded_img.set($M.colon(), pad_val);
  }
  padded_img.set($M.colon(ph + 1, ph + h), $M.colon(pw + 1, pw + w), $M.colon(), $M.colon(), img);
  for (var i = 1; i <= kw; i++) {
    var i_lim = i + sx * out_w - 1;
    for (var j = 1; j <= kh; j++) {
      var j_lim = j + sy * out_h - 1;
      var kern_view = padded_img.get($M.colon(j, sy, j_lim), $M.colon(i, sx, i_lim), $M.colon(), $M.colon());
      kern_view.reshape_inplace(out_h, out_w, 1, 1, c, n);
      col.set($M.colon(), $M.colon(), j, i, $M.colon(), $M.colon(), kern_view);
      kern_view.destruct();
    }
  }
  padded_img.destruct();
  return col;
}

export function col2im_cpu(col: $M.Matrix, stride: number[], pad: number[], size: number[]): $M.Matrix {
  var h: number, w: number;
  h = size[0];
  w = size[1];
  var out_h: number, out_w: number, kh: number, kw: number, c: number, n: number;
  var col_shape = $M.sizejsa(col);
  out_h = col_shape[0];
  out_w = col_shape[1];
  kh = col_shape[2] || 1;
  kw = col_shape[3] || 1;
  c = col_shape[4] || 1;
  n = col_shape[5] || 1;
  var [sy, sx] = stride;
  var [ph, pw] = pad;

  var padded_img = $M.zeros(h + 2 * ph + sy - 1, w + 2 * pw + sx - 1, c, n);
  for (var i = 1; i <= kw; i++) {
    var i_lim = i + sx * out_w - 1;
    for (var j = 1; j <= kh; j++) {
      var j_lim = j + sy * out_h - 1;
      var col_view = col.get($M.colon(), $M.colon(), j, i, $M.colon(), $M.colon());
      col_view.reshape_inplace(out_h, out_w, c, n);
      var pad_view = padded_img.get($M.colon(j, sy, j_lim), $M.colon(i, sx, i_lim), $M.colon(), $M.colon());
      padded_img.set($M.colon(j, sy, j_lim), $M.colon(i, sx, i_lim), $M.colon(), $M.colon(),
        $M.plus(col_view, pad_view));
      col_view.destruct();
      pad_view.destruct();
    }
  }
  var img = padded_img.get($M.colon(ph + 1, ph + h), $M.colon(pw + 1, pw + w), $M.colon(), $M.colon());
  padded_img.destruct();
  return img;
}

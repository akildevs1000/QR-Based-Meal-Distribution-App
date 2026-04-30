/**
 * backgroundRemoval.js
 * ----------------------------------------------------------------------------
 * Reusable client-side background-removal helpers.
 *
 * Uses @imgly/background-removal (browser ML, no server, no API key).
 * The ML module is lazy-loaded and cached so the first call pays the cost
 * once and subsequent calls are instant.
 *
 * Quick usage:
 *
 *   import {
 *     removeBackground,            // -> base64 PNG with transparent bg
 *     removeBackgroundOnWhite,     // -> base64 JPEG composited on white
 *     removeBackgroundOnColor,     // -> base64 JPEG composited on any color
 *     prewarmBackgroundRemoval,    // call once on mount to start the import
 *   } from '../lib/backgroundRemoval'
 *
 *   const cleaned = await removeBackgroundOnWhite(base64OrFileOrBlob);
 *
 * All inputs accept: base64 data URL, Blob, or File.
 * All outputs are base64 data URL strings (ready to assign to <img src=...>).
 * ----------------------------------------------------------------------------
 */

let _imglyModulePromise = null;

/**
 * Lazy-load and cache the @imgly/background-removal module.
 * Call this on component mount to pre-warm the bundle so the first
 * removal is noticeably faster.
 */
export const prewarmBackgroundRemoval = () => {
  if (!_imglyModulePromise) {
    _imglyModulePromise = import('@imgly/background-removal');
  }
  return _imglyModulePromise;
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });

const base64ToBlob = async (b64) => {
  const res = await fetch(b64);
  return await res.blob();
};

const toBlob = async (input) => {
  if (!input) throw new Error('Empty input');
  if (input instanceof Blob) return input; // covers File
  if (typeof input === 'string') return await base64ToBlob(input);
  throw new Error('Unsupported input type for background removal');
};

/**
 * Remove the background from an image.
 *
 * @param {string|Blob|File} input - base64 data URL, Blob, or File
 * @param {object} [options]
 * @param {"isnet_quint8"|"isnet"|"isnet_fp16"} [options.model="isnet_quint8"]
 *        Smaller models are faster but slightly less precise. The default is
 *        the smallest/fastest, which is plenty for headshots / passport photos.
 * @returns {Promise<string>} base64 PNG (transparent background)
 */
export const removeBackground = async (input, options = {}) => {
  const { removeBackground: imglyRemove } = await prewarmBackgroundRemoval();
  const blob = await toBlob(input);
  const transparent = await imglyRemove(blob, {
    model: options.model || 'isnet_quint8',
    output: { format: 'image/png', quality: options.quality ?? 0.85 },
  });
  return await blobToBase64(transparent);
};

/**
 * Composite an RGBA PNG (with transparent background) onto a solid color and
 * return a base64 JPEG. Useful when you need a clean white passport-style
 * photo without the alpha channel.
 *
 * @param {string|Blob|File} transparentInput - PNG data with transparent bg
 * @param {string} [color="#ffffff"]
 * @param {number} [quality=0.92]
 * @returns {Promise<string>} base64 JPEG
 */
export const compositeOnColor = async (transparentInput, color = '#ffffff', quality = 0.92) => {
  const blob = await toBlob(transparentInput);
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};

/**
 * Convenience: remove the background and place the subject on any solid color.
 *
 * @param {string|Blob|File} input
 * @param {string} [color="#ffffff"]
 * @param {object} [options] - forwarded to removeBackground()
 * @returns {Promise<string>} base64 JPEG
 */
export const removeBackgroundOnColor = async (input, color = '#ffffff', options = {}) => {
  const transparent = await removeBackground(input, options);
  return await compositeOnColor(transparent, color, options.compositeQuality);
};

/**
 * Convenience: remove the background and place the subject on a white background.
 * The most common case for ID/passport-style photos.
 *
 * @param {string|Blob|File} input
 * @param {object} [options] - forwarded to removeBackground()
 * @returns {Promise<string>} base64 JPEG
 */
export const removeBackgroundOnWhite = async (input, options = {}) => {
  return await removeBackgroundOnColor(input, '#ffffff', options);
};

/**
 * Convert a base64 data URL into a File (preserves a stable filename and
 * uses the data URL's mime type as the File type).
 *
 * @param {string} dataUrl
 * @param {string} [filename="image.jpg"]
 * @returns {Promise<File>}
 */
export const dataUrlToFile = async (dataUrl, filename = 'image.jpg') => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
};

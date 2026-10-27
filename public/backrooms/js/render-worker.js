/* Rendert die Abbildungen abseits des Hauptthreads. */
importScripts('renderer.js');

self.onmessage = function (e) {
  var r = self.BR_RENDER.render(e.data.opts);
  self.postMessage({ id: e.data.id, w: r.w, h: r.h, data: r.data }, [r.data.buffer]);
};

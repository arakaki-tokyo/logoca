
const messageRecieveHandler = new class {
  constructor() {
    self.addEventListener('message', this.recieve.bind(this));
  }
  recieve(event) {
    if (!event.data) {
      registration.getNotifications()
        .then(nl => nl.forEach(n => n.close()));
    } else {
      this.showActNotice(event.data);
    }
  }
  showActNotice(act) {
    self.registration.showNotification(
      "LoGoCa",
      {
        body: `${act.summary}(${act.elapsedTime})`,
        badge: "/favicon.ico",
        icon: "/img/logo72.png",
        renotify: false,
        silent: true,
        tag: "logoca",
        data: act.start,
        actions: [
          { action: "end", title: "end action" }
        ]
      }
    );
  }
  calcElapsedTime(start, end) {
    const elapsedTime = Math.floor((end - start) / 1000);
    const h = Math.floor(elapsedTime / (60 * 60));
    const m = Math.floor(elapsedTime / 60) % 60;
    const s = elapsedTime % 60;
    return [h, m, s];
  }

}

const notificationClickHandler = new class {
  constructor() {
    addEventListener('notificationclick', this.click.bind(this));
  }
  click(e) {
    console.dir(e);
    e.notification.close();
    const proc = (e.action === 'end') ? this.endAct : this.showPage;
    e.waitUntil(
      self.clients.matchAll({ type: "window" })
        .then(cl => cl.find(c => c.url == `${location.origin}/`))
        .then(client => proc(client, e))
    );
  }
  showPage(client) {
    if (client) {
      return client.focus();
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow(`${location.origin}/`);
    }
  }
  endAct(client, e) {
      if (client) {
        client.postMessage(null);
      } else {
        // save to indexedDB
        return idb.put({start: e.notification.data, end: Date.now()});
      }
  }
}

const cacheHandler = new class{
  cacheVersion = "1";
  cacheItems = [
    "/",
    "/index.js",
    "/style.css",
    "/favicon.ico",
    "/img/logo.svg",
    "/img/favicon.svg",
    "/img/logo72.png",
    "/img/logo192.png"
  ];
  constructor(){
    self.addEventListener('install', this.addCache.bind(this));
    self.addEventListener('fetch', this.proxy);
  }
  addCache(e) {
    e.waitUntil(
      caches.open(this.cacheVersion)
        .then(cache => cache.addAll(this.cacheItems))
    );
  }
  proxy(e){
    e.respondWith(
      caches.match(e.request)
        .then(res => res || fetch(e.request))
    );
  }
}
const idb = new class {
  db;
  constructor() {
    this.db = new Promise(resolve => {
      indexedDB.open("logoca", 1).onsuccess = ev => {
        resolve(ev.target.result);
      }
    })
  }
  put(record) {
    return this.db.then(db => {
      return new Promise(resolve => {
        db.transaction("sw", "readwrite")
          .objectStore("sw")
          .put(record, 0)
          .onsuccess = ev => resolve(ev);
      })
    })
  }
}
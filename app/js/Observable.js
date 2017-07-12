export default class Observable {
    constructor() {
        this.observers = new Map();
    }

    addEventListener(label, callback) {
        this.observers.has(label) || this.observers.set(label, []);
        this.observers.get(label).push(callback);
    }

    removeEventListener(label) {
        this.observers.delete(label);
    }

    dispatchEvent(label, e = {}) {
        const observers = this.observers.get(label);

        if (observers && observers.length) {
            observers.forEach((callback) => {
                callback(e);
            });
        }
    }

}
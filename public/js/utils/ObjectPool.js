export class ObjectPool {
    constructor(factory, initialSize = 50) {
        this.factory = factory;
        this.activeObjects = new Set();
        this.inactiveObjects = [];
        this.initialSize = initialSize;
        
        this.preallocate();
    }

    preallocate() {
        for (let i = 0; i < this.initialSize; i++) {
            this.inactiveObjects.push(this.factory());
        }
    }

    acquire() {
        let object = this.inactiveObjects.pop();
        
        if (!object) {
            object = this.factory();
        }
        
        this.activeObjects.add(object);
        return object;
    }

    release(object) {
        if (this.activeObjects.delete(object)) {
            object.reset?.();
            this.inactiveObjects.push(object);
        }
    }

    releaseAll() {
        this.activeObjects.forEach(object => this.release(object));
    }

    update(deltaTime) {
        this.activeObjects.forEach(object => {
            if (object.isDead?.()) {
                this.release(object);
            } else {
                object.update?.(deltaTime);
            }
        });
    }
} 
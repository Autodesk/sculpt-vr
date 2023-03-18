import * as THREE from 'three';

export default class DentModifier {
    constructor() {
        // User set
        this.origin = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.radius = 0;
        this.depth = 0;

        // Internal calculations
        this.normal = new THREE.Vector3();
        this.centerSphere = new THREE.Vector3();
        this.sphere = new THREE.Sphere();
        this.ray = new THREE.Ray();
        this.tmpVec = new THREE.Vector3();
    }

    set(origin, direction, radius, depth) {
        this.origin.copy(origin);
        this.direction.copy(direction);
        this.radius = radius;
        this.depth = depth;
        
        return this;
    }

    modify(geometry) {
        const R_Squared = this.radius * this.radius;

        this.normal.copy(this.direction);
        this.normal.multiplyScalar( -this.radius*( 1 - this.depth ) );

        this.centerSphere.addVectors(this.origin, this.normal);
        this.sphere.set(this.centerSphere, this.radius);

        const positions = geometry.attributes.position.array;

        let modified = false;
        for (let i = 0; i < positions.length; i+=3) {
            this.tmpVec.set(positions[i], positions[i+1], positions[i+2]);
            if (this.centerSphere.distanceToSquared(this.tmpVec) < R_Squared) {
                this.ray.set(this.tmpVec, this.direction);
                this.ray.intersectSphere(this.sphere, this.tmpVec);
                positions[i] = this.tmpVec.x;
                positions[i+1] = this.tmpVec.y;
                positions[i+2] = this.tmpVec.z;
                modified = true;
            }
        }

        if (!modified) return;

        //console.log('modified');
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        return this;
    }
};
export const BONES = Object.freeze({
    thigh: 40,
    shin: 40,
    torso: 52,
    neck: 8,
    headRadius: 13,
    upperArm: 30,
    forearm: 30,
});

export const JOINT_NAMES = Object.freeze([
    'head', 'neck', 'hip', 'elbowF', 'handF', 'elbowB', 'handB', 'kneeF', 'footF', 'kneeB', 'footB',
]);

/** Joints that rest on the floor when they are the lowest point of the figure. */
const SUPPORT_JOINTS = ['footF', 'footB', 'kneeF', 'kneeB', 'hip'];

/**
 * Forward kinematics: turns a pose into world-space joint positions. The figure is
 * shifted vertically so its lowest point sits at `rootY`, which keeps feet planted
 * without needing IK.
 */
export class Skeleton {
    constructor(bones = BONES) {
        this.bones = bones;
        this.joints = Object.fromEntries(JOINT_NAMES.map((name) => [name, { x: 0, y: 0 }]));
    }

    solve(pose, facing, rootX, rootY) {
        const { bones: b, joints: j } = this;
        const f = facing;

        j.hip.x = pose.hipX * f;
        j.hip.y = 0;

        this.#limb(j.hip, j.kneeF, pose.thighF, b.thigh, f);
        this.#limb(j.kneeF, j.footF, pose.shinF, b.shin, f);
        this.#limb(j.hip, j.kneeB, pose.thighB, b.thigh, f);
        this.#limb(j.kneeB, j.footB, pose.shinB, b.shin, f);

        j.neck.x = j.hip.x + f * Math.sin(pose.torso) * b.torso;
        j.neck.y = j.hip.y - Math.cos(pose.torso) * b.torso;

        const headAngle = pose.torso + pose.head;
        const headDistance = b.neck + b.headRadius;
        j.head.x = j.neck.x + f * Math.sin(headAngle) * headDistance;
        j.head.y = j.neck.y - Math.cos(headAngle) * headDistance;

        this.#limb(j.neck, j.elbowF, pose.uArmF, b.upperArm, f);
        this.#limb(j.elbowF, j.handF, pose.lArmF, b.forearm, f);
        this.#limb(j.neck, j.elbowB, pose.uArmB, b.upperArm, f);
        this.#limb(j.elbowB, j.handB, pose.lArmB, b.forearm, f);

        let lowest = j.head.y + b.headRadius;
        for (const name of SUPPORT_JOINTS) lowest = Math.max(lowest, j[name].y);

        const dy = rootY - lowest;
        for (const name of JOINT_NAMES) {
            j[name].x += rootX;
            j[name].y += dy;
        }
        return j;
    }

    #limb(from, to, angle, length, facing) {
        to.x = from.x + facing * Math.sin(angle) * length;
        to.y = from.y + Math.cos(angle) * length;
    }
}

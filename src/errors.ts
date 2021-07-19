export class NotClosedGroupError extends Error {
    constructor(public readonly openAt: number) {
        super();
        this.name = "NotClosedGroupError";
    }
}

export class UnexpectedCloseGroup extends Error {
    constructor(public readonly at: number) {
        super();
        this.name = "UnexpectedCloseGroup";
    }
}

export class NoSpaceAfterGroup extends Error {
    constructor(public readonly at: number) {
        super();
        this.name = "NoSpaceAfterGroup";
    }
}

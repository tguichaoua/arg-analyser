import { expect } from "chai";
import { describe, it } from "mocha";

import { ArgItem, NotClosedGroupError, UnexpectedCloseGroup } from ".";
import { Analyser, Options } from "./analyser";

function fullTest(analyse: (s: string) => ArgItem[]) {
    function test(input: string, expected: ArgItem[]) {
        it(input, () => expect(analyse(input)).to.be.deep.equals(expected));
    }

    describe("One kind of item", () => {
        test(`hello world !`, [
            { kind: "string", delimiter: "", content: "hello" },
            { kind: "string", delimiter: "", content: "world" },
            { kind: "string", delimiter: "", content: "!" },
        ]);

        test(`   a      lot of              space`, [
            { kind: "string", delimiter: "", content: "a" },
            { kind: "string", delimiter: "", content: "lot" },
            { kind: "string", delimiter: "", content: "of" },
            { kind: "string", delimiter: "", content: "space" },
        ]);

        test(`[a group]`, [
            {
                kind: "group",
                delimiter: ["[", "]"],
                content: [
                    { kind: "string", delimiter: "", content: "a" },
                    { kind: "string", delimiter: "", content: "group" },
                ],
            },
        ]);

        test(`(another group)`, [
            {
                kind: "group",
                delimiter: ["(", ")"],
                content: [
                    { kind: "string", delimiter: "", content: "another" },
                    { kind: "string", delimiter: "", content: "group" },
                ],
            },
        ]);

        test(`{again group}`, [
            {
                kind: "group",
                delimiter: ["{", "}"],
                content: [
                    { kind: "string", delimiter: "", content: "again" },
                    { kind: "string", delimiter: "", content: "group" },
                ],
            },
        ]);
    });

    describe("Quoted", () => {
        test(`"a double quoted string"`, [{ kind: "string", delimiter: '"', content: "a double quoted string" }]);

        test(`'a simple quoted string'`, [{ kind: "string", delimiter: "'", content: "a simple quoted string" }]);

        test(`"it's a string"`, [{ kind: "string", delimiter: '"', content: "it's a string" }]);

        test(`'"a string in another !"'`, [{ kind: "string", delimiter: "'", content: '"a string in another !"' }]);

        test(`"escape the \\"string\\""`, [{ kind: "string", delimiter: '"', content: 'escape the "string"' }]);

        test(`'It\\'s a string'`, [{ kind: "string", delimiter: "'", content: "It's a string" }]);
    });

    describe("Multiple kind at root level", () => {
        test(`translate "Hello world !" in [french spanish]`, [
            { kind: "string", delimiter: "", content: "translate" },
            { kind: "string", delimiter: '"', content: "Hello world !" },
            { kind: "string", delimiter: "", content: "in" },
            {
                kind: "group",
                delimiter: ["[", "]"],
                content: [
                    { kind: "string", delimiter: "", content: "french" },
                    { kind: "string", delimiter: "", content: "spanish" },
                ],
            },
        ]);

        test(`"a group (its me) inside a quote"`, [
            { kind: "string", delimiter: '"', content: "a group (its me) inside a quote" },
        ]);
    });

    describe("Not closed group", () => {
        const test = (input: string, error: Function) => it(input, () => expect(() => analyse(input)).to.throw(error));
        test(`"You have to close the string`, NotClosedGroupError);
        test(`"You have to close the string\\"`, NotClosedGroupError);
        test(`(some group`, NotClosedGroupError);
        test(`[inner (group]`, UnexpectedCloseGroup);
    });

    describe("Recursive group", () => {
        test(`[deep { in (the [rabbit (hole) ] )} ]`, [
            {
                kind: "group",
                delimiter: ["[", "]"],
                content: [
                    { kind: "string", delimiter: "", content: "deep" },
                    {
                        kind: "group",
                        delimiter: ["{", "}"],
                        content: [
                            { kind: "string", delimiter: "", content: "in" },
                            {
                                kind: "group",
                                delimiter: ["(", ")"],
                                content: [
                                    { kind: "string", delimiter: "", content: "the" },
                                    {
                                        kind: "group",
                                        delimiter: ["[", "]"],
                                        content: [
                                            { kind: "string", delimiter: "", content: "rabbit" },
                                            {
                                                kind: "group",
                                                delimiter: ["(", ")"],
                                                content: [{ kind: "string", delimiter: "", content: "hole" }],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);
    });
}

describe("Argument Analyser", () => {
    const options: Options = {
        groupDelimiters: [
            ["[", "]"],
            ["(", ")"],
            ["{", "}"],
        ],
        quotes: "both",
    };

    describe("One shot analyse", () => {
        const analyse = (s: string) => Analyser.analyse(s, options);
        fullTest(analyse);
    });

    describe("Object Analyser", () => {
        const analyser = new Analyser(options);
        const analyse = (s: string) => analyser.analyse(s);
        fullTest(analyse);
    });
});

import { Analyser, Options } from "../src";

const sample = `Lorem ipsum "dolor sit amet, consectetur" adipiscing (elit. [In id {fermentum mi.}] Curabitur) viverra, 'justo \\'nec viver"ra' mollis, lec"tus massa."`;
const iterations = [1, 100, 10000, 100000];

const options: Options = {
    groupDelimiters: [
        ["[", "]"],
        ["(", ")"],
        ["{", "}"],
    ],
    quotes: "both",
};

for (let n of iterations) {
    console.log(`[${n}]`);
    console.time(`One shot`);
    for (let i = 0; i < n; ++i) {
        Analyser.analyse(sample, options);
    }
    console.timeEnd(`One shot`);

    console.time(`Analyse`);
    const analyser = new Analyser(options);
    for (let i = 0; i < n; ++i) {
        analyser.analyse(sample);
    }
    console.timeEnd(`Analyse`);
    console.log("--------------------------------------");
}

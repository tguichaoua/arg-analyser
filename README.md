# Arg Analyser

A simple configurable string analyser to get elements from command like string.

-   Split the string by space
-   Don't split string between quotes
-   Recursive group

## How to use it

```ts
import { Analyser } from "arg-analyser";

const sample = `Lorem ipsum "dolor sit amet, consectetur" adipiscing (elit. [In id {fermentum mi.}] Curabitur) viverra, 'justo \\'nec viver"ra' mollis, lec"tus massa."`;

// Perform a one shot analyse
const args = Analyser.analyse(sample, {
    delimiters: [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"],
    ],
});

// Instantiate a Analyse object to re-use it
const analyser = new Analyser({
    delimiters: [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"],
    ],
});

const args1 = analyser.analyse("hello world !");
const args2 = analyser.analyse(sample);
```

## Example

To run the example script :

1. Clone this repository `git clone https://github.com/tguichaoua/arg-analyser.git`
2. Enter in the directory `cd arg-analyser`
3. Install dependencies `npm install`
4. Run the example script `npm run example`

```
========================================
hello world !
----------------------------------------
├ ∅  hello
├ ∅  world
├ ∅  !
========================================
"hello world" !
----------------------------------------
├ "  hello world
├ ∅  !
========================================
[deep (in {the (rabbit [hole])})]
----------------------------------------
├ [ ]
│  ├ ∅  deep
│  ├ ( )
│  │  ├ ∅  in
│  │  ├ { }
│  │  │  ├ ∅  the
│  │  │  ├ ( )
│  │  │  │  ├ ∅  rabbit
│  │  │  │  ├ [ ]
│  │  │  │  │  ├ ∅  hole
========================================
```

## 📝 License

Copyright © 2021 [Tristan Guichaoua](https://github.com/tguichaoua).<br />
This project is [MIT](https://github.com/tguichaoua/arg-analyser/blob/main/LICENSE) licensed.

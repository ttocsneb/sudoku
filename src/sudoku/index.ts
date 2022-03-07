import { Sudoku } from "./models";

/**
 * Structure
 * n # Number of numbers in this line
 * 
 * If n == 9
 *      # This will be a full line, so no space indication is given
 * else
 *      # Each number will be preceded by a space to the next number
 */
//

type Tree = BinaryTree | number;

interface BinaryTree {
    1: Tree,
    0: Tree,
}

type BinArray = Array<0 | 1>;
interface ReverseTree {
    [k: number]: BinArray;
}

const tree: Tree = {
    1: {
        1: {
            1: 9,
            0: 0,
        },
        0: {
            1: 1,
            0: 2,
        },
    },
    0: {
        1: {
            1: {
                1: 4,
                0: 5,
            },
            0: {
                1: 6,
                0: 7,
            },
        },
        0: {
            1: 3,
            0: {
                1: 8,
                0: 0xF,
            }
        },
    },
};

function get_tree(tree: Tree, value: Array<0 | 1>): {result: number, used: number} {
    let node = tree;
    let used = 0
    for (const val of value) {
        if (typeof(node) == "number") {
            return {
                result: node,
                used: used
            };
        }
        node = node[val];
        used++;
    }
    throw new Error("Not enough bits to fetch number");
}

function reverse_tree(tree: Tree, path: BinArray = undefined): ReverseTree {
    if (path == undefined) {
        path = [];
    }
    const result: ReverseTree = {};
    if (typeof(tree) == "number") {
        // console.log(`${path} -> ${tree}`);
        result[tree] = path;
        return result;
    }
    const next0: BinArray = [...path];
    next0.push(0);
    for (const [k, v] of Object.entries(reverse_tree(tree[0], next0))) {
        result[k] = v;
    }

    const next1: BinArray = [...path];
    next1.push(1);
    for (const [k, v] of Object.entries(reverse_tree(tree[1], next1))) {
        result[k] = v;
    }

    return result;
}

const tree_reversed = reverse_tree(tree);


function from_encoded(base64: string): Array<number> {
    const data: Array<number> = [];

    const bits: BinArray = [];
    const binary = window.atob(base64.replaceAll('~', '=').replaceAll('-', '+').replaceAll('_', '/'));

    for (let i = 0; i < binary.length; i++) {
        const byte = binary.charCodeAt(i);
        for (let b = 0; b < 8; b++) {
            bits.push((byte >> b) & 1 ? 1 : 0);
        }
    }
    const bit_length = bits.length;

    while (bits.length > 0) {
        try {
            const res = get_tree(tree, bits);
            if (res.result == 0xF) {
                // console.log('Found Stop byte');
                break;
            }
            data.push(res.result);
            const used = bits.splice(0, res.used);
            // console.log(`Extracted ${res.result} from ${used}`);
        } catch (err) {
            break;
        }
    }

    // console.log(`Decoded ${data.length * 4} bits from ${bit_length} encoded bits (${100 - bit_length / (data.length * 4) * 100}% compression)`);

    return data;
}

function to_encoded(data: Array<number>): string {
    const bits: BinArray = [];

    for (const val of data) {
        bits.push(...tree_reversed[val]);
    }
    bits.push(...tree_reversed[0xF]);

    // Convert binary bits into a binary string
    let binary = "";
    for (let i = 0; i < bits.length; i += 8) {
        const num_bits = i + 8 > bits.length ? bits.length - i : 8;
        let charCode = 0;
        for (let b = 0; b < num_bits; b++) {
            charCode |= bits[i + b] << b;
        }
        binary += String.fromCharCode(charCode);
    }

    // console.log(`Encoded ${binary.length * 8} bits from ${data.length * 4} bits (${100 - binary.length * 8 / (data.length * 4) * 100}% compression)`);

    return window.btoa(binary).replaceAll('/', '_').replaceAll('+', '-').replaceAll('=', '~');
}

export function parse(base64: string): Sudoku {
    // console.log(`Decoding data ${base64}`);
    const values: Array<number> = from_encoded(base64);
    // console.log(values);

    const sudoku = new Sudoku();
    let row = -1;
    let col = 0;
    let nums_left = 0
    let padding = false;
    for (let i = 0; i < values.length; i++) {
        if (nums_left == 0) {
            row++;
            col = 0;
            nums_left = values[i];
            padding = nums_left != 9;
            continue;
        }
        if (padding) {
            col += values[i];
            i++;
        }
        // console.log(`Setting [${col},${row}] = ${values[i]}`);
        sudoku.set(col, row, values[i]);
        col++;
        nums_left -= 1;
    }

    return sudoku;
}

export function dump(sudoku: Sudoku): string {
    const vals: Array<number> = [];
    for (const row of sudoku) {
        let count = 0
        for (let x = 0; x < 9; x++) {
            if (row[x] != 0) {
                count += 1;
            }
        }
        const padding = count != 9;
        vals.push(count);
        let dist = 0;
        for (let x = 0; x < 9; x++) {
            if (row[x] == 0) {
                dist++;
                continue;
            }
            if (padding) vals.push(dist);
            vals.push(row[x]);
            dist = 0;
        }
    }

    // console.log("Encoding data...");
    // console.log(vals);
    return to_encoded(vals);
}

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


export function parse(base64: string): Sudoku {
    const values: Array<number> = [];

    const binary = window.atob(base64);
    for (let i = 0; i < binary.length; i++) {
        const byte = binary.charCodeAt(i);
        values.push((byte & 0xF0) >> 4);
        values.push(byte & 0xF);
    }
    console.log("Reading:");
    console.log(values);

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
        console.log(`Setting [${col},${row}] = ${values[i]}`);
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

    console.log("Writing:");
    console.log(vals);

    let binary = ''
    for (let i = 0; i < vals.length; i += 2) {
        binary += String.fromCharCode((vals[i] << 4) | (vals[i + 1]));
    }

    return window.btoa(binary);
}

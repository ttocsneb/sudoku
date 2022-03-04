
export class Sudoku implements Iterable<Array<number>> {
    private board: Array<Array<number>> = [];

    public constructor(board: Array<Array<number>> = undefined) {
        for (let i = 0; i < 9; i++) {
            const row = [];
            for (let j = 0; j < 9; j++) {
                if (board != undefined) {
                    row.push(board[i][j]);
                } else {
                    row.push(0);
                }
            }
            this.board.push(row);
        }
    }

    public get(x: number, y: number): number {
        return this.board[y][x];
    }

    public set(x: number, y: number, val: number): void {
        if (x > 8 || x < 0) {
            throw new Error(`x index must be in the range [0-8]`);
        }
        if (y > 8 || y < 0) {
            throw new Error(`y index must be in the range [0-8]`);
        }
        if (val < 0 || val > 9) {
            throw new Error(`value must be in the range [0-9]`);
        }
        this.board[y][x] = val;
    }

    public getOptions(x: number, y: number): Set<number> {
        const valid: Set<number> = new Set();
        if (this.get(x, y) != 0) {
            valid.add(this.get(x, y));
        } else {
            for (let i = 1; i <= 9; i++) {
                valid.add(i);
            }
        }

        const group_x = Math.floor(x / 3) * 3;
        const group_y = Math.floor(y / 3) * 3;

        for (let i = group_x; i < group_x + 3; i++) {
            for (let j = group_y; j < group_y + 3; j++) {
                if (i == x && j == y) continue;
                valid.delete(this.get(i, j));
            }
        }

        for (let i = 0; i < 9; i++) {
            if (i == x) continue;
            valid.delete(this.get(i, y));
        }

        for (let j = 0; j < 9; j++) {
            if (j == y) continue;
            valid.delete(this.get(x, j));
        }

        // console.log(`${x}, ${y} => ${valid.size}`);

        return valid;
    }

    public isValid(): boolean {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.getOptions(i, j).size == 0) {
                    return false;
                }
            }
        }
        return true;
    }

    public isSolved(): boolean {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (this.get(x, y) == 0) {
                    return false;
                }
            }
        }
        return this.isValid();
    }

    public findSolutions(find_all = false): Array<Sudoku> {
        const solutions: Array<Sudoku> = [];

        if (!this.isValid()) {
            return solutions;
        }

        const copy = new Sudoku(this.board);

        // Recursively go through each possible option
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (copy.get(x, y) != 0) continue;
                const options = copy.getOptions(x, y);
                for (const option of options) {
                    copy.set(x, y, option);
                    const new_solutions = copy.findSolutions(find_all);
                    for (const sol of new_solutions) {
                        solutions.push(sol);
                    }
                    if (!find_all && solutions.length > 1) {
                        return solutions;
                    }
                }
                return solutions;
            }
        }

        // Make sure that this solution is valid
        if (copy.isSolved()) {
            solutions.push(copy);
        }

        return solutions;
    }

    public makeSolveable(): Sudoku | null {
        let n_solutions = this.findSolutions(false).length;
        if (n_solutions == 1) {
            return this;
        }
        if (n_solutions == 0) {
            return null;
        }

        const copy = new Sudoku(this.board);

        // Add random numbers until a starting position with a valid solution is found
        while (n_solutions != 1) {
            const x = Math.floor(Math.random() * 9);
            const y = Math.floor(Math.random() * 9);

            if (copy.get(x, y) == 0) {
                copy.set(x, y, Math.floor(Math.random() * 9) + 1);
                n_solutions = copy.findSolutions(false).length;
                if (n_solutions == 0) {
                    copy.set(x, y, 0);
                    continue;
                } 
                if (n_solutions == 1) {
                    break;
                }
            }
        }

        const to_remove: Array<{x: number, y: number}> = [];

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (copy.get(x, y) == 0) continue;
                to_remove.push({x, y});
            }
        }
        to_remove.sort(() => Math.random() - 0.5);

        for (const point of to_remove) {
            const val = copy.get(point.x, point.y);
            copy.set(point.x, point.y, 0);
            n_solutions = copy.findSolutions(false).length;
            if (n_solutions > 1) {
                copy.set(point.x, point.y, val);
            }
        }

        return copy;
    }

    public [Symbol.iterator](): Iterator<Array<number>> {
        let index = 0;
        const board = this.board;
        return {
            next() {
                return {
                    done: index == board.length,
                    value: board[index++],
                };
            },
        };
    }

    public toString(): string {
        let result = '';
        for (let y = 0; y < 9; y++) {
            if (y % 3 == 0) {
                result += ` |${'-'.repeat(22)}-|\n`;
            }
            for (let x = 0; x < 9; x++) {
                const val = this.get(x, y);
                if (x % 3 == 0) {
                    result += ' |'
                }
                result += ` ${val == 0 ? ' ' : val}`;
            }
            result += ' |\n'
        }
        result += ` |${'-'.repeat(22)}-|`;
        return result;
    }
}

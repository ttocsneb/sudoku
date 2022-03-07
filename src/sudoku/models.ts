
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

    public findSolutions(find = -1, time_limit: number = undefined, start: number = undefined): Array<Sudoku> {
        const solutions: Array<Sudoku> = [];

        if (!this.isValid()) {
            return solutions;
        }

        start = start == undefined ? Date.now() : start;
        if (time_limit != undefined) {
            if (Date.now() - start > time_limit) {
                return solutions;
            }
        }

        const copy = new Sudoku(this.board);

        // Recursively go through each possible option
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (copy.get(x, y) != 0) continue;
                const options = copy.getOptions(x, y);
                for (const option of options) {
                    copy.set(x, y, option);
                    const new_solutions = copy.findSolutions(find, time_limit, start);
                    for (const sol of new_solutions) {
                        solutions.push(sol);
                    }
                    if (find > 0 && solutions.length >= find) {
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

    public makeSolveable(progress: (progress: number) => void = undefined, time_limit: number = undefined): Sudoku | null {
        let n_solutions = this.findSolutions(2).length;
        if (n_solutions == 0) {
            return null;
        }
        const start = Date.now();
        function hasTimeRanOut(): boolean {
            if (time_limit != undefined) {
                return Date.now() - start > time_limit;
            }
            return false;
        }

        let copy = new Sudoku(this.board);
        if (n_solutions > 1) {
            // Add random numbers until a starting position with a valid solution is found
            const to_add: Array<{x: number, y: number}> = [];
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    if (copy.get(x, y) != 0) continue;
                    to_add.push({x, y});
                }
            }

            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

            let iters = Math.min(to_add.length, 81);
            const max_iter = iters;
            while (iters > 0) {
                to_add.sort(() => Math.random() - 0.5);

                for (const p of to_add) {
                    if (iters <= 0) break;
                    if (copy.get(p.x, p.y) != 0) continue;

                    numbers.sort(() => Math.random() - 0.5);
                    for (const num of numbers) {
                        if (hasTimeRanOut()) {
                            return;
                        }
                        copy.set(p.x, p.y, num);
                        n_solutions = copy.findSolutions(2, 2000).length;
                        if (n_solutions == 0) {
                            copy.set(p.x, p.y, 0);
                            continue;
                        } 
                        break;
                    }
                    if (n_solutions == 1) {
                        iters = 0;
                        break;
                    }
                    iters--;
                    if (progress != undefined) {
                        progress((max_iter - iters) / max_iter * 0.5);
                    }
                    // console.log(`${max_iter - iters} / ${max_iter}`);
                }
            }
        }
        if (progress != undefined) {
            progress(0.5);
        }
        // console.log("Done");

        if (n_solutions != 1) {
            const found_solutions = copy.findSolutions(10, 2000);
            // console.log(`found ${found_solutions.length}`);
            copy = found_solutions[Math.floor(Math.random() * found_solutions.length)];
        }

        const to_remove: Array<{x: number, y: number}> = [];

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (copy.get(x, y) == 0) continue;
                to_remove.push({x, y});
            }
        }
        to_remove.sort(() => Math.random() - 0.5);

        let i = 0;
        for (const point of to_remove) {
            if (hasTimeRanOut()) {
                return copy;
            }
            i++;
            // console.log(`${i} / ${to_remove.length}`);
            const val = copy.get(point.x, point.y);
            copy.set(point.x, point.y, 0);
            n_solutions = copy.findSolutions(2, 2000).length;
            if (n_solutions > 1) {
                copy.set(point.x, point.y, val);
            }
            if (progress != undefined) {
                progress(0.5 + (i / to_remove.length) * 0.5);
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

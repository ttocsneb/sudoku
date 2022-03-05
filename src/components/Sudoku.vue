<template>
    <div>
        <table>
            <tr v-for="row, i in cells" :key="i">
                <td v-for="cell, j in row" :key="j">
                    <button @click="onClick(i, j)" :class="{'empty': cell.value == 0, 'selected': cell.selected}">
                        {{ cell.value == 0 ? '_' : cell.value }}
                    </button>
                </td>
            </tr>
        </table>
        <p v-if="message" ref="message">{{ message }}</p>
        <div v-if="solvable">
            <h4>Share this puzzle!</h4>
            <p v-if="solutionCode != generatedCode"><small><a :href="`?c=${generatedCode}`">{{ origin }}/sudoku/?c={{ generatedCode }}</a></small></p>
            <img v-if="solutionCode != generatedCode" :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${origin}/sudoku/?c=${generatedCode}`" />
            <p><small>Solution: <a :href="`?c=${solutionCode}`">{{ origin }}/sudoku/?c={{ solutionCode }}</a></small></p>
            <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${origin}/sudoku/?c=${solutionCode}`" />
        </div>
        <form v-if="selected != null" @submit.prevent="onSubmit" class="no-print">
            <input ref="valueSelect" type="number" placeholder="Value" v-model="value_select" />
            <button type="submit">Save</button>
        </form>
        <button class="no-print" @click="makeSolveable">Make Solveable</button>
        <button class="no-print" @click="clear">Clear</button>
    </div>
</template>

<script lang="ts">
import { dump, parse } from '@/sudoku';
import { Sudoku } from '@/sudoku/models';
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

interface Cell {
    value: number;
    selected: boolean;
}

@Component
export default class extends Vue {
    cells: Array<Array<Cell>> = [];

    generatedCode = '';
    solutionCode = '';
    message = null;
    selected: Array<number> | null = null;
    value_select = '';
    solvable = false;

    constructor() {
        super();
        for (let i = 0; i < 9; i++) {
            const row: Array<Cell> = [];
            for (let j = 0; j < 9; j++) {
                row.push({
                    value: 0,
                    selected: false,
                });
            }
            this.cells.push(row);
        }
    }

    mounted(): void {
        this.parseInput();
    }

    @Prop(String) readonly code: string | undefined;

    @Watch("code")
    onCodeChanged(): void {
        this.parseInput();
    }

    convertToSudoku(): Sudoku {
        const sudoku = new Sudoku();
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                sudoku.set(x, y, this.cells[y][x].value);
            }
        }
        return sudoku;
    }

    onSudokuChanged(): void {
        const sudoku = this.convertToSudoku();
        this.generatedCode = dump(sudoku);
        this.verifySudokuIsSolvable();
    }

    verifySudokuIsSolvable(): void {
        this.message = "Verifying this puzzle...";
        const sudoku = this.convertToSudoku();
        setTimeout(() => {
            const solutions = sudoku.findSolutions(2);
            // console.log(`Found ${solutions.length} solutions`);
            if (solutions.length > 1) {
                this.message = `There are too many solutions to this puzzle!`;
                this.solvable = false;
                return;
            }
            if (solutions.length == 0) {
                this.message = 'This puzzle is not solveable!';
                this.solvable = false;
                return;
            }
            this.solvable = true;
            this.message = null;
            this.solutionCode = dump(solutions[0]);
        }, 0);
    }

    onClick(y: number, x: number): void {
        if (this.selected != null) {
            this.cells[this.selected[0]][this.selected[1]].selected = false;
        }
        this.selected = [y, x];
        this.cells[y][x].selected = true;
        this.value_select = '';
        setTimeout(() => {
            (this.$refs.valueSelect as HTMLInputElement).focus();
        }, 10);
        // console.log(`(${y}, ${x}) was clicked`);
    }

    onSubmit(): void {
        let s = this.selected;
        const val = Number(this.value_select);
        this.cells[s[0]][s[1]].selected = false;
        this.selected = null;
        if (val >= 0 && val <= 9) {
            this.cells[s[0]][s[1]].value = val;
            this.onSudokuChanged();
        }
    }

    makeSolveable(): void {
        this.message = "Making the current starting position solveable..";
        const sudoku = this.convertToSudoku();
        setTimeout(() => {
            const solution = sudoku.makeSolveable((progress) => {
                console.log(`Progress: ${Math.round(progress * 100)}%`);
            }, 15000);
            if (solution == undefined) {
                this.message = "Could not make a valid starting position";
                return;
            }
            this.loadFromSudoku(solution);
            this.onSudokuChanged();
        }, 0);
    }

    parseInput(): void {
        try {
            let code = this.code;
            if (code == undefined) {
                const urlParams = new URLSearchParams(window.location.search);
                code = urlParams.get("c")
            }

            if (code == undefined) {
                code = "AAAAAA==";
            }

            let sudoku = parse(code);
            this.loadFromSudoku(sudoku);
            this.message = null;
            this.onSudokuChanged();
        } catch(error) {
            this.message = "Invalid Sudoku Code";
        }
    }

    clear(): void {
        const sudoku = new Sudoku();
        this.loadFromSudoku(sudoku);
        this.onSudokuChanged();
    }

    loadFromSudoku(sudoku: Sudoku): void {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                this.cells[y][x].value = sudoku.get(x, y);
            }
        }
    }

    get origin(): string {
        return window.location.origin;
    }
}
</script>

<style scoped>
table {
    border-collapse: collapse;
}

td {
    margin: 0;
    padding: 0;
    border: 1px solid gray;
    width: calc(1em + 12px);
    height: calc(1em + 12px);
}

td:nth-child(3), td:nth-child(6) {
    border-right: 2px solid black;
}

tr:nth-child(3) > td, tr:nth-child(6) > td {
    border-bottom: 2px solid black;
}

table {
    border: solid 2px black;
    margin-top: 1em;
    margin-bottom: 1em;
    margin-left: auto;
    margin-right: auto;
}

td > button {
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: 0;
}

td > button:hover {
    background: lightgray;
}

.empty {
    color: rgba(0, 0, 0, 0);
}

.selected {
    background: gray;
}

@media print {
    table {
        font-size: 2em;
    }
}

</style>
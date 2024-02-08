// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            updateDecorations(vscode.window.activeTextEditor);
        }
    }, null, context.subscriptions);
}

/**
 * Updates the decorations in the text editor based on the RINEX file content.
 * @param editor The text editor to update the decorations in.
 */
export function updateDecorations(editor: vscode.TextEditor) {
    const text = editor.document.getText();
    const lines = text.split('\n');

    // Color map for RINEX version 2 and 3 observation types
    const colorMapRinex2 = {
        "C1": "#8000ff",
        "C2": "#4062fa",
        "C5": "#00b5eb",
        "C6": "#40ecd4",
        "C7": "#80ffb4",
        "C8": "#c0eb8d",
        "P1": "#ffb360",
        "P2": "#ff5f30",
    };

    // Note: RINEX 3 color map does not include "codeless" observables
    const colorMapRinex3 = {
        "C1A": "#8000ff",
        "C1B": "#780dff",
        "C1C": "#7019ff",
        "C1D": "#6826fe",
        "C1L": "#6032fe",
        "C1M": "#583efd",
        "C1P": "#504afc",
        "C1S": "#4856fb",
        "C1W": "#4062fa",
        "C1X": "#386df9",
        "C1Y": "#3079f7",
        "C1Z": "#2884f6",
        "C2C": "#208ef4",
        "C2D": "#1898f2",
        "C2I": "#10a2f0",
        "C2L": "#08acee",
        "C2M": "#02b7eb",
        "C2P": "#0ac0e8",
        "C2Q": "#12c8e6",
        "C2S": "#1acfe3",
        "C2W": "#22d6e0",
        "C2X": "#2adddd",
        "C2Y": "#32e3da",
        "C3I": "#3ae8d6",
        "C3Q": "#42edd3",
        "C3X": "#4af2cf",
        "C4A": "#52f5cb",
        "C4B": "#5af8c8",
        "C4X": "#62fbc4",
        "C5A": "#6afdc0",
        "C5B": "#72febb",
        "C5C": "#7affb7",
        "C5D": "#84ffb2",
        "C5I": "#8cfead",
        "C5P": "#94fda8",
        "C5Q": "#9cfba4",
        "C5X": "#a4f89f",
        "C5Z": "#acf59a",
        "C6A": "#b4f295",
        "C6B": "#bced8f",
        "C6C": "#c4e88a",
        "C6E": "#cce385",
        "C6I": "#d4dd80",
        "C6L": "#dcd67a",
        "C6Q": "#e4cf74",
        "C6S": "#ecc86f",
        "C6X": "#f4c069",
        "C6Z": "#fcb763",
        "C7D": "#ffac5c",
        "C7I": "#ffa256",
        "C7P": "#ff9850",
        "C7Q": "#ff8e4a",
        "C7X": "#ff8444",
        "C7Z": "#ff793e",
        "C8D": "#ff6d38",
        "C8I": "#ff6232",
        "C8P": "#ff562c",
        "C8Q": "#ff4a26",
        "C8X": "#ff3e1f",
        "C9A": "#ff3219",
        "C9B": "#ff2613",
        "C9C": "#ff190d",
        "C9X": "#ff0d06",
    };

    const observationTypes: Record<string, string[]> = {};

    let rinexVersion = 0;
    let fileType = "";
    let is_body = false;
    let epoch = "";
    let numOfTotalEpoch = 0;
    let listOfAllSatellites: Record<string, string[]> = {};
    let startEpoch = "";
    let endEpoch = "";

    // Initialize the decoration types and decorations
    const decorationTypes: { [key: string]: vscode.TextEditorDecorationType } = {};
    const decorations: { [key: string]: vscode.DecorationOptions[] } = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Header
        if (line.length > 60 && line.substring(60).includes('RINEX VERSION / TYPE')) {
            // Get the RINEX version and file type
            rinexVersion = parseFloat(line.substring(0, 9));
            fileType = line.substring(20, 21);

            // Initialize the decoration types
            // RINEX version 2
            if (rinexVersion < 3.0) {
                for (const [str, color] of Object.entries(colorMapRinex2)) {
                    // C
                    decorationTypes[str] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline solid ${color}`
                    });

                    // Skip P1 and P2
                    if (str.substring(0, 1) === "P") { continue; }

                    // L
                    const obsTypeL = "L" + str.substring(1);
                    decorationTypes[obsTypeL] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline double ${color}`
                    });
                    // D
                    const obsTypeD = "D" + str.substring(1);
                    decorationTypes[obsTypeD] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline dotted ${color}`
                    });
                    // S
                    const obsTypeS = "S" + str.substring(1);
                    decorationTypes[obsTypeS] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline dashed ${color}`
                    });
                }
            }
            // RINEX version 3
            else {
                for (const [str, color] of Object.entries(colorMapRinex3)) {
                    // C
                    decorationTypes[str] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline solid ${color}`
                    });
                    // L
                    const obsTypeL = "L" + str.substring(1, 3);
                    decorationTypes[obsTypeL] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline double ${color}`
                    });
                    // D
                    const obsTypeD = "D" + str.substring(1, 3);
                    decorationTypes[obsTypeD] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline dotted ${color}`
                    });
                    // S
                    const obsTypeS = "S" + str.substring(1, 3);
                    decorationTypes[obsTypeS] = vscode.window.createTextEditorDecorationType({
                        textDecoration: `underline dashed ${color}`
                    });
                }
            }
            decorationTypes["obs header"] = vscode.window.createTextEditorDecorationType({
                fontWeight: "bold"                
            });

            // Initialize the observation types and decorations
            for (const key of Object.keys(decorationTypes)) {
                decorations[key] = [];
            }
            decorations["obs header"] = [];
        }
        // RINEX version 2
        else if (line.length > 60 && line.substring(60).includes('# / TYPES OF OBSERV')) {
            // Get number of observation types
            const gnss = "G";
            const numObsTypes = parseInt(line.substring(0, 6));

            // Get the observation types
            observationTypes[gnss] = [];
            for (let j = 0; j < numObsTypes; j++) {
                // If the number of observation types is greater than 9,
                // then the observation types are continued on the next line
                if (j > 0 && j % 9 === 0) { i++; }
                const obsType = line.substring(10+6*(j%9), 12+6*(j%9));
                observationTypes[gnss].push(obsType);

                // Decorate the observation types
                const startPos = new vscode.Position(i, 10+6*(j%9));
                const endPos = new vscode.Position(i, 12+6*(j%9));
                const range = new vscode.Range(startPos, endPos);

                if (decorationTypes[obsType]) {
                    decorations[obsType].push({ range });
                }
            }

        }
        // RINEX version 3
        else if (line.length > 60 && line.substring(60).includes('SYS / # / OBS TYPES')) {
            // Get GNSS and number of observation types
            const gnss = line.substring(0, 1);
            const numObsTypes = parseInt(line.substring(1, 6));

            // Get the observation types
            observationTypes[gnss] = [];
            for (let j = 0; j < numObsTypes; j++) {
                // If the number of observation types is greater than 13,
                // then the observation types are continued on the next line
                if (j > 0 && j % 13 === 0) { i++; }
                const obsType = lines[i].substring(7+4*(j%13), 10+4*(j%13));
                observationTypes[gnss].push(obsType);

                // Decorate the observation types
                const startPos = new vscode.Position(i, 7+4*(j%13));
                const endPos = new vscode.Position(i, 10+4*(j%13));
                const range = new vscode.Range(startPos, endPos);

                if (decorationTypes[obsType]) {
                    decorations[obsType].push({ range });
                }
            }
        }
        else if (line.length > 60 && line.substring(60).includes('END OF HEADER')) {
            is_body = true;
        }
        // Body of RINEX version 2
        else if (is_body && rinexVersion < 3.0) {
            // Check EOF
            if (line.length === 0) { break; }

            // Get the epoch and number of satellites
            epoch = convertRinex2ObsDate(line.substring(1, 26));
            console.log(epoch);

            if (startEpoch === "") {
                startEpoch = epoch;
            }
            numOfTotalEpoch++;

            // Decorate the obs header
            if (decorationTypes["obs header"]) {
                decorations["obs header"].push({ range: getRange(i, 0, i, line.length) });
            }

            const numOfSatellites = parseInt(line.substring(29, 32));
            const listOfSatellites = [];
            for (let j = 0; j < numOfSatellites; j++) {
                // If the number of satellites is greater than 12,
                // then the satellites are continued on the next line
                if (j > 0 && j % 12 === 0) {
                    i++;

                    // Decorate the obs header
                    if (decorationTypes["obs header"]) {
                        decorations["obs header"].push({ range: getRange(i, 0, i, line.length) });
                    }
                }
                const satellite = lines[i].substring(32+3*(j%12), 35+3*(j%12));
                const gnss = satellite.substring(0, 1);
                listOfSatellites.push(satellite);

                // Append the satellite to the list of all satellites
                if (!listOfAllSatellites[gnss]) {
                    listOfAllSatellites[gnss] = [];
                }
                if (!listOfAllSatellites[gnss].includes(satellite)) {
                    listOfAllSatellites[gnss].push(satellite);
                }
            }
            i++;

            // Get the observation values
            const numOfObs = observationTypes["G"].length;
            for (let j = 0; j < numOfSatellites; j++) {
                const satellite = listOfSatellites[j];
                if (observationTypes["G"]) {
                    // Decorate the observation value
                    for (let k = 0; k < numOfObs; k++) {
                        // If the number of observations is greater than 5,
                        // then the observations are continued on the next line
                        if (k > 0 && k % 5 === 0) { i++; }
                        const obsType = observationTypes["G"][k];

                        const decorationOptions: vscode.DecorationOptions = {
                            range: getRange(i, 16*(k%5), i, 14+16*(k%5)),
                            hoverMessage: getHoverMessage(satellite, epoch, obsType)
                        };

                        if (decorationTypes[obsType]) {
                            decorations[obsType].push(decorationOptions);
                        }
                    }
                    if (j < numOfSatellites - 1) { i++; }
                }
            }
        }
        // Body of RINEX version 3
        else if (is_body && rinexVersion >= 3.0) {
            if (line.substring(0, 1) === '>') {
                epoch = convertRinex3ObsDate(line.substring(2, 29));
                console.log(epoch);

                if (startEpoch === "") {
                    startEpoch = epoch;
                }
                numOfTotalEpoch++;

                // Decorate the obs header
                if (decorationTypes["obs header"]) {
                    decorations["obs header"].push({ range: getRange(i, 0, i, line.length) });
                }
            } else {
                const satellite = line.substring(0, 3);
                const gnss = satellite.substring(0, 1);

                // Append the satellite to the list of all satellites
                if (gnss !== "") {
                    if (!listOfAllSatellites[gnss]) {
                        listOfAllSatellites[gnss] = [];
                    }
                    if (!listOfAllSatellites[gnss].includes(satellite)) {
                        listOfAllSatellites[gnss].push(satellite);
                    }    
                }

                if (observationTypes[gnss]) {
                    const numOfObs = observationTypes[gnss].length;
                    // Decorate the observation value
                    for (let j = 0; j < numOfObs; j++) {
                        const obsType = observationTypes[gnss][j];

                        const decorationOptions: vscode.DecorationOptions = {
                            range: getRange(i, 3+16*j, i, 17+16*j),
                            hoverMessage: getHoverMessage(satellite, epoch, obsType)
                        };
 
                        if (decorationTypes[obsType]) {
                            decorations[obsType].push(decorationOptions);
                        }
                    }
                }
            }
        }
    }

    endEpoch = epoch;

    // Set the decorations
    for (const [key, decorationType] of Object.entries(decorationTypes)) {
        editor.setDecorations(decorationType, decorations[key]);
    }
    editor.setDecorations(decorationTypes["obs header"], decorations["obs header"]);

    console.log("Decorations updated");

    // Show the summary of the RINEX file
    if (fileType === "O") {

        let endOfDocumentDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: 'EOF (File Information)',
                color: 'gray',
            }
        });

        // Count number of all satellites
        let numOfAllSatellites = 0;
        for (const [gnss, satellites] of Object.entries(listOfAllSatellites)) {
            numOfAllSatellites += satellites.length;
        }

        // Create a markdown string for the hover message
        // combine 2 columns into 1 string
        let markdownString = `| Column | | Description |\n| --- | --- | --- |\n`;
        markdownString += `| RINEX | Version | \`${rinexVersion}\` |\n`;
        markdownString += `| | File Type | \`${fileType}\` |\n`;
        markdownString += `| Start Epoch | | \`${startEpoch}\` |\n`;
        markdownString += `| End Epoch | | \`${endEpoch}\` |\n`;
        markdownString += `| Number of Total Epochs | | \`${numOfTotalEpoch}\` |\n`;
        markdownString += `| Number of Satellites | | \`${numOfAllSatellites}\` |\n`;

        let i = 0;
        for (const [gnss, satellites] of Object.entries(listOfAllSatellites)) {
            // Sort the satellites
            satellites.sort((a, b) => {
                return a.localeCompare(b);
            });

            if (i === 0) {
                markdownString += `| List of Satellites | ${gnss} | `;
            } else {
                markdownString += `| | ${gnss} | `;
            }
            for (let i = 0; i < satellites.length; i++) {
                markdownString += `\`${satellites[i]}\``;
                if (i < satellites.length - 1) {
                    markdownString += ", ";
                }
            }
            markdownString += "|\n";

            i++;
        }

        const hoverMessage = new vscode.MarkdownString(markdownString);

        // Get the last line of the document
        let lastLine = editor.document.lineAt(editor.document.lineCount - 1);

        // Set the decoration at the end of the document
        editor.setDecorations(endOfDocumentDecorationType, [{
            range: new vscode.Range(lastLine.range.end, lastLine.range.end),
            hoverMessage: hoverMessage
        }]);
    }
}

// Convert RINEX version 2 observation date to ISO 8601 format
// Example: 20  6 21  0  0  0.0000000 -> 2020-06-21 00:00:00.000
function convertRinex2ObsDate(rinexDate: string): string {
    const year = parseInt(rinexDate.substring(0, 2)) + 2000;
    // JavaScript's months are 0-indexed
    const month = parseInt(rinexDate.substring(3, 5)) - 1;
    const day = parseInt(rinexDate.substring(6, 8));
    const hour = parseInt(rinexDate.substring(9, 11));
    const minute = parseInt(rinexDate.substring(12, 14));
    const second = parseFloat(rinexDate.substring(15, 24));

    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    return date.toISOString().replace('T', ' ').slice(0, -1);
}

// Convert RINEX version 3 observation date to ISO 8601 format
// Example: 2020 06 22 00 00  0.0000000 -> 2020-06-22 00:00:00.000
function convertRinex3ObsDate(rinexDate: string): string {
    const year = parseInt(rinexDate.substring(0, 4));
    // JavaScript's months are 0-indexed
    const month = parseInt(rinexDate.substring(5, 7)) - 1;
    const day = parseInt(rinexDate.substring(8, 10));
    const hour = parseInt(rinexDate.substring(11, 13));
    const minute = parseInt(rinexDate.substring(14, 16));
    const second = parseFloat(rinexDate.substring(17, 26));

    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    return date.toISOString().replace('T', ' ').slice(0, -1);
}

// Get the hover message for the observation value
function getHoverMessage(satellite: string, epoch: string, observationType: string): vscode.MarkdownString {
    return new vscode.MarkdownString(`\n| Epoch | SVID | Obs. Type |\n| --- | --- | --- |\n| \`${epoch}\` | \`${satellite}\` | \`${observationType}\` |\n`);
}

// Get range
function getRange(startLine: number, startCharacter: number, endLine: number, endCharacter: number): vscode.Range {
    const startPos = new vscode.Position(startLine, startCharacter);
    const endPos = new vscode.Position(endLine, endCharacter);
    return new vscode.Range(startPos, endPos);
}


// This method is called when your extension is deactivated
export function deactivate() {}

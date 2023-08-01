import {EditorView, basicSetup} from "codemirror"
import {StreamLanguage} from "@codemirror/language"
import {clike} from "@codemirror/legacy-modes/mode/clike"
import {FaustCompiler, FaustMonoDspGenerator, LibFaust, instantiateFaustModuleFromFile} from "@grame/faustwasm"
import jsURL from "@grame/faustwasm/libfaust-wasm/libfaust-wasm.js?url"
import dataURL from "@grame/faustwasm/libfaust-wasm/libfaust-wasm.data?url"
import wasmURL from "@grame/faustwasm/libfaust-wasm/libfaust-wasm.wasm?url"
import faustSvg from "./faustText.svg"

const keywords = "process component import library declare with environment route waveform soundfile"
const atoms = "mem prefix int float rdtable rwtable select2 select3 ffunction fconstant fvariable button checkbox vslider hslider nentry vgroup hgroup tgroup vbargraph hbargraph attach acos asin atan atan2 cos sin tan exp log log10 pow sqrt abs min max fmod remainder floor ceil rint"

function words(str: string) {
    const obj: {[key: string]: true} = {}
    const words = str.split(" ")
    for (let i = 0; i < words.length; i++) obj[words[i]] = true
    return obj
}

const faustLanguage = StreamLanguage.define(clike({
    name: "clike",
    multiLineStrings: true,
    keywords: words(keywords),
    atoms: words(atoms),
    hooks: {
        "@": () => "meta",
        "'": () => "meta",
    }
}))

const generator = new FaustMonoDspGenerator()
let compiler: FaustCompiler
console.log(compiler!, generator)
async function loadFaust() {
    // Setup Faust
    const module = await instantiateFaustModuleFromFile(jsURL, dataURL, wasmURL)
    const libFaust = new LibFaust(module)
    compiler = new FaustCompiler(libFaust)
    console.log("Loaded Faust")
}

const faustPromise = loadFaust()

// const audioCtx = new AudioContext()
// async function setupAudio() {
//     await audioCtx.resume()
// }

// let node: AudioNode | undefined
// async function run() {
//     await faustPromise
//     // Compile Faust code
//     await generator.compile(compiler, "dsp", editor.state.doc.toString(), "")
//     // Create an audio node from compiled Faust
//     if (node !== undefined) node.disconnect()
//     node = (await generator.createNode(audioCtx))!
//     node.connect(audioCtx.destination)
// }

// const el = document.createElement("button")
// el.innerText = "Run"
// el.onclick = async () => {
//     el.onclick = run
//     await setupAudio()
//     run()
// }
// document.body.appendChild(el)

const template = document.createElement("template")
template.innerHTML = `
<div id="root">
    <div id="controls">
        <button id="run" disabled>Loading Faust...</button>
        <input id="volume" type="range" min="0" max="100">
        <a href="https://faust.grame.fr/"><img src="${faustSvg}" height="15px" /></a>
    </div>
    <div id="editor">
    </div>
</div>
<style>
    #root {
        border: 1px solid black;
        border-radius: 5px;
    }

    #controls {
        background: #384d64; /* #2b2e84; */
        border-bottom: 1px solid black;
        display: flex;
    }

    #controls > a {
        margin-left: auto;
        margin-right: 10px;
        display: flex;
        align-items: center;
    }
</style>
`

class FaustEditor extends HTMLElement {
    editor: EditorView | undefined = undefined

    constructor() {
        super()
        console.log("constructor", this.innerHTML)
    }

    connectedCallback() {
        console.log("connected", this.innerHTML)
        const code = this.innerHTML.replace("<!--", "").replace("-->", "").trim()
        this.attachShadow({mode: "open"}).appendChild(template.content.cloneNode(true))
        this.editor = new EditorView({
            doc: code,
            extensions: [basicSetup, faustLanguage],
            parent: this.shadowRoot!.querySelector("#editor")!,
        })
        const runButton = this.shadowRoot!.querySelector("#run") as HTMLButtonElement
        faustPromise.then(() => {
            runButton.textContent = "Run"
            runButton.disabled = false
        })
    }
}
customElements.define("faust-editor", FaustEditor)

console.log(faustSvg)

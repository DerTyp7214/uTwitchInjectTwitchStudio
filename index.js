const rimraf = require("rimraf")
const asar = require('asar')
const fs = require('fs')

const injectString = `require('electron')
app.on('web-contents-created', (event, window) => {
    // UTWITCH:INJECTED
    window.webContents.executeJavaScript(\`(() => {
        async function injectScript(url) {
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.id = 'uTwitchScript'
            script.onload = function () {
                console.info(url + ' loaded!')
            }
            script.src = url + '?v=' + Date.now();
            head.appendChild(script);
        }
        async function injectCss(url) {
            var head = document.getElementsByTagName('head')[0];
            var css = document.createElement('link');
            css.rel = "stylesheet"
            css.type = 'text/css';
            css.id = 'uTwitchStyle'
            css.href = url + '?v=' + Date.now();
            head.appendChild(css);
        }
        const button = document.createElement('button')
        button.innerText = 'Inject'
        button.onclick = () => {
            button.remove()
            injectScript('https://cdn.utwitch.net/utwitch/utwitch.min.js')
            injectCss('https://cdn.utwitch.net/utwitch/utwitch.min.css')
        }
        document.body.appendChild(button)
        console.log(document, button)
    })()\`)
})`

const arg = process.argv[2]

if (!arg) {
    console.log('Please provide the path for TwitchStudio!')
} else {
    const reee = arg.replace('\\TwitchStudio.exe', '')
    const path = reee + '/Electron/resources/'

    asar.extractAll(`${path}electron.asar`, './tmp/')
    fs.readFile('./tmp/browser/chrome-extension.js', 'utf8', (err, data) => {
        if (!data.includes('UTWITCH:INJECTED')) {
            const newString = data.replace(`require('electron')`, injectString)
            fs.writeFileSync('./tmp/browser/chrome-extension.js', newString)
            fs.unlink('tmp.asar', () => {
                fs.unlink(`${path}electron.asar`, async () => {
                    await asar.createPackage('./tmp/', `${path}electron.asar`)
                    fs.chmodSync(`${path}electron.asar`, 0o111)
                    rimraf('./tmp', () => { })
                })
            })
        }
    })
}
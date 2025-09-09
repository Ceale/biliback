import fs from "node:fs"
import path from "node:path"

for (let filename of fs.readdirSync("data/")) {
    let text = fs.readFileSync("data/"+filename, "utf8")
    let url = Array.from(text.matchAll(/"(https?:\/\/[^"]+)"/g), match => match[1])
    for (let aUrl of url) {
        let req = await fetch(aUrl)
        if (req.ok !== true) {
            let aUrl1 = aUrl.replaceAll("bfs/vc", "bfs/archive")
            let req1 = await fetch(aUrl1)
            if (req1.ok === true) {
                text = text.replaceAll(aUrl, aUrl1)
                console.warn("WARN", filename, aUrl, aUrl1)
            } else {
                console.error("ERROR", filename, aUrl, aUrl1)
            }
        }
    }
    fs.writeFileSync("data/"+filename, text, "utf8")
}

// let dir = 
//     .filter(file => file !== "index.json")
//     .sort()
//     .reverse()
//     .map(item => {
//         return {
//             name: JSON.parse(fs.readFileSync("data/"+item, "utf8"))?.name ?? path.parse(item).name,
//             url: item
//         }
//     })
// await fs.writeFile("data/index.json", JSON.stringify(dir))
import fs from 'node:fs/promises'
import fss from "node:fs"
import path from "node:path"

const dir = (await fs.readdir("data/"))
    .filter(file => file !== "index.json")
    .sort()
    .reverse()
    .map(item => {
        return {
            name: JSON.parse(fss.readFileSync("data/"+item, "utf8"))?.name ?? path.parse(item).name,
            url: item
        }
    })
await fs.writeFile("data/index.json", JSON.stringify(dir))
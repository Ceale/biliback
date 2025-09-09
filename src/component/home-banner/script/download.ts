import fs from "node:fs/promises"
import "@ceale/util"
import { tryCatch, uri } from "@ceale/util"

const dir = (await fs.readdir("data/"))
    .filter(file => file !== "index.json")

const errorlist = [] as { id: string, url: string }[]

for (const file of dir) {

    const dirname = uri.join("data/", file.removeSuffix(".json"))
    const [ state1 ] = await tryCatch(fs.stat(dirname))
    if (!(state1 && state1.isDirectory())) {
        await fs.mkdir(dirname)
        await fs.mkdir(uri.join(dirname, "res"))
    }
    const [ state2, err ] = await tryCatch(fs.stat(uri.join("data/", file)))
    // console.log(file, state2, err)
    if (!state2 || !state2!.isFile()) continue
    await fs.copyFile(uri.join("data/", file), uri.join(dirname, "data.json"))

    const data = JSON.parse(await fs.readFile(uri.join(dirname, "data.json"), "utf8"))

    async function traverseObject(obj, path = '') {
        // 检查当前节点是否是数组
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const item = obj[i]
                traverseObject(item, `${path}[${i}]`)
            }
        }
        // 检查当前节点是否是对象
        else if (obj && typeof obj === 'object') {
            const keys = Object.keys(obj)
            for (const key of keys) {
                const value = obj[key]
                const newPath = path ? `${path}.${key}` : key
                // 递归调用，处理对象中的每一个值
                traverseObject(value, newPath)
            }
        }

        else {
            if (typeof obj === "string" && obj.startsWith("http")) {
                const resFileName = uri.join(dirname, "res", obj.match(/([^/]+)$/)![0])
                const [ state ] = await tryCatch(fs.stat(resFileName))
                if (state && state.isFile()) return

                const req = await fetch(obj)
                if (!req.ok) {
                    errorlist.push({ id: file, url: obj })
                    return
                }
                const arrayBuffer = await req.arrayBuffer()
                await fs.writeFile(uri.join(dirname, "res", obj.match(/([^/]+)$/)![0]), Buffer.from(arrayBuffer))
            }
        }
    }
    traverseObject(data)
}

console.log(errorlist)
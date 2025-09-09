import { css, CubicBezier, cubicCurve } from "@ceale/util"

type Layer = {
    blur: AnimeData<number>
    id: 0
    name: string
    opacity: AnimeData<number>
    resources: Resource
    rotate: AnimeData<number>
    scale: AnimeData<number>
    translate: AnimeData<[number, number]>
}

type Resource = {
    id: number
    src: string
}[]

type AnimeData<T> = {
    initial?: T
    offset?: T
    offsetCurve?: [number, number, number, number]
    wrap?: "clamp"
}

type HomeBannerData = {
    pic?: string
    litpic?: string
    is_split_layer?: 0 | 1
    layers: Layer[]
}

class HomeBanner extends HTMLElement {
    css = css.join(
        css.selector(":host", css.rule({
            "display": "block",
            "position": "relative",
            "user-select": "none",
        })),
        css.selector(".banner", css.rule({
            "position": "absolute",
            "width": "100%",
            "height": "100%",
            "display": "flex",
            "align-items": "center",
            "justify-content": "center",
            "overflow": "hidden",
        })),
        css.selector(".banner img, .banner video", css.rule({
            "object-fit": "cover",
            "object-position": "center",
        })),
        css.selector(".banner .layer", css.rule({
            "position": "absolute",
            "display": "block",
            "transform-origin": "center",
        })),
        css.selector(".banner .pic", css.rule({
            "z-index": 1,
            "position": "absolute",
            "height": "100%",
        })),
        css.selector(".title", css.rule({
            "position": "absolute",
            "bottom": "8%",
            "height": "50%",
            "z-index": 2,
            "display": "flex",
            "flex-direction": "row-reverse",
            "align-items": "center",
            "justify-content": "flex-start",
        })),
        css.at("@media screen and (min-width: 1430px)",
            css.selector(".title", css.rule({
                "left": "calc(50% - 550px)"
            }))
        ),
        css.at("@media screen and (min-width: 1650px)",
            css.selector(".title", css.rule({
                "left": "calc(50% - 650px)"
            }))
        ),
        css.at("@media screen and (min-width: 1870px)",
            css.selector(".title", css.rule({
                "left": "calc(50% - 750px)"
            }))
        ),
        css.at("@media screen and (css.rule(max-width: 1430px)",
            css.selector(".title", css.rule({
                "left": "15%",
            }))
        ),
        css.selector(".title .logo", css.rule({
            "height": "85%"
        })),
        css.selector(".title .selector", css.rule({
            "positiocss.rule(n": "absolute",
            // "width": "130px",
            // "right": "100%",
            "bottom": "16px",
        })),
        css.selector(".title .button", css.rule({
            "all": "unset",
            "text-align": "center",
            "display": "block",
            "box-sizing": "border-box",
            "margin-top": "18px",
            "backdrop-filter": "blur(10px)",
            // "width": "100%",
            "font-size": "14px",
            "padding": "6px css.rule(4px",
            "padding-left": "16px",
            "background-color": "rgba(255,255,255,0.4)",
            "border-radius": "4px"
        })),
        css.selector(".title .list", css.rule({
            "position": "absolute",
            "top": "110%",
            "width": "100%",
            "display": "flex",
            "flex-direction": "column",
            "align-items": "center",
            "max-height": "160px",
            "overflow": "auto",
            "scrollbar-width": "none",
            "background": "white",
            "border-radius": "4px",
            "box-shadow": "0 0 20px css.rule(0px rgba(0,0,0,0.1)",
            "padding": "5px 8px",
            "opacity": 0,
            "visibility": "hidden",
        })),
        css.selector(".title .list span", css.rule({
            "paddi))ng": "5px 0",
            "transition": "all 300ms"
        })),
        css.selector(".title .list span:hover", css.rule({
            "color": "#00a1d6"
        }))
    )
    styleSheet = new CSSStyleSheet()
    shadowDom = this.attachShadow({ mode: "closed" })
    bannerDom = document.createElement('div')
    titleDom = document.createElement('div')

    resUrl = "data/2025-7.json"
    data = {} as HomeBannerData
    animeTravel = 0
    reseting = false
    mouseDisable = true
    layerList = [] as [(HTMLImageElement | HTMLVideoElement), Layer][]

    a = 0

    constructor() {
        super()
        this.styleSheet.replaceSync(this.css)
        this.shadowDom.adoptedStyleSheets = [this.styleSheet]
        this.shadowDom.appendChild(this.titleDom)
        this.bannerDom.className = "banner"
        this.shadowDom.appendChild(this.bannerDom)
        this.titleDom.className = "title"
        this.initLogo()
        this.update() 

        let mouseTravel = 0
        let mouseEnter = null as number | null

        this.addEventListener("mouseenter", (event) => {
            if (this.reseting || this.mouseDisable) return
            mouseEnter = event.screenX
        })

        this.addEventListener("mousemove", (event) => {
            if (this.reseting || this.mouseDisable) return
            if (mouseEnter === null) {
                mouseEnter = event.screenX
            }
            mouseTravel = event.screenX - mouseEnter
            this.animeTravel = mouseTravel / this.bannerDom.getBoundingClientRect().width
        })

        this.addEventListener("mouseleave", () => {
            mouseEnter = null
            mouseTravel = 0
            this.reseting = true
            this.resetTravel = 1
            this.resetLength = this.animeTravel
            const timer = setInterval(() => {
                if (this.animeTravel === 0) {
                    clearInterval(timer)
                    this.reseting = false
                }
            }, 50)
        })

        requestAnimationFrame(() => this.computeAnime())
    }

    async initLogo() {
        // this.logo.
        const logo = document.createElement('img')
        logo.className = "logo"
        logo.draggable = false
        this.titleDom.appendChild(logo)

        // 
        const selector = document.createElement("div")
        this.titleDom.appendChild(selector)
        selector.className = "selector"
        // 
        const button = document.createElement("button")
        selector.appendChild(button)
        button.className = "button"
        button.textContent = "加载中..."
        // 
        const list = document.createElement("div")
        selector.appendChild(list)
        list.className = "list"

        const req = await fetch(this.resUrl.replace(/(.*\/)?[^/]*$/, "$1"+"index.json"))
        if (!req.ok) return
        const res = await req.json() as {name: string, url: string}[]

        let expand = false
        
        button.textContent = res[0].name

        const styleUpdate = () => {
            if (expand === false) {
                expand = true
                button.classList.add("expand")
                list.style.visibility = "visible"
                list.animate([
                    { "opacity": 0 },
                    { "opacity": 1 }
                ], {
                    duration: 200,
                    fill: "forwards",
                    iterations: 1
                })
            } else {
                expand = false
                button.classList.remove("expand")
                list.animate([
                    { "opacity": 1 },
                    { "opacity": 0 },
                ], {
                    duration: 200   ,
                    fill: "forwards",
                    iterations: 1,
                }).onfinish = () => {
                    list.style.visibility = ""
                }
            }
        }

        list.append(...res.map(item => {
            const span = document.createElement("span")
            span.textContent = item.name
            span.addEventListener("click", () => {
                styleUpdate()
                
                button.textContent = item.name
                this.resUrl = this.resUrl.replace(/(.*\/)?[^/]*$/, "$1"+item.url)
                this.update()
            })
            return span
        }))

        button.addEventListener("click", styleUpdate)
    }

    async update() {
        const req = await fetch(this.resUrl)
        if (!req.ok) return
        const res = await req.json() as HomeBannerData
        
        const logo = this.titleDom.querySelector(".logo") as HTMLImageElement
        logo.src = res.litpic ?? "http://i0.hdslb.com/bfs/archive/c8fd97a40bf79f03e7b76cbc87236f612caef7b2.png"
        
        const oldPic = this.bannerDom.querySelector<HTMLImageElement>(".pic")
        if (oldPic) {
            oldPic.style.display = ""
        }
        this.layerList.forEach(([layerDom]) => layerDom.remove())
        this.layerList.length = 0
        // if (this.a === 1) return
        // this.a++
        if (res.pic) {
            const picEle = document.createElement('img')
            picEle.src = res.pic
            picEle.className = 'pic'
            this.bannerDom.appendChild(picEle)
            picEle.onload = () => {
                if (oldPic) {
                    oldPic.remove()
                }
            }
        }
        
        this.mouseDisable = true
        
        const loadedAll: Promise<void>[] = []

        res.layers.map(layer => {
            let ele: HTMLImageElement | HTMLVideoElement
            const res = layer.resources[0]
            if (res.src.endsWith('.png') || res.src.endsWith('.webp')) {
                const imgEle = ele = document.createElement('img')
                loadedAll.push(
                    new Promise(resolve => {
                        imgEle.onload = () => {
                            imgEle.style.height = (imgEle.naturalHeight / 155 * 100) + "%"
                            setTimeout(resolve, 300)
                        }
                    })
                )
                imgEle.src = res.src
            } else if (res.src.endsWith('.webm')) {
                const video = ele = document.createElement('video')
                loadedAll.push(
                    new Promise((resolve) => {
                        video.oncanplaythrough = () => {
                            video.style.height = (video.videoHeight / 155 * 100) + "%"
                            video.loop = true
                            video.muted = true
                            video.play()
                            setTimeout(resolve, 300)
                        }
                    })
                )
                video.src = res.src
            } else return
            ele.className = 'layer'
            ele.style.display = 'none'
            ele.draggable = false
            Reflect.set(ele, "layerName", layer.name)

            this.bannerDom.appendChild(ele)
            this.layerList.push([ele, layer] as [(HTMLImageElement | HTMLVideoElement), Layer])
        })        

        Promise.all(loadedAll).then(() => {
            for (const [ele] of this.layerList) {
                ele.style.display = ""
            }
            if (oldPic) {
                oldPic.remove()
            }
            const picEle = this.shadowDom.querySelector<HTMLImageElement>('.pic')
            if (picEle) {
                const anime = picEle.animate(
                    [
                        { opacity: 1 },
                        { opacity: 0 },
                    ],
                    {
                        duration: 500,
                        fill: "forwards",
                        iterations: 1
                    }
                )
                anime.onfinish = () => {
                    picEle.style.display = "none"
                    anime.cancel()
                    this.mouseDisable = false
                }
            }
        })
    }

    resetTravel = 0
    resetCurve = new CubicBezier([0.4, 0], [0.6, 0.8], -1)
    resetLength = 0
    computeAnime() {
        const computeAnimeTravel = (curve: [number, number, number, number] | undefined) => {
            if (curve) return this.animeTravel > 0 ?
                cubicCurve.solveYForX([[curve[0], curve[1]], [curve[2], curve[3]]], this.animeTravel) :
                -cubicCurve.solveYForX([[curve[0], curve[1]], [curve[2], curve[3]]], -this.animeTravel)
            else return this.animeTravel
        }
        for (const [ele, layer] of this.layerList) {
            ele.style.opacity = String(
                (layer.opacity.initial ?? 1) + (
                    (layer.opacity.offset ?? 0) *
                    computeAnimeTravel(layer.opacity.offsetCurve)
                )
            )
            ele.style.filter = `blur(${
                (layer.blur.initial ?? 0) + (
                    (layer.blur.offset ?? 0) *
                    computeAnimeTravel(layer.blur.offsetCurve)
                )
            }px)`
            ele.style.transform = [
                `translateX(${
                    (layer.scale.initial ?? 1) / 155 * this.bannerDom.clientHeight * (
                        (layer.translate.initial?.[0] ?? 0) + (
                            (layer.translate.offset?.[0] ?? 0) *
                            computeAnimeTravel(layer.translate.offsetCurve)
                        )
                    )
                }px)`,
                `translateY(${
                    (layer.scale.initial ?? 1) / 155 * this.bannerDom.clientHeight * (
                        (layer.translate.initial?.[1] ?? 0) + (
                            (layer.translate.offset?.[1] ?? 0) * 
                            computeAnimeTravel(layer.translate.offsetCurve)
                        )
                    )
                }px)`,
                `rotate(${
                    (layer.rotate.initial ?? 0) + (
                        (layer.rotate.offset ?? 0) *
                        computeAnimeTravel(layer.rotate.offsetCurve)
                    )
                }deg)`,
                `scale(${
                    (layer.scale.initial ?? 1) + (
                        (layer.scale.offset ?? 0) *
                        computeAnimeTravel(layer.scale.offsetCurve)
                    )
                })`
            ].join(' ')
        }
        if (this.reseting === true) {
            this.resetTravel = Math.max(this.resetTravel - 0.02, 0)
            this.animeTravel = this.resetCurve.solveYForX(this.resetTravel) * this.resetLength
        }
        requestAnimationFrame(() => this.computeAnime())
    }
}

customElements.define("home-banner", HomeBanner)
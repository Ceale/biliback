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

document.addEventListener("DOMContentLoaded", async () => {
    const req = await fetch(`https://www.bilibili.com/animated-banner/data/${window.location.search.slice(1)}.json`)
    // const req = await fetch(`https://www.bilibili.com/animated-banner/data/2022-3.json`)
    if (!req.ok) return
    const res = await req.json() as {
        pic?: string
        layers: Layer[]
    }

    const dom = document.querySelector('.root')! as HTMLDivElement
    let animaLayers: [(HTMLImageElement | HTMLVideoElement), Layer][] = []

    let picEle: HTMLImageElement
    if (res.pic) {
        const pic = res.pic
        picEle = document.createElement('img')
        picEle.src = pic
        picEle.className = 'pic'
        dom.appendChild(picEle)
    }

    const layers = res.layers

    const loadedAll: Promise<void>[] = []

    layers.map(layer => {
        let ele: HTMLImageElement | HTMLVideoElement
        const res = layer.resources[0]
        if (res.src.endsWith('.png') || res.src.endsWith('.webp')) {
            const imgEle = ele = document.createElement('img')
            // const imgObj = new Image()
            loadedAll.push(
                new Promise((resolve) => {
                    imgEle.onload = () => {
                        imgEle.style.height = `${imgEle.naturalHeight / 155 * 100}%`
                        resolve()
                    }
                })
            )
            imgEle.src = res.src
        } else if (res.src.endsWith('.webm')) {
            const video = ele = document.createElement('video')
            loadedAll.push(
                new Promise((resolve) => {
                    video.oncanplaythrough = () => {
                        video.style.height = `${video.videoHeight / 155 * 100}%`
                        video.loop = true
                        video.muted = true
                        video.play()
                        setTimeout(resolve, 300)
                    }
                })
            )
            video.src = res.src
        }
        else return
        ele.className = 'layer'
        ele.style.display = 'none'
        ele.setAttribute("name", layer.name)

        dom.appendChild(ele)
        animaLayers.push([ele, layer] as [(HTMLImageElement | HTMLVideoElement), Layer])
    })

    const cubicBezier = (curve: [number, number, number, number], t: number): number => {
        // 确保曲线参数有效
        if (!curve || curve.length !== 4) {
            throw new Error('曲线参数必须是一个包含四个数字的数组')
        }

        const [p0x, p0y, p1x, p1y] = curve

        // 三次贝塞尔曲线公式:
        // B(t) = (1-t)^3 * P0 + 3*(1-t)^2*t * P1 + 3*(1-t)*t^2 * P2 + t^3 * P3
        // 其中 P0 = (0,0), P1 = (p0x, p0y), P2 = (p1x, p1y), P3 = (1,1)

        // 对于给定的t，我们需要找到对应的x值等于t的曲线上的点
        // 由于x(t)是单调的，我们可以使用二分法来求解

        // 定义x(t)函数
        const x = (t: number): number => {
            return 3 * (1 - t) * (1 - t) * t * p0x + 3 * (1 - t) * t * t * p1x + t * t * t
        }

        // 定义y(t)函数
        const y = (t: number): number => {
            return 3 * (1 - t) * (1 - t) * t * p0y + 3 * (1 - t) * t * t * p1y + t * t * t
        }

        // 对于给定的输入t，我们需要找到曲线参数u，使得x(u) = t
        // 然后返回y(u)

        // 使用二分法求解u
        let low = 0
        let high = 1
        let u = t // 初始猜测

        // 二分法迭代
        for (let i = 0; i < 10; i++) { // 迭代10次通常足够精确
            const xVal = x(u)

            if (Math.abs(xVal - t) < 0.0001) {
                break // 足够接近
            }

            if (xVal < t) {
                low = u
            } else {
                high = u
            }

            u = (low + high) / 2
        }

        return y(u)
    }
    // window.cubicBezier = cubicBezier

    const useAnimeTravel = (curve: [number, number, number, number] | undefined) => {
        // if (String(Date.now()).endsWith("1")) {
        //     console.log(animeTravel, curve ? (animeTravel > 1 ? cubicBezier(curve, animeTravel) : -cubicBezier(curve, -animeTravel)):"")
        // }
        // // console.log(Date.now())
        if (curve) return animeTravel > 0 ? cubicBezier(curve, animeTravel) : -cubicBezier(curve, -animeTravel)
        else return animeTravel
    }
    
    const computeAnime = () => {
        for (const [ele, layer] of animaLayers) {
            ele.style.opacity = String(
                (layer.opacity.initial ?? 1) + (
                    (layer.opacity.offset ?? 0) *
                    useAnimeTravel(layer.opacity.offsetCurve)
                )
            )
            ele.style.filter = `blur(${
                (layer.blur.initial ?? 0) + (
                    (layer.blur.offset ?? 0) *
                    useAnimeTravel(layer.blur.offsetCurve)
                )
            }px)`
            ele.style.transform = [
                `translateX(${
                    (layer.scale.initial ?? 1) / 155 * dom.clientHeight * (
                        (layer.translate.initial?.[0] ?? 0) + (
                            (layer.translate.offset?.[0] ?? 0) *
                            useAnimeTravel(layer.translate.offsetCurve)
                        )
                    )
                }px)`,
                `translateY(${
                    (layer.scale.initial ?? 1) / 155 * dom.clientHeight * (
                        (layer.translate.initial?.[1] ?? 0) + (
                            (layer.translate.offset?.[1] ?? 0) * 
                            useAnimeTravel(layer.translate.offsetCurve)
                        )
                    )
                }px)`,
                `rotate(${
                    (layer.rotate.initial ?? 0) + (
                        (layer.rotate.offset ?? 0) *
                        useAnimeTravel(layer.rotate.offsetCurve)
                    )
                }deg)`,
                `scale(${
                    (layer.scale.initial ?? 1) + (
                        (layer.scale.offset ?? 0) *
                        useAnimeTravel(layer.scale.offsetCurve)
                    )
                })`
            ].join(' ')
        }
        requestAnimationFrame(computeAnime)
    }
    requestAnimationFrame(computeAnime)

    Promise.all(loadedAll).then(() => {
        return new Promise((resolve) => {
            setTimeout(resolve, 0)
        })
    }).then(() => {
        for (const ele of dom.children) {
            (ele as HTMLImageElement | HTMLVideoElement).style.display = ''
        }
        if (picEle) {
            picEle.animate(
                [
                    { opacity: 1 },
                    { opacity: 0 },
                ],
                {
                    duration: 500,
                    easing: "linear",
                    fill: "forwards",
                    iterations: 1
                }
            ).onfinish = () => {
                picEle.style.display = "none"
            }
        }
    })

    let mouseTravel = 0
    let mouseEnter = null as number | null
    let restoring = false
    let animeTravel = 0

    dom.addEventListener("mouseenter", (event) => {
        if (restoring) return
        mouseEnter = event.screenX
    })

    dom.addEventListener("mousemove", (event) => {
        if (restoring) return
        if (mouseEnter === null) {
            mouseEnter = event.screenX
        }
        mouseTravel = event.screenX - mouseEnter
        animeTravel = mouseTravel / dom.getBoundingClientRect().width
    })

    dom.addEventListener("mouseleave", () => {
        mouseEnter = null
        mouseTravel = 0
        restoring = true
        const timer = setInterval(() => {
            if (animeTravel === 0) {
                clearInterval(timer)
                restoring = false
            } else {
                animeTravel = animeTravel > 0 ? Math.max(0, animeTravel - 0.006) : Math.min(0, animeTravel + 0.006)
            }
        }, 4)
    })
})


class HomeBanner extends HTMLElement {
    shadowDom: ShadowRoot

    constructor() {
        super()
        this.shadowDom = this.attachShadow({ mode: "closed" })
        // this.shadowDom

    }
}

customElements.define("home-banner", HomeBanner)
function main() {
    document.addEventListener('contextmenu', function (e) {
        document.body.setAttribute("contextMenuX", e.clientX)
        document.body.setAttribute("contextMenuY", e.clientY)
    })

    document.onmousemove = function (e) {
        document.body.setAttribute("regularX", e.clientX)
        document.body.setAttribute("regularY", e.clientY)
    }
}

main()
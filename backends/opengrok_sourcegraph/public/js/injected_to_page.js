(() => {
    document.addEventListener("contextmenu", function (e) {
        document.body.setAttribute("contextMenuX", e.clientX);
        document.body.setAttribute("contextMenuY", e.clientY);
    });

    document.onmousemove = function (e) {
        document.body.setAttribute("regularX", e.clientX);
        document.body.setAttribute("regularY", e.clientY);
    };

    // SourceGraph specific
    document.addEventListener("graffiti_sourcegraph_getCode_req", (e) => {
        const code = document
            .querySelector(".BlobPage-module__blob .cm-content")
            ?.cmView?.rootView?.view?.state?.doc?.toString();
        document.dispatchEvent(
            new CustomEvent("graffiti_sourcegraph_getCode_res", {
                detail: code,
            }),
        );
    });
})();

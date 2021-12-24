class ZigCont extends HTMLElement {
    constructor() {
        super();

        let html = this.innerHTML;
        this.innerHTML = "";
        
        this.classList.add("zig-cont");

        this.innerHTML = `
            <svg viewbox = "0 0 500 25" class = "zig-svg">
                <path d = "
                    M 0 25
                    l 150 -25
                    l 350 25
                    l 0 25
                    l -500 0
                    Z" />
            </svg>
            <div class = "zig-inner ${this.dataset.classes || " "}">
                ${html}
            </div>
            <svg viewbox = "0 0 500 25" class = "zig-svg">
                <path d = "
                    M 500 25
                    l -150 -25
                    l -350 25
                    l 0 -25
                    l 500 0
                    Z" />
            </svg>
        `;

        //this.replaceWith(squiggle);
    }
}

export default ZigCont;
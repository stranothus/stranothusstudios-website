const CSSVariables = document.createElement("style");

CSSVariables.innerHTML = `
	:root {
		--header-brightness : ${100}%
	}`;

document.body.appendChild(CSSVariables);

window.addEventListener("scroll", () => {
	var scroll = document.body.getBoundingClientRect().top;

	CSSVariables.innerHTML = `
		:root {
			--header-brightness : ${(1 + scroll / window.innerHeight) * 50 + 50}%
		}`;
});
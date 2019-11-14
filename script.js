import { html, render } from "https://unpkg.com/lit-html?module";

let output = document.querySelector("#output");

let templ = generation => html`
	<ul data-timeto=${generation.data.to}>
	${generation.data.generationmix.map(
    source => html`
		<li class="cover ${source.fuel}">
				<h2>${source.fuel}</h2>
				<p class="num">${source.perc}<small>%</small></p>
		</li>
	`
  )}
	</ul>
	<p class="lowlight"><small>(Updated <time datetime="${generation.data.from}">${new Date(generation.data.from).toLocaleString("en-GB")}</time>)</small></p>
`;

let init = async () => {
  const response = await fetch(
    "https://api.carbonintensity.org.uk/generation", {cache: 'no-store'}
  ).catch(error => {
    document.querySelector(
      "#output"
    ).textContent = `Sorry, error fetching grid data [${error}]`;
  });
  const data = await response.json();
  render(templ(data), output);
};

init();

if ("serviceWorker" in navigator) {
  if (navigator.serviceWorker.controller) {
    console.log("Service Worker Registered");
  } else {
    navigator.serviceWorker
      .register("sw.js", {
        scope: "./"
      })
      .then(function (reg) {
        console.log('Service Worker Registered!');
      })
      .catch(function(error) {
        console.log('Registration failed with ' + error);
      });
  }
}
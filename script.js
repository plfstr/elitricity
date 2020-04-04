import { html, render } from "https://www.unpkg.com/lit-html?module";
import lifecycle from "https://www.unpkg.com/page-lifecycle?module";

let output = document.querySelector("#output");
let timevalid = 1000*60*32;

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

function renderdata() {
  if (!fetchexpired()) return;
  if (!confirm('Newest data available! Refresh data?')) return;
  fetchdata();
}

let fetchdata = async () => {
  const response = await fetch(
    "https://api.carbonintensity.org.uk/generation", {cache: 'no-store'}
  ).catch(error => {
    output.textContent = `Sorry, error fetching grid data [${error}]`;
  });
  const data = await response.json();
  render(templ(data), output);
};

function fetchexpired() {
  let timeto = document.querySelector('ul').dataset.timeto;
  let timeuntil = new Date(timeto).getTime() + timevalid;
  let timenow = new Date().getTime();
  return timenow > timeuntil;
}

if (lifecycle) {
  lifecycle.addEventListener('statechange', (event) => {
      if (event.oldState === 'hidden' && event.newState === 'passive') {
          renderdata();
      }
  });
}

fetchdata();

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